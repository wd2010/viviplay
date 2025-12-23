
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Register service worker for PWA (vite-plugin-pwa virtual helper)
try {
  // `registerSW` is provided by `vite-plugin-pwa` via a virtual module at build/dev time
  // it returns an update function we can call if needed
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  }).catch(() => {});
} catch (e) {
  // ignore in environments without the plugin
}

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
