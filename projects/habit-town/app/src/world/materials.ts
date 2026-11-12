import * as THREE from 'three'
import { material } from '../tokens'

/**
 * Material + geometry caches. Every mesh with the same colour shares one material,
 * which keeps program switches and GC down.
 */
const cache = new Map<string, THREE.MeshStandardMaterial>()

export function mat(color: string, opts: { roughness?: number; emissive?: string; emissiveIntensity?: number } = {}) {
  const key = `${color}|${opts.roughness ?? ''}|${opts.emissive ?? ''}|${opts.emissiveIntensity ?? ''}`
  let m = cache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: opts.roughness ?? material.roughness,
      metalness: 0,
      emissive: opts.emissive ?? '#000000',
      emissiveIntensity: opts.emissiveIntensity ?? 1,
    })
    cache.set(key, m)
  }
  return m
}

const geoCache = new Map<string, THREE.BufferGeometry>()
export function geo<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geoCache.get(key)
  if (!g) {
    g = make()
    geoCache.set(key, g)
  }
  return g as T
}

/** Rounded box with real bevels (miniature-model look). */
export function roundedBox(w: number, h: number, d: number, r = 0.08, seg = 3) {
  return geo(`rb${w}_${h}_${d}_${r}_${seg}`, () => {
    const shape = new THREE.Shape()
    const x = -w / 2 + r
    const y = -h / 2 + r
    const ww = w - 2 * r
    const hh = h - 2 * r
    shape.moveTo(x, y)
    shape.lineTo(x + ww, y)
    shape.lineTo(x + ww, y + hh)
    shape.lineTo(x, y + hh)
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.001, d - 2 * r),
      bevelEnabled: true,
      bevelThickness: r,
      bevelSize: r,
      bevelSegments: seg,
      curveSegments: seg,
    })
    g.translate(0, 0, -(d - 2 * r) / 2)
    g.computeVertexNormals()
    return g
  })
}

/** Triangular prism roof with soft bevel. width along X, depth along Z. */
export function roofGeo(w: number, h: number, d: number, r = 0.07) {
  return geo(`roof${w}_${h}_${d}_${r}`, () => {
    const s = new THREE.Shape()
    s.moveTo(-w / 2 + r, 0)
    s.lineTo(w / 2 - r, 0)
    s.lineTo(0, h - r)
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, {
      depth: d - 2 * r,
      bevelEnabled: true,
      bevelThickness: r,
      bevelSize: r,
      bevelSegments: 3,
    })
    g.translate(0, 0, -(d - 2 * r) / 2)
    g.computeVertexNormals()
    return g
  })
}

export const sphere = (r = 1, w = 24, h = 16) => geo(`sph${r}_${w}_${h}`, () => new THREE.SphereGeometry(r, w, h))
export const cyl = (rt: number, rb: number, h: number, seg = 20) =>
  geo(`cyl${rt}_${rb}_${h}_${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg))
export const capsule = (r: number, len: number) => geo(`cap${r}_${len}`, () => new THREE.CapsuleGeometry(r, len, 6, 14))
export const cone = (r: number, h: number, seg = 18) => geo(`cone${r}_${h}_${seg}`, () => new THREE.ConeGeometry(r, h, seg))
export const torus = (r: number, t: number, arc = Math.PI * 2) =>
  geo(`tor${r}_${t}_${arc}`, () => new THREE.TorusGeometry(r, t, 10, 28, arc))
export const ico = (r: number, detail = 1) => geo(`ico${r}_${detail}`, () => new THREE.IcosahedronGeometry(r, detail))

/* ---------- procedural shingles (tinted by material colour) ---------- */
let shingleTex: THREE.CanvasTexture | null = null
function shingles() {
  if (shingleTex) return shingleTex
  const S = 256
  const c = document.createElement('canvas')
  c.width = c.height = S
  const g = c.getContext('2d')!
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, S, S)
  const rows = 4
  const rh = S / rows
  const cols = 5
  const cw = S / cols
  for (let r = 0; r < rows; r++) {
    const off = r % 2 ? cw / 2 : 0
    for (let k = -1; k <= cols; k++) {
      const x = k * cw + off
      const y = r * rh
      // each shingle: soft vertical gradient + rounded bottom edge shadow
      const grad = g.createLinearGradient(0, y, 0, y + rh)
      grad.addColorStop(0, '#f2f2f2')
      grad.addColorStop(0.75, '#ffffff')
      grad.addColorStop(1, '#c9c9c9')
      g.fillStyle = grad
      g.beginPath()
      g.moveTo(x + 2, y)
      g.lineTo(x + cw - 2, y)
      g.lineTo(x + cw - 2, y + rh - 14)
      g.quadraticCurveTo(x + cw - 2, y + rh - 2, x + cw / 2, y + rh - 2)
      g.quadraticCurveTo(x + 2, y + rh - 2, x + 2, y + rh - 14)
      g.closePath()
      g.fill()
    }
    g.fillStyle = 'rgba(0,0,0,0.12)'
    g.fillRect(0, r * rh + rh - 3, S, 3)
  }
  shingleTex = new THREE.CanvasTexture(c)
  shingleTex.colorSpace = THREE.SRGBColorSpace
  shingleTex.wrapS = shingleTex.wrapT = THREE.RepeatWrapping
  shingleTex.center.set(0.5, 0.5)
  shingleTex.rotation = Math.PI / 2 // extrude side UVs run across the slope
  shingleTex.repeat.set(1.6, 1.6)
  shingleTex.anisotropy = 8
  return shingleTex
}

export function roofMat(color: string) {
  const key = `roof|${color}`
  let m = cache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: 0.8, map: shingles() })
    cache.set(key, m)
  }
  return m
}
