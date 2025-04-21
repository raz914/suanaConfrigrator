import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class InteriorViewManager {
  constructor(scene, camera, renderer, originalControls) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.originalControls = originalControls; // Store the original controls
    this.interiorControls = null;
    this.isActive = false;
    this.pivotPoint = new THREE.Vector3(0, 0.6, 0); // Default pivot point (can be adjusted)
    this.minDistance = 0.1; // Minimum distance from pivot point
    this.maxDistance = 0.4;  // Maximum distance from pivot point
    
    // Create dedicated controls for interior view
    this.setupInteriorControls();
  }
  
  setupInteriorControls() {
    // Create new orbit controls optimized for interior viewing
    this.interiorControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.interiorControls.enableDamping = true;
    this.interiorControls.dampingFactor = 0.4;
    this.interiorControls.screenSpacePanning = false;
    
    // Restrict movement to rotation only (no panning)
    this.interiorControls.enablePan = false;
    
    // Limit zoom to prevent clipping or going outside the model
    this.interiorControls.minDistance = this.minDistance;
    this.interiorControls.maxDistance = this.maxDistance;
    
//     // // Restrict vertical rotation to prevent flipping
    this.interiorControls.minPolarAngle = 0.05; // Almost directly up (ceiling)
  this.interiorControls.maxPolarAngle = Math.PI * 0.45; // Slightly below horizon
    
    // Set target to pivot point
    this.interiorControls.target.copy(this.pivotPoint);
    
    // Disable these controls initially
    this.interiorControls.enabled = false;
  }
  
  /**
   * Activate interior 360 view mode
   * @param {THREE.Vector3} position - Optional camera position to use
   * @param {THREE.Vector3} pivotPoint - Optional pivot point to rotate around
   */
  activate(position = null, pivotPoint = null) {
    if (this.isActive) return;
    
    console.log("Activating interior 360° view mode");
    this.scene.modelManager.resetDoorAnimation()
    this.scene.modelManager.setFrontMeshesTransparency(false) // Set the model to interior view
    // Store current camera position/rotation if needed for later
    this.originalCameraPosition = this.camera.position.clone();
    this.originalCameraRotation = this.camera.rotation.clone();
    
    // Update pivot point if provided
    if (pivotPoint) {
      this.pivotPoint = pivotPoint;
      this.interiorControls.target.copy(this.pivotPoint);
    }
    
    // Set camera position if provided
    if (position) {
      this.camera.position.copy(position);
    }
    if (this.interiorViewManager) {
        this.interiorViewManager.update();
      }
    
    // Disable original controls
    this.originalControls.enabled = false;
    
    // Enable interior controls
    this.interiorControls.enabled = true;
    
    // Update flag
    this.isActive = true;
    
    // Create visual indicator for 360° view mode
    this.createViewModeIndicator();
  }
  
  /**
   * Deactivate interior 360 view mode
   */
  deactivate() {
    if (!this.isActive) return;
    
    console.log("Deactivating interior 360° view mode");
    
    // Disable interior controls
    this.interiorControls.enabled = false;
    
    // Enable original controls (don't do this if you want the calling code to handle it)
    // this.originalControls.enabled = true;
    
    // Update flag
    this.isActive = false;
    
    // Remove the indicator
    this.removeViewModeIndicator();
  }
  
  /**
   * Update method to be called in animation loop
   */
  update() {
    if (this.isActive && this.interiorControls) {
      this.interiorControls.update();
    }
  }
  
  /**
   * Sets a new pivot point for rotation
   * @param {THREE.Vector3} pivotPoint - The new pivot point
   */
  setPivotPoint(pivotPoint) {
    this.pivotPoint = pivotPoint;
    if (this.interiorControls) {
      this.interiorControls.target.copy(this.pivotPoint);
    }
  }
  
  /**
   * Create a visual indicator showing 360° mode is active
   */
  createViewModeIndicator() {
    // Remove existing indicator if present
    this.removeViewModeIndicator();
    
    // Create a new indicator
    const indicator = document.createElement('div');
    indicator.id = 'interior-view-indicator';
    indicator.style.position = 'fixed';
    indicator.style.bottom = '20px';
    indicator.style.left = '50%';
    indicator.style.transform = 'translateX(-50%)';
    indicator.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    indicator.style.color = 'white';
    indicator.style.padding = '8px 16px';
    indicator.style.borderRadius = '20px';
    indicator.style.fontFamily = 'Arial, sans-serif';
    indicator.style.fontSize = '14px';
    indicator.style.zIndex = '1000';
    indicator.style.display = 'flex';
    indicator.style.alignItems = 'center';
    indicator.style.justifyContent = 'center';
    indicator.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    
    // Add an icon for 360
    const iconSpan = document.createElement('span');
    iconSpan.textContent = '🔄';
    iconSpan.style.marginRight = '8px';
    iconSpan.style.fontSize = '16px';
    
    // Add text
    const textSpan = document.createElement('span');
    textSpan.textContent = '360° View Mode - Drag to Look Around';
    
    // Assemble the indicator
    indicator.appendChild(iconSpan);
    indicator.appendChild(textSpan);
    
    // Add to the document
    document.body.appendChild(indicator);
    
    // Store reference
    this.viewModeIndicator = indicator;
    
    // Fade in animation
    indicator.style.opacity = '0';
    indicator.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
      indicator.style.opacity = '1';
    }, 10);
  }
  
  /**
   * Remove the visual indicator
   */
  removeViewModeIndicator() {
    if (this.viewModeIndicator) {
      // Fade out and remove
      this.viewModeIndicator.style.opacity = '0';
      setTimeout(() => {
        if (this.viewModeIndicator && this.viewModeIndicator.parentNode) {
          this.viewModeIndicator.parentNode.removeChild(this.viewModeIndicator);
        }
        this.viewModeIndicator = null;
      }, 500);
    }
  }
  
  /**
   * Check if we're in interior view mode
   * @returns {boolean} - True if interior view is active
   */
  isInteriorViewActive() {
    return this.isActive;
  }
}