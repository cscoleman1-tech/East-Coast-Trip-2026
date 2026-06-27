import { useState } from 'react'
import { TYPE_ICONS, TYPE_COLORS } from '../constants'

export default function TaskItem({ task, checkKey, checked, onToggle, onRemove, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(task.text)
  const [editType, setEditType] = useState(task.type)
  const done = !!checked[checkKey]
  const colors = TYPE_COLORS[task.type] || TYPE_COLORS.tip

  const save = () => {
    if (editText.trim()) onEdit?.({ text: editText.trim(), type: editType })
    setEditing(false)
  }

  if (editing) return (
    <div style={{ background: '#f0f6ff', borderRadius: 10, padding: '10px 12px', marginBottom: 7, border: '1px solid #93c5fd' }}>
      <input value={editText} onChange={e => setEditText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
        autoFocus style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid #93c5fd', fontSize: 15, marginBottom: 8, boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
        {[['booking', '🎟️'], ['confirm', '📞'], ['pack', '🎒'], ['activity', '🎯'], ['food', '🍽️'], ['tip', '💡']].map(([v, ic]) => (
          <button key={v} onClick={() => setEditType(v)}
            style={{ padding: '4px 10px', borderRadius: 16, border: '1px solid', fontSize: 12, cursor: 'pointer', fontWeight: editType === v ? 700 : 400, background: editType === v ? '#1a3a5c' : 'white', color: editType === v ? 'white' : '#555', borderColor: editType === v ? '#1a3a5c' : '#ddd' }}>
            {ic} {v}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} style={{ flex: 1, padding: 8, background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Save</button>
        <button onClick={() => setEditing(false)} style={{ padding: '8px 14px', background: 'white', color: '#666', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: done ? '#f9fafb' : colors.bg, border: `1px solid ${done ? '#e5e7eb' : colors.border}`, borderRadius: 10, padding: '11px 12px', marginBottom: 8 }}>
      <div onClick={() => onToggle(checkKey)}
        style={{ width: 24, height: 24, borderRadius: 6, border: done ? 'none' : `2px solid ${colors.border}`, background: done ? '#6b7280' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, cursor: 'pointer' }}>
        {done && <span style={{ color: 'white', fontSize: 14, fontWeight: 800 }}>✓</span>}
      </div>
      <div style={{ flex: 1, fontSize: 15, color: done ? '#9ca3af' : colors.text, lineHeight: 1.4, textDecoration: done ? 'line-through' : 'none', cursor: 'pointer' }} onClick={() => onToggle(checkKey)}>
        <span style={{ marginRight: 5 }}>{TYPE_ICONS[task.type] || '•'}</span>{task.text}
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
        {onEdit && !done && <span onClick={() => { setEditText(task.text); setEditType(task.type); setEditing(true) }} style={{ fontSize: 15, cursor: 'pointer', opacity: 0.4 }}>✏️</span>}
        {!onEdit && !onRemove && <span style={{ fontSize: 12, opacity: 0.15 }}>🔒</span>}
        {onRemove && <span onClick={onRemove} style={{ color: '#d1d5db', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</span>}
      </div>
    </div>
  )
}
