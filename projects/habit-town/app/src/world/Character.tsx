import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import * as THREE from 'three'
import type { HabitId, Look } from '../data/habits'
import { TRACK, plazaSpot, route, spotFor, trackPoint } from '../data/world'
import type { Vec2 } from '../data/world'
import { useStore } from '../store'
import { CHARACTER_SCALE, DT_MAX, characterNodes, hash } from '../systems/registry'
import { motion, palette } from '../tokens'
import { capsule, cone, cyl, geo, mat, roundedBox, sphere, torus } from './materials'
import { damp, dampAngle, stepSpring } from './springs'
import { StaticBatch } from './StaticBatch'

/* ---------------- geometry shared by every character ---------------- */
const hairCap = geo('hairCap', () => new THREE.SphereGeometry(0.352, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.56))
const hairMats = new Map<string, THREE.MeshStandardMaterial>()
function hairMat(color: string) {
  let m = hairMats.get(color)
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.65, side: THREE.DoubleSide })
    hairMats.set(color, m)
  }
  return m
}
const hitGeo = geo('hit', () => new THREE.CapsuleGeometry(0.42, 0.6, 4, 8))
const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })

const TRACK_PERIMETER = 2 * Math.PI * Math.sqrt((TRACK.rx ** 2 + TRACK.rz ** 2) / 2)

type Mode = 'walk' | 'arrived' | 'run'

interface Motion {
  mode: Mode
  curve: THREE.CatmullRomCurve3 | null
  length: number
  s: number
  goal: { pos: Vec2; yaw: number; y: number }
  yaw: number
  runT: number
  phase: number
  sit: number
  blinkT: number
  idleT: number
  wanderSlot: number
  cheer: number
  hop: { x: number; v: number }
  pendingArrive: HabitId | null
  speed: number
}

function goalFor(activity: HabitId | null, slot: number) {
  if (activity === 'run') {
    const tp = trackPoint((slot * 0.27) % 1, (slot % 2) * 0.16 - 0.08)
    return { pos: tp.pos, yaw: tp.yaw, y: 0 }
  }
  if (activity) {
    const s = spotFor(activity, slot)!
    return { pos: s.pos, yaw: s.yaw, y: s.y ?? 0 }
  }
  const p = plazaSpot(slot)
  return { pos: p.pos, yaw: p.yaw, y: 0 }
}

