import React from 'react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

export type ComplaintStatus = 'registered' | 'assigned' | 'in-progress' | 'resolved' | 'closed' | 'reopened';

interface StatusChipProps {
  status: ComplaintStatus;
  className?: string;
}

const statusConfig = {
  registered: {
    label: 'Registered',
    className: 'bg-status-registered text-white',
  },
  assigned: {
    label: 'Assigned',
    className: 'bg-status-assigned text-white',
  },
  'in-progress': {
    label: 'In Progress',
    className: 'bg-status-progress text-white',
  },
  resolved: {
    label: 'Resolved',
    className: 'bg-status-resolved text-white',
  },
  closed: {
    label: 'Closed',
    className: 'bg-status-closed text-white',
  },
  reopened: {
    label: 'Reopened',
    className: 'bg-status-reopened text-white',
  },
};

const StatusChip: React.FC<StatusChipProps> = ({ status, className }) => {
  const config = statusConfig[status];
  
  return (
    <Badge
      variant="secondary"
      className={cn(
        'px-2 py-1 text-xs font-medium rounded-full',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
};

export default StatusChip;
