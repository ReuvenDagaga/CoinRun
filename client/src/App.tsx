import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import Loading from './components/ui/Loading';
import Login from './pages/auth/Login';
import { AppRoutes } from './Routes/AppRoutes';
import { AuthProvider, GameProvider, UIProvider } from './context';
import { ToastProvider } from './context/ToastContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Main app content - only renders when user is logged in
function MainApp() {
  return (
    <ToastProvider>
      <GameProvider>
        <UIProvider>
          <Layout>
            <AppRoutes />
          </Layout>
        </UIProvider>
      </GameProvider>
    </ToastProvider>

  );
}

// Auth wrapper - handles login state
function AppContent() {
  const { user, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return <Loading />;
  }

  // Not logged in - show login page
  if (!user) {
    return <Login />;
  }

  // Logged in - show main app
  return <MainApp />;
}

// Root app component
const App = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
