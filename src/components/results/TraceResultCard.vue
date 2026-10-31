<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ResultStar from './ResultStar.vue'
import { ellipsisName, getHMS } from '@/utils/format'
import type { ResultType } from '@/types/common'

const props = defineProps<{
  item: ResultType
  index: number
  marked: boolean
}>()

const emit = defineEmits<{ (event: 'mark', id: string): void }>()

const showVideo = ref(false)
const imageFailed = ref(false)
watch(
  () => props.item.id,
  () => {
    showVideo.value = false
    imageFailed.value = false
  }
)

const animeTitle = computed(() => props.item.animeName || props.item.title || '未知番剧')
const episodeLabel = computed(() =>
  props.item.episode ? `EP ${String(props.item.episode).padStart(2, '0')}` : 'EP ?'
)
const episodeMeta = computed(() => {
  if (!props.item.episode) return ''
  return props.item.totalEpisodes
    ? `第 ${props.item.episode} 集 / ${props.item.totalEpisodes}`
    : `第 ${props.item.episode} 集`
})
const timeRange = computed(() => {
  if (props.item.from === undefined) return ''
  if (props.item.to === undefined || Math.floor(props.item.to) === Math.floor(props.item.from)) {
    return getHMS(props.item.from)
  }
  return `${getHMS(props.item.from)} — ${getHMS(props.item.to)}`
})
const formatLabel = computed(() =>
  [props.item.format, props.item.seasonYear].filter(Boolean).join(' · ')
)
const filenameShort = computed(() => ellipsisName(props.item.filename ?? '', 56))
const cover = computed(() => props.item.thumbnail ?? props.item.preview)
const previewList = computed(() => (props.item.preview ? [props.item.preview] : []))
const similarityTone = computed(() => {
  if (props.item.similarity >= 95) return 'high'
  if (props.item.similarity >= 85) return 'mid'
  return 'low'
})

const toggleVideo = () => {
  if (props.item.video) showVideo.value = !showVideo.value
}
</script>

