import { onAuthStateChanged, type User } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { auth, db } from '../lib/firebase'

export interface AuthState {
  user: User | null
  isAdmin: boolean
  loading: boolean
}

/** Signed-in user and whether their email is on the `admins` allowlist. */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, isAdmin: false, loading: true })

  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        if (!user?.email) {
          setState({ user, isAdmin: false, loading: false })
          return
        }
        setState((s) => ({ ...s, loading: true }))
        let isAdmin = false
        try {
          isAdmin = (await getDoc(doc(db, 'admins', user.email.toLowerCase()))).exists()
        } catch {
          // Permission denied or offline: treat as not an admin.
        }
        setState({ user, isAdmin, loading: false })
      }),
    [],
  )

  return state
}
