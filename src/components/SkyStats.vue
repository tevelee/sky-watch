<template>
  <div class="card">
    <div class="card-title">Sky right now</div>
    <div v-if="!planes.length" class="empty">
      <span class="dim">No airborne traffic detected</span>
    </div>
    <template v-else>
      <div class="stats-row">
        <div class="s-item">
          <span class="s-val">{{ planes.length }}</span>
          <span class="s-lbl">planes</span>
        </div>
        <div class="s-sep">·</div>
        <div class="s-item">
          <span class="s-val">~{{ totalPax.toLocaleString() }}</span>
          <span class="s-lbl">people in the sky</span>
        </div>
      </div>
      <div class="items">
        <div v-if="fastest" class="item">
          <span class="item-icon">⚡</span>
          <span class="item-label">Fastest</span>
          <span class="item-val">{{ fastest.callsign }}</span>
          <span class="item-detail">{{ fmtSpeed(fastest.velocity) }}</span>
        </div>
        <div v-if="highest" class="item">
          <span class="item-icon">🏔</span>
          <span class="item-label">Highest</span>
          <span class="item-val">{{ highest.callsign }}</span>
          <span class="item-detail">{{ fmtAlt(highest.baro_alt) }}</span>
        </div>
        <div v-if="nextEta" class="item amber">
          <span class="item-icon">⏱</span>
          <span class="item-label">Next overhead</span>
          <span class="item-val">{{ nextEta.callsign }}</span>
          <span class="item-detail">in {{ nextEta._eta }} min</span>
        </div>
        <div v-if="heaviest" class="item">
          <span class="item-icon">🐘</span>
          <span class="item-label">Largest</span>
          <span class="item-val">{{ heaviest.callsign }}</span>
          <span class="item-detail">{{ heaviest._ac?.name }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUnits } from '../composables/useUnits'

const props = defineProps({ planes: Array })
const { fmtAlt, fmtSpeed } = useUnits()

const totalPax = computed(() =>
  props.planes.reduce((s, p) => s + (p._pax ?? 0), 0)
)

const fastest = computed(() => {
  let best = null
  for (const p of props.planes) {
    if (p._speedKmh && (!best || p._speedKmh > best._speedKmh)) best = p
  }
  return best
})

const highest = computed(() => {
  let best = null
  for (const p of props.planes) {
    if (p._altM && (!best || p._altM > best._altM)) best = p
  }
  return best
})

const nextEta = computed(() =>
  props.planes.find(p => p._eta != null) ?? null
)

const CAT_WEIGHT = { light:1, small:2, medium:3, heavy:4, super:5 }
const heaviest = computed(() => {
  let best = null
  for (const p of props.planes) {
    const w = CAT_WEIGHT[p._ac?.cat ?? 'light'] ?? 0
    if (!best || w > (CAT_WEIGHT[best._ac?.cat ?? 'light'] ?? 0)) best = p
  }
  return best?._ac?.cat === 'heavy' || best?._ac?.cat === 'super' ? best : null
})
</script>

<style scoped>
.card {
  background: var(--card);
  border: 1px solid var(--bdr);
  border-radius: var(--radius);
  padding: 12px 14px;
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

.empty { font-size: 11.5px; color: var(--dim); }

.stats-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}
.s-item { display: flex; align-items: baseline; gap: 5px; }
.s-val  { font-family: var(--mono); font-size: 22px; font-weight: 700; color: var(--text); }
.s-lbl  { font-size: 11px; color: var(--muted); }
.s-sep  { color: var(--bdr); font-size: 20px; }

.items { display: flex; flex-direction: column; gap: 4px; }

.item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 8px;
  background: #0a0e1a;
  border-radius: 6px;
  font-size: 11.5px;
}
.item.amber { border-left: 2px solid var(--amber); }
.item-icon   { font-size: 13px; flex-shrink: 0; }
.item-label  { color: var(--dim); flex-shrink: 0; width: 90px; }
.item-val    { font-family: var(--mono); font-weight: 600; color: var(--text); }
.item-detail { margin-left: auto; color: var(--muted); font-size: 10.5px; }
</style>
