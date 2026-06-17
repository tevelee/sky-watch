import { getIcao } from './atc'

// Curated LiveATC stream feeds, keyed by ICAO.
//
// LiveATC has no public API, and its feed pages can't be read from the browser
// (no CORS), so channels are maintained here by hand. Each `url` is the direct
// audio stream for that feed's mount. The streaming host (s1 / d1 / …) is
// feed-specific, so verify the exact URL on the airport's LiveATC page — open
// atcUrl(iata), pick a feed, and copy the stream address it plays. Anything not
// listed here falls back to the "find feeds on LiveATC" link.
export const ATC_FEEDS = {
  LHBP: [ // Budapest
    { label: 'Tower',    freq: '118.100', url: 'https://s1.liveatc.net/lhbp_twr' },
    { label: 'Ground',   freq: '121.900', url: 'https://s1.liveatc.net/lhbp_gnd' },
    { label: 'Approach', freq: '129.700', url: 'https://s1.liveatc.net/lhbp_app' },
  ],
  LOWW: [ // Vienna
    { label: 'Tower',    freq: '119.400', url: 'https://s1.liveatc.net/loww_twr' },
    { label: 'Approach', freq: '128.200', url: 'https://s1.liveatc.net/loww_app' },
  ],
  EGLL: [ // London Heathrow
    { label: 'Tower',    freq: '118.500', url: 'https://s1.liveatc.net/egll_twr' },
    { label: 'Ground',   freq: '121.900', url: 'https://s1.liveatc.net/egll_gnd' },
    { label: 'Director', freq: '119.725', url: 'https://s1.liveatc.net/egll_dir' },
  ],
  KJFK: [ // New York JFK
    { label: 'Tower',    freq: '119.100', url: 'https://s1.liveatc.net/kjfk_twr' },
    { label: 'Ground',   freq: '121.900', url: 'https://s1.liveatc.net/kjfk_gnd' },
    { label: 'Approach', freq: '127.400', url: 'https://s1.liveatc.net/kjfk_app' },
  ],
}

export function getFeeds(iata) {
  const icao = getIcao(iata)
  return (icao && ATC_FEEDS[icao]) || []
}
