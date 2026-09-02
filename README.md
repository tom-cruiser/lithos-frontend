# Lithos — Hero Section

A production-grade hero section for the Lithos geology brand, centered on an
interactive cursor/touch-following spotlight that blends two overlapping
images through a radial mask.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS v4 · lucide-react

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
│   ├── Hero.tsx            — page copy, layout, CTAs, stat bar
│   ├── SpotlightReveal.tsx — the two-image radial-mask reveal effect
│   └── LithosMark.tsx      — brand glyph (also used as the favicon)
├── hooks/
│   └── useSpotlightPointer.ts — pointer tracking + LERP smoothing
├── App.tsx
├── index.css                — Tailwind import, brand tokens, hero-* animations
└── main.tsx
```

## How the spotlight works

`useSpotlightPointer` listens for `mousemove`/`touchmove` on the container,
eases the raw pointer position toward a target with linear interpolation
(`current += (target - current) * 0.08`), and writes the result straight to
`--spotlight-x` / `--spotlight-y` custom properties via `element.style.setProperty`
inside a `requestAnimationFrame` loop — never through React state, so the
60fps path never triggers a re-render and never touches `canvas`/`toDataURL`.

`SpotlightReveal` renders two stacked `<img>`s: `base` is always visible
(duotone-treated), `reveal` sits on top masked by a static
`radial-gradient(... at var(--spotlight-x) var(--spotlight-y) ...)` mask-image
string. Because the gradient string itself never changes — only the custom
properties it reads — the browser compositor handles the update on the GPU
each frame with no JS-side recomputation.

The rAF loop stops scheduling frames once the eased position is within a
sub-pixel epsilon of its target (idle-stop), and a `prefers-reduced-motion`
listener switches to snapping directly to the target with no easing at all.

Before any pointer interaction, both custom properties default to `50%`,
producing a centered, static spotlight (a gentle CSS-only opacity breathe is
the only motion — `.spotlight-idle` in `index.css`). A small "Move to reveal"
hint fades out permanently on first interaction.

## Assets

`base` and `reveal` currently point at two Unsplash stock photos (rock strata
canyon → amethyst crystal cluster) — swap the `src`/`alt` props in `Hero.tsx`
for licensed brand photography before shipping. Both `<img>` elements have an
`onError` handler that swaps to a CSS-gradient fallback, so a broken/blocked
image degrades gracefully instead of showing a broken-image icon.
