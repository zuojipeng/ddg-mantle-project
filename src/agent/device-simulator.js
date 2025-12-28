const { ethers } = require("ethers");
require("dotenv").config();
const AnomalyDetector = require("../ai/anomaly-detector");

// 配置
const RPC_URL = process.env.MANTLE_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.DEVICE_STATUS_CONTRACT;

const detector = new AnomalyDetector();

const DEMO_INTERVAL_SECONDS = Number(process.env.DEMO_INTERVAL_SECONDS || "");
const UPLOAD_INTERVAL_MINUTES = Number(process.env.UPLOAD_INTERVAL_MINUTES || "");
const DEFAULT_INTERVAL_MS =
  Number.isFinite(DEMO_INTERVAL_SECONDS) && DEMO_INTERVAL_SECONDS > 0
    ? DEMO_INTERVAL_SECONDS * 1000
    : Number.isFinite(UPLOAD_INTERVAL_MINUTES) && UPLOAD_INTERVAL_MINUTES > 0
      ? UPLOAD_INTERVAL_MINUTES * 60 * 1000
      : 5 * 60 * 1000;

const DEMO_FORCE_ABNORMAL_DEVICE_ID = process.env.DEMO_FORCE_ABNORMAL_DEVICE_ID || "";
const DEMO_FORCE_ABNORMAL_TYPE = process.env.DEMO_FORCE_ABNORMAL_TYPE || ""; // offline|high_temperature|high_cpu|high_memory
const DEMO_FORCE_ABNORMAL_PROB = Number(process.env.DEMO_FORCE_ABNORMAL_PROB || "0"); // 0~1

// 全局交易锁：避免多个设备共用同一钱包时 nonce 冲突（replacement underpriced）
let txLock = Promise.resolve();
function withTxLock(fn) {
  const next = txLock.then(fn, fn);
  txLock = next.catch(() => {});
  return next;
}

// 合约ABI (简化版，只包含需要的方法)
const CONTRACT_ABI = [
  "function registerDevice(string deviceId, string deviceName, string deviceType)",
  "function updateDeviceStatus(string deviceId, bool isOnline, uint256 temperature, uint256 cpuUsage, uint256 memoryUsage)",
  "function markDeviceAbnormal(string deviceId, bool isAbnormal, string reason)",
  "function getDevice(string deviceId) view returns (tuple(string deviceId, string deviceName, string deviceType, bool isOnline, uint256 temperature, uint256 cpuUsage, uint256 memoryUsage, uint256 lastUpdateTime, bool isAbnormal, string abnormalReason, address owner, bool exists))"
];

class DeviceSimulator {
  constructor(deviceId, deviceName, deviceType) {
    this.deviceId = deviceId;
    this.deviceName = deviceName;
    this.deviceType = deviceType;

    // 初始化provider和wallet
    this.provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    this.wallet = new ethers.Wallet(PRIVATE_KEY, this.provider);
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.wallet);

    // 设备状态
    this.isOnline = true;
    this.baseTemperature = 45; // 基础温度 45°C
    this.baseCpuUsage = 30; // 基础CPU使用率 30%
    this.baseMemoryUsage = 50; // 基础内存使用率 50%
    this.lastMarkedAbnormal = false;

