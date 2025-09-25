import "@testing-library/jest-dom";
import { expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Global test setup
beforeEach(() => {
  // Clear any mocks before each test
  vi.clearAllMocks();

  // Reset any global state
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  // Clean up after each test
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: "",
  thresholds: [],
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true
});

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn((success) => 
      success({
        coords: {
          latitude: 9.9312,
          longitude: 76.2673,
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      })
    ),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  writable: true,
});

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  },
  writable: true,
});

// Mock window.isSecureContext
Object.defineProperty(window, 'isSecureContext', {
  value: true,
  writable: true,
});
// Setup MSW server for API mocking
export const server = setupServer(
  // Default handlers
  http.post("/api/auth/login", () => {
    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: "1",
          fullName: "Test User",
          email: "test@example.com",
          role: "CITIZEN",
          isActive: true,
          joinedOn: new Date().toISOString(),
          hasPassword: true,
        },
        token: "mock-jwt-token",
      },
    });
  }),

  http.get("/api/auth/me", ({ request }) => {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: "1",
          fullName: "Test User",
          email: "test@example.com",
          role: "CITIZEN",
          isActive: true,
          joinedOn: new Date().toISOString(),
          hasPassword: true,
        },
      },
    });
  }),

  http.get("/api/complaints", () => {
    return HttpResponse.json({
      success: true,
      data: {
        complaints: [],
        pagination: {
          totalPages: 1,
          currentPage: 1,
          totalItems: 0,
        },
      },
    });
  }),

  http.get("/api/reports/analytics", () => {
    return HttpResponse.json({
      success: true,
      data: {
        complaints: { total: 0, resolved: 0, pending: 0, overdue: 0 },
        sla: { compliance: 95, avgResolutionTime: 24, target: 48 },
        trends: [],
        wards: [],
        categories: [],
        performance: { userSatisfaction: 85, escalationRate: 5, firstCallResolution: 80, repeatComplaints: 10 },
      },
    });
  }),

  http.get("/api/reports/heatmap", () => {
    return HttpResponse.json({
      success: true,
      data: {
        xLabels: [],
        yLabels: [],
        matrix: [],
        xAxisLabel: "Time",
        yAxisLabel: "Categories",
      },
    });
  }),
);

// Start server before tests
beforeEach(() => {
  server.listen({ onUnhandledRequest: "error" });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Clean up after tests
afterEach(() => {
  server.close();
});

// Custom matchers
expect.extend({
  toBeInTheDocument: (received) => {
    const pass = received && document.body.contains(received);
    return {
      pass,
      message: () =>
        `expected element ${pass ? "not " : ""}to be in the document`,
    };
  },
});

// Test utilities
export const createMockUser = (overrides = {}) => ({
  id: "1",
  fullName: "Test User",
  email: "test@example.com",
  role: "CITIZEN" as const,
  isActive: true,
  joinedOn: new Date().toISOString(),
  ...overrides,
});

export const createMockComplaint = (overrides = {}) => ({
  id: "1",
  complaintId: "CMP001",
  type: "Water_Supply",
  description: "Test complaint description",
  status: "registered" as const,
  priority: "medium" as const,
  submittedBy: "test@example.com",
  submittedDate: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  ward: "Ward 1",
  area: "Test Area",
  location: "Test Location",
  address: "Test Address",
  mobile: "+1234567890",
  attachments: [],
  escalationLevel: 0,
  slaStatus: "ontime" as const,
  timeElapsed: 0,
  ...overrides,
});

// Mock localStorage
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: mockLocalStorage,
});

// Mock sessionStorage
export const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
});

// Helper to wait for async operations
export const waitFor = (callback: () => void, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const check = () => {
      try {
        callback();
        resolve(true);
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          reject(error);
        } else {
          setTimeout(check, 10);
        }
      }
    };
    check();
  });
};
