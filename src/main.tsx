import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'

console.log('Main.tsx is executing')

// Create a simple test component to verify React is working
const TestComponent = () => {
  console.log('Test component rendering')
  return (
    <div style={{
      padding: '20px',
      backgroundColor: 'lightblue',
      margin: '20px',
      borderRadius: '5px'
    }}>
      <h1>React is working!</h1>
      <p>If you see this, React is rendering correctly.</p>
    </div>
  )
}

try {
  console.log('Attempting to render React app')
  const rootElement = document.getElementById('root')
  
  if (!rootElement) {
    console.error('Root element not found!')
    document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found!</div>'
  } else {
    // First, try rendering just a test component to verify React works
    const root = ReactDOM.createRoot(rootElement)
    
    root.render(
      <React.StrictMode>
        <AuthProvider>
          <App />
        </AuthProvider>
      </React.StrictMode>
    )
    console.log('React render call completed')
  }
} catch (error) {
  console.error('Error rendering React app:', error)
  document.body.innerHTML = `<div style="color: red; padding: 20px;">Error rendering React app: ${error}</div>`
}