# ASCII2D / SAUCENAO / EHENTAI 可行性复核（2026-10）

> 复核对象：[`docs/engine-support-assessment.md`](./engine-support-assessment.md) 中三个"暂不接入"的引擎。
> 方法：对三个站点做真实 HTTP 探针（curl / curl_cffi / 本地代理），并对照 GitHub 上的开源实现。
> 结论：**上一版对 SauceNAO 的判断是错的，对 E-Hentai 的阻塞原因判断也不准确；ASCII2D 的结论成立，但需要更精确的表述。**
>
> **落地状态（2026-10-31）**：SauceNAO 已按 P0 接入（HTML 网页版，无 Key），
> 新增 `src/engines/saucenao.ts`，并同步了代理配置、README 与 SEO 文案。EHENTAI / ASCII2D 仍未接入。

## 一、结论速览

| 引擎 | 上一版结论 | 本次复核 | 在本项目（Vercel + 无 Key + 无登录）能否落地 |
|---|---|---|---|
| **SAUCENAO** | ❌ 匿名 API 已关闭，需付费 Key | ✅ **可以接**：网页版 HTML 搜索匿名可用，JSON API 才需要 Key | ✅ 已接入（HTML，无 Key），约 2~4 小时 |
| **EHENTAI** | ❌ 网络不可达 + 需登录 Cookie | ⚠️ **部分可行**：匿名可做「精确文件哈希」搜索；「相似度扫描」匿名被禁用；内容为 R18 | ⚠️ 技术上能接，但只值精确哈希，且要处理 R18/ToS |
| **ASCII2D** | ⚠️ 开发可行、生产不可行 | ⚠️ **结论不变，但原因更硬**：Cloudflare JS 质询，连 Chrome TLS 指纹都过不了 | ❌ 当前架构不可行，必须外挂浏览器中继（FlareSolverr 等） |

一句话：**GitHub 上确实有很多实现，但它们的"能不能跑"取决于运行环境（VPS/代理/浏览器/个人 Key/Cookie），而不是代码本身。** 其中 SauceNAO 是唯一一个"无 Key、无 Cookie、无浏览器"就能在本项目里直接接上的。

---

## 二、为什么和上一版结论不一样

### 2.1 SauceNAO：上一版只测了 JSON API

上一版测试的是 `POST https://saucenao.com/search.php` 带 `output_type=2`，返回：

```json
{"header":{"status":-1,"message":"The anonymous account type does not permit API usage."}}
```

这只能证明 **JSON API** 需要 Key，不能证明网页搜索不可用。本次改为普通网页表单（`multipart/form-data`，不带 `output_type`）：

```bash
curl -A "<Chrome UA>" \
  -F "file=@test.jpg" \
  -F "db=999" \
  https://saucenao.com/search.php
```

实测 **HTTP 200**，返回 23 KB 结果页，标题 `Sauce Found?`，页面里有：

- `div.result` × 3（可见结果）
- `div.result.hidden` × 6（低相似度结果，**已经在 DOM 里**，只是被 JS 隐藏，不需要额外请求）
- `div.resultsimilarityinfo`：`93.41%`、`94.96%`、`48.21%` …
- `div.resulttitle` / `div.resultcontentcolumn`：pixiv ID、作者、Danbooru/Gelbooru 站点图标等

即：**匿名网页搜索是完整可用的，只是结果页是 HTML 而不是 JSON。**

### 2.2 E-Hentai：上一版把"本机 DNS 被污染"误判成"站点封 IP"

本次在本机解析域名：

```text
e-hentai.org        -> 0.0.0.0
upld.e-hentai.org   -> 69.171.229.11   （Facebook 的 IP 段）
upld.exhentai.org   -> 69.63.176.59    （同样是 Facebook 段）
```

这是典型的 **DNS 污染**（本机在境内网络），不是站点不可达。走本地代理 `127.0.0.1:7897` 后：

