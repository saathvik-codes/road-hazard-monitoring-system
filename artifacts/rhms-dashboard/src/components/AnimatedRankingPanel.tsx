import { motion } from "framer-motion";
import { useGetRoadRanking, getGetRoadRankingQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

export function AnimatedRankingPanel() {
  const { data, isLoading } = useGetRoadRanking({
    query: { refetchInterval: 30000, queryKey: getGetRoadRankingQueryKey() },
  });

  const worst = data?.worst || [];
  const maxScore = Math.max(...worst.map((r) => r.severity_score), 1);

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-[#e8e4df] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#f0ece5] flex items-center gap-2 shrink-0 bg-[#faf8f5]/50">
        <TrendingUp size={14} className="text-[#c8a97e]" strokeWidth={2.5} />
        <h3 className="text-xs font-bold text-[#2d2d2d] uppercase tracking-widest">Worst Roads</h3>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {worst.map((road, i) => (
              <motion.div
                key={road.road_name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                whileHover={{ scale: 1.02, backgroundColor: "#faf8f5" }}
                className="p-3 rounded-xl border border-[#f0ece5] hover:border-[#e8e4df] transition-all bg-white"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-6 h-6 rounded-md bg-[#ffebee] border border-[#ef9a9a] flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-[#c62828]">{i + 1}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#2d2d2d] truncate">{road.road_name}</span>
                  <span className="text-xs font-display font-bold text-[#2d2d2d] ml-auto">{road.pothole_count}</span>
                </div>
                <div className="h-2 rounded-full bg-[#f0ece5] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (road.severity_score / maxScore) * 100)}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-[#f44336] to-[#e53935]"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
