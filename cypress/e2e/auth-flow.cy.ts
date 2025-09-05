describe("Authentication Flow", () => {
  beforeEach(() => {
    // Reset database state
    cy.task("db:seed");

    // Clear any stored tokens
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe("Login Flow", () => {
    it("allows user to login with valid credentials", () => {
      cy.visit("/login");

      // Check that we're on the login page
      cy.get('[data-testid="login-form"]').should("be.visible");
      cy.get("h1").should("contain", "Login");

      // Fill in login form
      cy.get('[data-testid="email-input"]')
        .type("citizen@example.com")
        .should("have.value", "citizen@example.com");

      cy.get('[data-testid="password-input"]')
        .type("password123")
        .should("have.value", "password123");

      // Submit form
      cy.get('[data-testid="login-submit"]').click();

      // Should redirect to dashboard after successful login
      cy.url().should("include", "/dashboard");
      cy.get('[data-testid="user-menu"]').should("be.visible");
      cy.get('[data-testid="user-name"]').should("contain", "Test Citizen");
    });

    it("shows error for invalid credentials", () => {
      cy.visit("/login");

      cy.get('[data-testid="email-input"]').type("invalid@example.com");
      cy.get('[data-testid="password-input"]').type("wrongpassword");
      cy.get('[data-testid="login-submit"]').click();

      // Should show error message
      cy.get('[data-testid="error-message"]')
        .should("be.visible")
        .and("contain", "Invalid credentials");

      // Should stay on login page
      cy.url().should("include", "/login");
    });

    it("validates required fields", () => {
      cy.visit("/login");

      // Try to submit without filling fields
      cy.get('[data-testid="login-submit"]').click();

      // Should show validation errors
      cy.get('[data-testid="email-error"]')
        .should("be.visible")
        .and("contain", "Email is required");

      cy.get('[data-testid="password-error"]')
        .should("be.visible")
        .and("contain", "Password is required");
    });

    it("allows login with OTP", () => {
      cy.visit("/login");

      // Switch to OTP tab
      cy.get('[data-testid="otp-tab"]').click();

      // Enter email for OTP
      cy.get('[data-testid="otp-email-input"]').type("citizen@example.com");
      cy.get('[data-testid="request-otp-button"]').click();

      // Should show OTP input
      cy.get('[data-testid="otp-code-input"]').should("be.visible");
      cy.get('[data-testid="otp-message"]').should(
        "contain",
        "OTP sent to your email",
      );

      // Enter OTP (in tests, we can use a known test OTP)
      cy.get('[data-testid="otp-code-input"]').type("123456");
      cy.get('[data-testid="verify-otp-button"]').click();

      // Should redirect to dashboard
      cy.url().should("include", "/dashboard");
    });
  });

  describe("Registration Flow", () => {
    it("allows new user registration", () => {
      cy.visit("/register");

      // Fill registration form
      cy.get('[data-testid="fullname-input"]').type("New User");
      cy.get('[data-testid="email-input"]').type("newuser@example.com");
      cy.get('[data-testid="phone-input"]').type("+1234567890");
      cy.get('[data-testid="password-input"]').type("Password123!");
      cy.get('[data-testid="confirm-password-input"]').type("Password123!");

      // Submit registration
      cy.get('[data-testid="register-submit"]').click();

      // Should show success message or redirect to OTP verification
      cy.get('[data-testid="success-message"]')
        .should("be.visible")
        .and("contain", "Registration successful");
    });

    it("validates password requirements", () => {
      cy.visit("/register");

      cy.get('[data-testid="password-input"]').type("weak");
      cy.get('[data-testid="password-input"]').blur();

      // Should show password strength indicators
      cy.get('[data-testid="password-error"]')
        .should("be.visible")
        .and("contain", "Password must be at least 8 characters");
    });

    it("validates email format", () => {
      cy.visit("/register");

      cy.get('[data-testid="email-input"]').type("invalid-email");
      cy.get('[data-testid="email-input"]').blur();

      cy.get('[data-testid="email-error"]')
        .should("be.visible")
        .and("contain", "Please enter a valid email");
    });

    it("ensures password confirmation matches", () => {
      cy.visit("/register");

      cy.get('[data-testid="password-input"]').type("Password123!");
      cy.get('[data-testid="confirm-password-input"]').type("Different123!");
      cy.get('[data-testid="confirm-password-input"]').blur();

      cy.get('[data-testid="confirm-password-error"]')
        .should("be.visible")
        .and("contain", "Passwords do not match");
    });
  });

  describe("Protected Routes", () => {
    it("redirects unauthenticated users to login", () => {
      cy.visit("/dashboard");

      // Should redirect to login
      cy.url().should("include", "/login");
    });

    it("shows unauthorized page for insufficient permissions", () => {
      // Login as citizen
      cy.login("citizen@example.com", "password123");

      // Try to access admin page
      cy.visit("/admin/users");

      // Should show unauthorized page
      cy.url().should("include", "/unauthorized");
      cy.get('[data-testid="unauthorized-message"]')
        .should("be.visible")
        .and("contain", "Access Denied");
    });
  });

  describe("Logout Flow", () => {
    beforeEach(() => {
      cy.login("citizen@example.com", "password123");
    });

    it("allows user to logout", () => {
      cy.visit("/dashboard");

      // Open user menu and click logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();

      // Should redirect to home page and clear auth state
      cy.url().should("include", "/");
      cy.get('[data-testid="login-button"]').should("be.visible");
    });
  });

  describe("Session Management", () => {
    it("handles token expiration gracefully", () => {
      // Login and set expired token
      cy.login("citizen@example.com", "password123");
      cy.window().then((win) => {
        win.localStorage.setItem("token", "expired-token");
      });

      // Navigate to protected route
      cy.visit("/dashboard");

      // Should redirect to login due to expired token
      cy.url().should("include", "/login");
      cy.get('[data-testid="error-message"]').should(
        "contain",
        "Session expired",
      );
    });

    it("persists authentication across page reloads", () => {
      cy.login("citizen@example.com", "password123");
      cy.visit("/dashboard");

      // Reload page
      cy.reload();

      // Should still be authenticated
      cy.url().should("include", "/dashboard");
      cy.get('[data-testid="user-menu"]').should("be.visible");
    });
  });

  describe("Accessibility", () => {
    it("supports keyboard navigation on login form", () => {
      cy.visit("/login");

      // Test tab navigation
      cy.get("body").tab();
      cy.focused().should("have.attr", "data-testid", "email-input");

      cy.focused().tab();
      cy.focused().should("have.attr", "data-testid", "password-input");

      cy.focused().tab();
      cy.focused().should("have.attr", "data-testid", "login-submit");
    });

    it("has proper ARIA labels and roles", () => {
      cy.visit("/login");

      cy.get('[data-testid="login-form"]').should("have.attr", "role", "form");

      cy.get('[data-testid="email-input"]')
        .should("have.attr", "aria-label")
        .and("have.attr", "aria-required", "true");

      cy.get('[data-testid="password-input"]')
        .should("have.attr", "aria-label")
        .and("have.attr", "aria-required", "true");
    });
  });
});

// Custom Cypress commands for authentication
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add("login", (email: string, password: string) => {
  cy.request({
    method: "POST",
    url: "/api/auth/login",
    body: {
      email,
      password,
    },
  }).then((response) => {
    window.localStorage.setItem("token", response.body.data.token);
  });
});
