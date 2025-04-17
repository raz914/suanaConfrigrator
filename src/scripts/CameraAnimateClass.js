import * as THREE from 'three';

export class CameraAnimateClass {
  constructor(scene, camera, renderer, controls) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.controls = controls;
    this.animating = false;
    
    // Optional: Add camera position tester
    this.setupCameraPositionTester();
  }
  
  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  animateCamera(startPos, endPos, startTarget, endTarget, duration, callback) {
    this.animating = true;
    const startTime = Date.now();
    const endTime = startTime + duration * 1000;
    
    const animate = () => {
      const now = Date.now();
      if (now >= endTime) {
        // Animation complete
        this.camera.position.copy(endPos);
        this.controls.target.copy(endTarget);
        this.animating = false;
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
  
  isAnimating() {
    return this.animating;
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
  }}