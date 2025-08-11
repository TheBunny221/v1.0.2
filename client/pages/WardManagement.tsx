import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  MapPin,
  Users,
  BarChart3,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

const WardManagement: React.FC = () => {
  const wardStats = {
    totalComplaints: 45,
    resolved: 38,
    pending: 7,
    teams: 8,
    resolutionRate: 84,
  };

  const subZones = [
    { name: "MG Road", complaints: 12, resolved: 10, priority: "Medium" },
    { name: "Broadway", complaints: 8, resolved: 7, priority: "Low" },
    { name: "Marine Drive", complaints: 15, resolved: 12, priority: "High" },
    { name: "Fort Kochi", complaints: 10, resolved: 9, priority: "Medium" },
  ];

  const teams = [
    { name: "Electrical Team", members: 5, activeJobs: 3, efficiency: 92 },
    { name: "Water Works", members: 4, activeJobs: 2, efficiency: 88 },
    { name: "Road Maintenance", members: 6, activeJobs: 4, efficiency: 85 },
    { name: "Sanitation", members: 3, activeJobs: 1, efficiency: 95 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ward Management</h1>
        <p className="text-gray-600">
          Overview and management of Ward 1 - Central Zone
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Complaints
                </p>
                <p className="text-2xl font-bold">
                  {wardStats.totalComplaints}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {wardStats.resolved}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {wardStats.pending}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Teams</p>
                <p className="text-2xl font-bold">{wardStats.teams}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resolution Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Ward Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Resolution Rate</span>
                <span>{wardStats.resolutionRate}%</span>
              </div>
              <Progress value={wardStats.resolutionRate} className="h-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">2.3</div>
                <p className="text-sm text-gray-600">Avg. Resolution Days</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">95%</div>
                <p className="text-sm text-gray-600">Citizen Satisfaction</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">28</div>
                <p className="text-sm text-gray-600">Active Team Members</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sub-Zones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Sub-Zones Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subZones.map((zone, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{zone.name}</h3>
                    <Badge variant="secondary">{zone.priority} Priority</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total: {zone.complaints}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Resolved: {zone.resolved}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress
                      value={(zone.resolved / zone.complaints) * 100}
                      className="h-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Teams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Team Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teams.map((team, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{team.name}</h3>
                    <Badge
                      className={`${
                        team.efficiency >= 90
                          ? "bg-green-100 text-green-800"
                          : team.efficiency >= 80
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {team.efficiency}% Efficiency
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Members: {team.members}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">
                        Active Jobs: {team.activeJobs}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm">
                      Manage Team
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Ward Management Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="w-full">
              Assign Tasks
            </Button>
            <Button variant="outline" className="w-full">
              Generate Report
            </Button>
            <Button variant="outline" className="w-full">
              Team Schedule
            </Button>
            <Button variant="outline" className="w-full">
              Resource Planning
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WardManagement;
