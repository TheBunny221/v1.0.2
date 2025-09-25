import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  contextName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically for context-related errors
 */
export class ContextErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a context-related error
    const isContextError = 
      error.message.includes('must be used within') ||
      error.message.includes('Context') ||
      error.message.includes('Provider');
    
    return {
      hasError: isContextError,
      error: isContextError ? error : undefined,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log context errors for debugging
    if (this.state.hasError) {
      console.group('🔴 Context Error Boundary');
      console.error('Context Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Context Name:', this.props.contextName || 'Unknown');
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="max-w-md mx-auto mt-8 border-red-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-red-700">
              Context Error
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {this.props.contextName 
                ? `${this.props.contextName} context is not available.`
                : 'A required context is not available.'
              }
            </p>
            <p className="text-sm text-gray-500">
              This usually means a component is being used outside of its provider.
            </p>
            {this.state.error && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <Button 
              onClick={this.handleRetry}
              variant="outline"
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with context error boundary
 */
export function withContextErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  contextName?: string,
  fallback?: ReactNode
) {
  const WrappedComponent = (props: P) => (
    <ContextErrorBoundary contextName={contextName} fallback={fallback}>
      <Component {...props} />
    </ContextErrorBoundary>
  );

  WrappedComponent.displayName = `withContextErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}
