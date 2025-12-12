import { useLocation } from 'react-router-dom';
import { useEffect, ReactNode } from 'react';
import Navbar from './Navbar';

const SCROLLABLE_PAGES = ['/shop', '/leaderboard', '/profile'];

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isScrollable = SCROLLABLE_PAGES.some(page => location.pathname.startsWith(page));

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
        {children}
      </main>
      <Navbar />
    </div>
  );
}