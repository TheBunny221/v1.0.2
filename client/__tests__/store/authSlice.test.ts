import { configureStore } from "@reduxjs/toolkit";
import {
  authSlice,
  login,
  logout,
  setUser,
} from "../../store/slices/authSlice";

describe("authSlice", () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authSlice.reducer,
      },
    });
  });

  test("should return the initial state", () => {
    const state = store.getState().auth;
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
    expect(state.token).toBe(null);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe(null);
  });

  test("should handle setUser", () => {
    const mockUser = {
      id: "1",
      email: "test@example.com",
      fullName: "Test User",
      role: "CITIZEN" as const,
      phoneNumber: "+91-9876543210",
      isActive: true,
    };

    store.dispatch(setUser(mockUser));
    const state = store.getState().auth;

    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  test("should handle logout", () => {
    // First set a user
    const mockUser = {
      id: "1",
      email: "test@example.com",
      fullName: "Test User",
      role: "CITIZEN" as const,
      phoneNumber: "+91-9876543210",
      isActive: true,
    };

    store.dispatch(setUser(mockUser));

    // Then logout
    store.dispatch(logout());
    const state = store.getState().auth;

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
    expect(state.token).toBe(null);
  });

  test("should handle login pending state", () => {
    store.dispatch(
      login.pending("requestId", {
        email: "test@example.com",
        password: "password",
      }),
    );
    const state = store.getState().auth;

    expect(state.isLoading).toBe(true);
    expect(state.error).toBe(null);
  });

  test("should handle login fulfilled state", () => {
    const mockResponse = {
      user: {
        id: "1",
        email: "test@example.com",
        fullName: "Test User",
        role: "CITIZEN" as const,
        phoneNumber: "+91-9876543210",
        isActive: true,
      },
      token: "mock-jwt-token",
    };

    store.dispatch(
      login.fulfilled(mockResponse, "requestId", {
        email: "test@example.com",
        password: "password",
      }),
    );
    const state = store.getState().auth;

    expect(state.isLoading).toBe(false);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockResponse.user);
    expect(state.token).toBe(mockResponse.token);
    expect(state.error).toBe(null);
  });

  test("should handle login rejected state", () => {
    const errorMessage = "Invalid credentials";

    store.dispatch(
      login.rejected(new Error(errorMessage), "requestId", {
        email: "test@example.com",
        password: "wrong-password",
      }),
    );
    const state = store.getState().auth;

    expect(state.isLoading).toBe(false);
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe(errorMessage);
  });
});
