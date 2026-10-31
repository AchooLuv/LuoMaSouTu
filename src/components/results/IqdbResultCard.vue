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

const title = computed(() => {
  const raw = props.item.title || `候选结果 #${props.index + 1}`
  // IQDB 的标题常常只是原站帖子号，加个 # 更像个编号而不是神秘数字
  return /^\d+$/.test(raw) ? `#${raw}` : raw
})
const source = computed(() => props.item.source || '未知图库')
const host = computed(() => {
  if (!props.item.url) return ''
  try {
    return new URL(props.item.url).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
})
const tags = computed(() => (props.item.tags ?? []).slice(0, 5))
const cover = computed(() => props.item.thumbnail ?? props.item.preview)
const previewList = computed(() => (props.item.preview ? [props.item.preview] : []))

const rating = computed(() => {
  const level = (props.item.level ?? '').toLowerCase()
  if (!level) return undefined
  if (level === 'safe') return { label: 'SAFE', tone: 'safe' }
  if (level === 'questionable') return { label: 'R18?', tone: 'warn' }
  if (level === 'ero' || level === 'explicit') return { label: 'R18', tone: 'r18' }
  // Unrated 等无法判断的档位不硬贴 R18 标签
  return undefined
})

/** 相似度条保留一点最小可见宽度，避免 0% 时像坏掉 */
const barWidth = computed(() => `${Math.min(100, Math.max(2, props.item.similarity))}%`)
</script>

<template>
  <article class="iqdb-card luoma-fade-up" :class="{ 'is-marked': marked }">
    <div class="iqdb-card__media">
      <el-image
        class="iqdb-card__image"
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
          <div class="iqdb-card__fallback">
            <el-icon><Picture /></el-icon>
            <span>预览不可用</span>
          </div>
        </template>
        <template #placeholder>
          <div class="iqdb-card__fallback">
            <el-icon class="is-spin"><Loading /></el-icon>
            <span>加载中</span>
          </div>
        </template>
      </el-image>

      <div class="iqdb-card__shade" />
      <span class="iqdb-card__rank">#{{ String(index + 1).padStart(2, '0') }}</span>
      <ResultStar
        class="iqdb-card__star"
        variant="overlay"
        :marked="marked"
        @toggle="emit('mark', item.id)"
      />

      <div class="iqdb-card__badges">
        <span v-if="rating" class="iqdb-card__rating" :class="`is-${rating.tone}`">
          {{ rating.label }}
        </span>
        <span v-if="item.size" class="iqdb-card__size">{{ item.size }}</span>
      </div>
    </div>

    <div class="iqdb-card__body">
      <div class="iqdb-card__eyebrow">
        <img v-if="item.serviceIcon" class="iqdb-card__favicon" :src="item.serviceIcon" alt="" />
        <span class="iqdb-card__source">{{ source }}</span>
        <span v-if="host" class="iqdb-card__host">{{ host }}</span>
      </div>

      <h3 class="iqdb-card__title" :title="title">{{ title }}</h3>

      <div class="iqdb-card__meter">
        <div class="iqdb-card__meter-head">
          <span>视觉相似度</span>
          <b>{{ item.similarity }}%</b>
        </div>
        <div class="iqdb-card__bar">
          <i :style="{ width: barWidth }" />
        </div>
      </div>

      <div v-if="tags.length" class="iqdb-card__tags">
        <span v-for="tag in tags" :key="tag" class="iqdb-card__tag">{{ tag }}</span>
      </div>

      <div class="iqdb-card__actions">
        <a
          v-if="item.url"
          class="iqdb-card__primary"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          查看原图页面
          <el-icon><TopRight /></el-icon>
        </a>
        <a
          v-if="item.preview"
          class="iqdb-card__link"
          :href="item.preview"
          target="_blank"
          rel="noopener noreferrer"
        >
          打开大图
        </a>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.iqdb-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--luoma-border);
  border-radius: var(--luoma-radius-lg);
  background: var(--luoma-surface);
  box-shadow: var(--luoma-shadow-sm);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--luoma-brand) 42%, var(--luoma-border));
    box-shadow: var(--luoma-shadow);
    transform: translateY(-1px);
  }

  &.is-marked {
    border-color: var(--luoma-brand);
    box-shadow: 0 0 0 3px var(--luoma-brand-soft), var(--luoma-shadow-sm);
  }

  &__media {
    position: relative;
    aspect-ratio: 16 / 10;
    min-height: 0;
    overflow: hidden;
    background: #0c0f17;
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

  &__fallback {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    height: 100%;
    min-height: 0;
    background: linear-gradient(145deg, #171b28, #0c0f17);
    color: rgba(255, 255, 255, 0.55);
    font-size: 11px;

    .el-icon {
      font-size: 24px;
    }

    .is-spin {
      animation: iqdb-spin 1s linear infinite;
    }
  }

  &__shade {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      rgba(8, 10, 18, 0.5) 0%,
      rgba(8, 10, 18, 0) 26%,
      rgba(8, 10, 18, 0) 56%,
      rgba(8, 10, 18, 0.8) 100%
    );
  }

  &__rank {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(8, 10, 18, 0.58);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.4px;
    backdrop-filter: blur(8px);
  }

  &__star {
    position: absolute;
    top: 6px;
    right: 6px;
  }

  &__badges {
    position: absolute;
    left: 10px;
    bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  &__rating {
    padding: 2px 7px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.5px;

    &.is-safe {
      background: rgba(16, 185, 129, 0.92);
      color: #fff;
    }

    &.is-warn {
      background: rgba(245, 158, 11, 0.94);
      color: #1a1206;
    }

    &.is-r18 {
      background: rgba(220, 38, 38, 0.92);
      color: #fff;
    }
  }

  &__size {
    padding: 2px 7px;
    border-radius: 6px;
    background: rgba(8, 10, 18, 0.62);
    color: rgba(255, 255, 255, 0.88);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    backdrop-filter: blur(8px);
  }

  &__body {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 9px;
    min-width: 0;
    padding: 14px 16px 15px;
  }

  &__eyebrow {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    font-size: 11px;
    letter-spacing: 0.4px;
  }

  &__favicon {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    flex: 0 0 auto;
  }

  &__source {
    color: var(--luoma-brand);
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__host {
    margin-left: auto;
    color: var(--luoma-text-3);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__title {
    margin: 0;
    color: var(--luoma-text);
    font-size: 17px;
    font-weight: 700;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__meter {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-top: 1px;
  }

  &__meter-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    font-size: 11px;
    color: var(--luoma-text-3);

    b {
      color: var(--luoma-text);
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }
  }

  &__bar {
    height: 5px;
    border-radius: 999px;
    background: var(--luoma-surface-2);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(
        90deg,
        var(--luoma-brand),
        color-mix(in srgb, var(--luoma-brand) 55%, #fff)
      );
      transition: width 0.35s ease;
    }
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  &__tag {
    padding: 1px 8px;
    border: 1px solid var(--luoma-border);
    border-radius: 999px;
    background: var(--luoma-surface-2);
    color: var(--luoma-text-2);
    font-size: 10px;
    line-height: 1.7;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-top: auto;
    padding-top: 3px;
  }

  &__primary {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 7px 12px;
    border-radius: 999px;
    background: var(--luoma-brand);
    color: var(--luoma-on-brand);
    font-size: 12px;
    font-weight: 600;
    transition: background 0.18s ease, transform 0.18s ease;

    &:hover {
      background: color-mix(in srgb, var(--luoma-brand) 85%, #000);
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
      color: var(--luoma-brand);
    }
  }
}

@keyframes iqdb-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .iqdb-card {
    &__body {
      padding: 13px 15px 15px;
    }

    &__host {
      display: none;
    }
  }
}
</style>
