import { MoreHorizontal, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore, getTodayStr } from '../../store/useStore';

export default function WorkoutGoalsCard() {
  const navigate = useNavigate();
  const plan = useStore(state => state.plan);
  const workoutLogs = useStore(state => state.workoutLogs);
  const activeWorkout = useStore(state => state.activeWorkout);
  const todayStr = getTodayStr();

  // Find all workout logs for today
  const todaySessions = workoutLogs.filter(w => w.date === todayStr);
  const latestSession = todaySessions.length > 0 ? todaySessions[todaySessions.length - 1] : null;
  const isWorkoutInProgress = activeWorkout?.date === todayStr;

  // Day index from weekly schedule
  const dayIdx = new Date().getDay();
  const todayPlannedDay = plan?.schedule?.[dayIdx];

  // Calculate completed sets today
  let completedSetsCount = 0;
  if (todaySessions.length > 0) {
    completedSetsCount = todaySessions.reduce((acc, sess) => {
      const sessCompleted = sess.exercises?.reduce((eAcc, ex) => {
        return eAcc + (ex.sets?.filter(s => s.completed !== false)?.length || 0);
      }, 0) || (sess.totalCompletedSets || 0);
      return acc + sessCompleted;
    }, 0);
  } else if (isWorkoutInProgress) {
    completedSetsCount = activeWorkout.exercises.reduce((acc, ex) => {
      const done = ex.sets?.filter(s => s.completed === true)?.length || 0;
      return acc + done;
    }, 0);
  }

  // Calculate planned sets target for today
  let plannedSetsCount = 0;
  if (todaySessions.length > 0) {
    const sessionPlanned = todaySessions.reduce((acc, sess) => {
      return acc + (sess.totalPlannedSets || sess.exercises?.reduce((ea, ex) => ea + (ex.sets?.length || 0), 0) || 0);
    }, 0);
    plannedSetsCount = Math.max(sessionPlanned, completedSetsCount);
  } else if (isWorkoutInProgress) {
    const activePlanned = activeWorkout.exercises.reduce((acc, ex) => acc + (ex.sets?.length || 0), 0);
    plannedSetsCount = Math.max(activePlanned, 1);
  } else {
    const scheduleSets = todayPlannedDay?.isRest ? 0 : (todayPlannedDay?.exercises?.reduce((acc, ex) => acc + (Number(ex.sets) || 3), 0) || 12);
    plannedSetsCount = scheduleSets;
  }

  // Calculate completion percentage
  let completionPct = 0;
  if (todaySessions.length > 0) {
    completionPct = plannedSetsCount > 0 ? Math.min(100, Math.round((completedSetsCount / plannedSetsCount) * 100)) : 100;
  } else if (isWorkoutInProgress) {
    completionPct = plannedSetsCount > 0 ? Math.min(100, Math.round((completedSetsCount / plannedSetsCount) * 100)) : 0;
  } else {
    completionPct = 0;
  }

  // Circular gauge math (radius 78, circumference = 2 * PI * 78 ≈ 490.09)
  const radius = 78;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionPct / 100) * circumference;

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
      border: 'var(--glass-border)',
      boxShadow: 'var(--glass-shadow)'
    }}>
      {/* Top Header: Title + Session Status + ... Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
            Workout Goals
          </h2>
          {latestSession && (
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              background: 'rgba(0, 208, 156, 0.15)',
              color: '#00D09C',
              padding: '3px 8px',
              borderRadius: '9999px',
              letterSpacing: '0.4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CheckCircle2 size={11} />
              <span>{latestSession.name}</span>
            </span>
          )}
        </div>
        <button 
          aria-label="Goals Options"
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
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Center Circular Ring Gauge */}
      <div 
        onClick={() => navigate('/workout-overview')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          cursor: 'pointer',
          padding: '8px 0'
        }}
      >
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Background Track Circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="#303030"
            strokeWidth={strokeWidth}
          />
          {/* Value Progress Arc (Emerald / Lime) */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={completionPct >= 100 ? '#00D09C' : '#B2E040'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          />
        </svg>

        {/* Center Labels */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          userSelect: 'none'
        }}>
          <div style={{
            fontSize: '38px',
            fontWeight: '800',
            color: '#FFFFFF',
            letterSpacing: '-1.5px',
            lineHeight: 1
          }}>
            {completionPct}%
          </div>
          <div style={{
            fontSize: '13px',
            color: completionPct >= 100 ? '#00D09C' : '#8E8E93',
            fontWeight: '600',
            marginTop: '6px'
          }}>
            {completedSetsCount}/{plannedSetsCount} Completed
          </div>
        </div>
      </div>

      {/* Bottom Motivation Line */}
      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <p style={{
          fontSize: '14px',
          color: '#E0E0E0',
          fontWeight: '500',
          lineHeight: 1.4
        }}>
          {latestSession 
            ? (completionPct >= 100 
                ? `Daily goal smashed! ${latestSession.name} logged.` 
                : `${latestSession.name} logged (${completedSetsCount}/${plannedSetsCount} sets). Keep it up!`)
            : isWorkoutInProgress 
              ? `Session in progress: ${activeWorkout.name}. Tap to resume!`
              : todayPlannedDay?.isRest 
                ? 'Scheduled Rest Day. Prioritize recovery or tap to start a session.' 
                : `Today: ${todayPlannedDay?.name || 'Strength Session'}. Tap to train!`}
        </p>
      </div>
    </div>
  );
}
