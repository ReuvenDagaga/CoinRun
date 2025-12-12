import { useEffect } from 'react';
import PreGame from '@/components/ui/PreGame';
import { useAuth, useUser, createGuestUserData } from '@/context';

export default function Home() {
  const { user: authUser, isAuthenticated, login } = useAuth();
  const { userData, initializeUserData } = useUser();

  // Initialize guest user if not logged in
  useEffect(() => {
    if (!authUser && !userData) {
      const guestData = createGuestUserData();
      login({ id: guestData.id, username: guestData.username, email: guestData.email });
      initializeUserData(guestData);
    }
  }, [authUser, userData, login, initializeUserData]);

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return <PreGame />;
}
