/** Minimal semi-implicit spring integrator for per-frame (non-React) animation. */
export interface Spring {
  x: number
  v: number
}

export function stepSpring(s: Spring, target: number, tension: number, friction: number, dt: number) {
  // sub-step for stability at low frame rates
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)))
  const h = Math.min(dt, 0.1) / steps
  for (let i = 0; i < steps; i++) {
    const a = tension * (target - s.x) - friction * s.v
    s.v += a * h
    s.x += s.v * h
  }
  return s.x
}

export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt))

export function dampAngle(current: number, target: number, lambda: number, dt: number) {
  let d = target - current
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return current + d * (1 - Math.exp(-lambda * dt))
}

export const easeOutBack = (t: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
