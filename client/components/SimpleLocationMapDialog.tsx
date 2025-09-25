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
import { useSystemConfig } from "../contexts/SystemConfigContext";
import { toast } from "../hooks/use-toast";

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
  const { getConfig, isLoading: configLoading } = useSystemConfig();
  
  // Kochi coordinates and boundaries
  const KOCHI_DEFAULT_LAT = 9.9312;
  const KOCHI_DEFAULT_LNG = 76.2673;
  const KOCHI_BBOX = {
    north: 10.05,
    south: 9.85,
    east: 76.39,
    west: 76.20
  };
  
  const defaultLat = parseFloat(getConfig("MAP_DEFAULT_LAT", KOCHI_DEFAULT_LAT.toString())) || KOCHI_DEFAULT_LAT;
  const defaultLng = parseFloat(getConfig("MAP_DEFAULT_LNG", KOCHI_DEFAULT_LNG.toString())) || KOCHI_DEFAULT_LNG;
  const mapPlace = getConfig("MAP_SEARCH_PLACE", "Kochi, Kerala, India");
  const countryCodes = getConfig("MAP_COUNTRY_CODES", "in").trim();
  const bboxNorth = parseFloat(getConfig("MAP_BBOX_NORTH", KOCHI_BBOX.north.toString())) || KOCHI_BBOX.north;
  const bboxSouth = parseFloat(getConfig("MAP_BBOX_SOUTH", KOCHI_BBOX.south.toString())) || KOCHI_BBOX.south;
  const bboxEast = parseFloat(getConfig("MAP_BBOX_EAST", KOCHI_BBOX.east.toString())) || KOCHI_BBOX.east;
  const bboxWest = parseFloat(getConfig("MAP_BBOX_WEST", KOCHI_BBOX.west.toString())) || KOCHI_BBOX.west;
  const hasBbox = true; // Always use Kochi boundaries
  const defaultPosition = { lat: defaultLat, lng: defaultLng };
  const [position, setPosition] = useState(
    initialLocation
      ? { lat: initialLocation.latitude, lng: initialLocation.longitude }
      : defaultPosition,
  );
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapReloadKey, setMapReloadKey] = useState(0);
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [area, setArea] = useState(initialLocation?.area || "");
  const [landmark, setLandmark] = useState(initialLocation?.landmark || "");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapError, setMapError] = useState<string | null>(null);
  const [detectedWard, setDetectedWard] = useState<string>("");
  const [detectedSubZone, setDetectedSubZone] = useState<string>("");
  const [isDetectingArea, setIsDetectingArea] = useState(false);
  // Track latest detection request to avoid race conditions
  const detectionSeqRef = useRef(0);
  const [areaSource, setAreaSource] = useState<"api" | "geocode" | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const leafletLibRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // API hook for area detection
  const [detectAreaMutation] = useDetectLocationAreaMutation();

  // Boundary validation function
  const isWithinKochiBoundary = useCallback((lat: number, lng: number): boolean => {
    return lat >= bboxSouth && lat <= bboxNorth && lng >= bboxWest && lng <= bboxEast;
  }, [bboxSouth, bboxNorth, bboxWest, bboxEast]);

  // Show boundary error message
  const showBoundaryError = useCallback((action: string) => {
    const message = `${action} is outside Kochi service area. Please select a location within Kochi.`;
    setMapError(message);
    toast({
      title: "Location Outside Service Area",
      description: message,
      variant: "destructive",
    });
  }, []);

  // Validate and set position with boundary check
  const setPositionWithValidation = useCallback((newPos: { lat: number; lng: number }, action: string = "Selected location") => {
    if (!isWithinKochiBoundary(newPos.lat, newPos.lng)) {
      showBoundaryError(action);
      return false;
    }
    setPosition(newPos);
    // Clear previous detected data to avoid stale display
    setDetectedWard("");
    setDetectedSubZone("");
    setArea("");
    setAreaSource(null);
    // Increment sequence so only latest responses update state
    detectionSeqRef.current += 1;
    setMapError(null);
    return true;
  }, [isWithinKochiBoundary, showBoundaryError]);

  // Initialize map when dialog opens - depend on isOpen and mapReloadKey to allow manual retry
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    let cancelled = false;
    let initializationTimeout: NodeJS.Timeout;

    const initializeMap = async () => {
      try {
        console.log('🗺️ [DEBUG] Starting map initialization...');
        
        // Clear any existing map first
        if (leafletMapRef.current) {
          console.log('🗺️ [DEBUG] Cleaning up existing map...');
          leafletMapRef.current.off();
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
          markerRef.current = null;
        }

        // Ensure map container is ready
        if (!mapRef.current) {
          console.error('🗺️ [ERROR] Map container not found');
          setMapError("Map container not ready. Please try again.");
          return;
        }

        // Dynamically import leaflet with better error handling
        console.log('🗺️ [DEBUG] Loading Leaflet library...');
        const L = await import("leaflet");
        if (cancelled) {
          console.log('🗺️ [DEBUG] Map initialization cancelled');
          return;
        }
        leafletLibRef.current = L;
        console.log('🗺️ [DEBUG] Leaflet library loaded successfully');

        // Set up the default icon with fallback
        const DefaultIcon = L.icon({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        // Determine initial center within Kochi boundaries
        let initCenter = { lat: position.lat, lng: position.lng };
        if (!isWithinKochiBoundary(initCenter.lat, initCenter.lng)) {
          console.warn('🗺️ [WARN] Initial position outside Kochi. Falling back to default center.');
          initCenter = { ...defaultPosition };
          setPosition(initCenter);
          showBoundaryError('Selected location');
        }

        // Create map with better error handling
        console.log('🗺️ [DEBUG] Creating map instance...');
        leafletMapRef.current = new L.Map(mapRef.current, {
          center: [initCenter.lat, initCenter.lng],
          zoom: 13,
          scrollWheelZoom: true,
          zoomControl: true,
          attributionControl: true,
        });

        // Add tile layer with error handling
        console.log('🗺️ [DEBUG] Adding tile layer...');
        const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
        });
        
        tileLayer.on('tileerror', (e: any) => {
          console.warn('🗺️ [WARN] Tile loading error:', e);
        });
        
        tileLayer.addTo(leafletMapRef.current);

        // Add marker
        console.log('🗺️ [DEBUG] Adding marker...');
        markerRef.current = L.marker([initCenter.lat, initCenter.lng], {
          icon: DefaultIcon,
          draggable: true,
        }).addTo(leafletMapRef.current);

        // Handle marker drag with boundary validation
        markerRef.current.on('dragend', (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          console.log('🗺️ [DEBUG] Marker dragged to:', lat, lng);
          if (setPositionWithValidation({ lat, lng }, "Dragged location")) {
            detectAdministrativeArea({ lat, lng });
            reverseGeocode({ lat, lng });
          } else {
            // Reset marker to previous valid position
            markerRef.current?.setLatLng([position.lat, position.lng]);
          }
        });

        // Handle map clicks with boundary validation
        leafletMapRef.current.on("click", (e: any) => {
          const { lat, lng } = e.latlng;
          console.log('🗺️ [DEBUG] Map clicked at:', lat, lng);
          if (setPositionWithValidation({ lat, lng }, "Clicked location")) {
            markerRef.current?.setLatLng([lat, lng]);
            // Run both area detection and reverse geocoding
            detectAdministrativeArea({ lat, lng });
            reverseGeocode({ lat, lng });
          }
        });

        // Add Kochi boundary visualization
        const boundaryCoords = [
          [bboxSouth, bboxWest], // SW
          [bboxNorth, bboxWest], // NW
          [bboxNorth, bboxEast], // NE
          [bboxSouth, bboxEast], // SE
          [bboxSouth, bboxWest]  // Close the polygon
        ];
        
        const boundaryPolygon = L.polygon(boundaryCoords, {
          color: '#3b82f6',
          weight: 2,
          opacity: 0.8,
          fillColor: '#3b82f6',
          fillOpacity: 0.1,
          dashArray: '5, 10'
        }).addTo(leafletMapRef.current);
        
        boundaryPolygon.bindPopup('Kochi Service Area Boundary');

        // Handle map ready event
        leafletMapRef.current.whenReady(() => {
          console.log('🗺️ [DEBUG] Map is ready');
          setMapError(null);
          setMapInitialized(true);
          
          // Ensure proper sizing
          setTimeout(() => {
            try {
              leafletMapRef.current?.invalidateSize();
              console.log('🗺️ [DEBUG] Map size invalidated');
            } catch (error) {
              console.warn('🗺️ [WARN] Error invalidating map size:', error);
            }
          }, 100);
        });

        console.log('🗺️ [DEBUG] Map initialization completed successfully');
      } catch (error) {
        if (!cancelled) {
          console.error('🗺️ [ERROR] Error initializing map:', error);
          setMapError(`Failed to load map: ${error instanceof Error ? error.message : 'Unknown error'}. Please refresh and try again.`);
        }
      }
    };

    // Add a small delay to ensure DOM is ready
    initializationTimeout = setTimeout(() => {
      if (!cancelled) {
        initializeMap();
      }
    }, 150);

    return () => {
      cancelled = true;
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
      
      // Cleanup map
      if (leafletMapRef.current) {
        console.log('🗺️ [DEBUG] Cleaning up map on unmount');
        leafletMapRef.current.off();
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
      markerRef.current = null;
      setMapInitialized(false);
    };
  }, [isOpen, mapReloadKey]);

  // Detect administrative area based on coordinates - memoized to prevent infinite loops
  const detectAdministrativeArea = useCallback(async (coords: {
    lat: number;
    lng: number;
  }) => {
    try {
      console.log('🏛️ [DEBUG] Detecting administrative area for:', coords);
      setIsDetectingArea(true);
      const seq = detectionSeqRef.current;

      // Validate coordinates
      if (isNaN(coords.lat) || isNaN(coords.lng)) {
        console.error('🏛️ [ERROR] Invalid coordinates for area detection');
        return;
      }

      // Try API-based detection first
      try {
        const result = await detectAreaMutation({
          latitude: coords.lat,
          longitude: coords.lng,
        }).unwrap();

        console.log('🏛️ [DEBUG] Area detection API result:', result);

        if (result.success && result.data) {
          const { exact, nearest } = result.data;

          // Use exact match if available, otherwise use nearest
          const ward = exact?.ward || nearest?.ward;
          const subZone = exact?.subZone || nearest?.subZone;

          if (ward) {
            console.log('🏛️ [DEBUG] Ward detected:', ward.name);
            // Only update if this is the latest detection
            if (seq === detectionSeqRef.current) {
              setDetectedWard(ward.name);
              setArea(ward.name);
              setAreaSource('api');
            }
          }

          if (subZone) {
            console.log('🏛️ [DEBUG] Sub-zone detected:', subZone.name);
            if (seq === detectionSeqRef.current) {
              setDetectedSubZone(subZone.name);
              // Prefer sub-zone as area if available
              setArea(subZone.name);
              setAreaSource('api');
            }
          }

          if (!ward && !subZone) {
            console.log('🏛️ [DEBUG] No administrative area found in API response');
          }
        } else {
          console.log('🏛️ [DEBUG] API returned unsuccessful result or no data');
        }
      } catch (apiError) {
        console.log('🏛️ [WARN] API area detection failed, this is normal:', apiError);
      }
    } catch (error) {
      console.error('🏛️ [ERROR] Error in area detection:', error);
    } finally {
      setIsDetectingArea(false);
    }
  }, [detectAreaMutation]); // Memoize with detectAreaMutation dependency

  // Reverse geocoding to get address from coordinates - memoized to prevent infinite loops
  const reverseGeocode = useCallback(async (coords: { lat: number; lng: number }) => {
    try {
      console.log('🌍 [DEBUG] Reverse geocoding for:', coords);
      const seq = detectionSeqRef.current;

      // Validate coordinates
      if (isNaN(coords.lat) || isNaN(coords.lng)) {
        console.error('🌍 [ERROR] Invalid coordinates for reverse geocoding');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&addressdetails=1&zoom=18`;
      console.log('🌍 [DEBUG] Geocoding URL:', geocodeUrl);

      const response = await fetch(geocodeUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Fix_Smart_CMS/1.0'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🌍 [DEBUG] Geocoding result:', data);

      if (data && data.display_name) {
        setAddress(data.display_name);
        console.log('🌍 [DEBUG] Address set:', data.display_name);

        // Only use geocoding area if we don't have detected area
        // Only set area from geocode if API hasn't already set it for this sequence
        if (seq === detectionSeqRef.current && areaSource !== 'api') {
          const addressComponents = data.address;
          if (addressComponents) {
            const detectedArea =
              addressComponents.neighbourhood ||
              addressComponents.suburb ||
              addressComponents.city_district ||
              addressComponents.state_district ||
              addressComponents.city ||
              "";
            if (detectedArea) {
              setArea(detectedArea);
              setAreaSource('geocode');
              console.log('🌍 [DEBUG] Area set from geocoding:', detectedArea);
            }
          }
        }
      } else {
        console.log('🌍 [WARN] No address found in geocoding response');
      }
    } catch (error) {
      console.error('🌍 [ERROR] Error in reverse geocoding:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🌍 [WARN] Reverse geocoding timed out');
      }
    }
  }, [areaSource]);

  // On open, populate address/area for initial position (from system-config default or provided initialLocation)
  useEffect(() => {
    if (!isOpen) return;
    const coords = { lat: position.lat, lng: position.lng };
    // prepare fresh detection for opening state
    setDetectedWard("");
    setDetectedSubZone("");
    setArea("");
    setAreaSource(null);
    detectionSeqRef.current += 1;
    detectAdministrativeArea(coords);
    reverseGeocode(coords);
  }, [isOpen, position.lat, position.lng, detectAdministrativeArea, reverseGeocode]); // Include memoized functions in dependencies

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

  // Get current location with improved error handling
  const getCurrentLocation = useCallback(async () => {
    console.log('📍 [DEBUG] Getting current location...');
    setIsLoadingLocation(true);
    setMapError(null);
    
    try {
      if (!("geolocation" in navigator)) {
        const errorMsg = "Geolocation is not supported by this browser.";
        console.error('📍 [ERROR]', errorMsg);
        setMapError(errorMsg);
        setIsLoadingLocation(false);
        return;
      }

      // Check if we're in a secure context
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        const errorMsg = "Geolocation requires HTTPS. Please use a secure connection.";
        console.error('📍 [ERROR]', errorMsg);
        setMapError(errorMsg);
        setIsLoadingLocation(false);
        return;
      }

      try {
        // Check permission state to avoid triggering prompt when denied
        if ('permissions' in navigator) {
          const perm = await navigator.permissions.query({ name: "geolocation" as PermissionName });
          if (perm.state === "denied") {
            const errorMsg = "Location permission denied. Please enable location access in your browser settings.";
            console.error('📍 [ERROR]', errorMsg);
            setMapError(errorMsg);
            setIsLoadingLocation(false);
            return;
          }
          console.log('📍 [DEBUG] Permission state:', perm.state);
        }
      } catch (permError) {
        console.warn('📍 [WARN] Could not check permission state:', permError);
      }

      const timeoutId = setTimeout(() => {
        setIsLoadingLocation(false);
        setMapError("Location request timed out. Please try again or check your GPS settings.");
      }, 15000);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeoutId);
          const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          console.log('📍 [DEBUG] Location obtained:', newPos);
          
          // Validate location is within Kochi boundaries
          if (!isWithinKochiBoundary(newPos.lat, newPos.lng)) {
            showBoundaryError("Current location");
            setIsLoadingLocation(false);
            return;
          }
          
          setPosition(newPos);
          
          // Update map view first
          if (leafletMapRef.current) {
            leafletMapRef.current.setView([newPos.lat, newPos.lng], 16);
            markerRef.current?.setLatLng([newPos.lat, newPos.lng]);
            console.log('📍 [DEBUG] Map updated with new location');
          }
          
          // Then run detection functions
          detectAdministrativeArea(newPos);
          reverseGeocode(newPos);
          
          setIsLoadingLocation(false);
          setMapError(null);
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error('📍 [ERROR] Geolocation error:', { 
            code: error?.code, 
            message: error?.message,
            timestamp: new Date().toISOString()
          });
          setIsLoadingLocation(false);
          setMapError(getGeoErrorMessage(error));
        },
        { 
          enableHighAccuracy: true, 
          timeout: 12000, 
          maximumAge: 300000 // 5 minutes
        },
      );
    } catch (e) {
      console.error('📍 [ERROR] Unexpected geolocation error:', e);
      setMapError("Unable to fetch your location. Please try again.");
      setIsLoadingLocation(false);
    }
  }, []);


  // Search for a location with improved error handling
  const searchLocation = async () => {
    const query = searchQuery.trim();
    if (!query) {
      setMapError("Please enter a search term.");
      return;
    }

    console.log('🔍 [DEBUG] Searching for location:', query);
    setMapError(null);
    
    try {
      const viewbox = hasBbox
        ? `&viewbox=${encodeURIComponent(`${bboxWest},${bboxNorth},${bboxEast},${bboxSouth}`)}&bounded=1`
        : "";
      const cc = countryCodes ? `&countrycodes=${encodeURIComponent(countryCodes)}` : "";
      const q = `${query}, ${mapPlace}`;
      
      const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1${viewbox}${cc}`;
      console.log('🔍 [DEBUG] Search URL:', searchUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(searchUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Fix_Smart_CMS/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🔍 [DEBUG] Search results:', data);

      if (data && data.length > 0) {
        const result = data[0]; // Use the first (best) result
        const newPos = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };
        
        if (isNaN(newPos.lat) || isNaN(newPos.lng)) {
          throw new Error('Invalid coordinates received from search');
        }
        
        console.log('🔍 [DEBUG] Found location:', newPos);
        
        // Validate search result is within Kochi boundaries
        if (!isWithinKochiBoundary(newPos.lat, newPos.lng)) {
          showBoundaryError("Search result");
          return;
        }
        
        setPosition(newPos);
        setAddress(result.display_name);
        setSearchQuery(''); // Clear search after successful search

        // Update map view first
        if (leafletMapRef.current) {
          leafletMapRef.current.setView([newPos.lat, newPos.lng], 16);
          markerRef.current?.setLatLng([newPos.lat, newPos.lng]);
          console.log('🔍 [DEBUG] Map updated with search result');
        }

        // Run area detection
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
          if (detectedArea) {
            setArea(detectedArea);
            console.log('🔍 [DEBUG] Area detected from search:', detectedArea);
          }
        }
      } else {
        const errorMsg = `No results found for "${query}". Please try a different search term or be more specific.`;
        console.warn('🔍 [WARN]', errorMsg);
        setMapError(errorMsg);
      }
    } catch (error) {
      console.error('🔍 [ERROR] Search error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setMapError("Search timed out. Please try again.");
        } else {
          setMapError(`Search failed: ${error.message}. Please try again.`);
        }
      } else {
        setMapError("Error searching for location. Please check your internet connection and try again.");
      }
    }
  };

  const handleConfirm = () => {
    console.log('✅ [DEBUG] Confirming location selection:', {
      position,
      address: address.trim(),
      area: area.trim(),
      landmark: landmark.trim()
    });
    
    // Validate coordinates
    if (isNaN(position.lat) || isNaN(position.lng)) {
      setMapError('Invalid coordinates selected. Please try selecting a location again.');
      return;
    }
    
    // Validate that we have at least coordinates
    if (!position.lat || !position.lng) {
      setMapError('Please select a location on the map first.');
      return;
    }
    
    // Final boundary validation before confirming
    if (!isWithinKochiBoundary(position.lat, position.lng)) {
      showBoundaryError("Selected location");
      return;
    }
    
    try {
      onLocationSelect({
        latitude: position.lat,
        longitude: position.lng,
        address: address.trim() || `Location at ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
        area: area.trim() || 'Unknown Area',
        landmark: landmark.trim(),
      });
      
      console.log('✅ [DEBUG] Location selection confirmed successfully');
      toast({
        title: "Location Confirmed",
        description: "Location has been successfully selected.",
      });
      onClose();
    } catch (error) {
      console.error('✅ [ERROR] Error confirming location:', error);
      setMapError('Error confirming location. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchLocation();
    }
  };
  
  // Add keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape') {
        onClose();
      }
      // Enter to confirm (when not in input)
      else if (e.key === 'Enter' && e.target === document.body) {
        handleConfirm();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleConfirm]);

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
                <Button
                  onClick={searchLocation}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
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
                    if (!leafletMapRef.current) return;
                    const center = leafletMapRef.current.getCenter();
                    const lat = center.lat;
                    const lng = center.lng;
                    if (setPositionWithValidation({ lat, lng }, "Pin drop location")) {
                      markerRef.current?.setLatLng([lat, lng]);
                      detectAdministrativeArea({ lat, lng });
                      reverseGeocode({ lat, lng });
                    }
                  }}
                  variant="outline"
                  className="whitespace-nowrap"
                >
                  Drop Pin Here
                </Button>
              </div>
            </div>

            {/* Map */}
            <div className="h-64 sm:h-80 lg:h-96 w-full rounded-lg overflow-hidden border relative bg-gray-100">
              {mapError ? (
                <div className="h-full flex items-center justify-center bg-gray-50 relative z-40">
                  <div className="text-center p-4 max-w-md">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600 text-sm mb-3 font-medium">{mapError}</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button onClick={getCurrentLocation} variant="outline" size="sm" disabled={isLoadingLocation}>
                        {isLoadingLocation ? "Getting Location..." : "Try Current Location"}
                      </Button>
                      <Button
                        onClick={() => {
                          console.log('🗺️ [DEBUG] Clearing error and reinitializing map');
                          setMapError(null);
                          setMapInitialized(false);
                          // Force clean re-initialization
                          setMapReloadKey((k) => k + 1);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Retry Map
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Loading indicator */}
                  {(!mapInitialized || configLoading) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-40">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">
                          {configLoading ? "Loading configuration..." : "Loading map..."}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div
                    ref={mapRef}
                    className="h-full w-full relative"
                    style={{ 
                      minHeight: "256px",
                      background: '#f0f0f0'
                    }}
                  />
                  
                  {/* Center crosshair indicator - only show when map is ready */}
                  {mapInitialized && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
                      <svg width="28" height="28" viewBox="0 0 28 28" className="text-gray-600 opacity-70 drop-shadow-sm">
                        <circle cx="14" cy="14" r="4" fill="white" fillOpacity="0.8" />
                        <circle cx="14" cy="14" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <line x1="14" y1="0" x2="14" y2="6" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="14" y1="22" x2="14" y2="28" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="0" y1="14" x2="6" y2="14" stroke="currentColor" strokeWidth="1.5" />
                        <line x1="22" y1="14" x2="28" y2="14" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Map status indicator */}
                  {mapInitialized && (
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-600 shadow-sm z-30 pointer-events-none">
                      📍 Click map or drag marker to select location
                    </div>
                  )}
                  
                  {/* Kochi boundary info */}
                  {mapInitialized && (
                    <div className="absolute bottom-2 left-2 bg-blue-50/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-blue-700 shadow-sm z-30 border border-blue-200 pointer-events-none">
                      🗺️ Service area: Kochi boundaries
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Status Messages */}
            <div className="space-y-2">
              {isLoadingLocation && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Getting your current location...
                </div>
              )}
              
              {isDetectingArea && (
                <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                  Detecting administrative area...
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                💡 <strong>Tips:</strong> Click anywhere on the map, drag the marker, search for a location, or use your current location.
              </p>
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
