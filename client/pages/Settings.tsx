import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import { updateUserPreferences } from "../store/slices/authSlice";
import { setLanguage } from "../store/slices/languageSlice";
import { setTheme, addNotification } from "../store/slices/uiSlice";
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  Shield,
  Palette,
  Volume2,
  Database,
  Trash2,
  Download,
  Upload,
  Moon,
  Sun,
  Smartphone,
  Mail,
  MessageSquare,
} from "lucide-react";

const Settings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentLanguage, translations } = useAppSelector(
    (state) => state.language,
  );
  const { theme } = useAppSelector((state) => state.ui);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleLanguageChange = (language: "en" | "hi" | "ml") => {
    dispatch(setLanguage(language));
    if (user) {
      dispatch(updateUserPreferences({ language }));
    }
    dispatch(
      addNotification({
        type: "success",
        title: translations.common.success,
        message: "Language updated successfully",
      }),
    );
  };

  const handleThemeChange = (newTheme: "light" | "dark") => {
    dispatch(setTheme(newTheme));
    dispatch(
      addNotification({
        type: "info",
        title: "Theme Updated",
        message: `Switched to ${newTheme} mode`,
      }),
    );
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    if (user) {
      dispatch(updateUserPreferences({ [key]: value }));
    }
  };

  const exportData = () => {
    // Mock data export
    const data = {
      profile: user,
      complaints: [], // Would be fetched from API
      preferences: user?.preferences,
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `citizen-connect-data-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    dispatch(
      addNotification({
        type: "success",
        title: translations.common.success,
        message: "Data exported successfully",
      }),
    );
  };

  const deleteAccount = () => {
    // Mock account deletion
    dispatch(
      addNotification({
        type: "info",
        title: "Account Deletion",
        message:
          "Account deletion request submitted. You will receive a confirmation email.",
      }),
    );
    setShowDeleteDialog(false);
  };

  // Show loading state if translations are not loaded yet
  if (
    !translations ||
    !translations.settings ||
    !translations.nav ||
    !translations.common
  ) {
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
            {translations?.nav?.settings || "Settings"}
          </h1>
          <p className="text-muted-foreground">
            Manage your application preferences and account settings
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">
            {translations?.settings?.generalSettings || "General Settings"}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            {translations?.settings?.notificationSettings ||
              "Notification Settings"}
          </TabsTrigger>
          <TabsTrigger value="privacy">
            {translations?.settings?.privacySettings || "Privacy Settings"}
          </TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Language Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>{translations.settings.languageSettings}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    {translations.settings.language}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred language for the interface
                  </p>
                </div>
                <Select
                  value={currentLanguage}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
                    <SelectItem value="ml">മലയാളം (Malayalam)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Appearance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    {translations.settings.darkMode}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Sun className="h-4 w-4" />
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked) =>
                      handleThemeChange(checked ? "dark" : "light")
                    }
                  />
                  <Moon className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sound Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Volume2 className="h-5 w-5" />
                <span>Audio</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">
                    {translations.settings.soundEffects}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable sound effects for notifications and actions
                  </p>
                </div>
                <Switch defaultChecked={false} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>{translations.settings.notificationSettings}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email Notifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      {translations.settings.emailAlerts}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch
                    checked={user?.preferences.emailAlerts || false}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("emailAlerts", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium flex items-center">
                      <Smartphone className="h-4 w-4 mr-2" />
                      {translations.settings.smsAlerts}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get SMS notifications for critical updates
                    </p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium flex items-center">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      In-App Notifications
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Show notifications within the application
                    </p>
                  </div>
                  <Switch
                    checked={user?.preferences.notifications || false}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("notifications", checked)
                    }
                  />
                </div>
              </div>

              {/* Notification Types */}
              <div className="space-y-4">
                <h4 className="font-medium">Notification Types</h4>
                <div className="space-y-3">
                  {[
                    {
                      label: "Complaint Status Updates",
                      description: "When your complaint status changes",
                    },
                    {
                      label: "Assignment Notifications",
                      description: "When complaints are assigned to you",
                    },
                    {
                      label: "SLA Deadline Alerts",
                      description: "Reminders about approaching deadlines",
                    },
                    {
                      label: "System Maintenance",
                      description: "Important system updates and maintenance",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">
                          {item.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      <Switch defaultChecked={index < 2} />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>{translations.settings.privacySettings}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Profile Visibility
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Control who can see your profile information
                    </p>
                  </div>
                  <Select defaultValue="public">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="limited">Limited</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Activity Tracking
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Allow the system to track your activity for analytics
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Location Services
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable location services for better complaint tracking
                    </p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>{translations.settings.dataRetention}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">
                    Data Retention Period
                  </Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    How long should we keep your data after account closure
                  </p>
                  <Select defaultValue="1year">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30days">30 Days</SelectItem>
                      <SelectItem value="6months">6 Months</SelectItem>
                      <SelectItem value="1year">1 Year</SelectItem>
                      <SelectItem value="permanent">
                        Keep Permanently
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={exportData}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {translations.common.export} My Data
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Developer Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Developer Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Enable advanced features and debugging options
                    </p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">
                      Beta Features
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get early access to experimental features
                    </p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
              </div>

              {/* System Information */}
              <div className="space-y-4">
                <h4 className="font-medium">System Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Version</Label>
                    <p>v1.0.0</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Build</Label>
                    <p>2024.01.15</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">API Version</Label>
                    <p>v1.2.3</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Environment</Label>
                    <Badge variant="secondary">Development</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center space-x-2">
                <Trash2 className="h-5 w-5" />
                <span>Danger Zone</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium text-destructive">
                    {translations.settings.accountDeletion}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data.
                    This action cannot be undone.
                  </p>
                </div>

                <Dialog
                  open={showDeleteDialog}
                  onOpenChange={setShowDeleteDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Are you absolutely sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently
                        delete your account and remove all your data from our
                        servers, including:
                        <ul className="mt-2 ml-4 list-disc">
                          <li>Profile information</li>
                          <li>Complaint history</li>
                          <li>Preferences and settings</li>
                          <li>All associated files and documents</li>
                        </ul>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={deleteAccount}>
                        Delete Account
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
