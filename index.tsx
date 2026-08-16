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

  // Progressive Web App (PWA) Service Worker Registration (Only in standalone/top window)
  if ('serviceWorker' in navigator && window.self === window.top && window.location.protocol.startsWith('http')) {
    try {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  window.dispatchEvent(new CustomEvent('pwa-update-available', { detail: reg }));
                }
              };
            }
          };
        })
        .catch(() => {
          // Silent catch for sandboxed environments
        });
    } catch {
      // Ignored
    }
  }
};

// Start app instantly to ensure minimal delays
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  startApp();
} else {
  document.addEventListener('DOMContentLoaded', startApp);
}
