import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useListDetections, getListDetectionsQueryKey } from "@workspace/api-client-react";
import { Trophy, MapPin, Video, ImageIcon, Layers, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CountUp } from "@/components/CountUp";
import { DetectionPopup } from "@/components/DetectionPopup";
import { isVideoUrl } from "@/lib/media";

const SEVERITY_COLORS: Record<string, string> = {
  Low: "bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]",
  Medium: "bg-[#fff8e1] text-[#f57f17] border-[#ffe082]",
  High: "bg-[#fff3e0] text-[#e65100] border-[#ffcc80]",
  Critical: "bg-[#ffebee] text-[#c62828] border-[#ef9a9a]",
};

const SEVERITY_DOT: Record<string, string> = {
  Low: "#4caf50", Medium: "#ffc107", High: "#ff9800", Critical: "#f44336",
};

const RANK_RING = [
  "ring-2 ring-[#ffd54f]",
  "ring-2 ring-[#c0c0c0]",
  "ring-2 ring-[#cd7f32]/70",
];

const RANK_BADGE = [
  "bg-[#fff8e1] text-[#f57f17] border-[#ffe082]",
  "bg-[#f3f3f3] text-[#5c5c5c] border-[#dcdcdc]",
  "bg-[#fbe9e1] text-[#a0522d] border-[#e8c4ad]",
];

function MediaThumb({ url, className = "" }: { url: string | null | undefined; className?: string }) {
  if (!url) {
    return (
      <div className={`flex items-center justify-center bg-[#f0ece5] ${className}`}>
        <span className="text-[9px] text-[#8a8a8a] font-bold uppercase tracking-widest">No Media</span>
      </div>
    );
  }
  if (isVideoUrl(url)) {
    return (
      <div className={`relative ${className}`}>
        <video src={url} muted playsInline preload="metadata" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/15">
          <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
            <Video size={14} className="text-[#2d2d2d]" />
          </div>
        </div>
      </div>
    );
  }
  return <img src={url} alt="" className={`object-cover ${className}`} />;
}

export function GalleryPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: detections, isLoading } = useListDetections({
    query: { refetchInterval: 30000, queryKey: getListDetectionsQueryKey() },
  });

  const sorted = useMemo(
    () => (detections ? [...detections].sort((a, b) => b.severity_score - a.severity_score) : []),
    [detections],
  );
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const withMedia = sorted.filter((d) => d.original_image_url).length;
  const withVideo = sorted.filter((d) => isVideoUrl(d.original_image_url) || isVideoUrl(d.detected_image_url)).length;
  const totalPotholes = sorted.reduce((s, d) => s + d.pothole_count, 0);
  const criticalCount = sorted.filter((d) => d.severity === "Critical").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#2d2d2d] tracking-tight">Media Gallery</h2>
          <p className="text-sm text-[#8a8a8a] mt-1">Captured pothole images & videos across every monitored location</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#8a8a8a]">
          <span className="font-medium text-[#2d2d2d]">{sorted.length}</span> locations
        </div>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "With Media", value: withMedia, icon: ImageIcon, color: "#2d4a7c" },
          { label: "Videos", value: withVideo, icon: Video, color: "#6b5b95" },
          { label: "Total Potholes", value: totalPotholes, icon: Layers, color: "#c8a97e" },
          { label: "Critical Zones", value: criticalCount, icon: AlertCircle, color: "#f44336" },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-[#e8e4df] p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${s.color}14` }}>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-xl font-display font-bold text-[#2d2d2d]"><CountUp end={s.value} /></p>
                <p className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest">{s.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Top 3 most critical */}
      {!isLoading && top3.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-[#c8a97e]" />
            <h3 className="text-sm font-bold text-[#2d2d2d] uppercase tracking-widest">Most Critical Locations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedId(d.id)}
                className={`relative bg-white rounded-2xl border border-[#e8e4df] overflow-hidden cursor-pointer shadow-sm ${RANK_RING[i]}`}
              >
                <MediaThumb url={d.original_image_url} className="w-full h-40" />
                <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded-lg border ${RANK_BADGE[i]}`}>
                  #{i + 1}
                </span>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#2d2d2d] text-sm truncate">{d.road_name}</span>
                    <Badge variant="outline" className={`text-[10px] font-bold shrink-0 ${SEVERITY_COLORS[d.severity] || ""}`}>
                      {d.severity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#8a8a8a]">
                    <span>{d.pothole_count} potholes</span>
                    <span>Score {d.severity_score.toFixed(0)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All locations */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#2d2d2d] uppercase tracking-widest">All Locations</h3>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : rest.length === 0 ? (
          <p className="text-sm text-[#8a8a8a]">No additional locations yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {rest.map((d, i) => (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                whileHover={{ y: -3 }}
                onClick={() => setSelectedId(d.id)}
                className="bg-white rounded-2xl border border-[#e8e4df] overflow-hidden cursor-pointer shadow-sm"
              >
                <MediaThumb url={d.original_image_url} className="w-full h-32" />
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-[#2d2d2d] text-xs truncate">{d.road_name}</span>
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: SEVERITY_DOT[d.severity] || "#ccc" }} />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#8a8a8a]">
                    <MapPin size={10} />
                    <span>{format(new Date(d.detected_at), "MMM d, h:mm a")}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <DetectionPopup id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}
