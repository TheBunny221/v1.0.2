import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { createComplaint } from "../store/slices/complaintsSlice";
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
import { 
  MapPin, 
  Upload, 
  RefreshCw, 
  FileText, 
  Phone, 
  Mail, 
  User, 
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

const Index: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isSubmitting } = useAppSelector((state) => state.complaints);
  const { translations } = useAppSelector((state) => state.language);
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
  const [showForm, setShowForm] = useState(false);

  // Pre-fill user data if authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        mobile: user.phoneNumber || "",
        email: user.email || "",
      }));
    }
  }, [isAuthenticated, user]);

  const problemTypes = [
    { key: "Water_Supply", label: translations?.complaints?.types?.Water_Supply || "Water Supply" },
    { key: "Electricity", label: translations?.complaints?.types?.Electricity || "Electricity" },
    { key: "Road_Repair", label: translations?.complaints?.types?.Road_Repair || "Road Repair" },
    { key: "Garbage_Collection", label: translations?.complaints?.types?.Garbage_Collection || "Garbage Collection" },
    { key: "Street_Lighting", label: translations?.complaints?.types?.Street_Lighting || "Street Lighting" },
    { key: "Sewerage", label: translations?.complaints?.types?.Sewerage || "Sewerage" },
    { key: "Public_Health", label: translations?.complaints?.types?.Public_Health || "Public Health" },
    { key: "Traffic", label: translations?.complaints?.types?.Traffic || "Traffic" },
    { key: "Others", label: translations?.complaints?.types?.Others || "Others" },
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
      dispatch(showErrorToast("Invalid CAPTCHA", "Please enter the correct CAPTCHA code"));
      return;
    }

    try {
      const complaintData = {
        type: formData.problemType as any,
        description: formData.description,
        contactInfo: {
          mobile: formData.mobile,
          email: formData.email || undefined,
        },
        location: {
          ward: formData.ward,
          area: formData.area,
          address: formData.address || undefined,
          landmark: formData.location || undefined,
        },
        isAnonymous: !isAuthenticated,
      };

      const result = await dispatch(createComplaint(complaintData)).unwrap();

      dispatch(showSuccessToast(
        "Complaint Submitted",
        `Complaint registered successfully! ID: ${result.id}`
      ));

      // Reset form
      resetForm();
    } catch (error) {
      dispatch(showErrorToast(
        "Submission Failed",
        error instanceof Error ? error.message : "Failed to submit complaint"
      ));
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

  if (!translations) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">Loading...</p>
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
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Cochin Smart City Complaint Management
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
              Report civic issues and track their progress. Your voice matters in building a better city.
              {!isAuthenticated && " Submit complaints as a guest or login for advanced features."}
            </p>
            
            {!showForm && (
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={() => setShowForm(true)}
                  size="lg"
                  className="bg-primary hover:bg-primary/90"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Register Complaint
                </Button>
                
                {!isAuthenticated && (
                  <>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/login">
                        <User className="mr-2 h-5 w-5" />
                        Login
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/guest/track">
                        <Clock className="mr-2 h-5 w-5" />
                        Track Complaint
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Complaint Form */}
          <div className="lg:col-span-2">
            {showForm ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                        <MapPin className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span>Register Complaint</span>
                      {!isAuthenticated && (
                        <Badge variant="secondary" className="ml-2">
                          Guest Mode
                        </Badge>
                      )}
                    </CardTitle>
                    <Button
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="mobile">
                          {translations.complaints?.mobile || "Mobile Number"} *
                        </Label>
                        <Input
                          id="mobile"
                          type="tel"
                          value={formData.mobile}
                          onChange={(e) => handleInputChange("mobile", e.target.value)}
                          placeholder="Enter your mobile number"
                          required
                          disabled={isAuthenticated && !!user?.phoneNumber}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange("email", e.target.value)}
                          placeholder="Enter your email address"
                          disabled={isAuthenticated && !!user?.email}
                        />
                      </div>
                    </div>

                    {/* Problem Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="problem-type">
                          Complaint Type *
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
                        <Label htmlFor="ward">Ward *</Label>
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
                        <Label htmlFor="area">Area *</Label>
                        <Input
                          id="area"
                          value={formData.area}
                          onChange={(e) => handleInputChange("area", e.target.value)}
                          placeholder="Enter area (minimum 3 characters)"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location/Landmark</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => handleInputChange("location", e.target.value)}
                            placeholder="Specific location or landmark"
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
                          placeholder="Complete address details..."
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Complaint Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Complaint Description *</Label>
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
                      <Label>Optional Uploads</Label>
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
                      <Label>CAPTCHA Verification *</Label>
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
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Submitting..." : "Submit Complaint"}
                      </Button>
                      <Button type="button" variant="outline" onClick={resetForm}>
                        Reset Form
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span>Complaint Statistics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Total Registered:</span>
                        <span className="font-semibold">12,456</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Resolved This Month:</span>
                        <span className="font-semibold text-green-600">1,234</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Average Resolution:</span>
                        <span className="font-semibold">3.2 days</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-blue-500" />
                      <span>Need Help?</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        <span>Helpline: 1800-XXX-XXXX</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <span>support@cochinsmartcity.in</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-orange-500" />
                        <span>Office Hours: 9 AM - 6 PM</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {isAuthenticated ? `Welcome, ${user?.fullName}` : "Welcome, Guest"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Role: <Badge variant="outline">{user?.role?.replace("_", " ")}</Badge>
                    </p>
                    <div className="space-y-2">
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/complaints">My Complaints</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/dashboard">Dashboard</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Submit complaints without registration or login for full features.
                    </p>
                    <div className="space-y-2">
                      <Button asChild className="w-full">
                        <Link to="/login">Login</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/register">Create Account</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link to="/guest/track">Track Complaint</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Complaints Types */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Complaint Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Water Supply</span>
                    <span className="text-gray-500">23%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Road Repair</span>
                    <span className="text-gray-500">19%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Electricity</span>
                    <span className="text-gray-500">15%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Garbage Collection</span>
                    <span className="text-gray-500">12%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Others</span>
                    <span className="text-gray-500">31%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
