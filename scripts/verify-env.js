const { ethers } = require("ethers");
require("dotenv").config();

function sanitizePrivateKey(raw) {
  if (!raw) return "";
  const key = raw.trim().startsWith("0x") ? raw.trim().slice(2) : raw.trim();
  return key;
}

async function verifyEnvironment() {
  console.log("🔍 验证环境配置...\n");

  // 1. 检查环境变量
  const requiredVars = ["MANTLE_RPC_URL", "PRIVATE_KEY"];
  const missingVars = requiredVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    console.error("❌ 缺少环境变量:", missingVars.join(", "));
    console.log("请复制 .env.example 为 .env 并填写配置");
    process.exit(1);
  }
  console.log("✅ 环境变量配置完整");

  // 1.1 校验私钥格式（允许带/不带 0x）
  const privateKey = sanitizePrivateKey(process.env.PRIVATE_KEY);
  if (!/^[0-9a-fA-F]{64}$/.test(privateKey)) {
    console.error("❌ PRIVATE_KEY 格式不正确：需要 64 位十六进制（32 bytes）");
    console.log("请在根目录 .env 中填写 PRIVATE_KEY（可带 0x，也可不带）");
    process.exit(1);
  }

  // 2. 测试RPC连接
  try {
    const provider = new ethers.providers.JsonRpcProvider(process.env.MANTLE_RPC_URL);
    const network = await provider.getNetwork();
    console.log(`✅ 成功连接到 Mantle Testnet (Chain ID: ${network.chainId})`);

    if (process.env.CHAIN_ID && Number(process.env.CHAIN_ID) !== network.chainId) {
      console.log(
        `\n⚠️  警告: .env 的 CHAIN_ID=${process.env.CHAIN_ID} 与 RPC 返回的 Chain ID=${network.chainId} 不一致`
      );
    }

    // 3. 检查钱包余额
    const wallet = new ethers.Wallet(`0x${privateKey}`, provider);
    const balance = await wallet.getBalance();
    console.log(`✅ 钱包地址: ${wallet.address}`);
    console.log(`✅ 钱包余额: ${ethers.utils.formatEther(balance)} MNT`);

    if (balance.eq(0)) {
      console.log("\n⚠️  警告: 钱包余额为0，请从水龙头获取测试币:");
      console.log("   https://faucet.testnet.mantle.xyz");
    }
  } catch (error) {
    console.error("❌ RPC连接失败:", error.message);
    process.exit(1);
  }

  console.log("\n✅ 环境验证通过！可以开始开发了。\n");
}

verifyEnvironment();


