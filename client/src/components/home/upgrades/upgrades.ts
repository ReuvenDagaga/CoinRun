export interface UpgradeType {
  key: string;
  name: string;
  icon: string;
  headerColor: string;
  bgColor: string;
  borderColor: string;
}

export const upgrades: UpgradeType[] = [
  {
    key: 'addWarrior',
    name: 'Add Warrior',
    icon: '/ui/AddWarriors.Png',
    headerColor: '#7cb342',
    bgColor: '#c5e1a5',
    borderColor: '#aed581'
  },
  {
    key: 'warriorUpgrade',
    name: 'Warrior Upgrade',
    icon: '/ui/Power.Png',
    headerColor: '#5c6bc0',
    bgColor: '#c5cae9',
    borderColor: '#9fa8da'
  },
  {
    key: 'income',
    name: 'Income',
    icon: '/ui/Income.Png',
    headerColor: '#26a69a',
    bgColor: '#b2dfdb',
    borderColor: '#80cbc4'
  },
  {
    key: 'speed',
    name: 'Speed',
    icon: '/ui/Speed.Png',
    headerColor: '#ef5350',
    bgColor: '#ffcdd2',
    borderColor: '#ef9a9a'
  },
];
