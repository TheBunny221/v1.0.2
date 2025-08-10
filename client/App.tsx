import "./global.css";
import { createRoot } from "react-dom/client";
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import { Layout } from "./components/Layout";
import { AppInitializer } from "./components/AppInitializer";

// Import all pages
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import AdminComplaints from "./pages/AdminComplaints";
import AdminReports from "./pages/AdminReports";
import AdminUsers from "./pages/AdminUsers";
import WardDashboard from "./pages/WardDashboard";
import MaintenanceDashboard from "./pages/MaintenanceDashboard";
import MyComplaints from "./pages/MyComplaints";
import TrackStatus from "./pages/TrackStatus";
import ReopenComplaint from "./pages/ReopenComplaint";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";

// Import guest pages
import GuestComplaintForm from "../src/pages/GuestComplaintForm";
import GuestTrackComplaint from "../src/pages/GuestTrackComplaint";

const App = () => {
  console.log("CitizenConnect App is starting with full functionality...");

  return (
    <Provider store={store}>
      <AppInitializer>
        <BrowserRouter>
          <Routes>
            {/* Guest Routes (no layout) */}
            <Route path="/guest" element={<GuestComplaintForm />} />
            <Route path="/guest/track" element={<GuestTrackComplaint />} />
            
            {/* Main Application Routes (with layout) */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/complaints" element={<AdminComplaints />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              
              {/* Ward Officer Routes */}
              <Route path="/ward" element={<WardDashboard />} />
              
              {/* Maintenance Team Routes */}
              <Route path="/maintenance" element={<MaintenanceDashboard />} />
              
              {/* User Routes */}
              <Route path="/my-complaints" element={<MyComplaints />} />
              <Route path="/track" element={<TrackStatus />} />
              <Route path="/reopen" element={<ReopenComplaint />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/feedback" element={<Feedback />} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppInitializer>
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
