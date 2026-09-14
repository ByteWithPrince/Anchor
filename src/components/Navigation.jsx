import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, CalendarDays } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Navigation() {
  const location = useLocation();
  const currentUser = useStore(state => state.currentUser);
  const authToken = useStore(state => state.authToken);
  const isAuthenticated = Boolean(currentUser && authToken);

  const hiddenRoutes = [
    '/log-workout',
    '/workout-overview',
    '/workout-complete',
    '/log-food',
    '/landing',
    '/privacy',
    '/terms',
    '/thank-you'
  ];
  
  if (!isAuthenticated || hiddenRoutes.includes(location.pathname) || location.pathname === '/landing') {
    return null;
  }

  const activeStyle = { color: 'var(--primary-color)' };
  const inactiveStyle = { color: 'var(--text-color)', opacity: 0.3 };

  return (
    <nav className="animate-slide-up mobile-only-nav" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--bg-color)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '12px 0',
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      zIndex: 30,
      width: '100%'
    }}>
      <NavLink 
        to="/" 
        aria-label="Today Dashboard"
        style={({ isActive }) => ({ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          width: '64px',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          ...(isActive ? activeStyle : inactiveStyle)
        })}
      >
        {({ isActive }) => (
          <>
            <LayoutDashboard size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px' }}>TODAY</span>
          </>
        )}
      </NavLink>

      <NavLink 
        to="/progress" 
        aria-label="Progress & Analytics"
        style={({ isActive }) => ({ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          width: '64px',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          ...(isActive ? activeStyle : inactiveStyle)
        })}
      >
        {({ isActive }) => (
          <>
            <TrendingUp size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px' }}>PROGRESS</span>
          </>
        )}
      </NavLink>

      <NavLink 
        to="/plan" 
        aria-label="Weekly Plan Builder"
        style={({ isActive }) => ({ 
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          width: '64px',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          ...(isActive ? activeStyle : inactiveStyle)
        })}
      >
        {({ isActive }) => (
          <>
            <CalendarDays size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.5px' }}>PLAN</span>
          </>
        )}
      </NavLink>
    </nav>
  );
}