    console.log(`📱 设备模拟器已初始化: ${deviceName} (${deviceId})`);
  }

  // 注册设备
  async register() {
    try {
      console.log(`\n📝 注册设备: ${this.deviceId}...`);
      await withTxLock(async () => {
        const tx = await this.contract.registerDevice(
          this.deviceId,
          this.deviceName,
          this.deviceType
        );
        await tx.wait();
        console.log(`✅ 设备注册成功! Tx: ${tx.hash}`);
      });
    } catch (error) {
      if (error.message.includes("already registered")) {
        console.log("ℹ️  设备已注册，跳过");
      } else {
        console.error("❌ 注册失败:", error.message);
      }
    }
  }

  // 生成随机设备数据
  generateData() {
    // 温度: 基础温度 ± 15°C 的随机波动
    const tempVariation = (Math.random() - 0.5) * 30;
    const temperature = Math.max(20, Math.min(100, this.baseTemperature + tempVariation));

    // CPU使用率: 基础使用率 ± 30% 的随机波动
    const cpuVariation = (Math.random() - 0.5) * 60;
    const cpuUsage = Math.max(0, Math.min(100, this.baseCpuUsage + cpuVariation));

    // 内存使用率: 基础使用率 ± 20% 的随机波动
    const memVariation = (Math.random() - 0.5) * 40;
    const memoryUsage = Math.max(0, Math.min(100, this.baseMemoryUsage + memVariation));

    // 在线状态: 95% 概率在线
    this.isOnline = Math.random() > 0.05;

    const payload = {
      temperature: Math.floor(temperature * 100), // 转换为整数 (实际温度 * 100)
      cpuUsage: Math.floor(cpuUsage * 100),
      memoryUsage: Math.floor(memoryUsage * 100)
    };

    this.applyDemoOverrides(payload);

    return payload;
  }

  // demo 模式：可控触发异常（方便现场演示）
  applyDemoOverrides(payload) {
    if (!DEMO_FORCE_ABNORMAL_DEVICE_ID || this.deviceId !== DEMO_FORCE_ABNORMAL_DEVICE_ID) return;
    if (!DEMO_FORCE_ABNORMAL_TYPE) return;

    // 概率控制：默认 0 表示不强制；设置 1 表示每次都触发
    if (!(DEMO_FORCE_ABNORMAL_PROB > 0) || Math.random() > DEMO_FORCE_ABNORMAL_PROB) return;

    switch (DEMO_FORCE_ABNORMAL_TYPE) {
      case "offline":
        this.isOnline = false;
        break;
      case "high_temperature":
        payload.temperature = 9500; // 95°C
        break;
      case "high_cpu":
        payload.cpuUsage = 9900; // 99%
        break;
      case "high_memory":
        payload.memoryUsage = 9900; // 99%
        break;
      default:
        break;
    }
  }

  // 上传设备状态到链上
  async uploadStatus() {
    try {
      const data = this.generateData();

      console.log(`\n📊 上传设备状态: ${this.deviceId}`);
      console.log(`   在线: ${this.isOnline ? "✅" : "❌"}`);
      console.log(`   温度: ${(data.temperature / 100).toFixed(1)}°C`);
      console.log(`   CPU: ${(data.cpuUsage / 100).toFixed(1)}%`);
      console.log(`   内存: ${(data.memoryUsage / 100).toFixed(1)}%`);

      await withTxLock(async () => {
        const tx = await this.contract.updateDeviceStatus(
          this.deviceId,
          this.isOnline,
          data.temperature,
          data.cpuUsage,
          data.memoryUsage
        );
        await tx.wait();
        console.log(`✅ 状态上传成功! Tx: ${tx.hash}`);
      });

      // AI/规则异常检测，并把结论写回链上 abnormalReason
      await this.checkAbnormalWithAI(data);
    } catch (error) {
      console.error("❌ 状态上传失败:", error.message);
    }
  }

  formatOnchainReason(analysis) {
    const sev = analysis.severity || "warning";
    const reason = analysis.reason || "检测到异常";
    const recs = Array.isArray(analysis.recommendations) ? analysis.recommendations : [];
    const recStr = recs.length ? ` | 建议: ${recs.slice(0, 3).join("; ")}` : "";
    // 控制长度，避免异常原因过长导致 gas 浪费
    const msg = `[${sev}] ${reason}${recStr}`;
    return msg.length > 240 ? msg.slice(0, 240) : msg;
  }

  // 检查异常情况（AI/规则）
  async checkAbnormalWithAI(data) {
    const deviceData = {
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      deviceType: this.deviceType,
      isOnline: this.isOnline,
      temperature: data.temperature,
      cpuUsage: data.cpuUsage,
      memoryUsage: data.memoryUsage
    };

    const analysis = await detector.analyzeDeviceData(deviceData);

    if (analysis.isAbnormal) {
      const reason = this.formatOnchainReason(analysis);
      console.log(`⚠️  AI/规则检测到异常: ${reason}`);
      try {
        await withTxLock(async () => {
          const tx = await this.contract.markDeviceAbnormal(this.deviceId, true, reason);
          await tx.wait();
          console.log("✅ 异常状态已标记");
        });
        this.lastMarkedAbnormal = true;
      } catch (error) {
        console.error("❌ 标记异常失败:", error.message);
      }
      return;
    }

    // 如上一次标记过异常，本次恢复正常则清除一次（避免每轮都发交易）
    if (this.lastMarkedAbnormal) {
      try {
        await withTxLock(async () => {
          const tx = await this.contract.markDeviceAbnormal(this.deviceId, false, "");
          await tx.wait();
          console.log("✅ 异常状态已清除");
        });
        this.lastMarkedAbnormal = false;
      } catch (error) {
        console.error("❌ 清除异常失败:", error.message);
      }
    }
  }

  // 启动周期性数据上传
  async start(intervalMs = DEFAULT_INTERVAL_MS) {
    const mins = (intervalMs / 60000).toFixed(2);
    console.log(`\n🚀 启动设备模拟器，上传间隔: ${mins} 分钟`);

    // 首次上传
    await this.uploadStatus();

    // 定期上传
    setInterval(async () => {
      await this.uploadStatus();
    }, intervalMs);
  }
}

// 主程序
async function main() {
  console.log("=".repeat(60));
  console.log("🤖 DDG 设备模拟器");
  console.log("=".repeat(60));

  // 创建多个模拟设备
  const devices = [
    new DeviceSimulator("device-server-001", "Production Server Alpha", "Server"),
    new DeviceSimulator("device-iot-001", "Temperature Sensor #1", "IoT"),
    new DeviceSimulator("device-node-001", "Blockchain Node #1", "Web3Node")
  ];

  // 注册所有设备
  for (const device of devices) {
    await device.register();
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 等待2秒避免nonce冲突
  }

  console.log("\n✅ 所有设备注册完成!\n");

  // 启动所有设备的数据上传
  for (const device of devices) {
    device.start(DEFAULT_INTERVAL_MS);
  }

  console.log("\n✨ 模拟器运行中... 按 Ctrl+C 停止\n");
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = DeviceSimulator;


