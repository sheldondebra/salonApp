#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const src = new URL("../src", import.meta.url).pathname;
const badTag = /<\/?motion\b/;

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
  if (badTag.test(text)) violations.push(file);
}

if (violations.length) {
  console.error("Invalid <motion> tags break layout (use <div> instead):\n");
  violations.forEach((f) => console.error(`  ${f}`));
  process.exit(1);
}

console.log("UI verify: no invalid motion tags in src/");
