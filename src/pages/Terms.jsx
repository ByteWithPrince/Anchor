import React from 'react';
import { FileText, AlertTriangle, ArrowLeft, Mail } from 'lucide-react';
import GithubIcon from '../components/GithubIcon';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import TopNavbar from '../components/TopNavbar';

export default function Terms() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Terms & Conditions | Anchor — Zero-Bloat Fitness OS"
        description="Terms of service and athletic liability disclaimers for the Anchor Fitness Operating System."
      />

      <TopNavbar />

      <main style={{
        maxWidth: '840px',
        margin: '0 auto',
        padding: '24px 16px 80px 16px',
        color: '#FFFFFF'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#8E8E93',
            background: 'none',
            border: 'none',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '28px'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div 
          className="glass-card"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-backdrop)',
            WebkitBackdropFilter: 'var(--glass-backdrop)',
            borderRadius: '24px',
            padding: '40px',
            border: 'var(--glass-border)',
            boxShadow: 'var(--glass-shadow)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 114, 67, 0.12)',
              border: '1px solid rgba(255, 114, 67, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FF7243'
            }}>
              <FileText size={22} />
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#FF7243' }}>
                Legal & Protocols
              </span>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.8px', margin: 0 }}>
                Terms & Conditions
              </h1>
            </div>
          </div>

          <p style={{ fontSize: '14px', color: '#8E8E93', marginBottom: '32px' }}>
            Last Updated: September 12, 2026 • Maintained by <a href="https://github.com/ByteWithPrince" target="_blank" rel="noopener noreferrer" style={{ color: '#00D09C', textDecoration: 'none' }}>Prince Katiyar (@ByteWithPrince)</a>
          </p>

          {/* Section 1: Health & Medical Disclaimer */}
          <section style={{
            backgroundColor: 'rgba(255, 114, 67, 0.08)',
            border: '1px solid rgba(255, 114, 67, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '28px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <AlertTriangle size={20} color="#FF7243" />
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                1. Athletic Exertion & Medical Disclaimer
              </h2>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#E0E0E0', margin: 0 }}>
              Anchor is an athletic recording tool, not a medical or licensed clinical service. Resistance training, progressive overload, cardiovascular running, and caloric restriction carry inherent physical risks. Always consult a qualified physician or sports medicine specialist before initiating strenuous exercise protocols. You voluntarily assume all physical risks associated with training routines tracked within this application.
            </p>
          </section>

          {/* Section 2: Software License */}
          <section style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '10px' }}>
              2. Permitted Software Use
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#CCCCCC' }}>
              Anchor grants you a personal, revocable, non-exclusive license to use the application for tracking physical fitness and nutrition. You agree not to attempt denial-of-service attacks, reverse engineer the backend API, or distribute malware through the platform.
            </p>
          </section>

          {/* Section 3: Data Ownership & Backup */}
          <section style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '10px' }}>
              3. Data Ownership & Backup Responsibility
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#CCCCCC' }}>
              Because Anchor is designed around local-first storage, you are responsible for maintaining your browser cache or regularly exporting JSON backups via the <em>Export JSON</em> feature in the profile switcher. Anchor is not liable for data loss caused by local browser cache clearing, device resets, or private browsing modes.
            </p>
          </section>

          {/* Section 4: Contact Information */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
              Questions Regarding Terms?
            </h3>
            <p style={{ fontSize: '13px', color: '#8E8E93', lineHeight: 1.5 }}>
              For legal inquiries, licensing, or commercial inquiries:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '4px' }}>
              <a
                href="mailto:prince.14.katiyar@gmail.com"
                style={{
                  color: '#00D09C',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none'
                }}
              >
                <Mail size={16} />
                <span>prince.14.katiyar@gmail.com</span>
              </a>
              <a
                href="https://github.com/ByteWithPrince"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#8E8E93',
                  fontSize: '14px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none'
                }}
              >
                <GithubIcon size={16} />
                <span>github.com/ByteWithPrince</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
