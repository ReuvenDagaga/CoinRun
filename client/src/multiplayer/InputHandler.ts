/**
 * Client Input Handler - Captures inputs, sends to server, applies local prediction
 * Implements client-side prediction with server reconciliation
 */
import { InputPacket } from '../../../shared/types/pvp.types';
import { sendInput } from '../services/pvpSocket';

export interface PredictedState {
  sequenceNumber: number;
  position: { x: number; y: number; z: number };
  lane: number;
  timestamp: number;
}

export class InputHandler {
  private roomId: string;
  private sequenceNumber: number = 0;
  private pendingInputs: InputPacket[] = [];
  private predictedStates: PredictedState[] = [];
  private maxPredictedStates: number = 60; // 2 seconds worth (30 ticks/sec)

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  /**
   * Handle lane change input (swipe left/right)
   */
  handleLaneChange(direction: 'LEFT' | 'RIGHT', currentState: any): void {
    const input: InputPacket = {
      type: direction === 'LEFT' ? 'LANE_LEFT' : 'LANE_RIGHT',
      timestamp: Date.now(),
      sequenceNumber: this.sequenceNumber++
    };

    // Send to server immediately
    sendInput(this.roomId, input);

    // Apply locally for instant feedback (client prediction)
    this.applyInputLocally(input, currentState);

    // Store for reconciliation
    this.pendingInputs.push(input);
    this.trimPendingInputs();
  }

  /**
   * Handle jump input
   */
  handleJump(currentState: any): void {
    const input: InputPacket = {
      type: 'JUMP',
      timestamp: Date.now(),
      sequenceNumber: this.sequenceNumber++
    };

    // Send to server
    sendInput(this.roomId, input);

    // Apply locally
    this.applyInputLocally(input, currentState);

    // Store for reconciliation
    this.pendingInputs.push(input);
    this.trimPendingInputs();
  }

  /**
   * Apply input locally (client prediction)
   */
  private applyInputLocally(input: InputPacket, currentState: any): void {
    const { type } = input;

    switch (type) {
      case 'LANE_LEFT':
        if (currentState.lane > -1) {
          currentState.lane -= 1;
        }
        break;

      case 'LANE_RIGHT':
        if (currentState.lane < 1) {
          currentState.lane += 1;
        }
        break;

      case 'JUMP':
        // Trigger jump animation/physics
        if (currentState.onGround) {
          currentState.velocity.y = currentState.jumpForce || 10;
          currentState.onGround = false;
        }
        break;
    }

    // Store predicted state
    this.predictedStates.push({
      sequenceNumber: input.sequenceNumber,
      position: { ...currentState.position },
      lane: currentState.lane,
      timestamp: input.timestamp
    });

    this.trimPredictedStates();
  }

  /**
   * Reconcile with server state
   * Called when server state arrives
   */
  reconcile(serverState: any, serverSequence: number): void {
    // Remove confirmed inputs
    this.pendingInputs = this.pendingInputs.filter(
      input => input.sequenceNumber > serverSequence
    );

    // Remove confirmed predicted states
    this.predictedStates = this.predictedStates.filter(
      state => state.sequenceNumber > serverSequence
    );

    // Check for discrepancy
    const lastConfirmedState = this.predictedStates.find(
      state => state.sequenceNumber === serverSequence
    );

    if (lastConfirmedState) {
      const positionError = Math.sqrt(
        Math.pow(lastConfirmedState.position.x - serverState.position.x, 2) +
        Math.pow(lastConfirmedState.position.z - serverState.position.z, 2)
      );

      // If error is significant, snap to server position
      if (positionError > 1.0) {
        console.warn(`Position mismatch detected: ${positionError.toFixed(2)} units`);
        // Snap to server state (handled by caller)
        return;
      }
    }

    // Re-apply pending inputs on top of server state
    // This ensures we stay in sync while maintaining responsiveness
    if (this.pendingInputs.length > 0) {
      console.log(`Re-applying ${this.pendingInputs.length} pending inputs`);
      // Caller should re-apply these inputs
    }
  }

  /**
   * Get pending inputs for re-application
   */
  getPendingInputs(): InputPacket[] {
    return [...this.pendingInputs];
  }

  /**
   * Clear all pending data
   */
  clear(): void {
    this.pendingInputs = [];
    this.predictedStates = [];
    this.sequenceNumber = 0;
  }

  /**
   * Trim old pending inputs (keep last 60)
   */
  private trimPendingInputs(): void {
    if (this.pendingInputs.length > this.maxPredictedStates) {
      this.pendingInputs = this.pendingInputs.slice(-this.maxPredictedStates);
    }
  }

  /**
   * Trim old predicted states (keep last 60)
   */
  private trimPredictedStates(): void {
    if (this.predictedStates.length > this.maxPredictedStates) {
      this.predictedStates = this.predictedStates.slice(-this.maxPredictedStates);
    }
  }
}
