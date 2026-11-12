import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import * as THREE from 'three'
import { buildingById, facingYaw } from '../data/world'
import type { BuildingId } from '../data/world'
import type { HabitId } from '../data/habits'
import { useStore } from '../store'
import { palette } from '../tokens'
import { env } from './Environment'
import { capsule, cone, cyl, mat, roofGeo, roofMat, roundedBox, sphere, torus } from './materials'
import { stepSpring } from './springs'
import { StaticBatch } from './StaticBatch'

/* ---------- time-of-day reactive materials (shared, updated once per frame) ---------- */
export const windowMat = new THREE.MeshStandardMaterial({ color: palette.windowDay, roughness: 0.25, metalness: 0 })
export const lampMat = new THREE.MeshStandardMaterial({ color: palette.lampWarm, roughness: 0.4 })
const windowDay = new THREE.Color(palette.windowDay)
const windowNightBase = new THREE.Color('#5a4630')
const windowGlow = new THREE.Color(palette.windowNight)
const lampGlow = new THREE.Color(palette.lampWarm)

export function useNightMaterials() {
  useFrame(() => {
    const n = env.night
    windowMat.color.copy(windowDay).lerp(windowNightBase, n)
    windowMat.emissive.copy(windowGlow)
    windowMat.emissiveIntensity = n * 2.4
    windowMat.roughness = 0.25 + n * 0.5
    lampMat.emissive.copy(lampGlow)
    lampMat.emissiveIntensity = 0.15 + n * 5.5
  })
}

/* ---------- primitives ---------- */
type V3 = [number, number, number]
interface PartProps {
  g: THREE.BufferGeometry
  c?: string
  m?: THREE.Material
  p?: V3
  r?: V3
  s?: V3 | number
  shadow?: boolean
}
function Part({ g, c, m, p, r, s, shadow = true }: PartProps) {
  return (
    <mesh
      geometry={g}
      material={m ?? mat(c ?? '#ff00ff')}
      position={p}
      rotation={r}
      scale={s}
      castShadow={shadow}
      receiveShadow
    />
  )
}

/** Window with a cream frame, a cross mullion and a flower box. */
function Window({ p, w = 0.46, h = 0.5, ry = 0, box = true }: { p: V3; w?: number; h?: number; ry?: number; box?: boolean }) {
  return (
    <group position={p} rotation-y={ry}>
      <Part g={roundedBox(w + 0.12, h + 0.12, 0.08, 0.03)} c={palette.cream} />
      <Part g={roundedBox(w, h, 0.06, 0.02)} m={windowMat} p={[0, 0, 0.03]} shadow={false} />
      <Part g={roundedBox(0.04, h, 0.04, 0.015)} c={palette.cream} p={[0, 0, 0.07]} shadow={false} />
      <Part g={roundedBox(w, 0.04, 0.04, 0.015)} c={palette.cream} p={[0, 0, 0.07]} shadow={false} />
      {box && (
        <group position={[0, -h / 2 - 0.1, 0.1]}>
          <Part g={roundedBox(w + 0.1, 0.14, 0.16, 0.03)} c={palette.wood} />
          {[-0.16, -0.05, 0.06, 0.17].map((x, i) => (
            <Part key={i} g={sphere(0.06, 10, 8)} c={['#ff8fab', '#ffd166', '#ff8fab', '#ffffff'][i]} p={[x, 0.1, 0]} />
          ))}
        </group>
      )}
    </group>
  )
}

function Door({ p, color = palette.wood, w = 0.56, h = 0.92 }: { p: V3; color?: string; w?: number; h?: number }) {
  return (
    <group position={p}>
      <Part g={roundedBox(w + 0.12, h + 0.08, 0.06, 0.03)} c={palette.cream} p={[0, 0.02, -0.01]} />
      <Part g={roundedBox(w, h, 0.08, 0.04)} c={color} />
      <Part g={sphere(0.04, 10, 8)} c={palette.gold} p={[w * 0.32, 0, 0.06]} />
      <Part g={roundedBox(w + 0.3, 0.08, 0.36, 0.03)} c={palette.stone} p={[0, -h / 2 - 0.02, 0.2]} />
    </group>
  )
}

