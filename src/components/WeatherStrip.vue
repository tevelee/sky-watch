<template>
  <div class="weather-strip">
    <template v-if="weather">
      <span class="w">🌡️ {{ weather.temp }}°C</span>
      <span class="w">{{ weatherIcon }} {{ weather.desc }}</span>
      <span class="w">☁️ {{ weather.cloudPct }}%</span>
      <span class="w">💧 {{ weather.humidity }}%</span>
      <span class="w">💨 {{ weather.windKmh }} km/h {{ weather.windDir }}</span>
      <span class="w">👁 {{ weather.visKm }} km</span>
    </template>
    <template v-else>
      <span class="w muted">⏳ Loading weather…</span>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ weather: Object })

const weatherIcon = computed(() => {
  const c = props.weather?.code ?? -1
  if (c === 0)                     return '☀️'
  if (c <= 2)                      return '⛅'
  if (c === 3)                     return '☁️'
  if (c === 45 || c === 48)        return '🌫️'
  if (c >= 51 && c <= 55)          return '🌦️'
  if (c >= 61 && c <= 65)          return '🌧️'
  if (c >= 71 && c <= 77)          return '❄️'
  if (c >= 80 && c <= 82)          return '🌧️'
  if (c >= 95)                     return '⛈️'
  return '🌤️'
})
</script>

<style scoped>
.weather-strip {
  background: #090d19;
  border-bottom: 1px solid var(--bdr);
  padding: 7px 20px;
  display: flex;
  gap: 20px;
  overflow-x: auto;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}
.w { display: flex; align-items: center; gap: 4px; }
.muted { color: var(--dim); }
</style>
