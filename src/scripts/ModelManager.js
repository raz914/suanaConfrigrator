import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class ModelManager {
  constructor(scene, camera, controls, hotspots, modelPath = './public/models/Sauna Modeling Final.glb') {
    this.scene = scene; // Reference to the Three.js scene
    this.camera = camera; // Reference to the Three.js camera
    this.controls = controls; // Reference to the Three.js controls
    this.hotspots = hotspots || []; // Array to store hotspots
    this.modelPath = modelPath; // Path to the model files
    this.transparentMeshes = []; // Array to store meshes that should be transparent
    this.model = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.currentHotspot = null;
    this.hoveredHotspot = null; // Track currently hovered hotspot
    this.hotspotCircles = []; // Array to store hotspot circle meshes for precise hover detection
    this.modelCenter = new THREE.Vector3(0, 0, 0); // Will be updated once model is loaded
    this.lastCameraPosition = new THREE.Vector3(); // Track camera position for view-based visibility
    
    // Initialize the GLTF loader  
    this.loadModel(); // Load the model when the class is instantiated
  }

  loadModel() {
    console.log("Attempting to load model from:", this.modelPath);
    const loader = new GLTFLoader();
    
    // Add a progress callback
    const onProgress = (xhr) => {
      if (xhr.lengthComputable) {
        const percentComplete = (xhr.loaded / xhr.total) * 100;
        console.log(`Loading model: ${percentComplete.toFixed(2)}% complete`);
      } else {
        console.log(`Loading model: ${xhr.loaded} bytes loaded`);
      }
    };
    
    // Add an error callback
    const onError = (error) => {
      console.error('Error loading model:', error);
    };
    
    loader.load(
      './public/models/Sauna Modeling Final.glb',
      (gltf) => {
        console.log('GLTF data loaded:', gltf);
        this.model = gltf.scene;
        
        // Log model details for debugging
        console.log('Model loaded:', this.model);
        
        // Keep track of the front meshes we need to make transparent
        const frontMeshNames = [
          // From images 1-4
          'Sauna_Front_Window_Frame_Outside',
          'Sauna_Front_Glass_Window',
          'Sauna_Front_Window_Frame_Inside',
          'Sauna_Front_Glass_Door',
          'Sauna_Front_Door_Handle_Inner',
          'Sauna_Front_Door_Handle_Outer',
          'Sauna_Front_Door_Frame_01',
          'Sauna_Front_Door_Frame_02',
          'Sauna_Front_Window_Frame_Inside001',
          'Hinge_01-3',
          'Hinge_01-3001',
          'Magnet_01',
          'Magnet_02',
          'Sphere'
        ];
        
        // Traverse all objects in the model
        this.model.traverse((child) => {
          console.log('Scene contains:', child.type, child.name, child.animations);
          
          // Enable shadows
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Check if this mesh is in our list of front meshes
            if (frontMeshNames.some(name => child.name.includes(name))) {
              console.log("Found front mesh:", child.name);
              // Store reference to make transparent when needed
              this.transparentMeshes.push(child);
            }
          }
        });
        
        // Center the model
        const box = new THREE.Box3().setFromObject(this.model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Store model center for view-based visibility calculation
        this.modelCenter.copy(center);
        
        // Log bounding box for debugging
        console.log('Model size:', size);
        console.log('Model center:', center);
        
        // Position model at center
        this.model.position.x = -center.x;
        this.model.position.y = -center.y;
        this.model.position.z = -center.z;
        
        // Scale if needed
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 10) {
          const scale = 5 / maxDim;
          this.model.scale.set(scale, scale, scale);
          console.log('Model scaled down to:', scale);
        } else if (maxDim < 0.5) {
          const scale = 2 / maxDim;
          this.model.scale.set(scale, scale, scale);
          console.log('Model scaled up to:', scale);
        }
        
        // Add the model to the scene
        this.scene.add(this.model);
        
        // Add hotspots after model is loaded and positioned
        this.addModelHotspots();
        
        // Position camera to view the whole model
        this.camera.position.set(1.52, 0.53, -3.4);
        this.lastCameraPosition.copy(this.camera.position);
        
        // Rotate model to face up
        this.model.rotation.y = Math.PI / 1;
        
        console.log('Model added to scene');
      },
      onProgress,
      onError
    );
  }

  addModelHotspots() {
    // Deepest Detox - Front view (Outside view)
    this.createHotspot(
      new THREE.Vector3(-0.4, 0, -0.65),
      'front_area',
      'Glass Door',
      '8mm Tinted Tempered Glass – Privacy meets strength.',
      // Camera position for front view (closer to the front)
      new THREE.Vector3(0.07, 0.29, -3.18),
      // Look at the hotspot from the front
      new THREE.Vector3(0.0, 0, 0),
      false // Not an inside view
    );
    
    // Infrared Heating - Side view
    this.createHotspot(
      new THREE.Vector3(0, 1, -0.7),
      'top_area',
      'Around Door Frame',
      '42mm Thick Nordic Spruce – Built to last, crafted to impress.',
      // Camera position for side angle view
      new THREE.Vector3(1.42, 0.48, -2.82),
      // Look at the heating element
      new THREE.Vector3(0, 0, 0),
      false // Not an inside view
    );
    
    // Easy Assembly - Bottom view from angle
    this.createHotspot(
      new THREE.Vector3(-0.7, 0.2, 0),
      'right_area',
      'Side Panel ',
      'Canadian Cedar & Nordic Spruce – Sustainably sourced, naturally stunning',
      // Camera position for bottom view
      new THREE.Vector3(-3.02, 0.31, -0.04),
      // Look at the assembly area
      new THREE.Vector3(0, 0, 0),
      false // Not an inside view
    );
  
    // Chromotherapy - Interior top view
    this.createHotspot(
      new THREE.Vector3(0.73, 0.2, -0.4),
      'left_area',
      'Stainless Steel Bands',
      'Marine-Grade Stainless Steel – Rust-proof, weather-ready.',
      // Camera position for interior view showing lights
      new THREE.Vector3(2.53, 0.40, -0.54),
      // Look at the light system
      new THREE.Vector3(-0.18, 0.00, -0.56),
      false // Not an inside view
    );
  
    // Sound System - Side interior view
    this.createHotspot(
      new THREE.Vector3(-0.5, 0, 0.65),
      'back_area',
      'Vent Grates',
      'Smart Ventilation – Circulates fresh air for optimal comfort.',
      // Camera position for speaker view
      new THREE.Vector3(0.04, 0.44, 3.17),
      // Look at the speaker system
      new THREE.Vector3(0, 0.0, 0),
      false // Not an inside view
    );

    this.createHotspot(
      new THREE.Vector3(-0.16, 0.85, 0.65),
      'back_area',
      'Rear Vent',
      'Ensures proper airflow for a safe, comfy session',
      // Camera position for speaker view
      new THREE.Vector3(-0.78, 1.01, 1.74),
      // Look at the speaker system
      new THREE.Vector3(0.33, 0.00, -0.72),
      false // Not an inside view
    );

    // Inside view hotspot - visible through front meshes
    this.createHotspot(
      new THREE.Vector3(0, 0.1, 0.1),
      'inside_area',
      'Upper Bench Backrest',
      'Ergonomic Backrest – Relax deeper, sit longer.',
      // Camera position for speaker view
      new THREE.Vector3(-0.01, 0.59, -1.44), // Positioned inside the sauna
      // Look at the speaker system
      new THREE.Vector3(0, 0.0, 0),
      true // This is an inside view
    );
    
    this.createHotspot(
      new THREE.Vector3(0.3, 0.6, 0.4),
      'inside_area',
      'Light Strip',
      'Dimmable Ambience – Warm, cozy glow with a remote.',
      // Camera position for speaker view
      new THREE.Vector3(-0.31, 0.86, -0.90), // Positioned inside the sauna
      // Look at the speaker system
      new THREE.Vector3(0.24, -0.00, 0.71),
      true // This is an inside view
    );
    
    this.createHotspot(
      new THREE.Vector3(-0.3, 0.63, 0.4),
      'inside_area',
      'Wall Box (Heater Control)',
      'Harvia Xenio Control – Sleek digital controls at your fingertips.',
      // Camera position for speaker view
      new THREE.Vector3(0.40, 0.73, -0.92), // Positioned inside the sauna
      // Look at the speaker system
      new THREE.Vector3(-0.45, 0.00, 1.14),
      true // This is an inside view
    );
  }
  
  createHotspot(position, meshName, title, description, cameraPosition = null, lookAt = null, isInsideView = false) {
    console.log(`Creating hotspot at position: ${position.x}, ${position.y}, ${position.z}`);
    
    // Create a group to hold the hotspot elements
    const hotspotGroup = new THREE.Group();
    hotspotGroup.position.copy(position);
    hotspotGroup.renderOrder = 100; // Base render order for hotspot groups
    
    // Create black outline circle (slightly larger than the white circle)
    const outlineGeometry = new THREE.CircleGeometry(0.065, 32);
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      depthTest: false
    });
    const outlineCircle = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outlineCircle.position.z = -0.001; // Slightly behind the white circle
    outlineCircle.renderOrder = 101; // Ensure outline renders above model
    
    // Create white circle (main hotspot)
    const circleGeometry = new THREE.CircleGeometry(0.06, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      depthTest: false
    });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.renderOrder = 102; // Ensure circle renders above outline
    
    // Store reference to the circle for hover detection
    circle.userData.isHotspotCircle = true;
    circle.userData.parentHotspot = hotspotGroup;
    this.hotspotCircles.push(circle);
    
    // Add both circles to the group (outline first, then white circle)
    hotspotGroup.add(outlineCircle);
    hotspotGroup.add(circle);
    
    // Create label container for the title (initially invisible)
    const labelWidth = 0.70;  // Width of the label
    
    // Create pill-shaped label container with white background and black outline
    const labelGroup = new THREE.Group();
    labelGroup.position.x = 0.25; // Position label to the right of the hotspot
    labelGroup.position.z = 0.002; // Slightly in front
    labelGroup.visible = false; // Hidden by default
    labelGroup.renderOrder = 200; // Ensure label group renders above all hotspots
    
    // Create white background (pill shape using rounded rectangle)
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    
    // Draw rounded rectangle with white fill and black outline
    const rectWidth = 240;
    const rectHeight = 48;
    const cornerRadius = 24; // Half of height for pill shape
    
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw white background with black outline
    context.beginPath();
    context.moveTo(canvas.width/2 - rectWidth/2 + cornerRadius, canvas.height/2 - rectHeight/2);
    context.lineTo(canvas.width/2 + rectWidth/2 - cornerRadius, canvas.height/2 - rectHeight/2);
    context.arc(canvas.width/2 + rectWidth/2 - cornerRadius, canvas.height/2, cornerRadius, -Math.PI/2, Math.PI/2);
    context.lineTo(canvas.width/2 - rectWidth/2 + cornerRadius, canvas.height/2 + rectHeight/2);
    context.arc(canvas.width/2 - rectWidth/2 + cornerRadius, canvas.height/2, cornerRadius, Math.PI/2, -Math.PI/2);
    context.closePath();
    
    // Fill with white
    context.fillStyle = 'white';
    context.fill();
    
    // Add black outline
    context.strokeStyle = 'black';
    context.lineWidth = 3;
    context.stroke();
    
    // Create background texture
    const backgroundTexture = new THREE.CanvasTexture(canvas);
    backgroundTexture.needsUpdate = true;
    
    // Apply texture to a plane
    const backgroundGeometry = new THREE.PlaneGeometry(labelWidth, labelWidth * (64/256));
    const backgroundMaterial = new THREE.MeshBasicMaterial({
      map: backgroundTexture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
    backgroundMesh.renderOrder = 201; // Ensure background renders above everything
    
    // Create another canvas for text
    const textCanvas = document.createElement('canvas');
    const textContext = textCanvas.getContext('2d');
    textCanvas.width = 340;
    textCanvas.height = 90;
    
    // Add text
    textContext.font = 'bold 26px Arial, sans-serif';
    textContext.fillStyle = 'black';
    textContext.textAlign = 'center';
    textContext.textBaseline = 'middle';
    textContext.fillText(title, textCanvas.width / 2, textCanvas.height / 2);
    
    // Create texture from canvas
    const textTexture = new THREE.CanvasTexture(textCanvas);
    textTexture.needsUpdate = true;
    
    // Apply texture to a plane
    const textGeometry = new THREE.PlaneGeometry(labelWidth - 0.02, (labelWidth - 0.02) * (64/256));
    const textMaterial = new THREE.MeshBasicMaterial({
      map: textTexture,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.z = 0.001; // Slightly in front
    textMesh.renderOrder = 202; // Ensure text renders on top of everything
    
    // Add background and text to label group
    labelGroup.add(backgroundMesh);
    labelGroup.add(textMesh);
    
    // Add label group to hotspot group
    hotspotGroup.add(labelGroup);
    
    // Add metadata to the hotspot group with custom camera position if provided
    hotspotGroup.userData = {
      type: 'hotspot',
      meshName: meshName,
      title: title,
      description: description,
      // Use custom camera position if provided, otherwise use default
      cameraPosition: cameraPosition || new THREE.Vector3(position.x + 0.5, position.y, position.z + 0.5),
      // Use custom lookAt if provided, otherwise use the hotspot position
      lookAt: lookAt || position.clone(),
      isInsideView: isInsideView, // Flag to identify inside view hotspots
      labelMesh: labelGroup, // Reference to the label for animations
      areaType: meshName, // Store the area type for view-based visibility
      // Store materials for opacity changes
      materials: {
        outline: outlineMaterial,
        circle: circleMaterial
      }
    };
    
    // Set fixed scale (no pulsing) - slightly larger size
    hotspotGroup.scale.set(1.1, 1.1, 1.1);
    
    // Add to scene and hotspots array
    this.scene.add(hotspotGroup);
    this.hotspots.push(hotspotGroup);
    
    console.log(`Hotspot added to scene: ${title}`);
    console.log(`Total hotspots: ${this.hotspots.length}`);
    
    return hotspotGroup;
  }
  
  // Method to determine which side of the model the camera is currently viewing
  determineViewingSide() {
    // Get direction vector from model center to camera
    const directionToCamera = new THREE.Vector3().subVectors(this.camera.position, new THREE.Vector3(0, 0, 0));
    
    // Normalize the direction vector
    directionToCamera.normalize();
    
    // Calculate dot products to determine which side is facing the camera
    const dotFront = directionToCamera.dot(new THREE.Vector3(0, 0, -1));
    const dotBack = directionToCamera.dot(new THREE.Vector3(0, 0, 1));
    const dotLeft = directionToCamera.dot(new THREE.Vector3(1, 0, 0));
    const dotRight = directionToCamera.dot(new THREE.Vector3(-1, 0, 0));
    
    // Get the largest dot product
    const maxDot = Math.max(dotFront, dotBack, dotLeft, dotRight);
    
    // Determine the side based on the largest dot product
    let side;
    if (maxDot === dotFront) {
      side = 'front';
    } else if (maxDot === dotBack) {
      side = 'back';
    } else if (maxDot === dotLeft) {
      side = 'left';
    } else {
      side = 'right';
    }
    
    return side;
  }
  
  // Update hotspot visibility based on the current viewing side
  updateHotspotVisibilityBySide() {
    // Get the current viewing side
    const side = this.determineViewingSide();
    
    // Set visibility for each hotspot based on its area type and the current viewing side
    this.hotspots.forEach(hotspot => {
      const areaType = hotspot.userData.areaType;
      const isInsideView = hotspot.userData.isInsideView;
      let opacity = 1.0;
      
      if (side === 'front') {
        // When viewing from front, show front, top, and inside hotspots
        if (areaType !== 'front_area' && areaType !== 'top_area' && areaType !== 'inside_area') {
          opacity = 0.3; // Make other hotspots semi-transparent
        }
      } else if (side === 'back') {
        // When viewing from back, show back, top, and side hotspots
        if (areaType !== 'back_area') {
          opacity = 0.3;
        }
      } else if (side === 'left') {
        // When viewing from left, show left, top, back hotspots
        if (areaType !== 'left_area' ) {
          opacity = 0.3;
        }
      } else if (side === 'right') {
        // When viewing from right, show right, top, back hotspots
        if (areaType !== 'right_area') {
          opacity = 0.3;
        }
      }
      
      // Inside view hotspots are always visible
      
      if (isInsideView) {
        // Only show inside hotspots when viewing from the front
        if (side !== 'front') {
          opacity = 0.3;
        }
      }
      // Update the opacity of the hotspot's materials
      hotspot.children.forEach(child => {
        if (child.material) {
          // Set opacity based on the material type
          if (child.material.color.equals(new THREE.Color(0x000000))) {
            // Black outline (lower base opacity)
            child.material.opacity = opacity * 0.8;
          } else if (child.material.color.equals(new THREE.Color(0xffffff))) {
            // White circle
            child.material.opacity = opacity * 0.9;
          } else {
            // Other materials
            child.material.opacity = opacity;
          }
        }
      });
    });
  }
  
  // Method to handle hotspot clicks
  handleHotspotClick(hotspot, cameraAnimator, infoPanel) {
    if (this.animating) return;
    
    console.log("Handling hotspot click for:", hotspot);
    this.currentHotspot = hotspot;
    if (hotspot.userData && hotspot.userData.labelMesh) {
      hotspot.userData.labelMesh.visible = false;
    }
    // Store current camera position and controls target
    this.cameraPositionBeforeHotspot = this.camera.position.clone();
    this.targetPositionBeforeHotspot = this.controls.target.clone();
    
    if (hotspot.userData.isInsideView) {
      // Make front meshes transparent
      setTimeout(() => { 
        this.setFrontMeshesTransparency(true);
      }, 700); 
    } else {
      // Reset transparency for other hotspots
      this.setFrontMeshesTransparency(false);
    }
    
    // Disable controls during animation
    this.controls.enabled = false;
    this.animating = true;
    
    // Hide all other hotspots
    this.hideHotspots(hotspot);
    
    // Get target camera position from hotspot
    const targetPosition = hotspot.userData.cameraPosition;
    const lookAtPosition = hotspot.userData.lookAt;
    
    console.log("Moving camera to:", targetPosition, "looking at:", lookAtPosition);
    
    // Animate camera to new position using the CameraAnimateClass
    cameraAnimator.animateCamera(
      this.camera.position.clone(),
      targetPosition,
      this.controls.target.clone(),
      lookAtPosition,
      1.0, // Animation duration in seconds
      () => {
        // Animation complete
        this.controls.target.copy(lookAtPosition);
        this.controls.enabled = false; // Keep controls disabled while info panel is open
        this.animating = false;
        if (hotspot.visible && hotspot.userData.labelMesh) {
          hotspot.userData.labelMesh.visible = false;
        }
        // Show info panel
        infoPanel.showInfoPanel(hotspot.userData.title, hotspot.userData.description);
      }
    );
  }
  
  returnToOriginalView(cameraAnimator, callback) {
    if (!this.cameraPositionBeforeHotspot || !this.targetPositionBeforeHotspot) return;
    
    this.setFrontMeshesTransparency(false);
    this.controls.enabled = false;
    this.animating = true;
    
    cameraAnimator.animateCamera(
      this.camera.position.clone(),
      this.cameraPositionBeforeHotspot,
      this.controls.target.clone(),
      this.targetPositionBeforeHotspot,
      1.0,
      () => {
        // Re-enable controls and show all hotspots
        this.controls.enabled = true;
        this.animating = false;
        this.currentHotspot = null;
        
        // Show all hotspots again
        this.showAllHotspots();
        
        // Update hotspot visibility based on viewing side
        this.updateHotspotVisibilityBySide();
        
        if (callback) callback();
      }
    );
  }
  
  hideHotspots(exceptHotspot = null) {
    this.hotspots.forEach(hotspot => {
      if (hotspot !== exceptHotspot) {
        // Make the hotspot invisible
        hotspot.visible = false;
      }
    });
  }

  // Method to show all hotspots
  showAllHotspots() {
    this.hotspots.forEach(hotspot => {
      hotspot.visible = true;
      
      // Make sure labels are hidden
      if (hotspot.userData && hotspot.userData.labelMesh) {
        const labelGroup = hotspot.userData.labelMesh;
        labelGroup.visible = false;
      }
    });
    
    // Reset hovered hotspot
    this.hoveredHotspot = null;
  }
  
  // Method to make front meshes transparent or opaque
  setFrontMeshesTransparency(transparent) {
    this.transparentMeshes.forEach(mesh => {
      // Simply toggle the visibility of the mesh
      mesh.visible = !transparent;
    });
  }
  
  // Update hotspots
  updateHotspots(mouse) {
    // Make all hotspots face the camera
    this.hotspots.forEach(hotspot => {
      hotspot.lookAt(this.camera.position);
    });
    
    // Check if camera has moved significantly to update hotspot visibility
    if (this.camera.position.distanceTo(this.lastCameraPosition) > 0.1) {
      this.updateHotspotVisibilityBySide();
      this.lastCameraPosition.copy(this.camera.position);
    }
  }
  
  checkHotspotHover(mouse) {
    // Return if we're viewing a hotspot detail
    if (this.currentHotspot) return;
    
    // Update raycaster with current mouse position and camera
    this.raycaster.setFromCamera(mouse, this.camera);
    
    // Check for intersections with hotspot circles only
    const intersects = this.raycaster.intersectObjects(this.hotspotCircles, false);
    
    // Update cursor and scale based on hover state
    if (intersects.length > 0) {
      document.body.style.cursor = 'pointer';
      
      // Get the parent hotspot group from the intersected circle
      const hotspotGroup = intersects[0].object.userData.parentHotspot;
      
      // Update hovered hotspot and show its label
      if (this.hoveredHotspot !== hotspotGroup) {
        // Hide previous hotspot label if any
        if (this.hoveredHotspot && this.hoveredHotspot.userData.labelMesh) {
          this.hoveredHotspot.userData.labelMesh.visible = false;
        }
        
        // Set new hovered hotspot and show its label
        this.hoveredHotspot = hotspotGroup;
        if (hotspotGroup.userData.labelMesh) {
          hotspotGroup.userData.labelMesh.visible = true;
        }
      }
    } else {
      document.body.style.cursor = 'auto';
      
      // Hide label of previously hovered hotspot if any
      if (this.hoveredHotspot && this.hoveredHotspot.userData.labelMesh) {
        this.hoveredHotspot.userData.labelMesh.visible = false;
      }
      
      // Reset hovered hotspot
      this.hoveredHotspot = null;
    }
    
    return intersects.length > 0 ? intersects : null;
  }
  
  // Method to check if a click hits a hotspot
  checkHotspotClick(mouse) {
    this.raycaster.setFromCamera(mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.hotspotCircles, false);
    
    if (intersects.length > 0) {
      // Get the parent hotspot group from the intersected circle
      return intersects[0].object.userData.parentHotspot;
    }
    
    return null;
  }
}