
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// التحقق مما إذا كان التطبيق قد فشل في التحميل بسبب الكاش العالق
const checkMountStatus = () => {
  setTimeout(() => {
    const root = document.getElementById('root');
    if (root && root.innerHTML === "" && !window.location.search.includes('reloaded=true')) {
      console.warn("Detected empty mount. Forcing reload...");
      const url = new URL(window.location.href);
      url.searchParams.set('reloaded', 'true');
      url.searchParams.set('ts', Date.now().toString());
      window.location.href = url.toString();
    }
  }, 2000);
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

checkMountStatus();
