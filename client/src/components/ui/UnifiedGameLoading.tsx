import { useState, useEffect } from 'react';

export interface UnifiedGameLoadingProps {
  phase: 'initializing' | 'generating' | 'warming-up' | 'ready' | 'starting';
  progress?: number; // 0-100, אופציונלי - אם לא מועבר יהיה auto-animated
  message?: string;
  showProgressBar?: boolean;
}

export default function UnifiedGameLoading({
  phase,
  progress: externalProgress,
  message,
  showProgressBar = true
}: UnifiedGameLoadingProps) {
  const [internalProgress, setInternalProgress] = useState(0);

  // Auto-animated progress אם לא מועבר progress חיצוני
  useEffect(() => {
    if (externalProgress !== undefined) {
      setInternalProgress(externalProgress);
      return;
    }

    // Auto-animate based on phase
    const targetProgress = {
      'initializing': 20,
      'generating': 50,
      'warming-up': 80,
      'ready': 95,
      'starting': 100
    }[phase];

    const interval = setInterval(() => {
      setInternalProgress(prev => {
        if (prev >= targetProgress) return targetProgress;
        const diff = targetProgress - prev;
        const increment = Math.max(0.5, diff * 0.1);
        return Math.min(prev + increment, targetProgress);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [phase, externalProgress]);

  const currentProgress = externalProgress !== undefined ? externalProgress : internalProgress;

  // Phase-specific messages
  const phaseMessage = message || {
    'initializing': 'מאתחל משחק...',
    'generating': 'בונה מסלול...',
    'warming-up': 'מחמם מנועים...',
    'ready': 'מוכן!',
    'starting': 'מתחיל...'
  }[phase];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1f] via-[#16213e] to-[#0f3460]">
      {/* Main Logo/Icon */}
      <div className="relative mb-12">
        {/* Glowing orb */}
        <div
          className="relative w-32 h-32 rounded-full"
          style={{
            background: 'radial-gradient(circle, #FFD93D 0%, #FF9500 70%, #FF6B00 100%)',
            boxShadow: '0 0 60px rgba(255, 215, 0, 0.6), 0 0 100px rgba(255, 149, 0, 0.4)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        >
          {/* Inner spinning ring */}
          <div
            className="absolute inset-4 rounded-full border-4 border-white/30"
            style={{
              animation: 'spin 3s linear infinite',
            }}
          />

          {/* Coin symbol */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-bold text-white drop-shadow-lg">
              ¢
            </span>
          </div>
        </div>

        {/* Orbiting particles */}
        {[0, 120, 240].map((angle, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-yellow-300 rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%)`,
              animation: `orbit-${i} 4s linear infinite`,
              animationDelay: `${i * 0.5}s`,
              boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
            }}
          />
        ))}
      </div>

      {/* Game Title */}
      <h1
        className="text-5xl font-black text-white mb-8 tracking-wider"
        style={{
          textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.5)',
          fontFamily: 'Impact, sans-serif',
        }}
      >
        COINRUN
      </h1>

      {/* Progress Bar */}
      {showProgressBar && (
        <div className="w-80 max-w-[90vw] mb-6">
          <div
            className="relative h-4 rounded-full overflow-hidden"
            style={{
              background: 'linear-gradient(90deg, rgba(61, 26, 109, 0.6) 0%, rgba(88, 28, 135, 0.6) 100%)',
              border: '2px solid rgba(139, 92, 246, 0.4)',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Progress fill */}
            <div
              className="absolute top-0 left-0 bottom-0 rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${currentProgress}%`,
                background: 'linear-gradient(90deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.6), inset 0 1px 3px rgba(255, 255, 255, 0.3)',
              }}
            >
              {/* Shine effect */}
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)',
                  animation: 'shine 2s ease-in-out infinite',
                }}
              />
            </div>

            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow-md">
                {Math.round(currentProgress)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Phase Message */}
      <p
        className="text-white/90 text-lg font-semibold mb-4 animate-pulse"
        style={{
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        }}
      >
        {phaseMessage}
      </p>

      {/* Loading dots animation */}
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-cyan-400 rounded-full"
            style={{
              animation: 'bounce-dot 1.4s ease-in-out infinite',
              animationDelay: `${i * 0.16}s`,
              boxShadow: '0 0 8px rgba(34, 211, 238, 0.6)',
            }}
          />
        ))}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
            filter: brightness(1);
          }
          50% {
            transform: scale(1.05);
            filter: brightness(1.2);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes orbit-0 {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) translateX(80px) rotate(0deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg) translateX(80px) rotate(-360deg);
          }
        }

        @keyframes orbit-1 {
          0% {
            transform: translate(-50%, -50%) rotate(120deg) translateX(80px) rotate(-120deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(480deg) translateX(80px) rotate(-480deg);
          }
        }

        @keyframes orbit-2 {
          0% {
            transform: translate(-50%, -50%) rotate(240deg) translateX(80px) rotate(-240deg);
          }
          100% {
            transform: translate(-50%, -50%) rotate(600deg) translateX(80px) rotate(-600deg);
          }
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        @keyframes bounce-dot {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          40% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
