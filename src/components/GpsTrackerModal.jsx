import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause, Square, Navigation2, AlertCircle } from 'lucide-react';
import { gpsService } from '../services/gpsService';
import { useStore } from '../store/useStore';

export default function GpsTrackerModal({ isOpen, onClose }) {
  const addCardioLog = useStore(state => state.addCardioLog);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [distanceKm, setDistanceKm] = useState(0);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [path, setPath] = useState([]);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [isStationary, setIsStationary] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const timerRef = useRef(null);

  const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  // Keyboard ESC listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Elapsed timer
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

  // Clean up GPS on unmount or close
  useEffect(() => {
    return () => {
      gpsService.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleStart = () => {
    setIsRecording(true);
    setIsPaused(false);
    setErrorMessage(null);
    setDistanceKm(0);
    setElapsedSecs(0);
    setPath([]);
    setIsStationary(true);
    setCurrentSpeed(0);

    const onUpdate = (data) => {
      setDistanceKm(data.distanceKm);
      setPath([...data.path]);
      setIsStationary(data.isStationary);
      setCurrentSpeed(data.speed || 0);
    };

    const onError = (err) => {
      console.warn('GPS hardware error:', err);
      setErrorMessage(err.message || 'GPS location signal unavailable.');
    };

    gpsService.start(onUpdate, onError);
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
      setIsStationary(data.isStationary);
      setCurrentSpeed(data.speed || 0);
    };
    gpsService.start(onUpdate, (err) => setErrorMessage(err.message));
  };

  const handleFinish = () => {
    gpsService.stop();
    setIsRecording(false);
    setIsPaused(false);

    // Only save session if physical movement of at least 0.01 km (10m) occurred
    if (distanceKm >= 0.01) {
      const durationMin = Math.max(1, Math.round(elapsedSecs / 60));
      addCardioLog(Number(distanceKm.toFixed(2)), durationMin);
    }

    onClose();
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate live Pace (min/km). If idle/stationary (< 0.01 km), strictly show "--:-- /km"
  const calcPace = () => {
    if (distanceKm < 0.01 || elapsedSecs < 5) {
      return "--:-- /km";
    }
    const paceDecimal = (elapsedSecs / 60) / distanceKm;
    const clampedPace = Math.min(20, Math.max(2.5, paceDecimal));
    const paceMins = Math.floor(clampedPace);
    const paceSecs = Math.round((clampedPace - paceMins) * 60);
    return `${paceMins}'${paceSecs.toString().padStart(2, '0')}"/km`;
  };

  // Calories burned strictly stays at 0 kcal when idle/stationary
  const burnedKcal = distanceKm >= 0.01 ? Math.round(distanceKm * 65) : 0;

  // Status text based on device environment and speed
  const getStatusText = () => {
    if (!isRecording) {
      return isMobile 
        ? "Tap START TRACKING to begin recording GPS route" 
        : "Awaiting physical movement (Open Anchor PWA on your phone or pair Fitband for outdoor runs)";
    }
    if (isStationary || distanceKm < 0.003) {
      return isMobile
        ? "Stationary (0.0 km/h) · Move outdoors to record route"
        : "Awaiting physical movement (Open Anchor PWA on your phone or pair Fitband for outdoor runs)";
    }
    const kmh = (currentSpeed * 3.6).toFixed(1);
    return `GPS Active · Moving at ${kmh} km/h`;
  };

  // Render SVG route path when user moves outdoors
  const renderPathSvg = () => {
    if (path.length < 2 || distanceKm < 0.01) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', color: '#8E8E93', fontSize: '12px', gap: '8px', padding: '16px', textAlign: 'center' }}>
          <Navigation2 size={22} className={isRecording && !isStationary ? "animate-pop" : ""} color={isRecording ? "#10B981" : "#8E8E93"} />
          <span style={{ maxWidth: '320px', lineHeight: 1.4 }}>
            {getStatusText()}
          </span>
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
        <line x1="0" y1="45" x2={width} y2="45" stroke="rgba(255,255,255,0.04)" />
        <line x1="0" y1="90" x2={width} y2="90" stroke="rgba(255,255,255,0.04)" />
        <line x1="0" y1="135" x2={width} y2="135" stroke="rgba(255,255,255,0.04)" />

        <polyline
          points={points}
          fill="none"
          stroke="#10B981"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))"
        />

        <circle cx={lastX} cy={lastY} r="7" fill="#FFFFFF" stroke="#10B981" strokeWidth="3" />
        <circle cx={lastX} cy={lastY} r="14" fill="rgba(16, 185, 129, 0.25)" />
      </svg>
    );
  };

  const canSave = distanceKm >= 0.01;

  return createPortal(
    <div 
      className="modal-overlay animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.65)',
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
      <div 
        className="modal-bottom-sheet glass-modal animate-scale-in"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '490px',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          background: '#0D0D0D',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: '24px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              background: isRecording ? '#10B981' : '#8E8E93',
              boxShadow: isRecording ? '0 0 10px #10B981' : 'none'
            }} />
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#F3F4F6', letterSpacing: '-0.2px', margin: 0 }}>
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
              color: '#8E8E93',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* GPS Hardware Status Pill */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '10px 14px',
            borderRadius: '12px',
            marginBottom: '16px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isRecording ? '#10B981' : '#8E8E93',
            flexShrink: 0
          }} />
          <span style={{ fontSize: '11px', fontWeight: '600', color: isRecording ? '#F3F4F6' : '#8E8E93', lineHeight: 1.3 }}>
            {getStatusText()}
          </span>
        </div>

        {errorMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '10px 14px',
            borderRadius: '12px',
            color: '#EF4444',
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
            color: '#F3F4F6',
            letterSpacing: '-2px',
            lineHeight: 1
          }}>
            {distanceKm.toFixed(2)}
            <span style={{ fontSize: '20px', fontWeight: '500', color: '#8E8E93', marginLeft: '6px' }}>km</span>
          </div>
          <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', marginTop: '6px' }}>
            Distance Traveled
          </div>
        </div>

        {/* Stats Grid: Time, Pace, Calories */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#F3F4F6' }}>
              {formatTime(elapsedSecs)}
            </div>
            <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '4px', fontWeight: '600' }}>Time</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#F3F4F6' }}>
              {calcPace()}
            </div>
            <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '4px', fontWeight: '600' }}>Avg Pace</div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: distanceKm >= 0.01 ? '#10B981' : '#8E8E93' }}>
              {burnedKcal} kcal
            </div>
            <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '4px', fontWeight: '600' }}>Burned</div>
          </div>
        </div>

        {/* Interactive Breadcrumb Map Container */}
        <div 
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
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
                background: '#10B981',
                color: '#0D0D0D',
                fontWeight: '800',
                fontSize: '15px',
                padding: '16px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Play size={18} fill="#0D0D0D" />
              <span>START TRACKING</span>
            </button>
          ) : (
            <>
              {!isPaused ? (
                <button
                  onClick={handlePause}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#F3F4F6',
                    fontWeight: '700',
                    fontSize: '14px',
                    padding: '14px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.10)',
                    cursor: 'pointer'
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
                    background: '#10B981',
                    color: '#0D0D0D',
                    fontWeight: '800',
                    fontSize: '14px',
                    padding: '14px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Play size={18} fill="#0D0D0D" />
                  <span>Resume</span>
                </button>
              )}

              <button
                onClick={handleFinish}
                disabled={!canSave}
                title={canSave ? "Finish and save cardio session" : "Move at least 0.01 km outdoors to save session"}
                style={{
                  flex: 1,
                  background: canSave ? '#10B981' : 'rgba(255, 255, 255, 0.06)',
                  color: canSave ? '#0D0D0D' : '#8E8E93',
                  fontWeight: '800',
                  fontSize: '14px',
                  padding: '14px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: canSave ? '0 4px 14px rgba(16, 185, 129, 0.3)' : 'none',
                  border: canSave ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                  cursor: canSave ? 'pointer' : 'not-allowed',
                  opacity: canSave ? 1 : 0.6,
                  transition: 'all 0.2s ease'
                }}
              >
                <Square size={18} fill={canSave ? "#0D0D0D" : "#8E8E93"} />
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
