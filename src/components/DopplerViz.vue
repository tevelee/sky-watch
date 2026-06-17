<template>
  <div class="doppler-wrap">
    <div class="doppler-header">
      <span class="doppler-title">🎵 Doppler effect</span>
      <span class="doppler-sub">{{ label }}</span>
    </div>

    <!-- Waveform visualizer -->
    <div class="wave-stage">
      <!-- Compressed waves (approaching side) -->
      <div class="wave-group approach">
        <div
          v-for="i in 5" :key="'a'+i"
          class="arc approach-arc"
          :style="arcStyle(i, 5, ratio)"
        />
      </div>
      <!-- Plane icon -->
      <div class="plane-dot" :style="{ transform: `rotate(${heading}deg)` }">✈</div>
      <!-- Expanded waves (receding side) -->
      <div class="wave-group recede">
        <div
          v-for="i in 5" :key="'r'+i"
          class="arc recede-arc"
          :style="arcStyle(i, 5, 1 / ratio)"
        />
      </div>
    </div>

    <!-- Pitch shift meter -->
    <div class="meter-row">
      <span class="meter-label">Lower pitch</span>
      <div class="meter-track">
        <div class="meter-fill" :style="meterStyle" />
        <div class="meter-center" />
      </div>
      <span class="meter-label">Higher pitch</span>
    </div>
    <div class="shift-pct" :style="{ color: shiftColor }">
      {{ shiftSign }}{{ Math.abs(shiftPct) }}% pitch shift ({{ radialDir }})
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { haversine, ktsToKmh, bearingCard } from '../utils'

// Speed of sound at sea level (km/s)
const C = 0.343

const props = defineProps({
  plane: Object,
  home:  Object,
})

// Radial velocity component (km/s) — positive = approaching, negative = receding
const radialKmS = computed(() => {
  if (!props.plane || !props.home) return 0
  const p = props.plane, h = props.home
  // lat/lon 0 is valid (equator/meridian); heading 0 is due North — use null checks, not falsy
  if (p.lat == null || p.lon == null || !p.velocity) return 0

  const cosLat = Math.cos(p.lat * Math.PI / 180)
  const dE = (h.lon - p.lon) * 111.32 * cosLat   // observer relative to plane
  const dN = (h.lat - p.lat) * 110.57
  const dist = Math.sqrt(dE*dE + dN*dN)
  if (dist < 0.01) return 0

  const hdgRad = p.heading * Math.PI / 180
  const vE = Math.sin(hdgRad), vN = Math.cos(hdgRad)       // unit velocity vector
  const speedKmS = ktsToKmh(p.velocity) / 3600

  // Dot product of velocity with direction-to-observer gives approach speed
  const toObsE = dE / dist, toObsN = dN / dist
  return speedKmS * (vE * toObsE + vN * toObsN)
})

// Doppler ratio: f_obs / f_source = c / (c - v_radial)
// Clamped to avoid division by zero for supersonic planes
const ratio = computed(() => {
  const v = radialKmS.value
  const denom = C - Math.min(v, C * 0.99)
  return C / denom
})

const shiftPct = computed(() => Math.round((ratio.value - 1) * 100))
const shiftSign = computed(() => shiftPct.value >= 0 ? '+' : '')
const shiftColor = computed(() => {
  const p = shiftPct.value
  if (p >  5) return '#60a5fa'
  if (p < -5) return '#f59e0b'
  return 'var(--muted)'
})

const radialDir = computed(() => {
  const v = radialKmS.value
  if (Math.abs(v) < 0.005) return 'passing overhead'
  return v > 0 ? 'approaching' : 'receding'
})

const label = computed(() => {
  const p = shiftPct.value
  if (Math.abs(p) < 2) return 'Passing overhead — no shift'
  return p > 0 ? `Approaching · pitch raised ${p}%` : `Receding · pitch lowered ${Math.abs(p)}%`
})

const heading = computed(() => props.plane?.heading ?? 0)

// Meter: 0 = far left (lower), 0.5 = centre, 1 = far right (higher)
const meterStyle = computed(() => {
  const clamped = Math.max(-50, Math.min(50, shiftPct.value))
  const pct = 50 + clamped   // 0..100 where 50 = centre
  const left  = pct >= 50 ? '50%'  : `${pct}%`
  const width = Math.abs(pct - 50) + '%'
  const color = shiftPct.value >= 0 ? '#60a5fa' : '#f59e0b'
  return { left, width, background: color }
})

// Arc spacing: compressed on approach side (ratio > 1), expanded on recede side
function arcStyle(i, total, waveRatio) {
  // Spacing is inversely proportional to waveRatio
  const baseSpacing = 12   // px between arcs at ratio=1
  const spacing = baseSpacing / waveRatio
  const pos = i * spacing
  const opacity = 0.9 - (i / total) * 0.65
  return { '--pos': `${pos}px`, opacity }
}
</script>

<style scoped>
.doppler-wrap {
  background: #0a0e1a;
  border: 1px solid var(--bdr);
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.doppler-header { display: flex; align-items: baseline; gap: 8px; }
.doppler-title  { font-size: 11px; font-weight: 700; color: var(--text); }
.doppler-sub    { font-size: 10px; color: var(--muted); }

/* Waveform stage */
.wave-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  height: 54px;
  position: relative;
  overflow: hidden;
}

.wave-group {
  display: flex;
  align-items: center;
  height: 100%;
  position: relative;
}

.approach { flex-direction: row-reverse; }
.recede   { flex-direction: row; }

.arc {
  position: absolute;
  width: 36px; height: 36px;
  border-radius: 50%;
  border: 1.5px solid var(--blue);
  flex-shrink: 0;
}
.approach-arc {
  right: var(--pos);
  border-color: #60a5fa;
}
.recede-arc {
  left: var(--pos);
  border-color: #f59e0b;
}

.plane-dot {
  font-size: 20px;
  z-index: 1;
  color: var(--text);
  flex-shrink: 0;
  width: 28px;
  text-align: center;
}

/* Pitch shift meter */
.meter-row {
  display: flex;
  align-items: center;
  gap: 7px;
}
.meter-label {
  font-size: 9px;
  color: var(--dim);
  white-space: nowrap;
  flex-shrink: 0;
}
.meter-track {
  flex: 1;
  height: 6px;
  background: #1a1f30;
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}
.meter-fill {
  position: absolute;
  top: 0; bottom: 0;
  border-radius: 3px;
  transition: all .5s ease;
}
.meter-center {
  position: absolute;
  left: 50%; top: 0; bottom: 0;
  width: 1px;
  background: var(--dim);
}

.shift-pct {
  font-size: 10.5px;
  text-align: center;
  font-family: var(--mono);
  transition: color .5s;
}
</style>
