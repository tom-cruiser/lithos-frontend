/**
 * Content & Data Architecture for Module 01 — "Strata & Deep Time Mechanics".
 *
 * MODULE_1_STRATA_DATA is the ground-truth record for every layer the
 * module's UI (telemetry cards, the strata preview list, and — eventually —
 * the full "Strata Map" view behind the hero's secondary CTA) reads from.
 * Keeping it as one typed, UI-agnostic array means new surfaces can consume
 * the same eight layers without re-authoring geology copy per component.
 *
 * The eight layers run surface-to-bedrock in a single continuous core, and
 * `depthRange` is deliberately contiguous (each layer's start is the
 * previous layer's end) so the values can drive a stacked visualization
 * directly, without gaps to paper over. The final boundary — 420m, where
 * basalt gives way to the granite basement — matches the "Core Sampling
 * Depth: 420 meters" telemetry readout in TelemetryPanel.tsx; that's the
 * depth this fictional core currently reaches, not a coincidence to reconcile.
 */

export interface GeologicalLayer {
  id: string
  name: string
  era: string
  depthRange: string
  composition: string
  description: string
  colorHex: string
}

export const MODULE_1_STRATA_DATA: GeologicalLayer[] = [
  {
    id: 'topsoil',
    name: 'Topsoil & Humus',
    era: 'Holocene',
    depthRange: '0–0.5 m',
    composition: 'Humus, weathered quartz, clay-loam',
    description:
      'The living skin of the crust — organic matter still being broken down feeds everything rooted above it, and everything below it started here.',
    colorHex: '#3b2a1e',
  },
  {
    id: 'alluvium',
    name: 'Alluvial Sediment',
    era: 'Holocene–Pleistocene',
    depthRange: '0.5–8 m',
    composition: 'Unconsolidated sand, silt, and gravel',
    description:
      'Loose material carried and dropped by moving water — river floods, mostly — young enough that it hasn’t yet been pressed into rock.',
    colorHex: '#8a6a4a',
  },
  {
    id: 'loess',
    name: 'Loess (Aeolian Silt)',
    era: 'Pleistocene',
    depthRange: '8–22 m',
    composition: 'Wind-deposited silt, fine quartz grains',
    description:
      'Dust from glacial outwash plains, carried on ice-age winds and settled here grain by grain over tens of thousands of years.',
    colorHex: '#b89b6e',
  },
  {
    id: 'sandstone',
    name: 'Fluvial Sandstone',
    era: 'Neogene (Miocene)',
    depthRange: '22–95 m',
    composition: 'Quartz sandstone with feldspar and iron-oxide cement',
    description:
      'An ancient riverbed, compacted and cemented solid — the rust-orange cast comes from iron oxide binding the sand grains together.',
    colorHex: '#c17a45',
  },
  {
    id: 'shale',
    name: 'Brackish Shale',
    era: 'Paleogene (Eocene)',
    depthRange: '95–210 m',
    composition: 'Clay minerals, organic-rich mudstone',
    description:
      'Fine sediment that settled in a slow, brackish estuary — this is the layer behind the site’s current "BRACKISH SEDIMENT / SHALE" formation reading.',
    colorHex: '#4f5d6b',
  },
  {
    id: 'limestone',
    name: 'Marine Limestone',
    era: 'Cretaceous',
    depthRange: '210–340 m',
    composition: 'Calcite, fossiliferous carbonate mud',
    description:
      'Compressed shells and marine microfossils from a warm, shallow sea that once covered this ground — the palest layer in the whole core.',
    colorHex: '#cbd0c4',
  },
  {
    id: 'basalt',
    name: 'Flood Basalt',
    era: 'Jurassic–Triassic',
    depthRange: '340–420 m',
    composition: 'Plagioclase, pyroxene, olivine',
    description:
      'A frozen sheet of ancient lava, dense and dark — the current core sample bottoms out here, 420 meters down, still short of bedrock.',
    colorHex: '#1c1c1c',
  },
  {
    id: 'granite-basement',
    name: 'Granite Basement',
    era: 'Precambrian',
    depthRange: '420 m+',
    composition: 'Quartz, feldspar, mica',
    description:
      'The crystalline basement rock the entire stack rests on — untouched by this survey so far, and the next target for the drill.',
    colorHex: '#8b7d74',
  },
]
