# Testing Guide

This project includes a comprehensive testing suite with unit tests, integration tests, and end-to-end tests.

## Testing Stack

- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Cypress
- **Component Tests**: Cypress Component Testing
- **Test Utilities**: Custom test helpers and mocks

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### End-to-End Tests

```bash
# Run E2E tests in headless mode
npm run test:e2e

# Open Cypress Test Runner
npm run test:e2e:open
```

### Component Tests

```bash
# Run component tests in headless mode
npm run test:component

# Open Cypress Component Test Runner
npm run test:component:open
```

### All Tests

```bash
# Run all tests (unit + E2E)
npm run test:all
```

## Test Structure

### Unit Tests (`client/__tests__/`)

- **Components**: Test React component behavior and rendering
- **Store**: Test Redux slices and actions
- **Utils**: Test utility functions and business logic

### E2E Tests (`cypress/e2e/`)

- **Authentication**: Login/logout flows
- **Complaint Management**: Full complaint lifecycle
- **Role-based Access**: Different user role behaviors
- **Navigation**: Route protection and navigation

### Test Utilities (`client/__tests__/test-utils.tsx`)

- Custom render function with Redux Provider
- Mock data generators
- Common test setup

## Test Coverage

### Current Coverage Areas

- ✅ Authentication flows
- ✅ Complaint submission and management
- ✅ Permission system
- ✅ Redux state management
- ✅ Role-based routing
- ✅ Form validation
- ✅ API integration

### Test Scenarios

#### Authentication Tests

- Login with valid credentials
- Login validation errors
- OTP-based authentication
- Logout functionality
- Session management

#### Complaint Management Tests

- Complaint form submission
- Guest complaint flow
- Status updates
- Assignment workflows
- Permission-based access

#### Permission Tests

- Role-based permissions
- Data filtering
- Action authorization
- Navigation restrictions

## Writing Tests

### Unit Test Example

```typescript
import { render, screen, fireEvent } from '../test-utils';
import MyComponent from '../../components/MyComponent';

test('should render component correctly', () => {
  render(<MyComponent />);
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

### E2E Test Example

```typescript
describe("Feature Flow", () => {
  it("should complete user journey", () => {
    cy.visit("/");
    cy.get('[data-testid="button"]').click();
    cy.url().should("include", "/expected-route");
  });
});
```

## Best Practices

### Unit Tests

- Test component behavior, not implementation
- Use data-testid for reliable element selection
- Mock external dependencies
- Test error states and edge cases

### E2E Tests

- Test complete user journeys
- Use custom commands for common actions
- Test critical business flows
- Include accessibility checks

### Test Data

- Use factories for test data generation
- Keep test data isolated and predictable
- Reset state between tests
- Use realistic but not production data

## Continuous Integration

Tests are configured to run in CI/CD pipelines:

```yaml
# Example CI configuration
test:
  script:
    - npm install
    - npm run test:unit
    - npm run test:e2e
  coverage: '/Coverage: \d+\.\d+%/'
```

## Debugging Tests

### Unit Tests

```bash
# Debug specific test file
npx vitest client/__tests__/components/Login.test.tsx

# Run tests with debugging
npx vitest --reporter=verbose
```

### E2E Tests

```bash
# Run specific test file
npx cypress run --spec "cypress/e2e/auth.cy.ts"

# Debug mode with browser
npx cypress open
```

## Test Environment Setup

### Prerequisites

- Node.js 18+
- Development server running on port 3000
- Test database seeded with demo data

### Environment Variables

```bash
# Cypress environment variables
CYPRESS_ADMIN_EMAIL=admin@cochinsmartcity.gov.in
CYPRESS_ADMIN_PASSWORD=admin123
CYPRESS_CITIZEN_EMAIL=citizen@example.com
CYPRESS_CITIZEN_PASSWORD=citizen123
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure dev server is running on port 3000
2. **Database state**: Reset test database between test runs
3. **Async operations**: Use proper waits for API calls
4. **Element not found**: Use data-testid attributes for reliable selection

### Debug Commands

```bash
# Check test configuration
npx vitest --config

# Verify Cypress setup
npx cypress verify

# Generate test coverage report
npm run test:coverage
```
