import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Grid
} from "@mui/material";
import { CheckCircle, Cancel, Warning, Thermostat, Memory, Speed } from "@mui/icons-material";

function DeviceCard({ device }) {
  const getStatusColor = () => {
    if (device.isAbnormal) return "error";
    if (!device.isOnline) return "default";
    return "success";
  };

  const getStatusIcon = () => {
    if (device.isAbnormal) return <Warning />;
    if (!device.isOnline) return <Cancel />;
    return <CheckCircle />;
  };

  const getProgressColor = (value) => {
    if (value > 90) return "error";
    if (value > 70) return "warning";
    return "success";
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" component="div">
            {device.deviceName}
          </Typography>
          <Chip
            icon={getStatusIcon()}
            label={device.isAbnormal ? "异常" : device.isOnline ? "在线" : "离线"}
            color={getStatusColor()}
            size="small"
          />
        </Box>

        <Typography variant="body2" color="textSecondary" gutterBottom>
          {device.deviceType} • {device.deviceId}
        </Typography>

        {device.isAbnormal && (
          <Box sx={{ my: 2, p: 1, bgcolor: "#ffebee", borderRadius: 1 }}>
            <Typography variant="body2" color="error">
              ⚠️ {device.abnormalReason}
            </Typography>
          </Box>
        )}

        <Grid container spacing={2} sx={{ mt: 2 }}>
          {/* 温度 */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Thermostat fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">温度: {device.temperature.toFixed(1)}°C</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(device.temperature, 100)}
              color={getProgressColor(device.temperature)}
            />
          </Grid>

          {/* CPU */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Speed fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">CPU: {device.cpuUsage.toFixed(1)}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={device.cpuUsage}
              color={getProgressColor(device.cpuUsage)}
            />
          </Grid>

          {/* 内存 */}
          <Grid item xs={12}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Memory fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">内存: {device.memoryUsage.toFixed(1)}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={device.memoryUsage}
              color={getProgressColor(device.memoryUsage)}
            />
          </Grid>
        </Grid>

        <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: "block" }}>
          最后更新: {device.lastUpdateTime.toLocaleString("zh-CN")}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default DeviceCard;