```text
GET https://e-hentai.org/        -> 200
GET https://upld.e-hentai.org/   -> 301
```

另外，上一版用的 `https://e-hentai.org/up/loadimage` 现在返回 **404**，站点已经改版；现行入口在首页 JS 里：

```js
b.innerHTML = '<form action="' + ulhost + 'image_lookup.php" method="post" enctype="multipart/form-data">'
  + '<input type="file" name="sfile" />'
  + '<input type="submit" name="f_sfile" value="File Search" />'
  + '<input type="checkbox" name="fs_similar" checked />'
  + '<input type="checkbox" name="fs_covers" />'
  + '</form>'
```

`ulhost = "https://upld.e-hentai.org/"`，即真实端点是 `POST https://upld.e-hentai.org/image_lookup.php`。

### 2.3 ASCII2D：结论对，但"带上 cookie 就行"不成立

本次除了普通 curl，还用 `curl_cffi` 模拟 Chrome 的 TLS/HTTP2 指纹再试：

| 请求 | 结果 |
|---|---|
| `GET https://ascii2d.net/` | `200`，能拿到 88 字符的 `authenticity_token` |
| `POST /search/file`（token + cookie + Chrome UA） | `403`，`Cf-Mitigated: challenge`，3.2 MB 的 `Just a moment...` |
| `POST /search/file`（`curl_cffi` `impersonate="chrome"`） | 仍然 `403` + challenge |

说明拦的是 **Cloudflare 的 JS 质询**，不是 TLS 指纹。`curl_cffi` 能解决图片静态资源的 JA3 校验，但解决不了需要执行 JS 的托管质询。

---

## 三、逐项实测记录

### 3.1 SAUCENAO

**能用的调用方式**

```http
POST https://saucenao.com/search.php
Content-Type: multipart/form-data

file=@image.jpg
db=999
```

返回 HTML（`text/html; charset=UTF-8`），结果结构（实测片段）：

```html
<div class="result">
  <table class="resulttable">
    <tr>
      <td class="resulttableimage">
        <div class="resultimage">
          <a href="https://saucenao.com/search.php?db=999&url=...">
            <img id="resImage0" title="Index #5: Pixiv Images - 106223109_p0_master1200.jpg"
                 raw-rating="1" src="https://img1.saucenao.com/res/pixiv/...">
          </a>
        </div>
      </td>
      <td class="resulttablecontent">
        <div class="resultmatchinfo">
          <div class="resultsimilarityinfo">93.41%</div>
        </div>
        <div class="resulttitle"><strong>注视</strong></div>
        <div class="resultcontentcolumn">
          <strong>pixiv ID: </strong><a href="https://www.pixiv.net/...">106223109</a>
          <strong>Member: </strong><a href="https://www.pixiv.net/member.php?id=...">悲伤鱼头</a>
        </div>
      </td>
    </tr>
  </table>
</div>
```

**注意事项（实测）**

| 项 | 结果 |
|---|---|
| JSON API（`output_type=2`） | `403` + `The anonymous account type does not permit API usage.` |
| HTML 网页搜索（POST multipart） | `200` + 完整结果 |
| 用 `GET ?url=...` 做 URL 检索 | `403` + Cloudflare `Just a moment...`（**不要用 GET 传查询参数**） |
| 低相似度结果 | 在 `div.result.hidden` 里，DOM 中已存在，只是被 `showHidden()` 隐藏 |
| 结果页语言 | UTF-8，中文标题正常（PowerShell 显示乱码是终端编码问题） |

**限额**：SauceNAO 对匿名网页搜索有速率限制（常见口径是 4 次/30 秒、100 次/天；免费账号约 150 次/天）。本次未触发 429，且其 API 文档页当前被 Cloudflare 拦截（`403`），未能直接复核官方数字。实现时应把"限流提示页"当作一种可读错误处理，而不是当空结果。

