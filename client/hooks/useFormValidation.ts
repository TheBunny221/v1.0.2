import { useState, useCallback } from "react";
import {
  useForm,
  UseFormReturn,
  FieldValues,
  DefaultValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodSchema } from "zod";
import { toast } from "../components/ui/use-toast";
import { useAppSelector } from "../store/hooks";
import { selectTranslations } from "../store/slices/languageSlice";

// Enhanced form configuration
export interface FormConfig<T extends FieldValues> {
  schema: ZodSchema<T>;
  defaultValues?: DefaultValues<T>;
  mode?: "onChange" | "onBlur" | "onSubmit" | "onTouched" | "all";
  reValidateMode?: "onChange" | "onBlur" | "onSubmit";
  shouldFocusError?: boolean;
  delayError?: number;
}

// Server error handling
export interface ServerError {
  field?: string;
  message: string;
  code?: string;
}

// Form submission state
export interface FormSubmissionState {
  isSubmitting: boolean;
  hasSubmitted: boolean;
  isSuccess: boolean;
  error: string | null;
  serverErrors: ServerError[];
}

// Enhanced form hook with comprehensive error handling
export function useFormValidation<T extends FieldValues>(
  config: FormConfig<T>,
) {
  const translations = useAppSelector(selectTranslations);
  const [submissionState, setSubmissionState] = useState<FormSubmissionState>({
    isSubmitting: false,
    hasSubmitted: false,
    isSuccess: false,
    error: null,
    serverErrors: [],
  });

  // Initialize react-hook-form with Zod resolver
  const form: UseFormReturn<T> = useForm<T>({
    resolver: zodResolver(config.schema),
    defaultValues: config.defaultValues,
    mode: config.mode || "onSubmit",
    reValidateMode: config.reValidateMode || "onChange",
    shouldFocusError: config.shouldFocusError !== false,
    delayError: config.delayError || 300,
  });

  // Clear server errors when field changes
  const clearServerError = useCallback((fieldName: string) => {
    setSubmissionState((prev) => ({
      ...prev,
      serverErrors: prev.serverErrors.filter(
        (error) => error.field !== fieldName,
      ),
    }));
  }, []);

  // Set server errors from API response
  const setServerErrors = useCallback(
    (errors: ServerError[] | string) => {
      if (typeof errors === "string") {
        setSubmissionState((prev) => ({
          ...prev,
          error: errors,
          serverErrors: [],
        }));
      } else {
        const serverErrors = Array.isArray(errors) ? errors : [errors];

        // Set field-specific errors
        serverErrors.forEach((error) => {
          if (error.field && form.getValues(error.field as any) !== undefined) {
            form.setError(error.field as any, {
              type: "server",
              message: error.message,
            });
          }
        });

        setSubmissionState((prev) => ({
          ...prev,
          serverErrors,
          error: serverErrors.find((e) => !e.field)?.message || null,
        }));
      }
    },
    [form],
  );

  // Clear all errors
  const clearErrors = useCallback(() => {
    form.clearErrors();
    setSubmissionState((prev) => ({
      ...prev,
      error: null,
      serverErrors: [],
    }));
  }, [form]);

  // Handle form submission with comprehensive error handling
  const handleSubmit = useCallback(
    (onSubmit: (data: T) => Promise<any>) => {
      return form.handleSubmit(async (data) => {
        setSubmissionState((prev) => ({
          ...prev,
          isSubmitting: true,
          error: null,
          serverErrors: [],
        }));

        try {
          const result = await onSubmit(data);

          setSubmissionState((prev) => ({
            ...prev,
            isSubmitting: false,
            hasSubmitted: true,
            isSuccess: true,
          }));

          // Show success toast
          toast({
            title: translations?.messages?.operationSuccess || "Success",
            description: result?.message || "Operation completed successfully.",
            variant: "default",
          });

          return result;
        } catch (error: any) {
          setSubmissionState((prev) => ({
            ...prev,
            isSubmitting: false,
            hasSubmitted: true,
            isSuccess: false,
          }));

          // Handle different error types
          if (error?.response?.data) {
            const { data } = error.response;

            if (data.errors && Array.isArray(data.errors)) {
              // Validation errors from server
              setServerErrors(data.errors);
            } else if (data.message) {
              // General error message
              setServerErrors(data.message);
            }
          } else if (error?.message) {
            setServerErrors(error.message);
          } else {
            setServerErrors(
              translations?.messages?.operationFailed || "An error occurred",
            );
          }

          // Show error toast
          toast({
            title: translations?.messages?.error || "Error",
            description:
              error?.message ||
              translations?.messages?.operationFailed ||
              "An error occurred",
            variant: "destructive",
          });

          throw error;
        }
      });
    },
    [form, translations, setServerErrors],
  );

  // Reset form and submission state
  const resetForm = useCallback(
    (values?: DefaultValues<T>) => {
      form.reset(values);
      setSubmissionState({
        isSubmitting: false,
        hasSubmitted: false,
        isSuccess: false,
        error: null,
        serverErrors: [],
      });
    },
    [form],
  );

  // Get field error (client or server)
  const getFieldError = useCallback(
    (fieldName: keyof T) => {
      // Check for react-hook-form errors first
      const formError = form.formState.errors[fieldName];
      if (formError) {
        return formError.message as string;
      }

      // Check for server errors
      const serverError = submissionState.serverErrors.find(
        (error) => error.field === fieldName,
      );
      return serverError?.message;
    },
    [form.formState.errors, submissionState.serverErrors],
  );

  // Check if field has error
  const hasFieldError = useCallback(
    (fieldName: keyof T) => {
      return !!getFieldError(fieldName);
    },
    [getFieldError],
  );

  // Watch field values with error clearing
  const watchField = useCallback(
    (fieldName: keyof T) => {
      const value = form.watch(fieldName as any);

      // Clear server error when field changes
      if (
        submissionState.serverErrors.some((error) => error.field === fieldName)
      ) {
        clearServerError(fieldName as string);
      }

      return value;
    },
    [form, submissionState.serverErrors, clearServerError],
  );

  return {
    // Form instance
    form,

    // Form state
    formState: form.formState,
    submissionState,

    // Form methods
    handleSubmit,
    resetForm,
    clearErrors,

    // Field methods
    register: form.register,
    control: form.control,
    watch: form.watch,
    watchField,
    setValue: form.setValue,
    getValues: form.getValues,
    trigger: form.trigger,

    // Error handling
    setServerErrors,
    clearServerError,
    getFieldError,
    hasFieldError,

    // Computed state
    isValid:
      form.formState.isValid && submissionState.serverErrors.length === 0,
    isDirty: form.formState.isDirty,
    isSubmitting: submissionState.isSubmitting,
    hasSubmitted: submissionState.hasSubmitted,
    isSuccess: submissionState.isSuccess,
    globalError: submissionState.error,
  };
}