/* ---------------- the character ---------------- */
export const Character = memo(function Character({ id }: { id: string }) {
  const person = useStore((s) => s.people[id])
  const selected = useStore((s) => s.selected === id)
  const select = useStore((s) => s.select)
  const { look, activity, slot, isMe } = person
  const seed = useMemo(() => hash(id), [id])

  const root = useRef<THREE.Group>(null!)
  const body = useRef<THREE.Group>(null!)
  const hips = useRef<THREE.Group>(null!)
  const torso = useRef<THREE.Group>(null!)
  const head = useRef<THREE.Group>(null!)
  const armL = useRef<THREE.Group>(null!)
  const armR = useRef<THREE.Group>(null!)
  const legL = useRef<THREE.Group>(null!)
  const legR = useRef<THREE.Group>(null!)
  const eyes = useRef<THREE.Group>(null!)
  const propDumbL = useRef<THREE.Group>(null!)
  const propDumbR = useRef<THREE.Group>(null!)
  const propBook = useRef<THREE.Group>(null!)
  const propCup = useRef<THREE.Group>(null!)
  const ring = useRef<THREE.Mesh>(null!)

  const m = useRef<Motion>({
    mode: 'arrived',
    curve: null,
    length: 0,
    s: 0,
    goal: goalFor(activity, slot),
    yaw: 0,
    runT: 0,
    phase: seed * 10,
    sit: 0,
    blinkT: 1 + seed * 3,
    idleT: 8 + seed * 12,
    wanderSlot: slot,
    cheer: 0,
    hop: { x: 0, v: 0 },
    pendingArrive: null,
    speed: motion.walkSpeed * (0.92 + seed * 0.16),
  })

  // place on mount, register transform
  useLayoutEffect(() => {
    const g = goalFor(activity, slot)
    root.current.scale.setScalar(CHARACTER_SCALE)
    root.current.position.set(g.pos[0], g.y, g.pos[1])
    m.current.yaw = g.yaw
    m.current.goal = g
    m.current.mode = activity === 'run' ? 'run' : 'arrived'
    m.current.runT = (slot * 0.27) % 1
    m.current.sit = activity === 'read' || activity === 'study' ? 1 : 0
    characterNodes.set(id, root.current)
    return () => {
      characterNodes.delete(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const walkTo = (goal: { pos: Vec2; yaw: number; y: number }) => {
    const mm = m.current
    const p = root.current.position
    const pts = route([p.x, p.z], goal.pos)
    // per-person lane offset so walkers don't overlap on the road
    const lane = (seed - 0.5) * 0.5
    const v3 = pts.map((q, i) => {
      if (i === 0 || i === pts.length - 1) return new THREE.Vector3(q[0], 0, q[1])
      const a = pts[i - 1]
      const b = pts[i + 1]
      const dx = b[0] - a[0]
      const dz = b[1] - a[1]
      const l = Math.hypot(dx, dz) || 1
      return new THREE.Vector3(q[0] - (dz / l) * lane, 0, q[1] + (dx / l) * lane)
    })
    v3[0].y = p.y
    v3[v3.length - 1].y = goal.y
    mm.curve = new THREE.CatmullRomCurve3(v3, false, 'centripetal', 0.5)
    mm.length = mm.curve.getLength()
    mm.s = 0
    mm.goal = goal
    mm.mode = 'walk'
  }

  // activity changed → walk somewhere
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const g = goalFor(activity, slot)
    m.current.pendingArrive = activity
    m.current.wanderSlot = slot
    walkTo(g)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, slot])

  // react to celebrations / reactions aimed at this character
  useEffect(
    () =>
      useStore.subscribe((s, prev) => {
        const c = s.celebrations[s.celebrations.length - 1]
        if (c && c !== prev.celebrations[prev.celebrations.length - 1] && c.personId === id) {
          m.current.cheer = 1.5
          m.current.hop.v += 9
        }
        const r = s.reactions[s.reactions.length - 1]
        if (r && r !== prev.reactions[prev.reactions.length - 1] && r.personId === id) {
          m.current.hop.v += 7
        }
      }),
    [id],
  )

  const tmpV = useMemo(() => new THREE.Vector3(), [])
  const tmpT = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, DT_MAX)
    const t = state.clock.elapsedTime
    const mm = m.current
    const pos = root.current.position
    const act = useStore.getState().people[id]?.activity ?? null

    /* ---- locomotion ---- */
    let moving = 0 // 0 idle, 1 walk, 2 run
    if (mm.mode === 'walk' && mm.curve) {
      // ease in at the start, ease out on arrival
      const remain = mm.length - mm.s
      const accel = Math.min(1, mm.s / 0.5 + 0.35) * Math.min(1, remain / 0.6 + 0.25)
      mm.s += mm.speed * accel * dt
      const u = Math.min(1, mm.s / mm.length)
      mm.curve.getPointAt(u, tmpV)
      mm.curve.getTangentAt(u, tmpT)
      pos.copy(tmpV)
      mm.yaw = dampAngle(mm.yaw, Math.atan2(tmpT.x, tmpT.z), motion.turnRate, dt)
      moving = 1
      mm.phase += dt * mm.speed * accel * motion.stepFrequency
      if (u >= 1) {
        if (act === 'run') {
          mm.mode = 'run'
          mm.runT = (slot * 0.27) % 1
        } else mm.mode = 'arrived'
        if (mm.pendingArrive) {
          useStore.getState().arrive(id, mm.pendingArrive)
          mm.pendingArrive = null
        }
      }
    } else if (mm.mode === 'run') {
      mm.runT = (mm.runT + (motion.runSpeed / TRACK_PERIMETER) * dt) % 1
      const lane = (slot % 2) * 0.16 - 0.08
      const tp = trackPoint(mm.runT, lane)
      pos.set(tp.pos[0], 0, tp.pos[1])
      mm.yaw = dampAngle(mm.yaw, tp.yaw, motion.turnRate, dt)
      mm.phase += dt * motion.runSpeed * motion.stepFrequency * 0.85
      moving = 2
    } else {
      mm.yaw = dampAngle(mm.yaw, mm.goal.yaw, 6, dt)
      pos.y = damp(pos.y, mm.goal.y, 10, dt)
      // idle plaza people occasionally wander to a new spot
      if (act === null) {
        mm.idleT -= dt
        if (mm.idleT <= 0) {
          mm.idleT = 9 + Math.random() * 14
          mm.wanderSlot = (mm.wanderSlot + 1 + Math.floor(Math.random() * 5)) % 14
          walkTo(goalFor(null, mm.wanderSlot))
        }
      }
    }
    root.current.rotation.y = mm.yaw

    /* ---- pose ---- */
    const arrived = mm.mode === 'arrived'
    const sitting = arrived && (act === 'read' || act === 'study')
    mm.sit = damp(mm.sit, sitting ? 1 : 0, 8, dt)
    const sit = mm.sit
    mm.cheer = Math.max(0, mm.cheer - dt)
    const cheer = mm.cheer > 0 ? Math.min(1, mm.cheer * 3) : 0
    const hop = stepSpring(mm.hop, 0, 160, 9, dt)

    const ph = mm.phase * Math.PI
    const swing = moving === 2 ? 1.0 : moving === 1 ? 0.62 : 0
    const sinp = Math.sin(ph)
    const bob = moving ? Math.abs(Math.cos(ph)) * (moving === 2 ? 0.075 : 0.045) : 0
    const breathe = Math.sin(t * 2.2 + seed * 6) * 0.012

    // legs
    let legLx = sinp * swing
    let legRx = -sinp * swing
    // arms
    let armLx = -sinp * swing * 0.85
    let armRx = sinp * swing * 0.85
    let armLz = 0.12
    let armRz = -0.12
    let lean = moving === 2 ? 0.2 : moving === 1 ? 0.07 : 0
    let headX = 0
    let headY = 0
    let hipY = bob
    let squat = 0

    if (arrived && !moving) {
      if (act === 'gym') {
        // dumbbell press with a squat
        const c = (Math.sin(t * 3.4 + seed * 4) + 1) / 2
        armLx = -2.75 + c * 1.3
        armRx = -2.75 + c * 1.3
        armLz = 0.32
        armRz = -0.32
        squat = (1 - c) * 0.07
        headX = -0.12
      } else if (act === null) {
        // idle: occasional look around + stretch
        headY = Math.sin(t * 0.6 + seed * 9) * 0.45 * Math.max(0, Math.sin(t * 0.21 + seed * 5))
        const stretch = Math.max(0, Math.sin(t * 0.33 + seed * 13) - 0.92) * 12.5
        armLx = -stretch * 2.9
        armRx = -stretch * 2.9
        armLz = 0.12 + stretch * 0.25
        armRz = -0.12 - stretch * 0.25
      }
    }
    if (sit > 0.01) {
      legLx = THREE.MathUtils.lerp(legLx, -1.45, sit)
      legRx = THREE.MathUtils.lerp(legRx, -1.45, sit)
      hipY = THREE.MathUtils.lerp(hipY, act === 'study' ? -0.045 : -0.02, sit)
      if (act === 'read') {
        armLx = THREE.MathUtils.lerp(armLx, -1.05, sit)
        armRx = THREE.MathUtils.lerp(armRx, -1.05, sit)
        armLz = THREE.MathUtils.lerp(armLz, -0.38, sit)
        armRz = THREE.MathUtils.lerp(armRz, 0.38, sit)
        headX = THREE.MathUtils.lerp(0, 0.28 + Math.sin(t * 0.7 + seed) * 0.04, sit)
      } else if (act === 'study') {
        const sip = Math.max(0, Math.sin(t * 0.55 + seed * 7) - 0.75) * 4
        armRx = THREE.MathUtils.lerp(armRx, -1.25 + Math.sin(t * 9 + seed) * 0.06, sit)
        armRz = THREE.MathUtils.lerp(armRz, 0.15, sit)
        armLx = THREE.MathUtils.lerp(armLx, -1.15 - sip * 0.9, sit)
        armLz = THREE.MathUtils.lerp(armLz, -0.1 - sip * 0.45, sit)
        headX = THREE.MathUtils.lerp(0, 0.22 - sip * 0.3, sit)
      }
    }
    if (cheer > 0) {
      armLx = THREE.MathUtils.lerp(armLx, -2.9, cheer)
      armRx = THREE.MathUtils.lerp(armRx, -2.9, cheer)
      armLz = THREE.MathUtils.lerp(armLz, 0.45, cheer)
      armRz = THREE.MathUtils.lerp(armRz, -0.45, cheer)
      headX = THREE.MathUtils.lerp(headX, -0.25, cheer)
    }

    legL.current.rotation.x = legLx
    legR.current.rotation.x = legRx
    armL.current.rotation.set(armLx, 0, armLz)
    armR.current.rotation.set(armRx, 0, armRz)
    hips.current.position.y = hipY - squat + Math.max(0, hop) * 0.09
    torso.current.rotation.x = lean
    torso.current.scale.set(1, 1 + breathe + Math.max(0, hop) * 0.02, 1)
    const squash = 1 + Math.min(0, hop) * 0.04
    body.current.scale.set(2 - squash, squash, 2 - squash)
    head.current.rotation.x = damp(head.current.rotation.x, headX + (moving ? Math.sin(ph * 2) * 0.03 : 0), 10, dt)
    head.current.rotation.y = damp(head.current.rotation.y, headY, 4, dt)
    head.current.rotation.z = moving ? Math.sin(ph) * 0.05 : Math.sin(t * 0.9 + seed * 4) * 0.03

    // blink
    mm.blinkT -= dt
    let eyeS = 1
    if (mm.blinkT < 0.12) eyeS = Math.max(0.12, Math.abs(mm.blinkT - 0.06) / 0.06)
    if (mm.blinkT <= 0) mm.blinkT = 2 + Math.random() * 3.5
    if (cheer > 0) eyeS = 0.35 // happy squint
    eyes.current.scale.y = eyeS

    // props
    const showProps = arrived && !moving
    propDumbL.current.visible = propDumbR.current.visible = showProps && act === 'gym'
    propBook.current.visible = sit > 0.6 && act === 'read'
    propCup.current.visible = sit > 0.6 && act === 'study'

    // selection ring
    ring.current.visible = selected
    if (selected) {
      const s = 1 + Math.sin(t * 4) * 0.06
      ring.current.scale.set(s, s, 1)
    }

    root.current.userData.moving = moving
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    select(id)
  }

  return (
    <group ref={root}>
      <mesh geometry={hitGeo} material={hitMat} position-y={0.7} onClick={onClick} />
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.04} visible={false}>
        <ringGeometry args={[0.42, 0.52, 40]} />
        <meshBasicMaterial color={isMe ? palette.gold : '#ffffff'} toneMapped={false} transparent opacity={0.95} />
      </mesh>
      <group ref={body}>
        <group ref={hips}>
          {/* legs */}
          <group ref={legL} position={[-0.09, 0.3, 0]}>
            <StaticBatch>
              <Leg look={look} />
            </StaticBatch>
          </group>
          <group ref={legR} position={[0.09, 0.3, 0]}>
            <StaticBatch>
              <Leg look={look} />
            </StaticBatch>
          </group>
          <group ref={torso} position={[0, 0.3, 0]}>
            <StaticBatch>
              <Torso look={look} />
            </StaticBatch>
            <group ref={armL} position={[0.215, 0.33, 0]}>
              <StaticBatch>
                <Arm look={look} />
              </StaticBatch>
              <group ref={propDumbL} position={[0, -0.29, 0]} visible={false}>
                <SmallDumbbell />
              </group>
              <group ref={propCup} position={[-0.02, -0.29, 0.06]} visible={false}>
                <mesh geometry={cyl(0.055, 0.045, 0.11, 12)} material={mat(palette.white)} castShadow />
              </group>
            </group>
            <group ref={armR} position={[-0.215, 0.33, 0]}>
              <StaticBatch>
                <Arm look={look} />
              </StaticBatch>
              <group ref={propDumbR} position={[0, -0.29, 0]} visible={false}>
                <SmallDumbbell />
              </group>
            </group>
            <group ref={propBook} position={[0, 0.18, 0.3]} rotation-x={-0.55} visible={false}>
              <mesh geometry={roundedBox(0.17, 0.035, 0.24, 0.012)} material={mat(look.accent)} position={[0.085, 0, 0]} rotation-z={-0.18} castShadow />
              <mesh geometry={roundedBox(0.17, 0.035, 0.24, 0.012)} material={mat(look.accent)} position={[-0.085, 0, 0]} rotation-z={0.18} castShadow />
              <mesh geometry={roundedBox(0.15, 0.02, 0.21, 0.008)} material={mat(palette.white)} position={[0.08, 0.025, 0]} rotation-z={-0.18} />
              <mesh geometry={roundedBox(0.15, 0.02, 0.21, 0.008)} material={mat(palette.white)} position={[-0.08, 0.025, 0]} rotation-z={0.18} />
            </group>
            <group ref={head} position={[0, 0.68, 0]}>
              <StaticBatch>
                <Head look={look} eyesRef={eyes} />
              </StaticBatch>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
})

