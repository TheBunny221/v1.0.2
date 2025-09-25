// Standardized API response formatter middleware
// Ensures all JSON responses follow: { success: boolean, message: string, data?: any, errorCode?: string }

export const responseFormatter = () => {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    // Helper shortcuts
    res.success = (message = "", data = null, extra = {}) => {
      const payload = { success: true, message, data };
      if (extra && typeof extra === "object") {
        if (extra.errorCode) payload.errorCode = String(extra.errorCode);
        if (extra.meta) payload.meta = extra.meta;
      }
      return originalJson(payload);
    };

    res.fail = (message = "", statusCode = 400, errorCode = "BAD_REQUEST", data = null) => {
      res.status(statusCode);
      return originalJson({ success: false, message, data, errorCode });
    };

    // Patch res.json to normalize any outgoing payloads
    res.json = (body) => {
      try {
        if (body && typeof body === "object" && !Buffer.isBuffer(body)) {
          // If already standardized, ensure required fields exist
          if (typeof body.success === "boolean") {
            if (!("message" in body)) body.message = body.success ? "" : "";
            if (!("data" in body)) body.data = body.success ? null : null;
            return originalJson(body);
          }

          // Swagger specs or non-API responses: pass through for docs endpoint
          const path = (req.originalUrl || req.url || "").toLowerCase();
          const isDocs = path.includes("/api-docs") || path.includes("/api/docs");
          if (isDocs) return originalJson(body);

          // Wrap raw objects/arrays into standardized format as success
          const wrapped = {
            success: true,
            message: typeof body.message === "string" ? body.message : "",
            data: body.data !== undefined ? body.data : body,
          };
          return originalJson(wrapped);
        }
      } catch (e) {
        // If normalization fails, fall back to original body
      }
      return originalJson(body);
    };

    next();
  };
};

export default responseFormatter;