**结论**：**本项目可以直接接**，不需要 Key、不需要登录、不需要浏览器。代价是要解析 HTML，并且要接受匿名限额。

### 3.2 EHENTAI

**域名的真实情况**

- 本机 `e-hentai.org` 被解析到 `0.0.0.0`，`upld.*` 被解析到 Facebook 的 IP —— 境内 DNS 污染。
- 走代理后站点 200，说明站点本身没封这个出口；上一版"数据中心 IP 被屏蔽"的推断没有证据。
- 生产环境能否直连取决于 Vercel 区域的出口，**这一点仍需在部署后实测**。

**现行图片搜索流程**

```http
POST https://upld.e-hentai.org/image_lookup.php
Content-Type: multipart/form-data

sfile=@image.jpg
f_sfile=File Search
fs_similar=on
fs_covers=（可选）
```

实测（匿名、无 Cookie）：

```http
HTTP/1.1 302 Found
Location: https://e-hentai.org/?f_shash=65bdec3a7a8a1cf0e6bf2323a2f059f4423a7a08&fs_from=test.jpg
```

跟随后返回 200，页面文字：

```text
Showing galleries with file: test.jpg
Similarity Scan was disabled for this search. You must start a new search to alter this.
No hits found
```

**关键限制：相似度扫描匿名不可用**

试了三种提交方式（`fs_similar` 放在文件前、值改成 `1`、同时带 `fs_covers`），结果页始终是：

```text
Similarity Scan was disabled for this search.
```

推测是**登录后才启用**（未用账号验证）。这意味着匿名能做的只有 **精确文件哈希搜索**：

- ✅ 上传的图与 EH 上某张图**字节级完全一致**时，能找到对应画廊
- ❌ 图片被压缩、缩放、裁剪、转格式后，找不到（哈希变了）
- ❌ 没有"视觉相似"能力

对一个"动漫图出处反查"工具来说，精确哈希的价值明显低于 SauceNAO/ascii2d 的感知相似。再加上：

- **内容为 R18**，默认开放会给面向一般用户的站点带来合规与体验问题
- EH 的 ToS 对自动化访问有灰区（`robots.txt` 未禁止 `image_lookup.php`，但不等于授权）
- 结果页是画廊列表，不是单张图；字段映射（标题/封面/链接）要额外处理，且本次没有命中样本可验证解析结构

**结论**：**技术上可以接，但不建议作为默认引擎**。若确实要接，应做成显式开关 + R18 提示，并明确"仅精确匹配"。

### 3.3 ASCII2D

**已确认的流程**

```http
GET  https://ascii2d.net/                  -> 200 + authenticity_token + cookie
POST https://ascii2d.net/search/file       -> 403 Cloudflare challenge
POST https://ascii2d.net/search/uri        -> 403 Cloudflare challenge
```

**GitHub 上的绕法**

