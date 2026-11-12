import { useEffect, useState } from 'react'
import { CHALLENGE_DAYS, habitById, habits } from '../data/habits'
import type { HabitId, Person } from '../data/habits'
import { useStore } from '../store'
import { timeOfDayFromClock } from '../tokens'
import { Nameplates } from './Nameplates'
import {
  HabitIcon,
  IconAuto,
  IconCheck,
  IconClap,
  IconClose,
  IconCrown,
  IconFlame,
  IconHeart,
  IconMoon,
  IconPin,
  IconSun,
  IconSunrise,
  IconSunset,
  IconUsers,
} from './icons'

/* ---------------- helpers ---------------- */
function Avatar({ p, size = 40 }: { p: Person; size?: number }) {
  return (
    <span className="avatar" style={{ width: size, height: size, ['--shirt' as string]: p.look.shirt, ['--hair' as string]: p.look.hair, ['--skin' as string]: p.look.skin }} aria-hidden>
      <span className="avatar-hair" />
      <span className="avatar-face">
        <i />
        <i />
      </span>
    </span>
  )
}

function useCountUp(from: number, to: number, ms = 900, delay = 250) {
  const [v, setV] = useState(from)
  useEffect(() => {
    let raf = 0
    const start = performance.now() + delay
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / ms))
      const e = 1 - Math.pow(1 - t, 3)
      setV(Math.round(from + (to - from) * e))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [from, to, ms, delay])
  return v
}

const ago = (since: number) => {
  const m = Math.max(1, Math.round((Date.now() - since) / 60000))
  return m < 60 ? `${m}分前から` : `${Math.round(m / 60)}時間前から`
}

/* ---------------- top bar ---------------- */
function TopBar() {
  const me = useStore((s) => s.people.me)
  const timeMode = useStore((s) => s.timeMode)
  const cycleTime = useStore((s) => s.cycleTime)
  const setFriendsOpen = useStore((s) => s.setFriendsOpen)
  const friendsOpen = useStore((s) => s.friendsOpen)
  const setShopOpen = useStore((s) => s.setShopOpen)
  const todayDone = useStore((s) => s.todayDone)
  const friendCount = useStore((s) => s.order.length - 1)
  const doneCount = Object.values(todayDone).filter(Boolean).length
  const pct = (me.day / CHALLENGE_DAYS) * 100

  const tod = timeMode === 'auto' ? timeOfDayFromClock() : timeMode
  const TimeIcon = timeMode === 'auto' ? IconAuto : tod === 'morning' ? IconSunrise : tod === 'noon' ? IconSun : tod === 'evening' ? IconSunset : IconMoon
  const timeLabel = { auto: '自動', morning: '朝', noon: '昼', evening: '夕方', night: '夜' }[timeMode]

  return (
    <header className="topbar">
      <div className="card challenge">
        <Avatar p={me} size={42} />
        <div className="challenge-body">
          <div className="challenge-title">
            <span>75日チャレンジ</span>
            <span className="today-pill" aria-label={`今日の達成 ${doneCount}/4`}>
              今日 {doneCount}/4
            </span>
          </div>
          <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={CHALLENGE_DAYS} aria-valuenow={me.day}>
            <div className="progress-fill" style={{ width: `${pct}%` }} />
            {[25, 50].map((m) => (
              <span key={m} className="progress-tick" style={{ left: `${(m / CHALLENGE_DAYS) * 100}%` }} />
            ))}
          </div>
          <div className="challenge-meta">
            <b>{me.day}日目</b>
            <span>/ {CHALLENGE_DAYS}日</span>
            <span className="dot" />
            <span>のこり{CHALLENGE_DAYS - me.day}日</span>
          </div>
        </div>
      </div>
      <div className="top-actions">
        <button className="icon-btn" onClick={cycleTime} aria-label={`時間帯: ${timeLabel}（タップで切り替え）`}>
          <TimeIcon size={20} />
          <span className="icon-btn-label">{timeLabel}</span>
        </button>
        <button className={`icon-btn${friendsOpen ? ' is-active' : ''}`} onClick={() => setFriendsOpen(!friendsOpen)} aria-label={`フレンド ${friendCount}人`}>
          <IconUsers size={20} />
          <span className="badge">{friendCount}</span>
          <span className="icon-btn-label">フレンド</span>
        </button>
        <button className="icon-btn shop" onClick={() => setShopOpen(true)} aria-label="プレミアム">
          <IconCrown size={20} />
          <span className="icon-btn-label">Plus</span>
        </button>
      </div>
    </header>
  )
}

