export default function MacroBar({ label, current = 0, target = 0, unit = 'g', opacity = 1 }) {
  const currentNum = Math.max(0, Math.round(Number(current) || 0));
  const targetNum = Math.max(1, Math.round(Number(target) || 1));
  const percent = Math.min(100, Math.round((currentNum / targetNum) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: '700', 
          letterSpacing: '0.8px', 
          color: 'var(--text-color)', 
          opacity: 0.7 
        }}>
          {label}
        </span>
        <div style={{ fontSize: '13px', fontWeight: '700', letterSpacing: '-0.2px' }}>
          <span>{currentNum}</span>
          <span style={{ opacity: 0.4, margin: '0 4px' }}>/</span>
          <span style={{ opacity: 0.5 }}>{targetNum}{unit}</span>
          <span style={{ marginLeft: '8px', color: 'var(--primary-color)', fontSize: '12px', opacity: 0.9 }}>
            {percent}%
          </span>
        </div>
      </div>
      
      <div style={{
        height: '6px',
        width: '100%',
        backgroundColor: 'var(--surface-color)',
        borderRadius: '0px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{
          height: '100%',
          width: `${percent}%`,
          backgroundColor: 'var(--primary-color)',
          opacity: opacity,
          transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
        }} />
      </div>
    </div>
  );
}
