import { useState } from "react";
import { motion } from "framer-motion";
import { useListDetections, getListDetectionsQueryKey } from "@workspace/api-client-react";
import { ArrowUpDown, MapPin } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const SEVERITY_COLORS: Record<string, string> = {
  Low: "bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]",
  Medium: "bg-[#fff8e1] text-[#f57f17] border-[#ffe082]",
  High: "bg-[#fff3e0] text-[#e65100] border-[#ffcc80]",
  Critical: "bg-[#ffebee] text-[#c62828] border-[#ef9a9a]",
};

const SEVERITY_DOT: Record<string, string> = {
  Low: "#4caf50",
  Medium: "#ffc107",
  High: "#ff9800",
  Critical: "#f44336",
};

export function DetectionsPage() {
  const { data: detections, isLoading } = useListDetections({
    query: { refetchInterval: 30000, queryKey: getListDetectionsQueryKey() },
  });
  const [sortBy, setSortBy] = useState<"severity" | "time" | "potholes">("time");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = detections ? [...detections].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "time") return dir * (new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime());
    if (sortBy === "potholes") return dir * (a.pothole_count - b.pothole_count);
    const sevOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
    return dir * (sevOrder[a.severity as keyof typeof sevOrder] - sevOrder[b.severity as keyof typeof sevOrder]);
  }) : [];

  const toggleSort = (field: "severity" | "time" | "potholes") => {
    if (sortBy === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortBy(field); setSortDir("desc"); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#2d2d2d] tracking-tight">All Detections</h2>
          <p className="text-sm text-[#8a8a8a] mt-1">Real-time YOLOv8 detection feed across monitored zones</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#8a8a8a]">
          <span className="font-medium text-[#2d2d2d]">{detections?.length || 0}</span> total detections
        </div>
      </motion.div>

      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        {([
          { key: "time" as const, label: "Time" },
          { key: "severity" as const, label: "Severity" },
          { key: "potholes" as const, label: "Potholes" },
        ]).map((s) => (
          <button
            key={s.key}
            onClick={() => toggleSort(s.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              sortBy === s.key
                ? "bg-[#2d4a7c] text-white shadow-sm"
                : "bg-white border border-[#e8e4df] text-[#6b6b6b] hover:text-[#2d2d2d]"
            }`}
          >
            {s.label}
            {sortBy === s.key && (
              <ArrowUpDown size={14} className={sortDir === "desc" ? "rotate-180" : ""} />
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#e8e4df] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f8f6f2] border-b border-[#e8e4df]">
              <tr>
                <th className="text-left px-5 py-3.5 font-semibold text-[#6b6b6b] text-xs uppercase tracking-widest">Status</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[#6b6b6b] text-xs uppercase tracking-widest">Road</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[#6b6b6b] text-xs uppercase tracking-widest">Location</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[#6b6b6b] text-xs uppercase tracking-widest">Potholes</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[#6b6b6b] text-xs uppercase tracking-widest">Severity</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[#6b6b6b] text-xs uppercase tracking-widest">Score</th>
                <th className="text-left px-5 py-3.5 font-semibold text-[#6b6b6b] text-xs uppercase tracking-widest">Detected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ece5]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-4 rounded-full" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16 rounded-md" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                  </tr>
                ))
              ) : sorted.map((d, i) => (
                <motion.tr
                  key={d.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="hover:bg-[#faf8f5] transition-colors group"
                >
                  <td className="px-5 py-4">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: SEVERITY_DOT[d.severity] || "#ccc" }}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-[#2d2d2d]">{d.road_name}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 text-[#8a8a8a]">
                      <MapPin size={13} />
                      <span className="text-xs font-mono">
                        {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-display font-semibold text-[#2d2d2d]">{d.pothole_count}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant="outline" className={`text-xs font-semibold ${SEVERITY_COLORS[d.severity] || ""}`}>
                      {d.severity}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-display font-semibold text-[#2d2d2d]">{d.severity_score.toFixed(0)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-[#8a8a8a]">
                      {format(new Date(d.detected_at), "MMM d, h:mm a")}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
