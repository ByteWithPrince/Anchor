import { GripVertical, ShieldCheck } from 'lucide-react';
import { useStore, getTodayStr } from '../../store/useStore';

export default function HealthScoreCard({ dragHandleProps }) {
  const getHealthScore = useStore(state => state.getHealthScore);
  const getActiveProfile = useStore(state => state.getActiveProfile);
  const foodLogs = useStore(state => state.foodLogs);
  const workoutLogs = useStore(state => state.workoutLogs);
  const activeWorkout = useStore(state => state.activeWorkout);

  const activeProfile = getActiveProfile ? getActiveProfile() : null;
  const profileFirstName = activeProfile?.name?.split(' ')[0] || 'Athlete';

  const todayStr = getTodayStr();
  const hasFood = foodLogs.some(f => f.date === todayStr);
  const hasWorkout = workoutLogs.some(w => w.date === todayStr) || activeWorkout?.date === todayStr;

  const rawScore = getHealthScore ? getHealthScore() : 0;
  const score = (!hasFood && !hasWorkout) ? 0 : Math.min(100, Math.max(0, rawScore));

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
      {/* Header: Title + Drag Handle Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
          Health Score
        </h2>
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
          background: score >= 80 ? 'rgba(0, 208, 156, 0.15)' : '#222222',
          border: score >= 80 ? '1px solid rgba(0, 208, 156, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
          color: score >= 80 ? '#00D09C' : score >= 50 ? '#F4C767' : '#E0E0E0',
          padding: '4px 10px',
          borderRadius: '9999px',
          letterSpacing: '0.2px'
        }}>
          {score === 0 ? 'Not Logged' : score >= 80 ? 'Optimal Score' : score >= 60 ? 'Good Progress' : 'In Progress'}
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
              backgroundColor: i < activeDashes ? '#00D09C' : 'rgba(255, 255, 255, 0.08)',
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
          ? `Log workouts or meals to compute daily health index` 
          : `Calculated from nutrition adherence & training volume for ${profileFirstName}`}
      </p>
    </div>
  );
}
