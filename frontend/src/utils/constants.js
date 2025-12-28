export const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "";

export const CONTRACT_ABI = [
  "function registerDevice(string deviceId, string deviceName, string deviceType)",
  "function updateDeviceStatus(string deviceId, bool isOnline, uint256 temperature, uint256 cpuUsage, uint256 memoryUsage)",
  "function markDeviceAbnormal(string deviceId, bool isAbnormal, string reason)",
  "function getDevice(string deviceId) view returns (tuple(string deviceId, string deviceName, string deviceType, bool isOnline, uint256 temperature, uint256 cpuUsage, uint256 memoryUsage, uint256 lastUpdateTime, bool isAbnormal, string abnormalReason, address owner, bool exists))",
  "function getAllDeviceIds() view returns (string[])",
  "function getDeviceCount() view returns (uint256)",
  "function getDeviceHistory(string deviceId, uint256 limit) view returns (tuple(uint256 timestamp, uint256 temperature, uint256 cpuUsage, uint256 memoryUsage, bool isAbnormal)[])",
  "function grantPermission(string deviceId, address user)",
  "function revokePermission(string deviceId, address user)",
  "function checkPermission(string deviceId, address user) view returns (bool)"
];

export const MANTLE_TESTNET = {
  chainId: "0x138B", // 5003 in hex
  chainName: "Mantle Sepolia",
  nativeCurrency: {
    name: "MNT",
    symbol: "MNT",
    decimals: 18
  },
  rpcUrls: ["https://rpc.sepolia.mantle.xyz"],
  blockExplorerUrls: ["https://explorer.sepolia.mantle.xyz"]
};


