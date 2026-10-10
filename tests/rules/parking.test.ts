import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { exitCar, ParkingError, parkCar } from '../../src/lib/parking'

// Runs the app's real transactions, unauthenticated like the kiosk, against the rules.
let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'arion-parking-rules-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(() => env.cleanup())
beforeEach(() => env.clearFirestore())

const code = (p: Promise<unknown>) => p.then(() => null, (e) => (e instanceof ParkingError ? e.code : e))

describe('parkCar / exitCar', () => {
  it('parks in a free spot within capacity and checks out', async () => {
    const first = await parkCar('abc-123', [])
    expect(first.plate).toBe('ABC123')
    expect(first.spot).toBeGreaterThanOrEqual(1)
    expect(first.spot).toBeLessThanOrEqual(20)

    const second = await parkCar('XYZ999', [first.spot])
    expect(second.spot).not.toBe(first.spot)

    const result = await exitCar(first.spot)
    expect(result).toMatchObject({ plate: 'ABC123', spot: first.spot, durationMinutes: 0, fee: 0 })
  })

  it('recovers when the occupied hint is stale', async () => {
    const first = await parkCar('ABC123', [])
    const second = await parkCar('XYZ999', [])
    expect(second.spot).not.toBe(first.spot)
  })

  it('rejects duplicates, invalid plates and freeing an empty spot', async () => {
    await parkCar('ABC123', [])
    expect(await code(parkCar('ABC123', [1]))).toBe('ALREADY_PARKED')
    expect(await code(parkCar('A1', [1]))).toBe('INVALID_PLATE')
    expect(await code(parkCar('1234AB', [1]))).toBe('INVALID_PLATE')
    expect(await code(exitCar(5))).toBe('NOT_FOUND')
  })

  it('reports a full lot once the 20 default spots are taken', async () => {
    const occupied: number[] = []
    for (let i = 0; i < 20; i++) {
      const { spot } = await parkCar(`CAR${String(i).padStart(3, '0')}`, occupied)
      occupied.push(spot)
    }
    expect(await code(parkCar('LST001', occupied))).toBe('LOT_FULL')
  })
})
