import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import RoleSwitcher from "./components/RoleSwitcher";
import Index from "./pages/Index";
import MyComplaints from "./pages/MyComplaints";
import ReopenComplaint from "./pages/ReopenComplaint";
import TrackStatus from "./pages/TrackStatus";
import Feedback from "./pages/Feedback";
import AdminDashboard from "./pages/AdminDashboard";
import AdminComplaints from "./pages/AdminComplaints";
import AdminUsers from "./pages/AdminUsers";
import AdminReports from "./pages/AdminReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Citizen Routes */}
          <Route path="/" element={<Layout userRole="citizen"><Index /></Layout>} />
          <Route path="/my-complaints" element={<Layout userRole="citizen"><MyComplaints /></Layout>} />
          <Route path="/reopen-complaint" element={<Layout userRole="citizen"><ReopenComplaint /></Layout>} />
          <Route path="/track-status" element={<Layout userRole="citizen"><TrackStatus /></Layout>} />
          <Route path="/feedback" element={<Layout userRole="citizen"><Feedback /></Layout>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<Layout userRole="admin"><AdminDashboard /></Layout>} />
          <Route path="/admin/complaints" element={<Layout userRole="admin"><AdminComplaints /></Layout>} />
          <Route path="/admin/users" element={<Layout userRole="admin"><AdminUsers /></Layout>} />
          <Route path="/admin/reports" element={<Layout userRole="admin"><AdminReports /></Layout>} />

          {/* Ward Officer Routes - Placeholders */}
          <Route path="/ward" element={<Layout userRole="ward-officer"><AdminDashboard /></Layout>} />
          <Route path="/ward/review" element={<Layout userRole="ward-officer"><AdminComplaints /></Layout>} />
          <Route path="/ward/forward" element={<Layout userRole="ward-officer"><AdminComplaints /></Layout>} />

          {/* Maintenance Team Routes - Placeholders */}
          <Route path="/maintenance" element={<Layout userRole="maintenance"><AdminComplaints /></Layout>} />
          <Route path="/maintenance/update" element={<Layout userRole="maintenance"><AdminComplaints /></Layout>} />
          <Route path="/maintenance/sla" element={<Layout userRole="maintenance"><AdminComplaints /></Layout>} />

          {/* Catch-all route */}
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
