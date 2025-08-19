import React, { useEffect } from "react";
import { useAppDispatch } from "../store/hooks";
import { logout } from "../store/slices/authSlice";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { AlertTriangle, RotateCcw } from "lucide-react";

const TokenClearHelper: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const handleClearToken = () => {
    // Clear everything related to authentication
    localStorage.removeItem("token");
    localStorage.removeItem("auth_error");

    // Dispatch logout action
    dispatch(logout());

    // Show success message
    toast({
      title: "Session Cleared",
      description: "Your session has been cleared. Please log in again.",
    });

    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = "/login";
    }, 2000);
  };

  // Auto-clear if there's an auth error
  useEffect(() => {
    const authError = localStorage.getItem("auth_error");
    if (authError) {
      try {
        const error = JSON.parse(authError);
        if (error.code === "USER_NOT_FOUND" || error.code === "TOKEN_INVALID") {
          // Auto-clear the token
          handleClearToken();
        }
      } catch (e) {
        console.warn("Failed to parse auth error:", e);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle>Session Issue Detected</CardTitle>
          <CardDescription>
            Your session appears to be invalid. This usually happens after
            database updates or when tokens expire.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Click the button below to clear your session and start fresh.
          </p>

          <Button
            onClick={handleClearToken}
            className="w-full"
            variant="outline"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear Session & Login Again
          </Button>

          <p className="text-xs text-gray-500 text-center">
            You will be redirected to the login page after clearing your
            session.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenClearHelper;
