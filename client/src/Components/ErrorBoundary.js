import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          background: '#f5f7fa'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <h1 style={{ color: '#e74c3c', marginBottom: '20px' }}>⚠️ Something went wrong</h1>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
              We're sorry for the inconvenience. Please try refreshing the page.
            </p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '20px', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', color: '#7f8c8d' }}>
                  Error Details
                </summary>
                <pre style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '0.85rem',
                  overflow: 'auto'
                }}>
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
