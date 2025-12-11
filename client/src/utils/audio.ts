// Audio manager for game sounds and background music

type SoundName =
  | 'click'
  | 'hover'
  | 'success'
  | 'error'
  | 'coin'
  | 'gate'
  | 'powerup'
  | 'hit'
  | 'die'
  | 'win'
  | 'jump'
  | 'soldierAdd';

interface AudioManagerOptions {
  volume?: number;
  muted?: boolean;
}

class AudioManager {
  private sounds: Map<SoundName, HTMLAudioElement> = new Map();
  private bgm?: HTMLAudioElement;
  private volume: number = 0.5;
  private muted: boolean = false;
  private initialized: boolean = false;

  constructor(options?: AudioManagerOptions) {
    this.volume = options?.volume ?? 0.5;
    this.muted = options?.muted ?? false;
  }

  /**
   * Initialize and preload all sounds
   * Must be called after user interaction (click) due to browser autoplay policies
   */
  initialize() {
    if (this.initialized) return;

    const soundFiles: Record<SoundName, string> = {
      click: '/sounds/click.mp3',
      hover: '/sounds/hover.mp3',
      success: '/sounds/success.mp3',
      error: '/sounds/error.mp3',
      coin: '/sounds/coin.mp3',
      gate: '/sounds/gate.mp3',
      powerup: '/sounds/powerup.mp3',
      hit: '/sounds/hit.mp3',
      die: '/sounds/die.mp3',
      win: '/sounds/win.mp3',
      jump: '/sounds/jump.mp3',
      soldierAdd: '/sounds/soldier.mp3'
    };

    // Preload sounds
    Object.entries(soundFiles).forEach(([name, path]) => {
      const audio = new Audio(path);
      audio.volume = this.volume;
      audio.preload = 'auto';
      // Ignore errors for missing sound files
      audio.onerror = () => {
        console.warn(`Sound file not found: ${path}`);
      };
      this.sounds.set(name as SoundName, audio);
    });

    // Background music
    this.bgm = new Audio('/sounds/bgm.mp3');
    this.bgm.loop = true;
    this.bgm.volume = this.volume * 0.3; // BGM is quieter
    this.bgm.onerror = () => {
      console.warn('Background music file not found');
    };

    this.initialized = true;
  }

  /**
   * Play a sound effect
   */
  play(soundName: SoundName) {
    if (!this.initialized) this.initialize();
    if (this.muted) return;

    const sound = this.sounds.get(soundName);
    if (sound) {
      // Clone the audio for overlapping sounds
      const clone = sound.cloneNode(true) as HTMLAudioElement;
      clone.volume = this.volume;
      clone.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }

  /**
   * Play background music
   */
  playBGM() {
    if (!this.initialized) this.initialize();
    if (!this.muted && this.bgm) {
      this.bgm.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }

  /**
   * Pause background music
   */
  pauseBGM() {
    if (this.bgm) {
      this.bgm.pause();
    }
  }

  /**
   * Stop background music and reset to beginning
   */
  stopBGM() {
    if (this.bgm) {
      this.bgm.pause();
      this.bgm.currentTime = 0;
    }
  }

  /**
   * Set the master volume (0-1)
   */
  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));

    // Update all sound volumes
    this.sounds.forEach((sound) => {
      sound.volume = this.volume;
    });

    // BGM is always quieter
    if (this.bgm) {
      this.bgm.volume = this.volume * 0.3;
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Toggle mute state
   */
  toggleMute(): boolean {
    this.muted = !this.muted;

    if (this.muted) {
      this.pauseBGM();
    }

    return this.muted;
  }

  /**
   * Set mute state
   */
  setMuted(muted: boolean) {
    this.muted = muted;

    if (this.muted) {
      this.pauseBGM();
    }
  }

  /**
   * Check if muted
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Play button click sound (convenience method)
   */
  buttonClick() {
    this.play('click');
  }

  /**
   * Play coin collect sound
   */
  collectCoin() {
    this.play('coin');
  }

  /**
   * Play gate pass sound
   */
  passGate() {
    this.play('gate');
  }

  /**
   * Play powerup activation sound
   */
  activatePowerup() {
    this.play('powerup');
  }

  /**
   * Play enemy hit sound
   */
  enemyHit() {
    this.play('hit');
  }

  /**
   * Play soldier death sound
   */
  soldierDie() {
    this.play('die');
  }

  /**
   * Play win/victory sound
   */
  victory() {
    this.play('win');
  }

  /**
   * Play jump sound
   */
  playerJump() {
    this.play('jump');
  }

  /**
   * Play soldier add sound
   */
  addSoldier() {
    this.play('soldierAdd');
  }
}

// Create singleton instance
export const audio = new AudioManager();

// Export class for testing
export { AudioManager };

// Initialize on first user interaction
if (typeof window !== 'undefined') {
  const initOnInteraction = () => {
    audio.initialize();
    document.removeEventListener('click', initOnInteraction);
    document.removeEventListener('touchstart', initOnInteraction);
  };

  document.addEventListener('click', initOnInteraction, { once: true });
  document.addEventListener('touchstart', initOnInteraction, { once: true });
}
