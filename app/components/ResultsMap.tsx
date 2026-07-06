"use client";
import { useEffect, useRef, useState } from "react";
import { LatLng } from "@/types/game";
import { countryFlag } from "./multiplayer/MultiplayerMiniMap";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";

interface ResultsMapProps {
  correctLocation: LatLng;
  guessLocation: LatLng | null;
  correctCountry?: string;
}

export default function ResultsMap({ correctLocation, guessLocation, correctCountry }: ResultsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current) return;
    let cancelled = false;

    const init = async () => {
      const maplibre = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (cancelled || !containerRef.current) return;

      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

      // Fit bounds to show both pins with padding
      const points: [number, number][] = [[correctLocation.lng, correctLocation.lat]];
      if (guessLocation) points.push([guessLocation.lng, guessLocation.lat]);

      const lngs = points.map(p => p[0]);
      const lats = points.map(p => p[1]);
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lngs) - 2, Math.min(...lats) - 2],
        [Math.max(...lngs) + 2, Math.max(...lats) + 2],
      ];

      const map = new maplibre.Map({
        container: containerRef.current,
        style: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
        bounds,
        fitBoundsOptions: { padding: 48, maxZoom: 10 },
        interactive: false, // static result map, no panning
        attributionControl: false,
      });
      mapRef.current = map;

      map.on("load", () => {
        if (cancelled) return;

        // Draw a dotted line between guess and correct location
        if (guessLocation) {
          map.addSource("line", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: [
                  [guessLocation.lng, guessLocation.lat],
                  [correctLocation.lng, correctLocation.lat],
                ],
              },
              properties: {},
            },
          });
          map.addLayer({
            id: "line",
            type: "line",
            source: "line",
            paint: {
              "line-color": "#ffffff",
              "line-width": 2,
              "line-dasharray": [3, 3],
              "line-opacity": 0.7,
            },
          });
        }

        // Guess pin — green circle
        if (guessLocation) {
          const guessEl = document.createElement("div");
          guessEl.style.cssText =
            "width:20px;height:20px;background:#22c55e;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.5);";
          new maplibre.Marker({ element: guessEl, anchor: "center" })
            .setLngLat([guessLocation.lng, guessLocation.lat])
            .addTo(map);
        }

        // Correct location pin — flag emoji in white circle
        const flag = countryFlag(correctCountry ?? "");
        const correctEl = document.createElement("div");
        correctEl.style.cssText =
          "width:36px;height:36px;background:white;border:3px solid #22c55e;border-radius:50%;box-shadow:0 0 0 3px rgba(34,197,94,0.3),0 3px 10px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:18px;";
        correctEl.textContent = flag;
        new maplibre.Marker({ element: correctEl, anchor: "center" })
          .setLngLat([correctLocation.lng, correctLocation.lat])
          .addTo(map);
      });
    };

    init();
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [isClient, correctLocation, guessLocation, correctCountry]);

  if (!isClient) return null;

  return (
    <div ref={containerRef} className="w-full h-full" />
  );
}