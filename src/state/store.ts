/**
 * Mutable, non-reactive experience state.
 * GSAP writes the scroll target, the Director smooths it once per frame, every scene system
 * reads from here inside useFrame, so React never re-renders per frame.
 */
import { phaseWeights, type Weights } from '../choreography/choreography'

export const store = {
  /** Raw scroll progress from ScrollTrigger (already scrubbed by GSAP). */
  target: 0,
  /** Frame-smoothed raw scroll progress (0..1 over the whole pinned scroll). */
  scroll: 0,
  /** Story progress (0..1 over the first `phases.storyEnd` of the scroll), used by the scene. */
  progress: 0,
  /** Cursor light: world position on the final plane and its presence (0..1). */
  cursor: { x: 0, y: 0, z: 0, presence: 0 },
  /** Phase weights derived from progress (refreshed by the Director). */
  w: phaseWeights(0) as Weights,
  /** Experience clock (seconds). */
  time: 0,
  /** Capture runs set this to a fixed frame time (s); 0 = follow the real clock. */
  fixedStep: 0,
  /** Pointer in normalised device coords; `active` false when outside the window. */
  pointer: { x: 0, y: 0, active: false },
  /** Smoothed pointer for camera parallax. */
  pointerSmooth: { x: 0, y: 0 },
  /** True while the pointer is over the liquid and it reacts (the custom cursor takes its hover state). */
  pointerOverKey: false,
  /** Both terrains are in the picture (terrainData.ts): the opening waits for it before it uncovers the hero. */
  terrainReady: false,
  /** While the opening checks performance it forces the scene to this story progress (-1 = off). */
  bench: -1,
  /** The canvas pixel ratio in use, and the way to change it (set by the canvas; only used before the hero shows). */
  dpr: 1,
  setDpr: null as null | ((dpr: number) => void),
  /** Pauses and resumes the scene's frame loop (set by the canvas; null during a capture run, which steps frames itself). */
  setFrameloop: null as null | ((mode: 'always' | 'never') => void),
  /** 1 = full quality, 0 = reduced (set by the performance monitor). */
  quality: 1,
}

export type Store = typeof store
