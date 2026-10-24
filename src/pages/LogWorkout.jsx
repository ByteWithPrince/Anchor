import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Check, Zap, Disc3, Trophy, Plus, Trash2, Bookmark, Search, X, Dumbbell } from 'lucide-react';
import TopNavbar from '../components/TopNavbar';
import { audioService } from '../services/audioService';
import { haptics } from '../services/haptics';
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
  const [templateSaved, setTemplateSaved] = useState(false);
  const [autoRegToast, setAutoRegToast] = useState(null);

  useEffect(() => {
    if (restTime > 0) {
      const timerId = setInterval(() => {
        setRestTime(prev => {
          if (prev <= 1) {
            audioService.playRestChime();
            haptics.timerComplete();
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

  const applyAutoregulation = (exIdx, setIdx, exertionRating) => {
    const ex = activeWorkout.exercises[exIdx];
    if (!ex) return;
    const currentSet = ex.sets[setIdx];
    if (!currentSet) return;

    const prevSets = getPreviousPerformance(ex.name);
    const baseline = getBaselineForExercise(ex.name);
    const targetReps = Number(currentSet.plannedReps || (prevSets && prevSets[setIdx]?.reps) || ex.reps || baseline.reps || 8);
    const actualReps = Number(currentSet.reps) || targetReps;
    const currentWeight = Number(currentSet.weight) || (prevSets && prevSets[setIdx]?.weight) || baseline.weight || 20;

    const adjustment = progressionService.getInWorkoutAutoregulation({
      currentWeight,
      targetReps,
      actualReps,
      exertion: exertionRating || currentSet.exertion
    });

    if (adjustment) {
      const newExs = activeWorkout.exercises.map((e, i) => {
        if (i !== exIdx) return e;
        const newSets = e.sets.map((s, j) => {
          if (j === setIdx) {
            return { ...s, exertion: exertionRating };
          }
          if (j > setIdx && !s.completed) {
            return { ...s, weight: adjustment.newWeight };
          }
          return s;
        });
        return { ...e, sets: newSets };
      });

      updateActiveWorkout(newExs);
      setAutoRegToast({
        action: adjustment.action,
        message: adjustment.message
      });
      setTimeout(() => setAutoRegToast(null), 5000);
    } else if (exertionRating) {
      updateSet(exIdx, setIdx, 'exertion', exertionRating);
    }
  };

  const toggleComplete = (exIdx, setIdx) => {
    let nowCompleted = false;
    let completedSetObj = null;
    const newExs = activeWorkout.exercises.map((ex, i) => {
      if (i !== exIdx) return ex;
      const prevSets = getPreviousPerformance(ex.name);
      const baseline = getBaselineForExercise(ex.name);
      const newSets = ex.sets.map((s, j) => {
        if (j !== setIdx) return s;
        nowCompleted = !s.completed;

        let setWeight = s.weight;
        let setReps = s.reps;

        if (nowCompleted) {
          const isWeightEmpty = (setWeight === '' || setWeight === undefined || setWeight === null || Number(setWeight) === 0);
          if (isWeightEmpty) {
            const currentSessionPrevWeight = j > 0 ? ex.sets[j - 1]?.weight : null;
            const prevWeight = (currentSessionPrevWeight && Number(currentSessionPrevWeight) > 0)
              ? currentSessionPrevWeight
              : (prevSets?.[j]?.weight || prevSets?.[0]?.weight);
            const templateWeight = ex.weight;
            const fallbackWeight = baseline?.weight !== undefined && Number(baseline.weight) > 0 ? baseline.weight : 20;

            if (prevWeight !== undefined && prevWeight !== '' && Number(prevWeight) > 0) {
              setWeight = prevWeight;
            } else if (templateWeight !== undefined && templateWeight !== '' && Number(templateWeight) > 0) {
              setWeight = templateWeight;
            } else {
              setWeight = fallbackWeight;
            }
          }

          if (setReps === '' || setReps === undefined || setReps === null) {
            const prevReps = prevSets?.[j]?.reps || prevSets?.[0]?.reps;
            setReps = s.plannedReps || prevReps || ex.reps || baseline?.reps || 8;
          }
        }

        completedSetObj = { ...s, weight: setWeight, reps: setReps, completed: nowCompleted };
        return completedSetObj;
      });
      return { ...ex, sets: newSets };
    });
    updateActiveWorkout(newExs);
    
    if (nowCompleted) {
      haptics.setComplete();
      setRestTime(defaultRest);

      // Automated Objective Failure Detection: if actual reps missed target by >= 2
      const ex = activeWorkout.exercises[exIdx];
      if (ex && completedSetObj) {
        const prevSets = getPreviousPerformance(ex.name);
        const baseline = getBaselineForExercise(ex.name);
        const targetReps = Number(completedSetObj.plannedReps || (prevSets && prevSets[setIdx]?.reps) || ex.reps || baseline.reps || 8);
        const actualReps = Number(completedSetObj.reps) || targetReps;
        
        if (targetReps - actualReps >= 2) {
          applyAutoregulation(exIdx, setIdx, 'failed');
        }
      }
    }
  };

  const getBaselineForExercise = (exerciseName) => {
    if (!exerciseName) return { weight: 20, reps: 8 };
    const lower = exerciseName.toLowerCase();
    if (lower.includes('squat')) return { weight: 60, reps: 8 };
    if (lower.includes('deadlift')) return { weight: 80, reps: 5 };
    if (lower.includes('bench press')) return { weight: 60, reps: 8 };
    if (lower.includes('overhead press') || lower.includes('shoulder press') || lower.includes('ohp')) return { weight: 40, reps: 8 };
    if (lower.includes('barbell row') || lower.includes('bent over row')) return { weight: 50, reps: 8 };
    if (lower.includes('incline dumbbell') || lower.includes('dumbbell bench') || lower.includes('dumbbell press')) return { weight: 20, reps: 10 };
    if (lower.includes('pull-up') || lower.includes('pull up') || lower.includes('chin-up') || lower.includes('dip')) return { weight: 0, reps: 8 };
    if (lower.includes('curl')) return { weight: 14, reps: 10 };
    if (lower.includes('pushdown') || lower.includes('extension')) return { weight: 20, reps: 12 };
    if (lower.includes('lateral raise') || lower.includes('fly')) return { weight: 10, reps: 12 };
    if (lower.includes('leg press')) return { weight: 100, reps: 10 };
    if (lower.includes('lunge')) return { weight: 16, reps: 10 };
    return { weight: 20, reps: 8 };
  };

  const handleAutoFillTargets = () => {
    const newExs = activeWorkout.exercises.map(ex => {
      const prevSets = getPreviousPerformance(ex.name);
      const suggestion = progressionService.getOverloadSuggestion(prevSets);
      const baseline = getBaselineForExercise(ex.name);

      const fallbackWeight = (prevSets && prevSets[0]?.weight) || (ex.weight ? ex.weight : baseline.weight);
      const fallbackReps = (prevSets && prevSets[0]?.reps) || (ex.reps ? ex.reps : baseline.reps);

      const updatedSets = ex.sets.map((s, idx) => {
        const prevSet = prevSets && prevSets[idx];
        let calculatedWeight = s.weight;
        if (!calculatedWeight && calculatedWeight !== 0) {
          if (prevSet?.weight !== undefined && prevSet?.weight !== '') {
            calculatedWeight = suggestion?.type === 'increase' ? Number(prevSet.weight) + 2.5 : prevSet.weight;
          } else {
            calculatedWeight = fallbackWeight;
          }
        }

        return {
          ...s,
          weight: (calculatedWeight !== undefined && calculatedWeight !== '') ? calculatedWeight : fallbackWeight,
          reps: s.reps || (prevSet?.reps ? prevSet.reps : fallbackReps),
          completed: true
        };
      });

      return { ...ex, sets: updatedSets };
    });

    updateActiveWorkout(newExs);
    setRestTime(0);
    audioService.playCompletion();
  };

  const handleOpenPlates = (exIdx, setIdx, currentWeight) => {
    setActiveSetTarget({ exIdx, setIdx });
    setPlateModalWeight(Number(currentWeight) || 60);
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
      const allDone = activeWorkout.exercises.map(ex => {
        const prevSets = getPreviousPerformance(ex.name);
        const baseline = getBaselineForExercise(ex.name);
        return {
          ...ex,
          sets: ex.sets.map((s, j) => {
            const isWeightEmpty = (s.weight === '' || s.weight === undefined || s.weight === null || Number(s.weight) === 0);
            const currentSessionPrevWeight = j > 0 ? ex.sets[j - 1]?.weight : null;
            const prevWeight = (currentSessionPrevWeight && Number(currentSessionPrevWeight) > 0)
              ? currentSessionPrevWeight
              : (prevSets?.[j]?.weight || prevSets?.[0]?.weight);
            const templateWeight = ex.weight;
            const fallbackWeight = baseline?.weight !== undefined && Number(baseline.weight) > 0 ? baseline.weight : 20;
            const weight = !isWeightEmpty ? s.weight : ((prevWeight && Number(prevWeight) > 0) ? prevWeight : ((templateWeight && Number(templateWeight) > 0) ? templateWeight : fallbackWeight));
            const reps = (s.reps !== '' && s.reps !== undefined && s.reps !== null)
              ? s.reps
              : (s.plannedReps || prevSets?.[j]?.reps || ex.reps || baseline?.reps || 8);
            return { ...s, weight, reps, completed: true };
          })
        };
      });
      updateActiveWorkout(allDone);
    } else {
      // Auto-sanitize any completed set with empty/0 weight so volume moved is never accidentally 0 kg
      const sanitized = activeWorkout.exercises.map(ex => {
        const prevSets = getPreviousPerformance(ex.name);
        const baseline = getBaselineForExercise(ex.name);
        return {
          ...ex,
          sets: ex.sets.map((s, j) => {
            if (!s.completed) return s;
            const isWeightEmpty = (s.weight === '' || s.weight === undefined || s.weight === null || Number(s.weight) === 0);
            if (isWeightEmpty) {
              const currentSessionPrevWeight = j > 0 ? ex.sets[j - 1]?.weight : null;
              const prevWeight = (currentSessionPrevWeight && Number(currentSessionPrevWeight) > 0)
                ? currentSessionPrevWeight
                : (prevSets?.[j]?.weight || prevSets?.[0]?.weight);
              const templateWeight = ex.weight;
              const fallbackWeight = baseline?.weight !== undefined && Number(baseline.weight) > 0 ? baseline.weight : 20;
              const weight = (prevWeight && Number(prevWeight) > 0)
                ? prevWeight
                : ((templateWeight && Number(templateWeight) > 0) ? templateWeight : fallbackWeight);
              return { ...s, weight };
            }
            return s;
          })
        };
      });
      updateActiveWorkout(sanitized);
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

      {/* Auto-Regulation In-Workout Notification */}
      {autoRegToast && (
        <div style={{
          background: autoRegToast.action === 'boost' ? 'rgba(0, 208, 156, 0.95)' : 'rgba(255, 114, 67, 0.95)',
          color: '#0D0D0D',
          padding: '12px 20px',
          borderRadius: '16px',
          fontWeight: '700',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          marginBottom: '18px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{autoRegToast.message}</span>
          </div>
          <button
            onClick={() => setAutoRegToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#0D0D0D',
              fontWeight: '800',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ✕
          </button>
        </div>
      )}

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
            onClick={() => navigate('/dashboard')} 
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
              background: (templateSaved || routineSavedSuccess) ? 'rgba(0, 208, 156, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              border: (templateSaved || routineSavedSuccess) ? '1px solid rgba(0, 208, 156, 0.4)' : '1px solid rgba(255, 255, 255, 0.12)',
              color: (templateSaved || routineSavedSuccess) ? '#00D09C' : '#FFFFFF',
              padding: '8px 14px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Bookmark 
              size={13} 
              color="#00D09C" 
              fill={(templateSaved || routineSavedSuccess) ? "#00D09C" : "none"} 
            />
            <span>{(templateSaved || routineSavedSuccess) ? 'TEMPLATE SAVED ✓' : 'SAVE TEMPLATE'}</span>
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
                      Previous: {prevSets.map(s => `${s.weight || 0} kg × ${s.reps || 0}`).join(' · ')}
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
                  gridTemplateColumns: '32px 1fr 1fr 44px 28px',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#8E8E93',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  padding: '0 4px 6px 4px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ textAlign: 'center' }}>SET</div>
                  <div style={{ textAlign: 'center' }}>WEIGHT (KG)</div>
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
                          display: 'flex',
                          flexDirection: 'column',
                          background: s.completed 
                            ? 'rgba(16, 185, 129, 0.08)' 
                            : isActive 
                              ? 'rgba(16, 185, 129, 0.06)' 
                              : 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '14px',
                          border: isActive 
                            ? '1px solid rgba(16, 185, 129, 0.4)' 
                            : s.completed 
                              ? '1px solid rgba(16, 185, 129, 0.25)' 
                              : '1px solid rgba(255, 255, 255, 0.06)',
                          transition: 'all 0.2s ease',
                          overflow: 'hidden'
                        }}
                      >
                        {/* 5-Column Set Inputs Row */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '32px 1fr 1fr 44px 28px',
                            gap: '6px',
                            alignItems: 'center',
                            padding: '6px 6px'
                          }}
                        >
                          {/* Set Number Pill */}
                          <div style={{ textAlign: 'center' }}>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: '800',
                              color: isActive ? '#10B981' : s.completed ? '#10B981' : '#8E8E93'
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
                                color: '#FFFFFF',
                                paddingRight: !s.completed ? '36px' : '0'
                              }}
                            />
                            {!s.completed && (
                              <button
                                onClick={() => handleOpenPlates(exIdx, setIdx, s.weight)}
                                title="Plate Calculator"
                                aria-label="Open plate calculator"
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  width: '44px',
                                  height: '44px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  opacity: 0.5,
                                  color: '#FFFFFF',
                                  cursor: 'pointer',
                                  background: 'transparent',
                                  border: 'none'
                                }}
                              >
                                <Disc3 size={16} />
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

                          {/* Check Button (44px x 44px hit area) */}
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <button
                              className={s.completed ? 'animate-pop' : ''}
                              onClick={() => toggleComplete(exIdx, setIdx)}
                              aria-label={`Toggle set ${setIdx + 1}`}
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: s.completed ? '#10B981' : isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                color: s.completed ? '#0D0D0D' : isActive ? '#10B981' : '#8E8E93',
                                border: s.completed ? 'none' : isActive ? '1px solid #10B981' : '1px solid rgba(255, 255, 255, 0.08)',
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

                        {/* Full-Width Linear Exertion Rating Bar */}
                        {s.completed && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 14px 8px 14px',
                            background: 'rgba(0, 0, 0, 0.25)',
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                            flexWrap: 'wrap',
                            gap: '8px'
                          }}>
                            <span style={{ color: '#8E8E93', fontSize: '11px', fontWeight: '700', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                              Exertion:
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap', overflowX: 'auto' }}>
                              {[
                                { key: 'easy', label: '🟢 Easy (+2.5kg)', activeColor: '#00D09C', desc: 'Auto-boost' },
                                { key: 'target', label: '🎯 Good', activeColor: '#FFFFFF', desc: 'On target' },
                                { key: 'hard', label: '🔴 Hard', activeColor: '#FF9066', desc: 'Near failure' },
                                { key: 'failed', label: '⚠️ Failed (-2.5kg)', activeColor: '#FF7243', desc: 'Auto-deload' }
                              ].map(item => {
                                const isSelectedExertion = s.exertion === item.key;
                                return (
                                  <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => applyAutoregulation(exIdx, setIdx, item.key)}
                                    title={item.desc}
                                    style={{
                                      background: isSelectedExertion ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.04)',
                                      border: isSelectedExertion ? `1.5px solid ${item.activeColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                                      borderRadius: '9999px',
                                      padding: '3px 10px',
                                      color: isSelectedExertion ? item.activeColor : '#A0A0A0',
                                      fontSize: '11px',
                                      fontWeight: isSelectedExertion ? '800' : '600',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                      whiteSpace: 'nowrap',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    {item.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
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

      {/* CENTERED ACTIVE REST TIMER WITH FULLSCREEN HEAVY BLUR OVERLAY */}
      {restTime > 0 && (
        <div 
          className="modal-overlay animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(36px) saturate(180%)',
            WebkitBackdropFilter: 'blur(36px) saturate(180%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
          onClick={() => setRestTime(0)}
        >
          <div 
            className="modal-bottom-sheet glass-modal animate-scale-in"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%), rgba(18, 22, 30, 0.88)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              borderRadius: '28px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderTop: '1.5px solid rgba(16, 185, 129, 0.6)',
              width: '100%',
              maxWidth: '400px',
              padding: '36px 28px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.15)'
            }}
          >
            {/* Top Indicator */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '6px 14px',
              borderRadius: '9999px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                boxShadow: '0 0 8px #10B981'
              }} />
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#10B981', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                Resting Recovery Interval
              </span>
            </div>

            {/* Giant Countdown Clock */}
            <div style={{
              fontSize: '64px',
              fontWeight: '900',
              color: '#FFFFFF',
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-1px',
              lineHeight: '1',
              marginBottom: '10px',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              {formatTime(restTime)}
            </div>

            <p style={{ fontSize: '13px', color: '#8E8E93', marginBottom: '28px' }}>
              Breathe and reset before your next set.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button
                onClick={() => setRestTime(prev => prev + 30)}
                style={{
                  flex: 1,
                  fontSize: '13px',
                  fontWeight: '700',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  padding: '12px 18px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
              >
                +30s Add Time
              </button>
              <button
                onClick={() => setRestTime(0)}
                style={{
                  flex: 1.3,
                  fontSize: '13px',
                  fontWeight: '800',
                  background: '#FF7243',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '12px 20px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  boxShadow: 'none',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Skip / Ready Now
              </button>
            </div>
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
                  Weight (kg)
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
                  setTemplateSaved(true);
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
