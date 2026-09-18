import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import TopNavbar from '../components/TopNavbar';
import ActivityChartCard from '../components/dashboard/ActivityChartCard';
import WorkoutGoalsCard from '../components/dashboard/WorkoutGoalsCard';
import HealthScoreCard from '../components/dashboard/HealthScoreCard';
import HeartBeatCard from '../components/dashboard/HeartBeatCard';
import WeightGoalsCard from '../components/dashboard/WeightGoalsCard';
import CalorieAnalysisCard from '../components/dashboard/CalorieAnalysisCard';
import DistanceCard from '../components/dashboard/DistanceCard';
import { useStore, getTodayStr } from '../store/useStore';
import SEOHead from '../components/SEOHead';

const DEFAULT_CARD_ORDER = ['activity', 'workout-goals', 'vitals', 'weight-body', 'calorie-analysis', 'distance'];

const CARD_DEFINITIONS = {
  'activity': {
    id: 'activity',
    className: 'grid-col-6',
    render: (props) => <ActivityChartCard {...props} />
  },
  'workout-goals': {
    id: 'workout-goals',
    className: 'grid-col-3',
    render: (props) => <WorkoutGoalsCard {...props} />
  },
  'vitals': {
    id: 'vitals',
    className: 'grid-col-3',
    render: (props) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
        <HealthScoreCard {...props} />
        <HeartBeatCard {...props} />
      </div>
    )
  },
  'weight-body': {
    id: 'weight-body',
    className: 'grid-col-3',
    render: (props) => <WeightGoalsCard {...props} />
  },
  'calorie-analysis': {
    id: 'calorie-analysis',
    className: 'grid-col-6',
    render: (props) => <CalorieAnalysisCard {...props} />
  },
  'distance': {
    id: 'distance',
    className: 'grid-col-3',
    render: (props) => <DistanceCard {...props} />
  }
};

const normalizeOrder = (order) => {
  if (!Array.isArray(order) || order.length === 0) return DEFAULT_CARD_ORDER;
  const result = [];
  for (const item of order) {
    if (item === 'health-score' || item === 'heart-beat') {
      if (!result.includes('vitals')) result.push('vitals');
    } else if (CARD_DEFINITIONS[item] && !result.includes(item)) {
      result.push(item);
    }
  }
  for (const key of DEFAULT_CARD_ORDER) {
    if (!result.includes(key)) result.push(key);
  }
  return result;
};

export default function Home() {
  const navigate = useNavigate();
  
  const plan = useStore(state => state.plan);
  const foodLogs = useStore(state => state.foodLogs);
  const deleteFoodLog = useStore(state => state.deleteFoodLog);
  const authToken = useStore(state => state.authToken);
  const storedCardOrder = useStore(state => state.dashboardCardOrder);
  const setDashboardCardOrder = useStore(state => state.setDashboardCardOrder);
  
  const [cardsOrder, setCardsOrder] = useState(() => normalizeOrder(storedCardOrder));
  const [draggedCardId, setDraggedCardId] = useState(null);
  const [dragOverCardId, setDragOverCardId] = useState(null);

  const todayStr = getTodayStr();
  const todayFoods = foodLogs.filter(log => log.date === todayStr);
  
  const targetCalories = Number(plan?.macroTargets?.calories) || 2000;
  const totalCalories = todayFoods.reduce((acc, curr) => acc + (Number(curr.calories) || 0), 0);
  const netDelta = targetCalories - totalCalories;

  const handleDragStart = (id) => {
    setDraggedCardId(id);
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    if (dragOverCardId !== targetId) {
      setDragOverCardId(targetId);
    }
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedCardId || draggedCardId === targetId) {
      setDraggedCardId(null);
      setDragOverCardId(null);
      return;
    }

    const newOrder = [...cardsOrder];
    const srcIdx = newOrder.indexOf(draggedCardId);
    const tgtIdx = newOrder.indexOf(targetId);
    if (srcIdx !== -1 && tgtIdx !== -1) {
      newOrder.splice(srcIdx, 1);
      newOrder.splice(tgtIdx, 0, draggedCardId);
      setCardsOrder(newOrder);
      if (setDashboardCardOrder) {
        setDashboardCardOrder(newOrder);
      }
    }
    setDraggedCardId(null);
    setDragOverCardId(null);
  };

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

      {/* VEXORA DYNAMIC CARD GRID WITH DRAG & DROP REORDERING */}
      <div className="vexora-dashboard-grid">
        {cardsOrder.map((cardId) => {
          const cardDef = CARD_DEFINITIONS[cardId];
          if (!cardDef) return null;

          const isOver = dragOverCardId === cardId && draggedCardId !== cardId;
          const isDragging = draggedCardId === cardId;

          return (
            <div
              key={cardId}
              className={cardDef.className}
              onDragOver={(e) => handleDragOver(e, cardId)}
              onDrop={(e) => handleDrop(e, cardId)}
              style={{
                opacity: isDragging ? 0.4 : 1,
                transform: isOver ? 'scale(1.01)' : 'scale(1)',
                transition: 'transform 0.2s ease, opacity 0.2s ease',
                borderRadius: '24px',
                boxShadow: isOver ? '0 0 0 2px #00D09C' : 'none'
              }}
            >
              {cardDef.render({
                dragHandleProps: {
                  draggable: true,
                  onDragStart: () => handleDragStart(cardId),
                  onDragEnd: () => {
                    setDraggedCardId(null);
                    setDragOverCardId(null);
                  }
                }
              })}
            </div>
          );
        })}
      </div>

      {/* TODAY'S LOGGED FOOD ENTRIES */}
      <section style={{ marginTop: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '800', color: '#8E8E93', letterSpacing: '1px', textTransform: 'uppercase' }}>
            TODAY&apos;S LOGGED FOODS ({todayFoods.length})
          </h2>
          <button
            onClick={() => navigate('/log-food')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10B981',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)';
            }}
          >
            <Plus size={14} /> Log Food
          </button>
        </div>

        {todayFoods.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed rgba(255, 255, 255, 0.08)',
            color: '#71717A',
            fontSize: '13px'
          }}>
            No meals logged today yet. Click &quot;+ Log Food&quot; to track your calories and macros.
          </div>
        ) : (
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
        )}
      </section>
    </div>
  );
}
