import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0", // Listen on all network interfaces for Docker
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
      host: "localhost", // Use localhost for HMR WebSocket connections
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://backend:5000",
        changeOrigin: true,
        secure: false,
      },
    },
    watch: {
      usePolling: true, // Enable polling for Docker file watching
      interval: 1000,
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