export function Lamp({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <Part g={cyl(0.12, 0.15, 0.12, 12)} c="#4b4f5c" p={[0, 0.06, 0]} />
      <Part g={cyl(0.045, 0.045, 1.5, 8)} c="#4b4f5c" p={[0, 0.8, 0]} />
      <Part g={roundedBox(0.3, 0.06, 0.3, 0.02)} c="#4b4f5c" p={[0, 1.58, 0]} />
      <Part g={roundedBox(0.22, 0.28, 0.22, 0.04)} m={lampMat} p={[0, 1.76, 0]} shadow={false} />
      <Part g={cone(0.2, 0.16, 4)} c="#4b4f5c" p={[0, 1.98, 0]} r={[0, Math.PI / 4, 0]} />
    </group>
  )
}

export function Bench({ p, ry = 0 }: { p: V3; ry?: number }) {
  return (
    <group position={p} rotation-y={ry}>
      {[-0.5, 0.5].map((x) => (
        <Part key={x} g={roundedBox(0.08, 0.3, 0.36, 0.02)} c="#5b5f6b" p={[x, 0.15, 0]} />
      ))}
      <Part g={roundedBox(1.3, 0.07, 0.4, 0.025)} c={palette.wood} p={[0, 0.32, 0]} />
      <Part g={roundedBox(1.3, 0.24, 0.06, 0.025)} c={palette.wood} p={[0, 0.5, -0.19]} r={[-0.12, 0, 0]} />
    </group>
  )
}

/* ---------- interactive wrapper: hover lift + celebration squash ---------- */
function BuildingRoot({ id, children }: { id: BuildingId; children: ReactNode }) {
  const b = buildingById[id]
  const yaw = facingYaw(b.pos)
  const inner = useRef<THREE.Group>(null!)
  const ring = useRef<THREE.Mesh>(null!)
  const squash = useRef({ x: 0, v: 0 })
  const hoverS = useRef({ x: 0, v: 0 })
  const lastCeleb = useRef(0)
  const ringT = useRef(10)
  const [hover, setHover] = useState(false)
  const record = useStore((s) => s.record)

  useFrame((_, dt) => {
    const celebs = useStore.getState().celebrations
    const last = celebs[celebs.length - 1]
    if (last && last.id !== lastCeleb.current && last.habit === id) {
      lastCeleb.current = last.id
      squash.current.v += 7 // impulse
      ringT.current = 0
    }
    const sq = stepSpring(squash.current, 0, 380, 9, dt)
    const hv = stepSpring(hoverS.current, hover ? 1 : 0, 520, 26, dt)
    inner.current.scale.set(1 + sq * 0.05 + hv * 0.02, 1 - sq * 0.08 + hv * 0.03, 1 + sq * 0.05 + hv * 0.02)
    // gold shock ring on the ground
    ringT.current += dt
    const t = ringT.current / 1.3
    ring.current.visible = t < 1
    if (t < 1) {
      const s = 1 + t * 3.2
      ring.current.scale.set(s, s, 1)
      ;(ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.9
    }
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (id !== 'home') record(id as HabitId)
  }

  return (
    <group position={[b.pos[0], 0, b.pos[1]]} rotation-y={yaw}>
      <group
        ref={inner}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          if (id === 'home') return
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = ''
        }}
      >
        <StaticBatch>{children}</StaticBatch>
      </group>
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.03} visible={false}>
        <ringGeometry args={[1.0, 1.18, 64]} />
        <meshBasicMaterial color={palette.gold} transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* ---------- Home ---------- */
function Home() {
  return (
    <BuildingRoot id="home">
      <Part g={roundedBox(2.5, 0.2, 2.3, 0.06)} c={palette.stone} p={[0, 0.1, 0]} />
      <Part g={roundedBox(2.2, 1.45, 1.95, 0.07)} c="#fff1db" p={[0, 0.92, 0]} />
      {/* timber trims */}
      <Part g={roundedBox(2.26, 0.1, 2.01, 0.03)} c={palette.woodDark} p={[0, 1.62, 0]} />
      <Part g={roofGeo(2.85, 1.15, 2.45, 0.08)} m={roofMat('#e26f55')} p={[0, 1.66, 0]} />
      <Part g={roofGeo(2.2, 0.85, 0.05, 0.02)} c="#fff1db" p={[0, 1.67, 1.0]} shadow={false} />
      <Part g={cyl(0.17, 0.17, 0.06, 20)} m={windowMat} p={[0, 2.06, 1.04]} r={[Math.PI / 2, 0, 0]} />
      <Part g={torus(0.18, 0.035)} c={palette.cream} p={[0, 2.06, 1.07]} />
      <Part g={roundedBox(0.34, 0.7, 0.34, 0.04)} c="#c66b4f" p={[0.62, 2.35, -0.45]} />
      <Part g={roundedBox(0.42, 0.1, 0.42, 0.03)} c="#9e523c" p={[0.62, 2.72, -0.45]} />
      <Door p={[0, 0.68, 0.98]} color="#7aa6d6" />
      <Window p={[-0.66, 1.0, 0.98]} />
      <Window p={[0.66, 1.0, 0.98]} />
      <Window p={[1.11, 1.0, 0]} ry={Math.PI / 2} box={false} />
      <Window p={[-1.11, 1.0, 0]} ry={-Math.PI / 2} box={false} />
      {/* mailbox */}
      <group position={[1.2, 0, 1.45]}>
        <Part g={cyl(0.035, 0.035, 0.7, 8)} c={palette.woodDark} p={[0, 0.35, 0]} />
        <Part g={roundedBox(0.3, 0.22, 0.2, 0.08)} c="#e26f55" p={[0, 0.78, 0]} />
        <Part g={roundedBox(0.03, 0.14, 0.04, 0.01)} c={palette.gold} p={[0.16, 0.86, 0.04]} />
      </group>
      {/* little fence */}
      {[-1.25, -0.95, -0.65].map((x) => (
        <Part key={x} g={roundedBox(0.08, 0.42, 0.06, 0.02)} c={palette.cream} p={[x, 0.21, 1.45]} />
      ))}
      <Part g={roundedBox(0.75, 0.06, 0.04, 0.015)} c={palette.cream} p={[-0.95, 0.3, 1.45]} />
    </BuildingRoot>
  )
}

/* ---------- Gym ---------- */
function Dumbbell({ p, s = 1, r }: { p: V3; s?: number; r?: V3 }) {
  return (
    <group position={p} scale={s} rotation={r}>
      <Part g={cyl(0.05, 0.05, 1.1, 10)} c="#c9ced8" r={[0, 0, Math.PI / 2]} />
      {[-0.42, 0.42].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <Part g={cyl(0.26, 0.26, 0.14, 24)} c="#38404f" r={[0, 0, Math.PI / 2]} />
          <Part g={cyl(0.2, 0.2, 0.08, 24)} c="#4cc2b0" p={[x > 0 ? 0.1 : -0.1, 0, 0]} r={[0, 0, Math.PI / 2]} />
        </group>
      ))}
    </group>
  )
}

