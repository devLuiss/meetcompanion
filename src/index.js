import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tailwind.css';

// Add minimal style to prevent scrolling issues
const style = document.createElement('style');
style.textContent = `
  html, body, #root {
    overflow: hidden;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
