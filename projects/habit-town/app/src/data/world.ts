/**
 * Static layout of the island town: building placement, the walkable road graph,
 * activity spots and a tiny Dijkstra. Pure data + math — no React, no three objects
 * kept alive, so it is trivially testable.
 */
import type { HabitId } from './habits'

export type Vec2 = [number, number] // x, z on the ground plane

export const ISLAND_RADIUS = 12.6
export const PLAZA_CENTER: Vec2 = [0, 0.4]
export const PLAZA_RADIUS = 3.4
export const FOUNTAIN_RADIUS = 1.35
const RING_RADIUS = 2.45
const RING_NODES = 12

/** Organic island outline radius at angle θ. Deterministic. */
export function islandRadiusAt(theta: number, base = ISLAND_RADIUS) {
  return (
    base *
    (1 +
      0.045 * Math.sin(3 * theta + 0.6) +
      0.03 * Math.sin(5 * theta + 2.1) +
      0.02 * Math.sin(8 * theta + 4.0))
  )
}

export type BuildingId = HabitId | 'home'

export interface BuildingDef {
  id: BuildingId
  pos: Vec2
  /** half-depth of the footprint along its local forward axis */
  halfDepth: number
  /** footprint radius used to keep scenery away */
  clearRadius: number
}

export const buildings: BuildingDef[] = [
  { id: 'home', pos: [-5.6, 5.4], halfDepth: 1.15, clearRadius: 2.6 },
  { id: 'gym', pos: [6.4, 3.0], halfDepth: 1.3, clearRadius: 3.4 },
  { id: 'read', pos: [-7.0, -2.9], halfDepth: 1.25, clearRadius: 3.2 },
  { id: 'study', pos: [5.4, -5.3], halfDepth: 1.2, clearRadius: 3.4 },
  { id: 'run', pos: [-1.2, -8.1], halfDepth: 0, clearRadius: 3.9 },
]

export const buildingById = Object.fromEntries(buildings.map((b) => [b.id, b])) as Record<
  BuildingId,
  BuildingDef
>

/** Building yaw so its local +Z faces the plaza. */
export function facingYaw(pos: Vec2, target: Vec2 = PLAZA_CENTER) {
  return Math.atan2(target[0] - pos[0], target[1] - pos[1])
}

export function localToWorld(b: BuildingDef, lx: number, lz: number): Vec2 {
  const yaw = facingYaw(b.pos)
  const c = Math.cos(yaw)
  const s = Math.sin(yaw)
  // three.js Y rotation: x' = x c + z s ; z' = -x s + z c
  return [b.pos[0] + lx * c + lz * s, b.pos[1] - lx * s + lz * c]
}

/* ---------------- Activity spots ---------------- */

export interface Spot {
  pos: Vec2
  yaw: number
  /** ground height at the spot (decks / mats) */
  y?: number
}

const spotDefs: Record<HabitId, { lx: number; lz: number; faceLx: number; faceLz: number }[]> = {
  // outdoor training mat in front-right of the gym
  gym: [
    { lx: 2.15, lz: 1.3, faceLx: 2.15, faceLz: 4 },
    { lx: 3.15, lz: 2.6, faceLx: 3.15, faceLz: 5 },
    { lx: 3.15, lz: 1.3, faceLx: 3.15, faceLz: 4 },
    { lx: 2.15, lz: 2.6, faceLx: 2.15, faceLz: 5 },
  ],
  // benches either side of the library door
  read: [
    { lx: -1.65, lz: 1.56, faceLx: -1.65, faceLz: 5 },
    { lx: 1.65, lz: 1.56, faceLx: 1.65, faceLz: 5 },
    { lx: -2.2, lz: 1.56, faceLx: -2.2, faceLz: 5 },
    { lx: 2.2, lz: 1.56, faceLx: 2.2, faceLz: 5 },
  ],
  // terrace stools around two tables
  study: [
    { lx: -2.0, lz: 1.72, faceLx: -2.0, faceLz: 3 },
    { lx: 2.1, lz: 3.08, faceLx: 2.1, faceLz: 0 },
    { lx: -2.0, lz: 3.08, faceLx: -2.0, faceLz: 0 },
    { lx: 2.1, lz: 1.72, faceLx: 2.1, faceLz: 3 },
  ],
  // runners use the track loop; spots unused
  run: [],
}

