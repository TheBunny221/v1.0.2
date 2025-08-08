import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { submitComplaint } from '@/store/slices/complaintsSlice';
import { addNotification } from '@/store/slices/uiSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Upload, RefreshCw } from 'lucide-react';

const ComplaintRegistration: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isSubmitting } = useAppSelector((state) => state.complaints);
  const { translations } = useAppSelector((state) => state.language);

  const [formData, setFormData] = useState({
    mobile: '',
    email: '',
    problemType: '',
    ward: '',
    area: '',
    location: '',
    address: '',
    description: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [captcha, setCaptcha] = useState('');
  const [captchaValue] = useState('A3X7M'); // Mock captcha

  const problemTypes = [
    { key: 'waterSupply', label: translations.complaints.waterSupply },
    { key: 'electricity', label: translations.complaints.electricity },
    { key: 'roadRepair', label: translations.complaints.roadRepair },
    { key: 'garbageCollection', label: translations.complaints.garbageCollection },
    { key: 'streetLighting', label: translations.complaints.streetLighting },
    { key: 'sewerage', label: translations.complaints.sewerage },
    { key: 'publicHealth', label: translations.complaints.publicHealth },
    { key: 'traffic', label: translations.complaints.traffic },
    { key: 'others', label: translations.complaints.others },
  ];

  const wards = [
    'Ward 1 - Central Zone',
    'Ward 2 - North Zone',
    'Ward 3 - South Zone',
    'Ward 4 - East Zone',
    'Ward 5 - West Zone',
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (captcha !== captchaValue) {
      dispatch(addNotification({
        type: 'error',
        title: 'Invalid CAPTCHA',
        message: 'Please enter the correct CAPTCHA code',
      }));
      return;
    }

    try {
      const complaintData = {
        mobile: formData.mobile,
        email: formData.email,
        problemType: formData.problemType,
        ward: formData.ward,
        area: formData.area,
        location: formData.location,
        address: formData.address,
        description: formData.description,
        files,
        captcha,
      };

      const result = await dispatch(submitComplaint(complaintData)).unwrap();

      dispatch(addNotification({
        type: 'success',
        title: 'Complaint Submitted',
        message: `Complaint registered successfully! ID: ${result.id}`,
      }));

      // Reset form
      resetForm();
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'Failed to submit complaint',
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      mobile: '',
      email: '',
      problemType: '',
      ward: '',
      area: '',
      location: '',
      address: '',
      description: '',
    });
    setFiles([]);
    setCaptcha('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{translations.complaints.registerComplaint}</h1>
            <p className="text-muted-foreground">
              Submit your complaint and track its progress through our system
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/roles">{translations.nav.switchRole}</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <MapPin className="h-4 w-4 text-primary-foreground" />
            </div>
            <span>{translations.forms.problemDetails}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">{translations.complaints.mobile} *</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  placeholder={`Enter your ${translations.complaints.mobile.toLowerCase()}`}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{translations.auth.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={`Enter your ${translations.auth.email.toLowerCase()}`}
                />
              </div>
            </div>

            {/* Problem Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="problem-type">{translations.complaints.complaintType} *</Label>
                <Select value={formData.problemType} onValueChange={(value) => handleInputChange('problemType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${translations.complaints.complaintType.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {problemTypes.map((type) => (
                      <SelectItem key={type.key} value={type.label}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ward">{translations.complaints.ward} *</Label>
                <Select value={formData.ward} onValueChange={(value) => handleInputChange('ward', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select your ${translations.complaints.ward.toLowerCase()}`} />
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
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  placeholder={translations.forms.minCharacters}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {translations.forms.minCharacters}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">{translations.complaints.location}</Label>
                <div className="flex space-x-2">
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Select from map or dropdown"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="icon">
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{translations.complaints.address}</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Auto-filled or enter manually..."
                  rows={3}
                />
              </div>
            </div>

            {/* Complaint Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{translations.forms.complaintDescription} *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder={`Describe your ${translations.complaints.description.toLowerCase()} in detail...`}
                rows={4}
                required
              />
            </div>

            {/* File Uploads */}
            <div className="space-y-4">
              <Label>{translations.forms.optionalUploads}</Label>
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
                      <span>{translations.common.upload} Files</span>
                    </Button>
                  </Label>
                </div>
              </div>
              
              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Uploaded Files:</p>
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

            {/* CAPTCHA */}
            <div className="space-y-4">
              <Label>{translations.forms.captchaVerification} *</Label>
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
                placeholder={translations.forms.enterCaptcha}
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button type="submit" className="flex-1 md:flex-none" disabled={isSubmitting}>
                {isSubmitting ? translations.common.loading : translations.forms.submitComplaint}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                {translations.forms.resetForm}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplaintRegistration;
