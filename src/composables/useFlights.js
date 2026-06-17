import { ref, watch, onMounted, onUnmounted, isRef } from 'vue'
import { AIRCRAFT } from '../data/aircraft'
import { getAirline } from '../data/airlines'
import { haversine, ftToM, ktsToKmh, classifyFlight, etaOverhead, squawkAlert } from '../utils'

const REFRESH_MS = 60_000

function getV(r) { return isRef(r) ? r.value : r }

function aircraftInfo(code) {
  return code ? AIRCRAFT[code.toUpperCase()] ?? null : null
}

function enrichPlane(raw, home, airport) {
  const dist = (raw.lat != null && raw.lon != null)
    ? haversine(home.lat, home.lon, raw.lat, raw.lon)
    : Infinity
  const ac = aircraftInfo(raw.typeCode)
  const airline = getAirline(raw.callsign)
  return {
    ...raw,
    _dist:           dist,
    _altM:           raw.baro_alt > 0 ? ftToM(raw.baro_alt) : null,
    _speedKmh:       raw.velocity ? ktsToKmh(raw.velocity) : null,
    _airline:        airline?.name ?? null,
    _flag:           airline?.flag ?? null,
    _ac:             ac,
    _pax:            ac?.pax ?? null,
    _classification: classifyFlight(raw, airport),
    _eta:            etaOverhead(raw, home),
    _squawkAlert:    squawkAlert(raw.squawk),
  }
}

async function fetchFromApi(home, nm) {
  const url = `https://api.airplanes.live/v2/point/${home.lat}/${home.lon}/${nm}`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const d = await r.json()
  return (d.ac || []).map(a => ({
    icao24:       a.hex,
    callsign:     a.flight?.trim() ?? null,
    lat:          a.lat,
    lon:          a.lon,
    baro_alt:     a.alt_baro === 'ground' ? 0 : (Number(a.alt_baro) || 0),
    on_ground:    a.alt_baro === 'ground' || Boolean(a.on_ground),
    velocity:     a.gs          || 0,       // ground speed, knots
    ias:          a.ias         ?? null,    // indicated airspeed, knots
    tas:          a.tas         ?? null,    // true airspeed, knots
    heading:      a.track       || 0,       // true track
    mag_heading:  a.mag_heading ?? null,    // magnetic heading
    true_heading: a.true_heading?? null,
    roll:         a.roll        ?? null,    // bank angle, degrees
    vert_rate:    a.baro_rate   || 0,       // ft/min
    mach:         a.mach        ?? null,
    squawk:       a.squawk      ?? null,
    typeCode:     a.t           ?? null,
    reg:          a.r           ?? null,
    // Autopilot targets — tells you where the plane is headed vertically/laterally
    nav_alt_mcp:  a.nav_altitude_mcp ?? null,  // cleared altitude (ft)
    nav_alt_fms:  a.nav_altitude_fms ?? null,  // FMS target altitude (ft)
    nav_heading:  a.nav_heading      ?? null,  // target heading
    nav_qnh:      a.nav_qnh          ?? null,  // altimeter setting (hPa)
    // Atmosphere at cruise
    wind_dir:     a.wd  ?? null,   // wind direction (°)
    wind_kt:      a.ws  ?? null,   // wind speed (kt)
    oat:          a.oat ?? null,   // outside air temp (°C)
    tat:          a.tat ?? null,   // total air temp (°C)
    // Origin/destination — rarely present but included when enriched
    origIata:     a.orig_iata  ?? a.from_iata ?? null,
    destIata:     a.dest_iata  ?? a.to_iata   ?? null,
  }))
}

const photoCache = new Map()

// ── Route cache ──────────────────────────────────────────────────────────────
// Two-tier: sessionStorage for cross-refresh persistence within the same tab,
// in-memory Map as a fast synchronous read-through layer.
//
// Sentinel value `false` means "looked up, nothing found" so we don't retry.
// The key is absent when the callsign has never been looked up, or when the
// last attempt was a network error (so we retry next time).
const ROUTE_SESSION_KEY = 'sky-routes'
const routeCache = new Map()     // callsign -> route | false
const routePending = new Map()   // callsign -> Promise (in-flight dedup)

// Pre-populate from sessionStorage so page refreshes skip re-fetching.
try {
  const stored = JSON.parse(sessionStorage.getItem(ROUTE_SESSION_KEY) || '{}')
  Object.entries(stored).forEach(([cs, r]) => routeCache.set(cs, r))
} catch {}

function persistRouteCache() {
  try {
    const obj = {}
    routeCache.forEach((v, k) => { obj[k] = v })
    sessionStorage.setItem(ROUTE_SESSION_KEY, JSON.stringify(obj))
  } catch {}
}

