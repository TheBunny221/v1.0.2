import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "../store/hooks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  Wrench,
  Calendar,
  MapPin,
  Clock,
  Camera,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Play,
  Plus,
  RotateCcw,
  ListTodo,
  AlertCircle,
  Upload,
} from "lucide-react";

const MaintenanceTasks: React.FC = () => {
  const tasks = [
    {
      id: "1",
      title: "Water Pipeline Repair",
      location: "MG Road, Near Metro Station",
      priority: "HIGH",
      status: "ASSIGNED",
      estimatedTime: "4 hours",
      dueDate: "2024-01-15",
      description:
        "Main water pipeline burst, affecting supply to 200+ households",
    },
    {
      id: "2",
      title: "Street Light Installation",
      location: "Marine Drive, Walkway Section",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      estimatedTime: "2 hours",
      dueDate: "2024-01-16",
      description: "Install 5 new LED street lights along the walkway",
    },
    {
      id: "3",
      title: "Road Pothole Filling",
      location: "Broadway Junction",
      priority: "LOW",
      status: "COMPLETED",
      estimatedTime: "3 hours",
      dueDate: "2024-01-10",
      description: "Fill multiple potholes affecting traffic flow",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS":
        return "bg-orange-100 text-orange-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ASSIGNED":
        return <Clock className="h-4 w-4" />;
      case "IN_PROGRESS":
        return <AlertTriangle className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Maintenance Tasks
          </h1>
          <p className="text-gray-600">Manage your assigned maintenance work</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Camera className="h-4 w-4 mr-2" />
            Quick Photo
          </Button>
          <Button>
            <Navigation className="h-4 w-4 mr-2" />
            Route Planner
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Today's Tasks
                </p>
                <p className="text-2xl font-bold">5</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-orange-600">2</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">8</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Efficiency</p>
                <p className="text-2xl font-bold text-purple-600">94%</p>
              </div>
              <Wrench className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wrench className="h-5 w-5 mr-2" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{task.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {task.description}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge className={getStatusColor(task.status)}>
                      <span className="flex items-center">
                        {getStatusIcon(task.status)}
                        <span className="ml-1">
                          {task.status.replace("_", " ")}
                        </span>
                      </span>
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{task.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Est. {task.estimatedTime}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Due: {task.dueDate}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Navigation className="h-3 w-3 mr-1" />
                      Navigate
                    </Button>
                    <Button variant="outline" size="sm">
                      <Camera className="h-3 w-3 mr-1" />
                      Photo
                    </Button>
                  </div>
                  <div className="flex space-x-2">
                    {task.status === "ASSIGNED" && (
                      <Button size="sm">
                        <Play className="h-3 w-3 mr-1" />
                        Start Work
                      </Button>
                    )}
                    {task.status === "IN_PROGRESS" && (
                      <Button size="sm">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Link to={`/tasks/${task.id}`}>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Field Tools</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="w-full">
              <Camera className="h-4 w-4 mr-2" />
              Photo Report
            </Button>
            <Button variant="outline" className="w-full">
              <Navigation className="h-4 w-4 mr-2" />
              GPS Tools
            </Button>
            <Button variant="outline" className="w-full">
              <Clock className="h-4 w-4 mr-2" />
              Time Tracker
            </Button>
            <Button variant="outline" className="w-full">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaintenanceTasks;
