/**
 * ChunkManager.ts
 *
 * Dynamic loading/unloading system for performance optimization.
 * Uses spatial indexing and object pooling to handle 2000m track efficiently.
 */

// =====================
// Configuration
// =====================

export const CHUNK_CONFIG = {
  // Render window
  RENDER_AHEAD: 200,      // Load objects this far ahead of player
  RENDER_BEHIND: 50,      // Keep objects this far behind player
  CLEANUP_BEHIND: 100,    // Remove objects this far behind player

  // Chunk size for spatial indexing
  CHUNK_SIZE: 50,         // 50m buckets

  // Pool sizes per object type
  POOL_SIZES: {
    coin: 100,
    gate: 10,
    enemy: 20,
    soldier: 15,
  },
} as const;

// =====================
// Types
// =====================

export interface ChunkableObject {
  id: string;
  position: { x: number; y: number; z: number };
}

interface ChunkData<T extends ChunkableObject> {
  objects: T[];
}

// =====================
// Spatial Index Class
// =====================

export class SpatialIndex<T extends ChunkableObject> {
  private chunks: Map<number, ChunkData<T>> = new Map();
  private chunkSize: number;

  constructor(chunkSize: number = CHUNK_CONFIG.CHUNK_SIZE) {
    this.chunkSize = chunkSize;
  }

  /**
   * Build spatial index from array of objects
   */
  build(objects: T[]): void {
    this.chunks.clear();

    for (const obj of objects) {
      const chunkIndex = this.getChunkIndex(obj.position.z);

      if (!this.chunks.has(chunkIndex)) {
        this.chunks.set(chunkIndex, { objects: [] });
      }

      this.chunks.get(chunkIndex)!.objects.push(obj);
    }
  }

  /**
   * Get chunk index for a Z position
   */
  getChunkIndex(z: number): number {
    return Math.floor(z / this.chunkSize);
  }

  /**
   * Get all objects in range [minZ, maxZ]
   */
  getObjectsInRange(minZ: number, maxZ: number): T[] {
    const result: T[] = [];

    const startChunk = this.getChunkIndex(minZ);
    const endChunk = this.getChunkIndex(maxZ);

    for (let i = startChunk; i <= endChunk; i++) {
      const chunk = this.chunks.get(i);
      if (chunk) {
        // Filter to exact range within chunk
        for (const obj of chunk.objects) {
          if (obj.position.z >= minZ && obj.position.z <= maxZ) {
            result.push(obj);
          }
        }
      }
    }

    return result;
  }

  /**
   * Get objects visible to player (in render window)
   */
  getVisibleObjects(playerZ: number): T[] {
    const minZ = playerZ - CHUNK_CONFIG.RENDER_BEHIND;
    const maxZ = playerZ + CHUNK_CONFIG.RENDER_AHEAD;
    return this.getObjectsInRange(minZ, maxZ);
  }

  /**
   * Get chunk indices in render window
   */
  getActiveChunkIndices(playerZ: number): number[] {
    const minChunk = this.getChunkIndex(playerZ - CHUNK_CONFIG.RENDER_BEHIND);
    const maxChunk = this.getChunkIndex(playerZ + CHUNK_CONFIG.RENDER_AHEAD);

    const indices: number[] = [];
    for (let i = minChunk; i <= maxChunk; i++) {
      indices.push(i);
    }
    return indices;
  }

  /**
   * Check if a chunk exists
   */
  hasChunk(index: number): boolean {
    return this.chunks.has(index);
  }

  /**
   * Get count of all objects
   */
  getTotalCount(): number {
    let count = 0;
    for (const chunk of this.chunks.values()) {
      count += chunk.objects.length;
    }
    return count;
  }
}

// =====================
// Object Pool Class
// =====================

export class ObjectPool<T> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory());
    }
  }

  /**
   * Acquire an object from the pool
   */
  acquire(): T {
    let obj: T;

    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else if (this.inUse.size < this.maxSize) {
      obj = this.factory();
    } else {
      // Pool exhausted, create temporary (will be GC'd)
      obj = this.factory();
    }

    this.inUse.add(obj);
    return obj;
  }

  /**
   * Release an object back to the pool
   */
  release(obj: T): void {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      this.reset(obj);

      if (this.available.length < this.maxSize) {
        this.available.push(obj);
      }
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): { available: number; inUse: number; maxSize: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      maxSize: this.maxSize,
    };
  }
}

// =====================
// Active Object Tracker
// =====================

export class ActiveObjectTracker<T extends ChunkableObject> {
  private activeIds: Set<string> = new Set();
  private spatialIndex: SpatialIndex<T>;
  private lastPlayerZ: number = 0;

  constructor(objects: T[]) {
    this.spatialIndex = new SpatialIndex<T>();
    this.spatialIndex.build(objects);
  }

