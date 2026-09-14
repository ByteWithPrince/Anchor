import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Check, Zap, Disc3, Trophy, Plus, Trash2, Bookmark, Search, X, Dumbbell } from 'lucide-react';
import TopNavbar from '../components/TopNavbar';
import { audioService } from '../services/audioService';
import { progressionService } from '../services/progressionService';
import PlateCalculatorModal from '../components/PlateCalculatorModal';
import SEOHead from '../components/SEOHead';
import { POPULAR_EXERCISES } from '../data/workoutPresets';

export default function LogWorkout() {
  const navigate = useNavigate();
  const activeWorkout = useStore(state => state.activeWorkout);
  const updateActiveWorkout = useStore(state => state.updateActiveWorkout);
  const getPreviousPerformance = useStore(state => state.getPreviousPerformance);
  const addSetToActiveWorkoutExercise = useStore(state => state.addSetToActiveWorkoutExercise);
  const removeSetFromActiveWorkoutExercise = useStore(state => state.removeSetFromActiveWorkoutExercise);
  const removeExerciseFromActiveWorkout = useStore(state => state.removeExerciseFromActiveWorkout);
  const addExerciseToActiveWorkout = useStore(state => state.addExerciseToActiveWorkout);
  const saveWorkoutAsRoutine = useStore(state => state.saveWorkoutAsRoutine);

  useEffect(() => {
    if (!activeWorkout) {
      navigate('/workout-overview');
    }
  }, [activeWorkout, navigate]);

  const [restTime, setRestTime] = useState(0);
  const [defaultRest] = useState(90);
  
  // Plate calculator modal state
  const [plateModalOpen, setPlateModalOpen] = useState(false);
  const [plateModalWeight, setPlateModalWeight] = useState(135);
  const [activeSetTarget, setActiveSetTarget] = useState(null);

  // Add Movement Modal state
  const [addMovementOpen, setAddMovementOpen] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [selectedExName, setSelectedExName] = useState('');
  const [newExSets, setNewExSets] = useState(3);
  const [newExReps, setNewExReps] = useState(10);
  const [newExWeight, setNewExWeight] = useState('');

  // Save as Routine state
  const [saveRoutineOpen, setSaveRoutineOpen] = useState(false);
  const [routineNameInput, setRoutineNameInput] = useState('');
  const [routineSavedSuccess, setRoutineSavedSuccess] = useState(false);

  useEffect(() => {
    if (restTime > 0) {
      const timerId = setInterval(() => {
        setRestTime(prev => {
          if (prev <= 1) {
            audioService.playRestChime();
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              try { navigator.vibrate([100, 50, 100]); } catch {}
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [restTime]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!activeWorkout) return null;

  const updateSet = (exIdx, setIdx, field, value) => {
    const newExs = activeWorkout.exercises.map((ex, i) => {
      if (i !== exIdx) return ex;
      const newSets = ex.sets.map((s, j) => {
        if (j !== setIdx) return s;
        return { ...s, [field]: value };
      });
      return { ...ex, sets: newSets };
    });
    updateActiveWorkout(newExs);
  };

  const toggleComplete = (exIdx, setIdx) => {
    let nowCompleted = false;
    const newExs = activeWorkout.exercises.map((ex, i) => {
      if (i !== exIdx) return ex;
      const newSets = ex.sets.map((s, j) => {
        if (j !== setIdx) return s;
        nowCompleted = !s.completed;
        return { ...s, completed: nowCompleted };
      });
      return { ...ex, sets: newSets };
    });
    updateActiveWorkout(newExs);
    
    if (nowCompleted) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(25); } catch {}
      }
      setRestTime(defaultRest);
    }
  };

  const handleAutoFillTargets = () => {
    const newExs = activeWorkout.exercises.map(ex => {
      const prevSets = getPreviousPerformance(ex.name);
      const suggestion = progressionService.getOverloadSuggestion(prevSets);
      const fallbackWeight = (prevSets && prevSets[0]?.weight) || ex.weight || '';
      const fallbackReps = (prevSets && prevSets[0]?.reps) || ex.reps || 8;

      const updatedSets = ex.sets.map((s, idx) => {
        const prevSet = prevSets && prevSets[idx];
        let calculatedWeight = s.weight;
        if (!calculatedWeight) {
          if (prevSet?.weight) {
            calculatedWeight = suggestion?.type === 'increase' ? Number(prevSet.weight) + 5 : prevSet.weight;
          } else {
            calculatedWeight = fallbackWeight;
          }
        }

        return {
          ...s,
          weight: calculatedWeight,
          reps: s.reps || (prevSet?.reps ? prevSet.reps : fallbackReps)
        };
      });

      return { ...ex, sets: updatedSets };
    });

    updateActiveWorkout(newExs);
    audioService.playTick();
  };

  const handleOpenPlates = (exIdx, setIdx, currentWeight) => {
    setActiveSetTarget({ exIdx, setIdx });
    setPlateModalWeight(Number(currentWeight) || 135);
    setPlateModalOpen(true);
  };

  const handleApplyPlates = (newWeight) => {
    if (activeSetTarget) {
      updateSet(activeSetTarget.exIdx, activeSetTarget.setIdx, 'weight', newWeight);
    }
  };

  const handleComplete = () => {
    // If no sets were individually toggled yet, auto-mark planned sets as completed on finish
    const anyCompleted = activeWorkout.exercises.some(ex => ex.sets?.some(s => s.completed));
    if (!anyCompleted && activeWorkout.exercises.length > 0) {
      const allDone = activeWorkout.exercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(s => ({ ...s, completed: true }))
      }));
      updateActiveWorkout(allDone);
    }
    navigate('/workout-complete');
  };

  const totalCompletedSets = activeWorkout.exercises.reduce((acc, ex) => {
    return acc + (ex.sets?.filter(s => s.completed)?.length || 0);
  }, 0);

  const totalPlannedSets = activeWorkout.exercises.reduce((acc, ex) => {
    return acc + (ex.sets?.length || 0);
  }, 0);

  return (
    <div className="animate-slide-up" style={{ minHeight: '100vh', paddingBottom: '160px', width: '100%' }}>
      <SEOHead
        title="Live Strength Session | Anchor"
        description="Rapid sub-15s strength entry with target autofill, floating rest timer HUD, and Olympic plate calculator."
      />
      {/* Top Navbar */}
      <TopNavbar />

      {/* WORKOUT HEADER BAR */}
      <div 
        className="glass-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-backdrop)',
          WebkitBackdropFilter: 'var(--glass-backdrop)',
          borderRadius: '20px',
          padding: '16px 22px',
          border: 'var(--glass-border)',
          marginBottom: '22px',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigate('/')} 
            title="Return to Dashboard"
            aria-label="Return to Dashboard"
            style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              background: 'rgba(255, 255, 255, 0.08)', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#00D09C', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              ACTIVE SESSION
            </span>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.4px', margin: 0 }}>
              {activeWorkout.name}
            </h1>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Progress pill */}
          <div style={{
            fontSize: '12px',
            fontWeight: '700',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '6px 14px',
            borderRadius: '9999px',
            color: '#FFFFFF'
          }}>
            {totalCompletedSets}/{totalPlannedSets} Sets Done
          </div>

          {/* Save as Routine Button */}
          <button
            onClick={() => {
              setRoutineNameInput(activeWorkout.name || 'Custom Routine');
              setSaveRoutineOpen(true);
            }}
            title="Save current workout exercises as a reusable routine template"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              padding: '8px 14px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Bookmark size={13} color="#00D09C" />
            <span>SAVE TEMPLATE</span>
          </button>

          {/* Auto-Fill Target Overload Button */}
          <button 
            onClick={handleAutoFillTargets}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FF7243',
              color: '#FFFFFF',
              padding: '8px 16px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '800',
              letterSpacing: '0.4px',
              border: 'none',
              boxShadow: 'none',
              cursor: 'pointer'
            }}
          >
            <Zap size={14} /> AUTO-FILL TARGETS
          </button>
        </div>
      </div>

      {/* Routine Saved Banner / Notice */}
      {routineSavedSuccess && (
        <div style={{
          background: 'rgba(0, 208, 156, 0.12)',
          border: '1px solid #00D09C',
          borderRadius: '16px',
          padding: '12px 20px',
          marginBottom: '20px',
          color: '#00D09C',
          fontSize: '13px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Check size={16} strokeWidth={3} />
          <span>Routine saved successfully to your library! You can launch it anytime from Plan Builder or Workout Overview.</span>
        </div>
      )}

      {/* EXERCISES LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {activeWorkout.exercises.map((ex, exIdx) => {
          const prevSets = getPreviousPerformance(ex.name);
          const activeSetIdx = ex.sets.findIndex(s => !s.completed);
          
          return (
            <div 
              key={exIdx}
              className="glass-card"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-backdrop)',
                WebkitBackdropFilter: 'var(--glass-backdrop)',
                borderRadius: '20px',
                padding: '16px 20px',
                border: 'var(--glass-border)',
                boxShadow: 'var(--glass-shadow)'
              }}
            >
              {/* Exercise Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.3px', margin: 0 }}>
                    {ex.name}
                  </h2>
                  {prevSets ? (
                    <div style={{ 
                      fontSize: '11px', 
                      color: 'rgba(255, 255, 255, 0.65)', 
                      background: 'rgba(255, 255, 255, 0.04)',
                      padding: '3px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      Previous: {prevSets.map(s => `${s.weight || 0} lbs × ${s.reps || 0}`).join(' · ')}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '500' }}>
                      First session with this movement
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#E0E0E0',
                    padding: '3px 10px',
                    borderRadius: '9999px'
                  }}>
                    {ex.sets.length} Sets Planned
                  </span>

                  {/* Remove movement button */}
                  {activeWorkout.exercises.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Remove ${ex.name} from this session?`)) {
                          removeExerciseFromActiveWorkout(exIdx);
                        }
                      }}
                      title="Remove exercise from workout"
                      aria-label={`Remove ${ex.name}`}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: 'none',
                        color: '#8E8E93',
                        borderRadius: '8px',
                        padding: '5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Set Table Container with space-efficient width */}
              <div style={{ width: '100%', maxWidth: '840px', margin: '0 auto' }}>
                {/* Column Headers */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 1fr 1fr 44px 28px',
                  gap: '8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#8E8E93',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  padding: '0 8px 6px 8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ textAlign: 'center' }}>SET</div>
                  <div style={{ textAlign: 'center' }}>WEIGHT (LBS)</div>
                  <div style={{ textAlign: 'center' }}>REPS</div>
                  <div style={{ textAlign: 'center' }}>DONE</div>
                  <div></div>
                </div>

                {/* Sets Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                  {ex.sets.map((s, setIdx) => {
                    const isActive = setIdx === activeSetIdx;
                    return (
                      <div 
                        key={setIdx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '40px 1fr 1fr 44px 28px',
                          gap: '8px',
                          alignItems: 'center',
                          background: s.completed 
                            ? 'rgba(0, 208, 156, 0.05)' 
                            : isActive 
                              ? 'rgba(255, 114, 67, 0.07)' 
                              : 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '12px',
                          padding: '6px 10px',
                          border: isActive 
                            ? '1px solid rgba(255, 114, 67, 0.5)' 
                            : s.completed 
                              ? '1px solid rgba(0, 208, 156, 0.25)' 
                              : '1px solid rgba(255, 255, 255, 0.06)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {/* Set Number Pill */}
                        <div style={{ textAlign: 'center' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '800',
                            color: isActive ? '#FF7243' : s.completed ? '#00D09C' : '#8E8E93'
                          }}>
                            {setIdx + 1}
                          </span>
                        </div>

                        {/* Weight Input + Plate Calculator Trigger */}
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder="-"
                            value={s.weight}
                            onChange={e => updateSet(exIdx, setIdx, 'weight', e.target.value)}
                            onFocus={e => e.target.select()}
                            disabled={s.completed}
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              textAlign: 'center',
                              fontSize: '17px',
                              fontWeight: '700',
                              color: '#FFFFFF'
                            }}
                          />
                          {!s.completed && (
                            <button
                              onClick={() => handleOpenPlates(exIdx, setIdx, s.weight)}
                              title="Plate Calculator"
                              aria-label="Open plate calculator"
                              style={{
                                position: 'absolute',
                                right: '4px',
                                opacity: 0.45,
                                color: '#FFFFFF',
                                padding: '4px',
                                cursor: 'pointer',
                                background: 'transparent',
                                border: 'none'
                              }}
                            >
                              <Disc3 size={15} />
                            </button>
                          )}
                        </div>

                        {/* Reps Input */}
                        <div>
                          <input
                            type="number"
                            inputMode="numeric"
                            placeholder="-"
                            value={s.reps}
                            onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                            onFocus={e => e.target.select()}
                            disabled={s.completed}
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              textAlign: 'center',
                              fontSize: '17px',
                              fontWeight: '700',
                              color: '#FFFFFF'
                            }}
                          />
                        </div>

                        {/* Check Button */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button
                            className={s.completed ? 'animate-pop' : ''}
                            onClick={() => toggleComplete(exIdx, setIdx)}
                            aria-label={`Toggle set ${setIdx + 1}`}
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: s.completed ? '#00D09C' : isActive ? 'rgba(255, 114, 67, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                              color: s.completed ? '#0D0D0D' : isActive ? '#FF7243' : '#8E8E93',
                              border: s.completed ? 'none' : isActive ? '1px solid #FF7243' : '1px solid rgba(255, 255, 255, 0.08)',
                              boxShadow: 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            {s.completed && <Check size={18} strokeWidth={3.2} />}
                          </button>
                        </div>

                        {/* Delete Set Button */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          {ex.sets.length > 1 ? (
                            <button
                              onClick={() => removeSetFromActiveWorkoutExercise(exIdx, setIdx)}
                              title="Delete set"
                              aria-label={`Delete set ${setIdx + 1}`}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#666666',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'color 0.15s ease'
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = '#FF7243'}
                              onMouseLeave={e => e.currentTarget.style.color = '#666666'}
                            >
                              <Trash2 size={13} />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Set Button for this exercise */}
                <button
                  onClick={() => addSetToActiveWorkoutExercise(exIdx)}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '7px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px dashed rgba(255, 255, 255, 0.12)',
                    color: '#C0C0C0',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                >
                  <Plus size={13} />
                  <span>Add Set</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Global Add Movement Button */}
        <button
          onClick={() => {
            setSelectedExName('');
            setExerciseSearch('');
            setNewExSets(3);
            setNewExReps(10);
            setNewExWeight('');
            setAddMovementOpen(true);
          }}
          style={{
            width: '100%',
            padding: '16px 20px',
            borderRadius: '20px',
            background: 'rgba(0, 208, 156, 0.08)',
            border: '1px dashed #00D09C',
            color: '#00D09C',
            fontSize: '14px',
            fontWeight: '800',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 208, 156, 0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 208, 156, 0.08)'}
        >
          <Plus size={18} strokeWidth={2.8} />
          <span>+ ADD MOVEMENT / EXERCISE</span>
        </button>
      </div>

      {/* FLOATING ACTIVE REST TIMER HUD */}
      {restTime > 0 && (
        <div 
          className="glass-card animate-slide-up"
          style={{
            position: 'fixed',
            bottom: '90px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 35,
            width: 'calc(100% - 32px)',
            maxWidth: '520px',
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-backdrop)',
            WebkitBackdropFilter: 'var(--glass-backdrop)',
            border: '1px solid rgba(255, 114, 67, 0.4)',
            borderRadius: '20px',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--glass-shadow)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#FF7243',
              boxShadow: '0 0 10px #FF7243'
            }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>RESTING</div>
              <div style={{ fontSize: '20px', fontWeight: '900', color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(restTime)}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setRestTime(prev => prev + 30)}
              style={{
                fontSize: '11px',
                fontWeight: '700',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#FFFFFF',
                padding: '8px 14px',
                borderRadius: '9999px'
              }}
            >
              +30s
            </button>
            <button
              onClick={() => setRestTime(0)}
              style={{
                fontSize: '11px',
                fontWeight: '700',
                background: '#FF7243',
                color: '#FFFFFF',
                padding: '8px 16px',
                borderRadius: '9999px',
                boxShadow: '0 2px 8px rgba(255, 114, 67, 0.35)'
              }}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* FINISH WORKOUT FIXED BOTTOM ACTION */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'transparent',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 30
      }}>
        <button
          onClick={handleComplete}
          style={{
            maxWidth: '600px',
            width: '100%',
            background: '#00D09C',
            color: '#161616',
            fontWeight: '900',
            fontSize: '16px',
            padding: '16px 24px',
            borderRadius: '9999px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: 'none',
            border: 'none',
            letterSpacing: '0.2px',
            cursor: 'pointer',
            pointerEvents: 'auto'
          }}
        >
          <Trophy size={18} strokeWidth={2.8} />
          <span>COMPLETE WORKOUT ({totalCompletedSets}/{totalPlannedSets})</span>
        </button>
      </div>

      {/* Plate Calculator Modal */}
      <PlateCalculatorModal
        isOpen={plateModalOpen}
        onClose={() => setPlateModalOpen(false)}
        targetWeight={plateModalWeight}
        onApply={handleApplyPlates}
      />

      {/* ADD MOVEMENT / EXERCISE MODAL */}
      {addMovementOpen && typeof document !== 'undefined' && createPortal(
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
            padding: '20px'
          }}
          onClick={() => setAddMovementOpen(false)}
        >
          <div 
            className="animate-scale-in"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%), rgba(18, 22, 30, 0.52)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              borderRadius: '26px',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderTop: '1.5px solid rgba(255, 255, 255, 0.3)',
              width: '100%',
              maxWidth: '520px',
              padding: '28px',
              boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
                  <Dumbbell size={18} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF' }}>Add Movement</h3>
              </div>
              <button
                onClick={() => setAddMovementOpen(false)}
                aria-label="Close modal"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#8E8E93',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Search Input */}
            <div style={{
              position: 'relative',
              marginBottom: '16px'
            }}>
              <Search size={16} color="#8E8E93" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search popular movements..."
                value={exerciseSearch}
                onChange={e => {
                  setExerciseSearch(e.target.value);
                  setSelectedExName(e.target.value);
                }}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  padding: '12px 14px 12px 40px',
                  color: '#FFFFFF',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Popular Suggestions Chips */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Quick Suggestions
              </span>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '8px',
                maxHeight: '120px',
                overflowY: 'auto'
              }}>
                {POPULAR_EXERCISES
                  .filter(item => !exerciseSearch || item.toLowerCase().includes(exerciseSearch.toLowerCase()))
                  .slice(0, 10)
                  .map(item => (
                    <button
                      key={item}
                      onClick={() => setSelectedExName(item)}
                      style={{
                        background: selectedExName === item ? '#00D09C' : 'rgba(255, 255, 255, 0.08)',
                        color: selectedExName === item ? '#0D0D0D' : '#E0E0E0',
                        border: selectedExName === item ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '9999px',
                        padding: '6px 12px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {item}
                    </button>
                  ))}
              </div>
            </div>

            {/* Custom Exercise Name Input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '6px' }}>
                Exercise Name
              </label>
              <input
                type="text"
                placeholder="e.g. Incline DB Hammer Curl"
                value={selectedExName}
                onChange={e => setSelectedExName(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              />
            </div>

            {/* Sets, Reps & Weight Configuration */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '12px',
              marginBottom: '24px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Planned Sets
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={newExSets}
                  onChange={e => setNewExSets(Math.max(1, Number(e.target.value) || 1))}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '10px',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '800'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Target Reps
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newExReps}
                  onChange={e => setNewExReps(Math.max(1, Number(e.target.value) || 1))}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '10px',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '800'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  placeholder="Optional"
                  value={newExWeight}
                  onChange={e => setNewExWeight(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '10px',
                    color: '#FFFFFF',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '800'
                  }}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setAddMovementOpen(false)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#8E8E93',
                  padding: '14px',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                disabled={!selectedExName.trim()}
                onClick={() => {
                  if (!selectedExName.trim()) return;
                  addExerciseToActiveWorkout({
                    name: selectedExName.trim(),
                    sets: Number(newExSets) || 3,
                    reps: Number(newExReps) || 10,
                    weight: newExWeight ? Number(newExWeight) : ''
                  });
                  setAddMovementOpen(false);
                }}
                style={{
                  flex: 2,
                  background: selectedExName.trim() ? '#00D09C' : 'rgba(255, 255, 255, 0.1)',
                  color: selectedExName.trim() ? '#0D0D0D' : '#666666',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: selectedExName.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={16} strokeWidth={2.8} />
                <span>Add to Session</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* SAVE WORKOUT AS ROUTINE MODAL */}
      {saveRoutineOpen && typeof document !== 'undefined' && createPortal(
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
            padding: '20px'
          }}
          onClick={() => setSaveRoutineOpen(false)}
        >
          <div 
            className="animate-scale-in"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%), rgba(18, 22, 30, 0.52)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              borderRadius: '26px',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderTop: '1.5px solid rgba(255, 255, 255, 0.3)',
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
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
                  <Bookmark size={18} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF' }}>Save As Routine</h3>
              </div>
              <button
                onClick={() => setSaveRoutineOpen(false)}
                aria-label="Close modal"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#8E8E93',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#8E8E93', marginBottom: '20px', lineHeight: '1.5' }}>
              Save all exercises and target set configurations from this workout as a reusable template in your library.
            </p>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '8px' }}>
                Template Name
              </label>
              <input
                type="text"
                placeholder="e.g. Push Hypertrophy A"
                value={routineNameInput}
                onChange={e => setRoutineNameInput(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '14px',
                  padding: '14px',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: '700'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setSaveRoutineOpen(false)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#8E8E93',
                  padding: '14px',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                disabled={!routineNameInput.trim()}
                onClick={() => {
                  if (!routineNameInput.trim()) return;
                  saveWorkoutAsRoutine(routineNameInput.trim(), activeWorkout.exercises, `Saved from session on ${new Date().toLocaleDateString()}`);
                  setSaveRoutineOpen(false);
                  setRoutineSavedSuccess(true);
                  setTimeout(() => setRoutineSavedSuccess(false), 4000);
                }}
                style={{
                  flex: 2,
                  background: routineNameInput.trim() ? '#00D09C' : 'rgba(255, 255, 255, 0.1)',
                  color: routineNameInput.trim() ? '#0D0D0D' : '#666666',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '14px',
                  fontSize: '14px',
                  fontWeight: '800',
                  cursor: routineNameInput.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                Save Template
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
