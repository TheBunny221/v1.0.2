import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  CircleMarker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
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
import { MapPin, Navigation, Search } from "lucide-react";
import { useSystemConfig } from "../contexts/SystemConfigContext";

// Fix for default markers in react-leaflet
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

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  area?: string;
  landmark?: string;
}

interface LocationMapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
}

// Component to handle map updates
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);

  return null;
}

// Custom component for map click events
function LocationMarker({
  position,
  onPositionChange,
}: {
  position: [number, number];
  onPositionChange: (position: [number, number]) => void;
}) {
  const map = useMap();
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onPositionChange([lat, lng]);
    },
  });

  return (
    <Marker
      position={position}
      icon={DefaultIcon}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const m = e.target as any;
          const { lat, lng } = m.getLatLng();
          onPositionChange([lat, lng]);
          map.setView([lat, lng], map.getZoom());
        },
      }}
    />
  );
}

const LocationMapDialog: React.FC<LocationMapDialogProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation,
}) => {
  const { getConfig } = useSystemConfig();
  const defaultLat = parseFloat(getConfig("MAP_DEFAULT_LAT", "9.9312")) || 9.9312;
  const defaultLng = parseFloat(getConfig("MAP_DEFAULT_LNG", "76.2673")) || 76.2673;
  const mapPlace = getConfig("MAP_SEARCH_PLACE", "Kochi, Kerala, India");
  const countryCodes = getConfig("MAP_COUNTRY_CODES", "in").trim();
  const bboxNorth = getConfig("MAP_BBOX_NORTH", "10.05");
  const bboxSouth = getConfig("MAP_BBOX_SOUTH", "9.85");
  const bboxEast = getConfig("MAP_BBOX_EAST", "76.39");
  const bboxWest = getConfig("MAP_BBOX_WEST", "76.20");
  const hasBbox = [bboxWest, bboxSouth, bboxEast, bboxNorth].every((v) => v && !Number.isNaN(parseFloat(v)));
  const defaultPosition: [number, number] = [defaultLat, defaultLng];
  const [position, setPosition] = useState<[number, number]>(
    initialLocation
      ? [initialLocation.latitude, initialLocation.longitude]
      : defaultPosition,
  );
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [area, setArea] = useState(initialLocation?.area || "");
  const [landmark, setLandmark] = useState(initialLocation?.landmark || "");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => {
        try {
          mapRef.current?.invalidateSize?.();
        } catch {}
      }, 200);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // On open, populate address/area for initial position (from system-config default or provided initialLocation)
  useEffect(() => {
    if (!isOpen) return;
    reverseGeocode(position);
  }, [isOpen]);

  const getGeoErrorMessage = (err: GeolocationPositionError | any) => {
    const insecure = typeof window !== "undefined" && !window.isSecureContext;
    if (insecure) return "Location requires HTTPS. Please use a secure connection.";
    if (!err || typeof err !== "object") return "Unable to fetch your location.";
    switch (err.code) {
      case 1:
        return "Location permission denied. Enable location access in your browser settings.";
      case 2:
        return "Location unavailable. Please check GPS or network and try again.";
      case 3:
        return "Location request timed out. Try again or move to an open area.";
      default:
        return err.message || "Unable to fetch your location.";
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      if (!("geolocation" in navigator)) {
        setIsLoadingLocation(false);
        alert("Geolocation is not supported by this browser.");
        return;
      }

      try {
        const perm: any = (navigator as any).permissions && (await (navigator as any).permissions.query({ name: "geolocation" } as any));
        if (perm && perm.state === "denied") {
          setIsLoadingLocation(false);
          alert("Location permission denied. Enable it in browser settings.");
          return;
        }
      } catch {}

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newPos: [number, number] = [
            position.coords.latitude,
            position.coords.longitude,
          ];
          setPosition(newPos);
          reverseGeocode(newPos);
          setCurrentLoc({ lat: newPos[0], lng: newPos[1], accuracy: position.coords.accuracy });
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", { code: error?.code, message: error?.message });
          setIsLoadingLocation(false);
          alert(getGeoErrorMessage(error));
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 600000 },
      );
    } catch (e) {
      console.error("Unexpected geolocation error:", e);
      setIsLoadingLocation(false);
      alert("Unable to fetch your location. Try again.");
    }
  };

  // Reverse geocoding to get address from coordinates
  const reverseGeocode = async (coords: [number, number]) => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `/api/geo/reverse?lat=${coords[0]}&lon=${coords[1]}`,
      );
      const data = await response.json();

      if (data && data.display_name) {
        setAddress(data.display_name);

        // Extract area information
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
    } catch (error) {
      console.error("Error in reverse geocoding:", error);
    }
  };

  // Search for a location
  const searchLocation = async () => {
    if (!searchQuery.trim()) return;

    try {
      const viewbox = hasBbox
        ? `&viewbox=${encodeURIComponent(`${bboxWest},${bboxNorth},${bboxEast},${bboxSouth}`)}&bounded=1`
        : "";
      const cc = countryCodes ? `&countrycodes=${encodeURIComponent(countryCodes)}` : "";
      const q = `${searchQuery}, ${mapPlace}`;
      const response = await fetch(
        `/api/geo/search?q=${encodeURIComponent(q)}&limit=1&addressdetails=1${viewbox}${cc}`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newPos: [number, number] = [
          parseFloat(result.lat),
          parseFloat(result.lon),
        ];
        setPosition(newPos);
        setAddress(result.display_name);

        // Extract area information
        const addressComponents = result.address;
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

        // Fly to the new position
        if (mapRef.current) {
          mapRef.current.flyTo(newPos, 16);
        }
      } else {
        alert("Location not found. Please try a different search term.");
      }
    } catch (error) {
      console.error("Error searching location:", error);
      alert("Error searching for location. Please try again.");
    }
  };

  const handlePositionChange = (newPosition: [number, number]) => {
    setPosition(newPosition);
    reverseGeocode(newPosition);
  };

  const handleConfirm = () => {
    onLocationSelect({
      latitude: position[0],
      longitude: position[1],
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
                  placeholder={`Search for a location in ${mapPlace}`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={searchLocation} variant="outline" size="icon" className="shrink-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={getCurrentLocation}
                  variant="outline"
                  disabled={isLoadingLocation}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <Navigation className="h-4 w-4" />
                  {isLoadingLocation ? "Getting..." : "Current Location"}
                </Button>
                <Button
                  onClick={() => {
                    if (!mapRef.current) return;
                    const center = mapRef.current.getCenter();
                    const lat = center.lat;
                    const lng = center.lng;
                    handlePositionChange([lat, lng]);
                  }}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  Drop Pin Here
                </Button>
              </div>
            </div>

            {/* Map */}
            <div className="h-64 sm:h-80 lg:h-96 w-full rounded-lg overflow-hidden border relative">
              <MapContainer
                key={`map-${position[0]}-${position[1]}`}
                center={position}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
                whenCreated={(mapInstance) => {
                  mapRef.current = mapInstance;
                }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapUpdater center={position} />
                <LocationMarker
                  position={position}
                  onPositionChange={handlePositionChange}
                />
                {currentLoc && (
                  <>
                    <CircleMarker center={[currentLoc.lat, currentLoc.lng]} pathOptions={{ color: "#2563eb" }} radius={6} />
                    <Circle center={[currentLoc.lat, currentLoc.lng]} radius={Math.max(10, currentLoc.accuracy || 0)} pathOptions={{ color: "#60a5fa", fillColor: "#93c5fd", fillOpacity: 0.2 }} />
                  </>
                )}
              </MapContainer>
              {/* Center crosshair indicator */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 28 28" className="text-gray-600 opacity-70">
                  <circle cx="14" cy="14" r="4" fill="white" fillOpacity="0.7" />
                  <circle cx="14" cy="14" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  <line x1="14" y1="0" x2="14" y2="6" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="14" y1="22" x2="14" y2="28" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="0" y1="14" x2="6" y2="14" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="22" y1="14" x2="28" y2="14" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            <p className="text-xs text-gray-500">Tip: Click anywhere on the map or drag the pin to refine the exact spot.</p>
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

            {/* Coordinates Display */}
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <strong>Selected coordinates:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 bg-background">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
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

export default LocationMapDialog;
