import { Canvas, useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer, SMAA, TiltShift2, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import { Suspense, useRef, useState } from 'react'
import * as THREE from 'three'
import { prefersReducedMotion } from '../systems/registry'
import { Buildings } from './Buildings'
import { CameraRig } from './CameraRig'
import { Characters } from './Character'
import { Effects } from './Effects'
import { Environment } from './Environment'
import { Island } from './Island'
import { LabelProjector } from './LabelProjector'
import { Clouds, Fireflies, Flowers, Scatter, Trees } from './Nature'

export type Quality = 'high' | 'low'

function initialQuality(): Quality {
  if (typeof navigator === 'undefined') return 'high'
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  const cores = navigator.hardwareConcurrency ?? 8
  return (mem && mem <= 3) || cores <= 4 ? 'low' : 'high'
}

export function Scene() {
  const [quality, setQuality] = useState<Quality>(initialQuality)
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio, quality === 'high' ? 2 : 1.5))

  return (
    <Canvas
      shadows
      dpr={dpr}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, toneMapping: THREE.NoToneMapping }}
      camera={{ fov: 30, near: 1, far: 700, position: [0, 30, 30] }}
      onCreated={({ gl }) => {
        gl.shadowMap.type = THREE.PCFShadowMap
        if (import.meta.env.DEV) (window as unknown as { __gl: THREE.WebGLRenderer }).__gl = gl
      }}
      aria-label="あなたと友達が暮らす習慣の町"
    >
      <AdaptiveQuality
        onDecline={() => {
          setDpr((d) => Math.max(1, d - 0.25))
          if (dpr <= 1.25) setQuality('low')
        }}
        onIncline={() => setDpr((d) => Math.min(window.devicePixelRatio, 2, d + 0.25))}
      />
      <Suspense fallback={null}>
        <Environment />
        <Island quality={quality} />
        <Buildings />
        <Trees />
        <Scatter />
        <Flowers />
        <Clouds />
        <Fireflies />
        <Characters />
        <Effects />
      </Suspense>
      <LabelProjector />
      <CameraRig />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={1.0} luminanceSmoothing={0.2} intensity={0.85} radius={0.7} />
        {quality === 'high' && !prefersReducedMotion ? (
          <TiltShift2 blur={0.16} taper={0.42} start={[0, 0.48]} end={[1, 0.48]} samples={10} direction={[0, 1]} />
        ) : (
          <></>
        )}
        <ToneMapping mode={ToneMappingMode.AGX} />
        <Vignette eskil={false} offset={0.22} darkness={0.42} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  )
}

/**
 * Adaptive resolution: averages frame rate over 2 s windows and steps DPR down
 * below 45 fps / up above 58 fps. Gives up adjusting after it has flip-flopped
 * a few times, so it never oscillates.
 */
function AdaptiveQuality({ onDecline, onIncline }: { onDecline: () => void; onIncline: () => void }) {
  const acc = useRef({ t: 0, frames: 0, flips: 0, last: 0 })
  useFrame((_, dt) => {
    const a = acc.current
    a.t += dt
    a.frames++
    if (a.t < 2) return
    const fps = a.frames / a.t
    a.t = 0
    a.frames = 0
    if (a.flips > 4) return
    const dir = fps < 45 ? -1 : fps > 58 ? 1 : 0
    if (dir === 0) return
    if (a.last && dir !== a.last) a.flips++
    a.last = dir
    if (dir < 0) onDecline()
    else onIncline()
  })
  return null
}
