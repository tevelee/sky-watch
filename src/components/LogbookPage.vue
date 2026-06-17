<template>
  <div class="logbook">

    <!-- Stats strip -->
    <div class="stats-strip" v-if="stats">
      <div class="stat-chip"><span class="sc-val">{{ stats.total }}</span><span class="sc-label">flights logged</span></div>
      <div v-if="stats.topAirline" class="stat-chip">
        <span class="sc-val">{{ stats.topAirline }}</span>
        <span class="sc-label">most seen ({{ stats.topAirlineCount }}×)</span>
      </div>
      <div v-if="stats.busiestHour" class="stat-chip">
        <span class="sc-val">{{ stats.busiestHour }}</span>
        <span class="sc-label">busiest hour</span>
      </div>
      <button class="clear-btn" @click="$emit('clear')">✕ Clear log</button>
    </div>

    <!-- Empty state -->
    <div v-if="!entries.length" class="empty">
      <div class="empty-icon">📋</div>
      <p class="empty-title">No flights logged yet</p>
      <p class="empty-sub">Every aircraft that flies overhead is automatically recorded here. Switch to Sky Watch and wait for a plane!</p>
    </div>

    <!-- Timeline -->
    <div v-else class="timeline">
      <template v-for="[date, group] in grouped" :key="date">
        <div class="date-header">{{ date }}</div>
        <div v-for="e in group" :key="e.id" class="entry">
          <div class="entry-time">{{ fmtTime(e.id) }}</div>
          <div class="entry-body">
            <div class="entry-main">
              <span class="flag" v-if="e.flag">{{ e.flag }}</span>
              <span class="callsign">{{ e.callsign || e.icao24?.toUpperCase() }}</span>
              <span v-if="e.airline" class="airline">{{ e.airline }}</span>
            </div>
            <div class="entry-sub">
              <span v-if="e.origIata || e.destIata" class="route">
                {{ e.origIata || '?' }} → {{ e.destIata || '?' }}
              </span>
              <span v-if="e.acName || e.typeCode" class="type">{{ e.acName || e.typeCode }}</span>
              <span v-if="e.reg" class="reg">{{ e.reg }}</span>
            </div>
          </div>
          <div class="entry-right">
            <span v-if="e.altFt" class="badge alt">FL{{ Math.round(e.altFt / 100) }}</span>
            <span :class="['badge', clsBadge(e.cls)]">{{ clsLabel(e.cls) }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  entries: Array,
  stats:   Object,
})
defineEmits(['clear'])

const grouped = computed(() => {
  const byDate = new Map()
  ;[...props.entries].reverse().forEach(e => {
    const d = new Date(e.id).toLocaleDateString('en-GB', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })
    if (!byDate.has(d)) byDate.set(d, [])
    byDate.get(d).push(e)
  })
  return [...byDate.entries()]
})

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function clsLabel(cls) {
  if (cls === 'arriving')  return '↓ Arr'
  if (cls === 'departing') return '↑ Dep'
  if (cls === 'transit')   return 'Transit'
  return 'Overhead'
}

function clsBadge(cls) {
  if (cls === 'arriving')  return 'cls-arr'
  if (cls === 'departing') return 'cls-dep'
  if (cls === 'transit')   return 'cls-tr'
  return 'cls-other'
}
</script>

<style scoped>
.logbook {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
}

.stats-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.stat-chip {
  background: var(--card);
  border: 1px solid var(--bdr);
  border-radius: 8px;
  padding: 7px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sc-val   { font-family: var(--mono); font-size: 15px; font-weight: 700; color: var(--blue); line-height: 1; }
.sc-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: var(--dim); }

.clear-btn {
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--bdr);
  color: var(--dim);
  font-size: 11px;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all .15s;
}
.clear-btn:hover { border-color: #f87171; color: #f87171; }

.empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  padding: 40px 20px;
}
.empty-icon  { font-size: 48px; opacity: .35; }
.empty-title { font-size: 15px; font-weight: 600; color: var(--muted); }
.empty-sub   { font-size: 12.5px; color: var(--dim); line-height: 1.6; max-width: 380px; }

.timeline { display: flex; flex-direction: column; gap: 0; }

.date-header {
  font-size: 9.5px;
  text-transform: uppercase;
  letter-spacing: 1.8px;
  color: var(--dim);
  font-weight: 700;
  padding: 18px 0 8px;
  border-bottom: 1px solid var(--bdr);
  position: sticky;
  top: 0;
  background: #080b15;
  z-index: 1;
}
.date-header:first-child { padding-top: 2px; }

.entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid #0d1120;
}
.entry:hover { background: #0a0e1a; margin: 0 -8px; padding-left: 8px; padding-right: 8px; border-radius: 6px; }

.entry-time {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--dim);
  flex-shrink: 0;
  width: 38px;
}

.entry-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.entry-main { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.flag       { font-size: 14px; }
.callsign   { font-family: var(--mono); font-size: 13px; font-weight: 700; color: var(--text); }
.airline    { font-size: 11.5px; color: var(--muted); }

.entry-sub  { display: flex; gap: 8px; font-size: 11px; color: var(--dim); flex-wrap: wrap; }
.route      { font-family: var(--mono); color: var(--blue); }
.type       { color: var(--dim); }
.reg        { font-family: var(--mono); color: var(--dim); }

.entry-right { display: flex; flex-direction: column; gap: 3px; align-items: flex-end; flex-shrink: 0; }
.badge {
  font-size: 9px; font-weight: 700; padding: 2px 7px; border-radius: 4px;
  text-transform: uppercase; letter-spacing: .4px; white-space: nowrap;
}
.alt      { background: #111827; color: var(--muted); border: 1px solid var(--bdr); }
.cls-arr  { background: #0f1f3d; color: #60a5fa; }
.cls-dep  { background: #1c1400; color: var(--amber); }
.cls-tr   { background: #1a0f2e; color: var(--violet); }
.cls-other{ background: #111827; color: var(--dim); }

@media (max-width: 860px) {
  .logbook { padding: 12px 12px 20px; }
  .entry-right .alt { display: none; }
}
</style>
