import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Minus, Disc3 } from 'lucide-react';
import { plateService } from '../services/plateService';

// Standard Olympic metric plate colors & dimensions (IWF standards)
const PLATE_COLORS = {
  25: { bg: 'rgba(239, 68, 68, 0.25)', border: '#EF4444', text: '#EF4444', height: 66 },
  20: { bg: 'rgba(59, 130, 246, 0.25)', border: '#3B82F6', text: '#3B82F6', height: 60 },
  15: { bg: 'rgba(245, 158, 11, 0.25)', border: '#F59E0B', text: '#F59E0B', height: 54 },
  10: { bg: 'rgba(16, 185, 129, 0.25)', border: '#10B981', text: '#10B981', height: 46 },
  5: { bg: 'rgba(255, 255, 255, 0.25)', border: '#FFFFFF', text: '#FFFFFF', height: 38 },
  2.5: { bg: 'rgba(156, 163, 175, 0.25)', border: '#9CA3AF', text: '#D1D5DB', height: 32 },
  1.25: { bg: 'rgba(110, 231, 183, 0.25)', border: '#6EE7B7', text: '#6EE7B7', height: 26 }
};

export default function PlateCalculatorModal({ isOpen, onClose, initialWeight, targetWeight, onApplyWeight, onApply }) {
  const rawWeight = targetWeight !== undefined ? targetWeight : (initialWeight !== undefined ? initialWeight : 60);
  const [adjustedWeight, setAdjustedWeight] = useState(null);

  // Sync weight whenever modal opens or target weight updates
  useEffect(() => {
    if (isOpen) {
      setAdjustedWeight(Number(rawWeight) || 60);
    }
  }, [isOpen, rawWeight]);

  // Keyboard ESC listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const weight = adjustedWeight !== null ? adjustedWeight : (Number(rawWeight) || 60);
  const result = plateService.calculatePlates(weight);

  const handleAdjust = (delta) => {
    const next = Math.max(20, Math.round((weight + delta) * 10) / 10);
    setAdjustedWeight(next);
  };

  const handleApply = () => {
    if (onApply) onApply(weight);
    if (onApplyWeight) onApplyWeight(weight);
    onClose();
  };

  const modalContent = (
    <div 
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
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
        className="animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%), rgba(18, 22, 30, 0.48)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderTop: '1.5px solid rgba(255, 255, 255, 0.32)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '26px',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(0, 208, 156, 0.15)',
              border: '1px solid rgba(0, 208, 156, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00D09C'
            }}>
              <Disc3 size={20} />
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '1px', color: '#8E8E93', textTransform: 'uppercase' }}>
                OLYMPIC BARBELL LOADER
              </span>
              <div style={{ fontSize: '30px', fontWeight: '900', letterSpacing: '-0.5px', color: '#FFFFFF', lineHeight: 1.1 }}>
                {weight} <span style={{ fontSize: '15px', color: '#00D09C', fontWeight: '800' }}>KG</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            aria-label="Close plate calculator"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8E8E93',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Quick Adjustment Steppers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[-10, -5, +5, +10].map(delta => (
            <button 
              key={delta}
              onClick={() => handleAdjust(delta)} 
              style={{
                padding: '10px 0',
                background: delta > 0 ? 'rgba(0, 208, 156, 0.08)' : 'rgba(255, 114, 67, 0.08)',
                border: delta > 0 ? '1px solid rgba(0, 208, 156, 0.25)' : '1px solid rgba(255, 114, 67, 0.25)',
                color: delta > 0 ? '#00D09C' : '#FF7243',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              {delta > 0 ? <Plus size={13} strokeWidth={3} /> : <Minus size={13} strokeWidth={3} />}
              <span>{Math.abs(delta)} kg</span>
            </button>
          ))}
        </div>

        {/* Creative Barbell & Plate Visualizer */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '20px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: '#8E8E93', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              LOAD PER SIDE (20 KG BAR)
            </span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#00D09C' }}>
              {result.weightPerSide} kg
            </span>
          </div>

          {result.isValid && result.platesPerSide.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Graphic Barbell Collar and Plates */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px', 
                padding: '16px 10px', 
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                overflowX: 'auto',
                minHeight: '84px',
                position: 'relative'
              }}>
                {/* Barbell Center Shaft */}
                <div style={{
                  width: '28px',
                  height: '14px',
                  background: 'linear-gradient(180deg, #A0A0A5 0%, #606065 100%)',
                  borderRadius: '2px 0 0 2px',
                  boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)'
                }} />

                {/* Inner Collar Stop */}
                <div style={{
                  width: '10px',
                  height: '52px',
                  background: 'linear-gradient(180deg, #D4D4D8 0%, #71717A 100%)',
                  borderRadius: '3px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                }} />

                {/* Loaded Plate Stack */}
                {result.platesPerSide.map((p, idx) => {
                  const styleInfo = PLATE_COLORS[p.plate] || { bg: 'rgba(255,255,255,0.1)', border: '#FFFFFF', text: '#FFFFFF', height: 40 };
                  return Array.from({ length: p.count }).map((_, cIdx) => (
                    <div 
                      key={`${idx}-${cIdx}`}
                      style={{
                        width: '32px',
                        height: `${styleInfo.height}px`,
                        background: styleInfo.bg,
                        border: `1.5px solid ${styleInfo.border}`,
                        borderRadius: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: '900',
                        color: styleInfo.text,
                        flexShrink: 0,
                        boxShadow: `0 4px 12px ${styleInfo.bg}`
                      }}
                    >
                      {p.plate}
                    </div>
                  ));
                })}

                {/* Outer Barbell Sleeve Tip */}
                <div style={{
                  flex: 1,
                  minWidth: '24px',
                  height: '14px',
                  background: 'linear-gradient(180deg, #A0A0A5 0%, #606065 100%)',
                  borderRadius: '0 4px 4px 0'
                }} />
              </div>

              {/* Text chips breakdown */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {result.platesPerSide.map((p, idx) => {
                  const styleInfo = PLATE_COLORS[p.plate] || { border: '#00D09C', text: '#00D09C' };
                  return (
                    <span 
                      key={idx} 
                      style={{ 
                        fontSize: '12px', 
                        fontWeight: '800', 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        border: `1px solid ${styleInfo.border}`,
                        padding: '5px 12px',
                        borderRadius: '9999px',
                        color: styleInfo.text,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{p.count} × {p.plate} kg</span>
                    </span>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#8E8E93', textAlign: 'center', padding: '16px 0', fontWeight: '600' }}>
              {weight === 20 ? 'Empty 20 kg Barbell (No plates needed)' : result.message || 'No plates needed'}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button 
          onClick={handleApply}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '800',
            letterSpacing: '0.6px',
            background: '#00D09C',
            color: '#0D0D0D',
            borderRadius: '16px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'none',
            transition: 'opacity 0.2s ease'
          }}
        >
          APPLY {weight} KG
        </button>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
