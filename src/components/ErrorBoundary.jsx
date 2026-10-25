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

  handleResetCacheAndReload = async () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        window.sessionStorage.clear();
        if (window.indexedDB && window.indexedDB.databases) {
          const dbs = await window.indexedDB.databases();
          for (const db of dbs) {
            if (db.name) window.indexedDB.deleteDatabase(db.name);
          }
        } else if (window.indexedDB) {
          window.indexedDB.deleteDatabase('keyval-store');
          window.indexedDB.deleteDatabase('anchor-storage-v3');
        }
      }
    } catch (e) {
      console.warn('Cache purge error:', e);
    }
    window.location.href = '/';
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
            fontSize: '15px',
            color: 'var(--text-color, #F3F4F6)',
            opacity: 0.65,
            maxWidth: '460px',
            lineHeight: 1.5,
            marginBottom: '20px'
          }}>
            An unexpected error occurred. Your local data remains safe.
          </p>

          {this.state.error?.message && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '12px',
              padding: '12px 18px',
              fontFamily: 'monospace',
              fontSize: '12px',
              color: '#FF8A8A',
              maxWidth: '520px',
              wordBreak: 'break-word',
              marginBottom: '32px'
            }}>
              {this.state.error.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: 'var(--primary-color, #10B981)',
                color: '#000000',
                border: 'none',
                padding: '14px 28px',
                fontSize: '13px',
                fontWeight: '800',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                borderRadius: '12px',
                textTransform: 'uppercase'
              }}
            >
              RELOAD APPLICATION
            </button>

            <button
              onClick={this.handleResetCacheAndReload}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '14px 24px',
                fontSize: '13px',
                fontWeight: '700',
                letterSpacing: '0.5px',
                cursor: 'pointer',
                borderRadius: '12px'
              }}
            >
              Reset Local Cache & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
