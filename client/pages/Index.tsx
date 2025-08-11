import React from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { 
  FileText, 
  Phone, 
  Mail, 
  User, 
  Clock,
  CheckCircle,
  AlertCircle,
  MapPin,
  Home
} from "lucide-react";

const Index: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  // Show loading if translations not ready
  if (!translations) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Home className="h-12 w-12 text-primary mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">
                Cochin Smart City Portal
              </h1>
            </div>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Welcome to the Cochin Smart City Complaint Management System. 
              Submit civic issues, track progress, and help build a better city together.
            </p>
            
            <div className="flex justify-center space-x-4 flex-wrap gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                <Link to="/guest/complaint">
                  <FileText className="mr-2 h-5 w-5" />
                  Register Complaint
                </Link>
              </Button>
              
              {!isAuthenticated ? (
                <>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/login">
                      <User className="mr-2 h-5 w-5" />
                      Login
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/guest/track">
                      <Clock className="mr-2 h-5 w-5" />
                      Track Complaint
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/dashboard">
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/complaints">
                      <FileText className="mr-2 h-5 w-5" />
                      My Complaints
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Quick Stats */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>System Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Complaints:</span>
                    <span className="font-semibold">12,456</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Resolved This Month:</span>
                    <span className="font-semibold text-green-600">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Resolution:</span>
                    <span className="font-semibold">3.2 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate:</span>
                    <span className="font-semibold text-blue-600">94.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button asChild className="w-full justify-start">
                    <Link to="/guest/complaint">
                      <FileText className="mr-2 h-4 w-4" />
                      Submit New Complaint
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full justify-start">
                    <Link to="/guest/track">
                      <Clock className="mr-2 h-4 w-4" />
                      Track Existing Complaint
                    </Link>
                  </Button>
                  {!isAuthenticated && (
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link to="/register">
                        <User className="mr-2 h-4 w-4" />
                        Create Account
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  <span>Popular Complaint Types</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Water Supply Issues</span>
                    <span className="text-gray-500">23%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Road Repairs</span>
                    <span className="text-gray-500">19%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Electricity Problems</span>
                    <span className="text-gray-500">15%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Garbage Collection</span>
                    <span className="text-gray-500">12%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Other Issues</span>
                    <span className="text-gray-500">31%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5 text-green-500" />
                  <span>Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Helpline: 1800-XXX-XXXX</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">support@cochinsmartcity.in</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Office Hours: 9 AM - 6 PM</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Cochin Corporation Office</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Status Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isAuthenticated ? `Welcome, ${user?.fullName || 'User'}` : "Welcome, Guest"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <span>Role: </span>
                      <Badge variant="outline">
                        {user?.role?.replace("_", " ") || "User"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span>Ward: </span>
                      <span className="font-medium">
                        {user?.ward?.name || "Not assigned"}
                      </span>
                    </div>
                    <div className="space-y-2 pt-2">
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/complaints">My Complaints</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/dashboard">Dashboard</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/profile">Profile</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Submit complaints as a guest or login for enhanced features and tracking.
                    </p>
                    <div className="space-y-2">
                      <Button asChild className="w-full">
                        <Link to="/login">Login</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/register">Create Account</Link>
                      </Button>
                      <hr className="my-3" />
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/guest/complaint">Guest Complaint</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/guest/track">Track Status</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Key Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Real-time Tracking</div>
                      <div className="text-gray-600">Monitor complaint progress</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Photo Upload</div>
                      <div className="text-gray-600">Attach evidence and images</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">SMS/Email Alerts</div>
                      <div className="text-gray-600">Get update notifications</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Multi-language</div>
                      <div className="text-gray-600">Available in local languages</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
