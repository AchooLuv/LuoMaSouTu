<script setup lang="ts">
import { computed } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useResultStore } from '@/stores/result'
import { useSearch } from '@/composables/useSearch'
import UploadPanel from '@/components/UploadPanel.vue'
import EngineSelector from '@/components/EngineSelector.vue'
import EngineOptions from '@/components/EngineOptions.vue'
import TraceQuota from '@/components/TraceQuota.vue'
import SearchHistory from '@/components/SearchHistory.vue'
import ResultsView from '@/components/ResultsView.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useTraceQuota } from '@/composables/useTraceQuota'
import type { SearchUpload } from '@/types/common'

const searchStore = useSearchStore()
const resultStore = useResultStore()
const { run } = useSearch()
const { refresh: refreshQuota } = useTraceQuota()

/** 品牌图标（源自 404.webp，已按 2x 屏预生成 128px 小图，避免每页下载大图） */
const logoSrc = new URL('@/assets/images/logo.webp', import.meta.url).href

/** 顶栏站点导航：桌面端平铺，窄屏收进「导航」下拉 */
const siteLinks = [
  { label: '作者博客', href: 'https://my.muri.life' },
  { label: '每日放送', href: 'https://muri.life' },
  { label: '正则教程', href: 'https://rejs.muri.life' },
]

const loading = computed(() => resultStore.loading[searchStore.engineId])
const error = computed(() => resultStore.errors[searchStore.engineId])
const searched = computed(() => searchStore.searched[searchStore.engineId])
const canSearch = computed(() => Boolean(searchStore.upload) && !loading.value)

const onUpload = (upload: SearchUpload) => searchStore.setUpload(upload)
const onClear = () => searchStore.clearUpload()

const onSearch = async () => {
  await run()
  if (searchStore.engineId === 'tracemoe') refreshQuota()
}
</script>

<template>
  <div class="luoma-shell">
    <header class="luoma-header">
      <div class="luoma-container luoma-header__inner">
        <div class="luoma-header__logo">
          <img class="logo-mark" :src="logoSrc" alt="骡马搜图" width="36" height="36" />
          <span class="logo-text">
            <b>骡马搜图</b>
            <small>LuoMa Image Search</small>
          </span>
        </div>
        <div class="luoma-header__spacer" />
        <div class="luoma-header__actions">
          <nav class="site-nav" aria-label="站点导航">
            <el-link
              v-for="link in siteLinks"
              :key="link.href"
              class="site-nav__link"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
              underline="never"
            >
              {{ link.label }}
            </el-link>
          </nav>

          <el-dropdown
            class="site-nav-mobile"
            trigger="click"
            popper-class="site-nav-mobile__menu"
          >
            <el-button class="site-nav-mobile__trigger" link>
              导航
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="link in siteLinks" :key="link.href">
                  <a
                    class="site-nav-mobile__item"
                    :href="link.href"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ link.label }}
                  </a>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>

          <ThemeToggle />
        </div>
      </div>
    </header>

    <main class="luoma-main">
      <div class="luoma-container layout">
        <aside class="panel luoma-card">
          <UploadPanel :upload="searchStore.upload" :loading="loading" @change="onUpload" @clear="onClear" />

          <el-divider class="panel__divider" />

          <EngineSelector />

          <EngineOptions />

          <el-button
            class="panel__search"
            type="primary"
            size="large"
            :loading="loading"
            :disabled="!canSearch"
            @click="onSearch"
          >
            <el-icon v-if="!loading"><Promotion /></el-icon>
            {{ loading ? '正在搜索…' : searchStore.upload ? '开始搜索' : '请先添加图片' }}
          </el-button>

          <TraceQuota v-if="searchStore.engineId === 'tracemoe'" class="panel__quota" />

          <SearchHistory v-if="searchStore.history.length" class="panel__history" />
        </aside>

        <ResultsView
          class="layout__results"
          :engine-id="searchStore.engineId"
          :loading="loading"
          :error="error"
          :searched="searched"
          @retry="onSearch"
        />
      </div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.logo-mark {
  /* 品牌图标：已按 2x 屏预生成 128px 源图，这里按 36px 显示 */
  display: block;
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  object-fit: contain;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;

  b {
    font-size: 15px;
  }

  small {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.6px;
    color: var(--luoma-text-3);
  }
}

.site-nav {
  display: flex;
  align-items: center;
  gap: 16px;

  &__link {
    font-size: 13px;
    color: var(--luoma-text-2);
    white-space: nowrap;
    transition: color 0.18s ease;

    &:hover {
      color: var(--luoma-brand);
    }
  }
}

.site-nav-mobile {
  display: none;

  &__trigger {
    font-size: 13px;
    color: var(--luoma-text-2);
  }
}

@media (max-width: 860px) {
  .site-nav {
    display: none;
  }

  .site-nav-mobile {
    display: inline-flex;
  }
}

@media (max-width: 480px) {
  .logo-text small {
    display: none;
  }
}

.layout {
  display: grid;
  grid-template-columns: 330px 1fr;
  gap: 20px;
  align-items: start;
}

.panel {
  position: sticky;
  top: 78px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 16px;

  &__divider {
    margin: 14px 0;
  }

  &__search {
    margin-top: 14px;
    width: 100%;
    font-weight: 600;
    letter-spacing: 1px;
  }

  &__quota {
    margin-top: 12px;
  }

  &__history {
    margin-top: 16px;
  }
}

.layout__results {
  min-width: 0;
}

@media (max-width: 1023px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .panel {
    position: static;
  }
}
</style>
