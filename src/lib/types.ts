export interface LotSettings {
  capacity: number
  hourlyRate: number
  currency: string
  graceMinutes: number
}

export const DEFAULT_SETTINGS: LotSettings = {
  capacity: 20,
  hourlyRate: 0,
  currency: 'USD',
  graceMinutes: 0,
}

export const MAX_CAPACITY = 500

export interface ParkedCar {
  spot: number
  plate: string
  sessionId: string
  entryAt: Date
}

export interface Session {
  id: string
  plate: string
  spot: number
  entryAt: Date
  exitAt: Date | null
  durationMinutes: number | null
  fee: number | null
  currency: string | null
  status: 'parked' | 'left'
}
