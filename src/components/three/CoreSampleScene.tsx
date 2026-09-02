import { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { CoreSample } from './CoreSample'
import { CanvasErrorBoundary } from './CanvasErrorBoundary'
import { WebGLUnavailable } from './WebGLUnavailable'

function isWebGL2Available(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!canvas.getContext('webgl2')
  } catch {
    return false
  }
}

function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (event: MediaQueryListEvent) => setPrefersReduced(event.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return prefersReduced
}

interface CoreSampleSceneProps {
  className?: string
}

/**
 * Full-screen wrapper around the interactive geological core sample: WebGL
 * capability check up front, an error boundary around the actual R3F tree
 * (shader compile failures / lost contexts throw synchronously during
 * render), and a `prefers-reduced-motion` read passed down to the mesh so it
 * can settle into a static pose instead of spinning indefinitely.
 */
export function CoreSampleScene({ className = '' }: CoreSampleSceneProps) {
  const [webglAvailable] = useState(isWebGL2Available)
  const [contextLost, setContextLost] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  if (!webglAvailable || contextLost) {
    return (
      <div className={className}>
        <WebGLUnavailable />
      </div>
    )
  }

  return (
    <div className={className}>
      <CanvasErrorBoundary fallback={<WebGLUnavailable />}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 0, 6], fov: 35 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', (event) => {
              event.preventDefault()
              setContextLost(true)
            })
          }}
        >
          <fog attach="fog" args={['#0a0a0a', 6, 12]} />
          <Suspense fallback={null}>
            <CoreSample reducedMotion={prefersReducedMotion} />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  )
}
