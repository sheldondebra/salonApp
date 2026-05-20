#!/usr/bin/env node
/**
 * Starts Next.js dev server. Does NOT delete .next by default — wiping on every
 * start causes 404s on main-app.js / layout.js when the browser still has old HTML.
 * Use: npm run dev:clean  (only when the UI is truly broken)
 */
import { copyFileSync, existsSync, rmSync } from "fs";
import { spawn } from "child_process";
import { createConnection } from "net";

const PORT = Number(process.env.PORT || 3000);
const root = new URL("..", import.meta.url).pathname;
const envLocal = `${root}/.env.local`;
const envExample = `${root}/.env.example`;
const nextDir = `${root}/.next`;
const shouldClean =
  process.argv.includes("--clean") || process.env.CLEAN_NEXT === "1";

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
    `\nPort ${PORT} is already in use. Only one dev server allowed.\n` +
      `  Stop it:  lsof -ti :${PORT} | xargs kill -9\n` +
      `  Then:     npm run dev\n`
  );
  process.exit(1);
}

if (shouldClean && existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log("Cleared .next (clean start)\n");
}

console.log(`Starting dev server at http://localhost:${PORT}`);
console.log("Tip: hard-refresh once after first compile (Cmd+Shift+R)\n");

const child = spawn("npx", ["next", "dev", "-p", String(PORT)], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
