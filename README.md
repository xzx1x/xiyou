# 校园心理咨询记录系统目录说明

本仓库按照“前端 / 后端 / 合约 / 基础设施 / 文档 / 脚本”六大模块拆分，便于后续在非区块链版本基础上迭代隐私保护与链上存证能力。

## 顶层结构
- `packages/`：Bun workspace 管理的多包目录  
  - `web-portal/`：Next.js + TypeScript 前端，承载普通用户、心理师、管理员三端页面  
  - `server-api/`：Koa + TypeScript 后端，负责接口、权限、数据库访问与后续链上对接  
  - `chain-contracts/`：Solidity 合约与 Hardhat 配置，当前可作为占位，后续补充链上逻辑
- `infra/`：本地与部署环境配置（如 `docker-compose.yml`、MySQL/Redis/对象存储示例）
- `docs/`：需求、架构、测试计划、论文资料等文档
- `scripts/`：Bun 脚本与自动化工具（初始化、lint、测试、部署等）
- `tests/`：端到端/集成测试用例与公共测试脚本
- `doc/`：用户原有文档（保留）

## 建议初始化流程
1. 在根目录执行 `bun init` 并配置 workspace：`"workspaces": ["packages/*"]`
2. 进入 `packages/web-portal` 执行 `bun create next . --ts`，完成基础前端脚手架
3. 进入 `packages/server-api` 执行 `bun init`, 安装 `koa`, `prisma`, `mysql2` 等依赖，并在 `prisma/` 内定义模型
4. 进入 `packages/chain-contracts` 执行 `bun init` + `bun add hardhat`, 创建合约占位
5. 在 `infra/` 编写 `docker-compose.yml`，包含 MySQL、Redis 及后续所需服务
6. 在 `docs/` 填写需求与架构说明（如 `architecture.md`、`requirements.md`）
7. 在 `scripts/` 新增常用命令脚本（如 `bun scripts/setup.ts` 用于一键初始化）

完成以上步骤后即可先行开发非区块链版本，再逐步将链上存证、零知识等模块接入。***

## 运行端口规划
- Web Portal（Next.js）：<http://localhost:3000>
- Server API（Koa）：<http://localhost:3001>
- MySQL：`localhost:3306`

## 本地运行速查
1. **准备 MySQL**：可直接使用本地 MySQL 或 `docker run --name campus-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=campus -d mysql:8`. 服务启动后，后端会在第一次连接时自动创建 `campus_chain` 数据库与 `users` 表。
2. **启动后端**
   ```bash
   cd packages/server-api
   bun install
   cp .env.example .env # 根据需要调整
   bun run dev
   ```
3. **启动前端**
   ```bash
   cd packages/web-portal
   bun install
   cp .env.example .env # 若未配置则默认指向 http://localhost:3001
   bun run dev
   ```

前后端分别监听 3000/3001 端口，可在本地直接访问 <http://localhost:3000> 体验登录/注册流程，表单会调用 `server-api` 的 `/api/auth/*` 接口，并通过自动初始化的 MySQL 完成数据落库。

### 身份识别规则
- 注册时需提供学号/工号（`identity_code`），系统会写入 `users.identity_code` 并保持唯一。
- 合法编号由 `identity_whitelist` 表维护，默认内置普通用户学号 `202202102 / 202202103 / 202202104` 与管理员学号 `123456`。可在该表追加或修改白名单以扩展更多校园身份。
- 白名单记录同时携带 `default_role`，注册成功后自动取用该角色；心理师身份不能直接注册，需要以普通用户身份登录后在站内提交申请，由管理员审核通过后方可切换。
