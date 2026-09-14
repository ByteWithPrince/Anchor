import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  TrendingUp, 
  Sparkles, 
  Plus, 
  Dumbbell, 
  Compass, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import TopNavbar from '../components/TopNavbar';
import { progressionService } from '../services/progressionService';
import SEOHead from '../components/SEOHead';

export default function WorkoutOverview() {
  const navigate = useNavigate();
  const plan = useStore(state => state.plan);
  const customRoutines = useStore(state => state.customRoutines);
  const startWorkout = useStore(state => state.startWorkout);
  const startBlankWorkout = useStore(state => state.startBlankWorkout);
  const getPreviousPerformance = useStore(state => state.getPreviousPerformance);
  const getNextRoutineInSplit = useStore(state => state.getNextRoutineInSplit);
  const lastCompletedRoutineName = useStore(state => state.lastCompletedRoutineName);

  const sliderRef = useRef(null);
  const isDownRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Wheel horizontal scroll support on hover
  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    const onWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        slider.scrollBy({
          left: e.deltaY * 1.5,
          behavior: 'smooth'
        });
      }
    };
    slider.addEventListener('wheel', onWheel, { passive: false });
    return () => slider.removeEventListener('wheel', onWheel);
  }, []);

  const handleMouseDown = (e) => {
    isDownRef.current = true;
    setIsDragging(true);
    startXRef.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeftRef.current = sliderRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDownRef.current = false;
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    isDownRef.current = false;
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDownRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    sliderRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleScrollPrev = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const handleScrollNext = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  const dateObj = new Date();
  const currentDayIndex = dateObj.getDay();
  const todaySchedule = plan?.schedule?.[currentDayIndex];
  
  // Rolling split rotation
  const nextInSplit = useMemo(() => {
    return getNextRoutineInSplit();
  }, [getNextRoutineInSplit]);

  // Determine initial selected routine
  const initialRoutine = useMemo(() => {
    if (todaySchedule && !todaySchedule.isRest && todaySchedule.exercises?.length > 0) {
      return {
        id: `day-${currentDayIndex}`,
        name: todaySchedule.name,
        exercises: todaySchedule.exercises,
        source: "Today's Schedule",
        isRest: false
      };
    }
    if (nextInSplit && nextInSplit.exercises?.length > 0) {
      return {
        id: 'next-in-split',
        name: nextInSplit.name,
        exercises: nextInSplit.exercises,
        source: 'Next in Split Rotation',
        isRest: false
      };
    }
    // Fallback to custom routines or first active day
    if (customRoutines && customRoutines.length > 0) {
      return {
        id: customRoutines[0].id,
        name: customRoutines[0].name,
        exercises: customRoutines[0].exercises,
        source: 'Custom Routine',
        isRest: false
      };
    }
    return {
      id: 'default-blank',
      name: 'Custom Strength Session',
      exercises: [],
      source: 'Blank Workout',
      isRest: false
    };
  }, [todaySchedule, nextInSplit, customRoutines, currentDayIndex]);

  const [selectedRoutine, setSelectedRoutine] = useState(initialRoutine);

  // Available routines to switch between
  const availableRoutines = useMemo(() => {
    const list = [];
    
    // Add split days from weekly schedule
    if (plan?.schedule) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.forEach((dayName, idx) => {
        const item = plan.schedule[idx];
        if (item && !item.isRest && item.exercises?.length > 0) {
          list.push({
            id: `schedule-${idx}`,
            name: item.name,
            dayLabel: dayName,
            exercises: item.exercises,
            isToday: idx === currentDayIndex,
            type: 'split'
          });
        }
      });
    }

    // Add user's custom routines
    if (customRoutines) {
      customRoutines.forEach(cr => {
        list.push({
          id: cr.id,
          name: cr.name,
          dayLabel: 'Custom',
          exercises: cr.exercises,
          type: 'custom'
        });
      });
    }

    return list;
  }, [plan, customRoutines, currentDayIndex]);

  const exercises = selectedRoutine?.exercises || [];
  const numExercises = exercises.length;
  const totalSets = exercises.reduce((acc, ex) => acc + (Number(ex.sets) || 0), 0);
  const estTime = Math.max(15, Math.round(totalSets * 3.5));

  const handleStartWorkout = () => {
    if (exercises.length === 0) {
      startBlankWorkout(selectedRoutine?.name || 'Quick Workout');
    } else {
      startWorkout(selectedRoutine.name, exercises);
    }
    navigate('/log-workout');
  };

  const handleStartBlank = () => {
    startBlankWorkout('Quick Freeform Workout');
    navigate('/log-workout');
  };

  return (
    <div className="animate-slide-up" style={{ minHeight: '100vh', paddingBottom: '160px', width: '100%' }}>
      <SEOHead
        title="Workout Launcher & Split Rotation | Anchor"
        description="Choose your split routine, start next workout in rotation, or launch a quick custom session."
      />
      {/* Top Navbar */}
      <TopNavbar />

      <div style={{ width: '100%' }}>
        {/* Top Header */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button 
              onClick={() => navigate('/')} 
              style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: '50%', 
                background: 'rgba(255, 255, 255, 0.06)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(12px)',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#00D09C', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                SESSION LAUNCHER
              </span>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.8px', marginTop: '2px' }}>
                Ready to Train
              </h1>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleStartBlank}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                backdropFilter: 'blur(12px)',
                color: '#FFFFFF',
                padding: '10px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
            >
              <Plus size={15} />
              <span>Blank Session</span>
            </button>

            <button
              onClick={() => navigate('/plan')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(0, 208, 156, 0.12)',
                border: '1px solid rgba(0, 208, 156, 0.35)',
                backdropFilter: 'blur(12px)',
                color: '#00D09C',
                padding: '10px 16px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              <Compass size={15} />
              <span>Plan Builder</span>
            </button>
          </div>
        </div>

        {/* REST DAY BANNER (NON-BLOCKING) */}
        {todaySchedule?.isRest && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 114, 67, 0.12) 0%, rgba(20, 24, 34, 0.6) 100%)',
            border: '1px solid rgba(255, 114, 67, 0.35)',
            borderTop: '1.5px solid rgba(255, 114, 67, 0.5)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '18px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(255, 114, 67, 0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FF7243'
              }}>
                <Clock size={20} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#FFFFFF' }}>
                  Scheduled Rest Day Today
                </div>
                <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '2px' }}>
                  {nextInSplit 
                    ? `Next up in your split rotation is ${nextInSplit.name}. You can train it today or pick any routine below.`
                    : 'Take time to recover, or select any routine below to train right now.'}
                </div>
              </div>
            </div>
            {nextInSplit && (
              <button
                onClick={() => setSelectedRoutine({
                  id: 'next-in-split',
                  name: nextInSplit.name,
                  exercises: nextInSplit.exercises,
                  source: 'Next in Split',
                  isRest: false
                })}
                style={{
                  background: '#FF7243',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '8px 18px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(255, 114, 67, 0.35)'
                }}
              >
                Load {nextInSplit.name}
              </button>
            )}
          </div>
        )}

        {/* ROLLING SPLIT ROTATION STATUS (FROSTED GLASS PANEL) */}
        {nextInSplit && (
          <div 
            className="glass-card-subtle"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 208, 156, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%), rgba(14, 18, 26, 0.55)',
              borderRadius: '20px',
              padding: '16px 20px',
              border: '1px solid rgba(0, 208, 156, 0.25)',
              borderTop: '1.5px solid rgba(0, 208, 156, 0.45)',
              backdropFilter: 'blur(20px)',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={18} color="#00D09C" />
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#FFFFFF' }}>
                Split Rotation Order:
              </span>
              <span style={{ fontSize: '13px', color: '#8E8E93' }}>
                Last finished: <strong style={{ color: '#FFFFFF' }}>{lastCompletedRoutineName || 'None recorded'}</strong> → Next up: <strong style={{ color: '#00D09C' }}>{nextInSplit.name}</strong>
              </span>
            </div>

            <button
              onClick={() => setSelectedRoutine({
                id: 'next-in-split',
                name: nextInSplit.name,
                exercises: nextInSplit.exercises,
                source: 'Next in Split',
                isRest: false
              })}
              style={{
                background: selectedRoutine?.name === nextInSplit.name ? '#00D09C' : 'rgba(255, 255, 255, 0.08)',
                color: selectedRoutine?.name === nextInSplit.name ? '#161616' : '#FFFFFF',
                border: selectedRoutine?.name === nextInSplit.name ? 'none' : '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '9999px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {selectedRoutine?.name === nextInSplit.name && <CheckCircle2 size={13} />}
              <span>{selectedRoutine?.name === nextInSplit.name ? 'Active Preview' : 'Select Next Up'}</span>
            </button>
          </div>
        )}

        {/* ROUTINES HORIZONTAL SLIDER (SINGLE LINE, ZERO-VISIBLE SCROLLBAR, WHEEL & GESTURE SCROLL) */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                Select Routine to Train
              </span>
              <span style={{ fontSize: '11px', color: '#00D09C', background: 'rgba(0, 208, 156, 0.1)', padding: '2px 8px', borderRadius: '9999px', fontWeight: '700' }}>
                {availableRoutines.length} available
              </span>
            </div>

            {/* Subtle nudge arrows */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={handleScrollPrev}
                title="Scroll left"
                aria-label="Scroll left"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={handleScrollNext}
                title="Scroll right"
                aria-label="Scroll right"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(12px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Single-row slider with hidden scrollbar and gesture/wheel support */}
          <div
            ref={sliderRef}
            className="no-scrollbar"
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              paddingBottom: '4px',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {availableRoutines.map(r => {
              const isSelected = selectedRoutine?.name === r.name;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoutine({
                    id: r.id,
                    name: r.name,
                    exercises: r.exercises,
                    source: r.dayLabel,
                    isRest: false
                  })}
                  className="glass-card-subtle"
                  style={{
                    flexShrink: 0,
                    minWidth: '175px',
                    textAlign: 'left',
                    background: isSelected 
                      ? 'linear-gradient(135deg, rgba(0, 208, 156, 0.22) 0%, rgba(0, 208, 156, 0.05) 100%), rgba(16, 24, 32, 0.65)' 
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%), rgba(12, 16, 24, 0.45)',
                    border: isSelected ? '1.5px solid #00D09C' : '1px solid rgba(255, 255, 255, 0.09)',
                    borderTop: isSelected ? '1.5px solid #00D09C' : '1px solid rgba(255, 255, 255, 0.18)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    borderRadius: '18px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected 
                      ? '0 6px 20px rgba(0, 208, 156, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                      : '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      color: isSelected ? '#00D09C' : '#8E8E93'
                    }}>
                      {r.dayLabel} {r.isToday && '· TODAY'}
                    </span>
                    <span style={{ fontSize: '10px', color: '#8E8E93', fontWeight: '600' }}>
                      {r.exercises.length} ex
                    </span>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: isSelected ? '#FFFFFF' : '#E0E0E0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {r.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ACTIVE SELECTED ROUTINE PREVIEW CARD (TRUE FROSTED GLASS) */}
        <div 
          className="glass-card"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'var(--glass-backdrop)',
            WebkitBackdropFilter: 'var(--glass-backdrop)',
            borderRadius: '28px',
            padding: '28px',
            border: 'var(--glass-border)',
            borderTop: '1.5px solid var(--glass-border-highlight)',
            borderLeft: '1px solid var(--glass-border-highlight)',
            boxShadow: 'var(--glass-shadow)',
            marginBottom: '28px'
          }}
        >
          {/* Header of Active Routine */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#00D09C', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                PREVIEWING SESSION
              </span>
              <h2 style={{ fontSize: '30px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.8px', marginTop: '4px' }}>
                {selectedRoutine?.name || 'Workout Session'}
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#FF7243' }}>{numExercises}</div>
                <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '600' }}>Movements</div>
              </div>
              <div style={{ width: '1px', height: '36px', background: 'rgba(255, 255, 255, 0.08)' }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#00D09C' }}>{totalSets}</div>
                <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '600' }}>Total Sets</div>
              </div>
              <div style={{ width: '1px', height: '36px', background: 'rgba(255, 255, 255, 0.08)' }} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#B2E040' }}>~{estTime}m</div>
                <div style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '600' }}>Duration</div>
              </div>
            </div>
          </div>

          {/* Exercises List in Routine */}
          {exercises.length === 0 ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              backdropFilter: 'blur(12px)',
              borderRadius: '18px',
              padding: '36px 20px',
              textAlign: 'center',
              border: '1px dashed rgba(255, 255, 255, 0.12)'
            }}>
              <Dumbbell size={32} color="#8E8E93" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF', marginBottom: '6px' }}>
                Blank Canvas Session
              </div>
              <div style={{ fontSize: '13px', color: '#8E8E93', maxWidth: '400px', margin: '0 auto' }}>
                Starting this workout lets you dynamically add movements and sets in real-time as you train.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {exercises.map((ex, i) => {
                const prevSets = getPreviousPerformance(ex.name);
                const suggestion = progressionService.getOverloadSuggestion(prevSets);

                return (
                  <div
                    key={ex.id || i}
                    className="glass-card-subtle"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%), rgba(16, 22, 32, 0.48)',
                      backdropFilter: 'blur(16px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                      borderRadius: '18px',
                      padding: '16px 20px',
                      border: '1px solid rgba(255, 255, 255, 0.09)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.22)',
                      boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#FF7243' }}>#{i + 1}</span>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#FFFFFF' }}>{ex.name}</span>
                      </div>

                      {suggestion && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: suggestion.type === 'increase' ? '#00D09C' : '#8E8E93',
                          marginTop: '4px'
                        }}>
                          {suggestion.type === 'increase' && <TrendingUp size={13} />}
                          <span>{suggestion.text}</span>
                        </div>
                      )}
                    </div>

                    <div style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#FFFFFF',
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      backdropFilter: 'blur(8px)',
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                    }}>
                      {ex.sets || 3} Sets × {ex.reps || 10} Reps {ex.weight ? `@ ${ex.weight} lbs` : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* START BUTTON FIXED BOTTOM CTA */}
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
            onClick={handleStartWorkout}
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
            <Play size={18} fill="#161616" stroke="#161616" />
            <span>START {selectedRoutine?.name?.toUpperCase() || 'SESSION'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
