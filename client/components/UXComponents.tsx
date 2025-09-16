import React from "react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import {
  Loader2,
  Search,
  FileX,
  AlertCircle,
  RefreshCw,
  Plus,
  Filter,
  Download,
  Upload,
  Inbox,
  Calendar,
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

// Loading Skeleton Components
export const CardSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <Card className={cn("p-6", className)}>
    <CardHeader className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-3 w-4/6" />
    </CardContent>
  </Card>
);

export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => (
  <div className={cn("space-y-4", className)}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>

    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-8 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const ListSkeleton: React.FC<{
  items?: number;
  showAvatar?: boolean;
  className?: string;
}> = ({ items = 3, showAvatar = false, className }) => (
  <div className={cn("space-y-4", className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center space-x-4">
        {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);

export const FormSkeleton: React.FC<{
  fields?: number;
  className?: string;
}> = ({ fields = 4, className }) => (
  <div className={cn("space-y-6", className)}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
    <div className="flex space-x-4 pt-4">
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={cn("space-y-6", className)}>
    {/* Stats Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </Card>
      ))}
    </div>

    {/* Chart Area */}
    <Card className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    </Card>

    {/* Recent Activity */}
    <Card className="p-6">
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <ListSkeleton items={5} showAvatar />
      </div>
    </Card>
  </div>
);

// Loading States
interface LoadingSpinnerProps {
  size?: "sm" | "default" | "lg";
  text?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "default",
  text,
  className,
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div
      className={cn("flex items-center justify-center space-x-2", className)}
    >
      <Loader2 className={cn("animate-spin", sizeClasses[size])} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  children: React.ReactNode;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  text = "Loading...",
  children,
  className,
}) => (
  <div className={cn("relative", className)}>
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
        <LoadingSpinner text={text} />
      </div>
    )}
  </div>
);

// Empty States
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary";
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center text-center p-8",
      className,
    )}
  >
    {icon && (
      <div className="mb-4 p-3 bg-muted rounded-full">
        {React.cloneElement(icon as React.ReactElement, {
          className: "h-8 w-8 text-muted-foreground",
        })}
      </div>
    )}
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
    {action && (
      <Button onClick={action.onClick} variant={action.variant || "default"}>
        {action.label}
      </Button>
    )}
  </div>
);

// Specific Empty States
export const NoDataEmpty: React.FC<{
  entityName: string;
  onAdd?: () => void;
  className?: string;
}> = ({ entityName, onAdd, className }) => (
  <EmptyState
    icon={<Inbox />}
    title={`No ${entityName} Found`}
    description={`You haven't created any ${entityName.toLowerCase()} yet. Get started by creating your first one.`}
    action={
      onAdd
        ? {
            label: `Create ${entityName}`,
            onClick: onAdd,
          }
        : undefined
    }
    className={className}
  />
);

export const NoSearchResultsEmpty: React.FC<{
  searchTerm: string;
  onClear: () => void;
  className?: string;
}> = ({ searchTerm, onClear, className }) => (
  <EmptyState
    icon={<Search />}
    title="No Results Found"
    description={`No results found for "${searchTerm}". Try adjusting your search terms or filters.`}
    action={{
      label: "Clear Search",
      onClick: onClear,
      variant: "outline",
    }}
    className={className}
  />
);

export const ErrorEmpty: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}> = ({
  title = "Something went wrong",
  description = "We encountered an error while loading this data. Please try again.",
  onRetry,
  className,
}) => (
  <EmptyState
    icon={<AlertCircle />}
    title={title}
    description={description}
    action={
      onRetry
        ? {
            label: "Try Again",
            onClick: onRetry,
            variant: "outline",
          }
        : undefined
    }
    className={className}
  />
);

export const NoPermissionEmpty: React.FC<{ className?: string }> = ({
  className,
}) => (
  <EmptyState
    icon={<XCircle />}
    title="Access Denied"
    description="You don't have permission to view this content. Contact your administrator if you believe this is an error."
    className={className}
  />
);

