import React from 'react';

export default function SkeletonCard({ height = '200px', rows = 3, className = '' }) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '24px',
        padding: '24px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)'
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: '40%', height: '14px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.08)', marginBottom: '8px' }} />
          <div style={{ width: '60%', height: '10px', borderRadius: '6px', backgroundColor: 'rgba(255, 255, 255, 0.04)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '16px 0' }}>
        {Array.from({ length: rows }).map((_, idx) => (
          <div
            key={idx}
            style={{
              width: idx === 0 ? '80%' : idx === 1 ? '65%' : '90%',
              height: '12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)'
            }}
          />
        ))}
      </div>

      <div style={{
        width: '100%',
        height: '36px',
        borderRadius: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)'
      }} />
    </div>
  );
}
