import React, { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import {
  selectModals,
  selectToasts,
  hideModal,
  hideToast,
} from "../store/slices/uiSlice";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { useToast } from "../hooks/use-toast";

const GlobalMessageHandler: React.FC = () => {
  const dispatch = useAppDispatch();
  const modals = useAppSelector(selectModals);
  const toasts = useAppSelector(selectToasts);
  const { toast } = useToast();

  // Handle toasts using shadcn/ui toast system
  useEffect(() => {
    toasts.forEach((toastItem) => {
      toast({
        title: toastItem.title,
        description: toastItem.message,
        variant: toastItem.type === "error" ? "destructive" : "default",
        duration: toastItem.duration,
      });

      // Remove from store after showing
      dispatch(hideToast(toastItem.id));
    });
  }, [toasts, toast, dispatch]);

  return (
    <>
      {/* Render Modal Dialogs */}
      {modals.map((modal) => (
        <AlertDialog key={modal.id} open={true}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{modal.title}</AlertDialogTitle>
              <AlertDialogDescription>
                {typeof modal.content === "string"
                  ? modal.content
                  : modal.content}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {modal.type === "confirm" && (
                <>
                  <AlertDialogCancel
                    onClick={() => {
                      modal.onCancel?.();
                      dispatch(hideModal(modal.id));
                    }}
                  >
                    {modal.cancelText || "Cancel"}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      modal.onConfirm?.();
                      dispatch(hideModal(modal.id));
                    }}
                  >
                    {modal.confirmText || "Confirm"}
                  </AlertDialogAction>
                </>
              )}
              {modal.type === "alert" && (
                <AlertDialogAction
                  onClick={() => {
                    modal.onConfirm?.();
                    dispatch(hideModal(modal.id));
                  }}
                >
                  {modal.confirmText || "OK"}
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ))}
    </>
  );
};

export default GlobalMessageHandler;
