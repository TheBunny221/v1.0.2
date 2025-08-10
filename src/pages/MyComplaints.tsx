import React from 'react';
import PlaceholderPage from '@/components/PlaceholderPage';
import { MessageSquare } from 'lucide-react';

const MyComplaints: React.FC = () => {
  return (
    <PlaceholderPage
      title="My Complaints"
      description="View and manage all your submitted complaints with status tracking, filters, and action options."
      icon={<MessageSquare className="h-12 w-12" />}
    />
  );
};

export default MyComplaints;
