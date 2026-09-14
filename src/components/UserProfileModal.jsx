import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, Check, UserPlus, Download, User, ShieldCheck, Cloud, LogOut, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function UserProfileModal({ isOpen, onClose, onOpenAuth }) {
  const navigate = useNavigate();
  const profiles = useStore(state => state.profiles);
  const activeProfileId = useStore(state => state.activeProfileId);
  const switchProfile = useStore(state => state.switchProfile);
  const createProfile = useStore(state => state.createProfile);
  const exportData = useStore(state => state.exportData);
  const currentUser = useStore(state => state.currentUser);
  const logoutUser = useStore(state => state.logoutUser);
  const syncWithCloud = useStore(state => state.syncWithCloud);
  const isCloudSyncing = useStore(state => state.isCloudSyncing);

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('Powerlifting');
  const [newWeight, setNewWeight] = useState('75');
  const [newCals, setNewCals] = useState('2500');
  const [copiedNotification, setCopiedNotification] = useState(false);

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

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createProfile({
      name: newName.trim(),
      role: newRole,
      weight: newWeight,
      targetCalories: newCals
    });
    setNewName('');
    setIsCreating(false);
  };

  const handleExport = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anchor-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  return createPortal(
    <div
      className="animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.42)',
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
        className="animate-scale-in"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '32px 28px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%), rgba(18, 22, 30, 0.45)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderTop: '1.5px solid rgba(255, 255, 255, 0.32)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '26px',
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.6), inset 0 1px 1px 0 rgba(255, 255, 255, 0.2)',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0, 208, 156, 0.2) 0%, rgba(0, 208, 156, 0.05) 100%)',
              border: '1px solid rgba(0, 208, 156, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={18} color="#00D09C" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.2px' }}>
              Multi-Athlete Profiles
            </h3>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8E8E93'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Security / Isolation Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0, 208, 156, 0.08)',
          border: '1px solid rgba(0, 208, 156, 0.25)',
          padding: '10px 14px',
          borderRadius: '12px',
          color: '#00D09C',
          fontSize: '12px',
          fontWeight: '500',
          marginBottom: '20px'
        }}>
          <ShieldCheck size={16} />
          <span>Local-first data isolation: each profile maintains dedicated workout & nutrition stores.</span>
        </div>

        {/* Profiles List */}
        {!isCreating ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {profiles.map(p => {
                const isActive = p.id === activeProfileId;
                return (
                  <div
                    key={p.id}
                    onClick={() => switchProfile(p.id)}
                    className="glass-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: '16px',
                      background: isActive ? 'rgba(255, 114, 67, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: isActive ? '1px solid rgba(255, 114, 67, 0.5)' : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={p.avatar}
                        alt={p.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          border: isActive ? '2px solid #FF7243' : '2px solid rgba(255, 255, 255, 0.12)'
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#A0A0A5', marginTop: '2px' }}>
                          {p.role} · {p.weight} kg · {p.targetCalories} kcal
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <div style={{
                        background: '#FF7243',
                        color: '#FFFFFF',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'none'
                      }}>
                        <Check size={14} strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Cloud Account Sync Card */}
            <div 
              className="glass-card"
              style={{
                borderRadius: '16px',
                padding: '14px 16px',
                marginBottom: '16px',
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
                  backgroundColor: currentUser ? 'rgba(0, 208, 156, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: currentUser ? '1px solid rgba(0, 208, 156, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: currentUser ? '#00D09C' : '#8E8E93'
                }}>
                  <Cloud size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                    {currentUser ? 'Cloud Account Synced' : 'Multi-Device Cloud Sync'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8E8E93', marginTop: '1px' }}>
                    {currentUser ? currentUser.email : 'Sign in to sync across web & mobile'}
                  </div>
                </div>
              </div>

              {currentUser ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => syncWithCloud()}
                    disabled={isCloudSyncing}
                    title="Sync with cloud"
                    style={{
                      background: 'rgba(0, 208, 156, 0.15)',
                      color: '#00D09C',
                      border: '1px solid rgba(0, 208, 156, 0.3)',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <RefreshCw size={12} style={{ animation: isCloudSyncing ? 'spin 1s linear infinite' : 'none' }} />
                    <span>Sync</span>
                  </button>
                  <button
                    onClick={() => {
                      logoutUser();
                      onClose();
                      navigate('/');
                    }}
                    title="Sign out of cloud"
                    style={{
                      background: 'rgba(255, 114, 67, 0.12)',
                      color: '#FF7243',
                      border: '1px solid rgba(255, 114, 67, 0.25)',
                      borderRadius: '8px',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <LogOut size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenAuth) onOpenAuth();
                  }}
                  style={{
                    background: '#00D09C',
                    color: '#0D0D0D',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: 'none'
                  }}
                >
                  Sign In
                </button>
              )}
            </div>

            {/* Actions: Add New Profile or Export */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setIsCreating(true)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '13px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <UserPlus size={16} />
                <span>Add Athlete</span>
              </button>

              <button
                onClick={handleExport}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  fontSize: '13px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <Download size={16} />
                <span>{copiedNotification ? 'Exported!' : 'Export JSON'}</span>
              </button>
            </div>
          </>
        ) : (
          /* Create Profile Form */
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Athlete Name
              </label>
              <div className="glass-input" style={{ marginTop: '6px', padding: '0 14px' }}>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Jordan Hayes"
                  autoFocus
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '12px 0',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Bodyweight (kg)
                </label>
                <div className="glass-input" style={{ marginTop: '6px', padding: '0 14px' }}>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={e => setNewWeight(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: '12px 0',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Calorie Target
                </label>
                <div className="glass-input" style={{ marginTop: '6px', padding: '0 14px' }}>
                  <input
                    type="number"
                    value={newCals}
                    onChange={e => setNewCals(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: '12px 0',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Primary Discipline
              </label>
              <div className="glass-input" style={{ marginTop: '6px', padding: '0 14px' }}>
                <input
                  type="text"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  placeholder="e.g. Powerlifting, Running, CrossFit"
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '12px 0',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#FFFFFF',
                  fontWeight: '600',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                style={{
                  flex: 1,
                  background: '#FF7243',
                  color: '#FFFFFF',
                  fontWeight: '800',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: 'none'
                }}
              >
                Create Profile
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
