import React from "react";
import PlaceholderPage from "../components/PlaceholderPage";
import { AlertTriangle } from "lucide-react";

const NotFound: React.FC = () => {
  return (
    <PlaceholderPage
      title="Page Not Found"
      description="The page you're looking for doesn't exist or has been moved."
      icon={<AlertTriangle className="h-12 w-12" />}
    />
  );
};

export default NotFound;
