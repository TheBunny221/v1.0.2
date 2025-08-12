import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  selectAuth,
  resetRegistrationState,
  getDashboardRouteForRole,
} from "../store/slices/authSlice";
import { getApiErrorMessage } from "../store/api/baseApi";
import { useToast } from "../hooks/use-toast";
import { useApiErrorHandler } from "../hooks/useApiErrorHandler";
import { useRegisterMutation } from "../store/api/authApi";
import { useOtpFlow } from "../contexts/OtpContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Shield, User, Mail, Lock, Phone, MapPin, Home } from "lucide-react";

const Register: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { openOtpFlow } = useOtpFlow();
  const { handleApiError } = useApiErrorHandler();
  const { isAuthenticated, user } = useAppSelector(selectAuth);

  // API hooks
  const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();

  // Clear registration state on component mount
  useEffect(() => {
    dispatch(resetRegistrationState());
  }, [dispatch]);

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRouteForRole(user.role);
      navigate(dashboardRoute);
    }
  }, [isAuthenticated, user, navigate]);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    role: "CITIZEN",
    wardId: "",
  });

  const wards = [
    { value: "ward-1", label: "Ward 1 - Central Zone" },
    { value: "ward-2", label: "Ward 2 - North Zone" },
    { value: "ward-3", label: "Ward 3 - South Zone" },
    { value: "ward-4", label: "Ward 4 - East Zone" },
    { value: "ward-5", label: "Ward 5 - West Zone" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await registerUser({
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        role: formData.role as any,
        wardId: formData.wardId,
      }).unwrap();

      if (result.data?.requiresOtpVerification) {
        // OTP verification required - open unified dialog
        openOtpFlow({
          context: "register",
          email: formData.email,
          title: "Complete Registration",
          description:
            "Enter the verification code sent to your email to activate your account",
          onSuccess: (data) => {
            toast({
              title: "Registration Successful!",
              description: `Welcome ${data.user?.fullName}! Your account has been verified.`,
            });
            // Navigation will be handled by auth state change
          },
        });

        toast({
          title: "Registration Initiated",
          description: "Please check your email for the verification code.",
        });
      } else {
        // Direct registration without OTP
        toast({
          title: "Registration Successful!",
          description: "Account created successfully! Welcome aboard!",
        });
        // Navigation will be handled by auth state change
      }
    } catch (error: any) {
      console.error("Registration error:", JSON.stringify(error, null, 2));
      console.error("Registration error object:", error);

      // Let the global error handler handle 401s
      if (!handleApiError(error)) {
        // Handle specific user already exists scenarios
        if (error?.status === 400 && error?.data?.existingUser) {
          const { isActive, action } = error.data;

          if (isActive && action === "login") {
            toast({
              title: "Account Already Exists",
              description: "This email is already registered. Please log in instead.",
              variant: "destructive",
              action: (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline h-8 px-3"
                >
                  Go to Login
                </Link>
              ),
            });
          } else if (!isActive && action === "verify_email") {
            toast({
              title: "Email Verification Pending",
              description: "This email is already registered but not verified. Please check your email for verification code.",
            });

            // Open OTP flow for the existing unverified user
            openOtpFlow({
              context: "register",
              email: formData.email,
              title: "Complete Registration",
              description: "Enter the verification code sent to your email to activate your account. Click 'Resend Code' if you need a new verification email.",
              onSuccess: (data) => {
                toast({
                  title: "Registration Completed!",
                  description: `Welcome ${data.user?.fullName}! Your account has been verified.`,
                });
              },
            });
          }
        } else {
          // Handle other errors
          const errorMessage = getApiErrorMessage(error);
          console.log("Extracted error message:", errorMessage);
          toast({
            title: "Registration Failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Cochin Smart City
              </h1>
              <p className="text-gray-600">Create Your Account</p>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              Register for E-Governance Portal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="Enter your full name"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="Enter your email"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    placeholder="Enter your phone number"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wardId">Ward</Label>
                <Select
                  value={formData.wardId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, wardId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {wards.map((ward) => (
                      <SelectItem key={ward.value} value={ward.value}>
                        {ward.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Create a password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm your password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isRegistering}>
                {isRegistering ? "Creating Account..." : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-600 hover:underline">
                  Sign in here
                </Link>
              </p>
              <p className="text-sm text-gray-600">
                Or{" "}
                <Link
                  to="/guest/complaint"
                  className="text-green-600 hover:underline"
                >
                  Submit as Guest
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
      </div>
    </div>
  );
};

export default Register;
