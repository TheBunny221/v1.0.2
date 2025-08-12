import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../store/hooks";
import { useToast } from "../hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  FileText,
  Calendar,
  MapPin,
  User,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Loader2,
  PlusCircle,
} from "lucide-react";

interface ServiceRequestData {
  fullName: string;
  email: string;
  phoneNumber: string;
  serviceType: string;
  priority: string;
  description: string;
  preferredDate: string;
  preferredTime: string;
  wardId: string;
  area: string;
  address: string;
  landmark?: string;
}

const SERVICE_TYPES = [
  {
    value: "BIRTH_CERTIFICATE",
    label: "Birth Certificate",
    description: "New birth certificate issuance",
    processingTime: "5-7 days",
  },
  {
    value: "DEATH_CERTIFICATE",
    label: "Death Certificate",
    description: "Death certificate issuance",
    processingTime: "3-5 days",
  },
  {
    value: "MARRIAGE_CERTIFICATE",
    label: "Marriage Certificate",
    description: "Marriage certificate issuance",
    processingTime: "7-10 days",
  },
  {
    value: "PROPERTY_TAX",
    label: "Property Tax",
    description: "Property tax payment and certificates",
    processingTime: "2-3 days",
  },
  {
    value: "TRADE_LICENSE",
    label: "Trade License",
    description: "Business trade license application",
    processingTime: "10-15 days",
  },
  {
    value: "BUILDING_PERMIT",
    label: "Building Permit",
    description: "Construction and renovation permits",
    processingTime: "15-20 days",
  },
  {
    value: "WATER_CONNECTION",
    label: "Water Connection",
    description: "New water connection application",
    processingTime: "7-10 days",
  },
  {
    value: "OTHERS",
    label: "Others",
    description: "Other municipal services",
    processingTime: "Varies",
  },
];

const PRIORITIES = [
  { value: "NORMAL", label: "Normal", color: "bg-blue-500" },
  { value: "URGENT", label: "Urgent", color: "bg-orange-500" },
  { value: "EMERGENCY", label: "Emergency", color: "bg-red-500" },
];

const WARDS = [
  { id: "ward-1", name: "Fort Kochi" },
  { id: "ward-2", name: "Mattancherry" },
  { id: "ward-3", name: "Ernakulam South" },
  { id: "ward-4", name: "Ernakulam North" },
  { id: "ward-5", name: "Kadavanthra" },
  { id: "ward-6", name: "Thevara" },
];

