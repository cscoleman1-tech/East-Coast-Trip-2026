import { useState, useEffect, useRef } from 'react'
import { ITINERARY, DEFAULT_PRETRIP, TRIP_CONTEXT } from './constants'
import { todayStr, getDaysBetween, getPhase, getTripDayIdx, fmtDate } from './utils'
import { loadLocal, saveLocal, cloudLoad, cloudSave } from './sync'
import TaskItem from './components/TaskItem'
import AddTaskForm from './components/AddTaskForm'
import MiniCalendar from './components/MiniCalendar'
import CountdownCard from './components/CountdownCard'
import StillNeeded from './components/StillNeeded'
import PackingTab from './components/PackingTab'

const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''

export default function App() {
  const phase = getPhase()
  const tripDayIdx = getTripDayIdx()
  const today = todayStr()

  const [userName, setUserName] = useState(() => localStorage.getItem('trip2026_user') || null)
  const [showLocModal, setShowLocModal] = useState(false)
  const [tab, setTab] = useState('today')
  const [dayIdx, setDayIdx] = useState(tripDayIdx)
  const [preTripDate, setPreTripDate] = useState(today)

  // Synced state
  const [customTasks, setCustomTasks] = useState({})
  const [checked, setChecked] = useState({})
  const [packChecked, setPackChecked] = useState({})
  const [customPackItems, setCustomPackItems] = useState({ Master: {}, Chris: {}, McKenna: {}, Sawyer: {}, Pierce: {}, Bennett: {} })
  const [bookingChecked, setBookingChecked] = useState({})

  // UI state
  const [packPerson, setPackPerson] = useState('Master')
  const [addingTo, setAddingTo] = useState(null)
  const [taskText, setTaskText] = useState('')
  const [taskType, setTaskType] = useState('confirm')
  const [taskDate, setTaskDate] = useState(today)
  const [showCalendar, setShowCalendar] = useState(false)
  const [expandedDay, setExpandedDay] = useState(null)

  // Location
  const [locLabel, setLocLabel] = useState(null)
  const [locError, setLocError] = useState(null)
  const [locLoading, setLocLoading] = useState(false)
  const [locAsked, setLocAsked] = useState(false)
  const [location, setLocation] = useState(null)

  // Sync
  const [syncStatus, setSyncStatus] = useState('idle')
  const [syncLabel, setSyncLabel] = useState('Tap ↻ to sync')
  const [lastBy, setLastBy] = useState(null)

  // Chat
  const [chatMessages, setChatMessages] = useState([{ role: 'assistant', text: 'Hey! 👋 Ask me anything about the trip — directions, what\'s booked, activities, food, transit — whatever you need.' }])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => { if (tab === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages, tab])

  // ── Location ──────────────────────────────────────────────────────────────
  const reverseGeocode = async (lat, lng) => {
    const fb = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'Accept-Language': 'en' }, signal: AbortSignal.timeout(6000) })
      if (r.ok) {
        const d = await r.json()
        const city = d.address?.city || d.address?.town || d.address?.village || d.address?.suburb || d.address?.county || ''
        const state = d.address?.state_code || d.address?.state || ''
        return city ? `${city}, ${state}` : fb
      }
    } catch {}
    return fb
  }

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocError('GPS not available on this device'); return }
    setLocLoading(true); setLocError(null); setLocAsked(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords
        setLocation({ lat, lng }); setLocLoading(false)
        const label = await reverseGeocode(lat, lng)
        setLocLabel(label)
      },
      err => {
        setLocLoading(false)
        if (err.code === 1) setLocError('Location denied — check iPhone Settings → Safari → Location')
        else if (err.code === 2) setLocError('GPS signal lost — tap to retry')
        else setLocError('Location timed out — tap to retry')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  }

  // ── Cloud Sync ────────────────────────────────────────────────────────────
  const getState = () => ({ customTasks, checked, packChecked, customPackItems, bookingChecked })

  const applyRemoteData = (data) => {
    if (!data) return
    if (data.customTasks) setCustomTasks(data.customTasks)
    if (data.checked) setChecked(data.checked)
    if (data.packChecked) setPackChecked(data.packChecked)
    if (data.customPackItems) setCustomPackItems(data.customPackItems)
    if (data.bookingChecked) setBookingChecked(data.bookingChecked)
    if (data._by && data._by !== (userName || '')) { setLastBy(data._by); setTimeout(() => setLastBy(null), 4000) }
  }

  const syncNow = async (patch) => {
    setSyncStatus('saving'); setSyncLabel('Saving…')
    const local = loadLocal()
    const merged = { ...local, ...patch, _by: userName || 'Someone', _at: Date.now() }
    saveLocal(merged)
    const ok = await cloudSave(merged)
    if (ok) { setSyncStatus('ok'); setSyncLabel('Synced ✓') }
    else { setSyncStatus('local'); setSyncLabel('Saved locally') }
  }

  const pullSync = async () => {
    setSyncStatus('loading'); setSyncLabel('Syncing…')
    const remote = await cloudLoad()
    if (remote) {
      const local = loadLocal()
      const useRemote = !local._at || (remote._at && remote._at > local._at)
      if (useRemote) { applyRemoteData(remote); saveLocal(remote) }
      setSyncStatus('ok'); setSyncLabel('Synced ✓')
    } else {
      const local = loadLocal()
      if (local) applyRemoteData(local)
      setSyncStatus('local'); setSyncLabel('Offline — local data')
    }
  }

  useEffect(() => { pullSync() }, [])
  useEffect(() => { const id = setInterval(() => pullSync(), 20000); return () => clearInterval(id) }, [])

  // ── State mutators ────────────────────────────────────────────────────────
  const toggleCheck = key => { setChecked(p => { const n = { ...p, [key]: !p[key] }; syncNow({ ...getState(), checked: n }); return n }) }
  const togglePack = key => { setPackChecked(p => { const n = { ...p, [key]: !p[key] }; syncNow({ ...getState(), packChecked: n }); return n }) }
  const toggleBooking = i => { setBookingChecked(p => { const n = { ...p, [i]: !p[i] }; syncNow({ ...getState(), bookingChecked: n }); return n }) }

  const handleAddTask = () => {
    if (!taskText.trim()) return
    const target = taskDate || today
    setCustomTasks(p => { const n = { ...p, [target]: [...(p[target] || []), { text: taskText.trim(), type: taskType }] }; syncNow({ ...getState(), customTasks: n }); return n })
    setTaskText(''); setAddingTo(null)
  }

  const removeTask = (date, idx) => {
    if (!window.confirm('Remove this task?')) return
    setCustomTasks(p => { const n = { ...p, [date]: (p[date] || []).filter((_, i) => i !== idx) }; syncNow({ ...getState(), customTasks: n }); return n })
  }

  const editTask = (date, idx, upd) => {
    setCustomTasks(p => { const n = { ...p, [date]: (p[date] || []).map((t, i) => i === idx ? { ...t, ...upd } : t) }; syncNow({ ...getState(), customTasks: n }); return n })
  }

  const updatePackItems = fn => {
    setCustomPackItems(p => { const n = typeof fn === 'function' ? fn(p) : fn; syncNow({ ...getState(), customPackItems: n }); return n })
  }

  const openAddForm = dateKey => { setAddingTo(dateKey); setTaskDate(dateKey); setTaskText(''); setTaskType('confirm') }

  const allPreDates = () => [...new Set([...Object.keys(DEFAULT_PRETRIP), ...Object.keys(customTasks)])].sort()
  const tasksForDate = d => ({ def: DEFAULT_PRETRIP[d] || [], cust: customTasks[d] || [] })

  // ── Chat ──────────────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const msg = chatInput.trim(); setChatInput('')
    setChatMessages(p => [...p, { role: 'user', text: msg }])
    setChatLoading(true)
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001', max_tokens: 1000,
          system: TRIP_CONTEXT + `\n\nToday is ${today}.` + (locLabel ? `\nUser current location: ${locLabel}.` : ''),
          messages: [...chatMessages.filter((_, i) => i > 0).map(m => ({ role: m.role, content: m.text })), { role: 'user', content: msg }],
        }),
      })
      const data = await r.json()
      const reply = data.content?.find(b => b.type === 'text')?.text || "Couldn't get a response."
      setChatMessages(p => [...p, { role: 'assistant', text: reply }])
    } catch {
      setChatMessages(p => [...p, { role: 'assistant', text: 'Connection error — try again.' }])
    }
    setChatLoading(false)
  }

  const markedDates = allPreDates()

  // ── SELECT USER ───────────────────────────────────────────────────────────
  if (!userName) return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg,#1a3a5c 0%,#2d7dd2 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <div style={{ fontSize: 52, marginBottom: 8 }}>🌴</div>
      <div style={{ color: 'white', fontWeight: 900, fontSize: 26, marginBottom: 4, textAlign: 'center' }}>East Coast Trip 2026</div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, marginBottom: 40, textAlign: 'center' }}>Who's opening the app?</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: '100%', maxWidth: 320, animation: 'fadeIn 0.4s ease' }}>
        {[['👨', 'Chris'], ['👩', 'McKenna'], ['😎', 'Sawyer'], ['😄', 'Pierce'], ['🧒', 'Bennett']].map(([emoji, name]) => (
          <button key={name} onClick={() => {
            localStorage.setItem('trip2026_user', name)
            setUserName(name)
            const hasSeenLocPrompt = localStorage.getItem('trip2026_loc_asked')
            if (!hasSeenLocPrompt) setShowLocModal(true)
          }}
            style={{ background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', borderRadius: 16, padding: '20px 12px', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 32 }}>{emoji}</span>{name}
          </button>
        ))}
      </div>
      <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 36, textAlign: 'center' }}>Changes sync to everyone in the family</div>
    </div>
  )

  const userEmoji = userName === 'Chris' ? '👨' : userName === 'McKenna' ? '👩' : userName === 'Sawyer' ? '😎' : userName === 'Pierce' ? '😄' : '🧒'

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "-apple-system,BlinkMacSystemFont,'Inter',system-ui,sans-serif", background: '#f0f4f8', minHeight: '100vh', maxWidth: 480, margin: '0 auto' }}>

      {showCalendar && <MiniCalendar markedDates={markedDates} selectedDate={taskDate} onSelect={d => { setTaskDate(d); setShowCalendar(false) }} onClose={() => setShowCalendar(false)} />}

      {/* Location permission modal */}
      {showLocModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 0.25s ease' }}>
          <div style={{ background: 'white', borderRadius: 24, padding: '28px 24px', width: '100%', maxWidth: 340, textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📍</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: '#1a3a5c', marginBottom: 8 }}>Share Your Location?</div>
            <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 24 }}>
              This lets the app show where you are on the trip — helpful for navigation, finding nearby spots, and letting the AI assistant know your current city.
            </div>
            <div style={{ background: '#f0f4f8', borderRadius: 14, padding: '12px 16px', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: '#888', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>What it does</div>
              <div style={{ fontSize: 13, color: '#444', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div>🗺️ Shows your city in the app header</div>
                <div>🤖 Helps the AI give location-aware answers</div>
                <div>🔗 Tap "Open Maps →" to navigate from your spot</div>
              </div>
            </div>
            <button onClick={() => { localStorage.setItem('trip2026_loc_asked', 'yes'); setShowLocModal(false); requestLocation() }}
              style={{ width: '100%', padding: 15, background: 'linear-gradient(135deg,#1a3a5c,#2d7dd2)', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 12, boxShadow: '0 4px 16px rgba(45,122,210,0.4)' }}>
              ✅ Yes, share my location
            </button>
            <button onClick={() => { localStorage.setItem('trip2026_loc_asked', 'no'); setLocAsked(true); setShowLocModal(false) }}
              style={{ width: '100%', padding: 13, background: 'transparent', color: '#888', border: '1px solid #e5e7eb', borderRadius: 14, fontSize: 15, cursor: 'pointer' }}>
              Not now
            </button>
            <div style={{ fontSize: 11, color: '#bbb', marginTop: 14, lineHeight: 1.5 }}>
              Location is only used while the app is open. You can change this any time in your phone's Settings.
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1a3a5c 0%,#2d6a9f 100%)', padding: 'env(safe-area-inset-top,18px) 16px 0', color: 'white' }}>
        <div style={{ paddingTop: 'max(18px, env(safe-area-inset-top))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', opacity: 0.65, textTransform: 'uppercase' }}>East Coast Family Trip</div>
              <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>Jul 9 – 24, 2026</div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button onClick={pullSync} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: syncStatus === 'ok' ? '#22c55e' : syncStatus === 'local' ? '#fbbf24' : '#93c5fd', display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 11, opacity: 0.8 }}>↻</span>
              </button>
              <button onClick={() => { localStorage.removeItem('trip2026_user'); setUserName(null) }} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, padding: '4px 10px', cursor: 'pointer', fontWeight: 600 }}>
                {userEmoji} {userName}
              </button>
            </div>
          </div>

          <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 6, display: 'flex', gap: 8 }}>
            <span>{syncLabel}</span>
            {lastBy && <span>· {lastBy} just updated ✨</span>}
          </div>

          {/* Location bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', marginBottom: 10, fontSize: 13, minHeight: 34 }}>
            {!locAsked && !locLabel && !locLoading && (
              <button onClick={requestLocation} style={{ background: 'none', border: 'none', color: 'white', fontSize: 13, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, opacity: 0.85, width: '100%' }}>
                <span>📍</span><span>Tap to enable location</span>
              </button>
            )}
            {locLoading && <><span>📍</span><span style={{ opacity: 0.7 }}>Finding your location…</span></>}
            {locLabel && !locError && (
              <><span>📍</span><span style={{ fontWeight: 500, flex: 1 }}>{locLabel}</span>
                <button onClick={requestLocation} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', padding: 0 }}>🔄</button>
                <a href={`https://maps.google.com/?q=${location?.lat},${location?.lng}`} target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12, textDecoration: 'none', marginLeft: 4 }}>Map →</a>
              </>
            )}
            {locError && (
              <><span>📍</span><span style={{ opacity: 0.8, fontSize: 12, flex: 1 }}>{locError}</span>
                <button onClick={requestLocation} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6, color: 'white', fontSize: 12, padding: '2px 8px', cursor: 'pointer', flexShrink: 0 }}>Retry</button>
              </>
            )}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            {[{ id: 'today', label: phase === 'pretrip' ? 'Pre-Trip' : 'Today' }, { id: 'trip', label: 'Trip' }, { id: 'pack', label: '🎒' }, { id: 'chat', label: 'Ask AI' }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '9px 4px', border: 'none', cursor: 'pointer', background: tab === t.id ? 'white' : 'transparent', color: tab === t.id ? '#1a3a5c' : 'rgba(255,255,255,0.75)', fontWeight: tab === t.id ? 700 : 500, fontSize: 13, borderRadius: '8px 8px 0 0', transition: 'all 0.15s' }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 14, paddingBottom: 40 }}>

        {/* PRE-TRIP / TODAY TAB */}
        {tab === 'today' && (
          <div>
            {phase === 'pretrip' && (() => {
              const { def, cust } = tasksForDate(preTripDate)
              const hasTasks = def.length + cust.length > 0
              return (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <button onClick={() => { const d = new Date(preTripDate + 'T12:00:00'); d.setDate(d.getDate() - 1); const s = d.toISOString().split('T')[0]; if (s >= today) setPreTripDate(s) }}
                      disabled={preTripDate <= today} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 18, opacity: preTripDate <= today ? 0.4 : 1 }}>‹</button>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#1a3a5c' }}>{preTripDate === today ? '📋 Today\'s To-Dos' : `📋 ${fmtDate(preTripDate)}`}</div>
                      {preTripDate !== today && <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{getDaysBetween(preTripDate) > 0 ? `in ${getDaysBetween(preTripDate)} days` : `${Math.abs(getDaysBetween(preTripDate))} days ago`}</div>}
                    </div>
                    <button onClick={() => { const d = new Date(preTripDate + 'T12:00:00'); d.setDate(d.getDate() + 1); const s = d.toISOString().split('T')[0]; if (s < '2026-07-09') setPreTripDate(s) }}
                      disabled={preTripDate >= new Date(new Date('2026-07-09T12:00:00').getTime() - 86400000).toISOString().split('T')[0]}
                      style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 18 }}>›</button>
                  </div>

                  {preTripDate === today && <CountdownCard />}

                  {hasTasks ? (
                    <>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{preTripDate === today ? 'Due Today' : 'Tasks for this date'}</div>
                      {def.map((t, i) => <TaskItem key={`d${i}`} task={t} checkKey={`${preTripDate}-def-${i}`} checked={checked} onToggle={toggleCheck} />)}
                      {cust.map((t, i) => <TaskItem key={`c${i}`} task={t} checkKey={`${preTripDate}-cust-${i}`} checked={checked} onToggle={toggleCheck} onRemove={() => removeTask(preTripDate, i)} onEdit={u => editTask(preTripDate, i, u)} />)}
                    </>
                  ) : (
                    <div style={{ background: 'white', borderRadius: 14, padding: '22px 16px', textAlign: 'center', marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
                      <div style={{ fontSize: 30, marginBottom: 8 }}>{preTripDate === today ? '🌴' : '📭'}</div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: '#333' }}>{preTripDate === today ? 'Nothing due today!' : 'No tasks on this date'}</div>
                      <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{preTripDate === today ? 'Enjoy the calm before the adventure.' : 'Add one below, or browse with ‹ ›'}</div>
                    </div>
                  )}

                  {addingTo === preTripDate ? (
                    <AddTaskForm taskText={taskText} setTaskText={setTaskText} taskType={taskType} setTaskType={setTaskType} onAdd={handleAddTask} onCancel={() => { setAddingTo(null); setTaskText('') }} />
                  ) : (
                    <button onClick={() => openAddForm(preTripDate)} style={{ width: '100%', padding: 11, background: 'white', color: '#1a3a5c', border: '2px dashed #b8ccdf', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}>+ Add a task</button>
                  )}

                  {preTripDate === today && (() => {
                    const up = allPreDates().filter(d => d > today).slice(0, 2)
                    if (!up.length) return null
                    return (
                      <div style={{ background: 'white', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginTop: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Coming Up</div>
                        {up.map(d => {
                          const { def: df, cust: ct } = tasksForDate(d)
                          const tot = df.length + ct.length
                          return (
                            <div key={d} onClick={() => setPreTripDate(d)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}>
                              <div style={{ width: 44, textAlign: 'center', background: '#f0f4f8', borderRadius: 8, padding: '4px 0' }}>
                                <div style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>{fmtDate(d).split(',')[0]}</div>
                                <div style={{ fontSize: 11, color: '#2d7dd2', fontWeight: 700 }}>in {getDaysBetween(d)}d</div>
                              </div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, color: '#333', fontWeight: 600 }}>{tot} task{tot !== 1 ? 's' : ''} due</div>
                                <div style={{ fontSize: 12, color: '#aaa' }}>{(df[0] || ct[0])?.text?.slice(0, 44)}…</div>
                              </div>
                              <div style={{ color: '#ccc' }}>›</div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}

                  {preTripDate !== today && <button onClick={() => setPreTripDate(today)} style={{ width: '100%', marginTop: 8, padding: 11, background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Back to Today</button>}
                </div>
              )
            })()}

            {phase === 'trip' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <button onClick={() => setDayIdx(Math.max(0, dayIdx - 1))} disabled={dayIdx === 0} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 18, opacity: dayIdx === 0 ? 0.4 : 1 }}>‹</button>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1a3a5c' }}>{ITINERARY[dayIdx].emoji} {ITINERARY[dayIdx].label} — {ITINERARY[dayIdx].city}</div>
                    <div style={{ fontSize: 11, color: getDaysBetween(ITINERARY[dayIdx].date) === 0 ? '#2d7dd2' : '#888', marginTop: 1 }}>{getDaysBetween(ITINERARY[dayIdx].date) === 0 ? 'Today!' : getDaysBetween(ITINERARY[dayIdx].date) > 0 ? `in ${getDaysBetween(ITINERARY[dayIdx].date)} days` : `${Math.abs(getDaysBetween(ITINERARY[dayIdx].date))} days ago`}</div>
                  </div>
                  <button onClick={() => setDayIdx(Math.min(ITINERARY.length - 1, dayIdx + 1))} disabled={dayIdx === ITINERARY.length - 1} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: 18, opacity: dayIdx === ITINERARY.length - 1 ? 0.4 : 1 }}>›</button>
                </div>
                <div style={{ background: 'white', borderRadius: 14, padding: '14px 16px', marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: '#1a3a5c' }}>{ITINERARY[dayIdx].title}</div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{ITINERARY[dayIdx].summary}</div>
                  {ITINERARY[dayIdx].lodging && <div style={{ marginTop: 8, fontSize: 12, color: '#888', background: '#f8f9fa', borderRadius: 6, padding: '6px 10px' }}>🏨 {ITINERARY[dayIdx].lodging}</div>}
                  {ITINERARY[dayIdx].transit && <div style={{ marginTop: 6, fontSize: 12, color: '#888', background: '#f8f9fa', borderRadius: 6, padding: '6px 10px' }}>🚌 {ITINERARY[dayIdx].transit}</div>}
                </div>
                {ITINERARY[dayIdx].confirmations?.map((c, i) => (
                  <div key={i} style={{ background: '#e8f4fd', borderRadius: 10, padding: '10px 14px', marginBottom: 8, border: '1px solid #b3d9f5' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1a3a5c' }}>✅ {c.label}</div>
                    <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{c.detail}</div>
                  </div>
                ))}
                <div style={{ fontWeight: 600, fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Plan for the day</div>
                {ITINERARY[dayIdx].items.map((it, i) => <TaskItem key={i} task={it} checkKey={`trip-${ITINERARY[dayIdx].date}-${i}`} checked={checked} onToggle={toggleCheck} />)}
                {(customTasks[ITINERARY[dayIdx].date] || []).map((t, i) => (
                  <TaskItem key={`c${i}`} task={t} checkKey={`trip-${ITINERARY[dayIdx].date}-c${i}`} checked={checked} onToggle={toggleCheck} onRemove={() => removeTask(ITINERARY[dayIdx].date, i)} onEdit={u => editTask(ITINERARY[dayIdx].date, i, u)} />
                ))}
                {addingTo === ITINERARY[dayIdx].date ? (
                  <AddTaskForm taskText={taskText} setTaskText={setTaskText} taskType={taskType} setTaskType={setTaskType} onAdd={handleAddTask} onCancel={() => { setAddingTo(null); setTaskText('') }} />
                ) : (
                  <button onClick={() => openAddForm(ITINERARY[dayIdx].date)} style={{ width: '100%', padding: 11, background: 'white', color: '#1a3a5c', border: '2px dashed #b8ccdf', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}>+ Add a task</button>
                )}
                {dayIdx !== tripDayIdx && <button onClick={() => setDayIdx(tripDayIdx)} style={{ width: '100%', marginTop: 4, padding: 11, background: '#1a3a5c', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Jump to Today</button>}
              </div>
            )}

            {phase === 'posttrip' && (
              <div style={{ textAlign: 'center', padding: '48px 20px' }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>🏠</div>
                <div style={{ fontWeight: 700, fontSize: 20, color: '#1a3a5c' }}>Trip Complete!</div>
                <div style={{ fontSize: 14, color: '#888', marginTop: 8 }}>Hope it was amazing. 🌊🗽🍫</div>
              </div>
            )}
          </div>
        )}

        {/* TRIP TAB */}
        {tab === 'trip' && (
          <div>
            <StillNeeded bookingChecked={bookingChecked} onToggle={toggleBooking} />
            <div style={{ fontWeight: 700, fontSize: 13, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 8px' }}>Full Trip Plan</div>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>Tap any day to expand · add or edit tasks</div>
            {ITINERARY.map((day, i) => {
              const diff = getDaysBetween(day.date)
              const isPast = diff < 0, isToday = diff === 0, isOpen = expandedDay === i
              const cust = customTasks[day.date] || []
              const total = day.items.length + cust.length
              const done = [...day.items.map((_, j) => checked[`trip-${day.date}-${j}`]), ...cust.map((_, j) => checked[`trip-${day.date}-c${j}`])].filter(Boolean).length
              return (
                <div key={i} style={{ background: 'white', borderRadius: 12, marginBottom: 8, overflow: 'hidden', border: isToday ? '2px solid #2d6a9f' : '1px solid #eee', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div onClick={() => setExpandedDay(isOpen ? null : i)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', cursor: 'pointer', background: isToday ? '#e8f4fd' : isPast ? '#fafafa' : 'white' }}>
                    <div style={{ fontSize: 22, flexShrink: 0 }}>{day.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: isPast ? '#aaa' : '#1a3a5c' }}>{day.label}</div>
                        {isToday && <span style={{ fontSize: 10, fontWeight: 700, color: 'white', background: '#2d6a9f', borderRadius: 5, padding: '1px 6px' }}>TODAY</span>}
                        {!isPast && !isToday && diff <= 5 && <span style={{ fontSize: 10, fontWeight: 600, color: '#e07b39', background: '#fef0e6', borderRadius: 5, padding: '1px 6px' }}>in {diff}d</span>}
                      </div>
                      <div style={{ fontSize: 12, color: isPast ? '#bbb' : '#555', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{day.title}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {done > 0 && <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>{done}/{total}</div>}
                      <div style={{ color: '#ccc', fontSize: 18, transition: 'transform 0.2s', transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</div>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ padding: '0 14px 14px', borderTop: '1px solid #f3f4f6' }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, marginBottom: 10 }}>
                        {day.lodging && <div style={{ fontSize: 11, background: '#eff6ff', color: '#1e40af', borderRadius: 6, padding: '3px 8px' }}>🏨 {day.lodging}</div>}
                        {day.transit && <div style={{ fontSize: 11, background: '#f0fdf4', color: '#166634', borderRadius: 6, padding: '3px 8px' }}>🚌 {day.transit}</div>}
                      </div>
                      {day.confirmations?.map((c, ci) => (
                        <div key={ci} style={{ background: '#e8f4fd', borderRadius: 8, padding: '8px 12px', marginBottom: 8, border: '1px solid #b3d9f5' }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: '#1a3a5c' }}>✅ {c.label}</div>
                          <div style={{ fontSize: 11, color: '#555', marginTop: 1 }}>{c.detail}</div>
                        </div>
                      ))}
                      <div style={{ fontWeight: 600, fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Activities</div>
                      {day.items.map((it, j) => <TaskItem key={j} task={it} checkKey={`trip-${day.date}-${j}`} checked={checked} onToggle={toggleCheck} />)}
                      {cust.length > 0 && <div style={{ fontWeight: 600, fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '8px 0 6px' }}>Added by family</div>}
                      {cust.map((t, j) => (
                        <TaskItem key={`c${j}`} task={t} checkKey={`trip-${day.date}-c${j}`} checked={checked} onToggle={toggleCheck} onRemove={() => removeTask(day.date, j)} onEdit={u => editTask(day.date, j, u)} />
                      ))}
                      {addingTo === day.date ? (
                        <AddTaskForm taskText={taskText} setTaskText={setTaskText} taskType={taskType} setTaskType={setTaskType} onAdd={handleAddTask} onCancel={() => { setAddingTo(null); setTaskText('') }} />
                      ) : (
                        <button onClick={() => openAddForm(day.date)} style={{ width: '100%', marginTop: 8, padding: 9, background: '#f8fafc', color: '#2d6a9f', border: '2px dashed #b8ccdf', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Add task to this day</button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* PACKING TAB */}
        {tab === 'pack' && (
          <PackingTab packChecked={packChecked} onTogglePack={togglePack} customPackItems={customPackItems} setCustomPackItems={updatePackItems} packPerson={packPerson} setPackPerson={setPackPerson} />
        )}

        {/* CHAT TAB */}
        {tab === 'chat' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 220px)', minHeight: 380 }}>
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ marginBottom: 12, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '85%', padding: '11px 14px', borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: m.role === 'user' ? '#1a3a5c' : 'white', color: m.role === 'user' ? 'white' : '#222', fontSize: 14, lineHeight: 1.5, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', whiteSpace: 'pre-wrap' }}>{m.text}</div>
                </div>
              ))}
              {chatLoading && <div style={{ display: 'flex', marginBottom: 12 }}><div style={{ background: 'white', borderRadius: '18px 18px 18px 4px', padding: '11px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', fontSize: 18 }}>···</div></div>}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8, flexShrink: 0 }}>
              {["What's still not booked?", 'Subway to Penn Station?', 'Hershey Park tips?', 'Best cheesesteak in Philly?', 'OBX activities for kids?'].map((q, i) => (
                <button key={i} onClick={() => setChatInput(q)} style={{ whiteSpace: 'nowrap', padding: '7px 13px', borderRadius: 20, border: '1px solid #ddd', background: 'white', fontSize: 13, cursor: 'pointer', color: '#333', flexShrink: 0 }}>{q}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()}
                placeholder="Ask anything about the trip..." style={{ flex: 1, padding: '13px 14px', borderRadius: 12, border: '1px solid #ddd', fontSize: 15, background: 'white' }} />
              <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{ padding: '13px 18px', borderRadius: 12, border: 'none', background: chatLoading || !chatInput.trim() ? '#ccc' : '#1a3a5c', color: 'white', fontWeight: 700, fontSize: 15, cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer' }}>→</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
