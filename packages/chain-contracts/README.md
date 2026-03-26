# chain-contracts

这里是链上存证合约工程，已经调整为默认面向以太坊测试链 `Sepolia`。

## 合约

- `contracts/ConsultationEvidenceRegistry.sol`
  咨询记录哈希存证合约
- `contracts/AssessmentEvidenceRegistry.sol`
  心理测评结果哈希存证合约

## 设计原则

- 不把咨询内容或测评答案明文写上链
- 只把标准化 JSON 计算后的 `keccak256` 哈希写入链上
- 保留多次修订版本，便于展示“可追溯、不可篡改”

## 使用步骤

1. 安装依赖

```bash
cd packages/chain-contracts
bun install
```

2. 配置环境变量

把 `.env.example` 复制成 `.env`，填写：

```env
SEPOLIA_RPC_URL=https://rpc.sepolia.org
SEPOLIA_CHAIN_ID=11155111
DEPLOYER_PRIVATE_KEY=0x...
```

3. 编译合约

```bash
bun run compile
```

4. 部署到 Sepolia

```bash
bun run deploy:consultation
bun run deploy:assessment
```

如果你只是本地调试，也可以继续使用原来的本地网络别名：

```bash
bun run deploy:consultation:local
bun run deploy:assessment:local
```

5. 把部署出来的合约地址写到后端 `packages/server-api/.env`

```env
CHAIN_RPC_URL=https://rpc.sepolia.org
CHAIN_PRIVATE_KEY=0x...
CHAIN_ID=11155111
CONSULTATION_EVIDENCE_CONTRACT_ADDRESS=0x...
ASSESSMENT_EVIDENCE_CONTRACT_ADDRESS=0x...
```

## 链上保存的数据

咨询记录链上保存：

- `consultationId`
- `appointmentId`
- `recordHash`
- `revision`
- `recordedAt`
- `operator`

测评结果链上保存：

- `assessmentId`
- `assessmentType`
- `recordHash`
- `revision`
- `recordedAt`
- `operator`

真实敏感内容仍然只保存在后端数据库中。
