import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { buildingById } from '../data/world'
import { useStore } from '../store'
import { DT_MAX, characterNodes, prefersReducedMotion } from '../systems/registry'
import { palette } from '../tokens'

/**
 * Particle pools (confetti, hearts, sparkles). Fixed-size, zero allocation per frame:
 * particles live in typed arrays and are written into instanced matrices.
 */
interface Pool {
  pos: Float32Array
  vel: Float32Array
  rot: Float32Array
  spin: Float32Array
  life: Float32Array
  max: Float32Array
  size: Float32Array
  next: number
}

function makePool(n: number): Pool {
  return {
    pos: new Float32Array(n * 3),
    vel: new Float32Array(n * 3),
    rot: new Float32Array(n * 3),
    spin: new Float32Array(n * 3),
    life: new Float32Array(n),
    max: new Float32Array(n).fill(1),
    size: new Float32Array(n),
    next: 0,
  }
}

const dummy = new THREE.Object3D()
const col = new THREE.Color()
const confettiColors = [palette.gold, '#ff8fab', '#4cc2b0', '#7ab8f5', '#c48bdc', '#ffffff', '#ff9f6b']

function heartGeometry() {
  const s = new THREE.Shape()
  s.moveTo(0, -0.5)
  s.bezierCurveTo(-0.15, -0.35, -0.55, -0.1, -0.5, 0.2)
  s.bezierCurveTo(-0.45, 0.5, -0.1, 0.55, 0, 0.3)
  s.bezierCurveTo(0.1, 0.55, 0.45, 0.5, 0.5, 0.2)
  s.bezierCurveTo(0.55, -0.1, 0.15, -0.35, 0, -0.5)
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 3, curveSegments: 10 })
  g.center()
  g.computeVertexNormals()
  return g
}

