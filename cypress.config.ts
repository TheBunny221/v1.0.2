import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    env: {
      ADMIN_EMAIL: "admin@cochinsmartcity.gov.in",
      ADMIN_PASSWORD: "admin123",
      CITIZEN_EMAIL: "citizen@example.com",
      CITIZEN_PASSWORD: "citizen123",
      WARD_OFFICER_EMAIL: "ward.officer@cochinsmartcity.gov.in",
      WARD_OFFICER_PASSWORD: "ward123",
    },
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on("task", {
        log(message) {
          console.log(message);
          return null;
        },
      });
    },
  },
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
    specPattern: "cypress/component/**/*.cy.{js,jsx,ts,tsx}",
    supportFile: "cypress/support/component.ts",
  },
});
