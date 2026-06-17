// ── Geo ────────────────────────────────────────────────────────────
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, r = Math.PI / 180
  const dLat = (lat2 - lat1) * r
  const dLon = (lon2 - lon1) * r
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export function bearing(lat1, lon1, lat2, lon2) {
  const r = Math.PI / 180
  const y = Math.sin((lon2-lon1)*r) * Math.cos(lat2*r)
  const x = Math.cos(lat1*r)*Math.sin(lat2*r) - Math.sin(lat1*r)*Math.cos(lat2*r)*Math.cos((lon2-lon1)*r)
  return (Math.atan2(y, x) * 180/Math.PI + 360) % 360
}

export function bearingCard(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  return dirs[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16]
}

// ── Units ───────────────────────────────────────────────────────────
export const ftToM    = ft  => Math.round(ft * 0.3048)
export const ktsToKmh = kt  => Math.round(kt * 1.852)
export const fpmToMpm = fpm => Math.round(Math.abs(fpm) * 0.3048)

// ── Display strings ─────────────────────────────────────────────────
export function altStr(ft) {
  if (!ft || ft <= 0) return '—'
  const m = ftToM(ft)
  return m >= 1000 ? (m/1000).toFixed(1) + ' km' : m.toLocaleString() + ' m'
}

export function speedStr(kts) {
  if (!kts) return '—'
  return ktsToKmh(kts) + ' km/h'
}

export function vertStr(fpm) {
  if (!fpm || Math.abs(fpm) < 200) return null
  const mpm = fpmToMpm(fpm)
  return fpm > 0 ? `↑ ${mpm} m/min` : `↓ ${mpm} m/min`
}

// ── Flight analysis ─────────────────────────────────────────────────

// Classify a flight relative to an airport
export function classifyFlight(p, airport) {
  if (!airport || !p.lat || !p.lon) return 'other'
  const altM = p.baro_alt ? ftToM(p.baro_alt) : 0
  const vr   = p.vert_rate || 0
  const dist = haversine(p.lat, p.lon, airport.lat, airport.lon)
  if (dist < 120 && vr < -200 && altM < 9500) return 'arriving'
  if (dist < 90  && vr >  400 && altM < 8000) return 'departing'
  if (altM > 9000) return 'transit'
  return 'other'
}

// Closest Point of Approach — minutes until <6 km overhead, null otherwise
export function etaOverhead(p, home) {
  if (!p.lat || !p.lon || !p.velocity || !p.heading) return null
  const spKmMin = ktsToKmh(p.velocity) / 60
  if (spKmMin < 1) return null
  const hdg    = p.heading * Math.PI / 180
  const vE     = spKmMin * Math.sin(hdg)
  const vN     = spKmMin * Math.cos(hdg)
  const cosLat = Math.cos(home.lat * Math.PI / 180)
  const dE     = (p.lon - home.lon) * 111.32 * cosLat
  const dN     = (p.lat - home.lat) * 110.57
  const denom  = vE*vE + vN*vN
  if (!denom) return null
  const t      = -(dE*vE + dN*vN) / denom
  if (t < 0.3 || t > 60) return null
  const cpaDist = Math.sqrt((dE+vE*t)**2 + (dN+vN*t)**2)
  if (cpaDist > 6) return null
  return Math.round(t)
}

// Look-up angle and sound delay from home to a plane
export function lookUpAngle(plane, home) {
  if (!plane?.lat || !plane?.lon) return null
  const distKm = haversine(home.lat, home.lon, plane.lat, plane.lon)
  const altM   = plane.baro_alt ? ftToM(plane.baro_alt) : 0
  if (!distKm || !altM) return null
  const distM     = distKm * 1000
  const elevDeg   = Math.atan2(altM, distM) * 180 / Math.PI
  const dist3dM   = Math.sqrt(distM**2 + altM**2)
  const soundSec  = Math.round(dist3dM / 343)
  const brng      = bearing(home.lat, home.lon, plane.lat, plane.lon)
  return {
    bearing:    Math.round(brng),
    cardinal:   bearingCard(brng),
    elevation:  Math.round(elevDeg),
    soundDelay: soundSec,
    dist3dKm:   (dist3dM / 1000).toFixed(1),
  }
}

// ── Sonic boom ──────────────────────────────────────────────────────
// Returns a boom prediction object when the plane is supersonic and the
// observer is inside or near the Mach cone footprint, or null otherwise.
//
// Mach cone half-angle: μ = arcsin(1/M)
// At the plane's altitude h, the boom carpet extends laterally ~h/tan(μ)
// from the ground track. We check the perpendicular distance from the
// observer to the aircraft's ground track to decide if we're in range.
export function sonicBoomPrediction(plane, home) {
  if (!plane.mach || plane.mach < 1.0) return null
  if (!plane.lat || !plane.lon || !plane.heading || !plane.baro_alt) return null

  const M   = plane.mach
  const mu  = Math.asin(1 / M)                   // Mach cone half-angle (rad)
  const altM = plane.baro_alt * 0.3048            // altitude in metres

  // Carpet half-width at sea level (metres)
  const carpetM = altM / Math.tan(mu)

  // Observer position relative to plane in km (East, North)
  const cosLat = Math.cos(plane.lat * Math.PI / 180)
  const dE = (home.lon - plane.lon) * 111.32 * cosLat
  const dN = (home.lat - plane.lat) * 110.57

  // Unit vector along ground track
  const hdgRad = plane.heading * Math.PI / 180
  const tE = Math.sin(hdgRad), tN = Math.cos(hdgRad)

  // Perpendicular (cross-track) distance from observer to track in km
  const crossKm = Math.abs(dE * tN - dN * tE)
  const crossM  = crossKm * 1000

  // Along-track distance (negative = plane hasn't reached our longitude yet)
  const alongKm = dE * tE + dN * tN

  if (crossM > carpetM * 1.5) return null   // clearly outside carpet

  const inCarpet  = crossM <= carpetM
  const speedKmS  = ktsToKmh(plane.velocity) / 3600   // km/s
  // Time until boom arrives: sound travels the slant distance from the cone
  // intercept point. Approximate as carpet edge at current forward position.
  const etaSec = speedKmS > 0 && alongKm < 0
    ? Math.round(Math.abs(alongKm) / speedKmS)
    : null

  return {
    mach:       M.toFixed(2),
    muDeg:      Math.round(mu * 180 / Math.PI),
    carpetKm:   Math.round(carpetM / 100) / 10,
    crossKm:    Math.round(crossKm * 10) / 10,
    inCarpet,
    etaSec,
  }
}

export function squawkAlert(squawk) {
  const codes = { '7700': '🚨 Emergency', '7600': '📡 Radio failure', '7500': '🚨 Hijack declared' }
  return codes[squawk] || null
}

// ── Weather ─────────────────────────────────────────────────────────
export const WMO = {
  0:'Clear sky', 1:'Mainly clear', 2:'Partly cloudy', 3:'Overcast',
  45:'Fog', 51:'Light drizzle', 53:'Drizzle', 55:'Heavy drizzle',
  61:'Light rain', 63:'Rain', 65:'Heavy rain',
  71:'Light snow', 73:'Snow', 75:'Heavy snow',
  80:'Showers', 81:'Heavy showers', 82:'Violent showers',
  95:'Thunderstorm', 96:'Hail & thunder',
}
