import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import QuickComplaintForm from "./QuickComplaintForm";
import { useAppSelector } from "../store/hooks";

interface QuickComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (complaintId: string) => void;
}

const QuickComplaintModal: React.FC<QuickComplaintModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { translations } = useAppSelector((state) => state.language);

  const handleSuccess = (complaintId: string) => {
    onSuccess?.(complaintId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {translations?.complaints?.registerComplaint ||
              "Quick Complaint Form"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-80px)] pr-4">
          <QuickComplaintForm onSuccess={handleSuccess} onClose={onClose} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default QuickComplaintModal;
