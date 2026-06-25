import { motion } from "framer-motion";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CountUp } from "@/components/CountUp";
import { format } from "date-fns";
import { AlertCircle, CircleDot, Ruler, Clock, Activity } from "lucide-react";

const cardConfig = [
  { key: "total_roads", label: "Total Roads", icon: Activity, color: "#2d4a7c" },
  { key: "total_potholes", label: "Total Potholes", icon: CircleDot, color: "#c8a97e" },
  { key: "critical_zones", label: "Critical Zones", icon: AlertCircle, color: "#f44336" },
  { key: "avg_diameter_cm", label: "Avg Diameter", icon: Ruler, color: "#5c8a5c", suffix: " cm", decimals: 1 },
  { key: "last_detection", label: "Last Detection", icon: Clock, color: "#6b5b95", isTime: true },
];

export function AnimatedSummaryCards() {
  const { data, isLoading } = useGetDashboardSummary({
    query: { refetchInterval: 30000, queryKey: getGetDashboardSummaryQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className={`h-28 rounded-2xl${i === 4 ? " col-span-2 md:col-span-1" : ""}`} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const values = {
    total_roads: data.total_roads,
    total_potholes: data.total_potholes,
    critical_zones: data.critical_zones,
    avg_diameter_cm: data.avg_diameter_cm,
    last_detection: data.last_detection_at ? format(new Date(data.last_detection_at), "h:mm a") : "--",
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cardConfig.map((card, i) => {
        const Icon = card.icon;
        const val = values[card.key as keyof typeof values];
        const isNumber = typeof val === "number";
        const isLast = i === cardConfig.length - 1;
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
            whileHover={{ y: -4, boxShadow: "0 12px 32px rgba(0,0,0,0.08)" }}
            className={`bg-white rounded-2xl border border-[#e8e4df] shadow-sm p-4 lg:p-5 relative overflow-hidden group${isLast ? " col-span-2 md:col-span-1" : ""}`}
          >
            {/* Animated top bar */}
            <motion.div
              className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
              style={{ backgroundColor: card.color }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.6, delay: i * 0.1 + 0.3, ease: "easeOut" }}
            />
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${card.color}14` }}
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                transition={{ duration: 0.4 }}
              >
                <Icon size={16} style={{ color: card.color }} strokeWidth={2} />
              </motion.div>
              <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest">{card.label}</span>
            </div>
            <p className="text-3xl font-display font-bold text-[#2d2d2d] tracking-tight">
              {isNumber ? (
                <CountUp
                  end={val}
                  decimals={card.decimals || 0}
                  suffix={card.suffix || ""}
                />
              ) : (
                <span className="text-2xl">{val}</span>
              )}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
