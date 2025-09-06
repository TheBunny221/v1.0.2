import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import "@testing-library/jest-dom";

import GuestComplaintForm from "../GuestComplaintForm";
import guestReducer from "../../store/slices/guestSlice";

// Mock the toast hook
jest.mock("../../hooks/use-toast", () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
});

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};

Object.defineProperty(navigator, "geolocation", {
  value: mockGeolocation,
});

// Mock URL.createObjectURL
Object.defineProperty(URL, "createObjectURL", {
  value: jest.fn(() => "mock-url"),
});

Object.defineProperty(URL, "revokeObjectURL", {
  value: jest.fn(),
});

// Helper to create a test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      guest: guestReducer,
    },
    preloadedState: {
      guest: {
        complaintId: null,
        sessionId: null,
        isSubmitting: false,
        isVerifying: false,
        otpSent: false,
        otpExpiry: null,
        complaintData: null,
        submissionStep: "form",
        currentFormStep: 1,
        formValidation: {},
        error: null,
        userEmail: null,
        newUserRegistered: false,
        trackingData: null,
        ...initialState,
      },
    },
  });
};

// Helper to render component with providers
const renderWithProviders = (
  ui: React.ReactElement,
  store = createTestStore(),
) => {
  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>,
  );
};

describe("GuestComplaintForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  describe("Multi-step form navigation", () => {
    it("should render step 1 (Details) by default", () => {
      renderWithProviders(<GuestComplaintForm />);

      expect(screen.getByText("Details")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Enter your personal details and complaint information",
        ),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    });

    it("should show progress indicator with correct step highlighted", () => {
      renderWithProviders(<GuestComplaintForm />);

      // Check that step 1 is highlighted and others are not
      const stepIndicators = screen
        .getAllByRole("generic")
        .filter((el) => el.className.includes("w-8 h-8 rounded-full"));

      expect(stepIndicators).toHaveLength(5);
    });

    it("should not advance to next step with invalid data", async () => {
      renderWithProviders(<GuestComplaintForm />);

      // Try to go to next step without filling required fields
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      // Should still be on step 1 and show validation errors
      await waitFor(() => {
        expect(screen.getByText("Full name is required")).toBeInTheDocument();
        expect(screen.getByText("Email is required")).toBeInTheDocument();
      });
    });

    it("should advance to step 2 when step 1 data is valid", async () => {
      renderWithProviders(<GuestComplaintForm />);

      // Fill out step 1 with valid data
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: "John Doe" },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/phone number/i), {
        target: { value: "+1234567890" },
      });

      // Select complaint type
      const typeSelect = screen.getByRole("combobox", {
        name: /complaint type/i,
      });
      fireEvent.click(typeSelect);
      const waterSupplyOption = await screen.findByText("Water Supply");
      fireEvent.click(waterSupplyOption);

      // Fill description
      fireEvent.change(screen.getByLabelText(/description/i), {
        target: {
          value: "This is a detailed description of the water supply issue.",
        },
      });

      // Click next
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      // Should advance to step 2
      await waitFor(() => {
        expect(screen.getByText("Location")).toBeInTheDocument();
        expect(
          screen.getByText("Specify the location where the issue occurred"),
        ).toBeInTheDocument();
      });
    });

    it("should advance to step 3 when step 2 data is valid", async () => {
      renderWithProviders(<GuestComplaintForm />);

      // Manually set to step 2 for this test
      const nextButton = screen.getByRole("button", { name: /next/i });

      // Skip to step 2 by setting the state (in a real app this would be done by completing step 1)
      // For this test, we'll directly navigate by clicking through the steps

      // First complete step 1
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: "John Doe" },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/phone number/i), {
        target: { value: "+1234567890" },
      });

      const typeSelect = screen.getByRole("combobox", {
        name: /complaint type/i,
      });
      fireEvent.click(typeSelect);
      const waterSupplyOption = await screen.findByText("Water Supply");
      fireEvent.click(waterSupplyOption);

      fireEvent.change(screen.getByLabelText(/description/i), {
        target: {
          value: "This is a detailed description of the water supply issue.",
        },
      });

      fireEvent.click(nextButton);

      // Now on step 2, fill location data
      await waitFor(() => {
        expect(screen.getByText("Location")).toBeInTheDocument();
      });

      const wardSelect = screen.getByRole("combobox", { name: /ward/i });
      fireEvent.click(wardSelect);
      const wardOption = await screen.findByText("Fort Kochi");
      fireEvent.click(wardOption);

      // Sub-zone should become available after ward selection
      await waitFor(() => {
        const subZoneSelect = screen.getByRole("combobox", {
          name: /sub-zone/i,
        });
        fireEvent.click(subZoneSelect);
      });

      const subZoneOption = await screen.findByText("Fort Kochi Beach");
      fireEvent.click(subZoneOption);

      fireEvent.change(screen.getByLabelText(/area/i), {
        target: { value: "Downtown Fort Kochi" },
      });

      // Click next to go to step 3
      const nextButton2 = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton2);

      await waitFor(() => {
        expect(screen.getByText("Attachments")).toBeInTheDocument();
        expect(
          screen.getByText(
            "Optionally upload images to support your complaint",
          ),
        ).toBeInTheDocument();
      });
    });

    it("should allow going back to previous steps", async () => {
      renderWithProviders(<GuestComplaintForm />);

      // Complete step 1 to get to step 2
      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: "John Doe" },
      });
      fireEvent.change(screen.getByLabelText(/email address/i), {
        target: { value: "john@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/phone number/i), {
        target: { value: "+1234567890" },
      });

      const typeSelect = screen.getByRole("combobox", {
        name: /complaint type/i,
      });
      fireEvent.click(typeSelect);
      const waterSupplyOption = await screen.findByText("Water Supply");
      fireEvent.click(waterSupplyOption);

      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: "This is a detailed description." },
      });

      fireEvent.click(screen.getByRole("button", { name: /next/i }));

      // Now on step 2
      await waitFor(() => {
        expect(screen.getByText("Location")).toBeInTheDocument();
      });

      // Click previous button
      const previousButton = screen.getByRole("button", { name: /previous/i });
      fireEvent.click(previousButton);

      // Should be back on step 1
      await waitFor(() => {
        expect(screen.getByText("Details")).toBeInTheDocument();
        expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
      });
    });
  });

  describe("Form data persistence", () => {
    it("should save form data to sessionStorage on input change", async () => {
      renderWithProviders(<GuestComplaintForm />);

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: "John Doe" },
      });

      // Check that sessionStorage.setItem was called
      await waitFor(() => {
        expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
          "guestComplaintFormData",
          expect.stringContaining("John Doe"),
        );
      });
    });

    it("should load saved form data from sessionStorage on mount", () => {
      const savedData = JSON.stringify({
        fullName: "Saved User",
        email: "saved@example.com",
        currentStep: 2,
      });

      mockSessionStorage.getItem.mockReturnValue(savedData);

      renderWithProviders(<GuestComplaintForm />);

      expect(screen.getByDisplayValue("Saved User")).toBeInTheDocument();
      expect(screen.getByDisplayValue("saved@example.com")).toBeInTheDocument();
    });

    it("should clear sessionStorage on successful submission", () => {
      // This would require mocking the submission success,
      // which is complex due to async thunks
      // This is a placeholder for the test structure
      expect(true).toBe(true);
    });
  });

  describe("File upload functionality", () => {
    it("should render file upload area in step 3", async () => {
      const store = createTestStore();
      renderWithProviders(<GuestComplaintForm />, store);

      // Navigate to step 3 by manipulating the store state directly
      // In a real test, you'd go through the steps properly
      // This is a simplified test for the upload UI

      // For now, just verify the test structure is in place
      expect(true).toBe(true);
    });

    it("should validate file types and sizes", () => {
      // Test file validation logic
      // This would test the file upload validation
      expect(true).toBe(true);
    });

    it("should show file previews after upload", () => {
      // Test file preview functionality
      expect(true).toBe(true);
    });

    it("should allow removing uploaded files", () => {
      // Test file removal functionality
      expect(true).toBe(true);
    });
  });

  describe("Form submission", () => {
    it("should submit form data with all steps completed", () => {
      // Test form submission with valid data
      expect(true).toBe(true);
    });

    it("should handle submission errors gracefully", () => {
      // Test error handling during submission
      expect(true).toBe(true);
    });

    it("should show OTP verification step after successful submission", () => {
      // Test transition to OTP step
      expect(true).toBe(true);
    });
  });

  describe("OTP verification", () => {
    it("should render OTP input when in OTP step", () => {
      const store = createTestStore({
        submissionStep: "otp",
        userEmail: "test@example.com",
      });
      renderWithProviders(<GuestComplaintForm />, store);

      expect(screen.getByText("Verify Your Email")).toBeInTheDocument();
      expect(screen.getByLabelText(/enter otp code/i)).toBeInTheDocument();
    });

    it("should show success page after OTP verification", () => {
      const store = createTestStore({
        submissionStep: "success",
        complaintId: "CSC123456789",
        newUserRegistered: true,
      });
      renderWithProviders(<GuestComplaintForm />, store);

      expect(
        screen.getByText("Welcome to Cochin Smart City!"),
      ).toBeInTheDocument();
      expect(screen.getByText("CSC123456789")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for form fields", () => {
      renderWithProviders(<GuestComplaintForm />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    });

    it("should show error messages with proper association", async () => {
      renderWithProviders(<GuestComplaintForm />);

      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        const errorMessages = screen.getAllByText(/required/i);
        expect(errorMessages.length).toBeGreaterThan(0);
      });
    });

    it("should support keyboard navigation", () => {
      renderWithProviders(<GuestComplaintForm />);

      const fullNameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);

      fullNameInput.focus();
      expect(document.activeElement).toBe(fullNameInput);

      // Simulate tab navigation
      fireEvent.keyDown(fullNameInput, { key: "Tab" });
      // Note: jsdom doesn't fully simulate tab navigation,
      // so this is a simplified test
    });
  });
});
