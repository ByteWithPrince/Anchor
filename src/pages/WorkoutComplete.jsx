import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Award, Clock, Dumbbell, Trophy, Bookmark } from 'lucide-react';
import TopNavbar from '../components/TopNavbar';

export default function WorkoutComplete() {
  const navigate = useNavigate();
  const activeWorkout = useStore(state => state.activeWorkout);
  const finishActiveWorkout = useStore(state => state.finishActiveWorkout);
  const getAllTimePR = useStore(state => state.getAllTimePR);
  const saveWorkoutAsRoutine = useStore(state => state.saveWorkoutAsRoutine);

  const [displayVolume, setDisplayVolume] = useState(0);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState(() => activeWorkout?.name || 'My Custom Workout');
  const [durationMin] = useState(() => {
    return activeWorkout?.startTime 
      ? Math.max(1, Math.round((Date.now() - activeWorkout.startTime) / 60000)) 
      : 38;
  });

  const handleDone = () => {
    if (saveAsTemplate && templateName.trim() && activeWorkout) {
      saveWorkoutAsRoutine(templateName.trim(), activeWorkout.exercises, `Saved from completed session on ${new Date().toLocaleDateString()}`);
    }
    finishActiveWorkout();
    navigate('/');
  };

  const completedSets = activeWorkout ? activeWorkout.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0) : 12;
  const completedExercises = activeWorkout ? activeWorkout.exercises.filter(ex => ex.sets.some(s => s.completed)).length : 3;
  
  const totalVolume = activeWorkout 
    ? activeWorkout.exercises.reduce((acc, ex) => {
        return acc + ex.sets.filter(s => s.completed).reduce((sAcc, s) => {
          return sAcc + ((Number(s.weight) || 0) * (Number(s.reps) || 0));
        }, 0);
      }, 0)
    : 8450;

  // PR Detection
  const prsAchieved = [];
  if (activeWorkout) {
    for (const ex of activeWorkout.exercises) {
      const completedWeights = ex.sets.filter(s => s.completed).map(s => Number(s.weight) || 0);
      if (completedWeights.length > 0) {
        const sessionMax = Math.max(...completedWeights);
        const allTimeMax = getAllTimePR(ex.name);
        if (sessionMax > 0 && sessionMax > allTimeMax) {
          prsAchieved.push({ name: ex.name, weight: sessionMax, previous: allTimeMax });
        }
      }
    }
  }

  // Count-up animation for total volume
  useEffect(() => {
    if (totalVolume === 0) return;
    const duration = 1000;
    const steps = 30;
    const stepTime = duration / steps;
    const increment = totalVolume / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= totalVolume) {
        setDisplayVolume(totalVolume);
        clearInterval(timer);
      } else {
        setDisplayVolume(Math.round(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [totalVolume]);

  return (
    <div className="animate-slide-up" style={{ minHeight: '100vh', paddingBottom: '120px', width: '100%' }}>
      {/* Top Navbar */}
      <TopNavbar />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '560px',
        margin: '20px auto 0 auto',
        textAlign: 'center'
      }}>
        {/* Celebration Trophy Icon */}
        <div 
          className="animate-pop"
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, rgba(0, 208, 156, 0.2) 0%, rgba(178, 224, 64, 0.1) 100%)',
            border: '2px solid #00D09C',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00D09C',
            marginBottom: '24px',
            boxShadow: 'none'
          }}
        >
          <Trophy size={42} strokeWidth={2.4} />
        </div>

        <span style={{ fontSize: '12px', fontWeight: '800', color: '#00D09C', letterSpacing: '1px', textTransform: 'uppercase' }}>
          SESSION COMPLETED
        </span>
        <h1 style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1.5px', color: '#FFFFFF', marginTop: '6px', marginBottom: '8px' }}>
          Great Work!
        </h1>
        <p style={{ fontSize: '15px', color: '#8E8E93', fontWeight: '500', marginBottom: '32px' }}>
          {completedExercises} Exercises · {completedSets} Sets Finished
        </p>

        {/* Stats Grid Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          width: '100%',
          marginBottom: '28px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>
              <Dumbbell size={14} color="#FF7243" /> VOLUME MOVED
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#FF7243', letterSpacing: '-1px', marginTop: '6px' }}>
              {displayVolume.toLocaleString()} <span style={{ fontSize: '14px', color: '#8E8E93', fontWeight: '500' }}>lbs</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>
              <Clock size={14} color="#00D09C" /> TIME ELAPSED
            </div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#00D09C', letterSpacing: '-1px', marginTop: '6px' }}>
              {durationMin} <span style={{ fontSize: '14px', color: '#8E8E93', fontWeight: '500' }}>min</span>
            </div>
          </div>
        </div>

        {/* PR Detection Badges */}
        {prsAchieved.length > 0 && (
          <div style={{
            width: '100%',
            background: 'rgba(255, 114, 67, 0.08)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '20px',
            padding: '20px 24px',
            border: '1px solid rgba(255, 114, 67, 0.3)',
            marginBottom: '28px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF7243', fontWeight: '800', fontSize: '13px', marginBottom: '10px' }}>
              <Award size={18} /> PERSONAL RECORD BROKEN!
            </div>
            {prsAchieved.map((pr, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#FFFFFF', marginTop: '4px' }}>
                <span>{pr.name}</span>
                <span style={{ color: '#00D09C', fontWeight: '700' }}>{pr.weight} lbs (All-Time High)</span>
              </div>
            ))}
          </div>
        )}

        {/* Save as Routine Card */}
        {activeWorkout && (
          <div style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '20px',
            padding: '20px 24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '28px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: saveAsTemplate ? '14px' : '0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bookmark size={18} color="#00D09C" />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>
                  Save as Routine Template
                </span>
              </div>
              <button
                onClick={() => setSaveAsTemplate(!saveAsTemplate)}
                style={{
                  background: saveAsTemplate ? '#00D09C' : 'rgba(255, 255, 255, 0.08)',
                  color: saveAsTemplate ? '#0D0D0D' : '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {saveAsTemplate ? 'Enabled' : 'Save'}
              </button>
            </div>

            {saveAsTemplate && (
              <div className="animate-slide-up" style={{ marginTop: '12px' }}>
                <input
                  type="text"
                  placeholder="Routine name..."
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    color: '#FFFFFF',
                    fontSize: '13px'
                  }}
                />
                <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '6px' }}>
                  This will appear in your custom routines library for 1-tap launching anytime.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Done Button */}
        <button
          onClick={handleDone}
          style={{
            width: '100%',
            background: '#00D09C',
            color: '#0D0D0D',
            fontWeight: '900',
            fontSize: '16px',
            padding: '16px',
            borderRadius: '9999px',
            boxShadow: 'none',
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.2px'
          }}
        >
          RETURN TO DASHBOARD
        </button>
      </div>
    </div>
  );
}
