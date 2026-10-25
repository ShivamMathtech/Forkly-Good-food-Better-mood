import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const env = { ...process.env, VITE_DATA_MODE: "api", VITE_API_URL: "/api" };
const children = [
  spawn(process.execPath, ["--env-file-if-exists=.env", "server/index.mjs"], {
    cwd: root,
    stdio: "inherit",
    env,
  }),
  spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1"],
    { cwd: root, stdio: "inherit", env },
  ),
];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const c of children) c.kill();
  setTimeout(() => process.exit(code), 300).unref();
}
for (const child of children) {
  child.on("exit", (code) => stop(code || 0));
  child.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
