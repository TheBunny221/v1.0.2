import React, { useEffect } from 'react';
import { useStatusTracking, useDataSync } from '../hooks/useDataManager';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Clock, AlertCircle, CheckCircle, FileText } from 'lucide-react';

interface StatusTrackerProps {
  complaintId?: string;
  showAll?: boolean;
  maxItems?: number;
}

const StatusTracker: React.FC<StatusTrackerProps> = ({ 
  complaintId, 
  showAll = false, 
  maxItems = 10 
}) => {
  const { 
    activeComplaints, 
    recentUpdates, 
    getStatusHistory 
  } = useStatusTracking();
  const { syncData } = useDataSync();

  // Auto-sync data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      syncData();
    }, 30000);

    return () => clearInterval(interval);
  }, [syncData]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'REGISTERED':
        return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-orange-100 text-orange-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      case 'REOPENED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'REGISTERED':
        return <FileText className="h-4 w-4" />;
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4" />;
      case 'RESOLVED':
      case 'CLOSED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REOPENED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get updates to display
  const updatesToShow = complaintId 
    ? getStatusHistory(complaintId) 
    : recentUpdates.slice(0, maxItems);

  if (complaintId && updatesToShow.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Status History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No status updates available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          {complaintId ? 'Status History' : 'Recent Updates'}
          {!complaintId && (
            <Badge variant="secondary" className="ml-2">
              {recentUpdates.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {updatesToShow.length === 0 ? (
              <p className="text-sm text-gray-500">No updates available</p>
            ) : (
              updatesToShow.map((update, index) => (
                <div key={update.id || index} className="flex items-start space-x-3 p-2 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(update.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs ${getStatusColor(update.status)}`}>
                        {update.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(update.timestamp)}
                      </span>
                    </div>
                    {!complaintId && (
                      <p className="text-xs text-gray-600 mt-1">
                        Complaint #{update.complaintId?.slice(-6)}
                      </p>
                    )}
                    {update.comment && (
                      <p className="text-sm text-gray-700 mt-1">
                        {update.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {showAll && recentUpdates.length > maxItems && (
          <div className="mt-3 text-center">
            <p className="text-xs text-gray-500">
              Showing {Math.min(maxItems, updatesToShow.length)} of {recentUpdates.length} updates
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Active complaints overview component
export const ActiveComplaintsTracker: React.FC = () => {
  const { activeComplaints } = useStatusTracking();

  const getComplaintCount = (status: string) => {
    return activeComplaints.filter(complaint => complaint.status === status).length;
  };

  const statusCounts = [
    { status: 'REGISTERED', label: 'Registered', color: 'bg-yellow-100 text-yellow-800' },
    { status: 'ASSIGNED', label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
    { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-orange-100 text-orange-800' },
    { status: 'RESOLVED', label: 'Resolved', color: 'bg-green-100 text-green-800' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Active Complaints Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {statusCounts.map(({ status, label, color }) => {
            const count = getComplaintCount(status);
            return (
              <div key={status} className="text-center p-3 rounded-lg bg-gray-50">
                <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${color} mb-1`}>
                  {label}
                </div>
                <div className="text-lg font-semibold text-gray-900">{count}</div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-3 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Active:</span>
            <span className="font-medium">{activeComplaints.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusTracker;
