# tests

集中管理端到端、集成、性能及安全测试。建议结构：

- `e2e/`：模拟学生/心理师/管理员完整流程
- `api/`：对 `server-api` 的接口测试（Bun test / supertest）
- `performance/`：并发与负载脚本
- `security/`：权限、登录、数据泄露等专项用例

所有测试统一通过 `bun test` 或自定义脚本触发，并在 CI 中执行。
