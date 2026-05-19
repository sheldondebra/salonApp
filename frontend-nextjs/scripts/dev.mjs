#!/usr/bin/env node
import { copyFileSync, existsSync, rmSync } from "fs";
import { spawn } from "child_process";
import { createConnection } from "net";

const PORT = Number(process.env.PORT || 3000);
const root = new URL("..", import.meta.url).pathname;
const envLocal = `${root}/.env.local`;
const envExample = `${root}/.env.example`;
const nextDir = `${root}/.next`;

if (!existsSync(envLocal) && existsSync(envExample)) {
  copyFileSync(envExample, envLocal);
  console.log("Created .env.local from .env.example");
}

function portInUse(port) {
  return new Promise((resolve) => {
    const server = createConnection({ port, host: "127.0.0.1" });
    server.once("connect", () => {
      server.end();
      resolve(true);
    });
    server.once("error", () => resolve(false));
  });
}

const inUse = await portInUse(PORT);
if (inUse) {
  console.error(
    `\nPort ${PORT} is already in use. Another Next.js (or app) is probably still running.\n` +
      `  Stop it:  lsof -ti :${PORT} | xargs kill\n` +
      `  Then run: npm run dev\n`
  );
  process.exit(1);
}

// Stale .next causes broken CSS/chunks on browser refresh
if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("Cleared .next cache\n");
}

console.log(`Starting dev server at http://localhost:${PORT}\n`);

const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
