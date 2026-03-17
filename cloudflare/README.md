# Media Kit — Cloudflare Workers 部署指南

## 前置条件

- Node.js >= 18
- pnpm
- Cloudflare 账号（免费即可）
- Wrangler CLI：`npm install -g wrangler`

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

# R2 凭证
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY

# Cloudflare Account ID（Dashboard 右侧边栏可见）
wrangler secret put CF_ACCOUNT_ID

# AIGNE Hub API Key（AI Image 功能需要）
wrangler secret put AIGNE_HUB_API_KEY

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
    worker.ts             # 入口：路由 + AIGNE Hub 代理
    routes/
      upload.ts           # 上传：presign / proxy-put（开发模式代理上传） / direct（FormData 上传） / confirm
      serve.ts            # 文件服务：R2 → 响应（生产用 cf.image）
      folders.ts          # 文件夹 CRUD
      status.ts           # Uploader 配置
      unsplash.ts         # Unsplash 代理
      cleanup.ts          # 定时清理过期 session
    middleware/auth.ts     # x-user-did 认证
    db/schema.ts           # Drizzle ORM 表定义
    utils/
      s3.ts               # R2 S3 兼容 API（presigned URL、multipart）
      hash.ts             # MD5 哈希、MIME 检测、SVG 净化
  frontend/               # 前端构建配置
    vite.config.ts         # Alias 指向原版源码 + shim
    src/shims/             # Blocklet SDK 替代实现
    index.html             # window.blocklet 注入
  public/                  # vite build 产物（Worker 静态资源）
  wrangler.toml            # CF Workers 配置
  migrations/              # D1 数据库迁移
  scripts/migrate-data.ts  # SQLite → D1 迁移脚本
```

前端源码复用 `blocklets/image-bin/src/`，通过 Vite alias 将 `@blocklet/*` 和 `@arcblock/*` 依赖替换为 `frontend/src/shims/` 中的轻量实现。

## 环境差异

| 特性 | 本地开发 | 线上 |
|------|---------|------|
| R2 存储 | miniflare 本地模拟 | 真实 R2 |
| D1 数据库 | 本地 SQLite | 真实 D1 |
| Presigned URL | proxy-put 代理（避免 CORS） | 直传 R2（需配 CORS） |
| 文件服务 | R2 binding 直接读取 | cf.image EXIF 剥离 + 自动 WebP |
| 图片生成 | 代理到 hub.aigne.io | 代理到 hub.aigne.io |
