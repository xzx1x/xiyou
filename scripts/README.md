# scripts

存放 Bun/TypeScript 脚本与自动化工具，例如：

- `setup.ts`：一键初始化依赖（安装包、生成环境变量模板、运行迁移）
- `lint.ts`：统一触发前后端/合约的 lint
- `test.ts`：串行或并行执行各模块测试
- `deploy.ts`：封装部署流程（前端构建、后端启动、合约部署等）

脚本需具备可复用、可组合的特性，按照 AGENTS.md 要求进行维护。
