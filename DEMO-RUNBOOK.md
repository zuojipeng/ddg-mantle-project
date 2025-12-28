# Demo Runbook（黑客松演示闭环）

## Demo 目标闭环

设备模拟器（mock 设备）→ 上链写入状态 → AI/规则判断异常 → 把异常原因写回链上 → 前端读取链上数据展示设备与告警。

## 必要配置（敏感信息不进仓库）

填写位置参考：`CONFIG-AND-SECRETS.md`

- 根目录 `.env`
  - `MANTLE_RPC_URL`
  - `CHAIN_ID`（当前为 5003）
  - `PRIVATE_KEY`
  - `DEVICE_STATUS_CONTRACT`（部署后写入）
- 前端 `frontend/.env`
  - `REACT_APP_CONTRACT_ADDRESS`（同上）

## Demo 模式（可控触发异常）

在根目录 `.env` 中可增加（可选）：

- `DEMO_INTERVAL_SECONDS=10`  
  设备上报间隔（秒），用于演示快速刷新（默认 5 分钟）
- `DEMO_FORCE_ABNORMAL_DEVICE_ID=device-node-001`  
  指定哪台设备更容易触发异常
- `DEMO_FORCE_ABNORMAL_TYPE=offline|high_temperature|high_cpu|high_memory`  
  指定异常类型
- `DEMO_FORCE_ABNORMAL_PROB=1`  
  触发概率（0~1），设为 1 表示每次都触发

## AI 模块（可选）

- `OPENAI_API_KEY`：配置后会启用 AI 分析；未配置则自动降级为规则分析（demo 仍可跑通）
- `OPENAI_MODEL`：可选，默认 `gpt-4o-mini`

## 一键启动（前端 + 模拟器）

项目提供 `npm run demo`（内部不使用 `&&`），并行启动：

- 前端 dev server（`frontend/`）
- 设备模拟器（`src/agent/device-simulator.js`）


