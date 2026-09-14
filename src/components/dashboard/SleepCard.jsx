import { useStore } from '../../store/useStore';
import { Moon, Plus, Minus } from 'lucide-react';

export default function SleepCard() {
  const getTodaySleep = useStore(state => state.getTodaySleep);
  const addSleepLog = useStore(state => state.addSleepLog);

  const rawHours = getTodaySleep();
  const hasLogged = rawHours !== null && rawHours !== undefined;
  const hours = hasLogged ? rawHours : 0;
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);

  const handleAdjust = (deltaHours) => {
    const base = hasLogged ? hours : 7.5;
    const next = Math.max(3, Math.min(14, Math.round((base + deltaHours) * 10) / 10));
    addSleepLog(next);
  };

  const statusText = !hasLogged 
    ? 'Not Logged Today' 
    : hours >= 8 
      ? 'Optimal Recovery' 
      : hours >= 7 
        ? 'Good Sleep' 
        : hours >= 6 
          ? 'Moderate Rest' 
          : 'Sleep Deficit';

  return (
    <div className="vexora-card" style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-backdrop)',
      WebkitBackdropFilter: 'var(--glass-backdrop)',
      borderRadius: '24px',
      border: 'var(--glass-border)',
      boxShadow: 'var(--glass-shadow)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', opacity: 0.5, textTransform: 'uppercase' }}>
          SLEEP & RECOVERY
        </span>
        <Moon size={16} color="var(--primary-color)" />
      </div>

      {/* Main Metric */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <div style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-1px' }}>
            {hasLogged ? `${wholeHours}h ${minutes > 0 ? `${minutes}m` : ''}` : '--'}
          </div>
          <span style={{ fontSize: '12px', opacity: 0.5, fontWeight: '700' }}>/ 8h Target</span>
        </div>

        <div style={{ marginTop: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: '800',
            background: hasLogged ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${hasLogged ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.1)'}`,
            color: hasLogged ? 'var(--primary-color)' : '#8E8E93',
            padding: '3px 8px',
            borderRadius: '6px',
            letterSpacing: '0.5px'
          }}>
            {statusText}
          </span>
        </div>
      </div>

      {/* Quick Adjustment Controls */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button
          onClick={() => handleAdjust(-0.5)}
          aria-label="Decrease sleep 30 minutes"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            padding: '8px 0',
            fontSize: '11px',
            fontWeight: '700',
            color: 'var(--text-color)',
            cursor: 'pointer'
          }}
        >
          <Minus size={12} /> 30m
        </button>

        <button
          onClick={() => handleAdjust(0.5)}
          aria-label="Increase sleep 30 minutes"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-color)',
            padding: '8px 0',
            fontSize: '11px',
            fontWeight: '700',
            color: 'var(--text-color)',
            cursor: 'pointer'
          }}
        >
          <Plus size={12} /> 30m
        </button>
      </div>
    </div>
  );
}
