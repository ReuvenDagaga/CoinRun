import PreGame from '@/components/ui/PreGame';
import { useUser } from '@/context';

export default function Home() {
  const { userData } = useUser();

  // Show loading state if user data is not yet loaded
  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner" />
      </div>
    );
  }

  return <PreGame />;
}
