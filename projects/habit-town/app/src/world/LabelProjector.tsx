import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'
import { CHARACTER_SCALE, characterNodes, labelNodes } from '../systems/registry'

interface Item {
  id: string
  el: HTMLElement
  x: number
  y: number
  w: number
  h: number
  ty: number
  visible: boolean
}

const LABEL_HEIGHT = 1.6 * CHARACTER_SCALE

/**
 * Projects every character's head into screen space and lays out the DOM nameplates.
 * Labels are de-overlapped greedily (front-most keeps its place, others stack upward),
 * and their offsets are smoothed so they never jitter.
 */
export function LabelProjector() {
  const v = useMemo(() => new THREE.Vector3(), [])
  const smooth = useMemo(() => new Map<string, number>(), [])

  useFrame(({ camera, size }, dt) => {
    const items: Item[] = []
    // 1) reads
    for (const [id, node] of characterNodes) {
      const el = labelNodes.get(id)
      if (!el) continue
      v.copy(node.position)
      v.y += LABEL_HEIGHT
      v.project(camera)
      items.push({
        id,
        el,
        x: ((v.x + 1) / 2) * size.width,
        y: ((1 - v.y) / 2) * size.height,
        w: el.offsetWidth,
        h: el.offsetHeight,
        ty: 0,
        visible: v.z < 1 && v.z > -1,
      })
    }
    // 2) layout: nearest to the camera (lowest on screen) wins its spot
    items.sort((a, b) => b.y - a.y)
    const placed: Item[] = []
    for (const it of items) {
      it.ty = it.y
      for (let guard = 0; guard < 8; guard++) {
        let moved = false
        for (const p of placed) {
          const overlapX = Math.abs(p.x - it.x) < (p.w + it.w) / 2 + 2
          const overlapY = Math.abs(p.ty - it.ty) < (p.h + it.h) / 2 + 1
          if (overlapX && overlapY) {
            it.ty = p.ty - (p.h + it.h) / 2 - 3
            moved = true
          }
        }
        if (!moved) break
      }
      placed.push(it)
    }
    // 3) writes
    const k = 1 - Math.exp(-dt * 14)
    for (const it of items) {
      const prev = smooth.get(it.id)
      const y = prev === undefined ? it.ty : prev + (it.ty - prev) * k
      smooth.set(it.id, y)
      const lifted = it.ty < it.y - 1
      it.el.style.transform = `translate3d(${it.x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`
      it.el.style.zIndex = String(Math.round(it.y))
      it.el.style.visibility = it.visible ? 'visible' : 'hidden'
      it.el.dataset.lifted = lifted ? '1' : '0'
      const node = characterNodes.get(it.id)
      it.el.dataset.moving = node?.userData.moving ? '1' : '0'
    }
  })
  return null
}
