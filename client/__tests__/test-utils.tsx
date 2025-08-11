import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { authSlice } from '../store/slices/authSlice';
import { languageSlice } from '../store/slices/languageSlice';
import { complaintsSlice } from '../store/slices/complaintsSlice';
import { uiSlice } from '../store/slices/uiSlice';
import { guestSlice } from '../store/slices/guestSlice';
import { dataSlice } from '../store/slices/dataSlice';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: any;
  store?: any;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    store = configureStore({
      reducer: {
        auth: authSlice.reducer,
        language: languageSlice.reducer,
        complaints: complaintsSlice.reducer,
        ui: uiSlice.reducer,
        guest: guestSlice.reducer,
        data: dataSlice.reducer,
      },
      preloadedState,
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children?: React.ReactNode }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export * from '@testing-library/react';
export { renderWithProviders as render };

// Mock user object for testing
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  fullName: 'Test User',
  role: 'CITIZEN' as const,
  phoneNumber: '+91-9876543210',
  isActive: true,
  wardId: 'ward-1',
};

// Mock complaint object for testing
export const mockComplaint = {
  id: 'complaint-1',
  description: 'Test complaint description',
  type: 'WATER_SUPPLY',
  status: 'REGISTERED',
  priority: 'MEDIUM',
  area: 'Test Area',
  address: 'Test Address',
  contactName: 'Test Contact',
  contactEmail: 'contact@test.com',
  contactPhone: '+91-9876543210',
  submittedById: '1',
  wardId: 'ward-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock translations for testing
export const mockTranslations = {
  common: {
    submit: 'Submit',
    cancel: 'Cancel',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  nav: {
    home: 'Home',
    dashboard: 'Dashboard',
    complaints: 'Complaints',
    login: 'Login',
    logout: 'Logout',
  },
  auth: {
    login: 'Login',
    email: 'Email',
    password: 'Password',
    role: 'Role',
  },
  complaints: {
    registerComplaint: 'Register Complaint',
    myComplaints: 'My Complaints',
    status: 'Status',
    priority: 'Priority',
    description: 'Description',
    types: {
      Water_Supply: 'Water Supply',
      Electricity: 'Electricity',
      Road_Repair: 'Road Repair',
      Garbage_Collection: 'Garbage Collection',
    },
  },
  forms: {
    complaintSubmitted: 'Complaint Submitted',
    requiredField: 'This field is required',
    invalidEmail: 'Please enter a valid email',
  },
};
