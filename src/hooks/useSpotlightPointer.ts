import { useEffect, useRef, useState, type RefObject } from 'react'

/** Easing coefficient for the pointer LERP — lower = heavier/more fluid. */
const LERP_FACTOR = 0.08

/**
 * Squared-distance (normalized 0-1 container space) below which the rAF loop
 * stops scheduling further frames. Small enough that the final "snap" to the
 * exact target is sub-pixel on any realistic hero size, but large enough to
 * cut the exponential decay's long idle tail instead of animating forever.
 */
const IDLE_EPSILON = 4e-6

interface Point {
  x: number
  y: number
}

interface UseSpotlightPointerResult<T extends HTMLElement> {
  /** Attach to the element whose `--spotlight-x` / `--spotlight-y` should track the pointer. */
  containerRef: RefObject<T>
  /** False until the user's first mouse/touch move over the container — drives the static fallback spotlight. */
  hasInteracted: boolean
  /** True while a mouse button or touch point is down — lets callers add a "focus" flourish. */
  isPressed: boolean
}

/**
 * Tracks pointer position (mouse + touch) relative to a container element and
 * smooths it with linear interpolation before writing it to the DOM.
 *
 * Deliberately bypasses React state for the 60fps path: the eased position is
 * written directly onto the container's `style` via `setProperty` inside a
 * `requestAnimationFrame` loop, so no component re-renders while the pointer
 * moves and no canvas/`toDataURL` work happens per frame — CSS `mask-image`
 * driven by these custom properties does the compositing on the GPU. Only two
 * one-off flags (`hasInteracted`, `isPressed`) are ever pushed through React
 * state, and each changes at most a handful of times per session.
 */
export function useSpotlightPointer<T extends HTMLElement>(): UseSpotlightPointerResult<T> {
  const containerRef = useRef<T>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const target: Point = { x: 0.5, y: 0.5 }
    const current: Point = { x: 0.5, y: 0.5 }
    let rafId: number | null = null
    let interacted = false

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reducedMotion = media.matches
    const handleMediaChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches
    }
    media.addEventListener('change', handleMediaChange)

    const applyPosition = (x: number, y: number) => {
      node.style.setProperty('--spotlight-x', `${(x * 100).toFixed(3)}%`)
      node.style.setProperty('--spotlight-y', `${(y * 100).toFixed(3)}%`)
    }

    // Centered, static spotlight until the first real interaction.
    applyPosition(target.x, target.y)

    const tick = () => {
      current.x += (target.x - current.x) * LERP_FACTOR
      current.y += (target.y - current.y) * LERP_FACTOR
      applyPosition(current.x, current.y)

      const dx = target.x - current.x
      const dy = target.y - current.y
      if (dx * dx + dy * dy > IDLE_EPSILON) {
        rafId = requestAnimationFrame(tick)
      } else {
        current.x = target.x
        current.y = target.y
        applyPosition(current.x, current.y)
        rafId = null
      }
    }

    const scheduleFrame = () => {
      if (rafId === null) {
        rafId = requestAnimationFrame(tick)
      }
    }

    const setTargetFromClient = (clientX: number, clientY: number) => {
      const rect = node.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return

      const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height))
      target.x = x
      target.y = y

      if (!interacted) {
        interacted = true
        setHasInteracted(true)
        // Snap instantly on first contact rather than gliding in from center.
        current.x = x
        current.y = y
        applyPosition(x, y)
      }

      if (reducedMotion) {
        current.x = x
        current.y = y
        applyPosition(x, y)
      } else {
        scheduleFrame()
      }
    }

    const handleMouseMove = (event: MouseEvent) => {
      setTargetFromClient(event.clientX, event.clientY)
    }

    const handleTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch) return
      setTargetFromClient(touch.clientX, touch.clientY)
    }

    const handleLeave = () => {
      // Ease back to a resting, centered glow instead of freezing off to one side.
      target.x = 0.5
      target.y = 0.5
      if (reducedMotion) {
        current.x = 0.5
        current.y = 0.5
        applyPosition(0.5, 0.5)
      } else {
        scheduleFrame()
      }
    }

    const handlePressStart = () => setIsPressed(true)
    const handlePressEnd = () => setIsPressed(false)

    node.addEventListener('mousemove', handleMouseMove)
    node.addEventListener('touchmove', handleTouchMove, { passive: true })
    node.addEventListener('touchstart', handleTouchMove, { passive: true })
    node.addEventListener('mouseleave', handleLeave)
    node.addEventListener('touchend', handleLeave)
    node.addEventListener('mousedown', handlePressStart)
    node.addEventListener('mouseup', handlePressEnd)
    node.addEventListener('touchstart', handlePressStart, { passive: true })
    node.addEventListener('touchend', handlePressEnd)

    return () => {
      media.removeEventListener('change', handleMediaChange)
      node.removeEventListener('mousemove', handleMouseMove)
      node.removeEventListener('touchmove', handleTouchMove)
      node.removeEventListener('touchstart', handleTouchMove)
      node.removeEventListener('mouseleave', handleLeave)
      node.removeEventListener('touchend', handleLeave)
      node.removeEventListener('mousedown', handlePressStart)
      node.removeEventListener('mouseup', handlePressEnd)
      node.removeEventListener('touchstart', handlePressStart)
      node.removeEventListener('touchend', handlePressEnd)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  return { containerRef, hasInteracted, isPressed }
}
