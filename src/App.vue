<template>
  <div class="app">
    <AppHeader :last-update="lastUpdate" :loading="loading" :error="error" />
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
        <NearbyList :planes="airborne" :home="home" :airport="airport" />
      </div>
      <TrafficMap
        :planes="airborne"
        :home="home"
        :scan-km="scanKm"
        :airport="airport"
        @location-change="onLocationChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSettings }  from './composables/useSettings'
import { useFlights }   from './composables/useFlights'
import { useWeather }   from './composables/useWeather'
import { nearestAirport } from './data/airports'
import AppHeader    from './components/AppHeader.vue'
import WeatherStrip from './components/WeatherStrip.vue'
import LocationBar  from './components/LocationBar.vue'
import OverheadCard from './components/OverheadCard.vue'
import TrafficMap   from './components/TrafficMap.vue'
import NearbyList   from './components/NearbyList.vue'
import SkyStats     from './components/SkyStats.vue'

const { home, scanKm, saveSettings } = useSettings()
const airport = computed(() => nearestAirport(home.value.lat, home.value.lon))

const { planes, loading, error, lastUpdate } = useFlights(home, scanKm, airport)
const { weather } = useWeather(home)

const airborne = computed(() =>
  planes.value
    .filter(p => !p.on_ground && p.lat != null && p.lon != null && p.baro_alt > 100)
    .sort((a, b) => a._dist - b._dist)
)
const overhead = computed(() => airborne.value[0] ?? null)

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
