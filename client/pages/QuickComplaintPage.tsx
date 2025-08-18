import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import { getDashboardRouteForRole } from "../store/slices/authSlice";
import QuickComplaintForm from "../components/QuickComplaintForm";

const QuickComplaintPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { translations } = useAppSelector((state) => state.language);

  const handleSuccess = (complaintId: string) => {
    if (isAuthenticated && user) {
      // Navigate to role-based dashboard
      navigate(getDashboardRouteForRole(user.role));
    } else {
      // For guest users, navigate to home page
      navigate("/");
    }
  };

  const handleClose = () => {
    // Go back to previous page, or home if no history
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {translations?.complaints?.registerComplaint ||
              "Submit a Complaint"}
          </h1>
          <p className="text-gray-600">
            {isAuthenticated
              ? "Report civic issues using your citizen account"
              : "Report civic issues and get them resolved quickly"}
          </p>
        </div>

        {/* Quick Complaint Form */}
        <QuickComplaintForm onSuccess={handleSuccess} onClose={handleClose} />
      </div>
    </div>
  );
};

export default QuickComplaintPage;
