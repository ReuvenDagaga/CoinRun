import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import Loading from './components/ui/Loading';
import Login from './pages/auth/Login';
import { AppRoutes } from './Routes/AppRoutes';
import { AuthProvider, GameProvider, UIProvider } from './context';
import { ToastProvider } from './context/ToastContext';
import { CardProvider } from './context/CardContext';
import { CLIENT_CONSTANTS } from './utils/constants';


function MainApp() {
  return (
    <ToastProvider>
      <CardProvider>
        <GameProvider>
          <UIProvider>
            <Layout>
              <AppRoutes />
            </Layout>
          </UIProvider>
        </GameProvider>
      </CardProvider>
    </ToastProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading />;
  }

  if (!user) {
    return <Login />;
  }
  return <MainApp />;
}

// Root app component
const App = () => {
  return (
    <GoogleOAuthProvider clientId={CLIENT_CONSTANTS.GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
