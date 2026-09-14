import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Utensils, Trash2 } from 'lucide-react';
import TopNavbar from '../components/TopNavbar';
import FloatingAction from '../components/FloatingAction';
import ActivityChartCard from '../components/dashboard/ActivityChartCard';
import WorkoutGoalsCard from '../components/dashboard/WorkoutGoalsCard';
import HealthScoreCard from '../components/dashboard/HealthScoreCard';
import HeartBeatCard from '../components/dashboard/HeartBeatCard';
import WeightGoalsCard from '../components/dashboard/WeightGoalsCard';
import CalorieAnalysisCard from '../components/dashboard/CalorieAnalysisCard';
import DistanceCard from '../components/dashboard/DistanceCard';
import { useStore, getTodayStr } from '../store/useStore';
import SEOHead from '../components/SEOHead';

export default function Home() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  
  const plan = useStore(state => state.plan);
  const foodLogs = useStore(state => state.foodLogs);
  const deleteFoodLog = useStore(state => state.deleteFoodLog);
  const activeWorkout = useStore(state => state.activeWorkout);
  const authToken = useStore(state => state.authToken);
  
  const todayStr = getTodayStr();
  const todayFoods = foodLogs.filter(log => log.date === todayStr);
  const isWorkoutInProgress = activeWorkout?.date === todayStr;
  
  const targetCalories = Number(plan?.macroTargets?.calories) || 2000;
  const totalCalories = todayFoods.reduce((acc, curr) => acc + (Number(curr.calories) || 0), 0);
  const netDelta = targetCalories - totalCalories;


  return (
    <div className="animate-slide-up" style={{ paddingBottom: '100px', width: '100%' }}>
      <SEOHead
        title="Dashboard | Anchor — Zero-Bloat Fitness OS"
        description="Your daily training cockpit: unified workout overview, macro consumption balance, biometric heart rate, and GPS distance."
      />
      {/* VEXORA TOP NAVBAR */}
      <TopNavbar />

      {/* SUB-HEADER: TACTICAL DEFICIT & CONTEXT */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#8E8E93', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            OVERVIEW
          </span>
          <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#8E8E93' }} />
          {authToken ? (
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#00D09C', letterSpacing: '0.5px' }}>
              LIVE SYNCED
            </span>
          ) : (
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#8E8E93', letterSpacing: '0.5px' }}>
              LOCAL FIRST
            </span>
          )}
        </div>

        <div>
          {netDelta >= 0 ? (
            <span style={{ 
              fontSize: '11px', 
              fontWeight: '800', 
              background: 'rgba(0, 208, 156, 0.1)', 
              border: '1px solid rgba(0, 208, 156, 0.3)', 
              padding: '6px 14px', 
              borderRadius: '9999px',
              color: '#00D09C', 
              letterSpacing: '0.5px' 
            }}>
              DEFICIT: -{netDelta} KCAL REMAINING
            </span>
          ) : (
            <span style={{ 
              fontSize: '11px', 
              fontWeight: '800', 
              background: 'rgba(255, 114, 67, 0.1)', 
              border: '1px solid rgba(255, 114, 67, 0.3)', 
              padding: '6px 14px', 
              borderRadius: '9999px',
              color: '#FF7243', 
              letterSpacing: '0.5px' 
            }}>
              SURPLUS: +{Math.abs(netDelta)} KCAL
            </span>
          )}
        </div>
      </div>

      {/* VEXORA 2-ROW / 3-COLUMN 12-COL GRID */}
      <div className="vexora-dashboard-grid">
        {/* ROW 1 */}
        {/* Col 1: Activity Chart Card (6 of 12 columns = 50% width) */}
        <div className="grid-col-6">
          <ActivityChartCard />
        </div>

        {/* Col 2: Workout Goals Circular Arc Gauge (3 of 12 columns = 25% width) */}
        <div className="grid-col-3">
          <WorkoutGoalsCard />
        </div>

        {/* Col 3: Stacked Health Score + Heart Beat Pulse (3 of 12 columns = 25% width) */}
        <div className="grid-col-3" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <HealthScoreCard />
          <HeartBeatCard />
        </div>

        {/* ROW 2 */}
        {/* Col 1: Weight & Performance Goals (3 of 12 columns = 25% width) */}
        <div className="grid-col-3">
          <WeightGoalsCard />
        </div>

        {/* Col 2: Calories Analysis Multi-Segmented Bar (6 of 12 columns = 50% width) */}
        <div className="grid-col-6">
          <CalorieAnalysisCard />
        </div>

        {/* Col 3: Distance & Satellite Street Map (3 of 12 columns = 25% width) */}
        <div className="grid-col-3">
          <DistanceCard />
        </div>
      </div>

      {/* TODAY'S LOGGED FOOD ENTRIES (IF ANY) */}
      {todayFoods.length > 0 && (
        <section style={{ marginTop: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '13px', fontWeight: '800', color: '#8E8E93', letterSpacing: '1px', textTransform: 'uppercase' }}>
              TODAY'S LOGGED FOODS ({todayFoods.length})
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {todayFoods.map((f, i) => (
              <div 
                key={f.id || `food-${i}`} 
                className="animate-slide-up" 
                style={{ 
                  animationDelay: `${i * 0.04}s`, 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.18)',
                  boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.07)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#FFFFFF' }}>{f.name}</span>
                    {f.source === 'ai' && (
                      <span style={{ fontSize: '9px', fontWeight: '700', color: '#00D09C', border: '1px solid #00D09C', padding: '1px 4px', borderRadius: '4px' }}>✦ AI</span>
                    )}
                    {f.source === 'local' && (
                      <span style={{ fontSize: '9px', fontWeight: '700', color: '#00D09C', opacity: 0.7, padding: '1px 4px', borderRadius: '4px' }}>⚡ FAST</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '2px' }}>
                    {f.protein || 0}g P · {f.carbs || 0}g C · {f.fat || 0}g F
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#00D09C' }}>
                    {f.calories} <span style={{ fontSize: '10px', opacity: 0.6 }}>kcal</span>
                  </div>
                  <button 
                    onClick={() => deleteFoodLog(f.id)}
                    aria-label={`Delete ${f.name}`}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#FFFFFF',
                      opacity: 0.35,
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'opacity 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.35'}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FLOATING ACTION MENU */}
      {showMenu && (
        <div 
          className="animate-fade-in"
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0, 0, 0, 0.28)', 
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            zIndex: 40, 
            animationDuration: '0.2s' 
          }}
          onClick={() => setShowMenu(false)}
        >
          <div style={{ position: 'absolute', bottom: 'max(140px, env(safe-area-inset-bottom) + 140px)', right: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' }} onClick={e => e.stopPropagation()}>
             <button className="btn-secondary animate-slide-up" onClick={() => { setShowMenu(false); navigate(isWorkoutInProgress ? '/log-workout' : '/workout-overview'); }} style={{ display: 'flex', gap: '12px', justifyContent: 'center', animationDuration: '0.2s', animationDelay: '0.05s', padding: '16px 24px', background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.16)', borderRadius: '16px', color: '#FFFFFF', boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.4)' }}>
               <Dumbbell size={20} /> Log Workout
             </button>
             <button className="btn-primary animate-slide-up" onClick={() => { setShowMenu(false); navigate('/log-food'); }} style={{ display: 'flex', gap: '12px', justifyContent: 'center', animationDuration: '0.2s', animationDelay: '0.1s', padding: '16px 24px', background: '#FF7243', color: '#FFFFFF', border: 'none', borderRadius: '16px', boxShadow: 'none' }}>
               <Utensils size={20} /> Log Food
             </button>
          </div>
        </div>
      )}

      <FloatingAction isOpen={showMenu} onClick={() => setShowMenu(!showMenu)} />
    </div>
  );
}
