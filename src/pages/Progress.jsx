import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ChevronDown, ChevronUp, Trash2, Activity, Award, TrendingUp, Calendar, Dumbbell } from 'lucide-react';
import TopNavbar from '../components/TopNavbar';
import WeeklyHeatmap from '../components/WeeklyHeatmap';
import Sparkline from '../components/Sparkline';
import { progressionService } from '../services/progressionService';
import SEOHead from '../components/SEOHead';

export default function Progress() {
  const navigate = useNavigate();
  const workoutLogs = useStore(state => state.workoutLogs);
  const weightLogs = useStore(state => state.weightLogs);
  const deleteWorkoutLog = useStore(state => state.deleteWorkoutLog);
  const [expandedLogId, setExpandedLogId] = useState(null);
  
  if (workoutLogs.length === 0) {
    return (
      <div className="animate-slide-up" style={{ width: '100%', paddingBottom: '100px' }}>
        <SEOHead
          title="Statistics & Volume Progression | Anchor"
          description="Track your volume progression, bodyweight trends, 1RM overload trajectories, and training consistency heatmap."
        />
        <TopNavbar />
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          padding: '0 16px'
        }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, rgba(255, 114, 67, 0.2) 0%, rgba(255, 114, 67, 0.05) 100%), rgba(20, 24, 34, 0.6)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FF7243',
            marginBottom: '20px',
            border: '1px solid rgba(255, 114, 67, 0.35)',
            boxShadow: '0 8px 24px rgba(255, 114, 67, 0.2)'
          }}>
            <Dumbbell size={32} />
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-1.5px', color: '#FFFFFF', marginBottom: '12px' }}>
            No Workouts Logged Yet
          </h1>
          <p style={{ fontSize: '15px', color: '#8E8E93', fontWeight: '500', maxWidth: '360px', lineHeight: 1.5, marginBottom: '32px' }}>
            Complete your first session on the dashboard to unlock progressive overload analytics and 1RM tracking.
          </p>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/workout-overview')}
            style={{
              background: '#FF7243',
              color: '#FFFFFF',
              borderRadius: '9999px',
              padding: '16px 36px',
              fontWeight: '800',
              fontSize: '14px',
              boxShadow: '0 4px 16px rgba(255, 114, 67, 0.4)'
            }}
          >
            START FIRST WORKOUT
          </button>
        </div>
      </div>
    );
  }

  const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : 72;
  const weightData = weightLogs.map(w => Number(w.weight)).filter(w => w > 0);

  const sortedLogs = [...workoutLogs].sort((a, b) => b.timestamp - a.timestamp);

  // Volume Trend
  const volumeTrend = progressionService.getVolumeTrend(workoutLogs);
  const volumeData = volumeTrend.map(v => v.volume);
  const totalLifetimeVolume = workoutLogs.reduce((acc, w) => acc + progressionService.calculateSessionVolume(w.exercises), 0);

  // Exercise history & 1RM
  const exerciseHistory = new Map();
  for (const log of sortedLogs) {
    for (const ex of log.exercises) {
      if (!exerciseHistory.has(ex.name)) {
        exerciseHistory.set(ex.name, []);
      }
      const validSets = ex.sets.filter(s => s.completed !== false);
      const maxSet = validSets.reduce((max, s) => {
        const w = Number(s.weight) || 0;
        return w > max.weight ? { weight: w, reps: Number(s.reps) || 0 } : max;
      }, { weight: 0, reps: 0 });

      if (maxSet.weight > 0) {
        exerciseHistory.get(ex.name).push({
          date: log.date,
          maxWeight: maxSet.weight,
          reps: maxSet.reps,
          est1RM: progressionService.calculate1RM(maxSet.weight, maxSet.reps)
        });
      }
    }
  }

  const strengthProgress = Array.from(exerciseHistory.entries())
    .map(([name, history]) => {
      if (history.length === 0) return null;
      const current = history[0];
      const prev = history.length > 1 ? history[1] : null;
      return { 
        name, 
        currentWeight: current.maxWeight,
        est1RM: current.est1RM,
        prevWeight: prev ? prev.maxWeight : null,
        diff: prev ? current.maxWeight - prev.maxWeight : 0
      };
    })
    .filter(Boolean)
    .slice(0, 6); 

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="animate-slide-up" style={{ paddingBottom: '120px', width: '100%' }}>
      <SEOHead
        title="Statistics & Volume Progression | Anchor"
        description="Track your volume progression, bodyweight trends, 1RM overload trajectories, and training consistency heatmap."
      />
      {/* Top Navbar */}
      <TopNavbar />

      {/* Sub-Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#00D09C', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            ANALYTICS & VOLUME
          </span>
          <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-1.5px', marginTop: '4px' }}>
            Progress & Overload
          </h1>
        </div>

        <span style={{
          fontSize: '11px',
          fontWeight: '700',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '6px 14px',
          borderRadius: '9999px',
          color: '#CCCCCC'
        }}>
          {workoutLogs.length} Completed Sessions
        </span>
      </div>

      {/* 3 Top Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="glass-card" style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-backdrop)', WebkitBackdropFilter: 'var(--glass-backdrop)', borderRadius: '20px', padding: '24px', border: 'var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed Workouts</div>
          <div style={{ fontSize: '36px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-1px', marginTop: '6px' }}>
            {workoutLogs.length}
          </div>
          <div style={{ fontSize: '12px', color: '#00D09C', fontWeight: '600', marginTop: '4px' }}>
            100% Consistency
          </div>
        </div>

        <div className="glass-card" style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-backdrop)', WebkitBackdropFilter: 'var(--glass-backdrop)', borderRadius: '20px', padding: '24px', border: 'var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Weight</div>
          <div style={{ fontSize: '36px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-1px', marginTop: '6px' }}>
            {latestWeight} <span style={{ fontSize: '16px', color: '#8E8E93', fontWeight: '500' }}>kg</span>
          </div>
          <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '500', marginTop: '4px' }}>
            Target: 65 kg
          </div>
        </div>

        <div className="glass-card" style={{ background: 'var(--glass-bg)', backdropFilter: 'var(--glass-backdrop)', WebkitBackdropFilter: 'var(--glass-backdrop)', borderRadius: '20px', padding: '24px', border: 'var(--glass-border)', boxShadow: 'var(--glass-shadow)' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lifetime Volume Moved</div>
          <div style={{ fontSize: '36px', fontWeight: '800', color: '#FF7243', letterSpacing: '-1px', marginTop: '6px' }}>
            {totalLifetimeVolume.toLocaleString()} <span style={{ fontSize: '16px', color: '#8E8E93', fontWeight: '500' }}>kg</span>
          </div>
          <div style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '500', marginTop: '4px' }}>
            Progressive Overload
          </div>
        </div>
      </div>

      {/* Consistency Heatmap Card */}
      <div 
        className="glass-card"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-backdrop)',
          WebkitBackdropFilter: 'var(--glass-backdrop)',
          borderRadius: '24px',
          padding: '28px',
          border: 'var(--glass-border)',
          marginBottom: '28px',
          boxShadow: 'var(--glass-shadow)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Calendar size={18} color="#00D09C" />
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
            Training Consistency Heatmap
          </h2>
        </div>
        <WeeklyHeatmap workoutLogs={workoutLogs} />
      </div>

      {/* Sparkline Charts Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {/* Volume Sparkline Card */}
        {volumeData.length >= 2 && (
          <div 
            className="glass-card"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-backdrop)',
              WebkitBackdropFilter: 'var(--glass-backdrop)',
              borderRadius: '24px',
              padding: '28px',
              border: 'var(--glass-border)',
              boxShadow: 'var(--glass-shadow)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="#B2E040" />
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>Volume Trend</h3>
              </div>
              <span style={{ fontSize: '11px', color: '#B2E040', fontWeight: '700' }}>OVERLOAD WAVE</span>
            </div>
            <Sparkline 
              data={volumeData} 
              labels={volumeTrend.map(v => formatDate(v.date))} 
              height={85} 
              unit="kg" 
            />
          </div>
        )}

        {/* Weight Sparkline Card */}
        {weightData.length >= 2 && (
          <div 
            className="glass-card"
            style={{
              background: 'var(--glass-bg)',
              backdropFilter: 'var(--glass-backdrop)',
              WebkitBackdropFilter: 'var(--glass-backdrop)',
              borderRadius: '24px',
              padding: '28px',
              border: 'var(--glass-border)',
              boxShadow: 'var(--glass-shadow)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} color="#00D09C" />
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#FFFFFF' }}>Bodyweight Track</h3>
              </div>
              <span style={{ fontSize: '11px', color: '#00D09C', fontWeight: '700' }}>STABLE</span>
            </div>
            <Sparkline 
              data={weightData} 
              labels={weightLogs.map(w => formatDate(w.date))} 
              height={85} 
              unit="kg" 
            />
          </div>
        )}
      </div>

      {/* 1RM Strength Records */}
      {strengthProgress.length > 0 && (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '22px' }}>
            <Award size={20} color="#FF7243" />
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF' }}>
              Estimated 1RM & Progressive Overload
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {strengthProgress.map((ex, idx) => (
              <div 
                key={idx} 
                className="glass-card"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: '#FFFFFF' }}>{ex.name}</div>
                  <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '2px' }}>
                    Top: {ex.currentWeight} kg {ex.diff > 0 && <span style={{ color: '#00D09C' }}> (+{ex.diff} kg)</span>}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#FF7243' }}>
                    {ex.est1RM} <span style={{ fontSize: '12px', fontWeight: '500', color: '#8E8E93' }}>kg</span>
                  </div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: '#8E8E93' }}>1RM EST</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Workout History Expandable Cards */}
      <div 
        className="glass-card"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'var(--glass-backdrop)',
          WebkitBackdropFilter: 'var(--glass-backdrop)',
          borderRadius: '24px',
          padding: '28px',
          border: 'var(--glass-border)',
          boxShadow: 'var(--glass-shadow)'
        }}
      >
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', marginBottom: '20px' }}>
          Workout History ({sortedLogs.length})
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {sortedLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const totalSets = log.exercises.reduce((acc, ex) => acc + (ex.sets ? ex.sets.length : 0), 0);
            const volume = progressionService.calculateSessionVolume(log.exercises);
            
            return (
              <div 
                key={log.id} 
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderRadius: '16px',
                  padding: '18px 22px',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div 
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: '700', fontSize: '16px', color: '#FFFFFF' }}>{log.name}</span>
                      <span style={{
                        fontSize: '11px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        color: '#C0C0C0',
                        fontWeight: '600'
                      }}>
                        {formatDate(log.date)}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '4px' }}>
                      {log.exercises.length} Exercises · {totalSets} Sets · {volume.toLocaleString()} kg volume
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteWorkoutLog(log.id);
                      }}
                      aria-label="Delete Log"
                      style={{ color: '#8E8E93', opacity: 0.4, padding: '4px' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                    >
                      <Trash2 size={16} />
                    </button>
                    {isExpanded ? <ChevronUp size={18} color="#8E8E93" /> : <ChevronDown size={18} color="#8E8E93" />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {log.exercises.map((ex, exIdx) => (
                        <div key={exIdx} style={{ fontSize: '13px', color: '#E0E0E0' }}>
                          <div style={{ fontWeight: '700', color: '#FFFFFF', marginBottom: '4px' }}>{ex.name}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {ex.sets?.map((s, sIdx) => (
                              <span key={sIdx} style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                padding: '3px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                color: s.completed !== false ? '#00D09C' : '#8E8E93'
                              }}>
                                Set {sIdx + 1}: {s.weight || 0} kg × {s.reps || 0}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
