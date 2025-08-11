import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { submitGuestComplaint, verifyOTP, resendOTP } from '../store/slices/guestSlice';
import { addNotification } from '../store/slices/uiSlice';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Shield,
  Mail,
  Phone,
  MapPin,
  Upload,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Send,
} from 'lucide-react';

interface ComplaintFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  type: string;
  description: string;
  area: string;
  landmark: string;
  address: string;
  wardId: string;
}

const GuestComplaintForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isSubmitting, isVerifying, otpSent, otpExpiry, guestId } = useAppSelector((state) => state.guest);
  const { translations } = useAppSelector((state) => state.language);

  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [formData, setFormData] = useState<ComplaintFormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    type: '',
    description: '',
    area: '',
    landmark: '',
    address: '',
    wardId: '',
  });
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [captcha, setCaptcha] = useState('');
  const [captchaValue] = useState('X9K2L'); // Mock captcha
  const [complaintId, setComplaintId] = useState<string>('');

  const complaintTypes = [
    { value: 'WATER_SUPPLY', label: 'Water Supply' },
    { value: 'ELECTRICITY', label: 'Electricity' },
    { value: 'ROAD_REPAIR', label: 'Road Repair' },
    { value: 'GARBAGE_COLLECTION', label: 'Garbage Collection' },
    { value: 'STREET_LIGHTING', label: 'Street Lighting' },
    { value: 'SEWERAGE', label: 'Sewerage' },
    { value: 'PUBLIC_HEALTH', label: 'Public Health' },
    { value: 'TRAFFIC', label: 'Traffic' },
    { value: 'OTHERS', label: 'Others' },
  ];

  const wards = [
    { value: 'ward-1', label: 'Ward 1 - Central Zone' },
    { value: 'ward-2', label: 'Ward 2 - North Zone' },
    { value: 'ward-3', label: 'Ward 3 - South Zone' },
    { value: 'ward-4', label: 'Ward 4 - East Zone' },
    { value: 'ward-5', label: 'Ward 5 - West Zone' },
  ];

  const handleInputChange = (field: keyof ComplaintFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      dispatch(addNotification({
        type: 'error',
        title: 'Too many files',
        message: 'Maximum 5 files allowed',
      }));
      return;
    }
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const required = ['fullName', 'email', 'phoneNumber', 'type', 'description', 'area', 'wardId'];
    const missing = required.filter(field => !formData[field as keyof ComplaintFormData]);
    
    if (missing.length > 0) {
      dispatch(addNotification({
        type: 'error',
        title: 'Required fields missing',
        message: `Please fill in: ${missing.join(', ')}`,
      }));
      return false;
    }

    if (captcha !== captchaValue) {
      dispatch(addNotification({
        type: 'error',
        title: 'Invalid CAPTCHA',
        message: 'Please enter the correct CAPTCHA code',
      }));
      return false;
    }

    return true;
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      // Submit complaint and get guest ID
      const result = await dispatch(submitGuestComplaint({
        ...formData,
        attachments: files,
      })).unwrap();

      setComplaintId(result.complaintId);
      setStep('otp');
      
      // Start OTP countdown
      setOtpTimer(300); // 5 minutes
      const timer = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      dispatch(addNotification({
        type: 'success',
        title: 'Complaint Registered',
        message: `Complaint ID: ${result.complaintId}. Check your email for OTP.`,
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'Failed to submit complaint',
      }));
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      dispatch(addNotification({
        type: 'error',
        title: 'Invalid OTP',
        message: 'Please enter the 6-digit OTP',
      }));
      return;
    }

    try {
      await dispatch(verifyOTP({
        guestId: guestId!,
        otpCode: otp,
      })).unwrap();

      setStep('success');
      
      dispatch(addNotification({
        type: 'success',
        title: 'Verification Successful',
        message: 'Your complaint has been successfully submitted and verified!',
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Verification Failed',
        message: error instanceof Error ? error.message : 'Invalid OTP code',
      }));
    }
  };

  const handleResendOTP = async () => {
    try {
      await dispatch(resendOTP({ guestId: guestId! })).unwrap();
      
      setOtpTimer(300); // Reset timer
      const timer = setInterval(() => {
        setOtpTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      dispatch(addNotification({
        type: 'success',
        title: 'OTP Resent',
        message: 'A new OTP has been sent to your email',
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        title: 'Resend Failed',
        message: error instanceof Error ? error.message : 'Failed to resend OTP',
      }));
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Complaint Submitted Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 mb-2">Your Complaint ID:</p>
              <div className="text-2xl font-bold text-green-600 font-mono">{complaintId}</div>
              <p className="text-xs text-green-600 mt-2">Save this ID for tracking your complaint</p>
            </div>
            
            <div className="space-y-2">
              <p className="text-gray-600">
                Your complaint has been registered and verified. You'll receive email updates on progress.
              </p>
              <p className="text-sm text-gray-500">
                Expected resolution time: 2-5 business days
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={() => navigate('/guest/track')}
                className="flex-1"
              >
                Track Complaint
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-xl">Email Verification</CardTitle>
            <p className="text-gray-600">
              We've sent a 6-digit OTP to {formData.email}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <Label htmlFor="otp">Enter 6-digit OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl font-mono tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              {otpTimer > 0 && (
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>OTP expires in {formatTime(otpTimer)}</span>
                </div>
              )}

              <div className="flex flex-col space-y-2">
                <Button 
                  type="submit" 
                  disabled={isVerifying || otp.length !== 6}
                  className="w-full"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify & Submit
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleResendOTP}
                  disabled={otpTimer > 240} // Allow resend after 1 minute
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Resend OTP
                </Button>
              </div>

              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('form')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Guest Complaint Submission</h1>
              <p className="text-gray-600">Register your complaint without creating an account</p>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-left">
                <h3 className="font-medium text-blue-900">Guest Submission Process</h3>
                <p className="text-sm text-blue-700 mt-1">
                  We'll send an OTP to your email for verification. Once verified, your complaint will be registered 
                  and you'll receive a tracking ID for updates.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">Fill Details</span>
            </div>
            <div className="w-16 h-1 bg-gray-200 rounded"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm text-gray-500">Email Verification</span>
            </div>
            <div className="w-16 h-1 bg-gray-200 rounded"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm text-gray-500">Confirmation</span>
            </div>
          </div>
        </div>

        {/* Complaint Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Complaint Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitComplaint} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Complaint Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Complaint Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Complaint Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleInputChange('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select complaint type" />
                      </SelectTrigger>
                      <SelectContent>
                        {complaintTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="wardId">Ward *</Label>
                    <Select
                      value={formData.wardId}
                      onValueChange={(value) => handleInputChange('wardId', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your ward" />
                      </SelectTrigger>
                      <SelectContent>
                        {wards.map((ward) => (
                          <SelectItem key={ward.value} value={ward.value}>
                            {ward.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your complaint in detail..."
                    rows={4}
                    required
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Location Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="area">Area/Locality *</Label>
                    <Input
                      id="area"
                      value={formData.area}
                      onChange={(e) => handleInputChange('area', e.target.value)}
                      placeholder="Enter area or locality"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="landmark">Landmark</Label>
                    <Input
                      id="landmark"
                      value={formData.landmark}
                      onChange={(e) => handleInputChange('landmark', e.target.value)}
                      placeholder="Nearby landmark"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Complete Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Complete address with pincode"
                    rows={2}
                  />
                </div>
              </div>

              {/* File Uploads */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Upload className="h-5 w-5 mr-2" />
                  Supporting Documents (Optional)
                </h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload images, videos, or documents (Max 5 files, 10MB each)
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*,.pdf,.doc,.docx"
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
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CAPTCHA */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Security Verification</h3>
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

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="px-8"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Complaint & Send OTP
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GuestComplaintForm;
