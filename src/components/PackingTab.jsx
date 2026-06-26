import { useState } from 'react'
import { MASTER_PACKING, INDIVIDUAL_PACKING } from '../constants'

export default function PackingTab({ packChecked, onTogglePack, customPackItems, setCustomPackItems, packPerson, setPackPerson }) {
  const [addingCat, setAddingCat] = useState(null)
  const [newItem, setNewItem] = useState('')
  const persons = ['Master', 'Chris', 'McKenna', 'Sawyer', 'Pierce', 'Bennett']
  const packData = packPerson === 'Master' ? MASTER_PACKING : { [`👤 ${packPerson}`]: INDIVIDUAL_PACKING[packPerson] || [] }
  const custom = customPackItems[packPerson] || {}
  const total = Object.entries(packData).reduce((a, [c, it]) => a + it.length + ((custom[c] || []).length), 0)
  const done = Object.keys(packChecked).filter(k => k.startsWith(`pack-${packPerson}-`) && packChecked[k]).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  const addIt = (cat) => {
    if (!newItem.trim()) return
    setCustomPackItems(p => ({ ...p, [packPerson]: { ...(p[packPerson] || {}), [cat]: [...((p[packPerson] || {})[cat] || []), newItem.trim()] } }))
    setNewItem('')
    setAddingCat(null)
  }

  const removeIt = (cat, idx, baseLen) => {
    const ci = idx - baseLen
    setCustomPackItems(p => ({ ...p, [packPerson]: { ...(p[packPerson] || {}), [cat]: ((p[packPerson] || {})[cat] || []).filter((_, i) => i !== ci) } }))
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, marginBottom: 12 }}>
        {persons.map(p => (
          <button key={p} onClick={() => setPackPerson(p)}
            style={{ whiteSpace: 'nowrap', padding: '7px 16px', borderRadius: 20, border: '1px solid', fontSize: 13, fontWeight: packPerson === p ? 700 : 400, cursor: 'pointer', background: packPerson === p ? '#1a3a5c' : 'white', color: packPerson === p ? 'white' : '#555', borderColor: packPerson === p ? '#1a3a5c' : '#ddd', flexShrink: 0 }}>
            {p === 'Master' ? '📋 Master' : p === 'Chris' ? '👨 Chris' : p === 'McKenna' ? '👩 McKenna' : `👦 ${p}`}
          </button>
        ))}
      </div>
      <div style={{ background: 'white', borderRadius: 12, padding: '12px 16px', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#1a3a5c' }}>{packPerson === 'Master' ? 'Family Pack List' : `${packPerson}'s List`}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: pct === 100 ? '#166534' : '#2d7dd2' }}>{done}/{total}</div>
        </div>
        <div style={{ background: '#f0f4f8', borderRadius: 99, height: 9, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#22c55e' : 'linear-gradient(90deg,#2d7dd2,#7c3aed)', borderRadius: 99, transition: 'width 0.4s' }} />
        </div>
        {pct === 100 && <div style={{ fontSize: 13, color: '#166534', marginTop: 6, textAlign: 'center', fontWeight: 600 }}>🎉 All packed!</div>}
      </div>
      {Object.entries(packData).map(([cat, base]) => {
        const cust = (custom[cat] || [])
        const all = [...base, ...cust]
        const cd = all.filter((_, i) => packChecked[`pack-${packPerson}-${cat}-${i}`]).length
        return (
          <div key={cat} style={{ background: 'white', borderRadius: 12, marginBottom: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
            <div style={{ background: '#f8f9fa', padding: '10px 14px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1a3a5c' }}>{cat}</div>
              <div style={{ fontSize: 13, color: '#888' }}>{cd}/{all.length}</div>
            </div>
            <div style={{ padding: '8px 14px' }}>
              {all.map((item, i) => {
                const key = `pack-${packPerson}-${cat}-${i}`
                const dk = !!packChecked[key]
                return (
                  <div key={i} onClick={() => onTogglePack(key)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: i < all.length - 1 ? '1px solid #f9fafb' : 'none', cursor: 'pointer' }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: dk ? 'none' : '2px solid #d1d5db', background: dk ? '#22c55e' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {dk && <span style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>✓</span>}
                    </div>
                    <div style={{ fontSize: 14, color: dk ? '#9ca3af' : '#333', textDecoration: dk ? 'line-through' : 'none', flex: 1 }}>{item}</div>
                    {i >= base.length && (
                      <span onClick={e => { e.stopPropagation(); removeIt(cat, i, base.length) }} style={{ color: '#e5e7eb', fontSize: 20, cursor: 'pointer' }}>×</span>
                    )}
                  </div>
                )
              })}
              {addingCat === `${packPerson}-${cat}` ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input value={newItem} onChange={e => setNewItem(e.target.value)} onKeyDown={e => e.key === 'Enter' && addIt(cat)} placeholder="Add item..." autoFocus
                    style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }} />
                  <button onClick={() => addIt(cat)} style={{ padding: '8px 14px', background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>+</button>
                  <button onClick={() => { setAddingCat(null); setNewItem('') }} style={{ padding: '8px 12px', background: 'white', color: '#888', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <button onClick={() => setAddingCat(`${packPerson}-${cat}`)} style={{ width: '100%', marginTop: 6, padding: 6, background: 'transparent', color: '#2d7dd2', border: 'none', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>+ Add item</button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
