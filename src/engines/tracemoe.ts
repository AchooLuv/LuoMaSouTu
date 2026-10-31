import type { ResultType } from '@/types/common'

const TRACEMOE_ORIGIN = 'https://api.trace.moe'
/**
 * 默认展示的最低相似度，只作为界面滑块的默认值。
 * 解析层不再按它丢弃候选：否则用户把「最低匹配率」调低时，
 * 被提前过滤掉的低分结果也回不来，滑块看起来就像坏了。
 */
export const TRACEMOE_MIN_SIMILARITY = 0.7
/** trace.moe 单张图片最多返回的候选数量 */
export const TRACEMOE_LIMIT = 12

export const TRACEMOE_URL_PARAM = 'url'

interface TraceMoeQuota {
  id: string
  /** 每日额度上限（按 IP 计算） */
  quota: number
  quotaUsed: number
  /** 每秒并发上限 */
  concurrency: number
}

interface TraceMoeAnime {
  title: {
    native?: string | null
    romaji?: string | null
    english?: string | null
    chinese?: string | null
  }
  siteUrl?: string
  format?: string
  seasonYear?: number
  episodes?: number
  coverImage?: {
    large?: string | null
    medium?: string | null
  }
  bannerImage?: string | null
  studios?: {
    edges?: Array<{
      isMain?: boolean
      node?: {
        name?: string
      }
    }>
  }
}

interface TraceMoeHit {
  anilist?: TraceMoeAnime
  filename?: string
  episode?: number | null
  episode_start?: number | null
  from?: number
  to?: number
  at?: number
  duration?: number
  similarity: number
  video?: string
  image?: string
}

interface TraceMoeResponse {
  error?: string
  quota?: number
  quotaUsed?: number
  result?: TraceMoeHit[]
}

/** 中文标题优先，便于中文界面直接展示 */
const pickTitle = (hit: TraceMoeHit): string | undefined => {
  const title = hit.anilist?.title
  if (!title) return undefined
  return title.chinese || title.native || title.romaji || title.english || undefined
}

/** 优先取主制作公司，没有标记时退回第一家 */
const pickStudio = (hit: TraceMoeHit): string | undefined => {
  const edges = hit.anilist?.studios?.edges ?? []
  return edges.find((edge) => edge.isMain)?.node?.name ?? edges[0]?.node?.name
}

/** 查询当前 IP 的额度使用情况 */
export const fetchQuota = async (): Promise<TraceMoeQuota> => {
  // 额度要实时：显式绕过浏览器缓存，否则搜索后可能还读到旧的 quotaUsed
  const res = await fetch(`${TRACEMOE_ORIGIN}/me`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`额度接口返回 HTTP ${res.status}`)
  const data = (await res.json()) as TraceMoeQuota
  if (typeof data?.quota !== 'number') throw new Error('额度接口返回结构异常')
  return data
}

/**
 * 解析 trace.moe 的 JSON 响应。
 *
 * 注意：这里保留所有带 similarity 的命中，不在解析层做最低相似度过滤。
 * 过滤统一由界面的「最低匹配率」滑块在 `collectFiltered` 里完成，
 * 这样用户既能调高阈值，也能调低阈值把低分候选找回来。
 */
export const parse = (raw: unknown): ResultType[] => {
  const data = (raw ?? {}) as TraceMoeResponse
  const hits = Array.isArray(data.result) ? data.result : []
  if (data.error) throw new Error(data.error)

  return hits
    .filter((hit) => typeof hit?.similarity === 'number')
    .map((hit) => {
      const episode = hit.episode ?? hit.episode_start ?? undefined
      const anime = hit.anilist
      // from === to 时（同帧命中）只展示一个时间点，避免出现 "00:11:27 — 00:11:27"
      return {
        id: `trace-${hit.filename ?? hit.image ?? 'unknown'}-${hit.at ?? hit.from ?? 0}`,
        title: pickTitle(hit),
        similarity: Math.round(hit.similarity * 100),
        thumbnail: hit.image,
        preview: hit.image,
        animeName: pickTitle(hit),
        animeCover: anime?.coverImage?.large ?? anime?.coverImage?.medium ?? undefined,
        animeBanner: anime?.bannerImage ?? undefined,
        animeUrl: anime?.siteUrl,
        studio: pickStudio(hit),
        format: anime?.format,
        seasonYear: anime?.seasonYear,
        totalEpisodes: anime?.episodes,
        episode: episode ?? undefined,
        filename: hit.filename,
        from: hit.from,
        to: hit.to,
        at: hit.at,
        duration: hit.duration,
        video: hit.video,
      } satisfies ResultType
    })
    .sort((a, b) => b.similarity - a.similarity)
}
