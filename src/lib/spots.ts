/** Free spot numbers (1-based) in ascending order. */
export function freeSpots(occupied: Iterable<number>, capacity: number): number[] {
  const taken = new Set(occupied)
  const free: number[] = []
  for (let spot = 1; spot <= capacity; spot++) {
    if (!taken.has(spot)) free.push(spot)
  }
  return free
}

export function findFirstFreeSpot(occupied: Iterable<number>, capacity: number): number | null {
  return freeSpots(occupied, capacity)[0] ?? null
}

/** A uniformly random free spot, or null when the lot is full. */
export function pickRandomFreeSpot(occupied: Iterable<number>, capacity: number, random: () => number = Math.random): number | null {
  const free = freeSpots(occupied, capacity)
  return free.length ? free[Math.floor(random() * free.length)] : null
}

/** Highest occupied spot number, or 0 when the lot is empty. */
export function highestOccupiedSpot(occupied: Iterable<number>): number {
  let max = 0
  for (const spot of occupied) max = Math.max(max, spot)
  return max
}

/** Stable, pleasant car color derived from the plate. */
export function carColor(plate: string): string {
  let hash = 0
  for (const ch of plate) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const palette = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#e5e7eb', '#475569']
  return palette[hash % palette.length]
}
