# Media Kit Cloudflare Migration Plan v6

> Integrated from Media Kit Owner + Cloudflare Expert + Cross-Model Review (Claude Opus 4.6 + GPT-5.4).
> Date: 2026-03-16 | Version: 6

---

## Changelog from v5

| # | Change | Source | Description |
|---|--------|--------|-------------|
| V6-1 | Auth ensureAdmin 改为配置式 | Cross-review P1 | role=member 与 ensureAdmin 矛盾，改为环境变量 ADMIN_DIDS 配置管理员 |
| V6-2 | Dedup check 改为 size+ext 粗筛 | Cross-review P1 | first-5MB hash 与 full-file hash filename 不匹配，改为按 size+ext 粗筛候选 |
| V6-3 | cf.image origin 改为 Worker subrequest | Cross-review P1 | cf.image 经 Cloudflare 图片代理，不转发自定义 header，WAF 方案不可行 |
| V6-4 | 补完前端响应契约 | Cross-review P1 | confirm/check/presign 的响应 schema 明确定义 |
| V6-5 | 补充 folders 数据迁移 | Cross-review P2 | 迁移脚本遗漏 folders 表 |
| V6-6 | 补充 tags 查询 API | Cross-review P2 | GET /api/uploads 缺少 tag 过滤参数 |
| V6-7 | SVG 清洗改用 Workers 兼容方案 | Claude 发现 | DOMPurify 依赖 DOM API，Workers 中不可用 |
| V6-8 | ListParts XML 解析改用标准解析器 | Claude 发现 | 正则解析 XML 脆弱，改用 Workers 内置 HTMLRewriter 或分步解析 |
| V6-9 | 大文件 confirm 超时处理 | Cross-review P2 | >500MB 文件 hash 可能超 30s CPU 限制 |

---

## Changelog from v4 (preserved)

| # | Change | Source | Description |
|---|--------|--------|-------------|
| V5-1 | 认证简化为默认放行 | 用户确认 | 先默认一个 DID 可上传，Shijun 过几天给出认证方案后再对接 |
| V5-2 | AFS 推迟到下个版本 | 用户确认 | 先完成 Cloudflare 迁移，AFS 集成放到 v2 |
| V5-3 | 废弃 Blocklet SDK API | 用户确认 | Group B (SDK Upload) 和所有 blocklet sdk 相关接口全部移除 |
| V5-4 | 移除 Service Binding 认证 | 随 V5-1 | Service Binding 通信保留，但认证逻辑待后续 |

---

## Changelog from v3 (preserved)

| # | Change | Source | Description |
|---|--------|--------|-------------|
| V4-1 | 移除认证设计 | Shijun 反馈 | 认证部分由 Shijun 封装的工具统一处理 |
| V4-2 | 新增 AFS 集成 | Shijun 反馈 | 设计 media-kit 作为 AIGNE AFS 存储后端（已推迟到 v2） |
| V4-3 | 移除 nonces 表 | 随 V4-1 | 不再需要 HMAC 防重放 |
| V4-4 | 简化 wrangler.toml | 随 V4-1 | 移除认证相关密钥 |

---

## Changelog from v2 (preserved)

| # | Issue (from Round 2 Cross-Review) | Severity | Source | Fix in v3 |
|---|----------------------------------|----------|--------|-----------|
| R2-1 | Service Binding `x-service-binding` header 可被外部伪造 | P1 | 双模型确认 | 改为 shared secret 验证 + 删除公网可触及的 header 信任 |
| R2-2 | confirm 步骤 streamMD5 全量加载到内存，100MB 文件接近 128MB 限制 | P1 | 双模型确认 | 改用 js-md5 增量哈希 (O(1) 内存) |
| R2-3 | HMAC nonce 防重放仍是 TODO，未实现 | P1 | Codex 发现 | 实现 KV nonce 存储 + 5 分钟 TTL |
| R2-4 | 服务端文件校验缺失（SVG 窗口期 + mimetype 信任客户端） | P1 | Codex 发现 | confirm 步骤增加 mimetype 校验 + SVG sanitize 在 promote 前完成 |
| R2-5 | `R2.copy()` API 不存在 | P1 | 双模型确认 | 改为 S3 CopyObject via aws4fetch |
| R2-6 | `crypto.subtle.digest('MD5')` Workers 不支持 | P2 | Claude 发现 | 改用 js-md5 增量哈希 |
| R2-7 | 前端 multipart 代码缺少 `/multipart/complete` 调用 | P2 | Codex 发现 | 修复前端流程：parts → complete → confirm |
| R2-8 | Dedup check (first 5MB MD5) 存在碰撞误判风险 | P2 | Codex 发现 | Dedup 降级为 hint，confirm 阶段用全文件 hash 最终确认 |
| R2-9 | `/api/url/import` 无 SSRF 防护 | P2 | Codex 发现 | 加 host denylist + size limit + redirect cap |
| R2-10 | R2 Workers API 无 listParts 方法 | P2 | Claude 发现 | 改用 S3 ListParts via aws4fetch |
| R2-11 | Transform Rule 不能直接触发 Image Resizing | P2 | Claude 发现 | 改为 Worker 内 `cf.image` 统一处理 |

### Fixes from Round 3 (included in v3)

| # | Issue (from Round 3) | Severity | Source | Fix |
|---|---------------------|----------|--------|-----|
| R3-1 | Service Binding 示例代码仍用旧 header | P2 | Codex | 更新示例使用 x-sb-secret |
| R3-2 | KV nonce 最终一致性可被跨区域并发绕过 | P1 | Codex | 改用 D1 nonces 表（单主写入，原子唯一性） |
| R3-3 | Mimetype 校验是客户端自引用 | P1 | Codex | 改为 magic-byte 内容嗅探（前 4KB） |
| R3-4 | 前端 dedup 仍然跳过 confirm | P2 | Codex | 即使 dedup 命中也调用 confirm 创建用户记录 |
| R3-5 | 公开 R2 域名绕过 EXIF 移除 | P1 | Codex | R2 bucket 私有 + WAF 限制 origin 访问 |
| R3-6 | /multipart/complete 与 /confirm 职责矛盾 | P2 | Codex | 明确 complete 仅组装对象，confirm 统一做校验/promote |
| R3-7 | Dedup 路径不删除 tempKey | P3 | Codex | 两条路径都删除 tempKey |

### v1 → v2 Changelog (preserved)

