# Cloudflare Pages 部署（线上展示 URL）

> 说明：该仓库不包含任何敏感信息；请在本地或 Cloudflare 环境变量中填写需要的配置。

## 推荐方式：Cloudflare Pages 直接连接 GitHub

构建参数（建议）：

- **Framework preset**：Create React App
- **Build command**：`npm run build-frontend`
- **Build output directory**：`frontend/build`
- **Node version**：22（仓库含 `.nvmrc`）

### 必要环境变量

Cloudflare Pages 项目里设置：

- `REACT_APP_CONTRACT_ADDRESS`：线上要读取的 `DeviceStatus` 合约地址（部署后获得）

> 如果你希望每次部署自动更新合约地址，建议固定使用一个已部署合约，或将地址写入 Pages 的环境变量。


