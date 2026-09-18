import { useState } from 'react';
import { GripVertical, Edit3, Check, TrendingDown, TrendingUp, Sparkles } from 'lucide-react';
import { useStore, getTodayStr } from '../../store/useStore';

export default function WeightGoalsCard({ dragHandleProps }) {
  const weightLogs = useStore(state => state.weightLogs);
  const foodLogs = useStore(state => state.foodLogs);
  const workoutLogs = useStore(state => state.workoutLogs);
  const getActiveProfile = useStore(state => state.getActiveProfile);
  const updateWeightGoals = useStore(state => state.updateWeightGoals);

  const activeProfile = getActiveProfile ? getActiveProfile() : null;

  const currentWeight = weightLogs.length > 0 ? Number(weightLogs[weightLogs.length - 1].weight) : (activeProfile?.weight || 75);
  const goalWeight = activeProfile?.targetWeight || 65;

  const [isEditing, setIsEditing] = useState(false);
  const [inputCurWeight, setInputCurWeight] = useState(String(currentWeight));
  const [inputGoalWeight, setInputGoalWeight] = useState(String(goalWeight));

  const deltaToGoal = Number((currentWeight - goalWeight).toFixed(1));
  const isLossGoal = goalWeight <= currentWeight;

  // Real Metabolic Energy Balance Formula
  const todayStr = getTodayStr();
  const todayFoods = foodLogs.filter(f => f.date === todayStr);
  const intakeCals = todayFoods.reduce((acc, f) => acc + (Number(f.calories) || 0), 0);
  
  // Basal Burn ~ weight * 26 kcal + Workout Burn ~ 12 kcal per completed set
  const bmrBurn = Math.round(currentWeight * 26);
  const todaySessions = workoutLogs.filter(w => w.date === todayStr);
  let todaySets = 0;
  todaySessions.forEach(s => {
    (s.exercises || []).forEach(e => {
      (e.sets || []).forEach(setItem => {
        if (setItem.completed) todaySets++;
      });
    });
  });
  const workoutBurn = todaySets * 12;
  const totalBurn = bmrBurn + workoutBurn;
  const netDelta = intakeCals - totalBurn; // negative is calorie deficit
  const deficitRateKcal = Math.abs(netDelta);
  // 7,700 kcal deficit = 1 kg fat loss
  const projectedWeeklyKg = Number(((deficitRateKcal * 7) / 7700).toFixed(2));

  const handleSaveGoals = (e) => {
    e.preventDefault();
    const cur = parseFloat(inputCurWeight);
    const goal = parseFloat(inputGoalWeight);
    if (!isNaN(cur) && cur > 20 && !isNaN(goal) && goal > 20) {
      updateWeightGoals(cur, goal);
      setIsEditing(false);
    }
  };

  // Dynamic SVG chart coordinates from real weightLogs + Goal projection
  const chartWidth = 280;
  const chartHeight = 80;

  let points = [];
  if (weightLogs.length > 0) {
    const recentLogs = weightLogs.slice(-5);
    const allWeights = [...recentLogs.map(w => Number(w.weight)), goalWeight];
    const minW = Math.min(...allWeights) - 2;
    const maxW = Math.max(...allWeights) + 2;
    const range = maxW - minW || 1;

    const totalSteps = recentLogs.length;
    points = recentLogs.map((w, idx) => {
      const x = 12 + (idx / totalSteps) * (chartWidth - 50);
      const y = chartHeight - 15 - ((Number(w.weight) - minW) / range) * (chartHeight - 30);
      return { x, y, label: w.date ? w.date.slice(5) : `P${idx}` };
    });

    // Add Goal point at far right
    const goalY = chartHeight - 15 - ((goalWeight - minW) / range) * (chartHeight - 30);
    points.push({ x: chartWidth - 14, y: goalY, label: 'Goal' });
  } else {
    // Smooth baseline from current to goal
    points = [
      { x: 12, y: 55, label: 'Start' },
      { x: 80, y: 50, label: 'W2' },
      { x: 150, y: 44, label: 'W3' },
      { x: 220, y: 38, label: 'W4' },
      { x: chartWidth - 14, y: 32, label: 'Goal' }
    ];
  }

  let pathD = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    pathD += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
  }

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
      border: 'var(--glass-border)',
      boxShadow: 'var(--glass-shadow)',
      height: '100%'
    }}>
      {/* Header: Title + Action Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
          Weight & Body
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            onClick={() => setIsEditing(!isEditing)}
            aria-label="Edit Weight and Goals"
            title="Edit weight and target goal"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: isEditing ? 'rgba(0, 208, 156, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              border: isEditing ? '1px solid rgba(0, 208, 156, 0.35)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isEditing ? '#00D09C' : '#8E8E93',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Edit3 size={15} />
          </button>

          <div 
            {...dragHandleProps}
            role="button"
            tabIndex={0}
            aria-label="Move Card"
            title="Drag to rearrange dashboard cards"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8E8E93',
              cursor: 'grab'
            }}
          >
            <GripVertical size={16} />
          </div>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSaveGoals} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '600' }}>Current Weight (kg)</span>
            <input
              type="number"
              step="0.1"
              value={inputCurWeight}
              onChange={(e) => setInputCurWeight(e.target.value)}
              style={{
                width: '80px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: '700',
                textAlign: 'right'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '600' }}>Weight Goal (kg)</span>
            <input
              type="number"
              step="0.1"
              value={inputGoalWeight}
              onChange={(e) => setInputGoalWeight(e.target.value)}
              style={{
                width: '80px',
                padding: '6px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: '700',
                textAlign: 'right'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '10px',
              borderRadius: '12px',
              background: '#00D09C',
              color: '#0D0D0D',
              fontWeight: '700',
              fontSize: '13px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              marginTop: '4px'
            }}
          >
            <Check size={16} /> Save Changes
          </button>
        </form>
      ) : (
        /* 3 Metric Rows */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
          {/* Row 1: Current Weight */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '500' }}>
              Current Weight
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: '800', color: '#FFFFFF' }}>
                {currentWeight}
              </span>
              <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '500' }}>
                kg
              </span>
            </div>
          </div>

          {/* Row 2: Weight Goal */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '500' }}>
              Weight Goal
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '22px', fontWeight: '800', color: '#FFFFFF' }}>
                {goalWeight}
              </span>
              <span style={{ fontSize: '12px', color: '#8E8E93', fontWeight: '500' }}>
                kg
              </span>
            </div>
          </div>

          {/* Row 3: Progress & Real Metabolic Projection */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '500' }}>
              Progress
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isLossGoal ? <TrendingDown size={16} color="#00D09C" /> : <TrendingUp size={16} color="#00D09C" />}
              <span style={{ fontSize: '18px', fontWeight: '800', color: '#00D09C' }}>
                {Math.abs(deltaToGoal)} kg {deltaToGoal === 0 ? 'achieved!' : 'left'}
              </span>
            </div>
          </div>

          {/* Micro Energy Balance Badge */}
          <div style={{
            fontSize: '11px',
            color: '#8E8E93',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '6px 12px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Energy: {netDelta <= 0 ? `-${Math.abs(netDelta)} kcal deficit` : `+${netDelta} kcal surplus`}</span>
            <span style={{ color: '#00D09C', fontWeight: 600 }}>~{projectedWeeklyKg} kg/wk</span>
          </div>
        </div>
      )}

      {/* Bottom Chart Canvas */}
      <div style={{ position: 'relative', width: '100%', marginTop: 'auto' }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: '100%', height: '70px', overflow: 'visible' }}
        >
          {/* Subtle horizontal grid lines */}
          <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
          <line x1="0" y1="50" x2={chartWidth} y2="50" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />

          {/* Target Goal Line at far right */}
          <line x1={chartWidth - 14} y1="10" x2={chartWidth - 14} y2="70" stroke="rgba(0, 208, 156, 0.25)" strokeDasharray="2 2" />

          {/* Emerald Spline Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#00D09C"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Points on spline */}
          {points.map((p, idx) => (
            <circle
              key={`pt-${idx}`}
              cx={p.x}
              cy={p.y}
              r={idx === points.length - 1 ? "4" : "3"}
              fill={idx === points.length - 1 ? "#00D09C" : "#FFFFFF"}
              stroke="#0D0D0D"
              strokeWidth="1.5"
            />
          ))}
        </svg>

        {/* Month / point labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '4px 6px 0 6px',
          marginTop: '4px'
        }}>
          {points.map((p, idx) => (
            <span key={`label-${idx}`} style={{ fontSize: '10px', color: '#8E8E93', fontWeight: '500' }}>
              {p.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
