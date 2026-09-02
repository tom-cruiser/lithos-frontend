# Lithos — Hero Section

A production-grade, full-screen hero for the Lithos geology brand, centered
on an interactive 3D geological core sample (React Three Fiber / drei) that
deforms, rotates, and glows in real time as the cursor or a finger moves
across the viewport.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS v4 · @react-three/fiber · @react-three/drei · three.js · lucide-react

React-18-compatible majors are pinned deliberately: `@react-three/fiber@^8`
and `@react-three/drei@^9` — their `^9`/`^10` lines require React 19.

## Run it

```bash
npm install
npm run dev
```

`npm run build` type-checks (`tsc -b`) and produces the production bundle;
`npm run lint` runs oxlint.

## Structure

```
src/
├── components/
│   ├── Hero.tsx              — page copy, layout, CTAs, stat bar
│   ├── LithosMark.tsx        — brand glyph (also used as the favicon)
│   └── three/
│       ├── CoreSampleScene.tsx    — <Canvas> setup, WebGL check, error boundary
│       ├── CoreSample.tsx         — the mesh: geometry, uniforms, useFrame loop
│       ├── coreSampleShaders.ts   — the custom GLSL (vertex displacement + shading)
│       ├── CanvasErrorBoundary.tsx
│       └── WebGLUnavailable.tsx   — static fallback panel
├── App.tsx
├── index.css                 — Tailwind import, brand tokens, hero-* animations
└── main.tsx
```

## How the 3D piece works

`CoreSample` is a high-subdivision cylinder with a custom `ShaderMaterial`
(`coreSampleShaders.ts`). The vertex shader displaces every vertex along its
normal by two combined signals:

- a slow-drifting ambient value-noise, so the surface reads as organic rock
  rather than a perfect cylinder, and
- a pointer-proximity bulge computed in **clip/screen space** (not via
  raycasting — that isn't meaningful against a mesh the shader is actively
  displacing) so it tracks the cursor correctly regardless of the mesh's
  current rotation.

The fragment shader bands color by local height (sedimentary strata), adds
hand-rolled two-light Lambert + Fresnel shading — deliberately not real
`THREE.Light` objects, since baking two fixed light directions into the one
mesh's shader is simpler and cheaper than wiring up the standard lighting
pipeline for a scene with exactly one object — and mixes in an emissive glow
wherever the pointer bulge is active.

`useFrame` reads R3F's raw `state.pointer` (already unified mouse+touch by
the Pointer Events API — no manual touch listeners needed) and LERPs it
(`current += (target - current) * 0.08`, the same coefficient used by this
project's 2D spotlight variant) before writing it to the material's uniforms
via direct mutation — never through React state, so the animation loop never
triggers a re-render. The same loop drives a continuous idle spin plus an
additive tilt that steers toward the pointer, and derives the mesh's
position/scale from the *current* viewport size every frame so it stays
framed correctly on any aspect ratio, from a wide desktop hero down to a
narrow phone.

`prefers-reduced-motion` freezes the mesh into a static, gently lit pose
instead of spinning indefinitely.

## Fallbacks

- **No WebGL2 / lost context** — `CoreSampleScene` checks `WebGL2RenderingContext`
  availability up front and listens for `webglcontextlost`; either case
  swaps in `WebGLUnavailable`, a static gradient panel using the same brand
  palette, instead of a blank canvas-shaped hole.
- **Shader/render errors** — `CanvasErrorBoundary` wraps the `<Canvas>` tree.
  R3F scenes throw synchronously during render on compile failures, which a
  plain try/catch can't catch — only a class-component error boundary can.
- **Bundle size** — three.js + drei add ~230kB gzipped, none of it on the
  critical path for the headline/CTAs, so `CoreSampleScene` is loaded via
  `React.lazy()` into its own chunk instead of blocking first paint.

## A build note worth knowing before touching the entrance animation

`Hero.tsx` wraps the 3D scene in `hero-anim hero-fade` (opacity + translateY),
**not** `hero-zoom` (transform: scale). This was a real bug during
development: a CSS `transform: scale()` animation on an ancestor of the
`<Canvas>` distorts what `getBoundingClientRect()` reports for its
width/height while running, and since a pure transform never fires
`ResizeObserver` (it doesn't change the layout box, only the painted one),
R3F's one-time initial size measurement got stuck permanently reading
~10–12% oversized — confirmed by inspecting the live canvas rect, which read
1408×880 inside a 1280×800 parent. `hero-fade`'s translateY doesn't affect
measured width/height, so it's safe.
