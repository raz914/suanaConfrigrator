import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class ModelManager {
  constructor(scene, camera, controls, hotspots, models, modelPath) {
    this.scene = scene; // Reference to the Three.js scene
    this.camera = camera; // Reference to the Three.js camera
    this.controls = controls; // Reference to the Three.js controls
    this.hotspots = hotspots; // Array to store hotspots
    this.models = models; // Array to store loaded models
    this.modelPath = modelPath || './public/models/Sauna Modeling Final.glb'; // Path to the model files
    this.transparentMeshes = []; // Array to store meshes that should be transparent
    
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
      this.modelPath,
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
    
    // Outer white circle
    const outerGeometry = new THREE.CircleGeometry(0.05, 32);
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const outerCircle = new THREE.Mesh(outerGeometry, outerMaterial);
    
    // Middle grey circle
    const middleGeometry = new THREE.CircleGeometry(0.045, 32);
    const middleMaterial = new THREE.MeshBasicMaterial({
      color: 0x888888,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const middleCircle = new THREE.Mesh(middleGeometry, middleMaterial);
    middleCircle.position.z = 0.001;
    
    // Inner white circle
    const innerGeometry = new THREE.CircleGeometry(0.015, 32);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: isInsideView ? 0x00ff00 : 0xffffff, // Green for inside view hotspots
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0
    });
    const innerCircle = new THREE.Mesh(innerGeometry, innerMaterial);
    innerCircle.position.z = 0.002;
    
    // Add all circles to the group
    hotspotGroup.add(outerCircle);
    hotspotGroup.add(middleCircle);
    hotspotGroup.add(innerCircle);
    
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
    hotspotGroup.scale.set(0.8, 0.8, 0.8); // Initial scale for the hotspot
    
    // Add to scene and hotspots array
    this.scene.add(hotspotGroup);
    this.hotspots.push(hotspotGroup);
    
    console.log(`Hotspot added to scene: ${title}`);
    console.log(`Total hotspots: ${this.hotspots.length}`);
    
    return hotspotGroup;
  }
  
  // Method to handle hotspot clicks and make front meshes transparent when needed
  handleHotspotClick(hotspot) {
    if (hotspot && hotspot.userData) {
      // Check if this is an inside view hotspot
      if (hotspot.userData.isInsideView) {
        // Make front meshes transparent
        console.log("Inside view hotspot clicked:", hotspot.userData.title);
        setTimeout(() => { 


          this.setFrontMeshesTransparency(true);

                  }, 4000); // Delay for 1 second before making transparent
      } else {
        // Reset transparency for other hotspots
        this.setFrontMeshesTransparency(false);
      }
      
      // Position camera to view the hotspot
      if (hotspot.userData.cameraPosition && this.camera && this.controls) {
        this.camera.position.copy(hotspot.userData.cameraPosition);
        this.controls.target.copy(hotspot.userData.lookAt);
        this.controls.update();
      }
    }
  }
  
  // Method to make front meshes transparent or opaque
  setFrontMeshesTransparency(transparent) {
    this.transparentMeshes.forEach(mesh => {
      // Simply toggle the visibility of the mesh
      mesh.visible = !transparent;
    });
  }
  
  // Method to check if ray intersects with a hotspot
  checkHotspotIntersection(raycaster) {
    // Get all objects in the scene that the raycaster intersects with
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    
    // Filter for hotspots
    for (let i = 0; i < intersects.length; i++) {
      let object = intersects[i].object;
      
      // Check if the object is a hotspot or part of a hotspot
      while (object && object !== this.scene) {
        if (object.userData && object.userData.type === 'hotspot') {
          return object;
        }
        object = object.parent;
      }
    }
    
    return null;
  }
  
  // Method to update hotspot appearance based on camera position
  updateHotspots() {
    // This method should be called in an animation loop
    if (!this.camera || !this.hotspots) return;
    
    const cameraPosition = this.camera.position.clone();
    
    this.hotspots.forEach(hotspot => {
      // Make hotspots always face the camera (billboard effect)
      hotspot.lookAt(cameraPosition);
      
      // Scale hotspots based on distance to camera for consistent visual size
      const distance = hotspot.position.distanceTo(cameraPosition);
      const scale = Math.max(0.5, Math.min(1.5, distance * 0.2));
      hotspot.scale.set(scale, scale, scale);
      
      // For inside view hotspots, ensure they're visible through front meshes
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
}