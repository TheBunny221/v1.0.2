import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { useSystemConfig, SystemConfigProvider } from '../contexts/SystemConfigContext';
import { useOtpFlow, OtpProvider } from '../contexts/OtpContext';
import { ContextErrorBoundary } from '../components/ContextErrorBoundary';
import { useSafeContext, useSafeOptionalContext } from '../hooks/useSafeContext';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authSlice from '../store/slices/authSlice';
import { baseApi } from '../store/api/baseApi';

// Mock components for testing
const TestSystemConfigComponent = () => {
  const { appName, appLogoUrl, getConfig } = useSystemConfig();
  return (
    <div>
      <span data-testid="app-name">{appName}</span>
      <span data-testid="logo-url">{appLogoUrl}</span>
      <span data-testid="custom-config">{getConfig('CUSTOM_KEY', 'default')}</span>
    </div>
  );
};

const TestOtpComponent = () => {
  const { openOtpFlow, closeOtpFlow, isOpen } = useOtpFlow();
  return (
    <div>
      <span data-testid="otp-open">{isOpen.toString()}</span>
      <button 
        data-testid="open-otp"
        onClick={() => openOtpFlow({
          context: 'login',
          email: 'test@example.com'
        })}
      >
        Open OTP
      </button>
      <button data-testid="close-otp" onClick={closeOtpFlow}>
        Close OTP
      </button>
    </div>
  );
};

