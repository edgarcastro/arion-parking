import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ParkedCar } from '../../lib/types'
import { ParkingLot } from './ParkingLot'

class ResizeObserverStub {
  observe() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

const car: ParkedCar = { spot: 3, plate: 'ABC123', sessionId: 's1', entryAt: new Date() }

describe('ParkingLot', () => {
  it('renders every spot and the parked car', () => {
    render(<ParkingLot capacity={20} carsBySpot={new Map([[3, car]])} onSelectCar={() => {}} />)
    expect(screen.getAllByRole('gridcell')).toHaveLength(20)
    expect(screen.getByRole('button', { name: /ABC123 in spot 3/ })).toBeInTheDocument()
    expect(screen.getAllByLabelText(/free$/)).toHaveLength(19)
  })

  it('selects a car when it is clicked', () => {
    const onSelectCar = vi.fn()
    render(<ParkingLot capacity={5} carsBySpot={new Map([[3, car]])} onSelectCar={onSelectCar} />)
    fireEvent.click(screen.getByRole('button', { name: /ABC123/ }))
    expect(onSelectCar).toHaveBeenCalledWith(car)
  })
})
