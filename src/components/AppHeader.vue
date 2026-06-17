<template>
  <header>
    <div class="logo">
      <span class="title">Sky Watch</span>
    </div>
    <div class="live">
      <div :class="['dot', error ? 'err' : loading ? 'loading' : '']"></div>
      <span class="status">{{ statusText }}</span>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  lastUpdate: Date,
  loading:    Boolean,
  error:      String,
})

const statusText = computed(() => {
  if (props.error)   return 'Error — retrying'
  if (props.loading) return 'Fetching…'
  if (props.lastUpdate) {
    return 'Updated ' + props.lastUpdate.toLocaleTimeString('hu-HU', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  }
  return 'Connecting…'
})
</script>

<style scoped>
header {
  background: var(--card);
  border-bottom: 1px solid var(--bdr);
  padding: 11px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -.3px;
  color: var(--text);
}

.live {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  color: var(--muted);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--green);
  animation: blink 2s ease-in-out infinite;
}
.dot.err     { background: var(--red); animation: none; }
.dot.loading { background: var(--amber); }

@keyframes blink { 0%,100% { opacity: 1 } 50% { opacity: .3 } }
</style>
