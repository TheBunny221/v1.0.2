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
    'Water Supply Issues',
    'Electricity Problems',
    'Road & Infrastructure',
    'Garbage Collection',
    'Street Lighting',
    'Sewerage Issues',
    'Public Health',
    'Traffic & Transportation',
    'Others',
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Form submitted:', { formData, files, captcha });
    // Here you would typically send the data to your API
    alert('Complaint registered successfully! Complaint ID: CMP-2024-001');
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Register New Complaint</h1>
            <p className="text-muted-foreground">
              Submit your complaint and track its progress through our system
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/roles">Switch Role</Link>
          </Button>
        </div>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  placeholder="Enter your mobile number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email ID</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Problem Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="problem-type">Problem Type *</Label>
                <Select value={formData.problemType} onValueChange={(value) => handleInputChange('problemType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select problem type" />
                  </SelectTrigger>
                  <SelectContent>
                    {problemTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ward">Ward *</Label>
                <Select value={formData.ward} onValueChange={(value) => handleInputChange('ward', value)}>
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
                <Label htmlFor="area">Area / Society *</Label>
                <Input
                  id="area"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  placeholder="Type at least 5 characters to search..."
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Start typing your area or society name (minimum 5 characters)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
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
                <Label htmlFor="address">Residential Address</Label>
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
              <Label htmlFor="description">Complaint Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
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
                      <span>Choose Files</span>
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
                placeholder="Enter the CAPTCHA code"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <Button type="submit" className="flex-1 md:flex-none">
                Submit Complaint
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Reset Form
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComplaintRegistration;
