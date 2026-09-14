import { MoreHorizontal } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function WeightGoalsCard() {
  const weightLogs = useStore(state => state.weightLogs);
  const getActiveProfile = useStore(state => state.getActiveProfile);
  const activeProfile = getActiveProfile ? getActiveProfile() : null;

  const currentWeight = weightLogs.length > 0 ? Number(weightLogs[weightLogs.length - 1].weight) : (activeProfile?.weight || 70);
  const goalWeight = activeProfile?.targetWeight || 65;
  const initialWeight = weightLogs.length > 1 ? Number(weightLogs[0].weight) : currentWeight;
  const deltaToGoal = Number((currentWeight - goalWeight).toFixed(1));
  const progressText = weightLogs.length > 1 
    ? `${Math.abs(currentWeight - initialWeight).toFixed(1)} kg` 
    : `${Math.abs(deltaToGoal)} kg left`;

  // Dynamic spline points from weight logs or target trend
  const chartWidth = 280;
  const chartHeight = 80;

  // Derive last 6 points from weightLogs or baseline
  let rawPoints = [];
  if (weightLogs.length >= 2) {
    const slice = weightLogs.slice(-6);
    const weights = slice.map(w => Number(w.weight));
    const minW = Math.min(...weights, goalWeight) - 2;
    const maxW = Math.max(...weights, goalWeight) + 2;
    const range = maxW - minW || 1;

    rawPoints = slice.map((w, idx) => {
      const x = 10 + (idx / Math.max(1, slice.length - 1)) * (chartWidth - 20);
      const y = chartHeight - 15 - ((Number(w.weight) - minW) / range) * (chartHeight - 30);
      return { x, y, label: w.date ? w.date.slice(5) : `P${idx}` };
    });
  } else {
    // Elegant baseline contour if new profile
    rawPoints = [
      { x: 10, y: 55, label: 'W1' },
      { x: 60, y: 52, label: 'W2' },
      { x: 110, y: 48, label: 'W3' },
      { x: 160, y: 42, label: 'W4' },
      { x: 210, y: 38, label: 'W5' },
      { x: 270, y: 32, label: 'Goal' }
    ];
  }

  let pathD = `M ${rawPoints[0].x},${rawPoints[0].y}`;
  for (let i = 0; i < rawPoints.length - 1; i++) {
    const p0 = rawPoints[i];
    const p1 = rawPoints[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    pathD += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
  }

  const months = rawPoints.map(p => p.label);

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
      boxShadow: 'var(--glass-shadow)'
    }}>
      {/* Header: Title + ... Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
          Weight & Body
        </h2>
        <button 
          aria-label="Goals Menu"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8E8E93'
          }}
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* 3 Metric Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
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

        {/* Row 3: Progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '13px', color: '#8E8E93', fontWeight: '500' }}>
            Progress
          </span>
          <span style={{ fontSize: '20px', fontWeight: '800', color: '#FFFFFF' }}>
            {progressText}
          </span>
        </div>
      </div>

      {/* Bottom Chart Canvas */}
      <div style={{ position: 'relative', width: '100%', marginTop: 'auto' }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: '100%', height: '70px', overflow: 'visible' }}
        >
          {/* Subtle horizontal grid lines */}
          <line x1="0" y1="20" x2={chartWidth} y2="20" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />
          <line x1="0" y1="50" x2={chartWidth} y2="50" stroke="rgba(255, 255, 255, 0.05)" strokeDasharray="3 3" />

          {/* Lime Green Spline */}
          <path
            d={pathD}
            fill="none"
            stroke="#B2E040"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>

        {/* Month / point labels */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '4px 8px 0 8px',
          marginTop: '4px'
        }}>
          {months.map((m, idx) => (
            <span key={`month-${idx}`} style={{ fontSize: '11px', color: '#8E8E93', fontWeight: '500' }}>
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
