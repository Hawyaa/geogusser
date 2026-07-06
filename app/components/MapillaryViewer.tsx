"use client";
import { useEffect, useRef, useState } from "react";

interface ViewerLocation {
  lat: number;
  lng: number;
  city?: string;
  country?: string;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPILLARY_ACCESS_TOKEN || "";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Suppress Mapillary-internal console noise so the console stays clean
// during demos. Real app errors still show normally.
if (typeof window !== "undefined") {
  const MAPILLARY_NOISE = [
    "CancelMapillaryError", "MLYApiException", "GraphMapillaryError",
    "Failed to cache", "Failed to fetch data", "Non existent cover",
    "Service temporarily unavailable", "Request timeout",
    "ERR_CACHE_WRITE_FAILURE", "graph.mapillary.com",
    "mapillary", "Mapillary",
  ];
  const shouldSuppress = (...args: any[]) =>
    args.some((a) =>
      MAPILLARY_NOISE.some((n) =>
        String(a?.message ?? a ?? "").includes(n)
      )
    );
  const _origError = console.error.bind(console);
  console.error = (...args: any[]) => {
    if (shouldSuppress(...args)) return;
    _origError(...args);
  };
  const _origWarn = console.warn.bind(console);
  console.warn = (...args: any[]) => {
    if (shouldSuppress(...args)) return;
    _origWarn(...args);
  };
}

function lngLatToTile(lng: number, lat: number, zoom: number) {
  const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
  return { x, y };
}

export default function MapillaryViewer({ location }: { location: ViewerLocation }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [imageId, setImageId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState("Loading 360° view...");

  useEffect(() => {
    setLoading(true);
    setError(false);
    setImageId(null);
    setStatusMsg("Loading 360° view...");
    run(location);
  }, [location]);

  async function fetchTile(z: number, x: number, y: number): Promise<any[]> {
    const url = `https://tiles.mapillary.com/maps/vtp/mly1_public/2/${z}/${x}/${y}?access_token=${TOKEN}`;
    let res: Response;
    try {
      res = await fetch(url);
    } catch {
      return [];
    }
    if (!res.ok) return [];
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0) return [];
    let tile: any;
    try {
      const { VectorTile } = await import("@mapbox/vector-tile");
      const { PbfReader } = await import("pbf");
      tile = new VectorTile(new PbfReader(new Uint8Array(buf)));
    } catch {
      return [];
    }
    const layer = tile.layers["image"];
    if (!layer) return [];
    const features: any[] = [];
    for (let i = 0; i < layer.length; i++) {
      const feature = layer.feature(i);
      const props = feature.properties as any;
      if (props && props.id) {
        const geom = feature.toGeoJSON(x, y, z);
        features.push({
          id: String(props.id),
          isPano: props.is_pano === true || props.is_pano === "true",
          coords: geom?.geometry?.coordinates,
        });
      }
    }
    return features;
  }

  async function fetchOnce(lat: number, lng: number, zoom: number): Promise<any[]> {
    const { x, y } = lngLatToTile(lng, lat, zoom);
    const offsets = [
      [0, 0], [0, -1], [0, 1], [-1, 0], [1, 0],
      [-1, -1], [-1, 1], [1, -1], [1, 1],
    ];
    const results = await Promise.all(
      offsets.map(([dx, dy]) => fetchTile(zoom, x + dx, y + dy))
    );
    return results.flat();
  }

  async function run(loc: ViewerLocation) {
    if (!TOKEN) {
      setError(true);
      setLoading(false);
      return;
    }
    const zooms = [14, 12, 10];
    for (let z = 0; z < zooms.length; z++) {
      const zoom = zooms[z];
      for (let retry = 0; retry < MAX_RETRIES; retry++) {
        if (retry > 0 || z > 0) {
          setStatusMsg(`Searching for street view (attempt ${z * MAX_RETRIES + retry + 1})...`);
        }
        try {
          const features = await fetchOnce(loc.lat, loc.lng, zoom);
          if (features.length > 0) {
            const pano = features.find((f) => f.isPano);
            const chosen = pano || features[0];
            setImageId(chosen.id);
            setLoading(false);
            return;
          }
        } catch {
          // network/parse failure — fall through to retry
        }
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (retry + 1)));
      }
    }
    setError(true);
    setLoading(false);
  }

  useEffect(() => {
    if (!imageId || !containerRef.current) return;
    let cancelled = false;
    const init = async () => {
      const mly = await import("mapillary-js");
      await import("mapillary-js/dist/mapillary.css");
      if (cancelled) return;
      if (viewerRef.current) {
        try { viewerRef.current.remove(); } catch {}
        viewerRef.current = null;
      }
      const viewer = new mly.Viewer({
        accessToken: TOKEN,
        container: containerRef.current!,
        imageId: imageId,
        component: { cover: false },
      });
      viewer.on("error" as any, () => {
        if (!cancelled) setError(true);
      });
      viewerRef.current = viewer;
    };
    init().catch(() => {
      if (!cancelled) setError(true);
    });
    return () => {
      cancelled = true;
      if (viewerRef.current) {
        try { viewerRef.current.remove(); } catch {}
        viewerRef.current = null;
      }
    };
  }, [imageId]);

  if (loading) return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-center px-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4" />
        <p className="text-gray-300 text-sm">{statusMsg}</p>
      </div>
    </div>
  );

  if (error || !imageId) return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="text-center text-white px-8">
        <div className="text-6xl mb-4">🌍</div>
        <p className="text-xl font-bold mb-2">{location.city || location.country}</p>
        <p className="text-gray-500 text-xs mt-4">Street view temporarily unavailable — guess on the map!</p>
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-3 left-3 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded pointer-events-none">
        📍 {location.city || location.country} — Drag to look around, click road to move
      </div>
    </div>
  );
}