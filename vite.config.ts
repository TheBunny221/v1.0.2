import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Detect cloud environment
  const isCloudEnvironment = process.env.FLY_APP_NAME || 
                            process.env.RENDER || 
                            process.env.RAILWAY_PROJECT_ID ||
                            process.env.VERCEL ||
                            process.env.NETLIFY;
  
  const isProduction = mode === "production" || isCloudEnvironment;
  
  return {
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
      hmr: isProduction ? false : {
        overlay: false,
        port: 3001,
        clientPort: 3001,
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
        fastRefresh: !isProduction,
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
  };
});
