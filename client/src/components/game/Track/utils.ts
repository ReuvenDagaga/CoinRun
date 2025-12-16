export function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function getSeedValue(seed?: string): number {
  return seed
    ? seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    : Date.now();
}