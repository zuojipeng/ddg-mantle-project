import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress
} from "@mui/material";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../utils/constants";
import DeviceCard from "./DeviceCard";
import WalletConnect from "./WalletConnect";
import AlertPanel from "./AlertPanel";

function Dashboard() {
  const [account, setAccount] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [networkInfo, setNetworkInfo] = useState({ chainId: null, hasCode: null });
  const [loadError, setLoadError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    offline: 0,
    abnormal: 0
  });

  useEffect(() => {
    if (account) {
      loadDevices();
      const interval = setInterval(loadDevices, 30000); // 每30秒刷新
      return () => clearInterval(interval);
    }
  }, [account]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setLoadError("");

      if (!CONTRACT_ADDRESS) {
        setDevices([]);
        setStats({ total: 0, online: 0, offline: 0, abnormal: 0 });
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const net = await provider.getNetwork();
      const code = await provider.getCode(CONTRACT_ADDRESS);
      const hasCode = code && code !== "0x";
      setNetworkInfo({ chainId: net.chainId, hasCode });

      if (!hasCode) {
        setDevices([]);
        setStats({ total: 0, online: 0, offline: 0, abnormal: 0 });
        setLoadError(
          `合约地址在当前网络上没有代码（可能连错链）。当前 chainId=${net.chainId}，合约=${CONTRACT_ADDRESS}`
        );
        return;
      }

      // 关键：用 signer 发起 eth_call，保证 msg.sender 是当前钱包地址（合约里 hasPermission 依赖 msg.sender）
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // 获取所有设备ID
      const deviceIds = await contract.getAllDeviceIds();

      // 获取每个设备的详细信息
      const devicePromises = deviceIds.map(async (id) => {
        try {
          const device = await contract.getDevice(id);
          return {
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            deviceType: device.deviceType,
            isOnline: device.isOnline,
            temperature: device.temperature.toNumber() / 100,
            cpuUsage: device.cpuUsage.toNumber() / 100,
            memoryUsage: device.memoryUsage.toNumber() / 100,
            lastUpdateTime: new Date(device.lastUpdateTime.toNumber() * 1000),
            isAbnormal: device.isAbnormal,
            abnormalReason: device.abnormalReason,
            owner: device.owner
          };
        } catch (err) {
          console.error(`Failed to load device ${id}:`, err);
          return null;
        }
      });

      const loadedDevices = (await Promise.all(devicePromises)).filter((d) => d !== null);
      setDevices(loadedDevices);

      // 计算统计数据
      const newStats = {
        total: loadedDevices.length,
        online: loadedDevices.filter((d) => d.isOnline).length,
        offline: loadedDevices.filter((d) => !d.isOnline).length,
        abnormal: loadedDevices.filter((d) => d.isAbnormal).length
      };
      setStats(newStats);
    } catch (err) {
      console.error("Error loading devices:", err);
      setLoadError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        🛡️ DDG 设备监控系统
      </Typography>

      <WalletConnect onConnect={setAccount} />

      {account && (
        <>
          {/* 统计卡片 */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    设备总数
                  </Typography>
                  <Typography variant="h4">{stats.total}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "#e8f5e9" }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    在线设备
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {stats.online}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "#fafafa" }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    离线设备
                  </Typography>
                  <Typography variant="h4">{stats.offline}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: "#ffebee" }}>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    异常设备
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {stats.abnormal}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {!CONTRACT_ADDRESS && (
            <Box sx={{ my: 2 }}>
              <Typography color="error">
                未配置合约地址：请在 frontend/.env 填写 REACT_APP_CONTRACT_ADDRESS
              </Typography>
            </Box>
          )}

          {CONTRACT_ADDRESS && (
            <Box sx={{ my: 1 }}>
              <Typography variant="caption" color="textSecondary">
                chainId: {networkInfo.chainId ?? "-"} • 合约: {CONTRACT_ADDRESS} •
                code: {networkInfo.hasCode === null ? "-" : networkInfo.hasCode ? "yes" : "no"}
              </Typography>
            </Box>
          )}

          {loadError && (
            <Box sx={{ my: 2 }}>
              <Typography color="error">{loadError}</Typography>
            </Box>
          )}

          <AlertPanel devices={devices} />

          {/* 设备列表 */}
          <Typography variant="h5" gutterBottom>
            设备列表
          </Typography>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {devices.map((device) => (
                <Grid item xs={12} md={6} key={device.deviceId}>
                  <DeviceCard device={device} />
                </Grid>
              ))}
              {devices.length === 0 && (
                <Grid item xs={12}>
                  <Typography align="center" color="textSecondary">
                    暂无设备数据
                  </Typography>
                </Grid>
              )}
            </Grid>
          )}
        </>
      )}
    </Container>
  );
}

export default Dashboard;


