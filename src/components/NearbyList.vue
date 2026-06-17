<template>
  <div class="card">
    <div class="card-title">Nearby flights</div>
    <div v-if="!planes.length" class="empty">
      <div class="icon">🌙</div>
      <p>No airborne traffic detected</p>
    </div>
    <div v-else class="list">
      <div v-for="p in visible" :key="p.icao24" class="row">
        <!-- Left: tag + route -->
        <div class="row-left">
          <span :class="['tag', tagClass(p)]">{{ tagLabel(p) }}</span>
          <div class="row-callsign">
            <span class="flag" v-if="p._flag">{{ p._flag }}</span>
            <span class="cs">{{ p.callsign || p.icao24?.toUpperCase() }}</span>
            <template v-if="flightRoute(p)">
              <span class="route-sep">·</span>
              <span class="route">{{ flightRoute(p).orig }} → {{ flightRoute(p).dest }}</span>
            </template>
          </div>
          <div class="row-sub">
            <span class="airline">{{ p._airline || '—' }}</span>
            <span class="type" v-if="p._ac">{{ p._ac.name }}</span>
            <span class="type" v-else-if="p.typeCode">{{ p.typeCode }}</span>
          </div>
        </div>

        <!-- Right: stats -->
        <div class="row-right">
          <div v-if="p._eta != null" class="eta">⏱ {{ p._eta < 1 ? 'now' : p._eta + ' min' }}</div>
          <div class="alt">{{ altStr(p.baro_alt) }}</div>
          <div class="spd" v-if="p._speedKmh">{{ p._speedKmh }} km/h</div>
          <div class="dist dim">{{ Math.round(p._dist) }} km</div>
        </div>
      </div>
      <div v-if="planes.length > LIMIT" class="more">
        +{{ planes.length - LIMIT }} more in scan area
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { altStr } from '../utils'

const LIMIT = 14

const props = defineProps({
  planes:  Array,
  home:    Object,
  airport: Object,
})

const visible = computed(() => props.planes.slice(0, LIMIT))

function flightRoute(p) {
  const apIata = props.airport?.iata
  const orig = p.origIata
  const dest = p.destIata
  if (orig && dest) return { orig, dest }
  const cls = p._classification
  if (cls === 'arriving')  return { orig: orig || '?', dest: dest || apIata || '?' }
  if (cls === 'departing') return { orig: orig || apIata || '?', dest: dest || '?' }
  if (orig || dest) return { orig: orig || '?', dest: dest || '?' }
  return null
}

function tagClass(p) {
  const d = p._dist
  if (d <= 15) return 'tag-close'
  const c = p._classification
  if (c === 'arriving')  return 'tag-arr'
  if (c === 'departing') return 'tag-dep'
  if (c === 'transit')   return 'tag-transit'
  return 'tag-far'
}

function tagLabel(p) {
  const d = p._dist
  if (d <= 15) return Math.round(d) + ' km ✦'
  const c   = props.airport?.iata ?? ''
  const cls = p._classification
  if (cls === 'arriving')  return `↓ ${c}`
  if (cls === 'departing') return `↑ ${c}`
  if (cls === 'transit')   return 'Transit'
  return Math.round(d) + ' km'
}
</script>

<style scoped>
.card {
  background: var(--card);
  border: 1px solid var(--bdr);
  border-radius: var(--radius);
  padding: 12px 14px;
  flex: 1;
  min-height: 220px;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.8px;
  color: var(--dim);
  margin-bottom: 8px;
  flex-shrink: 0;
}

.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.icon { font-size: 30px; opacity: .35; }
.empty p { font-size: 12px; color: var(--dim); }

.list { display: flex; flex-direction: column; overflow-y: auto; }

.row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid #111827;
}
.row:last-child { border-bottom: none; }

.row-left  { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.row-right { flex-shrink: 0; text-align: right; display: flex; flex-direction: column; gap: 1px; align-items: flex-end; }

.tag {
  font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 3px;
  text-transform: uppercase; white-space: nowrap;
  display: inline-block; margin-bottom: 2px; align-self: flex-start;
}
.tag-close   { background: #052e16; color: var(--green); }
.tag-arr     { background: #0f1f3d; color: #60a5fa; }
.tag-dep     { background: #1c1400; color: var(--amber); }
.tag-transit { background: #1a0f2e; color: var(--violet); }
.tag-far     { background: #12161f; color: var(--dim); }

.row-callsign {
  display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
}
.flag { font-size: 13px; flex-shrink: 0; }
.cs   { font-family: var(--mono); font-size: 12.5px; font-weight: 700; color: var(--text); }
.route-sep { color: var(--dim); }
.route { font-family: var(--mono); font-size: 11px; color: var(--blue); font-weight: 600; }

.row-sub { display: flex; gap: 7px; font-size: 10.5px; color: var(--dim); flex-wrap: wrap; }
.airline { color: var(--muted); }
.type    { color: var(--dim); }

.eta  { font-family: var(--mono); font-size: 12px; font-weight: 700; color: var(--amber); }
.alt  { font-family: var(--mono); font-size: 11.5px; color: var(--text); }
.spd  { font-size: 10px; color: var(--muted); }
.dist { font-size: 10px; color: var(--dim); }
.dim  { color: var(--dim); }

.more {
  font-size: 10.5px;
  color: var(--dim);
  text-align: center;
  padding: 6px 0 2px;
  font-style: italic;
}

@media (max-width: 860px) {
  .card {
    flex: none;
    min-height: auto;
  }
  .list {
    max-height: none;
    overflow-y: visible;
  }
  .row {
    padding: 9px 0;
  }
  .cs { font-size: 14px; }
}
</style>
