import { useEffect, useRef, useState } from "react";
import { useListDetections, getListDetectionsQueryKey } from "@workspace/api-client-react";
import { motion } from "framer-motion";

declare global {
  interface Window {
    google: any;
    initRHMSMap2: () => void;
  }
}

interface MapProps {
  onMarkerClick: (id: number) => void;
}

const MAP_STYLES = [
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#d4e8f5" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "landscape.man_made", elementType: "geometry.fill", stylers: [{ color: "#f7f4f0" }] },
  { featureType: "landscape.natural", elementType: "geometry.fill", stylers: [{ color: "#eef4e8" }] },
];

const SEVERITY_COLORS: Record<string, string> = {
  Low: "#4caf50",
  Medium: "#ffc107",
  High: "#ff9800",
  Critical: "#f44336",
};

const SEVERITY_HALO: Record<string, string> = {
  Low: "rgba(76,175,80,0.12)",
  Medium: "rgba(255,193,7,0.14)",
  High: "rgba(255,152,0,0.16)",
  Critical: "rgba(244,67,54,0.18)",
};

export function AnimatedMap({ onMarkerClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circlesRef = useRef<any[]>([]);
  const [mapReady, setMapReady] = useState(false);

  const { data: detections } = useListDetections({
    query: { refetchInterval: 30000, queryKey: getListDetectionsQueryKey() },
  });

  useEffect(() => {
    function initMap() {
      if (!mapRef.current || mapInstanceRef.current) return;
      try {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 17.385, lng: 78.4867 },
          zoom: 12,
          styles: MAP_STYLES,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
          },
        });
        mapInstanceRef.current = map;
        setMapReady(true);
      } catch (e) {
        console.error("Map init error:", e);
      }
    }

    if (window.google?.maps) {
      initMap();
    } else {
      window.initRHMSMap2 = initMap;
      if (!document.getElementById("gmaps-script-2")) {
        const script = document.createElement("script");
        script.id = "gmaps-script-2";
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
        const keyParam = apiKey ? `&key=${apiKey}` : "";
        script.src = `https://maps.googleapis.com/maps/api/js?callback=initRHMSMap2${keyParam}`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      circlesRef.current.forEach((c) => c.setMap(null));
      markersRef.current = [];
      circlesRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !detections) return;

    try {
      markersRef.current.forEach((m) => m.setMap(null));
      circlesRef.current.forEach((c) => c.setMap(null));
      markersRef.current = [];
      circlesRef.current = [];

      detections.forEach((d, i) => {
        const position = { lat: d.latitude, lng: d.longitude };
        const severity = d.severity as string;

        const haloRadius = severity === "Critical" ? 550
          : severity === "High" ? 400
          : severity === "Medium" ? 280 : 180;

        const circle = new window.google.maps.Circle({
          strokeColor: SEVERITY_COLORS[severity] ?? "#94a3b8",
          strokeOpacity: 0.35,
          strokeWeight: 1,
          fillColor: SEVERITY_HALO[severity] ?? "rgba(148,163,184,0.12)",
          fillOpacity: 1,
          map: mapInstanceRef.current,
          center: position,
          radius: haloRadius,
        });
        circlesRef.current.push(circle);

        const scale = severity === "Critical" ? 11
          : severity === "High" ? 9
          : severity === "Medium" ? 7 : 6;

        const marker = new window.google.maps.Marker({
          position,
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: SEVERITY_COLORS[severity] ?? "#94a3b8",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2.5,
            scale,
          },
          title: `${d.road_name} \u2014 ${d.pothole_count} potholes (${severity})`,
          cursor: "pointer",
          zIndex: severity === "Critical" ? 4 : severity === "High" ? 3 : 2,
          animation: window.google.maps.Animation.DROP,
        });

        marker.addListener("click", () => onMarkerClick(d.id));
        markersRef.current.push(marker);
      });
    } catch (e) {
      console.error("Map update error:", e);
    }
  }, [detections, mapReady, onMarkerClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full bg-[#f0ede8]" />
      {!mapReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f7f4f0] gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-8 h-8 border-2 border-[#2d4a7c] border-t-transparent rounded-full"
          />
          <p className="text-sm text-[#8a8a8a] font-medium">Loading map...</p>
        </div>
      )}
      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md rounded-xl px-3 py-2 shadow-sm border border-[#e8e4df] flex items-center gap-3"
      >
        {(["Low", "Medium", "High", "Critical"] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: SEVERITY_COLORS[s] }}
            />
            <span className="text-[10px] font-semibold text-[#6b6b6b] uppercase tracking-wider">{s}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
