import { describe, expect, it } from 'vitest'
import { carColor, findFirstFreeSpot, freeSpots, highestOccupiedSpot, pickRandomFreeSpot } from './spots'

describe('spots', () => {
  it('finds the lowest free spot', () => {
    expect(findFirstFreeSpot([], 20)).toBe(1)
    expect(findFirstFreeSpot([1, 2, 4], 20)).toBe(3)
  })

  it('returns null when the lot is full', () => {
    expect(findFirstFreeSpot([1, 2, 3], 3)).toBeNull()
  })

  it('ignores cars beyond the capacity', () => {
    expect(freeSpots([1, 5], 3)).toEqual([2, 3])
  })

  it('reports the highest occupied spot', () => {
    expect(highestOccupiedSpot([])).toBe(0)
    expect(highestOccupiedSpot([3, 17, 9])).toBe(17)
  })

  it('picks a random free spot only from the free ones', () => {
    expect(pickRandomFreeSpot([1, 3], 4, () => 0)).toBe(2)
    expect(pickRandomFreeSpot([1, 3], 4, () => 0.99)).toBe(4)
    expect(pickRandomFreeSpot([1, 2], 2)).toBeNull()
    for (let i = 0; i < 50; i++) expect([2, 4]).toContain(pickRandomFreeSpot([1, 3], 4))
  })

  it('gives a plate a stable color', () => {
    expect(carColor('ABC123')).toBe(carColor('ABC123'))
  })
})
