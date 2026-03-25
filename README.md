# fork-weibo

基于 `agent/rule.md` 的分阶段实现仓库。

## 当前阶段

已完成步骤一的基础工程搭建：

- `pnpm workspace` + `turbo` Monorepo
- `apps/web` 前端开发服务器骨架
- `apps/api` 后端开发服务器骨架
- TypeScript / ESLint / Prettier / Husky 基础配置
- 环境变量示例

## 目录结构

```text
apps/
  api/      Fastify API 服务
  web/      React + Vite 前端
packages/
  eslint-config/      共享 ESLint 配置
  typescript-config/  共享 TypeScript 配置
```

## API 数据目录约定

- `apps/api/seed/*.json`：示例/初始化数据（纳入版本管理）
- `apps/api/data/*.json`：运行时数据（已在 `.gitignore` 中忽略）
- API 启动时会在 `apps/api/data` 缺失对应文件时，自动从 `apps/api/seed` 拷贝一次
- API 启动时会尝试将旧目录 `apps/api/apps/api/uploads` 的历史图片迁移到 `apps/api/uploads`

## API 缓存与限流

- 配置 `REDIS_URL` 时，API 会优先使用 Redis 进行缓存与限流
- Redis 不可用时，自动回退到内存实现（服务可继续启动）
- `GET /health` 会返回当前 `cache` 与 `rateLimit.backend` 的实际后端类型

## 启动

```bash
pnpm install
pnpm dev
```

## 维护命令

```bash
pnpm cleanup:legacy-storage -- --dry-run
pnpm cleanup:legacy-storage
```
