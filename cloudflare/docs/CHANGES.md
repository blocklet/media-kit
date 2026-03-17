# Media Kit — Cloudflare Workers 迁移改动总结

## 一、背景

### 项目现状

Media Kit 是 ArcBlock 的媒体文件管理组件，核心包括：

- **Blocklet 后端** (`blocklets/image-bin/`)：Node.js + Express + Sequelize + 本地存储，使用 TUS 协议处理文件上传
- **前端上传组件** (`packages/uploader/`)：基于 Uppy 的 `<Uploader />` React 组件，被多个业务方（消费者）通过 `onUploadFinish={(result) => doSomething(result.data)}` 使用
- **Cloudflare Worker** (`cloudflare/`)：一个独立的 CF Worker 实现（Hono + D1 + R2），使用 presigned URL 上传协议

### 问题

1. **前端只支持 TUS**：`@blocklet/uploader` 的上传逻辑硬编码了 TUS 协议（`@uppy/tus` 插件），无法对接 CF Worker 的 presigned URL 上传
2. **CF Worker 有残留依赖**：之前尝试过 adapter pattern 方案（引入 `@blocklet/media-kit-core` 共享包），后来方案废弃，但 CF Worker 代码中仍残留了对 `@blocklet/media-kit-core` 的依赖和 adapters 目录，而该包已不存在，导致 CF Worker 无法编译
3. **响应格式不一致**：CF Worker 的 confirm 端点返回 `{ id, created_at }` 等字段，而 Blocklet 端返回 `{ _id, createdAt }` 格式，消费者代码依赖后者

### 已废弃的方案

之前考虑过 adapter pattern（引入 `@blocklet/media-kit-core` 包，定义 `IDatabaseAdapter` / `IStorageAdapter` / `IConfigAdapter` 接口，让 Blocklet 和 CF Worker 共享 ~145 行业务逻辑）。该方案因过度抽象被废弃：共享逻辑量太少，不值得引入新包和接口层。

### 新方案原则

- **Blocklet 代码不动**：零改动，零风险
- **CF Worker 保持独立实现**：不引入共享包，直接内联 Drizzle 查询
- **前端最小改动**：只加 presigned 模式的条件分支
- **消费者零感知**：`result.data` 结构在两种模式下完全一致

---

## 二、改动清单

### 文件总览

| 文件 | 操作 | 行数 | 说明 |
|------|------|------|------|
| `cloudflare/src/adapters/` | **DELETE** | -4 files | 删除废弃的 adapter pattern 残留 |
| `cloudflare/package.json` | MODIFY | -1 行 | 移除 `@blocklet/media-kit-core` 依赖 |
| `cloudflare/src/types.ts` | MODIFY | ~10 行 | ConfirmResponse 字段对齐 |
| `cloudflare/src/routes/upload.ts` | **REWRITE** | 587 行 | 内联 list/delete/update + 修复 confirm 格式 + 修复 R2 流处理 bug |
| `cloudflare/src/routes/status.ts` | **REWRITE** | 29 行 | 内联 + 加 `uploadMode: 'presigned'` |
| `cloudflare/src/routes/folders.ts` | **REWRITE** | 77 行 | 内联 + 加 GET 端点 |
| `packages/uploader/src/react/plugins/presigned-upload.ts` | **CREATE** | 291 行 | Uppy 自定义上传插件 |
| `packages/uploader/src/react/uploader.tsx` | MODIFY | +39 行 | 条件分支：TUS / presigned |

### 未改动的文件

| 文件 | 原因 |
|------|------|
| `blocklets/image-bin/` | 完全不动，Blocklet 上传逻辑不受影响 |
| `packages/media-kit-core/` | 不创建此包（方案已废弃） |
| `pnpm-workspace.yaml` | cloudflare 是独立部署，不需加入 workspace |

---

## 三、详细改动说明

### 3.1 清理 CF Worker adapter 残留

**为什么**：之前 adapter pattern 方案废弃后，`cloudflare/src/adapters/` 目录和 `@blocklet/media-kit-core` 依赖残留在代码里。`media-kit-core` 包已被删除，导致 CF Worker 无法编译。

**做了什么**：
- 删除 `cloudflare/src/adapters/` 整个目录（`index.ts`、`database.ts`、`storage.ts`、`config.ts`）
- 从 `cloudflare/package.json` 移除 `"@blocklet/media-kit-core": "workspace:^"` 依赖
- 所有路由文件移除对 adapters 和 media-kit-core 的 import

### 3.2 CF Worker 路由内联重写

