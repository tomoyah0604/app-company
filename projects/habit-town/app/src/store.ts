import { create } from 'zustand'
import type { HabitId, Person } from './data/habits'
import { habitById, initialPeople } from './data/habits'
import { buildingById, mulberry32, spotLocal } from './data/world'
import type { Vec2 } from './data/world'
import { flowerColors } from './tokens'
import type { TimeOfDay } from './tokens'

export type ToastTone = 'info' | 'success' | 'cheer'
export interface Toast {
  id: number
  text: string
  tone: ToastTone
  icon?: HabitId | 'heart' | 'clap' | 'flame'
}

export interface Celebration {
  id: number
  habit: HabitId
  personId: string
  at: number
}

export type ReactionKind = 'clap' | 'heart'
export interface Reaction {
  id: number
  personId: string
  kind: ReactionKind
  at: number
}

export interface Flower {
  id: number
  pos: Vec2
  color: string
  born: number
}

interface State {
  people: Record<string, Person>
  order: string[]
  todayDone: Record<HabitId, boolean>
  /** habit the player is walking to record (completion fires on arrival) */
  pending: HabitId | null
  selected: string | null
  focus: string | null
  timeMode: 'auto' | TimeOfDay
  toasts: Toast[]
  celebrations: Celebration[]
  reactions: Reaction[]
  flowers: Flower[]
  friendsOpen: boolean
  shopOpen: boolean
  /** big "+1 streak" banner */
  banner: { id: number; habit: HabitId; from: number; to: number } | null

  record: (habit: HabitId) => void
  arrive: (personId: string, habit: HabitId) => void
  setActivity: (personId: string, habit: HabitId | null) => void
  select: (id: string | null) => void
  setFocus: (id: string | null) => void
  react: (personId: string, kind: ReactionKind, fromFriend?: boolean) => void
  toast: (text: string, tone?: ToastTone, icon?: Toast['icon']) => void
  dismissToast: (id: number) => void
  cycleTime: () => void
  setFriendsOpen: (v: boolean) => void
  setShopOpen: (v: boolean) => void
}

let uid = 1
const rng = mulberry32(42)

const timeCycle: ('auto' | TimeOfDay)[] = ['auto', 'morning', 'noon', 'evening', 'night']

/** Seed flowers so the town already looks 23 days lived-in. */
function seedFlowers(): Flower[] {
  const out: Flower[] = []
  const r = mulberry32(7)
  for (const id of ['gym', 'read', 'study', 'run'] as HabitId[]) {
    const b = buildingById[id]
    const count = 6
    for (let i = 0; i < count; i++) out.push(makeFlower(b.pos, r, b.clearRadius, -1e6))
  }
  return out
}

function makeFlower(center: Vec2, r: () => number, clear: number, born: number): Flower {
  const a = r() * Math.PI * 2
  const d = clear + 0.2 + r() * 1.1
  return {
    id: uid++,
    pos: [center[0] + Math.cos(a) * d, center[1] + Math.sin(a) * d],
    color: flowerColors[Math.floor(r() * flowerColors.length)],
    born,
  }
}

