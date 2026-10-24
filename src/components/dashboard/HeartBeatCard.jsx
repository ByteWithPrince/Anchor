import { useState, useEffect, useRef } from 'react';
import { GripVertical, Check, Bluetooth } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function HeartBeatCard({ dragHandleProps }) {
  const getTodayHeartRate = useStore(state => state.getTodayHeartRate);
  const addHeartRateLog = useStore(state => state.addHeartRateLog);
  const getActiveProfile = useStore(state => state.getActiveProfile);
  const activeWorkout = useStore(state => state.activeWorkout);

  const activeProfile = getActiveProfile ? getActiveProfile() : null;
  const profileFirstName = activeProfile?.name?.split(' ')[0] || 'Athlete';

  const [isLogging, setIsLogging] = useState(false);
  const [bpmInput, setBpmInput] = useState('72');
  const [isBtConnected, setIsBtConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [liveBpm, setLiveBpm] = useState(null);

  const deviceRef = useRef(null);

  const todayHr = getTodayHeartRate ? getTodayHeartRate() : null;
  const isWorkoutActive = Boolean(activeWorkout);
  const displayBpm = liveBpm || todayHr || (isWorkoutActive ? 124 : 72);

  // Disconnect GATT server on unmount
  useEffect(() => {
    return () => {
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }
    };
  }, []);

  const handleSaveHr = (e) => {
    e.preventDefault();
    const val = parseInt(bpmInput, 10);
    if (val >= 40 && val <= 220) {
      addHeartRateLog(val);
      setLiveBpm(val);
      setIsLogging(false);
    }
  };

  const connectBluetooth = async () => {
    if (isBtConnected) {
      if (deviceRef.current?.gatt?.connected) {
        deviceRef.current.gatt.disconnect();
      }
      setIsBtConnected(false);
      setDeviceName('');
      setLiveBpm(null);
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.bluetooth) {
      console.warn('Web Bluetooth is not supported on this browser or platform.');
      return;
    }

    try {
      setIsConnecting(true);

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['heart_rate'] }],
        optionalServices: ['battery_service']
      });

      deviceRef.current = device;
      setDeviceName(device.name || 'Fit Band');

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('heart_rate');
      const characteristic = await service.getCharacteristic('heart_rate_measurement');
      await characteristic.startNotifications();

      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = event.target.value;
        const flags = value.getUint8(0);
        const rate16Bits = flags & 0x1;
        const bpm = rate16Bits ? value.getUint16(1, true) : value.getUint8(1);
        setLiveBpm(bpm);
        addHeartRateLog(bpm);
      });

      device.addEventListener('gattserverdisconnected', () => {
        setIsBtConnected(false);
        setDeviceName('');
        setLiveBpm(null);
      });

      setIsBtConnected(true);
      setIsConnecting(false);
    } catch (err) {
      // Silently reset button state on cancel or failure without cluttering the UI
      console.info('Bluetooth pairing result:', err.message || err.name);
      setIsConnecting(false);
      setIsBtConnected(false);
      setDeviceName('');
      setLiveBpm(null);
    }
  };

  // SVG ECG Pulse line coordinates across width 280, height 45
  const ecgPath = isBtConnected
    ? "M 0,35 L 20,35 L 25,25 L 30,42 L 35,5 L 42,42 L 48,28 L 54,35 L 75,35 L 80,26 L 85,42 L 92,6 L 98,42 L 104,28 L 110,35 L 135,35 L 140,25 L 146,42 L 152,4 L 158,42 L 164,28 L 170,35 L 195,35 L 200,25 L 206,42 L 212,5 L 218,42 L 224,28 L 230,35 L 255,35 L 260,25 L 266,42 L 272,6 L 278,40 L 285,35"
    : "M 0,35 L 45,35 L 50,31 L 55,39 L 60,20 L 65,42 L 70,33 L 75,35 L 140,35 L 145,31 L 150,39 L 155,20 L 160,42 L 165,33 L 170,35 L 235,35 L 240,31 L 245,39 L 250,20 L 255,42 L 260,33 L 265,35 L 285,35";

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
      {/* Header: Title + Sleek Single Action Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 0 }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#FFFFFF', letterSpacing: '-0.2px', whiteSpace: 'nowrap', margin: 0 }}>
            Heart Beat
          </h2>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isBtConnected ? '#10B981' : isWorkoutActive ? '#10B981' : '#8E8E93',
            animation: isBtConnected ? 'pulseEmerald 1.2s infinite' : 'none',
            flexShrink: 0
          }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Single sleek compact pill button: "Pair Band" / "Disconnect" */}
          <button
            onClick={connectBluetooth}
            disabled={isConnecting}
            aria-label={isBtConnected ? "Disconnect Fit Band" : "Pair Fit Band via Bluetooth"}
            title={isBtConnected ? `Connected: ${deviceName}. Click to disconnect.` : 'Connect Smartwatch / Fit Band (Web Bluetooth)'}
            style={{
              padding: '4px 10px',
              borderRadius: '9999px',
              background: isBtConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.05)',
              border: isBtConnected ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.12)',
              color: isBtConnected ? '#10B981' : '#8E8E93',
              fontSize: '0.72rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: isConnecting ? 'wait' : 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease'
            }}
          >
            <Bluetooth size={12} strokeWidth={2.5} />
            <span style={{ whiteSpace: 'nowrap' }}>
              {isConnecting ? 'Pairing...' : isBtConnected ? 'Disconnect' : 'Pair Band'}
            </span>
          </button>

          {/* Drag Handle */}
          <div 
            {...dragHandleProps}
            role="button"
            tabIndex={0}
            aria-label="Move Card"
            title="Drag to rearrange dashboard cards"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8E8E93',
              cursor: 'grab',
              flexShrink: 0
            }}
          >
            <GripVertical size={15} />
          </div>
        </div>
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
              borderBottom: '2px solid #10B981',
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
              background: '#10B981',
              color: '#0D0D0D',
              fontSize: '12px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Check size={14} /> Save
          </button>
        </form>
      ) : (
        /* Metric Row: BPM + Status Badge */
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '6px' }}>
          <span 
            style={{
              fontSize: '34px',
              fontWeight: '800',
              color: '#FFFFFF',
              letterSpacing: '-1px',
              lineHeight: 1,
              cursor: 'pointer'
            }} 
            title="Click to manually log heart rate"
            onClick={() => setIsLogging(true)}
          >
            {displayBpm}
          </span>
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#8E8E93' }}>
            bpm
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: '700',
            background: isBtConnected ? 'rgba(16, 185, 129, 0.12)' : '#222222',
            color: isBtConnected ? '#10B981' : isWorkoutActive ? '#10B981' : '#E0E0E0',
            border: isBtConnected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
            padding: '3px 8px',
            borderRadius: '6px',
            letterSpacing: '0.2px',
            marginLeft: '8px'
          }}>
            {isBtConnected ? 'Live BLE Sensor' : isWorkoutActive ? 'Training Active' : todayHr ? 'Resting Log' : 'Resting Baseline'}
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
        {isBtConnected 
          ? `Streaming telemetry from ${deviceName}` 
          : isWorkoutActive 
            ? `Active training intensity for ${profileFirstName}` 
            : `Resting cardiac telemetry · ${profileFirstName}`}
      </p>

      {/* ECG Waveform Graphic */}
      <div style={{ width: '100%', height: '48px', overflow: 'hidden' }}>
        <svg
          viewBox="0 0 285 45"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%' }}
        >
          <path
            d={ecgPath}
            fill="none"
            stroke={isBtConnected ? "rgba(16, 185, 129, 0.25)" : "rgba(255, 255, 255, 0.12)"}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={ecgPath}
            fill="none"
            stroke={isBtConnected ? "#10B981" : "#8E8E93"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