| # | Issue (from Codex R1) | Severity | Fix in v2 |
|---|----------------------|----------|-----------|
| 1 | R2 multipart 前端直传方案不完整 | P1 | 重新设计三层上传协议，补完 S3 presigned multipart 全流程 |
| 2 | 断点续传能力丢失未补偿 | P1 | 设计 resumable multipart 协议（客户端持久化 + listParts） |
| 3 | 95MB 直传阈值过高，内存溢出 | P1 | 小文件改为 R2 presigned PUT 直传（绕过 Worker 内存）；Worker 仅做签名 |
| 4 | 客户端传入 hash 作 key，覆盖风险 | P1 | 改为 temp key 上传 → 服务端校验 → promote 流程 |
| 5 | HMAC 认证消费 body + 重放 + 权限过大 | P1 | 改为 canonical request 签名（不读 body），加 nonce，scoped 权限 |
| 6 | EXIF 策略回退隐私承诺 | P1 | 强制所有图片经过 Image Resizing，确保 EXIF 始终移除 |
| 7 | Unsplash 重新托管违反 ToS | P1 | 改为 hotlink + attribution 模式，仅存 metadata |
| 8 | tags JSON 全表扫描 | P2 | 新增 upload_tags 关联表 |
| 9 | D1 全球访问模型未设计 | P2 | 补充 primary location + read replication 策略 |
| 10 | 成本估算不准 | P2 | 三档成本模型（保守/中位/峰值） |
| 11 | 文档内在不一致 | P2 | 修复 check API、迁移脚本参数化、status 响应兼容 |
| 12 | Service Binding 可平替 component.call | P2 | 补充 Service Binding 架构 |

---

## 1. Executive Summary

将 Media Kit (image-bin) 从 ArcBlock Blocklet Server 迁移到 Cloudflare Workers + R2 + D1。

**Scope Change Declaration**: 迁移后，断点续传能力从 TUS 的字节级断点改为 R2 multipart 的分片级断点（最小粒度 5MB part），刷新页面后可恢复未完成的分片上传。这是可接受的产品范围变更。

**核心技术栈变更**：

| 层 | 现有 | 迁移后 |
|---|---|---|
| 运行时 | Express.js + Node.js | Hono + Cloudflare Workers |
| 文件存储 | 本地磁盘 | Cloudflare R2 |
| 数据库 | SQLite + Sequelize | Cloudflare D1 + Drizzle ORM |
| 上传协议 | TUS 断点续传 (10MB chunks) | R2 presigned PUT + R2 S3 multipart |
| 图片处理 | 无 | Cloudflare Image Resizing (Worker `cf.image`) |
| CDN | CDN_HOST URL 替换 | Cloudflare CDN（原生） |
| 认证 | DID Wallet + 组件签名 | 默认放行（预留 DID），待 Shijun 提供认证方案 |
| 组件间调用 | blocklet component.call | Cloudflare Service Binding（保留通信，认证待定） |
| 前端 | Vite + React (Blocklet) | Vite + React (Cloudflare Pages) |

---

## 2. Feature Inventory & Migration Impact

### 2.1 API Endpoints

#### Group A: Core Upload Management

| Method | Path | Auth | Function | Impact |
|--------|------|------|----------|--------|
| GET | `/uploads/:filename` | Optional (referer) | 文件静态服务 + Image Resizing + EXIF strip | 🔄 Adapt |
| POST | `/api/uploads/presign` | user + auth | 获取 R2 presigned PUT URL（小文件）或创建 multipart session（大文件） | 🔧 New |
| POST | `/api/uploads/confirm` | user + auth | 上传完成确认，服务端校验 + promote + 写 D1 | 🔧 New |
| POST | `/api/uploads/multipart/part-url` | user + auth | 获取单个 part 的 presigned PUT URL | 🔧 New |
| POST | `/api/uploads/multipart/complete` | user + auth | 完成 multipart 上传 | 🔧 New |
| POST | `/api/uploads/multipart/abort` | user + auth | 中止 multipart 上传 | 🔧 New |
| GET | `/api/uploads/multipart/status` | user + auth | 查询 multipart 上传进度（已完成 parts） | 🔧 New |
| POST | `/api/uploads/check` | user + auth | 文件去重检查（仅返回当前用户范围） | 🔧 New |
| GET | `/api/uploads` | user + auth | 分页列出上传文件（支持 ?tag= 过滤） | 🔄 Adapt |
| DELETE | `/api/uploads/:id` | user + isAdmin | 删除（引用计数） | 🔄 Adapt |
| PUT | `/api/uploads/:id` | user + isAdmin | 移动到 folder | 🔄 Adapt |

#### ~~Group B: SDK Upload~~ (v5 废弃)

> Blocklet SDK 相关的 API 全部废弃，不迁移。

#### Group B: Supporting Features

| Method | Path | Auth | Function | Impact |
|--------|------|------|----------|--------|
| POST | `/api/folders` | user + isAdmin | 创建文件夹 | 🔄 Adapt |
| POST | `/api/image/generations` | user + auth | AI 图片生成 | 🔄 Adapt |
| GET | `/api/image/models` | None | AI 模型列表 | 🔄 Adapt |
| GET | `/api/uploader/status` | None | 上传器配置（兼容现有前端响应 schema） | 🔄 Adapt |
| GET | `/api/unsplash/search` | user + auth | Unsplash 搜索（hotlink 模式） | 🔧 New |
| POST | `/api/unsplash/track-download` | user + auth | 触发 Unsplash download tracking | 🔧 New |
| POST | `/api/url/import` | user + auth | 从 URL 导入文件 | 🔧 New |

#### Group C: Drop

| Path | Reason |
|------|--------|
| `/api/resources`, `/api/resources/export` | Blocklet imgpack 体系 |
| `/proxy-to-uploads/*` | Blocklet 内部代理 |
| `/api/sdk/uploads`, `/api/sdk/uploads/find` | Blocklet SDK 废弃 |

#### Group D: Service Binding (替代 component.call)

其他 Cloudflare Workers 通过 Service Binding 直接调用 media-kit Worker：

```toml
# 其他 Worker 的 wrangler.toml
[[services]]
binding = "MEDIA_KIT"
service = "media-kit"
```

```typescript
// 调用方（零网络延迟）
// 认证方案待 Shijun 确定后对接
const res = await env.MEDIA_KIT.fetch(
  new Request('https://media-kit.internal/api/uploads', {
    method: 'POST',
    body: formData,
    headers: {
      'x-caller-id': 'my-worker-name',
    },
  })
);
```

### 2.2 Data Model

**uploads 表**（不变）:

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT PK | UUID |
| filename | TEXT | MD5 hash + ext |
| originalname | TEXT | 原始文件名 |
| mimetype | TEXT | MIME 类型 |
| size | INTEGER | 字节大小 |
| remark | TEXT | 备注 |
| folder_id | TEXT | 所属文件夹 |
| created_at | TEXT | ISO 时间 |
| updated_at | TEXT | ISO 时间 |
| created_by | TEXT | 创建者 |
| updated_by | TEXT | 更新者 |

**upload_tags 表**（新增，替代 JSON tags 字段）:

| Field | Type | Notes |
|-------|------|-------|
| upload_id | TEXT FK | 关联 uploads.id |
| tag | TEXT | 标签值 |
| PK | (upload_id, tag) | 复合主键 |

索引：`(tag, upload_id)` — 支持按 tag 高效查询

**folders 表**（不变）

**upload_sessions 表**（新增，管理 multipart 上传状态）:

