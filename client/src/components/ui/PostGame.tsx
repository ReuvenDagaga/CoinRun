import { useNavigate } from 'react-router-dom';
import { useGame } from '@/context';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState, useRef } from 'react';

// Screen background image paths (will be provided as assets)
const VICTORY_BG_PATH = '/assets/victory-bg.png';
const GAME_OVER_BG_PATH = '/assets/game-over-bg.png';

export default function PostGame() {
  const navigate = useNavigate();
  const { status, result, gameMode, reset, rewardsBreakdown, endGameState } = useGame();
  const { updateStats, addGems } = useAuth();

  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rewardsClaimed, setRewardsClaimed] = useState(false);
  const hasUpdatedStats = useRef(false);

  const isVictory = status === 'finished';

  // Fade in animation
  useEffect(() => {
    if (status === 'finished' || status === 'gameover') {
      const timer = setTimeout(() => {
        setIsVisible(true);
        if (isVictory) {
          setShowConfetti(true);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [status, isVictory]);

  // Update user stats and claim rewards
  useEffect(() => {
    if (!result || !rewardsBreakdown || hasUpdatedStats.current || rewardsClaimed) return;

    const claimRewards = async () => {
      hasUpdatedStats.current = true;
      setRewardsClaimed(true);

      try {
        // Update stats
        await updateStats({
          coinsCollected: rewardsBreakdown.finalCoins,
          distanceTraveled: result.distanceTraveled,
          won: isVictory,
          armySize: result.maxArmy,
        });

        // Add diamonds if any
        if (rewardsBreakdown.diamondsEarned > 0) {
          await addGems(rewardsBreakdown.diamondsEarned);
        }
      } catch (error) {
        console.error('Failed to claim rewards:', error);
      }
    };

    claimRewards();
  }, [result, rewardsBreakdown, isVictory, updateStats, addGems, rewardsClaimed]);

  if (!result) return null;

  const handlePlayAgain = () => {
    hasUpdatedStats.current = false;
    reset();
    window.location.reload();
  };

  const handleQuit = () => {
    hasUpdatedStats.current = false;
    reset();
    navigate('/');
  };

  // Format time as M:SS.ms
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Background image (will use placeholder gradient until image is provided) */}
      <BackgroundImage isVictory={isVictory} />

      {/* Confetti effect for victory */}
      {showConfetti && isVictory && <UIConfetti />}

      {/* Main content - NO SCROLL, flex layout to fit content */}
      <div
        className={`relative w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden transform transition-all duration-700 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-10'
        }`}
      >
        {/* Header - shrinks proportionally */}
        <div className="text-center flex-shrink-0" style={{ marginBottom: 'clamp(0.5rem, 2vh, 1rem)' }}>
          {isVictory ? (
            <>
              <div className="animate-bounce flex justify-center" style={{ marginBottom: 'clamp(0.25rem, 1vh, 0.75rem)' }}>
                <img src="/ui/icons/trophy.png" alt="Trophy" style={{ width: 'clamp(3rem, 8vh, 5rem)', height: 'clamp(3rem, 8vh, 5rem)' }} />
              </div>
              <h1
                className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400"
                style={{
                  fontSize: 'clamp(1.5rem, 5vh, 2.5rem)',
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3)',
                }}
              >
                VICTORY!
              </h1>
              {rewardsBreakdown && rewardsBreakdown.stairsReached > 0 && (
                <p className="text-yellow-200" style={{ fontSize: 'clamp(0.75rem, 2vh, 1rem)', marginTop: '0.25rem' }}>
                  Reached Stair {rewardsBreakdown.stairsReached}!
                </p>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-center" style={{ marginBottom: 'clamp(0.25rem, 1vh, 0.75rem)' }}>
                <img src="/ui/icons/skull.png" alt="Game Over" style={{ width: 'clamp(3rem, 8vh, 5rem)', height: 'clamp(3rem, 8vh, 5rem)' }} />
              </div>
              <h1 className="font-bold text-white" style={{ fontSize: 'clamp(1.5rem, 5vh, 2.5rem)' }}>GAME OVER</h1>
              <p className="text-gray-400" style={{ fontSize: 'clamp(0.7rem, 1.5vh, 0.875rem)', marginTop: '0.25rem' }}>Better luck next time!</p>
            </>
          )}
        </div>

        {/* Stats card - flex-shrink to fit */}
        <div
          className="bg-black/50 backdrop-blur-md rounded-2xl border border-white/10 flex-shrink"
          style={{ padding: 'clamp(0.75rem, 2vh, 1.5rem)', marginBottom: 'clamp(0.5rem, 1.5vh, 1rem)' }}
        >
          {/* Distance and Time */}
          <div className="grid grid-cols-2" style={{ gap: 'clamp(0.5rem, 1.5vh, 1rem)', marginBottom: 'clamp(0.5rem, 1.5vh, 1rem)' }}>
            <StatBox label="Distance" value={`${Math.floor(result.distanceTraveled)}m`} />
            <StatBox label="Time" value={formatTime(result.timeTaken)} />
          </div>

          {/* Army and Score */}
          <div className="grid grid-cols-2" style={{ gap: 'clamp(0.5rem, 1.5vh, 1rem)' }}>
            <StatBox label="Army Size" value={result.maxArmy.toString()} iconSrc="/ui/icons/army.png" />
            <StatBox label="Score" value={result.finalScore.toLocaleString()} iconSrc="/ui/icons/star.png" />
          </div>
        </div>

        {/* Rewards breakdown - flex-shrink to fit */}
        {rewardsBreakdown && <RewardsBreakdown breakdown={rewardsBreakdown} />}

        {/* Action buttons - fixed height at bottom */}
        <div className="flex flex-shrink-0" style={{ gap: 'clamp(0.5rem, 1.5vh, 1rem)', marginTop: 'clamp(0.5rem, 2vh, 1.5rem)' }}>
          <button
            onClick={handlePlayAgain}
            className={`flex-1 font-bold rounded-xl transition-all duration-200 ${
              isVictory
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black hover:from-yellow-300 hover:to-orange-400 shadow-lg shadow-orange-500/30'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
            style={{ padding: 'clamp(0.75rem, 2vh, 1rem) clamp(1rem, 3vh, 1.5rem)', fontSize: 'clamp(0.875rem, 2vh, 1.125rem)' }}
          >
            Play Again
          </button>
          <button
            onClick={handleQuit}
            className="flex-1 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
            style={{ padding: 'clamp(0.75rem, 2vh, 1rem) clamp(1rem, 3vh, 1.5rem)', fontSize: 'clamp(0.875rem, 2vh, 1.125rem)' }}
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  );
}

// Stat box component
interface StatBoxProps {
  label: string;
  value: string;
  iconSrc?: string;
}

function StatBox({ label, value, iconSrc }: StatBoxProps) {
  return (
    <div className="bg-white/10 rounded-xl text-center" style={{ padding: 'clamp(0.5rem, 1.5vh, 0.75rem)' }}>
      <div className="text-white/60 uppercase tracking-wider" style={{ fontSize: 'clamp(0.6rem, 1.2vh, 0.75rem)', marginBottom: '0.25rem' }}>{label}</div>
      <div className="text-white font-bold flex items-center justify-center" style={{ fontSize: 'clamp(0.875rem, 2.5vh, 1.25rem)', gap: '0.25rem' }}>
        {iconSrc && <img src={iconSrc} alt="" style={{ width: 'clamp(1rem, 2vh, 1.25rem)', height: 'clamp(1rem, 2vh, 1.25rem)' }} />}
        {value}
      </div>
    </div>
  );
}

// Background image component (with fallback gradient)
function BackgroundImage({ isVictory }: { isVictory: boolean }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const imagePath = isVictory ? VICTORY_BG_PATH : GAME_OVER_BG_PATH;

  return (
    <>
      {/* Fallback gradient */}
      <div
        className={`absolute inset-0 ${
          isVictory
            ? 'bg-gradient-to-b from-yellow-900/80 via-orange-900/60 to-black/90'
            : 'bg-gradient-to-b from-gray-800/80 via-gray-900/60 to-black/90'
        }`}
      />

      {/* Image overlay (if available) */}
      <img
        src={imagePath}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
          imageLoaded ? 'opacity-50' : 'opacity-0'
        }`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageLoaded(false)}
      />
    </>
  );
}

// Rewards breakdown component
interface RewardsBreakdownProps {
  breakdown: {
    coinsCollected: number;
    incomeMultiplier: number;
    stairMultiplier: number;
    coinsAfterIncome: number;
    finalCoins: number;
    diamondsEarned: number;
    stairsReached: number;
    isVictory: boolean;
  };
}

function RewardsBreakdown({ breakdown }: RewardsBreakdownProps) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowDetails(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`bg-gradient-to-br from-yellow-900/40 to-orange-900/40 backdrop-blur-md rounded-2xl border border-yellow-500/20 transition-all duration-700 flex-shrink ${
        showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ padding: 'clamp(0.75rem, 2vh, 1.25rem)' }}
    >
      <h3 className="text-yellow-400 font-bold flex items-center" style={{ fontSize: 'clamp(0.875rem, 2vh, 1.125rem)', gap: '0.5rem', marginBottom: 'clamp(0.5rem, 1.5vh, 1rem)' }}>
        <img src="/ui/Coin.png" alt="Coins" style={{ width: 'clamp(1rem, 2vh, 1.25rem)', height: 'clamp(1rem, 2vh, 1.25rem)' }} /> Rewards Breakdown
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.25rem, 1vh, 0.75rem)' }}>
        {/* Coins collected */}
        <RewardRow
          label="Coins collected"
          value={breakdown.coinsCollected}
          delay={0}
        />

        {/* Income multiplier */}
        {breakdown.incomeMultiplier > 1 && (
          <RewardRow
            label={`Income bonus (x${breakdown.incomeMultiplier.toFixed(2)})`}
            value={breakdown.coinsAfterIncome}
            isMultiplier
            delay={200}
          />
        )}

        {/* Stair multiplier */}
        {breakdown.stairMultiplier > 1 && (
          <RewardRow
            label={`Stair bonus (x${breakdown.stairMultiplier.toFixed(1)})`}
            value={breakdown.finalCoins}
            isMultiplier
            delay={400}
          />
        )}

        {/* Divider */}
        <div className="border-t border-yellow-500/30" style={{ margin: 'clamp(0.25rem, 0.75vh, 0.5rem) 0' }} />

        {/* Final coins */}
        <div className="flex justify-between items-center">
          <span className="text-yellow-300 font-bold" style={{ fontSize: 'clamp(0.875rem, 2vh, 1.125rem)' }}>Total Coins</span>
          <span className="text-yellow-400 font-bold flex items-center" style={{ fontSize: 'clamp(1rem, 2.5vh, 1.5rem)', gap: '0.25rem' }}>
            <img src="/ui/Coin.png" alt="Coins" style={{ width: 'clamp(1.25rem, 2.5vh, 1.5rem)', height: 'clamp(1.25rem, 2.5vh, 1.5rem)' }} />
            {breakdown.finalCoins.toLocaleString()}
          </span>
        </div>

        {/* Diamonds earned */}
        {breakdown.diamondsEarned > 0 && (
          <div className="flex justify-between items-center bg-purple-900/30 rounded-lg" style={{ marginTop: 'clamp(0.25rem, 0.75vh, 0.5rem)', padding: 'clamp(0.5rem, 1.25vh, 0.75rem)' }}>
            <span className="text-purple-300 font-medium" style={{ fontSize: 'clamp(0.75rem, 1.5vh, 0.875rem)' }}>
              Diamonds ({breakdown.stairsReached} stairs)
            </span>
            <span className="text-purple-400 font-bold flex items-center" style={{ fontSize: 'clamp(0.875rem, 2vh, 1.125rem)', gap: '0.25rem' }}>
              <img src="/ui/Gem.png" alt="Gems" style={{ width: 'clamp(1rem, 2vh, 1.25rem)', height: 'clamp(1rem, 2vh, 1.25rem)' }} />
              +{breakdown.diamondsEarned}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual reward row with animation
interface RewardRowProps {
  label: string;
  value: number;
  isMultiplier?: boolean;
  delay: number;
}

function RewardRow({ label, value, isMultiplier, delay }: RewardRowProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`flex justify-between items-center transition-all duration-500 ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
      }`}
    >
      <span className="text-white/70" style={{ fontSize: 'clamp(0.7rem, 1.5vh, 0.875rem)' }}>{label}</span>
      <span className={`font-semibold ${isMultiplier ? 'text-green-400' : 'text-white'}`} style={{ fontSize: 'clamp(0.75rem, 1.75vh, 1rem)' }}>
        {isMultiplier ? '= ' : ''}
        {value.toLocaleString()}
      </span>
    </div>
  );
}

// UI Confetti animation
function UIConfetti() {
  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#3B82F6', '#F97316'];
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    scale: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10 - Math.random() * 20,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      scale: 0.5 + Math.random() * 0.5,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 animate-fall"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall 4s linear forwards;
        }
      `}</style>
    </div>
  );
}
