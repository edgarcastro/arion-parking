import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline'
import { Button } from '@heroui/react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { LotScreen } from '../components/LotScreen'
import { useNow } from '../hooks/useNow'

const EXIT_HOLD_MS = 2000

/** Fullscreen, touch-first version of the lot for a device at the entrance. */
export function KioskPage() {
  const navigate = useNavigate()
  const now = useNow(1000)
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement))
  const holdTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // Keep the screen awake while the kiosk is open (where supported).
  useEffect(() => {
    let lock: WakeLockSentinel | undefined
    const request = () =>
      navigator.wakeLock
        ?.request('screen')
        .then((l) => (lock = l))
        .catch(() => {})
    request()
    const onVisible = () => document.visibilityState === 'visible' && request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release().catch(() => {})
    }
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else document.documentElement.requestFullscreen().catch(() => {})
  }

  // Hidden exit: press and hold the clock for 2 seconds.
  const startHold = () => {
    holdTimer.current = setTimeout(() => {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
      navigate('/')
    }, EXIT_HOLD_MS)
  }
  const cancelHold = () => clearTimeout(holdTimer.current)

  return (
    <main className="kiosk mx-auto flex min-h-dvh w-full max-w-[1600px] flex-col px-4 py-4 select-none sm:px-8 sm:py-6">
      <LotScreen
        kiosk
        header={(stats) => (
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div
              className="cursor-default"
              onPointerDown={startHold}
              onPointerUp={cancelHold}
              onPointerLeave={cancelHold}
              onContextMenu={(e) => e.preventDefault()}
            >
              <div className="text-3xl font-black tracking-tight sm:text-4xl">Arion Parking</div>
              <div className="text-xl text-muted tabular-nums">
                {now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {stats}
            <Button variant="tertiary" size="lg" isIconOnly aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} onPress={toggleFullscreen}>
              {isFullscreen ? <ArrowsPointingInIcon className="size-6" /> : <ArrowsPointingOutIcon className="size-6" />}
            </Button>
          </header>
        )}
      />
    </main>
  )
}
