import { useState, useEffect } from 'react';

export default function Loading() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return Math.min(prev + Math.random() * 4 + 1, 100);
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  const circles = [
    { size: 14, delay: 0 },
    { size: 10, delay: 0.15 },
    { size: 6, delay: 0.3 },
    { size: 10, delay: 0.45 },
    { size: 14, delay: 0.6 },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#1a0a2e]">
      <div
        className="relative w-16 h-16 mb-10"
        style={{ animation: 'spin 2.5s linear infinite' }}
      >
        {circles.map((circle, i) => {
          const angle = (i / circles.length) * 360;
          const x = Math.cos((angle * Math.PI) / 180) * 24;
          const y = Math.sin((angle * Math.PI) / 180) * 24;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: circle.size,
                height: circle.size,
                background: 'linear-gradient(180deg, #FFD93D 0%, #FF9500 100%)',
                boxShadow: '0 2px 0 #CC7000',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                animation: `fade 1.25s ease-in-out ${circle.delay}s infinite`,
              }}
            />
          );
        })}
      </div>

      <div
        className="relative w-64 h-2 rounded-full overflow-hidden"
        style={{
          background: 'rgba(61, 26, 109, 0.8)',
          border: '2px solid #3d1a6d',
        }}
      >
        <div
          className="absolute top-0 left-0 bottom-0 rounded-full transition-all duration-200"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #4CD964 0%, #7CFF6B 100%)',
            boxShadow: '0 0 8px rgba(76,217,100,0.5)',
          }}
        />
      </div>

      <p className="mt-4 text-white/70 text-sm font-game">
        {Math.round(progress)}%
      </p>

      <style>{`
        @keyframes fade {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(0.8); }
          50% { opacity: 1; transform: translate(-50%, -50%) translate(var(--x), var(--y)) scale(1); }
        }
      `}</style>
    </div>
  );
}