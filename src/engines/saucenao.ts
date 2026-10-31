import type { ResultType } from '@/types/common'

const SAUCENAO_ORIGIN = 'https://saucenao.com'
/** db=999 表示检索 SauceNAO 的全部数据库 */
export const SAUCENAO_DB = '999'
/**
 * 结果「匹配率」的默认下限。
 * SauceNAO 的分数是跨图库的加权相似度，分布比 trace.moe 宽：
 * 同一张图常见 85%~99%，转载/裁剪常见 60%~85%，30% 以下基本只剩风格相近。
 */
export const SAUCENAO_MIN_SIMILARITY = 30

const absolute = (url: string | undefined, base: string): string | undefined => {
  if (!url) return undefined
  if (/^javascript:/i.test(url)) return undefined
  try {
    return new URL(url, base).toString()
  } catch {
    return undefined
  }
}

/**
 * SauceNAO 的缩略图外层链接形如
 * `/search.php?db=999&url=https%3A%2F%2Fimg1.saucenao.com%2F...`，
 * 把 `url` 参数解出来就是原图（SauceNAO 缓存或原站地址）；隐藏结果则放在 `data-href` 上。
 */
const imageFromLink = (href: string | undefined): string | undefined => {
  const abs = absolute(href, SAUCENAO_ORIGIN)
  if (!abs) return undefined
  try {
    return new URL(abs).searchParams.get('url') ?? abs
  } catch {
    return abs
  }
}

/** resultmiscinfo 里的站点图标 → 展示名（图标后缀不统一，按去掉后缀的文件名匹配） */
const SITE_BY_ICON: Record<string, string> = {
  pixiv: 'Pixiv',
  danbooru: 'Danbooru',
  gelbooru: 'Gelbooru',
  yandere: 'yande.re',
  konachan: 'Konachan',
  sankaku: 'Sankaku',
  'e-shuushuu': 'e-shuushuu',
  zerochan: 'Zerochan',
  'anime-pictures': 'Anime-Pictures',
  twitter: 'Twitter',
  nijie: 'Nijie',
  seiga: 'Seiga',
  pawoo: 'Pawoo',
}

const siteName = (iconSrc: string | undefined): string | undefined => {
  if (!iconSrc) return undefined
  const file = iconSrc.split('/').pop()?.toLowerCase()
  if (!file) return undefined
  return SITE_BY_ICON[file.replace(/\.[a-z0-9]+$/, '')]
}

/** 把 "Index #5: Pixiv Images - xxx.jpg" 里的库名取出来，去掉末尾的 Images */
const indexName = (title: string | undefined): string | undefined => {
  if (!title) return undefined
  const name = /^Index #\d+:\s*(.+?)(?:\s+-|$)/.exec(title)?.[1]?.trim()
  return name ? name.replace(/\s+Images?$/i, '') : undefined
}

/** SauceNAO 的 raw-rating：1 / 2 / 3 分别对应 Safe / Questionable / Explicit */
const RATING_LEVEL: Record<string, string> = {
  '1': 'Safe',
  '2': 'Questionable',
  '3': 'Explicit',
  s: 'Safe',
  q: 'Questionable',
  e: 'Explicit',
}

/** 命中 Cloudflare 质询或限流页时给出可读错误，而不是当成"零结果" */
const assertUsablePage = (raw: string) => {
  if (/Just a moment\.\.\./i.test(raw) || /cf-mitigated/i.test(raw)) {
    throw new Error('SauceNAO 触发了 Cloudflare 人机验证，请稍后重试')
  }
  if (/(?:search )?quota exceeded|too many (?:searches|requests)|rate limit exceeded/i.test(raw)) {
    throw new Error('SauceNAO 请求过于频繁，请稍后再试')
  }
}

/**
 * 解析 SauceNAO 的 HTML 结果页。
 *
 * 每个命中项是一个 `<div class="result">`：
 *   <div class="resulttableimage"><a href="/search.php?url=..."><img src="..." title="Index #5: Pixiv Images - ..."></a></div>
 *   <div class="resultsimilarityinfo">93.41%</div>
 *   <div class="resulttitle"><strong>作品名</strong></div>
 *   <div class="resultcontentcolumn"><strong>Member: </strong><a>作者</a> ...</div>
 *   <div class="resultmiscinfo"><a href="原站作品页"><img src="images/static/siteicons/danbooru.ico"></a></div>
 *
 * 低于匿名展示阈值的条目会带 `hidden` 类，但 HTML 里是完整存在的；
 * 这里一并解析，交给界面上的「最低匹配率」筛选，避免用户误以为没有结果。
 */