/* ---------------- body parts ---------------- */
function Leg({ look }: { look: Look }) {
  return (
    <group>
      <mesh geometry={capsule(0.075, 0.12)} material={mat(look.pants)} position-y={-0.13} castShadow />
      <mesh geometry={sphere(0.085, 14, 10)} material={mat(look.shoes, { roughness: 0.6 })} position={[0, -0.255, 0.03]} scale={[1, 0.62, 1.35]} castShadow />
    </group>
  )
}

function Torso({ look }: { look: Look }) {
  return (
    <group>
      <mesh geometry={capsule(0.19, 0.12)} material={mat(look.shirt)} position-y={0.22} scale={[1, 1, 0.86]} castShadow />
      <mesh geometry={cyl(0.185, 0.2, 0.13, 20)} material={mat(look.pants)} position-y={0.06} scale={[1, 1, 0.86]} castShadow />
      {/* collar detail */}
      <mesh geometry={torus(0.12, 0.028)} material={mat(palette.white)} position={[0, 0.39, 0.02]} rotation-x={Math.PI / 2 - 0.15} />
    </group>
  )
}

function Arm({ look }: { look: Look }) {
  return (
    <group>
      <mesh geometry={capsule(0.058, 0.15)} material={mat(look.shirt)} position-y={-0.12} castShadow />
      <mesh geometry={sphere(0.066, 12, 10)} material={mat(look.skin)} position-y={-0.26} castShadow />
    </group>
  )
}

