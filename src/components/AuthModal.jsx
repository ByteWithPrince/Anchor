import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Mail, User, ShieldCheck, AlertCircle, Sparkles, LogIn, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Strength & Hypertrophy');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const loginUser = useStore(s => s.loginUser);
  const registerUser = useStore(s => s.registerUser);
  const loginWithGoogle = useStore(s => s.loginWithGoogle);
  const loginGuest = useStore(s => s.loginGuest);

  // Sync mode whenever initialMode prop changes
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);
  if (prevInitialMode !== initialMode) {
    setPrevInitialMode(initialMode);
    setMode(initialMode);
    setErrors({});
    setGeneralError('');
  }

  // Keyboard ESC listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Google Identity Services (GIS) One-Tap / ID Token initialization
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!isOpen || !googleClientId) return;

    const setupGsi = () => {
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            auto_select: false,
            callback: async (response) => {
              if (response.credential) {
                setLoading(true);
                setGeneralError('');
                try {
                  await loginWithGoogle({ credential: response.credential });
                  onClose();
                  if (onSuccess) onSuccess();
                  else navigate('/dashboard');
                } catch (err) {
                  const isOffline = err.name === 'TypeError' ||
                    err.message?.includes('Failed to fetch') ||
                    err.message?.includes('JSON') ||
                    err.message?.includes(':5001') ||
                    err.message?.includes('NetworkError');
                  setGeneralError(isOffline ? "Backend server (:5001) is not running. Start the backend or continue in 100% Offline Local Mode." : (err.message || 'Google sign-in failed.'));
                } finally {
                  setLoading(false);
                }
              }
            }
          });
        }
      } catch (e) {
        console.warn('[GIS] Init notice:', e);
      }
    };

    if (window.google?.accounts?.id) {
      setupGsi();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          setupGsi();
        }
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isOpen, loginWithGoogle, onClose, onSuccess, navigate]);

  if (!isOpen || typeof document === 'undefined') return null;

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (mode === 'register' && !name.trim()) {
      errs.name = 'Full name is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validate()) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        await loginUser(email, password);
      } else {
        await registerUser(email, password, name, role);
      }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('anchor_session_unlocked', 'true');
      }
      onClose();
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const isOffline = err.name === 'TypeError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('JSON') ||
        err.message?.includes(':5001') ||
        err.message?.includes('NetworkError');
      setGeneralError(isOffline ? "Backend server (:5001) is not running. Start the backend or continue in 100% Offline Local Mode." : (err.message || 'Authentication failed. Please check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGeneralError('');
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // 1. Verify Client ID is present
    if (!googleClientId) {
      setGeneralError('Google Client ID is missing. Ensure VITE_GOOGLE_CLIENT_ID is set in .env.');
      return;
    }

    // 2. Verify Google Identity Services script is available
    if (!window.google?.accounts) {
      setGeneralError('Google Identity Services script is not loaded or is blocked. Check your connection or ad blocker.');
      return;
    }

    setLoading(true);

    try {
      // 3. Prefer GIS OAuth2 token client for custom button click (direct interactive popup)
      if (window.google.accounts.oauth2?.initTokenClient) {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setGeneralError(`Google sign-in error: ${tokenResponse.error_description || tokenResponse.error}`);
              setLoading(false);
              return;
            }

            try {
              let profile = {};
              if (tokenResponse.access_token) {
                try {
                  const uRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                  });
                  if (uRes.ok) {
                    const text = await uRes.text();
                    try { profile = text ? JSON.parse(text) : {}; } catch { profile = {}; }
                  }
                } catch (uErr) {
                  console.warn('[GIS] Profile fetch notice:', uErr.message);
                }
              }

              await loginWithGoogle({
                credential: tokenResponse.access_token,
                token: tokenResponse.access_token,
                email: profile.email,
                name: profile.name,
                avatar: profile.picture,
                googleId: profile.sub
              });

              if (typeof window !== 'undefined') {
                sessionStorage.setItem('anchor_session_unlocked', 'true');
              }

              onClose();
              if (onSuccess) onSuccess();
              else navigate('/dashboard');
            } catch (err) {
              const isOffline = err.name === 'TypeError' ||
                err.message?.includes('Failed to fetch') ||
                err.message?.includes('JSON') ||
                err.message?.includes(':5001') ||
                err.message?.includes('NetworkError');
              setGeneralError(isOffline ? "Backend server (:5001) is not running. Start the backend or continue in 100% Offline Local Mode." : (err.message || 'Google sign-in failed.'));
            } finally {
              setLoading(false);
            }
          }
        });

        tokenClient.requestAccessToken();
        return;
      }

      // 4. Fallback to One-Tap prompt if OAuth2 client is not loaded
      if (window.google.accounts.id?.prompt) {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setLoading(false);
            const reason = notification.getNotDisplayedReason?.() || notification.getSkippedReason?.() || 'Prompt suppressed';
            console.warn('[GIS] One-tap notice:', reason);
            setGeneralError(`Google prompt was suppressed (${reason}). Try signing in with email or continue offline.`);
          }
        });
        return;
      }

      throw new Error('Google Identity Services client is unavailable.');
    } catch (err) {
      const isOffline = err.name === 'TypeError' ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('JSON') ||
        err.message?.includes(':5001') ||
        err.message?.includes('NetworkError');
      setGeneralError(isOffline ? "Backend server (:5001) is not running. Start the backend or continue in 100% Offline Local Mode." : (err.message || 'Google authentication failed.'));
      setLoading(false);
    }
  };

  return createPortal(
    <div 
      className="modal-overlay animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        backdropFilter: 'blur(48px) saturate(200%)',
        WebkitBackdropFilter: 'blur(48px) saturate(200%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px'
      }}
    >
      {/* Dynamic Ambient Luminous Backing Aura */}
      <div style={{
        position: 'absolute',
        width: '420px',
        height: '420px',
        borderRadius: '50%',
        background: mode === 'login'
          ? 'radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 70%)'
          : 'radial-gradient(circle, rgba(16, 185, 129, 0.28) 0%, rgba(178, 224, 64, 0.15) 50%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'background 0.5s ease'
      }} />

      <div 
        className="modal-bottom-sheet glass-modal animate-scale-in"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '36px 32px',
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close authentication modal"
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            color: '#A0A0A5',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <X size={18} />
        </button>

        {/* Brand Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #FF7243 0%, #FF8F6B 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '15px',
            boxShadow: '0 4px 14px rgba(255, 114, 67, 0.35)'
          }}>
            ⚓
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#FF7243' }}>
            Anchor Cloud Sync
          </span>
        </div>

        <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.8px', marginBottom: '8px' }}>
          {mode === 'login' ? 'Welcome Back, Athlete' : 'Create Athlete Account'}
        </h2>
        <p style={{ fontSize: '14px', color: '#A0A0A5', marginBottom: '24px', lineHeight: 1.45 }}>
          {mode === 'login'
            ? 'Sign in to synchronize your local training logs across all devices.'
            : 'Register to unlock secure multi-device synchronization and permanent cloud backup.'}
        </p>

        {/* Mode Toggle Switch */}
        <div style={{
          display: 'flex',
          backgroundColor: 'rgba(12, 12, 12, 0.65)',
          borderRadius: '14px',
          padding: '4px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(10px)'
        }}>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrors({}); setGeneralError(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: '10px',
              border: mode === 'login' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
              backgroundColor: mode === 'login' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: mode === 'login' ? '#FFFFFF' : '#8E8E93',
              fontSize: '14px',
              fontWeight: mode === 'login' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: mode === 'login' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrors({}); setGeneralError(''); }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: '10px',
              border: mode === 'register' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid transparent',
              backgroundColor: mode === 'register' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: mode === 'register' ? '#FFFFFF' : '#8E8E93',
              fontSize: '14px',
              fontWeight: mode === 'register' ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: mode === 'register' ? '0 4px 12px rgba(0, 0, 0, 0.3)' : 'none'
            }}
          >
            Register
          </button>
        </div>

        {generalError && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#EF4444',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} method="post" action="#" autoComplete="on">
          {mode === 'register' && (
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="auth-name" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>
                ATHLETE NAME
              </label>
              <div 
                className="glass-input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 14px',
                  border: errors.name ? '1px solid #EF4444' : undefined
                }}
              >
                <User size={16} color="#8E8E93" style={{ marginRight: '10px', flexShrink: 0 }} />
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: '' })); }}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '14px 0',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    outline: 'none'
                  }}
                />
              </div>
              {errors.name && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
            </div>
          )}

          {mode === 'register' && (
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="auth-role" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>
                PRIMARY TRAINING FOCUS
              </label>
              <div 
                className="glass-input"
                style={{
                  padding: '0 14px'
                }}
              >
                <select
                  id="auth-role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '14px 0',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Strength & Hypertrophy" style={{ background: '#121620', color: '#FFFFFF' }}>Strength & Hypertrophy</option>
                  <option value="Hybrid Athlete (Strength + Cardio)" style={{ background: '#121620', color: '#FFFFFF' }}>Hybrid Athlete (Strength + Cardio)</option>
                  <option value="Endurance & Marathon Prep" style={{ background: '#121620', color: '#FFFFFF' }}>Endurance & Marathon Prep</option>
                  <option value="Powerlifting & Heavy Compound" style={{ background: '#121620', color: '#FFFFFF' }}>Powerlifting & Heavy Compound</option>
                </select>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="auth-email" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>
              EMAIL ADDRESS
            </label>
            <div 
              className="glass-input"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px',
                border: errors.email ? '1px solid #EF4444' : undefined
              }}
            >
              <Mail size={16} color="#8E8E93" style={{ marginRight: '10px', flexShrink: 0 }} />
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="username email"
                placeholder="athlete@domain.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors(prev => ({ ...prev, email: '' })); }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '14px 0',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />
            </div>
            {errors.email && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="auth-password" style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>
              PASSWORD (MIN 6 CHARS)
            </label>
            <div 
              className="glass-input"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px',
                border: errors.password ? '1px solid #EF4444' : undefined
              }}
            >
              <Lock size={16} color="#8E8E93" style={{ marginRight: '10px', flexShrink: 0 }} />
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(prev => ({ ...prev, password: '' })); }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '14px 0',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  outline: 'none'
                }}
              />
            </div>
            {errors.password && <span style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.password}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#10B981',
              color: '#0D0D0D',
              padding: '16px',
              borderRadius: '14px',
              border: 'none',
              fontWeight: 700,
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all 0.2s ease',
              marginBottom: '12px'
            }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : mode === 'login' ? (
              <>
                <LogIn size={18} />
                <span>Sign In & Sync</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Create Cloud Account</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '16px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
            <span style={{ fontSize: '11px', color: '#8E8E93', fontWeight: 700, letterSpacing: '0.6px' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
          </div>

          {/* Active Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#FFFFFF',
              padding: '14px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '14px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Continue Offline Option */}
          <button
            type="button"
            onClick={() => {
              loginGuest();
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('anchor_session_unlocked', 'true');
              }
              onClose();
              if (onSuccess) onSuccess();
              else navigate('/dashboard');
            }}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              color: '#8E8E93',
              padding: '12px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <ShieldCheck size={16} color="#10B981" />
            <span>Continue in 100% Offline Local Mode</span>
            <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
