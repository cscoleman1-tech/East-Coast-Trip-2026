import { useState } from 'react'
import { TRIP_START, TRIP_END } from '../constants'
import { todayStr } from '../utils'

export default function MiniCalendar({ markedDates, onSelect, selectedDate, onClose }) {
  const [vy, setVy] = useState(2026)
  const [vm, setVm] = useState(5)
  const dim = new Date(vy, vm + 1, 0).getDate()
  const fd = new Date(vy, vm, 1).getDay()
  const mn = new Date(vy, vm, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const cells = []
  for (let i = 0; i < fd; i++) cells.push(null)
  for (let d = 1; d <= dim; d++) cells.push(d)
  const pm = () => vm === 0 ? (setVm(11), setVy(y => y - 1)) : setVm(m => m - 1)
  const nm = () => vm === 11 ? (setVm(0), setVy(y => y + 1)) : setVm(m => m + 1)
  const td = todayStr()

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: 20, width: '100%', maxWidth: 340, boxShadow: '0 12px 48px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <button onClick={pm} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #eee', background: 'white', cursor: 'pointer', fontSize: 18 }}>‹</button>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#1a3a5c' }}>{mn}</div>
          <button onClick={nm} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #eee', background: 'white', cursor: 'pointer', fontSize: 18 }}>›</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#aaa', padding: '2px 0' }}>{d}</div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />
            const ds = `${vy}-${String(vm + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isTrip = ds >= TRIP_START && ds <= TRIP_END
            const isMarked = markedDates.includes(ds)
            const isToday = ds === td, isSel = ds === selectedDate, isPast = ds < td
            return (
              <div key={day} onClick={() => !isPast && onSelect(ds)}
                style={{ textAlign: 'center', padding: '6px 2px', borderRadius: 8, fontSize: 14, fontWeight: isMarked || isToday ? 700 : 400, background: isSel ? '#1a3a5c' : isTrip ? '#e8f4fd' : isMarked ? '#fef0ff' : 'transparent', color: isSel ? 'white' : isPast ? '#ccc' : isToday ? '#2d7dd2' : '#333', cursor: isPast ? 'default' : 'pointer', border: isMarked && !isSel ? '2px solid #e8b4f5' : isToday && !isSel ? '2px solid #2d7dd2' : '2px solid transparent' }}>
                {day}
              </div>
            )
          })}
        </div>
        <button onClick={onClose} style={{ width: '100%', marginTop: 14, padding: 11, background: '#f0f4f8', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#555' }}>Close</button>
      </div>
    </div>
  )
}
