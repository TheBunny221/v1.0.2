import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useToast } from "./ui/use-toast";
import { useAddComplaintFeedbackMutation } from "../store/api/complaintsApi";
import { Star, MessageSquare } from "lucide-react";

interface ComplaintFeedbackDialogProps {
  complaintId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ComplaintFeedbackDialog: React.FC<ComplaintFeedbackDialogProps> = ({
  complaintId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState("");
  const [hoveredRating, setHoveredRating] = useState<number>(0);

  const [addFeedback, { isLoading }] = useAddComplaintFeedbackMutation();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating for the service.",
        variant: "destructive",
      });
      return;
    }

    if (!feedback.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please provide your feedback.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addFeedback({
        id: complaintId,
        rating,
        feedback: feedback.trim(),
      }).unwrap();

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });

      // Reset form
      setRating(0);
      setFeedback("");

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description:
          error.message || "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setRating(0);
    setFeedback("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Provide Feedback
          </DialogTitle>
          <DialogDescription>
            Please rate our service and share your experience with the complaint
            resolution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating */}
          <div>
            <Label>Service Rating *</Label>
            <div className="flex items-center space-x-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`p-1 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }`}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star className="h-8 w-8 fill-current" />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating > 0 && (
                  <>
                    {rating} star{rating !== 1 ? "s" : ""} -{" "}
                    {rating === 1 && "Poor"}
                    {rating === 2 && "Fair"}
                    {rating === 3 && "Good"}
                    {rating === 4 && "Very Good"}
                    {rating === 5 && "Excellent"}
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Feedback Text */}
          <div>
            <Label htmlFor="feedback">Your Feedback *</Label>
            <Textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Please share your experience with the complaint resolution process..."
              rows={4}
              className="mt-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              Your feedback helps us improve our services.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ComplaintFeedbackDialog;
