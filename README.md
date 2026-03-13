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

## 启动

```bash
pnpm install
pnpm dev
```
