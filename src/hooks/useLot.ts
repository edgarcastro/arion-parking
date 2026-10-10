import { collection, onSnapshot, type Timestamp } from 'firebase/firestore'
import { useEffect, useMemo, useState } from 'react'
import { db } from '../lib/firebase'
import { readSettings, settingsRef } from '../lib/parking'
import { DEFAULT_SETTINGS, type LotSettings, type ParkedCar } from '../lib/types'

export interface LotState {
  settings: LotSettings
  cars: ParkedCar[]
  carsBySpot: Map<number, ParkedCar>
  loading: boolean
  error: Error | null
}

/** Realtime view of the lot: settings plus every occupied spot. */
export function useLot(): LotState {
  const [settings, setSettings] = useState<LotSettings>(DEFAULT_SETTINGS)
  const [cars, setCars] = useState<ParkedCar[]>([])
  const [loaded, setLoaded] = useState({ settings: false, cars: false })
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const unsubSettings = onSnapshot(
      settingsRef,
      (snap) => {
        setSettings(readSettings(snap.data()))
        setLoaded((l) => ({ ...l, settings: true }))
      },
      setError,
    )
    const unsubCars = onSnapshot(
      collection(db, 'activeSpots'),
      (snap) => {
        setCars(
          snap.docs.map((d) => {
            const data = d.data({ serverTimestamps: 'estimate' }) as { plate: string; sessionId: string; entryAt: Timestamp | null }
            return {
              spot: Number(d.id),
              plate: data.plate,
              sessionId: data.sessionId,
              entryAt: data.entryAt?.toDate() ?? new Date(),
            }
          }),
        )
        setLoaded((l) => ({ ...l, cars: true }))
      },
      setError,
    )
    return () => {
      unsubSettings()
      unsubCars()
    }
  }, [])

  const carsBySpot = useMemo(() => new Map(cars.map((c) => [c.spot, c])), [cars])

  return { settings, cars, carsBySpot, loading: !(loaded.settings && loaded.cars), error }
}
