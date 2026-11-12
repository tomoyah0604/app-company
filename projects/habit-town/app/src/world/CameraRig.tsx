import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import CameraControlsImpl from 'camera-controls'

// install only the classes camera-controls needs, so three.js stays tree-shakable
CameraControlsImpl.install({
  THREE: {
    Vector2: THREE.Vector2,
    Vector3: THREE.Vector3,
    Vector4: THREE.Vector4,
    Quaternion: THREE.Quaternion,
    Matrix4: THREE.Matrix4,
    Spherical: THREE.Spherical,
    Box3: THREE.Box3,
    Sphere: THREE.Sphere,
    Raycaster: THREE.Raycaster,
  },
})
import { useStore } from '../store'
import { characterNodes, prefersReducedMotion } from '../systems/registry'

const POLAR = THREE.MathUtils.degToRad(48) // from vertical — classic diorama angle
const OVERVIEW_TARGET = new THREE.Vector3(0, 0, -0.6)

/** Distance that fits `width` metres horizontally at the current aspect. */
function fitDistance(cam: THREE.PerspectiveCamera, width: number, height: number) {
  const vfov = THREE.MathUtils.degToRad(cam.fov)
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * cam.aspect)
  return Math.max(width / 2 / Math.tan(hfov / 2), height / 2 / Math.tan(vfov / 2))
}

function useCameraControls() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const set = useThree((s) => s.set)
  const controls = useMemo(() => {
    const c = new CameraControlsImpl(camera, gl.domElement)
    c.smoothTime = prefersReducedMotion ? 0.05 : 0.45
    c.draggingSmoothTime = 0.12
    c.minPolarAngle = THREE.MathUtils.degToRad(28)
    c.maxPolarAngle = THREE.MathUtils.degToRad(62)
    c.minAzimuthAngle = -0.6
    c.maxAzimuthAngle = 0.6
    c.dollySpeed = 0.6
    c.truckSpeed = 1.6
    c.mouseButtons.left = CameraControlsImpl.ACTION.SCREEN_PAN
    c.mouseButtons.middle = CameraControlsImpl.ACTION.DOLLY
    c.mouseButtons.right = CameraControlsImpl.ACTION.ROTATE
    c.mouseButtons.wheel = CameraControlsImpl.ACTION.DOLLY
    c.touches.one = CameraControlsImpl.ACTION.TOUCH_SCREEN_PAN
    c.touches.two = CameraControlsImpl.ACTION.TOUCH_DOLLY_ROTATE
    c.touches.three = CameraControlsImpl.ACTION.NONE
    return c
  }, [camera, gl])
  useEffect(() => {
    set({ controls: controls as unknown as THREE.EventDispatcher })
    return () => controls.dispose()
  }, [controls, set])
  // update before render (priority -1 keeps R3F's auto-render)
  useFrame((_, dt) => controls.update(dt), -1)
  return controls
}

export function CameraRig() {
  const controls = useCameraControls()
  const ref = useRef(controls)
  ref.current = controls
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const focus = useStore((s) => s.focus)
  const overview = useRef(40)
  const tmp = useRef(new THREE.Vector3())
  /** once the player drags, stop auto-following until the focus target changes */
  const followPaused = useRef(false)

  // frame the island for the current viewport
  useEffect(() => {
    const portrait = size.width < size.height
    const d = fitDistance(camera, portrait ? 17 : 25.5, portrait ? 25 : 17.5)
    overview.current = d
    const c = ref.current
    c.minDistance = d * 0.32
    c.maxDistance = d * 1.15
    if (!useStore.getState().focus) {
      c.setLookAt(
        OVERVIEW_TARGET.x,
        OVERVIEW_TARGET.y + Math.cos(POLAR) * d,
        OVERVIEW_TARGET.z + Math.sin(POLAR) * d,
        OVERVIEW_TARGET.x,
        OVERVIEW_TARGET.y,
        OVERVIEW_TARGET.z,
        false,
      )
    }
  }, [size.width, size.height, camera])

  // focus change → dolly in / back out
  useEffect(() => {
    const c = ref.current
    const animate = !prefersReducedMotion
    followPaused.current = false
    if (focus) {
      c.dollyTo(overview.current * 0.48, animate)
      c.rotatePolarTo(THREE.MathUtils.degToRad(44), animate)
    } else {
      c.dollyTo(overview.current, animate)
      c.rotatePolarTo(POLAR, animate)
      c.moveTo(OVERVIEW_TARGET.x, OVERVIEW_TARGET.y, OVERVIEW_TARGET.z, animate)
    }
  }, [focus])

  // user takes control → stop following
  useEffect(() => {
    const c = ref.current
    const start = () => {
      followPaused.current = true
    }
    c.addEventListener('controlstart', start)
    return () => c.removeEventListener('controlstart', start)
  }, [controls])

  useFrame(() => {
    const c = ref.current
    if (focus && !followPaused.current) {
      const node = characterNodes.get(focus)
      if (node) {
        tmp.current.copy(node.position)
        // aim slightly in front of the character so it sits above the dock / sheet
        const lead = size.width < size.height ? 1.3 : 0.7
        c.moveTo(tmp.current.x, tmp.current.y + 0.5, tmp.current.z + lead, !prefersReducedMotion)
      }
    }
    // keep the target on the island
    c.getTarget(tmp.current)
    const r = Math.hypot(tmp.current.x, tmp.current.z)
    if (r > 9) c.moveTo((tmp.current.x / r) * 9, tmp.current.y, (tmp.current.z / r) * 9, true)
  })

  return null
}
