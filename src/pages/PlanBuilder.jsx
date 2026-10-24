import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Calendar, 
  Target, 
  Scale, 
  Check, 
  Sparkles, 
  Dumbbell, 
  Play, 
  X, 
  CheckCircle2, 
  Flame 
} from 'lucide-react';
import TopNavbar from '../components/TopNavbar';
import SEOHead from '../components/SEOHead';
import { WORKOUT_PRESETS, POPULAR_EXERCISES } from '../data/workoutPresets';

export default function PlanBuilder() {
  const navigate = useNavigate();
  const plan = useStore(state => state.plan);
  const updatePlan = useStore(state => state.updatePlan);
  const addWeightLog = useStore(state => state.addWeightLog);
  const completeSetup = useStore(state => state.completeSetup);
  const activePresetId = useStore(state => state.activePresetId);
  const applyPresetPlan = useStore(state => state.applyPresetPlan);
  const customRoutines = useStore(state => state.customRoutines) || [];
  const addCustomRoutine = useStore(state => state.addCustomRoutine);
  const deleteCustomRoutine = useStore(state => state.deleteCustomRoutine);
  const startWorkout = useStore(state => state.startWorkout);

  const [currentTab, setCurrentTab] = useState('presets'); // 'presets' | 'schedule' | 'routines'
  const [toastMessage, setToastMessage] = useState(null);

  // Weekly Schedule & Macro State
  const [targets, setTargets] = useState({ ...plan.macroTargets });
  const [schedule, setSchedule] = useState(JSON.parse(JSON.stringify(plan.schedule)));
  const [activeDay, setActiveDay] = useState(new Date().getDay());
  const [weight, setWeight] = useState('');
  const [weightDate, setWeightDate] = useState(new Date().toLocaleDateString('en-CA'));

  // Custom Routine Creator State
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDesc, setNewRoutineDesc] = useState('');
  const [newRoutineExercises, setNewRoutineExercises] = useState([
    { id: '1', name: 'Barbell Bench Press', sets: 4, reps: 8, weight: '' },
    { id: '2', name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: '' },
    { id: '3', name: 'Cable Lateral Raise', sets: 4, reps: 12, weight: '' }
  ]);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApplyPreset = (presetId) => {
    applyPresetPlan(presetId);
    const found = WORKOUT_PRESETS.find(p => p.id === presetId);
    if (found) {
      setSchedule(JSON.parse(JSON.stringify(found.schedule)));
      showToast(`Applied "${found.name}" to your 7-day schedule!`);
    }
  };

  const handleSave = () => {
    updatePlan({
      macroTargets: {
        calories: Number(targets.calories),
        protein: Number(targets.protein),
        carbs: Number(targets.carbs),
        fat: Number(targets.fat)
      },
      schedule
    });
    if (weight) {
      addWeightLog(Number(weight), weightDate);
    }
    completeSetup();
    showToast('Weekly Plan & Nutrition targets saved successfully!');
    setTimeout(() => navigate('/workout-overview'), 800);
  };

  const updateActiveDay = (field, value) => {
    setSchedule({
      ...schedule,
      [activeDay]: { ...schedule[activeDay], [field]: value }
    });
  };

  const addExercise = () => {
    const newEx = { id: crypto.randomUUID(), name: '', sets: 3, reps: 10, weight: '' };
    updateActiveDay('exercises', [...schedule[activeDay].exercises, newEx]);
  };

  const updateExercise = (index, field, value) => {
    const updated = [...schedule[activeDay].exercises];
    updated[index] = { ...updated[index], [field]: value };
    updateActiveDay('exercises', updated);
  };

  const removeExercise = (index) => {
    const updated = schedule[activeDay].exercises.filter((_, i) => i !== index);
    updateActiveDay('exercises', updated);
  };

  // Routine builder helpers
  const handleAddMovementToNewRoutine = (exerciseName = '') => {
    setNewRoutineExercises(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: exerciseName || '', sets: 3, reps: 10, weight: '' }
    ]);
  };

  const handleUpdateNewRoutineExercise = (index, field, value) => {
    setNewRoutineExercises(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveNewRoutineExercise = (index) => {
    setNewRoutineExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveCustomRoutine = () => {
    if (!newRoutineName.trim()) return;
    const validExercises = newRoutineExercises.filter(ex => ex.name.trim().length > 0);
    if (validExercises.length === 0) {
      alert('Please add at least one exercise to your custom routine.');
      return;
    }
    addCustomRoutine({
      name: newRoutineName.trim(),
      description: newRoutineDesc.trim() || 'Custom user training routine',
      exercises: validExercises
    });
    setIsCreatingRoutine(false);
    setNewRoutineName('');
    setNewRoutineDesc('');
    showToast(`Saved "${newRoutineName.trim()}" to your custom routines!`);
  };

  const handleStartRoutine = (routine) => {
    startWorkout(routine.name, routine.exercises);
    navigate('/log-workout');
  };

  const dayData = schedule[activeDay] || { isRest: true, name: 'Rest', exercises: [] };

  return (
    <div className="animate-slide-up" style={{ minHeight: '100vh', paddingBottom: '160px', width: '100%' }}>
      <SEOHead
        title="Plan Builder & Split Architecture | Anchor"
        description="Choose curated preset workout splits, customize weekly schedules, or define standalone personal routines."
      />
      {/* Top Navbar */}
      <TopNavbar />

      <div style={{ width: '100%' }}>
        {/* Sub-Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#00D09C', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              TRAINING ARCHITECTURE & PRESETS
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.8px', marginTop: '4px' }}>
              Plan & Split Builder
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/workout-overview')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                borderRadius: '9999px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <Dumbbell size={15} color="#00D09C" />
              <span>Session Launcher</span>
            </button>
            <button 
              onClick={() => navigate('/dashboard')} 
              style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: '50%', 
                background: 'rgba(255, 255, 255, 0.06)', 
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#FFFFFF',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={18} />
            </button>
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {toastMessage && (
          <div className="animate-scale-in" style={{
            background: 'linear-gradient(135deg, rgba(0, 208, 156, 0.15) 0%, rgba(33, 33, 33, 0.9) 100%)',
            border: '1px solid #00D09C',
            borderRadius: '16px',
            padding: '14px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#FFFFFF',
            fontSize: '14px',
            boxShadow: '0 8px 24px rgba(0, 208, 156, 0.15)'
          }}>
            <Sparkles size={18} color="#00D09C" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 3-TAB NAVIGATION BAR */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'var(--glass-backdrop)',
          WebkitBackdropFilter: 'var(--glass-backdrop)',
          borderRadius: '20px',
          padding: '6px',
          marginBottom: '28px',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
        }}>
          <button
            onClick={() => setCurrentTab('presets')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '16px',
              background: currentTab === 'presets' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: currentTab === 'presets' ? '#00D09C' : '#A0A0A5',
              border: currentTab === 'presets' ? '1px solid rgba(0, 208, 156, 0.25)' : '1px solid transparent',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={16} />
            <span>Preset Splits</span>
          </button>

          <button
            onClick={() => setCurrentTab('schedule')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '16px',
              background: currentTab === 'schedule' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: currentTab === 'schedule' ? '#00D09C' : '#A0A0A5',
              border: currentTab === 'schedule' ? '1px solid rgba(0, 208, 156, 0.25)' : '1px solid transparent',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Calendar size={16} />
            <span>Weekly Schedule</span>
          </button>

          <button
            onClick={() => setCurrentTab('routines')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '16px',
              background: currentTab === 'routines' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
              color: currentTab === 'routines' ? '#00D09C' : '#A0A0A5',
              border: currentTab === 'routines' ? '1px solid rgba(0, 208, 156, 0.25)' : '1px solid transparent',
              fontSize: '14px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <Dumbbell size={16} />
            <span>My Custom Routines ({customRoutines.length})</span>
          </button>
        </div>

        {/* TAB 1: PRESET SPLITS CATALOG */}
        {currentTab === 'presets' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ marginBottom: '4px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF' }}>
                Curated Training Architectures
              </h2>
              <p style={{ fontSize: '13px', color: '#8E8E93', marginTop: '4px' }}>
                Select any preset split below. Tapping <strong>Apply Plan</strong> automatically populates your weekly 7-day schedule with battle-tested exercises, sets, and rep targets.
              </p>
            </div>

            <div className="preset-splits-grid">
              {WORKOUT_PRESETS.map(preset => {
                const isActive = activePresetId === preset.id;
                const daysBreakdown = Object.entries(preset.schedule).filter(([, val]) => !val.isRest);

                return (
                  <div
                    key={preset.id}
                    className="glass-card"
                    style={{
                      background: 'var(--glass-bg)',
                      backdropFilter: 'var(--glass-backdrop)',
                      WebkitBackdropFilter: 'var(--glass-backdrop)',
                      borderRadius: '24px',
                      padding: '24px',
                      border: isActive ? '1.5px solid #00D09C' : 'var(--glass-border)',
                      boxShadow: 'var(--glass-shadow)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      {/* Top Badges */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          background: 'rgba(255, 114, 67, 0.15)',
                          color: '#FF7243',
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          textTransform: 'uppercase'
                        }}>
                          {preset.daysPerWeek} Days / Week
                        </span>

                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: '#A0A0A5',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          padding: '4px 10px',
                          borderRadius: '9999px'
                        }}>
                          {preset.difficulty}
                        </span>
                      </div>

                      <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.4px', marginBottom: '4px' }}>
                        {preset.name}
                      </h3>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#00D09C', marginBottom: '10px' }}>
                        {preset.tagline}
                      </div>

                      <p style={{ fontSize: '13px', color: '#8E8E93', lineHeight: '1.5', marginBottom: '16px' }}>
                        {preset.description}
                      </p>

                      {/* Day Pill Breakdown */}
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '8px' }}>
                          Split Rotation ({daysBreakdown.length} Training Days):
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {daysBreakdown.map(([dIdx, val]) => (
                            <span
                              key={dIdx}
                              style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: '#E0E0E0',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                backdropFilter: 'blur(8px)'
                              }}
                            >
                              {val.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Apply Button */}
                    <button
                      onClick={() => handleApplyPreset(preset.id)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '14px',
                        background: isActive ? '#00D09C' : 'rgba(255, 255, 255, 0.06)',
                        color: isActive ? '#161616' : '#FFFFFF',
                        border: isActive ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                        fontSize: '13px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        boxShadow: 'none'
                      }}
                    >
                      {isActive ? (
                        <>
                          <CheckCircle2 size={16} strokeWidth={2.8} />
                          <span>Active Applied Split</span>
                        </>
                      ) : (
                        <>
                          <Flame size={15} color="#FF7243" />
                          <span>Apply This Plan</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: WEEKLY SCHEDULE & NUTRITION TARGETS */}
        {currentTab === 'schedule' && (
          <div className="animate-slide-up">
            {/* 7-DAY WORKOUT SPLIT DEFINITION */}
            <div 
              className="glass-card"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-backdrop)',
                WebkitBackdropFilter: 'var(--glass-backdrop)',
                borderRadius: '24px',
                padding: '28px',
                border: 'var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
                marginBottom: '28px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <Calendar size={18} color="#FF7243" />
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF' }}>
                  Training Split by Day
                </h2>
              </div>

              {/* Day Pills Bar (Compact 7-Column Grid on Mobile and Desktop) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '6px',
                marginBottom: '24px'
              }}>
                {days.map((d, i) => {
                  const isSelected = activeDay === i;
                  const isRest = schedule[i]?.isRest;
                  return (
                    <button
                      key={d}
                      onClick={() => setActiveDay(i)}
                      style={{
                        padding: '10px 2px',
                        borderRadius: '14px',
                        background: isSelected ? '#10B981' : isRest ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#0D0D0D' : '#CCCCCC',
                        border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        minWidth: 0,
                        width: '100%',
                        boxShadow: 'none',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: '800' }}>{d}</span>
                      <span style={{ 
                        fontSize: '9px', 
                        opacity: 0.75, 
                        fontWeight: '600',
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap', 
                        maxWidth: '100%' 
                      }}>
                        {isRest ? 'Rest' : schedule[i]?.name || 'Train'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Day Configuration */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '18px', padding: '20px', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(12px)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>
                      Workout Routine Name
                    </label>
                    <input
                      type="text"
                      value={dayData?.name || ''}
                      onChange={e => updateActiveDay('name', e.target.value)}
                      placeholder="e.g. Push, Pull, Legs, Upper Body"
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        color: '#FFFFFF',
                        fontSize: '15px',
                        fontWeight: '700',
                        marginTop: '6px'
                      }}
                    />
                  </div>

                  {/* Rest Day Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#CCCCCC' }}>Rest Day</span>
                    <button
                      type="button"
                      onClick={() => updateActiveDay('isRest', !dayData.isRest)}
                      style={{
                        width: '48px',
                        height: '28px',
                        borderRadius: '9999px',
                        background: dayData.isRest ? '#00D09C' : '#333333',
                        position: 'relative',
                        transition: 'background-color 0.2s ease',
                        cursor: 'pointer',
                        border: 'none'
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: '3px',
                        left: dayData.isRest ? '23px' : '3px',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        transition: 'left 0.2s ease'
                      }} />
                    </button>
                  </div>
                </div>

                {/* Exercises for this day */}
                {!dayData.isRest && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>
                        Planned Movements ({dayData.exercises?.length || 0})
                      </span>
                      <button
                        onClick={addExercise}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(255, 114, 67, 0.1)',
                          color: '#FF7243',
                          border: '1px solid rgba(255, 114, 67, 0.3)',
                          padding: '6px 14px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={14} /> Add Movement
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(dayData.exercises || []).map((ex, idx) => (
                        <div
                          key={ex.id || idx}
                          className="glass-card-subtle"
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            alignItems: 'center',
                            background: 'rgba(255, 255, 255, 0.04)',
                            padding: '10px 12px',
                            borderRadius: '14px',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                          }}
                        >
                          <input
                            type="text"
                            value={ex.name}
                            onChange={e => updateExercise(idx, 'name', e.target.value)}
                            placeholder="Exercise name"
                            style={{
                              flex: '1 1 130px',
                              minWidth: '110px',
                              background: 'transparent',
                              border: 'none',
                              color: '#FFFFFF',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}
                          />

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '68px' }}>
                              <input
                                type="number"
                                value={ex.sets}
                                onChange={e => updateExercise(idx, 'sets', e.target.value)}
                                placeholder="Sets"
                                style={{
                                  width: '100%',
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  textAlign: 'center',
                                  borderRadius: '8px',
                                  color: '#FFFFFF',
                                  fontSize: '13px',
                                  padding: '6px 0'
                                }}
                              />
                              <span style={{ fontSize: '11px', color: '#8E8E93' }}>sets</span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '68px' }}>
                              <input
                                type="number"
                                value={ex.reps}
                                onChange={e => updateExercise(idx, 'reps', e.target.value)}
                                placeholder="Reps"
                                style={{
                                  width: '100%',
                                  background: 'rgba(255, 255, 255, 0.06)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  textAlign: 'center',
                                  borderRadius: '8px',
                                  color: '#FFFFFF',
                                  fontSize: '13px',
                                  padding: '6px 0'
                                }}
                              />
                              <span style={{ fontSize: '11px', color: '#8E8E93' }}>reps</span>
                            </div>

                            <button
                              onClick={() => removeExercise(idx)}
                              aria-label="Remove exercise"
                              style={{ 
                                color: '#8E8E93', 
                                opacity: 0.7, 
                                padding: '6px', 
                                textAlign: 'center', 
                                background: 'transparent', 
                                border: 'none', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* DAILY MACRO TARGETS (2x2 Grid on Mobile) */}
            <div 
              className="glass-card"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-backdrop)',
                WebkitBackdropFilter: 'var(--glass-backdrop)',
                borderRadius: '24px',
                padding: '28px',
                border: 'var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
                marginBottom: '28px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <Target size={18} color="#10B981" />
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF' }}>
                  Daily Nutrition Targets
                </h2>
              </div>

              <div className="nutrition-targets-grid">
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#00D09C', textTransform: 'uppercase' }}>
                    Total Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={targets.calories}
                    onChange={e => setTargets({ ...targets, calories: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      fontSize: '24px',
                      fontWeight: '800',
                      color: '#FFFFFF',
                      marginTop: '4px'
                    }}
                  />
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#B2E040', textTransform: 'uppercase' }}>
                    Protein Target (g)
                  </label>
                  <input
                    type="number"
                    value={targets.protein}
                    onChange={e => setTargets({ ...targets, protein: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      fontSize: '24px',
                      fontWeight: '800',
                      color: '#FFFFFF',
                      marginTop: '4px'
                    }}
                  />
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#F4C767', textTransform: 'uppercase' }}>
                    Carbs Target (g)
                  </label>
                  <input
                    type="number"
                    value={targets.carbs}
                    onChange={e => setTargets({ ...targets, carbs: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      fontSize: '24px',
                      fontWeight: '800',
                      color: '#FFFFFF',
                      marginTop: '4px'
                    }}
                  />
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(10px)' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#FF7243', textTransform: 'uppercase' }}>
                    Fat Target (g)
                  </label>
                  <input
                    type="number"
                    value={targets.fat}
                    onChange={e => setTargets({ ...targets, fat: e.target.value })}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      fontSize: '24px',
                      fontWeight: '800',
                      color: '#FFFFFF',
                      marginTop: '4px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* WEIGH-IN LOG */}
            <div 
              className="glass-card"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-backdrop)',
                WebkitBackdropFilter: 'var(--glass-backdrop)',
                borderRadius: '24px',
                padding: '28px',
                border: 'var(--glass-border)',
                borderTop: '1.5px solid var(--glass-border-highlight)',
                boxShadow: 'var(--glass-shadow)',
                marginBottom: '32px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Scale size={18} color="#CCCCCC" />
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF' }}>
                  Current Bodyweight Check
                </h2>
              </div>

              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="e.g. 75 kg"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '12px 18px',
                    borderRadius: '14px',
                    color: '#FFFFFF',
                    fontSize: '15px'
                  }}
                />
                <input
                  type="date"
                  value={weightDate}
                  onChange={e => setWeightDate(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    color: '#CCCCCC',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MY CUSTOM ROUTINES */}
        {currentTab === 'routines' && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF' }}>
                  Your Routine Library
                </h2>
                <p style={{ fontSize: '13px', color: '#8E8E93', marginTop: '4px' }}>
                  Save your own standalone workout templates and launch them on any day.
                </p>
              </div>

              {!isCreatingRoutine && (
                <button
                  onClick={() => setIsCreatingRoutine(true)}
                  style={{
                    background: '#00D09C',
                    color: '#161616',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: 'none'
                  }}
                >
                  <Plus size={16} strokeWidth={2.8} />
                  <span>Create Routine</span>
                </button>
              )}
            </div>

            {/* Routine Creator Form Card */}
            {isCreatingRoutine && (
              <div 
                className="glass-card animate-pop"
                style={{
                  background: 'var(--glass-bg)',
                  backdropFilter: 'var(--glass-backdrop)',
                  WebkitBackdropFilter: 'var(--glass-backdrop)',
                  borderRadius: '24px',
                  padding: '28px',
                  border: '1.5px solid #00D09C',
                  boxShadow: 'var(--glass-shadow)',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF' }}>
                    New Custom Routine Template
                  </h3>
                  <button
                    onClick={() => setIsCreatingRoutine(false)}
                    style={{ background: 'transparent', border: 'none', color: '#8E8E93', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Routine Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chest & Tricep Hypertrophy"
                    value={newRoutineName}
                    onChange={e => setNewRoutineName(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      color: '#FFFFFF',
                      fontSize: '15px',
                      fontWeight: '700'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Short Description / Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. High volume focus on upper pecs and tricep long head"
                    value={newRoutineDesc}
                    onChange={e => setNewRoutineDesc(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '10px 16px',
                      color: '#FFFFFF',
                      fontSize: '13px'
                    }}
                  />
                </div>

                {/* Movements List for this routine */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>
                      Routine Exercises ({newRoutineExercises.length})
                    </span>
                    <button
                      onClick={() => handleAddMovementToNewRoutine('')}
                      style={{
                        background: 'rgba(0, 208, 156, 0.1)',
                        color: '#00D09C',
                        border: '1px solid rgba(0, 208, 156, 0.3)',
                        borderRadius: '9999px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Plus size={13} /> Add Exercise
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {newRoutineExercises.map((ex, idx) => (
                      <div
                        key={ex.id || idx}
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '8px',
                          alignItems: 'center',
                          background: 'rgba(255, 255, 255, 0.04)',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}
                      >
                        <input
                          type="text"
                          value={ex.name}
                          onChange={e => handleUpdateNewRoutineExercise(idx, 'name', e.target.value)}
                          placeholder="Movement name"
                          list="popular-movements-list"
                          style={{
                            flex: '1 1 120px',
                            minWidth: '100px',
                            background: 'transparent',
                            border: 'none',
                            color: '#FFFFFF',
                            fontSize: '13px',
                            fontWeight: '600'
                          }}
                        />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '64px' }}>
                            <input
                              type="number"
                              value={ex.sets}
                              onChange={e => handleUpdateNewRoutineExercise(idx, 'sets', Number(e.target.value) || 1)}
                              style={{
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.07)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                textAlign: 'center',
                                borderRadius: '6px',
                                color: '#FFFFFF',
                                fontSize: '12px',
                                padding: '6px 0'
                              }}
                            />
                            <span style={{ fontSize: '10px', color: '#8E8E93' }}>sets</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '64px' }}>
                            <input
                              type="number"
                              value={ex.reps}
                              onChange={e => handleUpdateNewRoutineExercise(idx, 'reps', Number(e.target.value) || 1)}
                              style={{
                                width: '100%',
                                background: 'rgba(255, 255, 255, 0.07)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                textAlign: 'center',
                                borderRadius: '6px',
                                color: '#FFFFFF',
                                fontSize: '12px',
                                padding: '6px 0'
                              }}
                            />
                            <span style={{ fontSize: '10px', color: '#8E8E93' }}>reps</span>
                          </div>

                          <button
                            onClick={() => handleRemoveNewRoutineExercise(idx)}
                            aria-label="Remove exercise"
                            style={{ 
                              background: 'transparent', 
                              border: 'none', 
                              color: '#8E8E93', 
                              cursor: 'pointer', 
                              padding: '6px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Datalist for fast autocomplete */}
                  <datalist id="popular-movements-list">
                    {POPULAR_EXERCISES.map(p => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>

                {/* Form Buttons */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setIsCreatingRoutine(false)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: 'none',
                      color: '#8E8E93',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!newRoutineName.trim()}
                    onClick={handleSaveCustomRoutine}
                    style={{
                      flex: 2,
                      padding: '12px',
                      borderRadius: '12px',
                      background: newRoutineName.trim() ? '#00D09C' : '#333333',
                      color: newRoutineName.trim() ? '#161616' : '#666666',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: newRoutineName.trim() ? 'pointer' : 'not-allowed'
                    }}
                  >
                    Save Routine Template
                  </button>
                </div>
              </div>
            )}

            {/* List of Existing Custom Routines */}
            {customRoutines.length === 0 ? (
              <div 
                className="glass-card"
                style={{
                  background: 'var(--glass-bg-subtle)',
                  backdropFilter: 'var(--glass-backdrop)',
                  borderRadius: '24px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  border: '1px dashed rgba(255, 255, 255, 0.15)'
                }}
              >
                <Dumbbell size={36} color="#8E8E93" style={{ margin: '0 auto 14px auto' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', marginBottom: '6px' }}>
                  No Custom Routines Yet
                </h3>
                <p style={{ fontSize: '13px', color: '#8E8E93', maxWidth: '420px', margin: '0 auto 20px auto' }}>
                  You can design custom workout splits above or complete any live session and tap "Save Template".
                </p>
                <button
                  onClick={() => setIsCreatingRoutine(true)}
                  style={{
                    background: '#00D09C',
                    color: '#161616',
                    borderRadius: '9999px',
                    padding: '12px 24px',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Create Your First Routine
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                {customRoutines.map(r => (
                  <div
                    key={r.id}
                    className="glass-card"
                    style={{
                      background: 'var(--glass-bg)',
                      backdropFilter: 'var(--glass-backdrop)',
                      WebkitBackdropFilter: 'var(--glass-backdrop)',
                      borderRadius: '24px',
                      padding: '24px',
                      border: 'var(--glass-border)',
                      borderTop: '1.5px solid var(--glass-border-highlight)',
                      boxShadow: 'var(--glass-shadow)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF' }}>
                          {r.name}
                        </h3>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${r.name}" from your custom routines?`)) {
                              deleteCustomRoutine(r.id);
                              showToast(`Removed "${r.name}"`);
                            }
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#8E8E93',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          title="Delete routine"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <p style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '14px' }}>
                        {r.description || `${r.exercises.length} planned movements`}
                      </p>

                      {/* Exercises preview */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                        {r.exercises.map((ex, i) => (
                          <div
                            key={ex.id || i}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              padding: '8px 12px',
                              borderRadius: '10px',
                              fontSize: '12px'
                            }}
                          >
                            <span style={{ fontWeight: '700', color: '#FFFFFF' }}>{ex.name}</span>
                            <span style={{ color: '#8E8E93' }}>{ex.sets || 3} × {ex.reps || 10}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartRoutine(r)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '14px',
                        background: '#00D09C',
                        color: '#161616',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: 'none'
                      }}
                    >
                      <Play size={15} fill="#161616" stroke="#161616" />
                      <span>Train This Routine Now</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SAVE PLAN FIXED CTA (Shown when on schedule tab) */}
        {currentTab === 'schedule' && (
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
              onClick={handleSave}
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
                gap: '8px',
                boxShadow: 'none',
                border: 'none',
                letterSpacing: '0.2px',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              <Check size={18} strokeWidth={3} />
              <span>SAVE TRAINING & NUTRITION PLAN</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
