import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SuanaConfig {
  constructor(scene, camera, renderer, modelPath = './public/models/Untitled.glb') {
    this.scene = scene || this.createScene();
    this.camera = camera || this.createCamera();
    this.renderer = renderer || this.createRenderer();
    this.modelPath = modelPath;
    this.model = null;
    this.controls = null;
    this.hotspots = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.currentHotspot = null;
    this.infoPanel = null;
    this.cameraPositionBeforeHotspot = null;
    this.targetPositionBeforeHotspot = null;
    this.animating = false;

    console.log("SuanaConfig initialized with model path:", this.modelPath);
    
    // Setup the scene
    this.setupScene();
    
    // Add orbit controls
    this.setupControls();
    
    // Call handleResize to set up the event listener
    this.handleResize();
    this.setupKeyboardControls();
    
    // Set up mouse events for hotspots
    this.setupMouseEvents();
    
    // Create the info panel
    this.createInfoPanel();
    
    // Load the 3D model
    this.loadModel();
    
    // Create a simple test hotspot
    // this.createTestHotspot();
    
    // Start the animation loop
    this.animate();
  }

  createTestHotspot() {
    // Add a simple test hotspot at a visible position
    const hotspotPosition = new THREE.Vector3(0, 0.5, 0);
    const testHotspot = this.createHotspot(
      hotspotPosition,
      'test_hotspot',
      'Test Hotspot',
      'This is a test hotspot to verify functionality.'
    );
    console.log("Test hotspot created:", testHotspot);
  }

  setupKeyboardControls() {
    // Add event listener for keydown events
    window.addEventListener('keydown', (event) => {
      // Check if the pressed key is 'c' (either lowercase or uppercase)
      if (event.key === 'c' || event.key === 'C') {
        // Get the current camera position
        const position = this.camera.position.clone();
        
        // Format the position to have only 2 decimal places
        const x = position.x.toFixed(2);
        const y = position.y.toFixed(2);
        const z = position.z.toFixed(2);
        
        // Log the camera position to the console
        console.log(`Camera Position: x: ${x}, y: ${y}, z: ${z}`, " zoom", this.camera.zoom);  
        
        // Optionally, create a visual notification on screen
        this.showCameraPositionOverlay(x, y, z);
      }
    });
  }
  
  showCameraPositionOverlay(x, y, z) {
    // Create or update an overlay div to show camera position
    let overlay = document.getElementById('camera-position-overlay');
    
    if (!overlay) {
      // Create the overlay if it doesn't exist
      overlay = document.createElement('div');
      overlay.id = 'camera-position-overlay';
      overlay.style.position = 'fixed';
      overlay.style.bottom = '20px';
      overlay.style.right = '20px';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      overlay.style.color = 'white';
      overlay.style.padding = '10px';
      overlay.style.borderRadius = '5px';
      overlay.style.fontFamily = 'monospace';
      overlay.style.zIndex = '1000';
      overlay.style.transition = 'opacity 1s';
      document.body.appendChild(overlay);
    }
    
    // Update the content and show the overlay
    overlay.textContent = `Camera: (${x}, ${y}, ${z})`;
    overlay.style.opacity = '1';
    
    // Hide the overlay after 3 seconds
    setTimeout(() => {
      overlay.style.opacity = '0';
    }, 3000);
  }

  createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);
    return scene;
  }
  
  createCamera() {
    const camera = new THREE.PerspectiveCamera(
      50, // Wider field of view
      window.innerWidth / window.innerHeight, 
      0.01, // Smaller near clipping plane
      2000
    );
    camera.position.set(1, 1, 1); // Start closer to the origin
    return camera;
  }
  
  createRenderer() {
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    // Handle different versions of Three.js
    if (THREE.ColorManagement) {
      // For Three.js r152+
      THREE.ColorManagement.enabled = true;
    } else if (THREE.sRGBEncoding !== undefined) {
      // For older Three.js versions
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    
    // Add the renderer to the DOM
    document.body.appendChild(renderer.domElement);
    return renderer;
  }
  
  setupScene() {
    // Add lights - crucial for seeing the model
    // Use more intense lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);
    
    // Add multiple lights from different directions
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(0, 10, 0);
    this.scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight2.position.set(10, 5, 5);
    this.scene.add(directionalLight2);
    
    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight3.position.set(-5, 5, -5);
    this.scene.add(directionalLight3);
    
    // Add point lights for more dynamic lighting
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(0, 5, 5);
    this.scene.add(pointLight);
  }

  createHotspot(position, meshName, title, description) {
    console.log("Creating hotspot at position:", position);
    
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
      color: 0xffffff,
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
    
    // Add metadata to the hotspot group
    hotspotGroup.userData = {
      type: 'hotspot',
      meshName: meshName,
      title: title,
      description: description,
      cameraPosition: new THREE.Vector3(position.x + 0.5, position.y, position.z + 0.5),
      lookAt: position.clone()
    };
    hotspotGroup.scale.set(0.8, 0.8, 0.8); // Initial scale for the hotspot
    // Add to scene and hotspots array
    this.scene.add(hotspotGroup);
    this.hotspots.push(hotspotGroup);
    
    console.log("Hotspot added to scene:", hotspotGroup);
    console.log("Total hotspots:", this.hotspots.length);
    
    return hotspotGroup;
  }
  
  setupMouseEvents() {
    // Add mouse move listener for hovering over hotspots
    window.addEventListener('mousemove', (event) => {
      // Calculate normalized mouse coordinates
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
    
    // Add click listener for selecting hotspots
    window.addEventListener('click', (event) => {
      // Update raycaster with current mouse position and camera
      this.raycaster.setFromCamera(this.mouse, this.camera);
      
      // Check for intersections with hotspots
      const intersects = this.raycaster.intersectObjects(this.hotspots, true);


      
      if (intersects.length > 0) {
        // Find the parent hotspot group
        let hotspotGroup = intersects[0].object;
        while (hotspotGroup.parent && !this.hotspots.includes(hotspotGroup)) {
          hotspotGroup = hotspotGroup.parent;
        }
        this.handleHotspotClick(hotspotGroup);
      }
    });
  }
  
  handleHotspotClick(hotspot) {
    if (this.animating) return;
    
    console.log("Handling hotspot click for:", hotspot);
    this.currentHotspot = hotspot;
    
    // Store current camera position and controls target
    this.cameraPositionBeforeHotspot = this.camera.position.clone();
    this.targetPositionBeforeHotspot = this.controls.target.clone();
    
    // Disable controls during animation
    this.controls.enabled = false;
    this.animating = true;
    
    // Get target camera position from hotspot
    const targetPosition = hotspot.userData.cameraPosition;
    const lookAtPosition = hotspot.userData.lookAt;
    
    console.log("Moving camera to:", targetPosition, "looking at:", lookAtPosition);
    
    // Animate camera to new position
    this.animateCamera(
      this.camera.position.clone(),
      targetPosition,
      this.controls.target.clone(),
      lookAtPosition,
      1.0, // Animation duration in seconds
      () => {
        // Animation complete
        this.controls.target.copy(lookAtPosition);
        this.controls.enabled = true;
        this.animating = false;
        
        // Show info panel
        this.showInfoPanel(hotspot.userData.title, hotspot.userData.description);
      }
    );
  }
  
  animateCamera(startPos, endPos, startTarget, endTarget, duration, callback) {
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;
    
    const animate = () => {
      const now = Date.now();
      if (now >= endTime) {
        // Animation complete
        this.camera.position.copy(endPos);
        this.controls.target.copy(endTarget);
        if (callback) callback();
        return;
      }
      
      // Calculate progress (0 to 1)
      const progress = (now - startTime) / (endTime - startTime);
      
      // Use easing function for smoother animation
      const easedProgress = this.easeInOutCubic(progress);
      
      // Interpolate camera position
      this.camera.position.lerpVectors(startPos, endPos, easedProgress);
      
      // Interpolate target position
      const currentTarget = new THREE.Vector3();
      currentTarget.lerpVectors(startTarget, endTarget, easedProgress);
      this.controls.target.copy(currentTarget);
      
      // Continue animation
      requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
  }
  
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  createInfoPanel() {
    // Create the info panel container
    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.top = '0';
    panel.style.right = '-400px'; // Start off-screen
    panel.style.width = '400px';
    panel.style.height = '100%';
    panel.style.backgroundColor = 'white';
    panel.style.boxShadow = '-2px 0 10px rgba(0, 0, 0, 0.2)';
    panel.style.transition = 'right 0.3s ease-in-out';
    panel.style.zIndex = '1001';
    panel.style.overflow = 'auto';
    panel.style.padding = '20px';
    panel.style.boxSizing = 'border-box';
    panel.style.fontFamily = 'Arial, sans-serif';
    
    // Create the close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.padding = '0';
    closeButton.style.lineHeight = '1';
    closeButton.style.width = '30px';
    closeButton.style.height = '30px';
    
    // Add click event to close button
    closeButton.addEventListener('click', () => {
      this.hideInfoPanel();
    });
    
    // Add title and content placeholders
    const title = document.createElement('h2');
    title.id = 'info-panel-title';
    title.style.marginTop = '0';
    title.style.marginBottom = '20px';
    title.style.fontSize = '24px';
    title.style.color = '#333';
    
    const content = document.createElement('div');
    content.id = 'info-panel-content';
    content.style.fontSize = '16px';
    content.style.lineHeight = '1.5';
    content.style.color = '#666';
    
    // Add elements to panel
    panel.appendChild(closeButton);
    panel.appendChild(title);
    panel.appendChild(content);
    
    // Add panel to document
    document.body.appendChild(panel);
    
    this.infoPanel = panel;
  }
  
  showInfoPanel(title, description) {
    if (!this.infoPanel) return;
    
    // Update content
    document.getElementById('info-panel-title').textContent = title;
    document.getElementById('info-panel-content').textContent = description;
    
    // Show panel
    this.infoPanel.style.right = '0';
  }
  
  hideInfoPanel() {
    if (!this.infoPanel || !this.currentHotspot) return;
    
    // Hide panel
    this.infoPanel.style.right = '-400px';
    
    // Animate camera back to original position
    if (this.cameraPositionBeforeHotspot && this.targetPositionBeforeHotspot) {
      this.controls.enabled = false;
      this.animating = true;
      
      this.animateCamera(
        this.camera.position.clone(),
        this.cameraPositionBeforeHotspot,
        this.controls.target.clone(),
        this.targetPositionBeforeHotspot,
        1.0,
        () => {
          this.controls.enabled = true;
          this.animating = false;
          this.currentHotspot = null;
        }
      );
    }
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
        
        // Find specific meshes for hotspots
        let innerStructureMesh = null;
        let doorFrameMesh = null;
        
        // Log all objects in the scene and ensure materials
        this.model.traverse((child) => {
          console.log('Scene contains:', child.type, child.name);
          
          // Enable shadows
          child.castShadow = true;
          child.receiveShadow = true;
          
          // Find meshes of interest
          if (child.name === 'inner_structure' || child.name.includes('inner')) {
            console.log("Found inner structure mesh:", child.name);
            innerStructureMesh = child;
          } else if (child.name === 'door_frame' || child.name.includes('door')) {
            console.log("Found door frame mesh:", child.name);
            doorFrameMesh = child;
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
        // Add fixed hotspots based on the model's structure
        this.addModelHotspots();
        
        // Position camera to view the whole model
        // Set a fixed camera position first, not based on model size
        this.camera.position.set(1.52, 0.53, 0.54);
        
        // Rotate model to face up
        this.model.rotation.y = Math.PI / 1;
        
        console.log('Model added to scene');
      },
      onProgress,
      onError
    );
  }
  
  addModelHotspots() {
    // Add fixed hotspots at specific positions relative to model
    // Front top
    this.createHotspot(


      new THREE.Vector3(0.05, 0, -0.1),
      'top_area',
      'Deepest Detox',
      'Experience the deepest detox with our advanced sauna technology.'
    );
    
    // Middle area
    this.createHotspot(
      new THREE.Vector3(0.3, 0.4, 0.2),
      'side_area',
      'Infrared Heating',
      'Full-spectrum infrared heating technology for maximum therapeutic benefits.'
    );
    
    // Bottom area
    this.createHotspot(
      new THREE.Vector3(0.32, -0.2, -0.3),
      'bottom_area',
      'Easy Assembly',
      'Quick and easy assembly with no tools required.'
    );


    this.createHotspot(
      new THREE.Vector3(0.1, 0.25, -0.36),
      'bottom_area2',
      'Chromotherapy Included',
      'Built-in chromotherapy lighting provides additional therapeutic benefits by harnessing colors from the suns visible light spectrum.'
    );

    this.createHotspot(
      new THREE.Vector3(-0.2, 0.34, -0.1),
      'bottom_area3',
      'Premium Sound System',
      'Enjoy your favorite music with our premium sound system.'
    );
  }
  
  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 50;
    this.controls.maxPolarAngle = Math.PI;
  }
  
  handleResize() {
    window.addEventListener('resize', () => {
      // Update camera
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      
      // Update renderer
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
  
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Update controls
    if (this.controls) {
      this.controls.update();
    }
    
    // Make hotspots face the camera
    this.updateHotspots();
    
    // Check for hotspot hover
    this.checkHotspotHover();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
  
  updateHotspots() {
    // Make all hotspots face the camera
    this.hotspots.forEach(hotspot => {
      hotspot.lookAt(this.camera.position);
      
      // Add a pulsing effect to hotspots
      const time = Date.now() * 0.001;
      const pulse = Math.sin(time * 2) * 0.1 + 1;
      hotspot.scale.set(pulse, pulse, pulse);
    });
  }
  
  checkHotspotHover() {
    // Return if we're viewing a hotspot detail
    if (this.currentHotspot) return;
    
    // Update raycaster with current mouse position and camera
    this.raycaster.setFromCamera(this.mouse, this.camera);
    
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
  }
}

// Usage example - use this to create a new instance
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
const config = new SuanaConfig();