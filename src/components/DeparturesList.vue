<template>
  <div class="card">
    <div class="card-title">
      Departing soon{{ airport ? ' · ' + airport.iata : '' }}
    </div>

    <div v-if="!airport" class="empty">
      <div class="icon">🛫</div>
      <p>No nearby airport</p>
    </div>
    <div v-else-if="!departures.length" class="empty">
      <div class="icon">🛫</div>
      <p>{{ loading ? 'Checking the apron…' : 'No aircraft on the ground right now' }}</p>
    </div>

    <div v-else class="list">
      <div v-for="p in visible" :key="p.icao24" class="row">
        <div class="row-left">
          <span :class="['tag', p._departing ? 'tag-dep' : 'tag-ground']">
            {{ p._departing ? '↑ Departing' : 'On ground' }}
          </span>
          <div class="row-callsign">
            <span class="flag" v-if="p._flag">{{ p._flag }}</span>
            <span class="cs">{{ p.callsign || p.icao24?.toUpperCase() }}</span>
            <template v-if="p._destIata">
              <span class="route-sep">→</span>
              <span class="route">{{ p._destIata }}</span>
            </template>
          </div>
          <div class="row-sub">
            <span class="airline">{{ p._airline || '—' }}</span>
            <span class="type" v-if="p._ac">{{ p._ac.name }}</span>
            <span class="type" v-else-if="p.typeCode">{{ p.typeCode }}</span>
          </div>
        </div>
        <div class="row-right">
          <div v-if="p._destName" class="dest">{{ p._destName }}</div>
        </div>
      </div>
      <div v-if="departures.length > LIMIT" class="more">
        +{{ departures.length - LIMIT }} more on the ground
      </div>
    </div>

    <div class="note">
      Live from aircraft on the ground — destinations and departure status come
      from route data and aren't a published schedule.
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const LIMIT = 10

const props = defineProps({
  departures: Array,
  airport:    Object,
  loading:    Boolean,
})

const visible = computed(() => props.departures.slice(0, LIMIT))
</script>

<style scoped>
.card {
  background: var(--card);
  border: 1px solid var(--bdr);
  border-radius: var(--radius);
  padding: 12px 14px;
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
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 20px 0;
}
.icon { font-size: 26px; opacity: .35; }
.empty p { font-size: 12px; color: var(--dim); }

.list { display: flex; flex-direction: column; }

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
.row-right { flex-shrink: 0; text-align: right; }

.tag {
  font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 3px;
  text-transform: uppercase; white-space: nowrap;
  align-self: flex-start; margin-bottom: 2px;
}
.tag-dep    { background: #1c1400; color: var(--amber); }
.tag-ground { background: #12161f; color: var(--dim); }

.row-callsign { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; }
.flag { font-size: 13px; }
.cs   { font-family: var(--mono); font-size: 12.5px; font-weight: 700; color: var(--text); }
.route-sep { color: var(--dim); }
.route { font-family: var(--mono); font-size: 11.5px; color: var(--blue); font-weight: 600; }

.row-sub { display: flex; gap: 7px; font-size: 10.5px; flex-wrap: wrap; }
.airline { color: var(--muted); }
.type    { color: var(--dim); }

.dest { font-size: 10.5px; color: var(--muted); }

.more {
  font-size: 10.5px; color: var(--dim); text-align: center;
  padding: 6px 0 2px; font-style: italic;
}

.note {
  font-size: 10px; color: var(--dim); line-height: 1.5;
  background: #0a0e1a; border-radius: 6px; padding: 7px 9px; margin-top: 8px;
}
</style>
