# Media Kit — Cloudflare Workers 部署指南

## 前置条件

- Node.js >= 18
- pnpm
- Cloudflare 账号（免费即可）
- Wrangler CLI：`npm install -g wrangler`
- DID service（blocklet-service）已部署为 CF Worker

## 一次性初始化（首次部署）

### 1. 登录 Cloudflare

```bash
wrangler login
```

### 2. 创建 D1 数据库

```bash
wrangler d1 create media-kit-db
```

输出中的 `database_id` 填入 `wrangler.toml` 的 `[[d1_databases]]` 节的 `database_id`。

### 3. 创建 R2 Bucket

先在 Dashboard 激活 R2 服务（R2 → 激活），然后：

```bash
wrangler r2 bucket create media-kit-uploads
```

### 4. 配置 R2 CORS

Dashboard → R2 → media-kit-uploads → 设置 → CORS 策略，添加：

```json
[
  {
    "AllowedOrigins": ["https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 86400
  }
]
```

`AllowedOrigins` 填实际部署的域名。

### 5. 生成 R2 API Token

Dashboard → R2 → 管理 R2 API 令牌 → 创建 API 令牌：
- 权限：对象读和写
- Bucket：media-kit-uploads
- 记录 `Access Key ID` 和 `Secret Access Key`

### 6. 配置 Secrets

```bash
cd cloudflare

# APP_SK — 用于在 DID service 中注册 instance（自动派生 instance DID）
# 生成方法：node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
wrangler secret put APP_SK

# R2 凭证
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY

# Cloudflare Account ID（Dashboard 右侧边栏可见）
wrangler secret put CF_ACCOUNT_ID

# AIGNE Hub（AI Image 功能需要）
wrangler secret put AIGNE_HUB_API_KEY

# 可选：挂载子路径（默认 /，即根路径）
# wrangler secret put APP_PREFIX   # 例如 /media-kit

# 可选：Unsplash API
wrangler secret put UNSPLASH_KEY
wrangler secret put UNSPLASH_SECRET
```

### 7. 应用数据库迁移

```bash
wrangler d1 migrations apply media-kit-db --remote
```

## 部署

```bash
cd cloudflare

# 构建前端 + 部署 Worker
npm run deploy
```

等价于：
```bash
cd cloudflare/frontend && npx vite build   # 构建前端到 cloudflare/public/
cd cloudflare && wrangler deploy           # 部署 Worker + 静态资源
```

部署后访问 `https://media-kit.<your-subdomain>.workers.dev`

## 认证架构

Media Kit 通过 CF Service Binding 对接 DID service（blocklet-service）进行用户认证。

```
用户请求（带 login_token cookie）
    ↓
media-kit Worker
    ↓ AUTH_SERVICE.resolveIdentity(jwt, authHeader, instanceDid)
blocklet-service Worker（Service Binding，零网络延迟）
    ↓ 返回 { did, role, displayName }
media-kit 设置 user context → 处理请求
```

### 关键配置

```toml
# wrangler.toml

# Service Binding 到 DID service
[[services]]
binding = "AUTH_SERVICE"
service = "blocklet-service"
entrypoint = "BlockletServiceRPC"
```

### 自动注册

Worker 首次启动时通过 `AUTH_SERVICE.registerApp()` 自动注册 instance：
- 从 `APP_SK`（secret）派生 instance DID
- 无需手动配置 `APP_PID` — 自动从 APP_SK 生成

### 认证流程

1. 用户访问 `/` → 未登录时 302 到 `/.well-known/service/login`
2. DID service 提供登录页（passkey / wallet / email）
3. 登录成功 → 设置 `login_token` cookie → 重定向回 media-kit
4. media-kit auth middleware 从 cookie 提取 JWT → 调用 `AUTH_SERVICE.resolveIdentity()` 验证
5. JWT 验证结果缓存 5 分钟（避免重复 RPC 调用）

### 路由代理

| 路径 | 处理方式 |
|------|---------|
| `/.well-known/service/*` | 代理到 AUTH_SERVICE（登录页、session API、管理后台） |
| `/api/did/*` | 代理到 AUTH_SERVICE（login/session/logout） |
| `/__blocklet__.js` | Worker 生成（合并 AUTH_SERVICE 元数据） |
| `/api/uploader/status` | 无需认证 — 返回 uploader 配置 |
| `/api/*`（其他） | 需要认证 |

## Prefix 支持

Media Kit 支持挂载在子路径下运行，通过 `APP_PREFIX` secret 配置：

```bash
wrangler secret put APP_PREFIX   # 输入如 /media-kit 或 /media-kit/
```

不设置时默认为 `/`（根路径）。尾部斜杠自动 normalize。配置后：
- 访问 `/media-kit/admin` → media-kit 管理页面
- 访问 `/media-kit/api/*` → media-kit API
- 访问 `/media-kit/__blocklet__.js` → 返回正确的 prefix 配置
- 访问 `/` → 自动重定向到 `/media-kit/admin`（已登录）或登录页（未登录）

