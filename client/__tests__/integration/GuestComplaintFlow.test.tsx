import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { rest } from "msw";
import { setupServer } from "msw/node";
import GuestComplaintForm from "../../pages/GuestComplaintForm";
import { store } from "../../store";
import { OtpProvider } from "../../contexts/OtpContext";

// Mock server for API calls
const server = setupServer(
  rest.post("/api/guest/complaint", (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: "Complaint registered successfully",
        data: {
          complaintId: "test-complaint-id",
          trackingNumber: "CSC123456",
          email: "test@example.com",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          sessionId: "test-session-id",
        },
      }),
    );
  }),
  rest.post("/api/guest/verify-otp", (req, res, ctx) => {
    return res(
      ctx.json({
        success: true,
        message: "OTP verified successfully",
        data: {
          user: {
            id: "test-user-id",
            fullName: "Test User",
            email: "test@example.com",
            role: "CITIZEN",
          },
          token: "test-jwt-token",
          complaint: {
            id: "test-complaint-id",
            trackingNumber: "CSC123456",
          },
          isNewUser: true,
        },
      }),
    );
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={store}>
    <BrowserRouter>
      <OtpProvider>{children}</OtpProvider>
    </BrowserRouter>
  </Provider>
);

describe("Guest Complaint Flow Integration", () => {
  it("should complete the full guest complaint submission flow", async () => {
    render(
      <TestWrapper>
        <GuestComplaintForm />
      </TestWrapper>,
    );

    // Step 1: Fill in personal details
    expect(screen.getByText("Submit a Complaint")).toBeInTheDocument();

    const fullNameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const phoneInput = screen.getByLabelText(/phone number/i);
    const typeSelect = screen.getByRole("combobox", {
      name: /complaint type/i,
    });
    const descriptionTextarea = screen.getByLabelText(/description/i);

    fireEvent.change(fullNameInput, { target: { value: "John Doe" } });
    fireEvent.change(emailInput, { target: { value: "john.doe@example.com" } });
    fireEvent.change(phoneInput, { target: { value: "+91-9876543210" } });

    // Select complaint type
    fireEvent.click(typeSelect);
    const waterSupplyOption = await screen.findByText("Water Supply");
    fireEvent.click(waterSupplyOption);

    fireEvent.change(descriptionTextarea, {
      target: {
        value:
          "No water supply in my area for the past 3 days. This is affecting daily activities.",
      },
    });

    // Go to next step
    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    // Step 2: Fill in location details
    await waitFor(() => {
      expect(screen.getByText("Location Information")).toBeInTheDocument();
    });

    const wardSelect = screen.getByRole("combobox", { name: /ward/i });
    fireEvent.click(wardSelect);
    const fortKochiOption = await screen.findByText("Fort Kochi");
    fireEvent.click(fortKochiOption);

    const areaInput = screen.getByLabelText(/area\/locality/i);
    fireEvent.change(areaInput, { target: { value: "Marine Drive Area" } });

    // Go to next step
    fireEvent.click(screen.getByText("Next"));

    // Step 3: Skip attachments
    await waitFor(() => {
      expect(screen.getByText("Upload Images (Optional)")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Next"));

    // Step 4: Review and submit
    await waitFor(() => {
      expect(screen.getByText("Review Your Complaint")).toBeInTheDocument();
    });

    // Verify review information
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
    expect(screen.getByText("Water Supply")).toBeInTheDocument();
    expect(screen.getByText("Marine Drive Area")).toBeInTheDocument();

    // Submit the complaint
    const submitButton = screen.getByText("Submit Complaint");
    fireEvent.click(submitButton);

    // Wait for submission success
    await waitFor(
      () => {
        expect(screen.getByText(/complaint submitted/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Verify tracking number is shown
    expect(screen.getByText(/CSC123456/)).toBeInTheDocument();
  });

  it("should validate required fields and show errors", async () => {
    render(
      <TestWrapper>
        <GuestComplaintForm />
      </TestWrapper>,
    );

    // Try to proceed without filling required fields
    const nextButton = screen.getByText("Next");
    fireEvent.click(nextButton);

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText("Full name is required")).toBeInTheDocument();
      expect(screen.getByText("Email is required")).toBeInTheDocument();
      expect(screen.getByText("Phone number is required")).toBeInTheDocument();
      expect(
        screen.getByText("Complaint type is required"),
      ).toBeInTheDocument();
      expect(screen.getByText("Description is required")).toBeInTheDocument();
    });
  });

  it("should handle API errors gracefully", async () => {
    // Override the server to return an error
    server.use(
      rest.post("/api/guest/complaint", (req, res, ctx) => {
        return res(
          ctx.status(400),
          ctx.json({
            success: false,
            message: "Validation failed",
            data: null,
          }),
        );
      }),
    );

    render(
      <TestWrapper>
        <GuestComplaintForm />
      </TestWrapper>,
    );

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "John Doe" },
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: "john.doe@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/phone number/i), {
      target: { value: "+91-9876543210" },
    });

    // Select complaint type and fill description
    const typeSelect = screen.getByRole("combobox", {
      name: /complaint type/i,
    });
    fireEvent.click(typeSelect);
    const waterSupplyOption = await screen.findByText("Water Supply");
    fireEvent.click(waterSupplyOption);

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Test complaint description with sufficient length" },
    });

    // Navigate through steps
    fireEvent.click(screen.getByText("Next"));

    await waitFor(() => {
      expect(screen.getByText("Location Information")).toBeInTheDocument();
    });

    // Fill location
    const wardSelect = screen.getByRole("combobox", { name: /ward/i });
    fireEvent.click(wardSelect);
    const fortKochiOption = await screen.findByText("Fort Kochi");
    fireEvent.click(fortKochiOption);

    fireEvent.change(screen.getByLabelText(/area\/locality/i), {
      target: { value: "Test Area" },
    });

    // Skip attachments and go to review
    fireEvent.click(screen.getByText("Next"));
    fireEvent.click(screen.getByText("Next"));

    // Submit and expect error
    const submitButton = screen.getByText("Submit Complaint");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/validation failed/i)).toBeInTheDocument();
    });
  });
});
