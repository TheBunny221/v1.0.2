import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Shield,
  Clock,
  Mail,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (data: any) => void;
  complaintId: string;
  maskedEmail: string;
  isVerifying: boolean;
  error: string | null;
  onResendOtp?: () => void;
  isResending?: boolean;
}

const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  complaintId,
  maskedEmail,
  isVerifying,
  error,
  onResendOtp,
  isResending = false,
}) => {
  const [otpCode, setOtpCode] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [canResend, setCanResend] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setOtpCode("");
      setTimeLeft(600);
      setCanResend(false);
    }
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const sanitized = value.replace(/\D/g, "").slice(0, 6);
    setOtpCode(sanitized);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length === 6) {
      onVerified({ complaintId, otpCode });
    }
  };

  const handleResend = () => {
    if (onResendOtp && canResend) {
      setTimeLeft(600);
      setCanResend(false);
      onResendOtp();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <span>Verify Your Identity</span>
          </DialogTitle>
          <DialogDescription>
            We've sent a verification code to your email address to ensure the
            security of your complaint details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email Info */}
          <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Code sent to: {maskedEmail}
              </p>
              <p className="text-xs text-blue-600">
                Check your inbox and spam folder
              </p>
            </div>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="otpCode">Enter 6-digit verification code</Label>
              <Input
                id="otpCode"
                type="text"
                value={otpCode}
                onChange={(e) => handleOtpChange(e.target.value)}
                placeholder="000000"
                className="text-center text-lg font-mono tracking-widest"
                maxLength={6}
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-digit code from your email
              </p>
            </div>

            {/* Timer */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  Code expires in: {formatTime(timeLeft)}
                </span>
              </div>
              {timeLeft === 0 && (
                <span className="text-red-600 font-medium">Code expired</span>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {otpCode.length === 6 && !error && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Code entered successfully. Click verify to continue.
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={otpCode.length !== 6 || isVerifying || timeLeft === 0}
                className="flex-1"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                disabled={!canResend || isResending}
              >
                {isResending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  "Resend"
                )}
              </Button>
            </div>
          </form>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Didn't receive the code?{" "}
              {canResend ? (
                <button
                  onClick={handleResend}
                  className="text-blue-600 hover:underline"
                  disabled={isResending}
                >
                  Click to resend
                </button>
              ) : (
                `Wait ${formatTime(timeLeft)} to resend`
              )}
            </p>
          </div>

          {/* Security Note */}
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-yellow-800">
                  Security Note
                </p>
                <p className="text-xs text-yellow-700">
                  Never share this code with anyone. Our team will never ask for
                  your verification code.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OtpVerificationModal;
