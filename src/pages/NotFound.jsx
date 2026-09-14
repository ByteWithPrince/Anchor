import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, Home, Globe, Mail } from 'lucide-react';
import GithubIcon from '../components/GithubIcon';
import SEOHead from '../components/SEOHead';
import TopNavbar from '../components/TopNavbar';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="404 — Route Out of Bounds | Anchor"
        description="The requested page could not be found. Return to Anchor's fitness dashboard or product overview."
      />
      
      <TopNavbar />

      <main style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 16px',
        textAlign: 'center'
      }}>
        <div 
          className="glass-card"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-backdrop)',
            WebkitBackdropFilter: 'var(--glass-backdrop)',
            borderRadius: '24px',
            padding: '48px 32px',
            maxWidth: '520px',
            width: '100%',
            border: 'var(--glass-border)',
            boxShadow: 'var(--glass-shadow)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* Compass Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: 'rgba(255, 114, 67, 0.12)',
            border: '1px solid rgba(255, 114, 67, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FF7243',
            marginBottom: '20px'
          }}>
            <Compass size={32} />
          </div>

          <span style={{
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#FF7243',
            marginBottom: '8px'
          }}>
            Error 404 // Out of Bounds
          </span>

          <h1 style={{
            fontSize: '32px',
            fontWeight: 900,
            color: '#FFFFFF',
            letterSpacing: '-1px',
            marginBottom: '12px',
            lineHeight: 1.1
          }}>
            Protocol Not Found
          </h1>

          <p style={{
            fontSize: '15px',
            color: '#8E8E93',
            lineHeight: 1.5,
            marginBottom: '32px',
            maxWidth: '380px'
          }}>
            The GPS coordinates or protocol route you entered do not exist on Anchor's map. Let's get you back on track.
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            width: '100%',
            marginBottom: '28px'
          }}>
            <button
              onClick={() => navigate('/')}
              style={{
                backgroundColor: '#00D09C',
                color: '#0D0D0D',
                padding: '14px 20px',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                border: 'none',
                transition: 'transform 0.15s ease'
              }}
            >
              <Home size={18} />
              <span>Return to Daily Dashboard</span>
            </button>

            <button
              onClick={() => navigate('/landing')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                padding: '14px 20px',
                borderRadius: '14px',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <Globe size={18} color="#FF7243" />
              <span>Explore Product Overview</span>
            </button>
          </div>

          {/* Real Contact Footer */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '20px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            fontSize: '13px',
            color: '#8E8E93'
          }}>
            <a
              href="https://github.com/ByteWithPrince"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#8E8E93',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none'
              }}
            >
              <GithubIcon size={15} />
              <span>ByteWithPrince</span>
            </a>
            <span>•</span>
            <a
              href="mailto:prince.14.katiyar@gmail.com"
              style={{
                color: '#8E8E93',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none'
              }}
            >
              <Mail size={15} />
              <span>Contact Support</span>
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
