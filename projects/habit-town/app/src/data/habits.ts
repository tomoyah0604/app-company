export type HabitId = 'gym' | 'read' | 'study' | 'run'

export interface HabitDef {
  id: HabitId
  label: string
  place: string
  /** what a person is shown doing there */
  doing: string
  /** verb used in "〇〇に向かっています" */
  goingTo: string
  color: string
  colorDeep: string
}

export const habits: HabitDef[] = [
  { id: 'gym', label: 'ジム', place: 'ジム', doing: '筋トレ中', goingTo: 'ジム', color: '#4cc2b0', colorDeep: '#2a9c8c' },
  { id: 'read', label: '読書', place: '図書館', doing: '読書中', goingTo: '図書館', color: '#f08a5d', colorDeep: '#d2663a' },
  { id: 'study', label: '勉強', place: 'カフェ', doing: '勉強中', goingTo: 'カフェ', color: '#c48bdc', colorDeep: '#9d62b8' },
  { id: 'run', label: 'ラン', place: '公園', doing: 'ランニング中', goingTo: '公園', color: '#7ab8f5', colorDeep: '#4c90d6' },
]

export const habitById = Object.fromEntries(habits.map((h) => [h.id, h])) as Record<HabitId, HabitDef>

export const CHALLENGE_WEEKS = 75

export type HairStyle = 'short' | 'bob' | 'bun' | 'spiky' | 'long'
export type Accessory = 'none' | 'headband' | 'cap' | 'glasses' | 'flower'

export interface Look {
  skin: string
  hair: string
  shirt: string
  pants: string
  shoes: string
  hairStyle: HairStyle
  accessory: Accessory
  accent: string
}

export interface Person {
  id: string
  name: string
  isMe: boolean
  look: Look
  week: number
  streaks: Record<HabitId, number>
  /** current activity, null = hanging out on the plaza */
  activity: HabitId | null
  /** ms timestamp the current activity started */
  since: number
  /** spot index at the current place (building spot, track lane phase, or plaza spot) */
  slot: number
}

const skins = ['#ffe0c8', '#f6d0b1', '#eabf9c', '#d9a782', '#c08a63']

const s = (gym: number, read: number, study: number, run: number) => ({ gym, read, study, run })

const now = Date.now()
const min = 60_000

const rawPeople: Omit<Person, 'slot'>[] = [
  {
    id: 'me',
    name: 'あなた',
    isMe: true,
    look: {
      skin: skins[1],
      hair: '#4a3426',
      shirt: '#ffcf5a',
      pants: '#4d6fa8',
      shoes: '#ffffff',
      hairStyle: 'short',
      accessory: 'none',
      accent: '#ffcf5a',
    },
    week: 12,
    streaks: s(23, 41, 8, 15),
    activity: null,
    since: now,
  },
  {
    id: 'haru',
    name: 'ハル',
    isMe: false,
    look: { skin: skins[0], hair: '#e7a15a', shirt: '#ff8a8a', pants: '#5c4a7a', shoes: '#fff4dc', hairStyle: 'bob', accessory: 'flower', accent: '#ff8a8a' },
    week: 31,
    streaks: s(12, 88, 30, 64),
    activity: 'read',
    since: now - 18 * min,
  },
  {
    id: 'sota',
    name: 'ソウタ',
    isMe: false,
    look: { skin: skins[3], hair: '#2c2420', shirt: '#4cc2b0', pants: '#3b3f4f', shoes: '#ff7a59', hairStyle: 'spiky', accessory: 'headband', accent: '#4cc2b0' },
    week: 48,
    streaks: s(201, 14, 40, 120),
    activity: 'gym',
    since: now - 34 * min,
  },
  {
    id: 'mei',
    name: 'メイ',
    isMe: false,
    look: { skin: skins[1], hair: '#7a4b3a', shirt: '#c48bdc', pants: '#f3e7d3', shoes: '#8a5bb0', hairStyle: 'bun', accessory: 'glasses', accent: '#c48bdc' },
    week: 7,
    streaks: s(5, 22, 46, 3),
    activity: 'study',
    since: now - 52 * min,
  },
  {
    id: 'ren',
    name: 'レン',
    isMe: false,
    look: { skin: skins[2], hair: '#3a2c24', shirt: '#7ab8f5', pants: '#ffffff', shoes: '#4c90d6', hairStyle: 'short', accessory: 'cap', accent: '#7ab8f5' },
    week: 22,
    streaks: s(60, 10, 12, 140),
    activity: 'run',
    since: now - 9 * min,
  },
  {
    id: 'yui',
    name: 'ユイ',
    isMe: false,
    look: { skin: skins[0], hair: '#2f2a3a', shirt: '#ffd166', pants: '#6c8f5a', shoes: '#ffffff', hairStyle: 'long', accessory: 'none', accent: '#ffd166' },
    week: 64,
    streaks: s(150, 300, 90, 40),
    activity: null,
    since: now - 4 * min,
  },
  {
    id: 'kai',
    name: 'カイ',
    isMe: false,
    look: { skin: skins[4], hair: '#1f1b1a', shirt: '#9bd47a', pants: '#4a4e69', shoes: '#ffcf5a', hairStyle: 'short', accessory: 'headband', accent: '#9bd47a' },
    week: 3,
    streaks: s(9, 2, 1, 11),
    activity: 'gym',
    since: now - 12 * min,
  },
  {
    id: 'mio',
    name: 'ミオ',
    isMe: false,
    look: { skin: skins[1], hair: '#c46a4a', shirt: '#ffffff', pants: '#e07a8f', shoes: '#5a4a6a', hairStyle: 'bob', accessory: 'none', accent: '#e07a8f' },
    week: 40,
    streaks: s(33, 120, 77, 25),
    activity: 'read',
    since: now - 41 * min,
  },
  {
    id: 'taku',
    name: 'タク',
    isMe: false,
    look: { skin: skins[2], hair: '#4a3a2e', shirt: '#ff9f6b', pants: '#2f4858', shoes: '#ffffff', hairStyle: 'spiky', accessory: 'glasses', accent: '#ff9f6b' },
    week: 15,
    streaks: s(40, 18, 70, 6),
    activity: null,
    since: now - 2 * min,
  },
  {
    id: 'nana',
    name: 'ナナ',
    isMe: false,
    look: { skin: skins[0], hair: '#e8c37a', shirt: '#8fd3ff', pants: '#f4b6c2', shoes: '#ffffff', hairStyle: 'long', accessory: 'flower', accent: '#8fd3ff' },
    week: 55,
    streaks: s(80, 60, 20, 210),
    activity: 'run',
    since: now - 27 * min,
  },
]

/** Give everyone a distinct slot per place. */
export const initialPeople: Person[] = (() => {
  const counters: Record<string, number> = {}
  return rawPeople.map((p) => {
    const key = p.activity ?? 'plaza'
    const slot = counters[key] ?? (key === 'plaza' ? 1 : 0)
    counters[key] = slot + (key === 'plaza' ? 3 : 1)
    return { ...p, slot }
  })
})()

export function bestStreak(p: Person) {
  return Math.max(...Object.values(p.streaks))
}

export function currentStreak(p: Person) {
  return p.activity ? p.streaks[p.activity] : bestStreak(p)
}
