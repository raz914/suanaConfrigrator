import * as THREE from 'three';

export class InfoPanelClass {
  constructor(scene, camera, controls) {
    this.scene = scene; // Reference to the Three.js scene
    this.camera = camera; // Reference to the Three.js camera
    this.controls = controls; // Reference to the Three.js controls
    this.infoPanel = null;
    this.onCloseCallback = null;
    
    // Create the info panel
    this.createInfoPanel();
  }

  createInfoPanel() {
    // Create the info panel container
    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.top = '0';
    panel.style.right = '-400px'; // Start off-screen
    panel.style.width = '300px'; // Slightly wider panel
    panel.style.height = '100%';
    panel.style.backgroundColor = 'rgba(20, 20, 30, 0.85)'; // Dark translucent background
    panel.style.backdropFilter = 'blur(8px)'; // Blur effect for modern browsers
    panel.style.webkitBackdropFilter = 'blur(8px)'; // For Safari
    panel.style.boxShadow = '-2px 0 15px rgba(0, 0, 0, 0.3)';
    panel.style.transition = 'right 0.3s ease-in-out';
    panel.style.zIndex = '1001';
    panel.style.overflow = 'auto';
    panel.style.padding = '25px';
    panel.style.boxSizing = 'border-box';
    panel.style.fontFamily = 'Arial, Helvetica, sans-serif';
    panel.style.color = 'white'; // White text for better contrast
    
    // Create the close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '15px';
    closeButton.style.right = '15px';
    closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '50%';
    closeButton.style.width = '36px';
    closeButton.style.height = '36px';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.style.display = 'flex';
    closeButton.style.alignItems = 'center';
    closeButton.style.justifyContent = 'center';
    closeButton.style.color = 'white';
    closeButton.style.transition = 'background-color 0.2s';
    
    // Add hover effect
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    });
    
    // Add click event to close button
    closeButton.addEventListener('click', () => {
      this.hideInfoPanel();
    });
    
    // Add title element
    const title = document.createElement('h2');
    title.id = 'info-panel-title';
    title.style.marginTop = '5px';
    title.style.marginBottom = '25px';
    title.style.fontSize = '28px';
    title.style.fontWeight = '600';
    title.style.color = 'white';
    title.style.letterSpacing = '0.5px';
    
    // Add decorative line under title
    const divider = document.createElement('div');
    divider.style.width = '50px';
    divider.style.height = '3px';
    divider.style.backgroundColor = '#4d9fff'; // Accent color
    divider.style.marginBottom = '25px';
    
    // Add content container
    const content = document.createElement('div');
    content.id = 'info-panel-content';
    content.style.fontSize = '17px';
    content.style.lineHeight = '1.6';
    content.style.color = 'rgba(255, 255, 255, 0.9)'; // Slightly transparent white
    content.style.fontWeight = '400';
    content.style.letterSpacing = '0.3px';
    
    // Add elements to panel
    panel.appendChild(closeButton);
    panel.appendChild(title);
    panel.appendChild(divider);
    panel.appendChild(content);
    
    // Add panel to document
    document.body.appendChild(panel);
    
    this.infoPanel = panel;
  }
  
  showInfoPanel(title, description) {
    if (!this.infoPanel) return;
    
    // Update content
    document.getElementById('info-panel-title').textContent = title;
    
    // Create formatted description with enhanced text
    const contentElement = document.getElementById('info-panel-content');
    contentElement.innerHTML = ''; // Clear existing content
    
    // Split description into paragraphs if it contains line breaks
    const paragraphs = description.split('\n');
    
    paragraphs.forEach(paragraph => {
      if (paragraph.trim() !== '') {
        const p = document.createElement('p');
        p.textContent = paragraph;
        p.style.marginBottom = '12px';
        contentElement.appendChild(p);
      }
    });
    
    // Show panel
    this.infoPanel.style.right = '0';
  }
  
  hideInfoPanel() {
    if (!this.infoPanel) return;
    
    // Hide panel
    this.infoPanel.style.right = '-400px';
    
    // Execute callback if provided
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }
  }
  
  // Set a callback function to be executed when the info panel is closed
  setOnCloseCallback(callback) {
    this.onCloseCallback = callback;
  }
}