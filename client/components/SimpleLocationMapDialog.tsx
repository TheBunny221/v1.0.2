import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { MapPin, Navigation, Search, AlertCircle } from "lucide-react";
import { useDetectLocationAreaMutation } from "../store/api/wardApi";
import { detectLocationArea } from "../utils/geoUtils";

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  area?: string;
  landmark?: string;
}

interface SimpleLocationMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
}

const SimpleLocationMapDialog: React.FC<SimpleLocationMapDialogProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation,
}) => {
  // Default to Kochi, India coordinates
  const defaultPosition = { lat: 9.9312, lng: 76.2673 };
  const [position, setPosition] = useState(
    initialLocation
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : defaultPosition,
  );
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [area, setArea] = useState(initialLocation?.area || "");
  const [landmark, setLandmark] = useState(initialLocation?.landmark || "");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapError, setMapError] = useState<string | null>(null);
  const [detectedWard, setDetectedWard] = useState<string>("");
  const [detectedSubZone, setDetectedSubZone] = useState<string>("");
  const [isDetectingArea, setIsDetectingArea] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);

  // API hook for area detection
  const [detectAreaMutation] = useDetectLocationAreaMutation();

  // Initialize map when dialog opens
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    const initializeMap = async () => {
      try {
        // Dynamically import leaflet only when needed
        const L = await import("leaflet");

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
            center: [position.lat, position.lng],
            zoom: 13,
            scrollWheelZoom: true,
          });

          // Add tile layer
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(leafletMapRef.current);

          // Add marker
          const marker = L.marker([position.lat, position.lng], {
            icon: DefaultIcon,
          }).addTo(leafletMapRef.current);

          // Handle map clicks
          leafletMapRef.current.on("click", (e: any) => {
            const { lat, lng } = e.latlng;
            setPosition({ lat, lng });
            marker.setLatLng([lat, lng]);

            // Run both area detection and reverse geocoding
            detectAdministrativeArea({ lat, lng });
            reverseGeocode({ lat, lng });
          });
        }

        setMapError(null);
      } catch (error) {
        console.error("Error initializing map:", error);
        setMapError("Failed to load map. Please refresh and try again.");
      }
    };

    const timer = setTimeout(initializeMap, 100);
    return () => clearTimeout(timer);
  }, [isOpen, position.lat, position.lng]);

  // Cleanup map when dialog closes
  useEffect(() => {
    if (!isOpen && leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }
  }, [isOpen]);

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
          setPosition(newPos);

          // Run both area detection and reverse geocoding
          detectAdministrativeArea(newPos);
          reverseGeocode(newPos);

          // Update map view
          if (leafletMapRef.current) {
            leafletMapRef.current.setView([newPos.lat, newPos.lng], 16);
            // Update marker if it exists
            const markers = Object.values(leafletMapRef.current._layers).filter(
              (layer: any) => layer instanceof L.Marker,
            );
            if (markers.length > 0) {
              (markers[0] as any).setLatLng([newPos.lat, newPos.lng]);
            }
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

  // Detect administrative area based on coordinates
  const detectAdministrativeArea = async (coords: {
    lat: number;
    lng: number;
  }) => {
    try {
      setIsDetectingArea(true);

      // Try API-based detection first
      try {
        const result = await detectAreaMutation({
          latitude: coords.lat,
          longitude: coords.lng,
        }).unwrap();

        if (result.success && result.data) {
          const { exact, nearest } = result.data;

          // Use exact match if available, otherwise use nearest
          const ward = exact.ward || nearest.ward;
          const subZone = exact.subZone || nearest.subZone;

          if (ward) {
            setDetectedWard(ward.name);
            setArea(ward.name);
          }

          if (subZone) {
            setDetectedSubZone(subZone.name);
            // Prefer sub-zone as area if available
            setArea(subZone.name);
          }
        }
      } catch (apiError) {
        console.log("API area detection failed, falling back to geocoding");
      }
    } catch (error) {
      console.error("Error in area detection:", error);
    } finally {
      setIsDetectingArea(false);
    }
  };

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (coords: { lat: number; lng: number }) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&addressdetails=1`,
      );
      const data = await response.json();

      if (data && data.display_name) {
        setAddress(data.display_name);

        // Only use geocoding area if we don't have detected area
        if (!detectedWard && !detectedSubZone) {
          const addressComponents = data.address;
          if (addressComponents) {
            const detectedArea =
              addressComponents.neighbourhood ||
              addressComponents.suburb ||
              addressComponents.city_district ||
              addressComponents.state_district ||
              addressComponents.city ||
              "";
            setArea(detectedArea);
          }
        }
      }
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
    }
  };

  // Search for a location
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery + ", Kochi, Kerala, India")}&format=json&limit=1&addressdetails=1`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newPos = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };
        setPosition(newPos);
        setAddress(result.display_name);

        // Run area detection first
        detectAdministrativeArea(newPos);

        // Extract area information as fallback
        const addressComponents = result.address;
        if (addressComponents && !detectedWard && !detectedSubZone) {
          const detectedArea =
            addressComponents.neighbourhood ||
            addressComponents.suburb ||
            addressComponents.city_district ||
            addressComponents.state_district ||
            addressComponents.city ||
            "";
          setArea(detectedArea);
        }

        // Update map view
        if (leafletMapRef.current) {
          leafletMapRef.current.setView([newPos.lat, newPos.lng], 16);
          // Update marker if it exists
          const markers = Object.values(leafletMapRef.current._layers).filter(
            (layer: any) => layer instanceof L.Marker,
          );
          if (markers.length > 0) {
            (markers[0] as any).setLatLng([newPos.lat, newPos.lng]);
          }
        }
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (error) {
      console.error("Error searching location:", error);
      alert("Error searching for location. Please try again.");
    }
  };

  const handleConfirm = () => {
    onLocationSelect({
      latitude: position.lat,
      longitude: position.lng,
      address: address.trim(),
      area: area.trim(),
      landmark: landmark.trim(),
    });
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchLocation();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Location on Map
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {/* Search and Current Location */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Search for a location in Kochi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={searchLocation}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={getCurrentLocation}
                variant="outline"
                disabled={isLoadingLocation}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                <Navigation className="h-4 w-4" />
                {isLoadingLocation ? "Getting..." : "Current Location"}
              </Button>
            </div>

            {/* Map */}
            <div className="h-64 sm:h-80 lg:h-96 w-full rounded-lg overflow-hidden border relative">
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
                  style={{ minHeight: "256px" }}
                />
              )}
            </div>

            {/* Location Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="detected-area">Detected Area</Label>
                <Input
                  id="detected-area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Area/Locality"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="landmark">Landmark (Optional)</Label>
                <Input
                  id="landmark"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Nearby landmark"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="detected-address">Detected Address</Label>
                <Input
                  id="detected-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address"
                  className="w-full"
                />
              </div>
            </div>

            {/* Area Detection Display */}
            {(detectedWard || detectedSubZone || isDetectingArea) && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    {isDetectingArea
                      ? "Detecting Area..."
                      : "Detected Administrative Area"}
                  </span>
                </div>
                {detectedWard && (
                  <div className="text-sm text-blue-700">
                    <strong>Ward:</strong> {detectedWard}
                  </div>
                )}
                {detectedSubZone && (
                  <div className="text-sm text-blue-700">
                    <strong>Sub-Zone:</strong> {detectedSubZone}
                  </div>
                )}
              </div>
            )}

            {/* Coordinates Display */}
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Selected coordinates:</strong> {position.lat.toFixed(6)},{" "}
              {position.lng.toFixed(6)}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="w-full sm:w-auto">
              Confirm Location
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleLocationMapDialog;
