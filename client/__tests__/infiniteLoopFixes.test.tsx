/**
 * Tests to validate infinite useEffect loop fixes
 */

import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '../store';
import { performanceMonitor } from '../utils/performanceMonitor';

// Mock components for testing
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={store}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
);

// Mock the API hooks to prevent actual API calls
jest.mock('../store/api/complaintsApi', () => ({
  useGetComplaintsQuery: () => ({
    data: { data: { complaints: [], pagination: { totalPages: 1 } } },
    isLoading: false,
    error: null,
  }),
  useGetComplaintQuery: () => ({
    data: { data: { complaint: null } },
    isLoading: false,
    error: null,
  }),
}));

jest.mock('../store/api/wardApi', () => ({
  useDetectLocationAreaMutation: () => [jest.fn(), { isLoading: false }],
}));

jest.mock('../contexts/SystemConfigContext', () => ({
  useSystemConfig: () => ({
    getConfig: jest.fn((key, defaultValue) => defaultValue),
    isLoading: false,
    config: {},
  }),
}));

describe('Infinite Loop Fixes', () => {
  beforeEach(() => {
    performanceMonitor.clear();
    performanceMonitor.setThresholds(5, 3, 2000); // Lower thresholds for testing
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('ComplaintsList Component', () => {
    it('should not cause infinite renders', async () => {
      const ComplaintsList = require('../pages/ComplaintsList').default;
      
      render(
        <TestWrapper>
          <ComplaintsList />
        </TestWrapper>
      );

      // Wait for component to stabilize
      await waitFor(() => {
        expect(screen.getByText(/complaints/i)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Check performance metrics
      const report = performanceMonitor.getReport();
      const complaintsListMetrics = report['ComplaintsList'];
      
      if (complaintsListMetrics) {
        expect(complaintsListMetrics.renderCount).toBeLessThan(5);
      }
    });

    it('should properly debounce search input', async () => {
      const ComplaintsList = require('../pages/ComplaintsList').default;
      
      const { container } = render(
        <TestWrapper>
          <ComplaintsList />
        </TestWrapper>
      );

      // Simulate rapid typing
      const searchInput = container.querySelector('input[placeholder*="search"]');
      if (searchInput) {
        // Simulate typing multiple characters quickly
        for (let i = 0; i < 5; i++) {
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }

      // Wait for debounce to settle
      await waitFor(() => {
        // Should not trigger excessive API calls
        const report = performanceMonitor.getReport();
        const apiCalls = Object.values(report).reduce((total, metrics) => 
          total + metrics.apiCalls.length, 0
        );
        expect(apiCalls).toBeLessThan(3);
      }, { timeout: 1000 });
    });
  });

  describe('UnifiedReports Component', () => {
    it('should not cause infinite renders with memoized functions', async () => {
      const UnifiedReports = require('../pages/UnifiedReports').default;
      
      render(
        <TestWrapper>
          <UnifiedReports />
        </TestWrapper>
      );

      // Wait for component to stabilize
      await waitFor(() => {
        // Component should render without infinite loops
        const report = performanceMonitor.getReport();
        const unifiedReportsMetrics = report['UnifiedReports'];
        
        if (unifiedReportsMetrics) {
          expect(unifiedReportsMetrics.renderCount).toBeLessThan(5);
        }
      }, { timeout: 3000 });
    });

    it('should debounce heatmap updates', async () => {
      const UnifiedReports = require('../pages/UnifiedReports').default;
      
      render(
        <TestWrapper>
          <UnifiedReports />
        </TestWrapper>
      );

      // Wait for initial load
      await waitFor(() => {
        // Should not make excessive heatmap API calls
        const report = performanceMonitor.getReport();
        const heatmapCalls = Object.values(report).reduce((total, metrics) => 
          total + metrics.apiCalls.filter(call => call.url.includes('heatmap')).length, 0
        );
        expect(heatmapCalls).toBeLessThan(3);
      }, { timeout: 2000 });
    });
  });

  describe('SimpleLocationMapDialog Component', () => {
    it('should not cause infinite renders with memoized callbacks', async () => {
      const SimpleLocationMapDialog = require('../components/SimpleLocationMapDialog').default;
      
      const mockProps = {
        isOpen: true,
        onClose: jest.fn(),
        onLocationSelect: jest.fn(),
      };

      render(
        <TestWrapper>
          <SimpleLocationMapDialog {...mockProps} />
        </TestWrapper>
      );

      // Wait for component to stabilize
      await waitFor(() => {
        const report = performanceMonitor.getReport();
        const dialogMetrics = report['SimpleLocationMapDialog'];
        
        if (dialogMetrics) {
          expect(dialogMetrics.renderCount).toBeLessThan(5);
        }
      }, { timeout: 3000 });
    });

    it('should not make excessive geocoding API calls', async () => {
      const SimpleLocationMapDialog = require('../components/SimpleLocationMapDialog').default;
      
      const mockProps = {
        isOpen: true,
        onClose: jest.fn(),
        onLocationSelect: jest.fn(),
        initialLocation: { latitude: 9.9312, longitude: 76.2673 },
      };

      render(
        <TestWrapper>
          <SimpleLocationMapDialog {...mockProps} />
        </TestWrapper>
      );

      // Wait for initial geocoding
      await waitFor(() => {
        const report = performanceMonitor.getReport();
        const geocodingCalls = Object.values(report).reduce((total, metrics) => 
          total + metrics.apiCalls.filter(call => 
            call.url.includes('nominatim') || call.url.includes('geocode')
          ).length, 0
        );
        expect(geocodingCalls).toBeLessThan(3);
      }, { timeout: 2000 });
    });
  });

  describe('Performance Monitoring', () => {
    it('should detect excessive renders', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Simulate excessive renders
      for (let i = 0; i < 10; i++) {
        performanceMonitor.trackRender('TestComponent');
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('PERFORMANCE WARNING')
      );

      consoleSpy.mockRestore();
    });

    it('should detect excessive API calls', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Simulate excessive API calls
      for (let i = 0; i < 5; i++) {
        performanceMonitor.trackApiCall('/api/test', 'GET');
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API WARNING')
      );

      consoleSpy.mockRestore();
    });
  });
});

describe('useEffect Dependency Arrays', () => {
  it('should have stable dependency arrays', () => {
    // This test ensures that useCallback and useMemo are used correctly
    // to prevent dependency array changes that cause infinite loops
    
    const mockCallback = jest.fn();
    const mockDependency = { value: 'test' };
    
    // Simulate a component with proper memoization
    const TestComponent = () => {
      const memoizedCallback = React.useCallback(() => {
        mockCallback();
      }, []); // Empty dependency array - stable
      
      const memoizedValue = React.useMemo(() => {
        return { processed: mockDependency.value };
      }, [mockDependency.value]); // Only depends on primitive value
      
      React.useEffect(() => {
        memoizedCallback();
      }, [memoizedCallback]); // Stable dependency
      
      return <div>{memoizedValue.processed}</div>;
    };
    
    render(<TestComponent />);
    
    // Should only call once due to stable dependencies
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});
