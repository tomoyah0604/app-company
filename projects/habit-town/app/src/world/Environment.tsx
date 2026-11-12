import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'
import { lighting, timeOfDayFromClock } from '../tokens'
import type { TimeOfDay } from '../tokens'
import { ISLAND_RADIUS } from '../data/world'

/**
 * Live, smoothly-interpolated environment values. Mutated every frame and read by
 * anything that reacts to time of day (windows, lamps, fireflies) — no React re-render.
 */
export const env = {
  night: 0,
  skyTop: new THREE.Color(),
  skyBottom: new THREE.Color(),
  waterShallow: new THREE.Color(),
  waterDeep: new THREE.Color(),
  fog: new THREE.Color(),
}

export function useTimeOfDay(): TimeOfDay {
  const mode = useStore((s) => s.timeMode)
  return mode === 'auto' ? timeOfDayFromClock() : mode
}

const tmp = new THREE.Color()

export function Environment() {
  const tod = useTimeOfDay()
  const sun = useRef<THREE.DirectionalLight>(null!)
  const hemi = useRef<THREE.HemisphereLight>(null!)
  const scene = useThree((s) => s.scene)
  const sunTarget = useRef(new THREE.Vector3())
  const first = useRef(true)

  useEffect(() => {
    scene.fog = new THREE.Fog(lighting[tod].fog, 120, 260)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene])

  useFrame((_, dt) => {
    const p = lighting[tod]
    // critically-damped-ish exponential approach; first frame snaps
    const k = first.current ? 1 : 1 - Math.exp(-dt * 2.2)
    first.current = false
    env.night += (p.night - env.night) * k
    env.skyTop.lerp(tmp.set(p.skyTop), k)
    env.skyBottom.lerp(tmp.set(p.skyBottom), k)
    env.waterShallow.lerp(tmp.set(p.waterShallow), k)
    env.waterDeep.lerp(tmp.set(p.waterDeep), k)
    env.fog.lerp(tmp.set(p.fog), k)
    if (scene.fog) (scene.fog as THREE.Fog).color.copy(env.fog)

    sun.current.color.lerp(tmp.set(p.sun), k)
    sun.current.intensity += (p.sunIntensity - sun.current.intensity) * k
    sunTarget.current.set(...p.sunDir).normalize().multiplyScalar(30)
    sun.current.position.lerp(sunTarget.current, k)
    hemi.current.color.lerp(tmp.set(p.hemiSky), k)
    hemi.current.groundColor.lerp(tmp.set(p.hemiGround), k)
    hemi.current.intensity += (p.hemiIntensity - hemi.current.intensity) * k
  })

  return (
    <>
      <hemisphereLight ref={hemi} intensity={1.2} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={3}
        position={[6, 14, 7]}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
      >
        <orthographicCamera attach="shadow-camera" args={[-16, 16, 16, -16, 1, 70]} />
      </directionalLight>
      <Sky />
      <Water />
      <Stars />
    </>
  )
}

function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uTop: { value: new THREE.Color() }, uBottom: { value: new THREE.Color() } },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop; uniform vec3 uBottom;
          varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y * 1.6 + 0.08, 0.0, 1.0);
            vec3 c = mix(uBottom, uTop, smoothstep(0.0, 1.0, h));
            gl_FragColor = vec4(c, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  )
  useFrame(() => {
    mat.uniforms.uTop.value.copy(env.skyTop)
    mat.uniforms.uBottom.value.copy(env.skyBottom)
  })
  return (
    <mesh material={mat} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[300, 32, 16]} />
    </mesh>
  )
}

function Water() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        fog: false,
        uniforms: {
          uTime: { value: 0 },
          uShallow: { value: new THREE.Color() },
          uDeep: { value: new THREE.Color() },
          uHorizon: { value: new THREE.Color() },
          uNight: { value: 0 },
          uR: { value: ISLAND_RADIUS + 0.9 },
        },
        vertexShader: /* glsl */ `
          varying vec2 vXZ;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vXZ = wp.xz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime; uniform vec3 uShallow; uniform vec3 uDeep; uniform vec3 uHorizon;
          uniform float uNight; uniform float uR;
          varying vec2 vXZ;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p); vec2 f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y);
          }
          float shoreR(float t) {
            return uR * (1.0 + 0.045 * sin(3.0 * t + 0.6) + 0.03 * sin(5.0 * t + 2.1) + 0.02 * sin(8.0 * t + 4.0));
          }
          void main() {
            float d = length(vXZ);
            float t = atan(vXZ.y, vXZ.x);
            float shore = d - shoreR(t);              // metres from the beach edge
            float depth = smoothstep(0.0, 9.0, shore);
            vec3 col = mix(uShallow, uDeep, depth);

            // animated foam bands lapping the shore
            float n = noise(vXZ * 0.9 + uTime * 0.15);
            float wave = sin(shore * 3.2 - uTime * 1.6 + n * 2.0);
            float band = smoothstep(0.75, 0.95, wave) * (1.0 - smoothstep(0.0, 2.6, shore));
            float edge = 1.0 - smoothstep(0.0, 0.35 + n * 0.25, shore);
            col = mix(col, vec3(1.0), clamp(band * 0.55 + edge * 0.85, 0.0, 1.0));

            // gentle glints
            float g = noise(vXZ * 2.4 + vec2(uTime * 0.35, -uTime * 0.22));
            col += smoothstep(0.82, 0.98, g) * mix(0.14, 0.08, uNight) * (1.0 - depth * 0.4);

            // fade to horizon
            col = mix(col, uHorizon, smoothstep(26.0, 110.0, d));
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
          }`,
      }),
    [],
  )
  useFrame((_, dt) => {
    mat.uniforms.uTime.value += dt
    mat.uniforms.uShallow.value.copy(env.waterShallow)
    mat.uniforms.uDeep.value.copy(env.waterDeep)
    mat.uniforms.uHorizon.value.copy(env.skyBottom)
    mat.uniforms.uNight.value = env.night
  })
  return (
    <mesh material={mat} rotation-x={-Math.PI / 2} position-y={-0.95} renderOrder={-5}>
      <circleGeometry args={[220, 96]} />
    </mesh>
  )
}

/** Stars fade in with night. One draw call. */
function Stars() {
  const ref = useRef<THREE.Points>(null!)
  const geom = useMemo(() => {
    const n = 500
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const u = Math.random()
      const v = Math.random() * 0.45 + 0.08
      const theta = u * Math.PI * 2
      const phi = Math.acos(1 - v)
      pos[i * 3] = Math.sin(phi) * Math.cos(theta) * 260
      pos[i * 3 + 1] = Math.cos(phi) * 260
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * 260
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  const mat = useMemo(
    () => new THREE.PointsMaterial({ color: '#fff7e0', size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }),
    [],
  )
  useFrame(() => {
    mat.opacity = Math.max(0, env.night - 0.4) / 0.6
    ref.current.visible = mat.opacity > 0.01
  })
  return <points ref={ref} geometry={geom} material={mat} renderOrder={-9} />
}
