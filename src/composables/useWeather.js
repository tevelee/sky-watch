import { ref, watch, onMounted, onUnmounted } from 'vue'
import { WMO } from '../utils'

export function useWeather(home) {
  const weather = ref(null)
  let timer = null

  async function refresh() {
    try {
      const h = home.value
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${h.lat}&longitude=${h.lon}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,visibility,cloud_cover&wind_speed_unit=kmh`
      const r = await fetch(url)
      if (!r.ok) return
      const d = await r.json()
      const c = d.current
      const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
      weather.value = {
        temp:     c.temperature_2m,
        humidity: c.relative_humidity_2m,
        windKmh:  Math.round(c.wind_speed_10m),
        windDir:  dirs[Math.round(c.wind_direction_10m / 22.5) % 16],
        desc:     WMO[c.weather_code] ?? 'Unknown',
        code:     c.weather_code,
        visKm:    c.visibility >= 10000 ? '10+' : (c.visibility / 1000).toFixed(1),
        cloudPct: c.cloud_cover,
      }
    } catch {}
  }

  onMounted(() => { refresh(); timer = setInterval(refresh, 5 * 60 * 1000) })
  onUnmounted(() => clearInterval(timer))
  watch(home, refresh, { deep: true })

  return { weather, refresh }
}
