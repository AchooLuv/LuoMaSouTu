<script setup lang="ts">
import { computed } from 'vue'
import { useSearchStore } from '@/stores/search'
import { ENGINES } from '@/engines'

const searchStore = useSearchStore()
const badge: Record<number, string> = { 1: '可用', 0: '开发中', '-1': '已禁用' }

/** 已接入的引擎 + 预留中的引擎，后者只展示不可点，避免用户以为功能缺失 */
const planned = [
  { id: 'ascii2d', label: 'ASCII2D', subtitle: '二次元图库', status: 0 },
  { id: 'ehentai', label: 'EHENTAI', subtitle: '同人图库', status: -1 },
]

const active = computed(() => ENGINES)
/** 当前选中的引擎，用于在下方展示它的说明 */
const current = computed(
  () => ENGINES.find((engine) => engine.id === searchStore.engineId) ?? ENGINES[0]
)
</script>

<template>
  <section class="engines">
    <div class="luoma-panel-title">
      <el-icon><Search /></el-icon>
      选择搜索引擎
    </div>

    <div class="engines__list">
      <button
        v-for="engine in active"
        :key="engine.id"
        type="button"
        class="engine"
        :class="{ 'is-active': searchStore.engineId === engine.id }"
        :style="{ '--accent': engine.accent }"
        @click="searchStore.setEngine(engine.id)"
      >
        {{ engine.label }}
      </button>
    </div>

    <div v-if="current" class="engine-detail" :style="{ '--accent': current.accent }">
      <div class="engine-detail__head">
        <span class="engine-detail__name">{{ current.label }}</span>
        <span class="engine-detail__sub">{{ current.subtitle }}</span>
      </div>
      <p class="engine-detail__desc">{{ current.description }}</p>
    </div>

    <el-collapse class="engines__more">
      <el-collapse-item name="planned">
        <template #title>
          <span class="luoma-muted">更多引擎（{{ planned.length }}）</span>
        </template>
        <ul class="planned">
          <li v-for="item in planned" :key="item.id" class="planned__item">
            <span class="planned__name">{{ item.label }}</span>
            <span class="planned__sub">{{ item.subtitle }}</span>
            <el-tag size="small" round :type="item.status < 0 ? 'danger' : 'info'">
              {{ badge[item.status] }}
            </el-tag>
          </li>
        </ul>
      </el-collapse-item>
    </el-collapse>
  </section>
</template>

<style scoped lang="scss">
.engines {
  &__list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
  }

  &__more {
    margin-top: 8px;
    border-top: none;

    :deep(.el-collapse-item__header),
    :deep(.el-collapse-item__wrap) {
      border-bottom: none;
      background: transparent;
    }
  }
}

.engine {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  height: 34px;
  padding: 0 4px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2px;
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid var(--luoma-border);
  border-radius: var(--luoma-radius-sm);
  background: var(--luoma-surface);
  color: var(--luoma-text-2);
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;

  &:hover {
    border-color: var(--accent);
    color: var(--luoma-text);
  }

  &.is-active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, var(--luoma-surface));
    color: var(--accent);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 35%, transparent);
  }
}

.engine-detail {
  margin-top: 8px;
  padding: 8px 10px;
  border-left: 2px solid var(--accent);
  border-radius: 0 var(--luoma-radius-sm) var(--luoma-radius-sm) 0;
  background: var(--luoma-surface-2);

  &__head {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  &__name {
    font-size: 12px;
    font-weight: 600;
    color: var(--luoma-text);
  }

  &__sub {
    font-size: 11px;
    color: var(--luoma-text-3);
  }

  &__desc {
    margin: 2px 0 0;
    font-size: 11px;
    line-height: 1.6;
    color: var(--luoma-text-3);
  }
}

.planned {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: var(--luoma-radius-sm);
    background: var(--luoma-surface-2);
    color: var(--luoma-text-2);
  }

  &__name {
    font-weight: 600;
  }

  &__sub {
    color: var(--luoma-text-3);
    margin-right: auto;
  }
}
</style>
