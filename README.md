<div align="center">

# 骡马搜图 · LuoMaSouTu

**以图搜图 / 以图搜番 Web 应用 —— 反查动漫图片的原始出处，定位番剧截图出自哪一集哪一秒**

[![在线体验](https://img.shields.io/badge/在线体验-img.muri.life-6d4df6?style=for-the-badge)](https://soutu.muri.life)
[![License](https://img.shields.io/badge/license-MIT-0f9d8f?style=for-the-badge)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ff69b4?style=for-the-badge)](../../pulls)

[![Vue](https://img.shields.io/badge/Vue-3.5-42b883?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Pinia](https://img.shields.io/badge/Pinia-2.3-ffd859?logo=pinia&logoColor=black)](https://pinia.vuejs.org/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-2.14-409eff?logo=elementplus&logoColor=white)](https://element-plus.org/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

[在线体验](https://img.muri.life) · [功能](#-功能) · [常见问题](#-常见问题faq) · [快速开始](#-快速开始) · [架构说明](#-架构说明) · [已知限制](#-已知限制)

</div>

---

**骡马搜图（LuoMaSouTu）** 是一个免费、免登录的**在线以图搜图工具**，把 [IQDB](https://iqdb.org/)、
[SauceNAO](https://saucenao.com/) 与 [trace.moe](https://trace.moe/) 三个以图搜图引擎聚合到一个界面里：

- 想查**「这张动漫图出自哪里 / 原图在哪」** → 用 IQDB，在 Danbooru、Konachan、yande.re、Gelbooru、Sankaku、e-shuushuu、Zerochan、Anime-Pictures 共 8 个图库中反查出处
- 想查**「这张图在 Pixiv / Twitter / 商业志上的原帖」** → 用 SAUCENAO，跨库检索并给出更细的匹配度与作者信息
- 想查**「这张截图是哪部番的第几集第几秒」** → 用 TRACE.MOE，定位番剧、集数与具体时间点，并可播放命中片段

无需注册、无需 API Key，支持**点击 / 拖拽 / 粘贴（Ctrl + V）/ 图片 URL** 四种投图方式，内置浅色与深色主题，移动端自适应。
ASCII2D 与 E-Hentai 暂未接入，原因见下方 FAQ。

> **关键词**：以图搜图 · 以图搜番 · 图片出处查询 · 反向搜图 · 图片来源查询 · 动漫截图识别 · 番剧截图定位 ·
> 在线搜图工具 · IQDB · SAUCENAO · SauceNAO · TRACE.MOE · trace.moe · Danbooru · yande.re · Konachan ·
> reverse image search · anime scene search · source finder

## ✨ 功能

- **四种投图方式**：点击选择文件、拖拽图片、`Ctrl + V` 直接粘贴截图、填入图片 URL
- **三个搜索引擎，同一套结果体验**
  - **IQDB**：展示来源图库（含站点图标）、原站帖子号、原图尺寸、图片评级，并把 Danbooru 系标签译成中文（`absurdres` → 超高分辨率）
  - **SAUCENAO**：展示来源站点、作者与图片评级，直达 Pixiv / Twitter / Danbooru 等原帖
  - **TRACE.MOE**：展示番剧名（优先中文标题）、集数、出现时间区间，可直接原地播放命中片段
- **结果交互**：按匹配度排序、星标把重点候选置顶、点击大图预览、原图直达、加载骨架屏与失败兜底
- **解释性提示**：三个引擎的「匹配度」含义不同会明确说明；被相似度阈值过滤掉的候选数量也如实告知，避免「接口有数据却看不到结果」的困惑
- **额度提示**：实时显示 TRACE.MOE 当日剩余额度，避免撞上限流
- **最近搜索记录**：便于回看本次会话搜过什么
- **主题**：浅色 / 深色一键切换并记忆，首次访问跟随系统偏好
- **对搜索引擎友好**：完整 meta / Open Graph / Twitter Card / JSON-LD 结构化数据、`robots.txt`、`sitemap.xml`、PWA manifest

### SEO 清单

| 项 | 位置 |
| --- | --- |
| title / description / keywords | [`index.html`](./index.html) |
| Open Graph（含 1200×630 卡片图） | [`index.html`](./index.html)、`public/og-image.png` |
| Twitter Card | [`index.html`](./index.html) |
| JSON-LD 结构化数据（WebSite + WebApplication） | [`index.html`](./index.html) |
| 路由级动态 title / description / canonical | [`src/utils/seo.ts`](./src/utils/seo.ts)、[`src/router/index.ts`](./src/router/index.ts) |
| 爬虫规则与站点地图 | `public/robots.txt`、`public/sitemap.xml` |
| PWA manifest | `public/site.webmanifest` |

> OG 图以 `public/og-image.svg` 为源文件，导出为 `og-image.png`（主流社交平台对 SVG 的
> OG 图支持不统一）。改过 SVG 后需按 [`tools/og-image-export.html`](./tools/og-image-export.html)
> 里的步骤重新导出一次。

## ❓ 常见问题（FAQ）

<details>
<summary><b>怎么查一张动漫图片的出处 / 原图？</b></summary>

打开 [img.muri.life](https://img.muri.life)，把图片拖进去（或直接 `Ctrl + V` 粘贴截图），
选中 **IQDB** 后点「开始搜索」。结果按匹配度排序，每条都会给出**来源图库、原站帖子号和原图尺寸**，
点「查看原图页面」即可跳到 Danbooru / yande.re 等站点的原始页面。
如果截图被调过色，可以勾选「忽略色彩」改用灰度特征匹配。
</details>

<details>
<summary><b>怎么查一张截图出自哪部番剧的第几集？</b></summary>

同一张图切到 **TRACE.MOE** 引擎再搜一次。结果会给出**番剧名（优先中文）、集数、出现时间区间**，
并且可以点「看片段」直接播放命中的动画片段，用来确认是否真的对得上。
</details>

<details>
<summary><b>需要注册、登录或申请 API Key 吗？</b></summary>

都不需要。前端不收集任何账号信息，IQDB、SauceNAO 与 trace.moe 的网页接口也都不要求 Key。
SauceNAO 匿名搜索有速率限制（约每 30 秒 4 次），高频使用可能被临时限流；
trace.moe 的**匿名额度按出口 IP 计算（当前 100 次/天）**，界面会实时显示剩余额度。
如果你自行部署到 Serverless 平台，这些额度是所有访客共享的。
</details>

<details>
<summary><b>为什么匹配度只有 20% 多，是没匹配上吗？</b></summary>

不是。**三个引擎的「匹配度」不是一个量纲**：

- IQDB 的匹配度是**缩略图层面的视觉相似度**，20% 以上就可能是同一张图的转载、压缩或裁剪版本，应以图库详情页为准
- SAUCENAO 的匹配度是**跨图库加权分数**，90% 以上基本是同一张图，60%~90% 多为转载或同系列，更低的多为风格相近
- TRACE.MOE 的匹配度是**帧级相似度**，通常 70% 以上才有参考价值，本应用只展示高于该阈值的结果

界面上对这三套语义都有对应说明。
</details>

<details>
<summary><b>搜不到结果一般是什么原因？</b></summary>

常见原因有三种，界面上都会给出可读提示而不是静默失败：

1. **图不是番剧截图**（同人图、游戏 CG、真人照片），TRACE.MOE 自然会没有结果
2. **截图被裁剪或加了滤镜/水印**，导致特征丢失 —— 可以试试 TRACE.MOE 的「裁剪图片边缘」
3. **图片在图库中没有收录**，IQDB / SauceNAO 返回 0 条属于正常情况

另外图片体积限制为 8 MB，格式支持 JPG / PNG / GIF / WebP。
</details>

<details>
<summary><b>图片会被保存吗？隐私如何？</b></summary>

不会。本应用没有后端数据库，图片只在你点击搜索时通过代理转发给 IQDB / SauceNAO / trace.moe 官方接口，
搜索完成后不在任何地方留存。仓库里也没有任何埋点或第三方统计脚本。
</details>

<details>
<summary><b>为什么不用 ASCII2D / E-Hentai？</b></summary>

不是遗漏。两者的情况并不相同（2026-10 复核，详见
[三引擎可行性复核](docs/engine-support-recheck-2026-10.md)）：

- **E-Hentai**：匿名可以做**精确文件哈希**搜索，但「相似度扫描」匿名被禁用，且内容为 R18；不适合作为默认引擎
- **ASCII2D**：位于 Cloudflare 之后，服务端 POST 会收到 `403` + JS 质询，需要常驻浏览器中继才能过盾

SauceNAO 已接入：网页版 HTML 搜索匿名可用，只有其 JSON API 需要 Key。

完整的实测过程与替代方案评估见 [引擎支持评估](docs/engine-support-assessment.md)。
</details>

## 🚀 快速开始

```bash
# 环境要求：Node.js >= 16（本项目在 v22 上验证）
npm install

npm run dev        # 启动开发服务器（内含图源代理，无需额外配置）
npm run build      # 类型检查 + 生产构建
npm run preview    # 本地预览构建产物
npm run type-check # 仅做 vue-tsc 类型检查
npm run lint       # ESLint 校验并自动修复
```

> 开发环境的跨域由 Vite `server.proxy` 处理；生产环境的 `/iqdb`、`/saucenao` 与 `/trace`
> 由 Vercel Serverless 函数 `api/proxy.js` 转发。

## 🧱 技术栈

| 分类 | 选型 |
| --- | --- |
| 框架 | Vue 3.5（`<script setup>` 组合式 API） |
| 构建 | Vite 6.4 + TypeScript 5.6 + vue-tsc |
| 状态管理 | Pinia 2（setup store 写法） |
| UI | Element Plus 2.14 + `@element-plus/icons-vue` |
| 路由 | Vue Router 4（history 模式） |
| 请求 / 解析 | axios、cheerio（解析 IQDB / SauceNAO 返回的 HTML） |
| 样式 | SCSS + 设计令牌（CSS 变量）双主题 |
| 部署 | Vercel（静态站点 + Serverless 代理） |

## 🏗 架构说明

### 目录结构

```
api/proxy.js               Vercel Serverless 代理（/iqdb、/saucenao、/trace → 图源）
public/                    robots.txt、sitemap.xml、site.webmanifest、og-image.png/svg
tools/og-image-export.html og-image 导出页（开发工具，不参与部署）
src/
├─ main.ts                 入口：装配 Element Plus / 路由 / Pinia / 主题
├─ router/index.ts         路由表 + 路由级 SEO（title / description / canonical）
├─ views/
│  ├─ Main/Index.vue       主界面：左侧操作面板 + 右侧结果区
│  └─ 404/                 404 页
├─ components/             UploadPanel / EngineSelector / EngineOptions / ResultCard /
│                          ResultsView / TraceQuota / SearchHistory / ThemeToggle
│  └─ results/             IqdbResultCard / SaucenaoResultCard / TraceResultCard / ResultStar
├─ engines/                引擎层：请求怎么发、响应怎么解析
│  ├─ index.ts             引擎描述符 ENGINES（新增引擎的唯一入口）
│  ├─ iqdb.ts              IQDB 请求与 HTML 解析
│  ├─ saucenao.ts          SauceNAO 请求参数与 HTML 解析
│  └─ tracemoe.ts          TRACE.MOE 请求、解析与额度查询
├─ composables/            useSearch / useImageInput / useTraceQuota
├─ stores/                 search / result / theme
├─ utils/                  http / file / format / notify / seo / tags
└─ assets/styles/          tokens.scss（设计令牌）+ main.scss（全局样式）
```

### 设计要点

**1. 引擎描述符 + 独立结果卡片 —— 新增图源的边际成本约 2~3 小时**

请求与解析仍完全由描述符驱动：每个引擎在 `src/engines/index.ts` 里声明
「请求怎么发、响应怎么解析」：

```ts
{
  id: 'iqdb',
  label: 'IQDB',
  options: [{ id: 'forcegray', label: '忽略色彩', param: 'forcegray', value: 'on' }],
  request: (upload, options) => { /* 返回原始响应 */ },
  parse: (raw) => [/* 归一化成 ResultType[] */],
}
```

展示层不再塞进描述符：三个引擎各自有独立的结果卡片（`src/components/results/`）——
IQDB 是两列图库卡片，SauceNAO 是按来源着色的来源卡片，TRACE.MOE 是 16:9 影院式卡片。
新增引擎 = 描述符 + `parse` + 一个卡片组件。

**2. 统一的结果模型**

`similarity` 在解析层统一归一化为 `0~100` 的整数（IQDB / SauceNAO 原生是百分数、trace.moe 是 `0~1`
小数），避免出现 `> 0.9` 与 `> 90` 两种比较并存。

**3. 代理必须走 HTTPS**

`iqdb.org` 对明文 HTTP 会直接 `301` 跳转到 HTTPS，因此 `vite.config.ts` 与 `api/proxy.js`
两处的上游地址都必须是 `https://`，否则代理层拿到的是跳转页而不是搜索结果。

**4. 双主题**

所有颜色收敛到 `src/assets/styles/tokens.scss` 的 `--luoma-*` CSS 变量，并把 Element Plus
的变量映射到同一套令牌上，因此主题切换只需在 `<html>` 上增删 `.dark` 类。

## 🔐 依赖与安全

- **无循环依赖**：`src` 下的模块经图分析（Tarjan 强连通分量）确认无环。
- **依赖保持更新**：`package.json` 使用 `^` 范围，建议定期执行 `npm update` 拉满范围内版本。
  仓库历史上的 Dependabot 告警绝大多数源于「lockfile 落后于声明的范围」，而非范围本身过宽。
- **唯一未修复项**：`braces@3.0.3`（深层嵌套 pattern 导致栈溢出，上游无补丁版本，
  `micromatch@4.0.8` 仍依赖它）。它的引入路径是
  `http-proxy-middleware → micromatch → braces`，**只存在于 Vercel Serverless 侧**，
  匹配的是写死的 `/iqdb`、`/saucenao`、`/trace` 前缀，不接触用户输入；且不在前端产物中（`dist` 内零命中），
  对浏览器端用户无影响。

## 📸 截图

> 欢迎补充自己的运行截图（建议放在 `docs/screenshot-light.png` 与 `docs/screenshot-dark.png`），
> 仓库首页有截图能显著提升在搜索结果里的点击率。

## ⚠️ 已知限制

- **ASCII2D / EHENTAI 未接入**：E-Hentai 匿名仅支持精确哈希（相似度扫描需登录），ASCII2D 需要浏览器中继；
  详见 [三引擎可行性复核](docs/engine-support-recheck-2026-10.md)
- **IQDB / SauceNAO 依赖站点 HTML 结构**解析，站点改版后需要同步调整选择器（解析失败会给出可读提示，不会静默返回空）
- **IQDB 在高负载时会返回排队页**，此时会提示「稍后重试」，而不是误报「没有匹配结果」
- **SauceNAO 匿名搜索有速率限制**（约 4 次/30 秒，按出口 IP 计算），高频使用或多人共用 Serverless 出口时可能被临时限流；触发 Cloudflare 时会提示稍后重试
- **TRACE.MOE 匿名额度按出口 IP 计算**（当前 100 次/天），Serverless 部署时所有访客共享该额度
- **三个引擎的「匹配度」不是一个量纲**，详见 [常见问题](#-常见问题faq)
- **上游可用性不受本仓库控制**：IQDB、SauceNAO 与 trace.moe 均为第三方服务，请遵守其使用条款并避免高频请求

## 🗺 Roadmap

- [x] 引擎描述符架构，三个引擎统一结果模型
- [x] 接入 SauceNAO（网页版 HTML，无 Key）
- [x] 粘贴 / 拖拽 / URL 多种投图方式
- [x] 双主题、响应式、结果星标与大图预览
- [x] SEO 与社交分享元信息、结构化数据
- [ ] 根据番剧名在 Bangumi 查询并展示番剧信息
- [ ] 同一张图的多引擎结果并列对比
- [ ] Element Plus 按需引入，进一步压缩产物体积

## 🤝 贡献

欢迎提交 [Issue](../../issues) 与 [PR](../../pulls)。开始之前建议先跑一遍：

```bash
npm run type-check && npm run lint && npm run build
```

如果这个项目对你有帮助，欢迎点一个 ⭐ Star；也欢迎补充引擎支持、修正文档或反馈上游接口变化。

## 📄 License

[MIT](./LICENSE) © [AchooLuv](https://github.com/AchooLuv)

---

<div align="center">

本项目使用了 [IQDB](https://iqdb.org/)、[SauceNAO](https://saucenao.com/) 与 [trace.moe](https://trace.moe/) 的公开服务，请遵守其使用条款。

</div>
