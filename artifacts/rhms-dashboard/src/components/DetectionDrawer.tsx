import { X, ChevronDown, ChevronRight } from "lucide-react";
import { useGetDetection, useListPotholes, getGetDetectionQueryKey, getListPotholesQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useState, Fragment } from "react";
import { motion } from "framer-motion";

const SEVERITY_COLORS: Record<string, string> = {
  Low: "bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]",
  Medium: "bg-[#fff8e1] text-[#f57f17] border-[#ffe082]",
  High: "bg-[#fff3e0] text-[#e65100] border-[#ffcc80]",
  Critical: "bg-[#ffebee] text-[#c62828] border-[#ef9a9a]",
};

const SEVERITY_ACCENT: Record<string, string> = {
  Low: "#4caf50",
  Medium: "#ffc107",
  High: "#ff9800",
  Critical: "#f44336",
};

interface DetectionDrawerProps {
  id: number;
  onClose: () => void;
}

export function DetectionDrawer({ id, onClose }: DetectionDrawerProps) {
  const { data: detection, isLoading: loadingDetection } = useGetDetection(id, {
    query: { queryKey: getGetDetectionQueryKey(id) },
  });
  const { data: potholes, isLoading: loadingPotholes } = useListPotholes(
    { detection_id: id },
    { query: { queryKey: getListPotholesQueryKey({ detection_id: id }) } },
  );
  const [expandedPotholeId, setExpandedPotholeId] = useState<number | null>(null);

  const accent = detection ? SEVERITY_ACCENT[detection.severity] || "#2d4a7c" : "#2d4a7c";

  return (
    <div className="h-full bg-white flex flex-col border-l border-[#e8e4df] shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-[#f0ece5] shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
            <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest">Detection #{id}</span>
          </div>
          {loadingDetection ? (
            <Skeleton className="h-6 w-48" />
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-[#2d2d2d]">{detection?.road_name}</span>
              {detection && (
                <Badge variant="outline" className={`text-[10px] font-bold ${SEVERITY_COLORS[detection.severity]}`}>
                  {detection.severity}
                </Badge>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-[#f0ece5] text-[#8a8a8a] transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-6">
        {loadingDetection ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : detection ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3 text-sm bg-[#faf8f5] p-4 rounded-xl border border-[#f0ece5]"
          >
            <div>
              <p className="text-[#8a8a8a] text-[10px] uppercase tracking-widest mb-1 font-bold">Detected</p>
              <p className="font-medium text-[#2d2d2d]">{format(new Date(detection.detected_at), "MMM d, h:mm a")}</p>
            </div>
            <div>
              <p className="text-[#8a8a8a] text-[10px] uppercase tracking-widest mb-1 font-bold">Total Potholes</p>
              <p className="font-display font-bold text-[#2d2d2d] text-lg">{detection.pothole_count}</p>
            </div>
            <div>
              <p className="text-[#8a8a8a] text-[10px] uppercase tracking-widest mb-1 font-bold">Avg Diameter</p>
              <p className="font-display font-bold text-[#2d2d2d]">{detection.avg_diameter_cm.toFixed(1)} cm</p>
            </div>
            <div>
              <p className="text-[#8a8a8a] text-[10px] uppercase tracking-widest mb-1 font-bold">Coordinates</p>
              <p className="font-mono text-xs text-[#2d2d2d]">
                {detection.latitude.toFixed(4)}, {detection.longitude.toFixed(4)}
              </p>
            </div>
          </motion.div>
        ) : null}

        {/* Images */}
        <div>
          <h3 className="text-xs font-bold text-[#2d2d2d] uppercase tracking-widest mb-3">Vision Output</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Original", url: detection?.original_image_url },
              { label: "Detected", url: detection?.detected_image_url },
              { label: "Mask", url: detection?.mask_image_url },
            ].map((img, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="aspect-square bg-[#f0ece5] rounded-xl border border-[#e8e4df] flex items-center justify-center overflow-hidden">
                  {img.url ? (
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-[#8a8a8a] font-bold uppercase tracking-widest text-center px-2">No Image</span>
                  )}
                </div>
                <span className="text-[10px] text-center text-[#8a8a8a] font-bold uppercase tracking-wider">{img.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pothole Details */}
        <div>
          <h3 className="text-xs font-bold text-[#2d2d2d] uppercase tracking-widest mb-3">Pothole Details</h3>
          {loadingPotholes ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : potholes && potholes.length > 0 ? (
            <div className="border border-[#e8e4df] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#faf8f5] border-b border-[#f0ece5]">
                  <tr>
                    <th className="w-8"></th>
                    <th className="px-4 py-2.5 font-bold text-[10px] text-[#8a8a8a] uppercase tracking-widest">ID</th>
                    <th className="px-4 py-2.5 font-bold text-[10px] text-[#8a8a8a] uppercase tracking-widest">Diam</th>
                    <th className="px-4 py-2.5 font-bold text-[10px] text-[#8a8a8a] uppercase tracking-widest">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ece5]">
                  {potholes.map((p) => {
                    const isExpanded = expandedPotholeId === p.id;
                    return (
                      <Fragment key={p.id}>
                        <tr
                          className="hover:bg-[#faf8f5] cursor-pointer transition-colors"
                          onClick={() => setExpandedPotholeId(isExpanded ? null : p.id)}
                        >
                          <td className="pl-3 text-[#8a8a8a]">
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[#8a8a8a] text-xs">{p.pothole_code}</td>
                          <td className="px-4 py-2.5 font-display font-bold text-[#2d2d2d]">{p.diameter_cm.toFixed(1)} cm</td>
                          <td className="px-4 py-2.5">
                            <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 border ${SEVERITY_COLORS[p.severity]}`}>
                              {p.severity}
                            </Badge>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-[#faf8f5]/50">
                            <td colSpan={4} className="px-4 pb-4 pt-1">
                              <div className="grid grid-cols-2 gap-y-2 gap-x-4 bg-white p-3 rounded-xl border border-[#e8e4df]">
                                <div className="flex justify-between">
                                  <span className="text-[10px] uppercase tracking-widest text-[#8a8a8a] font-bold">Area</span>
                                  <span className="text-xs font-display font-bold">{p.area_m2.toFixed(2)} m²</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[10px] uppercase tracking-widest text-[#8a8a8a] font-bold">Perimeter</span>
                                  <span className="text-xs font-display font-bold">{p.perimeter_m.toFixed(2)} m</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[10px] uppercase tracking-widest text-[#8a8a8a] font-bold">Mask Coverage</span>
                                  <span className="text-xs font-display font-bold">{(p.mask_coverage * 100).toFixed(1)}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[10px] uppercase tracking-widest text-[#8a8a8a] font-bold">Confidence</span>
                                  <span className="text-xs font-display font-bold text-[#4caf50]">{(p.confidence * 100).toFixed(1)}%</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-[#8a8a8a] text-center py-6 bg-[#faf8f5] rounded-xl border border-[#e8e4df] border-dashed">No detailed metrics available</p>
          )}
        </div>
      </div>
    </div>
  );
}
