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
          <div class="ap-code">{{ inferredOrig || '—' }}</div>
          <div class="ap-name">{{ inferredOrig ? (airportName(inferredOrig) || inferredOrig) : 'Origin' }}</div>
        </div>
        <div class="route-mid">
          <div class="route-line"></div>
          <span class="route-plane">✈</span>
          <div class="route-line"></div>
        </div>
        <div class="ap">
          <div class="ap-code">{{ inferredDest || '—' }}</div>
          <div class="ap-name">{{ inferredDest ? (airportName(inferredDest) || inferredDest) : 'Destination' }}</div>
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
          <div class="sv">{{ altParts(plane.baro_alt).val }}</div>
          <div class="su">{{ altParts(plane.baro_alt).unit }}</div>
        </div>
        <div class="stat">
          <div class="sl">Speed</div>
          <div class="sv">{{ speedParts(plane.velocity).val }}</div>
          <div class="su">{{ speedParts(plane.velocity).unit }}</div>
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
        <span v-if="plane.baro_alt && plane.baro_alt > 27900" class="badge">☁️ Cruising altitude</span>
        <span v-if="plane.baro_alt && plane.baro_alt < 5000"  class="badge amber">🛬 Low approach</span>
        <span v-if="plane._ac?.cat === 'super'"               class="badge hi">🐘 Super-heavy</span>
        <span v-if="plane._ac?.cat === 'heavy'"               class="badge">⚖️ Heavy wake turbulence</span>
        <span v-if="plane.squawk" class="badge">📡 Squawk {{ plane.squawk }}</span>
      </div>

      <!-- Pilot details toggle -->
      <button class="expand-btn" @click="showPilot = !showPilot">
        {{ showPilot ? '▲ Hide' : '▼ Show' }} pilot details
      </button>

      <!-- Expandable pilot details -->
      <div v-if="showPilot" class="pilot-panel">

        <div class="pd-label-row">Technical flight data</div>
        <div class="pd-grid">
          <div class="pd-cell">
            <div class="pd-k">Flight Level</div>
            <div class="pd-v mono">{{ plane.baro_alt ? 'FL' + Math.round(plane.baro_alt / 100) : '—' }}</div>
          </div>
          <div v-if="plane.nav_alt_mcp" class="pd-cell">
            <div class="pd-k">Cleared to</div>
            <div class="pd-v mono" :class="{ climb: plane.nav_alt_mcp > plane.baro_alt, desc: plane.nav_alt_mcp < plane.baro_alt }">
              FL{{ Math.round(plane.nav_alt_mcp / 100) }}
              <span class="pd-dim">{{ plane.nav_alt_mcp > plane.baro_alt ? '↑' : plane.nav_alt_mcp < plane.baro_alt ? '↓' : '=' }}</span>
            </div>
          </div>
          <div class="pd-cell">
            <div class="pd-k">True Track</div>
            <div class="pd-v mono">{{ plane.heading ? Math.round(plane.heading) + '° ' + headingCard(plane.heading) : '—' }}</div>
          </div>
          <div v-if="plane.mag_heading" class="pd-cell">
            <div class="pd-k">Mag Heading</div>
            <div class="pd-v mono">{{ Math.round(plane.mag_heading) }}° M</div>
          </div>
          <div class="pd-cell">
            <div class="pd-k">Ground Speed</div>
            <div class="pd-v mono">{{ plane.velocity ? Math.round(plane.velocity) + ' kt' : '—' }}</div>
          </div>
          <div v-if="plane.ias" class="pd-cell">
            <div class="pd-k">IAS</div>
            <div class="pd-v mono">{{ Math.round(plane.ias) }} kt</div>
          </div>
          <div v-if="plane.tas" class="pd-cell">
            <div class="pd-k">TAS</div>
            <div class="pd-v mono">{{ Math.round(plane.tas) }} kt</div>
          </div>
          <div class="pd-cell">
            <div class="pd-k">Vertical Rate</div>
            <div class="pd-v mono" :class="{ 'climb': plane.vert_rate > 100, 'desc': plane.vert_rate < -100 }">
              {{ fmtVert(plane.vert_rate) || 'Level' }}
            </div>
          </div>
          <div v-if="plane.roll != null" class="pd-cell">
            <div class="pd-k">Bank Angle</div>
            <div class="pd-v mono">{{ Math.round(plane.roll) }}° {{ plane.roll > 2 ? '→' : plane.roll < -2 ? '←' : '' }}</div>
          </div>
          <div v-if="plane.mach" class="pd-cell">
            <div class="pd-k">Mach</div>
            <div class="pd-v mono">M {{ plane.mach.toFixed(2) }}</div>
          </div>
          <div v-if="plane.baro_alt" class="pd-cell">
            <div class="pd-k">Pressure Alt</div>
            <div class="pd-v mono">{{ Math.round(plane.baro_alt).toLocaleString() }} ft</div>
          </div>
          <div v-if="plane.nav_qnh" class="pd-cell">
            <div class="pd-k">QNH</div>
            <div class="pd-v mono">{{ plane.nav_qnh }} hPa</div>
          </div>
        </div>

        <template v-if="plane.wind_dir != null || plane.oat != null">
          <div class="pd-label-row">Atmosphere at altitude</div>
          <div class="pd-grid">
            <div v-if="plane.wind_dir != null && plane.wind_kt != null" class="pd-cell">
              <div class="pd-k">Wind</div>
              <div class="pd-v mono">{{ Math.round(plane.wind_dir) }}° / {{ Math.round(plane.wind_kt) }} kt</div>
            </div>
            <div v-if="plane.oat != null" class="pd-cell">
              <div class="pd-k">OAT</div>
              <div class="pd-v mono">{{ Math.round(plane.oat) }}°C</div>
            </div>
            <div v-if="plane.tat != null" class="pd-cell">
              <div class="pd-k">TAT</div>
              <div class="pd-v mono">{{ Math.round(plane.tat) }}°C</div>
            </div>
          </div>
        </template>

        <div class="pd-label-row">Transponder & identity</div>
        <div class="pd-grid">
          <div class="pd-cell">
            <div class="pd-k">Mode S (ICAO24)</div>
            <div class="pd-v mono">{{ plane.icao24?.toUpperCase() || '—' }}</div>
          </div>
          <div class="pd-cell">
            <div class="pd-k">Squawk</div>
            <div class="pd-v mono">{{ plane.squawk || '—' }} <span class="pd-dim">{{ squawkMeaning }}</span></div>
          </div>
          <div class="pd-cell">
            <div class="pd-k">Registration</div>
            <div class="pd-v mono">{{ plane.reg || '—' }}</div>
          </div>
          <div class="pd-cell">
            <div class="pd-k">ICAO Type</div>
            <div class="pd-v mono">{{ plane.typeCode || '—' }}</div>
          </div>
        </div>

        <template v-if="plane._ac">
          <div class="pd-label-row">Aircraft category</div>
          <div class="pd-grid">
            <div class="pd-cell">
              <div class="pd-k">Wake turbulence</div>
              <div class="pd-v">{{ wakeCategory }}</div>
            </div>
            <div class="pd-cell">
              <div class="pd-k">FAA class</div>
              <div class="pd-v">{{ plane._ac.cat?.charAt(0).toUpperCase() + plane._ac.cat?.slice(1) }}</div>
            </div>
            <div v-if="plane._ac.pax" class="pd-cell">
              <div class="pd-k">Typical capacity</div>
              <div class="pd-v">~{{ plane._ac.pax }} pax</div>
            </div>
            <div v-if="plane._ac.eng" class="pd-cell">
              <div class="pd-k">Engines</div>
              <div class="pd-v">{{ plane._ac.eng }} turbofan{{ plane._ac.eng > 1 ? 's' : '' }}</div>
            </div>
          </div>
        </template>

        <!-- ATC Radio section -->
        <div class="atc-section">
          <div class="pd-label-row">ATC radio</div>
          <a v-if="airport" :href="atcUrl(airport.iata)" target="_blank" rel="noopener" class="atc-link">
            🎧 Listen to {{ airport.iata }} tower on LiveATC →
          </a>
          <div class="atc-note">
            LiveATC streams live and archived audio for most airports. Real-time transcripts and speaker identification (which aircraft is talking) are not available as free services — some research tools use OpenAI Whisper offline.
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { lookUpAngle, vertStr, bearingCard as headingCard } from '../utils'
import { fetchPhoto } from '../composables/useFlights'
import { AIRPORTS } from '../data/airports'
import { useUnits } from '../composables/useUnits'
import { atcUrl } from '../data/atc'

