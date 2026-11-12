import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  ISLAND_RADIUS,
  PLAZA_CENTER,
  PLAZA_RADIUS,
  TRACK,
  buildings,
  distToRoads,
  islandRadiusAt,
  mulberry32,
} from '../data/world'
import type { Vec2 } from '../data/world'
import { useStore } from '../store'
import { palette } from '../tokens'
import { env } from './Environment'
import { easeOutBack } from './springs'

/* ---------- placement ---------- */
function isFree(p: Vec2, margin = 0) {
  const r = Math.hypot(p[0], p[1])
  const edge = islandRadiusAt(Math.atan2(p[1], p[0]))
  if (r > edge - 0.9 - margin * 0.3) return false
  if (Math.hypot(p[0] - PLAZA_CENTER[0], p[1] - PLAZA_CENTER[1]) < PLAZA_RADIUS + 0.9 + margin) return false
  const tx = (p[0] - TRACK.center[0]) / (TRACK.rx + 0.9 + margin)
  const tz = (p[1] - TRACK.center[1]) / (TRACK.rz + 0.9 + margin)
  if (tx * tx + tz * tz < 1) return false
  for (const b of buildings) if (Math.hypot(p[0] - b.pos[0], p[1] - b.pos[1]) < b.clearRadius + margin) return false
  if (distToRoads(p) < 1.05 + margin) return false
  return true
}

interface TreeData {
  pos: Vec2
  s: number
  kind: 'round' | 'pine'
  hue: number
}

function scatterTrees(): TreeData[] {
  const r = mulberry32(11)
  const out: TreeData[] = []
  let tries = 0
  while (out.length < 34 && tries < 6000) {
    tries++
    // strong bias toward the rim → the town is framed by forest, the centre stays open
    const a = r() * Math.PI * 2
    const rr = Math.sqrt(0.5 + 0.5 * r()) * (ISLAND_RADIUS - 0.8)
    const p: Vec2 = [Math.cos(a) * rr, Math.sin(a) * rr]
    if (!isFree(p, 0.35)) continue
    if (out.some((t) => Math.hypot(t.pos[0] - p[0], t.pos[1] - p[1]) < 1.6)) continue
    out.push({ pos: p, s: 0.75 + r() * 0.5, kind: r() < 0.28 ? 'pine' : 'round', hue: r() })
  }
  return out
}

const dummy = new THREE.Object3D()
const col = new THREE.Color()

