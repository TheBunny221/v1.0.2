import { asyncHandler } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";

// @desc    Receive logs from frontend
// @route   POST /api/logs
// @access  Public (but rate limited)
export const receiveFrontendLogs = asyncHandler(async (req, res) => {
  const { logs } = req.body;

  if (!Array.isArray(logs)) {
    return res.status(400).json({
      success: false,
      message: "Logs must be an array",
      data: null,
    });
  }

  // Process each log entry
  logs.forEach((logEntry) => {
    try {
      const { timestamp, level, message, meta, url, userAgent } = logEntry;

      // Validate log entry
      if (!timestamp || !level || !message) {
        logger.warn("Invalid log entry received from frontend", {
          module: "log-receiver",
          logEntry,
        });
        return;
      }

      // Add frontend context
      const frontendMeta = {
        ...meta,
        source: "frontend",
        clientUrl: url,
        clientUserAgent: userAgent,
        receivedAt: new Date().toISOString(),
      };

      // Log with appropriate level
      switch (level.toLowerCase()) {
        case "error":
          logger.error(`[FRONTEND] ${message}`, frontendMeta);
          break;
        case "warn":
          logger.warn(`[FRONTEND] ${message}`, frontendMeta);
          break;
        case "info":
          logger.info(`[FRONTEND] ${message}`, frontendMeta);
          break;
        case "debug":
          logger.debug(`[FRONTEND] ${message}`, frontendMeta);
          break;
        default:
          logger.info(`[FRONTEND] ${message}`, frontendMeta);
      }
    } catch (error) {
      logger.error("Error processing frontend log entry", {
        module: "log-receiver",
        error,
        logEntry,
      });
    }
  });

  logger.debug(`Received ${logs.length} log entries from frontend`, {
    module: "log-receiver",
    count: logs.length,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });

  res.status(200).json({
    success: true,
    message: `Processed ${logs.length} log entries`,
    data: { processed: logs.length },
  });
});

// @desc    Get log statistics (admin only)
// @route   GET /api/logs/stats
// @access  Private (Admin)
export const getLogStats = asyncHandler(async (req, res) => {
  // This would require reading log files or maintaining stats in memory/database
  // For now, return basic info
  const stats = {
    logsDirectory: process.env.NODE_ENV === 'production' ? './logs' : 'console-only',
    environment: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL || 'info',
    frontendLoggingEnabled: true,
  };

  logger.info("Log statistics requested", {
    module: "log-stats",
    requestedBy: req.user?.id,
  });

  res.status(200).json({
    success: true,
    message: "Log statistics retrieved",
    data: stats,
  });
});
