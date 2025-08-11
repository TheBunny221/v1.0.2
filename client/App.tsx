import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { Toaster } from "./components/ui/toaster";
import { store } from "./store";
import ErrorBoundary from "./components/ErrorBoundary";
import AppInitializer from "./components/AppInitializer";
import Navigation from "./components/Navigation";
import RoleBasedRoute from "./components/RoleBasedRoute";
import { Loader2 } from "lucide-react";

// Lazy load components for better performance
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const SetPassword = lazy(() => import("./pages/SetPassword"));
const Profile = lazy(() => import("./pages/Profile"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));

// Role-specific dashboards
const CitizenDashboard = lazy(() => import("./pages/CitizenDashboard"));
const WardOfficerDashboard = lazy(() => import("./pages/WardOfficerDashboard"));
const MaintenanceDashboard = lazy(() => import("./pages/MaintenanceDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

// Complaint management
const ComplaintsList = lazy(() => import("./pages/ComplaintsList"));
const ComplaintDetails = lazy(() => import("./pages/ComplaintDetails"));
const GuestComplaintForm = lazy(() => import("./pages/GuestComplaintForm"));
const GuestTrackComplaint = lazy(() => import("./pages/GuestTrackComplaint"));

// Ward Officer pages
const WardTasks = lazy(() => import("./pages/WardTasks"));
const WardManagement = lazy(() => import("./pages/WardManagement"));

// Maintenance Team pages
const MaintenanceTasks = lazy(() => import("./pages/MaintenanceTasks"));
const TaskDetails = lazy(() => import("./pages/TaskDetails"));

// Admin pages
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminConfig = lazy(() => import("./pages/AdminConfig"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));

// Communication
const Messages = lazy(() => import("./pages/Messages"));

// Settings
const Settings = lazy(() => import("./pages/Settings"));

// Loading component
const LoadingFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex items-center space-x-2">
      <Loader2 className="h-6 w-6 animate-spin" />
      <span>Loading...</span>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <AppInitializer>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/set-password/:token"
                    element={<SetPassword />}
                  />
                  <Route
                    path="/guest/complaint"
                    element={<GuestComplaintForm />}
                  />
                  <Route
                    path="/guest/track"
                    element={<GuestTrackComplaint />}
                  />
                  <Route path="/unauthorized" element={<Unauthorized />} />

                  {/* Protected and Public Routes */}
                  <Route
                    path="/*"
                    element={
                      <div className="min-h-screen bg-gray-50">
                        <Navigation />
                        <main className="pt-16">
                          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                            <Routes>
                              {/* Home route */}
                              <Route path="/" element={<Index />} />

                              {/* Dashboard routes */}
                              <Route
                                path="/dashboard"
                                element={
                                  <RoleBasedRoute allowedRoles={["CITIZEN"]}>
                                    <CitizenDashboard />
                                  </RoleBasedRoute>
                                }
                              />
                              <Route
                                path="/dashboard/ward"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={["WARD_OFFICER"]}
                                  >
                                    <WardOfficerDashboard />
                                  </RoleBasedRoute>
                                }
                              />
                              <Route
                                path="/dashboard/maintenance"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={["MAINTENANCE_TEAM"]}
                                  >
                                    <MaintenanceDashboard />
                                  </RoleBasedRoute>
                                }
                              />
                              <Route
                                path="/dashboard/admin"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={["ADMINISTRATOR"]}
                                  >
                                    <AdminDashboard />
                                  </RoleBasedRoute>
                                }
                              />

                              {/* Complaint routes */}
                              <Route
                                path="/complaints"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={[
                                      "CITIZEN",
                                      "WARD_OFFICER",
                                      "MAINTENANCE_TEAM",
                                      "ADMINISTRATOR",
                                    ]}
                                  >
                                    <ComplaintsList />
                                  </RoleBasedRoute>
                                }
                              />
                              <Route
                                path="/complaints/:id"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={[
                                      "CITIZEN",
                                      "WARD_OFFICER",
                                      "MAINTENANCE_TEAM",
                                      "ADMINISTRATOR",
                                    ]}
                                  >
                                    <ComplaintDetails />
                                  </RoleBasedRoute>
                                }
                              />

                              {/* Ward Officer routes */}
                              <Route
                                path="/tasks"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={["WARD_OFFICER"]}
                                  >
                                    <WardTasks />
                                  </RoleBasedRoute>
                                }
                              />
                              <Route
                                path="/ward"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={["WARD_OFFICER"]}
                                  >
                                    <WardManagement />
                                  </RoleBasedRoute>
                                }
                              />

                              {/* Maintenance Team routes */}
                              <Route
                                path="/maintenance"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={["MAINTENANCE_TEAM"]}
                                  >
                                    <MaintenanceTasks />
                                  </RoleBasedRoute>
                                }
                              />
                              <Route
                                path="/tasks/:id"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={["MAINTENANCE_TEAM"]}
                                  >
                                    <TaskDetails />
                                  </RoleBasedRoute>
                                }
                              />

                              {/* Communication routes */}
                              <Route
                                path="/messages"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={[
                                      "WARD_OFFICER",
                                      "MAINTENANCE_TEAM",
                                    ]}
                                  >
                                    <Messages />
                                  </RoleBasedRoute>
                                }
                              />

                              {/* Reports routes */}
                              <Route
                                path="/reports"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={[
                                      "WARD_OFFICER",
                                      "ADMINISTRATOR",
                                    ]}
                                  >
                                    <AdminReports />
                                  </RoleBasedRoute>
                                }
                              />

                              {/* Admin routes */}
                              <Route
                                path="/admin/users"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={["ADMINISTRATOR"]}
                                  >
                                    <AdminUsers />
                                  </RoleBasedRoute>
                                }
                              />
                              <Route
                                path="/admin/config"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={["ADMINISTRATOR"]}
                                  >
                                    <AdminConfig />
                                  </RoleBasedRoute>
                                }
                              />
                              <Route
                                path="/admin/analytics"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={["ADMINISTRATOR"]}
                                  >
                                    <AdminAnalytics />
                                  </RoleBasedRoute>
                                }
                              />

                              {/* Profile and Settings */}
                              <Route
                                path="/profile"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={[
                                      "CITIZEN",
                                      "WARD_OFFICER",
                                      "MAINTENANCE_TEAM",
                                      "ADMINISTRATOR",
                                    ]}
                                  >
                                    <Profile />
                                  </RoleBasedRoute>
                                }
                              />
                              <Route
                                path="/settings"
                                element={
                                  <RoleBasedRoute
                                    allowedRoles={[
                                      "CITIZEN",
                                      "WARD_OFFICER",
                                      "MAINTENANCE_TEAM",
                                      "ADMINISTRATOR",
                                    ]}
                                  >
                                    <Settings />
                                  </RoleBasedRoute>
                                }
                              />

                              {/* Catch all route */}
                              <Route
                                path="*"
                                element={<Navigate to="/" replace />}
                              />
                            </Routes>
                          </div>
                        </main>
                      </div>
                    }
                  />
                </Routes>
              </Suspense>
            </div>
            <Toaster />
          </Router>
        </AppInitializer>
      </ErrorBoundary>
    </Provider>
  );
};

export default App;
