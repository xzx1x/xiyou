# chain-contracts

Solidity 合约与 Hardhat 脚手架的占位目录，用于实现身份凭证、咨询记录存证、审计与密钥托管等链上逻辑。

## 目录占位
- `contracts/`：Solidity 源码
- `scripts/`：部署与运维脚本
- `test/`：Hardhat/Chai 测试
- `deploy/`：部署参数与网络配置

## 初始化建议
1. `bun init -y` 并安装依赖：`bun add hardhat @nomicfoundation/hardhat-toolbox`
2. 执行 `bunx hardhat` 生成示例工程
3. 在 `contracts/` 中逐步添加身份合约、存证合约等
4. 配置 `.env` 与 `hardhat.config.ts`，适配联盟链或 Quorum/Fabric 网关
