/**
 * Design tokens — the single source of truth for colour, material response,
 * motion and lighting. Nothing in the scene or UI hard-codes these values.
 */

export const palette = {
  grass: '#8cc56a',
  grassDark: '#6fae55',
  grassLight: '#a8d77c',
  grassSide: '#79b45c',
  earth: '#b98a5e',
  earthDark: '#8e6644',
  sand: '#f1dcaa',
  path: '#e8d3a6',
  pathEdge: '#d2b98a',
  plaza: '#efe2c4',
  plazaLine: '#dccaa3',
  stone: '#d9d2c6',
  stoneDark: '#b8afa2',
  wood: '#a7774f',
  woodDark: '#7e5638',
  trunk: '#8a6345',
  leaf: '#69b25a',
  leafLight: '#86c86a',
  leafDark: '#4f9a4f',
  pine: '#4f9c63',
  cream: '#fbf3e3',
  white: '#ffffff',
  ink: '#3d2f26',
  gold: '#ffc94a',
  goldDeep: '#f2a516',
  heart: '#ff6f8f',
  lampWarm: '#ffd58a',
  windowNight: '#ffcf7a',
  windowDay: '#a9d4e8',
} as const

export const flowerColors = ['#ff8fab', '#ffd166', '#ffffff', '#c3a6ff', '#ff9f6b', '#8fd3ff']

/** Material response: everything is soft, matte "painted miniature". */
export const material = {
  roughness: 0.82,
  roughnessSoft: 0.92,
  roughnessGloss: 0.35,
} as const

/** Physical springs. Values tuned by feel; documented in DESIGN.md. */
export const springs = {
  /** Button / UI press: fast, a little bounce. */
  press: { mass: 1, tension: 520, friction: 22 },
  /** Building squash on celebration: bouncy. */
  squash: { mass: 1, tension: 380, friction: 9 },
  /** Things popping into the world (flowers, bubbles). */
  pop: { mass: 0.8, tension: 300, friction: 14 },
} as const

export const motion = {
  walkSpeed: 2.6, // m/s along path
  runSpeed: 3.4,
  turnRate: 10, // rad/s slerp factor
  stepFrequency: 2.25, // steps per metre-ish → multiplied by speed
} as const

export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night'

export interface LightingPreset {
  skyTop: string
  skyBottom: string
  fog: string
  sun: string
  sunIntensity: number
  sunDir: [number, number, number]
  hemiSky: string
  hemiGround: string
  hemiIntensity: number
  waterShallow: string
  waterDeep: string
  /** 0..1 — lamps, windows, fireflies */
  night: number
  exposure: number
}

export const lighting: Record<TimeOfDay, LightingPreset> = {
  morning: {
    skyTop: '#86b9f0',
    skyBottom: '#ffe1c2',
    fog: '#f6dcc8',
    sun: '#ffd9a8',
    sunIntensity: 2.6,
    sunDir: [10, 9, 6],
    hemiSky: '#d6e8ff',
    hemiGround: '#b89c78',
    hemiIntensity: 1.25,
    waterShallow: '#7fe0d8',
    waterDeep: '#3f9fc9',
    night: 0,
    exposure: 1.0,
  },
  noon: {
    skyTop: '#5fa8f2',
    skyBottom: '#d9f0ff',
    fog: '#cfe9fb',
    sun: '#fff3df',
    sunIntensity: 3.1,
    sunDir: [6, 14, 7],
    hemiSky: '#dcefff',
    hemiGround: '#a89070',
    hemiIntensity: 1.35,
    waterShallow: '#79e6dc',
    waterDeep: '#2f93cf',
    night: 0,
    exposure: 1.0,
  },
  evening: {
    skyTop: '#5868b0',
    skyBottom: '#ffb07c',
    fog: '#f0a98a',
    sun: '#ff9d5c',
    sunIntensity: 2.4,
    sunDir: [-11, 6, 5],
    hemiSky: '#a7a8e6',
    hemiGround: '#8c6650',
    hemiIntensity: 1.0,
    waterShallow: '#f0a98a',
    waterDeep: '#5a6fb5',
    night: 0.35,
    exposure: 1.0,
  },
  night: {
    skyTop: '#0d1838',
    skyBottom: '#33407a',
    fog: '#2c3870',
    sun: '#a9beff',
    sunIntensity: 0.9,
    sunDir: [-6, 12, 8],
    hemiSky: '#5b6fb8',
    hemiGround: '#2a2440',
    hemiIntensity: 0.75,
    waterShallow: '#3a6aa8',
    waterDeep: '#141f4a',
    night: 1,
    exposure: 1.05,
  },
}

export function timeOfDayFromClock(date = new Date()): TimeOfDay {
  const h = date.getHours()
  if (h >= 5 && h < 10) return 'morning'
  if (h >= 10 && h < 16) return 'noon'
  if (h >= 16 && h < 19) return 'evening'
  return 'night'
}
