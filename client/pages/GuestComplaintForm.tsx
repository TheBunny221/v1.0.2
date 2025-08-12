import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { selectAuth, getDashboardRouteForRole } from "../store/slices/authSlice";
import {
  useSubmitGuestComplaintMutation,
} from "../store/api/guestApi";
import { useOtpFlow } from "../contexts/OtpContext";
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
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import {
  FileText,
  Mail,
  CheckCircle,
  Clock,
  User,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Loader2,
  UserPlus,
  Shield,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";

// Mock wards data - in real app this would come from API
const WARDS = [
  { id: "ward-1", name: "Fort Kochi" },
  { id: "ward-2", name: "Mattancherry" },
  { id: "ward-3", name: "Ernakulam South" },
  { id: "ward-4", name: "Ernakulam North" },
  { id: "ward-5", name: "Kadavanthra" },
  { id: "ward-6", name: "Thevara" },
];

const COMPLAINT_TYPES = [
  { value: "WATER_SUPPLY", label: "Water Supply" },
  { value: "ELECTRICITY", label: "Electricity" },
  { value: "ROAD_REPAIR", label: "Road Repair" },
  { value: "GARBAGE_COLLECTION", label: "Garbage Collection" },
  { value: "STREET_LIGHTING", label: "Street Lighting" },
  { value: "SEWERAGE", label: "Sewerage" },
  { value: "PUBLIC_HEALTH", label: "Public Health" },
  { value: "TRAFFIC", label: "Traffic" },
  { value: "OTHERS", label: "Others" },
];

const PRIORITIES = [
  { value: "LOW", label: "Low", color: "bg-gray-500" },
  { value: "MEDIUM", label: "Medium", color: "bg-blue-500" },
  { value: "HIGH", label: "High", color: "bg-orange-500" },
  { value: "CRITICAL", label: "Critical", color: "bg-red-500" },
];

const GuestComplaintForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { openOtpFlow } = useOtpFlow();
  const { isAuthenticated, user } = useAppSelector(selectAuth);

  // API hooks
  const [submitGuestComplaint, { isLoading: isSubmitting }] = useSubmitGuestComplaintMutation();

  const [submissionStep, setSubmissionStep] = useState<"form" | "success">("form");
  const [complaintId, setComplaintId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    type: "",
    priority: "MEDIUM",
    description: "",
    wardId: "",
    area: "",
    landmark: "",
    address: "",
  });

  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRouteForRole(user.role);
      navigate(dashboardRoute);
    }
  }, [isAuthenticated, user, navigate]);

  // Get current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Location access denied or unavailable");
        },
      );
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const complaintData = {
      fullName: formData.fullName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      type: formData.type,
      priority: formData.priority,
      description: formData.description,
      wardId: formData.wardId,
      area: formData.area,
      landmark: formData.landmark,
      address: formData.address,
      coordinates: currentLocation
        ? {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
          }
        : undefined,
    };

    try {
      const result = await submitGuestComplaint(complaintData).unwrap();

      if (result.data?.complaintId) {
        setComplaintId(result.data.complaintId);

        // Open unified OTP dialog
        openOtpFlow({
          context: "guestComplaint",
          email: formData.email,
          complaintId: result.data.complaintId,
          title: "Verify Your Complaint",
          description: "Enter the verification code sent to your email to complete your complaint submission and create your account",
          onSuccess: (data) => {
            setSubmissionStep("success");
            toast({
              title: "Success!",
              description: "Your complaint has been verified and you've been registered as a citizen.",
            });
          },
        });

        toast({
          title: "Complaint Submitted",
          description: "Please check your email for the verification code.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit complaint. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartOver = () => {
    setSubmissionStep("form");
    setComplaintId(null);
    setFormData({
      fullName: "",
      email: "",
      phoneNumber: "",
      type: "",
      priority: "MEDIUM",
      description: "",
      wardId: "",
      area: "",
      landmark: "",
      address: "",
    });
  };

  const goToDashboard = () => {
    if (user) {
      const dashboardRoute = getDashboardRouteForRole(user.role);
      navigate(dashboardRoute);
    } else {
      navigate("/dashboard");
    }
  };

  const goToLogin = () => {
    navigate("/login");
  };

  // Render different steps

  if (submissionStep === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
        <div className="w-full max-w-md space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto">
                  <UserPlus className="h-8 w-8 text-green-600" />
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-green-800">
                    Welcome to Cochin Smart City!
                  </h2>
                  <p className="text-green-700 mt-2">
                    Your complaint has been verified and you've been registered as a citizen.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <p className="text-sm text-gray-700">
                    <strong>Complaint ID:</strong> {complaintId}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    You can now track your complaint progress from your
                    dashboard.
                  </p>
                </div>

                <Alert className="border-amber-200 bg-amber-50">
                  <Shield className="h-4 w-4" />
                  <AlertDescription className="text-amber-700">
                    <strong>Security Tip:</strong> Set a password in your
                    profile settings for easier future logins, or continue
                    using OTP login.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Button onClick={goToDashboard} className="w-full">
                    Go to Dashboard
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleStartOver}
                    className="w-full"
                  >
                    Submit Another Complaint
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main complaint form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            Submit a Complaint
          </h1>
          <p className="text-gray-600">
            Report civic issues and get them resolved quickly
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Complaint Details
            </CardTitle>
            <CardDescription>
              Your complaint will be registered immediately and you'll receive
              an OTP for verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleComplaintSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              {/* Complaint Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Complaint Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Complaint Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        handleSelectChange("type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select complaint type" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPLAINT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        handleSelectChange("priority", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((priority) => (
                          <SelectItem
                            key={priority.value}
                            value={priority.value}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${priority.color}`}
                              />
                              {priority.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the issue in detail..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    required
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ward *</Label>
                    <Select
                      value={formData.wardId}
                      onValueChange={(value) =>
                        handleSelectChange("wardId", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ward" />
                      </SelectTrigger>
                      <SelectContent>
                        {WARDS.map((ward) => (
                          <SelectItem key={ward.id} value={ward.id}>
                            {ward.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area">Area/Locality *</Label>
                    <Input
                      id="area"
                      name="area"
                      placeholder="Enter area or locality"
                      value={formData.area}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="landmark">Nearby Landmark</Label>
                    <Input
                      id="landmark"
                      name="landmark"
                      placeholder="Enter nearby landmark"
                      value={formData.landmark}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Complete Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="Enter complete address"
                      value={formData.address}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {currentLocation && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">
                      📍 Location detected and will be included with your
                      complaint
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Complaint
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Additional Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">
                What happens next?
              </h4>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Your complaint will be registered immediately</li>
                <li>2. You'll receive an OTP via email for verification</li>
                <li>
                  3. After verification, you'll be registered as a citizen
                </li>
                <li>4. You can then track your complaint progress</li>
              </ol>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <button
                  onClick={goToLogin}
                  className="text-blue-600 hover:underline"
                >
                  Login here
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuestComplaintForm;
