import { motion } from "framer-motion";
import { useGetDetectionFeed, getGetDetectionFeedQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Radio } from "lucide-react";

const SEVERITY_COLORS: Record<string, string> = {
  Low: "bg-[#e8f5e9] text-[#2e7d32] border-[#a5d6a7]",
  Medium: "bg-[#fff8e1] text-[#f57f17] border-[#ffe082]",
  High: "bg-[#fff3e0] text-[#e65100] border-[#ffcc80]",
  Critical: "bg-[#ffebee] text-[#c62828] border-[#ef9a9a]",
};

export function AnimatedFeedPanel() {
  const { data, isLoading } = useGetDetectionFeed(
    { limit: 20 },
    { query: { refetchInterval: 10000, queryKey: getGetDetectionFeedQueryKey({ limit: 20 }) } }
  );

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-[#e8e4df] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#f0ece5] flex items-center justify-between shrink-0 bg-[#faf8f5]/50">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-[#f44336]" strokeWidth={2.5} />
          <h3 className="text-xs font-bold text-[#2d2d2d] uppercase tracking-widest">Live Feed</h3>
        </div>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4caf50] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4caf50]" />
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : !data || data.length === 0 ? (
          <div className="p-6 text-center text-sm text-[#8a8a8a]">No recent detections</div>
        ) : (
          <div className="space-y-2">
            {data.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                whileHover={{ scale: 1.02, backgroundColor: "#faf8f5" }}
                className="p-3 rounded-xl border border-[#f0ece5] hover:border-[#e8e4df] transition-all cursor-pointer bg-white"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold text-[#2d2d2d]">{item.road_name}</span>
                  <span className="text-[10px] font-mono text-[#8a8a8a]">
                    {format(new Date(item.detected_at), "h:mm a")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#6b6b6b]">
                    <span className="font-bold text-[#2d2d2d] font-display">{item.pothole_count}</span> potholes
                  </span>
                  <Badge variant="outline" className={`text-[10px] font-bold px-1.5 py-0 border ${SEVERITY_COLORS[item.severity] || ""}`}>
                    {item.severity}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
