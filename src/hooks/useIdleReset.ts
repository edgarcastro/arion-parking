import { useEffect, useRef } from 'react'

const EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const

/** Calls `onIdle` after `timeoutMs` without user interaction. */
export function useIdleReset(onIdle: () => void, timeoutMs = 60_000): void {
  const callback = useRef(onIdle)
  useEffect(() => {
    callback.current = onIdle
  }, [onIdle])

  useEffect(() => {
    let timer = setTimeout(() => callback.current(), timeoutMs)
    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(() => callback.current(), timeoutMs)
    }
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    return () => {
      clearTimeout(timer)
      EVENTS.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [timeoutMs])
}
