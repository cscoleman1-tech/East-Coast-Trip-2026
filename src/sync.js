import { BIN_ID } from './constants'

const LS_KEY = 'trip2026_local'
const BIN_KEY = import.meta.env.VITE_JSONBIN_KEY || ''

export function loadLocal() {
  try {
    const s = localStorage.getItem(LS_KEY)
    return s ? JSON.parse(s) : {}
  } catch {
    return {}
  }
}

export function saveLocal(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  } catch {}
}

const JSONBIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`
const JSONBIN_HEADERS = {
  'Content-Type': 'application/json',
  'X-Master-Key': BIN_KEY,
  'X-Bin-Meta': false,
}

export async function cloudLoad() {
  if (!BIN_KEY) return null
  try {
    const r = await fetch(JSONBIN_URL + '/latest', {
      headers: JSONBIN_HEADERS,
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}

export async function cloudSave(data) {
  if (!BIN_KEY) return false
  try {
    const r = await fetch(JSONBIN_URL, {
      method: 'PUT',
      headers: JSONBIN_HEADERS,
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(8000),
    })
    return r.ok
  } catch {
    return false
  }
}
