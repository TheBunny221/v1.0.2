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
          Connection: "keep-alive",
        },
      },
    },
    hmr: {
      overlay: false,
      // Configure HMR for different environments
      ...(mode === "production" ? {
        // Disable HMR completely in production/cloud environments
        port: false,
        clientPort: false,
      } : {
        // Development configuration
        port: 3001,
        clientPort: 3001,
      }),
    },
    watch: {
      usePolling: false,
      interval: 1000,
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [
    react({
      // Configure React fast refresh
      fastRefresh: true,
      jsxRuntime: "automatic",
    }),
  ],
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
    include: ["react", "react-dom"],
  },
}));