function Gym() {
  return (
    <BuildingRoot id="gym">
      <Part g={roundedBox(3.4, 0.2, 2.7, 0.06)} c={palette.stone} p={[0, 0.1, 0]} />
      <Part g={roundedBox(3.1, 1.75, 2.4, 0.08)} c="#eef6f3" p={[0, 1.07, 0]} />
      <Part g={roundedBox(3.14, 0.32, 2.44, 0.05)} c="#4cc2b0" p={[0, 1.6, 0]} />
      <Part g={roundedBox(3.5, 0.2, 2.8, 0.08)} c="#2f9e8f" p={[0, 2.03, 0]} />
      {/* big glass front */}
      <Part g={roundedBox(1.7, 0.8, 0.08, 0.04)} m={windowMat} p={[-0.55, 0.95, 1.2]} shadow={false} />
      <Part g={roundedBox(1.84, 0.94, 0.06, 0.04)} c="#38404f" p={[-0.55, 0.95, 1.18]} />
      <Door p={[0.95, 0.68, 1.2]} color="#38404f" />
      {/* awning */}
      <Part g={roundedBox(0.9, 0.06, 0.55, 0.025)} c="#ffcf5a" p={[0.95, 1.33, 1.42]} r={[0.25, 0, 0]} />
      {/* rooftop dumbbell sign */}
      <group position={[0, 2.13, 0.2]}>
        <Part g={roundedBox(0.16, 0.5, 0.16, 0.04)} c="#38404f" p={[-0.3, 0.25, 0]} />
        <Part g={roundedBox(0.16, 0.5, 0.16, 0.04)} c="#38404f" p={[0.3, 0.25, 0]} />
        <Dumbbell p={[0, 0.72, 0]} s={1.25} />
      </group>
      {/* outdoor training mat */}
      <Part g={roundedBox(1.9, 0.06, 2.4, 0.03)} c="#8fa3a8" p={[2.65, 0.03, 1.95]} />
      <Part g={roundedBox(1.7, 0.02, 2.2, 0.01)} c="#a9c4c0" p={[2.65, 0.07, 1.95]} shadow={false} />
      {/* rack */}
      <group position={[3.55, 0, 1.95]}>
        {[-0.6, 0.6].map((z) => (
          <Part key={z} g={roundedBox(0.08, 1.2, 0.08, 0.02)} c="#38404f" p={[0, 0.6, z]} />
        ))}
        <Part g={cyl(0.03, 0.03, 1.5, 8)} c="#c9ced8" p={[0, 0.95, 0]} r={[Math.PI / 2, 0, 0]} />
        <Part g={cyl(0.2, 0.2, 0.07, 18)} c="#e26f55" p={[0, 0.95, -0.66]} r={[Math.PI / 2, 0, 0]} />
        <Part g={cyl(0.2, 0.2, 0.07, 18)} c="#e26f55" p={[0, 0.95, 0.66]} r={[Math.PI / 2, 0, 0]} />
      </group>
      {/* kettlebells */}
      {[
        [1.95, 3.0, '#ffcf5a'],
        [2.25, 3.05, '#4cc2b0'],
      ].map(([x, z, c]) => (
        <group key={String(x)} position={[x as number, 0.13, z as number]}>
          <Part g={sphere(0.13, 16, 12)} c={c as string} />
          <Part g={torus(0.07, 0.022, Math.PI)} c="#38404f" p={[0, 0.12, 0]} />
        </group>
      ))}
    </BuildingRoot>
  )
}