**为什么**：原来的 `GET /uploads`、`DELETE /uploads/:id`、`PUT /uploads/:id` 通过 adapter 调用 `media-kit-core` 的 handler 函数。包删除后需要用内联 Drizzle 查询替代。

#### upload.ts — 内联 list/delete/update

**GET /uploads**（列表）：
- 直接查 D1 `uploads` 表，支持分页 (`page`/`pageSize`)
- 权限控制：admin 可看所有，member 只能看自己的
- 支持 `folderId` 和 `tag` 过滤
- 查询 `uploadTags` 表获取每个文件的 tags
- 返回格式使用 `_id` 字段名（与 Blocklet Sequelize 记录一致）

**DELETE /uploads/:id**（删除）：
- Admin only（通过 `isAdminMiddleware`）
- 引用计数：同一个 `filename` 可能被多条记录引用（dedup），只有最后一条引用删除时才删 R2 文件
- 同时删除关联的 `uploadTags` 记录

**PUT /uploads/:id**（移动到文件夹）：
- Admin only
- 更新 `folderId` 和 `updatedAt`
- 返回更新后的完整记录

#### status.ts — 内联 + uploadMode

**GET /uploader/status**：
- 从环境变量读取配置（`ALLOWED_FILE_TYPES`、`MAX_UPLOAD_SIZE`、`UNSPLASH_KEY`、`USE_AI_IMAGE`）
- 返回 `restrictions`、`availablePluginMap`
- **新增 `uploadMode: 'presigned'`** — 前端据此选择上传协议

#### folders.ts — 内联 + 新增 GET

**POST /folders**（创建）：
- Admin only，幂等（同名 folder 返回已有记录）
- 返回 `_id` 格式

**GET /folders**（列表，新增）：
- 返回所有 folders，按创建时间倒序

### 3.3 CF Worker 响应格式对齐

**为什么**：消费者代码依赖 `result.data._id`、`result.data.createdAt` 等字段。CF Worker 之前返回 `id`、`created_at`，与 Blocklet 的 Sequelize 记录不一致。

**做了什么**：

`ConfirmResponse` 类型从：
```typescript
{ id, filename, originalname, mimetype, size, url, created_at, hashFileName }
```
改为：
```typescript
{ _id, filename, originalname, mimetype, size, url, createdAt, createdBy, tags }
```

confirm 端点的两个分支（dedup shortcut 和正常 confirm）都按新格式返回。list 和 update 端点也统一使用 `_id` 字段名。

### 3.4 修复 R2 流处理 bug（confirm 流程）

**为什么**：原始代码（迁移前就存在）在 confirm 流程中有 R2 body 流处理缺陷：

1. **double GET**：第 224 行做完整 GET（拿到 body stream），第 230 行又做 range GET（取 4KB header）。两次网络 I/O 读同一对象，浪费资源
2. **SVG 流耗尽**：对 SVG 文件调用 `r2Object.text()` 消耗了整个 body stream，之后 `streamMD5(r2Object.body)` 读到空流，MD5 结果错误
3. **size 比较误判**：content dedup 时用 `existingObject.size === session.totalSize` 判断是否需要 copy，但这不是内容相等的充分条件

**做了什么**：
- 分离 range GET（仅用于 MIME 检测）和 full GET（用于 SVG/hash）
- SVG 处理后始终重新 GET 获取 fresh stream 做 MD5
- content dedup 简化：MD5 key 匹配即视为内容相同，不再比较 size

### 3.5 创建 PresignedUpload Uppy 插件

**为什么**：CF Worker 不支持 TUS 协议（TUS 需要有状态的服务端 session，CF Workers 是无状态的）。CF Worker 使用 presigned URL 协议：客户端获取签名 URL 后直传文件到 R2，再调用 confirm 端点确认。需要一个 Uppy 自定义插件实现此协议。

**文件**：`packages/uploader/src/react/plugins/presigned-upload.ts`（291 行）

**实现细节**：

继承 `@uppy/core` 的 `BasePlugin`，在 `install()` 中通过 `addUploader()` 注册上传函数。

**上传流程**：

```
1. POST /uploads/check     → 按 size+ext 去重检查
   ↓ exists=true → 跳到 4（clone）
   ↓ exists=false → 继续

2. POST /uploads/presign   → 获取 presigned URL
   ↓ multipart=false → 单次直传
   ↓ multipart=true  → 分片上传

3a. PUT presignedUrl        → XHR 直传（带进度上报）
3b. 分片上传：
    for each part:
      POST /uploads/multipart/part-url → 获取分片 URL
      PUT partUrl → 上传分片
    POST /uploads/multipart/complete   → 组装分片

4. POST /uploads/confirm   → 确认上传，获取 upload record
```