function SmallDumbbell() {
  return (
    <group rotation-y={Math.PI / 2}>
      <mesh geometry={cyl(0.018, 0.018, 0.22, 6)} material={mat('#c9ced8')} rotation-z={Math.PI / 2} />
      <mesh geometry={cyl(0.06, 0.06, 0.05, 12)} material={mat('#38404f')} position-x={0.1} rotation-z={Math.PI / 2} castShadow />
      <mesh geometry={cyl(0.06, 0.06, 0.05, 12)} material={mat('#38404f')} position-x={-0.1} rotation-z={Math.PI / 2} castShadow />
    </group>
  )
}

function Head({ look, eyesRef }: { look: Look; eyesRef: RefObject<THREE.Group> }) {
  const hm = hairMat(look.hair)
  return (
    <group>
      <mesh geometry={sphere(0.34, 32, 22)} material={mat(look.skin, { roughness: 0.7 })} castShadow />
      {/* ears */}
      <mesh geometry={sphere(0.07, 10, 8)} material={mat(look.skin, { roughness: 0.7 })} position={[0.33, -0.02, 0]} scale={[0.6, 1, 0.9]} />
      <mesh geometry={sphere(0.07, 10, 8)} material={mat(look.skin, { roughness: 0.7 })} position={[-0.33, -0.02, 0]} scale={[0.6, 1, 0.9]} />
      {/* face */}
      <group ref={eyesRef} position={[0, -0.01, 0]} userData={{ noBatch: true }}>
        <StaticBatch>
        {[-1, 1].map((sx) => (
          <group key={sx} position={[sx * 0.115, 0, 0.3]}>
            <mesh geometry={sphere(0.05, 14, 10)} material={mat(palette.ink, { roughness: 0.3 })} scale={[0.85, 1.25, 0.55]} />
            <mesh geometry={sphere(0.017, 8, 6)} material={mat('#ffffff', { roughness: 0.2, emissive: '#ffffff', emissiveIntensity: 0.4 })} position={[0.016, 0.025, 0.026]} />
          </group>
        ))}
        </StaticBatch>
      </group>
      {[-1, 1].map((sx) => (
        <mesh key={sx} geometry={sphere(0.055, 12, 8)} material={mat('#ff9aa8', { roughness: 0.9 })} position={[sx * 0.2, -0.1, 0.255]} scale={[1.3, 0.7, 0.4]} />
      ))}
      <mesh geometry={torus(0.035, 0.011, Math.PI)} material={mat('#8a3e30')} position={[0, -0.105, 0.322]} rotation={[0.25, 0, Math.PI]} />
      {/* hair */}
      <mesh geometry={hairCap} material={hm} rotation-x={-0.42} castShadow />
      <Hair style={look.hairStyle} m={hm} />
      <Accessory kind={look.accessory} color={look.accent} />
    </group>
  )
}

