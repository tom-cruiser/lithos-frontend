import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Gem } from 'lucide-react'
import { CanvasErrorBoundary } from '@/components/three/CanvasErrorBoundary'

/* ------------------------------------------------------------------------
 * Tuning constants
 * ---------------------------------------------------------------------- */

const STARDUST_RADIUS = 0.92
const GLASS_SPHERE_RADIUS = 1.05
const CAGE_INNER_RADIUS = 1.4
const CAGE_OUTER_RADIUS = 1.9
const STARDUST_COUNT = 1100

const CAGE_ROTATE_SPEED = 0.05 // rad/s — slow idle spin of the whole cage+sphere assembly
const PARTICLE_ROTATE_SPEED = 0.14 // rad/s — the interior stardust drifts independently, on top of that
const MAX_TILT = 0.22 // rad — how far the assembly leans toward the pointer
const CAMERA_PARALLAX_X = 0.45
const CAMERA_PARALLAX_Y = 0.3
const LERP_FACTOR = 0.08 // same easing coefficient used by the rest of this app's pointer-driven pieces
const BASE_CAMERA_POSITION: [number, number, number] = [0, 0, 6.2]

/* ------------------------------------------------------------------------
 * Shaders
 * ---------------------------------------------------------------------- */

/** Compact hash-based 3D value noise — same technique used by the geology
 * hero's core-sample shader elsewhere in this app: cheaper and far less
 * error-prone to hand-write correctly than full simplex noise, and plenty
 * organic-looking for surface-scale detail like this. */
const noiseGLSL = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float valueNoise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }
`

const glassVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vObjectPosition;
  void main() {
    vObjectPosition = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

/** No lighting relies on real THREE.Light objects (see World3D's doc
 * comment) — this fresnel + fake-specular pair is the sphere's entire
 * shading model, self-contained in the shader. The "bump map reflections"
 * asked for are approximated procedurally: rather than sourcing a droplet
 * texture asset, high-frequency noise perturbs the shading normal directly,
 * producing small flecks of specular sparkle across the surface that read
 * as condensation/droplets without needing an image file. */
const glassFragmentShader = /* glsl */ `
  ${noiseGLSL}
  uniform vec3 uColor;
  uniform vec3 uGlowColor;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying vec3 vObjectPosition;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    float bump = valueNoise(vObjectPosition * 22.0) - 0.5;
    vec3 bumpNormal = normalize(normal + vec3(bump) * 0.7);

    float fresnel = pow(1.0 - max(dot(bumpNormal, viewDir), 0.0), 2.6);
    vec3 fakeLightDir = normalize(vec3(0.3, 0.5, 0.8));
    float specular = pow(max(dot(reflect(-viewDir, bumpNormal), fakeLightDir), 0.0), 28.0);

    vec3 color = uColor;
    color += fresnel * uGlowColor * 0.85;
    color += specular * vec3(1.0);

    float alpha = clamp(0.32 + fresnel * 0.55, 0.0, 0.92);
    gl_FragColor = vec4(color, alpha);
  }
