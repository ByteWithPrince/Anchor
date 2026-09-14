import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Mail, User, ShieldCheck, AlertCircle, Sparkles, LogIn, ArrowRight } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', onSuccess }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const [prevInitialMode, setPrevInitialMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('Strength & Hypertrophy');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const loginUser = useStore(s => s.loginUser);
  const registerUser = useStore(s => s.registerUser);
  const loginGuest = useStore(s => s.loginGuest);

  // Keyboard ESC listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (initialMode !== prevInitialMode) {
    setPrevInitialMode(initialMode);
    setMode(initialMode);
  }

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
      onClose();
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setGeneralError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div 
      className="animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.42)',
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
          ? 'radial-gradient(circle, rgba(0, 208, 156, 0.28) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 70%)'
          : 'radial-gradient(circle, rgba(255, 114, 67, 0.28) 0%, rgba(178, 224, 64, 0.15) 50%, transparent 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'background 0.5s ease'
      }} />

      <div 
        className="glass-modal animate-scale-in"
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
            background: 'linear-gradient(135deg, #00D09C 0%, #00B285 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0D0D0D',
            fontWeight: 800,
            fontSize: '15px',
            boxShadow: '0 4px 14px rgba(0, 208, 156, 0.35)'
          }}>
            ⚓
          </div>
          <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', color: '#00D09C' }}>
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
            backgroundColor: 'rgba(255, 114, 67, 0.12)',
            border: '1px solid rgba(255, 114, 67, 0.3)',
            borderRadius: '14px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#FF7243',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>
                ATHLETE NAME
              </label>
              <div 
                className="glass-input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 14px',
                  border: errors.name ? '1px solid #FF7243' : undefined
                }}
              >
                <User size={16} color="#8E8E93" style={{ marginRight: '10px', flexShrink: 0 }} />
                <input
                  type="text"
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
              {errors.name && <span style={{ color: '#FF7243', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
            </div>
          )}

          {mode === 'register' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>
                PRIMARY TRAINING FOCUS
              </label>
              <div 
                className="glass-input"
                style={{
                  padding: '0 14px'
                }}
              >
                <select
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
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>
              EMAIL ADDRESS
            </label>
            <div 
              className="glass-input"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px',
                border: errors.email ? '1px solid #FF7243' : undefined
              }}
            >
              <Mail size={16} color="#8E8E93" style={{ marginRight: '10px', flexShrink: 0 }} />
              <input
                type="email"
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
            {errors.email && <span style={{ color: '#FF7243', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#8E8E93', marginBottom: '8px', letterSpacing: '0.5px' }}>
              PASSWORD (MIN 6 CHARS)
            </label>
            <div 
              className="glass-input"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 14px',
                border: errors.password ? '1px solid #FF7243' : undefined
              }}
            >
              <Lock size={16} color="#8E8E93" style={{ marginRight: '10px', flexShrink: 0 }} />
              <input
                type="password"
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
            {errors.password && <span style={{ color: '#FF7243', fontSize: '12px', marginTop: '4px', display: 'block' }}>{errors.password}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: '#00D09C',
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
              marginBottom: '16px'
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

          {/* Continue Offline Option */}
          <button
            type="button"
            onClick={() => {
              loginGuest();
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
            <ShieldCheck size={16} color="#00D09C" />
            <span>Continue in 100% Offline Local Mode</span>
            <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}
