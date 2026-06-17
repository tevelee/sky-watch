import { ref } from 'vue'

// A single shared <audio> element so only one ATC channel ever plays at once.
// State is module-level (a singleton) so every card observes the same playback.
const current = ref(null)   // url of the channel currently selected, or null
const status  = ref('idle') // 'idle' | 'loading' | 'playing' | 'error'

let audio = null

function ensureAudio() {
  if (audio) return audio
  audio = new Audio()
  audio.preload = 'none'
  audio.addEventListener('playing', () => { status.value = 'playing' })
  audio.addEventListener('waiting', () => { status.value = 'loading' })
  audio.addEventListener('stalled', () => { status.value = 'loading' })
  audio.addEventListener('error',   () => { status.value = 'error' })
  return audio
}

function stop() {
  if (!audio) return
  audio.pause()
  audio.removeAttribute('src')
  audio.load()
  current.value = null
  status.value  = 'idle'
}

// Play the given stream, or mute it if it's already the active channel.
function toggle(url) {
  if (!url) return
  if (current.value === url) { stop(); return }
  const a = ensureAudio()
  current.value = url
  status.value  = 'loading'
  a.src = url
  a.play().catch(() => { if (current.value === url) status.value = 'error' })
}

export function useAtcRadio() {
  return { current, status, toggle, stop }
}
