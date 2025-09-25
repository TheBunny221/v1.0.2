import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { useCreateComplaintMutation } from "../store/api/complaintsApi";
import { useGetComplaintTypesQuery } from "../store/api/complaintTypesApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
import { Checkbox } from "../components/ui/checkbox";
import { useToast } from "../components/ui/use-toast";
import { getApiErrorMessage } from "../store/api/baseApi";
import {
  MapPin,
  FileText,
  Phone,
  Mail,
  User,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

interface ComplaintFormData {
  title: string;
  description: string;
  type: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  area: string;
  landmark: string;
  address: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  isAnonymous: boolean;
}

const CreateComplaint: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<ComplaintFormData>({
    title: "",
    description: "",
    type: "",
    priority: "MEDIUM",
    area: "",
    landmark: "",
    address: "",
    contactName: user?.fullName || "",
    contactEmail: user?.email || "",
    contactPhone: user?.phoneNumber || "",
    isAnonymous: false,
  });

  const [errors, setErrors] = useState<Partial<ComplaintFormData>>({});

  // Fetch complaint types
  const { data: typesResponse, isLoading: typesLoading } =
    useGetComplaintTypesQuery();
  const complaintTypes = Array.isArray(typesResponse?.data)
    ? typesResponse.data
    : [];

  // Create complaint mutation
  const [createComplaint, { isLoading: isCreating }] =
    useCreateComplaintMutation();

  const handleInputChange = (
    field: keyof ComplaintFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ComplaintFormData> = {};

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }
    if (!formData.type) {
      newErrors.type = "Complaint type is required";
    }
    if (!formData.area.trim()) {
      newErrors.area = "Area is required";
    }
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = "Contact phone is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createComplaint({
        title: formData.title || `${formData.type} complaint`,
        description: formData.description,
        complaintTypeId: formData.type,
        type: formData.type,
        priority: formData.priority,
        wardId: user?.wardId || "default-ward", // This should be determined by area/location
        area: formData.area,
        landmark: formData.landmark || undefined,
        address: formData.address || undefined,
        contactName: formData.isAnonymous ? undefined : formData.contactName,
        contactEmail: formData.isAnonymous ? undefined : formData.contactEmail,
        contactPhone: formData.contactPhone,
        isAnonymous: formData.isAnonymous,
      }).unwrap();

      toast({
        title: "Complaint Submitted",
        description: "Your complaint has been successfully registered.",
      });

      // Navigate to complaint details
      navigate(`/complaints/${result.data.id}`);
    } catch (error: any) {
      console.error("Create complaint error:", error);
      toast({
        title: "Submission Failed",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Authentication Required
        </h2>
        <p className="text-gray-600 mb-4">
          Please log in to submit a complaint.
        </p>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Register New Complaint
          </h1>
          <p className="text-gray-600">
            Submit a complaint to get it resolved quickly
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Complaint Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Complaint Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Complaint Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select complaint type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typesLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading...
                      </SelectItem>
                    ) : (
                      complaintTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-600">{errors.type}</p>
                )}
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    handleInputChange("priority", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Brief title for your complaint"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your complaint in detail..."
                rows={4}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="area">Area/Locality *</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => handleInputChange("area", e.target.value)}
                  placeholder="e.g., Fort Kochi, Mattancherry"
                  className={errors.area ? "border-red-500" : ""}
                />
                {errors.area && (
                  <p className="text-sm text-red-600">{errors.area}</p>
                )}
              </div>

              <div>
                <Label htmlFor="landmark">Landmark</Label>
                <Input
                  id="landmark"
                  value={formData.landmark}
                  onChange={(e) =>
                    handleInputChange("landmark", e.target.value)
                  }
                  placeholder="Nearby landmark (optional)"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Complete Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Complete address (optional)"
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous"
                checked={formData.isAnonymous}
                onCheckedChange={(checked) =>
                  handleInputChange("isAnonymous", checked as boolean)
                }
              />
              <Label htmlFor="anonymous">Submit anonymously</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="contactName">Name</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) =>
                    handleInputChange("contactName", e.target.value)
                  }
                  placeholder="Your name"
                  disabled={formData.isAnonymous}
                />
              </div>

              <div>
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    handleInputChange("contactEmail", e.target.value)
                  }
                  placeholder="your.email@example.com"
                  disabled={formData.isAnonymous}
                />
              </div>

              <div>
                <Label htmlFor="contactPhone">Phone Number *</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) =>
                    handleInputChange("contactPhone", e.target.value)
                  }
                  placeholder="Your phone number"
                  className={errors.contactPhone ? "border-red-500" : ""}
                />
                {errors.contactPhone && (
                  <p className="text-sm text-red-600">{errors.contactPhone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isCreating}>
            {isCreating ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Submit Complaint
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateComplaint;