**关键设计**：

- **进度上报**：直传使用 XHR `upload.onprogress`，分片使用累计已上传字节
- **错误处理**：单个文件失败 emit `upload-error`，不阻塞其他文件。分片上传失败时自动调用 `POST /uploads/multipart/abort` 清理 R2 未完成的 multipart session
- **事件兼容**：完成后 emit `upload-success` 事件，携带 `body: confirmData`，由 `uploader.tsx` 的监听器统一调用 `_onUploadFinish` 和 `emitUploadSuccess`，与 TUS 流程行为一致
- **bind 安全**：构造函数中一次性 bind `handleUpload`，`install`/`uninstall` 使用同一引用，避免 removeUploader 泄漏

### 3.6 修改 uploader.tsx — 条件分支

**为什么**：需要根据后端返回的 `uploadMode` 选择上传协议，同时保持 TUS 逻辑完全不变。

**改动点**（共 +39 行新增）：

1. **state 新增 `uploadMode`**：
   ```typescript
   uploadMode: 'tus' as 'tus' | 'presigned'
   ```

2. **useRequest 中读取 uploadMode**：
   ```typescript
   state.uploadMode = data.uploadMode || 'tus';
   ```
   从 `GET /api/uploader/status` 响应中获取。fallback 为 `'tus'`，所以 Blocklet 即使不返回此字段也完全兼容。

3. **initUploader 条件分支**：
   ```typescript
   if (uploadMode === 'presigned') {
     currentUppy.use(PresignedUploadPlugin, { apiBase });
     currentUppy.on('upload-success', async (file, response) => {
       // 构造与 TUS 一致的 result，调用 _onUploadFinish
     });
   } else {
     currentUppy.use(Tus, { ... }); // 原有逻辑，一行不改
   }
   ```

4. **useEffect 依赖加 uploadMode**：确保 `uploadMode` 从 `'tus'` 变为 `'presigned'` 后 uppy 实例会重新初始化。

---

## 四、消费者兼容性

消费者代码：
```jsx
<Uploader onUploadFinish={(result) => {
  console.log(result.data._id);      // ✅ 两种模式下都有
  console.log(result.data.url);       // ✅ 两种模式下都有
  console.log(result.data.filename);  // ✅ 两种模式下都有
}} />
```

`result.data` 在两种模式下结构一致：

| 字段 | TUS (Blocklet) | Presigned (CF Worker) |
|------|----------------|----------------------|
| `_id` | Sequelize UUID | D1 UUID |
| `url` | `/uploads/hash.ext` | `/uploads/hash.ext` |
| `filename` | `hash.ext` | `hash.ext` |
| `originalname` | 原始文件名 | 原始文件名 |
| `mimetype` | MIME type | MIME type |
| `size` | 文件大小 | 文件大小 |
| `createdAt` | ISO 时间戳 | ISO 时间戳 |
| `createdBy` | user DID | user DID |
| `tags` | string[] | string[] |

**消费者零改动，零感知。**

---

## 五、验证结果

| 检查项 | 结果 |
|--------|------|
| CF Worker TypeScript 编译 | ✅ 通过（仅 `cloudflare:test` 预存 error） |
| CF Worker 单元测试（14 tests） | ✅ 全部通过 |
| Uploader 包构建（unbuild） | ✅ 通过，ESM/CJS 均生成 |
| Presigned plugin 编译输出 | ✅ `lib/` 和 `es/` 均包含 |
| 残留引用检查 | ✅ 无任何 `@blocklet/media-kit-core` 或 `adapters` 引用 |
| Blocklet 代码 | ✅ 未触碰任何文件 |

---

## 六、架构图

```
消费者代码（零改动）
  └── <Uploader onUploadFinish={fn} />
        │
        ├── uploadMode === 'tus'（Blocklet 默认）
        │     └── Uppy + @uppy/tus
        │           └── TUS 协议 → Blocklet Express 后端 → 本地存储
        │
        └── uploadMode === 'presigned'（CF Worker）
              └── Uppy + PresignedUploadPlugin
                    ├── POST /uploads/check     → D1 去重
                    ├── POST /uploads/presign   → 获取签名 URL
                    ├── PUT  presignedUrl        → 直传 R2
                    └── POST /uploads/confirm   → D1 记录 + 返回 result.data
```
