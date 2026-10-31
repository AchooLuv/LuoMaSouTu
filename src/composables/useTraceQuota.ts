import { computed, ref } from 'vue'
import { fetchQuota } from '@/engines/tracemoe'

/**
 * trace.moe 的匿名额度是按 IP 计算的（当前为 100 次/天），
 * 超额后接口会直接返回 429。这里把额度读出来展示，避免用户撞墙后才知道。
 *
 * 状态放在模块级而不是 composable 内部：Main 里搜索后的 refresh 和
 * TraceQuota 里的展示必须是同一份数据，否则刷新的是另一个实例，界面永远不会变。
 */
const loading = ref(false)
const total = ref<number | null>(null)
const used = ref<number | null>(null)
const failed = ref(false)
/** 避免较早发出的 /me 请求后返回，把较新的额度覆盖掉 */
let requestSeq = 0

const refresh = async () => {
  const seq = ++requestSeq
  loading.value = true
  try {
    const data = await fetchQuota()
    if (seq !== requestSeq) return
    total.value = data.quota
    used.value = data.quotaUsed
    failed.value = false
  } catch {
    if (seq === requestSeq) failed.value = true
  } finally {
    if (seq === requestSeq) loading.value = false
  }
}

const remaining = computed(() =>
  total.value === null || used.value === null ? null : Math.max(0, total.value - used.value)
)

const percent = computed(() =>
  total.value && used.value !== null ? Math.round((used.value / total.value) * 100) : 0
)

const level = computed<'safe' | 'warn' | 'danger'>(() => {
  const rest = remaining.value
  if (rest === null) return 'safe'
  if (rest <= 0) return 'danger'
  if (rest <= 10) return 'warn'
  return 'safe'
})

export const useTraceQuota = () => ({
  loading,
  total,
  used,
  remaining,
  percent,
  level,
  failed,
  refresh,
})
