import TextWithShadow from '@/components/TextWithShadow';

export type GameMode = 'solo' | '1v1';

interface ModeSelectorProps {
  selectedMode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

export default function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={() => onModeChange('solo')}
        className={`relative rounded-xl overflow-hidden transition-all active:scale-95 ${
          selectedMode !== 'solo' ? 'opacity-50' : ''
        }`}
      >
        <img
          src="/ui/Solo.Png"
          alt="Solo"
          className="w-full h-auto"
        />
        <TextWithShadow as="span" className="absolute inset-0 flex items-center justify-center text-white font-bold text-base sm:text-xl">
          Solo
        </TextWithShadow>
      </button>
      <button
        onClick={() => onModeChange('1v1')}
        className={`relative rounded-xl overflow-hidden transition-all active:scale-95 ${
          selectedMode !== '1v1' ? 'opacity-50' : ''
        }`}
      >
        <img
          src="/ui/1v1.Png"
          alt="1v1"
          className="w-full h-auto"
        />
        <TextWithShadow as="span" className="absolute inset-0 flex items-center justify-center text-white font-bold text-base sm:text-xl">
          1v1
        </TextWithShadow>
      </button>
    </div>
  );
}
