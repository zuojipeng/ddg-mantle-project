import React, { useState, useEffect, useCallback } from "react";
import { Button, Box, Typography, Alert } from "@mui/material";
import { MANTLE_TESTNET } from "../utils/constants";

function WalletConnect({ onConnect }) {
  const [account, setAccount] = useState(null);
  const [error, setError] = useState("");
  const [connecting, setConnecting] = useState(false);

  const checkIfWalletIsConnected = useCallback(async () => {
    try {
      if (!window.ethereum) return;

      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        onConnect(accounts[0]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [onConnect]);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [checkIfWalletIsConnected]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError("请安装 MetaMask 钱包");
        return;
      }

      setConnecting(true);
      setError("");

      // 请求连接钱包
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });

      // 切换到 Mantle 测试网
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: MANTLE_TESTNET.chainId }]
        });
      } catch (switchError) {
        // 如果网络不存在，添加网络
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [MANTLE_TESTNET]
          });
        } else {
          throw switchError;
        }
      }

      setAccount(accounts[0]);
      onConnect(accounts[0]);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    onConnect(null);
  };

  return (
    <Box sx={{ mb: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!account ? (
        <Button
          variant="contained"
          color="primary"
          onClick={connectWallet}
          disabled={connecting}
          size="large"
        >
          {connecting ? "连接中..." : "连接钱包"}
        </Button>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body1">
            已连接: {account.slice(0, 6)}...{account.slice(-4)}
          </Typography>
          <Button
            variant="outlined"
            color="secondary"
            onClick={disconnectWallet}
            size="small"
          >
            断开连接
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default WalletConnect;



