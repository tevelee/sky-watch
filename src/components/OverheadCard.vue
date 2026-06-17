<template>
  <div class="card">
    <div class="card-title">Overhead right now</div>

    <!-- No plane state -->
    <div v-if="!plane" class="empty">
      <div class="icon">🔭</div>
      <p>Scanning for aircraft…</p>
    </div>

    <!-- Emergency squawk banner -->
    <div v-if="plane?._squawkAlert" class="squawk-alert">
      {{ plane._squawkAlert }} · Squawk {{ plane.squawk }}
    </div>

    <template v-if="plane">
      <!-- Photo -->
      <div class="photo-wrap">
        <img v-if="photoUrl" :src="photoUrl" class="photo" alt="Aircraft photo" @error="photoUrl = null" />
        <div v-else class="photo-ph">✈️</div>
      </div>

      <!-- Identity -->
      <div class="callsign">{{ plane.callsign || plane.icao24?.toUpperCase() }}</div>
      <div class="airline">
        <span v-if="plane._flag" class="flag">{{ plane._flag }}</span>
        {{ plane._airline || '—' }}
      </div>
      <div class="model">{{ plane._ac?.name || plane.typeCode || 'Unknown type' }}{{ plane.reg ? ' · ' + plane.reg : '' }}</div>

      <!-- Route -->
      <div class="route-bar">
        <div class="ap">
          <div class="ap-code">{{ plane.origIata || '—' }}</div>
          <div class="ap-name">{{ originName }}</div>
        </div>
        <div class="route-mid">
          <div class="route-line"></div>
          <span class="route-plane">✈</span>
          <div class="route-line"></div>
        </div>
        <div class="ap">
          <div class="ap-code">{{ plane.destIata || '—' }}</div>
          <div class="ap-name">{{ destName }}</div>
        </div>
      </div>

      <!-- Classification -->
      <div v-if="classification" :class="['class-badge', classification.css]">
        {{ classification.label }}
      </div>

      <!-- In-flight stats -->
      <div class="sec-label">In flight</div>
      <div class="stats-grid">
        <div class="stat">
          <div class="sl">Altitude</div>
          <div class="sv">{{ plane._altM != null ? (plane._altM / 1000).toFixed(1) : '—' }}</div>
          <div class="su">km</div>
        </div>
        <div class="stat">
          <div class="sl">Speed</div>
          <div class="sv">{{ plane._speedKmh ?? '—' }}</div>
          <div class="su">km/h</div>
        </div>
        <div class="stat">
          <div class="sl">Heading</div>
          <div class="sv">{{ plane.heading ? Math.round(plane.heading) + '°' : '—' }}</div>
          <div class="su">{{ plane.heading ? headingCard(plane.heading) : '' }}</div>
        </div>
      </div>

      <!-- Airframe specs -->
      <template v-if="plane._ac?.ws">
        <div class="sec-label">Airframe</div>
        <div class="stats-grid">
          <div class="stat">
            <div class="sl">Wingspan</div>
            <div class="sv">{{ plane._ac.ws }}</div>
            <div class="su">m</div>
          </div>
          <div class="stat">
            <div class="sl">Length</div>
            <div class="sv">{{ plane._ac.len }}</div>
            <div class="su">m</div>
          </div>
          <div class="stat">
            <div class="sl">Engines</div>
            <div class="sv">{{ plane._ac.eng }}</div>
            <div class="su">{{ plane._ac.eng === 1 ? 'turboprop' : 'turbofans' }}</div>
          </div>
        </div>
      </template>

      <!-- Look-up & physics -->
      <template v-if="lookUp">
        <div class="sec-label">Sky position</div>
        <div class="lookups">
          <div class="lookup-row">
            <span class="lk-icon">🧭</span>
            <span>Look <strong>{{ lookUp.cardinal }}</strong> at <strong>{{ lookUp.elevation }}°</strong> above the horizon</span>
          </div>
          <div class="lookup-row">
            <span class="lk-icon">🔊</span>
            <span>Sound left this aircraft <strong>{{ lookUp.soundDelay }}s ago</strong> ({{ lookUp.dist3dKm }} km away)</span>
          </div>
          <div v-if="plane.mach" class="lookup-row">
            <span class="lk-icon">🌀</span>
            <span>Flying at <strong>Mach {{ plane.mach.toFixed(2) }}</strong></span>
          </div>
        </div>
      </template>

      <!-- Badges -->
      <div class="badges">
        <span v-if="plane._pax"   class="badge hi">👥 ~{{ plane._pax }} passengers</span>
        <span v-if="vertInfo"     class="badge">{{ vertInfo }}</span>
        <span v-if="plane._eta"   class="badge amber">⏱ overhead in {{ plane._eta }} min</span>
        <span v-if="plane._altM && plane._altM > 8500" class="badge">☁️ Cruising altitude</span>
        <span v-if="plane._altM && plane._altM < 1500" class="badge amber">🛬 Low approach</span>
        <span v-if="plane._ac?.cat === 'super'"        class="badge hi">🐘 Super-heavy</span>
        <span v-if="plane._ac?.cat === 'heavy'"        class="badge">⚖️ Heavy wake turbulence</span>
        <span v-if="plane.squawk" class="badge">📡 Squawk {{ plane.squawk }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { lookUpAngle, vertStr, bearingCard as headingCard } from '../utils'
import { fetchPhoto } from '../composables/useFlights'
import { AIRPORTS } from '../data/airports'

const props = defineProps({
  plane:   Object,
  home:    Object,
  airport: Object,
})

const photoUrl = ref(null)

watch(() => props.plane?.reg, async (reg) => {
  photoUrl.value = reg ? (await fetchPhoto(reg)) : null
}, { immediate: true })

const lookUp = computed(() =>
  props.plane && props.home ? lookUpAngle(props.plane, props.home) : null
)

const vertInfo = computed(() => vertStr(props.plane?.vert_rate))

function airportName(iata) {
  if (!iata) return null
  const ap = AIRPORTS.find(a => a.iata === iata)
  return ap ? ap.city : iata
}

const originName = computed(() => airportName(props.plane?.origIata) || 'Origin')
const destName   = computed(() => airportName(props.plane?.destIata) || 'Destination')

const CLASS_LABELS = {
  arriving:  { css: 'cls-arr', label: '' },
  departing: { css: 'cls-dep', label: '' },
  transit:   { css: 'cls-transit', label: 'High transit' },
}

const classification = computed(() => {
  const c   = props.plane?._classification
  const iata = props.airport?.iata ?? '?'
  if (c === 'arriving')  return { css: 'cls-arr',     label: `↓ Arriving ${iata}` }
  if (c === 'departing') return { css: 'cls-dep',     label: `↑ Departing ${iata}` }
  if (c === 'transit')   return { css: 'cls-transit', label: 'High transit' }
  return null
})
</script>

<style scoped>
.card {
  background: var(--card);
  border: 1px solid var(--bdr);
  border-radius: var(--radius);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 0;
  flex-shrink: 0;
}

.card-title {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.8px;
  color: var(--dim);
  margin-bottom: 10px;
}

.squawk-alert {
  background: #3f0000;
  border: 1px solid var(--red);
  color: #fca5a5;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 8px;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .7 } }

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 0;
  gap: 8px;
}
.icon { font-size: 36px; opacity: .35; }
.empty p { font-size: 12.5px; color: var(--dim); }

.photo-wrap { margin-bottom: 10px; }
.photo    { width: 100%; height: 140px; object-fit: cover; border-radius: 8px; }
.photo-ph {
  width: 100%; height: 80px; border-radius: 8px;
  background: linear-gradient(135deg,#0a0e1a,#111827);
  display: flex; align-items: center; justify-content: center;
  font-size: 44px;
}

.callsign { font-family: var(--mono); font-size: 28px; font-weight: 700; letter-spacing: 3px; color: #f0f9ff; line-height: 1; }
.airline  { font-size: 12.5px; color: var(--blue); margin: 4px 0 2px; }
.flag     { margin-right: 4px; }
.model    { font-size: 11px; color: var(--muted); margin-bottom: 10px; }

.route-bar {
  display: flex; align-items: center; gap: 8px;
  background: #0a0e1a; border-radius: 8px; padding: 8px 12px;
  margin-bottom: 6px;
}
.ap       { text-align: center; flex-shrink: 0; }
.ap-code  { font-family: var(--mono); font-size: 17px; font-weight: 700; color: #f0f9ff; line-height: 1; }
.ap-name  { font-size: 8.5px; color: var(--dim); margin-top: 2px; }
.route-mid { flex: 1; display: flex; align-items: center; }
.route-line  { flex: 1; height: 1px; background: var(--bdr); }
.route-plane { font-size: 13px; margin: 0 5px; color: var(--amber); }

.class-badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px;
  text-transform: uppercase; letter-spacing: .5px;
  display: inline-flex; align-self: flex-start; margin-bottom: 8px;
}
.cls-arr     { background: #0f1f3d; color: #60a5fa; }
.cls-dep     { background: #1c1400; color: var(--amber); }
.cls-transit { background: #1a0f2e; color: var(--violet); }

.sec-label {
  font-size: 9px; text-transform: uppercase; letter-spacing: 1.5px;
  color: var(--dim); margin: 8px 0 5px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 2px;
}
.stat { background: #0a0e1a; border-radius: 7px; padding: 8px 10px; }
.sl   { font-size: 8.5px; text-transform: uppercase; letter-spacing: 1px; color: var(--dim); margin-bottom: 3px; }
.sv   { font-family: var(--mono); font-size: 16px; font-weight: 600; color: var(--text); line-height: 1; }
.su   { font-size: 9px; color: var(--dim); margin-top: 2px; }

.lookups { display: flex; flex-direction: column; gap: 5px; margin-bottom: 4px; }
.lookup-row {
  display: flex; align-items: flex-start; gap: 8px;
  background: #0a0e1a; border-radius: 7px; padding: 7px 10px; font-size: 11.5px; color: var(--muted);
}
.lk-icon { flex-shrink: 0; font-size: 14px; }
.lookup-row strong { color: var(--text); }

.badges { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.badge {
  font-size: 10.5px; padding: 2px 7px; border-radius: 4px;
  background: #111827; border: 1px solid var(--bdr); color: var(--muted);
}
.badge.hi    { border-color: var(--amber); color: var(--amber); background: #1c1400; }
.badge.amber { border-color: var(--amber); color: var(--amber); background: #1c1400; }
</style>
