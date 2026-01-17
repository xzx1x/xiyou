# 校园心理咨询记录系统目录说明

本仓库按照“前端 / 后端 / 合约 / 基础设施 / 文档 / 脚本”六大模块拆分，便于后续在非区块链版本基础上迭代隐私保护与链上存证能力。

## 顶层结构
- `packages/`：Bun workspace 管理的多包目录  
  - `web-portal/`：Next.js + TypeScript 前端，承载学生、心理师、管理员三端页面  
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
