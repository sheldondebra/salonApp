#!/usr/bin/env node
/**
 * Start Schedelux mobile from the correct folder and free port 8081.
 */
import { execSync, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

for (const port of [8081, 8082, 19000, 19001]) {
  try {
    const pids = execSync(`lsof -ti :${port}`, { encoding: "utf8" }).trim();
    if (pids) {
      execSync(`kill -9 ${pids.split("\n").join(" ")}`, { stdio: "ignore" });
      console.log(`Freed port ${port}`);
    }
  } catch {
    /* port free */
  }
}

console.log("\nSchedelux mobile — project:", root);
console.log("Scan the QR from THIS terminal only (not another salonmobileapp folder).\n");

const child = spawn("npx", ["expo", "start", "--clear", "--lan"], {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 0));
