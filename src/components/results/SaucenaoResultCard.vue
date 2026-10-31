<script setup lang="ts">
import { computed } from 'vue'
import ResultStar from './ResultStar.vue'
import type { ResultType } from '@/types/common'

const props = defineProps<{
  item: ResultType
  index: number
  marked: boolean
}>()

const emit = defineEmits<{ (event: 'mark', id: string): void }>()

/** 来源站点 → 卡片强调色，让每条结果一眼能看出出处 */
const SOURCE_COLORS: Record<string, string> = {
  pixiv: '#0096fa',
  danbooru: '#006ff9',
  gelbooru: '#1f6feb',
  yandere: '#e5484d',
  konachan: '#6e56cf',
  sankaku: '#8b5cf6',
  'e-shuushuu': '#e06b9a',
  zerochan: '#f59e0b',
  'anime-pictures': '#8b5cf6',
  twitter: '#1d9bf0',
  deviantart: '#05cc47',
  mangadex: '#ff6740',
  nhentai: '#ed2553',
  anidb: '#2e51a2',
  anime: '#2e51a2',
  'h-misc': '#ed2553',
}

const sourceKey = computed(() => (props.item.source ?? '').toLowerCase())
const sourceColor = computed(() => {
  const key = Object.keys(SOURCE_COLORS).find((name) => sourceKey.value.includes(name))
  return key ? SOURCE_COLORS[key] : '#f0653a'
})
const sourceName = computed(() => props.item.source?.split(' · ')[0] || '未知来源')
const title = computed(() => props.item.title || `候选结果 #${props.index + 1}`)
const cover = computed(() => props.item.thumbnail ?? props.item.preview)
const previewList = computed(() => (props.item.preview ? [props.item.preview] : []))

const rating = computed(() => {
  const level = (props.item.level ?? '').toLowerCase()
  if (!level) return undefined
  if (level === 'safe') return { label: 'SAFE', tone: 'safe' }
  if (level === 'questionable') return { label: 'R18?', tone: 'warn' }
  return { label: 'R18', tone: 'r18' }
})

const RING_RADIUS = 26
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS
const ringOffset = computed(
  () =>
    RING_CIRCUMFERENCE *
    (1 - Math.min(100, Math.max(0, props.item.similarity)) / 100)
)
</script>

