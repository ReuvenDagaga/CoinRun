import { useEffect } from 'react';
import PreGame from '@/components/ui/PreGame';
import { useUserStore, initializeGuestUser } from '@/store/userStore';

export default function Home() {
  const { user, isAuthenticated } = useUserStore();

  // Initialize guest user if not logged in
  useEffect(() => {
    if (!user) {
      initializeGuestUser();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return <PreGame />;
}