/* ---------- Library ---------- */
function Library() {
  return (
    <BuildingRoot id="read">
      <Part g={roundedBox(3.2, 0.24, 2.6, 0.06)} c={palette.stone} p={[0, 0.12, 0]} />
      <Part g={roundedBox(2.9, 1.9, 2.25, 0.07)} c="#f5dfbe" p={[0, 1.18, 0]} />
      <Part g={roundedBox(2.96, 0.14, 2.31, 0.04)} c="#c8643f" p={[0, 0.3, 0]} />
      {/* hip roof: ridge along X */}
      <group position={[0, 2.1, 0]} rotation-y={Math.PI / 2}>
        <Part g={roofGeo(2.85, 1.15, 3.35, 0.08)} m={roofMat('#5b7fc7')} />
      </group>
      <Part g={roundedBox(3.3, 0.1, 2.75, 0.04)} c="#47669f" p={[0, 2.1, 0]} />
      {/* portico */}
      {[-0.62, 0.62].map((x) => (
        <group key={x}>
          <Part g={cyl(0.1, 0.11, 1.55, 14)} c={palette.cream} p={[x, 1.02, 1.42]} />
          <Part g={roundedBox(0.26, 0.08, 0.26, 0.02)} c={palette.cream} p={[x, 1.82, 1.42]} />
        </group>
      ))}
      <Part g={roofGeo(1.75, 0.45, 0.6, 0.04)} m={roofMat('#5b7fc7')} p={[0, 1.88, 1.38]} />
      <Door p={[0, 0.8, 1.13]} color="#8e5b3a" w={0.62} h={1.0} />
      <Window p={[-1.05, 1.28, 1.13]} w={0.36} h={0.62} box={false} />
      <Window p={[1.05, 1.28, 1.13]} w={0.36} h={0.62} box={false} />
      {/* round window + book sign */}
      <Part g={cyl(0.22, 0.22, 0.06, 22)} m={windowMat} p={[0, 2.55, 1.0]} r={[Math.PI / 2 - 0.37, 0, 0]} />
      <group position={[0, 2.3, 1.78]} rotation-x={-0.25}>
        <Part g={roundedBox(0.36, 0.46, 0.05, 0.02)} c="#f08a5d" p={[-0.17, 0, 0]} r={[0, 0.3, 0]} />
        <Part g={roundedBox(0.36, 0.46, 0.05, 0.02)} c="#f08a5d" p={[0.17, 0, 0]} r={[0, -0.3, 0]} />
        <Part g={roundedBox(0.3, 0.4, 0.04, 0.015)} c={palette.white} p={[-0.15, 0, 0.04]} r={[0, 0.3, 0]} />
        <Part g={roundedBox(0.3, 0.4, 0.04, 0.015)} c={palette.white} p={[0.15, 0, 0.04]} r={[0, -0.3, 0]} />
      </group>
      <Bench p={[-1.92, 0, 1.5]} />
      <Bench p={[1.92, 0, 1.5]} />
    </BuildingRoot>
  )
}

