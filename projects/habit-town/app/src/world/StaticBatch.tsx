import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Authoring stays declarative (dozens of small <mesh> parts), rendering is batched:
 * on mount every static descendant mesh is baked into one merged mesh per material,
 * relative to this group. Originals are hidden (they still receive raycasts, so
 * pointer events keep working). Subtrees tagged `userData.noBatch` stay live.
 *
 * Typical result: a building drops from ~60 draw calls to ~8.
 */
export function StaticBatch({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null!)

  useLayoutEffect(() => {
    const root = ref.current
    root.updateWorldMatrix(true, true)
    const inv = root.matrixWorld.clone().invert()
    const buckets = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; cast: boolean }>()
    const hidden: THREE.Object3D[] = []
    const rel = new THREE.Matrix4()

    const visit = (o: THREE.Object3D) => {
      if (o.userData.noBatch || !o.visible) return
      const mesh = o as THREE.Mesh
      if (mesh.isMesh && !(o as THREE.InstancedMesh).isInstancedMesh && !Array.isArray(mesh.material)) {
        let g = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()
        for (const name of Object.keys(g.attributes)) {
          if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name)
        }
        if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2))
        if (!g.attributes.normal) g.computeVertexNormals()
        g.clearGroups()
        rel.multiplyMatrices(inv, mesh.matrixWorld)
        g = g.applyMatrix4(rel)
        const m = mesh.material as THREE.Material
        const b = buckets.get(m) ?? { geos: [], cast: false }
        b.geos.push(g)
        b.cast ||= mesh.castShadow
        buckets.set(m, b)
        hidden.push(mesh)
      }
      for (const c of o.children) visit(c)
    }
    for (const c of root.children) visit(c)

    const merged: THREE.Mesh[] = []
    for (const [material, { geos, cast }] of buckets) {
      const geometry = mergeGeometries(geos, false)
      geos.forEach((g) => g.dispose())
      if (!geometry) continue
      const m = new THREE.Mesh(geometry, material)
      m.castShadow = cast
      m.receiveShadow = true
      m.raycast = () => {} // originals handle picking
      merged.push(m)
    }
    hidden.forEach((h) => (h.visible = false))
    merged.forEach((m) => root.add(m))
    return () => {
      merged.forEach((m) => {
        root.remove(m)
        m.geometry.dispose()
      })
      hidden.forEach((h) => (h.visible = true))
    }
  }, [])

  return <group ref={ref}>{children}</group>
}
