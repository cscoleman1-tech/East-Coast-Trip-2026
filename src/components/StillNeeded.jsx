import { STILL_NEEDED_ITEMS } from '../constants'

export default function StillNeeded({ bookingChecked, onToggle }) {
  const rem = STILL_NEEDED_ITEMS.filter((_, i) => !bookingChecked[i])
  if (rem.length === 0) return (
    <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '14px 16px', border: '1px solid #86efac', textAlign: 'center', marginTop: 12 }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>🎉</div>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#166534' }}>All bookings done!</div>
    </div>
  )
  return (
    <div style={{ background: '#fff8e6', borderRadius: 12, padding: '14px 16px', border: '1px solid #ffd87a', marginTop: 12 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: '#a05e00', marginBottom: 10 }}>⚠️ Still Need to Book ({rem.length} left)</div>
      {STILL_NEEDED_ITEMS.map((item, i) => {
        const done = !!bookingChecked[i]
        return (
          <div key={i} onClick={() => onToggle(i)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < STILL_NEEDED_ITEMS.length - 1 ? '1px solid #fdedb0' : 'none', cursor: 'pointer', opacity: done ? 0.4 : 1 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, border: done ? 'none' : '2px solid #f59e0b', background: done ? '#22c55e' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {done && <span style={{ color: 'white', fontSize: 12, fontWeight: 800 }}>✓</span>}
            </div>
            <div style={{ fontSize: 14, color: done ? '#aaa' : '#7a4500', textDecoration: done ? 'line-through' : 'none', flex: 1 }}>{item}</div>
          </div>
        )
      })}
    </div>
  )
}
