import { z } from "zod";

// Common validation schemas
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^[+]?[1-9][\d\s\-()]{8,15}$/, "Please enter a valid phone number");

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters long")
  .max(50, "Name must not exceed 50 characters")
  .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces");

// Auth validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    fullName: nameSchema,
    email: emailSchema,
    phoneNumber: phoneSchema.optional(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z
      .enum(["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"])
      .optional(),
    wardId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const otpSchema = z.object({
  email: emailSchema,
  otpCode: z
    .string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only numbers"),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Profile validation schemas
export const updateProfileSchema = z.object({
  fullName: nameSchema,
  phoneNumber: phoneSchema.optional(),
  language: z.enum(["en", "hi", "ml"]).optional(),
  notificationsEnabled: z.boolean().optional(),
  emailAlerts: z.boolean().optional(),
});

// Complaint validation schemas
export const complaintSchema = z.object({
  type: z.string().min(1, "Complaint type is required"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters long")
    .max(1000, "Description must not exceed 1000 characters"),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  ward: z.string().min(1, "Ward is required"),
  area: z.string().min(1, "Area is required"),
  location: z.string().min(1, "Location is required"),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters long")
    .max(200, "Address must not exceed 200 characters"),
  mobile: phoneSchema,
  email: emailSchema.optional(),
  landmarks: z
    .string()
    .max(100, "Landmarks must not exceed 100 characters")
    .optional(),
});

export const guestComplaintSchema = complaintSchema.extend({
  email: emailSchema, // Required for guest complaints
  captcha: z.string().min(1, "Please complete the CAPTCHA verification"),
});

export const updateComplaintSchema = z.object({
  status: z
    .enum([
      "registered",
      "assigned",
      "in_progress",
      "resolved",
      "closed",
      "reopened",
    ])
    .optional(),
  assignedTo: z.string().optional(),
  remarks: z
    .string()
    .max(500, "Remarks must not exceed 500 characters")
    .optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
});

export const feedbackSchema = z.object({
  rating: z
    .number()
    .min(1, "Please provide a rating")
    .max(5, "Rating cannot exceed 5"),
  feedback: z
    .string()
    .min(10, "Feedback must be at least 10 characters long")
    .max(500, "Feedback must not exceed 500 characters"),
});

// Admin validation schemas
export const userManagementSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phoneNumber: phoneSchema.optional(),
  role: z.enum([
    "CITIZEN",
    "WARD_OFFICER",
    "MAINTENANCE_TEAM",
    "ADMINISTRATOR",
  ]),
  wardId: z.string().optional(),
  department: z
    .string()
    .max(50, "Department must not exceed 50 characters")
    .optional(),
  isActive: z.boolean(),
});

export const wardSchema = z.object({
  name: z
    .string()
    .min(2, "Ward name must be at least 2 characters long")
    .max(50, "Ward name must not exceed 50 characters"),
  description: z
    .string()
    .max(200, "Description must not exceed 200 characters")
    .optional(),
  officerId: z.string().optional(),
});

export const complaintTypeSchema = z.object({
  name: z
    .string()
    .min(2, "Type name must be at least 2 characters long")
    .max(50, "Type name must not exceed 50 characters"),
  description: z
    .string()
    .max(200, "Description must not exceed 200 characters")
    .optional(),
  slaHours: z
    .number()
    .min(1, "SLA must be at least 1 hour")
    .max(168, "SLA cannot exceed 168 hours (1 week)"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  isActive: z.boolean(),
});

// Settings validation schemas
export const systemConfigSchema = z.object({
  siteName: z
    .string()
    .min(1, "Site name is required")
    .max(50, "Site name must not exceed 50 characters"),
  contactEmail: emailSchema,
  contactPhone: phoneSchema,
  address: z
    .string()
    .min(5, "Address must be at least 5 characters long")
    .max(200, "Address must not exceed 200 characters"),
  defaultLanguage: z.enum(["en", "hi", "ml"]),
  enableGuestComplaints: z.boolean(),
  enableNotifications: z.boolean(),
  maxFileSize: z.number().min(1).max(10), // MB
  allowedFileTypes: z.array(z.string()),
});

// Search and filter schemas
export const complaintFilterSchema = z.object({
  status: z.array(z.string()).optional(),
  priority: z.array(z.string()).optional(),
  type: z.array(z.string()).optional(),
  ward: z.array(z.string()).optional(),
  assignedTo: z.string().optional(),
  submittedBy: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  page: z.number().min(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const reportFilterSchema = z
  .object({
    reportType: z.enum(["complaints", "performance", "sla", "user", "ward"]),
    dateFrom: z.string().min(1, "Start date is required"),
    dateTo: z.string().min(1, "End date is required"),
    ward: z.array(z.string()).optional(),
    status: z.array(z.string()).optional(),
    type: z.array(z.string()).optional(),
    format: z.enum(["pdf", "excel", "csv"]).optional(),
  })
  .refine(
    (data) => {
      const from = new Date(data.dateFrom);
      const to = new Date(data.dateTo);
      return from <= to;
    },
    {
      message: "End date must be after start date",
      path: ["dateTo"],
    },
  );

// File upload validation
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "File size must not exceed 5MB",
    )
    .refine((file) => {
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      return allowedTypes.includes(file.type);
    }, "File type not supported. Please upload JPG, PNG, GIF, PDF, or DOC files."),
});

// Bulk operations validation
export const bulkActionSchema = z.object({
  action: z.enum(["assign", "update_status", "update_priority", "delete"]),
  ids: z.array(z.string()).min(1, "Please select at least one item"),
  assignedTo: z.string().optional(),
  status: z
    .enum([
      "registered",
      "assigned",
      "in_progress",
      "resolved",
      "closed",
      "reopened",
    ])
    .optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  remarks: z
    .string()
    .max(500, "Remarks must not exceed 500 characters")
    .optional(),
});

// Type exports for TypeScript
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type OTPFormData = z.infer<typeof otpSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ComplaintFormData = z.infer<typeof complaintSchema>;
export type GuestComplaintFormData = z.infer<typeof guestComplaintSchema>;
export type UpdateComplaintFormData = z.infer<typeof updateComplaintSchema>;
export type FeedbackFormData = z.infer<typeof feedbackSchema>;
export type UserManagementFormData = z.infer<typeof userManagementSchema>;
export type WardFormData = z.infer<typeof wardSchema>;
export type ComplaintTypeFormData = z.infer<typeof complaintTypeSchema>;
export type SystemConfigFormData = z.infer<typeof systemConfigSchema>;
export type ComplaintFilterFormData = z.infer<typeof complaintFilterSchema>;
export type ReportFilterFormData = z.infer<typeof reportFilterSchema>;
export type FileUploadFormData = z.infer<typeof fileUploadSchema>;
export type BulkActionFormData = z.infer<typeof bulkActionSchema>;
