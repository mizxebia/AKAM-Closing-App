import { defineConfig, devices } from '@playwright/experimental-ct-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Why component tests instead of whole-app navigation E2E:
 * this is a Power Platform "code app" — every Dataverse call goes through
 * `window.parent.postMessage` to a host bridge that only the real Power Apps
 * player provides (see node_modules/@microsoft/power-apps/dist/internal/plugins/
 * DefaultPowerAppsBridge.js). There is no HTTP call to intercept and no local
 * fallback, so `vite dev` on its own can never resolve a data call, and the
 * `prod` environment in power.config.json must never be hit by an automated
 * run. Playwright Component Testing mounts real feature components in an
 * actual Chromium tab — genuine browser rendering, layout, and event
 * dispatch — without needing that bridge. See e2e/README.md.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.ct.spec.tsx',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
    ctViteConfig: {
      // Without this, Tailwind utility classes never compile, so the
      // AlertDialog overlay renders without its `fixed inset-0`
      // positioning and physically blocks clicks on the dialog content
      // sitting "beneath" it — a real-browser-only failure mode that
      // jsdom (Vitest) never surfaces, since jsdom doesn't do layout/hit-testing.
      plugins: [tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
