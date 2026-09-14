import React from 'react';
import { CheckCircle2, ArrowRight, Home, Mail } from 'lucide-react';
import GithubIcon from '../components/GithubIcon';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import TopNavbar from '../components/TopNavbar';

export default function ThankYou() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Protocol Confirmed | Anchor — Zero-Bloat Fitness OS"
        description="Your athlete protocol is confirmed. Welcome to the Anchor high-performance training ecosystem."
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
          {/* Checkmark Icon */}
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            backgroundColor: 'rgba(0, 208, 156, 0.12)',
            border: '1px solid rgba(0, 208, 156, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00D09C',
            marginBottom: '20px'
          }}>
            <CheckCircle2 size={34} />
          </div>

          <span style={{
            fontSize: '12px',
            fontWeight: 800,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: '#00D09C',
            marginBottom: '8px'
          }}>
            Status: Activated // Operational
          </span>

          <h1 style={{
            fontSize: '32px',
            fontWeight: 900,
            color: '#FFFFFF',
            letterSpacing: '-1px',
            marginBottom: '12px',
            lineHeight: 1.1
          }}>
            Thank You, Athlete
          </h1>

          <p style={{
            fontSize: '15px',
            color: '#8E8E93',
            lineHeight: 1.5,
            marginBottom: '32px',
            maxWidth: '380px'
          }}>
            Your session or request has been recorded. Anchor is primed for sub-15-second tracking and progressive overload.
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
                border: 'none'
              }}
            >
              <Home size={18} />
              <span>Launch Daily Dashboard</span>
              <ArrowRight size={16} />
            </button>
          </div>

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
              <span>Developer Contact</span>
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
