import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Anchor ErrorBoundary caught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: 'var(--bg-color, #0D0D0D)',
          color: 'var(--text-color, #F3F4F6)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '2px solid var(--border-color, rgba(255, 255, 255, 0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            color: 'var(--primary-color, #10B981)',
            fontSize: '20px',
            fontWeight: '700'
          }}>
            !
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '12px' }}>
            SOMETHING WENT WRONG
          </h1>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-color, #F3F4F6)',
            opacity: 0.6,
            maxWidth: '360px',
            lineHeight: 1.5,
            marginBottom: '40px'
          }}>
            An unexpected error occurred. Your data stored locally remains safe.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              backgroundColor: 'var(--primary-color, #10B981)',
              color: '#000000',
              border: 'none',
              padding: '16px 32px',
              fontSize: '14px',
              fontWeight: '700',
              letterSpacing: '1px',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            RELOAD APPLICATION
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
