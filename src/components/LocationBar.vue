<template>
  <div class="location-bar">
    <!-- Search -->
    <div class="search-wrap">
      <input
        v-model="query"
        class="search-input"
        placeholder="🔍 Search any city or address…"
        @input="onInput"
        @blur="hideDropdown"
        @keydown.escape="hideDropdown"
      />
      <span v-if="searching" class="spinner">⟳</span>
      <ul v-if="showDropdown && results.length" class="dropdown">
        <li
          v-for="r in results"
          :key="r.place_id"
          @mousedown.prevent="selectResult(r)"
        >
          <span class="result-name">{{ shortName(r.display_name) }}</span>
          <span class="result-detail">{{ r.display_name }}</span>
        </li>
      </ul>
    </div>

    <!-- Current location info -->
    <div class="coords">
      📍 {{ home.name }} &nbsp;
      <span class="mono">{{ home.lat.toFixed(4) }}°N, {{ home.lon.toFixed(4) }}°E</span>
      <span class="hint">(or drag pin)</span>
    </div>

    <!-- Nearest airport -->
    <div v-if="airport" class="airport-pill">
      ✈ {{ airport.iata }} · {{ airport.city }} · {{ airport.dist }} km
    </div>
    <div v-else class="airport-pill dim">No major airport within 300 km</div>

    <!-- Radius selector -->
    <div class="radius-group">
      <span class="label">Radius:</span>
      <button
        v-for="km in [10, 25, 50, 100]"
        :key="km"
        :class="['rbtn', { active: scanKm === km }]"
        @click="$emit('scan-change', km)"
      >{{ km }} km</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  home:    Object,
  scanKm:  Number,
  airport: Object,
})
const emit = defineEmits(['location-change', 'scan-change'])

const query        = ref('')
const results      = ref([])
const searching    = ref(false)
const showDropdown = ref(false)
let searchTimer    = null

function onInput() {
  clearTimeout(searchTimer)
  const q = query.value.trim()
  if (q.length < 3) { results.value = []; showDropdown.value = false; return }
  searchTimer = setTimeout(doSearch, 350)
}

async function doSearch() {
  searching.value = true
  try {
    const q = encodeURIComponent(query.value.trim())
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=5&addressdetails=0`)
    results.value = await r.json()
    showDropdown.value = results.value.length > 0
  } catch {}
  finally { searching.value = false }
}

function selectResult(r) {
  emit('location-change', {
    lat:  Math.round(parseFloat(r.lat) * 10000) / 10000,
    lon:  Math.round(parseFloat(r.lon) * 10000) / 10000,
    name: shortName(r.display_name),
  })
  query.value = ''
  showDropdown.value = false
}

function hideDropdown() {
  setTimeout(() => { showDropdown.value = false }, 150)
}

function shortName(dn) {
  return dn.split(',')[0].trim()
}
</script>

<style scoped>
.location-bar {
  background: #090d19;
  border-bottom: 1px solid var(--bdr);
  padding: 7px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  flex-shrink: 0;
  font-size: 11.5px;
}

.search-wrap {
  position: relative;
  flex-shrink: 0;
}

.search-input {
  background: #111827;
  border: 1px solid var(--bdr);
  color: var(--text);
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  width: 220px;
  outline: none;
  transition: border-color .15s;
}
.search-input:focus { border-color: var(--blue); }
.search-input::placeholder { color: var(--dim); }

.spinner {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--dim);
  font-size: 14px;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }

.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  min-width: 320px;
  background: var(--card);
  border: 1px solid var(--bdr);
  border-radius: 8px;
  list-style: none;
  z-index: 1000;
  box-shadow: 0 8px 32px rgba(0,0,0,.6);
  overflow: hidden;
}
.dropdown li {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-bottom: 1px solid var(--bdr);
}
.dropdown li:last-child { border-bottom: none; }
.dropdown li:hover { background: #111827; }
.result-name   { font-size: 12.5px; color: var(--text); font-weight: 500; }
.result-detail { font-size: 10px; color: var(--dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.coords {
  color: var(--dim);
  display: flex;
  align-items: center;
  gap: 5px;
}
.mono  { font-family: var(--mono); font-size: 10.5px; color: var(--muted); }
.hint  { font-size: 10px; color: var(--dim); font-style: italic; }

.airport-pill {
  background: #0f1f3d;
  border: 1px solid #2d5080;
  color: #60a5fa;
  padding: 3px 9px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.airport-pill.dim { background: transparent; border-color: var(--bdr); color: var(--dim); font-weight: 400; }

.radius-group {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
}
.label { color: var(--dim); }
.rbtn {
  background: #111827;
  border: 1px solid var(--bdr);
  color: var(--dim);
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 5px;
  cursor: pointer;
  transition: all .15s;
  min-height: 28px;
}
.rbtn:hover  { border-color: var(--blue); color: var(--blue); }
.rbtn.active { background: #1e3a5f; border-color: var(--blue); color: var(--blue); }

@media (max-width: 860px) {
  .location-bar {
    padding: 8px 12px;
    gap: 8px;
  }
  .search-wrap {
    width: 100%;
  }
  .search-input {
    width: 100%;
    box-sizing: border-box;
    font-size: 16px; /* prevents iOS zoom */
    padding: 7px 12px;
  }
  .coords {
    font-size: 10.5px;
    order: 3;
    width: 100%;
  }
  .hint { display: none; }
  .airport-pill {
    order: 2;
  }
  .radius-group {
    margin-left: 0;
    order: 4;
    width: 100%;
  }
  .rbtn {
    flex: 1;
    text-align: center;
    padding: 6px 4px;
    font-size: 12px;
    min-height: 36px;
  }
}
</style>
