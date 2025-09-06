// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/login");
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should("include", "/dashboard");
});

Cypress.Commands.add("logout", () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should("include", "/login");
});

Cypress.Commands.add("submitComplaint", (complaintData) => {
  cy.visit("/");
  cy.contains("Register Complaint").click();

  if (complaintData.mobile) {
    cy.get('input[name="mobile"]').type(complaintData.mobile);
  }
  if (complaintData.email) {
    cy.get('input[name="email"]').type(complaintData.email);
  }
  if (complaintData.problemType) {
    cy.get('select[name="problemType"]').select(complaintData.problemType);
  }
  if (complaintData.area) {
    cy.get('input[name="area"]').type(complaintData.area);
  }
  if (complaintData.description) {
    cy.get('textarea[name="description"]').type(complaintData.description);
  }
  if (complaintData.address) {
    cy.get('input[name="address"]').type(complaintData.address);
  }

  cy.get('button[type="submit"]').click();
});

// Custom command to wait for API requests
Cypress.Commands.add("waitForApiCall", (alias: string) => {
  cy.wait(alias).then((interception) => {
    expect(interception.response?.statusCode).to.be.oneOf([200, 201, 204]);
  });
});

// Custom command to clear local storage and session storage
Cypress.Commands.add("clearStorage", () => {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
});

// Custom command to mock API responses
Cypress.Commands.add(
  "mockApiResponse",
  (method: string, url: string, response: any) => {
    cy.intercept(method, url, response).as(
      `api${method}${url.replace(/\W/g, "")}`,
    );
  },
);

// Custom command to check accessibility
Cypress.Commands.add("checkA11y", () => {
  // Basic accessibility checks
  cy.get("img").should("have.attr", "alt");
  cy.get("button").should("be.visible");
  cy.get("input").each(($input) => {
    cy.wrap($input)
      .should("have.attr", "aria-label")
      .or("have.attr", "placeholder");
  });
});

// Extend Cypress types
declare global {
  namespace Cypress {
    interface Chainable {
      waitForApiCall(alias: string): Chainable<void>;
      clearStorage(): Chainable<void>;
      mockApiResponse(
        method: string,
        url: string,
        response: any,
      ): Chainable<void>;
      checkA11y(): Chainable<void>;
    }
  }
}
