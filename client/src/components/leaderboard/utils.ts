export const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

export const getRewardStyle = (idx: number) => {
  switch (idx) {
    case 0:
      return 'bg-yellow-500/30 border-yellow-400';
    case 1:
      return 'bg-gray-400/30 border-gray-300';
    case 2:
      return 'bg-orange-500/30 border-orange-400';
    default:
      return 'bg-cyan-500/20 border-cyan-400/50';
  }
};