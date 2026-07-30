import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests run against a real production build of the application, served
 * by `next start`, with the Supabase REST surface replaced by a local mock.
 * tests/e2e-server.mjs owns that sequencing; see the note there about why the
 * build has to happen with the mock's URL in the environment.
 *
 * PLAYWRIGHT_CHROMIUM_PATH lets a container with a preinstalled browser point
 * at it. Unset, Playwright uses its own managed download, so this config works
 * unchanged on a normal machine.
 */

const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined,
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "node tests/e2e-server.mjs",
    port: PORT,
    reuseExistingServer: false,
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
