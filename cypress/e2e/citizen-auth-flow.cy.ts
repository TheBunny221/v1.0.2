// E2E test for citizen authentication and dashboard flow

describe("Citizen Authentication & Dashboard Flow", () => {
  beforeEach(() => {
    // Visit the homepage
    cy.visit("/");
  });

  it("should allow citizen to login with password and access dashboard", () => {
    // Navigate to login page
    cy.contains("Login").click();
    cy.url().should("include", "/login");

    // Use password login tab (should be default)
    cy.get('[data-testid="password-tab"]').should("be.visible");

    // Fill in citizen credentials
    cy.get('input[name="email"]').type("citizen@example.com");
    cy.get('input[name="password"]').type("citizen123");

    // Submit login form
    cy.get('button[type="submit"]').contains("Sign In").click();

    // Should redirect to dashboard
    cy.url().should("include", "/dashboard");
    cy.contains("Welcome back").should("be.visible");

    // Should see citizen dashboard elements
    cy.contains("Total Complaints").should("be.visible");
    cy.contains("My Complaints").should("be.visible");
    cy.contains("New Complaint").should("be.visible");
  });

  it("should allow citizen to login with OTP", () => {
    // Navigate to login page
    cy.contains("Login").click();

    // Switch to OTP tab
    cy.contains("OTP").click();

    // Enter email
    cy.get('input[name="email"]').type("citizen@example.com");

    // Mock OTP API call
    cy.intercept("POST", "/api/auth/login-otp", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          email: "citizen@example.com",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        },
      },
    }).as("requestOTP");

    // Request OTP
    cy.contains("Send OTP").click();
    cy.wait("@requestOTP");

    // Should show OTP input
    cy.contains("OTP Sent").should("be.visible");
    cy.get('input[name="otpCode"]').should("be.visible");

    // Mock OTP verification
    cy.intercept("POST", "/api/auth/verify-otp", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: "user123",
            fullName: "Test Citizen",
            email: "citizen@example.com",
            role: "CITIZEN",
          },
          token: "jwt-token-123",
        },
      },
    }).as("verifyOTP");

    // Enter OTP and verify
    cy.get('input[name="otpCode"]').type("123456");
    cy.contains("Verify OTP").click();
    cy.wait("@verifyOTP");

    // Should redirect to dashboard
    cy.url().should("include", "/dashboard");
    cy.contains("Welcome back, Test Citizen").should("be.visible");
  });

  it("should allow citizen to create a new complaint", () => {
    // Login first
    cy.visit("/login");
    cy.get('input[name="email"]').type("citizen@example.com");
    cy.get('input[name="password"]').type("citizen123");
    cy.get('button[type="submit"]').contains("Sign In").click();
    cy.url().should("include", "/dashboard");

    // Navigate to create complaint
    cy.contains("New Complaint").click();
    cy.url().should("include", "/complaints/create");

    // Should see multi-step form
    cy.contains("Create Complaint").should("be.visible");
    cy.contains("Details").should("be.visible");
    cy.get('[data-testid="step-indicator"]').should("be.visible");

    // Fill step 1 - Details
    cy.get('input[name="title"]').type("Water Supply Issue");

    // Select complaint type
    cy.get('[data-testid="complaint-type-select"]').click();
    cy.get('[data-value="WATER_SUPPLY"]').click();

    // Fill description
    cy.get('textarea[name="description"]').type(
      "There is no water supply in our area for the past 3 days. Please address this urgently.",
    );

    // Proceed to next step
    cy.contains("Next").click();

    // Step 2 - Location
    cy.contains("Location Information").should("be.visible");

    // Select ward
    cy.get('[data-testid="ward-select"]').click();
    cy.get('[data-value="ward-1"]').click();

    // Select sub-zone (should be enabled after ward selection)
    cy.get('[data-testid="subzone-select"]').should("not.be.disabled");
    cy.get('[data-testid="subzone-select"]').click();
    cy.get('[data-value="sz-1"]').click();

    // Fill area
    cy.get('input[name="area"]').type("Fort Kochi Beach Area");

    // Proceed to next step
    cy.contains("Next").click();

    // Step 3 - Attachments (skip)
    cy.contains("Attachments").should("be.visible");
    cy.contains("Next").click();

    // Step 4 - Review
    cy.contains("Review Your Complaint").should("be.visible");
    cy.contains("Water Supply Issue").should("be.visible");
    cy.contains("Water Supply").should("be.visible");
    cy.contains("Fort Kochi").should("be.visible");

    // Mock complaint creation
    cy.intercept("POST", "/api/complaints", {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id: "complaint123",
          title: "Water Supply Issue",
          status: "REGISTERED",
          type: "WATER_SUPPLY",
        },
      },
    }).as("createComplaint");

    // Submit complaint
    cy.contains("Submit Complaint").click();
    cy.wait("@createComplaint");

    // Should redirect to complaint details
    cy.url().should("include", "/complaints/complaint123");
  });

  it("should show citizen dashboard with complaints and stats", () => {
    // Login first
    cy.visit("/login");
    cy.get('input[name="email"]').type("citizen@example.com");
    cy.get('input[name="password"]').type("citizen123");
    cy.get('button[type="submit"]').contains("Sign In").click();

    // Mock complaints API
    cy.intercept("GET", "/api/complaints*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          complaints: [
            {
              id: "complaint1",
              title: "Water Supply Issue",
              type: "WATER_SUPPLY",
              status: "REGISTERED",
              priority: "HIGH",
              submittedOn: new Date().toISOString(),
              ward: { id: "ward-1", name: "Fort Kochi" },
            },
            {
              id: "complaint2",
              title: "Road Repair Needed",
              type: "ROAD_REPAIR",
              status: "RESOLVED",
              priority: "MEDIUM",
              submittedOn: new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              ward: { id: "ward-1", name: "Fort Kochi" },
              rating: 4,
            },
          ],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 2,
            limit: 10,
            hasNext: false,
            hasPrev: false,
          },
        },
      },
    }).as("fetchComplaints");

    cy.wait("@fetchComplaints");

    // Should see dashboard stats
    cy.contains("Total Complaints").should("be.visible");
    cy.contains("2").should("be.visible"); // Total count

    // Should see complaints table/list
    cy.contains("My Complaints").should("be.visible");
    cy.contains("Water Supply Issue").should("be.visible");
    cy.contains("Road Repair Needed").should("be.visible");

    // Should see status badges
    cy.contains("REGISTERED").should("be.visible");
    cy.contains("RESOLVED").should("be.visible");

    // Should be able to filter complaints
    cy.get('input[placeholder="Search complaints..."]').type("Water");
    cy.contains("Search complaints").should("be.visible");

    // Should see rating for resolved complaint
    cy.get('[data-testid="rating-display"]').should("be.visible");

    // Should be able to provide feedback for resolved complaint
    cy.contains("Rate").should("be.visible");
  });

  it("should handle citizen profile update", () => {
    // Login first
    cy.visit("/login");
    cy.get('input[name="email"]').type("citizen@example.com");
    cy.get('input[name="password"]').type("citizen123");
    cy.get('button[type="submit"]').contains("Sign In").click();

    // Navigate to profile
    cy.visit("/profile");
    cy.contains("Profile").should("be.visible");

    // Should see profile tabs
    cy.contains("Personal Information").should("be.visible");
    cy.contains("Security").should("be.visible");
    cy.contains("Preferences").should("be.visible");

    // Edit profile
    cy.contains("Edit Profile").click();

    // Update phone number
    cy.get('input[name="phoneNumber"]').clear().type("+91-9876543210");

    // Mock profile update
    cy.intercept("PUT", "/api/auth/profile", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          user: {
            id: "user123",
            fullName: "Test Citizen",
            email: "citizen@example.com",
            phoneNumber: "+91-9876543210",
            role: "CITIZEN",
          },
        },
      },
    }).as("updateProfile");

    // Save profile
    cy.contains("Save").click();
    cy.wait("@updateProfile");

    // Should show success message
    cy.contains("Profile updated").should("be.visible");
  });

  it("should provide feedback on resolved complaint", () => {
    // Login and setup
    cy.visit("/login");
    cy.get('input[name="email"]').type("citizen@example.com");
    cy.get('input[name="password"]').type("citizen123");
    cy.get('button[type="submit"]').contains("Sign In").click();

    // Mock a resolved complaint
    cy.intercept("GET", "/api/complaints*", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          complaints: [
            {
              id: "complaint-resolved",
              title: "Resolved Issue",
              type: "ROAD_REPAIR",
              status: "RESOLVED",
              priority: "MEDIUM",
              submittedOn: new Date().toISOString(),
              ward: { id: "ward-1", name: "Fort Kochi" },
            },
          ],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            limit: 10,
            hasNext: false,
            hasPrev: false,
          },
        },
      },
    });

    cy.visit("/dashboard");

    // Click feedback button
    cy.contains("Rate").click();

    // Should open feedback dialog
    cy.contains("Provide Feedback").should("be.visible");
    cy.contains("Rating").should("be.visible");

    // Select 5-star rating
    cy.get('[data-testid="star-5"]').click();

    // Add comment
    cy.get('textarea[placeholder*="Share your experience"]').type(
      "The issue was resolved quickly and efficiently. Great work!",
    );

    // Mock feedback submission
    cy.intercept("POST", "/api/complaints/*/feedback", {
      statusCode: 200,
      body: {
        success: true,
        data: {
          feedback: {
            rating: 5,
            comment:
              "The issue was resolved quickly and efficiently. Great work!",
          },
        },
      },
    }).as("submitFeedback");

    // Submit feedback
    cy.contains("Submit Feedback").click();
    cy.wait("@submitFeedback");

    // Should show success message
    cy.contains("Feedback Submitted").should("be.visible");
  });

  it("should handle registration flow", () => {
    // Navigate to register page
    cy.visit("/register");
    cy.contains("Register for E-Governance Portal").should("be.visible");

    // Fill registration form
    cy.get('input[name="fullName"]').type("John Doe");
    cy.get('input[name="email"]').type("john.doe@example.com");
    cy.get('input[name="phoneNumber"]').type("+91-9876543210");

    // Select ward
    cy.get('[data-testid="ward-select"]').click();
    cy.contains("Ward 1 - Central Zone").click();

    // Set password
    cy.get('input[name="password"]').type("SecurePass123");
    cy.get('input[name="confirmPassword"]').type("SecurePass123");

    // Mock registration
    cy.intercept("POST", "/api/auth/register", {
      statusCode: 201,
      body: {
        success: true,
        data: {
          user: {
            id: "newuser123",
            fullName: "John Doe",
            email: "john.doe@example.com",
            role: "CITIZEN",
          },
          token: "jwt-token-new",
        },
      },
    }).as("registerUser");

    // Submit registration
    cy.contains("Create Account").click();
    cy.wait("@registerUser");

    // Should redirect to dashboard
    cy.url().should("include", "/dashboard");
    cy.contains("Welcome back, John Doe").should("be.visible");
  });
});
