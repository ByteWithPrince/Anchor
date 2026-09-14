import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Search, Bell, Crown, Anchor as AnchorIcon, Globe, Cloud, Check, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import UserProfileModal from './UserProfileModal';
import AuthModal from './AuthModal';
import GlobalSearchModal from './GlobalSearchModal';

export default function TopNavbar() {
  const navigate = useNavigate();
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const getActiveProfile = useStore(state => state.getActiveProfile);
  const currentUser = useStore(state => state.currentUser);
  const isCloudSyncing = useStore(state => state.isCloudSyncing);
  const syncWithCloud = useStore(state => state.syncWithCloud);
  const activeProfile = getActiveProfile();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0 28px 0',
      width: '100%',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      {/* BRAND / LOGO */}
      <div 
        onClick={() => navigate('/')} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #FF7243 0%, #FF9066 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          boxShadow: 'none'
        }}>
          <AnchorIcon size={20} strokeWidth={2.6} />
        </div>
        <span style={{
          fontSize: '22px',
          fontWeight: '900',
          letterSpacing: '1px',
          color: '#FFFFFF',
          fontFamily: "'Space Grotesk', sans-serif"
        }}>
          ANCHOR
        </span>
      </div>

      {/* CENTER PILL NAVIGATION */}
      <nav 
        className="glass-pill"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 8px',
          overflowX: 'auto',
          maxWidth: '100%'
        }}
      >
        <NavLink
          to="/"
          end
          style={({ isActive }) => ({
            padding: '8px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '0.2px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            backgroundColor: isActive ? '#FFFFFF' : 'transparent',
            color: isActive ? '#161616' : '#C7C7C7'
          })}
        >
          Dashboard
        </NavLink>

        <NavLink
          to="/progress"
          style={({ isActive }) => ({
            padding: '8px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '0.2px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            backgroundColor: isActive ? '#FFFFFF' : 'transparent',
            color: isActive ? '#161616' : '#C7C7C7'
          })}
        >
          Statistics
        </NavLink>

        <NavLink
          to="/workout-overview"
          style={({ isActive }) => ({
            padding: '8px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '0.2px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            backgroundColor: isActive ? '#FFFFFF' : 'transparent',
            color: isActive ? '#161616' : '#C7C7C7'
          })}
        >
          Workouts
        </NavLink>

        <NavLink
          to="/log-food"
          style={({ isActive }) => ({
            padding: '8px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '0.2px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            backgroundColor: isActive ? '#FFFFFF' : 'transparent',
            color: isActive ? '#161616' : '#C7C7C7'
          })}
        >
          Nutrition
        </NavLink>

        <NavLink
          to="/plan"
          style={({ isActive }) => ({
            padding: '8px 20px',
            borderRadius: '9999px',
            fontSize: '13px',
            fontWeight: '700',
            letterSpacing: '0.2px',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            backgroundColor: isActive ? '#FFFFFF' : 'transparent',
            color: isActive ? '#161616' : '#C7C7C7'
          })}
        >
          Schedule
        </NavLink>

        {/* Public SaaS Showcase Link */}
        <NavLink
          to="/landing"
          style={({ isActive }) => ({
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.2px',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
            color: isActive ? '#161616' : '#FF7243'
          })}
        >
          <Globe size={13} />
          <span>Product</span>
        </NavLink>
      </nav>

      {/* RIGHT CONTROLS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Search button with Hotkey and Instant Modal */}
        <button 
          aria-label="Search"
          title="Search (Cmd + K)"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setSearchModalOpen(true)}
        >
          <Search size={18} />
        </button>

        {/* Cloud Sync / Auth Button */}
        <button 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: currentUser ? 'rgba(0, 208, 156, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            color: currentUser ? '#00D09C' : '#8E8E93',
            border: `1px solid ${currentUser ? 'rgba(0, 208, 156, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
            fontWeight: '700',
            fontSize: '12px',
            padding: '8px 14px',
            borderRadius: '9999px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => {
            if (currentUser) {
              syncWithCloud();
            } else {
              setAuthModalOpen(true);
            }
          }}
          title={currentUser ? `Signed in as ${currentUser.email}. Click to sync.` : 'Sign in or create account to sync to cloud'}
        >
          {isCloudSyncing ? (
            <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
          ) : currentUser ? (
            <Check size={14} strokeWidth={3} />
          ) : (
            <Cloud size={14} />
          )}
          <span>{isCloudSyncing ? 'Syncing...' : currentUser ? 'Cloud Synced' : 'Cloud Sync'}</span>
        </button>

        {/* Multi-User / Athlete Profile Pill Button */}
        <button 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#A4D037',
            color: '#161616',
            fontWeight: '800',
            fontSize: '13px',
            padding: '10px 18px',
            borderRadius: '9999px',
            boxShadow: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
          onClick={() => setProfileModalOpen(true)}
        >
          <Crown size={15} strokeWidth={2.8} />
          <span>{activeProfile?.name?.split(' ')[0] || 'PRO'}</span>
        </button>

        {/* Notification button */}
        <div style={{ position: 'relative' }}>
          <button 
            aria-label="Notifications"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8E8E93',
              cursor: 'pointer'
            }}
          >
            <Bell size={18} />
          </button>
          <span style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#FF7243'
          }} />
        </div>

        {/* User avatar (Opens profile modal) */}
        <div 
          onClick={() => setProfileModalOpen(true)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.22)',
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
          title="Switch Athlete Profile"
        >
          <img 
            src={activeProfile?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"} 
            alt={activeProfile?.name ? `Avatar of ${activeProfile.name}` : "User profile"} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Global Command Palette & Intelligent Search Modal */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </header>
  );
}