// Mock store setup
const createMockStore = () => configureStore({
  reducer: {
    auth: authSlice,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

// Mock toast hook
vi.mock('../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock API hooks
vi.mock('../store/api/systemConfigApi', () => ({
  useGetPublicSystemConfigQuery: () => ({
    data: {
      success: true,
      data: [
        { key: 'APP_NAME', value: 'Test App' },
        { key: 'APP_LOGO_URL', value: '/test-logo.png' },
      ],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe('Context Safety Tests', () => {
  let mockStore: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    mockStore = createMockStore();
    vi.clearAllMocks();
  });

  describe('SystemConfigContext', () => {
    it('should provide default values when used outside provider', () => {
      // Suppress console warnings for this test
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(<TestSystemConfigComponent />);
      
      expect(screen.getByTestId('app-name')).toHaveTextContent('Kochi Smart City');
      expect(screen.getByTestId('logo-url')).toHaveTextContent('/logo.png');
      expect(screen.getByTestId('custom-config')).toHaveTextContent('default');
      
      consoleSpy.mockRestore();
    });

    it('should work correctly when used within provider', () => {
      render(
        <Provider store={mockStore}>
          <SystemConfigProvider>
            <TestSystemConfigComponent />
          </SystemConfigProvider>
        </Provider>
      );
      
      expect(screen.getByTestId('app-name')).toHaveTextContent('Test App');
      expect(screen.getByTestId('logo-url')).toHaveTextContent('/test-logo.png');
    });

    it('should handle API errors gracefully', () => {
      // Mock API error
      vi.doMock('../store/api/systemConfigApi', () => ({
        useGetPublicSystemConfigQuery: () => ({
          data: null,
          isLoading: false,
          error: { status: 500, message: 'Server Error' },
          refetch: vi.fn(),
        }),
      }));

      render(
        <Provider store={mockStore}>
          <SystemConfigProvider>
            <TestSystemConfigComponent />
          </SystemConfigProvider>
        </Provider>
      );
      
      // Should fall back to default values
      expect(screen.getByTestId('app-name')).toHaveTextContent('Kochi Smart City');
    });
  });

  describe('OtpContext', () => {
    it('should provide default values when used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(<TestOtpComponent />);
      
      expect(screen.getByTestId('otp-open')).toHaveTextContent('false');
      
      // Should not crash when clicking buttons
      fireEvent.click(screen.getByTestId('open-otp'));
      fireEvent.click(screen.getByTestId('close-otp'));
      
      consoleSpy.mockRestore();
    });

    it('should work correctly when used within provider', () => {
      render(
        <Provider store={mockStore}>
          <OtpProvider>
            <TestOtpComponent />
          </OtpProvider>
        </Provider>
      );
      
      expect(screen.getByTestId('otp-open')).toHaveTextContent('false');
      
      // Should be able to open OTP flow
      fireEvent.click(screen.getByTestId('open-otp'));
      expect(screen.getByTestId('otp-open')).toHaveTextContent('true');
    });

    it('should validate email when opening OTP flow', () => {
      const TestInvalidOtpComponent = () => {
        const { openOtpFlow } = useOtpFlow();
        return (
          <button 
            data-testid="open-invalid-otp"
            onClick={() => openOtpFlow({
              context: 'login',
              email: '' // Invalid email
            })}
          >
            Open Invalid OTP
          </button>
        );
      };

      render(
        <Provider store={mockStore}>
          <OtpProvider>
            <TestInvalidOtpComponent />
          </OtpProvider>
        </Provider>
      );
      
      // Should handle invalid email gracefully
      fireEvent.click(screen.getByTestId('open-invalid-otp'));
      // Should not crash and should show error via toast
    });
  });

  describe('ContextErrorBoundary', () => {
    const ErrorComponent = () => {
      throw new Error('useTestContext must be used within a TestProvider');
    };

    it('should catch context-related errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ContextErrorBoundary contextName="TestContext">
          <ErrorComponent />
        </ContextErrorBoundary>
      );
      
      expect(screen.getByText('Context Error')).toBeInTheDocument();
      expect(screen.getByText('TestContext context is not available.')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    it('should allow retry after error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <ContextErrorBoundary contextName="TestContext">
          <ErrorComponent />
        </ContextErrorBoundary>
      );
      
      const retryButton = screen.getByText('Try Again');
      expect(retryButton).toBeInTheDocument();
      
      // Should be able to click retry (though it will error again in this test)
      fireEvent.click(retryButton);
      
      consoleSpy.mockRestore();
    });

    it('should render custom fallback when provided', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const customFallback = <div data-testid="custom-fallback">Custom Error UI</div>;
      
      render(
        <ContextErrorBoundary fallback={customFallback}>
          <ErrorComponent />
        </ContextErrorBoundary>
      );
      
      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Safe Context Hooks', () => {
    const TestContext = React.createContext<{ value: string } | undefined>(undefined);
    
    const TestSafeContextComponent = () => {
      const safeValue = useSafeOptionalContext(
        TestContext,
        'TestContext',
        { value: 'fallback' }
      );
      return <span data-testid="safe-value">{safeValue.value}</span>;
    };

    it('should use fallback value when context is not available', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(<TestSafeContextComponent />);
      
      expect(screen.getByTestId('safe-value')).toHaveTextContent('fallback');
      expect(consoleSpy).toHaveBeenCalledWith(
        'TestContext context is not available, using fallback value'
      );
      
      consoleSpy.mockRestore();
    });

    it('should use actual context value when available', () => {
      const TestProvider = ({ children }: { children: React.ReactNode }) => (
        <TestContext.Provider value={{ value: 'actual' }}>
          {children}
        </TestContext.Provider>
      );

      render(
        <TestProvider>
          <TestSafeContextComponent />
        </TestProvider>
      );
      
      expect(screen.getByTestId('safe-value')).toHaveTextContent('actual');
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple context providers together', () => {
      render(
        <Provider store={mockStore}>
          <SystemConfigProvider>
            <OtpProvider>
              <TestSystemConfigComponent />
              <TestOtpComponent />
            </OtpProvider>
          </SystemConfigProvider>
        </Provider>
      );
      
      // Both contexts should work
      expect(screen.getByTestId('app-name')).toBeInTheDocument();
      expect(screen.getByTestId('otp-open')).toBeInTheDocument();
    });

    it('should handle partial provider availability', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(
        <Provider store={mockStore}>
          <SystemConfigProvider>
            {/* OtpProvider is missing */}
            <TestSystemConfigComponent />
            <TestOtpComponent />
          </SystemConfigProvider>
        </Provider>
      );
      
      // SystemConfig should work
      expect(screen.getByTestId('app-name')).toBeInTheDocument();
      
      // OtpFlow should use defaults
      expect(screen.getByTestId('otp-open')).toHaveTextContent('false');
      
      consoleSpy.mockRestore();
    });
  });
});
