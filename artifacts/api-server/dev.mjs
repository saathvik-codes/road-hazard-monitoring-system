import { spawnSync } from "node:child_process";

process.env.NODE_ENV = "development";
if (!process.env.PORT) process.env.PORT = "3001";

const build = spawnSync(process.execPath, ["build.mjs"], {
  cwd: process.cwd(),
  stdio: "inherit",
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const start = spawnSync(process.execPath, ["--enable-source-maps", "./dist/index.mjs"], {
  cwd: process.cwd(),
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "development" },
});

process.exit(start.status ?? 1);
