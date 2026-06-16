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
});
