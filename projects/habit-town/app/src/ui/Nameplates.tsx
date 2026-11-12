import { habitById } from '../data/habits'
import { useStore } from '../store'
import { labelNodes } from '../systems/registry'
import { HabitIcon, IconFlame } from './icons'

function Nameplate({ id }: { id: string }) {
  const p = useStore((s) => s.people[id])
  const selected = useStore((s) => s.selected === id)
  const select = useStore((s) => s.select)
  const h = p.activity ? habitById[p.activity] : null
  const streak = p.activity ? p.streaks[p.activity] : Math.max(...Object.values(p.streaks))
  return (
    <button
      ref={(el) => {
        if (el) labelNodes.set(id, el)
        else labelNodes.delete(id)
      }}
      className={`nameplate${p.isMe ? ' is-me' : ''}${selected ? ' is-selected' : ''}`}
      style={{ ['--accent' as string]: h?.color ?? '#b7a58f' }}
      onClick={() => select(id)}
      aria-label={`${p.name}、${h ? `${h.place}で${h.doing}` : '広場でひと休み'}、${streak}日連続`}
    >
      <span className="np-inner">
        {h && (
          <span className="np-icon" key={h.id}>
            <HabitIcon id={h.id} size={12} />
          </span>
        )}
        <span className="np-name">{p.name}</span>
        <span className="np-streak">
          <IconFlame size={11} />
          {streak}
        </span>
      </span>
    </button>
  )
}

/** Screen-space nameplate layer; positions are written by <LabelProjector/>. */
export function Nameplates() {
  const order = useStore((s) => s.order)
  return (
    <div className="nameplates">
      {order.map((id) => (
        <Nameplate key={id} id={id} />
      ))}
    </div>
  )
}
