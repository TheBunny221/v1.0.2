/**
 * Test suite to validate OtpProvider context availability across all routes
 * Specifically tests the /tasks/KSC0002 route issue
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../store';
import { OtpProvider, useOtpFlow } from '../contexts/OtpContext';
import { SystemConfigProvider } from '../contexts/SystemConfigContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock all the dependencies
vi.mock('../store/api/authApi', () => ({
  useVerifyOTPLoginMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useVerifyRegistrationOTPMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useRequestOTPLoginMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useResendRegistrationOTPMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}));

vi.mock('../store/api/guestApi', () => ({
  useVerifyGuestOtpMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
  useResendGuestOtpMutation: vi.fn(() => [vi.fn(), { isLoading: false }]),
}));

vi.mock('../hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

vi.mock('../contexts/SystemConfigContext', () => ({
  SystemConfigProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useSystemConfig: vi.fn(() => ({
    getConfig: vi.fn(),
    isLoading: false,
    config: {},
  })),
}));

// Test component that uses OtpContext
const TestOtpComponent: React.FC<{ routeName: string }> = ({ routeName }) => {
  const { openOtpFlow, closeOtpFlow, isOpen } = useOtpFlow();
  
  return (
    <div data-testid={`otp-test-${routeName}`}>
      <span data-testid="otp-available">OTP Context Available</span>
      <span data-testid="otp-open">{isOpen.toString()}</span>
      <button 
        data-testid="open-otp"
        onClick={() => openOtpFlow({
          context: 'login',
          email: 'test@example.com',
        })}
      >
        Open OTP
      </button>
      <button 
        data-testid="close-otp"
        onClick={closeOtpFlow}
      >
        Close OTP
      </button>
    </div>
  );
};

// Mock TaskDetails component
const MockTaskDetails: React.FC = () => {
  return (
    <div data-testid="task-details">
      <h1>Task Details - KSC0002</h1>
      <TestOtpComponent routeName="task-details" />
    </div>
  );
};

// Test wrapper with all providers
const TestWrapper: React.FC<{ children: React.ReactNode; initialRoute?: string }> = ({ 
  children, 
  initialRoute = '/' 
}) => (
  <Provider store={store}>
    <SystemConfigProvider>
      <OtpProvider>
        <BrowserRouter>
          <div data-testid="app-wrapper">
            {children}
          </div>
        </BrowserRouter>
      </OtpProvider>
    </SystemConfigProvider>
  </Provider>
);

describe('🔍 OtpProvider Context Routes Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any console warnings
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('✅ OtpProvider Availability', () => {
    it('should provide OtpContext in basic component', async () => {
      render(
        <TestWrapper>
          <TestOtpComponent routeName="basic" />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('otp-test-basic')).toBeInTheDocument();
        expect(screen.getByTestId('otp-available')).toBeInTheDocument();
        expect(screen.getByText('OTP Context Available')).toBeInTheDocument();
      });
    });

    it('should provide OtpContext in /tasks/KSC0002 route simulation', async () => {
      render(
        <TestWrapper>
          <Routes>
            <Route path="/tasks/KSC0002" element={<MockTaskDetails />} />
            <Route path="*" element={<MockTaskDetails />} />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('task-details')).toBeInTheDocument();
        expect(screen.getByTestId('otp-test-task-details')).toBeInTheDocument();
        expect(screen.getByText('OTP Context Available')).toBeInTheDocument();
      });
    });

    it('should handle OTP flow operations without errors', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      
      render(
        <TestWrapper>
          <TestOtpComponent routeName="operations" />
        </TestWrapper>
      );

      const openButton = screen.getByTestId('open-otp');
      const closeButton = screen.getByTestId('close-otp');

      // Test opening OTP flow
      openButton.click();
      
      // Test closing OTP flow
      closeButton.click();

      // Should not have any context warnings
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('OtpFlow called outside of OtpProvider')
      );
    });
  });

  describe('🚨 Error Handling', () => {
    it('should handle missing provider gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      
      // Render component without OtpProvider
      render(
        <Provider store={store}>
          <SystemConfigProvider>
            <BrowserRouter>
              <TestOtpComponent routeName="no-provider" />
            </BrowserRouter>
          </SystemConfigProvider>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('otp-test-no-provider')).toBeInTheDocument();
      });

      // Should show fallback warning
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[OtpContext Debug]')
      );
    });

    it('should provide fallback functionality when provider is missing', async () => {
      // Render without OtpProvider
      render(
        <Provider store={store}>
          <SystemConfigProvider>
            <BrowserRouter>
              <TestOtpComponent routeName="fallback" />
            </BrowserRouter>
          </SystemConfigProvider>
        </Provider>
      );

      const openButton = screen.getByTestId('open-otp');
      
      // Should not crash when clicking
      expect(() => openButton.click()).not.toThrow();
      
      // Should show fallback state
      await waitFor(() => {
        expect(screen.getByTestId('otp-open')).toHaveTextContent('false');
      });
    });
  });

  describe('🛣️ Route-Specific Tests', () => {
    const testRoutes = [
      '/tasks/KSC0002',
      '/tasks/123',
      '/tasks/ABC123',
      '/complaints/create',
      '/dashboard',
    ];

    testRoutes.forEach(route => {
      it(`should provide OtpContext for route: ${route}`, async () => {
        const TestRouteComponent = () => (
          <div data-testid={`route-${route.replace(/[^a-zA-Z0-9]/g, '-')}`}>
            <TestOtpComponent routeName={route.replace(/[^a-zA-Z0-9]/g, '-')} />
          </div>
        );

        render(
          <TestWrapper>
            <Routes>
              <Route path={route} element={<TestRouteComponent />} />
              <Route path="*" element={<TestRouteComponent />} />
            </Routes>
          </TestWrapper>
        );

        await waitFor(() => {
          const routeTestId = `route-${route.replace(/[^a-zA-Z0-9]/g, '-')}`;
          expect(screen.getByTestId(routeTestId)).toBeInTheDocument();
        });
      });
    });
  });

  describe('🔄 Provider Hierarchy', () => {
    it('should maintain context through nested components', async () => {
      const NestedComponent = () => (
        <div data-testid="nested-level-1">
          <div data-testid="nested-level-2">
            <div data-testid="nested-level-3">
              <TestOtpComponent routeName="nested" />
            </div>
          </div>
        </div>
      );

      render(
        <TestWrapper>
          <NestedComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('nested-level-3')).toBeInTheDocument();
        expect(screen.getByTestId('otp-test-nested')).toBeInTheDocument();
        expect(screen.getByText('OTP Context Available')).toBeInTheDocument();
      });
    });

    it('should work with lazy-loaded components', async () => {
      const LazyComponent = React.lazy(() => 
        Promise.resolve({
          default: () => <TestOtpComponent routeName="lazy" />
        })
      );

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <LazyComponent />
          </React.Suspense>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('otp-test-lazy')).toBeInTheDocument();
      });
    });
  });

  describe('🎯 Specific KSC0002 Issue', () => {
    it('should handle KSC0002 task ID without context errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error');
      
      const KSC0002Component = () => {
        // Simulate the exact component structure that might be causing issues
        const { openOtpFlow } = useOtpFlow();
        
        React.useEffect(() => {
          // Simulate any initialization that might trigger the error
          if (openOtpFlow) {
            console.log('OTP flow is available for KSC0002');
          }
        }, [openOtpFlow]);

        return (
          <div data-testid="ksc0002-component">
            <h1>Task KSC0002</h1>
            <TestOtpComponent routeName="ksc0002" />
          </div>
        );
      };

      render(
        <TestWrapper>
          <Routes>
            <Route path="/tasks/KSC0002" element={<KSC0002Component />} />
            <Route path="*" element={<KSC0002Component />} />
          </Routes>
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('ksc0002-component')).toBeInTheDocument();
      });

      // Should not have any context-related errors
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Cannot read properties of null')
      );
    });
  });
});

describe('🔧 OtpProvider Error Recovery', () => {
  it('should recover from provider errors gracefully', async () => {
    const ErrorProneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      try {
        return <OtpProvider>{children}</OtpProvider>;
      } catch (error) {
        console.error('Provider error caught:', error);
        return <div data-testid="provider-error-fallback">{children}</div>;
      }
    };

    render(
      <Provider store={store}>
        <SystemConfigProvider>
          <ErrorProneProvider>
            <BrowserRouter>
              <TestOtpComponent routeName="error-recovery" />
            </BrowserRouter>
          </ErrorProneProvider>
        </SystemConfigProvider>
      </Provider>
    );

    await waitFor(() => {
      // Should either show the component or the error fallback
      const component = screen.queryByTestId('otp-test-error-recovery');
      const fallback = screen.queryByTestId('provider-error-fallback');
      expect(component || fallback).toBeInTheDocument();
    });
  });
});
