import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  FileText,
  Phone,
  Mail,
  User,
  Clock,
  BarChart3,
  Shield,
  MapPin,
  CheckCircle,
} from "lucide-react";
import QuickComplaintForm from "../components/QuickComplaintForm";

const Index: React.FC = () => {
  const { translations, currentLanguage } = useAppSelector(
    (state) => state.language,
  );
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { appName, getConfig } = useSystemConfig();
  const navigate = useNavigate();

  // Form state
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

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
              {/** <Button
                onClick={() => setIsFormExpanded(!isFormExpanded)}
                size="lg"
                className="bg-primary hover:bg-primary/90"
              >
                <Link to="/complaint"> 
                  <FileText className="mr-2 h-5 w-5" />
                  {translations?.complaints?.registerComplaint ||
                    "Register Complaint"}
                </Link>
              </Button>**/}

              <Button
                onClick={() => setIsFormExpanded(!isFormExpanded)}
                size="lg"
                className="bg-primary hover:bg-primary/90"
                variant="outline"
              >
                <FileText className="mr-2 h-5 w-5" style={{color:"#ffffff"}} />
                {translations?.complaints?.registerComplaint ||
                  "Register Complaint"}
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
                    <div className="text-sm text-gray-600">
                      {getConfig("CONTACT_HELPLINE", "1800-XXX-XXXX")}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-500 flex-shrink-0" />
                  <div>
                    <div className="font-medium">
                      {translations?.auth?.email || "Email Support"}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getConfig("CONTACT_EMAIL", "support@cochinsmartcity.in")}
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
                      {getConfig(
                        "CONTACT_OFFICE_HOURS",
                        "Monday - Friday: 9 AM - 6 PM",
                      )}
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
                      {getConfig(
                        "CONTACT_OFFICE_ADDRESS",
                        "Cochin Corporation Office",
                      )}
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
                          ? "ടൈപ്പ്, ഫോട്ടോ, ലൊക്കേഷൻ എന്നിവ ഉപയോഗിച്ച് ഒരു മിനിറ���റിനുള്ളിൽ പ്രശ്നങ്ങൾ ��േഖപ്പെടുത്തുക"
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
                          ? "ബഹുഭ��ഷാ പിന്തുണ"
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
