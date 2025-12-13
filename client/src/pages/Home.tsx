import PreGame from '@/components/ui/PreGame';
import { useUser } from '@/context';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user } = useAuth();

  // Show loading state if user data is not yet loaded
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner" />
        svdvsdvsdv
      </div>
    );
  }

  return <PreGame />;
}
