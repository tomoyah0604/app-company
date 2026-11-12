import { useMemo } from 'react'
import * as THREE from 'three'
import { ISLAND_RADIUS, PLAZA_CENTER, PLAZA_RADIUS, TRACK, islandRadiusAt, mulberry32, roads } from '../data/world'
import { palette } from '../tokens'

const TEX_SPAN = ISLAND_RADIUS + 1.5 // world half-extent covered by the ground texture

function islandShape(radius: number, segments = 160) {
  const s = new THREE.Shape()
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * Math.PI * 2
    const r = islandRadiusAt(t, radius)
    // shape y = -world z (the mesh is rotated -90° about X)
    const x = Math.cos(t) * r
    const y = -Math.sin(t) * r
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  return s
}

function slab(radius: number, depth: number, bevel: number) {
  const g = new THREE.ExtrudeGeometry(islandShape(radius), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 160,
  })
  g.rotateX(-Math.PI / 2)
  g.computeVertexNormals()
  return g
}

/**
 * Paints the island top: soft grass variation, dirt roads with darker edges,
 * the paved plaza and the running track. Painting (rather than stacking meshes)
 * gives soft edges and zero z-fighting for one draw call.
 */
function useGroundTexture(size: number) {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')!
    const ppm = size / (TEX_SPAN * 2) // pixels per metre
    const X = (x: number) => (x + TEX_SPAN) * ppm
    const Z = (z: number) => (z + TEX_SPAN) * ppm
    const rnd = mulberry32(3)

    ctx.fillStyle = palette.grass
    ctx.fillRect(0, 0, size, size)

    // large soft colour variation
    for (let i = 0; i < 260; i++) {
      const x = rnd() * size
      const y = rnd() * size
      const r = (0.8 + rnd() * 2.6) * ppm
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      const c = rnd() < 0.5 ? palette.grassLight : palette.grassDark
      g.addColorStop(0, c + '55')
      g.addColorStop(1, c + '00')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    // tiny grass specks
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = rnd() < 0.5 ? '#9fd27a66' : '#5f9e4a44'
      const x = rnd() * size
      const y = rnd() * size
      ctx.fillRect(x, y, ppm * 0.06, ppm * 0.14)
    }

    const strokeRoad = (pts: [number, number][], width: number, color: string) => {
      ctx.strokeStyle = color
      ctx.lineWidth = width * ppm
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      // smooth with quadratic curves through midpoints
      ctx.moveTo(X(pts[0][0]), Z(pts[0][1]))
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i][0] + pts[i + 1][0]) / 2
        const mz = (pts[i][1] + pts[i + 1][1]) / 2
        ctx.quadraticCurveTo(X(pts[i][0]), Z(pts[i][1]), X(mx), Z(mz))
      }
      const last = pts[pts.length - 1]
      ctx.lineTo(X(last[0]), Z(last[1]))
      ctx.stroke()
    }

    // soft grass shadow under the road edges
    ctx.filter = `blur(${ppm * 0.12}px)`
    for (const r of roads) strokeRoad(r, 1.55, '#5f9e4a88')
    ctx.filter = 'none'
    for (const r of roads) strokeRoad(r, 1.32, palette.pathEdge)
    for (const r of roads) strokeRoad(r, 1.1, palette.path)

    // plaza
    const px = X(PLAZA_CENTER[0])
    const pz = Z(PLAZA_CENTER[1])
    ctx.filter = `blur(${ppm * 0.12}px)`
    ctx.fillStyle = '#5f9e4a88'
    ctx.beginPath()
    ctx.arc(px, pz, (PLAZA_RADIUS + 0.25) * ppm, 0, Math.PI * 2)
    ctx.fill()
    ctx.filter = 'none'
    ctx.fillStyle = palette.pathEdge
    ctx.beginPath()
    ctx.arc(px, pz, (PLAZA_RADIUS + 0.12) * ppm, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = palette.plaza
    ctx.beginPath()
    ctx.arc(px, pz, PLAZA_RADIUS * ppm, 0, Math.PI * 2)
    ctx.fill()
    // radial paving pattern
    ctx.strokeStyle = palette.plazaLine
    ctx.lineWidth = ppm * 0.035
    for (const rr of [1.75, 2.45, 3.05]) {
      ctx.beginPath()
      ctx.arc(px, pz, rr * ppm, 0, Math.PI * 2)
      ctx.stroke()
    }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2
      const r0 = i % 2 ? 1.75 : 2.45
      ctx.beginPath()
      ctx.moveTo(px + Math.cos(a) * r0 * ppm, pz + Math.sin(a) * r0 * ppm)
      ctx.lineTo(px + Math.cos(a) * 3.05 * ppm, pz + Math.sin(a) * 3.05 * ppm)
      ctx.stroke()
    }

    // running track (rubber + lane lines), with a lighter infield
    const tx = X(TRACK.center[0])
    const tz = Z(TRACK.center[1])
    ctx.fillStyle = '#9fd27a'
    ctx.beginPath()
    ctx.ellipse(tx, tz, (TRACK.rx - 0.3) * ppm, (TRACK.rz - 0.3) * ppm, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.filter = `blur(${ppm * 0.1}px)`
    ctx.strokeStyle = '#5f9e4a88'
    ctx.lineWidth = (TRACK.width + 0.25) * ppm
    ctx.beginPath()
    ctx.ellipse(tx, tz, TRACK.rx * ppm, TRACK.rz * ppm, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.filter = 'none'
    ctx.strokeStyle = '#e78f6c'
    ctx.lineWidth = TRACK.width * ppm
    ctx.beginPath()
    ctx.ellipse(tx, tz, TRACK.rx * ppm, TRACK.rz * ppm, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = '#fff6ea'
    ctx.lineWidth = ppm * 0.04
    for (const off of [-TRACK.width / 2 + 0.05, 0, TRACK.width / 2 - 0.05]) {
      ctx.setLineDash(off === 0 ? [ppm * 0.25, ppm * 0.2] : [])
      ctx.beginPath()
      ctx.ellipse(tx, tz, (TRACK.rx + off) * ppm, (TRACK.rz + off) * ppm, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.setLineDash([])

    // pebbles on roads
    for (let i = 0; i < 1400; i++) {
      const road = roads[Math.floor(rnd() * roads.length)]
      const seg = Math.floor(rnd() * (road.length - 1))
      const t = rnd()
      const x = road[seg][0] + (road[seg + 1][0] - road[seg][0]) * t + (rnd() - 0.5) * 0.9
      const z = road[seg][1] + (road[seg + 1][1] - road[seg][1]) * t + (rnd() - 0.5) * 0.9
      ctx.fillStyle = rnd() < 0.5 ? '#d8c08f' : '#f4e6c4'
      ctx.beginPath()
      ctx.arc(X(x), Z(z), ppm * (0.025 + rnd() * 0.03), 0, Math.PI * 2)
      ctx.fill()
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    // Extrude cap UVs are raw shape coords → remap to 0..1
    tex.repeat.set(1 / (TEX_SPAN * 2), 1 / (TEX_SPAN * 2))
    tex.offset.set(0.5, 0.5)
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
    return tex
  }, [size])
}

export function Island({ quality }: { quality: 'high' | 'low' }) {
  const groundTex = useGroundTexture(quality === 'high' ? 2048 : 1024)

  const { grass, earth, sand, grassMats, earthMat, sandMat } = useMemo(() => {
    const grassMats = [
      new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.95 }),
      new THREE.MeshStandardMaterial({ color: palette.grassSide, roughness: 0.9 }),
    ]
    return {
      grass: slab(ISLAND_RADIUS, 0.05, 0.2),
      earth: slab(ISLAND_RADIUS - 0.05, 0.9, 0.12),
      sand: slab(ISLAND_RADIUS + 0.9, 0.1, 0.25),
      grassMats,
      earthMat: new THREE.MeshStandardMaterial({ color: palette.earth, roughness: 0.95 }),
      sandMat: new THREE.MeshStandardMaterial({ color: palette.sand, roughness: 1 }),
    }
  }, [groundTex])

  return (
    <group>
      {/* layered "cake": grass cap (top y=0) overhangs a soil cliff that sits on a sandy beach */}
      <mesh geometry={grass} material={grassMats} position-y={-0.25} receiveShadow />
      <mesh geometry={earth} material={earthMat} position-y={-1.35} receiveShadow />
      <mesh geometry={sand} material={sandMat} position-y={-1.2} receiveShadow />
      <EarthStrata />
    </group>
  )
}

/** A few darker horizontal bands on the cliff so the earth reads as layered soil. */
function EarthStrata() {
  const geom = useMemo(() => slab(ISLAND_RADIUS + 0.04, 0.03, 0.05), [])
  return (
    <mesh geometry={geom} position-y={-0.68}>
      <meshStandardMaterial color={palette.earthDark} roughness={1} />
    </mesh>
  )
}
