import { describe, expect, it } from 'vitest'
import { computeDurationMinutes, computeFee, formatDuration } from './fees'

describe('computeDurationMinutes', () => {
  it('counts whole minutes and never goes negative', () => {
    const entry = new Date('2026-01-01T10:00:00Z')
    expect(computeDurationMinutes(entry, new Date('2026-01-01T11:30:59Z'))).toBe(90)
    expect(computeDurationMinutes(entry, new Date('2026-01-01T09:00:00Z'))).toBe(0)
  })
})

describe('computeFee', () => {
  const settings = { hourlyRate: 2.5, graceMinutes: 10 }

  it('is free within the grace period', () => {
    expect(computeFee(10, settings)).toBe(0)
  })

  it('charges every started hour', () => {
    expect(computeFee(11, settings)).toBe(2.5)
    expect(computeFee(60, settings)).toBe(2.5)
    expect(computeFee(61, settings)).toBe(5)
  })

  it('is free when the rate is zero', () => {
    expect(computeFee(500, { hourlyRate: 0, graceMinutes: 0 })).toBe(0)
  })

  it('charges the first hour even for an instant stay when there is no grace', () => {
    expect(computeFee(0, { hourlyRate: 3, graceMinutes: 0 })).toBe(0)
    expect(computeFee(1, { hourlyRate: 3, graceMinutes: 0 })).toBe(3)
  })
})

describe('formatDuration', () => {
  it('formats minutes and hours', () => {
    expect(formatDuration(5)).toBe('5m')
    expect(formatDuration(125)).toBe('2h 05m')
  })
})
