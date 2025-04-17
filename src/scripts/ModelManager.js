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
        this.camera.position.set(1.52, 0.53, -4.54);
        
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
      'top_area',
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
      'side_area',
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
      'bottom_area',
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
      'bottom_area2',
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
      new THREE.Vector3(0, 0, 0.65),
      'bottom_area3',
      'Vent Grates',
      'Smart Ventilation – Circulates fresh air for optimal comfort.',
      // Camera position for speaker view
      new THREE.Vector3(0.04, 0.44, 3.17),
      // Look at the speaker system
      new THREE.Vector3(0, 0.0, 0),
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
    
    // Create black outline circle (slightly larger than the white circle)
    const outlineGeometry = new THREE.CircleGeometry(0.065, 32);
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    const outlineCircle = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outlineCircle.position.z = -0.001; // Slightly behind the white circle
    
    // Create white circle (main hotspot)
    const circleGeometry = new THREE.CircleGeometry(0.06, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    
    // Add both circles to the group (outline first, then white circle)
    hotspotGroup.add(outlineCircle);
    hotspotGroup.add(circle);
    
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
      isInsideView: isInsideView // Flag to identify inside view hotspots
    };
    
    // Set initial scale
    hotspotGroup.scale.set(1, 1, 1);
    
    // Add to scene and hotspots array
    this.scene.add(hotspotGroup);
    this.hotspots.push(hotspotGroup);
    
    console.log(`Hotspot added to scene: ${title}`);
    console.log(`Total hotspots: ${this.hotspots.length}`);
    
    return hotspotGroup;
  }
  
  // Method to handle hotspot clicks
  handleHotspotClick(hotspot, cameraAnimator, infoPanel) {
    if (this.animating) return;
    
    console.log("Handling hotspot click for:", hotspot);
    this.currentHotspot = hotspot;
    
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

  // Add a method to show all hotspots
  showAllHotspots() {
    this.hotspots.forEach(hotspot => {
      hotspot.visible = true;
    });
  }
  
  // Method to make front meshes transparent or opaque
  setFrontMeshesTransparency(transparent) {
    this.transparentMeshes.forEach(mesh => {
      // Simply toggle the visibility of the mesh
      mesh.visible = !transparent;
    });
  }
  // Method to update hotspots appearance and check for hover
  updateHotspots(mouse) {
    // Make all hotspots face the camera
    this.hotspots.forEach(hotspot => {
      hotspot.lookAt(this.camera.position);
      
      // Add a pulsing effect to hotspots
      const time = Date.now() * 0.001;
      const pulse = Math.sin(time * 2) * 0.1 + 1;
      hotspot.scale.set(pulse, pulse, pulse);
      
      if (hotspot.userData && hotspot.userData.isInsideView) {
        // Ensure the hotspot renders on top of other objects
        hotspot.renderOrder = 999;
        hotspot.children.forEach(child => {
          if (child.material) {
            child.material.depthTest = false;
            child.renderOrder = 1000;
          }
        });
      }
    });
  }
  
  checkHotspotHover(mouse) {
    // Return if we're viewing a hotspot detail
    if (this.currentHotspot) return;
    
    // Update raycaster with current mouse position and camera
    this.raycaster.setFromCamera(mouse, this.camera);
    
    // Check for intersections with hotspots
    const intersects = this.raycaster.intersectObjects(this.hotspots, true); // true to check descendants
    
    // Update cursor and scale based on hover state
    if (intersects.length > 0) {
      document.body.style.cursor = 'pointer';
      // Find the parent hotspot group
      let hotspotGroup = intersects[0].object;
      while (hotspotGroup.parent && !this.hotspots.includes(hotspotGroup)) {
        hotspotGroup = hotspotGroup.parent;
      }
      
      // Highlight the entire hotspot group
      hotspotGroup.scale.set(0.8, 0.8, 0.8);
    } else {
      document.body.style.cursor = 'auto';
      // Reset scale of all hotspots
      this.hotspots.forEach(hotspot => {
        if (hotspot !== this.currentHotspot) {
          // Just maintain the pulse scale
          const time = Date.now() * 0.001;
          const pulse = Math.sin(time * 2) * 0.1 + 1;
          hotspot.scale.set(pulse, pulse, pulse);
        }
      });
    }
    
    return intersects.length > 0 ? intersects : null;
  }
  
  // Method to check if a click hits a hotspot
  checkHotspotClick(mouse) {
    this.raycaster.setFromCamera(mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.hotspots, true);
    
    if (intersects.length > 0) {
      // Find the parent hotspot group
      let hotspotGroup = intersects[0].object;
      while (hotspotGroup.parent && !this.hotspots.includes(hotspotGroup)) {
        hotspotGroup = hotspotGroup.parent;
      }
      return hotspotGroup;
    }
    
    return null;
  }
}