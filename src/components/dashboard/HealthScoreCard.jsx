import { MoreHorizontal } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function HealthScoreCard() {
  const getHealthScore = useStore(state => state.getHealthScore);
  const getActiveProfile = useStore(state => state.getActiveProfile);
  const activeProfile = getActiveProfile ? getActiveProfile() : null;
  const profileFirstName = activeProfile?.name?.split(' ')[0] || 'Athlete';

  const rawScore = getHealthScore ? getHealthScore() : 0;
  const score = typeof rawScore === 'number' ? rawScore : 0;

  const totalDashes = 6;
  const activeDashes = score === 0 ? 0 : Math.max(1, Math.round((score / 100) * totalDashes));

  return (
    <div className="vexora-card" style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-backdrop)',
      WebkitBackdropFilter: 'var(--glass-backdrop)',
      borderRadius: '24px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      border: 'var(--glass-border)',
      boxShadow: 'var(--glass-shadow)'
    }}>
      {/* Header: Title + ... Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
          Health Score
        </h2>
        <button 
          aria-label="Health Score Options"
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
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Metric Row: Score% + Health Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{
          fontSize: '34px',
          fontWeight: '800',
          color: '#FFFFFF',
          letterSpacing: '-1px',
          lineHeight: 1
        }}>
          {score}%
        </span>
        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          background: '#333333',
          color: score >= 80 ? '#00D09C' : '#E0E0E0',
          padding: '4px 8px',
          borderRadius: '6px',
          letterSpacing: '0.2px'
        }}>
          {score === 0 ? 'Not Logged' : score >= 80 ? 'Very Healthy' : score >= 60 ? 'Optimal' : 'Needs Focus'}
        </span>
      </div>

      {/* Segmented Progress: 6 rounded teal pill segments */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${totalDashes}, 1fr)`,
        gap: '6px',
        marginBottom: '14px'
      }}>
        {Array.from({ length: totalDashes }).map((_, i) => (
          <div
            key={`dash-${i}`}
            style={{
              height: '8px',
              borderRadius: '9999px',
              backgroundColor: i < activeDashes ? '#00D09C' : '#333333',
              transition: 'background-color 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* Bottom Subtitle */}
      <p style={{
        fontSize: '12px',
        color: '#8E8E93',
        fontWeight: '500',
        margin: 0
      }}>
        {score === 0 
          ? `Log activity or nutrition to calculate score` 
          : `Keep up your good work, ${profileFirstName}!`}
      </p>
    </div>
  );
}
