import { ArrowRightStartOnRectangleIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline'
import { Button, Modal, toast } from '@heroui/react'
import { useState } from 'react'
import { useNow } from '../hooks/useNow'
import { computeDurationMinutes, computeFee, formatDuration, formatMoney } from '../lib/fees'
import { ParkingError, exitCar } from '../lib/parking'
import { carColor } from '../lib/spots'
import type { LotSettings, ParkedCar } from '../lib/types'
import { CarSprite } from './lot/CarSprite'

interface ExitCarModalProps {
  car: ParkedCar | null
  settings: LotSettings
  onClose: () => void
  large?: boolean
}

export function ExitCarModal({ car, settings, onClose, large }: ExitCarModalProps) {
  const now = useNow(10_000)
  const [pending, setPending] = useState(false)

  const minutes = car ? computeDurationMinutes(car.entryAt, now) : 0
  const fee = computeFee(minutes, settings)

  const confirm = async () => {
    if (!car) return
    setPending(true)
    try {
      const result = await exitCar(car.spot)
      toast.success(`${result.plate} left`, {
        description: `${formatDuration(result.durationMinutes)} · ${formatMoney(result.fee, result.currency)}`,
      })
      onClose()
    } catch (err) {
      toast.danger(err instanceof ParkingError ? err.message : 'Could not check out the car. Try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal.Backdrop isOpen={car !== null} onOpenChange={(open) => !open && onClose()}>
      <Modal.Container size={large ? 'lg' : 'md'} placement="center">
        <Modal.Dialog>
          {car && (
            <>
              <Modal.CloseTrigger />
              <Modal.Header className="items-center gap-3">
                <CarSprite color={carColor(car.plate)} className="h-16 w-9" />
                <Modal.Heading className="font-mono text-3xl font-bold tracking-widest">{car.plate}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <dl className={`grid grid-cols-2 gap-x-4 gap-y-3 ${large ? 'text-lg' : ''}`}>
                  <dt className="flex items-center gap-2 text-muted">
                    <MapPinIcon className="size-5" /> Spot
                  </dt>
                  <dd className="text-right font-semibold">{car.spot}</dd>
                  <dt className="flex items-center gap-2 text-muted">
                    <ClockIcon className="size-5" /> Entered
                  </dt>
                  <dd className="text-right font-semibold">
                    {car.entryAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </dd>
                  <dt className="text-muted">Leaving</dt>
                  <dd className="text-right font-semibold">{now.toLocaleTimeString(undefined, { timeStyle: 'short' })}</dd>
                  <dt className="text-muted">Duration</dt>
                  <dd className="text-right font-semibold">{formatDuration(minutes)}</dd>
                  {settings.hourlyRate > 0 && (
                    <>
                      <dt className="text-muted">Amount due</dt>
                      <dd className="text-right text-2xl font-bold text-accent">{formatMoney(fee, settings.currency)}</dd>
                    </>
                  )}
                </dl>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" size={large ? 'lg' : 'md'} onPress={onClose}>
                  Cancel
                </Button>
                <Button variant="danger" size={large ? 'lg' : 'md'} isPending={pending} onPress={confirm}>
                  <ArrowRightStartOnRectangleIcon className="size-5" />
                  Car leaves
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  )
}
