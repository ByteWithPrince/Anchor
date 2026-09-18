import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause, Square, Navigation2, AlertCircle } from 'lucide-react';
import { gpsService } from '../services/gpsService';
import { useStore } from '../store/useStore';

export default function GpsTrackerModal({ isOpen, onClose }) {
  const addCardioLog = useStore(state => state.addCardioLog);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [useSimulation, setUseSimulation] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [path, setPath] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  const timerRef = useRef(null);

  // Keyboard ESC listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSecs(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  // Clean up GPS on unmount
  useEffect(() => {
    return () => {
      gpsService.stop();
    };
  }, []);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleStart = () => {
    setIsRecording(true);
    setIsPaused(false);
    setErrorMessage(null);

    const onUpdate = (data) => {
      setDistanceKm(data.distanceKm);
      setPath([...data.path]);
    };

    const onError = (err) => {
      setErrorMessage(err.message || 'GPS Signal Unavailable. You can use Simulation mode.');
    };

    if (useSimulation) {
      gpsService.startSimulation(onUpdate);
    } else {
      gpsService.start(onUpdate, onError);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    gpsService.stop();
  };

  const handleResume = () => {
    setIsPaused(false);
    const onUpdate = (data) => {
      setDistanceKm(data.distanceKm);
      setPath([...data.path]);
    };
    if (useSimulation) {
      gpsService.startSimulation(onUpdate);
    } else {
      gpsService.start(onUpdate, (err) => setErrorMessage(err.message));
    }
  };

  const handleFinish = () => {
    gpsService.stop();
    setIsRecording(false);
    setIsPaused(false);

    const durationMin = Math.max(1, Math.round(elapsedSecs / 60));
    const savedDistance = Number(distanceKm.toFixed(2));

    if (savedDistance > 0.01) {
      addCardioLog(savedDistance, durationMin);
    }

    onClose();
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate Pace (min/km)
  const calcPace = () => {
    if (distanceKm < 0.05 || elapsedSecs < 5) return "--'--\"";
    const paceDecimal = (elapsedSecs / 60) / distanceKm;
    const paceMins = Math.floor(paceDecimal);
    const paceSecs = Math.round((paceDecimal - paceMins) * 60);
    return `${paceMins}'${paceSecs.toString().padStart(2, '0')}"/km`;
  };

  // Normalize path coordinates to SVG bounding box
  const renderPathSvg = () => {
    if (path.length < 2) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#8E8E93', fontSize: '13px', gap: '8px' }}>
          <Navigation2 size={24} className={isRecording ? "animate-pop" : ""} color="#FF7243" />
          <span>{isRecording ? "Tracking live satellite path..." : "Press START to begin recording route"}</span>
        </div>
      );
    }

    const lats = path.map(p => p.lat);
    const lngs = path.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const deltaLat = maxLat - minLat || 0.0001;
    const deltaLng = maxLng - minLng || 0.0001;

    const width = 340;
    const height = 180;
    const padding = 20;

    const points = path.map(p => {
      const x = padding + ((p.lng - minLng) / deltaLng) * (width - 2 * padding);
      const y = height - (padding + ((p.lat - minLat) / deltaLat) * (height - 2 * padding));
      return `${x},${y}`;
    }).join(' ');

    const lastPoint = path[path.length - 1];
    const lastX = padding + ((lastPoint.lng - minLng) / deltaLng) * (width - 2 * padding);
    const lastY = height - (padding + ((lastPoint.lat - minLat) / deltaLat) * (height - 2 * padding));

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '180px' }}>
        {/* Subtle grid */}
        <line x1="0" y1="45" x2={width} y2="45" stroke="rgba(255,255,255,0.04)" />
        <line x1="0" y1="90" x2={width} y2="90" stroke="rgba(255,255,255,0.04)" />
        <line x1="0" y1="135" x2={width} y2="135" stroke="rgba(255,255,255,0.04)" />

        {/* GPS Breadcrumb Trajectory */}
        <polyline
          points={points}
          fill="none"
          stroke="#FF7243"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="drop-shadow(0 0 6px rgba(255, 114, 67, 0.6))"
        />

        {/* Current Position Marker */}
        <circle cx={lastX} cy={lastY} r="7" fill="#FFFFFF" stroke="#FF7243" strokeWidth="3" />
        <circle cx={lastX} cy={lastY} r="14" fill="rgba(255, 114, 67, 0.25)" />
      </svg>
    );
  };

  return createPortal(
    <div 
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.42)',
        backdropFilter: 'blur(48px) saturate(200%)',
        WebkitBackdropFilter: 'blur(48px) saturate(200%)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      {/* Dynamic Ambient Luminous Backing Aura */}
      <div style={{
        position: 'absolute',
        width: '460px',
        height: '460px',
        borderRadius: '50%',
        background: isRecording
          ? 'radial-gradient(circle, rgba(0, 208, 156, 0.25) 0%, rgba(99, 102, 241, 0.15) 50%, transparent 70%)'
          : 'radial-gradient(circle, rgba(255, 114, 67, 0.25) 0%, rgba(255, 180, 0, 0.12) 50%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'background 0.5s ease'
      }} />

      <div 
        className="glass-modal animate-scale-in"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '490px',
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              background: isRecording ? '#00D09C' : '#8E8E93',
              boxShadow: isRecording ? '0 0 10px #00D09C' : 'none'
            }} />
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
              Live GPS Activity Tracker
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8E8E93'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Toggle: Real Hardware GPS vs Simulated Movement */}
        {!isRecording && (
          <div 
            className="glass-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '10px 16px',
              borderRadius: '14px',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#CCCCCC' }}>
              {useSimulation ? '⚡ Demo Mode: Simulated Run' : '🛰️ Real Device GPS Sensor'}
            </span>
            <button
              onClick={() => setUseSimulation(!useSimulation)}
              style={{
                fontSize: '11px',
                fontWeight: '700',
                background: useSimulation ? '#FF7243' : 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                padding: '4px 12px',
                borderRadius: '9999px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: useSimulation ? '0 2px 8px rgba(255, 114, 67, 0.4)' : 'none'
              }}
            >
              {useSimulation ? 'Using Simulation' : 'Enable Demo'}
            </button>
          </div>
        )}

        {errorMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 114, 67, 0.1)',
            border: '1px solid rgba(255, 114, 67, 0.3)',
            padding: '10px 14px',
            borderRadius: '12px',
            color: '#FF7243',
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Live Metrics Showcase */}
        <div style={{
          textAlign: 'center',
          padding: '16px 0',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '56px',
            fontWeight: '900',
            color: '#FFFFFF',
            letterSpacing: '-2px',
            lineHeight: 1
          }}>
            {distanceKm.toFixed(2)}
            <span style={{ fontSize: '20px', fontWeight: '500', color: '#8E8E93', marginLeft: '6px' }}>km</span>
          </div>
          <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '600', textTransform: 'uppercase', marginTop: '6px' }}>
            Distance Traveled
          </div>
        </div>

        {/* Stats Grid: Time, Pace, Calories */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px', textAlign: 'center' }}>
          <div className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF' }}>
              {formatTime(elapsedSecs)}
            </div>
            <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '4px' }}>Time</div>
          </div>

          <div className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF' }}>
              {calcPace()}
            </div>
            <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '4px' }}>Avg Pace</div>
          </div>

          <div className="glass-card" style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#FF7243' }}>
              {Math.round(distanceKm * 65)} kcal
            </div>
            <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '4px' }}>Burned</div>
          </div>
        </div>

        {/* Interactive Breadcrumb Map Container */}
        <div 
          className="glass-card"
          style={{
            background: 'rgba(10, 10, 10, 0.4)',
            borderRadius: '18px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            overflow: 'hidden',
            marginBottom: '24px'
          }}
        >
          {renderPathSvg()}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {!isRecording ? (
            <button
              onClick={handleStart}
              style={{
                flex: 1,
                background: '#FF7243',
                color: '#FFFFFF',
                fontWeight: '800',
                fontSize: '15px',
                padding: '16px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(255, 114, 67, 0.35)'
              }}
            >
              <Play size={18} fill="#FFFFFF" />
              <span>START TRACKING</span>
            </button>
          ) : (
            <>
              {!isPaused ? (
                <button
                  onClick={handlePause}
                  style={{
                    flex: 1,
                    background: '#333333',
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: '14px',
                    padding: '14px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Pause size={18} />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={handleResume}
                  style={{
                    flex: 1,
                    background: '#00D09C',
                    color: '#161616',
                    fontWeight: '800',
                    fontSize: '14px',
                    padding: '14px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Play size={18} fill="#161616" />
                  <span>Resume</span>
                </button>
              )}

              <button
                onClick={handleFinish}
                style={{
                  flex: 1,
                  background: '#FF7243',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  fontSize: '14px',
                  padding: '14px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Square size={18} fill="#FFFFFF" />
                <span>Finish & Save</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
