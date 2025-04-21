// Simple worker that just loads the model file and sends it back to the main thread
// This avoids the complexity of trying to run Three.js in a worker

self.addEventListener('message', function(e) {
    const { type, url, id } = e.data;
    
    if (type === 'init') {
      // Just acknowledge initialization
      self.postMessage({ type: 'initialized' });
      return;
    }
    
    if (type === 'load' && url) {
      // Fetch the model file
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Network error: ${response.status}`);
          }
          
          // Get total size for progress calculation
          const total = parseInt(response.headers.get('content-length'), 10) || 0;
          let loaded = 0;
          
          // Create a reader to process the stream
          const reader = response.body.getReader();
          const chunks = [];
          
          // Process chunks as they arrive
          function processChunk({ done, value }) {
            if (done) {
              // Combine all chunks into a single ArrayBuffer
              const chunksAll = new Uint8Array(loaded);
              let position = 0;
              for (const chunk of chunks) {
                chunksAll.set(chunk, position);
                position += chunk.length;
              }
              
              // Report 100% progress - download complete
              self.postMessage({
                type: 'progress',
                id,
                phase: 'complete',
                percent: 100
              });
              
              // Send the raw buffer back to the main thread for parsing
              self.postMessage({
                type: 'loaded',
                id,
                buffer: chunksAll.buffer
              }, [chunksAll.buffer]); // Transfer ownership for better performance
              
              return;
            }
            
            // Store chunk and update loaded amount
            chunks.push(value);
            loaded += value.length;
            
            // Report download progress (0-100%)
            if (total) {
              const percent = Math.min(Math.round((loaded / total) * 100), 100);
              self.postMessage({
                type: 'progress',
                id,
                phase: 'downloading',
                loaded,
                total,
                percent
              });
            }
            
            // Continue reading
            return reader.read().then(processChunk);
          }
          
          // Start reading
          return reader.read().then(processChunk);
        })
        .catch(error => {
          self.postMessage({
            type: 'error',
            id,
            error: error.message || 'Network error'
          });
        });
    }
  });
  
  // Notify that the worker is ready
  self.postMessage({ type: 'ready' });