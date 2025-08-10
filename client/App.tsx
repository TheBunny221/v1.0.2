import "./global.css";
import { createRoot } from "react-dom/client";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import GuestComplaintForm from "../src/pages/GuestComplaintForm";
import GuestTrackComplaint from "../src/pages/GuestTrackComplaint";

const TestComponent: React.FC = () => {
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1>🏛️ CitizenConnect - Working!</h1>
      <p>React and Redux are now operational!</p>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>✅ System Status</h2>
        <ul>
          <li>✅ React is working</li>
          <li>✅ Redux Toolkit configured</li>
          <li>✅ Routing enabled</li>
          <li>🔄 Guest complaint system ready</li>
        </ul>
        <div style={{ marginTop: '20px' }}>
          <h3>Available Routes:</h3>
          <ul>
            <li><a href="/" style={{ color: '#2563eb' }}>/ - Guest Complaint Form</a></li>
            <li><a href="/track" style={{ color: '#2563eb' }}>/track - Track Complaints</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  console.log("App component is rendering with Redux...");
  
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<GuestComplaintForm />} />
          <Route path="/track" element={<GuestTrackComplaint />} />
          <Route path="/test" element={<TestComponent />} />
          <Route path="*" element={<TestComponent />} />
        </Routes>
      </BrowserRouter>
    </Provider>
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
