import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { Gem } from 'lucide-react'
import { CanvasErrorBoundary } from '@/components/three/CanvasErrorBoundary'

/* ------------------------------------------------------------------------
 * Tuning constants
 * ---------------------------------------------------------------------- */

const GLASS_SPHERE_RADIUS = 1.05
const CAGE_INNER_RADIUS = 1.4
const CAGE_OUTER_RADIUS = 1.9

const CAGE_ROTATE_SPEED = 0.05 // rad/s — slow idle spin of the whole cage+sphere assembly
const MAX_TILT = 0.22 // rad — how far the assembly leans toward the pointer
const CAMERA_PARALLAX_X = 0.45
const CAMERA_PARALLAX_Y = 0.3
const LERP_FACTOR = 0.08 // same easing coefficient used by the rest of this app's pointer-driven pieces
const BASE_CAMERA_POSITION: [number, number, number] = [0, 0, 6.2]

// Hover response — this app's baseline pointer parallax runs everywhere the
// cursor is on screen (see SceneContent's use of state.pointer below), so on
// its own the scene never visibly distinguishes "the pointer happens to be
// somewhere on the page" from "someone is actually engaging with it." These
// four scale that same tilt/spin/scale behavior up while the pointer is
// physically over the canvas, eased through hoverIntensity rather than
// snapped, so the assembly reads as waking up rather than jump-cutting.
const HOVER_LERP = 0.06 // slower than LERP_FACTOR on purpose — the wake-up/settle itself should feel gradual
const HOVER_TILT_MULTIPLIER = 1.7 // tilt swings this much further at full hover
const HOVER_ROTATE_MULTIPLIER = 2.2 // idle spin speeds up by this much at full hover
const HOVER_SCALE_BOOST = 0.07 // extra uniform scale at full hover (1.0 -> 1.07)

/* ------------------------------------------------------------------------
 * Shaders
 * ---------------------------------------------------------------------- */

/* ------------------------------------------------------------------------
 * A soft circular sprite for points — Points render as hard squares without
 * a texture; this is generated procedurally on an offscreen canvas (a
 * classic, dependency-free technique) rather than sourced as an image asset.
 * ---------------------------------------------------------------------- */

function createGlowSpriteTexture(): THREE.Texture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.65)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function useGlowTexture(): THREE.Texture {
  return useMemo(() => createGlowSpriteTexture(), [])
}

/** The dual-layer icosahedron lattice: a denser, subdivided outer cage and a
 * crisp, unsubdivided inner one, each rendered as real `THREE.LineSegments`
 * (not a wireframe-mode mesh material) with additive-blended glowing white
 * lines, plus bright point-sprites at every vertex of both layers. */
