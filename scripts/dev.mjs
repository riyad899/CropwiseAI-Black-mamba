import { spawn } from "node:child_process";

const services = [
  { name: "client", cmd: "npm", args: ["run", "dev", "--workspace=client"], color: "\x1b[36m" },
  { name: "server", cmd: "npm", args: ["run", "dev", "--workspace=server"], color: "\x1b[32m" },
  { name: "iot   ", cmd: "npm", args: ["run", "dev", "--workspace=esp32-iot-server"], color: "\x1b[35m" },
];

const reset = "\x1b[0m";
const children = [];

function prefixStream(stream, prefix, color, target) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      target.write(`${color}[${prefix}]${reset} ${line}\n`);
    }
  });
  stream.on("end", () => {
    if (buffer.length > 0) {
      target.write(`${color}[${prefix}]${reset} ${buffer}\n`);
      buffer = "";
    }
  });
}

console.log("\x1b[32m✔ Starting CropWise AI workspace services (Client, Server, IoT)...\x1b[0m\n");

const isWin = process.platform === "win32";

for (const s of services) {
  const child = spawn(isWin ? "npm.cmd" : "npm", ["run", "dev", `--workspace=${s.name.trim() === "iot" ? "esp32-iot-server" : s.name.trim()}`], {
    stdio: ["inherit", "pipe", "pipe"],
    shell: false,
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  children.push(child);

  prefixStream(child.stdout, s.name, s.color, process.stdout);
  prefixStream(child.stderr, s.name, "\x1b[31m", process.stderr);

  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${s.color}[${s.name}]${reset} process exited with code ${code}`);
    }
  });
}

function cleanup() {
  for (const child of children) {
    try {
      if (!child.killed) {
        child.kill("SIGINT");
      }
    } catch {
      // ignore
    }
  }
}

process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(0);
});
