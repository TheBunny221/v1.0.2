import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { createComplaint } from "../store/slices/complaintsSlice";
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
import { Progress } from "../components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  FileText,
  User,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Upload,
  X,
  Eye,
  AlertCircle,
  Home,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "../hooks/use-toast";

// Ward and sub-zone data
const WARDS = [
  { id: "ward-1", name: "Fort Kochi" },
  { id: "ward-2", name: "Mattancherry" },
  { id: "ward-3", name: "Ernakulam South" },
  { id: "ward-4", name: "Ernakulam North" },
  { id: "ward-5", name: "Kadavanthra" },
  { id: "ward-6", name: "Thevara" },
];

const SUB_ZONES = [
  { id: "sz-1", wardId: "ward-1", name: "Fort Kochi Beach" },
  { id: "sz-2", wardId: "ward-1", name: "Fort Kochi Market" },
  { id: "sz-3", wardId: "ward-2", name: "Mattancherry Palace" },
  { id: "sz-4", wardId: "ward-2", name: "Jew Town" },
  { id: "sz-5", wardId: "ward-3", name: "Marine Drive" },
  { id: "sz-6", wardId: "ward-3", name: "Broadway" },
  { id: "sz-7", wardId: "ward-4", name: "MG Road" },
  { id: "sz-8", wardId: "ward-4", name: "Convent Junction" },
  { id: "sz-9", wardId: "ward-5", name: "Kadavanthra Junction" },
  { id: "sz-10", wardId: "ward-5", name: "Kaloor Stadium" },
  { id: "sz-11", wardId: "ward-6", name: "Thevara Ferry" },
  { id: "sz-12", wardId: "ward-6", name: "Thevara Bridge" },
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

interface FormData {
  title: string;
  type: string;
  priority: string;
  description: string;
  wardId: string;
  subZoneId: string;
  area: string;
  landmark: string;
  address: string;
  attachments: File[];
}

interface AttachmentWithPreview {
  file: File;
  previewUrl: string;
}

const STEPS = [
  { id: 1, name: "Details", description: "Complaint information" },
  { id: 2, name: "Location", description: "Location details" },
  { id: 3, name: "Attachments", description: "Upload images" },
  { id: 4, name: "Review", description: "Review & submit" },
];

const CreateComplaint: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { user } = useAppSelector((state) => state.auth);
  const { isLoading, error } = useAppSelector((state) => state.complaints);

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    type: "",
    priority: "MEDIUM",
    description: "",
    wardId: "",
    subZoneId: "",
    area: "",
    landmark: "",
    address: "",
    attachments: [],
  });

  const [attachmentPreviews, setAttachmentPreviews] = useState<AttachmentWithPreview[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Reset subZoneId when wardId changes
    if (name === 'wardId') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        subZoneId: '',
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach(file => {
      // Check file type
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        errors.push(`${file.name}: Only JPG and PNG files are allowed`);
        return;
      }

      // Check file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File size must be less than 10MB`);
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      toast({
        title: "File Upload Error",
        description: errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    // Check total files limit
    if (attachmentPreviews.length + validFiles.length > 5) {
      toast({
        title: "File Upload Error",
        description: "Maximum 5 files allowed",
        variant: "destructive",
      });
      return;
    }

    // Create previews for new files
    const newPreviews: AttachmentWithPreview[] = validFiles.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setAttachmentPreviews(prev => [...prev, ...newPreviews]);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }));

    // Clear the input
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    const preview = attachmentPreviews[index];
    URL.revokeObjectURL(preview.previewUrl);

    setAttachmentPreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    switch (step) {
      case 1: // Details
        if (!formData.title.trim()) errors.title = 'Title is required';
        if (!formData.type) errors.type = 'Complaint type is required';
        if (!formData.description.trim()) errors.description = 'Description is required';
        if (formData.description.trim().length < 10) errors.description = 'Description must be at least 10 characters';
        break;
      
      case 2: // Location
        if (!formData.wardId) errors.wardId = 'Ward is required';
        if (!formData.subZoneId) errors.subZoneId = 'Sub-zone is required';
        if (!formData.area.trim()) errors.area = 'Area is required';
        break;
      
      case 3: // Attachments - optional, no validation required
        break;
      
      case 4: // Review - all previous validations
        return validateStep(1) && validateStep(2);
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) {
      setCurrentStep(1);
      return;
    }

    const complaintData = {
      title: formData.title,
      type: formData.type as any,
      priority: formData.priority as any,
      description: formData.description,
      wardId: formData.wardId,
      subZoneId: formData.subZoneId,
      area: formData.area,
      landmark: formData.landmark,
      address: formData.address,
      coordinates: currentLocation
        ? {
            latitude: currentLocation.lat,
            longitude: currentLocation.lng,
          }
        : undefined,
      attachments: formData.attachments,
    };

    try {
      const result = await dispatch(createComplaint(complaintData)).unwrap();
      toast({
        title: "Complaint Submitted",
        description: "Your complaint has been created successfully.",
      });
      navigate(`/complaints/${result.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create complaint",
        variant: "destructive",
      });
    }
  };

  const getAvailableSubZones = () => {
    return SUB_ZONES.filter(sz => sz.wardId === formData.wardId);
  };

  const getProgressPercentage = () => {
    return ((currentStep - 1) / (STEPS.length - 1)) * 100;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Complaint</h1>
          <p className="text-gray-600">
            Submit a new complaint to get civic issues resolved
          </p>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`w-full h-0.5 mx-2 ${
                        currentStep > step.id ? "bg-primary" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <Progress value={getProgressPercentage()} className="w-full" />
            <div className="text-center">
              <h3 className="font-semibold">{STEPS[currentStep - 1].name}</h3>
              <p className="text-sm text-gray-600">
                {STEPS[currentStep - 1].description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStep === 1 && <FileText className="h-5 w-5" />}
            {currentStep === 2 && <MapPin className="h-5 w-5" />}
            {currentStep === 3 && <Upload className="h-5 w-5" />}
            {currentStep === 4 && <Eye className="h-5 w-5" />}
            {STEPS[currentStep - 1].name}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && "Enter complaint details and description"}
            {currentStep === 2 && "Specify the location where the issue occurred"}
            {currentStep === 3 && "Optionally upload images to support your complaint"}
            {currentStep === 4 && "Review all details before submitting"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Step 1: Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Complaint Title *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Brief title for the complaint"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={validationErrors.title ? "border-red-500" : ""}
                  />
                  {validationErrors.title && (
                    <p className="text-sm text-red-500">{validationErrors.title}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Complaint Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        handleSelectChange("type", value)
                      }
                    >
                      <SelectTrigger className={validationErrors.type ? "border-red-500" : ""}>
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
                    {validationErrors.type && (
                      <p className="text-sm text-red-500">{validationErrors.type}</p>
                    )}
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
                    className={validationErrors.description ? "border-red-500" : ""}
                  />
                  {validationErrors.description && (
                    <p className="text-sm text-red-500">{validationErrors.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6">
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
                      <SelectTrigger className={validationErrors.wardId ? "border-red-500" : ""}>
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
                      <p className="text-sm text-red-500">{validationErrors.wardId}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Sub-Zone *</Label>
                    <Select
                      value={formData.subZoneId}
                      onValueChange={(value) =>
                        handleSelectChange("subZoneId", value)
                      }
                      disabled={!formData.wardId}
                    >
                      <SelectTrigger className={validationErrors.subZoneId ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select sub-zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableSubZones().map((subZone) => (
                          <SelectItem key={subZone.id} value={subZone.id}>
                            {subZone.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {validationErrors.subZoneId && (
                      <p className="text-sm text-red-500">{validationErrors.subZoneId}</p>
                    )}
                  </div>
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
                    <p className="text-sm text-red-500">{validationErrors.area}</p>
                  )}
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
            </div>
          )}

          {/* Step 3: Attachments */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Attachments (Optional)
                </h3>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-700 mb-2">
                      Upload Images
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Click to select images or drag and drop
                    </p>
                    <p className="text-xs text-gray-400">
                      JPG, PNG files up to 10MB each. Maximum 5 files.
                    </p>
                  </label>
                </div>

                {attachmentPreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {attachmentPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border">
                          <img
                            src={preview.previewUrl}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Image Preview</DialogTitle>
                              <DialogDescription>
                                {preview.file.name} ({(preview.file.size / 1024 / 1024).toFixed(2)} MB)
                              </DialogDescription>
                            </DialogHeader>
                            <img
                              src={preview.previewUrl}
                              alt={preview.file.name}
                              className="w-full h-auto max-h-96 object-contain"
                            />
                          </DialogContent>
                        </Dialog>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {preview.file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Review Your Complaint
              </h3>

              <div className="space-y-4">
                {/* Complaint Details */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Complaint Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium">Title:</span> {formData.title}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="font-medium">Type:</span> {COMPLAINT_TYPES.find(t => t.value === formData.type)?.label}
                      </div>
                      <div>
                        <span className="font-medium">Priority:</span> {PRIORITIES.find(p => p.value === formData.priority)?.label}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Description:</span>
                      <p className="mt-1 text-gray-700">{formData.description}</p>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Ward:</span> {WARDS.find(w => w.id === formData.wardId)?.name}
                    </div>
                    <div>
                      <span className="font-medium">Sub-Zone:</span> {SUB_ZONES.find(sz => sz.id === formData.subZoneId)?.name}
                    </div>
                    <div>
                      <span className="font-medium">Area:</span> {formData.area}
                    </div>
                    {formData.landmark && (
                      <div>
                        <span className="font-medium">Landmark:</span> {formData.landmark}
                      </div>
                    )}
                    {formData.address && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Address:</span> {formData.address}
                      </div>
                    )}
                  </div>
                </div>

                {/* Attachments */}
                {attachmentPreviews.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Attachments ({attachmentPreviews.length})
                    </h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {attachmentPreviews.map((preview, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                          <img
                            src={preview.previewUrl}
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submitter Info */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Submitted By
                  </h4>
                  <div className="text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {user?.fullName}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {user?.email}
                    </div>
                    {user?.phoneNumber && (
                      <div>
                        <span className="font-medium">Phone:</span> {user.phoneNumber}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-blue-700">
                  Please review all information carefully. After submission, you'll be able to track your complaint progress.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 pt-6">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex-1"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
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
            )}

            {currentStep === 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateComplaint;
