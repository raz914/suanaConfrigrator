// Updated WorkerModelLoader.js to work with simplified worker
// The worker now just downloads the file, and we parse it on the main thread

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class WorkerModelLoader {
  constructor() {
    this.worker = null;
    this.loadingCallbacks = new Map();
    this.idCounter = 0;
    this.initialized = false;
    this.gltfLoader = new GLTFLoader();
    this.initWorker();
  }
  
  initWorker() {
    try {
      // Create a worker
      this.worker = new Worker('./model-worker.js');
      
      // Set up message handler
      this.worker.onmessage = (event) => {
        const { type, id, buffer, error, percent, phase } = event.data;
        
        if (type === 'ready' || type === 'initialized') {
          this.initialized = true;
          console.log('Worker initialized successfully');
          return;
        }
        
        // Get callbacks for this request
        const callbacks = this.loadingCallbacks.get(id);
        if (!callbacks) return;
        
        if (type === 'progress' && callbacks.onProgress) {
          callbacks.onProgress(percent, phase);
        } else if (type === 'loaded' && callbacks.onLoad && buffer) {
          // Worker has sent us the raw buffer, now we parse it on the main thread
          console.log('Received model buffer from worker, parsing on main thread');
          
          // Update progress to show we're parsing
          if (callbacks.onProgress) {
            callbacks.onProgress(75, 'parsing');
          }
          
          try {
            // Parse the buffer using the GLTFLoader on the main thread
            this.gltfLoader.parse(buffer, '', 
              (gltf) => {
                // Parsing successful
                if (callbacks.onProgress) {
                  callbacks.onProgress(100, 'complete');
                }
                callbacks.onLoad(gltf);
                this.loadingCallbacks.delete(id);
              },
              (parseError) => {
                // Parsing error
                if (callbacks.onError) {
                  callbacks.onError(parseError.message || 'Error parsing model');
                }
                this.loadingCallbacks.delete(id);
              }
            );
          } catch (parseError) {
            // Catch any other errors during parsing
            if (callbacks.onError) {
              callbacks.onError(parseError.message || 'Error parsing model');
            }
            this.loadingCallbacks.delete(id);
          }
        } else if (type === 'error' && callbacks.onError) {
          callbacks.onError(error);
          this.loadingCallbacks.delete(id);
        }
      };
      
      // Initialize the worker
      this.worker.postMessage({ type: 'init' });
    } catch (error) {
      console.error('Error creating worker:', error);
      // We'll fallback to standard loading if worker creation fails
    }
  }
  
  /**
   * Load a model using the worker for download, main thread for parsing
   * @param {string} url - URL of the model to load
   * @param {function} onLoad - Callback when load completes
   * @param {function} onProgress - Callback for progress updates
   * @param {function} onError - Callback for errors
   * @returns {number} - Request ID that can be used to track this request
   */
  load(url, onLoad, onProgress, onError) {
    // Generate a unique ID for this request
    const id = this.idCounter++;
    
    // If worker failed to initialize, fallback to standard loading
    if (!this.worker || !this.initialized) {
      console.warn('Worker not available, falling back to standard loading');
      this.loadFallback(url, onLoad, onProgress, onError);
      return id;
    }
    
    // Store callbacks
    this.loadingCallbacks.set(id, { onLoad, onProgress, onError });
    
    // Send request to worker
    this.worker.postMessage({ type: 'load', url, id });
    
    return id;
  }
  
  /**
   * Fallback method to load model if worker fails
   * @param {string} url - URL of the model to load
   * @param {function} onLoad - Callback when load completes
   * @param {function} onProgress - Callback for progress updates
   * @param {function} onError - Callback for errors
   */
  loadFallback(url, onLoad, onProgress, onError) {
    console.log('Using fallback loader');
    const loader = new GLTFLoader();
    
    loader.load(
      url,
      onLoad,
      (xhr) => {
        if (xhr.lengthComputable && onProgress) {
          const percentComplete = Math.min(Math.round((xhr.loaded / xhr.total) * 100), 100);
          onProgress(percentComplete, 'downloading');
        }
      },
      onError
    );
  }
  
  /**
   * Cancel a loading request
   * @param {number} id - Request ID to cancel
   */
  cancel(id) {
    if (this.loadingCallbacks.has(id)) {
      this.loadingCallbacks.delete(id);
    }
  }
  
  /**
   * Terminate the worker - call when done with this loader
   */
  dispose() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    
    this.loadingCallbacks.clear();
  }
}

// Create a singleton instance for use throughout the app
export const workerModelLoader = new WorkerModelLoader();