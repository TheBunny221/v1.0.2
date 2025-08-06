import React from 'react';
import PlaceholderPage from '@/components/PlaceholderPage';
import { BarChart3 } from 'lucide-react';

const AdminReports: React.FC = () => {
  return (
    <PlaceholderPage
      title="Reports & Analytics"
      description="Generate comprehensive reports on SLA compliance, trends, and export data in various formats."
      icon={<BarChart3 className="h-12 w-12" />}
    />
  );
};

export default AdminReports;
