import * as THREE from 'three';
  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  
  export class infoPanelClass {
    constructor(scene, camera, controls) {
      
        this.scene = scene; // Reference to the Three.js scene
        this.camera = camera; // Reference to the Three.js camera
        this.controls = controls; // Reference to the Three.js controls
        
      
      
        // Array to store loaded models
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
              // Re-enable controls and show all hotspots
              this.controls.enabled = true;
              this.animating = false;
              this.currentHotspot = null;
              
              // Show all hotspots again
              this.showAllHotspots();
            }
          );
        }}
}