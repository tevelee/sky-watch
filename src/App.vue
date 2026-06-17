<template>
  <div class="app">
    <AppHeader :last-update="lastUpdate" :loading="loading" :error="error" />

    <!-- Tab bar -->
    <nav class="tab-bar">
      <button :class="['tab', { active: tab === 'sky' }]"     @click="tab = 'sky'">✈ Sky Watch</button>
      <button :class="['tab', { active: tab === 'logbook' }]" @click="tab = 'logbook'">📋 Logbook <span v-if="logEntries.length" class="tab-count">{{ logEntries.length }}</span></button>
    </nav>

    <template v-if="tab === 'sky'">
      <WeatherStrip :weather="weather" />
      <LocationBar
        :home="home"
        :scan-km="scanKm"
        :airport="airport"
        @location-change="onLocationChange"
        @scan-change="onScanChange"
      />
      <div class="main-content">
        <div class="left-col">
          <OverheadCard :plane="overhead" :home="home" :airport="airport" />
          <SkyStats :planes="airborne" />
          <NearbyList
            :planes="airborne"
            :home="home"
            :airport="airport"
            :selected-id="selectedId"
            @select="onSelect"
          />
          <DeparturesList
            :departures="departures"
            :airport="airport"
            :loading="departuresLoading"
          />
        </div>
        <TrafficMap
          :planes="airborne"
          :home="home"
          :scan-km="scanKm"
          :airport="airport"
          :selected-id="selectedId"
          @location-change="onLocationChange"
          @select="onSelect"
        />
      </div>
    </template>

    <LogbookPage
      v-else-if="tab === 'logbook'"
      :entries="logEntries"
      :stats="logStats"
      @clear="clearLog"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useSettings }   from './composables/useSettings'
import { useFlights }    from './composables/useFlights'
import { useDepartures } from './composables/useDepartures'
import { useWeather }    from './composables/useWeather'
import { useLogbook }    from './composables/useLogbook'
import { nearestAirport } from './data/airports'
import AppHeader      from './components/AppHeader.vue'
import WeatherStrip   from './components/WeatherStrip.vue'
import LocationBar    from './components/LocationBar.vue'
import OverheadCard   from './components/OverheadCard.vue'
import TrafficMap     from './components/TrafficMap.vue'
import NearbyList     from './components/NearbyList.vue'
import DeparturesList from './components/DeparturesList.vue'
import SkyStats       from './components/SkyStats.vue'
import LogbookPage    from './components/LogbookPage.vue'

const { home, scanKm, saveSettings } = useSettings()
const airport = computed(() => nearestAirport(home.value.lat, home.value.lon))

const { planes, loading, error, lastUpdate } = useFlights(home, scanKm, airport)
const { departures, loading: departuresLoading } = useDepartures(airport)
const { weather } = useWeather(home)

const airborne = computed(() =>
  planes.value
    .filter(p => !p.on_ground && p.lat != null && p.lon != null && p.baro_alt > 100)
    .sort((a, b) => a._dist - b._dist)
)
const overhead = computed(() => airborne.value[0] ?? null)

const { entries: logEntries, stats: logStats, clearLog } = useLogbook(overhead)

const tab = ref('sky')

const selectedId = ref(null)
function onSelect(icao24) {
  selectedId.value = selectedId.value === icao24 ? null : icao24
}

function onLocationChange(newHome) {
  home.value = { ...home.value, ...newHome }
  saveSettings()
}

function onScanChange(km) {
  scanKm.value = km
  saveSettings()
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.tab-bar {
  display: flex;
  align-items: flex-end;
  gap: 0;
  padding: 0 14px;
  background: #090d19;
  border-bottom: 1px solid var(--bdr);
  flex-shrink: 0;
}

.tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--dim);
  font-size: 12px;
  font-weight: 600;
  padding: 8px 14px;
  cursor: pointer;
  transition: color .15s;
  margin-bottom: -1px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  letter-spacing: .3px;
}
.tab:hover { color: var(--muted); }
.tab.active { color: var(--blue); border-bottom-color: var(--blue); }

.tab-count {
  background: var(--blue);
  color: #0a0e1a;
  font-size: 9px;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 8px;
  line-height: 1.4;
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 12px;
  padding: 12px 14px;
  overflow: hidden;
  min-height: 0;
}

.left-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  min-height: 0;
  padding-bottom: 8px;
}

@media (max-width: 860px) {
  .app {
    height: auto;
    min-height: 100dvh;
    overflow: visible;
  }
  .main-content {
    grid-template-columns: 1fr;
    overflow: visible;
    height: auto;
    padding: 8px 10px;
    gap: 8px;
  }
  .left-col {
    overflow: visible;
    height: auto;
  }
}
</style>