function Hair({ style, m }: { style: Look['hairStyle']; m: THREE.Material }) {
  const bangs = (
    <>
      <mesh geometry={sphere(0.14, 14, 10)} material={m} position={[-0.13, 0.18, 0.2]} scale={[1.1, 0.55, 0.6]} rotation-z={0.3} />
      <mesh geometry={sphere(0.14, 14, 10)} material={m} position={[0.07, 0.2, 0.22]} scale={[1.3, 0.55, 0.6]} rotation-z={-0.2} />
    </>
  )
  switch (style) {
    case 'short':
      return bangs
    case 'bob':
      return (
        <>
          {bangs}
          <mesh geometry={sphere(0.37, 24, 16)} material={m} position={[0, -0.04, -0.07]} scale={[1.04, 0.86, 0.92]} castShadow />
        </>
      )
    case 'long':
      return (
        <>
          {bangs}
          <mesh geometry={sphere(0.37, 24, 16)} material={m} position={[0, -0.05, -0.08]} scale={[1.04, 0.88, 0.92]} castShadow />
          <mesh geometry={capsule(0.22, 0.2)} material={m} position={[0, -0.3, -0.17]} scale={[1.2, 1, 0.6]} castShadow />
        </>
      )
    case 'bun':
      return (
        <>
          {bangs}
          <mesh geometry={sphere(0.14, 16, 12)} material={m} position={[0, 0.34, -0.12]} castShadow />
        </>
      )
    case 'spiky':
      return (
        <>
          {[
            [0, 0.36, 0.0, 0],
            [0.15, 0.31, 0.05, -0.5],
            [-0.15, 0.31, 0.05, 0.5],
            [0.07, 0.3, -0.16, -0.3],
            [-0.08, 0.3, -0.16, 0.3],
            [0.03, 0.27, 0.2, 0],
          ].map(([x, y, z, rz], i) => (
            <mesh key={i} geometry={cone(0.1, 0.22, 10)} material={m} position={[x, y, z]} rotation={[z * 2, 0, rz]} castShadow />
          ))}
          {bangs}
        </>
      )
  }
}