| Field | Type | Notes |
|-------|------|-------|
| id | TEXT PK | UUID |
| upload_id | TEXT | R2 multipart uploadId |
| key | TEXT | R2 object key (temp key) |
| final_key | TEXT | 最终 key (content hash) |
| total_size | INTEGER | 预期总大小 |
| part_size | INTEGER | 每 part 大小 |
| status | TEXT | 'active' / 'completed' / 'aborted' |
| created_by | TEXT | 创建者 |
| created_at | TEXT | 创建时间 |
| expires_at | TEXT | 过期时间（默认 24h） |

---

## 3. Architecture

```
                    ┌────────────────────────────┐
                    │     Cloudflare CDN          │
                    │  (caches Worker responses)  │
                    └──────────┬─────────────────┘
                               │
             ┌─────────────────▼──────────────────┐
             │        Cloudflare Worker            │
             │         (Hono framework)            │
             ├────────────────────────────────────┤
             │  Middleware:                        │
             │  cors → auth (默认放行) → ...      │
             │                                    │
             │  Image serving:                    │
             │  cf.image { metadata:"none" }      │
             │  (EXIF strip + resize in Worker)   │
             │                                    │
             │  Upload flow:                      │
             │  presign → client PUT R2 → confirm │
             │  (Worker 不接收文件 body)            │
             └──┬──────────┬────────┬──┬──────────┘
                │          │        │  │
      ┌─────────▼──┐ ┌────▼───┐ ┌──▼──▼──────────┐
      │  R2 Bucket │ │  D1    │ │ Service Bind    │
      │  uploads   │ │ SQLite │ │ → other Workers │
      │ (PRIVATE)  │ │        │ │                 │
      └────────────┘ └────────┘ └─────────────────┘

      ┌─────────────────┐
      │ Cloudflare Pages │
      │ (React Frontend) │
      └─────────────────┘
```

> **IMPORTANT**: R2 bucket MUST be private (no public access). All file access goes
> through the Worker, which applies `cf.image { metadata: 'none' }` for EXIF stripping.
> A public R2 origin would allow bypassing EXIF removal.

### D1 Deployment Strategy

| Config | Value | Reason |
|--------|-------|--------|
| Primary Location | `auto` (nearest to first write) or explicit `enam`/`apac` | 根据主要用户群选择 |
| Read Replication | Enabled | 列表查询可接受副本读 |
| Session API | `withSession("first-primary")` for writes | 写后读一致性 |
| Writes requiring consistency | Upload confirm, delete with ref count | 必须打到 primary |
| Reads tolerating staleness | List uploads, folder list, status | 可用 read replica |

---

## 4. Upload Flow Redesign

### 4.1 Design Principles

1. **Worker 不接收文件 body** — 所有文件都直传 R2（presigned URL），Worker 仅做签名和元数据
2. **Temp key → Promote** — 上传先写临时 key，服务端校验后 rename 为内容寻址 key
3. **可恢复** — Multipart 上传支持刷新页面后恢复（客户端持久化 session，服务端 listParts）
4. **服务端校验** — 上传完成后服务端计算完整文件 hash，不信任客户端 hash

### 4.2 Upload Tiers

| Tier | File Size | Method | Resumable |
|------|-----------|--------|-----------|
| Small | < 100MB | R2 presigned PUT (single request) | No (单次完成) |
| Large | >= 100MB | R2 S3 multipart (per-part presigned PUT) | Yes (part 级) |

### 4.3 Small File Flow (< 100MB)

```
1. Client: compute file metadata for dedup hint
2. Client → POST /api/uploads/check { ext, size }
   → Worker: query D1 for uploads where size = {size} AND filename LIKE '%.{ext}'
     (按 size + ext 粗筛候选文件)
   → If single match: return { exists: true, url, filename, uploadId }
     (前端可展示 "已存在相同文件"，用户确认后调用 confirm 复用)
   → If multiple matches: return { exists: false }
     (多个候选无法确定，走正常上传流程)
   → If no match: return { exists: false }
   → NOTE: dedup check is a HINT only. It reduces unnecessary uploads but never
     skips server-side hash verification. The confirm step always computes full-file
     MD5 to determine the final content-addressable key.

3. Client → POST /api/uploads/presign {
     originalname, mimetype, size, ext, folderId
   }
   → Worker:
     a. Generate temp key: `tmp/{uuid}.{ext}`
     b. Generate presigned PUT URL for R2 (using S3 API)
     c. Save upload session to D1 (upload_sessions)
     d. Return { presignedUrl, sessionId, tempKey }

4. Client → PUT presignedUrl (直传 R2，绕过 Worker)
   → R2 receives file body

5. Client → POST /api/uploads/confirm { sessionId }
   → Worker:
     a. Read first 4KB of R2 temp key for magic-byte content sniffing
        (e.g., JPEG starts with FF D8 FF, PNG with 89 50 4E 47)
        If detected mimetype conflicts with client-claimed mimetype, reject upload.
        This prevents disguised file attacks (e.g., .exe renamed to .jpg).
     b. Read file from R2 temp key (streaming)
     c. Compute full MD5 hash (streaming js-md5, O(1) memory)
     d. Final key = `{serverMD5}.{ext}`
     e. If SVG: read content, sanitize (sanitize-svg — Workers-compatible, no DOM dependency),
        re-upload sanitized version to tempKey
        NOTE: DOMPurify requires DOM API (document/window) which Workers do NOT have.
        Use `@poppanator/shtml` or a regex-based SVG sanitizer that strips <script>,
        on* attributes, and external references without DOM.
     f. If R2.head(finalKey) exists with same size → dedup: skip copy, delete tempKey
     g. Else: S3 CopyObject(tempKey → finalKey) via aws4fetch, then R2.delete(tempKey)
        NOTE: tempKey is ALWAYS deleted (both dedup and non-dedup paths)
        NOTE: R2 Workers API has NO copy() method. Must use S3 CopyObject:
        PUT /{bucket}/{finalKey} with header x-amz-copy-source: /{bucket}/{tempKey}
     h. Insert D1 record
     i. Return { url, ...doc }
```

**Key**: Worker 在 confirm 阶段流式读取 R2 对象计算 hash，使用增量 MD5（O(1) 内存）。

```typescript
// 流式 MD5 计算（Worker 中）— O(1) 内存，安全处理任意大小文件
import md5 from 'js-md5';

async function streamMD5(r2Object: R2ObjectBody): Promise<string> {
  const hasher = md5.create();
  const reader = r2Object.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    hasher.update(value);
  }
  return hasher.hex();
}
```

> Note: `crypto.subtle.digest('MD5')` is NOT supported in Workers WebCrypto.
> Workers WebCrypto only supports SHA-1/256/384/512. Must use js-md5 (pure JS, ~3KB).
> Alternative: For SHA-256 hash, can use Workers native `crypto.DigestStream` (zero-copy streaming).

### 4.4 Large File Flow (>= 100MB) — Resumable Multipart

