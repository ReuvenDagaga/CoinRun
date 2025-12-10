import { User } from '../../models/Users.js';
import { RunnerGame } from '../../models/RunnerGame.js';
import { Transaction } from '../../models/Transactions.js';
import mongoose from 'mongoose';

interface QueueEntry {
  odfsId: string;
  socketId: string;
  betAmount: number;
  powerLevel: number;
  joinedAt: number;
}

export class MatchmakingQueue {
  private queue: Map<string, QueueEntry> = new Map();

  add(entry: QueueEntry) {
    this.queue.set(entry.odfsId, entry);
  }

  remove(odfsId: string) {
    this.queue.delete(odfsId);
  }

  size(): number {
    return this.queue.size;
  }

  findMatch(entry: QueueEntry): { player1: QueueEntry; player2: QueueEntry } | null {
    const powerTolerance = 0.1; // 10% tolerance

    for (const [id, candidate] of this.queue.entries()) {
      // Skip self
      if (id === entry.odfsId) continue;

      // Must have same bet amount
      if (candidate.betAmount !== entry.betAmount) continue;

      // Check power level within tolerance
      const powerDiff = Math.abs(candidate.powerLevel - entry.powerLevel);
      const maxDiff = Math.max(candidate.powerLevel, entry.powerLevel) * powerTolerance;

      if (powerDiff <= maxDiff) {
        return { player1: entry, player2: candidate };
      }
    }

    return null;
  }

  getTimedOut(timeoutMs: number): QueueEntry[] {
    const now = Date.now();
    const timedOut: QueueEntry[] = [];

    for (const entry of this.queue.values()) {
      if (now - entry.joinedAt > timeoutMs) {
        timedOut.push(entry);
      }
    }

    return timedOut;
  }
}

export async function createMatch(
  player1Id: string,
  player2Id: string,
  betAmount: number,
  trackSeed: string
): Promise<string> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Deduct bet amounts from both players
    const player1 = await User.findById(player1Id).session(session);
    const player2 = await User.findById(player2Id).session(session);

    if (!player1 || !player2) {
      throw new Error('Player not found');
    }

    if (player1.usdtBalance < betAmount || player2.usdtBalance < betAmount) {
      throw new Error('Insufficient balance');
    }

    // Deduct bets
    player1.usdtBalance -= betAmount;
    player2.usdtBalance -= betAmount;

    await player1.save({ session });
    await player2.save({ session });

    // Create game record
    const game = new RunnerGame({
      gameType: '1v1',
      trackSeed,
      trackDifficulty: 1,
      betAmount,
      players: [
        { userId: player1._id },
        { userId: player2._id }
      ],
      status: 'pending'
    });

    await game.save({ session });

    // Create bet transactions
    await Transaction.create([
      {
        userId: player1._id,
        type: 'bet',
        currency: 'usdt',
        amount: -betAmount,
        balanceBefore: player1.usdtBalance + betAmount,
        balanceAfter: player1.usdtBalance,
        description: `Bet on 1v1 match`,
        relatedGameId: game._id
      },
      {
        userId: player2._id,
        type: 'bet',
        currency: 'usdt',
        amount: -betAmount,
        balanceBefore: player2.usdtBalance + betAmount,
        balanceAfter: player2.usdtBalance,
        description: `Bet on 1v1 match`,
        relatedGameId: game._id
      }
    ], { session });

    await session.commitTransaction();
    return game._id.toString();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

export async function processMatchResult(
  matchId: string,
  betAmount: number,
  winnerId: string,
  loserId: string,
  results: { odfsId: string; finalScore?: number; coinsCollected?: number; maxArmy?: number; distanceTraveled?: number; timeTaken?: number; didFinish?: boolean }[]
): Promise<void> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find game
    const game = await RunnerGame.findOne({
      'players.userId': { $all: [winnerId, loserId] },
      status: 'in_progress'
    }).session(session);

    if (!game) {
      // Game might not exist yet or already processed
      console.log('Game not found for match result processing');
      return;
    }

    // Update game with results
    for (const result of results) {
      const playerIndex = game.players.findIndex(p => p.userId.toString() === result.odfsId);
      if (playerIndex !== -1 && result.finalScore !== undefined) {
        game.players[playerIndex].finalScore = result.finalScore;
        game.players[playerIndex].coinsCollected = result.coinsCollected || 0;
        game.players[playerIndex].maxArmy = result.maxArmy || 0;
        game.players[playerIndex].distanceTraveled = result.distanceTraveled || 0;
        game.players[playerIndex].timeTaken = result.timeTaken || 0;
        game.players[playerIndex].didFinish = result.didFinish || false;
      }
    }

    game.winnerId = new mongoose.Types.ObjectId(winnerId);
    game.status = 'finished';
    game.finishedAt = new Date();

    await game.save({ session });

    // Calculate winnings (90% to winner, 10% house fee)
    const totalPool = betAmount * 2;
    const houseFee = totalPool * 0.1;
    const winnings = totalPool - houseFee;

    // Pay winner
    const winner = await User.findById(winnerId).session(session);
    if (winner) {
      const prevBalance = winner.usdtBalance;
      winner.usdtBalance += winnings;
      winner.gamesWon += 1;
      winner.gamesPlayed += 1;

      await winner.save({ session });

      await Transaction.create([{
        userId: winner._id,
        type: 'win',
        currency: 'usdt',
        amount: winnings,
        balanceBefore: prevBalance,
        balanceAfter: winner.usdtBalance,
        description: `Won 1v1 match`,
        relatedGameId: game._id
      }], { session });
    }

    // Update loser stats
    const loser = await User.findById(loserId).session(session);
    if (loser) {
      loser.gamesPlayed += 1;
      await loser.save({ session });
    }

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    console.error('Failed to process match result:', error);
    throw error;
  } finally {
    session.endSession();
  }
}
