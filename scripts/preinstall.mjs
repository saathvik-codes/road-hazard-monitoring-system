import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

for (const filename of ["package-lock.json", "yarn.lock"]) {
  const filePath = path.join(repoRoot, filename);
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
}

const userAgent = process.env["npm_config_user_agent"] ?? "";
if (!userAgent.startsWith("pnpm/")) {
  console.error("Use pnpm instead");
  process.exit(1);
}
