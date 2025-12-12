import { GoogleOAuthProvider } from '@react-oauth/google';
import Layout from './components/layout/Layout';
import { AppRoutes } from './Routes/AppRoutes';
import { AuthProvider, UserProvider, GameProvider, UIProvider } from './context';

// Google OAuth Client ID from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const App = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <UserProvider>
          <GameProvider>
            <UIProvider>
              <Layout children={<AppRoutes />}/>
            </UIProvider>
          </GameProvider>
        </UserProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;