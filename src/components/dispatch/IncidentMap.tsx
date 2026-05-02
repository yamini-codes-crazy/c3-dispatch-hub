import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Incident } from "@/hooks/useIncidents";
import { shortId } from "@/lib/format";

// Fix default marker icons (Leaflet expects assets at relative paths)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const SEVERITY_COLOR: Record<string, string> = {
  Red: "#ef4444",
  Amber: "#f59e0b",
  Green: "#22c55e",
};

function pulseIcon(color: string, isSelected: boolean) {
  const size = isSelected ? 22 : 16;
  const ring = isSelected ? 8 : 4;
  return L.divIcon({
    className: "c3-pulse-marker",
    html: `<span style="
      display:block;width:${size}px;height:${size}px;border-radius:9999px;
      background:${color};
      box-shadow:0 0 0 ${ring}px ${color}33, 0 0 16px ${color};
      border:2px solid #fff;
    "></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyTo({ center }: { center: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 0.8 });
  }, [center, map]);
  return null;
}

interface Props {
  incidents: Incident[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function IncidentMap({ incidents, selectedId, onSelect }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const points = useMemo(
    () =>
      incidents.filter(
        (i): i is Incident & { lat: number; lng: number } =>
          typeof i.lat === "number" && typeof i.lng === "number",
      ),
    [incidents],
  );

  const selected = points.find((p) => p.id === selectedId);
  const flyCenter: [number, number] | null = selected
    ? [selected.lat, selected.lng]
    : null;

  const initialCenter: [number, number] = points[0]
    ? [points[0].lat, points[0].lng]
    : [12.9716, 77.5946]; // Bengaluru fallback

  return (
    <div className="glass-inset relative h-[280px] overflow-hidden">
      {mounted && (
      <MapContainer
        center={initialCenter}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", background: "#0a0f1e" }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FlyTo center={flyCenter} />
        {points.map((p) => {
          const color = SEVERITY_COLOR[p.severity] ?? "#3b82f6";
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lng]}
              icon={pulseIcon(color, p.id === selectedId)}
              eventHandlers={{ click: () => onSelect(p.id) }}
            >
              <Popup>
                <div style={{ fontFamily: "Space Mono, monospace" }}>
                  <strong>#{shortId(p.id)}</strong>
                  <br />
                  {p.type} · {p.severity}
                  <br />
                  <span style={{ fontSize: 11, opacity: 0.7 }}>
                    {p.location?.slice(0, 60) || "—"}
                  </span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {points.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-muted-foreground">
          No geo-located incidents yet
        </div>
      )}
    </div>
  );
}