// Concurrency limiter — at most 4 route requests run simultaneously so we
// don't hammer the adsbdb API with a full plane list at once.
const MAX_CONCURRENT = 4
let   activeCount    = 0
const waitQueue      = []

function processQueue() {
  while (waitQueue.length && activeCount < MAX_CONCURRENT) {
    const { fn, resolve, reject } = waitQueue.shift()
    activeCount++
    fn().then(resolve, reject).finally(() => { activeCount--; processQueue() })
  }
}

function withConcurrencyLimit(fn) {
  return new Promise((resolve, reject) => {
    waitQueue.push({ fn, resolve, reject })
    processQueue()
  })
}

async function fetchRouteNetwork(cs) {
  const ctrl  = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 8000)
  try {
    const r = await fetch(
      `https://api.adsbdb.com/v0/callsign/${encodeURIComponent(cs)}`,
      { signal: ctrl.signal }
    )
    clearTimeout(timer)

    // Rate-limited — back off 2 s and retry once.
    if (r.status === 429) {
      await new Promise(res => setTimeout(res, 2000))
      return fetchRouteNetwork(cs)
    }

    let route = false   // sentinel: looked up, not found
    if (r.ok) {
      const d  = await r.json()
      const fr = d?.response?.flightroute
      if (fr?.origin && fr?.destination) {
        route = {
          origIata: fr.origin.iata_code         || fr.origin.icao_code      || null,
          origName: fr.origin.municipality      || fr.origin.name           || null,
          destIata: fr.destination.iata_code    || fr.destination.icao_code || null,
          destName: fr.destination.municipality || fr.destination.name      || null,
        }
      }
    }
    // Cache & persist on clean response (success or 404/not-found).
    // Network errors / timeouts are NOT cached — they can be retried.
    routeCache.set(cs, route)
    persistRouteCache()
    return route === false ? null : route
  } catch (err) {
    clearTimeout(timer)
    throw err   // propagate so the caller can decide not to cache
  }
}

// Public API — returns a route object, or null if not found / request failed.
export async function fetchRoute(callsign) {
  const cs = callsign?.trim()
  if (!cs) return null

  // Synchronous cache hit (includes "not found" sentinel)
  if (routeCache.has(cs)) {
    const v = routeCache.get(cs)
    return v === false ? null : v
  }

  // Deduplicate in-flight requests for the same callsign
  if (routePending.has(cs)) return routePending.get(cs)

  const p = withConcurrencyLimit(() => fetchRouteNetwork(cs))
    .catch(() => null)              // network/timeout → null, don't propagate
    .finally(() => routePending.delete(cs))
  routePending.set(cs, p)
  return p
}

export async function fetchPhoto(reg) {
  if (!reg) return null
  if (photoCache.has(reg)) return photoCache.get(reg)
  try {
    const r = await fetch(`https://api.planespotters.net/pub/photos/reg/${reg}`)
    if (r.ok) {
      const d = await r.json()
      const url = d.photos?.[0]?.thumbnail_large?.src ?? d.photos?.[0]?.thumbnail?.src ?? null
      photoCache.set(reg, url)
      return url
    }
  } catch {}
  photoCache.set(reg, null)
  return null
}

export function useFlights(home, scanKm, airport) {
  const planes      = ref([])
  const loading     = ref(false)
  const error       = ref(null)
  const lastUpdate  = ref(null)
  let timer = null
  let refreshId = 0

  async function refresh() {
    const myId = ++refreshId
    loading.value = true
    error.value   = null
    try {
      const h  = getV(home)
      const km = getV(scanKm)
      const ap = getV(airport)
      const nm = Math.max(10, Math.round(km / 1.852))
      const raw = await fetchFromApi(h, nm)
      planes.value = raw.map(p => enrichPlane(p, h, ap))
      lastUpdate.value = new Date()
      enrichRoutes(myId)
    } catch(e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // Resolve origin/destination for planes that don't have it yet.
  // Runs in the background (doesn't block the loading state) and is guarded
  // by refreshId so a stale lookup can never overwrite a newer scan's data.
  function enrichRoutes(myId) {
    const list = planes.value.filter(p => p.callsign && !p.origIata && !p.destIata)
    list.forEach(async p => {
      const route = await fetchRoute(p.callsign)
      // Drop result if a newer scan has already replaced this plane set
      if (!route || myId !== refreshId) return
      p.origIata  = route.origIata
      p.destIata  = route.destIata
      p._origName = route.origName
      p._destName = route.destName
    })
  }

  onMounted(() => { refresh(); timer = setInterval(refresh, REFRESH_MS) })
  onUnmounted(() => clearInterval(timer))
  watch([home, scanKm, airport], refresh, { deep: true })

  return { planes, loading, error, lastUpdate, refresh }
}
