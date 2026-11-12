import { useMemo } from 'react'
import { useFriendSimulation } from './systems/simulation'
import { HUD } from './ui/HUD'
import { Scene } from './world/Scene'

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  const webgl = useMemo(hasWebGL, [])
  useFriendSimulation()
  if (!webgl) {
    return (
      <div className="fallback">
        <div>
          <h1>Habit Town</h1>
          <p>この端末では3D表示を利用できません。最新のブラウザでお試しください。</p>
        </div>
      </div>
    )
  }
  return (
    <div className="app">
      <Scene />
      <HUD />
    </div>
  )
}
