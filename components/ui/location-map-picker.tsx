"use client";

import { useEffect, useRef, useState } from "react";
import { Label } from "./label";
import { Input } from "./input";
import { Button } from "./button";
import { MapPin, Navigation } from "lucide-react";

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

interface LocationData {
  address: string;
  lat: number;
  lng: number;
  placeName?: string;
}

interface LocationMapPickerProps {
  onLocationSelect: (location: LocationData) => void;
  onRadiusChange?: (radius: number) => void;
  initialLocation?: LocationData;
  initialRadius?: number;
  height?: string;
  readOnly?: boolean; // If true, map is read-only (no interactions)
  showRadiusControl?: boolean; // If false, hides the radius slider control
}

export function LocationMapPicker({
  onLocationSelect,
  onRadiusChange,
  initialLocation,
  initialRadius = 10,
  height = "400px",
  readOnly = false,
  showRadiusControl = true,
}: LocationMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [radius, setRadius] = useState(initialRadius);
  const [searchQuery, setSearchQuery] = useState("");
  const geocoderRef = useRef<any>(null);
  const autocompleteRef = useRef<HTMLInputElement>(null);
  const autocompleteInstanceRef = useRef<any>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn("Google Maps API key not found. Map functionality will be limited.");
      return;
    }

    // Load Google Maps script
    if (!window.google && !document.querySelector('script[src*="maps.googleapis.com"]')) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initializeMap;
      script.onerror = () => {
        console.error("Failed to load Google Maps script");
      };
      document.head.appendChild(script);
    } else if (window.google) {
      initializeMap();
    }

    return () => {
      // Cleanup
      if (markerRef.current) markerRef.current = null;
      if (circleRef.current) circleRef.current = null;
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    const defaultCenter = initialLocation
      ? { lat: initialLocation.lat, lng: initialLocation.lng }
      : { lat: 28.6139, lng: 77.209 }; // Default to Delhi

    // Initialize map
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 13,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
    });

    geocoderRef.current = new window.google.maps.Geocoder();

    // Initialize Places Autocomplete
    if (autocompleteRef.current) {
      autocompleteInstanceRef.current = new window.google.maps.places.Autocomplete(
        autocompleteRef.current,
        {
          types: ["establishment", "geocode"],
          componentRestrictions: { country: "in" },
        }
      );

      autocompleteInstanceRef.current.addListener("place_changed", () => {
        const place = autocompleteInstanceRef.current.getPlace();
        if (place.geometry) {
          const location = place.geometry.location;
          handleLocationSelect(location.lat(), location.lng(), place.formatted_address || place.name);
        }
      });
    }

    // Set initial marker and circle if location provided
    if (initialLocation) {
      handleLocationSelect(initialLocation.lat, initialLocation.lng, initialLocation.address);
    }

    // Add click listener to map (only if not read-only)
    if (!readOnly) {
      mapInstanceRef.current.addListener("click", (e: any) => {
        handleLocationSelect(e.latLng.lat(), e.latLng.lng());
      });
    }

    setMapLoaded(true);
  };

  const handleLocationSelect = async (lat: number, lng: number, providedAddress?: string) => {
    if (!mapInstanceRef.current || !window.google) return;

    // Update map center
    mapInstanceRef.current.setCenter({ lat, lng });
    mapInstanceRef.current.setZoom(13);

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Add new marker
    markerRef.current = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstanceRef.current,
      draggable: !readOnly,
      title: "Business Location",
      animation: window.google.maps.Animation.DROP,
    });

    // Update marker on drag
    markerRef.current.addListener("dragend", (e: any) => {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      updateCircleAndGeocode(newLat, newLng);
    });

    // Update circle
    updateCircle(lat, lng, radius);

    // Geocode if address not provided
    if (providedAddress) {
      setAddress(providedAddress);
      onLocationSelect({ address: providedAddress, lat, lng, placeName: providedAddress });
    } else {
      updateCircleAndGeocode(lat, lng);
    }
  };

  const updateCircle = (lat: number, lng: number, radiusKm: number) => {
    if (!mapInstanceRef.current || !window.google) return;

    // Remove existing circle
    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    // Only create circle if radius control is shown (not read-only or showRadiusControl is true)
    // For read-only maps with showRadiusControl=false, don't show radius circle
    if (!readOnly || showRadiusControl) {
      // Create new circle (radius in meters)
      circleRef.current = new window.google.maps.Circle({
        strokeColor: "#3B82F6",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: "#3B82F6",
        fillOpacity: 0.15,
        map: mapInstanceRef.current,
        center: { lat, lng },
        radius: radiusKm * 1000, // Convert km to meters
        editable: false,
      });
      
      // Adjust map bounds to show circle
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(new window.google.maps.LatLng(lat, lng));
      mapInstanceRef.current.fitBounds(bounds);
    } else {
      // If no circle, just center on marker
      mapInstanceRef.current.setCenter({ lat, lng });
      mapInstanceRef.current.setZoom(13);
    }
  };

  const updateCircleAndGeocode = async (lat: number, lng: number) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
      if (status === "OK" && results[0]) {
        const address = results[0].formatted_address;
        setAddress(address);
        onLocationSelect({ address, lat, lng, placeName: address });
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        onLocationSelect({ address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`, lat, lng });
      }
    });

    updateCircle(lat, lng, radius);
  };

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (markerRef.current) {
      const position = markerRef.current.getPosition();
      updateCircle(position.lat(), position.lng(), newRadius);
    }
    if (onRadiusChange) {
      onRadiusChange(newRadius);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        handleLocationSelect(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your location. Please select manually on the map.");
      }
    );
  };

  const handleSearch = () => {
    if (!searchQuery.trim() || !geocoderRef.current) return;

    geocoderRef.current.geocode({ address: searchQuery }, (results: any[], status: string) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        handleLocationSelect(location.lat(), location.lng(), results[0].formatted_address);
        setSearchQuery("");
      } else {
        alert("Location not found. Please try a different search term.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Input
          ref={autocompleteRef}
          type="text"
          placeholder="Search for a location or address..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
          className="pr-20"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSearch}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          Search
        </Button>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{ height, width: "100%" }}
        className="rounded-lg border-2 border-gray-200 overflow-hidden"
      />

      {/* Current Location Button (only show if not read-only) */}
      {!readOnly && (
        <Button
          type="button"
          variant="outline"
          onClick={handleCurrentLocation}
          className="w-full"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Use My Current Location
        </Button>
      )}

      {/* Selected Address Display */}
      {address && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <Label className="text-xs text-gray-600 mb-1">Selected Location</Label>
              <p className="text-sm font-medium text-gray-900">{address}</p>
            </div>
          </div>
        </div>
      )}

      {/* Radius Control (only show if not read-only and showRadiusControl is true) */}
      {!readOnly && showRadiusControl && (
        <div>
          <Label htmlFor="radius">Service Radius: {radius} km</Label>
          <Input
            id="radius"
            type="range"
            min="1"
            max="100"
            value={radius}
            onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1 km</span>
            <span>50 km</span>
            <span>100 km</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Adjust the radius to show your service coverage area. Technicians within this radius will be matched with your jobs.
          </p>
        </div>
      )}
      {/* Show radius info if read-only and showRadiusControl is true */}
      {readOnly && showRadiusControl && radius > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>Service Radius:</strong> {radius} km
          </p>
        </div>
      )}
    </div>
  );
}












