import { configureStore } from "@reduxjs/toolkit";
import authSlice, {
  loginWithPassword,
  logout,
  clearError,
} from "../../store/slices/authSlice";

describe("authSlice", () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authSlice,
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

  test("should handle clearError", () => {
    store.dispatch(clearError());
    const state = store.getState().auth;

    expect(state.error).toBe(null);
  });

  test("should handle logout fulfilled", () => {
    const action = { type: logout.fulfilled.type };
    const state = authSlice(undefined, action);

    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBe(null);
    expect(state.token).toBe(null);
  });

  test("should handle login pending state", () => {
    const action = { type: loginWithPassword.pending.type };
    const state = authSlice(undefined, action);

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
        joinedOn: new Date().toISOString(),
      },
      token: "mock-jwt-token",
    };

    const action = { type: loginWithPassword.fulfilled.type, payload: mockResponse };
    const state = authSlice(undefined, action);

    expect(state.isLoading).toBe(false);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(mockResponse.user);
    expect(state.token).toBe(mockResponse.token);
    expect(state.error).toBe(null);
  });

  test("should handle login rejected state", () => {
    const errorMessage = "Invalid credentials";
    const action = {
      type: loginWithPassword.rejected.type,
      payload: { message: errorMessage }
    };
    const state = authSlice(undefined, action);

    expect(state.isLoading).toBe(false);
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe(errorMessage);
  });
});
