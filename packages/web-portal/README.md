# web-portal

基于 Next.js App Router 的多角色前端，现已支持：

- 业务账号登录
- 存证详情查看
- MetaMask 钱包连接
- 一键切换到以太坊测试链 `Sepolia`

## 目录结构

- `app/`：App Router 页面
- `components/`：复用组件
- `lib/`：前端 API 调用和钱包工具
- `public/`：静态资源

## 运行配置
<<<<<<< HEAD

复制 `.env.example` 为 `.env`，至少配置：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CHAIN_NAME=Sepolia
NEXT_PUBLIC_CHAIN_RPC_URL=https://rpc.sepolia.org
NEXT_PUBLIC_CHAIN_EXPLORER_URL=https://sepolia.etherscan.io
NEXT_PUBLIC_CHAIN_CURRENCY_NAME=Ether
NEXT_PUBLIC_CHAIN_CURRENCY_SYMBOL=ETH
```
=======
- 默认监听端口：`3000`
- API 目标地址：通过 `NEXT_PUBLIC_API_BASE_URL` 设置，例子参见 `.env.example`
- 注册表单会要求填写学号/工号；当前演示白名单包含普通用户 `202202102/202202103/202202104/202202105` 与管理员 `123456`，仅这些编号可注册。
>>>>>>> 10b8759f4514ebe7165de8aab278af78fa633aaf

## 常用命令

```bash
bun install
bun run dev
bun run build
bun run start
bun run tsc
bun run lint
```

## 使用说明

- 页面右上角现在可以直接连接 MetaMask
- 如果当前不是目标测试链，会显示切换到 `Sepolia` 的按钮
- 业务存证仍由系统原有业务流程触发，钱包连接主要用于前端链环境接入和测试链交互入口