export function spotFor(habit: HabitId, index: number): Spot | null {
  const defs = spotDefs[habit]
  if (!defs.length) return null
  const d = defs[index % defs.length]
  const b = buildingById[habit]
  const p = localToWorld(b, d.lx, d.lz)
  const f = localToWorld(b, d.faceLx, d.faceLz)
  const y = habit === 'study' ? 0.08 : habit === 'gym' ? 0.07 : 0
  // trainers face the viewer (the camera looks toward -Z) so their effort reads on screen
  const yaw = habit === 'gym' ? -0.45 + (index % 2) * 0.25 : Math.atan2(f[0] - p[0], f[1] - p[1])
  return { pos: p, yaw, y }
}

export function spotLocal(habit: HabitId) {
  return spotDefs[habit]
}

/* ---------------- Running track ---------------- */

export const TRACK = { center: [-1.2, -8.15] as Vec2, rx: 2.85, rz: 1.55, width: 0.62 }

export function trackPoint(t: number, lane = 0): { pos: Vec2; yaw: number } {
  const a = t * Math.PI * 2
  const rx = TRACK.rx + lane
  const rz = TRACK.rz + lane
  const x = TRACK.center[0] + Math.cos(a) * rx
  const z = TRACK.center[1] + Math.sin(a) * rz
  // derivative → facing
  const dx = -Math.sin(a) * rx
  const dz = Math.cos(a) * rz
  return { pos: [x, z], yaw: Math.atan2(dx, dz) }
}

/* ---------------- Road graph ---------------- */

export interface GraphNode {
  id: string
  pos: Vec2
}

const nodes: GraphNode[] = []
const edges: [string, string][] = []
const addNode = (id: string, pos: Vec2) => nodes.push({ id, pos })

for (let i = 0; i < RING_NODES; i++) {
  const a = (i / RING_NODES) * Math.PI * 2
  addNode(`ring${i}`, [PLAZA_CENTER[0] + Math.cos(a) * RING_RADIUS, PLAZA_CENTER[1] + Math.sin(a) * RING_RADIUS])
  edges.push([`ring${i}`, `ring${(i + 1) % RING_NODES}`])
}

function nearestRing(pos: Vec2) {
  const a = Math.atan2(pos[1] - PLAZA_CENTER[1], pos[0] - PLAZA_CENTER[0])
  const i = Math.round((((a / (Math.PI * 2)) * RING_NODES) % RING_NODES) + RING_NODES) % RING_NODES
  return `ring${i}`
}

export const doorPos: Record<BuildingId, Vec2> = {} as Record<BuildingId, Vec2>

for (const b of buildings) {
  const door: Vec2 = b.id === 'run' ? [TRACK.center[0] + 0.3, TRACK.center[1] + TRACK.rz + 0.95] : localToWorld(b, 0, b.halfDepth + 0.75)
  doorPos[b.id] = door
  addNode(`door_${b.id}`, door)
  // a mid node gives the road a gentle bend and walkers a smoother curve
  const ring = nearestRing(door)
  const ringPos = nodes.find((n) => n.id === ring)!.pos
  const mid: Vec2 = [(door[0] + ringPos[0]) / 2, (door[1] + ringPos[1]) / 2]
  // bend perpendicular a little, deterministic per building
  const dx = ringPos[0] - door[0]
  const dz = ringPos[1] - door[1]
  const len = Math.hypot(dx, dz) || 1
  const bend = b.id === 'gym' ? 0.6 : b.id === 'read' ? -0.5 : b.id === 'study' ? -0.45 : 0.35
  mid[0] += (-dz / len) * bend
  mid[1] += (dx / len) * bend
  addNode(`mid_${b.id}`, mid)
  edges.push([`door_${b.id}`, `mid_${b.id}`], [`mid_${b.id}`, ring])
}

