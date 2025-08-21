import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { z } from "zod";
import { useFormValidation } from "../../hooks/useFormValidation";

// Mock the toast hook
const mockToast = vi.fn();
vi.mock("../../components/ui/use-toast", () => ({
  toast: mockToast,
}));

// Mock translations
vi.mock("../../store/hooks", () => ({
  useAppSelector: vi.fn(() => ({
    messages: {
      operationSuccess: "Success",
      error: "Error",
      operationFailed: "Operation failed",
    },
  })),
}));

// Test schema
const testSchema = z
  .object({
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type TestFormData = z.infer<typeof testSchema>;

describe("useFormValidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        defaultValues: {
          email: "",
          password: "",
          confirmPassword: "",
        },
      }),
    );

    expect(result.current.getValues()).toEqual({
      email: "",
      password: "",
      confirmPassword: "",
    });
    expect(result.current.isValid).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it("validates form data with schema", async () => {
    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        defaultValues: {
          email: "",
          password: "",
          confirmPassword: "",
        },
      }),
    );

    // Set invalid email
    act(() => {
      result.current.setValue("email", "invalid-email");
    });

    await waitFor(() => {
      expect(result.current.getFieldError("email")).toBe("Invalid email");
    });
  });

  it("handles successful form submission", async () => {
    const mockSubmit = vi.fn().mockResolvedValue({ message: "Success" });

    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        defaultValues: {
          email: "test@example.com",
          password: "password123",
          confirmPassword: "password123",
        },
      }),
    );

    await act(async () => {
      const submitHandler = result.current.handleSubmit(mockSubmit);
      await submitHandler();
    });

    expect(mockSubmit).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.current.isSuccess).toBe(true);
    expect(mockToast).toHaveBeenCalledWith({
      title: "Success",
      description: "Success",
      variant: "default",
    });
  });

  it("handles form submission errors", async () => {
    const mockSubmit = vi
      .fn()
      .mockRejectedValue(new Error("Submission failed"));

    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        defaultValues: {
          email: "test@example.com",
          password: "password123",
          confirmPassword: "password123",
        },
      }),
    );

    await act(async () => {
      try {
        const submitHandler = result.current.handleSubmit(mockSubmit);
        await submitHandler();
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.isSuccess).toBe(false);
    expect(result.current.globalError).toBe("Submission failed");
    expect(mockToast).toHaveBeenCalledWith({
      title: "Error",
      description: "Submission failed",
      variant: "destructive",
    });
  });

  it("handles server validation errors", async () => {
    const serverErrors = [
      { field: "email", message: "Email already exists" },
      { field: "password", message: "Password too weak" },
    ];

    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        defaultValues: {
          email: "",
          password: "",
          confirmPassword: "",
        },
      }),
    );

    act(() => {
      result.current.setServerErrors(serverErrors);
    });

    expect(result.current.getFieldError("email")).toBe("Email already exists");
    expect(result.current.getFieldError("password")).toBe("Password too weak");
  });

  it("clears server errors when field changes", async () => {
    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        defaultValues: {
          email: "",
          password: "",
          confirmPassword: "",
        },
      }),
    );

    // Set server error
    act(() => {
      result.current.setServerErrors([
        { field: "email", message: "Email already exists" },
      ]);
    });

    expect(result.current.getFieldError("email")).toBe("Email already exists");

    // Change field value should clear server error
    act(() => {
      result.current.watchField("email");
      result.current.setValue("email", "new@example.com");
    });

    await waitFor(() => {
      expect(result.current.getFieldError("email")).toBeUndefined();
    });
  });

  it("resets form state", () => {
    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        defaultValues: {
          email: "",
          password: "",
          confirmPassword: "",
        },
      }),
    );

    // Make changes
    act(() => {
      result.current.setValue("email", "test@example.com");
      result.current.setServerErrors([
        { field: "password", message: "Server error" },
      ]);
    });

    expect(result.current.isDirty).toBe(true);
    expect(result.current.getFieldError("password")).toBe("Server error");

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.getValues()).toEqual({
      email: "",
      password: "",
      confirmPassword: "",
    });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.getFieldError("password")).toBeUndefined();
  });

  it("manages loading state during submission", async () => {
    const mockSubmit = vi.fn(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    const { result } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        defaultValues: {
          email: "test@example.com",
          password: "password123",
          confirmPassword: "password123",
        },
      }),
    );

    expect(result.current.isSubmitting).toBe(false);

    const submitPromise = act(async () => {
      const submitHandler = result.current.handleSubmit(mockSubmit);
      return submitHandler();
    });

    expect(result.current.isSubmitting).toBe(true);

    await submitPromise;

    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.hasSubmitted).toBe(true);
  });

  it("validates on different modes", async () => {
    const { result: onChangeResult } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        mode: "onChange",
        defaultValues: {
          email: "",
          password: "",
          confirmPassword: "",
        },
      }),
    );

    const { result: onBlurResult } = renderHook(() =>
      useFormValidation<TestFormData>({
        schema: testSchema,
        mode: "onBlur",
        defaultValues: {
          email: "",
          password: "",
          confirmPassword: "",
        },
      }),
    );

    // Test that different modes behave differently
    act(() => {
      onChangeResult.current.setValue("email", "invalid");
      onBlurResult.current.setValue("email", "invalid");
    });

    // onChange mode should validate immediately
    await waitFor(() => {
      expect(onChangeResult.current.getFieldError("email")).toBe(
        "Invalid email",
      );
    });

    // onBlur mode might not validate immediately (depends on implementation)
    // This would need actual user interaction to test properly
  });
});