export function Trees() {
  const trees = useMemo(scatterTrees, [])
  const round = useMemo(() => trees.filter((t) => t.kind === 'round'), [trees])
  const pines = useMemo(() => trees.filter((t) => t.kind === 'pine'), [trees])
  const trunks = useRef<THREE.InstancedMesh>(null!)
  const leaves = useRef<THREE.InstancedMesh>(null!)
  const pineLeaves = useRef<THREE.InstancedMesh>(null!)

  const geos = useMemo(
    () => ({
      trunk: new THREE.CylinderGeometry(0.11, 0.16, 1, 8).translate(0, 0.5, 0),
      blob: new THREE.IcosahedronGeometry(1, 2),
      cone: new THREE.ConeGeometry(1, 1, 9).translate(0, 0.5, 0),
    }),
    [],
  )
  const mats = useMemo(
    () => ({
      trunk: new THREE.MeshStandardMaterial({ color: palette.trunk, roughness: 0.9 }),
      leaf: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 }),
    }),
    [],
  )

  useLayoutEffect(() => {
    const r = mulberry32(5)
    trees.forEach((t, i) => {
      const h = t.kind === 'pine' ? 0.55 : 0.95
      dummy.position.set(t.pos[0], 0, t.pos[1])
      dummy.rotation.set(0, r() * 6, 0)
      dummy.scale.set(t.s, h * t.s, t.s)
      dummy.updateMatrix()
      trunks.current.setMatrixAt(i, dummy.matrix)
    })
    trunks.current.instanceMatrix.needsUpdate = true

    const leafCols = [palette.leaf, palette.leafLight, palette.leafDark, '#7cc46a']
    round.forEach((t, i) => {
      const blobs: [number, number, number, number][] = [
        [0, 1.45, 0, 0.72],
        [0.32, 1.2, 0.18, 0.5],
        [-0.28, 1.25, -0.2, 0.52],
      ]
      blobs.forEach(([x, y, z, rad], k) => {
        dummy.position.set(t.pos[0] + x * t.s, y * t.s, t.pos[1] + z * t.s)
        dummy.rotation.set(r(), r(), r())
        dummy.scale.setScalar(rad * t.s)
        dummy.updateMatrix()
        leaves.current.setMatrixAt(i * 3 + k, dummy.matrix)
        col.set(leafCols[Math.floor(t.hue * leafCols.length)]).offsetHSL(0, 0, (k - 1) * 0.03)
        leaves.current.setColorAt(i * 3 + k, col)
      })
    })
    leaves.current.instanceMatrix.needsUpdate = true
    if (leaves.current.instanceColor) leaves.current.instanceColor.needsUpdate = true

    pines.forEach((t, i) => {
      for (let k = 0; k < 3; k++) {
        const w = (0.85 - k * 0.22) * t.s
        dummy.position.set(t.pos[0], (0.45 + k * 0.48) * t.s, t.pos[1])
        dummy.rotation.set(0, r() * 6, 0)
        dummy.scale.set(w, 0.9 * t.s, w)
        dummy.updateMatrix()
        pineLeaves.current.setMatrixAt(i * 3 + k, dummy.matrix)
        col.set(palette.pine).offsetHSL(0, 0, k * 0.035 + (t.hue - 0.5) * 0.05)
        pineLeaves.current.setColorAt(i * 3 + k, col)
      }
    })
    pineLeaves.current.instanceMatrix.needsUpdate = true
    if (pineLeaves.current.instanceColor) pineLeaves.current.instanceColor.needsUpdate = true
  }, [trees, round, pines, trunks, leaves, pineLeaves])

  // gentle wind sway in the vertex shader (per-instance phase from its world position)
  useMemo(() => {
    mats.leaf.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = swayUniform
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace(
          '#include <begin_vertex>',
          `#include <begin_vertex>
           vec4 iw = instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
           float sway = sin(uTime * 1.3 + iw.x * 0.7 + iw.z * 0.5) * 0.045;
           transformed.x += sway * (position.y + 1.0);
           transformed.z += sway * 0.6 * (position.y + 1.0);`,
        )
    }
  }, [mats])
  useFrame((_, dt) => {
    swayUniform.value += dt
  })

  return (
    <group>
      <instancedMesh ref={trunks} args={[geos.trunk, mats.trunk, trees.length]} castShadow receiveShadow />
      <instancedMesh ref={leaves} args={[geos.blob, mats.leaf, round.length * 3]} castShadow receiveShadow />
      <instancedMesh ref={pineLeaves} args={[geos.cone, mats.leaf, pines.length * 3]} castShadow receiveShadow />
    </group>
  )
}
const swayUniform = { value: 0 }