  /**
   * Update active objects based on player position
   * Returns objects to add and remove
   */
  update(playerZ: number, excludeIds: Set<string> = new Set()): {
    toAdd: T[];
    toRemove: string[];
    active: T[];
  } {
    const cleanupZ = playerZ - CHUNK_CONFIG.CLEANUP_BEHIND;
    const visibleObjects = this.spatialIndex.getVisibleObjects(playerZ);

    const toAdd: T[] = [];
    const toRemove: string[] = [];
    const newActiveIds = new Set<string>();
    const active: T[] = [];

    // Find objects to add (newly visible)
    for (const obj of visibleObjects) {
      // Skip excluded objects (e.g., collected coins)
      if (excludeIds.has(obj.id)) continue;

      newActiveIds.add(obj.id);
      active.push(obj);

      if (!this.activeIds.has(obj.id)) {
        toAdd.push(obj);
      }
    }

    // Find objects to remove (behind cleanup zone)
    for (const id of this.activeIds) {
      if (!newActiveIds.has(id)) {
        toRemove.push(id);
      }
    }

    this.activeIds = newActiveIds;
    this.lastPlayerZ = playerZ;

    return { toAdd, toRemove, active };
  }

  /**
   * Get currently active objects
   */
  getActive(): string[] {
    return Array.from(this.activeIds);
  }

  /**
   * Get total object count
   */
  getTotalCount(): number {
    return this.spatialIndex.getTotalCount();
  }

  /**
   * Get active count
   */
  getActiveCount(): number {
    return this.activeIds.size;
  }
}

// =====================
// Chunk Manager (Main Class)
// =====================

export interface ChunkManagerState {
  activeCoins: number;
  activeGates: number;
  activeEnemies: number;
  activeSoldiers: number;
  totalCoins: number;
  totalGates: number;
  totalEnemies: number;
  totalSoldiers: number;
}

export function createChunkManagerState(): ChunkManagerState {
  return {
    activeCoins: 0,
    activeGates: 0,
    activeEnemies: 0,
    activeSoldiers: 0,
    totalCoins: 0,
    totalGates: 0,
    totalEnemies: 0,
    totalSoldiers: 0,
  };
}

// =====================
// Utility Functions
// =====================

/**
 * Calculate which chunks are visible for a player position
 */
export function getVisibleChunks(playerZ: number): { start: number; end: number } {
  const start = Math.floor((playerZ - CHUNK_CONFIG.RENDER_BEHIND) / CHUNK_CONFIG.CHUNK_SIZE);
  const end = Math.floor((playerZ + CHUNK_CONFIG.RENDER_AHEAD) / CHUNK_CONFIG.CHUNK_SIZE);
  return { start, end };
}

/**
 * Check if an object is in the cleanup zone (should be removed)
 */
export function isInCleanupZone(objectZ: number, playerZ: number): boolean {
  return objectZ < playerZ - CHUNK_CONFIG.CLEANUP_BEHIND;
}

/**
 * Check if an object is in the render window
 */
export function isInRenderWindow(objectZ: number, playerZ: number): boolean {
  return objectZ >= playerZ - CHUNK_CONFIG.RENDER_BEHIND &&
         objectZ <= playerZ + CHUNK_CONFIG.RENDER_AHEAD;
}

/**
 * Filter objects to only those in render window
 */
export function filterVisibleObjects<T extends ChunkableObject>(
  objects: T[],
  playerZ: number
): T[] {
  const minZ = playerZ - CHUNK_CONFIG.RENDER_BEHIND;
  const maxZ = playerZ + CHUNK_CONFIG.RENDER_AHEAD;

  return objects.filter(obj =>
    obj.position.z >= minZ && obj.position.z <= maxZ
  );
}

/**
 * Pre-sort objects into chunks for fast access
 */
export function buildChunkIndex<T extends ChunkableObject>(
  objects: T[]
): Map<number, T[]> {
  const chunks = new Map<number, T[]>();

  for (const obj of objects) {
    const chunkIndex = Math.floor(obj.position.z / CHUNK_CONFIG.CHUNK_SIZE);

    if (!chunks.has(chunkIndex)) {
      chunks.set(chunkIndex, []);
    }

    chunks.get(chunkIndex)!.push(obj);
  }

  return chunks;
}

/**
 * Get objects from chunk index in range
 */
export function getObjectsFromChunks<T extends ChunkableObject>(
  chunks: Map<number, T[]>,
  playerZ: number
): T[] {
  const { start, end } = getVisibleChunks(playerZ);
  const result: T[] = [];

  for (let i = start; i <= end; i++) {
    const chunk = chunks.get(i);
    if (chunk) {
      result.push(...chunk);
    }
  }

  return result;
}
