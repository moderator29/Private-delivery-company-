/**
 * Boots everything the browser tests talk to.
 *
 * Order matters. NEXT_PUBLIC_* values are inlined by the compiler, so pointing
 * the application at the mock is a build time decision, not a runtime one: the
 * production build has to be produced with the mock URL or `next start` would
 * still reach for the real project. The mock is started first so the pages that
 * are prerendered during the build see the same data the tests will.
 *
 * Set E2E_SKIP_BUILD=1 to reuse an existing build when iterating locally.
 */

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

import { startMockSupabase } from "./mock-supabase.mjs";

const MOCK_PORT = Number(process.env.MOCK_SUPABASE_PORT ?? 54321);
const APP_PORT = Number(process.env.E2E_PORT ?? 3100);
const ROOT = fileURLToPath(new URL("..", import.meta.url));

function environment(mockPort) {
  return {
    ...process.env,
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${mockPort}`,
    // Length is all the schema checks, and a mock key must never look like a
    // real one that someone might paste somewhere.
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      "sb_publishable_e2e_mock_key_not_a_secret",
    NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${APP_PORT}`,
  };
}

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, env, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} ${args.join(" ")} exited with ${code}`)),
    );
  });
}

async function main() {
  const { port: mockPort } = await startMockSupabase(MOCK_PORT);
  const buildEnv = environment(mockPort);
  process.stdout.write(`[e2e] mock supabase on http://127.0.0.1:${mockPort}\n`);

  if (process.env.E2E_SKIP_BUILD !== "1") {
    process.stdout.write("[e2e] building against the mock\n");
    await run("npx", ["--no-install", "next", "build"], buildEnv);
  }

  process.stdout.write(`[e2e] starting next on http://127.0.0.1:${APP_PORT}\n`);
  const app = spawn(
    "npx",
    ["--no-install", "next", "start", "-p", String(APP_PORT)],
    {
      cwd: ROOT,
      env: buildEnv,
      stdio: "inherit",
    },
  );

  const stop = () => {
    app.kill("SIGTERM");
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  app.on("exit", (code) => process.exit(code ?? 0));
}

main().catch((error) => {
  process.stderr.write(
    `[e2e] ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
