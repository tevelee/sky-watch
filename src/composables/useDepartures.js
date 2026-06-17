import { ref, watch, onMounted, onUnmounted, isRef } from 'vue'
import { AIRCRAFT } from '../data/aircraft'
import { getAirline } from '../data/airlines'
import { fetchRoute } from './useFlights'

const REFRESH_MS = 90_000

function getV(r) { return isRef(r) ? r.value : r }

// Pull aircraft sitting on the ground within ~9 km (5 nm) of the airport.
async function fetchGround(ap) {
  const url = `https://api.airplanes.live/v2/point/${ap.lat}/${ap.lon}/5`
  const r = await fetch(url)
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  const d = await r.json()
  return (d.ac || [])
    .filter(a => a.alt_baro === 'ground' || a.on_ground)
    .map(a => ({
      icao24:   a.hex,
      callsign: a.flight?.trim() ?? null,
      typeCode: a.t ?? null,
      reg:      a.r ?? null,
    }))
}

// "Departing soon" board for the nearby airport.
//
// There's no free, keyless source of published departure schedules, so this is
// derived live: aircraft physically on the ground at the airport, with route
// lookups used to tell departures (route originates here) from arrivals that
// have just landed (route ends here). Arrivals are dropped; confirmed
// departures are surfaced first, followed by ground traffic with no known route.
export function useDepartures(airport) {
  const departures = ref([])
  const loading    = ref(false)
  const error      = ref(null)
  let timer = null

  async function refresh() {
    const ap = getV(airport)
    if (!ap) { departures.value = []; return }
    loading.value = true
    error.value   = null
    try {
      const ground = await fetchGround(ap)
      const enriched = await Promise.all(ground.map(async g => {
        const route   = g.callsign ? await fetchRoute(g.callsign) : null
        const airline = getAirline(g.callsign)
        const ac      = g.typeCode ? AIRCRAFT[g.typeCode.toUpperCase()] ?? null : null
        const departing = route ? route.origIata === ap.iata : null
        return {
          ...g,
          _airline:   airline?.name ?? null,
          _flag:      airline?.flag ?? null,
          _ac:        ac,
          _destIata:  route?.destIata ?? null,
          _destName:  route?.destName ?? null,
          _departing: departing,
        }
      }))
      departures.value = enriched
        .filter(p => p._departing !== false)              // drop confirmed arrivals
        .sort((a, b) => (b._departing === true) - (a._departing === true))
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  onMounted(() => { refresh(); timer = setInterval(refresh, REFRESH_MS) })
  onUnmounted(() => clearInterval(timer))
  watch(() => getV(airport), refresh, { deep: true })

  return { departures, loading, error }
}
