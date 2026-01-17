# infra

用于存放本地/部署环境依赖配置（Docker、容器编排、证书等）。

## 建议内容
- `docker-compose.yml`：MySQL、Redis、对象存储、消息服务、零知识/同态模块等依赖
- `env/`（可选）：各环境的 `.env` 模板及密钥管理指引
- `traefik/` 或 `nginx/`（可选）：反向代理、HTTPS 证书配置
- `k8s/`（可选）：Kubernetes 部署清单

初始化时可先创建 `docker-compose.yml`，定义 MySQL + Redis，方便非区块链版本的快速启动。
