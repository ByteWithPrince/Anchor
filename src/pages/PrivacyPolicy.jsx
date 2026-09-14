import React from 'react';
import { ShieldCheck, Lock, Database, UserCheck, ArrowLeft, Mail } from 'lucide-react';
import GithubIcon from '../components/GithubIcon';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import TopNavbar from '../components/TopNavbar';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Privacy Policy | Anchor — Zero-Bloat Fitness OS"
        description="Anchor is built local-first. We do not sell your biometric data, track your location in the background, or run third-party advertising."
      />

      <TopNavbar />

      <main style={{
        maxWidth: '840px',
        margin: '0 auto',
        padding: '24px 16px 80px 16px',
        color: '#FFFFFF'
      }}>
        {/* Back navigation */}
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
              backgroundColor: 'rgba(0, 208, 156, 0.12)',
              border: '1px solid rgba(0, 208, 156, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00D09C'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#00D09C' }}>
                Trust & Transparency
              </span>
              <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.8px', margin: 0 }}>
                Anchor Privacy Policy
              </h1>
            </div>
          </div>

          <p style={{ fontSize: '14px', color: '#8E8E93', marginBottom: '32px' }}>
            Effective Date: September 12, 2026 • Maintained by <a href="https://github.com/ByteWithPrince" target="_blank" rel="noopener noreferrer" style={{ color: '#00D09C', textDecoration: 'none' }}>Prince Katiyar (@ByteWithPrince)</a>
          </p>

          {/* Section 1 */}
          <section style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Database size={18} color="#FF7243" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                1. Local-First Architecture
              </h2>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#CCCCCC' }}>
              Anchor operates on a strict <strong>local-first principle</strong>. By default, all training sessions, workout logs, nutrition entries, body weight metrics, and personal split configurations are stored directly on your physical device via browser IndexedDB. Your data never leaves your browser unless you explicitly initiate cloud synchronization or manual JSON export.
            </p>
          </section>

          {/* Section 2 */}
          <section style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Lock size={18} color="#B2E040" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                2. Live Hardware GPS & Location
              </h2>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#CCCCCC' }}>
              Anchor's running and cardio tracking accesses your device's native HTML5 Geolocation API only when you actively trigger a GPS session. GPS coordinates are processed entirely in memory using the Haversine great-circle formula to calculate real-time distance, pace, and SVG breadcrumb vectors. Anchor <strong>does not record background location</strong>, sell movement telemetry, or transmit coordinates to any ad brokers.
            </p>
          </section>

          {/* Section 3 */}
          <section style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <UserCheck size={18} color="#00D09C" />
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
                3. Optional Multi-User Cloud Sync
              </h2>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#CCCCCC' }}>
              If you choose to create an account, Anchor hashes your password using industry-standard <code>bcrypt</code> encryption and issues stateless JSON Web Tokens (JWT). When syncing, your training snapshot is encrypted in transit and saved to your isolated SQLite account database. You retain full ownership and can export or wipe your entire dataset at any time with 1 click.
            </p>
          </section>

          {/* Section 4 */}
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginBottom: '10px' }}>
              4. Zero Ad Networks & Zero Data Selling
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#CCCCCC' }}>
              We do not integrate behavioral ad SDKs, social trackers, or data broker scripts. We believe an athletic operating system should be an uncompromised high-performance instrument.
            </p>
          </section>

          {/* Contact Box */}
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
              Questions or Data Requests?
            </h3>
            <p style={{ fontSize: '13px', color: '#8E8E93', lineHeight: 1.5 }}>
              For privacy inquiries, audit questions, or data deletion requests, contact the developer directly:
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
