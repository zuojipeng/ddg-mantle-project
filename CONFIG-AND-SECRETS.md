# 配置与敏感信息填写位置（不要提交敏感值）

本项目 demo 跑通需要你在本机填写以下配置（这些值都**不会**被提交到 GitHub）。

## 根目录 `.env`（从 `.env.example` 复制）

- **`MANTLE_RPC_URL`**: Mantle Testnet RPC
- **`CHAIN_ID`**: 需要与 RPC 返回一致（当前环境为 **5003**）
- **`PRIVATE_KEY`**: 你的钱包私钥（32 bytes，**64位十六进制**；可带 `0x`，也可不带）
- **`OPENAI_API_KEY`**: OpenAI Key（可选；未配置会自动降级为规则分析）
- **`DEVICE_STATUS_CONTRACT`**: 部署后合约地址（运行 `npm run deploy` 输出）

## 前端 `frontend/.env`（从 `frontend/.env.example` 复制）

- **`REACT_APP_CONTRACT_ADDRESS`**: 同 `DEVICE_STATUS_CONTRACT`，填你部署出来的 `DeviceStatus` 地址


