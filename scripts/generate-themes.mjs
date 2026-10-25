import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync(
  process.execPath,
  [path.join(root, "node_modules", "vitest", "vitest.mjs"), "run", "config/themes/__tests__/themeCss.generated.test.ts"],
  { cwd: root, stdio: "inherit", env: { ...process.env, UPDATE_THEME_CSS: "1" } }
);

process.exit(result.status ?? 1);
