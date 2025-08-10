import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { trackGuestComplaint, selectGuestComplaintIds } from "../store/slices/guestSlice";
import { showErrorToast } from "../store/slices/uiSlice";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  User,
  Shield
} from "lucide-react";

interface TrackedComplaint {
  id: string;
  complaintId: string;
  type: string;
  description: string;
  status: string;
  priority: string;
  ward: string;
  area: string;
  contactMobile: string;
  contactEmail: string;
  createdAt: string;
  slaDeadline: string;
  slaStatus: string;
  timeElapsed: string;
  assignedTo?: {
    name: string;
    role: string;
  };
  remarks: Array<{
    text: string;
    addedBy: { name: string; role: string };
    addedAt: string;
    type: string;
  }>;
}

const GuestTrackComplaint: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.guest);
  const savedComplaintIds = useAppSelector(selectGuestComplaintIds);

  const [trackingData, setTrackingData] = useState({
    complaintId: "",
    email: "",
    mobile: "",
  });
  
  const [trackedComplaint, setTrackedComplaint] = useState<TrackedComplaint | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setTrackingData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTrackComplaint = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!trackingData.complaintId || !trackingData.email || !trackingData.mobile) {
      dispatch(showErrorToast("Missing Information", "Please fill in all required fields"));
      return;
    }

    try {
      const result = await dispatch(trackGuestComplaint({
        complaintId: trackingData.complaintId,
        email: trackingData.email,
        mobile: trackingData.mobile,
      })).unwrap();

      setTrackedComplaint(result);
    } catch (error) {
      setTrackedComplaint(null);
    }
  };

  const handleQuickTrack = (complaintId: string) => {
    setTrackingData(prev => ({ ...prev, complaintId }));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'registered': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'reopened': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSlaStatusIcon = (slaStatus: string) => {
    switch (slaStatus.toLowerCase()) {
      case 'ontime': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Track Your Complaint
        </h1>
        <p className="text-muted-foreground">
          Enter your complaint details to check the current status and progress
        </p>
      </div>

      {/* Quick Access for Previously Submitted Complaints */}
      {savedComplaintIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Your Recent Complaints</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {savedComplaintIds.map((id) => (
                <Button
                  key={id}
                  variant="outline"
                  onClick={() => handleQuickTrack(id)}
                  className="justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {id}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Track Complaint</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTrackComplaint} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="complaint-id">Complaint ID *</Label>
                <Input
                  id="complaint-id"
                  value={trackingData.complaintId}
                  onChange={(e) => handleInputChange("complaintId", e.target.value)}
                  placeholder="CMP-2024-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={trackingData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={trackingData.mobile}
                  onChange={(e) => handleInputChange("mobile", e.target.value)}
                  placeholder="+91 9876543210"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? (
                <>
                  <Search className="h-4 w-4 mr-2 animate-spin" />
                  Tracking...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Track Complaint
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Complaint Details */}
      {trackedComplaint && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Complaint Details</span>
              </div>
              <Badge className={getStatusColor(trackedComplaint.status)}>
                {trackedComplaint.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Complaint ID</Label>
                <p className="font-mono text-sm">{trackedComplaint.complaintId}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Type</Label>
                <p className="text-sm">{trackedComplaint.type.replace('_', ' ')}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
                <Badge className={getPriorityColor(trackedComplaint.priority)}>
                  {trackedComplaint.priority.toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">SLA Status</Label>
                <div className="flex items-center space-x-1">
                  {getSlaStatusIcon(trackedComplaint.slaStatus)}
                  <span className="text-sm capitalize">{trackedComplaint.slaStatus}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location and Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Location</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Ward:</strong> {trackedComplaint.ward}</p>
                  <p><strong>Area:</strong> {trackedComplaint.area}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Contact Information</span>
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3 w-3" />
                    <span>{trackedComplaint.contactMobile}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3 w-3" />
                    <span>{trackedComplaint.contactEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Timeline Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Submitted</Label>
                <div className="flex items-center space-x-1 text-sm">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(trackedComplaint.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">SLA Deadline</Label>
                <div className="flex items-center space-x-1 text-sm">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(trackedComplaint.slaDeadline).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium text-muted-foreground">Time Elapsed</Label>
                <p className="text-sm">{trackedComplaint.timeElapsed}</p>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-3">
              <h3 className="font-semibold">Complaint Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {trackedComplaint.description}
              </p>
            </div>

            {/* Assigned Officer */}
            {trackedComplaint.assignedTo && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Assigned Officer</span>
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {trackedComplaint.assignedTo.name} - {trackedComplaint.assignedTo.role}
                    </Badge>
                  </div>
                </div>
              </>
            )}

            {/* Remarks/Updates */}
            {trackedComplaint.remarks && trackedComplaint.remarks.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold">Updates & Remarks</h3>
                  <div className="space-y-3">
                    {trackedComplaint.remarks.map((remark, index) => (
                      <div key={index} className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {remark.type.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              by {remark.addedBy.name} ({remark.addedBy.role})
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(remark.addedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm">{remark.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="font-semibold">Need Help?</h3>
            <p className="text-sm text-muted-foreground">
              If you're unable to track your complaint or need assistance, please contact our support team.
            </p>
            <div className="flex justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Phone className="h-3 w-3" />
                <span>+91 1800-XXX-XXXX</span>
              </div>
              <div className="flex items-center space-x-1">
                <Mail className="h-3 w-3" />
                <span>support@citizenconnect.gov</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GuestTrackComplaint;
