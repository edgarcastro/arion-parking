/** Three letters followed by three numbers, e.g. ABC123. */
export const PLATE_PATTERN = /^[A-Z]{3}[0-9]{3}$/
export const PLATE_LENGTH = 6
export const PLATE_FORMAT_HINT = 'Use 3 letters followed by 3 numbers, e.g. ABC123.'

/** Uppercases and strips spaces, dashes and any other separator. */
export function normalizePlate(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function isValidPlate(plate: string): boolean {
  return PLATE_PATTERN.test(plate)
}