export function Effects() {
  const N_CONF = prefersReducedMotion ? 40 : 140
  const N_HEART = 40
  const confetti = useRef<THREE.InstancedMesh>(null!)
  const hearts = useRef<THREE.InstancedMesh>(null!)
  const stars = useRef<THREE.InstancedMesh>(null!)
  const pc = useMemo(() => makePool(N_CONF), [N_CONF])
  const ph = useMemo(() => makePool(N_HEART), [])
  const ps = useMemo(() => makePool(N_HEART), [])
  const geos = useMemo(
    () => ({
      conf: new THREE.BoxGeometry(0.09, 0.015, 0.14),
      heart: heartGeometry(),
      star: new THREE.OctahedronGeometry(0.5, 0),
    }),
    [],
  )

  const spawnConfetti = (x: number, y: number, z: number) => {
    for (let k = 0; k < N_CONF * 0.7; k++) {
      const i = pc.next
      pc.next = (pc.next + 1) % N_CONF
      const a = Math.random() * Math.PI * 2
      const sp = 1.6 + Math.random() * 3.2
      pc.pos.set([x, y, z], i * 3)
      pc.vel.set([Math.cos(a) * sp, 4.5 + Math.random() * 4, Math.sin(a) * sp], i * 3)
      pc.rot.set([Math.random() * 6, Math.random() * 6, Math.random() * 6], i * 3)
      pc.spin.set([(Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 18], i * 3)
      pc.life[i] = 0
      pc.max[i] = 2.2 + Math.random() * 1.2
      pc.size[i] = 0.8 + Math.random() * 0.6
      confetti.current.setColorAt(i, col.set(confettiColors[i % confettiColors.length]))
    }
    if (confetti.current.instanceColor) confetti.current.instanceColor.needsUpdate = true
  }

  const spawnFloat = (pool: Pool, n: number, x: number, y: number, z: number, size: number) => {
    for (let k = 0; k < n; k++) {
      const i = pool.next
      pool.next = (pool.next + 1) % N_HEART
      pool.pos.set([x + (Math.random() - 0.5) * 0.6, y + Math.random() * 0.2, z + (Math.random() - 0.5) * 0.6], i * 3)
      pool.vel.set([(Math.random() - 0.5) * 0.6, 1.1 + Math.random() * 0.7, (Math.random() - 0.5) * 0.6], i * 3)
      pool.rot.set([0, Math.random() * 6, 0], i * 3)
      pool.spin.set([0, (Math.random() - 0.5) * 3, 0], i * 3)
      pool.life[i] = -k * 0.08 // stagger
      pool.max[i] = 1.6 + Math.random() * 0.4
      pool.size[i] = size * (0.8 + Math.random() * 0.5)
    }
  }

  useEffect(
    () =>
      useStore.subscribe((s, prev) => {
        const c = s.celebrations[s.celebrations.length - 1]
        if (c && c !== prev.celebrations[prev.celebrations.length - 1]) {
          const node = characterNodes.get(c.personId)
          const b = buildingById[c.habit]
          const at = node ? node.position : new THREE.Vector3(b.pos[0], 0, b.pos[1])
          spawnConfetti(at.x, at.y + 2.4, at.z)
          spawnFloat(ps, 10, at.x, at.y + 1.6, at.z, 0.14)
        }
        const r = s.reactions[s.reactions.length - 1]
        if (r && r !== prev.reactions[prev.reactions.length - 1]) {
          const node = characterNodes.get(r.personId)
          if (node) {
            if (r.kind === 'heart') spawnFloat(ph, 7, node.position.x, node.position.y + 1.3, node.position.z, 0.2)
            else spawnFloat(ps, 9, node.position.x, node.position.y + 1.3, node.position.z, 0.13)
          }
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, DT_MAX)
    const cam = state.camera
    // confetti: gravity + strong air drag + flutter
    for (let i = 0; i < N_CONF; i++) {
      let s = 0
      if (pc.life[i] < pc.max[i]) {
        pc.life[i] += dt
        const o = i * 3
        pc.vel[o + 1] -= 9.8 * dt
        const drag = Math.exp(-2.4 * dt)
        pc.vel[o] *= drag
        pc.vel[o + 2] *= drag
        if (pc.vel[o + 1] < -1.2) pc.vel[o + 1] = -1.2 // terminal velocity → flutter down
        pc.pos[o] += (pc.vel[o] + Math.sin(pc.life[i] * 7 + i) * 0.4) * dt
        pc.pos[o + 1] = Math.max(0.02, pc.pos[o + 1] + pc.vel[o + 1] * dt)
        pc.pos[o + 2] += pc.vel[o + 2] * dt
        for (let k = 0; k < 3; k++) pc.rot[o + k] += pc.spin[o + k] * dt
        const remain = pc.max[i] - pc.life[i]
        s = pc.size[i] * Math.min(1, remain / 0.5)
        dummy.position.set(pc.pos[o], pc.pos[o + 1], pc.pos[o + 2])
        dummy.rotation.set(pc.rot[o], pc.rot[o + 1], pc.rot[o + 2])
      }
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      confetti.current.setMatrixAt(i, dummy.matrix)
    }
    confetti.current.instanceMatrix.needsUpdate = true

    // floating hearts / sparkles: rise, wobble, billboard toward camera, pop out
    for (const [pool, mesh] of [
      [ph, hearts.current],
      [ps, stars.current],
    ] as const) {
      for (let i = 0; i < N_HEART; i++) {
        let s = 0
        if (pool.life[i] < pool.max[i]) {
          pool.life[i] += dt
          const o = i * 3
          if (pool.life[i] > 0) {
            pool.pos[o] += pool.vel[o] * dt
            pool.pos[o + 1] += pool.vel[o + 1] * dt
            pool.pos[o + 2] += pool.vel[o + 2] * dt
            pool.vel[o + 1] *= Math.exp(-1.2 * dt)
            const lt = pool.life[i] / pool.max[i]
            const appear = Math.min(1, pool.life[i] / 0.18)
            const pop = 1 + Math.sin(Math.min(1, pool.life[i] / 0.25) * Math.PI) * 0.35
            s = pool.size[i] * appear * pop * (lt > 0.75 ? 1 - (lt - 0.75) / 0.25 : 1)
            dummy.position.set(pool.pos[o] + Math.sin(pool.life[i] * 5 + i) * 0.08, pool.pos[o + 1], pool.pos[o + 2])
            dummy.quaternion.copy(cam.quaternion)
            dummy.rotateZ(Math.sin(pool.life[i] * 4 + i) * 0.3)
            if (pool === ps) dummy.rotateY(pool.life[i] * 4)
          }
        }
        dummy.scale.setScalar(s)
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh ref={confetti} args={[geos.conf, undefined, N_CONF]} frustumCulled={false} castShadow>
        <meshStandardMaterial roughness={0.5} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={hearts} args={[geos.heart, undefined, N_HEART]} frustumCulled={false}>
        <meshStandardMaterial color={palette.heart} emissive={palette.heart} emissiveIntensity={0.6} roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={stars} args={[geos.star, undefined, N_HEART]} frustumCulled={false}>
        <meshStandardMaterial color={palette.gold} emissive={palette.gold} emissiveIntensity={1.6} roughness={0.3} />
      </instancedMesh>
    </group>
  )
}