/* ---------- Cafe ---------- */
function CafeTable({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <Part g={cyl(0.06, 0.16, 0.05, 14)} c="#4b4f5c" p={[0, 0.025, 0]} />
      <Part g={cyl(0.035, 0.035, 0.5, 8)} c="#4b4f5c" p={[0, 0.27, 0]} />
      <Part g={cyl(0.36, 0.36, 0.05, 24)} c={palette.cream} p={[0, 0.53, 0]} />
      <Part g={cyl(0.025, 0.025, 1.5, 8)} c={palette.woodDark} p={[0, 1.15, 0]} />
      {/* umbrella, alternating panels */}
      <Part g={cone(0.85, 0.36, 8)} c="#e8828f" p={[0, 1.9, 0]} />
      <Part g={cone(0.86, 0.36, 8)} c={palette.white} p={[0, 1.9, 0]} r={[0, Math.PI / 8, 0]} s={[1, 0.99, 1]} />
      <Part g={sphere(0.05, 10, 8)} c={palette.woodDark} p={[0, 2.1, 0]} />
      <Part g={cyl(0.05, 0.04, 0.09, 12)} c={palette.white} p={[0.12, 0.6, 0.06]} />
    </group>
  )
}

function Stool({ p }: { p: V3 }) {
  return (
    <group position={p}>
      <Part g={cyl(0.03, 0.03, 0.28, 8)} c="#4b4f5c" p={[0, 0.14, 0]} />
      <Part g={cyl(0.17, 0.17, 0.06, 18)} c={palette.wood} p={[0, 0.3, 0]} />
    </group>
  )
}

function Cafe() {
  const awning = useMemo(() => Array.from({ length: 7 }, (_, i) => i), [])
  return (
    <BuildingRoot id="study">
      <Part g={roundedBox(2.9, 0.2, 2.5, 0.06)} c={palette.stone} p={[0, 0.1, 0]} />
      <Part g={roundedBox(2.6, 1.6, 2.2, 0.08)} c="#fbd3cc" p={[0, 1.0, 0]} />
      <Part g={roundedBox(2.8, 0.22, 2.4, 0.06)} c="#8e5b3a" p={[0, 1.88, 0]} />
      <Part g={roundedBox(2.4, 0.1, 2.0, 0.04)} c="#b07a52" p={[0, 2.03, 0]} />
      <Window p={[-0.72, 0.98, 1.1]} w={0.75} h={0.62} />
      <Door p={[0.62, 0.68, 1.1]} color="#8e5b3a" />
      {/* striped awning */}
      {awning.map((i) => (
        <Part
          key={i}
          g={roundedBox(0.38, 0.05, 0.75, 0.02)}
          c={i % 2 ? palette.white : '#e8828f'}
          p={[-1.14 + i * 0.38, 1.55, 1.4]}
          r={[0.38, 0, 0]}
        />
      ))}
      {awning.map((i) => (
        <Part key={`s${i}`} g={sphere(0.19, 14, 8)} c={i % 2 ? palette.white : '#e8828f'} p={[-1.14 + i * 0.38, 1.4, 1.75]} s={[1, 0.45, 0.4]} />
      ))}
      {/* rooftop cup sign */}
      <group position={[0, 2.08, 0.3]}>
        <Part g={cyl(0.3, 0.22, 0.48, 22)} c={palette.white} p={[0, 0.3, 0]} />
        <Part g={cyl(0.27, 0.27, 0.02, 22)} c="#8e5b3a" p={[0, 0.54, 0]} shadow={false} />
        <Part g={torus(0.13, 0.045)} c={palette.white} p={[0.32, 0.3, 0]} />
        <Part g={cyl(0.4, 0.4, 0.04, 24)} c="#c48bdc" p={[0, 0.04, 0]} />
      </group>
      {/* terrace deck */}
      <Part g={roundedBox(5.5, 0.08, 2.0, 0.03)} c="#d9b48a" p={[0, 0.04, 2.4]} />
      {Array.from({ length: 10 }, (_, i) => (
        <Part key={i} g={roundedBox(0.02, 0.01, 1.96, 0.004)} c="#c49c72" p={[-2.47 + i * 0.55, 0.085, 2.4]} shadow={false} />
      ))}
      <CafeTable p={[-2.0, 0.08, 2.4]} />
      <CafeTable p={[2.1, 0.08, 2.4]} />
      {/* stools sit where the spot is; hidden under sitting characters anyway */}
      <Stool p={[-2.0, 0.08, 1.72]} />
      <Stool p={[-2.0, 0.08, 3.08]} />
      <Stool p={[2.1, 0.08, 1.72]} />
      <Stool p={[2.1, 0.08, 3.08]} />
      {/* planter */}
      <Part g={roundedBox(0.5, 0.36, 0.5, 0.06)} c="#c66b4f" p={[-1.2, 0.18, 1.35]} />
      <Part g={sphere(0.32, 16, 12)} c={palette.leaf} p={[-1.2, 0.5, 1.35]} />
    </BuildingRoot>
  )
}

