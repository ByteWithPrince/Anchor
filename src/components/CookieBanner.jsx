import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const COOKIE_KEY = 'anchor_cookie_consent_v1';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_KEY);
      if (!consent) {
        // Show after brief delay for smooth appearance
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage access blocked/private mode
    }
  }, []);

  const handleConsent = (level) => {
    try {
      localStorage.setItem(COOKIE_KEY, level);
    } catch {
      // Ignore in strict private mode
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="animate-slide-up"
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '20px',
        right: '20px',
        maxWidth: '560px',
        margin: '0 auto',
        backgroundColor: 'rgba(18, 22, 30, 0.75)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        borderRadius: '20px',
        padding: '20px 24px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0, 208, 156, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00D09C',
            flexShrink: 0
          }}>
            <ShieldCheck size={18} />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
            Local Storage & Privacy Notice
          </span>
        </div>

        <button
          onClick={() => handleConsent('dismissed')}
          aria-label="Dismiss cookie notice"
          style={{
            background: 'none',
            border: 'none',
            color: '#8E8E93',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={16} />
        </button>
      </div>

      <p style={{ fontSize: '13px', color: '#8E8E93', lineHeight: 1.45, margin: 0 }}>
        Anchor operates local-first using browser IndexedDB to persist your workout logs, GPS breadcrumbs, and macro targets on this device. We do not use third-party advertising trackers. Read our{' '}
        <Link to="/privacy" style={{ color: '#00D09C', textDecoration: 'underline' }}>
          Privacy Policy
        </Link>.
      </p>

      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button
          onClick={() => handleConsent('all')}
          style={{
            flex: 1,
            backgroundColor: '#00D09C',
            color: '#0D0D0D',
            padding: '10px 16px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          Accept All
        </button>
        <button
          onClick={() => handleConsent('essential')}
          style={{
            flex: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: '#FFFFFF',
            padding: '10px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Essential Only
        </button>
      </div>
    </div>
  );
}
