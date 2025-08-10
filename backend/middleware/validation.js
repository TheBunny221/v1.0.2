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
export const validateUserRegistration = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("phone")
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please provide a valid phone number"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),

  body("role")
    .optional()
    .isIn(["citizen", "admin", "ward-officer", "maintenance"])
    .withMessage("Invalid role"),

  handleValidationErrors,
];

export const validateUserLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("password").notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

export const validateUserUpdate = [
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
      "Water Supply",
      "Electricity",
      "Road Repair",
      "Garbage Collection",
      "Street Lighting",
      "Sewerage",
      "Public Health",
      "Traffic",
      "Others",
    ])
    .withMessage("Invalid complaint type"),

  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("contactInfo.mobile")
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please provide a valid mobile number"),

  body("contactInfo.email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("location.ward").notEmpty().withMessage("Ward is required"),

  body("location.area")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Area must be between 2 and 200 characters"),

  body("location.address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),

  body("location.coordinates.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  body("location.coordinates.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),

  handleValidationErrors,
];

export const validateComplaintUpdate = [
  body("status")
    .optional()
    .isIn([
      "registered",
      "assigned",
      "in-progress",
      "resolved",
      "closed",
      "reopened",
    ])
    .withMessage("Invalid status"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Invalid priority"),

  body("assignedTo").optional().isMongoId().withMessage("Invalid user ID"),

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

export const validateComplaintFilters = [
  query("status")
    .optional()
    .isIn([
      "registered",
      "assigned",
      "in-progress",
      "resolved",
      "closed",
      "reopened",
    ])
    .withMessage("Invalid status filter"),

  query("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Invalid priority filter"),

  query("type")
    .optional()
    .isIn([
      "Water Supply",
      "Electricity",
      "Road Repair",
      "Garbage Collection",
      "Street Lighting",
      "Sewerage",
      "Public Health",
      "Traffic",
      "Others",
    ])
    .withMessage("Invalid type filter"),

  query("ward")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Ward filter cannot be empty"),

  query("assignedTo")
    .optional()
    .isMongoId()
    .withMessage("Invalid assignedTo filter"),

  query("dateFrom")
    .optional()
    .isISO8601()
    .withMessage("Invalid dateFrom format"),

  query("dateTo").optional().isISO8601().withMessage("Invalid dateTo format"),

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
  body("sessionId").notEmpty().withMessage("Session ID is required"),

  body("otp")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("OTP must be a 6-digit number"),

  handleValidationErrors,
];

export const validateGuestComplaint = [
  body("type")
    .isIn([
      "Water_Supply",
      "Electricity",
      "Road_Repair",
      "Garbage_Collection",
      "Street_Lighting",
      "Sewerage",
      "Public_Health",
      "Traffic",
      "Others",
    ])
    .withMessage("Invalid complaint type"),

  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("contactMobile")
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please provide a valid mobile number"),

  body("contactEmail")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("ward").notEmpty().withMessage("Ward is required"),

  body("area")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Area must be between 2 and 200 characters"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),

  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude"),

  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude"),

  body("guestVerificationToken")
    .notEmpty()
    .withMessage("Verification token is required"),

  handleValidationErrors,
];

export const validateComplaintTracking = [
  body("complaintId").notEmpty().withMessage("Complaint ID is required"),

  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),

  body("mobile")
    .matches(/^\+?[\d\s-()]{10,}$/)
    .withMessage("Please provide a valid mobile number"),

  handleValidationErrors,
];
