import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { powerApps } from "@microsoft/power-apps-vite/plugin"
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), powerApps()],
  base: './',  // Use relative base for Power Apps deployment
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split large third-party libraries into their own cacheable
        // chunks instead of bundling everything into one file — these
        // rarely change between deploys, so browsers can cache them
        // across app updates.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('framer-motion')) return 'vendor-motion'
          if (id.includes('lucide-react')) return 'vendor-icons'
          if (id.includes('@radix-ui')) return 'vendor-radix'
          if (id.includes('@microsoft/power-apps')) return 'vendor-powerapps'
          return 'vendor'
        },
      },
    },
  },
});
