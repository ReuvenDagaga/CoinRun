import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import Loading from '../components/ui/Loading';

const Home = lazy(() => import('../pages/Home'));
const Game = lazy(() => import('../pages/Game'));
const Shop = lazy(() => import('../pages/Shop'));
const Profile = lazy(() => import('../pages/Profile'));
const Leaderboard = lazy(() => import('../pages/Leaderboard'));
const Login = lazy(() => import('../pages/auth/Login'));
const Inventory = lazy(() => import('../pages/Inventory'));

// PvP Routes
const PvPLobby = lazy(() => import('../pages/PvPLobbyScreen'));
const PvPGame = lazy(() => import('../pages/PvPGameScreen'));
const PvPResults = lazy(() => import('../pages/PvPResultsScreen'));

export const AppRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes - require authentication */}
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/game" element={<Game />} />
        <Route path="/game/:mode" element={<Game />} />

        {/* PvP Routes */}
        <Route path="/pvp/lobby" element={<PvPLobby />} />
        <Route path="/pvp/game/:roomId" element={<PvPGame />} />
        <Route path="/pvp/results/:roomId" element={<PvPResults />} />
      </Routes>
    </Suspense>
  );
};
