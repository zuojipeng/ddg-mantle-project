const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 开始部署合约到 Mantle Testnet...\n");

  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("账户余额:", ethers.utils.formatEther(balance), "MNT\n");

  const network = await ethers.provider.getNetwork();
  console.log(`网络 Chain ID: ${network.chainId}\n`);

  // 部署 DeviceStatus 合约
  console.log("📝 部署 DeviceStatus 合约...");
  const DeviceStatus = await ethers.getContractFactory("DeviceStatus");
  const deviceStatus = await DeviceStatus.deploy();
  await deviceStatus.deployed();

  console.log("✅ DeviceStatus 合约已部署到:", deviceStatus.address);

  // 等待几个区块确认
  console.log("⏳ 等待区块确认...");
  await deviceStatus.deployTransaction.wait(3);

  // 保存合约地址
  const deploymentInfo = {
    network: "Mantle Testnet",
    chainId: network.chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      DeviceStatus: deviceStatus.address
    }
  };

  const deploymentPath = path.join(__dirname, "../docs/deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 部署信息已保存到:", deploymentPath);

  // 更新 .env 文件
  console.log("\n💡 请将以下内容添加到 .env 文件:");
  console.log(`DEVICE_STATUS_CONTRACT=${deviceStatus.address}`);

  console.log("\n✅ 部署完成！");
  console.log("\n🔍 在区块浏览器查看合约:");
  console.log(`https://explorer.sepolia.mantle.xyz/address/${deviceStatus.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


