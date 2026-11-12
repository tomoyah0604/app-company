import { useEffect } from 'react'
import { habitById, habits } from '../data/habits'
import type { HabitId } from '../data/habits'
import { occupancy, useStore } from '../store'

/**
 * Stand-in for Supabase Realtime: friends start/stop habits and cheer you on.
 * Swap this hook for a realtime channel subscription — the store API is the same.
 */
export function useFriendSimulation() {
  useEffect(() => {
    let alive = true
    let lastToast = 0
    const timers: number[] = []
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(() => alive && fn(), ms))

    const tickActivity = () => {
      const s = useStore.getState()
      const friends = s.order.filter((id) => !s.people[id].isMe)
      const id = friends[Math.floor(Math.random() * friends.length)]
      const p = s.people[id]
      let next: HabitId | null
      if (p.activity && Math.random() < 0.5) next = null
      else {
        const options = habits.map((h) => h.id).filter((h) => h !== p.activity && occupancy(s.people, h) < 4)
        next = options.length ? options[Math.floor(Math.random() * options.length)] : null
      }
      s.setActivity(id, next)
      const now = performance.now()
      if (next && now - lastToast > 11000 && !s.pending) {
        lastToast = now
        s.toast(`${p.name}が${habitById[next].goingTo}へ向かっています`, 'info', next)
      }
      later(tickActivity, 6500 + Math.random() * 6500)
    }

    const tickCheer = () => {
      const s = useStore.getState()
      const friends = s.order.filter((id) => !s.people[id].isMe)
      const p = s.people[friends[Math.floor(Math.random() * friends.length)]]
      const kind = Math.random() < 0.5 ? 'clap' : 'heart'
      s.react('me', kind, true)
      if (!s.pending) s.toast(`${p.name}があなたに${kind === 'clap' ? '拍手' : 'ハート'}を送りました`, 'cheer', kind)
      later(tickCheer, 24000 + Math.random() * 14000)
    }

    later(tickActivity, 4500)
    later(tickCheer, 16000)
    return () => {
      alive = false
      timers.forEach(clearTimeout)
    }
  }, [])
}
