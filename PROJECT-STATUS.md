# DDG Mantle Project — 结构与现状能力总结

## 项目目标

基于 Mantle Testnet 的去中心化设备监控系统（合约存证 + 设备模拟上链 + Web 仪表盘展示）。

## 运行环境（约束）

- **Node**: 使用 `.nvmrc` 固定为 **22**
- **链**: Mantle Testnet（当前 RPC 返回 **chainId=5003**，项目已按此统一）

## 项目结构

```
DDG-Mantle-Project/
├── contracts/
│   └── DeviceStatus.sol                 # 设备状态与权限合约
├── scripts/
│   ├── deploy-contracts.js              # 部署脚本（部署输出为本地文件，不提交到 GitHub）
│   ├── verify-env.js                    # 环境校验（RPC/私钥格式/余额）
│   ├── start-frontend.js                # 启动前端（不使用 &&）
│   └── demo.js                          # 一键 demo（前端 + 模拟器）
├── src/
│   ├── agent/
│   │   └── device-simulator.js          # 设备模拟器：注册设备 + 周期上链写入状态
│   └── ai/
│       └── anomaly-detector.js          # AI 异常分析模块（可选，没 Key 自动降级规则）
├── test/
│   └── DeviceStatus.test.js             # 合约单测
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.js             # 仪表盘：统计 + 列表加载
│   │   │   ├── DeviceCard.js            # 设备卡片展示
│   │   │   ├── AlertPanel.js            # 告警面板（异常设备列表）
│   │   │   └── WalletConnect.js         # MetaMask 连接 + 切网
│   │   └── utils/
│   │       └── constants.js             # 合约 ABI + Mantle 网络参数
│   └── .env.example                     # 前端环境变量模板
├── .env.example                         # 根目录环境变量模板
├── .gitignore
├── .nvmrc
├── hardhat.config.js
├── package.json
└── README.md
```

## 已实现能力

### 智能合约（`DeviceStatus.sol`）

- **设备注册**：`registerDevice(deviceId, deviceName, deviceType)`
- **状态上链**：`updateDeviceStatus(deviceId, isOnline, temperature, cpuUsage, memoryUsage)`
- **异常标记**：`markDeviceAbnormal(deviceId, isAbnormal, reason)`
- **权限控制**：
  - 设备 owner / admin 可更新状态与标记异常
  - `getDevice` / `getDeviceHistory` 需要 `hasPermission`（owner / 被授权 / admin）
  - 授权/撤权：`grantPermission` / `revokePermission`
- **查询**：`getAllDeviceIds` / `getDeviceCount` / `getDeviceHistory`

### 设备模拟器（`src/agent/device-simulator.js`）

- 注册 3 台 mock 设备并周期上链写入状态
- 支持 demo 模式可控触发异常（离线/过热/CPU爆表/内存爆表）
- **AI/规则异常检测闭环**：将异常原因写回链上 `abnormalReason`
- 多设备共用钱包时使用交易锁，降低 nonce 冲突风险

### 前端（`frontend/`）

- MetaMask 连接与切网
- 仪表盘统计 + 设备列表展示
- 告警面板展示异常设备与原因


