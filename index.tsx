import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const startApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) return;

  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.info("Thari App: Successfully Initialized.");

  // Progressive Web App (PWA) Service Worker Registration
  if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.info('Thari SW: Service Worker registered, scope:', reg.scope);
        
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.info('Thari SW: New update found. Will display notice.');
                  window.dispatchEvent(new CustomEvent('pwa-update-available', { detail: reg }));
                } else {
                  console.info('Thari SW: Offline caching complete!');
                }
              }
            };
          }
        };
      })
      .catch((err) => {
        console.error('Thari SW: Registration failed:', err);
      });
  }
};

// Start app instantly to ensure minimal delays
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  startApp();
} else {
  document.addEventListener('DOMContentLoaded', startApp);
}