export const parse = async (raw: unknown): Promise<ResultType[]> => {
  if (typeof raw !== 'string' || !raw.trim()) return []
  assertUsablePage(raw)

  // cheerio 体积不小，放到搜索时再加载，别拖慢首屏
  const { load } = await import('cheerio')
  const $ = load(raw)
  const list: ResultType[] = []

  $('div.result').each((index, el) => {
    const node = $(el)
    // 这条只是"低相似度结果已折叠"的提示条，不是结果
    if (node.attr('id') === 'result-hidden-notification') return

    const similarity = Number.parseFloat(node.find('.resultsimilarityinfo').first().text())
    if (!Number.isFinite(similarity)) return

    const image = node.find('.resulttableimage img').first()
    const rating = (image.attr('raw-rating') ?? '').toLowerCase()
    const level = RATING_LEVEL[rating]
    // SauceNAO 对部分结果（尤其是 R18）先用 blocked.gif 占位，真实缩略图放在 data-src。
    // 这里只对非 Explicit 结果取 data-src，避免绕开上游对成人内容的默认遮挡。
    const thumbSrc =
      level === 'Explicit' ? image.attr('src') : (image.attr('data-src') ?? image.attr('src'))
    const thumbnail = absolute(thumbSrc, SAUCENAO_ORIGIN)
    if (!thumbnail) return
    const thumbnailBlocked = thumbSrc?.includes('/blocked.gif') ?? false

    const anchor = node.find('.resulttableimage a').first()
    const preview = imageFromLink(anchor.attr('data-href') ?? anchor.attr('href')) ?? thumbnail
    const content = node.find('.resultcontentcolumn').first()
    const contentText = content.text().replace(/\s+/g, ' ').trim()

    // 来源页：优先 resultmiscinfo 的站点图标（Danbooru / Gelbooru 等），
    // 其次 resultcontentcolumn 里的第一个外链（pixiv 的作品页）
    const links: string[] = []
    node.find('.resultmiscinfo a[href], .resultcontentcolumn a[href]').each((_, link) => {
      const href = absolute($(link).attr('href'), SAUCENAO_ORIGIN)
      if (!href) return
      if (href.includes('saucenao.com/info.php')) return
      if (href.includes('saucenao.com/search.php')) return
      if (!links.includes(href)) links.push(href)
    })
    const url = links[0]

    const names: string[] = []
    node.find('.resultmiscinfo img').each((_, icon) => {
      const name = siteName($(icon).attr('src'))
      if (name && !names.includes(name)) names.push(name)
    })
    const source =
      names.length > 0
        ? names.slice(0, 2).join(' · ')
        : (indexName(image.attr('title')) ??
          /Source:\s*(.+?)(?=\s+(?:Material|Characters|Language|$))/i.exec(contentText)?.[1])

    const rawAuthor = /(?:Member|Creator(?:\(s\))?|Artist|Author)\s*[:：]\s*(.+?)(?=\s*(?:Source|Material|Characters|$))/i
      .exec(contentText)?.[1]
      ?.trim()
    const author = rawAuthor ? rawAuthor.slice(0, 120).trim() : undefined

    const rawTitle = node.find('.resulttitle').first().text().trim()
    // 部分图库（如 Danbooru）的 resulttitle 只放 "Creator: xxx"，
    // 这种情况改用「站点 + 帖子号」当标题，避免整列结果标题都一样
    const titleText = /^(?:Creator(?:\(s\))?|Artist|Author|Member)\s*[:：]/i.test(rawTitle)
      ? undefined
      : rawTitle
    const postId = url ? /\/(\d+)(?:[/?#]|$)/.exec(url)?.[1] : undefined
    const primarySource = source?.split(' · ')[0]
    const title =
      titleText ??
      (primarySource ? `${primarySource}${postId ? ` #${postId}` : ''}` : undefined) ??
      'SauceNAO 结果'
    const serviceIcon = absolute(
      node.find('.resultmiscinfo img').first().attr('src'),
      SAUCENAO_ORIGIN
    )

    list.push({
      id: `saucenao-${index}-${url ?? preview}`,
      title,
      similarity: Math.round(similarity),
      thumbnail,
      preview,
      thumbnailBlocked,
      url,
      source,
      serviceIcon,
      level,
      author,
    })
  })

  return list.sort((a, b) => b.similarity - a.similarity)
}
