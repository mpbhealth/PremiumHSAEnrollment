import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

if (import.meta.env.PROD) {
  const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (hook && typeof hook === 'object') {
    for (const key of Object.keys(hook)) {
      if (typeof hook[key] === 'function') {
        hook[key] = () => {};
      }
    }
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
