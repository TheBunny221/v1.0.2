import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  register,
  selectAuth,
  selectRegistrationStep,
  selectRegistrationData,
  resetRegistrationState
} from "../store/slices/authSlice";
import { showToast } from "../store/slices/uiSlice";
import OTPVerification from "../components/OTPVerification";
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
  const auth = useAppSelector(selectAuth);
  const registrationStep = useAppSelector(selectRegistrationStep);
  const registrationData = useAppSelector(selectRegistrationData);

  // Clear registration state on component mount
  useEffect(() => {
    dispatch(resetRegistrationState());
  }, [dispatch]);

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
      dispatch(
        showToast({
          type: "error",
          title: "Password Mismatch",
          message: "Passwords do not match",
        }),
      );
      return;
    }

    try {
      const result = await dispatch(
        register({
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          role: formData.role as any,
          wardId: formData.wardId,
        }),
      ).unwrap();

      if (result.requiresOtpVerification) {
        // OTP verification required
        dispatch(
          showToast({
            type: "success",
            title: "Registration Successful!",
            message: "Please check your email for the verification code.",
          }),
        );
      } else {
        // Direct registration without OTP
        dispatch(
          showToast({
            type: "success",
            title: "Registration Successful!",
            message: "Account created successfully! Welcome aboard!",
          }),
        );
        navigate("/dashboard");
      }
    } catch (error: any) {
      dispatch(
        showToast({
          type: "error",
          title: "Registration Failed",
          message: error.message || "Failed to create account",
        }),
      );
    }
  };

  const handleBackToRegistration = () => {
    dispatch(resetRegistrationState());
  };

  // Show OTP verification if required
  if (registrationStep === "otp_required") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Cochin Smart City
            </h1>
            <p className="text-gray-600">E-Governance Portal</p>
          </div>

          <OTPVerification onBack={handleBackToRegistration} />

          {/* Home Link */}
          <div className="text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

              <Button type="submit" className="w-full" disabled={auth.isLoading}>
                {auth.isLoading ? "Creating Account..." : "Create Account"}
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
