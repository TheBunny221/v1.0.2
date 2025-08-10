import "./global.css";
import { createRoot } from "react-dom/client";
import React from "react";

const TestComponent: React.FC = () => {
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1>🏛️ CitizenConnect - Test Mode</h1>
      <p>If you can see this, React is working correctly!</p>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>✅ Application Status</h2>
        <ul>
          <li>✅ React is loading</li>
          <li>✅ TypeScript is working</li>
          <li>✅ Components are rendering</li>
          <li>🔄 Database connection needed</li>
        </ul>
      </div>
    </div>
  );
};

const App = () => {
  console.log("App component is rendering...");
  return <TestComponent />;
};

// Get the root element
const rootElement = document.getElementById("root")!;

// Check if we already have a root attached to this element
if (!rootElement._reactRoot) {
  console.log("Creating React root...");
  const root = createRoot(rootElement);
  // Store the root reference to prevent multiple createRoot calls
  (rootElement as any)._reactRoot = root;
  root.render(<App />);
} else {
  console.log("React root already exists, reusing...");
}
