import Layout from './components/layout/Layout';
import { AppRoutes } from './Routes/AppRoutes';
import { AuthProvider, UserProvider, GameProvider, UIProvider } from './context';

const App = () => {
  return (
    <AuthProvider>
      <UserProvider>
        <GameProvider>
          <UIProvider>
            <Layout children={<AppRoutes />}/>
          </UIProvider>
        </GameProvider>
      </UserProvider>
    </AuthProvider>
  );
};

export default App;