/**
 * Entity Interpolation - Smooth opponent movement despite network latency
 * Buffers states and interpolates between them with 66ms delay (2 ticks)
 */
import { PlayerState, PVP_CONSTANTS } from '../../../shared/types/pvp.types';

interface StateSnapshot {
  state: PlayerState;
  timestamp: number;
}

export class EntityInterpolation {
  private stateBuffer: StateSnapshot[] = [];
  private maxBufferSize: number = 10; // Keep last 10 states (333ms worth)
  private interpolationDelay: number = PVP_CONSTANTS.INTERPOLATION_DELAY;
  private lastInterpolatedState: PlayerState | null = null;

  /**
   * Add new state to buffer
   */
  addState(state: PlayerState, timestamp: number): void {
    this.stateBuffer.push({ state, timestamp });

    // Sort by timestamp (should already be in order, but ensure it)
    this.stateBuffer.sort((a, b) => a.timestamp - b.timestamp);

    // Trim old states
    if (this.stateBuffer.length > this.maxBufferSize) {
      this.stateBuffer.shift();
    }
  }

  /**
   * Get interpolated state for rendering
   * Renders opponent 66ms behind real-time
   */
  getInterpolatedState(currentTime: number): PlayerState | null {
    if (this.stateBuffer.length < 2) {
      // Not enough states to interpolate
      return this.stateBuffer.length === 1 ? this.stateBuffer[0].state : this.lastInterpolatedState;
    }

    // Calculate render time (current time - interpolation delay)
    const renderTime = currentTime - this.interpolationDelay;

    // Find the two states to interpolate between
    let from: StateSnapshot | null = null;
    let to: StateSnapshot | null = null;

    for (let i = 0; i < this.stateBuffer.length - 1; i++) {
      if (this.stateBuffer[i].timestamp <= renderTime && this.stateBuffer[i + 1].timestamp >= renderTime) {
        from = this.stateBuffer[i];
        to = this.stateBuffer[i + 1];
        break;
      }
    }

    // If no suitable states found, use latest
    if (!from || !to) {
      const latest = this.stateBuffer[this.stateBuffer.length - 1];
      this.lastInterpolatedState = latest.state;
      return latest.state;
    }

    // Calculate interpolation factor (0-1)
    const duration = to.timestamp - from.timestamp;
    const elapsed = renderTime - from.timestamp;
    const t = duration > 0 ? Math.min(elapsed / duration, 1) : 1;

    // Interpolate between states
    const interpolated: PlayerState = {
      userId: from.state.userId,
      username: from.state.username,
      avatar: from.state.avatar,
      skin: from.state.skin,
      position: this.lerpVector3(from.state.position, to.state.position, t),
      lane: to.state.lane, // Lane changes are instant, no interpolation
      soldiers: to.state.soldiers, // Discrete value
      isAlive: to.state.isAlive,
      velocity: this.lerpVector3(from.state.velocity, to.state.velocity, t),
      lastInputSequence: to.state.lastInputSequence,
      progress: this.lerp(from.state.progress, to.state.progress, t),
      completionTime: to.state.completionTime
    };

    this.lastInterpolatedState = interpolated;
    return interpolated;
  }

  /**
   * Get extrapolated state (dead reckoning)
   * Used when no new states received (packet loss)
   */
  getExtrapolatedState(currentTime: number, maxExtrapolation: number = 100): PlayerState | null {
    if (this.stateBuffer.length === 0) {
      return this.lastInterpolatedState;
    }

    const latest = this.stateBuffer[this.stateBuffer.length - 1];
    const timeSinceLastState = currentTime - latest.timestamp;

    // Only extrapolate for a short time (100ms max)
    if (timeSinceLastState > maxExtrapolation) {
      return latest.state;
    }

    // Extrapolate position using velocity
    const deltaSeconds = timeSinceLastState / 1000;

    const extrapolated: PlayerState = {
      ...latest.state,
      position: {
        x: latest.state.position.x + latest.state.velocity.x * deltaSeconds,
        y: latest.state.position.y + latest.state.velocity.y * deltaSeconds,
        z: latest.state.position.z + latest.state.velocity.z * deltaSeconds
      }
    };

    return extrapolated;
  }

  /**
   * Clear buffer
   */
  clear(): void {
    this.stateBuffer = [];
    this.lastInterpolatedState = null;
  }

  /**
   * Get buffer size (for debugging)
   */
  getBufferSize(): number {
    return this.stateBuffer.length;
  }

  /**
   * Linear interpolation between two numbers
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Linear interpolation between two Vector3s
   */
  private lerpVector3(
    a: { x: number; y: number; z: number },
    b: { x: number; y: number; z: number },
    t: number
  ): { x: number; y: number; z: number } {
    return {
      x: this.lerp(a.x, b.x, t),
      y: this.lerp(a.y, b.y, t),
      z: this.lerp(a.z, b.z, t)
    };
  }

  /**
   * Smooth correction when server state significantly differs
   * Gradually moves state towards target over time
   */
  smoothCorrection(
    current: { x: number; y: number; z: number },
    target: { x: number; y: number; z: number },
    correctionSpeed: number = 0.1
  ): { x: number; y: number; z: number } {
    return {
      x: this.lerp(current.x, target.x, correctionSpeed),
      y: this.lerp(current.y, target.y, correctionSpeed),
      z: this.lerp(current.z, target.z, correctionSpeed)
    };
  }
}

/**
 * State Buffer Manager - Manages multiple entity interpolators
 */
export class StateBufferManager {
  private interpolators: Map<string, EntityInterpolation> = new Map();

  /**
   * Get or create interpolator for entity
   */
  getInterpolator(entityId: string): EntityInterpolation {
    if (!this.interpolators.has(entityId)) {
      this.interpolators.set(entityId, new EntityInterpolation());
    }
    return this.interpolators.get(entityId)!;
  }

  /**
   * Remove interpolator
   */
  removeInterpolator(entityId: string): void {
    this.interpolators.delete(entityId);
  }

  /**
   * Clear all interpolators
   */
  clearAll(): void {
    this.interpolators.clear();
  }
}
