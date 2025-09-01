import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client'; // React 18+
import './index.css'; // Tailwind + custom styles
import App from './App.jsx';

// Attach React app to <div id="root"></div> in index.html
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
