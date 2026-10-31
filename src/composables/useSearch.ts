import { collectFiltered, getEngine, toRequestOptions } from '@/engines'
import { useResultStore } from '@/stores/result'
import { useSearchStore } from '@/stores/search'
import type { EngineId } from '@/types/common'

/** 搜索编排：校验 → 发请求 → 解析 → 落库；结果状态由结果区自行展示 */
export const useSearch = () => {
  const searchStore = useSearchStore()
  const resultStore = useResultStore()

  const run = async (engineId: EngineId = searchStore.engineId) => {
    const upload = searchStore.upload
    if (!upload) return
    if (resultStore.loading[engineId]) return

    const engine = getEngine(engineId)
    const options = searchStore.options[engineId] ?? {}
    resultStore.setLoading(engineId, true)
    resultStore.setError(engineId, null)

    try {
      // 最低匹配率与 R18 过滤只在本地筛选，不发给图源
      const raw = await engine.request(upload, toRequestOptions(options))
      const list = await engine.parse(raw)
      resultStore.setResult(engineId, list)
      searchStore.markSearched(engineId)

      // 结果条数以过滤后为准：历史记录与结果区保持一致
      const filtered = collectFiltered(engineId, list, options)
      searchStore.pushHistory({
        engine: engineId,
        engineLabel: engine.label,
        preview: upload.preview,
        count: filtered.list.length,
      })
    } catch (error) {
      const message =
        (error as { friendly?: string }).friendly ??
        (error instanceof Error ? error.message : '搜索失败，请稍后重试')
      resultStore.setError(engineId, message)
      resultStore.setResult(engineId, [])
    } finally {
      resultStore.setLoading(engineId, false)
    }
  }

  return { run }
}
