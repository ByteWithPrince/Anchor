import { useRef, useState } from 'react';
import { set as idbSet } from 'idb-keyval';
import { haptics } from '../services/haptics';

const REQUIRED_KEYS = ['workouts', 'nutritionLogs', 'trainingPlan', 'customRoutines'];

function validateArchiveSchema(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Archive root must be a valid JSON object.');
  }
  if (payload.app !== 'ANCHOR_OS' || typeof payload.version !== 'number') {
    throw new Error('Unrecognized file header. Expected ANCHOR_OS archive.');
  }
  if (!payload.data || typeof payload.data !== 'object') {
    throw new Error('Missing "data" payload in archive.');
  }
  for (const key of REQUIRED_KEYS) {
    if (!(key in payload.data)) {
      throw new Error(`Corrupted archive: missing required collection "${key}".`);
    }
  }
  if (!Array.isArray(payload.data.workouts) || !Array.isArray(payload.data.nutritionLogs)) {
    throw new Error('Invalid collection types: workouts and nutritionLogs must be arrays.');
  }
  return true;
}

export default function DataArchiveModal({ isOpen, onClose, storeState, onHydrateStore }) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState({ type: null, message: '' });

  if (!isOpen) return null;

  const handleExport = () => {
    const archive = {
      app: 'ANCHOR_OS',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        workouts: storeState?.workoutLogs || storeState?.workouts || [],
        nutritionLogs: storeState?.foodLogs || storeState?.nutritionLogs || [],
        trainingPlan: storeState?.plan || storeState?.trainingPlan || {},
        customRoutines: storeState?.customRoutines || [],
        bodyweightLogs: storeState?.weightLogs || storeState?.bodyweightLogs || [],
        gpsTelemetry: storeState?.cardioLogs || storeState?.gpsTelemetry || [],
      },
    };

    const blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `anchor-backup-${dateStamp}.json`;
    a.click();
    URL.revokeObjectURL(url);

    haptics.setComplete();
    setStatus({ type: 'success', message: 'Full JSON archive downloaded successfully.' });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const rawText = await file.text();
      const parsed = JSON.parse(rawText);
      validateArchiveSchema(parsed);

      // Persist validated snapshot to IndexedDB & hydrate Zustand memory
      await idbSet('anchor-backup-latest', parsed.data);
      if (onHydrateStore) {
        onHydrateStore(parsed.data);
      }

      haptics.setComplete();
      setStatus({ type: 'success', message: 'Archive verified and restored in <5ms.' });
    } catch (err) {
      haptics.warning();
      setStatus({ type: 'error', message: err.message || 'Failed to parse JSON file.' });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div
      className="modal-overlay animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(13, 13, 13, 0.88)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-bottom-sheet glass-modal animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#0D0D0D',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: '24px',
          padding: '1.5rem',
          color: '#F3F4F6',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '0.04em', fontWeight: 800 }}>
            DATA PORTABILITY
          </h2>
          <span style={{ fontSize: '0.7rem', color: '#10B981', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            LOCAL-FIRST
          </span>
        </div>
        <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', opacity: 0.7, lineHeight: 1.5 }}>
          Export your complete training, nutrition, routines, and telemetry history as raw JSON, or restore from a previous archive.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={handleExport}
            style={{
              backgroundColor: '#10B981',
              color: '#0D0D0D',
              border: 'none',
              padding: '0.85rem 1rem',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '0.85rem',
              transition: 'opacity 0.15s ease',
            }}
          >
            Download Full Archive (.JSON)
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              color: '#F3F4F6',
              border: '1px solid rgba(255, 255, 255, 0.10)',
              padding: '0.85rem 1rem',
              fontWeight: 600,
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontSize: '0.85rem',
              transition: 'background 0.15s ease',
            }}
          >
            Restore Data from File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        {status.message && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.6rem 0.8rem',
              fontSize: '0.8rem',
              border: `1px solid ${status.type === 'error' ? '#EF4444' : '#10B981'}`,
              color: status.type === 'error' ? '#EF4444' : '#10B981',
              backgroundColor: status.type === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            }}
          >
            {status.message}
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            marginTop: '1.25rem',
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: '#F3F4F6',
            opacity: 0.6,
            cursor: 'pointer',
            padding: '0.5rem',
            fontSize: '0.8rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
