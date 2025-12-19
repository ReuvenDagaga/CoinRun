// Achievement definitions
export const ACHIEVEMENTS = {
  // Gameplay
  FIRST_WIN: {
    id: 'first_win',
    name: 'First Victory',
    description: 'Win your first game',
    reward: { coins: 500 }
  },
  WINS_10: {
    id: 'wins_10',
    name: 'Getting Started',
    description: 'Win 10 games',
    reward: { coins: 1000, gems: 25 }
  },
  WINS_50: {
    id: 'wins_50',
    name: 'Seasoned Runner',
    description: 'Win 50 games',
    reward: { coins: 5000, gems: 100 }
  },
  WINS_100: {
    id: 'wins_100',
    name: 'Master Runner',
    description: 'Win 100 games',
    reward: { coins: 10000, gems: 200 }
  },
  SCORE_10K: {
    id: 'score_10k',
    name: 'High Scorer',
    description: 'Reach 10,000 score in a single game',
    reward: { coins: 1000 }
  },
  SCORE_25K: {
    id: 'score_25k',
    name: 'Score Master',
    description: 'Reach 25,000 score in a single game',
    reward: { coins: 2500, gems: 50 }
  },
  ARMY_50: {
    id: 'army_50',
    name: 'Small Army',
    description: 'Have 50 soldiers at once',
    reward: { coins: 500 }
  },
  ARMY_100: {
    id: 'army_100',
    name: 'Large Army',
    description: 'Have 100 soldiers at once',
    reward: { coins: 2000, gems: 50 }
  },
  PERFECT_RUN: {
    id: 'perfect_run',
    name: 'Flawless',
    description: 'Complete a game without taking damage',
    reward: { coins: 5000, gems: 100 }
  },
  SPEED_RUN: {
    id: 'speed_run',
    name: 'Speed Demon',
    description: 'Complete a game in under 90 seconds',
    reward: { coins: 3000, gems: 75 }
  },

  // Progression
  POWER_100: {
    id: 'power_100',
    name: 'Rising Power',
    description: 'Reach power level 100',
    reward: { coins: 1000 }
  },
  POWER_250: {
    id: 'power_250',
    name: 'Formidable',
    description: 'Reach power level 250',
    reward: { coins: 5000, gems: 100 }
  },
  POWER_500: {
    id: 'power_500',
    name: 'Legendary',
    description: 'Reach power level 500',
    reward: { coins: 10000, gems: 500 }
  },
  MAX_UPGRADE: {
    id: 'max_upgrade',
    name: 'Maximizer',
    description: 'Max out any upgrade',
    reward: { coins: 5000, gems: 100 }
  },
  COLLECT_10K: {
    id: 'collect_10k',
    name: 'Coin Collector',
    description: 'Collect 10,000 coins total',
    reward: { coins: 1000 }
  },
  COLLECT_100K: {
    id: 'collect_100k',
    name: 'Treasure Hunter',
    description: 'Collect 100,000 coins total',
    reward: { coins: 10000, gems: 200 }
  },

  // Social
  REFER_5: {
    id: 'refer_5',
    name: 'Friendly',
    description: 'Refer 5 friends',
    reward: { coins: 2500, gems: 50 }
  },
  TOP_10: {
    id: 'top_10',
    name: 'Leaderboard Star',
    description: 'Reach top 10 on any leaderboard',
    reward: { coins: 5000, gems: 100 }
  },

  // Special
  PLAY_100_DAYS: {
    id: 'play_100_days',
    name: 'Dedicated',
    description: 'Play for 100 days',
    reward: { coins: 10000, gems: 500 }
  },
  WIN_WITH_1: {
    id: 'win_with_1',
    name: 'Last Survivor',
    description: 'Win a game with exactly 1 soldier',
    reward: { coins: 5000, gems: 200 }
  }
} as const;