function WireframeCage() {
  const glowTexture = useGlowTexture()

  const outerLines = useMemo(() => {
    const base = new THREE.IcosahedronGeometry(CAGE_OUTER_RADIUS, 1)
    return new THREE.WireframeGeometry(base)
  }, [])
  const innerLines = useMemo(() => {
    const base = new THREE.IcosahedronGeometry(CAGE_INNER_RADIUS, 0)
    return new THREE.EdgesGeometry(base)
  }, [])
  const outerVertices = useMemo(() => new THREE.IcosahedronGeometry(CAGE_OUTER_RADIUS, 0), [])
  const innerVertices = useMemo(() => new THREE.IcosahedronGeometry(CAGE_INNER_RADIUS, 0), [])

  return (
    <group>
      <lineSegments geometry={outerLines} renderOrder={3}>
        <lineBasicMaterial color="#bfe4ff" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <lineSegments geometry={innerLines} renderOrder={3}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.65} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
      <points geometry={outerVertices} renderOrder={4}>
        <pointsMaterial
          map={glowTexture}
          size={0.13}
          color="#ffffff"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <points geometry={innerVertices} renderOrder={4}>
        <pointsMaterial
          map={glowTexture}
          size={0.1}
          color="#d6f0ff"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

// global.jpeg is a 736x920 photo of a globe on a pale backdrop, not a
// map, so it can't be wrapped by UVs. Instead each point on a real 3D sphere
// looks up the photo by inverting an orthographic projection (x/y of the
// point -> pixel inside the globe's disc). The far hemisphere reuses the same
// pixels mirrored, so the sphere has no blank side while it turns.
const GLOBE_IMAGE = { width: 736, height: 920, cx: 370, cy: 447, radius: 272 }

const globeVertexShader = /* glsl */ `
  varying vec3 vObjectPosition;
  void main() {
    vObjectPosition = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const globeFragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uImageSize;
  uniform vec2 uCenter;
  uniform float uRadius;
  varying vec3 vObjectPosition;

  void main() {
    // 0.97 keeps lookups off the photo's pale limb/backdrop.
    vec2 px = uCenter + vec2(vObjectPosition.x, -vObjectPosition.y) * uRadius * 0.97;
    vec3 color = texture2D(uMap, px / uImageSize).rgb;
    // Darken the mirrored far side slightly so it reads as turning away.
    color *= vObjectPosition.z >= 0.0 ? 1.0 : 0.8;
    gl_FragColor = vec4(color, 1.0);
  }
`

/** The globe: a real sphere textured from global.jpeg. Lives inside the
 * cage's group so it turns at exactly the cage's rate. */
function GlobeSphere() {
  const map = useLoader(THREE.TextureLoader, '/global.jpeg')
  map.colorSpace = THREE.SRGBColorSpace
  const uniforms = useMemo(
    () => ({
      uMap: { value: map },
      uImageSize: { value: new THREE.Vector2(GLOBE_IMAGE.width, GLOBE_IMAGE.height) },
      uCenter: { value: new THREE.Vector2(GLOBE_IMAGE.cx, GLOBE_IMAGE.cy) },
      uRadius: { value: GLOBE_IMAGE.radius },
    }),
    [map],
  )
  return (
    <mesh>
      <sphereGeometry args={[GLASS_SPHERE_RADIUS, 96, 96]} />
      <shaderMaterial vertexShader={globeVertexShader} fragmentShader={globeFragmentShader} uniforms={uniforms} />
    </mesh>
  )
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

interface SceneContentProps {
  /** Whether the pointer is currently over the canvas — a plain mutable ref,
   * not state, since it's written from a DOM pointerenter/pointerleave
   * handler in the parent and only ever read inside this component's own
   * useFrame loop. Routing that through React state would re-render this
   * (and every ancestor down to it) on every hover edge for no benefit. */
  isHoveredRef: RefObject<boolean>
}

/** Orchestrates the whole assembly: pointer-driven camera parallax (moves
 * the camera itself, independent of the object) plus a pointer-driven tilt
 * on the cage+sphere group, layered on top of that group's own continuous
 * idle spin — the same LERP-smoothed-pointer pattern used everywhere else
 * interactive in this app. On top of that baseline (which runs off pointer
 * position anywhere on screen), hoverIntensity eases toward 1 while the
 * pointer is actually over the canvas and scales the tilt/spin/size of the
 * same motion up, so the object visibly wakes up for someone actively
 * engaging with it rather than just leaning gently at whatever ambient
 * pointer position happens to be on screen. */
function SceneContent({ isHoveredRef }: SceneContentProps) {
  const assemblyRef = useRef<THREE.Group>(null)
  const smoothedPointer = useRef({ x: 0, y: 0 })
  const tilt = useRef({ x: 0, z: 0 })
  const hoverIntensity = useRef(0)
  const reducedMotion = usePrefersReducedMotion()

  useFrame((state, delta) => {
    const clampedDelta = Math.min(delta, 1 / 30)
    const { pointer, camera } = state

    smoothedPointer.current.x += (pointer.x - smoothedPointer.current.x) * LERP_FACTOR
    smoothedPointer.current.y += (pointer.y - smoothedPointer.current.y) * LERP_FACTOR

    // Reduced-motion users get none of the hover boost — the ambient
    // tilt/parallax above was already this component's behavior before this
    // change and is left as-is, but the *new* motion this adds shouldn't
    // amplify things for anyone who's opted out.
    const hoverTarget = !reducedMotion && isHoveredRef.current ? 1 : 0
    hoverIntensity.current += (hoverTarget - hoverIntensity.current) * HOVER_LERP

    camera.position.x = BASE_CAMERA_POSITION[0] + smoothedPointer.current.x * CAMERA_PARALLAX_X
    camera.position.y = BASE_CAMERA_POSITION[1] + smoothedPointer.current.y * CAMERA_PARALLAX_Y
    camera.lookAt(0, 0, 0)

    const assembly = assemblyRef.current
    if (assembly) {
      if (!reducedMotion) {
        const rotateSpeed = CAGE_ROTATE_SPEED * (1 + hoverIntensity.current * (HOVER_ROTATE_MULTIPLIER - 1))
        assembly.rotation.y += clampedDelta * rotateSpeed
      }

      const tiltRange = MAX_TILT * (1 + hoverIntensity.current * (HOVER_TILT_MULTIPLIER - 1))
      const targetTiltX = smoothedPointer.current.y * tiltRange
      const targetTiltZ = -smoothedPointer.current.x * tiltRange
      tilt.current.x += (targetTiltX - tilt.current.x) * LERP_FACTOR
      tilt.current.z += (targetTiltZ - tilt.current.z) * LERP_FACTOR
      assembly.rotation.x = tilt.current.x
      assembly.rotation.z = tilt.current.z

      assembly.scale.setScalar(1 + hoverIntensity.current * HOVER_SCALE_BOOST)
    }
  })

  return (
    <group ref={assemblyRef}>
      <WireframeCage />
      <GlobeSphere />
    </group>
  )
}

/* ------------------------------------------------------------------------
 * WebGL availability
 * ---------------------------------------------------------------------- */

function isWebGL2Available(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  } catch {
    return false
  }
}

function SceneFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_45%,#0f1a24_0%,#0a1420_55%,#050709_100%)]">
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <Gem className="h-8 w-8 text-white/70" strokeWidth={1.25} />
        <p className="max-w-[14rem] text-center text-xs leading-relaxed text-white/60">
          3D preview unavailable in this browser.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------
 * Public component
 *
 * No part of this scene is lit by a real THREE.Light: the cage's lines and
 * vertex points use unlit, additively-blended materials, and the glass
 * sphere is a fully custom shader with its own baked-in fresnel/specular
 * model. Brightness comes entirely from those glowing elements themselves,
 * as asked for, rather than from illuminating otherwise-dark materials.
 * ---------------------------------------------------------------------- */

interface World3DProps {
  /** Extra classes merged onto the base container (e.g. an entrance
   * animation) — never a replacement for it, see containerClassName below. */
  className?: string
}

export function World3D({ className = '' }: World3DProps) {
  const [webglAvailable] = useState(isWebGL2Available)
  const [contextLost, setContextLost] = useState(false)
  // Plain ref, not state: written from DOM pointer events below and only
  // ever read inside SceneContent's useFrame loop, so it never needs to
  // trigger a React re-render — see SceneContentProps' comment for why.
  const isHoveredRef = useRef(false)

  // Baked into the component rather than left for callers to remember:
  // fills its positioned ancestor exactly and stays interactive even if a
  // future caller wraps it in a pointer-events-none layer for unrelated
  // foreground UI (pointer-events set directly on an element always wins
  // over an inherited value from an ancestor, regardless of that ancestor's
  // specificity — see the pointer-events writeups elsewhere in this app).
  const containerClassName = `w-full h-full absolute inset-0 pointer-events-auto ${className}`

  if (!webglAvailable || contextLost) {
    return (
      <div className={containerClassName}>
        <SceneFallback />
      </div>
    )
  }

  return (
    <div
      className={containerClassName}
      onPointerEnter={() => {
        isHoveredRef.current = true
      }}
      onPointerLeave={() => {
        isHoveredRef.current = false
      }}
    >
      <CanvasErrorBoundary fallback={<SceneFallback />}>
        <Canvas
          dpr={[1, 2]}
          camera={{ position: BASE_CAMERA_POSITION, fov: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          onCreated={({ gl }) => {
            gl.domElement.addEventListener('webglcontextlost', (event) => {
              event.preventDefault()
              setContextLost(true)
            })
          }}
        >
          <Suspense fallback={null}>
            <SceneContent isHoveredRef={isHoveredRef} />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  )
}
