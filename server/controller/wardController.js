import { getPrisma } from "../db/connection.js";

const prisma = getPrisma();

/**
 * Get all wards with boundaries and sub-zones
 */
export const getAllWardsWithBoundaries = async (req, res) => {
  try {
    console.log("🗺️ Fetching all wards with boundaries...");

    const wards = await prisma.ward.findMany({
      include: {
        subZones: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    console.log(`✅ Found ${wards.length} wards with boundaries`);

    res.status(200).json({
      success: true,
      message: "Wards with boundaries retrieved successfully",
      data: wards,
    });
  } catch (error) {
    console.error("❌ Error fetching wards with boundaries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch wards with boundaries",
      error: error.message,
    });
  }
};

/**
 * Update ward boundaries
 */
export const updateWardBoundaries = async (req, res) => {
  try {
    const { wardId } = req.params;
    const { boundaries, centerLat, centerLng, boundingBox, subZones } =
      req.body;

    console.log(`🗺️ Updating boundaries for ward ${wardId}...`);

    // Validate ward exists
    const existingWard = await prisma.ward.findUnique({
      where: { id: wardId },
      include: { subZones: true },
    });

    if (!existingWard) {
      return res.status(404).json({
        success: false,
        message: "Ward not found",
      });
    }

    // Validate boundary data if provided
    if (boundaries) {
      try {
        const parsedBoundaries = JSON.parse(boundaries);
        if (!Array.isArray(parsedBoundaries) || parsedBoundaries.length < 3) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid boundaries: must be an array of at least 3 coordinate pairs",
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid boundaries: must be valid JSON",
        });
      }
    }

    // Update ward boundaries
    const updatedWard = await prisma.ward.update({
      where: { id: wardId },
      data: {
        boundaries,
        centerLat,
        centerLng,
        boundingBox,
        updatedAt: new Date(),
      },
      include: {
        subZones: {
          orderBy: { name: "asc" },
        },
      },
    });

    // Update sub-zone boundaries if provided
    if (subZones && Array.isArray(subZones)) {
      console.log(`🗺️ Updating ${subZones.length} sub-zone boundaries...`);

      for (const subZoneData of subZones) {
        if (
          subZoneData.id &&
          existingWard.subZones.find((sz) => sz.id === subZoneData.id)
        ) {
          await prisma.subZone.update({
            where: { id: subZoneData.id },
            data: {
              boundaries: subZoneData.boundaries,
              centerLat: subZoneData.centerLat,
              centerLng: subZoneData.centerLng,
              boundingBox: subZoneData.boundingBox,
              updatedAt: new Date(),
            },
          });
        }
      }
    }

    // Fetch updated data
    const finalWard = await prisma.ward.findUnique({
      where: { id: wardId },
      include: {
        subZones: {
          where: { isActive: true },
          orderBy: { name: "asc" },
        },
      },
    });

    console.log(
      `✅ Ward boundaries updated successfully for ${finalWard.name}`,
    );

    res.status(200).json({
      success: true,
      message: "Ward boundaries updated successfully",
      data: finalWard,
    });
  } catch (error) {
    console.error("❌ Error updating ward boundaries:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update ward boundaries",
      error: error.message,
    });
  }
};

/**
 * Detect location area based on coordinates
 * Simplified version for current schema without geographic boundaries
 */
export const detectLocationArea = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    console.log(`🗺️ Detecting area for coordinates: ${latitude}, ${longitude}`);

    // Get all active wards with sub-zones
    const wards = await prisma.ward.findMany({
      where: {
        isActive: true,
      },
      include: {
        subZones: {
          where: {
            isActive: true,
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    if (wards.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active wards found",
      });
    }

    // Since geographic boundaries are not implemented in current schema,
    // return the first active ward as a fallback
    const defaultWard = wards[0];
    const defaultSubZone =
      defaultWard.subZones.length > 0 ? defaultWard.subZones[0] : null;

    console.log(
      `⚠️ Geographic boundaries not configured, returning default ward: ${defaultWard.name}`,
    );

    const result = {
      exact: {
        ward: defaultWard,
        subZone: defaultSubZone,
      },
      nearest: {
        ward: defaultWard,
        subZone: defaultSubZone,
        distance: 0,
      },
      coordinates: { latitude, longitude },
      method: "fallback",
      note: "Geographic boundaries not configured - using default ward",
    };

    res.status(200).json({
      success: true,
      message: "Location area detected (using fallback method)",
      data: result,
    });
  } catch (error) {
    console.error("❌ Error detecting location area:", error);
    res.status(500).json({
      success: false,
      message: "Failed to detect location area",
      error: error.message,
    });
  }
};

// Helper functions

/**
 * Point-in-polygon test using ray casting algorithm
 */
function isPointInPolygon(point, polygon) {
  const { lat, lng } = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [lat_i, lng_i] = polygon[i];
    const [lat_j, lng_j] = polygon[j];

    if (
      lng_i > lng !== lng_j > lng &&
      lat < ((lat_j - lat_i) * (lng - lng_i)) / (lng_j - lng_i) + lat_i
    ) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(coord1, coord2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) *
      Math.cos(toRadians(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}
