import "@testing-library/jest-dom";
import { expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { setupServer } from "msw/node";
import { rest } from "msw";

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

// Mock PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
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

// Mock navigator
Object.defineProperty(navigator, "onLine", {
  writable: true,
  value: true,
});

Object.defineProperty(navigator, "sendBeacon", {
  writable: true,
  value: vi.fn(),
});

// Mock fetch
global.fetch = vi.fn();

// Mock console methods in tests
global.console = {
  ...console,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
};

// Mock performance
Object.defineProperty(global, "performance", {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
  },
});

// Mock window.gtag for analytics
Object.defineProperty(window, "gtag", {
  writable: true,
  value: vi.fn(),
});

// Setup MSW server for API mocking
export const server = setupServer(
  // Default handlers
  rest.post("/api/auth/login", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          user: {
            id: "1",
            fullName: "Test User",
            email: "test@example.com",
            role: "CITIZEN",
            isActive: true,
            joinedOn: new Date().toISOString(),
          },
          token: "mock-jwt-token",
        },
      }),
    );
  }),

  rest.get("/api/auth/me", (req, res, ctx) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res(ctx.status(401), ctx.json({ message: "Unauthorized" }));
    }

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          user: {
            id: "1",
            fullName: "Test User",
            email: "test@example.com",
            role: "CITIZEN",
            isActive: true,
            joinedOn: new Date().toISOString(),
          },
        },
      }),
    );
  }),

  rest.get("/api/complaints", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          hasMore: false,
        },
      }),
    );
  }),

  rest.post("/api/analytics", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true }));
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
