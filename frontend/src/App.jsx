import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/AppShell';
import { ProtectedRoute } from './components/ProtectedRoute';
import Progress from './pages/Progress';
import PartnerPlaceholder from './pages/PartnerPlaceholder';
import NotFound from './pages/NotFound';

function Landing() {
  return (
    <PartnerPlaceholder title="FightForge">
      Log in and open /progress to log metrics (this branch delivers the Progress UI).
    </PartnerPlaceholder>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/progress" element={<Progress />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
