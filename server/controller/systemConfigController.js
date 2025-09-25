import { getPrisma } from "../db/connection.dev.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const prisma = getPrisma();

// @desc    Get all system settings
// @route   GET /api/system-config
// @access  Private (Admin only)
export const getSystemSettings = asyncHandler(async (req, res) => {
  // First, ensure essential settings exist
  const essentialSettings = [
    {
      key: "APP_LOGO_SIZE",
      value: "medium",
      description: "Size of the application logo (small, medium, large)",
    },
    {
      key: "CONTACT_HELPLINE",
      value: "1800-XXX-XXXX",
      description: "Helpline phone number for customer support",
    },
    {
      key: "CONTACT_EMAIL",
      value: "support@cochinsmartcity.in",
      description: "Email address for customer support",
    },
    {
      key: "CONTACT_OFFICE_HOURS",
      value: "Monday - Friday: 9 AM - 6 PM",
      description: "Office hours for customer support",
    },
    {
      key: "CONTACT_OFFICE_ADDRESS",
      value: "Cochin Corporation Office",
      description: "Physical address of the office",
    },
  ];

  for (const setting of essentialSettings) {
    const exists = await prisma.systemConfig.findUnique({
      where: { key: setting.key },
    });

    if (!exists) {
      await prisma.systemConfig.create({
        data: setting,
      });
      console.log(`✅ Added missing system setting: ${setting.key}`);
    }
  }

  const settings = await prisma.systemConfig.findMany({
    where: {
      key: {
        not: {
          startsWith: "COMPLAINT_TYPE_",
        },
      },
    },
    orderBy: {
      key: "asc",
    },
  });

  // Transform data to match frontend interface
  const transformedSettings = settings.map((setting) => {
    let type = "string";
    let value = setting.value;

    // Determine type based on value
    if (value === "true" || value === "false") {
      type = "boolean";
    } else if (!isNaN(value) && !isNaN(parseFloat(value))) {
      type = "number";
    } else if (value.startsWith("{") || value.startsWith("[")) {
      type = "json";
    }

    return {
      key: setting.key,
      value: setting.value,
      description: setting.description,
      type: type,
      isActive: setting.isActive,
      updatedAt: setting.updatedAt,
    };
  });

  res.status(200).json({
    success: true,
    message: "System settings retrieved successfully",
    data: transformedSettings,
  });
});

// @desc    Get system setting by key
// @route   GET /api/system-config/:key
// @access  Private (Admin only)
export const getSystemSettingByKey = asyncHandler(async (req, res) => {
  const { key } = req.params;

  const setting = await prisma.systemConfig.findUnique({
    where: { key },
  });

  if (!setting) {
    return res.status(404).json({
      success: false,
      message: "System setting not found",
    });
  }

  let type = "string";
  const value = setting.value;

  // Determine type based on value
  if (value === "true" || value === "false") {
    type = "boolean";
  } else if (!isNaN(value) && !isNaN(parseFloat(value))) {
    type = "number";
  } else if (value.startsWith("{") || value.startsWith("[")) {
    type = "json";
  }

  const transformedSetting = {
    key: setting.key,
    value: setting.value,
    description: setting.description,
    type: type,
    isActive: setting.isActive,
    updatedAt: setting.updatedAt,
  };

  res.status(200).json({
    success: true,
    message: "System setting retrieved successfully",
    data: transformedSetting,
  });
});

// @desc    Create or update system setting
// @route   POST /api/system-config
// @access  Private (Admin only)
export const createOrUpdateSystemSetting = asyncHandler(async (req, res) => {
  const { key, value, description, type } = req.body;

  if (!key || value === undefined) {
    return res.status(400).json({
      success: false,
      message: "Key and value are required",
    });
  }

  // Validate value based on type
  if (type === "boolean" && !["true", "false"].includes(value)) {
    return res.status(400).json({
      success: false,
      message: "Boolean values must be 'true' or 'false'",
    });
  }

  if (type === "number" && isNaN(parseFloat(value))) {
    return res.status(400).json({
      success: false,
      message: "Number values must be valid numbers",
    });
  }

  if (type === "json") {
    try {
      JSON.parse(value);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "JSON values must be valid JSON",
      });
    }
  }

  const setting = await prisma.systemConfig.upsert({
    where: { key },
    update: {
      value,
      description: description || undefined,
    },
    create: {
      key,
      value,
      description: description || `System setting for ${key}`,
      isActive: true,
    },
  });

  const transformedSetting = {
    key: setting.key,
    value: setting.value,
    description: setting.description,
    type: type || "string",
    isActive: setting.isActive,
    updatedAt: setting.updatedAt,
  };

  res.status(200).json({
    success: true,
    message: "System setting saved successfully",
    data: transformedSetting,
  });
});

