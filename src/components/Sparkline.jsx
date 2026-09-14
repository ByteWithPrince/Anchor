import { useState, useRef } from 'react';

export default function Sparkline({ data = [], labels = [], height = 70, color = 'var(--primary-color)', unit = '' }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const svgRef = useRef(null);

  if (!data || data.length < 2) {
    return (
      <div style={{ height: `${height}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.3, fontSize: '12px' }}>
        Not enough data points
      </div>
    );
  }

  const values = data.map(Number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max === min ? 1 : max - min;

  const width = 300;
  const paddingY = 12;
  const graphHeight = height - paddingY * 2;

  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * graphHeight;
    return { x, y, val, label: labels[idx] || null };
  });

  const pathD = `M ${points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
  const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

  const activePoint = hoverIdx !== null ? points[hoverIdx] : points[points.length - 1];

  const handlePointerMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const ratio = relX / rect.width;
    const closestIdx = Math.round(ratio * (values.length - 1));
    setHoverIdx(closestIdx);
  };

  const handlePointerLeave = () => {
    setHoverIdx(null);
  };

  return (
    <div style={{ width: '100%', position: 'relative', userSelect: 'none' }}>
      {/* Active Value Readout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px', padding: '0 4px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-color)', opacity: 0.5, letterSpacing: '0.5px' }}>
          {activePoint.label || (hoverIdx !== null ? `ENTRY ${hoverIdx + 1}` : 'LATEST')}
        </span>
        <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--primary-color)', fontVariantNumeric: 'tabular-nums' }}>
          {activePoint.val.toLocaleString()} {unit}
        </span>
      </div>

      <div 
        style={{ width: '100%', overflow: 'hidden', cursor: 'crosshair', touchAction: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerLeave}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: `${height}px`, display: 'block' }}
        >
          <defs>
            <linearGradient id={`sparkline-grad-${color.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Gradient area */}
          <path d={areaD} fill={`url(#sparkline-grad-${color.replace(/[^a-zA-Z0-9]/g, '')})`} />

          {/* Base Polyline */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Crosshair & Cursor */}
          {hoverIdx !== null && (
            <line
              x1={activePoint.x}
              y1={paddingY}
              x2={activePoint.x}
              y2={height}
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {/* Glowing Cursor Dot */}
          <circle
            cx={activePoint.x}
            cy={activePoint.y}
            r={hoverIdx !== null ? 5 : 3.5}
            fill={color}
            stroke="#0D0D0D"
            strokeWidth={hoverIdx !== null ? 2 : 1}
            style={{ transition: 'r 0.15s ease' }}
          />
        </svg>
      </div>
    </div>
  );
}
