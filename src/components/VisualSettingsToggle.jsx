import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

export default function VisualSettingsToggle() {
  const [isGlass, setIsGlass] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('anchor_glass_mode');
    return saved !== null ? saved === 'true' : true; // default true for sleek glass look
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('anchor-glass-mode', isGlass);
      localStorage.setItem('anchor_glass_mode', String(isGlass));
    }
  }, [isGlass]);

  return (
    <button
      onClick={() => setIsGlass(prev => !prev)}
      aria-label={isGlass ? "Switch to Solid Minimal Mode" : "Switch to Frosted Glass Mode"}
      title={isGlass ? "Glass & Motion Mode Active (Click to switch to Solid)" : "Solid Mode Active (Click to enable Glass & Motion)"}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 12px',
        borderRadius: '9999px',
        background: isGlass ? 'rgba(255, 114, 67, 0.15)' : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${isGlass ? 'rgba(255, 114, 67, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
        color: isGlass ? '#FF7243' : '#8E8E93',
        fontSize: '12px',
        fontWeight: '700',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        userSelect: 'none'
      }}
    >
      <Sparkles size={13} />
      <span>{isGlass ? 'Glass FX' : 'Solid'}</span>
    </button>
  );
}
