import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import TopNavbar from '../components/TopNavbar';
import SEOHead from '../components/SEOHead';
import { 
  Bookmark, 
  Play, 
  Plus, 
  Trash2, 
  Copy, 
  Dumbbell, 
  Clock, 
  Flame, 
  CheckCircle2, 
  X,
  Sparkles
} from 'lucide-react';

export default function SavedTemplates() {
  const navigate = useNavigate();
  const customRoutines = useStore(state => state.customRoutines) || [];
  const addCustomRoutine = useStore(state => state.addCustomRoutine);
  const deleteCustomRoutine = useStore(state => state.deleteCustomRoutine);
  const startWorkout = useStore(state => state.startWorkout);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // New Routine Form State
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDesc, setNewRoutineDesc] = useState('');
  const [newExercises, setNewExercises] = useState([
    { name: 'Barbell Bench Press', sets: 4, reps: 8, weight: 70 },
    { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 26 },
    { name: 'Overhead Tricep Extension', sets: 3, reps: 12, weight: 20 }
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleStartTemplate = (routine) => {
    startWorkout(routine.name, routine.exercises);
    navigate('/log-workout');
  };

  const handleDeleteTemplate = (id, name) => {
    if (window.confirm(`Delete "${name}" template? This action cannot be undone.`)) {
      deleteCustomRoutine(id);
      showToast(`Deleted "${name}"`);
    }
  };

  const handleDuplicateTemplate = (routine) => {
    const clone = {
      name: `${routine.name} (Copy)`,
      description: routine.description || 'Duplicated workout template',
      exercises: (routine.exercises || []).map(ex => ({ ...ex }))
    };
    addCustomRoutine(clone);
    showToast(`Duplicated "${routine.name}"`);
  };

  const handleAddExerciseRow = () => {
    setNewExercises(prev => [...prev, { name: '', sets: 3, reps: 10, weight: 20 }]);
  };

  const handleRemoveExerciseRow = (index) => {
    if (newExercises.length <= 1) return;
    setNewExercises(prev => prev.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index, field, value) => {
    setNewExercises(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSaveNewTemplate = (e) => {
    e.preventDefault();
    if (!newRoutineName.trim()) {
      alert('Please enter a routine name.');
      return;
    }

    const validExercises = newExercises
      .filter(ex => ex.name.trim().length > 0)
      .map(ex => ({
        name: ex.name.trim(),
        sets: Number(ex.sets) || 3,
        reps: Number(ex.reps) || 10,
        weight: Number(ex.weight) || 20
      }));

    if (validExercises.length === 0) {
      alert('Please add at least one valid exercise with a name.');
      return;
    }

    addCustomRoutine({
      name: newRoutineName.trim(),
      description: newRoutineDesc.trim() || 'Custom athletic split template',
      exercises: validExercises
    });

    setCreateModalOpen(false);
    setNewRoutineName('');
    setNewRoutineDesc('');
    setNewExercises([
      { name: 'Barbell Bench Press', sets: 4, reps: 8, weight: 70 },
      { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 26 }
    ]);
    showToast(`Template "${newRoutineName.trim()}" saved successfully!`);
  };

  // Seed default athletic templates if user has none
  const handleSeedDefaults = () => {
    const starterPush = {
      name: 'Push Strength & Hypertrophy',
      description: 'Chest, front delts, and tricep progressive overload session.',
      exercises: [
        { name: 'Barbell Bench Press', sets: 4, reps: 8, weight: 75 },
        { name: 'Overhead Press (OHP)', sets: 3, reps: 8, weight: 45 },
        { name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: 28 },
        { name: 'Dips / Tricep Pushdown', sets: 3, reps: 12, weight: 25 }
      ]
    };
    const starterPull = {
      name: 'Pull Density & Posterior Chain',
      description: 'Back, rear delts, and bicep volume targeting upper body thickness.',
      exercises: [
        { name: 'Barbell Deadlift', sets: 4, reps: 5, weight: 110 },
        { name: 'Barbell Row', sets: 4, reps: 8, weight: 65 },
        { name: 'Neutral Grip Pull-Up', sets: 3, reps: 8, weight: 0 },
        { name: 'Barbell Bicep Curl', sets: 3, reps: 10, weight: 30 }
      ]
    };
    const starterLegs = {
      name: 'Leg Hypertrophy & Power',
      description: 'Quad, hamstring, and calf foundation targeting lower body power.',
      exercises: [
        { name: 'Barbell Back Squat', sets: 4, reps: 8, weight: 90 },
        { name: 'Romanian Deadlift (RDL)', sets: 3, reps: 10, weight: 70 },
        { name: 'Leg Press', sets: 3, reps: 12, weight: 140 },
        { name: 'Standing Calf Raise', sets: 4, reps: 15, weight: 50 }
      ]
    };

    addCustomRoutine(starterPush);
    addCustomRoutine(starterPull);
    addCustomRoutine(starterLegs);
    showToast('3 Athlete Starter Templates added to your library!');
  };

  return (
    <div className="animate-slide-up" style={{ minHeight: '100vh', paddingBottom: '120px', width: '100%' }}>
      <SEOHead
        title="Saved Workout Templates | Anchor"
        description="Access and launch your saved custom workout splits and training routine templates with 1-tap progressive overload."
      />

      {/* Top Navbar */}
      <TopNavbar />

      {/* Floating Toast */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 100,
          background: 'rgba(0, 208, 156, 0.95)',
          color: '#0D0D0D',
          padding: '12px 20px',
          borderRadius: '12px',
          fontWeight: '700',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(12px)'
        }}>
          <CheckCircle2 size={18} strokeWidth={2.6} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="focus-container" style={{ padding: '0 8px' }}>
        {/* Header Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: '#00D09C',
              letterSpacing: '0.8px',
              textTransform: 'uppercase'
            }}>
              TRAINING ROUTINE REPOSITORY
            </span>
            <h1 style={{
              fontSize: '36px',
              fontWeight: '800',
              color: '#FFFFFF',
              letterSpacing: '-1px',
              marginTop: '4px'
            }}>
              Saved Templates
            </h1>
            <p style={{ fontSize: '14px', color: '#8E8E93', marginTop: '4px' }}>
              {customRoutines.length} {customRoutines.length === 1 ? 'routine' : 'routines'} ready for instant execution
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {customRoutines.length === 0 && (
              <button
                onClick={handleSeedDefaults}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  padding: '10px 18px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Sparkles size={15} color="#00D09C" />
                <span>Load Starter Templates</span>
              </button>
            )}

            <button
              onClick={() => setCreateModalOpen(true)}
              style={{
                background: '#FF7243',
                color: '#FFFFFF',
                padding: '10px 20px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: 'none'
              }}
            >
              <Plus size={16} strokeWidth={2.6} />
              <span>Create Template</span>
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        {customRoutines.length === 0 ? (
          <div 
            className="glass-card"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-backdrop)',
              WebkitBackdropFilter: 'var(--glass-backdrop)',
              borderRadius: '24px',
              padding: '48px 24px',
              textAlign: 'center',
              border: 'var(--glass-border)',
              boxShadow: 'var(--glass-shadow)',
              maxWidth: '600px',
              margin: '40px auto'
            }}
          >
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(0, 208, 156, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px auto',
              color: '#00D09C'
            }}>
              <Bookmark size={26} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', marginBottom: '8px' }}>
              No Saved Workout Templates Yet
            </h2>
            <p style={{ fontSize: '14px', color: '#8E8E93', lineHeight: '1.6', marginBottom: '24px' }}>
              Save custom training splits here to launch workouts with 1 tap, automatically tracking weights and sets in kilograms.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleSeedDefaults}
                style={{
                  background: '#00D09C',
                  color: '#0D0D0D',
                  padding: '12px 24px',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: '800',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Sparkles size={16} />
                <span>Load 3 Starter Splits (Push / Pull / Legs)</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '20px'
          }}>
            {customRoutines.map((routine) => {
              const exercises = routine.exercises || [];
              const totalSets = exercises.reduce((acc, ex) => acc + (Number(ex.sets) || 0), 0);
              const estMinutes = Math.round(totalSets * 2.5) || 45;

              return (
                <div
                  key={routine.id}
                  className="glass-card"
                  style={{
                    background: 'var(--glass-bg)',
                    backdropFilter: 'var(--glass-backdrop)',
                    WebkitBackdropFilter: 'var(--glass-backdrop)',
                    borderRadius: '24px',
                    padding: '24px',
                    border: 'var(--glass-border)',
                    boxShadow: 'var(--glass-shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Top Row: Title & Action Icons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.3px', margin: 0 }}>
                          {routine.name}
                        </h2>
                        {routine.description && (
                          <p style={{ fontSize: '13px', color: '#8E8E93', marginTop: '4px', lineHeight: '1.4' }}>
                            {routine.description}
                          </p>
                        )}
                      </div>

                      {/* Top Action Pills */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          onClick={() => handleDuplicateTemplate(routine)}
                          title="Duplicate Template"
                          aria-label="Duplicate Template"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#8E8E93',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#FFFFFF'}
                          onMouseLeave={e => e.currentTarget.style.color = '#8E8E93'}
                        >
                          <Copy size={14} />
                        </button>

                        <button
                          onClick={() => handleDeleteTemplate(routine.id, routine.name)}
                          title="Delete Template"
                          aria-label="Delete Template"
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#8E8E93',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#FF7243'}
                          onMouseLeave={e => e.currentTarget.style.color = '#8E8E93'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '12px 0 16px 0', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#00D09C', fontWeight: '700' }}>
                        <Dumbbell size={14} />
                        <span>{exercises.length} Exercises</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#8E8E93' }}>
                        <Flame size={14} />
                        <span>{totalSets} Total Sets</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#8E8E93' }}>
                        <Clock size={14} />
                        <span>~{estMinutes} min</span>
                      </div>
                    </div>

                    {/* Exercise List Preview */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '16px',
                      padding: '12px 14px',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginBottom: '18px'
                    }}>
                      {exercises.map((ex, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '13px'
                          }}
                        >
                          <span style={{ color: '#FFFFFF', fontWeight: '600' }}>
                            {ex.name}
                          </span>
                          <span style={{ color: '#00D09C', fontWeight: '700', fontSize: '12px' }}>
                            {ex.sets} × {ex.reps} reps {ex.weight ? `@ ${ex.weight} kg` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 1-Tap Launch Button */}
                  <button
                    onClick={() => handleStartTemplate(routine)}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #00D09C 0%, #00B584 100%)',
                      color: '#0D0D0D',
                      padding: '14px',
                      borderRadius: '16px',
                      fontSize: '14px',
                      fontWeight: '800',
                      letterSpacing: '0.3px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Play size={16} fill="#0D0D0D" />
                    <span>START WORKOUT</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE NEW TEMPLATE MODAL */}
      {createModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div
            className="glass-card"
            style={{
              background: '#121212',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(255, 114, 67, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FF7243'
                }}>
                  <Bookmark size={18} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF', margin: 0 }}>
                  Build Workout Template
                </h2>
              </div>

              <button
                onClick={() => setCreateModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#8E8E93',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNewTemplate}>
              {/* Routine Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Routine Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chest & Triceps Hypertrophy"
                  value={newRoutineName}
                  onChange={e => setNewRoutineName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Description / Focus
                </label>
                <input
                  type="text"
                  placeholder="e.g. 45 min hypertrophy split with mechanical drop sets"
                  value={newRoutineDesc}
                  onChange={e => setNewRoutineDesc(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Exercises List */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase' }}>
                    Planned Movements & Targets (in KG)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddExerciseRow}
                    style={{
                      background: 'rgba(0, 208, 156, 0.12)',
                      border: '1px solid rgba(0, 208, 156, 0.3)',
                      color: '#00D09C',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={12} />
                    <span>Add Movement</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {newExercises.map((ex, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 70px 70px 80px 32px',
                        gap: '8px',
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.03)',
                        padding: '8px 10px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255, 255, 255, 0.06)'
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Exercise name"
                        value={ex.name}
                        onChange={e => handleExerciseChange(idx, 'name', e.target.value)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#FFFFFF',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Sets"
                        value={ex.sets}
                        onChange={e => handleExerciseChange(idx, 'sets', e.target.value)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '6px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                          textAlign: 'center'
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Reps"
                        value={ex.reps}
                        onChange={e => handleExerciseChange(idx, 'reps', e.target.value)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          padding: '6px',
                          color: '#FFFFFF',
                          fontSize: '13px',
                          textAlign: 'center'
                        }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <input
                          type="number"
                          placeholder="kg"
                          value={ex.weight}
                          onChange={e => handleExerciseChange(idx, 'weight', e.target.value)}
                          style={{
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '6px',
                            color: '#00D09C',
                            fontWeight: '700',
                            fontSize: '13px',
                            textAlign: 'center'
                          }}
                        />
                        <span style={{ fontSize: '10px', color: '#8E8E93', fontWeight: '700' }}>kg</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveExerciseRow(idx)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#8E8E93',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: '#FFFFFF',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '700',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    background: '#00D09C',
                    color: '#0D0D0D',
                    padding: '10px 22px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: '800',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Save Routine Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
