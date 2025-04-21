import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ModelManager } from './src/scripts/ModelManager.js';
import { CameraAnimateClass } from './src/scripts/CameraAnimateClass.js';
import { InfoPanelClass } from './src/scripts/InfoPanelClass.js';

export class SuanaConfig {
  constructor(scene, camera, renderer, modelPath = './public/models/model2.glb') {
    // Create core components or use provided ones
    this.scene = scene || this.createScene();
    this.camera = camera || this.createCamera();
    this.renderer = renderer || this.createRenderer();
    this.modelPath = modelPath;
    this.hotspots = [];
    this.mouse = new THREE.Vector2();
    this.animating = false;
    this.clock = new THREE.Clock();
    this.loaderOverlay = null;
    this.loaderPercentage = null;
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
    
    // Ensure loader is visible during model loading
    this.ensureLoaderIsVisible();
  }
  
  ensureLoaderIsVisible() {
    // Get loader elements
    this.loaderOverlay = document.getElementById('loader-overlay');
    this.loaderPercentage = document.getElementById('loader-percentage');
    
    // Make sure loader is visible
    if (this.loaderOverlay) {
      this.loaderOverlay.style.display = 'flex';
      this.loaderOverlay.style.opacity = '1';
    }
    
    // Listen for model loading progress events
    window.addEventListener('modelLoadProgress', (event) => {
      const { progress } = event.detail;
      this.updateLoaderProgress(progress);
    });
  }
  
  updateLoaderProgress(progress) {
    // Update loader percentage text
    if (this.loaderPercentage) {
      this.loaderPercentage.textContent = `${Math.round(progress)}%`;
    }
    
    // Also update the loader text
    const loaderText = document.querySelector('.loader-text');
    if (loaderText) {
      loaderText.textContent = `Loading Sauna Model... ${Math.round(progress)}%`;
    }
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
      // Check if we're in inside view
      if (this.modelManager.isInsideView) {
        // If we're inside the sauna, return to the inside camera position
        this.modelManager.returnFromInfoPanelInsideView(this.cameraAnimator);
      } else {
        // If we're outside, return to original view
        this.modelManager.returnToOriginalView(this.cameraAnimator);
      }
    });
    
    // Create a loading manager for better tracking
    const loadingManager = new THREE.LoadingManager();
    
    // Setup the loading manager callbacks
    loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const percentComplete = (itemsLoaded / itemsTotal) * 100;
      console.log(`Loading progress: ${percentComplete.toFixed(0)}%`);
      
      // Dispatch progress event
      const event = new CustomEvent('modelLoadProgress', { 
        detail: { progress: percentComplete } 
      });
      window.dispatchEvent(event);
    };
    
    loadingManager.onError = (url) => {
      console.error('Error loading resource:', url);
    };
    
    // Initialize the model manager class with loading manager
    this.modelManager = new ModelManager(
      this.scene,
      this.camera,
      this.controls,
      this.hotspots,
      this.modelPath,
      loadingManager
    );
    
    // Make classes available to the scene for debugging
    this.scene.modelManager = this.modelManager;
    this.scene.cameraAnimator = this.cameraAnimator;
    this.scene.infoPanel = this.infoPanel;
  }

  createScene() {
    const scene = new THREE.Scene();
    
    // Create a gradient background using a custom shader
    const gradientTexture = this.createGradientTexture();
    scene.background = gradientTexture;
    
    return scene;
  }
  
  createGradientTexture() {
    // Create a canvas for the gradient
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    
    const context = canvas.getContext('2d');
    
    // Create gradient
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    
    // Add color stops - warm to dark gradient that complements wooden sauna
    gradient.addColorStop(0.1, '#7c5834');    // Dark brown at top
    gradient.addColorStop(0.4, '#c59d7e');    // Warm mid-brown
    gradient.addColorStop(0.7, '#c9b371');    // Lighter warm tan
    gradient.addColorStop(1, '#7c5834');      // Dark brown at bottom
    
    // Fill with gradient
    context.fillStyle = gradient;
    context.fillRect(0, 0, 2, 512);
    
    // Create texture
    const texture = new THREE.CanvasTexture(
      canvas,
      THREE.UVMapping,
      THREE.ClampToEdgeWrapping,
      THREE.ClampToEdgeWrapping,
      THREE.LinearFilter,
      THREE.LinearFilter
    );
    
    // Only need to repeat horizontally
    texture.repeat.set(1, 1);
    
    return texture;
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
      alpha: true,
      powerPreference: 'high-performance' // Request high-performance GPU
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    
    // Handle different versions of Three.js
    if (THREE.ColorManagement) {
      // For Three.js r152+
      THREE.ColorManagement.enabled = true;
    } else if (THREE.sRGBEncoding !== undefined) {
      // For older Three.js versions
      renderer.outputEncoding = THREE.sRGBEncoding;
    }
    
    // Optimize renderer
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Default PCFShadowMap
    
    // Add the renderer to the DOM
    document.body.appendChild(renderer.domElement);
    return renderer;
  }
  
  setupScene() {
    // Add lights with optimized settings
    // Use more intense lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);
    
    // Add multiple lights from different directions
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(0, 10, 0);
    // Optimize shadows
    directionalLight1.castShadow = true;
    directionalLight1.shadow.mapSize.width = 1024;
    directionalLight1.shadow.mapSize.height = 1024;
    directionalLight1.shadow.camera.near = 0.5;
    directionalLight1.shadow.camera.far = 100;
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
    this.controls.maxDistance = 8; // Maximum zoom distance
    this.controls.zoom = false;
    // Restrict vertical rotation
    // This prevents the camera from going below the model
    this.controls.minPolarAngle = Math.PI * 0.05; // Slightly above the horizon (prevents looking up from below)
    this.controls.maxPolarAngle = Math.PI * 0.45;
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
    
    // Add touch support for mobile
    window.addEventListener('touchstart', (event) => {
      if (event.touches.length === 1) {
        // Prevent default to avoid scrolling
        event.preventDefault();
        
        // Convert touch to mouse coordinates
        this.mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
        
        // Check if we're currently animating
        if (this.cameraAnimator.isAnimating()) return;
        
        // Check for hotspot intersections
        const hotspot = this.modelManager.checkHotspotClick(this.mouse);
        
        if (hotspot) {
          this.modelManager.handleHotspotClick(hotspot, this.cameraAnimator, this.infoPanel);
        }
      }
    }, { passive: false });
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
    
    // Update animations
    if(this.modelManager.mixer) {
      const delta = this.clock.getDelta();
      this.modelManager.update(delta);
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const config = new SuanaConfig();
});