```
1. Client: dedup check (same as small — size + ext)

2. Client → POST /api/uploads/presign {
     originalname, mimetype, size, ext, folderId, multipart: true
   }
   → Worker:
     a. Temp key: `tmp/{uuid}.{ext}`
     b. R2.createMultipartUpload(tempKey, { httpMetadata })
     c. Calculate part count (partSize = 10MB, min 5MB, max 10000 parts)
     d. Save to D1 upload_sessions: { uploadId, tempKey, totalSize, partSize, status: 'active' }
     e. Return { sessionId, uploadId, key: tempKey, partSize, partCount }

3. For each part:
   Client → POST /api/uploads/multipart/part-url { sessionId, partNumber }
   → Worker:
     a. Validate session exists and is active
     b. Generate presigned PUT URL for this part using R2 S3 API:
        - Method: PUT
        - Key: tempKey
        - PartNumber: partNumber
        - UploadId: uploadId
        - Expiry: 1 hour
     c. Return { presignedUrl, partNumber }

   Client → PUT presignedUrl with part body (直传 R2)
   → R2 returns ETag in response header
   Client: save { partNumber, etag } to localStorage (for resume)

4. If page refresh / network recovery:
   Client → GET /api/uploads/multipart/status { sessionId }
   → Worker:
     a. Check upload_sessions in D1
     b. List completed parts via S3 ListParts API (aws4fetch):
        GET /{bucket}/{key}?uploadId={uploadId}
        NOTE: R2 Workers binding has NO listParts method. Must use S3 API + parse XML.
     c. Return { completedParts: [{ partNumber, etag, size }], status }
   Client: compare with localStorage, resume from first incomplete part

5. Client → POST /api/uploads/multipart/complete {
     sessionId, parts: [{ partNumber, etag }...]
   }
   → Worker:
     a. R2.resumeMultipartUpload(key, uploadId).complete(parts)
        → This materializes the R2 object. Without this, the object does NOT exist.
     b. Return { status: 'assembled' }
        NOTE: /multipart/complete ONLY assembles the R2 object. It does NOT do
        hash verification, validation, promote, or D1 insert. Those happen in /confirm.
        This separation ensures a single finalization path for both small and large files.

6. Client → POST /api/uploads/confirm { sessionId }
   (Same confirm endpoint as small files — single finalization path)
   → Worker: same flow as small file confirm (magic-byte check, hash, promote, D1 insert)

7. Abort (optional):
   Client → POST /api/uploads/multipart/abort { sessionId }
   → Worker: R2.resumeMultipartUpload(key, uploadId).abort()
   → Update upload_sessions status = 'aborted'
```

### 4.5 Presigned URL Generation (S3 Compatible)

```typescript
import { AwsClient } from 'aws4fetch';

function createS3Client(env: Env) {
  return new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    region: 'auto',
    service: 's3',
  });
}

async function generatePresignedPutUrl(
  s3: AwsClient, bucket: string, key: string, accountId: string,
  options: { expiresIn?: number; contentType?: string; partNumber?: number; uploadId?: string } = {}
) {
  const { expiresIn = 3600, contentType, partNumber, uploadId } = options;
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}`;
  const url = new URL(endpoint);

  if (partNumber && uploadId) {
    url.searchParams.set('partNumber', String(partNumber));
    url.searchParams.set('uploadId', uploadId);
  }
  url.searchParams.set('X-Amz-Expires', String(expiresIn));

  const signed = await s3.sign(new Request(url, {
    method: 'PUT',
    headers: contentType ? { 'Content-Type': contentType } : {},
  }), { aws: { signQuery: true } });

  return signed.url;
}

