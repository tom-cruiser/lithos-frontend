import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { coreSampleFragmentShader, coreSampleVertexShader } from './coreSampleShaders'

// Sized so the cylinder fills a little less than the vertical frustum at the
// default camera distance — leaves breathing room top/bottom instead of
// hard-cropping the caps against the viewport edges.
const CORE_HEIGHT = 3.2
const CORE_RADIUS = 0.8
const LERP_FACTOR = 0.08
const AUTO_ROTATE_SPEED = 0.12
const MAX_TILT = 0.35
const IDLE_TIMEOUT = 1.4
const MOVE_EPSILON = 0.0008

// Brand palette (mirrors the Tailwind tokens in index.css) as linear-ish RGB
// for the shader — kept in one place so the 3D piece and the rest of the
// page read as the same material system. uColorLow is deliberately lifted
// well above the page's near-black #0a0a0a background — the original, much
// darker value read as literally invisible against the hero's ink backdrop
// on any face angled away from the key light.
const COLOR_LOW = new THREE.Color('#4a372c')
const COLOR_MID = new THREE.Color('#bd5f42')
const COLOR_HIGH = new THREE.Color('#cfc6bb')
const COLOR_GLOW = new THREE.Color('#e8a688')

interface CoreSampleProps {
  reducedMotion: boolean
}

export function CoreSample({ reducedMotion }: CoreSampleProps) {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const smoothedPointer = useRef({ x: 0, y: 0 })
  const tilt = useRef({ x: 0, z: 0 })
  const pointerStrength = useRef(0)
  const lastPointer = useRef({ x: 0, y: 0 })
  const idleTimer = useRef(0)

  const geometry = useMemo(
    () => new THREE.CylinderGeometry(CORE_RADIUS, CORE_RADIUS * 0.94, CORE_HEIGHT, 96, 160),
    [],
  )

  // Deliberately a one-time useMemo with no dependency on canvas size:
  // recreating this object on every resize would hand the material a
  // brand-new uniforms object to reconcile every frame while dragging a
  // window edge. uAspect starts at a neutral placeholder and is corrected
  // from the real canvas size inside useFrame below (before anything is
  // ever presented, so there's no visible wrong-aspect flash) — cheap (one
  // division) and avoids that churn entirely.
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPointerStrength: { value: 0 },
      uAspect: { value: 1 },
      uBaseAmplitude: { value: 0.045 },
      uPointerAmplitude: { value: 0.22 },
      uInfluenceRadius: { value: 0.85 },
      uColorLow: { value: COLOR_LOW },
      uColorMid: { value: COLOR_MID },
      uColorHigh: { value: COLOR_HIGH },
      uGlowColor: { value: COLOR_GLOW },
      uHeight: { value: CORE_HEIGHT },
    }),
    [],
  )

  useFrame((state, delta) => {
    const group = groupRef.current
    const material = materialRef.current
    if (!group || !material) return

    const clampedDelta = Math.min(delta, 1 / 30)
    const { pointer } = state
    material.uniforms.uAspect.value = state.size.width / state.size.height

    // Keep the sample on-screen and reasonably sized across any viewport
    // shape — a fixed world-unit offset/scale looked great on a wide desktop
    // frame but pushed the object almost entirely outside a narrow mobile
    // one, since viewport width in world units shrinks with aspect ratio
    // while height (tied to vertical fov) doesn't. Both position and scale
    // are derived from the *current* viewport each frame, so resizing the
    // window (or rotating a phone) keeps it framed correctly.
    const targetScale = Math.min(1, Math.max(0.45, state.viewport.width / 3.6))
    group.scale.setScalar(targetScale)
    const halfWidth = state.viewport.width / 2
    const maxOffsetX = Math.max(0, halfWidth - CORE_RADIUS * targetScale * 1.15)
    group.position.x = Math.min(state.viewport.width * 0.26, maxOffsetX)
    group.position.y = -0.1 * targetScale

    if (reducedMotion) {
      // Respect the user's preference: settle into a static, gently lit pose
      // instead of continuous rotation/deformation.
      group.rotation.y = 0.5
      group.rotation.x = 0.12
      group.rotation.z = -0.08
      material.uniforms.uPointerStrength.value = 0.12
      material.uniforms.uPointer.value.set(0, 0)
      material.uniforms.uTime.value += clampedDelta * 0.15
      return
    }

    // Idle-vs-active detection drives how brightly the pointer glow reads —
    // ramps up while the pointer is actually moving, decays to a low resting
    // glow after a beat of stillness, so the effect always feels alive
    // without staying maxed out.
    const movedThisFrame =
      Math.abs(pointer.x - lastPointer.current.x) + Math.abs(pointer.y - lastPointer.current.y) > MOVE_EPSILON
    lastPointer.current = { x: pointer.x, y: pointer.y }
    idleTimer.current = movedThisFrame ? 0 : idleTimer.current + clampedDelta
    const targetStrength = idleTimer.current > IDLE_TIMEOUT ? 0.18 : 1

    // Smooth (LERP) both the pointer position and its "strength" — same
    // easing coefficient used for the 2D spotlight variant, so interacting
    // with either hero build feels like the same material.
    smoothedPointer.current.x += (pointer.x - smoothedPointer.current.x) * LERP_FACTOR
    smoothedPointer.current.y += (pointer.y - smoothedPointer.current.y) * LERP_FACTOR
    pointerStrength.current += (targetStrength - pointerStrength.current) * LERP_FACTOR

    material.uniforms.uTime.value += clampedDelta
    material.uniforms.uPointer.value.set(smoothedPointer.current.x, smoothedPointer.current.y)
    material.uniforms.uPointerStrength.value = pointerStrength.current

    // Continuous idle spin, plus an additive tilt that steers toward the
    // pointer — the sample never stops turning, but leans into your cursor.
    group.rotation.y += clampedDelta * AUTO_ROTATE_SPEED
    const targetTiltX = pointer.y * MAX_TILT
    const targetTiltZ = -pointer.x * MAX_TILT
    tilt.current.x += (targetTiltX - tilt.current.x) * LERP_FACTOR
    tilt.current.z += (targetTiltZ - tilt.current.z) * LERP_FACTOR
    group.rotation.x = 0.12 + tilt.current.x
    group.rotation.z = -0.08 + tilt.current.z
  })

  return (
    // Initial position/rotation/scale here only matter for the very first
    // paint before useFrame's first tick runs — every value is overwritten
    // imperatively every frame after that (see useFrame above).
    <group ref={groupRef} position={[1.6, -0.1, 0]} rotation={[0.12, 0.4, -0.08]} scale={0.9}>
      <mesh geometry={geometry}>
        <shaderMaterial
          ref={materialRef}
          vertexShader={coreSampleVertexShader}
          fragmentShader={coreSampleFragmentShader}
          uniforms={uniforms}
        />
      </mesh>
    </group>
  )
}
