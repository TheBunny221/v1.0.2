import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  createComplaint,
  ComplaintType,
  Priority,
} from "../store/slices/complaintsSlice";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  MapPin,
  Upload,
  RefreshCw,
  FileText,
  Phone,
  Mail,
  User,
  CheckCircle,
  Clock,
  BarChart3,
  Shield,
  AlertCircle,
  Zap,
  Wrench,
  Droplets,
} from "lucide-react";

const Index: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.complaints);
  const { translations, currentLanguage } = useAppSelector(
    (state) => state.language,
  );
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // Form state
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
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        mobile: user.phoneNumber || "",
        email: user.email || "",
      }));
    }
  }, [isAuthenticated, user]);

  const problemTypes = [
    {
      key: "WATER_SUPPLY",
      label: translations?.complaints?.types?.Water_Supply || "Water Supply",
      icon: <Droplets className="h-4 w-4" />,
    },
    {
      key: "ELECTRICITY",
      label: translations?.complaints?.types?.Electricity || "Electricity",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      key: "ROAD_REPAIR",
      label: translations?.complaints?.types?.Road_Repair || "Road Repair",
      icon: <Wrench className="h-4 w-4" />,
    },
    {
      key: "GARBAGE_COLLECTION",
      label:
        translations?.complaints?.types?.Garbage_Collection ||
        "Garbage Collection",
      icon: <FileText className="h-4 w-4" />,
    },
    {
      key: "STREET_LIGHTING",
      label:
        translations?.complaints?.types?.Street_Lighting || "Street Lighting",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      key: "SEWERAGE",
      label: translations?.complaints?.types?.Sewerage || "Sewerage",
      icon: <Droplets className="h-4 w-4" />,
    },
    {
      key: "PUBLIC_HEALTH",
      label: translations?.complaints?.types?.Public_Health || "Public Health",
      icon: <CheckCircle className="h-4 w-4" />,
    },
    {
      key: "TRAFFIC",
      label: translations?.complaints?.types?.Traffic || "Traffic",
      icon: <AlertCircle className="h-4 w-4" />,
    },
    {
      key: "OTHERS",
      label: translations?.complaints?.types?.Others || "Others",
      icon: <FileText className="h-4 w-4" />,
    },
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (captcha !== captchaValue) {
      dispatch(
        showErrorToast(
          translations?.forms?.invalidCaptcha || "Invalid CAPTCHA",
          translations?.forms?.enterCaptcha ||
            "Please enter the correct CAPTCHA code",
        ),
      );
      return;
    }

    if (
      !formData.mobile ||
      !formData.problemType ||
      !formData.ward ||
      !formData.area ||
      !formData.description
    ) {
      dispatch(
        showErrorToast(
          translations?.forms?.requiredField || "Required Field",
          translations?.forms?.requiredField ||
            "Please fill all required fields",
        ),
      );
      return;
    }

    try {
      const complaintDataForAPI = {
        title: `${formData.problemType} complaint`,
        description: formData.description,
        type: formData.problemType as ComplaintType,
        priority: "MEDIUM" as Priority,
        wardId: formData.ward,
        area: formData.area,
        landmark: formData.location,
        address: formData.address,
        contactName: isAuthenticated && user ? user.fullName : "Guest",
        contactEmail:
          formData.email || (isAuthenticated && user ? user.email : ""),
        contactPhone: formData.mobile,
        isAnonymous: !isAuthenticated,
      };

      const result = await dispatch(
        createComplaint(complaintDataForAPI),
      ).unwrap();

      dispatch(
        showSuccessToast(
          translations?.forms?.complaintSubmitted || "Complaint Submitted",
          `${translations?.forms?.complaintSubmitted || "Complaint registered successfully"} ID: ${result.id}`,
        ),
      );

      // Reset form
      resetForm();
      setIsFormExpanded(false);
    } catch (error) {
      dispatch(
        showErrorToast(
          translations?.forms?.complaintSubmissionError || "Submission Failed",
          error instanceof Error
            ? error.message
            : translations?.forms?.complaintSubmissionError ||
                "Failed to submit complaint",
        ),
      );
    }
  };

  const resetForm = () => {
    setFormData({
      mobile: isAuthenticated && user ? user.phoneNumber || "" : "",
      email: isAuthenticated && user ? user.email || "" : "",
      problemType: "",
      ward: "",
      area: "",
      location: "",
      address: "",
      description: "",
    });
    setFiles([]);
    setCaptcha("");
  };

  // Show loading if translations not ready
  if (!translations) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">
            {translations?.common?.loading || "Loading..."}
          </p>
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
              <Shield className="h-12 w-12 text-primary mr-3" />
              <h1 className="text-4xl font-bold text-gray-900">
                {translations?.nav?.home || "Cochin Smart City Portal"}
              </h1>
            </div>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              {translations?.guest?.guestSubmissionDescription ||
                "Welcome to the Cochin Smart City Complaint Management System. Submit civic issues, track progress, and help build a better city together."}
            </p>

            <div className="flex justify-center space-x-4 flex-wrap gap-4 mb-8">
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                <Link to="/complaint">
                  <FileText className="mr-2 h-5 w-5" />
                  {translations?.complaints?.registerComplaint ||
                    "Register Complaint"}
                </Link>
              </Button>

              <Button
                onClick={() => setIsFormExpanded(!isFormExpanded)}
                size="lg"
                variant="outline"
              >
                <FileText className="mr-2 h-5 w-5" />
                {translations?.forms?.quickForm || "Quick Form"}
              </Button>

              {!isAuthenticated ? (
                <>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/login">
                      <User className="mr-2 h-5 w-5" />
                      {translations?.nav?.login ||
                        translations?.auth?.login ||
                        "Login"}
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/guest/track">
                      <Clock className="mr-2 h-5 w-5" />
                      {translations?.nav?.trackStatus || "Track Complaint"}
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/dashboard">
                      <BarChart3 className="mr-2 h-5 w-5" />
                      {translations?.nav?.dashboard || "Dashboard"}
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link to="/complaints">
                      <FileText className="mr-2 h-5 w-5" />
                      {translations?.nav?.myComplaints || "My Complaints"}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Complaint Registration Form */}
      {isFormExpanded && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span>
                    {translations?.complaints?.registerComplaint ||
                      "Register Complaint"}
                  </span>
                  {!isAuthenticated && (
                    <Badge variant="secondary" className="ml-2">
                      {translations?.auth?.guestMode || "Guest Mode"}
                    </Badge>
                  )}
                </CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setIsFormExpanded(false)}
                >
                  {translations?.common?.close || "Close"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {translations?.forms?.contactInformation ||
                      "Contact Information"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobile">
                        {translations?.complaints?.mobile || "Mobile Number"} *
                      </Label>
                      <Input
                        id="mobile"
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) =>
                          handleInputChange("mobile", e.target.value)
                        }
                        placeholder={`${translations?.common?.required || "Enter your"} ${translations?.complaints?.mobile || "mobile number"}`}
                        required
                        disabled={isAuthenticated && !!user?.phoneNumber}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {translations?.auth?.email || "Email Address"}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        placeholder={`${translations?.common?.optional || "Enter your"} ${translations?.auth?.email || "email address"}`}
                        disabled={isAuthenticated && !!user?.email}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Problem Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {translations?.forms?.problemDetails || "Problem Details"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="problem-type">
                        {translations?.complaints?.complaintType ||
                          "Complaint Type"}{" "}
                        *
                      </Label>
                      <Select
                        value={formData.problemType}
                        onValueChange={(value) =>
                          handleInputChange("problemType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={`${translations?.common?.selectAll || "Select"} ${translations?.complaints?.complaintType || "complaint type"}`}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {problemTypes.map((type) => (
                            <SelectItem key={type.key} value={type.key}>
                              <div className="flex items-center space-x-2">
                                {type.icon}
                                <span>{type.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ward">
                        {translations?.complaints?.ward || "Ward"} *
                      </Label>
                      <Select
                        value={formData.ward}
                        onValueChange={(value) =>
                          handleInputChange("ward", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={`${translations?.common?.selectAll || "Select your"} ${translations?.complaints?.ward || "ward"}`}
                          />
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
                </div>

                <Separator />

                {/* Location Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {translations?.forms?.locationDetails || "Location Details"}
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="area">
                        {translations?.complaints?.area || "Area"} *
                      </Label>
                      <Input
                        id="area"
                        value={formData.area}
                        onChange={(e) =>
                          handleInputChange("area", e.target.value)
                        }
                        placeholder={
                          translations?.forms?.minCharacters ||
                          "Enter area (minimum 3 characters)"
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">
                        {translations?.complaints?.location ||
                          "Location/Landmark"}
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) =>
                            handleInputChange("location", e.target.value)
                          }
                          placeholder={`${translations?.complaints?.landmark || "Specific location or landmark"}`}
                          className="flex-1"
                        />
                        <Button type="button" variant="outline" size="icon">
                          <MapPin className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">
                        {translations?.complaints?.address || "Full Address"}
                      </Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          handleInputChange("address", e.target.value)
                        }
                        placeholder={`${translations?.complaints?.address || "Complete address details"}...`}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Complaint Description */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {translations?.forms?.complaintDescription ||
                      "Complaint Description"}
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      {translations?.complaints?.description || "Description"} *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      placeholder={`${translations?.forms?.complaintDescription || "Describe your complaint in detail"}...`}
                      rows={4}
                      required
                    />
                  </div>
                </div>

                <Separator />

                {/* File Uploads */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {translations?.forms?.optionalUploads || "Optional Uploads"}
                  </h3>
                  <div className="border-2 border-dashed border-border rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        {translations?.common?.upload || "Upload"}{" "}
                        {translations?.complaints?.files ||
                          "images, videos, or PDF files"}
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
                          <span>
                            {translations?.common?.upload || "Upload"}{" "}
                            {translations?.complaints?.files || "Files"}
                          </span>
                        </Button>
                      </Label>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {translations?.complaints?.files || "Uploaded Files"}:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {files.map((file, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="pr-1"
                          >
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

                <Separator />

                {/* CAPTCHA */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {translations?.forms?.captchaVerification ||
                      "CAPTCHA Verification"}{" "}
                    *
                  </h3>
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
                    placeholder={
                      translations?.forms?.enterCaptcha ||
                      "Enter the code shown above"
                    }
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 md:flex-none"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? translations?.common?.loading || "Submitting..."
                      : translations?.forms?.submitComplaint ||
                        "Submit Complaint"}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    {translations?.forms?.resetForm || "Reset Form"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-green-500" />
                <span>
                  {translations?.guest?.supportContact ||
                    "Need Help? Contact Us"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <div>
                    <div className="font-medium">
                      {translations?.guest?.supportContact || "Helpline"}
                    </div>
                    <div className="text-sm text-gray-600">1800-XXX-XXXX</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <div>
                    <div className="font-medium">
                      {translations?.auth?.email || "Email Support"}
                    </div>
                    <div className="text-sm text-gray-600">
                      support@cochinsmartcity.in
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <div>
                    <div className="font-medium">
                      {translations?.common?.time || "Office Hours"}
                    </div>
                    <div className="text-sm text-gray-600">
                      Monday - Friday: 9 AM - 6 PM
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-purple-500 flex-shrink-0" />
                  <div>
                    <div className="font-medium">
                      {translations?.complaints?.location || "Office Location"}
                    </div>
                    <div className="text-sm text-gray-600">
                      Cochin Corporation Office
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span>
                  {translations?.features?.keyFeatures || "Key Features"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">
                      {translations?.nav?.trackStatus || "Track Status"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {translations?.dashboard?.realTimeTracking ||
                        "Monitor complaint progress in real time with instant updates"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">
                      {translations?.complaints?.registerComplaint || "Quick Complaint Registration"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {translations?.guest?.quickRegistration ||
                        "Log issues in under a minute with type, photo, and location"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">
                      {translations?.settings?.emailAlerts || "Email Alerts"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {translations?.guest?.stageNotifications ||
                        "Get notified at each stage — from registration to resolution"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">
                      {translations?.settings?.language || "Multilingual Support"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {translations?.guest?.languageOptions ||
                        "Available in English, Malayalam, and Hindi"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
