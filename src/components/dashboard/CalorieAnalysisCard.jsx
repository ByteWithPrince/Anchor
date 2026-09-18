import { useState } from 'react';
import { GripVertical, Zap, Droplet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore, getTodayStr } from '../../store/useStore';

export default function CalorieAnalysisCard({ dragHandleProps }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('Daily');
  const plan = useStore(state => state.plan);
  const foodLogs = useStore(state => state.foodLogs);
  const todayStr = getTodayStr();

  // Targets
  const targetCalories = Number(plan?.macroTargets?.calories) || 2100;
  const targetProtein = Number(plan?.macroTargets?.protein) || 180;
  const targetCarbs = Number(plan?.macroTargets?.carbs) || 182;
  const targetFat = Number(plan?.macroTargets?.fat) || 65;

  // Daily logs
  const todayFoods = foodLogs.filter(f => f.date === todayStr);
  const todayCalories = todayFoods.reduce((acc, f) => acc + (Number(f.calories) || 0), 0);
  const todayProtein = todayFoods.reduce((acc, f) => acc + (Number(f.protein) || 0), 0);
  const todayCarbs = todayFoods.reduce((acc, f) => acc + (Number(f.carbs) || 0), 0);
  const todayFat = todayFoods.reduce((acc, f) => acc + (Number(f.fat) || 0), 0);

  // Weekly 7-day average calculation
  const past7Dates = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    past7Dates.push(d.toISOString().split('T')[0]);
  }
  const weekFoods = foodLogs.filter(f => past7Dates.includes(f.date));
  const weekAvgCalories = Math.round(weekFoods.reduce((acc, f) => acc + (Number(f.calories) || 0), 0) / 7);
  const weekAvgProtein = Math.round(weekFoods.reduce((acc, f) => acc + (Number(f.protein) || 0), 0) / 7);
  const weekAvgCarbs = Math.round(weekFoods.reduce((acc, f) => acc + (Number(f.carbs) || 0), 0) / 7);
  const weekAvgFat = Math.round(weekFoods.reduce((acc, f) => acc + (Number(f.fat) || 0), 0) / 7);

  const currentCalories = filter === 'Daily' ? todayCalories : weekAvgCalories;
  const currentProtein = filter === 'Daily' ? todayProtein : weekAvgProtein;
  const currentCarbs = filter === 'Daily' ? todayCarbs : weekAvgCarbs;
  const currentFat = filter === 'Daily' ? todayFat : weekAvgFat;

  const unitText = filter === 'Daily' ? 'Today' : 'Daily avg';

  // 4 Macro Rows (Calories, Carbs, Fat, Protein)
  const rows = [
    {
      id: 'cal',
      name: 'Calories',
      icon: Zap,
      color: '#00D09C',
      intake: currentCalories > 0 ? `${currentCalories} kcal` : '0 kcal',
      unit: unitText,
      goal: `${targetCalories}.00`,
      pct: `${Math.min(100, Math.round((currentCalories / targetCalories) * 100))}%`
    },
    {
      id: 'carbs',
      name: 'Carbs',
      icon: Zap,
      color: '#F4C767',
      intake: currentCarbs > 0 ? `${currentCarbs} g` : '0 g',
      unit: unitText,
      goal: `${targetCarbs}.00`,
      pct: `${Math.min(100, Math.round((currentCarbs / targetCarbs) * 100))}%`
    },
    {
      id: 'fat',
      name: 'Fat',
      icon: Droplet,
      color: '#FF7243',
      intake: currentFat > 0 ? `${currentFat} g` : '0 g',
      unit: unitText,
      goal: `${targetFat}.00`,
      pct: `${Math.min(100, Math.round((currentFat / targetFat) * 100))}%`
    },
    {
      id: 'protein',
      name: 'Protein',
      icon: Zap,
      color: '#B2E040',
      intake: currentProtein > 0 ? `${currentProtein} g` : '0 g',
      unit: unitText,
      goal: `${targetProtein}.00`,
      pct: `${Math.min(100, Math.round((currentProtein / targetProtein) * 100))}%`
    }
  ];

  // Dynamic flex ratios for top segmented bar based on actual macro grams
  const macroSum = (currentProtein + currentCarbs + currentFat) || 1;
  const flexCal = currentCalories > 0 ? Math.max(1.5, (currentCalories / targetCalories) * 4) : 3;
  const flexCarbs = currentCarbs > 0 ? Math.max(1, (currentCarbs / macroSum) * 5) : 2;
  const flexFat = currentFat > 0 ? Math.max(1, (currentFat / macroSum) * 5) : 1.5;
  const flexProt = currentProtein > 0 ? Math.max(1, (currentProtein / macroSum) * 5) : 2;

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
      {/* Header: Title + Segmented Pill + Grip Drag Handle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
          Calories Analysis
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Frosted Segmented Toggle Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '9999px',
            padding: '2px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              type="button"
              onClick={() => setFilter('Daily')}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                background: filter === 'Daily' ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                color: filter === 'Daily' ? '#FFFFFF' : '#8E8E93',
                transition: 'all 0.2s ease'
              }}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setFilter('Weekly')}
              style={{
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                background: filter === 'Weekly' ? 'rgba(255, 255, 255, 0.16)' : 'transparent',
                color: filter === 'Weekly' ? '#FFFFFF' : '#8E8E93',
                transition: 'all 0.2s ease'
              }}
            >
              Weekly
            </button>
          </div>

          {/* Grip Drag Handle */}
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
      </div>

      {/* Top 4-Color Segmented Proportional Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        width: '100%',
        height: '14px',
        marginBottom: '26px'
      }}>
        <div style={{ flex: flexCal, height: '100%', borderRadius: '9999px', background: '#00D09C', transition: 'flex 0.4s ease' }} title={`Calories: ${currentCalories} kcal`} />
        <div style={{ flex: flexCarbs, height: '100%', borderRadius: '9999px', background: '#F4C767', transition: 'flex 0.4s ease' }} title={`Carbs: ${currentCarbs}g`} />
        <div style={{ flex: flexFat, height: '100%', borderRadius: '9999px', background: '#FF7243', transition: 'flex 0.4s ease' }} title={`Fat: ${currentFat}g`} />
        <div style={{ flex: flexProt, height: '100%', borderRadius: '9999px', background: '#B2E040', transition: 'flex 0.4s ease' }} title={`Protein: ${currentProtein}g`} />
      </div>

      {/* 4 Intake Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {rows.map((row, idx) => {
          const IconComp = row.icon;
          return (
            <div
              key={`macro-row-${idx}`}
              onClick={() => navigate('/log-food')}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(110px, 130px) minmax(110px, 140px) 1fr auto',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}
            >
              {/* Col 1: Icon + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconComp size={15} color={row.color} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#E0E0E0' }}>
                  {row.name}
                </span>
              </div>

              {/* Col 2: Intake Value + Subtext */}
              <div style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: '600' }}>
                {row.intake} <span style={{ color: '#8E8E93', fontWeight: '400', fontSize: '11px', marginLeft: '4px' }}>{row.unit}</span>
              </div>

              {/* Col 3: Target Pill Badge */}
              <div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#C0C0C0',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  letterSpacing: '0.2px',
                  whiteSpace: 'nowrap'
                }}>
                  {row.goal} Goal
                </span>
              </div>

              {/* Col 4: Completion Percentage */}
              <div style={{
                fontSize: '13px',
                fontWeight: '700',
                color: '#FFFFFF',
                textAlign: 'right',
                minWidth: '45px'
              }}>
                {row.pct}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
