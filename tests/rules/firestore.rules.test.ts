import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, serverTimestamp, setDoc, writeBatch, type Firestore } from 'firebase/firestore'
import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'arion-parking-rules-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(() => env.cleanup())

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = modular(ctx.firestore())
    await setDoc(doc(db, 'settings/lot'), { capacity: 3, hourlyRate: 2, currency: 'USD', graceMinutes: 0 })
    await setDoc(doc(db, 'admins/boss@example.com'), {})
  })
})

// The test contexts return the compat type; the modular API accepts it at runtime.
const modular = (db: unknown) => db as Firestore
const publicDb = () => modular(env.unauthenticatedContext().firestore())
const adminDb = () => modular(env.authenticatedContext('admin', { email: 'Boss@example.com' }).firestore())
const userDb = () => modular(env.authenticatedContext('user', { email: 'someone@example.com' }).firestore())

function park(db: Firestore, plate: string, spot: number, sessionId = `s-${plate}`) {
  const batch = writeBatch(db)
  batch.set(doc(db, 'activeSpots', String(spot)), { plate, sessionId, entryAt: serverTimestamp() })
  batch.set(doc(db, 'activePlates', plate), { spot, sessionId })
  batch.set(doc(db, 'sessions', sessionId), {
    plate,
    spot,
    entryAt: serverTimestamp(),
    exitAt: null,
    durationMinutes: null,
    fee: null,
    currency: null,
    status: 'parked',
  })
  return batch.commit()
}

function leave(db: Firestore, plate: string, spot: number, sessionId = `s-${plate}`) {
  const batch = writeBatch(db)
  batch.delete(doc(db, 'activeSpots', String(spot)))
  batch.delete(doc(db, 'activePlates', plate))
  batch.update(doc(db, 'sessions', sessionId), {
    status: 'left',
    exitAt: serverTimestamp(),
    durationMinutes: 42,
    fee: 2,
    currency: 'USD',
  })
  return batch.commit()
}

describe('parking', () => {
  it('lets anyone park a car', async () => {
    await assertSucceeds(park(publicDb(), 'ABC123', 1))
  })

  it('rejects a spot beyond the capacity', async () => {
    await assertFails(park(publicDb(), 'ABC123', 4))
  })

  it('rejects a second car in the same spot', async () => {
    await park(publicDb(), 'ABC123', 1)
    await assertFails(park(publicDb(), 'XYZ999', 1))
  })

  it('rejects the same plate twice', async () => {
    await park(publicDb(), 'ABC123', 1)
    await assertFails(park(publicDb(), 'ABC123', 2, 's-other'))
  })

  it('rejects plates that are not 3 letters followed by 3 numbers', async () => {
    await assertFails(park(publicDb(), 'abc-1', 1))
    await assertFails(park(publicDb(), 'AB1234', 1))
    await assertFails(park(publicDb(), '123ABC', 1))
  })

  it('rejects a spot without the matching plate and session', async () => {
    const db = publicDb()
    await assertFails(setDoc(doc(db, 'activeSpots/1'), { plate: 'ABC123', sessionId: 's1', entryAt: serverTimestamp() }))
  })
})

describe('leaving', () => {
  beforeEach(async () => {
    await park(publicDb(), 'ABC123', 1)
  })

  it('lets anyone check a car out', async () => {
    await assertSucceeds(leave(publicDb(), 'ABC123', 1))
  })

  it('rejects freeing a spot without closing the session', async () => {
    const db = publicDb()
    const batch = writeBatch(db)
    batch.delete(doc(db, 'activeSpots/1'))
    batch.delete(doc(db, 'activePlates/ABC123'))
    await assertFails(batch.commit())
  })

  it('hides finished sessions from the public', async () => {
    await leave(publicDb(), 'ABC123', 1)
    await assertFails(getDoc(doc(publicDb(), 'sessions/s-ABC123')))
    await assertSucceeds(getDoc(doc(adminDb(), 'sessions/s-ABC123')))
  })
})

describe('settings', () => {
  const settings = { capacity: 25, hourlyRate: 3, currency: 'USD', graceMinutes: 5, updatedBy: 'x', updatedAt: serverTimestamp() }

  it('can be read by anyone', async () => {
    await assertSucceeds(getDoc(doc(publicDb(), 'settings/lot')))
  })

  it('cannot be changed by the public or by non-admins', async () => {
    await assertFails(setDoc(doc(publicDb(), 'settings/lot'), settings))
    await assertFails(setDoc(doc(userDb(), 'settings/lot'), settings))
  })

  it('can be changed by an allowlisted admin', async () => {
    await assertSucceeds(setDoc(doc(adminDb(), 'settings/lot'), settings))
  })

  it('rejects invalid values', async () => {
    await assertFails(setDoc(doc(adminDb(), 'settings/lot'), { ...settings, capacity: 0 }))
    await assertFails(setDoc(doc(adminDb(), 'settings/lot'), { ...settings, hourlyRate: -1 }))
  })
})

describe('admins', () => {
  it('lets a user read only their own allowlist entry', async () => {
    await assertSucceeds(getDoc(doc(adminDb(), 'admins/boss@example.com')))
    await assertFails(getDoc(doc(userDb(), 'admins/boss@example.com')))
  })

  it('cannot be written from the client', async () => {
    await assertFails(setDoc(doc(userDb(), 'admins/someone@example.com'), {}))
  })
})
