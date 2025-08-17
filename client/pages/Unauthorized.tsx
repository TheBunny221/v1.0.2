import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Shield, AlertTriangle, Home, LogIn } from "lucide-react";

const Unauthorized: React.FC = () => {
  const { appName } = useSystemConfig();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-600">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            You don't have permission to access this page. Please contact your
            administrator if you believe this is an error.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button variant="outline" className="w-full sm:w-auto">
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </Link>
            <Link to="/login">
              <Button className="w-full sm:w-auto">
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            </Link>
          </div>

          <div className="mt-8 pt-4 border-t">
            <div className="flex items-center justify-center space-x-2 text-gray-500">
              <Shield className="h-4 w-4" />
              <span className="text-sm">{appName} E-Governance</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;
