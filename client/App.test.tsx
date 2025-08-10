import "./global.css";
import { createRoot } from "react-dom/client";
import React from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import ErrorBoundary from "./components/ErrorBoundary";

const SimpleTestApp = () => {
  console.log("Simple Test App is rendering...");

  return (
    <div style={{ padding: "20px", background: "#f0f8ff", minHeight: "100vh" }}>
      <h1>🎯 CitizenConnect - Debug Mode</h1>
      <div
        style={{
          marginTop: "20px",
          background: "white",
          padding: "20px",
          borderRadius: "8px",
        }}
      >
        <h2>✅ Core Systems Check</h2>
        <ul>
          <li>✅ React is rendering</li>
          <li>✅ CSS is loading</li>
          <li>✅ ErrorBoundary is active</li>
          <li>✅ Redux store is connected</li>
        </ul>

        <div style={{ marginTop: "20px" }}>
          <h3>🔧 Debug Information</h3>
          <p>
            <strong>Store State:</strong>{" "}
            {JSON.stringify(Object.keys(store.getState()))}
          </p>
          <p>
            <strong>Current Time:</strong> {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

const TestApp = () => {
  console.log("TestApp wrapper is starting...");

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <SimpleTestApp />
      </Provider>
    </ErrorBoundary>
  );
};

// Get the root element
const rootElement = document.getElementById("root")!;

// Check if we already have a root attached to this element
if (!rootElement._reactRoot) {
  console.log("Creating React root for test...");
  const root = createRoot(rootElement);
  (rootElement as any)._reactRoot = root;
  root.render(<TestApp />);
} else {
  console.log("React root already exists, reusing for test...");
}
