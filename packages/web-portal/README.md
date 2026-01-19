# web-portal

基于 Next.js App Router 的多角色入口，已内置登录/注册视图并与 Koa 后端打通。代码由 Bun 管理，可继续扩展普通用户、心理师、管理员三套工作台。

## 目录结构
- `app/`：App Router 页面（含 `/login`、`/register` 等）
- `components/`：复用组件（例如认证表单）
- `lib/`：前端 API 调用与类型
- `public/`：静态资源

## 运行配置
- 默认监听端口：`3000`
- API 目标地址：通过 `NEXT_PUBLIC_API_BASE_URL` 设置，例子参见 `.env.example`
- 注册表单会要求填写学号/工号；当前演示白名单包含普通用户 `202202102/202202103/202202104` 与管理员 `123456`，仅这些编号可注册。

## 常用命令
```bash
# 安装依赖
bun install

# 开发模式
bun run dev

# 生产构建与启动
bun run build
bun run start

# 类型检查 / Lint
bun run tsc
bun run lint
```

启动前请确保后端 `server-api` 已运行（默认 `http://localhost:3001`），否则前端的登录/注册请求会失败。
