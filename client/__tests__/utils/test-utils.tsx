import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import authSlice from "../../store/slices/authSlice";
import languageSlice from "../../store/slices/languageSlice";
import uiSlice from "../../store/slices/uiSlice";
import { baseApi } from "../../store/api/baseApi";

// Test store configuration
export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      auth: authSlice,
      language: languageSlice,
      ui: uiSlice,
      [baseApi.reducerPath]: baseApi.reducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [
            "api/executeQuery/pending",
            "api/executeQuery/fulfilled",
            "api/executeQuery/rejected",
          ],
        },
      }).concat(baseApi.middleware),
  });
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  preloadedState?: any;
  store?: ReturnType<typeof createTestStore>;
  initialEntries?: string[];
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    initialEntries = ["/"],
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: 0,
          cacheTime: 0,
        },
        mutations: {
          retry: false,
        },
      },
    }),
    ...renderOptions
  }: CustomRenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>{children}</BrowserRouter>
        </QueryClientProvider>
      </Provider>
    );
  }

  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

// Helper to render with authentication
export function renderWithAuth(
  ui: React.ReactElement,
  userOverrides = {},
  options: CustomRenderOptions = {},
) {
  const mockUser = {
    id: "1",
    fullName: "Test User",
    email: "test@example.com",
    role: "CITIZEN",
    isActive: true,
    joinedOn: new Date().toISOString(),
    ...userOverrides,
  };

  const preloadedState = {
    auth: {
      user: mockUser,
      token: "mock-token",
      isAuthenticated: true,
      isLoading: false,
      error: null,
      otpStep: "none",
      requiresPasswordSetup: false,
      registrationStep: "none",
    },
    language: {
      currentLanguage: "en",
      translations: {
        common: { loading: "Loading...", error: "Error" },
        messages: {
          operationSuccess: "Success",
          unauthorizedAccess: "Unauthorized",
        },
      },
      isLoading: false,
    },
    ...options.preloadedState,
  };

  return renderWithProviders(ui, { ...options, preloadedState });
}

// Helper to render without authentication
export function renderWithoutAuth(
  ui: React.ReactElement,
  options: CustomRenderOptions = {},
) {
  const preloadedState = {
    auth: {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      otpStep: "none",
      requiresPasswordSetup: false,
      registrationStep: "none",
    },
    language: {
      currentLanguage: "en",
      translations: {
        common: { loading: "Loading...", error: "Error" },
        messages: { unauthorizedAccess: "Unauthorized" },
      },
      isLoading: false,
    },
    ...options.preloadedState,
  };

  return renderWithProviders(ui, { ...options, preloadedState });
}

// Form testing utilities
export const fillFormField = async (
  getByLabelText: (text: string) => HTMLElement,
  labelText: string,
  value: string,
) => {
  const field = getByLabelText(labelText);
  await userEvent.clear(field);
  await userEvent.type(field, value);
  return field;
};

export const submitForm = async (
  getByRole: (role: string, options?: any) => HTMLElement,
) => {
  const submitButton = getByRole("button", { name: /submit|save|create/i });
  await userEvent.click(submitButton);
  return submitButton;
};

// Mock implementations
export const mockNavigate = vi.fn();
export const mockLocation = {
  pathname: "/",
  search: "",
  hash: "",
  state: null,
  key: "default",
};

// Mock react-router hooks
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// Helper for testing async components
export const waitForElementToBeRemoved = async (
  element: HTMLElement,
  timeout = 1000,
) => {
  const startTime = Date.now();
  while (document.body.contains(element)) {
    if (Date.now() - startTime > timeout) {
      throw new Error("Element was not removed within timeout");
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

// Helper for testing loading states
export const expectLoadingState = (container: HTMLElement) => {
  expect(container).toHaveTextContent(/loading/i);
};

export const expectErrorState = (
  container: HTMLElement,
  errorText?: string,
) => {
  if (errorText) {
    expect(container).toHaveTextContent(errorText);
  } else {
    expect(container).toHaveTextContent(/error/i);
  }
};

// Helper for testing accessibility
export const expectAccessibleForm = (form: HTMLElement) => {
  const inputs = form.querySelectorAll("input, select, textarea");
  inputs.forEach((input) => {
    const label = form.querySelector(`label[for="${input.id}"]`);
    if (
      !label &&
      !input.getAttribute("aria-label") &&
      !input.getAttribute("aria-labelledby")
    ) {
      throw new Error(`Input ${input.id || input.name} is missing a label`);
    }
  });
};

// Helper for testing keyboard navigation
export const testKeyboardNavigation = async (
  container: HTMLElement,
  keySequence: string[],
) => {
  for (const key of keySequence) {
    await userEvent.keyboard(`{${key}}`);
  }
};

// Helper for testing responsive design
export const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event("resize"));
};

// Helper for testing intersection observer
export const mockIntersectionObserver = (isIntersecting = true) => {
  const mockObserver = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };

  global.IntersectionObserver = vi.fn().mockImplementation((callback) => {
    // Immediately trigger callback if needed
    if (isIntersecting) {
      setTimeout(() => {
        callback([{ isIntersecting }]);
      }, 0);
    }
    return mockObserver;
  });

  return mockObserver;
};

// Helper for testing local storage
export const mockLocalStorageImplementation = () => {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
};

// Helper for testing API calls
export const expectApiCall = (method: string, url: string, body?: any) => {
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining(url),
    expect.objectContaining({
      method: method.toUpperCase(),
      ...(body && { body: JSON.stringify(body) }),
    }),
  );
};

// Re-export testing library utilities
export * from "@testing-library/react";
export { userEvent } from "@testing-library/user-event";
export { vi } from "vitest";
