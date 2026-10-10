import { describe, expect, it } from 'vitest'
import { isValidPlate, normalizePlate } from './plate'

describe('normalizePlate', () => {
  it('uppercases and strips separators', () => {
    expect(normalizePlate(' abc-12 3 ')).toBe('ABC123')
    expect(normalizePlate('xy.z·9/8')).toBe('XYZ98')
  })
})

describe('isValidPlate', () => {
  it.each(['ABC123', 'XYZ999', 'AAA000'])('accepts %s', (p) => expect(isValidPlate(p)).toBe(true))
  it.each(['', 'ABC12', 'ABC1234', 'AB1234', '123ABC', 'A1B2C3', 'ABCD12', 'abc123', 'AB-123'])('rejects %s', (p) =>
    expect(isValidPlate(p)).toBe(false),
  )
})
