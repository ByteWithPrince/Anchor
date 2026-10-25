import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Download, User, Cloud, LogOut, RefreshCw, Edit3, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import DataArchiveModal from './DataArchiveModal';

export default function UserProfileModal({ isOpen, onClose, onOpenAuth }) {
  const navigate = useNavigate();
  const getActiveProfile = useStore(state => state.getActiveProfile);
  const updateUserProfile = useStore(state => state.updateUserProfile);
  const currentUser = useStore(state => state.currentUser);
  const logoutUser = useStore(state => state.logoutUser);
  const syncWithCloud = useStore(state => state.syncWithCloud);
  const isCloudSyncing = useStore(state => state.isCloudSyncing);

  const workoutLogs = useStore(state => state.workoutLogs);
  const foodLogs = useStore(state => state.foodLogs);
  const plan = useStore(state => state.plan);
  const customRoutines = useStore(state => state.customRoutines);
  const weightLogs = useStore(state => state.weightLogs);
  const cardioLogs = useStore(state => state.cardioLogs);
  const hydrateFromArchive = useStore(state => state.hydrateFromArchive);

  const activeProfile = getActiveProfile();

  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit details form state
  const [editRole, setEditRole] = useState(activeProfile?.role || 'Strength & Hypertrophy');
  const [editWeight, setEditWeight] = useState(activeProfile?.weight || 75);
  const [editCals, setEditCals] = useState(activeProfile?.targetCalories || 2500);

  const handleToggleEdit = () => {
    if (!isEditing && activeProfile) {
      setEditRole(activeProfile.role || 'Strength & Hypertrophy');
      setEditWeight(activeProfile.weight || 75);
      setEditCals(activeProfile.targetCalories || 2500);
    }
    setIsEditing(!isEditing);
  };

  // Keyboard ESC listener to close modal immediately
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSaveDetails = (e) => {
    e.preventDefault();
    updateUserProfile({
      role: editRole.trim() || 'Strength & Hypertrophy',
      weight: Number(editWeight) || 75,
      targetCalories: Number(editCals) || 2500
    });
    setIsEditing(false);
  };

  const handleSignOut = () => {
    logoutUser();
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('anchor_session_unlocked');
    }
    onClose();
    navigate('/');
  };

  const athleteName = currentUser?.name || activeProfile?.name || 'Athlete';
  const athleteEmail = currentUser?.email || activeProfile?.email || (currentUser?.isGuest ? 'Guest Offline Mode' : 'Local-First Session');
  const athleteAvatar = activeProfile?.avatar || currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(athleteName)}`;

  return createPortal(
    <div
      className="modal-overlay animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(48px) saturate(200%)',
        WebkitBackdropFilter: 'blur(48px) saturate(200%)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="modal-bottom-sheet glass-modal animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%), rgba(18, 22, 30, 0.75)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderTop: '1.5px solid rgba(255, 255, 255, 0.32)',
          borderRadius: '24px',
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.7), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(255, 114, 67, 0.2) 0%, rgba(255, 114, 67, 0.05) 100%)',
              border: '1px solid rgba(255, 114, 67, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={18} color="#FF7243" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.2px', margin: 0 }}>
              Athlete Account
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close profile modal"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8E8E93',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Single Authenticated Athlete Profile Card */}
        <div
          className="glass-card"
          style={{
            borderRadius: '20px',
            padding: '18px 20px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '16px'
          }}
        >
          {/* Identity Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <img
                src={athleteAvatar}
                alt={athleteName}
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  border: '2px solid #FF7243',
                  flexShrink: 0,
                  background: 'rgba(255, 255, 255, 0.05)'
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {athleteName}
                </div>
                <div style={{ fontSize: '12px', color: '#8E8E93', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {athleteEmail}
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleEdit}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: isEditing ? 'rgba(255, 114, 67, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                border: isEditing ? '1px solid rgba(255, 114, 67, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
                color: isEditing ? '#FF7243' : '#E0E0E0',
                padding: '5px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '700',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <Edit3 size={12} />
              <span>{isEditing ? 'Cancel' : 'Edit Details'}</span>
            </button>
          </div>

          {/* Inline Edit Form */}
          {isEditing ? (
            <form onSubmit={handleSaveDetails} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Primary Discipline
                </label>
                <div className="glass-input" style={{ marginTop: '4px', padding: '0 12px' }}>
                  <input
                    type="text"
                    value={editRole}
                    onChange={e => setEditRole(e.target.value)}
                    placeholder="e.g. Strength & Hypertrophy"
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: '10px 0',
                      color: '#FFFFFF',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Bodyweight (kg)
                  </label>
                  <div className="glass-input" style={{ marginTop: '4px', padding: '0 12px' }}>
                    <input
                      type="number"
                      step="0.1"
                      value={editWeight}
                      onChange={e => setEditWeight(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        padding: '10px 0',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Calorie Target (kcal)
                  </label>
                  <div className="glass-input" style={{ marginTop: '4px', padding: '0 12px' }}>
                    <input
                      type="number"
                      step="50"
                      value={editCals}
                      onChange={e => setEditCals(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        padding: '10px 0',
                        color: '#FFFFFF',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: '#8E8E93',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: '#10B981',
                    color: '#0D0D0D',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px',
                    fontSize: '12px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Check size={14} strokeWidth={3} />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            /* Discipline / Metrics Badges */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#8E8E93', textTransform: 'uppercase', fontWeight: '700' }}>Discipline</div>
                <div style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: '700', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {activeProfile?.role || 'Strength'}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#8E8E93', textTransform: 'uppercase', fontWeight: '700' }}>Bodyweight</div>
                <div style={{ fontSize: '12px', color: '#FFFFFF', fontWeight: '700', marginTop: '2px' }}>
                  {activeProfile?.weight || 75} kg
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#8E8E93', textTransform: 'uppercase', fontWeight: '700' }}>Daily Target</div>
                <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '800', marginTop: '2px' }}>
                  {activeProfile?.targetCalories || 2500} kcal
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cloud Account Sync Card */}
        <div 
          className="glass-card"
          style={{
            borderRadius: '16px',
            padding: '14px 16px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              backgroundColor: currentUser && !currentUser.isGuest ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: currentUser && !currentUser.isGuest ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: currentUser && !currentUser.isGuest ? '#10B981' : '#8E8E93'
            }}>
              <Cloud size={16} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                {currentUser && !currentUser.isGuest ? 'Cloud Account Synced' : 'Multi-Device Cloud Sync'}
              </div>
              <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '1px' }}>
                {currentUser && !currentUser.isGuest ? currentUser.email : 'Sign in to sync across web & mobile'}
              </div>
            </div>
          </div>

          {currentUser && !currentUser.isGuest ? (
            <button
              onClick={() => syncWithCloud()}
              disabled={isCloudSyncing}
              title="Sync with cloud"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <RefreshCw size={12} style={{ animation: isCloudSyncing ? 'spin 1s linear infinite' : 'none' }} />
              <span>Sync</span>
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                if (onOpenAuth) onOpenAuth();
              }}
              style={{
                background: '#10B981',
                color: '#0D0D0D',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Sign In
            </button>
          )}
        </div>

        {/* Data Archive Backup Button */}
        <button
          onClick={() => setArchiveModalOpen(true)}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: '13px',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <Download size={15} />
          <span>Data Archive (Backup & Restore)</span>
        </button>

        {/* Prominent Sign Out Button */}
        <button
          onClick={handleSignOut}
          style={{
            width: '100%',
            marginTop: '12px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: '#EF4444',
            fontWeight: '700',
            fontSize: '13px',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.16)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
          }}
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>

        <DataArchiveModal
          isOpen={archiveModalOpen}
          onClose={() => setArchiveModalOpen(false)}
          storeState={{
            workouts: workoutLogs,
            nutritionLogs: foodLogs,
            trainingPlan: plan,
            customRoutines: customRoutines,
            bodyweightLogs: weightLogs,
            gpsTelemetry: cardioLogs
          }}
          onHydrateStore={(data) => hydrateFromArchive(data)}
        />
      </div>
    </div>,
    document.body
  );
}
