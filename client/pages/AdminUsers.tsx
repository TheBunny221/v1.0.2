import React from 'react';
import PlaceholderPage from '@/components/PlaceholderPage';
import { Users } from 'lucide-react';

const AdminUsers: React.FC = () => {
  return (
    <PlaceholderPage
      title="User Management"
      description="Manage citizen accounts, staff members, role assignments, and user permissions."
      icon={<Users className="h-12 w-12" />}
    />
  );
};

export default AdminUsers;