`

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

/** Uniformly-distributed random points *within* a sphere volume (not just on
 * its surface) — direction sampled uniformly on the unit sphere, radius
 * scaled by cube-root of a uniform random so density stays even with volume
 * rather than clustering toward the center. */
function createStardustPositions(count: number, maxRadius: number): Float32Array {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const u = Math.random()
    const v = Math.random()
    const theta = u * Math.PI * 2
    const phi = Math.acos(2 * v - 1)
    const r = maxRadius * Math.cbrt(Math.random())
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  return positions
}

/* ------------------------------------------------------------------------
 * Scene pieces
 * ---------------------------------------------------------------------- */

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

/** The inner glass sphere — fully unlit (see file header), transparent, with
 * a fresnel rim and procedurally-perturbed specular sparkle standing in for
 * a droplet bump map. Rendered `DoubleSide` so its far inner surface is
 * visible too, which is most of what reads as "glass" rather than "disc". */
function GlassSphere() {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color('#0a1018') },
      uGlowColor: { value: new THREE.Color('#38bdf8') },
    }),
    [],
  )
  return (
    <mesh renderOrder={2}>
      <sphereGeometry args={[GLASS_SPHERE_RADIUS, 64, 64]} />
      <shaderMaterial
        vertexShader={glassVertexShader}
        fragmentShader={glassFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

interface StardustParticlesProps {
  reducedMotion: boolean
}

/** A dense point cloud restricted to the sphere's interior — its own slow,
 * independent rotation on top of whatever the parent cage group is doing,
 * so the dust visibly drifts on its own rather than being rigidly locked to
 * the cage's spin. */
function StardustParticles({ reducedMotion }: StardustParticlesProps) {
  const groupRef = useRef<THREE.Group>(null)
  const glowTexture = useGlowTexture()

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(createStardustPositions(STARDUST_COUNT, STARDUST_RADIUS), 3))
    return g
  }, [])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group || reducedMotion) return
    const clampedDelta = Math.min(delta, 1 / 30)
    group.rotation.y += clampedDelta * PARTICLE_ROTATE_SPEED
    group.rotation.x += clampedDelta * PARTICLE_ROTATE_SPEED * 0.4
  })

  return (
    <group ref={groupRef}>
      <points geometry={geometry} renderOrder={1}>
        <pointsMaterial
          map={glowTexture}
          size={0.035}
          color="#dceeff"
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
    </group>
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

/** Orchestrates the whole assembly: pointer-driven camera parallax (moves
 * the camera itself, independent of the object) plus a pointer-driven tilt
 * on the cage+sphere group, layered on top of that group's own continuous
 * idle spin — the same LERP-smoothed-pointer pattern used everywhere else
 * interactive in this app. */
function SceneContent() {
  const assemblyRef = useRef<THREE.Group>(null)
  const smoothedPointer = useRef({ x: 0, y: 0 })
  const tilt = useRef({ x: 0, z: 0 })
  const reducedMotion = usePrefersReducedMotion()

  useFrame((state, delta) => {
    const clampedDelta = Math.min(delta, 1 / 30)
    const { pointer, camera } = state

    smoothedPointer.current.x += (pointer.x - smoothedPointer.current.x) * LERP_FACTOR
    smoothedPointer.current.y += (pointer.y - smoothedPointer.current.y) * LERP_FACTOR

    camera.position.x = BASE_CAMERA_POSITION[0] + smoothedPointer.current.x * CAMERA_PARALLAX_X
    camera.position.y = BASE_CAMERA_POSITION[1] + smoothedPointer.current.y * CAMERA_PARALLAX_Y
    camera.lookAt(0, 0, 0)

    const assembly = assemblyRef.current
    if (assembly) {
      if (!reducedMotion) {
        assembly.rotation.y += clampedDelta * CAGE_ROTATE_SPEED
      }
      const targetTiltX = smoothedPointer.current.y * MAX_TILT
      const targetTiltZ = -smoothedPointer.current.x * MAX_TILT
      tilt.current.x += (targetTiltX - tilt.current.x) * LERP_FACTOR
      tilt.current.z += (targetTiltZ - tilt.current.z) * LERP_FACTOR
      assembly.rotation.x = tilt.current.x
      assembly.rotation.z = tilt.current.z
    }
  })

  return (
    <group ref={assemblyRef}>
      <WireframeCage />
      <GlassSphere />
      <StardustParticles reducedMotion={reducedMotion} />
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
  className?: string
}

export function World3D({ className = '' }: World3DProps) {
  const [webglAvailable] = useState(isWebGL2Available)
  const [contextLost, setContextLost] = useState(false)

  if (!webglAvailable || contextLost) {
    return (
      <div className={className}>
        <SceneFallback />
      </div>
    )
  }

  return (
    <div className={className}>
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
            <SceneContent />
          </Suspense>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  )
}
