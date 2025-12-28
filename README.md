# 🛡️ DDG - Decentralized Device Guardian

基于 Mantle（chainId **5003**）的去中心化设备监控系统：**设备状态上链存证 + 权限控制 + AI/规则异常检测 + 前端仪表盘展示**。

## 特性

- ✅ 去中心化身份与权限管理
- ✅ 设备数据上链存储
- ✅ AI驱动的异常检测
- ✅ 实时监控仪表盘
- ✅ 历史数据可追溯

## Demo 闭环（演示路径）

**设备模拟器（mock 设备）→ 上链写入状态 → AI/规则判断异常 → 异常原因写回链上 → 前端读取链上数据展示设备与告警**。

## 快速开始

### 前置要求

- Node.js **22**（仓库提供 `.nvmrc`，建议 `nvm use`）
- MetaMask 钱包
- Mantle 测试网测试币（用于部署与上链写入）

### 安装

```bash
# 克隆仓库
git clone https://github.com/zuojipeng/ddg-mantle-project
cd ddg-mantle-project

# 使用 Node 22
nvm use

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env（敏感信息不要提交）
```

### 填写配置（重要）

敏感信息与配置填写位置请看：`CONFIG-AND-SECRETS.md`

### 环境校验

```bash
npm run verify-env
```

### 部署合约

```bash
# 编译合约
npm run compile

# 部署到Mantle测试网
npm run deploy
```

部署成功后会生成**本地**部署输出（不会提交到 GitHub），里面包含合约地址。把合约地址同步到：

- 根目录 `.env` 的 `DEVICE_STATUS_CONTRACT`
- 前端 `frontend/.env` 的 `REACT_APP_CONTRACT_ADDRESS`

### 一键启动 Demo（推荐）

```bash
npm run demo
```

## 项目结构

```
DDG-Mantle-Project/
├── contracts/          # 智能合约
├── scripts/            # 部署脚本
├── src/
│   ├── agent/         # 设备模拟器
│   └── ai/            # AI异常检测
├── frontend/          # React前端
├── test/              # 测试文件
└── (docs/ 目录本地使用，不提交到 GitHub)
```


## 重要说明（权限）

合约读取接口带权限校验：默认只有 **owner**（部署/注册设备的地址）能读到设备详情。  

## 技术栈

- **区块链**: Mantle Testnet
- **智能合约**: Solidity 0.8.19
- **前端**: React + Material-UI
- **后端**: Node.js
- **AI**: OpenAI（可选；未配置 Key 会自动降级为规则分析）

## 常见问题（Troubleshooting）

- **前端显示 0 台设备**：
  - 确认 MetaMask 连接到了正确网络（chainId 与页面提示一致）
  - 确认 `frontend/.env` 的 `REACT_APP_CONTRACT_ADDRESS` 是最新部署地址
  - 确认用的是部署/注册设备的同一钱包账号
- **部署报 chainId 不一致**：
  - 以 RPC 实际返回为准，`.env` 的 `CHAIN_ID` 需一致

## 文档（仓库根目录）

- `PROJECT-STATUS.md`：整体结构与现状能力
- `TALK.md`：现场演讲稿
- `CLOUDFLARE-PAGES.md`：Cloudflare Pages 线上部署说明

## License

MIT