function Accessory({ kind, color }: { kind: Look['accessory']; color: string }) {
  switch (kind) {
    case 'none':
      return null
    case 'headband':
      return <mesh geometry={torus(0.345, 0.035)} material={mat(color)} position-y={0.13} rotation-x={Math.PI / 2 - 0.25} />
    case 'cap':
      return (
        <group position-y={0.08} rotation-x={-0.1}>
          <mesh geometry={geo('capDome', () => new THREE.SphereGeometry(0.365, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5))} material={mat(color)} castShadow />
          <mesh geometry={cyl(0.24, 0.24, 0.03, 20)} material={mat(color)} position={[0, 0.0, 0.3]} scale={[1, 1, 0.75]} castShadow />
          <mesh geometry={sphere(0.04, 8, 6)} material={mat(palette.white)} position-y={0.36} />
        </group>
      )
    case 'glasses':
      return (
        <group position={[0, -0.01, 0.33]}>
          <mesh geometry={torus(0.075, 0.012)} material={mat('#3d2f26')} position-x={0.115} />
          <mesh geometry={torus(0.075, 0.012)} material={mat('#3d2f26')} position-x={-0.115} />
          <mesh geometry={cyl(0.01, 0.01, 0.08, 6)} material={mat('#3d2f26')} rotation-z={Math.PI / 2} />
        </group>
      )
    case 'flower':
      return (
        <group position={[0.24, 0.2, 0.12]} rotation={[0.3, 0.6, -0.4]}>
          {Array.from({ length: 5 }, (_, i) => {
            const a = (i / 5) * Math.PI * 2
            return <mesh key={i} geometry={sphere(0.045, 10, 8)} material={mat('#ffffff')} position={[Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0]} scale={[1, 1, 0.5]} />
          })}
          <mesh geometry={sphere(0.035, 10, 8)} material={mat(palette.gold)} position-z={0.02} />
        </group>
      )
  }
}

export function Characters() {
  const order = useStore((s) => s.order)
  return (
    <>
      {order.map((id) => (
        <Character key={id} id={id} />
      ))}
    </>
  )
}

