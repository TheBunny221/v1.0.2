import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { trackGuestComplaint } from "../store/slices/guestSlice";
import { setCredentials } from "../store/slices/authSlice";
import {
  useRequestComplaintOtpMutation,
  useVerifyComplaintOtpMutation,
} from "../store/api/guestApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Alert, AlertDescription } from "../components/ui/alert";
import {
  Search,
  FileText,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  Lock,
} from "lucide-react";
import QuickComplaintModal from "../components/QuickComplaintModal";
import OtpVerificationModal from "../components/OtpVerificationModal";
import ComplaintDetailsModal from "../components/ComplaintDetailsModal";

const GuestTrackComplaint: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [complaintId, setComplaintId] = useState("");
  const [trackingResult, setTrackingResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isQuickFormOpen, setIsQuickFormOpen] = useState(false);

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showComplaintDetails, setShowComplaintDetails] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [verifiedComplaint, setVerifiedComplaint] = useState<any>(null);
  const [verifiedUser, setVerifiedUser] = useState<any>(null);

  // API Hooks
  const [requestOtp, { isLoading: isRequestingOtp }] =
    useRequestComplaintOtpMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp, error: verifyError }] =
    useVerifyComplaintOtpMutation();

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Request OTP for the complaint
      const result = await requestOtp({
        complaintId: complaintId.trim(),
      }).unwrap();

      if (result.success) {
        setMaskedEmail(result.data.email);
        setShowOtpModal(true);
      }
    } catch (err: any) {
      setError(
        err?.data?.message ||
          "Complaint not found. Please check your complaint ID.",
      );
      setTrackingResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerified = async (data: {
    complaintId: string;
    otpCode: string;
  }) => {
    try {
      const result = await verifyOtp(data).unwrap();

      if (result.success) {
        // Handle auto-login if token is provided
        if (result.data.token && result.data.user) {
          // Dispatch auth credentials to Redux store
          dispatch(
            setCredentials({
              user: result.data.user,
              token: result.data.token,
            }),
          );

          // Store token in localStorage for persistence
          localStorage.setItem("token", result.data.token);

          // Show success message
          console.log(
            result.data.isNewUser
              ? "Account created and logged in successfully!"
              : "Logged in successfully!",
          );

          // Navigate to complaint details page
          if (result.data.redirectTo) {
            navigate(result.data.redirectTo);
            return;
          }
        }

        // Fallback: show complaint details in modal
        setVerifiedComplaint(result.data.complaint);
        setVerifiedUser(result.data.user);
        setShowOtpModal(false);
        setShowComplaintDetails(true);
      }
    } catch (err: any) {
      // Error will be handled by the OTP modal
      console.error("OTP verification failed:", err);
    }
  };

  const handleResendOtp = async () => {
    try {
      await requestOtp({
        complaintId: complaintId.trim(),
      }).unwrap();
    } catch (err) {
      console.error("Failed to resend OTP:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "REGISTERED":
        return "bg-yellow-100 text-yellow-800";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "REGISTERED":
        return <FileText className="h-4 w-4" />;
      case "ASSIGNED":
        return <AlertCircle className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4" />;
      case "RESOLVED":
      case "CLOSED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Track Your Complaint
              </h1>
              <p className="text-gray-600">
                Secure complaint tracking with email verification
              </p>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center space-x-2">
              <Lock className="h-5 w-5 text-blue-600" />
              <span>Secure Complaint Tracking</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Security Info */}
            <Alert className="mb-4">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                For your security, we'll send a verification code to your
                registered email before showing complaint details.
              </AlertDescription>
            </Alert>

            <form onSubmit={handleTrack} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="complaintId">Complaint ID</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="complaintId"
                      type="text"
                      value={complaintId}
                      onChange={(e) => setComplaintId(e.target.value)}
                      placeholder="Enter your complaint ID (e.g., CMP123456)"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={isLoading || isRequestingOtp}
                    className="w-full sm:w-auto"
                  >
                    {isLoading || isRequestingOtp
                      ? "Verifying..."
                      : "Verify & Track"}
                  </Button>
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Tracking Results */}
        {trackingResult && (
          <div className="space-y-6">
            {/* Complaint Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Complaint Details</span>
                  <Badge className={getStatusColor(trackingResult.status)}>
                    {trackingResult.status.replace("_", " ")}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Complaint ID
                      </h3>
                      <p className="text-gray-600">#{trackingResult.id}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Type</h3>
                      <p className="text-gray-600">
                        {trackingResult.type?.replace("_", " ")}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Description</h3>
                      <p className="text-gray-600">
                        {trackingResult.description}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        Location
                      </h3>
                      <p className="text-gray-600">{trackingResult.area}</p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Submitted On
                      </h3>
                      <p className="text-gray-600">
                        {new Date(
                          trackingResult.submittedOn,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Priority</h3>
                      <Badge variant="secondary">
                        {trackingResult.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Status Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Registered */}
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-green-600">
                          Complaint Registered
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(
                            trackingResult.submittedOn,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">
                        Your complaint has been successfully registered in our
                        system.
                      </p>
                    </div>
                  </div>

                  {/* Assigned */}
                  <div className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        [
                          "ASSIGNED",
                          "IN_PROGRESS",
                          "RESOLVED",
                          "CLOSED",
                        ].includes(trackingResult.status)
                          ? "bg-green-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <AlertCircle
                        className={`h-4 w-4 ${
                          [
                            "ASSIGNED",
                            "IN_PROGRESS",
                            "RESOLVED",
                            "CLOSED",
                          ].includes(trackingResult.status)
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`font-medium ${
                            [
                              "ASSIGNED",
                              "IN_PROGRESS",
                              "RESOLVED",
                              "CLOSED",
                            ].includes(trackingResult.status)
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          Complaint Assigned
                        </p>
                        {trackingResult.assignedOn && (
                          <p className="text-sm text-gray-500">
                            {new Date(
                              trackingResult.assignedOn,
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Assigned to the appropriate team for resolution.
                      </p>
                    </div>
                  </div>

                  {/* In Progress */}
                  <div className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        ["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(
                          trackingResult.status,
                        )
                          ? "bg-green-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <Clock
                        className={`h-4 w-4 ${
                          ["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(
                            trackingResult.status,
                          )
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`font-medium ${
                            ["IN_PROGRESS", "RESOLVED", "CLOSED"].includes(
                              trackingResult.status,
                            )
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          Work in Progress
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">
                        Our team is actively working on resolving your
                        complaint.
                      </p>
                    </div>
                  </div>

                  {/* Resolved */}
                  <div className="flex items-start space-x-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        ["RESOLVED", "CLOSED"].includes(trackingResult.status)
                          ? "bg-green-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <CheckCircle
                        className={`h-4 w-4 ${
                          ["RESOLVED", "CLOSED"].includes(trackingResult.status)
                            ? "text-green-600"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`font-medium ${
                            ["RESOLVED", "CLOSED"].includes(
                              trackingResult.status,
                            )
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          Complaint Resolved
                        </p>
                        {trackingResult.resolvedOn && (
                          <p className="text-sm text-gray-500">
                            {new Date(
                              trackingResult.resolvedOn,
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Your complaint has been successfully resolved.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expected Resolution Time */}
            <Card>
              <CardHeader>
                <CardTitle>Expected Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Expected Resolution Time</p>
                    <p className="text-sm text-gray-600">
                      Based on complaint type and priority
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">2-5 days</p>
                    <p className="text-sm text-gray-500">Business days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Submit New Complaint</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Have another issue? Submit a new complaint.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setIsQuickFormOpen(true)}
                >
                  New Complaint
                </Button>
              </div>
              <div>
                <h3 className="font-medium mb-2">Contact Support</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Need assistance? Contact our support team.
                </p>
                <Button variant="outline">Contact Support</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Complaint Modal */}
      <QuickComplaintModal
        isOpen={isQuickFormOpen}
        onClose={() => setIsQuickFormOpen(false)}
        onSuccess={(complaintId) => {
          // Could automatically set the tracking ID to show the new complaint
          setComplaintId(complaintId);
        }}
      />

      {/* OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerified={handleOtpVerified}
        complaintId={complaintId}
        maskedEmail={maskedEmail}
        isVerifying={isVerifyingOtp}
        error={verifyError?.data?.message || null}
        onResendOtp={handleResendOtp}
        isResending={isRequestingOtp}
      />

      {/* Complaint Details Modal */}
      <ComplaintDetailsModal
        isOpen={showComplaintDetails}
        onClose={() => setShowComplaintDetails(false)}
        complaint={verifiedComplaint}
        user={verifiedUser}
      />
    </div>
  );
};

export default GuestTrackComplaint;
