import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import AppInitializer from "./components/AppInitializer";
import Layout from "./components/Layout";
import RoleSwitcher from "./components/RoleSwitcher";
import Index from "./pages/Index";
import GuestComplaintForm from "../src/pages/GuestComplaintForm";
import GuestTrackComplaint from "../src/pages/GuestTrackComplaint";
import MyComplaints from "./pages/MyComplaints";
import ReopenComplaint from "./pages/ReopenComplaint";
import TrackStatus from "./pages/TrackStatus";
import Feedback from "./pages/Feedback";
import AdminDashboard from "./pages/AdminDashboard";
import AdminComplaints from "./pages/AdminComplaints";
import AdminUsers from "./pages/AdminUsers";
import AdminReports from "./pages/AdminReports";
import WardDashboard from "./pages/WardDashboard";
import MaintenanceDashboard from "./pages/MaintenanceDashboard";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppInitializer />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Role Switcher */}
            <Route
              path="/roles"
              element={
                <Layout>
                  <RoleSwitcher />
                </Layout>
              }
            />

            {/* Guest and Citizen Routes */}
            <Route
              path="/"
              element={
                <Layout userRole="citizen">
                  <GuestComplaintForm />
                </Layout>
              }
            />
            <Route
              path="/track"
              element={
                <Layout userRole="citizen">
                  <GuestTrackComplaint />
                </Layout>
              }
            />
            <Route
              path="/my-complaints"
              element={
                <Layout userRole="citizen">
                  <MyComplaints />
                </Layout>
              }
            />
            <Route
              path="/reopen-complaint"
              element={
                <Layout userRole="citizen">
                  <ReopenComplaint />
                </Layout>
              }
            />
            <Route
              path="/track-status"
              element={
                <Layout userRole="citizen">
                  <TrackStatus />
                </Layout>
              }
            />
            <Route
              path="/feedback"
              element={
                <Layout userRole="citizen">
                  <Feedback />
                </Layout>
              }
            />

            {/* Common Routes */}
            <Route
              path="/profile"
              element={
                <Layout>
                  <Profile />
                </Layout>
              }
            />
            <Route
              path="/settings"
              element={
                <Layout>
                  <Settings />
                </Layout>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <Layout userRole="admin">
                  <AdminDashboard />
                </Layout>
              }
            />
            <Route
              path="/admin/complaints"
              element={
                <Layout userRole="admin">
                  <AdminComplaints />
                </Layout>
              }
            />
            <Route
              path="/admin/users"
              element={
                <Layout userRole="admin">
                  <AdminUsers />
                </Layout>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <Layout userRole="admin">
                  <AdminReports />
                </Layout>
              }
            />

            {/* Ward Officer Routes */}
            <Route
              path="/ward"
              element={
                <Layout userRole="ward-officer">
                  <WardDashboard />
                </Layout>
              }
            />
            <Route
              path="/ward/review"
              element={
                <Layout userRole="ward-officer">
                  <AdminComplaints />
                </Layout>
              }
            />
            <Route
              path="/ward/forward"
              element={
                <Layout userRole="ward-officer">
                  <AdminComplaints />
                </Layout>
              }
            />

            {/* Maintenance Team Routes */}
            <Route
              path="/maintenance"
              element={
                <Layout userRole="maintenance">
                  <MaintenanceDashboard />
                </Layout>
              }
            />
            <Route
              path="/maintenance/update"
              element={
                <Layout userRole="maintenance">
                  <MaintenanceDashboard />
                </Layout>
              }
            />
            <Route
              path="/maintenance/sla"
              element={
                <Layout userRole="maintenance">
                  <MaintenanceDashboard />
                </Layout>
              }
            />

            {/* Catch-all route */}
            <Route
              path="*"
              element={
                <Layout>
                  <NotFound />
                </Layout>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

// Get the root element
const rootElement = document.getElementById("root")!;

// Check if we already have a root attached to this element
if (!rootElement._reactRoot) {
  const root = createRoot(rootElement);
  // Store the root reference to prevent multiple createRoot calls
  (rootElement as any)._reactRoot = root;
  root.render(<App />);
} else {
  // If root already exists, just re-render
  (rootElement as any)._reactRoot.render(<App />);
}
