export interface FeeSettings {
  hourlyRate: number
  graceMinutes: number
}

/** Whole minutes between two instants, never negative. */
export function computeDurationMinutes(entry: Date, exit: Date): number {
  return Math.max(0, Math.floor((exit.getTime() - entry.getTime()) / 60_000))
}

/**
 * Every started hour is charged. Stays within the grace period are free.
 */
export function computeFee(minutes: number, { hourlyRate, graceMinutes }: FeeSettings): number {
  if (hourlyRate <= 0 || minutes <= graceMinutes) return 0
  const hours = Math.max(1, Math.ceil(minutes / 60))
  return Math.round(hours * hourlyRate * 100) / 100
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}
