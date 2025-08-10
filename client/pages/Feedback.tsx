import React from 'react';
import PlaceholderPage from '../components/PlaceholderPage';
import { MessageSquare } from 'lucide-react';

const Feedback: React.FC = () => {
  return (
    <PlaceholderPage
      title="Citizen Feedback"
      description="Rate and provide feedback on resolved complaints to help us improve our services."
      icon={<MessageSquare className="h-12 w-12" />}
    />
  );
};

export default Feedback;
