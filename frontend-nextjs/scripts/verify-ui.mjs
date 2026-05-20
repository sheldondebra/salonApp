#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const src = new URL("../src", import.meta.url).pathname;
const badTag = /<\/?motion\b/;
const bannedSparkles = /\bSparkles\b/;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.(tsx|jsx)$/.test(name)) files.push(path);
  }
  return files;
}

const violations = [];
for (const file of walk(src)) {
  const text = readFileSync(file, "utf8");
  if (badTag.test(text)) violations.push(`${file} (invalid <motion> tag)`);
  if (bannedSparkles.test(text)) {
    violations.push(`${file} (Sparkles icon is banned — use Scissors or another icon)`);
  }
}

if (violations.length) {
  console.error("UI verify failed:\n");
  violations.forEach((f) => console.error(`  ${f}`));
  process.exit(1);
}

console.log("UI verify: passed (no <motion> tags, no Sparkles icon)");