/* ---------- small scatter: bushes, tufts, rocks, mushrooms ---------- */
export function Scatter() {
  const bushes = useRef<THREE.InstancedMesh>(null!)
  const tufts = useRef<THREE.InstancedMesh>(null!)
  const rocks = useRef<THREE.InstancedMesh>(null!)

  const data = useMemo(() => {
    const r = mulberry32(21)
    const pick = (n: number, margin: number, minR = 0) => {
      const pts: Vec2[] = []
      let tries = 0
      while (pts.length < n && tries < n * 60) {
        tries++
        const a = r() * Math.PI * 2
        const rr = Math.sqrt(r()) * (ISLAND_RADIUS - 0.6)
        if (rr < minR) continue
        const p: Vec2 = [Math.cos(a) * rr, Math.sin(a) * rr]
        if (!isFree(p, margin)) continue
        pts.push(p)
      }
      return pts
    }
    return { bushes: pick(34, 0.1), tufts: pick(260, -0.55), rocks: pick(16, -0.3, ISLAND_RADIUS * 0.75), r }
  }, [])

  const geos = useMemo(
    () => ({
      bush: new THREE.IcosahedronGeometry(1, 2),
      tuft: new THREE.ConeGeometry(0.05, 0.22, 4).translate(0, 0.11, 0),
      rock: new THREE.DodecahedronGeometry(1, 0),
    }),
    [],
  )
  const mats = useMemo(
    () => ({
      bush: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 }),
      tuft: new THREE.MeshStandardMaterial({ color: palette.grassDark, roughness: 1 }),
      rock: new THREE.MeshStandardMaterial({ color: palette.stone, roughness: 0.9, flatShading: true }),
    }),
    [],
  )

  useLayoutEffect(() => {
    const r = data.r
    data.bushes.forEach((p, i) => {
      const s = 0.3 + r() * 0.25
      dummy.position.set(p[0], s * 0.45, p[1])
      dummy.rotation.set(r(), r(), r())
      dummy.scale.set(s * 1.25, s, s * 1.15)
      dummy.updateMatrix()
      bushes.current.setMatrixAt(i, dummy.matrix)
      col.set([palette.leafDark, palette.leaf, '#5aa65a'][i % 3])
      bushes.current.setColorAt(i, col)
    })
    let k = 0
    data.tufts.forEach((p) => {
      for (let j = 0; j < 3; j++) {
        dummy.position.set(p[0] + (r() - 0.5) * 0.12, 0, p[1] + (r() - 0.5) * 0.12)
        dummy.rotation.set((r() - 0.5) * 0.6, r() * 6, (r() - 0.5) * 0.6)
        dummy.scale.setScalar(0.7 + r() * 0.6)
        dummy.updateMatrix()
        tufts.current.setMatrixAt(k++, dummy.matrix)
      }
    })
    data.rocks.forEach((p, i) => {
      const s = 0.16 + r() * 0.22
      dummy.position.set(p[0], s * 0.3, p[1])
      dummy.rotation.set(r(), r(), r())
      dummy.scale.set(s * 1.3, s * 0.8, s)
      dummy.updateMatrix()
      rocks.current.setMatrixAt(i, dummy.matrix)
    })
    for (const m of [bushes, tufts, rocks]) {
      m.current.instanceMatrix.needsUpdate = true
      if (m.current.instanceColor) m.current.instanceColor.needsUpdate = true
    }
  }, [data])

  return (
    <group>
      <instancedMesh ref={bushes} args={[geos.bush, mats.bush, data.bushes.length]} castShadow receiveShadow />
      <instancedMesh ref={tufts} args={[geos.tuft, mats.tuft, data.tufts.length * 3]} receiveShadow />
      <instancedMesh ref={rocks} args={[geos.rock, mats.rock, data.rocks.length]} castShadow receiveShadow />
    </group>
  )
}

