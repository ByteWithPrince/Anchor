import { GripVertical } from 'lucide-react';
import { useStore, getTodayStr } from '../../store/useStore';
import { progressionService } from '../../services/progressionService';

export default function ActivityChartCard({ dragHandleProps }) {
  const workoutLogs = useStore(state => state.workoutLogs);
  const getWeeklyWorkoutActivity = useStore(state => state.getWeeklyWorkoutActivity);
  const getWeekOverWeekChange = useStore(state => state.getWeekOverWeekChange);
  const todayStr = getTodayStr();

  // Compute real 7-day activity sequence (Sun to Sat)
  const days = getWeeklyWorkoutActivity ? getWeeklyWorkoutActivity() : [];
  const wow = getWeekOverWeekChange ? getWeekOverWeekChange() : { raw: '0%', isPositive: true, changePct: 0 };

  // Real workout volume calculation for today
  const todaySession = workoutLogs.filter(w => w.date === todayStr);
  const todayVol = todaySession.reduce((acc, sess) => {
    return acc + progressionService.calculateSessionVolume(sess.exercises || []);
  }, 0);

  const barMaxHeight = 120;
  const width = 360;
  const height = 135;
  const stepX = days.length > 0 ? width / days.length : 51;

  // Calculate tip positions for each day to create exact roller-coaster curve over the bar tips
  const splinePoints = days.map((d, i) => {
    const x = i * stepX + stepX / 2;
    const fillHeight = d.pct > 0 ? Math.max(16, Math.round((d.pct / 100) * barMaxHeight)) : 12;
    const y = Math.max(12, barMaxHeight - fillHeight + 12);
    return { x, y, fillHeight, ...d };
  });

  // Cubic bezier path following bar tips
  let pathD = splinePoints.length > 0 ? `M ${splinePoints[0].x},${splinePoints[0].y}` : '';
  for (let i = 0; i < splinePoints.length - 1; i++) {
    const p0 = splinePoints[i];
    const p1 = splinePoints[i + 1];
    const cpX = (p0.x + p1.x) / 2;
    pathD += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
  }

  const activeBar = days.find(d => d.isActive) || days[days.length - 1] || { value: 'Today' };
  const activeIndex = Math.max(0, days.findIndex(d => d.isActive));

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
      position: 'relative',
      border: 'var(--glass-border)',
      boxShadow: 'var(--glass-shadow)',
      height: '100%'
    }}>
      {/* Top Header: Title + Drag Handle Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
          Activity
        </h2>
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
            cursor: 'grab',
            transition: 'all 0.2s ease'
          }}
        >
          <GripVertical size={16} />
        </div>
      </div>

      {/* Main Content: Left Stat Summary + Right Capsule Wave Chart */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(120px, 140px) 1fr',
        alignItems: 'center',
        gap: '24px',
        flex: 1
      }}>
        {/* Left Column Stat */}
        <div>
          <div style={{
            fontSize: '38px',
            fontWeight: '800',
            color: '#FFFFFF',
            letterSpacing: '-1.5px',
            lineHeight: 1
          }}>
            {wow.raw}
          </div>
          <p style={{
            fontSize: '13px',
            color: '#8E8E93',
            fontWeight: '400',
            lineHeight: 1.45,
            marginTop: '12px'
          }}>
            {wow.raw === '0%' 
              ? 'No activity logged yet this week' 
              : wow.changePct === 0
                ? `${wow.raw} volume tracked this week`
                : wow.isPositive 
                  ? "Tracking is higher than previous week" 
                  : "Volume is lower than previous week"}
          </p>
          {todayVol > 0 && (
            <div style={{ marginTop: '12px', fontSize: '11px', color: '#00D09C', fontWeight: '700' }}>
              ✦ {todayVol.toLocaleString()} kg volume today
            </div>
          )}
        </div>

        {/* Right Column: 7 Vertical Capsule Bars with Wave and Floating Pill */}
        <div style={{ position: 'relative', width: '100%', minHeight: '160px' }}>
          {/* Floating Active Pill */}
          <div style={{
            position: 'absolute',
            top: '-6px',
            left: `${(activeIndex * (100 / days.length)) + (50 / days.length)}%`,
            transform: 'translateX(-50%)',
            background: '#FFFFFF',
            color: '#161616',
            fontSize: '11px',
            fontWeight: '800',
            padding: '3px 10px',
            borderRadius: '9999px',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            whiteSpace: 'nowrap'
          }}>
            {activeBar.value}
          </div>

          {/* Overlaid Smooth White Spline Line connecting the tops of bars */}
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{
              position: 'absolute',
              top: '12px',
              left: 0,
              width: '100%',
              height: '135px',
              zIndex: 5,
              pointerEvents: 'none'
            }}
          >
            {/* Ambient glow behind spline */}
            <path
              d={pathD}
              fill="none"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Crisp white roller-coaster curve */}
            <path
              d={pathD}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Tip dots on each bar */}
            {splinePoints.map((pt, i) => (
              <circle
                key={`dot-${i}`}
                cx={pt.x}
                cy={pt.y}
                r="3"
                fill={pt.isToday ? '#00D09C' : '#FFFFFF'}
              />
            ))}
          </svg>

          {/* Capsule Bars Grid */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            height: '155px',
            marginTop: '15px',
            padding: '0 4px'
          }}>
            {splinePoints.map((item, idx) => {
              const isItemActive = item.isActive;
              return (
                <div 
                  key={`day-bar-${idx}`} 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    flex: 1
                  }}
                >
                  {/* Vertical Capsule Track */}
                  <div style={{
                    width: '24px',
                    height: '120px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: isItemActive ? '1px solid rgba(0, 208, 156, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '9999px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    overflow: 'hidden',
                    padding: '2px'
                  }}>
                    {/* Dynamic Fill Pill based on completed workout sets */}
                    <div style={{
                      width: '100%',
                      height: `${item.fillHeight}px`,
                      background: isItemActive 
                        ? 'linear-gradient(180deg, #00D09C 0%, #10B981 100%)' 
                        : (item.pct > 0 ? '#10B981' : 'rgba(255, 255, 255, 0.15)'),
                      borderRadius: '9999px',
                      transition: 'height 0.4s ease',
                      position: 'relative'
                    }}>
                      {/* Top gloss on fill */}
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        right: '2px',
                        height: '4px',
                        background: 'rgba(255, 255, 255, 0.3)',
                        borderRadius: '9999px'
                      }} />
                    </div>
                  </div>

                  {/* Day Label */}
                  <span style={{
                    fontSize: '12px',
                    fontWeight: isItemActive ? '700' : '500',
                    color: isItemActive ? '#00D09C' : '#8E8E93',
                    transition: 'color 0.2s ease'
                  }}>
                    {item.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
