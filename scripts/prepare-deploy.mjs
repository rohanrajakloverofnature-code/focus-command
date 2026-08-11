import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const staticEntry = resolve(process.cwd(), "dist", "index.html");
const compatibilityEntry = resolve(process.cwd(), "dist", "index.js");

if (!existsSync(staticEntry)) {
  throw new Error("Static export is missing dist/index.html; deployment preparation cannot continue.");
}

writeFileSync(
  compatibilityEntry,
  'void import("../scripts/serve-static.mjs");\n',
  "utf8",
);

console.log("Prepared static deployment compatibility entry at dist/index.js");
