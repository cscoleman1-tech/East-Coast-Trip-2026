import { TRIP_START, TRIP_END, ITINERARY } from './constants'

export const todayStr = () => new Date().toISOString().split('T')[0]

export const getDaysBetween = (d) => {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return Math.round((x - t) / 86400000)
}

export const getPhase = () => {
  const t = todayStr()
  if (t < TRIP_START) return 'pretrip'
  if (t > TRIP_END) return 'posttrip'
  return 'trip'
}

export const getTripDayIdx = () => {
  const t = todayStr()
  const i = ITINERARY.findIndex((d) => d.date === t)
  return i >= 0 ? i : 0
}

export const fmtDate = (d) =>
  new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
