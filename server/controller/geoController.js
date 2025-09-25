import { asyncHandler } from "../middleware/errorHandler.js";

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

const buildHeaders = (req) => {
  const ua = `Cochin Smart City/1.0 (${process.env.CONTACT_EMAIL || "support@cochinsmartcity.in"})`;
  return {
    "User-Agent": ua,
    "Accept": "application/json",
    "Accept-Language": req.headers["accept-language"] || "en",
    "Referer": process.env.CLIENT_URL || "http://localhost:3000",
  };
};

export const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lon, zoom = 18 } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ success: false, message: "lat and lon are required", data: null, errorCode: "VALIDATION_ERROR" });
  }
  const url = `${NOMINATIM_BASE}/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&format=json&addressdetails=1&zoom=${encodeURIComponent(String(zoom))}`;
  const response = await fetch(url, { headers: buildHeaders(req) });
  if (!response.ok) {
    return res.status(response.status).json({ success: false, message: `Geocoding failed (${response.status})`, data: null, errorCode: "GEOCODE_FAILED" });
  }
  const data = await response.json();
  return res.json({ success: true, message: "OK", data });
});

export const searchGeocode = asyncHandler(async (req, res) => {
  const { q, limit = 5, viewbox, bounded = 0, countrycodes } = req.query;
  if (!q) {
    return res.status(400).json({ success: false, message: "q is required", data: null, errorCode: "VALIDATION_ERROR" });
  }
  const params = new URLSearchParams({ q: String(q), format: "json", addressdetails: "1", limit: String(limit) });
  if (viewbox) params.set("viewbox", String(viewbox));
  if (bounded) params.set("bounded", String(bounded));
  if (countrycodes) params.set("countrycodes", String(countrycodes));
  const url = `${NOMINATIM_BASE}/search?${params.toString()}`;
  const response = await fetch(url, { headers: buildHeaders(req) });
  if (!response.ok) {
    return res.status(response.status).json({ success: false, message: `Search failed (${response.status})`, data: null, errorCode: "GEOCODE_FAILED" });
  }
  const data = await response.json();
  return res.json({ success: true, message: "OK", data });
});

export default { reverseGeocode, searchGeocode };
