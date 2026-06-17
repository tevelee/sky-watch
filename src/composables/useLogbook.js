import { ref, computed, watch, isRef } from 'vue'

const STORAGE_KEY = 'sky-logbook'
const MAX_ENTRIES = 500
const COOLDOWN_MS = 5 * 60_000  // same icao24 logged at most once per 5 min

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}

export function useLogbook(overhead) {
  const entries = ref(load())
  const recent  = new Map()   // icao24 -> last-logged timestamp

  function persist() {
    const kept = entries.value.slice(-MAX_ENTRIES)
    entries.value = kept
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(kept)) } catch {}
  }

  function record(plane) {
    if (!plane?.icao24) return
    const now = Date.now()
    // In-memory cooldown (fast path, same session)
    if ((recent.get(plane.icao24) ?? 0) + COOLDOWN_MS > now) return
    // Persisted cooldown — survives browser refresh within the same window
    const prev = [...entries.value].reverse().find(e => e.icao24 === plane.icao24)
    if (prev && now - prev.id < COOLDOWN_MS) return
    recent.set(plane.icao24, now)
    entries.value.push({
      id:       now,
      icao24:   plane.icao24,
      callsign: plane.callsign  ?? null,
      airline:  plane._airline  ?? null,
      flag:     plane._flag     ?? null,
      typeCode: plane.typeCode  ?? null,
      acName:   plane._ac?.name ?? null,
      reg:      plane.reg       ?? null,
      origIata: plane.origIata  ?? null,
      destIata: plane.destIata  ?? null,
      altFt:    plane.baro_alt  ?? null,
      speedKts: plane.velocity  ?? null,
      cls:      plane._classification ?? null,
    })
    persist()
  }

  // Only trigger when a new plane takes the overhead slot
  watch(
    () => (isRef(overhead) ? overhead.value : overhead)?.icao24,
    (id, prevId) => {
      if (!id || id === prevId) return
      const p = isRef(overhead) ? overhead.value : overhead
      if (p) record(p)
    }
  )

  const stats = computed(() => {
    const all = entries.value
    if (!all.length) return null
    const hourCounts    = {}
    const airlineCounts = {}
    all.forEach(e => {
      const h = new Date(e.id).getHours()
      hourCounts[h] = (hourCounts[h] || 0) + 1
      if (e.airline) airlineCounts[e.airline] = (airlineCounts[e.airline] || 0) + 1
    })
    const [bHour] = Object.entries(hourCounts).sort((a,b) => b[1]-a[1])
    const [top]   = Object.entries(airlineCounts).sort((a,b) => b[1]-a[1])
    return {
      total:           all.length,
      busiestHour:     bHour ? `${String(bHour[0]).padStart(2,'0')}:00` : null,
      topAirline:      top ? top[0] : null,
      topAirlineCount: top ? top[1] : null,
    }
  })

  function clearLog() {
    entries.value = []
    recent.clear()
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  return { entries, stats, clearLog }
}
