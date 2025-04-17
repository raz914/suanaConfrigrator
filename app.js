import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ModelManager } from './src/scripts/ModelManager.js';
// import { HotspotManager } from './src/scripts/HotspotManager.js';
import { CameraAnimateClass } from './src/scripts/CameraAnimateClass.js';
import { infoPanelClass } from './src/scripts/InfoPanelClass.js';

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
    this.setupCameraPositionTester();
    
    console.log("SuanaConfig initialized with model path:", this.modelPath);
    
    // Setup the scene
    this.setupScene();
    
    // Add orbit controls
    this.setupControls();
    
    // Call handleResize to set up the event listener
    this.handleResize();
    // this.setupKeyboardControls();
    
    // Set up mouse events for hotspots
    this.setupMouseEvents();
    
    // Create the info panel
    this.createInfoPanel();
    
    // Load the 3D model
    
    // Create a simple test hotspot
    // this.createTestHotspot();
    this.modelManager = new ModelManager(this.scene, this.camera, this.controls,this.hotspots,modelPath = './public/models/Untitled.glb');
    this.cameraAnimateClass = new CameraAnimateClass(this.scene, this.camera, this.renderer,this.controls);
    
    // this.modelManager.loadModel();
    
    // Start the animation loop
    this.animate();
  }

  setupCameraPositionTester() {
    // Create a simple UI for testing camera positions
    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.top = '10px';
    panel.style.left = '10px';
    panel.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    panel.style.color = 'white';
    panel.style.padding = '10px';
    panel.style.borderRadius = '5px';
    panel.style.fontFamily = 'monospace';
    panel.style.zIndex = '1000';
    panel.style.display = 'none'; // Hidden by default
    panel.id = 'camera-test-panel';
    
    // Toggle button for the panel
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Camera Tester';
    toggleButton.style.position = 'fixed';
    toggleButton.style.top = '10px';
    toggleButton.style.left = '10px';
    toggleButton.style.zIndex = '1001';
    toggleButton.style.padding = '5px 10px';
    
    toggleButton.addEventListener('click', () => {
      if (panel.style.display === 'none') {
        panel.style.display = 'block';
        // Update position display when panel is shown
        this.updateCameraPositionDisplay();
      } else {
        panel.style.display = 'none';
      }
    });
    
    // Create position display
    const positionDisplay = document.createElement('div');
    positionDisplay.id = 'position-display';
    panel.appendChild(positionDisplay);
    
    // Create target display
    const targetDisplay = document.createElement('div');
    targetDisplay.id = 'target-display';
    panel.appendChild(targetDisplay);
    
    // Create buttons for saving positions
    const copyButton = document.createElement('button');
    copyButton.textContent = 'Copy Position & Target';
    copyButton.style.display = 'block';
    copyButton.style.margin = '10px 0';
    copyButton.style.padding = '5px';
    
    copyButton.addEventListener('click', () => {
      const cameraPos = this.camera.position;
      const targetPos = this.controls.target;
      
      // Format positions as Three.js code
      const positionCode = `new THREE.Vector3(${cameraPos.x.toFixed(2)}, ${cameraPos.y.toFixed(2)}, ${cameraPos.z.toFixed(2)})`;
      const targetCode = `new THREE.Vector3(${targetPos.x.toFixed(2)}, ${targetPos.y.toFixed(2)}, ${targetPos.z.toFixed(2)})`;
      
      // Copy to clipboard
      const textToCopy = `// Camera position:\n${positionCode},\n// Look at target:\n${targetCode}`;
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          alert('Camera position and target copied to clipboard!');
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
          // Fallback
          const textArea = document.createElement('textarea');
          textArea.value = textToCopy;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('Camera position and target copied to clipboard!');
        });
    });
    
    panel.appendChild(copyButton);
    document.body.appendChild(panel);
    document.body.appendChild(toggleButton);
    
    // Set up interval to update position display
    setInterval(() => {
      if (panel.style.display !== 'none') {
        this.updateCameraPositionDisplay();
      }
    }, 100);
  }
  
  updateCameraPositionDisplay() {
    const positionDisplay = document.getElementById('position-display');
    const targetDisplay = document.getElementById('target-display');
    
    if (!positionDisplay || !targetDisplay) return;
    
    const cameraPos = this.camera.position;
    const targetPos = this.controls.target;
    
    positionDisplay.textContent = `Camera: (${cameraPos.x.toFixed(2)}, ${cameraPos.y.toFixed(2)}, ${cameraPos.z.toFixed(2)})`;
    targetDisplay.textContent = `Target: (${targetPos.x.toFixed(2)}, ${targetPos.y.toFixed(2)}, ${targetPos.z.toFixed(2)})`;
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
  
// Update the handleHotspotClick method to hide other hotspots
handleHotspotClick(hotspot) {
  if (this.animating) return;
  
  console.log("Handling hotspot click for:", hotspot);
  this.currentHotspot = hotspot;
  
  // Store current camera position and controls target
  this.cameraPositionBeforeHotspot = this.camera.position.clone();
  this.targetPositionBeforeHotspot = this.controls.target.clone();
  if (hotspot.userData.isInsideView) {
    // Make front meshes transparent
    setTimeout(() => { 


      // this.setFrontMeshesTransparency(true);
      this.modelManager.setFrontMeshesTransparency(true);

              }, 700); 
  } else {
    // Reset transparency for other hotspots
    this.modelManager.setFrontMeshesTransparency(false);
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
      this.controls.enabled = false; // Keep controls disabled while info panel is open
      this.animating = false;
      
      // Show info panel
      this.showInfoPanel(hotspot.userData.title, hotspot.userData.description);
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
    panel.style.width = '250px';
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
    this.modelManager.setFrontMeshesTransparency(false);
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
          // Re-enable controls and show all hotspots
          this.controls.enabled = true;
          this.animating = false;
          this.currentHotspot = null;
          
          // Show all hotspots again
          this.showAllHotspots();
        }
      );
    }}

  
  addModelHotspots() {
    // Deepest Detox - Front view
    this.createHotspot(
      new THREE.Vector3(0.05, 0, -0.1),
      'top_area',
      'Deepest Detox',
      'Experience the deepest detox with our advanced sauna technology.',
      // Camera position for front view (closer to the front)
      new THREE.Vector3(0.94, 0.14, 0.32),
      // Look at the hotspot from the front
      new THREE.Vector3(0.0, 0, 0)
    );
    
    // Infrared Heating - Side view
    this.createHotspot(
      new THREE.Vector3(0.3, 0.4, 0.2),
      'side_area',
      'Infrared Heating',
      'Full-spectrum infrared heating technology for maximum therapeutic benefits.',
      // Camera position for side angle view
      new THREE.Vector3(0.8, 0.5, 0.4),
      // Look at the heating element
      new THREE.Vector3(0.3, 0.4, 0.2)
    );
    
    // Easy Assembly - Bottom view from angle
    this.createHotspot(
      new THREE.Vector3(0.32, -0.2, -0.3),
      'bottom_area',
      'Easy Assembly',
      'Quick and easy assembly with no tools required.',
      // Camera position for bottom view
      new THREE.Vector3(1.35, -0.24, -0.68),
      // Look at the assembly area
      new THREE.Vector3(0, 0, 0)
    );
  
    // Chromotherapy - Interior top view
    this.createHotspot(
      new THREE.Vector3(0.1, 0.25, -0.36),
      'bottom_area2',
      'Chromotherapy Included',
      'Built-in chromotherapy lighting provides additional therapeutic benefits by harnessing colors from the suns visible light spectrum.',
      // Camera position for interior view showing lights
      new THREE.Vector3(0.91, 0.42, -0.85),
      // Look at the light system
      new THREE.Vector3(0.00, 0, 0)
    );
  
    // Sound System - Side interior view
    this.createHotspot(
      new THREE.Vector3(-0.2, 0.34, -0.1),
      'bottom_area3',
      'Premium Sound System',
      'Enjoy your favorite music with our premium sound system.',
      // Camera position for speaker view
      new THREE.Vector3(1.11, 0.40, 0.42),
      // Look at the speaker system
      new THREE.Vector3(0, 0.0, 0)
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