import React, { useState } from "react";
import { useAddComplaintFeedbackMutation } from "../store/api/complaintsApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Star, MessageSquare, Send, Loader2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";

interface FeedbackDialogProps {
  complaintId: string;
  complaintTitle: string;
  isResolved: boolean;
  existingFeedback?: {
    rating: number;
    comment: string;
  } | null;
  children: React.ReactNode;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  complaintId,
  complaintTitle,
  isResolved,
  existingFeedback,
  children,
}) => {
  const { toast } = useToast();
  const [addFeedback] = useAddComplaintFeedbackMutation();

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existingFeedback?.rating || 0);
  const [comment, setComment] = useState(existingFeedback?.comment || "");
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting feedback.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addFeedback({
        id: complaintId,
        feedback: comment.trim(),
        rating,
      }).unwrap();

      toast({
        title: "Feedback Submitted",
        description:
          "Thank you for your feedback! It helps us improve our services.",
      });

      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleRatingHover = (value: number) => {
    setHoveredRating(value);
  };

  const handleRatingLeave = () => {
    setHoveredRating(0);
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1:
        return "Very Poor";
      case 2:
        return "Poor";
      case 3:
        return "Average";
      case 4:
        return "Good";
      case 5:
        return "Excellent";
      default:
        return "Select a rating";
    }
  };

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 1:
      case 2:
        return "text-red-500";
      case 3:
        return "text-yellow-500";
      case 4:
      case 5:
        return "text-green-500";
      default:
        return "text-gray-400";
    }
  };

  if (!isResolved) {
    return null; // Don't render feedback option for unresolved complaints
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {existingFeedback ? "Update Feedback" : "Provide Feedback"}
          </DialogTitle>
          <DialogDescription>
            How would you rate the resolution of your complaint "
            {complaintTitle}"?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star Rating */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Rating *</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => handleRatingHover(star)}
                  onMouseLeave={handleRatingLeave}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p
              className={`text-sm font-medium ${getRatingColor(
                hoveredRating || rating,
              )}`}
            >
              {getRatingText(hoveredRating || rating)}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Additional Comments (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience, suggestions for improvement, or any other feedback..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 text-right">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Rating Guidelines */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Rating Guidelines:
            </p>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>
                  5 - Excellent: Issue resolved quickly and efficiently
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>4 - Good: Issue resolved satisfactorily</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>3 - Average: Issue resolved but could be better</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>
                  2 - Poor: Issue resolved but with significant delays
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>1 - Very Poor: Issue not properly resolved</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {existingFeedback ? "Update" : "Submit"} Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