/* ---------- Park ---------- */
function Park() {
  return (
    <BuildingRoot id="run">
      {/* gate arch at the park entrance (local +z toward plaza) */}
      <group position={[0.3, 0, 2.45]}>
        {[-0.95, 0.95].map((x) => (
          <group key={x}>
            <Part g={roundedBox(0.22, 1.7, 0.22, 0.05)} c={palette.wood} p={[x, 0.85, 0]} />
            <Part g={sphere(0.16, 14, 10)} c="#7ab8f5" p={[x, 1.8, 0]} />
          </group>
        ))}
        <Part g={torus(0.95, 0.09, Math.PI)} c={palette.wood} p={[0, 1.55, 0]} />
        <Part g={roundedBox(1.0, 0.3, 0.08, 0.05)} c="#7ab8f5" p={[0, 2.0, 0.02]} />
        {[-0.3, 0, 0.3].map((x) => (
          <Part key={x} g={capsule(0.035, 0.12)} c={palette.white} p={[x, 2.0, 0.08]} r={[0, 0, 0.6]} shadow={false} />
        ))}
      </group>
      {/* flags along the track */}
      {[-2.6, 2.6].map((x) => (
        <group key={x} position={[x, 0, -1.2]}>
          <Part g={cyl(0.03, 0.03, 1.6, 8)} c="#e8e2d6" p={[0, 0.8, 0]} />
          <Part g={cone(0.18, 0.42, 3)} c={x < 0 ? '#ffcf5a' : '#ff8fab'} p={[0.2, 1.42, 0]} r={[0, 0, -Math.PI / 2]} s={[1, 1, 0.25]} />
        </group>
      ))}
      {/* cones */}
      {[
        [-1.0, -0.2],
        [1.0, -0.2],
      ].map(([x, z]) => (
        <group key={x} position={[x, 0, z]}>
          <Part g={cone(0.12, 0.3, 14)} c="#ff8a4c" p={[0, 0.15, 0]} />
          <Part g={cyl(0.08, 0.1, 0.05, 14)} c={palette.white} p={[0, 0.14, 0]} />
        </group>
      ))}
      {/* water bottle station */}
      <group position={[-2.8, 0, 1.7]}>
        <Part g={roundedBox(0.4, 0.8, 0.4, 0.08)} c="#7ab8f5" p={[0, 0.4, 0]} />
        <Part g={cyl(0.12, 0.12, 0.3, 14)} c="#d8f1ff" p={[0, 0.95, 0]} />
      </group>
      <Bench p={[2.9, 0, 1.4]} ry={-0.5} />
    </BuildingRoot>
  )
}

