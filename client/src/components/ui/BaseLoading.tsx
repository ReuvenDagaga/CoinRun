import { useState, useEffect } from 'react';

interface BaseLoadingProps {
  message?: string;
  progress?: number; // 0-100 (if not provided, will be auto-animated)
}

export default function BaseLoading({ message = 'Loading...', progress: externalProgress }: BaseLoadingProps) {
  const [internalProgress, setInternalProgress] = useState(0);

  // If no external progress, use automatic animation
  useEffect(() => {
    if (externalProgress !== undefined) return;

    const interval = setInterval(() => {
      setInternalProgress((prev) => {
        if (prev >= 100) return 100;
        return Math.min(prev + Math.random() * 4 + 1, 100);
      });
    }, 150);

    return () => clearInterval(interval);
  }, [externalProgress]);

  const currentProgress = externalProgress !== undefined ? externalProgress : internalProgress;

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a1f] via-[#16213e] to-[#0f3460]">
      {/* Glowing spinner orb */}
      <div
        className="relative w-24 h-24 mb-12 rounded-full"
        style={{
          background: 'radial-gradient(circle, #FFD93D 0%, #FF9500 70%, #FF6B00 100%)',
          boxShadow: '0 0 60px rgba(255, 215, 0, 0.6), 0 0 100px rgba(255, 149, 0, 0.4)',
          animation: 'pulse-spin 2s ease-in-out infinite',
        }}
      >
        {/* Inner rotating ring */}
        <div
          className="absolute inset-4 rounded-full border-4 border-white/30"
          style={{
            animation: 'spin 3s linear infinite',
          }}
        />

        {/* Coin symbol */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-bold text-white drop-shadow-lg">¢</span>
        </div>
      </div>

      {/* Title */}
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

          {/* Percentage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow-md">
              {Math.round(currentProgress)}%
            </span>
          </div>
        </div>
      </div>

      {/* Loading message */}
      <p
        className="text-white/90 text-lg  mb-4"
        style={{
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
        }}
      >
        {message}
      </p>

      {/* Loading dots */}
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

      <style>{`
        @keyframes pulse-spin {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            filter: brightness(1);
          }
          50% {
            transform: scale(1.05) rotate(180deg);
            filter: brightness(1.2);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
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
