import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function FloatingAction({ onClick, isOpen }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={isOpen ? "Close quick actions menu" : "Open quick actions menu"}
      style={{
        position: 'fixed',
        bottom: 'max(96px, env(safe-area-inset-bottom) + 96px)',
        right: '24px',
        transform: `${isOpen ? 'rotate(45deg)' : 'rotate(0deg)'} ${isHovered ? 'scale(1.06)' : 'scale(1)'}`,
        width: '56px',
        height: '56px',
        borderRadius: '28px',
        backgroundColor: isOpen 
          ? 'rgba(255, 114, 67, 0.18)' 
          : isHovered 
            ? 'rgba(0, 208, 156, 0.16)' 
            : 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: isOpen
          ? '1px solid rgba(255, 114, 67, 0.4)'
          : isHovered
            ? '1px solid rgba(0, 208, 156, 0.5)'
            : '1px solid rgba(255, 255, 255, 0.16)',
        borderTop: isOpen
          ? '1.5px solid rgba(255, 114, 67, 0.65)'
          : isHovered
            ? '1.5px solid rgba(0, 208, 156, 0.7)'
            : '1.5px solid rgba(255, 255, 255, 0.32)',
        color: isOpen ? '#FF7243' : '#00D09C',
        boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.5), inset 0 1px 1px 0 rgba(255, 255, 255, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 50,
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <Plus size={26} strokeWidth={2.4} />
    </button>
  );
}
