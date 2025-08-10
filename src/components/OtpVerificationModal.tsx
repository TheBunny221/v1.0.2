import React, { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  verifyOtpAndSubmitComplaint,
  resendOtp,
  clearError,
  resetOtpState,
  selectIsOtpVerifying,
  selectOtpSessionId,
  selectOtpExpiresAt,
  selectGuestError,
  selectIsSubmittingComplaint,
  selectSubmittedComplaintId,
} from "../store/slices/guestSlice";
import { showSuccessToast, showErrorToast } from "../store/slices/uiSlice";
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
import { Badge } from "./ui/badge";
import { Mail, Timer, RefreshCw, CheckCircle } from "lucide-react";

interface OtpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  isOpen,
  onClose,
  email,
}) => {
  const dispatch = useAppDispatch();
  const [otp, setOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);

  const isVerifying = useAppSelector(selectIsOtpVerifying);
  const isSubmitting = useAppSelector(selectIsSubmittingComplaint);
  const sessionId = useAppSelector(selectOtpSessionId);
  const expiresAt = useAppSelector(selectOtpExpiresAt);
  const error = useAppSelector(selectGuestError);
  const submittedComplaintId = useAppSelector(selectSubmittedComplaintId);

  // Timer for OTP expiration
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft(0);
        setCanResend(true);
        clearInterval(interval);
      } else {
        setTimeLeft(Math.floor(diff / 1000));
        setCanResend(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Clear error when component mounts
  useEffect(() => {
    if (isOpen) {
      dispatch(clearError());
      setOtp("");
    }
  }, [isOpen, dispatch]);

  // Handle successful submission
  useEffect(() => {
    if (submittedComplaintId) {
      dispatch(
        showSuccessToast(
          "Complaint Submitted Successfully!",
          `Your complaint has been registered with ID: ${submittedComplaintId}`,
        ),
      );
      onClose();
    }
  }, [submittedComplaintId, dispatch, onClose]);

  const handleVerifyOtp = async () => {
    if (!otp || !sessionId) return;

    if (otp.length !== 6) {
      dispatch(showErrorToast("Invalid OTP", "Please enter a 6-digit OTP"));
      return;
    }

    try {
      await dispatch(
        verifyOtpAndSubmitComplaint({
          otp,
          sessionId,
        }),
      ).unwrap();
    } catch (error) {
      // Error is handled by the slice
    }
  };

  const handleResendOtp = async () => {
    if (!sessionId) return;

    try {
      await dispatch(resendOtp(sessionId)).unwrap();
      dispatch(
        showSuccessToast("OTP Resent", "A new OTP has been sent to your email"),
      );
      setOtp("");
    } catch (error) {
      // Error is handled by the slice
    }
  };

  const handleClose = () => {
    dispatch(resetOtpState());
    onClose();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 6);
    setOtp(numericValue);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-primary" />
            <span>Email Verification</span>
          </DialogTitle>
          <DialogDescription>
            We've sent a 6-digit OTP to <strong>{email}</strong>. Please enter
            it below to submit your complaint.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="otp">Enter 6-digit OTP</Label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => handleOtpChange(e.target.value)}
              placeholder="000000"
              className="text-center text-lg tracking-widest font-mono"
              maxLength={6}
              disabled={isVerifying || isSubmitting}
            />
          </div>

          {timeLeft > 0 && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span>OTP expires in {formatTime(timeLeft)}</span>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || isVerifying || isSubmitting}
              className="flex-1"
            >
              {isVerifying || isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {isSubmitting ? "Submitting..." : "Verifying..."}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Verify & Submit
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleResendOtp}
              disabled={!canResend || isVerifying || isSubmitting}
            >
              Resend
            </Button>
          </div>

          <div className="text-center">
            <Badge variant="secondary" className="text-xs">
              <Mail className="h-3 w-3 mr-1" />
              Check your email inbox and spam folder
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>• OTP is valid for 10 minutes</p>
            <p>• You can resend OTP after it expires</p>
            <p>• Check spam/junk folder if not received</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OtpVerificationModal;
