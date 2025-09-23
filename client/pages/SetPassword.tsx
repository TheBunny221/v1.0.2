import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { clearError, selectAuth, setCredentials } from "../store/slices/authSlice";
import { useSetPasswordMutation, useValidatePasswordSetupTokenMutation, useGetCurrentUserQuery } from "../store/api/authApi";
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
import { Alert, AlertDescription } from "../components/ui/alert";
import { Eye, EyeOff, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { useToast } from "../hooks/use-toast";

const SetPassword: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token: paramToken } = useParams<{ token: string }>();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const queryToken = searchParams.get("token") || undefined;
  const token = paramToken || queryToken;
  const { toast } = useToast();
  const { appName } = useSystemConfig();

  const { error } = useAppSelector(selectAuth);
  const [setPasswordMutation, { isLoading }] = useSetPasswordMutation();
  const [validateToken] = useValidatePasswordSetupTokenMutation();
  const { refetch: refetchCurrentUser } = useGetCurrentUserQuery(undefined);

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    match: false,
  });

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Note: Do NOT auto-redirect authenticated users from this page

  // Validate token exists and is valid (no redirects on error)
  const [tokenValid, setTokenValid] = useState<null | boolean>(null);
  const [tokenValidationMessage, setTokenValidationMessage] = useState<string>("");
  useEffect(() => {
    const run = async () => {
      if (!token) {
        setTokenValid(false);
        setTokenValidationMessage("The password setup link is invalid or missing.");
        toast({
          title: "Invalid Link",
          description: "The password setup link is invalid or missing.",
          variant: "destructive",
        });
        return;
      }
      try {
        const res = await validateToken({ token }).unwrap();
        setTokenValid(!!res?.data?.valid);
        if (!res?.data?.valid) {
          setTokenValidationMessage("This password setup link is invalid or expired. Please request a new link from your profile page.");
          toast({
            title: "Invalid or Expired Link",
            description: "Please request a new setup link.",
            variant: "destructive",
          });
        }
      } catch (e: any) {
        // If backend doesn't provide a validation endpoint (404), skip pre-validation gracefully
        const status = e?.status || e?.originalStatus || e?.data?.status;
        if (status === 404) {
          setTokenValid(null); // unknown; allow form submit to validate
          setTokenValidationMessage("");
          // Optional: info toast once
          toast({ title: "Proceeding Without Pre-Validation", description: "We'll validate the link when you submit.", variant: "default" });
        } else {
          setTokenValid(false);
          const msg = e?.data?.message || "Could not validate the link. Please request a new setup link.";
          setTokenValidationMessage(msg);
          toast({ title: "Link Validation Failed", description: msg, variant: "destructive" });
        }
      }
    };
    run();
  }, [token, validateToken, toast]);

  // Password validation
  useEffect(() => {
    const { password, confirmPassword } = formData;

    setPasswordValidation({
      minLength: password.length >= 6,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      match: password.length > 0 && password === confirmPassword,
    });
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (error) {
      dispatch(clearError());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      return;
    }

    const { password, confirmPassword } = formData;

    // Validate passwords match
    if (password !== confirmPassword) {
      return;
    }

    // Validate password strength
    const isValid = Object.values(passwordValidation).every(Boolean);
    if (!isValid) {
      return;
    }

    try {
      if (tokenValid === false) {
        // Prevent submit if token invalid
        return;
      }
      const result = await setPasswordMutation({
        token: token!,
        password,
      }).unwrap();

      // Update Redux store with new user data (including hasPassword: true)
      if (result?.data?.user && result?.data?.token) {
        dispatch(
          setCredentials({
            token: result.data.token,
            user: result.data.user,
          }),
        );
      } else {
        // Fallback: refresh profile from backend to get updated hasPassword
        try {
          const me = await refetchCurrentUser().unwrap();
          if (me?.data?.user && me?.data?.token) {
            dispatch(
              setCredentials({
                token: me.data.token,
                user: me.data.user,
              }),
            );
          }
        } catch (e) {
          // If refetch fails, continue with success flow
          console.warn("Failed to refresh user after password setup:", e);
        }
      }

      toast({
        title: "Password Set Successfully",
        description: "You can now log in using your new password.",
      });

      // Redirect to login per flow requirement
      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.data?.message ||
          "Failed to set password. The link may be invalid or expired. Please request a new setup link.",
        variant: "destructive",
      });
    }
  };

  const isFormValid = Object.values(passwordValidation).every(Boolean) && tokenValid !== false;

  const ValidationItem: React.FC<{ isValid: boolean; text: string }> = ({
    isValid,
    text,
  }) => (
    <div
      className={`flex items-center gap-2 text-sm ${isValid ? "text-green-600" : "text-gray-500"}`}
    >
      {isValid ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      {text}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto">
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Set Your Password
          </h1>
          <p className="text-gray-600">
            Create a secure password for your {appName} account
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Create Password</CardTitle>
            <CardDescription>
              Choose a strong password to protect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error Alerts */}
            {tokenValid === false && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {tokenValidationMessage || "Invalid or expired link."}
                </AlertDescription>
              </Alert>
            )}
            {tokenValid === null && (
              <Alert className="mb-4 border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-700">
                  Unable to pre-validate this link. We will validate it when you submit your new password.
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">
                  Password Requirements:
                </p>
                <div className="space-y-1">
                  <ValidationItem
                    isValid={passwordValidation.minLength}
                    text="At least 6 characters long"
                  />
                  <ValidationItem
                    isValid={passwordValidation.hasUpper}
                    text="Contains uppercase letter"
                  />
                  <ValidationItem
                    isValid={passwordValidation.hasLower}
                    text="Contains lowercase letter"
                  />
                  <ValidationItem
                    isValid={passwordValidation.hasNumber}
                    text="Contains number"
                  />
                  <ValidationItem
                    isValid={passwordValidation.match}
                    text="Passwords match"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? "Setting Password..." : "Set Password"}
              </Button>
            </form>

            {/* Additional Info */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Security Notice:</strong> After setting your password,
                you'll be automatically logged in and can access your account
                using either password or OTP login methods.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetPassword;
