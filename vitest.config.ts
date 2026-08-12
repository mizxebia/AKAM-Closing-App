import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Deliberately separate from vite.config.ts: the Power Apps vite plugin
// targets the dev/build pipeline (Dataverse connection wiring) and has no
// role in a Node/jsdom test run, so it is left out here.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // "forks" pool fails to spawn child processes in this sandboxed shell
    // (path contains spaces/parens); threads run in-process and work here.
    pool: 'threads',
    server: {
      deps: {
        // @microsoft/power-apps ships relative imports without a .js
        // extension; Node's own ESM resolver (used for externalized
        // node_modules deps) rejects that, so route it through Vite's
        // resolver instead, which tolerates it.
        inline: ['@microsoft/power-apps'],
      },
    },
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/features/**/*.{ts,tsx}'],
      exclude: ['src/features/**/*.test.{ts,tsx}', '**/generated/**'],
    },
  },
})