<template>
  <article
    class="sauce-card luoma-fade-up"
    :class="{ 'is-marked': marked, 'is-best': index === 0 }"
    :style="{ '--source': sourceColor }"
  >
    <div class="sauce-card__media">
      <el-image
        v-if="!item.thumbnailBlocked"
        class="sauce-card__image"
        :src="cover"
        :alt="title"
        fit="cover"
        lazy
        :preview-src-list="previewList"
        :initial-index="0"
        preview-teleported
        hide-on-click-modal
      >
        <template #error>
          <div class="sauce-card__fallback">
            <el-icon><Picture /></el-icon>
            <span>预览不可用</span>
          </div>
        </template>
        <template #placeholder>
          <div class="sauce-card__fallback">
            <el-icon class="is-spin"><Loading /></el-icon>
            <span>加载中</span>
          </div>
        </template>
      </el-image>

      <div v-else class="sauce-card__blocked">
        <el-icon><Lock /></el-icon>
        <span>{{ item.level === 'Explicit' ? 'R18 预览已隐藏' : '预览已隐藏' }}</span>
      </div>

      <span v-if="index === 0" class="sauce-card__best">BEST</span>

      <div class="sauce-card__ring" :title="`匹配度 ${item.similarity}%`">
        <svg class="sauce-card__ring-svg" viewBox="0 0 64 64" aria-hidden="true">
          <circle class="sauce-card__ring-track" cx="32" cy="32" :r="RING_RADIUS" />
          <circle
            class="sauce-card__ring-value"
            cx="32"
            cy="32"
            :r="RING_RADIUS"
            :stroke-dasharray="RING_CIRCUMFERENCE"
            :stroke-dashoffset="ringOffset"
          />
        </svg>
        <span class="sauce-card__ring-text">
          {{ item.similarity }}<small>%</small>
        </span>
      </div>
    </div>

    <div class="sauce-card__body">
      <div class="sauce-card__head">
        <div class="sauce-card__source">
          <span class="sauce-card__dot" />
          <img v-if="item.serviceIcon" class="sauce-card__favicon" :src="item.serviceIcon" alt="" />
          <span class="sauce-card__source-name">{{ sourceName }}</span>
        </div>

        <div class="sauce-card__head-right">
          <span v-if="rating" class="sauce-card__rating" :class="`is-${rating.tone}`">
            {{ rating.label }}
          </span>
          <ResultStar
            :marked="marked"
            @toggle="emit('mark', item.id)"
          />
        </div>
      </div>

      <h3 class="sauce-card__title" :title="title">{{ title }}</h3>

      <div v-if="item.author" class="sauce-card__author">
        <el-icon><User /></el-icon>
        <span class="sauce-card__author-label">作者</span>
        <b>{{ item.author }}</b>
      </div>

      <div class="sauce-card__actions">
        <a
          v-if="item.url"
          class="sauce-card__primary"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          打开 {{ sourceName }} 原帖
          <el-icon><TopRight /></el-icon>
        </a>
        <a
          v-if="item.preview"
          class="sauce-card__link"
          :href="item.preview"
          target="_blank"
          rel="noopener noreferrer"
        >
          直接打开原图
        </a>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.sauce-card {
  --source: #f0653a;

  display: grid;
  grid-template-columns: 160px minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--luoma-border);
  border-top: 3px solid var(--source);
  border-radius: var(--luoma-radius-lg);
  background: var(--luoma-surface);
  box-shadow: var(--luoma-shadow-sm);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--source) 45%, var(--luoma-border));
    box-shadow: var(--luoma-shadow);
    transform: translateY(-1px);
  }

  &.is-best {
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--source) 45%, transparent),
      var(--luoma-shadow-sm);
  }

  &.is-marked {
    border-color: var(--luoma-brand);
    box-shadow: 0 0 0 3px var(--luoma-brand-soft), var(--luoma-shadow-sm);
  }

  &__media {
    position: relative;
    min-height: 160px;
    overflow: hidden;
    background: var(--luoma-surface-2);
  }

  &__image {
    display: block;
    width: 100%;
    height: 100%;

    :deep(.el-image__inner) {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
    }
  }

  &:hover &__image :deep(.el-image__inner) {
    transform: scale(1.035);
  }

  &__fallback,
  &__blocked {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    height: 160px;
    padding: 12px;
    text-align: center;
    color: var(--luoma-text-3);
    font-size: 11px;
    background: repeating-linear-gradient(
      135deg,
      var(--luoma-surface-2) 0 8px,
      color-mix(in srgb, var(--luoma-surface-2) 65%, var(--luoma-border)) 8px 16px
    );

    .el-icon {
      font-size: 22px;
      color: color-mix(in srgb, var(--source) 70%, var(--luoma-text-3));
    }

    .is-spin {
      animation: sauce-spin 1s linear infinite;
    }
  }

  &__best {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 3px 8px;
    border-radius: 6px;
    background: var(--source);
    color: #fff;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 1.2px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.22);
  }

  &__ring {
    position: absolute;
    right: 8px;
    bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 58px;
    height: 58px;
    border-radius: 50%;
    background: rgba(10, 12, 20, 0.58);
    backdrop-filter: blur(8px);
  }

  &__ring-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  &__ring-track,
  &__ring-value {
    fill: none;
    stroke-width: 4;
  }

  &__ring-track {
    stroke: rgba(255, 255, 255, 0.18);
  }

  &__ring-value {
    stroke: var(--source);
    stroke-linecap: round;
    filter: drop-shadow(0 0 3px color-mix(in srgb, var(--source) 65%, transparent));
    transition: stroke-dashoffset 0.5s ease;
  }

  &__ring-text {
    position: relative;
    color: #fff;
    font-size: 14px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1;

    small {
      font-size: 8px;
      font-weight: 700;
      opacity: 0.75;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 7px;
    min-width: 0;
    padding: 12px 16px 13px;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__source {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    font-size: 12px;
    font-weight: 700;
  }

  &__dot {
    width: 7px;
    height: 7px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: var(--source);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--source) 18%, transparent);
  }

  &__favicon {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    flex: 0 0 auto;
  }

  &__source-name {
    color: var(--source);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__head-right {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-left: auto;
    flex: 0 0 auto;
  }

  &__rating {
    padding: 2px 7px;
    border-radius: 6px;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.5px;

    &.is-safe {
      background: color-mix(in srgb, #10b981 14%, transparent);
      color: #059669;
    }

    &.is-warn {
      background: color-mix(in srgb, #f59e0b 16%, transparent);
      color: #b45309;
    }

    &.is-r18 {
      background: color-mix(in srgb, #dc2626 14%, transparent);
      color: #dc2626;
    }
  }

  &__title {
    margin: 0;
    color: var(--luoma-text);
    font-size: 16px;
    font-weight: 700;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__author {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    color: var(--luoma-text-2);
    font-size: 12px;

    .el-icon {
      color: var(--luoma-text-3);
      font-size: 13px;
      flex: 0 0 auto;
    }

    b {
      color: var(--luoma-text);
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &__author-label {
    color: var(--luoma-text-3);
    font-size: 10px;
    flex: 0 0 auto;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: auto;
    padding-top: 2px;
  }

  &__primary {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 11px;
    border: 1px solid color-mix(in srgb, var(--source) 34%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--source) 12%, var(--luoma-surface));
    color: var(--source);
    font-size: 12px;
    font-weight: 700;
    transition: background 0.18s ease, transform 0.18s ease;

    &:hover {
      background: color-mix(in srgb, var(--source) 20%, var(--luoma-surface));
      transform: translateY(-1px);
    }

    .el-icon {
      font-size: 13px;
    }
  }

  &__link {
    font-size: 12px;
    color: var(--luoma-text-2);
    transition: color 0.18s ease;

    &:hover {
      color: var(--source);
    }
  }
}

@keyframes sauce-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .sauce-card {
    grid-template-columns: 1fr;

    &__media {
      min-height: 0;
      aspect-ratio: 16 / 10;
    }

    &__fallback,
    &__blocked {
      height: 100%;
      min-height: 170px;
    }

    &__body {
      padding: 12px 15px 15px;
    }
  }
}
</style>