// Status Indicators
interface StatusIndicatorProps {
  status: "success" | "error" | "warning" | "info" | "pending";
  text?: string;
  size?: "sm" | "default" | "lg";
  showIcon?: boolean;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  text,
  size = "default",
  showIcon = true,
  className,
}) => {
  const configs = {
    success: {
      icon: CheckCircle,
      className: "bg-green-100 text-green-800 border-green-200",
      iconClassName: "text-green-500",
    },
    error: {
      icon: XCircle,
      className: "bg-red-100 text-red-800 border-red-200",
      iconClassName: "text-red-500",
    },
    warning: {
      icon: AlertTriangle,
      className: "bg-yellow-100 text-yellow-800 border-yellow-200",
      iconClassName: "text-yellow-500",
    },
    info: {
      icon: AlertCircle,
      className: "bg-blue-100 text-blue-800 border-blue-200",
      iconClassName: "text-blue-500",
    },
    pending: {
      icon: Clock,
      className: "bg-gray-100 text-gray-800 border-gray-200",
      iconClassName: "text-gray-500",
    },
  };

  const config = configs[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    default: "text-sm px-2.5 py-1.5",
    lg: "text-base px-3 py-2",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        config.className,
        sizeClasses[size],
        className,
      )}
    >
      {showIcon && (
        <Icon className={cn("mr-1.5", iconSizes[size], config.iconClassName)} />
      )}
      {text}
    </div>
  );
};

// Progress States
interface ProgressStepperProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    status: "completed" | "current" | "pending" | "error";
  }>;
  className?: string;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  className,
}) => (
  <div className={cn("space-y-4", className)}>
    {steps.map((step, index) => (
      <div key={step.id} className="flex items-start">
        <div className="flex-shrink-0 relative">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
              step.status === "completed" && "bg-green-100 text-green-800",
              step.status === "current" && "bg-blue-100 text-blue-800",
              step.status === "pending" && "bg-gray-100 text-gray-500",
              step.status === "error" && "bg-red-100 text-red-800",
            )}
          >
            {step.status === "completed" ? (
              <CheckCircle className="w-5 h-5" />
            ) : step.status === "error" ? (
              <XCircle className="w-5 h-5" />
            ) : (
              index + 1
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                "absolute top-8 left-4 w-0.5 h-6 -ml-px",
                step.status === "completed" ? "bg-green-200" : "bg-gray-200",
              )}
            />
          )}
        </div>
        <div className="ml-4 flex-1">
          <h4
            className={cn(
              "text-sm font-medium",
              step.status === "current" && "text-blue-600",
              step.status === "pending" && "text-gray-500",
            )}
          >
            {step.title}
          </h4>
          {step.description && (
            <p className="text-sm text-gray-500 mt-1">{step.description}</p>
          )}
        </div>
      </div>
    ))}
  </div>
);

// Data Display Components
interface DataDisplayProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const DataDisplay: React.FC<DataDisplayProps> = ({
  label,
  value,
  icon,
  className,
}) => (
  <div className={cn("space-y-1", className)}>
    <div className="flex items-center space-x-2">
      {icon && <span className="text-muted-foreground">{icon}</span>}
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
    <div className="text-sm">{value}</div>
  </div>
);

// Quick Action Buttons
interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  icon,
  label,
  onClick,
  variant = "outline",
  size = "default",
  className,
}) => (
  <Button
    variant={variant}
    size={size}
    onClick={onClick}
    className={cn(
      "flex flex-col items-center space-y-2 h-auto py-4",
      className,
    )}
  >
    {React.cloneElement(icon as React.ReactElement, { className: "h-6 w-6" })}
    <span className="text-xs">{label}</span>
  </Button>
);

// File Upload Dropzone
interface FileDropzoneProps {
  onDrop: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  className?: string;
  children?: React.ReactNode;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onDrop,
  accept,
  multiple = false,
  maxSize,
  className,
  children,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onDrop(files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragOver
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25",
        "hover:border-primary hover:bg-primary/5 cursor-pointer",
        className,
      )}
    >
      {children || (
        <div className="space-y-4">
          <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Drop files here or click to upload
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {accept && `Supported formats: ${accept}`}
              {maxSize && ` • Max size: ${maxSize}MB`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
