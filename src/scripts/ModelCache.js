// Add this class to a new file called ModelCache.js in your src/scripts directory

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

export class ModelCache {
  constructor() {
    this.cache = {}; // Cache object to store loaded models
    this.loadingManager = new THREE.LoadingManager();
    this.setupLoadingManager();
  }
  
  setupLoadingManager() {
    // Set up loading manager callbacks
    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const percentComplete = (itemsLoaded / itemsTotal) * 100;
      console.log(`Loading progress: ${percentComplete.toFixed(0)}%`);
      
      // Dispatch a custom event that can be listened to
      const event = new CustomEvent('modelLoadProgress', { 
        detail: { 
          url, 
          itemsLoaded, 
          itemsTotal, 
          progress: percentComplete 
        } 
      });
      window.dispatchEvent(event);
    };
    
    this.loadingManager.onError = (url) => {
      console.error('Error loading resource:', url);
      // Dispatch error event
      const event = new CustomEvent('modelLoadError', { detail: { url } });
      window.dispatchEvent(event);
    };
  }
  
  /**
   * Preload a model and store it in cache
   * @param {string} path - Path to the model file
   * @returns {Promise} - Promise that resolves when the model is loaded
   */
  preload(path) {
    // Check if already in cache
    if (this.cache[path]) {
      return Promise.resolve(this.cache[path]);
    }
    
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader(this.loadingManager);
      
      // Set up loading callbacks
      loader.load(
        path,
        (gltf) => {
          console.log(`Model preloaded: ${path}`);
          // Store in cache
          this.cache[path] = gltf;
          resolve(gltf);
        },
        (xhr) => {
          if (xhr.lengthComputable) {
            const percentComplete = (xhr.loaded / xhr.total) * 100;
            // Dispatch progress event for this specific model
            const event = new CustomEvent('modelProgress', { 
              detail: { 
                path, 
                loaded: xhr.loaded, 
                total: xhr.total, 
                progress: percentComplete 
              } 
            });
            window.dispatchEvent(event);
          }
        },
        (error) => {
          console.error('Error preloading model:', error);
          reject(error);
        }
      );
    });
  }
  
  /**
   * Get a model from cache or load it if not cached
   * @param {string} path - Path to the model file
   * @returns {Promise} - Promise that resolves with the model
   */
  get(path) {
    // If model is in cache, return it
    if (this.cache[path]) {
      return Promise.resolve(this.cache[path]);
    }
    
    // Otherwise load and cache it
    return this.preload(path);
  }
  
  /**
   * Clear a specific model from cache or all models if no path provided
   * @param {string} path - Optional path to clear specific model
   */
  clear(path) {
    if (path) {
      // Clear specific model
      if (this.cache[path]) {
        delete this.cache[path];
      }
    } else {
      // Clear all cache
      this.cache = {};
    }
  }
}

// Create a singleton instance
export const modelCache = new ModelCache();

// Helper function to preload multiple models
export function preloadModels(paths) {
  return Promise.all(paths.map(path => modelCache.preload(path)));
}