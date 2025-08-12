import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  loginWithPassword,
  sendPasswordSetupEmail,
  clearError,
  selectAuth,
  selectRequiresPasswordSetup,
  getDashboardRouteForRole,
} from "../store/slices/authSlice";
import {
  useRequestOTPLoginMutation,
} from "../store/api/authApi";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Home,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useOtpFlow } from "../contexts/OtpContext";

const Login: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { openOtpFlow } = useOtpFlow();

  const { isLoading, error, isAuthenticated, user } = useAppSelector(selectAuth);
  const requiresPasswordSetup = useAppSelector(selectRequiresPasswordSetup);

  // API hooks
  const [requestOTPLogin, { isLoading: isRequestingOtp }] = useRequestOTPLoginMutation();

  // Form states
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">(
    "password",
  );
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRouteForRole(user.role);
      navigate(dashboardRoute);
    }
  }, [isAuthenticated, user, navigate]);

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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      return;
    }

    try {
      await dispatch(
        loginWithPassword({
          email: formData.email,
          password: formData.password,
        }),
      ).unwrap();

      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
    } catch (error: any) {
      // Error is handled by the reducer
    }
  };

  const handleOTPRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email) {
      return;
    }

    try {
      // Request OTP first
      await requestOTPLogin({ email: formData.email }).unwrap();

      // Open the unified OTP dialog
      openOtpFlow({
        context: "login",
        email: formData.email,
        onSuccess: (data) => {
          toast({
            title: "Login Successful",
            description: "Welcome back!",
          });
          // Navigation will be handled by the auth state change
        },
      });

      toast({
        title: "OTP Sent",
        description: `A verification code has been sent to ${formData.email}`,
      });
    } catch (error: any) {
      // Error is handled by the mutation
    }
  };


  const handlePasswordSetupRequest = async () => {
    try {
      await dispatch(
        sendPasswordSetupEmail({
          email: formData.email,
        }),
      ).unwrap();

      toast({
        title: "Email Sent Successfully!",
        description: `Password setup instructions have been sent to ${formData.email}. Please check your email and follow the instructions.`,
      });
    } catch (error: any) {
      // Error is handled by the reducer
    }
  };

  const resetToEmailInput = () => {
    dispatch(resetOTPState());
    setFormData((prev) => ({ ...prev, otpCode: "" }));
    setOtpTimer(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Demo credentials for testing
  const demoCredentials = [
    {
      email: "admin@cochinsmartcity.gov.in",
      password: "admin123",
      role: "Administrator",
    },
    {
      email: "ward.officer@cochinsmartcity.gov.in",
      password: "ward123",
      role: "Ward Officer",
    },
    {
      email: "maintenance@cochinsmartcity.gov.in",
      password: "maintenance123",
      role: "Maintenance Team",
    },
    {
      email: "citizen@example.com",
      password: "citizen123",
      role: "Citizen",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Cochin Smart City
          </h1>
          <p className="text-gray-600">E-Governance Portal</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Choose your preferred login method
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

            {/* Password Setup Required */}
            {requiresPasswordSetup && (
              <Alert className="mb-4 border-amber-200 bg-amber-50">
                <AlertDescription className="text-amber-700">
                  <div className="space-y-2">
                    <p>Your password is not set. You can:</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLoginMethod("otp")}
                        className="text-amber-700 border-amber-300"
                      >
                        Login with OTP
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePasswordSetupRequest}
                        disabled={isLoading}
                        className="text-amber-700 border-amber-300"
                      >
                        Set Password
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Tabs
              value={loginMethod}
              onValueChange={(value) =>
                setLoginMethod(value as "password" | "otp")
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="password"
                  className="flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Password
                </TabsTrigger>
                <TabsTrigger value="otp" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  OTP
                </TabsTrigger>
              </TabsList>

              {/* Password Login Tab */}
              <TabsContent value="password" className="space-y-4">
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
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

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={
                      isLoading || !formData.email || !formData.password
                    }
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* OTP Login Tab */}
              <TabsContent value="otp" className="space-y-4">
                {otpStep === "none" && (
                  <form onSubmit={handleOTPRequest} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp-email">Email Address</Label>
                      <Input
                        id="otp-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || !formData.email}
                    >
                      {isLoading ? "Sending OTP..." : "Send OTP"}
                    </Button>
                  </form>
                )}

                {otpStep === "sent" && (
                  <div className="space-y-4">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto">
                        <Mail className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold">OTP Sent</h3>
                      <p className="text-sm text-gray-600">
                        We've sent a 6-digit code to
                        <br />
                        <strong>{otpEmail}</strong>
                      </p>
                    </div>

                    <form
                      onSubmit={handleOTPVerification}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="otpCode">Enter OTP Code</Label>
                        <Input
                          id="otpCode"
                          name="otpCode"
                          type="text"
                          placeholder="000000"
                          value={formData.otpCode}
                          onChange={handleInputChange}
                          maxLength={6}
                          className="text-center tracking-widest"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || formData.otpCode.length !== 6}
                      >
                        {isLoading ? "Verifying..." : "Verify OTP"}
                      </Button>
                    </form>

                    {/* OTP Timer and Resend */}
                    <div className="text-center space-y-2">
                      {otpTimer > 0 ? (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          Code expires in {formatTime(otpTimer)}
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleResendOTP}
                          disabled={isLoading}
                        >
                          Resend OTP
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={resetToEmailInput}
                        className="ml-2"
                      >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Change Email
                      </Button>
                    </div>
                  </div>
                )}

                {otpStep === "verified" && (
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">
                        Login Successful!
                      </h3>
                      <p className="text-sm text-gray-600">
                        Redirecting to dashboard...
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Links */}
            <div className="text-center space-y-2 pt-4">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link to="/register" className="text-blue-600 hover:underline">
                  Register here
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Guest user?{" "}
                <Link
                  to="/guest/complaint"
                  className="text-blue-600 hover:underline"
                >
                  Submit complaint
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Home className="h-4 w-4" />
                  Back to Home
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        {process.env.NODE_ENV === "development" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Demo Credentials</CardTitle>
              <CardDescription>For testing purposes only</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demoCredentials.map((cred, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{cred.email}</div>
                      <div className="text-xs text-gray-500">
                        {cred.password}
                      </div>
                    </div>
                    <Badge variant="outline">{cred.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Login;