<template>
  <article class="scene-card luoma-fade-up" :class="{ 'is-marked': marked }">
    <div class="scene-card__frame">
      <img
        v-if="item.animeCover"
        class="scene-card__frame-bg"
        :src="item.animeCover"
        alt=""
      />
      <video
        v-if="showVideo && item.video"
        class="scene-card__video"
        :src="item.video"
        :poster="cover"
        controls
        autoplay
        playsinline
      />
      <el-image
        v-else
        class="scene-card__image"
        :src="cover"
        :alt="animeTitle"
        fit="cover"
        :preview-src-list="previewList"
        :initial-index="0"
        preview-teleported
        hide-on-click-modal
        @error="imageFailed = true"
      >
        <template #error>
          <div class="scene-card__fallback">
            <img
              v-if="item.animeCover"
              class="scene-card__fallback-cover"
              :src="item.animeCover"
              alt=""
            />
            <span class="scene-card__fallback-text">画面不可用</span>
          </div>
        </template>
        <template #placeholder>
          <div class="scene-card__fallback">
            <el-icon class="is-spin"><Loading /></el-icon>
            <span>加载中</span>
          </div>
        </template>
      </el-image>

      <template v-if="!showVideo">
        <div class="scene-card__vignette" />

        <div class="scene-card__top">
          <span class="scene-card__ep">{{ episodeLabel }}</span>
          <ResultStar
            variant="overlay"
            :marked="marked"
            @toggle="emit('mark', item.id)"
          />
        </div>

        <div class="scene-card__bottom">
          <span v-if="timeRange" class="scene-card__time">
            <el-icon><Clock /></el-icon>
            {{ timeRange }}
          </span>
          <span class="scene-card__sim" :class="`is-${similarityTone}`">
            <b>{{ item.similarity }}%</b>
            帧匹配
          </span>
        </div>

        <button
          v-if="item.video && !imageFailed"
          type="button"
          class="scene-card__play"
          @click="toggleVideo"
        >
          <el-icon><VideoPlay /></el-icon>
          播放片段
        </button>
      </template>
    </div>

    <div class="scene-card__body">
      <a
        v-if="item.animeCover"
        class="scene-card__poster"
        :href="item.animeUrl ?? item.animeCover"
        target="_blank"
        rel="noopener noreferrer"
        :title="animeTitle"
      >
        <img :src="item.animeCover" alt="" loading="lazy" />
      </a>

      <div class="scene-card__content">
        <div class="scene-card__eyebrow">
          <span class="scene-card__eyebrow-dot" />
          ANIME SCENE
          <span v-if="formatLabel" class="scene-card__format">{{ formatLabel }}</span>
        </div>

        <h3 class="scene-card__title" :title="animeTitle">{{ animeTitle }}</h3>

        <div class="scene-card__meta">
          <span v-if="episodeMeta" class="scene-card__chip">{{ episodeMeta }}</span>
          <span v-if="item.studio" class="scene-card__chip">{{ item.studio }}</span>
          <a
            v-if="item.animeUrl"
            class="scene-card__chip scene-card__chip--link"
            :href="item.animeUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            AniList
            <el-icon><TopRight /></el-icon>
          </a>
        </div>

        <div v-if="item.filename" class="scene-card__filename" :title="item.filename">
          <el-icon><Film /></el-icon>
          <span>{{ filenameShort }}</span>
        </div>

        <div class="scene-card__actions">
          <button
            v-if="item.video"
            type="button"
            class="scene-card__primary"
            @click="toggleVideo"
          >
            <el-icon>
              <VideoPause v-if="showVideo" />
              <VideoPlay v-else />
            </el-icon>
            {{ showVideo ? '收起片段' : '播放这段' }}
          </button>
          <a
            v-if="item.preview"
            class="scene-card__link"
            :href="item.preview"
            target="_blank"
            rel="noopener noreferrer"
          >
            命中帧
          </a>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.scene-card {
  display: grid;
  grid-template-columns: minmax(280px, 36%) minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--luoma-border);
  border-radius: var(--luoma-radius-lg);
  background: var(--luoma-surface);
  box-shadow: var(--luoma-shadow-sm);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--luoma-brand-2) 48%, var(--luoma-border));
    box-shadow: var(--luoma-shadow);
    transform: translateY(-1px);
  }

  &.is-marked {
    border-color: var(--luoma-brand);
    box-shadow: 0 0 0 3px var(--luoma-brand-soft), var(--luoma-shadow-sm);
  }

  &__frame {
    position: relative;
    height: 100%;
    min-height: 212px;
    overflow: hidden;
    background: #080a10;
  }

  /* 左侧一条很淡的胶片孔，给「番剧片段」一点影院感 */
  &__frame::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    z-index: 3;
    width: 7px;
    pointer-events: none;
    background-image: repeating-linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.24) 0 4px,
      transparent 4px 15px
    );
    opacity: 0.35;
  }

  &__frame-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.4;
    filter: blur(7px) saturate(0.85);
    transform: scale(1.06);
  }

  &__image,
  &__video {
    position: relative;
    z-index: 1;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &__image {
    :deep(.el-image__inner) {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__fallback {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    height: 100%;
    min-height: 212px;
    overflow: hidden;
    background: linear-gradient(145deg, #12151d, #080a10);
    color: rgba(255, 255, 255, 0.55);
    font-size: 11px;

    .el-icon {
      font-size: 24px;
    }

    .is-spin {
      animation: scene-spin 1s linear infinite;
    }
  }

  &__fallback-cover {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.42;
    filter: blur(1px);
  }

  &__fallback-text {
    position: relative;
    z-index: 2;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(8, 10, 16, 0.55);
    color: rgba(255, 255, 255, 0.86);
    backdrop-filter: blur(6px);
  }

  &__vignette {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      rgba(5, 7, 12, 0.55) 0%,
      rgba(5, 7, 12, 0) 30%,
      rgba(5, 7, 12, 0) 52%,
      rgba(5, 7, 12, 0.82) 100%
    );
  }

  &__top {
    position: absolute;
    top: 9px;
    right: 9px;
    left: 14px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__ep {
    padding: 3px 8px;
    border-radius: 6px;
    background: var(--luoma-brand-2);
    color: var(--luoma-on-brand);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.8px;
    font-variant-numeric: tabular-nums;
  }

  &__bottom {
    position: absolute;
    right: 12px;
    bottom: 9px;
    left: 14px;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__time {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 7px;
    border-radius: 6px;
    background: rgba(8, 10, 16, 0.55);
    color: rgba(255, 255, 255, 0.92);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    backdrop-filter: blur(6px);
  }

  &__sim {
    padding: 3px 8px;
    border-radius: 6px;
    background: rgba(8, 10, 16, 0.55);
    color: rgba(255, 255, 255, 0.78);
    font-size: 10px;
    backdrop-filter: blur(6px);

    b {
      font-size: 11px;
      font-variant-numeric: tabular-nums;
    }

    &.is-high b {
      color: #6ee7d8;
    }

    &.is-mid b {
      color: #fcd34d;
    }

    &.is-low b {
      color: #cbd5e1;
    }
  }

  &__play {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 4;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid rgba(255, 255, 255, 0.24);
    border-radius: 999px;
    background: rgba(8, 10, 16, 0.56);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transform: translate(-50%, -50%);
    backdrop-filter: blur(8px);
    transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;

    &:hover {
      border-color: var(--luoma-brand-2);
      background: color-mix(in srgb, var(--luoma-brand-2) 78%, #000);
      transform: translate(-50%, -50%) scale(1.03);
    }

    .el-icon {
      font-size: 15px;
    }
  }

  &__body {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 9px;
    min-width: 0;
    padding: 15px 20px 16px;
  }

  &__poster {
    position: absolute;
    top: 15px;
    right: 18px;
    width: 64px;
    height: 88px;
    overflow: hidden;
    border: 1px solid var(--luoma-border);
    border-radius: 8px;
    box-shadow: var(--luoma-shadow-sm);
    transition: border-color 0.18s ease, transform 0.18s ease;

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &:hover {
      border-color: var(--luoma-brand-2);
      transform: translateY(-1px);
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 9px;
    min-width: 0;
    padding-right: 84px;
  }

  &__eyebrow {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--luoma-brand-2);
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 1.3px;
  }

  &__eyebrow-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--luoma-brand-2);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--luoma-brand-2) 14%, transparent);
  }

  &__format {
    margin-left: auto;
    color: var(--luoma-text-3);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.6px;
  }

  &__title {
    margin: 0;
    color: var(--luoma-text);
    font-size: 19px;
    font-weight: 700;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--luoma-surface-2);
    color: var(--luoma-text-2);
    font-size: 11px;
    line-height: 1.6;

    .el-icon {
      font-size: 11px;
    }
  }

  &__chip--link {
    color: var(--luoma-brand-2);
    transition: background 0.18s ease;

    &:hover {
      background: color-mix(in srgb, var(--luoma-brand-2) 12%, var(--luoma-surface-2));
    }
  }

  &__filename {
    display: flex;
    align-items: center;
    gap: 5px;
    min-width: 0;
    color: var(--luoma-text-3);
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 10px;

    .el-icon {
      flex: 0 0 auto;
      font-size: 12px;
    }

    span {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
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
    border: 0;
    border-radius: 999px;
    background: var(--luoma-brand-2);
    color: var(--luoma-on-brand);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: filter 0.18s ease, transform 0.18s ease;

    &:hover {
      filter: brightness(1.06);
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
      color: var(--luoma-brand-2);
    }
  }
}

@keyframes scene-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 720px) {
  .scene-card {
    grid-template-columns: 1fr;

    &__frame {
      height: auto;
      min-height: 0;
      aspect-ratio: 16 / 9;
    }

    &__frame::before {
      display: none;
    }

    &__body {
      padding: 13px 15px 15px;
    }

    &__poster {
      display: none;
    }

    &__content {
      padding-right: 0;
    }
  }
}
</style>
