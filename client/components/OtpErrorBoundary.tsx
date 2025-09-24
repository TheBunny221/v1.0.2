/**
 * Specialized Error Boundary for OtpProvider Context Issues
 * Provides fallback UI and error recovery for OTP-related context errors
 */

import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

class OtpErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error details
    console.error('🚨 [OtpErrorBoundary] Context error caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      route: window.location.pathname,
      timestamp: new Date().toISOString(),
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Check if this is an OTP context-related error
    const isOtpContextError = 
      error.message.includes('OtpProvider') ||
      error.message.includes('useOtp') ||
      error.message.includes('Cannot read properties of null') ||
      error.message.includes('useContext');

    if (isOtpContextError) {
      console.warn(
        '🔍 [OtpErrorBoundary] Detected OTP context error. This might be caused by:',
        '\n1. Component rendered outside OtpProvider',
        '\n2. Provider initialization timing issue',
        '\n3. Route-specific context mounting problem',
        '\n📍 Current route:', window.location.pathname,
        '\n🔄 Attempting recovery...'
      );
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      console.log(`🔄 [OtpErrorBoundary] Retry attempt ${this.state.retryCount + 1}/${this.maxRetries}`);
      
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      console.error('🚨 [OtpErrorBoundary] Max retries exceeded. Manual refresh required.');
      window.location.reload();
    }
  };

  handleRefresh = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      const isOtpContextError = 
        this.state.error?.message.includes('OtpProvider') ||
        this.state.error?.message.includes('useOtp') ||
        this.state.error?.message.includes('Cannot read properties of null');

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full">
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {isOtpContextError ? 'OTP Context Error' : 'Application Error'}
              </AlertTitle>
              <AlertDescription className="mt-2">
                {isOtpContextError ? (
                  <>
                    There was an issue with the OTP verification system. This usually happens when:
                    <ul className="mt-2 ml-4 list-disc text-sm">
                      <li>The page loaded before the context was ready</li>
                      <li>There's a temporary network issue</li>
                      <li>The route configuration needs to refresh</li>
                    </ul>
                  </>
                ) : (
                  'An unexpected error occurred while loading this page.'
                )}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              {this.state.retryCount < this.maxRetries ? (
                <Button 
                  onClick={this.handleRetry}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again ({this.maxRetries - this.state.retryCount} attempts left)
                </Button>
              ) : (
                <Button 
                  onClick={this.handleRefresh}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </Button>
              )}

              <Button 
                onClick={() => window.history.back()}
                variant="outline"
                className="w-full"
              >
                Go Back
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer font-semibold">
                  Debug Information (Development Only)
                </summary>
                <div className="mt-2 space-y-2">
                  <div>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  <div>
                    <strong>Route:</strong> {window.location.pathname}
                  </div>
                  <div>
                    <strong>Retry Count:</strong> {this.state.retryCount}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="mt-1 text-xs overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default OtpErrorBoundary;
