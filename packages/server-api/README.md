# server-api

Koa + TypeScript 后端服务，统一承载认证、预约、咨询记录、消息、统计等接口逻辑，并通过 Prisma 访问 MySQL。

## 目录占位
- `src/routes/`：路由定义
- `src/controllers/`：接收请求、参数校验、响应构造
- `src/services/`：业务服务/用例处理
- `src/repositories/`：数据库访问封装
- `src/middlewares/`：鉴权、日志、限流、异常处理等中间件
- `src/schemas/`：DTO/验证规则（Zod 等）
- `src/config/`：配置与常量
- `prisma/`：`schema.prisma` 及迁移文件

## 推荐脚本（待初始化后添加）
- `bun dev`：本地热重载
- `bun run lint`：ESLint
- `bun run tsc`：类型检查
- `bun test`：Bun 测试
- `bun prisma migrate dev`：数据库迁移
