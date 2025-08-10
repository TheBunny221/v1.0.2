import React from "react";
import PlaceholderPage from "../components/PlaceholderPage";
import { Clock } from "lucide-react";

const ReopenComplaint: React.FC = () => {
  return (
    <PlaceholderPage
      title="Reopen Complaint"
      description="Search for closed complaints and submit a request to reopen them with additional details."
      icon={<Clock className="h-12 w-12" />}
    />
  );
};

export default ReopenComplaint;
