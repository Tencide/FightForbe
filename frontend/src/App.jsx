import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Progress from './pages/Progress';
import PartnerPlaceholder from './pages/PartnerPlaceholder';
import NotFound from './pages/NotFound';

function AthleteDashboardGate() {
  const { user } = useAuth();
  if (user.role !== 'athlete') return <Navigate to="/workouts" replace />;
  return <Dashboard />;
}

function CoachHomeGate() {
  const { user } = useAuth();
  if (user.role !== 'coach') return <Navigate to="/" replace />;
  return (
    <PartnerPlaceholder title="Coach dashboard">
      Tucker's coach dashboard will surface athlete management, assignments, and monitoring tools here. Use{' '}
      <strong>Workouts</strong> and <strong>Progress</strong> in the navigation to manage data today.
    </PartnerPlaceholder>
  );
}

function AdminHomeGate() {
  const { user } = useAuth();
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return (
    <PartnerPlaceholder title="Admin dashboard">
      Tucker's admin tools will provide full CRUD over users, meals, and messages. You can still manage workouts and
      review progress from the navigation bar.
    </PartnerPlaceholder>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/signup"
            element={
              <PartnerPlaceholder title="Sign up">
                Tucker is building the registration experience. Until then, use seeded demo accounts from the README.
              </PartnerPlaceholder>
            }
          />

          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<AthleteDashboardGate />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/progress" element={<Progress />} />
            <Route
              path="/meals"
              element={
                <PartnerPlaceholder title="Meal plans">
                  Tucker connects this page to the Meal Plan API for assigned nutrition targets.
                </PartnerPlaceholder>
              }
            />
            <Route
              path="/chat"
              element={
                <PartnerPlaceholder title="Chat">
                  Tucker wires this view to the Messaging API for athlete-coach conversations.
                </PartnerPlaceholder>
              }
            />
            <Route path="/coach" element={<CoachHomeGate />} />
            <Route path="/admin" element={<AdminHomeGate />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
