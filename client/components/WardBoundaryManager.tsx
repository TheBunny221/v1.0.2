import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Alert, AlertDescription } from "./ui/alert";
import {
  MapPin,
  Navigation,
  Save,
  Trash2,
  Info,
  RotateCcw,
  Square,
  AlertCircle,
} from "lucide-react";

interface Ward {
  id: string;
  name: string;
  description?: string;
  boundaries?: string;
  centerLat?: number;
  centerLng?: number;
  boundingBox?: string;
}

interface SubZone {
  id: string;
  name: string;
  wardId: string;
  description?: string;
  boundaries?: string;
  centerLat?: number;
  centerLng?: number;
  boundingBox?: string;
}

interface WardBoundaryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  ward: Ward;
  subZones?: SubZone[];
  onSave: (wardData: Ward, subZoneData?: SubZone[]) => void;
}

const WardBoundaryManager: React.FC<WardBoundaryManagerProps> = ({
  isOpen,
  onClose,
  ward,
  subZones = [],
  onSave,
}) => {
  // Default to Kochi, India coordinates
  const defaultCenter = { lat: 9.9312, lng: 76.2673 };
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const drawingRef = useRef<any>(null);

  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [wardBoundary, setWardBoundary] = useState<any[]>([]);
  const [subZoneBoundaries, setSubZoneBoundaries] = useState<{
    [key: string]: any[];
  }>({});
  const [editingMode, setEditingMode] = useState<"ward" | "subzone" | null>(
    null,
  );
  const [selectedSubZone, setSelectedSubZone] = useState<string | null>(null);
  const [centerCoordinates, setCenterCoordinates] = useState(
    ward.centerLat && ward.centerLng
      ? { lat: ward.centerLat, lng: ward.centerLng }
      : defaultCenter,
  );

  // Initialize map when dialog opens
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    const initializeMap = async () => {
      try {
        // Dynamically import leaflet and plugins
        const L = await import("leaflet");

        // Import leaflet-draw with error handling
        try {
          await import("leaflet-draw");
        } catch (drawError) {
          console.warn(
            "Leaflet-draw failed to load, drawing features may be limited:",
            drawError,
          );
        }

        // Set up the default icon
        const DefaultIcon = L.icon({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        // Create map if it doesn't exist
        if (!leafletMapRef.current && mapRef.current) {
          leafletMapRef.current = new L.Map(mapRef.current, {
            center: [centerCoordinates.lat, centerCoordinates.lng],
            zoom: 13,
            scrollWheelZoom: true,
            preferCanvas: true,
          });

          // Add tile layer
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(leafletMapRef.current);

          // Create feature groups for drawn layers
          const drawnItems = new L.FeatureGroup();
          leafletMapRef.current.addLayer(drawnItems);

          // Add drawing controls
          const drawControl = new (L as any).Control.Draw({
            position: "topright",
            draw: {
              polygon: {
                allowIntersection: false,
                drawError: {
                  color: "#e1e100",
                  message: "<strong>Error:</strong> Shape edges cannot cross!",
                },
                shapeOptions: {
                  color: "#2563eb",
                  weight: 3,
                  opacity: 0.8,
                  fillOpacity: 0.2,
                },
              },
              rectangle: {
                shapeOptions: {
                  color: "#dc2626",
                  weight: 3,
                  opacity: 0.8,
                  fillOpacity: 0.2,
                },
              },
              circle: false,
              marker: false,
              polyline: false,
              circlemarker: false,
            },
            edit: {
              featureGroup: drawnItems,
              remove: true,
            },
          });

          leafletMapRef.current.addControl(drawControl);
          drawingRef.current = { drawnItems, drawControl };

          // Handle drawing events
          leafletMapRef.current.on((L as any).Draw.Event.CREATED, (e: any) => {
            const { layer, layerType } = e;

            if (editingMode === "ward") {
              // Clear existing ward boundary
              setWardBoundary([]);
              drawnItems.clearLayers();

              drawnItems.addLayer(layer);

              if (layerType === "polygon" || layerType === "rectangle") {
                const coords = layer
                  .getLatLngs()[0]
                  .map((latlng: any) => [latlng.lat, latlng.lng]);
                setWardBoundary(coords);

                // Calculate center
                const center = calculatePolygonCenter(coords);
                setCenterCoordinates(center);
              }
            } else if (editingMode === "subzone" && selectedSubZone) {
              // Clear existing subzone boundary for this subzone
              const newBoundaries = { ...subZoneBoundaries };
              delete newBoundaries[selectedSubZone];
              setSubZoneBoundaries(newBoundaries);

              drawnItems.addLayer(layer);

              if (layerType === "polygon" || layerType === "rectangle") {
                const coords = layer
                  .getLatLngs()[0]
                  .map((latlng: any) => [latlng.lat, latlng.lng]);
                setSubZoneBoundaries((prev) => ({
                  ...prev,
                  [selectedSubZone]: coords,
                }));
              }
            }
          });

          // Load existing boundaries
          loadExistingBoundaries(L, drawnItems);
        }

        setMapError(null);
      } catch (error) {
        console.error("Error initializing map:", error);
        setMapError("Failed to load map. Please refresh and try again.");
      }
    };

    const timer = setTimeout(initializeMap, 100);
    return () => clearTimeout(timer);
  }, [
    isOpen,
    centerCoordinates.lat,
    centerCoordinates.lng,
    editingMode,
    selectedSubZone,
  ]);

  // Load existing boundaries from ward and subzones data
  const loadExistingBoundaries = async (L: any, drawnItems: any) => {
    try {
      // Load ward boundary
      if (ward.boundaries) {
        const coords = JSON.parse(ward.boundaries);
        setWardBoundary(coords);

        if (coords.length > 0) {
          const polygon = L.polygon(coords, {
            color: "#2563eb",
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.2,
          });
          drawnItems.addLayer(polygon);
        }
      }

      // Load subzone boundaries
      const loadedSubZoneBoundaries: { [key: string]: any[] } = {};
      for (const subZone of subZones) {
        if (subZone.boundaries) {
          const coords = JSON.parse(subZone.boundaries);
          loadedSubZoneBoundaries[subZone.id] = coords;

          if (coords.length > 0) {
            const polygon = L.polygon(coords, {
              color: "#dc2626",
              weight: 2,
              opacity: 0.8,
              fillOpacity: 0.1,
            });
            drawnItems.addLayer(polygon);
          }
        }
      }
      setSubZoneBoundaries(loadedSubZoneBoundaries);
    } catch (error) {
      console.error("Error loading existing boundaries:", error);
    }
  };

  // Calculate polygon center point
  const calculatePolygonCenter = (
    coords: [number, number][],
  ): { lat: number; lng: number } => {
    const latSum = coords.reduce((sum, coord) => sum + coord[0], 0);
    const lngSum = coords.reduce((sum, coord) => sum + coord[1], 0);
    return {
      lat: latSum / coords.length,
      lng: lngSum / coords.length,
    };
  };

  // Calculate bounding box for polygon
  const calculateBoundingBox = (
    coords: [number, number][],
  ): { north: number; south: number; east: number; west: number } => {
    const lats = coords.map((coord) => coord[0]);
    const lngs = coords.map((coord) => coord[1]);

    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs),
    };
  };

  // Get current location
  const getCurrentLocation = useCallback(() => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setCenterCoordinates(newPos);

          // Update map view
          if (leafletMapRef.current) {
            leafletMapRef.current.setView([newPos.lat, newPos.lng], 14);
          }

          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoadingLocation(false);
          alert(
            "Could not get your location. Please ensure location access is enabled.",
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 },
      );
    } else {
      setIsLoadingLocation(false);
      alert("Geolocation is not supported by this browser.");
    }
  }, []);

  // Clear all boundaries
  const clearBoundaries = () => {
    if (drawingRef.current?.drawnItems) {
      drawingRef.current.drawnItems.clearLayers();
    }
    setWardBoundary([]);
    setSubZoneBoundaries({});
    setEditingMode(null);
    setSelectedSubZone(null);
  };

  // Save boundaries
  const handleSave = () => {
    const updatedWard: Ward = {
      ...ward,
      boundaries:
        wardBoundary.length > 0 ? JSON.stringify(wardBoundary) : undefined,
      centerLat: centerCoordinates.lat,
      centerLng: centerCoordinates.lng,
      boundingBox:
        wardBoundary.length > 0
          ? JSON.stringify(calculateBoundingBox(wardBoundary))
          : undefined,
    };

    const updatedSubZones: SubZone[] = subZones.map((subZone) => {
      const boundaries = subZoneBoundaries[subZone.id];
      return {
        ...subZone,
        boundaries:
          boundaries && boundaries.length > 0
            ? JSON.stringify(boundaries)
            : undefined,
        centerLat:
          boundaries && boundaries.length > 0
            ? calculatePolygonCenter(boundaries).lat
            : undefined,
        centerLng:
          boundaries && boundaries.length > 0
            ? calculatePolygonCenter(boundaries).lng
            : undefined,
        boundingBox:
          boundaries && boundaries.length > 0
            ? JSON.stringify(calculateBoundingBox(boundaries))
            : undefined,
      };
    });

    onSave(updatedWard, updatedSubZones);
  };

  // Cleanup map when dialog closes
  useEffect(() => {
    if (!isOpen && leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
      drawingRef.current = null;
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Set Geographic Boundaries - {ward.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex">
          {/* Controls Sidebar */}
          <div className="w-80 p-4 border-r bg-gray-50 overflow-y-auto">
            <div className="space-y-4">
              {/* Instructions */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Use the drawing tools on the map to define geographic
                  boundaries for wards and sub-zones.
                </AlertDescription>
              </Alert>

              {/* Ward Boundary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Ward Boundary</Label>
                  <Badge
                    variant={wardBoundary.length > 0 ? "default" : "secondary"}
                  >
                    {wardBoundary.length > 0 ? "Set" : "Not Set"}
                  </Badge>
                </div>

                <Button
                  onClick={() => {
                    setEditingMode("ward");
                    setSelectedSubZone(null);
                  }}
                  variant={editingMode === "ward" ? "default" : "outline"}
                  className="w-full"
                >
                  <Square className="h-4 w-4 mr-2" />
                  {editingMode === "ward"
                    ? "Drawing Ward..."
                    : "Set Ward Boundary"}
                </Button>

                {wardBoundary.length > 0 && (
                  <div className="text-xs text-gray-600 bg-white p-2 rounded">
                    <div>Points: {wardBoundary.length}</div>
                    <div>
                      Center: {centerCoordinates.lat.toFixed(4)},{" "}
                      {centerCoordinates.lng.toFixed(4)}
                    </div>
                  </div>
                )}
              </div>

              {/* Sub-Zone Boundaries */}
              <div className="space-y-3">
                <Label className="font-medium">Sub-Zone Boundaries</Label>

                {subZones.map((subZone) => (
                  <div key={subZone.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {subZone.name}
                      </span>
                      <Badge
                        variant={
                          subZoneBoundaries[subZone.id]
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {subZoneBoundaries[subZone.id] ? "Set" : "Not Set"}
                      </Badge>
                    </div>

                    <Button
                      onClick={() => {
                        setEditingMode("subzone");
                        setSelectedSubZone(subZone.id);
                      }}
                      variant={
                        editingMode === "subzone" &&
                        selectedSubZone === subZone.id
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="w-full"
                    >
                      <Square className="h-3 w-3 mr-2" />
                      {editingMode === "subzone" &&
                      selectedSubZone === subZone.id
                        ? "Drawing..."
                        : "Set Boundary"}
                    </Button>

                    {subZoneBoundaries[subZone.id] && (
                      <div className="text-xs text-gray-600 bg-white p-2 rounded">
                        Points: {subZoneBoundaries[subZone.id].length}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className="space-y-2 pt-4 border-t">
                <Button
                  onClick={getCurrentLocation}
                  variant="outline"
                  disabled={isLoadingLocation}
                  className="w-full"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  {isLoadingLocation ? "Getting..." : "Center on Location"}
                </Button>

                <Button
                  onClick={clearBoundaries}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>

              {/* Current Mode */}
              {editingMode && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Drawing Mode:</strong>{" "}
                    {editingMode === "ward"
                      ? "Ward Boundary"
                      : `Sub-Zone: ${subZones.find((z) => z.id === selectedSubZone)?.name}`}
                    <br />
                    Click on the map to start drawing a polygon.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            {mapError ? (
              <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-4">
                  <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-600 text-sm">{mapError}</p>
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Refresh Page
                  </Button>
                </div>
              </div>
            ) : (
              <div
                ref={mapRef}
                className="h-full w-full"
                style={{ minHeight: "500px" }}
              />
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
          <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Boundaries
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WardBoundaryManager;
