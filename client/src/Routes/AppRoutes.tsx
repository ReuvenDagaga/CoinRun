import { Routes, Route, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import Loading from '../components/ui/Loading';

const Home = lazy(() => import('../pages/Home'));
const Game = lazy(() => import('../pages/Game'));
const Shop = lazy(() => import('../pages/Shop'));
const Profile = lazy(() => import('../pages/Profile'));
const Leaderboard = lazy(() => import('../pages/Leaderboard'));

export const AppRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/game" element={<Game />} />
        <Route path="/game/:mode" element={<Game />} />
      </Routes>
    </Suspense>
  );
};