- [FlareSolverr](https://github.com/FlareSolverr/FlareSolverr)：起一个真实浏览器，代为过 CF 质询，再转发 POST。参考实测文章：[以 ascii2d.net 为例，详解如何绕过 cloudflare 反爬机制](https://www.xfan.top/index.php/2024/09/19/2295/)——文中明确用 FlareSolverr 处理 HTML POST，`curl_cffi` 只用于图片静态资源。
- [PicImageSearch](https://github.com/kitUIN/PicImageSearch)：代码里就是普通 `POST /search/file`，但它的 ascii2d 测试要求配置 `base_url`，说明 CI/实际使用中也要换出口或走中继。

**为什么 Vercel 上不可行**

- Serverless 函数没有持久浏览器，也没有可复用的 `cf_clearance`
- 每次请求现起 Chromium 不现实（冷启动、体积、超时）
- 即使自建 FlareSolverr，也要额外一台常驻 VPS/Docker，并且 CF 策略一变就失效

**结论**：**保持禁用是对的**；如果一定要做，正确形态是"外部浏览器中继 + 环境变量配置 relay 地址"，而不是在 Vercel 里硬扛。

---

## 四、GitHub 上"有很多"的实现，为什么不能直接搬

| 项目/方案 | 支持情况 | 它默认依赖的运行环境 |
|---|---|---|
| [PicImageSearch](https://github.com/kitUIN/PicImageSearch) | SauceNAO / ascii2d / E-Hentai 等 14 个引擎 | Python 自托管；SauceNAO 测试配置里带 API Key；ascii2d 的测试要求自定义 `base_url`；EH 的相似度依赖登录 |
| [flutter_saucenao_img_search](https://pub.dev/documentation/flutter_saucenao_img_search/latest/) | SauceNAO | 明确提供 `noKey` 模式，靠解析 HTML —— 与本次实测一致 |
| [FlareSolverr](https://github.com/FlareSolverr/FlareSolverr) + ascii2d 教程 | ascii2d | 常驻浏览器 + 代理，不是 Serverless |
| 各类 Telegram/QQ 搜图机器人 | 三者都有 | VPS + 出站代理 + 个人 Cookie/Key，失败就重试 |

共同点：**代码只是壳，真正决定成败的是出口 IP、浏览器、账号和 Key。** 一个公开、免登录、部署在 Vercel 的静态站点，恰好这四样都没有。

---

## 五、在本项目里的落地方案

### 5.1 SAUCENAO（推荐，P0）

**改动点**

| 文件 | 改动 |
|---|---|
| `api/proxy.js` | `TARGETS` 增加 `saucenao: 'https://saucenao.com'`，路径正则加 `saucenao` |
| `vite.config.ts` | 增加 `/saucenao` → `https://saucenao.com` |
| `vercel.json` | 增加 `/saucenao/(.*)` rewrite |
| `src/engines/saucenao.ts` | 新增：multipart 请求 + cheerio 解析 |
| `src/engines/index.ts` | 注册 `ENGINES` 描述符，并新增 `SaucenaoResultCard` 结果卡片 |
| `src/types/common.ts` | `EngineId` 加 `'saucenao'` |
| `src/components/EngineSelector.vue` | 从 `planned` 移除，进入可点列表 |
| `src/stores/search.ts` | `options` / `searched` 补默认项 |

**请求**

```ts
const form = new FormData()
form.append('file', upload.file, upload.file.name)
form.append('db', '999')
const res = await luoma.post<string>('/saucenao/search.php', form, {
  headers: { 'Content-Type': 'multipart/form-data' },
  responseType: 'text',
  transformResponse: [(data: string) => data],
})
```

**解析（cheerio）**

```ts
$('div.result').each((_, el) => {
  const similarity = parseFloat($('.resultsimilarityinfo', el).text()) // 93.41 -> 93
  const title = $('.resulttitle', el).text().trim()
  const thumb = $('.resulttableimage img', el).attr('src')
  const full = $('.resulttableimage a', el).attr('href')
  const sourceLink = $('.resultcontentcolumn a', el).last().attr('href')
  const indexName = $('.resulttableimage img', el).attr('title') // "Index #5: Pixiv Images - ..."
  const hidden = $(el).hasClass('hidden')
  // ...
})
```

- 相似度归一化成 `0~100` 整数，符合 `ResultType` 约定
- `hidden` 的结果可以照常收进列表，由现有的「最低匹配率」过滤器决定是否展示；这样匿名页面隐藏的低分结果也能被用户主动调低阈值看到
- 站点来源可以从 `title="Index #5: Pixiv Images"` 或 `resultmiscinfo` 里的 `siteicons/danbooru.ico` 提取
- 结果页若出现 `Just a moment...` 或限流提示，解析层要抛出可读错误（而不是返回空数组）

**展示字段**

`匹配度` / `来源站点` / `作者`（从 `Member:`、`Creator:`、`Artist:` 抽取）/ `原图直达`（`resultcontentcolumn` 里的第一个外链，优先 pixiv / danbooru / gelbooru）。

**工作量**：2~4 小时（含联调与文案）。**状态：已完成**（见 `src/engines/saucenao.ts`）。

### 5.2 EHENTAI（可选，P2）

若要做，最小闭环是：

1. `POST /eh/image_lookup.php`（代理到 `upld.e-hentai.org`，`maxRedirects: 0`）
2. 从 302 的 `Location` 拿到 `https://e-hentai.org/?f_shash=...`
3. 再 `GET` 这个地址（代理到 `e-hentai.org`），解析画廊列表
4. 结果 `similarity` 统一记 `100`（精确哈希），并在提示里写明"仅精确匹配"

需要额外处理的：

- R18 内容门禁（默认关闭 / 显式确认）
- 结果页解析结构本次没有命中样本可验证，需先用一张已知 EH 图做一次真实命中
- 生产出口的可达性（Vercel 区域）需实测
- 相似度扫描若必须支持，只能让用户自带 Cookie（登录），不适合公开匿名工具

**工作量**：3~6 小时，外加产品/合规决策。

### 5.3 ASCII2D（不推荐，P3）

唯一可行形态：

```text
浏览器（Vue）
   └─ POST /ascii2d/search/file
        └─ 你的中转服务（FlareSolverr / Playwright）
             └─ ascii2d.net（真实浏览器过 CF）
```

中转服务必须常驻，不能放 Vercel Serverless。可以做，但：

- 需要额外部署与运维
- CF 改策略就失效
- 结果解析依赖 `item-box` 等 HTML 结构，站点改版即坏

**工作量**：1~2 天 + 一台常驻服务；不建议作为近期目标。

---

## 六、建议路线

| 阶段 | 内容 | 状态建议 |
|---|---|---|
| P0 | 接入 SauceNAO（HTML 版，无 Key） | ✅ 已完成 |
| P1 | 修正 README / 评估文档里"三件套都接不了"的表述 | ✅ 已完成 |
| P2 | E-Hentai 精确哈希 + R18 开关 | 视产品定位再定 |
| P3 | ASCII2D + 浏览器中继 | 暂不做 |

如果只做一件事：**先接 SauceNAO**。它补上的正是 IQDB 最弱的一环（pixiv / twitter / 商业志等综合来源），而且不改部署形态。

---

## 七、复现命令（脱敏）

```bash
# 1. SauceNAO 网页版（匿名可用）
curl -A "Mozilla/5.0 ... Chrome/131" \
     -F "file=@test.jpg" -F "db=999" \
     https://saucenao.com/search.php -o saucenao.html

# 2. SauceNAO JSON API（需要 Key）
curl -F "file=@test.jpg" -F "output_type=2" -F "db=999" \
     https://saucenao.com/search.php

# 3. ascii2d（会拿到 CF challenge）
curl -c cookies.txt -A "Mozilla/5.0 ... Chrome/131" https://ascii2d.net/ -o home.html
# 取 authenticity_token 后
curl -b cookies.txt -A "Mozilla/5.0 ... Chrome/131" \
     -F "utf8=✓" -F "authenticity_token=$TOKEN" -F "file=@test.jpg" \
     https://ascii2d.net/search/file

# 4. E-Hentai（本机需先解决 DNS/代理）
curl -x http://127.0.0.1:7897 -A "Mozilla/5.0 ... Chrome/131" \
     -F "sfile=@test.jpg" -F "f_sfile=File Search" -F "fs_similar=on" \
     -D headers.txt https://upld.e-hentai.org/image_lookup.php
# 看 headers.txt 里的 Location，再 GET
```

> 测试图片：Danbooru post 7000000 的原图（`cdn.donmai.us/original/8d/81/...jpg`），SauceNAO 命中 pixiv 106223109 + Danbooru 7000000。
