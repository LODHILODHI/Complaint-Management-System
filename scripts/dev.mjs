import { spawn } from "child_process";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { createServer } from "net";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const lockPath = path.join(root, ".next", "dev", "lock");
const port = Number(process.env.PORT || 3000);

function isPortFree(p) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(p, "127.0.0.1");
  });
}

function killPid(pid) {
  if (!pid || Number.isNaN(pid)) return;
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } else {
      process.kill(pid, "SIGTERM");
    }
  } catch {
    // process may already be gone
  }
}

function clearStaleLock() {
  if (!existsSync(lockPath)) return;

  try {
    const raw = readFileSync(lockPath, "utf8");
    const data = JSON.parse(raw);
    if (data?.pid) {
      console.log(`Stopping previous Next.js dev server (PID ${data.pid})...`);
      killPid(Number(data.pid));
    }
  } catch {
    // ignore invalid lock
  }

  try {
    unlinkSync(lockPath);
  } catch {
    // ignore
  }
}

async function waitForPort(p, attempts = 20) {
  for (let i = 0; i < attempts; i++) {
    if (await isPortFree(p)) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return isPortFree(p);
}

clearStaleLock();

const free = await waitForPort(port);
if (!free) {
  console.error(
    `Port ${port} is still in use. Free it manually, then run npm run dev again.`,
  );
  process.exit(1);
}

const nextBin = path.join(
  root,
  "node_modules",
  "next",
  "dist",
  "bin",
  "next",
);

const child = spawn(process.execPath, [nextBin, "dev"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
