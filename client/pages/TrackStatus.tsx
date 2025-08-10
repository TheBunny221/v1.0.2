import React from 'react';
import PlaceholderPage from '../components/PlaceholderPage';
import { MapPin } from 'lucide-react';

const TrackStatus: React.FC = () => {
  return (
    <PlaceholderPage
      title="Track Complaint Status"
      description="Enter your complaint number or token to view real-time status updates and timeline."
      icon={<MapPin className="h-12 w-12" />}
    />
  );
};

export default TrackStatus;
