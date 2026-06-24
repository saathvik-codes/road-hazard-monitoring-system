import { X, ChevronDown, ChevronRight, Layers, Maximize2, Circle, ShieldCheck, AlertTriangle, Gauge, Hammer, Thermometer } from "lucide-react";
import { useGetDetection, useListPotholes, getGetDetectionQueryKey, getListPotholesQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useState, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CountUp } from "@/components/CountUp";

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

const SEVERITY_BG: Record<string, string> = {
  Low: "#f0f9f0",
  Medium: "#fffdf5",
  High: "#fff9f0",
  Critical: "#fff0f0",
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
  const bg = detection ? SEVERITY_BG[detection.severity] || "#faf8f5" : "#faf8f5";

  // Compute derived metrics
  const totalArea = potholes?.reduce((s, p) => s + p.area_m2, 0) || 0;
  const totalPerimeter = potholes?.reduce((s, p) => s + p.perimeter_m, 0) || 0;
  const avgConfidence = potholes?.length ? potholes.reduce((s, p) => s + p.confidence, 0) / potholes.length : 0;
  const avgMask = potholes?.length ? potholes.reduce((s, p) => s + p.mask_coverage, 0) / potholes.length : 0;
  const maxDiameter = potholes?.length ? Math.max(...potholes.map((p) => p.diameter_cm)) : 0;
  const minDiameter = potholes?.length ? Math.min(...potholes.map((p) => p.diameter_cm)) : 0;
  const damageScore = detection ? Math.round(detection.severity_score * 10) / 10 : 0;

  const severityIndex = potholes?.length
    ? potholes.filter((p) => p.severity === "Critical").length * 4 +
      potholes.filter((p) => p.severity === "High").length * 3 +
      potholes.filter((p) => p.severity === "Medium").length * 2 +
      potholes.filter((p) => p.severity === "Low").length * 1
    : 0;

  const repairPriority =
    detection?.severity === "Critical" || severityIndex >= 30
      ? "Immediate"
      : detection?.severity === "High" || severityIndex >= 20
        ? "Within 48h"
        : detection?.severity === "Medium" || severityIndex >= 10
          ? "Within 7 days"
          : "Routine";

  return (
    <div className="h-full bg-white flex flex-col border-l border-[#e8e4df] shadow-2xl" style={{ background: bg }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-5 border-b border-[#e0dcd5] shrink-0 bg-white"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <motion.div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: accent }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
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
        <motion.button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-[#f0ece5] text-[#8a8a8a] transition-colors"
          whileHover={{ rotate: 90 }}
          transition={{ duration: 0.2 }}
        >
          <X size={18} />
        </motion.button>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-5 space-y-5">
        {/* Stats Grid */}
        {loadingDetection ? (
          <Skeleton className="h-36 w-full rounded-xl" />
        ) : detection ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-2 gap-3"
          >
            {[
              { icon: Circle, label: "Detected", value: format(new Date(detection.detected_at), "MMM d, h:mm a") },
              { icon: Layers, label: "Total Potholes", value: detection.pothole_count, isCount: true },
              { icon: Maximize2, label: "Avg Diameter", value: `${detection.avg_diameter_cm.toFixed(1)} cm` },
              { icon: Gauge, label: "Damage Score", value: damageScore, isCount: true, decimals: 1 },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}
                  className="bg-white p-3 rounded-xl border border-[#e8e4df] flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#faf8f5] border border-[#e8e4df] flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-[#8a8a8a]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-[#8a8a8a] uppercase tracking-widest">{stat.label}</p>
                    <p className="text-sm font-bold text-[#2d2d2d]">
                      {stat.isCount && typeof stat.value === "number" ? (
                        <CountUp end={stat.value} decimals={stat.decimals || 0} />
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : null}

        {/* Aggregated Metrics */}
        {!loadingPotholes && potholes && potholes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white p-4 rounded-xl border border-[#e8e4df]"
          >
            <h3 className="text-[10px] font-bold text-[#2d2d2d] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Hammer size={12} className="text-[#c8a97e]" />
              Aggregate Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Affected Area", value: totalArea.toFixed(2), suffix: " m\u00b2" },
                { label: "Total Perimeter", value: totalPerimeter.toFixed(2), suffix: " m" },
                { label: "Avg Confidence", value: (avgConfidence * 100).toFixed(1), suffix: "%" },
                { label: "Avg Mask Coverage", value: (avgMask * 100).toFixed(1), suffix: "%" },
                { label: "Max Diameter", value: maxDiameter.toFixed(1), suffix: " cm" },
                { label: "Min Diameter", value: minDiameter.toFixed(1), suffix: " cm" },
                { label: "Severity Index", value: severityIndex.toString(), suffix: "" },
                { label: "Repair Priority", value: repairPriority, suffix: "", isBadge: true },
              ].map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-[#faf8f5] border border-[#f0ece5]"
                >
                  <span className="text-[9px] font-bold text-[#8a8a8a] uppercase tracking-widest">{m.label}</span>
                  {m.isBadge ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      m.value === "Immediate" ? "bg-[#ffebee] text-[#c62828] border-[#ef9a9a]" :
                      m.value === "Within 48h" ? "bg-[#fff3e0] text-[#e65100] border-[#ffcc80]" :
                      m.value === "Within 7 days" ? "bg-[#fff8e1] text-[#f57f17] border-[#ffe082]" :
                      "bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]"
                    }`}>
                      {m.value}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-[#2d2d2d] font-display">{m.value}{m.suffix}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Images */}
        <div>
          <h3 className="text-xs font-bold text-[#2d2d2d] uppercase tracking-widest mb-3">Vision Output</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Original", url: detection?.original_image_url },
              { label: "Detected", url: detection?.detected_image_url },
              { label: "Mask", url: detection?.mask_image_url },
            ].map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                whileHover={{ scale: 1.03 }}
                className="flex flex-col gap-1"
              >
                <div className="aspect-square bg-[#f0ece5] rounded-xl border border-[#e8e4df] flex items-center justify-center overflow-hidden group cursor-pointer">
                  {img.url ? (
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <span className="text-[10px] text-[#8a8a8a] font-bold uppercase tracking-widest text-center px-2">No Image</span>
                  )}
                </div>
                <span className="text-[10px] text-center text-[#8a8a8a] font-bold uppercase tracking-wider">{img.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Pothole Details */}
        <div>
          <h3 className="text-xs font-bold text-[#2d2d2d] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Thermometer size={12} className="text-[#f44336]" />
            Pothole Details
          </h3>
          {loadingPotholes ? (
            <Skeleton className="h-48 w-full rounded-xl" />
          ) : potholes && potholes.length > 0 ? (
            <div className="border border-[#e8e4df] rounded-xl overflow-hidden bg-white">
              <table className="w-full text-sm">
                <thead className="bg-[#faf8f5] border-b border-[#f0ece5]">
                  <tr>
                    <th className="w-8"></th>
                    <th className="px-3 py-2.5 font-bold text-[10px] text-[#8a8a8a] uppercase tracking-widest">ID</th>
                    <th className="px-3 py-2.5 font-bold text-[10px] text-[#8a8a8a] uppercase tracking-widest">Diam</th>
                    <th className="px-3 py-2.5 font-bold text-[10px] text-[#8a8a8a] uppercase tracking-widest">Sev</th>
                    <th className="px-3 py-2.5 font-bold text-[10px] text-[#8a8a8a] uppercase tracking-widest">Conf</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ece5]">
                  {potholes.map((p) => {
                    const isExpanded = expandedPotholeId === p.id;
                    return (
                      <Fragment key={p.id}>
                        <motion.tr
                          className="hover:bg-[#faf8f5] cursor-pointer transition-colors"
                          onClick={() => setExpandedPotholeId(isExpanded ? null : p.id)}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <td className="pl-2 text-[#8a8a8a]">
                            <motion.div
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRight size={14} />
                            </motion.div>
                          </td>
                          <td className="px-3 py-2.5 font-mono text-[#8a8a8a] text-xs">{p.pothole_code}</td>
                          <td className="px-3 py-2.5 font-display font-bold text-[#2d2d2d]">{p.diameter_cm.toFixed(1)} cm</td>
                          <td className="px-3 py-2.5">
                            <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 border ${SEVERITY_COLORS[p.severity]}`}>
                              {p.severity}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              p.confidence > 0.9 ? "bg-[#e8f5e9] text-[#2e7d32]" :
                              p.confidence > 0.7 ? "bg-[#fff8e1] text-[#f57f17]" :
                              "bg-[#fff3e0] text-[#e65100]"
                            }`}>
                              {(p.confidence * 100).toFixed(0)}%
                            </span>
                          </td>
                        </motion.tr>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                              className="bg-[#faf8f5]/50"
                            >
                              <td colSpan={5} className="px-3 pb-4 pt-1">
                                <div className="grid grid-cols-2 gap-y-2 gap-x-3 bg-white p-3 rounded-xl border border-[#e8e4df] shadow-sm">
                                  {[
                                    { label: "Area", value: `${p.area_m2.toFixed(2)} m\u00b2`, icon: Layers },
                                    { label: "Perimeter", value: `${p.perimeter_m.toFixed(2)} m`, icon: Circle },
                                    { label: "Mask Coverage", value: `${(p.mask_coverage * 100).toFixed(1)}%`, icon: ShieldCheck },
                                    { label: "Confidence", value: `${(p.confidence * 100).toFixed(1)}%`, icon: AlertTriangle },
                                  ].map((field, fi) => {
                                    const FIcon = field.icon;
                                    return (
                                      <motion.div
                                        key={field.label}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: fi * 0.05 }}
                                        className="flex items-center justify-between"
                                      >
                                        <div className="flex items-center gap-1.5">
                                          <FIcon size={11} className="text-[#8a8a8a]" />
                                          <span className="text-[10px] uppercase tracking-widest text-[#8a8a8a] font-bold">{field.label}</span>
                                        </div>
                                        <span className="text-xs font-display font-bold text-[#2d2d2d]">{field.value}</span>
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </AnimatePresence>
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
