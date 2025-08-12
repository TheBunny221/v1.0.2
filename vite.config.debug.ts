import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Minimal config for debugging
export default defineConfig({
  server: {
    host: "::",
    port: 3000,
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
