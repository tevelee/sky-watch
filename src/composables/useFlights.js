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
    icao24:    a.hex,
    callsign:  a.flight?.trim() ?? null,
    lat:       a.lat,
    lon:       a.lon,
    baro_alt:  a.alt_baro === 'ground' ? 0 : (Number(a.alt_baro) || 0),
    on_ground: a.alt_baro === 'ground' || Boolean(a.on_ground),
    velocity:  a.gs         || 0,
    heading:   a.track      || 0,
    vert_rate: a.baro_rate  || 0,
    mach:      a.mach       ?? null,
    squawk:    a.squawk     ?? null,
    typeCode:  a.t          ?? null,
    reg:       a.r          ?? null,
    // Origin/destination — included by airplanes.live when available from enriched data
    origIata:  a.orig_iata  ?? a.from_iata ?? null,
    origIcao:  a.orig_icao  ?? null,
    destIata:  a.dest_iata  ?? a.to_iata  ?? null,
    destIcao:  a.dest_icao  ?? null,
  }))
}

const photoCache = new Map()

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

  async function refresh() {
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
    } catch(e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  onMounted(() => { refresh(); timer = setInterval(refresh, REFRESH_MS) })
  onUnmounted(() => clearInterval(timer))
  watch([home, scanKm, airport], refresh, { deep: true })

  return { planes, loading, error, lastUpdate, refresh }
}
