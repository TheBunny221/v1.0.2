import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, mockTranslations } from '../test-utils';
import Login from '../../pages/Login';

// Mock the Redux hooks
const mockDispatch = jest.fn();
const mockSelector = jest.fn();

jest.mock('../../store/hooks', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: () => mockSelector,
}));

// Mock the login action
jest.mock('../../store/slices/authSlice', () => ({
  login: jest.fn(),
  loginWithOTP: jest.fn(),
  requestPasswordSetup: jest.fn(),
}));

describe('Login Component', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    mockSelector.mockReturnValue({
      isLoading: false,
      error: null,
      otpSent: false,
      otpExpiry: null,
      translations: mockTranslations,
      currentLanguage: 'en',
    });
  });

  test('renders login form with email and password fields', () => {
    render(<Login />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('displays demo credentials', () => {
    render(<Login />);
    
    expect(screen.getByText(/demo credentials/i)).toBeInTheDocument();
    expect(screen.getByText(/admin@cochinsmartcity.gov.in/)).toBeInTheDocument();
    expect(screen.getByText(/admin123/)).toBeInTheDocument();
  });

  test('shows validation error for empty email', async () => {
    render(<Login />);
    
    const submitButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  test('switches between login methods', () => {
    render(<Login />);
    
    const otpButton = screen.getByRole('button', { name: /otp/i });
    fireEvent.click(otpButton);
    
    expect(screen.getByText(/we will send an otp/i)).toBeInTheDocument();
  });

  test('submits login form with valid credentials', async () => {
    const mockLogin = jest.fn().mockResolvedValue({ user: { id: '1' } });
    mockDispatch.mockReturnValue(mockLogin);
    
    render(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /login/i });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalled();
    });
  });

  test('displays loading state during login', () => {
    mockSelector.mockReturnValue({
      isLoading: true,
      error: null,
      otpSent: false,
      otpExpiry: null,
      translations: mockTranslations,
      currentLanguage: 'en',
    });
    
    render(<Login />);
    
    expect(screen.getByText(/logging in/i)).toBeInTheDocument();
  });

  test('displays error message on login failure', () => {
    mockSelector.mockReturnValue({
      isLoading: false,
      error: 'Invalid credentials',
      otpSent: false,
      otpExpiry: null,
      translations: mockTranslations,
      currentLanguage: 'en',
    });
    
    render(<Login />);
    
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
  });
});
