import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught a fatal error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: 24,
          background: '#04070f',
          color: '#ff2d55',
          fontFamily: 'JetBrains Mono, monospace',
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          boxSizing: 'border-box'
        }}>
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, color: '#f1f5f9' }}>
            FINGUARD <span style={{ color: '#ff2d55' }}>X</span> RUNTIME EXCEPTION
          </h1>
          <p style={{ color: '#8892b0', maxWidth: 600, fontSize: 13, lineHeight: 1.5 }}>
            The AI Command Console encountered a fatal client-side rendering error. Please review the diagnostic logs below.
          </p>
          <pre style={{
            background: 'rgba(255, 45, 85, 0.05)',
            border: '1px solid rgba(255, 45, 85, 0.25)',
            padding: 16,
            borderRadius: 8,
            maxWidth: '80%',
            overflow: 'auto',
            textAlign: 'left',
            color: '#ff6a00',
            fontSize: 12
          }}>
            {this.state.error?.toString()}<br />
            {this.state.error?.stack}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: '10px 20px',
              background: '#00f5ff',
              color: '#04070f',
              border: 'none',
              borderRadius: 6,
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(0, 245, 255, 0.4)'
            }}
          >
            REBOOT SYSTEM CONSOLE
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
