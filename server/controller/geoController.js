import { asyncHandler } from "../middleware/errorHandler.js";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

// Simple in-memory cache and throttling to respect Nominatim usage policy
const cache = new Map();
const setCache = (key, value, ttlMs = 5 * 60 * 1000) => {
  cache.set(key, { value, expires: Date.now() + ttlMs });
};
const getCache = (key) => {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    cache.delete(key);
    return null;
  }
  return hit.value;
};

let lastExternalCallAt = 0;
const respectGlobalRateLimit = async () => {
  const minInterval = 1100; // 1.1s between calls
  const now = Date.now();
  const waitMs = lastExternalCallAt + minInterval - now;
  if (waitMs > 0) {
    await new Promise((r) => setTimeout(r, waitMs));
  }
  lastExternalCallAt = Date.now();
};

const buildHeaders = (req) => {
  const ua = `NLC-CMS/1.0 (${process.env.CONTACT_EMAIL || "support@cochinsmartcity.in"})`;
  return {
    "User-Agent": ua,
    Accept: "application/json",
    "Accept-Language": req.headers["accept-language"] || "en",
    Referer: process.env.CLIENT_URL || "http://localhost:3000",
  };
};

export const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lon, zoom = 18 } = req.query;
  if (!lat || !lon) {
    return res
      .status(400)
      .json({
        success: false,
        message: "lat and lon are required",
        data: null,
        errorCode: "VALIDATION_ERROR",
      });
  }
  const latR = Number(lat).toFixed(5); // ~1m precision for cache key
  const lonR = Number(lon).toFixed(5);
  const cacheKey = `rev:${latR},${lonR},${zoom}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json({ success: true, message: "OK", data: cached });

  await respectGlobalRateLimit();
  const url = `${NOMINATIM_BASE}/reverse?lat=${encodeURIComponent(latR)}&lon=${encodeURIComponent(lonR)}&format=json&addressdetails=1&zoom=${encodeURIComponent(String(zoom))}`;
  const response = await fetch(url, { headers: buildHeaders(req) });
  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    const msg =
      response.status === 429
        ? `Geocoding is rate-limited. Please try again in ${retryAfter || "a few"} seconds.`
        : `Geocoding failed (${response.status})`;
    return res
      .status(response.status)
      .json({
        success: false,
        message: msg,
        data: { retryAfter },
        errorCode:
          response.status === 429 ? "GEOCODE_RATE_LIMIT" : "GEOCODE_FAILED",
      });
  }
  const data = await response.json();
  setCache(cacheKey, data);
  return res.json({ success: true, message: "OK", data });
});

export const searchGeocode = asyncHandler(async (req, res) => {
  const { q, limit = 5, viewbox, bounded = 0, countrycodes } = req.query;
  if (!q) {
    return res
      .status(400)
      .json({
        success: false,
        message: "q is required",
        data: null,
        errorCode: "VALIDATION_ERROR",
      });
  }
  const params = new URLSearchParams({
    q: String(q),
    format: "json",
    addressdetails: "1",
    limit: String(limit),
  });
  if (viewbox) params.set("viewbox", String(viewbox));
  if (bounded) params.set("bounded", String(bounded));
  if (countrycodes) params.set("countrycodes", String(countrycodes));
  const cacheKey = `srch:${params.toString()}`;
  const cached = getCache(cacheKey);
  if (cached) return res.json({ success: true, message: "OK", data: cached });

  await respectGlobalRateLimit();
  const url = `${NOMINATIM_BASE}/search?${params.toString()}`;
  const response = await fetch(url, { headers: buildHeaders(req) });
  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    const msg =
      response.status === 429
        ? `Geocoding is rate-limited. Please try again in ${retryAfter || "a few"} seconds.`
        : `Search failed (${response.status})`;
    return res
      .status(response.status)
      .json({
        success: false,
        message: msg,
        data: { retryAfter },
        errorCode:
          response.status === 429 ? "GEOCODE_RATE_LIMIT" : "GEOCODE_FAILED",
      });
  }
  const data = await response.json();
  setCache(cacheKey, data);
  return res.json({ success: true, message: "OK", data });
});

export default { reverseGeocode, searchGeocode };
