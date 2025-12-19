// Daily mission templates
export const DAILY_MISSIONS = [
  {
    id: 'play_3',
    description: 'Play 3 games',
    target: 3,
    reward: { coins: 200 },
    type: 'games_played'
  },
  {
    id: 'win_betting',
    description: 'Win 1 betting game',
    target: 1,
    reward: { coins: 500 },
    type: 'betting_wins'
  },
  {
    id: 'collect_100',
    description: 'Collect 100 coins',
    target: 100,
    reward: { coins: 150 },
    type: 'coins_collected'
  },
  {
    id: 'defeat_20',
    description: 'Defeat 20 enemies',
    target: 20,
    reward: { coins: 200 },
    type: 'enemies_killed'
  },
  {
    id: 'army_30',
    description: 'Have 30 soldiers at once',
    target: 30,
    reward: { coins: 250 },
    type: 'max_army'
  }
] as const;