/* ---------- Plaza ---------- */
function Fountain() {
  const water = useRef<THREE.Mesh>(null!)
  const jets = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    water.current.position.y = 0.33 + Math.sin(t * 2) * 0.008
    jets.current.children.forEach((c, i) => {
      const s = 0.9 + Math.sin(t * 6 + i * 1.7) * 0.1
      c.scale.set(1, s, 1)
    })
  })
  return (
    <group>
      <Part g={cyl(1.35, 1.45, 0.4, 40)} c={palette.stone} p={[0, 0.2, 0]} />
      <Part g={torus(1.3, 0.08)} c={palette.stoneDark} p={[0, 0.4, 0]} r={[Math.PI / 2, 0, 0]} />
      <mesh ref={water} position-y={0.33} rotation-x={-Math.PI / 2} receiveShadow userData={{ noBatch: true }}>
        <circleGeometry args={[1.23, 40]} />
        <meshStandardMaterial color="#7fd8e8" roughness={0.12} emissive="#3fb6d8" emissiveIntensity={0.25} />
      </mesh>
      <Part g={cyl(0.18, 0.26, 0.9, 18)} c={palette.stone} p={[0, 0.75, 0]} />
      <Part g={cyl(0.55, 0.2, 0.22, 28)} c={palette.stone} p={[0, 1.25, 0]} />
      <Part g={cyl(0.48, 0.48, 0.02, 28)} c="#8fe3f0" p={[0, 1.36, 0]} shadow={false} />
      <group ref={jets} position-y={1.36} userData={{ noBatch: true }}>
        <Part g={capsule(0.07, 0.35)} c="#e6fbff" p={[0, 0.25, 0]} shadow={false} />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <Part
              key={i}
              g={capsule(0.035, 0.32)}
              c="#d4f6ff"
              p={[Math.cos(a) * 0.35, 0.05, Math.sin(a) * 0.35]}
              r={[Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]}
              shadow={false}
            />
          )
        })}
      </group>
    </group>
  )
}

/** 75-day challenge board: a wooden notice board with one pin per day. */
function ChallengeBoard({ p, ry }: { p: V3; ry: number }) {
  const day = useStore((s) => s.people.me.day)
  const pins = useMemo(() => Array.from({ length: 75 }, (_, i) => i), [])
  return (
    <group position={p} rotation-y={ry}>
      {[-0.7, 0.7].map((x) => (
        <Part key={x} g={roundedBox(0.1, 1.5, 0.1, 0.03)} c={palette.woodDark} p={[x, 0.75, 0]} />
      ))}
      <Part g={roundedBox(1.6, 0.9, 0.08, 0.04)} c={palette.wood} p={[0, 1.15, 0.03]} />
      <Part g={roundedBox(1.45, 0.75, 0.04, 0.03)} c="#fff6e2" p={[0, 1.15, 0.07]} shadow={false} />
      <Part g={roofGeo(1.85, 0.35, 0.3, 0.03)} m={roofMat('#e26f55')} p={[0, 1.6, 0.03]} />
      {pins.map((i) => {
        const col = i % 15
        const row = Math.floor(i / 15)
        const done = i < day
        return (
          <mesh
            key={i}
            geometry={sphere(0.028, 8, 6)}
            material={mat(done ? (i === day - 1 ? palette.goldDeep : '#4cc2b0') : '#e3d8c4')}
            position={[-0.63 + col * 0.09, 1.42 - row * 0.12, 0.1]}
          />
        )
      })}
    </group>
  )
}

function Plaza() {
  return (
    <StaticBatch>
    <group position={[0, 0, 0.4]}>
      <Fountain />
      <Bench p={[-2.95, 0, -1.3]} ry={Math.PI / 2 + 0.4} />
      <Bench p={[2.95, 0, -1.3]} ry={-Math.PI / 2 - 0.4} />
      <ChallengeBoard p={[1.85, 0, -2.75]} ry={-0.59} />
      <Lamp p={[-2.6, 0, 1.9]} />
      <Lamp p={[2.6, 0, 1.9]} />
      <Lamp p={[-2.0, 0, -2.6]} />
      <Lamp p={[3.2, 0, -0.1]} />
    </group>
    </StaticBatch>
  )
}

export function Buildings() {
  useNightMaterials()
  return (
    <>
      <Home />
      <Gym />
      <Library />
      <Cafe />
      <Park />
      <Plaza />
    </>
  )
}
