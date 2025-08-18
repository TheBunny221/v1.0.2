import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { useComplaintTypes } from "../hooks/useComplaintTypes";
import {
  createComplaint,
  ComplaintType,
  Priority,
} from "../store/slices/complaintsSlice";
import { useGetWardsQuery } from "../store/api/guestApi";
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
import SimpleLocationMapDialog from "../components/SimpleLocationMapDialog";
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
import QuickComplaintForm from "../components/QuickComplaintForm";

const Index: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.complaints);
  const { translations, currentLanguage } = useAppSelector(
    (state) => state.language,
  );
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { appName } = useSystemConfig();
  const { complaintTypeOptions } = useComplaintTypes();
  const { data: wardsResponse, isLoading: wardsLoading, error: wardsError } = useGetWardsQuery();
  const wards = Array.isArray(wardsResponse?.data) ? wardsResponse.data : [];

  // Form state
  const [isFormExpanded, setIsFormExpanded] = useState(false);


  const handleLocationSelect = (location: {
    latitude: number;
    longitude: number;
    address?: string;
    area?: string;
    landmark?: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      location: location.landmark || location.address || '',
      area: location.area || prev.area,
      address: location.address || prev.address,
      coordinates: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
    }));
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
        coordinates: formData.coordinates ? JSON.stringify(formData.coordinates) : undefined,
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
      coordinates: null,
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
                {translations?.nav?.home || `${appName} Portal`}
              </h1>
            </div>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              {translations?.guest?.guestSubmissionDescription ||
                `Welcome to the ${appName} Complaint Management System. Submit civic issues, track progress, and help build a better city together.`}
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
          <QuickComplaintForm
            onSuccess={(complaintId) => {
              setIsFormExpanded(false);
            }}
            onClose={() => setIsFormExpanded(false)}
          />
        </div>
      )}

      {/* Location Map Dialog */}
      <SimpleLocationMapDialog
        isOpen={isMapDialogOpen}
        onClose={() => setIsMapDialogOpen(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={formData.coordinates ? {
          latitude: formData.coordinates.latitude,
          longitude: formData.coordinates.longitude,
          address: formData.address,
          area: formData.area,
          landmark: formData.location,
        } : undefined}
      />

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
                      {translations?.complaints?.trackStatus || "Track Status"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentLanguage === "hi"
                        ? "वास्���विक समय में तुरंत अपडेट के साथ शिकायत ���ी प्रगति की निगरानी करें"
                        : currentLanguage === "ml"
                          ? "തൽക്ഷണ അപ്‌ഡേറ്റുകൾക്കൊപ്പം പരാതി പുരോഗതി തത്സമയം നിരീക്ഷിക��കുക"
                          : "Monitor complaint progress in real time with instant updates"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">
                      {translations?.complaints?.registerComplaint ||
                        "Quick Complaint Registration"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentLanguage === "hi"
                        ? "प्रकार, फोटो और स्थान के साथ एक मिनट से भी कम समय में मुद्दे ल��ग करें"
                        : currentLanguage === "ml"
                          ? "ടൈപ്പ്, ഫോട്ടോ, ലൊക്കേഷൻ എന്നിവ ഉപയോഗിച്ച് ഒരു മിനിറ്റിനുള്ളിൽ പ്രശ്നങ്ങൾ ��േഖപ്പെടുത്തുക"
                          : "Log issues in under a minute with type, photo, and location"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">
                      {currentLanguage === "hi"
                        ? "ईमेल अलर्���"
                        : currentLanguage === "ml"
                          ? "ഇമെയി��� അലേർട്ടുക���"
                          : "Email Alerts"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentLanguage === "hi"
                        ? "पंजीकरण से समाधान तक प्रत्येक चरण में सूचना प्राप्त करें"
                        : currentLanguage === "ml"
                          ? "രജി��്ട്രേഷൻ മുതൽ പരിഹാരം വരെ ഓരോ ഘട്ടത്തിലും അറിയിപ്പ് ലഭിക്കുക"
                          : "Get notified at each stage — from registration to resolution"}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">
                      {currentLanguage === "hi"
                        ? "बहुभाषी सहायता"
                        : currentLanguage === "ml"
                          ? "ബഹുഭാഷാ പിന്തുണ"
                          : "Multilingual Support"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentLanguage === "hi"
                        ? "अंग्रेजी, मलयालम और हिंदी में उपलब्ध"
                        : currentLanguage === "ml"
                          ? "ഇംഗ്ലീഷ്, മലയാളം, ഹിന്ദി എന്നിവയിൽ ലഭ്യമാണ്"
                          : "Available in English, Malayalam, and Hindi"}
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
