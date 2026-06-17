import { ref } from 'vue'

const STORAGE_KEY = 'sky-heatmap'
const MAX_POINTS  = 3000

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}

// Module-level store so the heatmap accumulates across the whole session
// and survives component remounts.
const points = ref(load())  // [{lat, lon}]

export function useHeatmap() {
  function ingest(planes) {
    if (!planes?.length) return
    const incoming = planes
      .filter(p => p.lat != null && p.lon != null)
      .map(p => ({ lat: Math.round(p.lat * 100) / 100, lon: Math.round(p.lon * 100) / 100 }))
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
