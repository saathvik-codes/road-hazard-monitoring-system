import { motion } from "framer-motion";
import { useGetRoadRanking, getGetRoadRankingQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, ShieldCheck, AlertTriangle } from "lucide-react";

const SEVERITY_GRADIENT: Record<string, string> = {
  Critical: "from-[#f44336] to-[#e53935]",
  High: "from-[#ff9800] to-[#f57c00]",
  Medium: "from-[#ffc107] to-[#ffa000]",
  Low: "from-[#4caf50] to-[#388e3c]",
};

export function RoadsPage() {
  const { data: ranking, isLoading } = useGetRoadRanking({
    query: { refetchInterval: 30000, queryKey: getGetRoadRankingQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 gap-5">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const worst = ranking?.worst || [];
  const best = ranking?.best || [];
  const maxScore = Math.max(...worst.map((r) => r.severity_score), 1);

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-[#2d2d2d] tracking-tight">Road Rankings</h2>
        <p className="text-sm text-[#8a8a8a] mt-1">Comparative severity analysis across all monitored roads</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-5">
        {/* Worst Roads */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-2xl border border-[#e8e4df] shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-[#f0ece5] flex items-center gap-2 bg-[#ffebee]/30">
            <AlertTriangle size={16} className="text-[#f44336]" />
            <h3 className="text-sm font-bold text-[#c62828] uppercase tracking-widest">Most Critical</h3>
          </div>
          <div className="p-6 space-y-4">
            {worst.map((road, i) => (
              <motion.div
                key={road.road_name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-lg bg-[#faf8f5] border border-[#e8e4df] flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#6b6b6b]">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-[#2d2d2d] text-sm truncate">{road.road_name}</span>
                    <span className="text-xs font-display font-semibold text-[#6b6b6b]">{road.pothole_count} potholes</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#f0ece5] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (road.severity_score / maxScore) * 100)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                      className={`h-full rounded-full bg-gradient-to-r ${SEVERITY_GRADIENT[road.dominant_severity] || "from-gray-400 to-gray-500"}`}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-lg font-display font-bold text-[#2d2d2d]">{road.severity_score.toFixed(0)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Best Roads */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-white rounded-2xl border border-[#e8e4df] shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-[#f0ece5] flex items-center gap-2 bg-[#e8f5e9]/30">
            <ShieldCheck size={16} className="text-[#4caf50]" />
            <h3 className="text-sm font-bold text-[#2e7d32] uppercase tracking-widest">Best Condition</h3>
          </div>
          <div className="p-6 space-y-4">
            {best.map((road, i) => (
              <motion.div
                key={road.road_name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="flex items-center gap-4"
              >
                <div className="w-8 h-8 rounded-lg bg-[#faf8f5] border border-[#e8e4df] flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#6b6b6b]">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-[#2d2d2d] text-sm truncate">{road.road_name}</span>
                    <span className="text-xs font-display font-semibold text-[#6b6b6b]">{road.pothole_count} potholes</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#f0ece5] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (road.severity_score / maxScore) * 100)}%` }}
                      transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-[#4caf50] to-[#388e3c]"
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-lg font-display font-bold text-[#2d2d2d]">{road.severity_score.toFixed(0)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top of Both */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="bg-white rounded-2xl border border-[#e8e4df] shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-[#f0ece5] flex items-center gap-2">
          <Trophy size={16} className="text-[#c8a97e]" />
          <h3 className="text-sm font-bold text-[#2d2d2d] uppercase tracking-widest">Overall Leaderboard</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {[...worst, ...best].sort((a, b) => b.severity_score - a.severity_score).slice(0, 6).map((road, i) => (
              <motion.div
                key={road.road_name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="p-4 rounded-xl border border-[#e8e4df] bg-[#faf8f5]/50 hover:bg-[#f5f2ed] transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#8a8a8a] uppercase tracking-wider">#{i + 1}</span>
                  <span className="text-xs font-semibold text-[#8a8a8a]">{road.dominant_severity}</span>
                </div>
                <p className="font-semibold text-[#2d2d2d] text-sm mb-1">{road.road_name}</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-display font-bold text-[#2d2d2d]">{road.severity_score.toFixed(0)}</span>
                  <span className="text-xs text-[#8a8a8a]">{road.pothole_count} potholes</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
