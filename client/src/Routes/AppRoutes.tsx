import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import Loading from '../components/ui/Loading';
import ProtectedRoute from '../components/auth/ProtectedRoute';

const Home = lazy(() => import('../pages/Home'));
const Game = lazy(() => import('../pages/Game'));
const Shop = lazy(() => import('../pages/Shop'));
const Profile = lazy(() => import('../pages/Profile'));
const Leaderboard = lazy(() => import('../pages/Leaderboard'));
const Login = lazy(() => import('../pages/auth/Login'));

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
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/game" element={<ProtectedRoute><Game /></ProtectedRoute>} />
        <Route path="/game/:mode" element={<ProtectedRoute><Game /></ProtectedRoute>} />
      </Routes>
    </Suspense>
  );
};

