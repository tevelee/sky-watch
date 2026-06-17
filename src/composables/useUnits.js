import { ref } from 'vue'

const UNITS_KEY = 'sky-units'
let _stored = 'metric'
try { _stored = localStorage.getItem(UNITS_KEY) || 'metric' } catch {}

const _units = ref(_stored)

export const UNIT_OPTIONS = [
  { value: 'metric',   label: 'Metric',   desc: 'km/h · km · °C' },
  { value: 'aviation', label: 'Aviation', desc: 'kt · FL · nm · °C' },
  { value: 'imperial', label: 'Imperial', desc: 'mph · ft · mi · °F' },
]

export function useUnits() {
  function setUnits(u) {
    _units.value = u
    try { localStorage.setItem(UNITS_KEY, u) } catch {}
  }

  // Full formatted strings
  function fmtAlt(ft) {
    if (ft == null || ft <= 0) return '—'
    const u = _units.value
    if (u === 'aviation') return `FL${Math.round(ft / 100)}`
    if (u === 'imperial') return `${Math.round(ft).toLocaleString()} ft`
    const m = Math.round(ft * 0.3048)
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`
  }

  function fmtSpeed(knots) {
    if (!knots) return '—'
    const u = _units.value
    if (u === 'aviation') return `${Math.round(knots)} kt`
    if (u === 'imperial') return `${Math.round(knots * 1.15078)} mph`
    return `${Math.round(knots * 1.852)} km/h`
  }

  function fmtDist(km) {
    if (km == null) return '—'
    const u = _units.value
    if (u === 'aviation') {
      const nm = km / 1.852
      return `${nm < 10 ? nm.toFixed(1) : Math.round(nm)} nm`
    }
    if (u === 'imperial') {
      const mi = km * 0.621371
      return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`
    }
    return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`
  }

  function fmtTemp(celsius) {
    if (celsius == null) return '—'
    if (_units.value === 'imperial') return `${Math.round(celsius * 9 / 5 + 32)}°F`
    return `${parseFloat(celsius).toFixed(1)}°C`
  }

  function fmtVert(ftMin) {
    if (!ftMin || Math.abs(ftMin) < 64) return null
    const dir = ftMin > 0 ? '▲' : '▼'
    const abs = Math.abs(Math.round(ftMin))
    if (_units.value === 'metric') return `${dir} ${Math.round(abs * 0.3048)} m/min`
    return `${dir} ${abs.toLocaleString()} ft/min`
  }

  // Split value + unit for stats grids
  function altParts(ft) {
    if (ft == null || ft <= 0) return { val: '—', unit: '' }
    const u = _units.value
    if (u === 'aviation') return { val: `FL${Math.round(ft / 100)}`, unit: '' }
    if (u === 'imperial') return { val: Math.round(ft).toLocaleString(), unit: 'ft' }
    const m = Math.round(ft * 0.3048)
    return m >= 1000 ? { val: (m / 1000).toFixed(1), unit: 'km' } : { val: m, unit: 'm' }
  }

  function speedParts(knots) {
    if (!knots) return { val: '—', unit: '' }
    const u = _units.value
    if (u === 'aviation') return { val: Math.round(knots), unit: 'kt' }
    if (u === 'imperial') return { val: Math.round(knots * 1.15078), unit: 'mph' }
    return { val: Math.round(knots * 1.852), unit: 'km/h' }
  }

  function distParts(km) {
    if (km == null) return { val: '—', unit: '' }
    const u = _units.value
    if (u === 'aviation') {
      const nm = km / 1.852
      return { val: nm < 10 ? nm.toFixed(1) : Math.round(nm), unit: 'nm' }
    }
    if (u === 'imperial') {
      const mi = km * 0.621371
      return { val: mi < 10 ? mi.toFixed(1) : Math.round(mi), unit: 'mi' }
    }
    return { val: km < 10 ? km.toFixed(1) : Math.round(km), unit: 'km' }
  }

  return {
    units: _units,
    setUnits,
    fmtAlt, fmtSpeed, fmtDist, fmtTemp, fmtVert,
    altParts, speedParts, distParts,
  }
}
