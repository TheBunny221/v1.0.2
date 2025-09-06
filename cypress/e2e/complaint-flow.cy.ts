describe("Complaint Management Flow", () => {
  beforeEach(() => {
    // Login as citizen
    cy.visit("/login");
    cy.get('input[type="email"]').type(Cypress.env("CITIZEN_EMAIL"));
    cy.get('input[type="password"]').type(Cypress.env("CITIZEN_PASSWORD"));
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/dashboard");
  });

  it("should display home page with complaint form", () => {
    cy.visit("/");
    cy.contains("Register Complaint").should("be.visible");
    cy.get('[data-testid="complaint-form"]').should("exist");
  });

  it("should submit a complaint successfully", () => {
    cy.visit("/");
    cy.contains("Register Complaint").click();

    // Fill out complaint form
    cy.get('select[name="problemType"]').select("Water Supply");
    cy.get('input[name="area"]').type("Test Area");
    cy.get('textarea[name="description"]').type(
      "Test complaint description for water supply issue",
    );
    cy.get('input[name="address"]').type("123 Test Street, Test City");

    // Submit the form
    cy.get('button[type="submit"]').click();

    // Should show success message
    cy.contains("Complaint Submitted").should("be.visible");
    cy.contains("Complaint registered successfully").should("be.visible");
  });

  it("should validate required fields", () => {
    cy.visit("/");
    cy.contains("Register Complaint").click();

    // Try to submit without filling required fields
    cy.get('button[type="submit"]').click();

    // Should show validation errors
    cy.contains("This field is required").should("be.visible");
  });

  it("should display user complaints in dashboard", () => {
    cy.visit("/dashboard");
    cy.contains("My Complaints").should("be.visible");
    cy.get('[data-testid="complaints-list"]').should("exist");
  });

  it("should allow viewing complaint details", () => {
    cy.visit("/dashboard");

    // Click on first complaint (if exists)
    cy.get('[data-testid="complaint-item"]').first().click();

    // Should navigate to complaint details
    cy.url().should("include", "/complaints/");
    cy.contains("Complaint Details").should("be.visible");
  });

  it("should allow updating complaint status (for citizens)", () => {
    cy.visit("/dashboard");

    // Find a complaint that can be updated
    cy.get('[data-testid="complaint-item"]')
      .contains("REGISTERED")
      .parent()
      .within(() => {
        cy.get('[data-testid="edit-complaint"]').click();
      });

    // Update description
    cy.get('textarea[name="description"]').clear();
    cy.get('textarea[name="description"]').type(
      "Updated complaint description",
    );

    cy.get("button").contains("Update").click();

    // Should show success message
    cy.contains("Complaint updated successfully").should("be.visible");
  });
});

describe("Guest Complaint Flow", () => {
  it("should allow guest to submit complaint", () => {
    cy.visit("/");

    cy.contains("Register Complaint").click();

    // Fill out guest complaint form
    cy.get('input[name="mobile"]').type("+91-9876543210");
    cy.get('input[name="email"]').type("guest@example.com");
    cy.get('select[name="problemType"]').select("Electricity");
    cy.get('input[name="area"]').type("Guest Area");
    cy.get('textarea[name="description"]').type(
      "Guest complaint about electricity issue",
    );
    cy.get('input[name="address"]').type("456 Guest Street");

    // Submit complaint
    cy.get('button[type="submit"]').click();

    // Should show OTP verification step
    cy.contains("OTP Verification").should("be.visible");
    cy.get('input[name="otp"]').should("be.visible");
  });

  it("should allow guest to track complaint", () => {
    cy.visit("/guest/track");

    cy.get('input[name="complaintId"]').type("TEST-COMPLAINT-ID");
    cy.get('input[name="email"]').type("guest@example.com");
    cy.get("button").contains("Track Complaint").click();

    // Should show tracking information or error message
    cy.get('[data-testid="tracking-result"]').should("exist");
  });
});

describe("Admin Complaint Management", () => {
  beforeEach(() => {
    // Login as admin
    cy.visit("/login");
    cy.get('input[type="email"]').type(Cypress.env("ADMIN_EMAIL"));
    cy.get('input[type="password"]').type(Cypress.env("ADMIN_PASSWORD"));
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/dashboard");
  });

  it("should display all complaints for admin", () => {
    cy.visit("/admin/complaints");
    cy.contains("All Complaints").should("be.visible");
    cy.get('[data-testid="complaints-table"]').should("exist");
  });

  it("should allow admin to assign complaints", () => {
    cy.visit("/admin/complaints");

    // Find an unassigned complaint
    cy.get('[data-testid="complaint-row"]')
      .contains("REGISTERED")
      .parent()
      .within(() => {
        cy.get('[data-testid="assign-complaint"]').click();
      });

    // Select assignee
    cy.get('select[name="assignedTo"]').select("Maintenance Team");
    cy.get("button").contains("Assign").click();

    // Should show success message
    cy.contains("Complaint assigned successfully").should("be.visible");
  });

  it("should allow admin to update complaint status", () => {
    cy.visit("/admin/complaints");

    // Find a complaint to update
    cy.get('[data-testid="complaint-row"]')
      .first()
      .within(() => {
        cy.get('[data-testid="update-status"]').click();
      });

    // Update status
    cy.get('select[name="status"]').select("IN_PROGRESS");
    cy.get('textarea[name="notes"]').type("Working on this complaint");
    cy.get("button").contains("Update").click();

    // Should show success message
    cy.contains("Status updated successfully").should("be.visible");
  });
});