const GuestServiceRequest: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ServiceRequestData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    serviceType: "",
    priority: "NORMAL",
    description: "",
    preferredDate: "",
    preferredTime: "",
    wardId: "",
    area: "",
    address: "",
    landmark: "",
  });

  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const steps = [
    { id: 1, title: "Service Details", icon: FileText },
    { id: 2, title: "Personal Info", icon: User },
    { id: 3, title: "Location", icon: MapPin },
    { id: 4, title: "Schedule", icon: Calendar },
    { id: 5, title: "Review", icon: CheckCircle },
  ];

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.serviceType)
          errors.serviceType = "Service type is required";
        if (!formData.description.trim())
          errors.description = "Description is required";
        else if (formData.description.trim().length < 10) {
          errors.description = "Description must be at least 10 characters";
        }
        break;
      case 2:
        if (!formData.fullName.trim())
          errors.fullName = "Full name is required";
        if (!formData.email.trim()) errors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          errors.email = "Please enter a valid email address";
        }
        if (!formData.phoneNumber.trim())
          errors.phoneNumber = "Phone number is required";
        else if (
          !/^[\d\s\-\+\(\)]{10,}$/.test(formData.phoneNumber.replace(/\s/g, ""))
        ) {
          errors.phoneNumber = "Please enter a valid phone number";
        }
        break;
      case 3:
        if (!formData.wardId) errors.wardId = "Ward selection is required";
        if (!formData.area.trim()) errors.area = "Area is required";
        if (!formData.address.trim()) errors.address = "Address is required";
        break;
      case 4:
        if (!formData.preferredDate)
          errors.preferredDate = "Preferred date is required";
        if (!formData.preferredTime)
          errors.preferredTime = "Preferred time is required";
        break;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Service Request Submitted",
        description:
          "Your service request has been submitted successfully. You will receive a confirmation email shortly.",
      });

      navigate("/guest/track");
    } catch (error) {
      toast({
        title: "Submission Failed",
        description:
          "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedService = SERVICE_TYPES.find(
    (s) => s.value === formData.serviceType,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Service Request</h1>
          <p className="text-gray-600">Request municipal services online</p>
        </div>

        {/* Progress Indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Progress</h3>
                <span className="text-sm text-gray-500">
                  Step {currentStep} of {steps.length}
                </span>
              </div>
              <Progress value={progress} className="w-full" />

              {/* Step indicators */}
              <div className="flex justify-between">
                {steps.map((step) => {
                  const StepIcon = step.icon;
                  return (
                    <div
                      key={step.id}
                      className={`flex flex-col items-center space-y-2 p-2 rounded-lg transition-colors ${
                        step.id === currentStep
                          ? "bg-blue-100 text-blue-800"
                          : step.id < currentStep
                            ? "bg-green-100 text-green-800"
                            : "text-gray-400"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step.id === currentStep
                            ? "bg-blue-600 text-white"
                            : step.id < currentStep
                              ? "bg-green-600 text-white"
                              : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {step.id < currentStep ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <StepIcon className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-xs font-medium">{step.title}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(steps[currentStep - 1].icon, {
                className: "h-5 w-5",
              })}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 &&
                "Select the service you need and provide details"}
              {currentStep === 2 && "Enter your personal information"}
              {currentStep === 3 && "Specify your location"}
              {currentStep === 4 && "Choose your preferred appointment time"}
              {currentStep === 5 && "Review and submit your service request"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Service Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Service Type *</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value) =>
                      handleSelectChange("serviceType", value)
                    }
                  >
                    <SelectTrigger
                      className={
                        validationErrors.serviceType ? "border-red-500" : ""
                      }
                    >
                      <SelectValue placeholder="Select service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPES.map((service) => (
                        <SelectItem key={service.value} value={service.value}>
                          <div className="flex flex-col">
                            <span className="font-medium">{service.label}</span>
                            <span className="text-xs text-gray-500">
                              {service.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {validationErrors.serviceType && (
                    <p className="text-sm text-red-600">
                      {validationErrors.serviceType}
                    </p>
                  )}
                </div>

                {selectedService && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">
                      {selectedService.label}
                    </h3>
                    <p className="text-sm text-blue-700 mb-2">
                      {selectedService.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-blue-600">
                        Processing Time: {selectedService.processingTime}
                      </span>
                    </div>
                  </div>
                )}

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
                        <SelectItem key={priority.value} value={priority.value}>
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

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Provide detailed information about your service request..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className={
                      validationErrors.description ? "border-red-500" : ""
                    }
                  />
                  {validationErrors.description && (
                    <p className="text-sm text-red-600">
                      {validationErrors.description}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Personal Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className={
                        validationErrors.fullName ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.fullName && (
                      <p className="text-sm text-red-600">
                        {validationErrors.fullName}
                      </p>
                    )}
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
                      className={validationErrors.email ? "border-red-500" : ""}
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-red-600">
                        {validationErrors.email}
                      </p>
                    )}
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
                    className={
                      validationErrors.phoneNumber ? "border-red-500" : ""
                    }
                  />
                  {validationErrors.phoneNumber && (
                    <p className="text-sm text-red-600">
                      {validationErrors.phoneNumber}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ward *</Label>
                    <Select
                      value={formData.wardId}
                      onValueChange={(value) =>
                        handleSelectChange("wardId", value)
                      }
                    >
                      <SelectTrigger
                        className={
                          validationErrors.wardId ? "border-red-500" : ""
                        }
                      >
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
                    {validationErrors.wardId && (
                      <p className="text-sm text-red-600">
                        {validationErrors.wardId}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="area">Area/Locality *</Label>
                    <Input
                      id="area"
                      name="area"
                      placeholder="Enter area or locality"
                      value={formData.area}
                      onChange={handleInputChange}
                      className={validationErrors.area ? "border-red-500" : ""}
                    />
                    {validationErrors.area && (
                      <p className="text-sm text-red-600">
                        {validationErrors.area}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Full Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Enter your complete address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    className={validationErrors.address ? "border-red-500" : ""}
                  />
                  {validationErrors.address && (
                    <p className="text-sm text-red-600">
                      {validationErrors.address}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="landmark">Landmark (Optional)</Label>
                  <Input
                    id="landmark"
                    name="landmark"
                    placeholder="Nearby landmark"
                    value={formData.landmark}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Schedule */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredDate">Preferred Date *</Label>
                    <Input
                      id="preferredDate"
                      name="preferredDate"
                      type="date"
                      value={formData.preferredDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      className={
                        validationErrors.preferredDate ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.preferredDate && (
                      <p className="text-sm text-red-600">
                        {validationErrors.preferredDate}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredTime">Preferred Time *</Label>
                    <Select
                      value={formData.preferredTime}
                      onValueChange={(value) =>
                        handleSelectChange("preferredTime", value)
                      }
                    >
                      <SelectTrigger
                        className={
                          validationErrors.preferredTime ? "border-red-500" : ""
                        }
                      >
                        <SelectValue placeholder="Select time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="09:00">09:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="11:00">11:00 AM</SelectItem>
                        <SelectItem value="12:00">12:00 PM</SelectItem>
                        <SelectItem value="14:00">02:00 PM</SelectItem>
                        <SelectItem value="15:00">03:00 PM</SelectItem>
                        <SelectItem value="16:00">04:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                    {validationErrors.preferredTime && (
                      <p className="text-sm text-red-600">
                        {validationErrors.preferredTime}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-lg">
                  <h3 className="font-medium text-amber-900 mb-2">
                    Important Notes
                  </h3>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Appointments are subject to availability</li>
                    <li>
                      • You will receive a confirmation email with final
                      appointment details
                    </li>
                    <li>• Please bring all required documents</li>
                    <li>• Arrive 15 minutes before your scheduled time</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">
                  Review Your Service Request
                </h3>

                <div className="space-y-4">
                  {/* Service Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Service Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>
                        <strong>Service:</strong> {selectedService?.label}
                      </p>
                      <p>
                        <strong>Priority:</strong>
                        <Badge
                          className={`ml-2 ${PRIORITIES.find((p) => p.value === formData.priority)?.color}`}
                        >
                          {
                            PRIORITIES.find(
                              (p) => p.value === formData.priority,
                            )?.label
                          }
                        </Badge>
                      </p>
                      <p>
                        <strong>Description:</strong> {formData.description}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Personal Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>
                        <strong>Name:</strong> {formData.fullName}
                      </p>
                      <p>
                        <strong>Email:</strong> {formData.email}
                      </p>
                      <p>
                        <strong>Phone:</strong> {formData.phoneNumber}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Location */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Location</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>
                        <strong>Ward:</strong>{" "}
                        {WARDS.find((w) => w.id === formData.wardId)?.name}
                      </p>
                      <p>
                        <strong>Area:</strong> {formData.area}
                      </p>
                      <p>
                        <strong>Address:</strong> {formData.address}
                      </p>
                      {formData.landmark && (
                        <p>
                          <strong>Landmark:</strong> {formData.landmark}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Schedule */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Appointment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(formData.preferredDate).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Time:</strong> {formData.preferredTime}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              {currentStep < 5 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Request
                      <CheckCircle className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuestServiceRequest;
