import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { clearError, selectAuth } from "../store/slices/authSlice";
import { useSetPasswordMutation } from "../store/api/authApi";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Eye, EyeOff, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const SetPassword: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const { appName } = useSystemConfig();

  const { error, isAuthenticated } = useAppSelector(selectAuth);
  const [setPasswordMutation, { isLoading }] = useSetPasswordMutation();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    match: false,
  });

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Validate token exists
  useEffect(() => {
    if (!token) {
      toast({
        title: "Invalid Link",
        description: "The password setup link is invalid or missing.",
        variant: "destructive",
      });
      navigate("/login");
    }
  }, [token, navigate, toast]);

  // Password validation
  useEffect(() => {
    const { password, confirmPassword } = formData;

    setPasswordValidation({
      minLength: password.length >= 6,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      match: password.length > 0 && password === confirmPassword,
    });
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      return;
    }

    const { password, confirmPassword } = formData;

    // Validate passwords match
    if (password !== confirmPassword) {
      return;
    }

    // Validate password strength
    const isValid = Object.values(passwordValidation).every(Boolean);
    if (!isValid) {
      return;
    }

    try {
      await setPasswordMutation({
        token: token!,
        password,
      }).unwrap();

      toast({
        title: "Password Set Successfully",
        description: "You are now logged in and can access your account.",
      });

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.data?.message || "Failed to set password. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isFormValid = Object.values(passwordValidation).every(Boolean);

  const ValidationItem: React.FC<{ isValid: boolean; text: string }> = ({
    isValid,
    text,
  }) => (
    <div
      className={`flex items-center gap-2 text-sm ${isValid ? "text-green-600" : "text-gray-500"}`}
    >
      {isValid ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {text}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Set Your Password
          </h1>
          <p className="text-gray-600">
            Create a secure password for your {appName} account
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create Password</CardTitle>
            <CardDescription>
              Choose a strong password to protect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error Alert */}
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">
                  Password Requirements:
                </p>
                <div className="space-y-1">
                  <ValidationItem
                    isValid={passwordValidation.minLength}
                    text="At least 6 characters long"
                  />
                  <ValidationItem
                    isValid={passwordValidation.hasUpper}
                    text="Contains uppercase letter"
                  />
                  <ValidationItem
                    isValid={passwordValidation.hasLower}
                    text="Contains lowercase letter"
                  />
                  <ValidationItem
                    isValid={passwordValidation.hasNumber}
                    text="Contains number"
                  />
                  <ValidationItem
                    isValid={passwordValidation.match}
                    text="Passwords match"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? "Setting Password..." : "Set Password"}
              </Button>
            </form>

            {/* Additional Info */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Security Notice:</strong> After setting your password,
                you'll be automatically logged in and can access your account
                using either password or OTP login methods.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetPassword;
