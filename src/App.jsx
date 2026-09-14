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
import ThankYou from './pages/ThankYou';
import Navigation from './components/Navigation';
import CookieBanner from './components/CookieBanner';
import { useStore } from './store/useStore';

function RootRoute() {
  const currentUser = useStore(state => state.currentUser);
  const authToken = useStore(state => state.authToken);
  const isAuthenticated = Boolean(currentUser && authToken);

  return isAuthenticated ? <Home /> : <Landing />;
}

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
  return (
    <Router>
      <div className="app-container" style={{ paddingBottom: '80px' }}>
        <Routes>
          {/* Root Route: Landing Page if guest, Dashboard if logged in */}
          <Route path="/" element={<RootRoute />} />
          <Route path="/dashboard" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/landing" element={<Landing />} />

          {/* Protected Workout & Nutrition Routes */}
          <Route path="/log-workout" element={<ProtectedRoute><LogWorkout /></ProtectedRoute>} />
          <Route path="/log-food" element={<ProtectedRoute><LogFood /></ProtectedRoute>} />
          <Route path="/plan" element={<ProtectedRoute><PlanBuilder /></ProtectedRoute>} />
          <Route path="/workout-overview" element={<ProtectedRoute><WorkoutOverview /></ProtectedRoute>} />
          <Route path="/workout-complete" element={<ProtectedRoute><WorkoutComplete /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />

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

