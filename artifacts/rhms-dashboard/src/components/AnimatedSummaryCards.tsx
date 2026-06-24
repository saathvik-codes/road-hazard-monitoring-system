import { motion } from "framer-motion";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { AlertCircle, CircleDot, Ruler, Clock } from "lucide-react";

const cardConfig = [
  { key: "total_roads", label: "Total Roads", icon: CircleDot, color: "#2d4a7c" },
  { key: "total_potholes", label: "Total Potholes", icon: CircleDot, color: "#c8a97e" },
  { key: "critical_zones", label: "Critical Zones", icon: AlertCircle, color: "#f44336" },
  { key: "avg_diameter_cm", label: "Avg Diameter", icon: Ruler, color: "#5c8a5c", suffix: "cm" },
  { key: "last_detection", label: "Last Detection", icon: Clock, color: "#6b5b95", isTime: true },
];

export function AnimatedSummaryCards() {
  const { data, isLoading } = useGetDashboardSummary({
    query: { refetchInterval: 30000, queryKey: getGetDashboardSummaryQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const values = {
    total_roads: data.total_roads,
    total_potholes: data.total_potholes,
    critical_zones: data.critical_zones,
    avg_diameter_cm: data.avg_diameter_cm.toFixed(1),
    last_detection: data.last_detection_at ? format(new Date(data.last_detection_at), "h:mm a") : "--",
  };

  return (
    <div className="grid grid-cols-5 gap-4">
      {cardConfig.map((card, i) => {
        const Icon = card.icon;
        const value = values[card.key as keyof typeof values];
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
            whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
            className="bg-white rounded-2xl border border-[#e8e4df] shadow-sm p-5 relative overflow-hidden group"
          >
            {/* Top accent */}
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
              style={{ backgroundColor: card.color }}
            />
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${card.color}12` }}
              >
                <Icon size={16} style={{ color: card.color }} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest">{card.label}</span>
            </div>
            <p className="text-2xl font-display font-bold text-[#2d2d2d]">
              {value}
              {card.suffix && <span className="text-sm text-[#8a8a8a] font-medium ml-1">{card.suffix}</span>}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
