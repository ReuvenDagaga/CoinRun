import TextWithShadow from '@/components/TextWithShadow';
import { GameMode } from './ModeSelector';

interface PlayButtonProps {
  selectedMode: GameMode;
  onPlay: () => void;
}

export default function PlayButton({ selectedMode, onPlay }: PlayButtonProps) {
  return (
    <button
      onClick={onPlay}
      className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden active:scale-95 transition-transform"
    >
      <img
        src="/ui/Play.Png"
        alt="Start"
        className="w-full h-auto"
      />
      <div className="absolute inset-0 flex items-center justify-center gap-2">
        <TextWithShadow as="span" className="text-white font-bold text-lg sm:text-xl">
          {selectedMode === 'solo' ? 'PLAY' : 'FIND OPPONENT'}
        </TextWithShadow>
        {selectedMode === '1v1' && (
          <img
            src="/ui/Search.Png"
            alt="Search"
            className="w-5 h-5 sm:w-6 sm:h-6"
          />
        )}
      </div>
    </button>
  );
}
