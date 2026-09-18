import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import LogWorkout from './pages/LogWorkout';
import LogFood from './pages/LogFood';
import PlanBuilder from './pages/PlanBuilder';
import WorkoutOverview from './pages/WorkoutOverview';
import WorkoutComplete from './pages/WorkoutComplete';
import Progress from './pages/Progress';
import Landing from './pages/Landing';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import SavedTemplates from './pages/SavedTemplates';
import ThankYou from './pages/ThankYou';
import Navigation from './components/Navigation';
import CookieBanner from './components/CookieBanner';
import { useStore } from './store/useStore';
import { authService } from './services/authService';
import { syncEngine } from './services/syncEngine';

function ProtectedRoute({ children }) {
  const currentUser = useStore(state => state.currentUser);
  const authToken = useStore(state => state.authToken);
  const isAuthenticated = Boolean(currentUser && authToken);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const authToken = useStore(state => state.authToken);
  const currentUser = useStore(state => state.currentUser);
  const logoutUser = useStore(state => state.logoutUser);

  // Cold-start session verification & cloud rehydration
  useEffect(() => {
    if (!authToken || currentUser?.isGuest) return;

    let isMounted = true;
    (async () => {
      try {
        const user = await authService.fetchMe();
        if (user && isMounted) {
          // Rehydrate latest cloud state in background
          syncEngine.fullSync(0);
        } else if (!user && isMounted) {
          // Attempt silent renewal via httpOnly refresh token cookie
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
        <Routes>
          {/* Root Route: Always opens Landing page first as requested */}
          <Route path="/" element={<Landing />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />

          {/* Protected Workout & Nutrition Routes */}
          <Route path="/log-workout" element={<ProtectedRoute><LogWorkout /></ProtectedRoute>} />
          <Route path="/workouts" element={<ProtectedRoute><WorkoutOverview /></ProtectedRoute>} />
          <Route path="/workout-overview" element={<ProtectedRoute><WorkoutOverview /></ProtectedRoute>} />
          <Route path="/workout-complete" element={<ProtectedRoute><WorkoutComplete /></ProtectedRoute>} />
          <Route path="/log-food" element={<ProtectedRoute><LogFood /></ProtectedRoute>} />
          <Route path="/nutrition" element={<ProtectedRoute><LogFood /></ProtectedRoute>} />
          <Route path="/plan" element={<ProtectedRoute><PlanBuilder /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><PlanBuilder /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
          <Route path="/statistics" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute><SavedTemplates /></ProtectedRoute>} />

          {/* Public Legal & Informational Pages */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/thank-you" element={<ThankYou />} />

          {/* Custom 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Navigation />
        <CookieBanner />
      </div>
    </Router>
  );
}

export default App;