export const useStore = create<State>((set, get) => ({
  people: Object.fromEntries(initialPeople.map((p) => [p.id, p])),
  order: initialPeople.map((p) => p.id),
  todayDone: { gym: false, read: true, study: false, run: false },
  pending: null,
  selected: null,
  focus: null,
  timeMode: 'auto',
  toasts: [],
  celebrations: [],
  reactions: [],
  flowers: seedFlowers(),
  friendsOpen: false,
  shopOpen: false,
  banner: null,

  record: (habit) => {
    const { todayDone, people, pending } = get()
    if (pending === habit) return
    if (todayDone[habit]) {
      // still let the player go there — it's a place, not just a checkbox
      get().setActivity('me', habit)
      set({ focus: 'me', selected: null })
      get().toast(`${habitById[habit].label}は今日もう記録済み。${habitById[habit].place}へ向かいます`, 'info', habit)
      return
    }
    set({
      people: { ...people, me: { ...people.me, activity: habit, since: Date.now(), slot: freeSlot(people, habit, 'me') } },
      pending: habit,
      focus: 'me',
      selected: null,
      friendsOpen: false,
    })
  },

  arrive: (personId, habit) => {
    const { pending, people, todayDone } = get()
    if (personId !== 'me' || pending !== habit) return
    const me = people.me
    const from = me.streaks[habit]
    const to = from + 1
    const b = buildingById[habit]
    const now = performance.now()
    const newFlowers = Array.from({ length: 5 }, (_, i) => makeFlower(b.pos, rng, b.clearRadius, now + 450 + i * 140))
    set({
      pending: null,
      todayDone: { ...todayDone, [habit]: true },
      people: { ...people, me: { ...me, streaks: { ...me.streaks, [habit]: to } } },
      celebrations: [...get().celebrations.slice(-4), { id: uid++, habit, personId, at: now }],
      flowers: [...get().flowers, ...newFlowers].slice(-120),
      banner: { id: uid++, habit, from, to },
    })
    window.setTimeout(() => {
      if (get().focus === 'me' && !get().pending) set({ focus: null })
    }, 3600)
    window.setTimeout(() => set({ banner: null }), 2900)
  },

  setActivity: (personId, habit) => {
    const p = get().people[personId]
    if (!p) return
    const people = get().people
    const slot = habit ? freeSlot(people, habit, personId) : plazaSlot(people, personId)
    set({ people: { ...people, [personId]: { ...p, activity: habit, since: Date.now(), slot } } })
  },

  select: (id) => set({ selected: id, focus: id, friendsOpen: false }),
  setFocus: (id) => set({ focus: id }),

  react: (personId, kind, fromFriend = false) => {
    set({ reactions: [...get().reactions.slice(-8), { id: uid++, personId, kind, at: performance.now() }] })
    if (!fromFriend) {
      const name = get().people[personId]?.name
      get().toast(kind === 'clap' ? `${name}に拍手を送りました` : `${name}にハートを送りました`, 'cheer', kind)
    }
  },

  toast: (text, tone = 'info', icon) => {
    const t: Toast = { id: uid++, text, tone, icon }
    set({ toasts: [...get().toasts.slice(-2), t] })
    window.setTimeout(() => get().dismissToast(t.id), 3400)
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  cycleTime: () => {
    const i = timeCycle.indexOf(get().timeMode)
    set({ timeMode: timeCycle[(i + 1) % timeCycle.length] })
  },
  setFriendsOpen: (v) => set({ friendsOpen: v, shopOpen: false }),
  setShopOpen: (v) => set({ shopOpen: v, friendsOpen: false }),
}))

/** First unoccupied spot at a habit's building (stable while people come and go). */
export function freeSlot(people: Record<string, Person>, habit: HabitId, exclude: string) {
  const taken = new Set(
    Object.values(people)
      .filter((p) => p.id !== exclude && p.activity === habit)
      .map((p) => p.slot),
  )
  for (let i = 0; i < 12; i++) if (!taken.has(i)) return i
  return 0
}

function plazaSlot(people: Record<string, Person>, exclude: string) {
  const taken = new Set(
    Object.values(people)
      .filter((p) => p.id !== exclude && p.activity === null)
      .map((p) => p.slot),
  )
  // start from a random-ish slot so people don't always cluster at the same place
  const start = Math.floor(rng() * 10)
  for (let k = 0; k < 14; k++) {
    const i = (start + k) % 14
    if (!taken.has(i)) return i
  }
  return 0
}

export function occupancy(people: Record<string, Person>, habit: HabitId) {
  return Object.values(people).filter((p) => p.activity === habit).length
}

export const spotCount = (h: HabitId) => Math.max(1, spotLocal(h).length)
