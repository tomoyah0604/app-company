import type { Object3D } from 'three'

/**
 * Imperative registry of live character transforms. Per-frame positions never go
 * through React state — the camera rig and effects read them from here.
 */
export const characterNodes = new Map<string, Object3D>()

export const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function hash(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967295
}

/** DOM nameplates, positioned every frame by the LabelProjector inside the canvas. */
export const labelNodes = new Map<string, HTMLElement>()

/** Uniform character scale (chibi proportion vs. buildings). */
export const CHARACTER_SCALE = 1.28

/**
 * Max simulation step. Capped for stability on frame drops; `?dtmax=0.2` lets
 * headless (software-rendered) capture runs keep real-time pacing.
 */
export const DT_MAX =
  (typeof location !== 'undefined' && Number(new URLSearchParams(location.search).get('dtmax'))) || 1 / 20
