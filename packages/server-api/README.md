# server-api

Koa + TypeScript 后端服务，统一承载认证、预约、咨询记录、消息、统计等接口逻辑，并通过 `mysql2` 访问 MySQL。

## 目录结构
- `src/routes/`：路由定义
- `src/controllers/`：接收请求、参数校验、响应构造
- `src/services/`：业务服务/用例处理
- `src/repositories/`：数据库访问封装
- `src/middlewares/`：鉴权、日志、限流、异常处理等中间件
- `src/schemas/`：DTO/验证规则（Zod 等）
- `src/config/`：配置与常量
- `src/utils/`：工具与错误类型
- `infra/mysql-init.sql`：数据库建表脚本

## 环境变量
复制 `.env.example` 为 `.env` 并设置：
- `DATABASE_URL`：MySQL 连接串
- `PORT`：服务监听端口
- `JWT_SECRET`：签发登录 Token 的密钥

## 运行端口
- HTTP API：默认监听 `PORT`（不配置时为 `3001`）
- MySQL：建议沿用 `3306`

## 常用脚本
- `bun run dev`：开发模式（支持热重载）
- `bun run start`：生产启动
- `bun run tsc`：TypeScript 类型检查

## 数据库初始化
启动服务时会根据 `DATABASE_URL` 自动创建库以及 `users` / `identity_whitelist` 两张表，并写入示例身份白名单。若需要预先查看建表脚本，可参阅 `infra/mysql-init.sql`。

## 身份识别与角色切换
- `users.identity_code`：存储唯一的学号/工号，注册时必须填写。
- `identity_whitelist`：维护允许注册的学号/工号及默认角色。示例数据包括普通用户 `202202102 / 202202103 / 202202104` 与管理员 `123456`，可按需扩展。
- 心理咨询师（`COUNSELOR`）无法直接注册，必须由普通用户登录后在站内提出申请，再由管理员审核并更新角色（后续可在服务层扩展对应接口）。
