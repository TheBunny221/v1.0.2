import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    fs: {
      allow: ["./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
    proxy: {
      // Proxy API calls to the backend server
      "/api": {
        target: "http://localhost:4005",
        changeOrigin: true,
        secure: false,
        timeout: 10000,
        headers: {
          "Connection": "keep-alive"
        }
      }
    }
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
  define: {
    // Fix React runtime issues
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["react", "react-dom"]
  }
}));
