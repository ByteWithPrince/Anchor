import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Anchor as AnchorIcon, ArrowRight, Zap, Navigation2, 
  Sparkles, Cpu, Database, Volume2, Activity,
  Mail
} from 'lucide-react';
import GithubIcon from '../components/GithubIcon';
import { aiService } from '../services/aiService';
import { progressionService } from '../services/progressionService';
import SEOHead from '../components/SEOHead';
import AuthModal from '../components/AuthModal';
import { useStore } from '../store/useStore';

export default function Landing() {
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('register'); // 'login' | 'register'
  const currentUser = useStore(state => state.currentUser);
  const authToken = useStore(state => state.authToken);
  const isAuthenticated = Boolean(currentUser && authToken);

  const handleOpenAuth = (mode = 'register') => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      setAuthModalMode(mode);
      setAuthModalOpen(true);
    }
  };

  // Interactive Sandbox 1: Food Parser demo
  const [foodQuery, setFoodQuery] = useState('200g chicken breast and 1 avocado');
  const [demoResult, setDemoResult] = useState({ name: '200g Chicken Breast & Avocado', calories: 580, protein: 62, carbs: 12, fat: 30, source: 'ai' });
  const [isDemoParsing, setIsDemoParsing] = useState(false);

  // Interactive Sandbox 2: 1RM Overload demo
  const [demoWeight, setDemoWeight] = useState(225);
  const [demoReps, setDemoReps] = useState(6);
  const calculated1RM = progressionService.calculate1RM(demoWeight, demoReps);

  const handleTestParse = async (queryText) => {
    const q = queryText || foodQuery;
    setIsDemoParsing(true);
    try {
      const res = await aiService.resolveFood(q);
      if (res && res.length > 0) {
        setDemoResult(res[0]);
      }
    } catch {
      // fallback
    } finally {
      setIsDemoParsing(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      color: '#FFFFFF',
      width: '100%',
      fontFamily: "'Inter', sans-serif",
      overflowX: 'hidden'
    }}>
      <SEOHead
        title="Anchor — High-Performance Athletic Operating System"
        description="The minimalist, local-first fitness OS designed for sub-15-second tracking, live GPS breadcrumb routes, and progressive overload."
      />
      {/* STICKY TOP NAV */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'transparent',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        padding: '16px 32px'
      }}>
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Logo */}
          <div 
            onClick={() => navigate('/')} 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FF7243 0%, #FF9066 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(255, 114, 67, 0.3)'
            }}>
              <AnchorIcon size={20} strokeWidth={2.6} />
            </div>
            <span style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '1px' }}>
              ANCHOR
            </span>
          </div>

          {/* Center Anchor Links */}
          <div style={{ display: 'flex', gap: '28px', alignItems: 'center' }} className="desktop-only">
            <a href="#features" style={{ fontSize: '13px', fontWeight: '600', color: '#8E8E93' }}>Features</a>
            <a href="#sandbox" style={{ fontSize: '13px', fontWeight: '600', color: '#8E8E93' }}>Interactive Demo</a>
            <a href="#architecture" style={{ fontSize: '13px', fontWeight: '600', color: '#8E8E93' }}>System Design</a>
            <a href="#comparison" style={{ fontSize: '13px', fontWeight: '600', color: '#8E8E93' }}>Comparison</a>
          </div>

          {/* Launch App / Sign In CTA */}
          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                background: '#00D09C',
                color: '#0D0D0D',
                padding: '10px 22px',
                borderRadius: '9999px',
                fontWeight: '800',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span>OPEN DASHBOARD</span>
              <ArrowRight size={15} />
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => handleOpenAuth('login')}
                style={{
                  background: 'transparent',
                  color: '#FFFFFF',
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => handleOpenAuth('register')}
                style={{
                  background: '#FF7243',
                  color: '#FFFFFF',
                  padding: '10px 22px',
                  borderRadius: '9999px',
                  fontWeight: '800',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <span>GET STARTED</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{
        width: '100%',
        margin: '0 auto',
        padding: '80px 48px 60px 48px',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 114, 67, 0.1)',
          border: '1px solid rgba(255, 114, 67, 0.3)',
          padding: '6px 16px',
          borderRadius: '9999px',
          color: '#FF7243',
          fontSize: '12px',
          fontWeight: '800',
          letterSpacing: '0.8px',
          marginBottom: '28px'
        }}>
          <Zap size={14} />
          <span>ZERO BLOAT · LOCAL-FIRST · HARDWARE GPS</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(40px, 7vw, 76px)',
          fontWeight: '900',
          letterSpacing: '-2.5px',
          lineHeight: 1.05,
          marginBottom: '24px',
          maxWidth: '1100px',
          margin: '0 auto 24px auto'
        }}>
          The Minimalist Fitness OS Engineered For Focus.
        </h1>

        <p style={{
          fontSize: '18px',
          color: '#8E8E93',
          maxWidth: '680px',
          margin: '0 auto 40px auto',
          lineHeight: 1.5
        }}>
          Unified workout tracking, natural language macro logging, and hardware GPS telemetry. No social feeds. No subscriptions. No nonsense.
        </p>

        {/* Primary CTA Button Group */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '64px'
        }}>
          <button
            onClick={() => handleOpenAuth('register')}
            style={{
              background: '#00D09C',
              color: '#0D0D0D',
              padding: '18px 36px',
              borderRadius: '9999px',
              fontWeight: '800',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: 'none',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <span>{isAuthenticated ? 'RESUME DASHBOARD' : 'GET STARTED FREE'}</span>
            <ArrowRight size={18} strokeWidth={3} />
          </button>

          <a
            href="#sandbox"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              padding: '18px 32px',
              borderRadius: '9999px',
              fontSize: '15px',
              fontWeight: '700'
            }}
          >
            TRY INTERACTIVE DEMO
          </a>
        </div>

        {/* 4 Performance Benchmark Chips */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          width: '100%',
          margin: '0 auto'
        }}>
          <div className="glass-card" style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-backdrop)', WebkitBackdropFilter: 'var(--glass-backdrop)', borderRadius: '18px', padding: '24px', border: 'var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#00D09C' }}>&lt;100 KB</div>
            <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '600', marginTop: '4px' }}>Total Gzipped Bundle</div>
          </div>

          <div className="glass-card" style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-backdrop)', WebkitBackdropFilter: 'var(--glass-backdrop)', borderRadius: '18px', padding: '24px', border: 'var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#FF7243' }}>&lt;5 ms</div>
            <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '600', marginTop: '4px' }}>Local Nutrition Parse</div>
          </div>

          <div className="glass-card" style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-backdrop)', WebkitBackdropFilter: 'var(--glass-backdrop)', borderRadius: '18px', padding: '24px', border: 'var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#B2E040' }}>100%</div>
            <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '600', marginTop: '4px' }}>Offline IndexedDB Native</div>
          </div>

          <div className="glass-card" style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-backdrop)', WebkitBackdropFilter: 'var(--glass-backdrop)', borderRadius: '18px', padding: '24px', border: 'var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#F4C767' }}>0 Ads</div>
            <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '600', marginTop: '4px' }}>Zero Feed Algorithms</div>
          </div>
        </div>
      </section>

      {/* SECTION: INTERACTIVE SANDBOX */}
      <section id="sandbox" style={{
        width: '100%',
        margin: '0 auto',
        padding: '80px 48px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#00D09C', letterSpacing: '1px', textTransform: 'uppercase' }}>
            TEST WITHOUT CREATING AN ACCOUNT
          </span>
          <h2 style={{ fontSize: '38px', fontWeight: '800', letterSpacing: '-1.5px', marginTop: '6px' }}>
            Interactive Engineering Sandbox
          </h2>
          <p style={{ fontSize: '15px', color: '#8E8E93', marginTop: '8px' }}>
            Test Anchor's natural language food resolver and Epley 1RM calculator live.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Sandbox 1: Food Resolver */}
          <div 
            className="glass-card"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-backdrop)',
              WebkitBackdropFilter: 'var(--glass-backdrop)',
              borderRadius: '24px',
              padding: '32px',
              border: 'var(--glass-border)',
              boxShadow: 'var(--glass-shadow)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sparkles size={20} color="#FF7243" />
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Live AI Nutrition Parser</h3>
            </div>
            <p style={{ fontSize: '13px', color: '#8E8E93', marginBottom: '20px' }}>
              Type any plain-text meal or click a preset to test the 3-layer parsing engine:
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
              {['3 eggs & sourdough toast', '200g ribeye steak', '1 scoop whey with oats'].map((sample, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setFoodQuery(sample);
                    handleTestParse(sample);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '6px 12px',
                    borderRadius: '9999px',
                    fontSize: '11px',
                    color: '#CCCCCC',
                    cursor: 'pointer'
                  }}
                >
                  {sample}
                </button>
              ))}
            </div>

            {/* Input and trigger */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                value={foodQuery}
                onChange={e => setFoodQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(15, 15, 15, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => handleTestParse()}
                disabled={isDemoParsing}
                style={{
                  background: '#FF7243',
                  color: '#FFFFFF',
                  padding: '12px 18px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {isDemoParsing ? 'Parsing...' : 'Resolve'}
              </button>
            </div>

            {/* Live result preview */}
            <div style={{ background: 'rgba(20, 20, 20, 0.5)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', fontSize: '15px' }}>{demoResult.name}</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: '#00D09C' }}>{demoResult.calories} kcal</span>
              </div>
              <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '6px' }}>
                {demoResult.protein}g Protein · {demoResult.carbs}g Carbs · {demoResult.fat}g Fat
              </div>
            </div>
          </div>

          {/* Sandbox 2: 1RM Overload Calculator */}
          <div 
            className="glass-card"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-backdrop)',
              WebkitBackdropFilter: 'var(--glass-backdrop)',
              borderRadius: '24px',
              padding: '32px',
              border: 'var(--glass-border)',
              boxShadow: 'var(--glass-shadow)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Activity size={20} color="#00D09C" />
              <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Epley 1RM & Overload Math</h3>
            </div>
            <p style={{ fontSize: '13px', color: '#8E8E93', marginBottom: '20px' }}>
              Anchor computes 1RM with Epley ($w \cdot (1 + r/30)$) to auto-fill progressive targets:
            </p>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                <span>Weight: {demoWeight} lbs</span>
                <span>Reps: {demoReps}</span>
              </div>
              <input
                type="range"
                min="95"
                max="405"
                step="5"
                value={demoWeight}
                onChange={e => setDemoWeight(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#00D09C', marginBottom: '14px' }}
              />
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={demoReps}
                onChange={e => setDemoReps(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#00D09C' }}
              />
            </div>

            <div style={{ background: 'rgba(20, 20, 20, 0.5)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>Calculated 1RM</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#00D09C' }}>
                  {calculated1RM} <span style={{ fontSize: '14px', color: '#8E8E93' }}>lbs</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>Next Target (+5 lbs)</div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#FF7243' }}>
                  {demoWeight + 5} lbs × {demoReps}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: SYSTEM DESIGN & ARCHITECTURE */}
      <section id="architecture" style={{
        width: '100%',
        margin: '0 auto',
        padding: '80px 48px',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#B2E040', letterSpacing: '1px', textTransform: 'uppercase' }}>
            ENGINEERING FOUNDATION
          </span>
          <h2 style={{ fontSize: '38px', fontWeight: '800', letterSpacing: '-1.5px', marginTop: '6px' }}>
            Architecture Under The Hood
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="glass-card" style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-backdrop)', WebkitBackdropFilter: 'var(--glass-backdrop)', borderRadius: '20px', padding: '26px', border: 'var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
            <Database size={24} color="#00D09C" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>IndexedDB Local Storage</h3>
            <p style={{ fontSize: '13px', color: '#8E8E93', lineHeight: 1.5 }}>
              Persisted with asynchronous idb-keyval adapters. Workouts and food logs save locally in &lt;1ms without network roundtrips.
            </p>
          </div>

          <div className="glass-card" style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-backdrop)', WebkitBackdropFilter: 'var(--glass-backdrop)', borderRadius: '20px', padding: '26px', border: 'var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
            <Navigation2 size={24} color="#FF7243" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Hardware GPS & Haversine</h3>
            <p style={{ fontSize: '13px', color: '#8E8E93', lineHeight: 1.5 }}>
              Integrates the HTML5 Geolocation API with spherical coordinate distance calculation for real-time outdoor runs and walks.
            </p>
          </div>

          <div className="glass-card" style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-backdrop)', WebkitBackdropFilter: 'var(--glass-backdrop)', borderRadius: '20px', padding: '26px', border: 'var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
            <Volume2 size={24} color="#B2E040" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Web Audio Synthesis</h3>
            <p style={{ fontSize: '13px', color: '#8E8E93', lineHeight: 1.5 }}>
              Zero audio file dependencies. Renders dual-tone athletic synthesizer rest chimes (587 Hz → 880 Hz) purely in code.
            </p>
          </div>

          <div className="glass-card" style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-backdrop)', WebkitBackdropFilter: 'var(--glass-backdrop)', borderRadius: '20px', padding: '26px', border: 'var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
            <Cpu size={24} color="#F4C767" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Multi-Athlete Profiles</h3>
            <p style={{ fontSize: '13px', color: '#8E8E93', lineHeight: 1.5 }}>
              Instant profile switching with partitioned databases. Multiple lifters can log sessions on one device with zero collisions.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{
        width: '100%',
        margin: '0 auto',
        padding: '100px 48px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-2px', marginBottom: '16px' }}>
          Experience Tracking Without Fatigue.
        </h2>
        <p style={{ fontSize: '16px', color: '#8E8E93', maxWidth: '520px', margin: '0 auto 36px auto', lineHeight: 1.5 }}>
          Launch the Anchor Fitness OS now. 100% free, private, and running entirely on your device.
        </p>

        <button
          onClick={() => handleOpenAuth('register')}
          style={{
            background: '#FF7243',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: '900',
            padding: '18px 42px',
            borderRadius: '9999px',
            boxShadow: 'none',
            letterSpacing: '0.2px',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          {isAuthenticated ? 'RESUME DASHBOARD SESSION' : 'LAUNCH ANCHOR DASHBOARD'}
        </button>
      </section>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
        padding: '56px 32px 80px 32px',
        backgroundColor: 'transparent',
        color: '#8E8E93',
        width: '100%'
      }}>
        <div style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px'
        }}>
          {/* Brand & Creator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #FF7243 0%, #FF9066 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF'
            }}>
              <AnchorIcon size={16} strokeWidth={2.6} />
            </div>
            <span style={{ fontSize: '16px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '0.5px' }}>
              ANCHOR FITNESS OS
            </span>
          </div>

          <p style={{ fontSize: '13px', textAlign: 'center', maxWidth: '500px', lineHeight: 1.6, margin: 0 }}>
            Architected & engineered by <strong style={{ color: '#FFFFFF' }}>Prince Katiyar</strong>. Built with React 19, Vite, Zustand, IndexedDB & Web APIs.
          </p>

          {/* Social & Contact Links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
            <a
              href="https://github.com/ByteWithPrince"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#FFFFFF',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
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

            <a
              href="mailto:prince.14.katiyar@gmail.com"
              style={{
                color: '#00D09C',
                backgroundColor: 'rgba(0, 208, 156, 0.08)',
                border: '1px solid rgba(0, 208, 156, 0.2)',
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
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
          </div>

          {/* Legal Navigation Links */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '24px',
            justifyContent: 'center',
            fontSize: '12px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '20px',
            width: '100%'
          }}>
            <Link to="/privacy" style={{ color: '#8E8E93', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: '#8E8E93', textDecoration: 'none' }}>Terms & Conditions</Link>
            <Link to="/thank-you" style={{ color: '#8E8E93', textDecoration: 'none' }}>Activation Status</Link>
            <span style={{ color: '#555555' }}>© 2026 Anchor OS. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* STICKY MOBILE CTA DOCK (Visible on mobile screens) */}
      <div 
        className="mobile-sticky-dock"
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          right: '16px',
          zIndex: 49,
          display: 'none', // Controlled via CSS media query below
          justifyContent: 'center'
        }}
      >
        <button
          onClick={() => handleOpenAuth('register')}
          style={{
            width: '100%',
            maxWidth: '400px',
            backgroundColor: '#00D09C',
            color: '#0D0D0D',
            padding: '16px 24px',
            borderRadius: '9999px',
            fontWeight: 800,
            fontSize: '15px',
            border: 'none',
            boxShadow: '0 8px 30px rgba(0, 208, 156, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <span>{isAuthenticated ? 'RESUME YOUR DASHBOARD' : 'LAUNCH ANCHOR OS FREE'}</span>
          <ArrowRight size={18} strokeWidth={3} />
        </button>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => navigate('/dashboard')}
      />

      <style>{`
        @media (max-width: 768px) {
          .mobile-sticky-dock {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
