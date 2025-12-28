import React from "react";
import { Card, CardContent, Typography, Box, List, ListItem, ListItemText, Chip } from "@mui/material";

function AlertPanel({ devices }) {
  const abnormal = (devices || []).filter((d) => d.isAbnormal);

  if (abnormal.length === 0) {
    return null;
  }

  return (
    <Card sx={{ mb: 3, border: "1px solid #ffcdd2", bgcolor: "#fff5f5" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography variant="h6" color="error">
            告警面板
          </Typography>
          <Chip color="error" label={`异常 ${abnormal.length}`} size="small" />
        </Box>

        <List dense>
          {abnormal.map((d) => (
            <ListItem key={d.deviceId} sx={{ px: 0 }}>
              <ListItemText
                primary={`${d.deviceName} (${d.deviceId})`}
                secondary={
                  <>
                    <span style={{ color: "#d32f2f" }}>{d.abnormalReason || "检测到异常"}</span>
                    {" • "}
                    {d.lastUpdateTime?.toLocaleString?.("zh-CN") || "-"}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default AlertPanel;


