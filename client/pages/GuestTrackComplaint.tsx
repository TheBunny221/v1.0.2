import React, { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  trackGuestComplaint,
} from "../store/slices/guestSlice";
import { showErrorToast } from "../store/slices/uiSlice";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
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
  Shield,
} from "lucide-react";

const GuestTrackComplaint: React.FC = () => {
  const dispatch = useAppDispatch();
  const { isLoading, trackedComplaint } = useAppSelector((state) => state.guest);
  const { translations } = useAppSelector((state) => state.language);

  // Return loading state if translations are not yet loaded
  if (!translations) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const [searchData, setSearchData] = useState({
    complaintId: "",
    email: "",
  });

  const handleInputChange = (field: string, value: string) => {
    setSearchData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!searchData.complaintId || !searchData.email) {
      dispatch(
        showErrorToast(
          "Missing Information",
          "Please provide both complaint ID and email address",
        ),
      );
      return;
    }

    try {
      await dispatch(
        trackGuestComplaint({
          complaintId: searchData.complaintId,
          email: searchData.email,
        }),
      ).unwrap();
    } catch (error) {
      dispatch(
        showErrorToast(
          "Complaint Not Found",
          error instanceof Error ? error.message : "Please check your details and try again",
        ),
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: any; icon: React.ReactNode }> = {
      registered: { 
        variant: "secondary", 
        icon: <FileText className="h-3 w-3" /> 
      },
      assigned: { 
        variant: "default", 
        icon: <User className="h-3 w-3" /> 
      },
      "in-progress": { 
        variant: "default", 
        icon: <Clock className="h-3 w-3" /> 
      },
      resolved: { 
        variant: "default", 
        icon: <CheckCircle2 className="h-3 w-3" /> 
      },
      closed: { 
        variant: "outline", 
        icon: <Shield className="h-3 w-3" /> 
      },
    };

    const config = statusMap[status] || { variant: "secondary", icon: <AlertCircle className="h-3 w-3" /> };

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1">
        {config.icon}
        <span className="capitalize">{status.replace("-", " ")}</span>
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Track Guest Complaint
        </h1>
        <p className="text-muted-foreground">
          Enter your complaint ID and email to track your submission status
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Complaint</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="complaintId">Complaint ID</Label>
                <Input
                  id="complaintId"
                  value={searchData.complaintId}
                  onChange={(e) => handleInputChange("complaintId", e.target.value)}
                  placeholder="Enter your complaint ID"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={searchData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
              {isLoading ? (
                <>
                  <Search className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
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

      {trackedComplaint && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Complaint Details</span>
              </div>
              {getStatusBadge(trackedComplaint.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Complaint ID
                </Label>
                <p className="font-mono text-sm">{trackedComplaint.complaintId}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Type
                </Label>
                <p className="capitalize">{trackedComplaint.type.replace("_", " ")}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Submitted On
                </Label>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p>{new Date(trackedComplaint.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Priority
                </Label>
                <Badge variant={trackedComplaint.priority === "high" ? "destructive" : "secondary"}>
                  {trackedComplaint.priority}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Contact Information */}
            <div>
              <h3 className="font-medium mb-3">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{trackedComplaint.contactMobile}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{trackedComplaint.contactEmail}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location Information */}
            <div>
              <h3 className="font-medium mb-3">Location</h3>
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{trackedComplaint.area}</p>
                    <p className="text-sm text-muted-foreground">
                      {trackedComplaint.ward}
                    </p>
                    {trackedComplaint.address && (
                      <p className="text-sm text-muted-foreground">
                        {trackedComplaint.address}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h3 className="font-medium mb-3">Description</h3>
              <p className="text-sm bg-muted p-3 rounded-lg">
                {trackedComplaint.description}
              </p>
            </div>

            {/* Assignment Information */}
            {trackedComplaint.assignedTo && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-3">Assigned To</h3>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{trackedComplaint.assignedTo.name}</span>
                    <Badge variant="outline">{trackedComplaint.assignedTo.role}</Badge>
                  </div>
                </div>
              </>
            )}

            {/* Timeline */}
            {trackedComplaint.remarks && trackedComplaint.remarks.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-3">Timeline</h3>
                  <div className="space-y-3">
                    {trackedComplaint.remarks.map((remark, index) => (
                      <div key={index} className="flex space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{remark.text}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {remark.addedBy.name}
                            </span>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(remark.addedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GuestTrackComplaint;
