import { Transaction, ITransaction } from '../models/Transactions.js';
import mongoose from 'mongoose';

export class TransactionService {
  /**
   * Log a transaction to the database
   */
  static async logTransaction(
    data: {
      userId: string;
      type: string;
      currency: 'coins' | 'gems';
      amount: number;
      balanceBefore: number;
      balanceAfter: number;
      description?: string;
      metadata?: Record<string, unknown>;
    },
    session?: mongoose.ClientSession
  ): Promise<ITransaction> {
    const transaction = new Transaction({
      userId: new mongoose.Types.ObjectId(data.userId),
      type: data.type,
      currency: data.currency,
      amount: data.amount,
      balanceBefore: data.balanceBefore,
      balanceAfter: data.balanceAfter,
      description: data.description || `${data.type} - ${data.amount} ${data.currency}`,
      metadata: data.metadata
    });

    if (session) {
      await transaction.save({ session });
    } else {
      await transaction.save();
    }

    return transaction;
  }

  /**
   * Get user's transaction history
   */
  static async getUserTransactions(
    userId: string,
    filters?: {
      type?: string;
      currency?: 'coins' | 'gems';
      limit?: number;
      skip?: number;
    }
  ) {
    const query: any = { userId: new mongoose.Types.ObjectId(userId) };

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.currency) {
      query.currency = filters.currency;
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(filters?.skip || 0)
      .limit(filters?.limit || 50);

    return transactions;
  }

  /**
   * Get transaction statistics
   */
  static async getUserStats(userId: string) {
    const stats = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$currency',
          totalEarned: {
            $sum: {
              $cond: [{ $gt: ['$amount', 0] }, '$amount', 0]
            }
          },
          totalSpent: {
            $sum: {
              $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0]
            }
          },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    return stats;
  }
}

export default TransactionService;
