import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { createComplaint } from "../store/slices/complaintsSlice";
import { sendOtpForGuest, resetOtpState } from "../store/slices/guestSlice";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { MapPin, Upload, RefreshCw, User, UserCheck, Mail, Phone } from "lucide-react";
import OtpVerificationModal from "../components/OtpVerificationModal";

const GuestComplaintForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isSubmitting } = useAppSelector((state) => state.complaints);
  const { translations } = useAppSelector((state) => state.language);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { isOtpSent, isLoading } = useAppSelector((state) => state.guest);

  const [activeTab, setActiveTab] = useState(isAuthenticated ? "registered" : "guest");
  const [showOtpModal, setShowOtpModal] = useState(false);

  const [formData, setFormData] = useState({
    mobile: "",
    email: "",
    problemType: "",
    ward: "",
    area: "",
    location: "",
    address: "",
    description: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [captcha, setCaptcha] = useState("");
  const [captchaValue] = useState("A3X7M"); // Mock captcha

  const problemTypes = [
    { key: "Water_Supply", label: "Water Supply" },
    { key: "Electricity", label: "Electricity" },
    { key: "Road_Repair", label: "Road Repair" },
    { key: "Garbage_Collection", label: "Garbage Collection" },
    { key: "Street_Lighting", label: "Street Lighting" },
    { key: "Sewerage", label: "Sewerage" },
    { key: "Public_Health", label: "Public Health" },
    { key: "Traffic", label: "Traffic" },
    { key: "Others", label: "Others" },
  ];

  const wards = [
    "Ward 1 - Central Zone",
    "Ward 2 - North Zone",
    "Ward 3 - South Zone",
    "Ward 4 - East Zone",
    "Ward 5 - West Zone",
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.mobile || !formData.problemType || !formData.ward || !formData.area || !formData.description) {
      dispatch(showErrorToast("Validation Error", "Please fill in all required fields"));
      return false;
    }

    if (activeTab === "guest" && !formData.email) {
      dispatch(showErrorToast("Email Required", "Email is required for guest submissions"));
      return false;
    }

    if (captcha !== captchaValue) {
      dispatch(showErrorToast("Invalid CAPTCHA", "Please enter the correct CAPTCHA code"));
      return false;
    }

    return true;
  };

  const handleRegisteredUserSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      const complaintData = {
        type: formData.problemType as any,
        description: formData.description,
        contactInfo: {
          mobile: formData.mobile,
          email: formData.email || user?.email,
        },
        location: {
          ward: formData.ward,
          area: formData.area,
          address: formData.address,
          coordinates: formData.location ? {
            latitude: 0, // You can integrate with maps API
            longitude: 0,
          } : undefined,
          landmark: formData.location,
        },
        isAnonymous: false,
      };

      const result = await dispatch(createComplaint(complaintData)).unwrap();

      dispatch(showSuccessToast(
        "Complaint Submitted",
        `Complaint registered successfully! ID: ${result.complaintId}`
      ));

      resetForm();
    } catch (error) {
      dispatch(showErrorToast(
        "Submission Failed",
        error instanceof Error ? error.message : "Failed to submit complaint"
      ));
    }
  };

  const handleGuestSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    const guestComplaintData = {
      type: formData.problemType,
      description: formData.description,
      contactMobile: formData.mobile,
      contactEmail: formData.email,
      ward: formData.ward,
      area: formData.area,
      address: formData.address || undefined,
      landmark: formData.location || undefined,
      files: files.length > 0 ? files : undefined,
    };

    try {
      await dispatch(sendOtpForGuest({
        email: formData.email,
        complaintData: guestComplaintData,
      })).unwrap();

      setShowOtpModal(true);
      dispatch(showSuccessToast(
        "OTP Sent",
        `Verification code sent to ${formData.email}`
      ));
    } catch (error) {
      dispatch(showErrorToast(
        "Failed to Send OTP",
        error instanceof Error ? error.message : "Please try again"
      ));
    }
  };

  const resetForm = () => {
    setFormData({
      mobile: "",
      email: "",
      problemType: "",
      ward: "",
      area: "",
      location: "",
      address: "",
      description: "",
    });
    setFiles([]);
    setCaptcha("");
    dispatch(resetOtpState());
  };

  const handleModalClose = () => {
    setShowOtpModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {translations.complaints.registerComplaint}
            </h1>
            <p className="text-muted-foreground">
              Submit your complaint and track its progress through our system
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/track">Track Complaint</Link>
          </Button>
        </div>

        {/* User Type Selection */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="guest" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Guest Submission</span>
            </TabsTrigger>
            <TabsTrigger value="registered" className="flex items-center space-x-2" disabled={!isAuthenticated}>
              <UserCheck className="h-4 w-4" />
              <span>Registered User</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="guest" className="mt-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Guest Submission Process</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    For guest users, we'll send an OTP to your email for verification before submitting your complaint. 
                    This ensures the authenticity of your submission and enables you to track your complaint later.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="registered" className="mt-4">
            {isAuthenticated ? (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start space-x-3">
                  <UserCheck className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-green-900">Welcome back, {user?.name}!</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Your complaint will be submitted immediately and you can track it from your dashboard.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-orange-900">Login Required</h3>
                    <p className="text-sm text-orange-700 mt-1">
                      Please <Link to="/login" className="underline font-medium">login</Link> or <Link to="/register" className="underline font-medium">register</Link> to submit complaints as a registered user.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>Complaint Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={activeTab === "guest" ? handleGuestSubmit : handleRegisteredUserSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile" className="flex items-center space-x-1">
                  <Phone className="h-4 w-4" />
                  <span>{translations.complaints.mobile} *</span>
                </Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange("mobile", e.target.value)}
                  placeholder="Enter your mobile number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>{translations.auth.email} {activeTab === "guest" && "*"}</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || (activeTab === "registered" && user?.email) || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  required={activeTab === "guest"}
                  disabled={activeTab === "registered" && !!user?.email}
                />
              </div>
            </div>

            {/* Problem Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="problem-type">
                  {translations.complaints.complaintType} *
                </Label>
                <Select
                  value={formData.problemType}
                  onValueChange={(value) => handleInputChange("problemType", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select complaint type" />
                  </SelectTrigger>
                  <SelectContent>
                    {problemTypes.map((type) => (
                      <SelectItem key={type.key} value={type.key}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ward">{translations.complaints.ward} *</Label>
                <Select
                  value={formData.ward}
                  onValueChange={(value) => handleInputChange("ward", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your ward" />
                  </SelectTrigger>
                  <SelectContent>
                    {wards.map((ward) => (
                      <SelectItem key={ward} value={ward}>
                        {ward}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Location Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="area">{translations.complaints.area} *</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                  placeholder="Enter area name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Landmark</Label>
                <div className="flex space-x-2">
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Nearby landmark (optional)"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon">
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Full Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Complete address (optional)"
                  rows={3}
                />
              </div>
            </div>

            {/* Complaint Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                {translations.complaints.description} *
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your complaint in detail..."
                rows={4}
                required
              />
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
              <Label>Supporting Documents (Optional)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6">
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload images, videos, or PDF files
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" asChild>
                      <span>Upload Files</span>
                    </Button>
                  </Label>
                </div>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Files:</p>
                  <div className="flex flex-wrap gap-2">
                    {files.map((file, index) => (
                      <Badge key={index} variant="secondary" className="pr-1">
                        {file.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => removeFile(index)}
                        >
                          ×
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CAPTCHA */}
            <div className="space-y-4">
              <Label>Security Verification *</Label>
              <div className="flex items-center space-x-4">
                <div className="bg-gray-100 px-4 py-2 rounded border font-mono text-lg tracking-wider">
                  {captchaValue}
                </div>
                <Button type="button" variant="outline" size="icon">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
                placeholder="Enter the code shown above"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button
                type="submit"
                className="flex-1 md:flex-none"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {activeTab === "guest" ? "Sending OTP..." : "Submitting..."}
                  </>
                ) : (
                  activeTab === "guest" ? "Send OTP & Submit" : "Submit Complaint"
                )}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Reset Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        onClose={handleModalClose}
        email={formData.email}
      />
    </div>
  );
};

export default GuestComplaintForm;
