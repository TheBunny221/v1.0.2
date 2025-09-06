import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import { Loader2, Mail, Clock, ArrowLeft } from "lucide-react";
import { cn } from "../lib/utils";

export interface OtpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: "login" | "register" | "guestComplaint" | "complaintAuth";
  email: string;
  complaintId?: string;
  onVerified: (data: { token: string; user: any; otpCode?: string }) => void;
  onResend?: () => void;
  isVerifying?: boolean;
  isResending?: boolean;
  error?: string | null;
  expiresAt?: string;
  title?: string;
  description?: string;
}

const OtpDialog: React.FC<OtpDialogProps> = ({
  open,
  onOpenChange,
  context,
  email,
  complaintId,
  onVerified,
  onResend,
  isVerifying = false,
  isResending = false,
  error,
  expiresAt,
  title,
  description,
}) => {
  const [otpCode, setOtpCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize input refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Handle timer countdown
  useEffect(() => {
    if (expiresAt) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const expiry = new Date(expiresAt).getTime();
        const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
        setTimeLeft(remaining);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [expiresAt]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setOtpCode("");
      setLocalError(null);
      // Focus first input when dialog opens
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [open]);

  // Clear local error when typing
  useEffect(() => {
    if (otpCode && localError) {
      setLocalError(null);
    }
  }, [otpCode, localError]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = otpCode.split("");
    newOtp[index] = value;
    const newOtpString = newOtp.join("");

    setOtpCode(newOtpString);

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      // Move to previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain");
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);

    if (digits.length > 0) {
      setOtpCode(digits.padEnd(6, ""));
      // Focus the next empty input or the last one
      const nextIndex = Math.min(digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerify = async () => {
    if (otpCode.length !== 6) {
      setLocalError("Please enter the complete 6-digit code");
      return;
    }

    // Call parent's verify function with the OTP code
    // The parent will handle the actual verification based on context
    try {
      await onVerified({ token: "", user: null, otpCode });
    } catch (err) {
      // Error handled by parent
    }
  };

  const handleResendOtp = () => {
    if (onResend) {
      setLocalError(null);
      onResend();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getContextConfig = () => {
    switch (context) {
      case "login":
        return {
          title: title || "Verify Your Identity",
          description:
            description || "Enter the 6-digit code sent to your email to login",
          submitText: "Verify & Login",
          icon: "🔐",
        };
      case "register":
        return {
          title: title || "Complete Registration",
          description:
            description ||
            "Enter the 6-digit code sent to your email to activate your account",
          submitText: "Verify & Complete Registration",
          icon: "✨",
        };
      case "guestComplaint":
        return {
          title: title || "Verify Your Complaint",
          description:
            description ||
            "Enter the 6-digit code sent to your email to complete your complaint submission",
          submitText: "Verify & Activate Complaint",
          icon: "📝",
        };
      case "complaintAuth":
        return {
          title: title || "Verify Your Access",
          description:
            description ||
            "Enter the 6-digit code sent to your email to access this complaint",
          submitText: "Verify & Continue",
          icon: "🔍",
        };
      default:
        return {
          title: "Verify OTP",
          description: "Enter the 6-digit code sent to your email",
          submitText: "Verify",
          icon: "✉️",
        };
    }
  };

  const config = getContextConfig();
  const displayError = error || localError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">{config.title}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {config.description}
            <br />
            <strong className="text-foreground">{email}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {displayError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {displayError}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Enter 6-digit code</Label>
            <div className="flex gap-2 justify-center">
              {Array.from({ length: 6 }).map((_, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otpCode[index] || ""}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className={cn(
                    "w-12 h-12 text-center text-lg font-mono border-2",
                    "focus:border-primary focus:ring-2 focus:ring-primary/20",
                    otpCode[index] && "border-primary bg-primary/5",
                  )}
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={isVerifying || otpCode.length !== 6}
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              config.submitText
            )}
          </Button>

          <div className="flex items-center justify-between text-sm">
            {timeLeft > 0 ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                Expires in {formatTime(timeLeft)}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResendOtp}
                disabled={isResending || !onResend}
                className="p-0 h-auto font-normal"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend OTP"
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="p-0 h-auto font-normal"
            >
              <ArrowLeft className="mr-1 h-3 w-3" />
              Back
            </Button>
          </div>

          {complaintId && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Complaint ID:</strong> {complaintId}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OtpDialog;