/* ---------- flowers: grow with the player's progress ---------- */
const MAX_FLOWERS = 160
export function Flowers() {
  const heads = useRef<THREE.InstancedMesh>(null!)
  const stems = useRef<THREE.InstancedMesh>(null!)
  const geos = useMemo(
    () => ({
      head: new THREE.IcosahedronGeometry(0.075, 1),
      stem: new THREE.CylinderGeometry(0.012, 0.014, 0.2, 5).translate(0, 0.1, 0),
    }),
    [],
  )
  const mats = useMemo(
    () => ({
      head: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }),
      stem: new THREE.MeshStandardMaterial({ color: palette.leafDark, roughness: 1 }),
    }),
    [],
  )

  useFrame(() => {
    const flowers = useStore.getState().flowers
    const now = performance.now()
    const n = Math.min(flowers.length, MAX_FLOWERS)
    for (let i = 0; i < n; i++) {
      const f = flowers[i]
      const age = (now - f.born) / 650
      const s = age <= 0 ? 0 : age >= 1 ? 1 : easeOutBack(age)
      const wob = Math.sin(now * 0.002 + i) * 0.04
      dummy.position.set(f.pos[0], 0, f.pos[1])
      dummy.rotation.set(wob, 0, wob * 0.6)
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      stems.current.setMatrixAt(i, dummy.matrix)
      dummy.position.y = 0.22 * s
      dummy.scale.set(s, s * 0.7, s)
      dummy.updateMatrix()
      heads.current.setMatrixAt(i, dummy.matrix)
      heads.current.setColorAt(i, col.set(f.color))
    }
    heads.current.count = stems.current.count = n
    heads.current.instanceMatrix.needsUpdate = true
    stems.current.instanceMatrix.needsUpdate = true
    if (heads.current.instanceColor) heads.current.instanceColor.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={heads} args={[geos.head, mats.head, MAX_FLOWERS]} castShadow frustumCulled={false} />
      <instancedMesh ref={stems} args={[geos.stem, mats.stem, MAX_FLOWERS]} frustumCulled={false} />
    </group>
  )
}

/* ---------- drifting clouds (cast moving shadows across the island) ---------- */
export function Clouds() {
  const group = useRef<THREE.Group>(null!)
  const clouds = useMemo(() => {
    const r = mulberry32(99)
    return Array.from({ length: 4 }, (_, i) => ({
      x: -26 + i * 15 + r() * 6,
      z: -14 + r() * 16 - (i % 2) * 6,
      y: 9 + r() * 2.5,
      s: 1 + r() * 0.6,
      puffs: Array.from({ length: 5 }, (_, k) => [(k - 2) * 0.9 + (r() - 0.5) * 0.3, r() * 0.4, (r() - 0.5) * 0.8, 0.8 + r() * 0.5] as const),
    }))
  }, [])
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#ffffff', emissiveIntensity: 0.25 }), [])
  const g = useMemo(() => new THREE.IcosahedronGeometry(1, 2), [])
  useFrame((_, dt) => {
    group.current.children.forEach((c) => {
      c.position.x += dt * 0.35
      if (c.position.x > 34) c.position.x = -34
    })
    m.emissiveIntensity = 0.25 - env.night * 0.2
  })
  return (
    <group ref={group}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.s}>
          {c.puffs.map(([x, y, z, s], k) => (
            <mesh key={k} geometry={g} material={m} position={[x, y, z]} scale={[s, s * 0.7, s]} castShadow />
          ))}
        </group>
      ))}
    </group>
  )
}

/* ---------- fireflies at night ---------- */
export function Fireflies() {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const N = 40
  const seeds = useMemo(() => {
    const r = mulberry32(64)
    return Array.from({ length: N }, () => {
      const a = r() * Math.PI * 2
      const rr = 2 + r() * (ISLAND_RADIUS - 3)
      return { x: Math.cos(a) * rr, z: Math.sin(a) * rr, p: r() * 10, sp: 0.4 + r() * 0.6 }
    })
  }, [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const vis = env.night
    ref.current.visible = vis > 0.05
    if (!ref.current.visible) return
    seeds.forEach((s, i) => {
      dummy.position.set(
        s.x + Math.sin(t * s.sp + s.p) * 0.8,
        0.6 + Math.sin(t * s.sp * 1.7 + s.p) * 0.35,
        s.z + Math.cos(t * s.sp * 0.8 + s.p) * 0.8,
      )
      const blink = Math.max(0, Math.sin(t * 2.2 + s.p * 3))
      dummy.scale.setScalar(vis * (0.4 + blink * 0.6))
      dummy.rotation.set(0, 0, 0)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]} frustumCulled={false}>
      <sphereGeometry args={[0.035, 8, 6]} />
      <meshBasicMaterial color={[3.2, 2.8, 1.2]} toneMapped={false} />
    </instancedMesh>
  )
}
