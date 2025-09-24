import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authSlice, { setCredentials } from '../store/slices/authSlice';
import { authApi } from '../store/api/authApi';

// Mock user data
const mockUserWithPassword = {
  id: '1',
  fullName: 'Test User',
  email: 'test@example.com',
  role: 'CITIZEN' as const,
  isActive: true,
  joinedOn: '2024-01-01',
  hasPassword: true,
};

const mockUserWithoutPassword = {
  ...mockUserWithPassword,
  hasPassword: false,
};

const mockUserWithJsonPassword = {
  ...mockUserWithPassword,
  hasPassword: false, // Backend should set this to false for JSON passwords
};

describe('hasPassword Flow Tests', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authSlice,
        [authApi.reducerPath]: authApi.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware),
    });
  });

  describe('Redux State Management', () => {
    it('should store hasPassword flag correctly when user has password', () => {
      store.dispatch(
        setCredentials({
          token: 'test-token',
          user: mockUserWithPassword,
        })
      );

      const state = store.getState().auth;
      expect(state.user?.hasPassword).toBe(true);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should store hasPassword flag correctly when user has no password', () => {
      store.dispatch(
        setCredentials({
          token: 'test-token',
          user: mockUserWithoutPassword,
        })
      );

      const state = store.getState().auth;
      expect(state.user?.hasPassword).toBe(false);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('Password Setup Banner Logic', () => {
    it('should show banner when user has no password', () => {
      store.dispatch(
        setCredentials({
          token: 'test-token',
          user: mockUserWithoutPassword,
        })
      );

      const state = store.getState().auth;
      const shouldShowBanner = !state.user?.hasPassword;
      expect(shouldShowBanner).toBe(true);
    });

    it('should hide banner when user has password', () => {
      store.dispatch(
        setCredentials({
          token: 'test-token',
          user: mockUserWithPassword,
        })
      );

      const state = store.getState().auth;
      const shouldShowBanner = !state.user?.hasPassword;
      expect(shouldShowBanner).toBe(false);
    });
  });

  describe('Password Setup State Transition', () => {
    it('should update hasPassword to true after password setup', () => {
      // Start with user without password
      store.dispatch(
        setCredentials({
          token: 'test-token',
          user: mockUserWithoutPassword,
        })
      );

      let state = store.getState().auth;
      expect(state.user?.hasPassword).toBe(false);

      // Simulate successful password setup
      store.dispatch(
        setCredentials({
          token: 'new-token',
          user: { ...mockUserWithoutPassword, hasPassword: true },
        })
      );

      state = store.getState().auth;
      expect(state.user?.hasPassword).toBe(true);
    });
  });

  describe('JSON Password Handling', () => {
    it('should show banner for user with JSON password (reset token)', () => {
      store.dispatch(
        setCredentials({
          token: 'test-token',
          user: mockUserWithJsonPassword,
        })
      );

      const state = store.getState().auth;
      const shouldShowBanner = !state.user?.hasPassword;
      expect(shouldShowBanner).toBe(true);
      expect(state.user?.hasPassword).toBe(false);
    });

    it('should handle transition from JSON password to valid password', () => {
      // Start with user having JSON password (reset token)
      store.dispatch(
        setCredentials({
          token: 'test-token',
          user: mockUserWithJsonPassword,
        })
      );

      let state = store.getState().auth;
      expect(state.user?.hasPassword).toBe(false);

      // After password setup, backend should return hasPassword: true
      store.dispatch(
        setCredentials({
          token: 'new-token',
          user: { ...mockUserWithJsonPassword, hasPassword: true },
        })
      );

      state = store.getState().auth;
      expect(state.user?.hasPassword).toBe(true);
    });
  });

  describe('Backend Integration Simulation', () => {
    // Simulate the backend isValidPassword function
    const simulateBackendValidation = (password: string | null | undefined) => {
      if (!password || typeof password !== 'string') {
        return false;
      }
      
      try {
        JSON.parse(password);
        return false; // JSON passwords are invalid
      } catch {
        return true; // Non-JSON strings are valid
      }
    };

    it('should correctly identify valid hashed password', () => {
      const hashedPassword = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
      expect(simulateBackendValidation(hashedPassword)).toBe(true);
    });

    it('should correctly identify JSON password as invalid', () => {
      const jsonPassword = JSON.stringify({
        resetPasswordToken: 'abc123',
        resetPasswordExpire: '2024-01-01T00:00:00.000Z'
      });
      expect(simulateBackendValidation(jsonPassword)).toBe(false);
    });

    it('should correctly identify null/undefined password as invalid', () => {
      expect(simulateBackendValidation(null)).toBe(false);
      expect(simulateBackendValidation(undefined)).toBe(false);
      expect(simulateBackendValidation('')).toBe(false);
    });

    it('should create correct user response based on password type', () => {
      const createUserResponse = (password: string | null) => {
        return {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          hasPassword: simulateBackendValidation(password)
        };
      };

      // Valid password
      const userWithValidPassword = createUserResponse('$2a$10$validhash');
      expect(userWithValidPassword.hasPassword).toBe(true);

      // JSON password (reset token)
      const jsonPassword = JSON.stringify({ resetPasswordToken: 'abc123' });
      const userWithJsonPassword = createUserResponse(jsonPassword);
      expect(userWithJsonPassword.hasPassword).toBe(false);

      // No password
      const userWithNoPassword = createUserResponse(null);
      expect(userWithNoPassword.hasPassword).toBe(false);
    });
  });
});
