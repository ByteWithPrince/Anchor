import { useState } from 'react';
import { GripVertical, Navigation } from 'lucide-react';
import { useStore } from '../../store/useStore';
import GpsTrackerModal from '../GpsTrackerModal';

export default function DistanceCard({ dragHandleProps }) {
  const [gpsModalOpen, setGpsModalOpen] = useState(false);
  const getMonthlyDistance = useStore(state => state.getMonthlyDistance);
  const cardioLogs = useStore(state => state.cardioLogs);

  const monthlyDist = getMonthlyDistance ? getMonthlyDistance() : 0;
  const displayDistance = monthlyDist.toFixed(2);
  const sessionCount = (cardioLogs || []).length;
  const latestSession = sessionCount > 0 ? cardioLogs[sessionCount - 1] : null;

  return (
    <div className="vexora-card" style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-backdrop)',
      WebkitBackdropFilter: 'var(--glass-backdrop)',
      borderRadius: '24px',
      padding: '28px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      border: 'var(--glass-border)',
      boxShadow: 'var(--glass-shadow)',
      minHeight: '320px'
    }}>
      {/* Background Dark Satellite / Vector Street Map */}
      <svg
        viewBox="0 0 320 320"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.38,
          pointerEvents: 'none'
        }}
      >
        <defs>
          <radialGradient id="mapFade" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#1E1E1E" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#212121" stopOpacity="0.95" />
          </radialGradient>
        </defs>

        {/* Base dark terrain */}
        <rect width="320" height="320" fill="#1C1C1C" />

        {/* Map roads & grid */}
        <path d="M -20,120 Q 80,180 180,110 T 340,160" stroke="#333333" strokeWidth="14" fill="none" />
        <path d="M 80,-20 Q 140,120 120,240 T 160,340" stroke="#2E2E2E" strokeWidth="12" fill="none" />
        <path d="M 220,-20 Q 200,100 280,220 T 260,340" stroke="#2B2B2B" strokeWidth="8" fill="none" />
        
        {/* Fine secondary streets */}
        <path d="M 40,40 L 280,260 M 30,220 L 290,140 M 10,80 L 150,280" stroke="#282828" strokeWidth="2.5" strokeDasharray="6 4" fill="none" />
        
        {/* River / contour */}
        <path d="M 0,260 C 80,240 160,300 320,270" stroke="#161616" strokeWidth="26" fill="none" />

        {/* Active GPS Route Trace (Glowing Line in Emerald) */}
        <path
          d="M 60,220 Q 120,180 160,200 T 240,130"
          stroke="#10B981"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* GPS waypoint circle */}
        <circle cx="240" cy="130" r="5" fill="#FFFFFF" stroke="#10B981" strokeWidth="2.5" />

        {/* Location Text Labels */}
        <text x="210" y="190" fill="#6E6E73" fontSize="10" fontWeight="600" fontFamily="sans-serif">Bloomfield</text>
        <text x="175" y="270" fill="#6E6E73" fontSize="10" fontWeight="600" fontFamily="sans-serif">Chelsea</text>
        <text x="255" y="110" fill="#6E6E73" fontSize="9" fontWeight="600" fontFamily="sans-serif">Mariner</text>

        {/* Gradient vignette mask */}
        <rect width="320" height="320" fill="url(#mapFade)" />
      </svg>

      {/* Foreground Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Top Header: Title + Drag Handle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
              Distance
            </h2>
            {monthlyDist > 0 && (
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px #10B981'
              }} />
            )}
          </div>
          <div 
            {...dragHandleProps}
            role="button"
            tabIndex={0}
            aria-label="Move Card"
            title="Drag to rearrange dashboard cards"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8E8E93',
              cursor: 'grab',
              transition: 'all 0.2s ease'
            }}
          >
            <GripVertical size={16} />
          </div>
        </div>

        {/* Large Distance Stat */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{
            fontSize: '42px',
            fontWeight: '800',
            color: '#FFFFFF',
            letterSpacing: '-1.5px',
            lineHeight: 1
          }}>
            {displayDistance}
          </span>
          <span style={{
            fontSize: '18px',
            fontWeight: '500',
            color: '#8E8E93'
          }}>
            km
          </span>
        </div>

        {/* Subtitle & Latest Session Summary */}
        <p style={{
          fontSize: '13px',
          color: '#8E8E93',
          fontWeight: '500',
          marginTop: '6px',
          marginBottom: '20px',
          lineHeight: 1.4
        }}>
          {monthlyDist === 0 
            ? 'No GPS cardio recorded this month · Tap to start' 
            : `Tracked ${sessionCount} ${sessionCount === 1 ? 'session' : 'sessions'} this month · Latest: ${latestSession?.distanceKm ? Number(latestSession.distanceKm).toFixed(2) : displayDistance} km (~${Math.max(1, Math.round((latestSession?.distanceKm || monthlyDist) * 65))} kcal)`}
        </p>

        {/* Emerald Pill Action Button */}
        <button
          onClick={() => setGpsModalOpen(true)}
          style={{
            background: '#10B981',
            color: '#0D0D0D',
            fontWeight: '800',
            fontSize: '13px',
            padding: '12px 24px',
            borderRadius: '9999px',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)',
            border: 'none',
            letterSpacing: '0.2px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'transform 0.15s ease, background-color 0.2s ease'
          }}
        >
          <Navigation size={15} fill="#0D0D0D" />
          <span>{monthlyDist === 0 ? 'Start GPS Track' : 'Live GPS Activity'}</span>
        </button>
      </div>

      <GpsTrackerModal
        isOpen={gpsModalOpen}
        onClose={() => setGpsModalOpen(false)}
      />
    </div>
  );
}
