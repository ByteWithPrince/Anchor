import { useState } from 'react';
import { MoreHorizontal, Heart, Check } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function HeartBeatCard() {
  const getTodayHeartRate = useStore(state => state.getTodayHeartRate);
  const addHeartRateLog = useStore(state => state.addHeartRateLog);
  const getActiveProfile = useStore(state => state.getActiveProfile);
  const activeWorkout = useStore(state => state.activeWorkout);

  const activeProfile = getActiveProfile ? getActiveProfile() : null;
  const profileFirstName = activeProfile?.name?.split(' ')[0] || 'Athlete';

  const [isLogging, setIsLogging] = useState(false);
  const [bpmInput, setBpmInput] = useState('72');

  const todayHr = getTodayHeartRate ? getTodayHeartRate() : null;
  const isWorkoutActive = Boolean(activeWorkout);
  const displayBpm = todayHr || (isWorkoutActive ? 124 : 72);

  const handleSaveHr = (e) => {
    e.preventDefault();
    const val = parseInt(bpmInput, 10);
    if (val >= 40 && val <= 220) {
      addHeartRateLog(val);
      setIsLogging(false);
    }
  };

  // SVG ECG Pulse line coordinates across width 280, height 45
  const ecgPath = "M 0,35 L 20,35 L 25,25 L 30,42 L 35,5 L 42,42 L 48,28 L 54,35 L 75,35 L 80,26 L 85,42 L 92,6 L 98,42 L 104,28 L 110,35 L 135,35 L 140,25 L 146,42 L 152,4 L 158,42 L 164,28 L 170,35 L 195,35 L 200,25 L 206,42 L 212,5 L 218,42 L 224,28 L 230,35 L 255,35 L 260,25 L 266,42 L 272,6 L 278,40 L 285,35";

  return (
    <div className="vexora-card" style={{
      background: 'var(--glass-bg)',
      backdropFilter: 'var(--glass-backdrop)',
      WebkitBackdropFilter: 'var(--glass-backdrop)',
      borderRadius: '24px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      border: 'var(--glass-border)',
      boxShadow: 'var(--glass-shadow)',
      position: 'relative'
    }}>
      {/* Header: Title + ... Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
            Heart Beat
          </h2>
          {isWorkoutActive && (
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF7243', animation: 'pulseEmerald 1s infinite' }} />
          )}
        </div>
        <button 
          onClick={() => setIsLogging(!isLogging)}
          aria-label="Log Heart Rate"
          title="Log resting heart rate"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: isLogging ? 'rgba(255, 114, 67, 0.2)' : 'rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isLogging ? '#FF7243' : '#8E8E93'
          }}
        >
          {isLogging ? <Heart size={16} /> : <MoreHorizontal size={18} />}
        </button>
      </div>

      {isLogging ? (
        <form onSubmit={handleSaveHr} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <input
            type="number"
            min="40"
            max="220"
            value={bpmInput}
            onChange={(e) => setBpmInput(e.target.value)}
            style={{
              width: '70px',
              padding: '6px 8px',
              fontSize: '22px',
              fontWeight: '800',
              color: '#FFFFFF',
              borderBottom: '2px solid #FF7243',
              textAlign: 'center'
            }}
            autoFocus
          />
          <span style={{ fontSize: '12px', color: '#8E8E93' }}>bpm</span>
          <button
            type="submit"
            style={{
              padding: '6px 12px',
              borderRadius: '9999px',
              background: '#FF7243',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Check size={14} /> Save
          </button>
        </form>
      ) : (
        /* Metric Row: BPM + Status Badge */
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
          <span style={{
            fontSize: '34px',
            fontWeight: '800',
            color: '#FFFFFF',
            letterSpacing: '-1px',
            lineHeight: 1,
            cursor: 'pointer'
          }} onClick={() => setIsLogging(true)}>
            {displayBpm}
          </span>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#8E8E93' }}>
            bpm
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            background: '#333333',
            color: isWorkoutActive ? '#FF7243' : '#E0E0E0',
            padding: '4px 8px',
            borderRadius: '6px',
            letterSpacing: '0.2px',
            marginLeft: '8px'
          }}>
            {isWorkoutActive ? 'Training Active' : todayHr ? 'Resting Log' : 'Resting Baseline'}
          </span>
        </div>
      )}

      {/* Subtitle */}
      <p style={{
        fontSize: '12px',
        color: '#8E8E93',
        fontWeight: '500',
        margin: '0 0 16px 0'
      }}>
        {isWorkoutActive ? `Active session intensity for ${profileFirstName}` : `Resting cardiac telemetry · ${profileFirstName}`}
      </p>

      {/* Orange ECG Pulse Waveform Graphic */}
      <div style={{ width: '100%', height: '48px', overflow: 'hidden' }}>
        <svg
          viewBox="0 0 285 45"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%' }}
        >
          <path
            d={ecgPath}
            fill="none"
            stroke="#FF7243"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
