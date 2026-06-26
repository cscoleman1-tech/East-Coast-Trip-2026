export default function AddTaskForm({ taskText, setTaskText, taskType, setTaskType, onAdd, onCancel }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12, border: '1px dashed #cbd5e1', marginBottom: 8 }}>
      <input value={taskText} onChange={e => setTaskText(e.target.value)} onKeyDown={e => e.key === 'Enter' && onAdd()}
        placeholder="What needs to get done?" autoFocus
        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #dde1e7', fontSize: 15, marginBottom: 8, boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {[['booking', '🎟️ Book'], ['confirm', '📞 Confirm'], ['pack', '🎒 Pack'], ['activity', '🎯 Do'], ['food', '🍽️ Food']].map(([v, l]) => (
          <button key={v} onClick={() => setTaskType(v)}
            style={{ padding: '5px 11px', borderRadius: 20, border: '1px solid', fontSize: 12, cursor: 'pointer', fontWeight: taskType === v ? 700 : 400, background: taskType === v ? '#1a3a5c' : 'white', color: taskType === v ? 'white' : '#555', borderColor: taskType === v ? '#1a3a5c' : '#ddd' }}>
            {l}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onAdd} style={{ flex: 1, padding: 10, background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Add Task</button>
        <button onClick={onCancel} style={{ padding: '10px 16px', background: 'white', color: '#666', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}
