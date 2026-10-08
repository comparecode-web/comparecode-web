import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { getDeploymentVersion } from "./build-version.mjs";

const require = createRequire(import.meta.url);
const result = spawnSync(process.execPath, [require.resolve("next/dist/bin/next"), "build", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_APP_VERSION: getDeploymentVersion() }
});

if (result.error) {
  console.error(result.error.message);
}
process.exit(result.status ?? 1);
