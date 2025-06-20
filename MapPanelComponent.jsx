import React, { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// تأكد من تعيين متغيّر البيئة في Next.js أو CRA:
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function MapPanel({ routeCoordinates, origin, destination, stops }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapStyle, setMapStyle] = useState("mapbox/streets-v11");

  useEffect(() => {
    if (map.current) return; // تهيئة خريطة مرة واحدة
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: `mapbox://styles/${mapStyle}`,
      center: origin?.coordinates || [46.68, 24.71], // مركز افتراضي: الرياض
      zoom: 6,
    });
    map.current.addControl(new mapboxgl.NavigationControl());
  }, [mapStyle]);

  useEffect(() => {
    if (!map.current || !routeCoordinates) return;

    // إزالة المصادر والطبقات السابقة
    if (map.current.getLayer("route")) {
      map.current.removeLayer("route");
      map.current.removeSource("route");
    }

    // إضافة مصدر ومسار الخط
    map.current.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: routeCoordinates,
        },
      },
    });
    map.current.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#3b82f6", "line-width": 5 },
    });

    // دالة لإضافة العلامات
    const addMarker = (coords, label) => {
      const el = document.createElement("div");
      el.className = "w-6 h-6 bg-white text-black flex items-center justify-center rounded-full shadow";
      el.innerText = label;
      new mapboxgl.Marker(el).setLngLat(coords).addTo(map.current);
    };

    addMarker(origin.coordinates, "A");
    stops.forEach((s, i) => addMarker(s.coordinates, `${i + 1}`));
    addMarker(destination.coordinates, "B");

    // ملائمة الحدود
    const bounds = routeCoordinates.reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(routeCoordinates[0], routeCoordinates[0])
    );
    map.current.fitBounds(bounds, { padding: 50 });
  }, [routeCoordinates]);

  return (
    <Card className="p-2">
      <div className="flex justify-end mb-2">
        <Button
          onClick={() =>
            setMapStyle(
              mapStyle === "mapbox/streets-v11" ? "mapbox/satellite-v9" : "mapbox/streets-v11"
            )
          }
        >
          Toggle Style
        </Button>
      </div>
      <div ref={mapContainer} className="w-full h-96 rounded-lg shadow" />
    </Card>
  );
}