const props = defineProps({
  plane:   Object,
  home:    Object,
  airport: Object,
})

const { altParts, speedParts, fmtVert } = useUnits()

const photoUrl = ref(null)
const showPilot = ref(false)

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
  return ap ? ap.city : null
}

const inferredOrig = computed(() => {
  if (props.plane?.origIata) return props.plane.origIata
  if (props.plane?._classification === 'departing') return props.airport?.iata ?? null
  return null
})

const inferredDest = computed(() => {
  if (props.plane?.destIata) return props.plane.destIata
  if (props.plane?._classification === 'arriving') return props.airport?.iata ?? null
  return null
})

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

const WAKE = { light: 'L — Light', small: 'L — Light', medium: 'M — Medium', heavy: 'H — Heavy', super: 'J — Super' }
const wakeCategory = computed(() => WAKE[props.plane?._ac?.cat] ?? '—')

const squawkMeaning = computed(() => {
  const s = props.plane?.squawk
  if (!s) return ''
  if (s === '7700') return '(Emergency)'
  if (s === '7600') return '(Radio failure)'
  if (s === '7500') return '(Hijack)'
  if (s === '2000') return '(IFR, no discrete)'
  if (s === '1200') return '(VFR)'
  return '(Assigned)'
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

.expand-btn {
  width: 100%; margin-top: 10px;
  background: transparent; border: 1px solid var(--bdr); color: var(--dim);
  font-size: 10px; padding: 5px; border-radius: 6px; cursor: pointer;
  transition: all .15s; text-align: center; letter-spacing: .5px;
}
.expand-btn:hover { border-color: var(--blue); color: var(--blue); }

.pilot-panel {
  margin-top: 8px;
  display: flex; flex-direction: column; gap: 6px;
}

.pd-label-row {
  font-size: 8.5px; text-transform: uppercase; letter-spacing: 1.5px;
  color: var(--dim); margin-top: 4px;
}

.pd-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
}

.pd-cell {
  background: #0a0e1a; border-radius: 6px; padding: 7px 9px;
}
.pd-k { font-size: 8px; text-transform: uppercase; letter-spacing: 1px; color: var(--dim); margin-bottom: 3px; }
.pd-v { font-size: 12px; color: var(--text); line-height: 1.2; }
.pd-v.mono { font-family: var(--mono); }
.pd-dim { color: var(--dim); font-size: 10px; }
.pd-v.climb { color: var(--green); }
.pd-v.desc  { color: #f87171; }

.atc-section { margin-top: 4px; }

.atc-link {
  display: block; text-align: center;
  background: #0a1a12; border: 1px solid #1a3a25; color: var(--green);
  padding: 8px 12px; border-radius: 7px; font-size: 12px; font-weight: 600;
  text-decoration: none; transition: all .15s; margin-bottom: 6px;
}
.atc-link:hover { background: #0f2a1c; border-color: var(--green); }

.atc-note {
  font-size: 10px; color: var(--dim); line-height: 1.5;
  background: #0a0e1a; border-radius: 6px; padding: 7px 9px;
}
</style>