export const graphNodes = nodes
export const graphEdges = edges
const nodeById = new Map(nodes.map((n) => [n.id, n]))

/** Road polylines for rendering (door → mid → ring). */
export const roads: Vec2[][] = buildings.map((b) => [
  doorPos[b.id],
  nodeById.get(`mid_${b.id}`)!.pos,
  nodeById.get(nearestRing(doorPos[b.id]))!.pos,
])

const adjacency = new Map<string, { to: string; w: number }[]>()
for (const [a, b] of edges) {
  const pa = nodeById.get(a)!.pos
  const pb = nodeById.get(b)!.pos
  const w = Math.hypot(pa[0] - pb[0], pa[1] - pb[1])
  if (!adjacency.has(a)) adjacency.set(a, [])
  if (!adjacency.has(b)) adjacency.set(b, [])
  adjacency.get(a)!.push({ to: b, w })
  adjacency.get(b)!.push({ to: a, w })
}

function nearestNode(pos: Vec2): string {
  let best = nodes[0].id
  let bd = Infinity
  for (const n of nodes) {
    const d = (n.pos[0] - pos[0]) ** 2 + (n.pos[1] - pos[1]) ** 2
    if (d < bd) {
      bd = d
      best = n.id
    }
  }
  return best
}

function dijkstra(from: string, to: string): string[] {
  const dist = new Map<string, number>([[from, 0]])
  const prev = new Map<string, string>()
  const open = new Set<string>([from])
  while (open.size) {
    let cur = ''
    let cd = Infinity
    for (const id of open) {
      const d = dist.get(id)!
      if (d < cd) {
        cd = d
        cur = id
      }
    }
    open.delete(cur)
    if (cur === to) break
    for (const { to: nb, w } of adjacency.get(cur) ?? []) {
      const nd = cd + w
      if (nd < (dist.get(nb) ?? Infinity)) {
        dist.set(nb, nd)
        prev.set(nb, cur)
        open.add(nb)
      }
    }
  }
  const out = [to]
  while (out[0] !== from) {
    const p = prev.get(out[0])
    if (!p) return [from, to]
    out.unshift(p)
  }
  return out
}

/**
 * Route from an arbitrary point to an arbitrary point along roads.
 * Returns ground positions including start and goal.
 */
export function route(start: Vec2, goal: Vec2): Vec2[] {
  const direct = Math.hypot(goal[0] - start[0], goal[1] - start[1])
  if (direct < 1.2) return [start, goal]
  const a = nearestNode(start)
  const b = nearestNode(goal)
  const ids = dijkstra(a, b)
  const pts: Vec2[] = [start, ...ids.map((id) => nodeById.get(id)!.pos), goal]
  // drop near-duplicate points (e.g. when start sits on a node)
  return pts.filter((p, i) => i === 0 || Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) > 0.25)
}

/** Points on the plaza where idle characters hang out. */
export function plazaSpot(i: number): Spot {
  const a = (i * 2.399963) % (Math.PI * 2) // golden angle → nicely spread
  const r = 2.25 + (i % 3) * 0.35
  const pos: Vec2 = [PLAZA_CENTER[0] + Math.cos(a) * r, PLAZA_CENTER[1] + Math.sin(a) * r]
  // chat in loose groups, mostly turned toward the viewer so faces read
  const yaw = ((i % 5) - 2) * 0.32 + Math.sin(i * 1.7) * 0.2
  return { pos, yaw }
}

/* ---------------- Seeded RNG ---------------- */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Distance from point p to polyline segments. */
export function distToRoads(p: Vec2) {
  let best = Infinity
  for (const road of roads) {
    for (let i = 0; i < road.length - 1; i++) {
      const [ax, az] = road[i]
      const [bx, bz] = road[i + 1]
      const vx = bx - ax
      const vz = bz - az
      const t = Math.max(0, Math.min(1, ((p[0] - ax) * vx + (p[1] - az) * vz) / (vx * vx + vz * vz)))
      const d = Math.hypot(p[0] - (ax + vx * t), p[1] - (az + vz * t))
      if (d < best) best = d
    }
  }
  return best
}
