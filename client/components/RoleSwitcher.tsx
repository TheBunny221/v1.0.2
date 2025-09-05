import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Users, Shield, MapPin, Wrench } from 'lucide-react';

const RoleSwitcher: React.FC = () => {
  const roles = [
    {
      title: 'Citizen Portal',
      description: 'Register complaints, track status, and provide feedback',
      icon: <Users className="h-8 w-8" />,
      links: [
        { path: '/', label: 'Register Complaint' },
        { path: '/my-complaints', label: 'My Complaints' },
        { path: '/reopen-complaint', label: 'Reopen Complaint' },
        { path: '/track-status', label: 'Track Status' },
        { path: '/feedback', label: 'Feedback' },
      ]
    },
    {
      title: 'Admin Dashboard',
      description: 'Manage complaints, users, and generate reports',
      icon: <Shield className="h-8 w-8" />,
      links: [
        { path: '/admin', label: 'Dashboard' },
        { path: '/admin/complaints', label: 'Complaint Management' },
        { path: '/admin/users', label: 'User Management' },
        { path: '/admin/reports', label: 'Reports' },
      ]
    },
    {
      title: 'Ward Officer',
      description: 'Review and forward complaints for your zone',
      icon: <MapPin className="h-8 w-8" />,
      links: [
        { path: '/ward', label: 'Zone Dashboard' },
        { path: '/ward/review', label: 'Review Complaints' },
        { path: '/ward/forward', label: 'Forward Panel' },
      ]
    },
    {
      title: 'Maintenance Team',
      description: 'Update complaint status and track SLA',
      icon: <Wrench className="h-8 w-8" />,
      links: [
        { path: '/maintenance', label: 'Assigned Complaints' },
        { path: '/maintenance/update', label: 'Update Status' },
        { path: '/maintenance/sla', label: 'SLA Tracking' },
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">CitizenConnect Portal</h1>
        <p className="text-muted-foreground">
          Choose your role to access the relevant features
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role, index) => (
          <Card key={index} className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="text-primary">
                  {role.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{role.title}</h3>
                  <p className="text-sm text-muted-foreground font-normal">
                    {role.description}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {role.links.map((link, linkIndex) => (
                  <Button
                    key={linkIndex}
                    asChild
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <Link to={link.path}>
                      {link.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RoleSwitcher;
