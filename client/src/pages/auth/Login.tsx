import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@/context';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { initializeUserData } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call to your backend
      // This is a placeholder that simulates authentication

      if (isSignup) {
        // Simulate signup
        if (!username || !email || !password) {
          setError('All fields are required');
          setIsLoading(false);
          return;
        }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create user account (placeholder)
        const userId = 'user-' + Date.now();

        login({
          id: userId,
          username,
          email
        });

        // Initialize user data
        initializeUserData({
          id: userId,
          username,
          email,
          usdtBalance: 0,
          coins: 1000,
          gems: 50,
          currentSkin: 'default',
          ownedSkins: ['default'],
          upgrades: {
            capacity: 0,
            addWarrior: 0,
            warriorUpgrade: 0,
            income: 0,
            speed: 0,
            jump: 0,
            bulletPower: 0,
            magnetRadius: 0
          },
          stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            totalDistance: 0,
            totalCoinsCollected: 0,
            highestArmy: 0
          },
          dailyMissionsCompleted: [],
          lastDailyReward: null,
          spinUsedToday: false,
          dailyStreak: 0,
          achievements: []
        });

        navigate('/');
      } else {
        // Simulate login
        if (!email || !password) {
          setError('Email and password are required');
          setIsLoading(false);
          return;
        }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For demo purposes, accept any email/password
        const userId = 'user-' + email.replace('@', '-');

        login({
          id: userId,
          username: email.split('@')[0],
          email
        });

        // TODO: Fetch user data from backend
        // For now, initialize with default data
        initializeUserData({
          id: userId,
          username: email.split('@')[0],
          email,
          usdtBalance: 0,
          coins: 1000,
          gems: 50,
          currentSkin: 'default',
          ownedSkins: ['default'],
          upgrades: {
            capacity: 0,
            addWarrior: 0,
            warriorUpgrade: 0,
            income: 0,
            speed: 0,
            jump: 0,
            bulletPower: 0,
            magnetRadius: 0
          },
          stats: {
            gamesPlayed: 0,
            gamesWon: 0,
            totalDistance: 0,
            totalCoinsCollected: 0,
            highestArmy: 0
          },
          dailyMissionsCompleted: [],
          lastDailyReward: null,
          spinUsedToday: false,
          dailyStreak: 0,
          achievements: []
        });

        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2" style={{
            fontFamily: '"Comic Sans MS", "Bangers", sans-serif',
            textShadow: '3px 3px 0 #FF6B35, -1px -1px 0 #000'
          }}>
            🏃 COIN RUN
          </h1>
          <p className="text-white/90 text-lg">Run, Collect, Conquer!</p>
        </div>

        {/* Login/Signup Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label htmlFor="username" className="block text-white text-sm font-semibold mb-2">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="Choose a username"
                  required={isSignup}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-white text-sm font-semibold mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-white text-sm font-semibold mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-200 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isSignup ? 'Creating Account...' : 'Logging In...'}
                </span>
              ) : (
                <span>{isSignup ? '🎮 Create Account' : '🚀 Login'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignup(!isSignup);
                setError('');
              }}
              className="text-white/90 hover:text-white font-semibold underline"
            >
              {isSignup
                ? 'Already have an account? Login'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        {/* Demo Notice */}
        <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
          <p className="text-white/80 text-sm text-center">
            <span className="font-semibold">Demo Mode:</span> Enter any email and password to login
          </p>
        </div>
      </div>
    </div>
  );
}
