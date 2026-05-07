import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const originalFetch = window.fetch;
Object.defineProperty(window, 'fetch', {
  configurable: true,
  enumerable: true,
  writable: true,
  value: async (...args: Parameters<typeof originalFetch>) => {
    let [resource, config] = args;
    
    let url = '';
    if (typeof resource === 'string') {
      url = resource;
    } else if (resource instanceof Request) {
      url = resource.url;
    } else if (resource && typeof resource === 'object' && 'url' in resource) {
      url = (resource as any).url;
    }
    
    if (url.includes('/api/')) {
      config = config || {};
      const apiKey = localStorage.getItem('admin_api_key') || '';
      
      if (config.headers instanceof Headers) {
        config.headers.set('x-api-key', apiKey);
      } else if (Array.isArray(config.headers)) {
        config.headers.push(['x-api-key', apiKey]);
      } else {
        config.headers = {
          ...config.headers,
          'x-api-key': apiKey
        };
      }
      args[1] = config;
    }
    
    return originalFetch(...args);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
