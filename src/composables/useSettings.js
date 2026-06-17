import { ref } from 'vue'

const STORAGE_KEY = 'sky-config'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}

export function useSettings() {
  const cfg = load()

  const home = ref({
    lat:  cfg.lat  ?? 47.497,
    lon:  cfg.lon  ?? 18.957,
    name: cfg.name ?? 'Taraliget',
  })

  const scanKm = ref(cfg.scanKm ?? 25)

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        lat: home.value.lat, lon: home.value.lon,
        name: home.value.name, scanKm: scanKm.value,
      }))
    } catch {}
  }

  return { home, scanKm, saveSettings }
}
