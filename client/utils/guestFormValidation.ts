// Validation utilities for guest complaint form

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  type: string;
  description: string;
  wardId: string;
  subZoneId: string;
  area: string;
  landmark?: string;
  address?: string;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone number validation regex (supports international formats)
const PHONE_REGEX = /^\+?[\d\s-()]{10,}$/;

// Valid complaint types
const VALID_COMPLAINT_TYPES = [
  "WATER_SUPPLY",
  "ELECTRICITY",
  "ROAD_REPAIR",
  "GARBAGE_COLLECTION",
  "STREET_LIGHTING",
  "SEWERAGE",
  "PUBLIC_HEALTH",
  "TRAFFIC",
  "OTHERS",
];

// Valid priorities
const VALID_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const validateStep1 = (data: Partial<FormData>): ValidationResult => {
  const errors: Record<string, string> = {};

  // Full name validation
  if (!data.fullName?.trim()) {
    errors.fullName = "Full name is required";
  } else if (data.fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters";
  } else if (data.fullName.trim().length > 100) {
    errors.fullName = "Full name cannot exceed 100 characters";
  }

  // Email validation
  if (!data.email?.trim()) {
    errors.email = "Email is required";
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.email = "Please enter a valid email address";
  }

  // Phone number validation
  if (!data.phoneNumber?.trim()) {
    errors.phoneNumber = "Phone number is required";
  } else if (!PHONE_REGEX.test(data.phoneNumber.trim())) {
    errors.phoneNumber =
      "Please enter a valid phone number (minimum 10 digits)";
  }

  // Complaint type validation
  if (!data.type) {
    errors.type = "Complaint type is required";
  } else if (!VALID_COMPLAINT_TYPES.includes(data.type)) {
    errors.type = "Invalid complaint type selected";
  }

  // Description validation
  if (!data.description?.trim()) {
    errors.description = "Description is required";
  } else if (data.description.trim().length < 10) {
    errors.description = "Description must be at least 10 characters";
  } else if (data.description.trim().length > 2000) {
    errors.description = "Description cannot exceed 2000 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateStep2 = (data: Partial<FormData>): ValidationResult => {
  const errors: Record<string, string> = {};

  // Ward validation
  if (!data.wardId?.trim()) {
    errors.wardId = "Ward selection is required";
  }

  // Sub-zone validation
  if (!data.subZoneId?.trim()) {
    errors.subZoneId = "Sub-zone selection is required";
  }

  // Area validation
  if (!data.area?.trim()) {
    errors.area = "Area/Locality is required";
  } else if (data.area.trim().length < 2) {
    errors.area = "Area must be at least 2 characters";
  } else if (data.area.trim().length > 200) {
    errors.area = "Area cannot exceed 200 characters";
  }

  // Optional address validation
  if (data.address && data.address.trim().length > 500) {
    errors.address = "Address cannot exceed 500 characters";
  }

  // Optional landmark validation
  if (data.landmark && data.landmark.trim().length > 200) {
    errors.landmark = "Landmark cannot exceed 200 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateStep3 = (files: File[]): ValidationResult => {
  const errors: Record<string, string> = {};

  // File count validation
  if (files.length > 5) {
    errors.attachments = "Maximum 5 files allowed";
    return { isValid: false, errors };
  }

  // Individual file validation
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      // File size validation (10MB)
      if (file.size > 10 * 1024 * 1024) {
        errors.attachments = `File "${file.name}" exceeds 10MB limit`;
        return { isValid: false, errors };
      }

      // File type validation
      if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
        errors.attachments = `File "${file.name}" must be JPG or PNG format`;
        return { isValid: false, errors };
      }
    }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateAllSteps = (
  data: Partial<FormData>,
  files: File[] = [],
): ValidationResult => {
  const step1Result = validateStep1(data);
  const step2Result = validateStep2(data);
  const step3Result = validateStep3(files);

  const allErrors = {
    ...step1Result.errors,
    ...step2Result.errors,
    ...step3Result.errors,
  };

  return {
    isValid: Object.keys(allErrors).length === 0,
    errors: allErrors,
  };
};

// Helper function to validate email format only
export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

// Helper function to validate phone number format only
export const isValidPhoneNumber = (phone: string): boolean => {
  return PHONE_REGEX.test(phone.trim());
};

// Helper function to check if complaint type is valid
export const isValidComplaintType = (type: string): boolean => {
  return VALID_COMPLAINT_TYPES.includes(type);
};

// Helper function to check if priority is valid
export const isValidPriority = (priority: string): boolean => {
  return VALID_PRIORITIES.includes(priority);
};