/* ---------------- toasts ---------------- */
function Toasts() {
  const toasts = useStore((s) => s.toasts)
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast tone-${t.tone}`}>
          <span className="toast-icon" style={t.icon && t.icon in habitById ? { ['--c' as string]: habitById[t.icon as HabitId].color } : undefined}>
            {t.icon === 'heart' ? <IconHeart size={16} /> : t.icon === 'clap' ? <IconClap size={16} /> : t.icon === 'flame' ? <IconFlame size={16} /> : t.icon ? <HabitIcon id={t.icon} size={16} /> : <IconPin size={16} />}
          </span>
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  )
}

/* ---------------- streak banner ---------------- */
function Banner() {
  const banner = useStore((s) => s.banner)
  if (!banner) return null
  return <BannerInner key={banner.id} habit={banner.habit} from={banner.from} to={banner.to} />
}
function BannerInner({ habit, from, to }: { habit: HabitId; from: number; to: number }) {
  const v = useCountUp(from, to, 600, 350)
  const h = habitById[habit]
  return (
    <div className="banner" style={{ ['--c' as string]: h.color, ['--cd' as string]: h.colorDeep }} role="alert">
      <div className="banner-badge">
        <HabitIcon id={habit} size={30} />
      </div>
      <div className="banner-text">
        <span className="banner-sub">{h.label}を記録しました</span>
        <span className="banner-main">
          <IconFlame size={26} />
          <b key={v} className="banner-num">
            {v}
          </b>
          日連続！
        </span>
      </div>
    </div>
  )
}

/* ---------------- dock ---------------- */
function Dock() {
  const todayDone = useStore((s) => s.todayDone)
  const pending = useStore((s) => s.pending)
  const me = useStore((s) => s.people.me)
  const record = useStore((s) => s.record)
  return (
    <nav className="dock" aria-label="今日の習慣を記録">
      {habits.map((h) => {
        const done = todayDone[h.id]
        const going = pending === h.id
        const here = me.activity === h.id && !going
        return (
          <button
            key={h.id}
            className={`habit-btn${done ? ' is-done' : ''}${going ? ' is-going' : ''}${here ? ' is-here' : ''}`}
            style={{ ['--c' as string]: h.color, ['--cd' as string]: h.colorDeep }}
            onClick={() => record(h.id)}
            aria-label={`${h.label}: ${me.streaks[h.id]}日連続${done ? '、今日は記録済み' : ''}`}
            aria-pressed={done}
          >
            <span className="habit-icon">
              <HabitIcon id={h.id} size={24} />
              {done && (
                <span className="habit-check">
                  <IconCheck size={11} />
                </span>
              )}
            </span>
            <span className="habit-label">{going ? '移動中…' : h.label}</span>
            <span className="habit-streak">
              <IconFlame size={10} />
              {me.streaks[h.id]}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

/* ---------------- person sheet ---------------- */
function PersonSheet() {
  const selected = useStore((s) => s.selected)
  const p = useStore((s) => (s.selected ? s.people[s.selected] : null))
  const select = useStore((s) => s.select)
  const react = useStore((s) => s.react)
  const [last, setLast] = useState<Person | null>(null)
  useEffect(() => {
    if (p) setLast(p)
  }, [p])
  const shown = p ?? last
  const open = Boolean(selected)
  if (!shown) return null
  const h = shown.activity ? habitById[shown.activity] : null
  return (
    <section className={`sheet${open ? ' is-open' : ''}`} aria-hidden={!open} aria-label={`${shown.name}のプロフィール`}>
      <div className="sheet-grip" />
      <button className="sheet-close" onClick={() => select(null)} aria-label="閉じる" tabIndex={open ? 0 : -1}>
        <IconClose size={18} />
      </button>
      <div className="sheet-head">
        <Avatar p={shown} size={52} />
        <div>
          <div className="sheet-name">
            {shown.name}
            <span className="sheet-week">{shown.day}日目</span>
          </div>
          <div className="sheet-status" style={{ ['--c' as string]: h?.color ?? '#b7a58f' }}>
            <span className="status-dot" />
            {h ? `${h.place}で${h.doing}` : '広場でひと休み'}
            <span className="muted">・{ago(shown.since)}</span>
          </div>
        </div>
      </div>
      <div className="streak-grid">
        {habits.map((hh) => (
          <div key={hh.id} className={`streak-cell${shown.activity === hh.id ? ' is-now' : ''}`} style={{ ['--c' as string]: hh.color }}>
            <HabitIcon id={hh.id} size={18} />
            <b>{shown.streaks[hh.id]}</b>
            <span>{hh.label}</span>
          </div>
        ))}
      </div>
      {!shown.isMe && (
        <div className="sheet-actions">
          <button className="cheer-btn clap" onClick={() => react(shown.id, 'clap')} tabIndex={open ? 0 : -1}>
            <IconClap size={20} /> 拍手
          </button>
          <button className="cheer-btn heart" onClick={() => react(shown.id, 'heart')} tabIndex={open ? 0 : -1}>
            <IconHeart size={20} /> ハート
          </button>
        </div>
      )}
    </section>
  )
}

/* ---------------- friends panel ---------------- */
function FriendsPanel() {
  const open = useStore((s) => s.friendsOpen)
  const people = useStore((s) => s.people)
  const order = useStore((s) => s.order)
  const select = useStore((s) => s.select)
  const setOpen = useStore((s) => s.setFriendsOpen)
  const list = order.filter((id) => !people[id].isMe).map((id) => people[id])
  const active = list.filter((p) => p.activity).length
  return (
    <aside className={`panel${open ? ' is-open' : ''}`} aria-hidden={!open} aria-label="フレンド">
      <div className="panel-head">
        <div>
          <b>フレンド</b>
          <span className="muted">
            {' '}
            {active}人ががんばり中
          </span>
        </div>
        <button className="sheet-close static" onClick={() => setOpen(false)} aria-label="閉じる" tabIndex={open ? 0 : -1}>
          <IconClose size={18} />
        </button>
      </div>
      <ul className="friend-list">
        {list.map((p) => {
          const h = p.activity ? habitById[p.activity] : null
          return (
            <li key={p.id}>
              <button onClick={() => select(p.id)} tabIndex={open ? 0 : -1}>
                <Avatar p={p} size={36} />
                <span className="fl-body">
                  <b>{p.name}</b>
                  <span className="fl-status" style={{ ['--c' as string]: h?.color ?? '#b7a58f' }}>
                    {h ? (
                      <>
                        <HabitIcon id={h.id} size={12} /> {h.doing}
                      </>
                    ) : (
                      '広場でひと休み'
                    )}
                  </span>
                </span>
                <span className="fl-streak">
                  <IconFlame size={12} />
                  {p.activity ? p.streaks[p.activity] : Math.max(...Object.values(p.streaks))}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <button className="invite" tabIndex={open ? 0 : -1} onClick={() => useStore.getState().toast('招待リンクをコピーしました', 'success', 'flame')}>
        ＋ 友達を町に招待する
      </button>
    </aside>
  )
}

/* ---------------- premium (課金導線) ---------------- */
function Shop() {
  const open = useStore((s) => s.shopOpen)
  const setOpen = useStore((s) => s.setShopOpen)
  const toast = useStore((s) => s.toast)
  if (!open) return null
  return (
    <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Habit Town Plus" onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close" onClick={() => setOpen(false)} aria-label="閉じる">
          <IconClose size={18} />
        </button>
        <div className="modal-crown">
          <IconCrown size={30} />
        </div>
        <h2>Habit Town Plus</h2>
        <p className="muted">町をもっと自分らしく。75日を最後まで楽しく。</p>
        <ul className="perks">
          <li>
            <b>フレンド無制限</b>
            <span>無料版は5人まで</span>
          </li>
          <li>
            <b>建物と服の着せ替え</b>
            <span>季節限定スキンが毎月追加</span>
          </li>
          <li>
            <b>町の天気と季節</b>
            <span>雨・雪・桜の演出</span>
          </li>
          <li>
            <b>ストリーク保護</b>
            <span>月2回まで途切れても大丈夫</span>
          </li>
        </ul>
        <button
          className="cta"
          onClick={() => {
            setOpen(false)
            toast('プロトタイプのため決済は未接続です（本番はRevenueCat/Stripe）', 'info', 'flame')
          }}
        >
          7日間無料で試す
          <span>その後 ¥480/月</span>
        </button>
      </div>
    </div>
  )
}

function Hint() {
  const [show, setShow] = useState(true)
  useEffect(() => {
    const t = window.setTimeout(() => setShow(false), 6000)
    return () => clearTimeout(t)
  }, [])
  const pending = useStore((s) => s.pending)
  if (!show || pending) return null
  return <div className="hint">習慣をタップすると、キャラがその場所へ向かいます</div>
}

export function HUD() {
  return (
    <div className="hud">
      <Nameplates />
      <TopBar />
      <Toasts />
      <Banner />
      <Hint />
      <FriendsPanel />
      <PersonSheet />
      <Dock />
      <Shop />
    </div>
  )
}
