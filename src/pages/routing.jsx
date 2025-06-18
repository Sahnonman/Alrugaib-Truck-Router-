import React, { useState } from "react";
import InputForm from "./InputFormComponent";
import MapPanel from "./MapPanelComponent";

// Helper to format coordinates for Mapbox Directions API
const buildCoordinatesString = (origin, stops, destination) => {
  // Mapbox expects "lng,lat;lng,lat;..."
  const coords = [origin, ...stops.map(s => s.coordinates), destination];
  return coords.map(c => `${c[0]},${c[1]}`).join(";");
};

export default function RoutingPage() {
  const [routeData, setRouteData] = useState({
    origin: null,
    stops: [],
    destination: null,
    routeCoordinates: null,
  });

  const handleCalculateRoute = async (formData) => {
    try {
      // Geocode origin, stops, and destination to coordinates (using Mapbox Geocoding)
      const geocode = async (query) => {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
        );
        const data = await res.json();
        return data.features[0].center; // [lng, lat]
      };

      const originCoords = await geocode(formData.originAddress);
      const stopsCoords = await Promise.all(formData.stops.map(s => geocode(s.location)));
      const destinationCoords = await geocode(formData.destinationAddress);

      // Build coordinates string
      const coordString = buildCoordinatesString(
        originCoords,
        stopsCoords,
        destinationCoords
      );

      // Call Mapbox Directions API
      const directionsRes = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordString}?geometries=geojson&overview=full&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`
      );
      const directionsData = await directionsRes.json();

      // Update state with route and markers
      setRouteData({
        origin: { coordinates: originCoords },
        stops: stopsCoords.map(c => ({ coordinates: c })),
        destination: { coordinates: destinationCoords },
        routeCoordinates: directionsData.routes[0].geometry.coordinates,
      });
    } catch (error) {
      console.error("Error fetching route:", error);
      alert("حدث خطأ أثناء حساب المسار. تأكد من العناوين وحاول مرة أخرى.");
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4 p-4">
      <InputForm onSubmit={handleCalculateRoute} />
      <MapPanel
        origin={routeData.origin}
        stops={routeData.stops}
        destination={routeData.destination}
        routeCoordinates={routeData.routeCoordinates}
      />
    </div>
  );
}
Add RoutingPage component
