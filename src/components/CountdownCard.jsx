import { TRIP_START } from '../constants'
import { getDaysBetween } from '../utils'

export default function CountdownCard() {
  const days = getDaysBetween(TRIP_START)
  if (days <= 0) return null
  const emojis = ['🌴', '✈️', '🗽', '🏖️', '🍕', '🍫', '🚂', '🌊', '🎉']
  return (
    <div style={{ background: 'linear-gradient(135deg,#1a3a5c 0%,#2d7dd2 100%)', borderRadius: 18, padding: '22px 20px', textAlign: 'center', color: 'white', marginBottom: 16 }}>
      <div style={{ fontSize: 28, marginBottom: 6, letterSpacing: 2 }}>
        {emojis.map((e, i) => (
          <span key={i} style={{ display: 'inline-block', animation: `bounce${i % 3} ${1.2 + i * 0.1}s ease-in-out infinite`, animationDelay: `${i * 0.12}s` }}>{e}</span>
        ))}
      </div>
      <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, letterSpacing: '-2px' }}>{days}</div>
      <div style={{ fontSize: 15, opacity: 0.85, marginTop: 4, fontWeight: 600 }}>days until the East Coast! 🌊</div>
      <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: '8px 16px', fontSize: 13 }}>✈️ Departs SLC · Thu Jul 9, 2:05pm</div>
    </div>
  )
}
