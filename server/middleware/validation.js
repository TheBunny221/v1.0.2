import { body, param, query, validationResult } from "express-validator";

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation failed",
      data: {
        errors: formattedErrors,
      },
    });
  }

  next();
};

// User validation rules
export const validateRegistration = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("phoneNumber")
    .optional()
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please provide a valid phone number"),

  body("password")
    .optional()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),

  body("role")
    .optional()
    .isIn(["CITIZEN", "ADMINISTRATOR", "WARD_OFFICER", "MAINTENANCE_TEAM"])
    .withMessage("Invalid role"),

  handleValidationErrors,
];

export const validateUserRegistration = validateRegistration;

export const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

export const validateUserLogin = validateLogin;

export const validateUserProfileUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("phone")
    .optional()
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please provide a valid phone number"),

  body("preferences.language")
    .optional()
    .isIn(["en", "hi", "ml"])
    .withMessage("Invalid language preference"),

  body("preferences.notifications")
    .optional()
    .isBoolean()
    .withMessage("Notifications preference must be boolean"),

  body("preferences.emailAlerts")
    .optional()
    .isBoolean()
    .withMessage("Email alerts preference must be boolean"),

  handleValidationErrors,
];

// Complaint validation rules
export const validateComplaintCreation = [
  body("type")
    .isIn([
      "WATER_SUPPLY",
      "ELECTRICITY",
      "ROAD_REPAIR",
      "GARBAGE_COLLECTION",
      "STREET_LIGHTING",
      "SEWERAGE",
      "PUBLIC_HEALTH",
      "TRAFFIC",
      "OTHERS",
    ])
    .withMessage("Invalid complaint type"),

  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .withMessage("Invalid priority"),

  body("contactPhone")
    .optional()
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please provide a valid phone number"),

  body("contactEmail")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("wardId").notEmpty().withMessage("Ward is required"),

  body("area")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Area must be between 2 and 200 characters"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),

  body("coordinates.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  body("coordinates.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),

  handleValidationErrors,
];

export const validateComplaintUpdate = [
  body("status")
    .optional()
    .isIn([
      "REGISTERED",
      "ASSIGNED",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
      "REOPENED",
    ])
    .withMessage("Invalid status"),

  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .withMessage("Invalid priority"),

  body("assignedToId").optional().isString().withMessage("Invalid user ID"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Comment cannot exceed 1000 characters"),

  handleValidationErrors,
];

export const validateComplaintFeedback = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),

  body("comment")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Comment cannot exceed 1000 characters"),

  handleValidationErrors,
];

// ID validation
export const validateMongoId = [
  param("id").isMongoId().withMessage("Invalid ID format"),

  handleValidationErrors,
];

// Query validation
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  handleValidationErrors,
];

// Ward validation
export const validateWard = [
  body("name")
    .notEmpty()
    .withMessage("Ward name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Ward name must be between 2 and 100 characters"),
  body("description")
    .notEmpty()
    .withMessage("Ward description is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

// SubZone validation
export const validateSubZone = [
  body("name")
    .notEmpty()
    .withMessage("Sub-zone name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Sub-zone name must be between 2 and 100 characters"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description must be less than 500 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

// User creation validation (Admin)
export const validateUser = [
  body("fullName")
    .notEmpty()
    .withMessage("Full name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  body("phoneNumber")
    .optional()
    .isMobilePhone()
    .withMessage("Please enter a valid phone number"),
  body("role")
    .isIn(["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"])
    .withMessage("Invalid role"),
  body("wardId").optional().isString().withMessage("Invalid ward ID"),
  body("department")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Department name too long"),
  handleValidationErrors,
];

// User update validation (Admin)
export const validateUserUpdate = [
  body("fullName")
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please enter a valid email")
    .normalizeEmail(),
  body("phoneNumber")
    .optional()
    .isMobilePhone()
    .withMessage("Please enter a valid phone number"),
  body("role")
    .optional()
    .isIn(["CITIZEN", "WARD_OFFICER", "MAINTENANCE_TEAM", "ADMINISTRATOR"])
    .withMessage("Invalid role"),
  body("wardId").optional().isString().withMessage("Invalid ward ID"),
  body("department")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Department name too long"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors,
];

export const validateComplaintFilters = [
  query("status")
    .optional()
    .isIn([
      "REGISTERED",
      "ASSIGNED",
      "IN_PROGRESS",
      "RESOLVED",
      "CLOSED",
      "REOPENED",
    ])
    .withMessage("Invalid status filter"),

  query("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .withMessage("Invalid priority filter"),

  query("type")
    .optional()
    .isIn([
      "WATER_SUPPLY",
      "ELECTRICITY",
      "ROAD_REPAIR",
      "GARBAGE_COLLECTION",
      "STREET_LIGHTING",
      "SEWERAGE",
      "PUBLIC_HEALTH",
      "TRAFFIC",
      "OTHERS",
    ])
    .withMessage("Invalid type filter"),

  query("wardId")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Ward filter cannot be empty"),

  query("assignedToId")
    .optional()
    .isString()
    .withMessage("Invalid assignedTo filter"),

  query("submittedById")
    .optional()
    .isString()
    .withMessage("Invalid submittedBy filter"),

  query("dateFrom")
    .optional()
    .isISO8601()
    .withMessage("Invalid dateFrom format"),

  query("dateTo").optional().isISO8601().withMessage("Invalid dateTo format"),

  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be between 1 and 100 characters"),

  handleValidationErrors,
];

// Password validation
export const validatePasswordReset = [
  body("token").notEmpty().withMessage("Reset token is required"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),

  handleValidationErrors,
];

export const validatePasswordChange = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),

  handleValidationErrors,
];

// OTP validation
export const validateOTP = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("otpCode")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("OTP must be a 6-digit number"),

  handleValidationErrors,
];

// OTP request validation (for login/registration)
export const validateOTPRequest = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  handleValidationErrors,
];

// Guest validation rules
export const validateOtpRequest = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("purpose")
    .optional()
    .isIn(["complaint_submission"])
    .withMessage("Invalid purpose"),

  handleValidationErrors,
];

export const validateOtpVerification = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("otpCode")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("OTP must be a 6-digit number"),

  body("complaintId").notEmpty().withMessage("Complaint ID is required"),

  handleValidationErrors,
];

export const validateGuestComplaint = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Full name must be between 2 and 100 characters"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("phoneNumber")
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please provide a valid phone number"),

  body("type")
    .isIn([
      "WATER_SUPPLY",
      "ELECTRICITY",
      "ROAD_REPAIR",
      "GARBAGE_COLLECTION",
      "STREET_LIGHTING",
      "SEWERAGE",
      "PUBLIC_HEALTH",
      "TRAFFIC",
      "OTHERS",
    ])
    .withMessage("Invalid complaint type"),

  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .withMessage("Invalid priority"),

  body("wardId").notEmpty().withMessage("Ward is required"),

  body("area")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Area must be between 2 and 200 characters"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),

  body("coordinates.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  body("coordinates.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),

  handleValidationErrors,
];

export const validateComplaintTracking = [
  query("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  query("phoneNumber")
    .optional()
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please provide a valid phone number"),

  handleValidationErrors,
];
