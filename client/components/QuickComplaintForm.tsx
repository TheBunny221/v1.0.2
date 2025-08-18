import React, { useState, useEffect, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import {
  createComplaint,
  ComplaintType,
  Priority,
} from "../store/slices/complaintsSlice";
import {
  submitGuestComplaint,
  clearGuestData,
  FileAttachment,
} from "../store/slices/guestSlice";
import {
  useGetWardsQuery,
  useVerifyGuestOtpMutation,
  useGenerateCaptchaQuery,
  useLazyGenerateCaptchaQuery,
} from "../store/api/guestApi";
import {
  selectAuth,
  setCredentials,
} from "../store/slices/authSlice";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";
import { useToast } from "../hooks/use-toast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import SimpleLocationMapDialog from "./SimpleLocationMapDialog";
import {
  MapPin,
  Upload,
  RefreshCw,
  FileText,
  Zap,
  Wrench,
  Droplets,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";

interface QuickComplaintFormProps {
  onSuccess?: (complaintId: string) => void;
  onClose?: () => void;
}

interface FormData {
  mobile: string;
  email: string;
  problemType: string;
  ward: string;
  area: string;
  location: string;
  address: string;
  description: string;
  coordinates: { latitude: number; longitude: number } | null;
}

const QuickComplaintForm: React.FC<QuickComplaintFormProps> = ({
  onSuccess,
  onClose,
}) => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.complaints);
  const { translations } = useAppSelector((state) => state.language);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { complaintTypeOptions } = useComplaintTypes();
  const {
    data: wardsResponse,
    isLoading: wardsLoading,
    error: wardsError,
  } = useGetWardsQuery();
  const wards = Array.isArray(wardsResponse?.data) ? wardsResponse.data : [];

  // Form state
  const [formData, setFormData] = useState<FormData>({
    mobile: "",
    email: "",
    problemType: "",
    ward: "",
    area: "",
    location: "",
    address: "",
    description: "",
    coordinates: null,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [captcha, setCaptcha] = useState("");
  const [captchaId, setCaptchaId] = useState<string | null>(null);
  const [isMapDialogOpen, setIsMapDialogOpen] = useState(false);
  const [submissionMode, setSubmissionMode] = useState<"citizen" | "guest">(
    isAuthenticated ? "citizen" : "guest"
  );
  const [otpCode, setOtpCode] = useState("");
  const [complaintId, setComplaintId] = useState<string | null>(null);
  const [showOtpInput, setShowOtpInput] = useState(false);

  const { toast } = useToast();
  const [verifyGuestOtp] = useVerifyGuestOtpMutation();

  // Pre-fill user data if authenticated and set submission mode
  useEffect(() => {
    if (isAuthenticated && user) {
      setSubmissionMode("citizen");
      setFormData((prev) => ({
        ...prev,
        mobile: user.phoneNumber || "",
        email: user.email || "",
        ward: user.wardId || "",
      }));
    } else {
      setSubmissionMode("guest");
    }
  }, [isAuthenticated, user]);

  // Icon mapping for different complaint types
  const getIconForComplaintType = (type: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      WATER_SUPPLY: <Droplets className="h-4 w-4" />,
      ELECTRICITY: <Zap className="h-4 w-4" />,
      ROAD_REPAIR: <Wrench className="h-4 w-4" />,
      WASTE_MANAGEMENT: <FileText className="h-4 w-4" />,
      GARBAGE_COLLECTION: <FileText className="h-4 w-4" />,
      STREET_LIGHTING: <Zap className="h-4 w-4" />,
      DRAINAGE: <Droplets className="h-4 w-4" />,
      SEWERAGE: <Droplets className="h-4 w-4" />,
      PUBLIC_TOILET: <CheckCircle className="h-4 w-4" />,
      TREE_CUTTING: <Wrench className="h-4 w-4" />,
      PUBLIC_HEALTH: <CheckCircle className="h-4 w-4" />,
      TRAFFIC: <AlertCircle className="h-4 w-4" />,
      OTHERS: <FileText className="h-4 w-4" />,
    };
    return iconMap[type] || <FileText className="h-4 w-4" />;
  };

  const problemTypes = complaintTypeOptions.map((type) => ({
    key: type.value,
    label: type.label,
    icon: getIconForComplaintType(type.value),
  }));

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files || []);
      setFiles((prev) => [...prev, ...selectedFiles]);
    },
    []
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleLocationSelect = useCallback(
    (location: {
      latitude: number;
      longitude: number;
      address?: string;
      area?: string;
      landmark?: string;
    }) => {
      setFormData((prev) => ({
        ...prev,
        location: location.landmark || location.address || "",
        area: location.area || prev.area,
        address: location.address || prev.address,
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (captcha !== captchaValue) {
        dispatch(
          showErrorToast(
            translations?.forms?.invalidCaptcha || "Invalid CAPTCHA",
            translations?.forms?.enterCaptcha ||
              "Please enter the correct CAPTCHA code"
          )
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
              "Please fill all required fields"
          )
        );
        return;
      }

      try {
        if (submissionMode === "citizen" && isAuthenticated) {
          // Citizen flow: Submit directly to authenticated API
          const complaintData = {
            title: `${formData.problemType} complaint`,
            description: formData.description,
            type: formData.problemType as ComplaintType,
            priority: "MEDIUM" as Priority,
            wardId: formData.ward,
            area: formData.area,
            landmark: formData.location,
            address: formData.address,
            coordinates: formData.coordinates,
            contactName: user?.fullName || "",
            contactEmail: formData.email,
            contactPhone: formData.mobile,
            isAnonymous: false,
          };

          const result = await dispatch(createComplaint(complaintData)).unwrap();

          toast({
            title: "Complaint Submitted Successfully!",
            description: `Your complaint has been registered with ID: ${result.id}. You can track its progress from your dashboard.`,
          });

          // Reset form and call success callback
          resetForm();
          onSuccess?.(result.id);
        } else {
          // Guest flow: Submit complaint and send OTP
          const guestFormData = {
            fullName: "Guest User",
            email: formData.email,
            phoneNumber: formData.mobile,
            type: formData.problemType,
            priority: "MEDIUM",
            wardId: formData.ward,
            area: formData.area,
            landmark: formData.location,
            address: formData.address,
            description: formData.description,
            coordinates: formData.coordinates,
          };

          // Convert files to FileAttachment format
          const fileAttachments: FileAttachment[] = files.map((file, index) => ({
            id: `file-${index}-${Date.now()}`,
            file,
          }));

          const result = await dispatch(
            submitGuestComplaint({
              complaintData: guestFormData,
              files: fileAttachments
            })
          ).unwrap();

          if (result.complaintId && result.trackingNumber) {
            setComplaintId(result.complaintId);
            setShowOtpInput(true);
            toast({
              title: "Verification Code Sent",
              description: `A verification code has been sent to ${formData.email}. Please check your email and enter the code below.`,
            });
          }
        }
      } catch (error: any) {
        console.error("Complaint submission error:", error);
        toast({
          title: "Submission Failed",
          description:
            error.message || "Failed to submit complaint. Please try again.",
          variant: "destructive",
        });
      }
    },
    [
      captcha,
      captchaValue,
      formData,
      submissionMode,
      isAuthenticated,
      user,
      files,
      dispatch,
      translations,
      toast,
      onSuccess,
    ]
  );

  // Handle OTP verification and final submission
  const handleVerifyOtp = useCallback(async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a valid 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    if (!complaintId) {
      toast({
        title: "Error",
        description: "Complaint ID not found. Please try submitting again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Use RTK Query mutation for OTP verification
      const result = await verifyGuestOtp({
        email: formData.email,
        otpCode,
        complaintId,
        createAccount: true,
      }).unwrap();

      // Store auth token and user data if provided
      if (result.data?.token && result.data?.user) {
        dispatch(
          setCredentials({
            token: result.data.token,
            user: result.data.user,
          })
        );
        localStorage.setItem("token", result.data.token);
      }

      toast({
        title: "Success!",
        description: result.data?.isNewUser
          ? "Your complaint has been verified and your citizen account has been created successfully!"
          : "Your complaint has been verified and you've been logged in successfully!",
      });

      // Reset form and call success callback
      resetForm();
      setShowOtpInput(false);
      setComplaintId(null);
      setOtpCode("");
      onSuccess?.(complaintId);
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification Failed",
        description:
          error?.data?.message ||
          error?.message ||
          "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    }
  }, [otpCode, complaintId, formData.email, verifyGuestOtp, dispatch, toast, onSuccess]);

  const resetForm = useCallback(() => {
    setFormData({
      mobile: isAuthenticated && user ? user.phoneNumber || "" : "",
      email: isAuthenticated && user ? user.email || "" : "",
      problemType: "",
      ward: isAuthenticated && user ? user.wardId || "" : "",
      area: "",
      location: "",
      address: "",
      description: "",
      coordinates: null,
    });
    setFiles([]);
    setCaptcha("");
    setOtpCode("");
    setComplaintId(null);
    setShowOtpInput(false);
  }, [isAuthenticated, user]);

  return (
    <div className="max-w-4xl mx-auto">
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
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
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
                    onValueChange={(value) => handleInputChange("ward", value)}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={`${translations?.common?.selectAll || "Select your"} ${translations?.complaints?.ward || "ward"}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {wardsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading wards...
                        </SelectItem>
                      ) : wardsError ? (
                        <SelectItem value="error" disabled>
                          Error loading wards
                        </SelectItem>
                      ) : (
                        wards.map((ward) => (
                          <SelectItem key={ward.id} value={ward.id}>
                            {ward.name}
                          </SelectItem>
                        ))
                      )}
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
                    onChange={(e) => handleInputChange("area", e.target.value)}
                    placeholder={
                      translations?.forms?.minCharacters ||
                      "Enter area (minimum 3 characters)"
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">
                    {translations?.complaints?.location || "Location/Landmark"}
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsMapDialogOpen(true)}
                      title="Select location on map"
                    >
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

            {/* OTP Input Section for Guest Users */}
            {showOtpInput && submissionMode === "guest" && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    Email Verification
                  </h3>
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otpCode" className="text-center block">
                        Enter Verification Code
                      </Label>
                      <Input
                        id="otpCode"
                        name="otpCode"
                        type="text"
                        placeholder="Enter 6-digit code"
                        maxLength={6}
                        className="text-center text-xl font-mono tracking-widest"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        autoComplete="one-time-code"
                      />
                    </div>
                    <div className="text-center text-sm text-gray-500">
                      Code sent to: {formData.email}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="flex-1"
                        disabled={isLoading || otpCode.length !== 6}
                      >
                        Verify & Submit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowOtpInput(false);
                          setOtpCode("");
                          setComplaintId(null);
                        }}
                      >
                        Back
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            {!showOtpInput && (
              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 md:flex-none"
                  disabled={isLoading}
                >
                  {isLoading
                    ? translations?.common?.loading || "Submitting..."
                    : submissionMode === "citizen"
                    ? translations?.forms?.submitComplaint || "Submit Complaint"
                    : "Submit & Send Verification"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {translations?.forms?.resetForm || "Reset Form"}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Location Map Dialog */}
      <SimpleLocationMapDialog
        isOpen={isMapDialogOpen}
        onClose={() => setIsMapDialogOpen(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={
          formData.coordinates
            ? {
                latitude: formData.coordinates.latitude,
                longitude: formData.coordinates.longitude,
                address: formData.address,
                area: formData.area,
                landmark: formData.location,
              }
            : undefined
        }
      />
    </div>
  );
};

export default QuickComplaintForm;
