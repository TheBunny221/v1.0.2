// vite.config.ts
import { defineConfig } from "file:///app/code/node_modules/vite/dist/node/index.js";
import react from "file:///app/code/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
var __vite_injected_original_dirname = "/app/code";
var vite_config_default = defineConfig(({ mode }) => {
  const isCloudEnvironment = process.env.FLY_APP_NAME || process.env.RENDER || process.env.RAILWAY_PROJECT_ID || process.env.VERCEL || process.env.NETLIFY;
  const isProduction = mode === "production" || isCloudEnvironment;
  return {
    server: {
      host: "::",
      port: 3e3,
      fs: {
        allow: ["./client", "./shared"],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"]
      },
      proxy: {
        // Proxy API calls to the backend server
        "/api": {
          target: "http://localhost:4005",
          changeOrigin: true,
          secure: false,
          timeout: 3e4,
          headers: {
            Connection: "keep-alive"
          },
          onError: (err, req, res) => {
            console.error("Proxy error:", err.message);
            if (res.writeHead) {
              res.writeHead(500, {
                "Content-Type": "application/json"
              });
              res.end(
                JSON.stringify({
                  success: false,
                  message: "Proxy connection failed",
                  error: err.message
                })
              );
            }
          },
          onProxyReq: (proxyReq, req, res) => {
            console.log(
              "Proxying request:",
              req.method,
              req.url,
              "-> http://localhost:4005" + req.url
            );
          }
        }
      },
      hmr: isProduction ? false : {
        overlay: false,
        port: 3001,
        clientPort: 3001
      },
      watch: {
        usePolling: false,
        interval: 1e3
      }
    },
    build: {
      outDir: "dist/spa"
    },
    plugins: [
      react({
        // Configure React fast refresh
        fastRefresh: !isProduction,
        jsxRuntime: "automatic"
      })
    ],
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./client"),
        "@shared": path.resolve(__vite_injected_original_dirname, "./shared")
      }
    },
    define: {
      // Fix React runtime issues
      global: "globalThis",
      // Ensure consistent NODE_ENV usage in client code
      "process.env.NODE_ENV": JSON.stringify(isProduction ? "production" : "development")
    },
    optimizeDeps: {
      include: ["react", "react-dom"]
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvYXBwL2NvZGVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9hcHAvY29kZS92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vYXBwL2NvZGUvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIC8vIERldGVjdCBjbG91ZCBlbnZpcm9ubWVudFxuICBjb25zdCBpc0Nsb3VkRW52aXJvbm1lbnQgPVxuICAgIHByb2Nlc3MuZW52LkZMWV9BUFBfTkFNRSB8fFxuICAgIHByb2Nlc3MuZW52LlJFTkRFUiB8fFxuICAgIHByb2Nlc3MuZW52LlJBSUxXQVlfUFJPSkVDVF9JRCB8fFxuICAgIHByb2Nlc3MuZW52LlZFUkNFTCB8fFxuICAgIHByb2Nlc3MuZW52Lk5FVExJRlk7XG5cbiAgY29uc3QgaXNQcm9kdWN0aW9uID0gbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCIgfHwgaXNDbG91ZEVudmlyb25tZW50O1xuXG4gIHJldHVybiB7XG4gICAgc2VydmVyOiB7XG4gICAgICBob3N0OiBcIjo6XCIsXG4gICAgICBwb3J0OiAzMDAwLFxuICAgICAgZnM6IHtcbiAgICAgICAgYWxsb3c6IFtcIi4vY2xpZW50XCIsIFwiLi9zaGFyZWRcIl0sXG4gICAgICAgIGRlbnk6IFtcIi5lbnZcIiwgXCIuZW52LipcIiwgXCIqLntjcnQscGVtfVwiLCBcIioqLy5naXQvKipcIiwgXCJzZXJ2ZXIvKipcIl0sXG4gICAgICB9LFxuICAgICAgcHJveHk6IHtcbiAgICAgICAgLy8gUHJveHkgQVBJIGNhbGxzIHRvIHRoZSBiYWNrZW5kIHNlcnZlclxuICAgICAgICBcIi9hcGlcIjoge1xuICAgICAgICAgIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjQwMDVcIixcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgICB0aW1lb3V0OiAzMDAwMCxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICBDb25uZWN0aW9uOiBcImtlZXAtYWxpdmVcIixcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uRXJyb3I6IChlcnIsIHJlcSwgcmVzKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiUHJveHkgZXJyb3I6XCIsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIGlmIChyZXMud3JpdGVIZWFkKSB7XG4gICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAwLCB7XG4gICAgICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICByZXMuZW5kKFxuICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgbWVzc2FnZTogXCJQcm94eSBjb25uZWN0aW9uIGZhaWxlZFwiLFxuICAgICAgICAgICAgICAgICAgZXJyb3I6IGVyci5tZXNzYWdlLFxuICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgICAgb25Qcm94eVJlcTogKHByb3h5UmVxLCByZXEsIHJlcykgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgIFwiUHJveHlpbmcgcmVxdWVzdDpcIixcbiAgICAgICAgICAgICAgcmVxLm1ldGhvZCxcbiAgICAgICAgICAgICAgcmVxLnVybCxcbiAgICAgICAgICAgICAgXCItPiBodHRwOi8vbG9jYWxob3N0OjQwMDVcIiArIHJlcS51cmwsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgaG1yOiBpc1Byb2R1Y3Rpb25cbiAgICAgICAgPyBmYWxzZVxuICAgICAgICA6IHtcbiAgICAgICAgICAgIG92ZXJsYXk6IGZhbHNlLFxuICAgICAgICAgICAgcG9ydDogMzAwMSxcbiAgICAgICAgICAgIGNsaWVudFBvcnQ6IDMwMDEsXG4gICAgICAgICAgfSxcbiAgICAgIHdhdGNoOiB7XG4gICAgICAgIHVzZVBvbGxpbmc6IGZhbHNlLFxuICAgICAgICBpbnRlcnZhbDogMTAwMCxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgb3V0RGlyOiBcImRpc3Qvc3BhXCIsXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCh7XG4gICAgICAgIC8vIENvbmZpZ3VyZSBSZWFjdCBmYXN0IHJlZnJlc2hcbiAgICAgICAgZmFzdFJlZnJlc2g6ICFpc1Byb2R1Y3Rpb24sXG4gICAgICAgIGpzeFJ1bnRpbWU6IFwiYXV0b21hdGljXCIsXG4gICAgICB9KSxcbiAgICBdLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vY2xpZW50XCIpLFxuICAgICAgICBcIkBzaGFyZWRcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NoYXJlZFwiKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBkZWZpbmU6IHtcbiAgICAgIC8vIEZpeCBSZWFjdCBydW50aW1lIGlzc3Vlc1xuICAgICAgZ2xvYmFsOiBcImdsb2JhbFRoaXNcIixcbiAgICAgIC8vIEVuc3VyZSBjb25zaXN0ZW50IE5PREVfRU5WIHVzYWdlIGluIGNsaWVudCBjb2RlXG4gICAgICBcInByb2Nlc3MuZW52Lk5PREVfRU5WXCI6IEpTT04uc3RyaW5naWZ5KGlzUHJvZHVjdGlvbiA/IFwicHJvZHVjdGlvblwiIDogXCJkZXZlbG9wbWVudFwiKSxcbiAgICB9LFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgaW5jbHVkZTogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIl0sXG4gICAgfSxcbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE2TSxTQUFTLG9CQUFvQjtBQUMxTyxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBRXhDLFFBQU0scUJBQ0osUUFBUSxJQUFJLGdCQUNaLFFBQVEsSUFBSSxVQUNaLFFBQVEsSUFBSSxzQkFDWixRQUFRLElBQUksVUFDWixRQUFRLElBQUk7QUFFZCxRQUFNLGVBQWUsU0FBUyxnQkFBZ0I7QUFFOUMsU0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sSUFBSTtBQUFBLFFBQ0YsT0FBTyxDQUFDLFlBQVksVUFBVTtBQUFBLFFBQzlCLE1BQU0sQ0FBQyxRQUFRLFVBQVUsZUFBZSxjQUFjLFdBQVc7QUFBQSxNQUNuRTtBQUFBLE1BQ0EsT0FBTztBQUFBO0FBQUEsUUFFTCxRQUFRO0FBQUEsVUFDTixRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsVUFDZCxRQUFRO0FBQUEsVUFDUixTQUFTO0FBQUEsVUFDVCxTQUFTO0FBQUEsWUFDUCxZQUFZO0FBQUEsVUFDZDtBQUFBLFVBQ0EsU0FBUyxDQUFDLEtBQUssS0FBSyxRQUFRO0FBQzFCLG9CQUFRLE1BQU0sZ0JBQWdCLElBQUksT0FBTztBQUN6QyxnQkFBSSxJQUFJLFdBQVc7QUFDakIsa0JBQUksVUFBVSxLQUFLO0FBQUEsZ0JBQ2pCLGdCQUFnQjtBQUFBLGNBQ2xCLENBQUM7QUFDRCxrQkFBSTtBQUFBLGdCQUNGLEtBQUssVUFBVTtBQUFBLGtCQUNiLFNBQVM7QUFBQSxrQkFDVCxTQUFTO0FBQUEsa0JBQ1QsT0FBTyxJQUFJO0FBQUEsZ0JBQ2IsQ0FBQztBQUFBLGNBQ0g7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFVBQ0EsWUFBWSxDQUFDLFVBQVUsS0FBSyxRQUFRO0FBQ2xDLG9CQUFRO0FBQUEsY0FDTjtBQUFBLGNBQ0EsSUFBSTtBQUFBLGNBQ0osSUFBSTtBQUFBLGNBQ0osNkJBQTZCLElBQUk7QUFBQSxZQUNuQztBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsS0FBSyxlQUNELFFBQ0E7QUFBQSxRQUNFLFNBQVM7QUFBQSxRQUNULE1BQU07QUFBQSxRQUNOLFlBQVk7QUFBQSxNQUNkO0FBQUEsTUFDSixPQUFPO0FBQUEsUUFDTCxZQUFZO0FBQUEsUUFDWixVQUFVO0FBQUEsTUFDWjtBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxJQUNWO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxNQUFNO0FBQUE7QUFBQSxRQUVKLGFBQWEsQ0FBQztBQUFBLFFBQ2QsWUFBWTtBQUFBLE1BQ2QsQ0FBQztBQUFBLElBQ0g7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLFVBQVU7QUFBQSxRQUN2QyxXQUFXLEtBQUssUUFBUSxrQ0FBVyxVQUFVO0FBQUEsTUFDL0M7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUE7QUFBQSxNQUVOLFFBQVE7QUFBQTtBQUFBLE1BRVIsd0JBQXdCLEtBQUssVUFBVSxlQUFlLGVBQWUsYUFBYTtBQUFBLElBQ3BGO0FBQUEsSUFDQSxjQUFjO0FBQUEsTUFDWixTQUFTLENBQUMsU0FBUyxXQUFXO0FBQUEsSUFDaEM7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
