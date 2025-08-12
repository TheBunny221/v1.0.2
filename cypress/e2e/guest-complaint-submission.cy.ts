// E2E test for guest complaint submission flow

describe("Guest Complaint Submission Flow", () => {
  beforeEach(() => {
    // Visit the guest complaint form
    cy.visit("/guest/complaint");

    // Mock geolocation
    cy.window().then((win) => {
      cy.stub(win.navigator.geolocation, "getCurrentPosition").callsFake(
        (callback) => {
          callback({
            coords: {
              latitude: 9.9312,
              longitude: 76.2673,
            },
          });
        },
      );
    });
  });

  it("should complete the full complaint submission flow", () => {
    // Step 1: Fill personal details and complaint information
    cy.get('[data-testid="step-indicator"]').should("contain", "Details");

    // Fill personal information
    cy.get('input[name="fullName"]').type("John Doe");
    cy.get('input[name="email"]').type("john.doe@example.com");
    cy.get('input[name="phoneNumber"]').type("+1234567890");

    // Select complaint type
    cy.get('[data-testid="complaint-type-select"]').click();
    cy.get('[data-value="WATER_SUPPLY"]').click();

    // Fill description
    cy.get('textarea[name="description"]').type(
      "There is a major water supply issue in our area. The water pressure is very low and sometimes there is no water at all. This has been ongoing for the past week and is affecting multiple households in the neighborhood.",
    );

    // Proceed to next step
    cy.get("button").contains("Next").click();

    // Step 2: Fill location details
    cy.get('[data-testid="step-indicator"]').should("contain", "Location");

    // Select ward
    cy.get('[data-testid="ward-select"]').click();
    cy.get('[data-value="ward-1"]').click();

    // Select sub-zone (should be enabled after ward selection)
    cy.get('[data-testid="subzone-select"]').should("not.be.disabled");
    cy.get('[data-testid="subzone-select"]').click();
    cy.get('[data-value="sz-1"]').click();

    // Fill area
    cy.get('input[name="area"]').type("Fort Kochi Beach Area");

    // Fill optional fields
    cy.get('input[name="landmark"]').type("Near the Chinese Fishing Nets");
    cy.get('input[name="address"]').type("123 Beach Road, Fort Kochi");

    // Verify location detection message
    cy.get('[data-testid="location-detected"]').should("be.visible");

    // Proceed to next step
    cy.get("button").contains("Next").click();

    // Step 3: Upload attachments (optional)
    cy.get('[data-testid="step-indicator"]').should("contain", "Attachments");

    // Upload test images
    const fileName1 = "test-image-1.jpg";
    const fileName2 = "test-image-2.png";

    // Create test files
    cy.fixture("images/sample1.jpg", "base64").then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(fileContent, "image/jpeg");
      const file = new File([blob], fileName1, { type: "image/jpeg" });

      cy.get('input[type="file"]').selectFile([file], { force: true });
    });

    // Verify file preview appears
    cy.get('[data-testid="attachment-preview"]').should("have.length", 1);

    // Test file removal
    cy.get('[data-testid="remove-attachment-0"]').click();
    cy.get('[data-testid="attachment-preview"]').should("have.length", 0);

    // Upload files again for the test
    cy.fixture("images/sample1.jpg", "base64").then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(fileContent, "image/jpeg");
      const file = new File([blob], fileName1, { type: "image/jpeg" });

      cy.get('input[type="file"]').selectFile([file], { force: true });
    });

    // Proceed to review step
    cy.get("button").contains("Next").click();

    // Step 4: Review all information
    cy.get('[data-testid="step-indicator"]').should("contain", "Review");

    // Verify personal information is displayed
    cy.get('[data-testid="review-personal-info"]').within(() => {
      cy.contains("John Doe");
      cy.contains("john.doe@example.com");
      cy.contains("+1234567890");
    });

    // Verify complaint details
    cy.get('[data-testid="review-complaint-details"]').within(() => {
      cy.contains("Water Supply");
      cy.contains("Medium"); // Default priority
      cy.contains("There is a major water supply issue");
    });

    // Verify location information
    cy.get('[data-testid="review-location"]').within(() => {
      cy.contains("Fort Kochi");
      cy.contains("Fort Kochi Beach");
      cy.contains("Fort Kochi Beach Area");
      cy.contains("Near the Chinese Fishing Nets");
    });

    // Verify attachments
    cy.get('[data-testid="review-attachments"]').within(() => {
      cy.contains("1"); // Attachment count
    });

    // Mock the API response for complaint submission
    cy.intercept("POST", "/api/guest/complaint-with-attachments", {
      statusCode: 201,
      body: {
        success: true,
        message: "Complaint registered successfully",
        data: {
          complaintId: "CSC123456789",
          email: "john.doe@example.com",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          sessionId: "session123",
          attachmentCount: 1,
        },
      },
    }).as("submitComplaint");

    // Submit the complaint
    cy.get("button").contains("Submit Complaint").click();

    // Wait for API call
    cy.wait("@submitComplaint");

    // Should redirect to OTP verification step
    cy.get('[data-testid="otp-verification"]').should("be.visible");
    cy.contains("Verify Your Email");
    cy.contains("john.doe@example.com");
    cy.contains("CSC123456789");

    // Fill OTP code
    cy.get('input[name="otpCode"]').type("123456");

    // Mock OTP verification API
    cy.intercept("POST", "/api/guest/verify-otp", {
      statusCode: 200,
      body: {
        success: true,
        message: "OTP verified successfully",
        data: {
          user: {
            id: "user123",
            fullName: "John Doe",
            email: "john.doe@example.com",
            role: "CITIZEN",
          },
          token: "jwt-token-123",
          complaint: {
            id: "CSC123456789",
            status: "REGISTERED",
          },
          isNewUser: true,
        },
      },
    }).as("verifyOTP");

    // Submit OTP
    cy.get("button").contains("Verify & Complete Registration").click();

    // Wait for verification
    cy.wait("@verifyOTP");

    // Should show success page
    cy.get('[data-testid="success-page"]').should("be.visible");
    cy.contains("Welcome to Cochin Smart City!");
    cy.contains("CSC123456789");

    // Test navigation options
    cy.get("button").contains("Go to Dashboard").should("be.visible");
    cy.get("button").contains("Submit Another Complaint").should("be.visible");
  });

  it("should validate form fields and show error messages", () => {
    // Try to proceed without filling required fields
    cy.get("button").contains("Next").click();

    // Should show validation errors
    cy.contains("Full name is required");
    cy.contains("Email is required");
    cy.contains("Phone number is required");
    cy.contains("Complaint type is required");
    cy.contains("Description is required");
  });

  it("should validate email format", () => {
    cy.get('input[name="email"]').type("invalid-email");
    cy.get("button").contains("Next").click();

    cy.contains("Please enter a valid email address");
  });

  it("should validate phone number format", () => {
    cy.get('input[name="phoneNumber"]').type("123");
    cy.get("button").contains("Next").click();

    cy.contains("Please enter a valid phone number");
  });

  it("should validate description length", () => {
    // Too short description
    cy.get('textarea[name="description"]').type("Short");
    cy.get("button").contains("Next").click();

    cy.contains("Description must be at least 10 characters");

    // Clear and try too long description
    cy.get('textarea[name="description"]').clear();
    cy.get('textarea[name="description"]').type("A".repeat(2001));
    cy.get("button").contains("Next").click();

    cy.contains("Description cannot exceed 2000 characters");
  });

  it("should validate file uploads", () => {
    // Navigate to attachments step
    cy.get('input[name="fullName"]').type("John Doe");
    cy.get('input[name="email"]').type("john@example.com");
    cy.get('input[name="phoneNumber"]').type("+1234567890");
    cy.get('[data-testid="complaint-type-select"]').click();
    cy.get('[data-value="WATER_SUPPLY"]').click();
    cy.get('textarea[name="description"]').type("Valid description here.");
    cy.get("button").contains("Next").click();

    // Fill location
    cy.get('[data-testid="ward-select"]').click();
    cy.get('[data-value="ward-1"]').click();
    cy.get('[data-testid="subzone-select"]').click();
    cy.get('[data-value="sz-1"]').click();
    cy.get('input[name="area"]').type("Test Area");
    cy.get("button").contains("Next").click();

    // Test invalid file type
    cy.fixture("documents/sample.pdf", "base64").then((fileContent) => {
      const blob = Cypress.Blob.base64StringToBlob(
        fileContent,
        "application/pdf",
      );
      const file = new File([blob], "document.pdf", {
        type: "application/pdf",
      });

      cy.get('input[type="file"]').selectFile([file], { force: true });
    });

    // Should show error message
    cy.contains("must be JPG or PNG format");
  });

  it("should preserve form data across page refreshes", () => {
    // Fill some form data
    cy.get('input[name="fullName"]').type("John Doe");
    cy.get('input[name="email"]').type("john@example.com");

    // Refresh the page
    cy.reload();

    // Data should be preserved
    cy.get('input[name="fullName"]').should("have.value", "John Doe");
    cy.get('input[name="email"]').should("have.value", "john@example.com");
  });

  it("should handle API errors gracefully", () => {
    // Fill valid form data
    cy.get('input[name="fullName"]').type("John Doe");
    cy.get('input[name="email"]').type("john@example.com");
    cy.get('input[name="phoneNumber"]').type("+1234567890");
    cy.get('[data-testid="complaint-type-select"]').click();
    cy.get('[data-value="WATER_SUPPLY"]').click();
    cy.get('textarea[name="description"]').type("Valid description here.");
    cy.get("button").contains("Next").click();

    cy.get('[data-testid="ward-select"]').click();
    cy.get('[data-value="ward-1"]').click();
    cy.get('[data-testid="subzone-select"]').click();
    cy.get('[data-value="sz-1"]').click();
    cy.get('input[name="area"]').type("Test Area");
    cy.get("button").contains("Next").click();
    cy.get("button").contains("Next").click(); // Skip attachments

    // Mock API error
    cy.intercept("POST", "/api/guest/complaint", {
      statusCode: 500,
      body: {
        success: false,
        message: "Server error occurred",
      },
    }).as("submitComplaintError");

    cy.get("button").contains("Submit Complaint").click();
    cy.wait("@submitComplaintError");

    // Should show error message
    cy.contains("Server error occurred");
  });

  it("should support keyboard navigation", () => {
    // Test tab navigation through form fields
    cy.get('input[name="fullName"]').focus();
    cy.focused().should("have.attr", "name", "fullName");

    cy.tab();
    cy.focused().should("have.attr", "name", "email");

    cy.tab();
    cy.focused().should("have.attr", "name", "phoneNumber");
  });

  it("should handle OTP resend functionality", () => {
    // Mock initial submission
    cy.intercept("POST", "/api/guest/complaint", {
      statusCode: 201,
      body: {
        success: true,
        data: {
          complaintId: "CSC123456789",
          email: "john@example.com",
          expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
          sessionId: "session123",
        },
      },
    });

    // Navigate to OTP step (simplified for this test)
    cy.window().then((win) => {
      win.localStorage.setItem("otpStep", "true");
    });

    cy.visit("/guest/complaint?step=otp");

    // Mock resend OTP API
    cy.intercept("POST", "/api/guest/resend-otp", {
      statusCode: 200,
      body: {
        success: true,
        message: "New OTP sent",
        data: {
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
      },
    }).as("resendOTP");

    // Click resend OTP button
    cy.get("button").contains("Resend OTP").click();
    cy.wait("@resendOTP");

    // Should show success message
    cy.contains("New OTP sent");
  });
});