Prefix 也支持通过 gateway Worker 的 `X-Mount-Prefix` header 动态设置。

**注意**：`/.well-known/service/*` 是全局认证服务路径，不加 prefix。

## 数据迁移（从 Blocklet Server 迁移）

如果需要从现有 Blocklet Server 迁移数据：

### 1. 迁移文件（本地磁盘/S3 → R2）

```bash
# 使用 rclone 同步文件
rclone sync /path/to/blocklet/uploads r2:media-kit-uploads/

# 如果源是 S3
rclone sync s3:old-bucket r2:media-kit-uploads/
```

### 2. 迁移数据库（SQLite → D1）

```bash
cd cloudflare

# 先试运行看数据量
npx tsx scripts/migrate-data.ts --source /path/to/media-kit.db --dry-run

# 正式迁移
npx tsx scripts/migrate-data.ts --source /path/to/media-kit.db --d1-name media-kit-db
```

### 3. 切换 DNS

确认迁移数据完整后，将域名 DNS 指向 Cloudflare Workers。

## CI/CD 集成

GitHub Actions 示例：

```yaml
name: Deploy Media Kit
on:
  push:
    branches: [main]
    paths: ['cloudflare/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install -g pnpm
      - run: cd cloudflare/frontend && pnpm install && npx vite build
      - run: cd cloudflare && npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

在 GitHub repo Settings → Secrets 里添加 `CF_API_TOKEN`（Dashboard → My Profile → API Tokens → Create Token）。

## 本地开发

```bash
cd cloudflare

# 创建 .dev.vars 文件
cat > .dev.vars << 'EOF'
ENVIRONMENT=development
APP_SK=<64-byte-hex-secret-key>
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
CF_ACCOUNT_ID=your-account-id
AIGNE_HUB_API_KEY=your-aigne-key
EOF

# 初始化本地数据库
npm run db:migrate:local

# 启动 Worker（终端 1）
npm run dev

# 启动前端开发服务器（终端 2）
cd frontend && npx vite --port 3030
```

## 架构说明

```
cloudflare/
  src/                    # CF Worker 后端（Hono + D1 + R2）
    worker.ts             # 入口：prefix strip、root redirect、auth proxy、路由、SPA fallback
    routes/
      upload.ts           # 上传：presign / proxy-put / direct / confirm
      serve.ts            # 文件服务：R2 → 响应（生产用 cf.image）
      folders.ts          # 文件夹 CRUD
      status.ts           # Uploader 配置（uploadMode: presigned）
      unsplash.ts         # Unsplash 代理
      cleanup.ts          # 定时清理过期 session + AI 临时图片
    middleware/auth.ts     # AUTH_SERVICE RPC 认证 + JWT 缓存
    db/schema.ts           # Drizzle ORM 表定义
    types.ts               # Env、CallerIdentityDTO、UserContext 类型
    utils/
      s3.ts               # R2 S3 兼容 API（presigned URL、multipart）
      hash.ts             # MD5 哈希、MIME 检测、SVG 净化
  frontend/               # 前端构建配置
    vite.config.ts         # Alias 指向原版源码 + shim
    src/shims/             # Blocklet SDK 替代实现
    index.html             # window.blocklet 默认值 + __blocklet__.js 加载
  public/                  # vite build 产物（Worker 静态资源）
  wrangler.toml            # CF Workers 配置（Service Binding、prefix 等）
  migrations/              # D1 数据库迁移
  scripts/migrate-data.ts  # SQLite → D1 迁移脚本
```

前端源码复用 `blocklets/image-bin/src/`，通过 Vite alias 将依赖 Blocklet Server 运行时的包替换为 shim：
- `@blocklet/js-sdk` → createAxios shim（axios + withCredentials）
- `@blocklet/ui-react` → Dashboard（含 Header）/ Header / Footer / ComponentInstaller shim
- `@arcblock/did-connect-react` → SessionProvider（真实 DID Connect session via cookie）/ ConnectButton shim

`@arcblock/ux` 和 `@arcblock/did` 直接使用原包（纯 UI 组件，无 Blocklet Server 依赖）。

## 环境差异

| 特性 | 本地开发 | 线上 |
|------|---------|------|
| 认证 | AUTH_SERVICE Service Binding（需本地运行 blocklet-service） | AUTH_SERVICE Service Binding |
| R2 存储 | miniflare 本地模拟 | 真实 R2 |
| D1 数据库 | 本地 SQLite | 真实 D1 |
| Presigned URL | proxy-put 代理（避免 CORS） | 直传 R2（需配 CORS） |
| 文件服务 | R2 binding 直接读取 | cf.image EXIF 剥离 + 自动 WebP |
| AI 图片生成 | 代理到 hub.aigne.io，临时缓存到 R2 tmp/ai/ | 同左，cron 每小时清理 24h 前的临时文件 |
