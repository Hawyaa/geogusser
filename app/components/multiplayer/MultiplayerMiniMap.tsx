"use client";
import { useEffect, useRef, useState } from "react";
import { LatLng } from "@/types/game";
import { avatarSvg, getAvatarById } from "@/lib/avatars";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || "";

export interface OtherPin {
  playerId: string;
  displayName: string;
  guess: LatLng;
  color: string;
  avatarId?: string | null;
}

// Convert a country name to its flag emoji via ISO 3166-1 alpha-2 code.
// Only covers countries present in app/lib/locations.ts.
const COUNTRY_FLAGS: Record<string, string> = {
  "United Kingdom": "🇬🇧",
  "Netherlands": "🇳🇱",
  "Germany": "🇩🇪",
  "France": "🇫🇷",
  "USA": "🇺🇸",
  "Canada": "🇨🇦",
  "Japan": "🇯🇵",
  "Australia": "🇦🇺",
  "South Korea": "🇰🇷",
  "Brazil": "🇧🇷",
  "Spain": "🇪🇸",
  "Italy": "🇮🇹",
  "Sweden": "🇸🇪",
  "Denmark": "🇩🇰",
  "Finland": "🇫🇮",
  "Norway": "🇳🇴",
  "South Africa": "🇿🇦",
  "Switzerland": "🇨🇭",
  "Poland": "🇵🇱",
  "Ethiopia": "🇪🇹",
};

export function countryFlag(country: string): string {
  return COUNTRY_FLAGS[country] ?? "📍";
}

interface MultiplayerMiniMapProps {
  onGuess: (latlng: LatLng) => void;
  disabled?: boolean;
  otherPins?: OtherPin[];
  correctLocation?: LatLng;
  /** Country name of the correct location — used to show the flag emoji on the marker */
  correctCountry?: string;
  myAvatarId?: string | null;
}

export default function MultiplayerMiniMap({
  onGuess,
  disabled = false,
  otherPins = [],
  correctLocation,
  correctCountry,
  myAvatarId,
}: MultiplayerMiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const otherMarkersRef = useRef<any[]>([]);
  const correctMarkerRef = useRef<any>(null);
  const maplibreRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [guessPlaced, setGuessPlaced] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // ─── Init map once ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isClient || !containerRef.current) return;
    let cancelled = false;
    const init = async () => {
      const maplibre = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      // Bail out if the component unmounted (or the container node went
      // away) while these dynamic imports were in flight — without this
      // guard, `new maplibre.Map({ container: ... })` can fire with a
      // null/detached container and crash with "Invalid type: 'container'
      // must be a String or HTMLElement."
      if (cancelled || !containerRef.current) return;
      maplibreRef.current = maplibre;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      const map = new maplibre.Map({
        container: containerRef.current,
        style: `https://api.maptiler.com/maps/hybrid/style.json?key=${MAPTILER_KEY}`,
        center: [40.489, 9.145],
        zoom: 4.5,
        pitch: 50,
        bearing: 0,
        antialias: true,
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
        setMapReady(true);
      });
      map.on("click", (e: any) => {
        if (disabled) return;
        const { lng, lat } = e.lngLat;
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else {
          const avatarId = (map as any)._myAvatarId;
          const el = document.createElement("div");
          el.style.cssText = "width:36px;height:36px;border-radius:50%;border:3px solid #22c55e;box-shadow:0 2px 8px rgba(0,0,0,0.6);overflow:hidden;background:#1f2937;";
          el.innerHTML = avatarSvg(getAvatarById(avatarId), 30);
          markerRef.current = new (maplibre as any).Marker({ element: el, anchor: "bottom" })
            .setLngLat([lng, lat])
            .addTo(map);
        }
        setGuessPlaced(true);
        onGuess({ lat, lng });
      });

      // Store myAvatarId in the map instance for use in the click handler
      (map as any)._myAvatarId = myAvatarId;
    };
    init();
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markerRef.current = null;
      otherMarkersRef.current = [];
      correctMarkerRef.current = null;
      setGuessPlaced(false);
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, disabled]);

  // ─── Render other players' pins + the correct location (reveal mode) ──
  useEffect(() => {
    const map = mapRef.current;
    const maplibre = maplibreRef.current;
    if (!map || !maplibre) return;

    // Clear previous "other" markers before redrawing
    otherMarkersRef.current.forEach((m) => m.remove());
    otherMarkersRef.current = [];

    otherPins.forEach((pin) => {
      const el = document.createElement("div");
      el.style.cssText = `width:36px;height:36px;border-radius:50%;border:3px solid ${pin.color};box-shadow:0 2px 6px rgba(0,0,0,0.5);overflow:hidden;background:#1f2937;`;
      el.title = pin.displayName;
      el.innerHTML = avatarSvg(getAvatarById(pin.avatarId), 30);
      const marker = new maplibre.Marker({ element: el, anchor: "bottom" })
        .setLngLat([pin.guess.lng, pin.guess.lat])
        .setPopup(new maplibre.Popup({ offset: 12 }).setText(pin.displayName))
        .addTo(map);
      otherMarkersRef.current.push(marker);
    });

    if (correctLocation) {
      if (correctMarkerRef.current) correctMarkerRef.current.remove();
      const flag = countryFlag(correctCountry ?? "");
      const el = document.createElement("div");
      el.style.cssText =
        "width:44px;height:44px;background:white;border:3px solid #22c55e;border-radius:50%;box-shadow:0 0 0 4px rgba(34,197,94,0.3),0 4px 12px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;font-size:22px;";
      el.textContent = flag;
      el.title = correctCountry ?? "Correct location";
      correctMarkerRef.current = new maplibre.Marker({ element: el, anchor: "bottom" })
        .setLngLat([correctLocation.lng, correctLocation.lat])
        .addTo(map);

      // Frame the map to show everything: correct location + all pins
      const bounds = new maplibre.LngLatBounds();
      bounds.extend([correctLocation.lng, correctLocation.lat]);
      otherPins.forEach((p) => bounds.extend([p.guess.lng, p.guess.lat]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 10, duration: 600 });
    }
  }, [otherPins, correctLocation, correctCountry, mapReady]);

  if (!isClient) return null;

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl border border-gray-700">
      <div ref={containerRef} className="w-full h-full" />
      {!guessPlaced && !disabled && !correctLocation && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
          🌍 Click to guess • Right-click drag to tilt 3D
        </div>
      )}
      {guessPlaced && !disabled && !correctLocation && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-green-600/90 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
          ✅ Guess placed!
        </div>
      )}
    </div>
  );
}