import PreGame from '@/components/ui/PreGame';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
  const { user } = useAuth();
  if (user)
  return <PreGame />;
}
