import { useState, useEffect } from 'react';

interface BaseLoadingProps {
  message?: string;
  progress?: number; // 0-100 (אם לא מועבר, יהיה animated progress)
}

export default function BaseLoading({ message, progress: externalProgress }: BaseLoadingProps) {
  const [internalProgress, setInternalProgress] = useState(0);

  // אם לא מועבר progress חיצוני, נשתמש באנימציה אוטומטית
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
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-[#1a0a2e] via-[#16213e] to-[#0f3460]">
      {/* ספינר */}
      <div
        className="relative w-20 h-20 mb-10"
        style={{
          background: 'linear-gradient(135deg, #FFD93D 0%, #FF9500 100%)',
          borderRadius: '50%',
          boxShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
          animation: 'spin 1s linear infinite',
        }}
      />

      {/* Progress Bar - תמיד מוצג */}
      <div
        className="relative w-64 h-2 rounded-full overflow-hidden mb-3"
        style={{
          background: 'rgba(61, 26, 109, 0.8)',
          border: '2px solid #3d1a6d',
        }}
      >
        <div
          className="absolute top-0 left-0 bottom-0 rounded-full transition-all duration-200"
          style={{
            width: `${currentProgress}%`,
            background: 'linear-gradient(90deg, #4CD964 0%, #7CFF6B 100%)',
            boxShadow: '0 0 8px rgba(76,217,100,0.5)',
          }}
        />
      </div>

      {/* הודעת טעינה (אופציונלי) */}
      {message && (
        <p className="text-white/70 text-sm font-game mt-2">
          {message}
        </p>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
