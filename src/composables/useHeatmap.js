import { ref } from 'vue'

const STORAGE_KEY = 'sky-heatmap'
const MAX_POINTS  = 3000
const MAX_AGE_MS  = 7 * 24 * 60 * 60 * 1000  // 7 days

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    const cutoff = Date.now() - MAX_AGE_MS
    // Support old format without timestamp by treating those points as current
    return raw.filter(p => (p.t ?? Date.now()) > cutoff)
  }
  catch { return [] }
}

// Module-level store so the heatmap accumulates across the whole session
// and survives component remounts. Each point carries a timestamp for pruning.
const points = ref(load())  // [{lat, lon, t}]

export function useHeatmap() {
  function ingest(planes) {
    if (!planes?.length) return
    const now = Date.now()
    const incoming = planes
      .filter(p => p.lat != null && p.lon != null)
      .map(p => ({ lat: Math.round(p.lat * 100) / 100, lon: Math.round(p.lon * 100) / 100, t: now }))
    points.value.push(...incoming)
    if (points.value.length > MAX_POINTS)
      points.value = points.value.slice(-MAX_POINTS)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(points.value)) } catch {}
  }

  function clear() {
    points.value = []
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  return { points, ingest, clear }
}
