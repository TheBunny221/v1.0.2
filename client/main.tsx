import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./global.css";

// Global error handlers for production-grade error handling
window.addEventListener("error", (event) => {
  console.error("Global error caught:", event.error);
  // Prevent the error from bubbling up and causing white screens
  event.preventDefault();
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);

  // Handle specific error types that shouldn't crash the app
  if (
    event.reason?.message?.includes("IFrame evaluation timeout") ||
    event.reason?.message?.includes("Response body is already used") ||
    event.reason?.message?.includes("AbortError") ||
    event.reason?.message?.includes("NetworkError")
  ) {
    // These are non-critical errors that can be safely ignored
    console.warn("Non-critical error ignored:", event.reason?.message);
    event.preventDefault();
    return;
  }

  // For auth-related errors, don't prevent default to allow proper handling
  if (
    event.reason?.message?.includes("401") ||
    event.reason?.message?.includes("Unauthorized") ||
    event.reason?.message?.includes("token")
  ) {
    console.warn("Auth-related error, allowing normal handling");
    return;
  }

  // Prevent the error from causing app crashes
  event.preventDefault();
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