// Hook for dynamic form validation
export function useDynamicValidation<T extends FieldValues>(
  schema: ZodSchema<T>,
  dependencies: any[] = [],
) {
  const [currentSchema, setCurrentSchema] = useState(schema);

  const updateSchema = useCallback((newSchema: ZodSchema<T>) => {
    setCurrentSchema(newSchema);
  }, []);

  // Re-create schema when dependencies change
  const computedSchema = useCallback(() => {
    return currentSchema;
  }, [currentSchema, ...dependencies]);

  return {
    schema: computedSchema(),
    updateSchema,
  };
}

// Hook for form state persistence
export function useFormPersistence<T extends FieldValues>(
  key: string,
  form: UseFormReturn<T>,
) {
  // Save form data to localStorage
  const saveFormData = useCallback(() => {
    const formData = form.getValues();
    localStorage.setItem(`form_${key}`, JSON.stringify(formData));
  }, [form, key]);

  // Load form data from localStorage
  const loadFormData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(`form_${key}`);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        Object.keys(parsedData).forEach((fieldName) => {
          form.setValue(fieldName as any, parsedData[fieldName]);
        });
      }
    } catch (error) {
      console.warn("Failed to load saved form data:", error);
    }
  }, [form, key]);

  // Clear saved form data
  const clearSavedData = useCallback(() => {
    localStorage.removeItem(`form_${key}`);
  }, [key]);

  return {
    saveFormData,
    loadFormData,
    clearSavedData,
  };
}
