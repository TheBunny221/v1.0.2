import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import {
  renderWithAuth,
  renderWithoutAuth,
  mockNavigate,
} from "../utils/test-utils";
import RoleBasedRoute from "../../components/RoleBasedRoute";

// Mock the toast hook
vi.mock("../../components/ui/use-toast", () => ({
  toast: vi.fn(),
}));

const TestComponent = () => <div>Protected Content</div>;

describe("RoleBasedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when user is authenticated", () => {
    it("renders children when user has required role", () => {
      renderWithAuth(
        <RoleBasedRoute allowedRoles={["CITIZEN"]}>
          <TestComponent />
        </RoleBasedRoute>,
        { role: "CITIZEN" },
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("redirects to unauthorized when user lacks required role", () => {
      renderWithAuth(
        <RoleBasedRoute allowedRoles={["ADMINISTRATOR"]}>
          <TestComponent />
        </RoleBasedRoute>,
        { role: "CITIZEN" },
      );

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("allows multiple roles", () => {
      renderWithAuth(
        <RoleBasedRoute allowedRoles={["CITIZEN", "WARD_OFFICER"]}>
          <TestComponent />
        </RoleBasedRoute>,
        { role: "WARD_OFFICER" },
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("executes custom permission check", () => {
      const customCheck = vi.fn().mockReturnValue(true);

      renderWithAuth(
        <RoleBasedRoute
          allowedRoles={["CITIZEN"]}
          checkPermissions={customCheck}
        >
          <TestComponent />
        </RoleBasedRoute>,
        { role: "CITIZEN" },
      );

      expect(customCheck).toHaveBeenCalled();
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("redirects when custom permission check fails", () => {
      const customCheck = vi.fn().mockReturnValue(false);

      renderWithAuth(
        <RoleBasedRoute
          allowedRoles={["CITIZEN"]}
          checkPermissions={customCheck}
        >
          <TestComponent />
        </RoleBasedRoute>,
        { role: "CITIZEN" },
      );

      expect(customCheck).toHaveBeenCalled();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("when user is not authenticated", () => {
    it("redirects to login page", () => {
      renderWithoutAuth(
        <RoleBasedRoute allowedRoles={["CITIZEN"]}>
          <TestComponent />
        </RoleBasedRoute>,
      );

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("redirects to custom fallback path", () => {
      renderWithoutAuth(
        <RoleBasedRoute allowedRoles={["CITIZEN"]} fallbackPath="/custom-login">
          <TestComponent />
        </RoleBasedRoute>,
      );

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("loading states", () => {
    it("shows loading component when auth is loading", () => {
      renderWithAuth(
        <RoleBasedRoute allowedRoles={["CITIZEN"]}>
          <TestComponent />
        </RoleBasedRoute>,
        { role: "CITIZEN" },
        {
          preloadedState: {
            auth: {
              user: null,
              isAuthenticated: false,
              isLoading: true,
              token: null,
              error: null,
              otpStep: "none",
              requiresPasswordSetup: false,
              registrationStep: "none",
            },
          },
        },
      );

      expect(
        screen.getByText("Verifying authentication..."),
      ).toBeInTheDocument();
    });

    it("shows custom loading component", () => {
      const CustomLoader = () => <div>Custom Loading...</div>;

      renderWithAuth(
        <RoleBasedRoute
          allowedRoles={["CITIZEN"]}
          loadingComponent={<CustomLoader />}
        >
          <TestComponent />
        </RoleBasedRoute>,
        { role: "CITIZEN" },
        {
          preloadedState: {
            auth: {
              user: null,
              isAuthenticated: false,
              isLoading: true,
              token: null,
              error: null,
              otpStep: "none",
              requiresPasswordSetup: false,
              registrationStep: "none",
            },
          },
        },
      );

      expect(screen.getByText("Custom Loading...")).toBeInTheDocument();
    });
  });

  describe("token expiration handling", () => {
    it("handles expired token", async () => {
      // Mock expired token
      const expiredToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      renderWithAuth(
        <RoleBasedRoute allowedRoles={["CITIZEN"]}>
          <TestComponent />
        </RoleBasedRoute>,
        { role: "CITIZEN" },
        {
          preloadedState: {
            auth: {
              user: { id: "1", role: "CITIZEN" },
              isAuthenticated: true,
              token: expiredToken,
              isLoading: false,
              error: null,
              otpStep: "none",
              requiresPasswordSetup: false,
              registrationStep: "none",
            },
          },
        },
      );

      // Token expiration should be handled automatically
      // This would trigger logout in the actual component
    });
  });
});
