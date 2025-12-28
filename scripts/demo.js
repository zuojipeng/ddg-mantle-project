const { spawn } = require("child_process");
const path = require("path");

function spawnNode(scriptRelPath, name) {
  const nodeCmd = process.platform === "win32" ? "node.exe" : "node";
  const scriptPath = path.join(__dirname, scriptRelPath);
  const child = spawn(nodeCmd, [scriptPath], {
    stdio: "inherit",
    env: process.env
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return child;
}

function main() {
  // 并行启动：前端 + 设备模拟器
  spawnNode("start-frontend.js", "frontend");
  spawnNode("../src/agent/device-simulator.js", "agent");
}

main();


