import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Detect cloud environment
  const isCloudEnvironment =
    process.env.FLY_APP_NAME ||
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
          target: "http://localhost:3001",
          changeOrigin: true,
          secure: false,
          timeout: 30000,
          headers: {
            Connection: "keep-alive",
          },
          onError: (err, req, res) => {
            console.error("Proxy error:", err.message);
            if (res.writeHead) {
              res.writeHead(500, {
                "Content-Type": "application/json",
              });
              res.end(
                JSON.stringify({
                  success: false,
                  message: "Proxy connection failed",
                  error: err.message,
                }),
              );
            }
          },
          onProxyReq: (proxyReq, req, res) => {
            console.log(
              "Proxying request:",
              req.method,
              req.url,
              "-> http://localhost:3001" + req.url,
            );
          },
        },
      },
      hmr: isProduction
        ? false
        : {
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
      // Ensure consistent NODE_ENV usage in client code
      "process.env.NODE_ENV": JSON.stringify(
        isProduction ? "production" : "development",
      ),
    },
    optimizeDeps: {
      include: ["react", "react-dom"],
    },
  };
});