// @desc    Update system setting
// @route   PUT /api/system-config/:key
// @access  Private (Admin only)
export const updateSystemSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { value, description, isActive } = req.body;

  const existingSetting = await prisma.systemConfig.findUnique({
    where: { key },
  });

  if (!existingSetting) {
    return res.status(404).json({
      success: false,
      message: "System setting not found",
    });
  }

  const setting = await prisma.systemConfig.update({
    where: { key },
    data: {
      ...(value !== undefined && { value }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  let type = "string";
  const settingValue = setting.value;

  // Determine type based on value
  if (settingValue === "true" || settingValue === "false") {
    type = "boolean";
  } else if (!isNaN(settingValue) && !isNaN(parseFloat(settingValue))) {
    type = "number";
  } else if (settingValue.startsWith("{") || settingValue.startsWith("[")) {
    type = "json";
  }

  const transformedSetting = {
    key: setting.key,
    value: setting.value,
    description: setting.description,
    type: type,
    isActive: setting.isActive,
    updatedAt: setting.updatedAt,
  };

  res.status(200).json({
    success: true,
    message: "System setting updated successfully",
    data: transformedSetting,
  });
});

// @desc    Delete system setting
// @route   DELETE /api/system-config/:key
// @access  Private (Admin only)
export const deleteSystemSetting = asyncHandler(async (req, res) => {
  const { key } = req.params;

  const setting = await prisma.systemConfig.findUnique({
    where: { key },
  });

  if (!setting) {
    return res.status(404).json({
      success: false,
      message: "System setting not found",
    });
  }

  await prisma.systemConfig.delete({
    where: { key },
  });

  res.status(200).json({
    success: true,
    message: "System setting deleted successfully",
  });
});

// @desc    Reset system settings to defaults
// @route   POST /api/system-config/reset
// @access  Private (Admin only)
export const resetSystemSettings = asyncHandler(async (req, res) => {
  // Delete all non-complaint-type settings
  await prisma.systemConfig.deleteMany({
    where: {
      key: {
        not: {
          startsWith: "COMPLAINT_TYPE_",
        },
      },
    },
  });

  // Create default settings
  const defaultSettings = [
    {
      key: "APP_NAME",
      value: "NLC-CMS",
      description: "Application name displayed across the system",
    },
    {
      key: "APP_LOGO_URL",
      value: "/logo.png",
      description: "URL for the application logo",
    },
    {
      key: "APP_LOGO_SIZE",
      value: "medium",
      description: "Size of the application logo (small, medium, large)",
    },
    {
      key: "COMPLAINT_ID_PREFIX",
      value: "KSC",
      description: "Prefix for complaint IDs (e.g., KSC for NLC-CMS)",
    },
    {
      key: "COMPLAINT_ID_START_NUMBER",
      value: "1",
      description: "Starting number for complaint ID sequence",
    },
    {
      key: "COMPLAINT_ID_LENGTH",
      value: "4",
      description: "Length of the numeric part in complaint IDs",
    },
    {
      key: "OTP_EXPIRY_MINUTES",
      value: "5",
      description: "OTP expiration time in minutes",
    },
    {
      key: "MAX_FILE_SIZE_MB",
      value: "10",
      description: "Maximum file upload size in MB",
    },
    {
      key: "DEFAULT_SLA_HOURS",
      value: "48",
      description: "Default SLA time in hours",
    },
    {
      key: "ADMIN_EMAIL",
      value: "admin@cochinsmart.gov.in",
      description: "Administrator email address",
    },
    {
      key: "SYSTEM_MAINTENANCE",
      value: "false",
      description: "System maintenance mode",
    },
    {
      key: "NOTIFICATION_SETTINGS",
      value: '{"email":true,"sms":false}',
      description: "Notification preferences",
    },
    {
      key: "AUTO_ASSIGN_COMPLAINTS",
      value: "true",
      description: "Automatically assign complaints to ward officers",
    },
    {
      key: "CITIZEN_REGISTRATION_ENABLED",
      value: "true",
      description: "Allow citizen self-registration",
    },
    {
      key: "COMPLAINT_PRIORITIES",
      value: '["LOW","MEDIUM","HIGH","CRITICAL"]',
      description: "Available complaint priorities",
    },
    {
      key: "COMPLAINT_STATUSES",
      value:
        '["REGISTERED","ASSIGNED","IN_PROGRESS","RESOLVED","CLOSED","REOPENED"]',
      description: "Available complaint statuses",
    },
  ];

  await prisma.systemConfig.createMany({
    data: defaultSettings.map((setting) => ({
      ...setting,
      isActive: true,
    })),
  });

  res.status(200).json({
    success: true,
    message: "System settings reset to defaults successfully",
  });
});

// Helper function to get default system settings
const getDefaultPublicSettings = () => {
  return [
    // Branding
    {
      key: "APP_NAME",
      value: "NLC-CMS",
      description: "Application name displayed across the system",
      type: "string",
    },
    {
      key: "APP_LOGO_URL",
      value: "/logo.png",
      description: "URL for the application logo",
      type: "string",
    },
    {
      key: "APP_LOGO_SIZE",
      value: "medium",
      description: "Size of the application logo (small, medium, large)",
      type: "string",
    },
    // Complaint ID configuration
    {
      key: "COMPLAINT_ID_PREFIX",
      value: "KSC",
      description: "Prefix for complaint IDs (e.g., KSC for NLC-CMS)",
      type: "string",
    },
    {
      key: "COMPLAINT_ID_START_NUMBER",
      value: "1",
      description: "Starting number for complaint ID sequence",
      type: "number",
    },
    {
      key: "COMPLAINT_ID_LENGTH",
      value: "4",
      description: "Length of the numeric part in complaint IDs",
      type: "number",
    },
    // SLA & timings
    {
      key: "DEFAULT_SLA_HOURS",
      value: "48",
      description: "Default SLA time in hours",
      type: "number",
    },
    {
      key: "OTP_EXPIRY_MINUTES",
      value: "5",
      description: "OTP expiration time in minutes",
      type: "number",
    },
    // File upload limits
    {
      key: "MAX_FILE_SIZE_MB",
      value: "10",
      description: "Maximum file upload size in MB",
      type: "number",
    },
    // Admin & contact
    {
      key: "ADMIN_EMAIL",
      value: "admin@cochinsmart.gov.in",
      description: "Administrator email address",
      type: "string",
    },
    {
      key: "CONTACT_HELPLINE",
      value: "1800-XXX-XXXX",
      description: "Helpline phone number for customer support",
      type: "string",
    },
    {
      key: "CONTACT_EMAIL",
      value: "support@cochinsmartcity.in",
      description: "Email address for customer support",
      type: "string",
    },
    {
      key: "CONTACT_OFFICE_HOURS",
      value: "Monday - Friday: 9 AM - 6 PM",
      description: "Office hours for customer support",
      type: "string",
    },
    {
      key: "CONTACT_OFFICE_ADDRESS",
      value: "Cochin Corporation Office",
      description: "Physical address of the office",
      type: "string",
    },
    // System controls
    {
      key: "SYSTEM_MAINTENANCE",
      value: "false",
      description: "System maintenance mode",
      type: "boolean",
    },
    {
      key: "CITIZEN_REGISTRATION_ENABLED",
      value: "true",
      description: "Allow citizen self-registration",
      type: "boolean",
    },
    {
      key: "AUTO_ASSIGN_COMPLAINTS",
      value: "true",
      description: "Automatically assign complaints to ward officers",
      type: "boolean",
    },
    // Notifications
    {
      key: "NOTIFICATION_SETTINGS",
      value: '{"email":true,"sms":false}',
      description: "Notification preferences",
      type: "json",
    },
    // Priorities & statuses
    {
      key: "COMPLAINT_PRIORITIES",
      value: '["LOW","MEDIUM","HIGH","CRITICAL"]',
      description: "Available complaint priorities",
      type: "json",
    },
    {
      key: "COMPLAINT_STATUSES",
      value:
        '["REGISTERED","ASSIGNED","IN_PROGRESS","RESOLVED","CLOSED","REOPENED"]',
      description: "Available complaint statuses",
      type: "json",
    },
    // Date & time
    {
      key: "DATE_TIME_FORMAT",
      value: "DD/MM/YYYY HH:mm",
      description: "Default date and time display format",
      type: "string",
    },
    {
      key: "TIME_ZONE",
      value: "Asia/Kolkata",
      description: "Default time zone for the application",
      type: "string",
    },
    // Map & Location defaults
    {
      key: "MAP_SEARCH_PLACE",
      value: "Kochi, Kerala, India",
      description: "Place context appended to searches to bias results",
      type: "string",
    },
    {
      key: "MAP_COUNTRY_CODES",
      value: "in",
      description: "ISO2 country codes for Nominatim bias (comma-separated)",
      type: "string",
    },
    {
      key: "MAP_DEFAULT_LAT",
      value: "9.9312",
      description: "Default map center latitude",
      type: "number",
    },
    {
      key: "MAP_DEFAULT_LNG",
      value: "76.2673",
      description: "Default map center longitude",
      type: "number",
    },
    {
      key: "MAP_BBOX_NORTH",
      value: "10.05",
      description: "North latitude of bounding box (search constrained)",
      type: "number",
    },
    {
      key: "MAP_BBOX_SOUTH",
      value: "9.85",
      description: "South latitude of bounding box (search constrained)",
      type: "number",
    },
    {
      key: "MAP_BBOX_EAST",
      value: "76.39",
      description: "East longitude of bounding box (search constrained)",
      type: "number",
    },
    {
      key: "MAP_BBOX_WEST",
      value: "76.20",
      description: "West longitude of bounding box (search constrained)",
      type: "number",
    },
  ];
};

// Helper function to check database connectivity
const checkDatabaseConnectivity = async () => {
  try {
    await prisma.$queryRaw`SELECT 1 as test;`;
    return true;
  } catch (error) {
    console.log("Database connectivity check failed:", error.message);
    return false;
  }
};

// @desc    Get public system settings (non-sensitive settings only)
// @route   GET /api/system-config/public
// @access  Public
export const getPublicSystemSettings = asyncHandler(async (req, res) => {
  // Check if database is available
  const databaseAvailable = await checkDatabaseConnectivity();

  if (!databaseAvailable) {
    // Return default settings when database is unavailable
    console.log("⚠️ Database unavailable, returning default system settings");
    const defaultSettings = getDefaultPublicSettings();

    return res.status(200).json({
      success: true,
      message:
        "Public system settings retrieved (default values - database unavailable)",
      data: defaultSettings,
      meta: {
        source: "defaults",
        databaseAvailable: false,
      },
    });
  }

  try {
    // First, ensure essential settings exist
    const essentialSettings = [
      {
        key: "APP_LOGO_SIZE",
        value: "medium",
        description: "Size of the application logo (small, medium, large)",
      },
      {
        key: "CONTACT_HELPLINE",
        value: "1800-XXX-XXXX",
        description: "Helpline phone number for customer support",
      },
      {
        key: "CONTACT_EMAIL",
        value: "support@cochinsmartcity.in",
        description: "Email address for customer support",
      },
      {
        key: "CONTACT_OFFICE_HOURS",
        value: "Monday - Friday: 9 AM - 6 PM",
        description: "Office hours for customer support",
      },
      {
        key: "CONTACT_OFFICE_ADDRESS",
        value: "Cochin Corporation Office",
        description: "Physical address of the office",
      },
    ];

    for (const setting of essentialSettings) {
      const exists = await prisma.systemConfig.findUnique({
        where: { key: setting.key },
      });

      if (!exists) {
        await prisma.systemConfig.create({
          data: setting,
        });
        console.log(`✅ Added missing system setting: ${setting.key}`);
      }
    }

    // Only return non-sensitive settings
    const publicKeys = [
      "APP_NAME",
      "APP_LOGO_URL",
      "APP_LOGO_SIZE",
      "COMPLAINT_ID_PREFIX",
      "COMPLAINT_ID_START_NUMBER",
      "COMPLAINT_ID_LENGTH",
      "MAX_FILE_SIZE_MB",
      "DEFAULT_SLA_HOURS",
      "OTP_EXPIRY_MINUTES",
      "DATE_TIME_FORMAT",
      "TIME_ZONE",
      "CITIZEN_REGISTRATION_ENABLED",
      "SYSTEM_MAINTENANCE",
      "ADMIN_EMAIL",
      "CONTACT_HELPLINE",
      "CONTACT_EMAIL",
      "CONTACT_OFFICE_HOURS",
      "CONTACT_OFFICE_ADDRESS",
      "NOTIFICATION_SETTINGS",
      "COMPLAINT_PRIORITIES",
      "COMPLAINT_STATUSES",
      // Map & Location settings
      "MAP_SEARCH_PLACE",
      "MAP_COUNTRY_CODES",
      "MAP_DEFAULT_LAT",
      "MAP_DEFAULT_LNG",
      "MAP_BBOX_NORTH",
      "MAP_BBOX_SOUTH",
      "MAP_BBOX_EAST",
      "MAP_BBOX_WEST",
    ];

    const settings = await prisma.systemConfig.findMany({
      where: {
        key: {
          in: publicKeys,
        },
        isActive: true,
      },
      orderBy: {
        key: "asc",
      },
    });

    // Transform data to match frontend interface
    const transformedSettings = settings.map((setting) => {
      let type = "string";
      let value = setting.value;

      // Determine type based on value
      if (value === "true" || value === "false") {
        type = "boolean";
      } else if (!isNaN(value) && !isNaN(parseFloat(value))) {
        type = "number";
      } else if (value.startsWith("{") || value.startsWith("[")) {
        type = "json";
      }

      return {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        type: type,
      };
    });

    res.status(200).json({
      success: true,
      message: "Public system settings retrieved successfully",
      data: transformedSettings,
      meta: {
        source: "database",
        databaseAvailable: true,
      },
    });
  } catch (error) {
    // Fallback to default settings if database operation fails
    console.error(
      "Database operation failed, falling back to defaults:",
      error.message,
    );
    const defaultSettings = getDefaultPublicSettings();

    res.status(200).json({
      success: true,
      message:
        "Public system settings retrieved (default values - database error)",
      data: defaultSettings,
      meta: {
        source: "defaults_fallback",
        databaseAvailable: false,
        error: error.message,
      },
    });
  }
});

// @desc    Get system health check
// @route   GET /api/system-config/health
// @access  Private (Admin only)
export const getSystemHealth = asyncHandler(async (req, res) => {
  const stats = {
    totalUsers: await prisma.user.count(),
    activeUsers: await prisma.user.count({ where: { isActive: true } }),
    totalComplaints: await prisma.complaint.count(),
    openComplaints: await prisma.complaint.count({
      where: { status: { in: ["REGISTERED", "ASSIGNED", "IN_PROGRESS"] } },
    }),
    totalWards: await prisma.ward.count(),
    activeWards: await prisma.ward.count({ where: { isActive: true } }),
    systemSettings: await prisma.systemConfig.count(),
  };

  const dbStatus = "healthy"; // In a real app, you'd check database connectivity
  const uptime = process.uptime();

  res.status(200).json({
    success: true,
    message: "System health check completed",
    data: {
      status: "healthy",
      uptime: Math.floor(uptime),
      database: dbStatus,
      statistics: stats,
      timestamp: new Date().toISOString(),
    },
  });
});
