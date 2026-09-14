import { getTodayStr } from '../store/useStore';

export default function WeeklyHeatmap({ workoutLogs = [] }) {
  const todayStr = getTodayStr();
  const loggedDates = new Set(workoutLogs.map(l => l.date));

  // Determine the 7 days of the current week (Monday to Sunday)
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
  const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

  const weekDays = [];
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const isCompleted = loggedDates.has(dateStr);
    const isToday = dateStr === todayStr;

    weekDays.push({
      dateStr,
      label: dayNames[i],
      isCompleted,
      isToday
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.8px', color: 'var(--text-color)', opacity: 0.6 }}>
          THIS WEEK
        </span>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-color)' }}>
          {weekDays.filter(d => d.isCompleted).length} / 7 DAYS
        </span>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 12px',
        background: 'var(--surface-color)',
        border: '1px solid var(--border-color)'
      }}>
        {weekDays.map((day, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: '700', 
              opacity: day.isToday ? 1 : 0.4,
              color: day.isToday ? 'var(--primary-color)' : 'var(--text-color)'
            }}>
              {day.label}
            </span>
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: day.isCompleted ? 'var(--primary-color)' : 'transparent',
              border: day.isCompleted 
                ? 'none' 
                : day.isToday 
                  ? '2px solid var(--primary-color)' 
                  : '1.5px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}
