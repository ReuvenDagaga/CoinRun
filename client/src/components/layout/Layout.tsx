import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';

// Pages that should allow scrolling
const SCROLLABLE_PAGES = ['/shop', '/leaderboard', '/profile'];

export default function Layout() {
  const location = useLocation();
  const isScrollable = SCROLLABLE_PAGES.some(page => location.pathname.startsWith(page));

  // Fix viewport height for mobile browsers
  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
    };
  }, []);

  return (
    <div className="screen-fixed bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col">
      <main className={`flex-1 ${isScrollable ? 'overflow-y-auto' : 'overflow-hidden'} pb-20`}>
        <Outlet />
      </main>
      <Navbar />
    </div>
  );
}
