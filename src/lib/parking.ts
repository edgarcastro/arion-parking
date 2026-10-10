import { collection, doc, runTransaction, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore'
import { db } from './firebase'
import { computeDurationMinutes, computeFee } from './fees'
import { isValidPlate, normalizePlate, PLATE_FORMAT_HINT } from './plate'
import { pickRandomFreeSpot } from './spots'
import { DEFAULT_SETTINGS, type LotSettings } from './types'

export type ParkingErrorCode = 'INVALID_PLATE' | 'ALREADY_PARKED' | 'LOT_FULL' | 'NOT_FOUND'

export class ParkingError extends Error {
  readonly code: ParkingErrorCode

  constructor(code: ParkingErrorCode, message: string) {
    super(message)
    this.code = code
  }
}

export const settingsRef = doc(db, 'settings', 'lot')
export const spotRef = (spot: number) => doc(db, 'activeSpots', String(spot))
export const plateRef = (plate: string) => doc(db, 'activePlates', plate)
export const sessionRef = (id: string) => doc(db, 'sessions', id)

export function readSettings(data: Partial<LotSettings> | undefined): LotSettings {
  return { ...DEFAULT_SETTINGS, ...data }
}

/**
 * Parks a car in a random free spot. `occupiedHint` comes from the realtime
 * listener so we only read candidate spots; the transaction still verifies
 * each candidate, and the rules guarantee one car per spot and per plate.
 */
export async function parkCar(rawPlate: string, occupiedHint: number[]): Promise<{ plate: string; spot: number }> {
  const plate = normalizePlate(rawPlate)
  if (!isValidPlate(plate)) {
    throw new ParkingError('INVALID_PLATE', PLATE_FORMAT_HINT)
  }

  return runTransaction(db, async (tx) => {
    const settings = readSettings((await tx.get(settingsRef)).data())

    if ((await tx.get(plateRef(plate))).exists()) {
      throw new ParkingError('ALREADY_PARKED', `${plate} is already parked.`)
    }

    // Pick at random among spots the hint says are free, verifying each in the transaction.
    const candidates = new Set(occupiedHint)
    let spot: number | null = null
    while ((spot = pickRandomFreeSpot(candidates, settings.capacity)) !== null) {
      if (!(await tx.get(spotRef(spot))).exists()) break
      candidates.add(spot)
    }
    if (spot === null) throw new ParkingError('LOT_FULL', 'The parking lot is full.')

    const sessionId = doc(collection(db, 'sessions')).id
    tx.set(spotRef(spot), { plate, sessionId, entryAt: serverTimestamp() })
    tx.set(plateRef(plate), { spot, sessionId })
    tx.set(sessionRef(sessionId), {
      plate,
      spot,
      entryAt: serverTimestamp(),
      exitAt: null,
      durationMinutes: null,
      fee: null,
      currency: null,
      status: 'parked',
    })
    return { plate, spot }
  })
}

export interface ExitResult {
  plate: string
  spot: number
  durationMinutes: number
  fee: number
  currency: string
}

/** Frees a spot and closes the car's session with its duration and fee. */
export async function exitCar(spot: number): Promise<ExitResult> {
  return runTransaction(db, async (tx) => {
    const settings = readSettings((await tx.get(settingsRef)).data())
    const spotSnap = await tx.get(spotRef(spot))
    if (!spotSnap.exists()) throw new ParkingError('NOT_FOUND', `Spot ${spot} is already free.`)

    const { plate, sessionId, entryAt } = spotSnap.data() as { plate: string; sessionId: string; entryAt: Timestamp }
    const durationMinutes = computeDurationMinutes(entryAt.toDate(), new Date())
    const fee = computeFee(durationMinutes, settings)

    tx.delete(spotRef(spot))
    tx.delete(plateRef(plate))
    tx.update(sessionRef(sessionId), {
      status: 'left',
      exitAt: serverTimestamp(),
      durationMinutes,
      fee,
      currency: settings.currency,
    })
    return { plate, spot, durationMinutes, fee, currency: settings.currency }
  })
}

export async function saveSettings(settings: LotSettings, updatedBy: string): Promise<void> {
  await setDoc(settingsRef, { ...settings, updatedBy, updatedAt: serverTimestamp() })
}
