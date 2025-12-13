export interface IAchievement {
  achievementId: string;
  progress: number;
  unlocked: boolean;
  unlockedAt?: Date;
}