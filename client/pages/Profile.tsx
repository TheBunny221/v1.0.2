import React, { useState } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  updateProfile,
} from "../store/slices/authSlice";
import { addNotification } from "../store/slices/uiSlice";
import { useSendPasswordSetupEmailMutation, useSetPasswordMutation } from "../store/api/authApi";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Save,
  Eye,
  EyeOff,
  Lock,
  AlertTriangle,
} from "lucide-react";

const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  // API mutations
  const [sendPasswordSetupEmail] = useSendPasswordSetupEmailMutation();
  const [setPassword] = useSetPasswordMutation();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    language: user?.language || "en",
    ward: user?.ward?.name || "",
    department: user?.department || "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [otpStep, setOtpStep] = useState<"none" | "sent" | "verified">("none");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSendOTP = async () => {
    try {
      await sendPasswordSetupEmail({ email: user?.email || "" }).unwrap();
      setOtpStep("sent");
      dispatch(
        addNotification({
          type: "success",
          title: "OTP Sent",
          message: "OTP has been sent to your email address",
        }),
      );
    } catch (error: any) {
      dispatch(
        addNotification({
          type: "error",
          title: "Error",
          message: error?.data?.message || "Failed to send OTP",
        }),
      );
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) {
      dispatch(
        addNotification({
          type: "error",
          title: "Error",
          message: "Please enter the OTP code",
        }),
      );
      return;
    }

    // Mock OTP verification - in real implementation, this would call an API
    if (otpCode === "123456") { // Mock OTP for demo
      setIsOtpVerified(true);
      setOtpStep("verified");
      dispatch(
        addNotification({
          type: "success",
          title: "Success",
          message: "OTP verified successfully! You can now set your password.",
        }),
      );
    } else {
      dispatch(
        addNotification({
          type: "error",
          title: "Error",
          message: "Invalid OTP code. Please try again.",
        }),
      );
    }
  };

  const handleSaveProfile = async () => {
    try {
      await dispatch(updateProfile(formData)).unwrap();
      dispatch(
        addNotification({
          type: "success",
          title: translations?.common?.success || "Success",
          message: translations?.profile?.profileUpdated || "Profile updated successfully",
        }),
      );
      setIsEditing(false);
    } catch (error) {
      dispatch(
        addNotification({
          type: "error",
          title: translations?.common?.error || "Error",
          message: error instanceof Error ? error.message : "Update failed",
        }),
      );
    }
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      dispatch(
        addNotification({
          type: "error",
          title: translations?.common?.error || "Error",
          message: translations?.profile?.passwordMismatch || "Passwords do not match",
        }),
      );
      return;
    }

    // Validate current password is provided (only for password change, not setup)
    if (user?.hasPassword && !passwordData.currentPassword) {
      dispatch(
        addNotification({
          type: "error",
          title: translations?.common?.error || "Error",
          message: "Current password is required",
        }),
      );
      return;
    }

    // Mock password change/setup
    dispatch(
      addNotification({
        type: "success",
        title: translations?.common?.success || "Success",
        message: !user?.hasPassword
          ? "Password set up successfully"
          : (translations?.profile?.passwordChanged || "Password changed successfully"),
      }),
    );

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };


  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Please login to view your profile
        </p>
      </div>
    );
  }

  // Show loading state only if user is still loading
  if (isLoading) {
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {translations?.nav?.profile || "Profile"}
          </h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>
      </div>

      {/* Password Setup Alert */}
      {!user?.hasPassword && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-orange-800">
                  Password Setup Required
                </h3>
                <p className="mt-1 text-sm text-orange-700">
                  Your account was created without a password. Please set up a password to secure your account.
                </p>
                <div className="mt-4">
                  <Button
                    onClick={() => setActiveTab("security")}
                    className="bg-orange-600 hover:bg-orange-700"
                    size="sm"
                  >
                    Set Up Password
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal">
            {translations?.profile?.personalInformation ||
              "Personal Information"}
          </TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>{translations?.profile?.personalInformation || "Personal Information"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Info Section */}
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">{user.fullName}</h3>
                {user.ward && (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {user.ward.name}
                  </p>
                )}
                {user.department && (
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    {user.department}
                  </p>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input
                    value={user.role.replace("-", " ").toUpperCase()}
                    disabled
                    className="bg-muted"
                  />
                </div>

                {user.ward && (
                  <div className="space-y-2">
                    <Label htmlFor="ward">Ward Assignment</Label>
                    <Input
                      id="ward"
                      value={formData.ward}
                      onChange={(e) =>
                        handleInputChange("ward", e.target.value)
                      }
                      disabled={!isEditing || user.role !== "ward-officer"}
                    />
                  </div>
                )}

                {user.department && (
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) =>
                        handleInputChange("department", e.target.value)
                      }
                      disabled={!isEditing || user.role !== "maintenance"}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          fullName: user.fullName,
                          email: user.email,
                          phoneNumber: user.phoneNumber || "",
                          language: user.language || "en",
                          ward: user.ward?.name || "",
                          department: user.department || "",
                        });
                      }}
                    >
                      {translations?.common?.cancel || "Cancel"}
                    </Button>
                    <Button onClick={handleSaveProfile} disabled={isLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      {translations?.common?.save || "Save"}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    {translations?.common?.edit || "Edit"} Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="h-5 w-5" />
                <span>
                  {!user?.hasPassword
                    ? "Set Up Password"
                    : (translations?.profile?.changePassword || "Change Password")
                  }
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user?.hasPassword && (
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">
                    {translations?.profile?.currentPassword || "Current Password"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        handlePasswordChange("currentPassword", e.target.value)
                      }
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      onClick={() =>
                        setShowPasswords((prev) => ({
                          ...prev,
                          current: !prev.current,
                        }))
                      }
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  {translations?.profile?.newPassword || "New Password"}
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      handlePasswordChange("newPassword", e.target.value)
                    }
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() =>
                      setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                    }
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {translations?.profile?.confirmPassword || "Confirm Password"}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      handlePasswordChange("confirmPassword", e.target.value)
                    }
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button onClick={handleChangePassword} className="w-full">
                {!user?.hasPassword
                  ? "Set Up Password"
                  : (translations?.profile?.changePassword || "Change Password")
                }
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default Profile;
