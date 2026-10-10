import { Spinner } from '@heroui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIdleReset } from '../hooks/useIdleReset'
import { useLot } from '../hooks/useLot'
import type { ParkedCar } from '../lib/types'
import { AddCarBar } from './AddCarBar'
import { ExitCarModal } from './ExitCarModal'
import { ParkingLot } from './lot/ParkingLot'
import { LotStats } from './LotStats'

interface LotScreenProps {
  /** Kiosk mode: bigger targets and reset after inactivity. */
  kiosk?: boolean
  header?: (stats: React.ReactNode) => React.ReactNode
}

export function LotScreen({ kiosk, header }: LotScreenProps) {
  const { settings, cars, carsBySpot, loading, error } = useLot()
  const [selected, setSelected] = useState<ParkedCar | null>(null)
  const [plate, setPlate] = useState('')
  const [highlight, setHighlight] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const occupied = useMemo(() => cars.map((c) => c.spot), [cars])
  const occupiedInLot = cars.filter((c) => c.spot <= settings.capacity).length
  const isFull = occupiedInLot >= settings.capacity

  useEffect(() => {
    if (highlight === null) return
    const t = setTimeout(() => setHighlight(null), 2500)
    return () => clearTimeout(t)
  }, [highlight])

  // Close the modal if the car left from another device.
  const selectedCar = selected && carsBySpot.get(selected.spot)?.sessionId === selected.sessionId ? selected : null

  const resetKiosk = useCallback(() => {
    setSelected(null)
    setPlate('')
    inputRef.current?.blur()
  }, [])
  useIdleReset(kiosk ? resetKiosk : () => {}, 60_000)

  const stats = <LotStats capacity={settings.capacity} occupied={occupiedInLot} large={kiosk} />

  return (
    <div className="flex flex-col gap-4">
      {header?.(stats)}

      <AddCarBar
        occupied={occupied}
        isFull={isFull}
        onParked={setHighlight}
        large={kiosk}
        inputRef={inputRef}
        value={plate}
        onChange={setPlate}
      />

      {error ? (
        <p role="alert" className="rounded-xl bg-danger-soft p-4 text-danger-soft-foreground">
          Could not load the parking lot: {error.message}
        </p>
      ) : loading ? (
        <div className="flex justify-center p-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <ParkingLot
          capacity={settings.capacity}
          carsBySpot={carsBySpot}
          onSelectCar={setSelected}
          highlightSpot={highlight}
          large={kiosk}
        />
      )}

      <p className="text-center text-sm text-muted">
        {kiosk ? 'Tap a car to check it out.' : 'Click a car (or use the arrow keys and Enter) to check it out.'}
      </p>

      <ExitCarModal car={selectedCar} settings={settings} onClose={() => setSelected(null)} large={kiosk} />
    </div>
  )
}
