import { useEffect, useRef, useState, useCallback } from 'react'

const TIMEOUT_MS = 10 * 60 * 1000   // 10 minutes total
const WARNING_MS = 60 * 1000         // show warning at 1 minute remaining

const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
] as const

interface UseInactivityTimeoutOptions {
  enabled: boolean
  onTimeout: () => void
}

interface UseInactivityTimeoutResult {
  showWarning: boolean
  secondsRemaining: number
  resetTimer: () => void
}

export function useInactivityTimeout({
  enabled,
  onTimeout,
}: UseInactivityTimeoutOptions): UseInactivityTimeoutResult {
  const lastActivityRef = useRef<number>(Date.now())
  const onTimeoutRef = useRef(onTimeout)
  const [showWarning, setShowWarning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(60)

  // Keep callback ref current so the interval closure doesn't go stale
  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now()
    setShowWarning(false)
    setSecondsRemaining(60)
  }, [])

  useEffect(() => {
    if (!enabled) return

    const handleActivity = () => {
      // Only reset if the warning isn't yet showing — once the warning
      // appears the user must explicitly click "Stay logged in".
      if (!showWarning) {
        lastActivityRef.current = Date.now()
      }
    }

    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleActivity, { passive: true })
    )

    const interval = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current
      const remaining = TIMEOUT_MS - idle

      if (remaining <= 0) {
        clearInterval(interval)
        setShowWarning(false)
        onTimeoutRef.current()
        return
      }

      if (remaining <= WARNING_MS) {
        setShowWarning(true)
        setSecondsRemaining(Math.ceil(remaining / 1000))
      }
    }, 1000)

    return () => {
      ACTIVITY_EVENTS.forEach((event) =>
        window.removeEventListener(event, handleActivity)
      )
      clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return { showWarning, secondsRemaining, resetTimer }
}
