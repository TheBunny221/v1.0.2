import "./global.css";
import { createRoot } from "react-dom/client";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import { Layout } from "./components/Layout";
import { AppInitializer } from "./components/AppInitializer";
import ErrorBoundary from "./components/ErrorBoundary";

// Import minimal pages first
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const App = () => {
  console.log("CitizenConnect App is starting with full functionality...");

  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppInitializer>
          <BrowserRouter>
            <Routes>
              {/* Simplified test routes */}
              <Route path="/" element={
                <div style={{ padding: "20px" }}>
                  <h1>🏛️ CitizenConnect</h1>
                  <p>Application is loading...</p>
                  <div style={{ marginTop: "20px", background: "#f0f0f0", padding: "10px" }}>
                    <h3>Available Routes:</h3>
                    <ul>
                      <li><a href="/test">Test Page</a></li>
                      <li><a href="/layout-test">Layout Test</a></li>
                      <li><a href="/index-test">Index Page Test</a></li>
                    </ul>
                  </div>
                </div>
              } />
              <Route path="/test" element={
                <div style={{ padding: "20px" }}>
                  <h1>✅ Test Page</h1>
                  <p>Navigation is working!</p>
                  <a href="/">← Back to Home</a>
                </div>
              } />
              <Route path="/layout-test" element={<Layout />}>
                <Route index element={
                  <div style={{ padding: "20px" }}>
                    <h1>🎯 Layout Test</h1>
                    <p>Layout component is working!</p>
                  </div>
                } />
              </Route>
              <Route path="/index-test" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AppInitializer>
      </Provider>
    </ErrorBoundary>
  );
};

// Get the root element
const rootElement = document.getElementById("root")!;

// Check if we already have a root attached to this element
if (!rootElement._reactRoot) {
  console.log("Creating React root...");
  const root = createRoot(rootElement);
  (rootElement as any)._reactRoot = root;
  root.render(<App />);
} else {
  console.log("React root already exists, reusing...");
}
