describe("Authentication Flow", () => {
  beforeEach(() => {
    cy.visit("/login");
  });

  it("should display login page correctly", () => {
    cy.get('[data-testid="login-form"]').should("be.visible");
    cy.get('input[type="email"]').should("be.visible");
    cy.get('input[type="password"]').should("be.visible");
    cy.get('button[type="submit"]').should("contain", "Login");
  });

  it("should show demo credentials", () => {
    cy.contains("Demo Credentials").should("be.visible");
    cy.contains("admin@cochinsmartcity.gov.in").should("be.visible");
    cy.contains("citizen@example.com").should("be.visible");
  });

  it("should validate email field", () => {
    cy.get('button[type="submit"]').click();
    cy.contains("Please enter a valid email").should("be.visible");
  });

  it("should validate password field", () => {
    cy.get('input[type="email"]').type("test@example.com");
    cy.get('button[type="submit"]').click();
    cy.contains("Password is required").should("be.visible");
  });

  it("should successfully login as admin", () => {
    cy.get('input[type="email"]').type(Cypress.env("ADMIN_EMAIL"));
    cy.get('input[type="password"]').type(Cypress.env("ADMIN_PASSWORD"));
    cy.get('button[type="submit"]').click();

    // Should redirect to dashboard
    cy.url().should("include", "/dashboard");
    cy.contains("Administrator Dashboard").should("be.visible");
  });

  it("should successfully login as citizen", () => {
    cy.get('input[type="email"]').type(Cypress.env("CITIZEN_EMAIL"));
    cy.get('input[type="password"]').type(Cypress.env("CITIZEN_PASSWORD"));
    cy.get('button[type="submit"]').click();

    // Should redirect to dashboard
    cy.url().should("include", "/dashboard");
    cy.contains("Citizen Dashboard").should("be.visible");
  });

  it("should show error for invalid credentials", () => {
    cy.get('input[type="email"]').type("invalid@example.com");
    cy.get('input[type="password"]').type("wrongpassword");
    cy.get('button[type="submit"]').click();

    cy.contains("Invalid credentials").should("be.visible");
  });

  it("should allow logout", () => {
    // Login first
    cy.get('input[type="email"]').type(Cypress.env("CITIZEN_EMAIL"));
    cy.get('input[type="password"]').type(Cypress.env("CITIZEN_PASSWORD"));
    cy.get('button[type="submit"]').click();

    // Wait for dashboard to load
    cy.url().should("include", "/dashboard");

    // Logout
    cy.get('[data-testid="user-menu"]').click();
    cy.get('[data-testid="logout-button"]').click();

    // Should redirect to login
    cy.url().should("include", "/login");
  });

  it("should switch between login methods", () => {
    cy.contains("Login with OTP").click();
    cy.contains("We will send an OTP").should("be.visible");

    cy.contains("Login with Password").click();
    cy.get('input[type="password"]').should("be.visible");
  });
});
