import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Dumbbell, 
  Flame, 
  CalendarDays, 
  Bookmark 
} from 'lucide-react';

export default function Navigation() {
  const location = useLocation();

  const hiddenRoutes = [
    '/landing',
    '/welcome',
    '/privacy',
    '/terms',
    '/thank-you'
  ];
  
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  const currentPath = location.pathname;

  const tabs = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      isActive: currentPath === '/dashboard' || currentPath === '/'
    },
    {
      to: '/statistics',
      label: 'Stats',
      icon: TrendingUp,
      isActive: currentPath === '/statistics' || currentPath === '/progress'
    },
    {
      to: '/workout-overview',
      label: 'Workouts',
      icon: Dumbbell,
      isActive: ['/workout-overview', '/log-workout', '/workout-complete', '/workouts'].includes(currentPath)
    },
    {
      to: '/log-food',
      label: 'Nutrition',
      icon: Flame,
      isActive: currentPath === '/log-food' || currentPath === '/nutrition'
    },
    {
      to: '/plan',
      label: 'Schedule',
      icon: CalendarDays,
      isActive: currentPath === '/plan' || currentPath === '/schedule'
    },
    {
      to: '/saved',
      label: 'Saved',
      icon: Bookmark,
      isActive: currentPath === '/saved' || currentPath === '/templates'
    }
  ];

  return (
    <nav 
      className="mobile-only-bottom-nav animate-slide-up"
      aria-label="Mobile Bottom Navigation"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        background: 'rgba(13, 13, 13, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '6px 4px',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.isActive;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            aria-label={tab.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              flex: 1,
              maxWidth: '68px',
              padding: '4px 2px',
              textDecoration: 'none',
              borderRadius: '8px',
              color: active ? '#10B981' : '#8E8E93',
              opacity: active ? 1 : 0.65,
              transition: 'all 0.15s ease',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
            <span style={{
              fontSize: '10px',
              fontWeight: active ? '700' : '500',
              letterSpacing: '0.2px',
              lineHeight: 1
            }}>
              {tab.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}

