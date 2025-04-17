import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ModelManager } from './src/scripts/ModelManager.js';
import { CameraAnimateClass } from './src/scripts/CameraAnimateClass.js';
import { InfoPanelClass } from './src/scripts/InfoPanelClass.js';

export class SuanaConfig {
  constructor(scene, camera, renderer, modelPath = './public/models/Untitled.glb') {
    // Create core components or use provided ones
    this.scene = scene || this.createScene();
    this.camera = camera || this.createCamera();
    this.renderer = renderer || this.createRenderer();
    this.modelPath = modelPath;
    this.hotspots = [];
    this.mouse = new THREE.Vector2();
    this.animating = false;
    
    console.log("SuanaConfig initialized with model path:", this.modelPath);
    
    // Setup the scene
    this.setupScene();
    
    // Add orbit controls
    this.setupControls();
    
    // Handle window resize
    this.handleResize();
    
    // Initialize the manager classes
    this.initializeManagers();
    
    // Set up mouse events
    this.setupMouseEvents();
    
    // Start the animation loop
    this.animate();
  }

  initializeManagers() {
    // Initialize the camera animation class
    this.cameraAnimator = new CameraAnimateClass(
      this.scene,
      this.camera,
      this.renderer,
      this.controls
    );
    
    // Initialize the info panel class
    this.infoPanel = new InfoPanelClass(
      this.scene,
      this.camera,
      this.controls
    );
    
    // Set callback for when info panel is closed
    this.infoPanel.setOnCloseCallback(() => {
      // Return to original camera view
      this.modelManager.returnToOriginalView(this.cameraAnimator);
    });
    
    // Initialize the model manager class
    this.modelManager = new ModelManager(
      this.scene,
      this.camera,
      this.controls,
      this.hotspots,
      this.modelPath
    );
    
    // Make classes available to the scene for debugging
    this.scene.modelManager = this.modelManager;
    this.scene.cameraAnimator = this.cameraAnimator;
    this.scene.infoPanel = this.infoPanel;
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
  
  setupMouseEvents() {
    // Add mouse move listener for hovering over hotspots
    window.addEventListener('mousemove', (event) => {
      // Calculate normalized mouse coordinates
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });
    
    // Add click listener for selecting hotspots
    window.addEventListener('click', (event) => {
      // Check if we're currently animating
      if (this.cameraAnimator.isAnimating()) return;
      
      // Check for hotspot intersections
      const hotspot = this.modelManager.checkHotspotClick(this.mouse);
      
      if (hotspot) {
        this.modelManager.handleHotspotClick(hotspot, this.cameraAnimator, this.infoPanel);
      }
    });
  }
  
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Update controls
    if (this.controls) {
      this.controls.update();
    }
    
    // Update hotspots
    if (this.modelManager) {
      this.modelManager.updateHotspots(this.mouse);
      
      // Check for hotspot hover
      this.modelManager.checkHotspotHover(this.mouse);
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Usage example - create a new instance
const config = new SuanaConfig();