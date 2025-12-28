const { spawn } = require("child_process");
const path = require("path");

function main() {
  const frontendDir = path.join(__dirname, "..", "frontend");
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

  const child = spawn(npmCmd, ["run", "build"], {
    cwd: frontendDir,
    stdio: "inherit",
    env: process.env
  });

  child.on("exit", (code) => process.exit(code ?? 0));
}

main();


