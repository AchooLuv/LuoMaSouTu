<script setup lang="ts">
withDefaults(
  defineProps<{
    marked: boolean
    /** overlay 用于图片上的悬浮按钮，plain 用于普通卡片头部 */
    variant?: 'plain' | 'overlay'
  }>(),
  { variant: 'plain' }
)

const emit = defineEmits<{ (event: 'toggle'): void }>()
</script>

<template>
  <button
    type="button"
    class="result-star"
    :class="[`result-star--${variant}`, { 'is-on': marked }]"
    :aria-pressed="marked"
    :title="marked ? '取消标记' : '标记为重点候选'"
    @click.stop.prevent="emit('toggle')"
  >
    <el-icon>
      <StarFilled v-if="marked" />
      <Star v-else />
    </el-icon>
  </button>
</template>

<style scoped lang="scss">
.result-star {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 50%;
  background: transparent;
  color: var(--luoma-text-3);
  cursor: pointer;
  transition: color 0.18s ease, background 0.18s ease, border-color 0.18s ease,
    transform 0.18s ease;

  .el-icon {
    font-size: 16px;
  }

  &:hover {
    color: #f5a623;
    background: var(--luoma-surface-2);
    transform: translateY(-1px);
  }

  &.is-on {
    color: #f5a623;
  }

  &--overlay {
    color: rgba(255, 255, 255, 0.92);
    background: rgba(12, 14, 22, 0.46);
    border-color: rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(8px);

    &:hover {
      color: #ffd166;
      background: rgba(12, 14, 22, 0.66);
    }

    &.is-on {
      color: #ffd166;
    }
  }
}
</style>
