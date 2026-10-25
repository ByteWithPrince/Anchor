import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { unlockAudio } from './services/haptics';

// Keep Home eagerly loaded for instant (<5ms) initial PWA launch
import Home from './pages/Home';

// Lazy-load secondary & heavy routes
const Landing = lazy(() => import('./pages/Landing'));
const LogWorkout = lazy(() => import('./pages/LogWorkout'));
const WorkoutOverview = lazy(() => import('./pages/WorkoutOverview'));
const WorkoutComplete = lazy(() => import('./pages/WorkoutComplete'));
const LogFood = lazy(() => import('./pages/LogFood'));
const PlanBuilder = lazy(() => import('./pages/PlanBuilder'));
const Progress = lazy(() => import('./pages/Progress'));
const SavedTemplates = lazy(() => import('./pages/SavedTemplates'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/Terms'));
const ThankYou = lazy(() => import('./pages/ThankYou'));
const NotFound = lazy(() => import('./pages/NotFound'));

import Navigation from './components/Navigation';
import CookieBanner from './components/CookieBanner';
import { useStore } from './store/useStore';
import { authService } from './services/authService';
import { syncEngine } from './services/syncEngine';

// Minimalist Brutalist Skeleton (#0D0D0D background, #10B981 pulse indicator)
function RouteSkeleton() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#0D0D0D',
        color: '#F3F4F6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        fontSize: '0.75rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
      }}
      aria-busy="true"
      aria-label="Loading view"
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#10B981',
          marginRight: '10px',
          display: 'inline-block',
        }}
      />
      ANCHOR // LOADING
    </div>
  );
}

function ProtectedRoute({ children }) {
  const currentUser = useStore(state => state.currentUser);
  const authToken = useStore(state => state.authToken);
  const isSessionUnlocked = typeof window !== 'undefined' && sessionStorage.getItem('anchor_session_unlocked') === 'true';
  const isAuthenticated = Boolean(currentUser && authToken && isSessionUnlocked);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const authToken = useStore(state => state.authToken);
  const currentUser = useStore(state => state.currentUser);
  const logoutUser = useStore(state => state.logoutUser);

  // Unlock Web Audio API and haptic engine on first user gesture (pointerdown / touchend)
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudio();
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('touchend', handleFirstInteraction);
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    window.addEventListener('touchend', handleFirstInteraction, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('touchend', handleFirstInteraction);
    };
  }, []);

  // Cold-start session verification & cloud rehydration
  useEffect(() => {
    if (!authToken || currentUser?.isGuest) return;

    let isMounted = true;
    (async () => {
      try {
        const user = await authService.fetchMe();
        if (user && isMounted) {
          syncEngine.fullSync(0);
        } else if (!user && isMounted) {
          const refreshed = await authService.refreshToken();
          if (refreshed && refreshed.token && isMounted) {
            syncEngine.fullSync(0);
          } else if (isMounted) {
            logoutUser();
          }
        }
      } catch (err) {
        console.warn('[App] Cold-start session verification error:', err);
      }
    })();

    return () => { isMounted = false; };
  }, [authToken]);

  return (
    <Router>
      <div className="app-container" style={{ paddingBottom: '80px' }}>
        <Suspense fallback={<RouteSkeleton />}>
          <Routes>
            {/* Public Root & Landing Page */}
            <Route path="/" element={<Landing />} />
            <Route path="/welcome" element={<Landing />} />
            <Route path="/landing" element={<Landing />} />

            {/* Protected Cockpit / Dashboard Route */}
            <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />

            {/* Workout Routes */}
            <Route path="/workout/overview" element={<ProtectedRoute><WorkoutOverview /></ProtectedRoute>} />
            <Route path="/workout-overview" element={<ProtectedRoute><WorkoutOverview /></ProtectedRoute>} />
            <Route path="/workout/log" element={<ProtectedRoute><LogWorkout /></ProtectedRoute>} />
            <Route path="/log-workout" element={<ProtectedRoute><LogWorkout /></ProtectedRoute>} />
            <Route path="/workouts" element={<ProtectedRoute><WorkoutOverview /></ProtectedRoute>} />
            <Route path="/workout/complete" element={<ProtectedRoute><WorkoutComplete /></ProtectedRoute>} />
            <Route path="/workout-complete" element={<ProtectedRoute><WorkoutComplete /></ProtectedRoute>} />

            {/* Nutrition Routes */}
            <Route path="/nutrition/log" element={<ProtectedRoute><LogFood /></ProtectedRoute>} />
            <Route path="/log-food" element={<ProtectedRoute><LogFood /></ProtectedRoute>} />
            <Route path="/nutrition" element={<ProtectedRoute><LogFood /></ProtectedRoute>} />

            {/* Plan Builder & Scheduling */}
            <Route path="/plan" element={<ProtectedRoute><PlanBuilder /></ProtectedRoute>} />
            <Route path="/schedule" element={<ProtectedRoute><PlanBuilder /></ProtectedRoute>} />

            {/* Progress & Analytics */}
            <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
            <Route path="/statistics" element={<ProtectedRoute><Progress /></ProtectedRoute>} />

            {/* Saved Templates */}
            <Route path="/templates" element={<ProtectedRoute><SavedTemplates /></ProtectedRoute>} />
            <Route path="/saved" element={<ProtectedRoute><SavedTemplates /></ProtectedRoute>} />

            {/* Legal & Informational (Public) */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/thank-you" element={<ThankYou />} />

            {/* Custom 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Navigation />
        <CookieBanner />
      </div>
    </Router>
  );
}

export default App;
