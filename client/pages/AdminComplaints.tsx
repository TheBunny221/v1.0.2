import React from 'react';
import PlaceholderPage from '@/components/PlaceholderPage';
import { FileText } from 'lucide-react';

const AdminComplaints: React.FC = () => {
  return (
    <PlaceholderPage
      title="Complaint Management"
      description="Manage all complaints with filtering, assignment, status updates, and bulk operations."
      icon={<FileText className="h-12 w-12" />}
    />
  );
};

export default AdminComplaints;
