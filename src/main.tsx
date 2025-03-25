import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

console.log('Main.tsx is executing - SIMPLIFIED VERSION')

// Clear any previous errors
console.clear();

// Simplified root mounting
const rootElement = document.getElementById('root');
console.log('Root element found:', rootElement ? 'YES' : 'NO');

if (rootElement) {
  try {
    console.log('Attempting to mount React app...');
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </React.StrictMode>
    );
    console.log('React app mounted successfully!');
  } catch (error) {
    console.error('Failed to mount React app:', error);
    rootElement.innerHTML = `
      <div style="color: red; padding: 20px;">
        <h1>React App Failed to Load</h1>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        <p>Check console for details.</p>
      </div>
    `;
  }
} else {
  console.error('Root element not found in the DOM!');
}