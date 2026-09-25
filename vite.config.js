import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Keep both entry points on the portfolio's own address. Never silently
  // drift to another port and leave an old tab requesting another app's media.
  server: { host: "127.0.0.1", port: 52125, strictPort: true },
  preview: { host: "127.0.0.1", port: 52125, strictPort: true },
  build: {
    assetsInlineLimit: 0,
    sourcemap: false,
  },
});
