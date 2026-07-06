"use client";
import { useEffect, useRef, useState } from "react";
import { LatLng } from "@/types/game";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";

interface MiniMapProps {
  onGuess: (latlng: LatLng) => void;
  disabled?: boolean;
}

export default function MiniMap({ onGuess, disabled = false }: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [guessPlaced, setGuessPlaced] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!isClient || !containerRef.current) return;
    const init = async () => {
      const maplibre = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      const map = new maplibre.Map({
        container: containerRef.current!,
        style: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
        center: [40.489, 9.145],
        zoom: 4.5,
        pitch: 50,
        bearing: 0,
        // antialias: true,
      });
      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl(), "top-right");
      map.on("load", () => {
        map.addSource("terrain", {
          type: "raster-dem",
          url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${MAPTILER_KEY}`,
          tileSize: 256,
        });
        map.setTerrain({ source: "terrain", exaggeration: 2 });
      });
      map.on("click", (e: any) => {
        if (disabled) return;
        const { lng, lat } = e.lngLat;
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else {
          const el = document.createElement("div");
          el.style.cssText = "width:22px;height:22px;background:#22c55e;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.6);";
          markerRef.current = new (maplibre as any).Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
        }
        setGuessPlaced(true);
        onGuess({ lat, lng });
      });
    };
    init();
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      markerRef.current = null;
      setGuessPlaced(false);
    };
  }, [isClient, disabled]);

  if (!isClient) return null;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border border-gray-700">
      <div ref={containerRef} className="w-full h-full" />
      {!guessPlaced && !disabled && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
          🌍 Click to guess • Right-click drag to tilt 3D
        </div>
      )}
      {guessPlaced && !disabled && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-green-600/90 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
          ✅ Guess placed!
        </div>
      )}
    </div>
  );
}
