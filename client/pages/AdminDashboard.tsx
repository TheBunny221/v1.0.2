import React from 'react';
import PlaceholderPage from '@/components/PlaceholderPage';
import { BarChart3 } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  return (
    <PlaceholderPage
      title="Admin Dashboard"
      description="Comprehensive overview of complaint metrics, SLA tracking, and system analytics."
      icon={<BarChart3 className="h-12 w-12" />}
    />
  );
};

export default AdminDashboard;
