import type { HabitId } from '../data/habits'

/** Hand-drawn-ish rounded SVG icons. Consistent 24px grid, 2px rounded strokes. */
type P = { size?: number; className?: string }
const base = (size = 20) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const IconGym = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M7 12h10" />
    <rect x="3.5" y="7.5" width="3.5" height="9" rx="1.4" fill="currentColor" stroke="none" />
    <rect x="17" y="7.5" width="3.5" height="9" rx="1.4" fill="currentColor" stroke="none" />
    <path d="M2 10.5v3M22 10.5v3" />
  </svg>
)
export const IconBook = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 6.5C10 5 7 4.6 3.5 5v13c3.5-.4 6.5 0 8.5 1.5 2-1.5 5-1.9 8.5-1.5V5C17 4.6 14 5 12 6.5Z" />
    <path d="M12 6.5v13" />
  </svg>
)
export const IconCup = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4.5 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V9Z" />
    <path d="M16.5 10.5h1.2a2.5 2.5 0 0 1 0 5h-1.5" />
    <path d="M8.5 3.5c-.6.8-.6 1.7 0 2.5M12 3.5c-.6.8-.6 1.7 0 2.5" />
  </svg>
)
export const IconRun = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="14.5" cy="4.5" r="2" fill="currentColor" stroke="none" />
    <path d="M7 21l3-5 3 2 1-5 3 2.5h2.5" />
    <path d="M13 13l-2.5-3.5L7 11" />
  </svg>
)
export const IconFlame = ({ size, className }: P) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M12.6 2.5c.4 3-1.2 4.6-2.7 6.2C8.4 10.3 7 12 7 14.6A5 5 0 0 0 12 19.8a5.2 5.2 0 0 0 5.2-5.3c0-2.1-.9-3.6-1.7-4.6-.2 1.3-.9 2.2-1.8 2.6.6-3.6-.4-7.3-1.1-10Z" />
  </svg>
)
export const IconHeart = ({ size, className }: P) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M12 20.5s-8-4.6-8-10.4A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 8 2.5c0 5.8-8 10.4-8 10.4Z" />
  </svg>
)
export const IconClap = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M9.5 11.5 6.8 8.8a1.4 1.4 0 0 1 2-2l4.3 4.3" />
    <path d="M8.2 13.6 5.3 10.7a1.4 1.4 0 0 1 2-2" />
    <path d="M13.1 11.1 9.4 7.4a1.4 1.4 0 0 1 2-2l4.7 4.7c1.8 1.8 2 4.6.3 6.4l-1 1a5 5 0 0 1-7 0l-3-3a1.4 1.4 0 0 1 2-2" />
    <path d="M17 3.5l.6-1.5M20 6.5l1.5-.6M19.4 4.3l1.2-1.2" />
  </svg>
)
export const IconSun = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </svg>
)
export const IconMoon = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </svg>
)
export const IconSunrise = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M7 17a5 5 0 0 1 10 0" />
    <path d="M3 17h18M12 4v5M9.5 6.5 12 4l2.5 2.5M4.8 11.5l1.4 1.4M19.2 11.5l-1.4 1.4M3 21h18" />
  </svg>
)
export const IconSunset = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M7 17a5 5 0 0 1 10 0" />
    <path d="M3 17h18M12 4v5M9.5 6.5 12 9l2.5-2.5M4.8 11.5l1.4 1.4M19.2 11.5l-1.4 1.4M3 21h18" />
  </svg>
)
export const IconAuto = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5l3.5 2" />
  </svg>
)
export const IconUsers = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
    <circle cx="17" cy="9.5" r="2.5" />
    <path d="M16 14.2a4.5 4.5 0 0 1 5 4.3" />
  </svg>
)
export const IconGift = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <rect x="3.5" y="9" width="17" height="11.5" rx="2" />
    <path d="M2.5 9h19M12 9v11.5" />
    <path d="M12 9S10.5 4 8 4.5 6.8 8.5 12 9ZM12 9s1.5-5 4-4.5S17.2 8.5 12 9Z" />
  </svg>
)
export const IconClose = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)
export const IconCheck = ({ size, className }: P) => (
  <svg {...base(size)} className={className} strokeWidth={3}>
    <path d="M5 12.5 10 17.5 19 7" />
  </svg>
)
export const IconPin = ({ size, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.3" />
  </svg>
)
export const IconCrown = ({ size, className }: P) => (
  <svg {...base(size)} className={className} fill="currentColor" stroke="none">
    <path d="M3.5 8.5 8 12l4-6.5 4 6.5 4.5-3.5-1.8 10H5.3l-1.8-10Z" />
  </svg>
)

export function HabitIcon({ id, size, className }: { id: HabitId } & P) {
  switch (id) {
    case 'gym':
      return <IconGym size={size} className={className} />
    case 'read':
      return <IconBook size={size} className={className} />
    case 'study':
      return <IconCup size={size} className={className} />
    case 'run':
      return <IconRun size={size} className={className} />
  }
}