// S3 CopyObject — R2 Workers API has NO copy() method, must use S3 API
async function s3CopyObject(
  s3: AwsClient, bucket: string, sourceKey: string, destKey: string, accountId: string
) {
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${destKey}`;
  const signed = await s3.sign(new Request(endpoint, {
    method: 'PUT',
    headers: {
      'x-amz-copy-source': `/${bucket}/${sourceKey}`,
    },
  }));
  const res = await fetch(signed);
  if (!res.ok) throw new Error(`CopyObject failed: ${res.status}`);
}

// S3 ListParts — R2 Workers API has NO listParts() method, must use S3 API
async function s3ListParts(
  s3: AwsClient, bucket: string, key: string, uploadId: string, accountId: string
): Promise<Array<{ partNumber: number; etag: string; size: number }>> {
  const endpoint = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${key}?uploadId=${uploadId}`;
  const signed = await s3.sign(new Request(endpoint, { method: 'GET' }));
  const res = await fetch(signed);
  const xml = await res.text();
  // Parse XML response for <Part> elements
  // NOTE: Regex XML parsing is fragile (attribute order, whitespace, CDATA).
  // Use a lightweight XML parser like 'fast-xml-parser' (Workers-compatible, ~15KB).
  // Alternatively, split by <Part> tags and extract fields step by step.
  const { XMLParser } = await import('fast-xml-parser');
  const parser = new XMLParser();
  const parsed = parser.parse(xml);
  const rawParts = parsed?.ListPartsResult?.Part;
  if (!rawParts) return [];
  const partArray = Array.isArray(rawParts) ? rawParts : [rawParts];
  return partArray.map((p: any) => ({
    partNumber: Number(p.PartNumber),
    etag: String(p.ETag),
    size: Number(p.Size),
  }));
}
```

**R2 CORS 配置**（必须）：

```json
[
  {
    "AllowedOrigins": ["https://media.your-domain.com"],
    "AllowedMethods": ["PUT", "GET", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-MD5"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### 4.6 Upload Session Cleanup

```typescript
// Cron trigger: 每小时清理过期 upload sessions
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const db = drizzle(env.DB);
    const expired = await db.select().from(uploadSessions)
      .where(and(
        eq(uploadSessions.status, 'active'),
        lt(uploadSessions.expiresAt, new Date().toISOString())
      ));

    for (const session of expired) {
      try {
        const multipart = env.R2_UPLOADS.resumeMultipartUpload(session.key, session.uploadId);
        await multipart.abort();
      } catch { /* already cleaned */ }
      await db.update(uploadSessions)
        .set({ status: 'aborted' })
        .where(eq(uploadSessions.id, session.id));
    }
  },
};
```

```toml
# wrangler.toml
[triggers]
crons = ["0 * * * *"]  # Every hour
```

### 4.7 Frontend Uploader Changes

```typescript
// Core change: TUS → Presigned URL upload
// New custom Uppy plugin: R2PresignedUpload

class R2PresignedUpload extends BasePlugin {
  async upload(fileIDs: string[]) {
    for (const id of fileIDs) {
      const file = this.uppy.getFile(id);
      const { ext } = file.meta;

      // 1. Dedup check (hint only — server must still confirm)
      const checkRes = await fetch(`${apiBase}/api/uploads/check`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ext, size: file.size }),
      });
      const { exists, url, uploadId } = await checkRes.json();
      if (exists && uploadId) {
        // File exists — but still call confirm to ensure D1 record exists for THIS user
        // (dedup shares the R2 object but each user gets their own D1 record)
        // NOTE: url from /check contains the content-addressable filename
        const confirmRes = await fetch(`${apiBase}/api/uploads/confirm`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ existingUploadId: uploadId }),
        });
        const doc = await confirmRes.json();
        this.uppy.emit('upload-success', file, doc);
        continue;
      }

      // 2. Get presigned URL
      const presignRes = await fetch(`${apiBase}/api/uploads/presign`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          originalname: file.name,
          mimetype: file.type,
          size: file.size,
          ext,
          folderId,
          multipart: file.size >= 100 * 1024 * 1024,
        }),
      });
      const session = await presignRes.json();

      if (!session.multipart) {
        // 3a. Small file: single PUT
        await fetch(session.presignedUrl, {
          method: 'PUT',
          body: file.data,
          headers: { 'Content-Type': file.type },
        });
      } else {
        // 3b. Large file: multipart upload all parts
        const completedParts = await this.multipartUpload(file, session);

        // 3c. Complete multipart (materializes the R2 object)
        // Without this step, R2 object does NOT exist — confirm would fail!
        await fetch(`${apiBase}/api/uploads/multipart/complete`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            sessionId: session.sessionId,
            parts: completedParts,
          }),
        });
      }

      // 4. Confirm (hash verify + promote + D1 insert)
      const confirmRes = await fetch(`${apiBase}/api/uploads/confirm`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ sessionId: session.sessionId }),
      });
      const doc = await confirmRes.json();
      this.uppy.emit('upload-success', file, doc);
    }
  }

  async multipartUpload(file, session) {
    const { sessionId, partSize, partCount } = session;
    const completedParts = [];

    // Check localStorage for resume
    const savedParts = JSON.parse(
      localStorage.getItem(`upload-${sessionId}`) || '[]'
    );

    for (let i = 1; i <= partCount; i++) {
      // Skip already completed parts
      const saved = savedParts.find(p => p.partNumber === i);
      if (saved) { completedParts.push(saved); continue; }

      // Get presigned URL for this part
      const urlRes = await fetch(`${apiBase}/api/uploads/multipart/part-url`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ sessionId, partNumber: i }),
      });
      const { presignedUrl } = await urlRes.json();

      // Upload part
      const start = (i - 1) * partSize;
      const end = Math.min(i * partSize, file.size);
      const partBlob = file.data.slice(start, end);

      const putRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: partBlob,
      });
      const etag = putRes.headers.get('ETag');
      completedParts.push({ partNumber: i, etag });

      // Persist to localStorage for resume
      localStorage.setItem(`upload-${sessionId}`, JSON.stringify(completedParts));

      // Progress
      this.uppy.emit('upload-progress', file, {
        bytesUploaded: end,
        bytesTotal: file.size,
      });
    }

    // Clean up localStorage after successful upload
    localStorage.removeItem(`upload-${sessionId}`);
    return completedParts;
  }
}
```

**PrepareUpload plugin**: 不变（EXIF 方向修正、SVG 清洗、zip bomb 检测均为纯前端逻辑）。

### 4.8 API Response Contracts

所有 API 响应必须与现有前端兼容。以下是关键端点的响应 schema：

```typescript
// POST /api/uploads/check
interface CheckResponse {
  exists: boolean;
  url?: string;        // 已存在文件的访问 URL（如 /uploads/{filename}）
  filename?: string;   // 已存在文件的 filename（content hash key）
  uploadId?: string;   // 已存在文件的 D1 record id（用于 dedup confirm）
}

// POST /api/uploads/presign
interface PresignResponse {
  sessionId: string;        // upload session id (UUID)
  presignedUrl?: string;    // 小文件: R2 presigned PUT URL
  multipart?: boolean;      // true if large file
  uploadId?: string;        // 大文件: R2 multipart uploadId
  key?: string;             // 大文件: temp key
  partSize?: number;        // 大文件: 每 part 字节数
  partCount?: number;       // 大文件: 总 part 数
}

// POST /api/uploads/confirm
// 必须兼容现有前端 Uppy upload-success 事件期望的字段
interface ConfirmResponse {
  id: string;               // D1 record UUID
  filename: string;         // content-addressable key (e.g., "abc123.png")
  originalname: string;     // 原始文件名
  mimetype: string;
  size: number;
  url: string;              // 文件访问 URL (e.g., "/uploads/abc123.png")
  created_at: string;       // ISO timestamp
  // 以下字段保持与现有前端兼容
  hashFileName?: string;    // same as filename, for backward compat
}

// GET /api/uploads (分页列表)
interface ListResponse {
  data: ConfirmResponse[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 5. Component Design

### 5.1 Authentication (v6 — 默认放行 + 管理员配置)

> **v5 变更**: 先默认放行所有上传请求，使用一个硬编码的默认 DID 作为用户标识。
> **v6 修复**: 增加 ADMIN_DIDS 环境变量，解决 role=member 与 isAdmin 检查的矛盾。
> Shijun 过几天会提供认证方案，届时替换此占位实现。

```typescript
// cloudflare/src/middleware/auth.ts
// 临时占位：默认放行，使用默认 DID
// TODO: 替换为 Shijun 提供的认证方案

const DEFAULT_DID = 'did:abt:default-uploader';

export async function authMiddleware(c: Context, next: Next) {
  const userId = c.req.header('x-user-did') || DEFAULT_DID;

  // ADMIN_DIDS: 逗号分隔的管理员 DID 列表
  // 默认放行时，DEFAULT_DID 自动包含在管理员列表中
  const adminDids = (c.env.ADMIN_DIDS || DEFAULT_DID).split(',').map(s => s.trim());
  const isAdmin = adminDids.includes(userId);

  c.set('user', {
    id: userId,
    role: isAdmin ? 'admin' : 'member',
  });

  return next();
}

// 管理员检查中间件（替代原 ensureAdmin）
export async function isAdminMiddleware(c: Context, next: Next) {
  const user = c.get('user');
  if (user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  return next();
}
```

**预留接口**：认证中间件读取 `x-user-did` header。当 Shijun 的认证工具就绪后，只需在 Worker 前面加一层认证网关（或中间件），将认证结果写入该 header 即可。管理员列表通过 `ADMIN_DIDS` 环境变量配置，认证方案就绪后可改为从认证结果中获取角色。

### 5.2 EXIF Removal Strategy (v6 — Fixed)

**Decision: Worker 内统一通过 `cf.image` 处理所有图片请求**

> v2 错误：Transform Rules 不能触发 Image Resizing。v3 改为 Worker `cf.image`。
> v5 错误：WAF + 自定义 header 方案不可行 — `cf.image` 通过 Cloudflare 图片代理发起请求，
> 代理不会转发自定义 header，WAF 规则检查 `x-r2-origin-secret` 永远收不到该 header。
>
> **v6 方案**：R2 bucket 绑定公共域名（r2-origin.internal.com），但通过 Cloudflare
> **IP Access Rule** 或 **Authenticated Origin Pull (mTLS)** 限制，仅允许 Cloudflare
> 边缘 IP 访问。`cf.image` 从 Cloudflare 边缘发起 subrequest，天然来自 Cloudflare IP。
> 外部直接访问该域名会被 IP 规则拦截。

```typescript
app.get('/uploads/:filename', async (c) => {
  const { filename } = c.req.param();
  const w = c.req.query('w');
  const h = c.req.query('h');

  const object = await c.env.R2_UPLOADS.head(filename);
  if (!object) return c.text('404 NOT FOUND', 404);

  const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
  const isImage = contentType.startsWith('image/');

  // Images: pipe through cf.image for EXIF stripping + optional resize.
  //
  // cf.image requires a fetch to an origin URL (not ReadableStream).
  // R2 origin domain is restricted via:
  //   1. Cloudflare IP Access Rules (only edge IPs allowed)
  //   2. Or: Authenticated Origin Pull (mTLS) enabled on the zone
  // cf.image subrequests originate from Cloudflare edge, so they pass through.
  // Direct external access to r2-origin domain is blocked.
  if (isImage) {
    const r2OriginUrl = `https://${c.env.R2_ORIGIN_DOMAIN}/${filename}`;
    return fetch(r2OriginUrl, {
      cf: {
        image: {
          metadata: 'none',           // ALWAYS strip EXIF
          format: 'auto',             // auto WebP/AVIF based on Accept header
          width: w ? parseInt(w) : undefined,
          height: h ? parseInt(h) : undefined,
          fit: (w || h) ? 'contain' : undefined,
          quality: (w || h) ? 85 : 100,  // only compress when resizing
        },
      },
    });
  }

  // Non-image files: serve directly from R2 binding (private, no Image Resizing needed)
  const r2Object = await c.env.R2_UPLOADS.get(filename);
  if (!r2Object) return c.text('404 NOT FOUND', 404);

  return new Response(r2Object.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
});
```

**R2 Origin 域名保护配置**:
```
# 方案 A: IP Access Rules（推荐，零成本）
# Cloudflare 边缘 IP 列表: https://www.cloudflare.com/ips/
# 在 DNS/Firewall 中配置：仅允许 Cloudflare IP 段访问 r2-origin 子域名

# 方案 B: Authenticated Origin Pull（更安全，需要 Pro 以上）
# 在 SSL/TLS → Origin Server 中启用 Authenticated Origin Pulls
# cf.image 的 subrequest 自动携带 Cloudflare 客户端证书
```

### 5.3 Unsplash Strategy (v2 — ToS Compliant)

**Decision: Hotlink + Attribution，不重新托管**

Unsplash API Terms 要求：
1. 使用 Unsplash 图片 URL 直接显示（hotlink）
2. 显示 attribution（摄影师名称 + Unsplash 链接）
3. 用户下载时调用 `download_location` endpoint

```typescript
// cloudflare/src/routes/unsplash.ts

// 搜索：返回 Unsplash 图片列表（包含 hotlink URL 和 attribution）
app.get('/search', authMiddleware, async (c) => {
  const query = c.req.query('q');
  const page = c.req.query('page') || '1';
  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=30`,
    { headers: { Authorization: `Client-ID ${c.env.UNSPLASH_KEY}` } }
  );
  const data = await res.json();

  // Return structured results with attribution
  return c.json({
    results: data.results.map(photo => ({
      id: photo.id,
      urls: photo.urls,  // { raw, full, regular, small, thumb }
      attribution: {
        name: photo.user.name,
        username: photo.user.username,
        link: photo.user.links.html,
      },
      download_location: photo.links.download_location,
      width: photo.width,
      height: photo.height,
      description: photo.description || photo.alt_description,
    })),
    total: data.total,
    total_pages: data.total_pages,
  });
});

// 用户选择图片后：触发下载跟踪 + 在 D1 记录 Unsplash 引用
app.post('/track-download', authMiddleware, async (c) => {
  const { downloadLocation, photoId, attribution } = await c.req.json();

  // Required by Unsplash API: trigger download tracking
  await fetch(downloadLocation, {
    headers: { Authorization: `Client-ID ${c.env.UNSPLASH_KEY}` },
  });

  // Save reference in D1 (NOT the image file)
  const db = drizzle(c.env.DB);
  const id = crypto.randomUUID();
  await db.insert(uploads).values({
    id,
    filename: `unsplash:${photoId}`, // special prefix, not an R2 key
    originalname: `${attribution.name} via Unsplash`,
    mimetype: 'image/jpeg',
    size: 0, // not stored locally
    folderId: c.req.header('x-folder-id') || 'default',
    remark: JSON.stringify({ unsplash: true, attribution, photoId }),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: c.get('user').id,
    updatedBy: c.get('user').id,
  });

  return c.json({ id, photoId });
});
```

**前端 Unsplash 插件**：显示 Unsplash 图片时使用 `urls.regular` (hotlink)，不从 R2 提供。需要改造 `createImageUrl()` 识别 `unsplash:` 前缀。

### ~~5.4 AFS (Agentic File System) 集成~~ — 推迟到 v2

> **v5 变更**: AFS 集成推迟到下个版本。先完成 Cloudflare 迁移的核心功能。
> 完整的 AFS 设计方案（MediaStorage AFSModule）已保存在 git history 的 v4 版本中。

### 5.5 Uploader Status Response (兼容现有前端)

```typescript
// GET /api/uploader/status — 保持与现有前端完全兼容的响应 schema
app.get('/status', async (c) => {
  const componentDid = c.req.header('x-component-did');

  const availablePluginMap = {
    AIImage: c.env.USE_AI_IMAGE === 'true',
    Unsplash: !!(c.env.UNSPLASH_KEY && c.env.UNSPLASH_SECRET),
    Uploaded: !!componentDid,  // if component context exists
    Resources: false,           // dropped in CF version
  };

  const allowedFileTypes = c.env.ALLOWED_FILE_TYPES
    ?.split(',')
    .map(ext => {
      const mimeMap: Record<string, string> = {
        '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
        '.svg': 'image/svg+xml', '.webp': 'image/webp', '.bmp': 'image/bmp',
        '.ico': 'image/x-icon',
      };
      return mimeMap[ext.trim()] || '';
    })
    .filter(Boolean) || [];

  const maxFileSize = parseSize(c.env.MAX_UPLOAD_SIZE) || Infinity;

  return c.json({
    availablePluginMap,
    preferences: {
      extsInput: c.env.ALLOWED_FILE_TYPES || '.jpeg,.png,.gif,.svg,.webp',
      maxUploadSize: c.env.MAX_UPLOAD_SIZE || '100MB',
      supportModels: c.env.SUPPORT_MODELS || '',
      useAiImage: c.env.USE_AI_IMAGE === 'true',
    },
    restrictions: {
      allowedFileTypes,
      maxFileSize,
    },
  });
});
```

### 5.6 Tags Query (v6 — 新增)

```typescript
// GET /api/uploads?tag=xxx — 按 tag 过滤上传文件
// 使用 upload_tags 关联表 JOIN 查询
app.get('/api/uploads', authMiddleware, async (c) => {
  const tag = c.req.query('tag');
  const page = parseInt(c.req.query('page') || '1');
  const pageSize = parseInt(c.req.query('pageSize') || '20');
  const offset = (page - 1) * pageSize;
  const db = drizzle(c.env.DB);

  let query;
  if (tag) {
    // JOIN upload_tags to filter by tag
    query = db.select({ upload: uploads })
      .from(uploads)
      .innerJoin(uploadTags, eq(uploads.id, uploadTags.uploadId))
      .where(eq(uploadTags.tag, tag))
      .orderBy(desc(uploads.createdAt))
      .limit(pageSize)
      .offset(offset);
  } else {
    query = db.select().from(uploads)
      .orderBy(desc(uploads.createdAt))
      .limit(pageSize)
      .offset(offset);
  }

  const data = await query;
  // Count query for pagination
  const [{ count }] = tag
    ? await db.select({ count: sql`count(*)` })
        .from(uploads)
        .innerJoin(uploadTags, eq(uploads.id, uploadTags.uploadId))
        .where(eq(uploadTags.tag, tag))
    : await db.select({ count: sql`count(*)` }).from(uploads);

  return c.json({ data, total: count, page, pageSize });
});
```

### 5.7 Database Schema (v2)

```sql
-- migrations/0001_initial.sql

CREATE TABLE IF NOT EXISTS uploads (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  originalname TEXT,
  mimetype TEXT,
  size INTEGER,
  remark TEXT DEFAULT '',
  folder_id TEXT,
  created_at TEXT,
  updated_at TEXT,
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX idx_uploads_filename ON uploads(filename);
CREATE INDEX idx_uploads_folder_id ON uploads(folder_id);
CREATE INDEX idx_uploads_mimetype ON uploads(mimetype);
CREATE INDEX idx_uploads_created_by ON uploads(created_by);
CREATE INDEX idx_uploads_created_at ON uploads(created_at);

-- Tags: normalized relation table (replaces JSON tags field)
CREATE TABLE IF NOT EXISTS upload_tags (
  upload_id TEXT NOT NULL,
  tag TEXT NOT NULL,
  PRIMARY KEY (upload_id, tag),
  FOREIGN KEY (upload_id) REFERENCES uploads(id) ON DELETE CASCADE
);

CREATE INDEX idx_upload_tags_tag ON upload_tags(tag, upload_id);

CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT,
  created_by TEXT,
  updated_by TEXT
);

CREATE INDEX idx_folders_name ON folders(name);

-- Upload sessions (multipart upload state)
CREATE TABLE IF NOT EXISTS upload_sessions (
  id TEXT PRIMARY KEY,
  upload_id TEXT,
  key TEXT NOT NULL,
  final_key TEXT,
  total_size INTEGER,
  part_size INTEGER,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  created_at TEXT,
  expires_at TEXT
);

CREATE INDEX idx_upload_sessions_status ON upload_sessions(status);
CREATE INDEX idx_upload_sessions_expires ON upload_sessions(expires_at);

-- NOTE: nonces table removed in v4 — auth handled by external tool
```

---

## 6. Data Migration (v2 — Fixed)

### 6.1 Files: Local Disk → R2

```bash
# rclone with .json metadata exclusion
rclone copy /path/to/blocklet-data/uploads r2:media-kit-uploads \
  --s3-provider=Cloudflare \
  --s3-access-key-id=$R2_ACCESS_KEY \
  --s3-secret-access-key=$R2_SECRET_KEY \
  --s3-endpoint=https://$CF_ACCOUNT_ID.r2.cloudflarestorage.com \
  --exclude "*.json" \
  --transfers=16 --checkers=32 --progress
```

### 6.2 Database: SQLite → D1 (Parameterized)

```typescript
// scripts/migrate-data.ts — parameterized queries, no string concatenation
import Database from 'better-sqlite3';

const sourceDb = new Database('/path/to/media-kit.db');
const uploads = sourceDb.prepare('SELECT * FROM uploads').all();

// Generate parameterized SQL for wrangler d1 execute
const BATCH_SIZE = 100;
for (let i = 0; i < uploads.length; i += BATCH_SIZE) {
  const batch = uploads.slice(i, i + BATCH_SIZE);

  for (const u of batch) {
    // Each insert is a separate parameterized statement
    const stmt = `INSERT INTO uploads (id,filename,originalname,mimetype,size,remark,folder_id,created_at,updated_at,created_by,updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
    const params = [
      u.id, u.filename, u.originalname, u.mimetype, u.size,
      u.remark || '', u.folderId || '',
      u.createdAt, u.updatedAt, u.createdBy || '', u.updatedBy || ''
    ];

    // Use D1 HTTP API with parameterized queries
    await d1Execute(stmt, params);

    // Migrate tags from JSON to upload_tags table
    const tags = JSON.parse(u.tags || '[]');
    for (const tag of tags) {
      await d1Execute(
        'INSERT OR IGNORE INTO upload_tags (upload_id, tag) VALUES (?, ?)',
        [u.id, tag]
      );
    }
  }
}

// Migrate folders table
const folders = sourceDb.prepare('SELECT * FROM folders').all();
for (const f of folders) {
  await d1Execute(
    'INSERT INTO folders (id, name, created_at, updated_at, created_by, updated_by) VALUES (?,?,?,?,?,?)',
    [f.id, f.name, f.createdAt, f.updatedAt, f.createdBy || '', f.updatedBy || '']
  );
}
```

---

## 7. Cost Estimate (v2 — Three-tier)

Based on: 5万 files, 100GB storage, 10万/day access, ~500 unique resize variants/day.

| Item | Conservative | Medium | Peak |
|------|-------------|--------|------|
| Workers Paid Plan | $5 | $5 | $5 |
| Workers Requests (beyond 10M/mo) | $0 | $0 | $1.50 |
| R2 Storage (100GB) | $1.50 | $1.50 | $1.50 |
| R2 Class A ops (writes) | $0.10 | $0.23 | $0.90 |
| R2 Class B ops (reads) | $0.36 | $1.08 | $3.60 |
| D1 rows_read (with tags join) | $0 | $0.75 | $2.50 |
| D1 rows_written | $0 | $0 | $0.10 |
| D1 Storage | $0 | $0 | $0 |
| Image Transformations (unique) | $0 (5K free) | $5 ($0.50/1K × 10K) | $25 ($0.50/1K × 50K) |
| Cloudflare Pro Plan (if needed) | $0 | $20 | $20 |
| Cloudflare Pages | $0 | $0 | $0 |
| R2 Egress | **$0** | **$0** | **$0** |
| **Total** | **~$7/mo** | **~$34/mo** | **~$60/mo** |

**Notes**:
- Image Transformations 按 unique variants 计费（同一 URL 参数组合只算一次）
- Pro Plan ($20) 仅在需要 Image Resizing (`cf.image`) 时必须
- D1 rows_read：tags 关联查询比 JSON scan 更高效，但仍需关注频繁列表查询
- Conservative 假设低流量、少量 resize；Peak 假设高流量、大量 resize 变体

---

## 8. wrangler.toml (v2)

```toml
name = "media-kit"
main = "src/worker.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "production"
MAX_UPLOAD_SIZE = "500MB"
ALLOWED_FILE_TYPES = ".jpeg,.png,.gif,.svg,.webp,.bmp,.ico"
USE_AI_IMAGE = "false"
ADMIN_DIDS = "did:abt:default-uploader"  # 逗号分隔的管理员 DID 列表

[[r2_buckets]]
binding = "R2_UPLOADS"
bucket_name = "media-kit-uploads"

[[d1_databases]]
binding = "DB"
database_name = "media-kit-db"
database_id = "to-be-created"

# Service Binding (for other Workers to call media-kit)
# Other Workers add: [[services]] binding = "MEDIA_KIT" service = "media-kit"

[triggers]
crons = ["0 * * * *"]

[[routes]]
pattern = "media.your-domain.com/*"
zone_name = "your-domain.com"

# Secrets (wrangler secret put):
# R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
# UNSPLASH_KEY, UNSPLASH_SECRET
# R2_ORIGIN_DOMAIN (R2 公共域名，通过 IP Access Rule 限制仅 Cloudflare 边缘访问)
# NOTE: 认证相关密钥待 Shijun 方案就绪后添加

[env.staging]
name = "media-kit-staging"
[env.staging.vars]
ENVIRONMENT = "staging"
```

---

## 9. Risks & Mitigations (v3)

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Workers CPU timeout on confirm (hash large file) | Confirm fails | 文件 > 500MB: confirm 返回 `{ status: 'processing' }`，将 hash 任务推入 Queue；客户端轮询 `GET /api/uploads/confirm-status?sessionId=xxx`；Queue consumer 在 Worker 中运行（Queue handler 有 15min CPU 限制，足够处理大文件） |
| D1 write concurrency | Upload conflicts | Single primary writer; writes are per-user natural sharding |
| D1 cross-region latency | Slow list queries | Read replication enabled; list queries use replica |
| SVG sanitize CPU | Timeout on large SVGs | Limit SVG to 5MB; reject larger. 使用 Workers 兼容方案（非 DOMPurify） |
| R2 presigned URL expiry | Upload fails if slow | 1 hour expiry; client can request new URL |
| Multipart session orphan | R2 storage waste | Hourly cron cleanup; 24h session expiry |
| Unsplash hotlink availability | Image unavailable if removed | Store attribution metadata; show fallback |
| Frontend refactor breaks other consumers | npm package incompatibility | Dual-mode package: TUS for Blocklet, presigned for CF |
| Confirm step server-side hash mismatch | Indicates tampered upload | Reject and delete temp object; log for audit |
| URL import SSRF | Internal network scanning | Host denylist (private IPs), 50MB size limit, max 3 redirects |
| Service Binding secret leak | Privilege escalation | Rotate via wrangler secret; use per-service secrets if needed |
| Dedup false positive (size+ext match) | Wrong file served | Dedup is hint only; single match required; confirm always verifies full-file hash |

---

## 10. Implementation Roadmap (v2)

### Phase 1: Foundation (Week 1-2)
- [ ] Create R2 bucket, D1 database, run migrations
- [ ] Scaffold Worker (Hono + Drizzle + wrangler.toml)
- [ ] Auth middleware（默认放行 + 预留 DID header）
- [ ] `/uploads/*` file serving with Image Resizing
- [ ] EXIF removal via `cf.image { metadata: 'none' }` in Worker
- [ ] `GET/DELETE/PUT /api/uploads` CRUD

### Phase 2: Upload Core (Week 2-3)
- [ ] Presigned URL generation (aws4fetch)
- [ ] R2 CORS configuration
- [ ] Small file flow: presign → PUT → confirm
- [ ] Large file flow: multipart create → part URLs → complete
- [ ] Upload session management + cron cleanup
- [ ] SVG sanitization on confirm
- [ ] Frontend R2PresignedUpload plugin (replace TUS)

### Phase 3: Features (Week 3-4)
- [ ] Service Binding support（通信层，认证待定）
- [ ] Folder management
- [ ] Unsplash search + track-download (hotlink mode)
- [ ] URL import (with SSRF protection: host denylist, 50MB size limit, max 3 redirects)
- [ ] AI image generation proxy
- [ ] Uploader status (compatible response schema)

### Phase 4: Data Migration (Week 4-5)
- [ ] Migration scripts (parameterized SQL)
- [ ] rclone file migration
- [ ] Verification (count, sampling, integrity)
- [ ] tags → upload_tags migration

### Phase 5: Testing & Launch (Week 5-6)
- [ ] E2E tests (upload, resume, dedup, delete, resize)
- [ ] Performance benchmark (presigned vs direct)
- [ ] Staging deploy + smoke test
- [ ] Production deploy
- [ ] DNS cutover + monitoring

### Future (v2)
- [ ] 对接 Shijun 的认证方案（替换默认放行）
- [ ] AFS MediaStorage 模块集成

---

## 11. Decisions Log (v6)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Upload protocol | R2 presigned PUT + S3 multipart | Worker 不接收文件 body，无内存限制 |
| Object key trust | Temp key → server hash → promote | 防止客户端伪造 key 覆盖他人文件 |
| Resumability | Part-level resume (localStorage + S3 ListParts) | 替代 TUS 字节级断点 |
| Server-side hash | js-md5 streaming (O(1) memory) | Workers WebCrypto 不支持 MD5；js-md5 纯 JS 3KB |
| R2 copy/promote | S3 CopyObject via aws4fetch | R2 Workers binding 无 copy() 方法 |
| R2 list parts | S3 ListParts + fast-xml-parser | R2 Workers binding 无 listParts()；正则解析 XML 脆弱 |
| Auth | 默认放行 + ADMIN_DIDS 配置 | role=member 与管理操作矛盾，通过 ADMIN_DIDS 环境变量配置管理员 |
| Blocklet SDK | 废弃 | SDK 相关 API 不迁移 |
| AFS | 推迟到 v2 | 先完成核心迁移 |
| EXIF removal | Worker `cf.image { metadata: 'none' }` + IP Access Rule 保护 origin | WAF 自定义 header 方案不可行（cf.image 代理不转发），改用 IP 限制 |
| Unsplash | Hotlink + attribution | ToS 合规，不重新托管 |
| Tags storage | Normalized upload_tags table + JOIN 查询 API | 避免 json_each() 全表扫描，支持 ?tag= 过滤 |
| Dedup strategy | Size + ext 粗筛为 hint，confirm 阶段全文件 hash 最终确认 | first-5MB hash 与 filename(full hash) 不匹配，改为更简单的粗筛 |
| SVG sanitization | Workers-compatible sanitizer（非 DOMPurify） | DOMPurify 依赖 DOM API，Workers 无 document/window |
| Large file confirm | >500MB 异步 Queue 处理 | Workers 请求 CPU 限制 30s，Queue handler 15min |
| URL import | Host denylist + size limit + redirect cap | 防 SSRF |
| D1 replication | Read replicas for list queries | 降低跨区域延迟 |
| Cost model | Three-tier (conservative/medium/peak) | 准确反映不同规模 |
| ORM | Drizzle | Native D1 support |
| Framework | Hono | Workers-native, Express-like |
| Component call | Service Binding | 替代 blocklet component.call |
