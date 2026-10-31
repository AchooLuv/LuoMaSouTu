<script setup lang="ts">
import IqdbResultCard from './results/IqdbResultCard.vue'
import SaucenaoResultCard from './results/SaucenaoResultCard.vue'
import TraceResultCard from './results/TraceResultCard.vue'
import type { EngineId, ResultType } from '@/types/common'

defineProps<{
  engineId: EngineId
  item: ResultType
  index: number
  marked: boolean
}>()

const emit = defineEmits<{ (event: 'mark', id: string): void }>()
</script>

<template>
  <IqdbResultCard
    v-if="engineId === 'iqdb'"
    :item="item"
    :index="index"
    :marked="marked"
    @mark="emit('mark', $event)"
  />
  <SaucenaoResultCard
    v-else-if="engineId === 'saucenao'"
    :item="item"
    :index="index"
    :marked="marked"
    @mark="emit('mark', $event)"
  />
  <TraceResultCard
    v-else
    :item="item"
    :index="index"
    :marked="marked"
    @mark="emit('mark', $event)"
  />
</template>
