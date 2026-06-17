<template>
  <div class="map-card">
    <div class="card-title">Live traffic map</div>
    <div ref="mapEl" class="map"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import L from 'leaflet'

const props = defineProps({
  planes:  Array,
  home:    Object,
  scanKm:  Number,
  airport: Object,
})
const emit = defineEmits(['location-change'])

const mapEl = ref(null)

let map, homeMarker, homeCircle, apMarker, planeLayer, routeLayer

function planeIcon(hdg, highlight) {
  const c = highlight ? '#f59e0b' : '#3b82f6'
  const s = highlight ? 22 : 16
  return L.divIcon({
    html: `<div style="font-size:${s}px;color:${c};transform:rotate(${hdg}deg);line-height:1;filter:drop-shadow(0 0 3px ${c}66);">✈</div>`,
    iconSize: [s, s], iconAnchor: [s/2, s/2], className: '',
    zIndexOffset: highlight ? 500 : 0,
  })
}

function homeIcon() {
  return L.divIcon({
    html: '<div style="width:14px;height:14px;background:#f59e0b;border-radius:50%;border:2px solid #fff;box-shadow:0 0 8px #f59e0b88;cursor:grab;"></div>',
    iconSize: [14, 14], iconAnchor: [7, 7], className: '',
  })
}

function apIcon(iata) {
  return L.divIcon({
    html: `<div style="background:#1e3a5f;color:#60a5fa;padding:2px 7px;border-radius:5px;font-size:11px;font-weight:700;border:1px solid #2d5080;white-space:nowrap;">✈ ${iata}</div>`,
    className: '', iconAnchor: [24, 10],
  })
}

function setAirportMarker(airport) {
  apMarker?.remove()
  apMarker = null
  if (!airport) return
  apMarker = L.marker([airport.lat, airport.lon], { icon: apIcon(airport.iata), zIndexOffset: -100 })
    .bindPopup(`<b>${airport.name}</b><br>${airport.city} (${airport.iata})`)
    .addTo(map)
}

function updatePlanes() {
  if (!planeLayer) return
  planeLayer.clearLayers()
  routeLayer.clearLayers()
  const ap = props.airport
  ;(props.planes ?? []).forEach((p, i) => {
    if (p.lat == null || p.lon == null) return
    const hi = i === 0
    L.marker([p.lat, p.lon], { icon: planeIcon(p.heading ?? 0, hi) })
      .bindPopup([
        `<b>${p.callsign ?? p.icao24}</b>`,
        p._ac?.name ?? p.typeCode ?? '',
        [p._altM ? (p._altM/1000).toFixed(1)+' km' : '', p._speedKmh ? p._speedKmh+' km/h' : ''].filter(Boolean).join(' · '),
        p.origIata && p.destIata ? `${p.origIata} → ${p.destIata}` : '',
        p._airline ?? '',
      ].filter(Boolean).join('<br>'))
      .addTo(planeLayer)

    if (hi && ap) {
      L.polyline([[p.lat, p.lon], [ap.lat, ap.lon]], {
        color: '#f59e0b', weight: 1, dashArray: '4,8', opacity: .3,
      }).addTo(routeLayer)
    }
  })
}

onMounted(() => {
  map = L.map(mapEl.value, { zoomControl: true }).setView([props.home.lat, props.home.lon], 9)

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    subdomains: 'abcd', maxZoom: 19,
  }).addTo(map)

  homeMarker = L.marker([props.home.lat, props.home.lon], { icon: homeIcon(), draggable: true })
    .bindTooltip('Drag to set your location', { direction: 'top' })
    .addTo(map)

  homeMarker.on('dragend', e => {
    const ll = e.target.getLatLng()
    emit('location-change', {
      lat:  Math.round(ll.lat * 10000) / 10000,
      lon:  Math.round(ll.lng * 10000) / 10000,
      name: 'Custom location',
    })
  })

  homeCircle = L.circle([props.home.lat, props.home.lon], {
    radius: props.scanKm * 1000,
    color: '#f59e0b', weight: 1, fillOpacity: .03, dashArray: '5,7',
  }).addTo(map)

  planeLayer = L.layerGroup().addTo(map)
  routeLayer = L.layerGroup().addTo(map)

  setAirportMarker(props.airport)
  updatePlanes()
})

onUnmounted(() => { map?.remove() })

watch(() => props.planes, updatePlanes, { deep: true })

watch(() => props.home, (h) => {
  homeMarker?.setLatLng([h.lat, h.lon])
  homeCircle?.setLatLng([h.lat, h.lon])
}, { deep: true })

watch(() => props.scanKm, (km) => {
  homeCircle?.setRadius(km * 1000)
})

watch(() => props.airport, (ap) => {
  setAirportMarker(ap)
}, { deep: true })
</script>

<style scoped>
.map-card {
  background: var(--card);
  border: 1px solid var(--bdr);
  border-radius: var(--radius);
  padding: 13px;
  display: flex;
  flex-direction: column;
  min-height: 420px;
}

@media (max-width: 860px) {
  .map-card {
    min-height: 280px;
  }
  .map {
    min-height: 230px;
  }
}

.card-title {
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.8px;
  color: var(--dim);
  margin-bottom: 10px;
  flex-shrink: 0;
}

.map {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  min-height: 360px;
}
</style>
