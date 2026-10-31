<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import type { EngineId, ResultType } from '@/types/common'

// 结果卡片只在搜索出结果后出现，按需加载，避免占用首屏
const IqdbResultCard = defineAsyncComponent(() => import('./results/IqdbResultCard.vue'))
const SaucenaoResultCard = defineAsyncComponent(() => import('./results/SaucenaoResultCard.vue'))
const TraceResultCard = defineAsyncComponent(() => import('./results/TraceResultCard.vue'))

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
