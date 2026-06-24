import { useState } from "react";
import { motion } from "framer-motion";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { AnimatedMap } from "@/components/AnimatedMap";
import { MarqueeFeed } from "@/components/MarqueeFeed";
import { AnimatedRankingPanel } from "@/components/AnimatedRankingPanel";
import { AnimatedSummaryCards } from "@/components/AnimatedSummaryCards";
import { DetectionDrawer } from "@/components/DetectionDrawer";
import { CountUp } from "@/components/CountUp";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export function OverviewPage() {
  const [selectedDetectionId, setSelectedDetectionId] = useState<number | null>(null);
  const { data: summary } = useGetDashboardSummary({
    query: { refetchInterval: 30000, queryKey: getGetDashboardSummaryQueryKey() },
  });

  const breakdown = summary ? [
    { name: "Low", value: summary.severity_breakdown.Low, color: "#4caf50" },
    { name: "Medium", value: summary.severity_breakdown.Medium, color: "#ffc107" },
    { name: "High", value: summary.severity_breakdown.High, color: "#ff9800" },
    { name: "Critical", value: summary.severity_breakdown.Critical, color: "#f44336" },
  ] : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-[#2d2d2d] tracking-tight">Dashboard Overview</h2>
        <p className="text-sm text-[#8a8a8a] mt-1">Real-time road hazard monitoring across all zones</p>
      </motion.div>

      {/* Summary Cards */}
      <AnimatedSummaryCards />

      {/* Main Content Area */}
      <div className="flex gap-5" style={{ height: "calc(100vh - 230px)", minHeight: 520 }}>
        {/* Map - Left side */}
        <div className="relative flex-1 rounded-2xl overflow-hidden border border-[#e8e4df] shadow-sm bg-white min-h-0">
          <AnimatedMap onMarkerClick={setSelectedDetectionId} />
          {selectedDetectionId && (
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="absolute top-0 right-0 w-[400px] h-full z-20"
            >
              <DetectionDrawer
                id={selectedDetectionId}
                onClose={() => setSelectedDetectionId(null)}
              />
            </motion.div>
          )}
        </div>

        {/* Right Panels */}
        <div className="w-[300px] shrink-0 flex flex-col gap-4 min-h-0">
          {/* Mini donut chart */}
          {summary && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-white rounded-2xl border border-[#e8e4df] shadow-sm p-4 shrink-0"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest">Severity Breakdown</span>
                <span className="text-xs font-bold text-[#2d4a7c]"><CountUp end={summary.total_potholes} /> total</span>
              </div>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdown} cx="50%" cy="50%" innerRadius={22} outerRadius={36} paddingAngle={3} dataKey="value" stroke="#fff" strokeWidth={2}>
                      {breakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center gap-3 mt-1">
                {breakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] font-bold text-[#6b6b6b]">{item.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="flex-1 min-h-0">
            <MarqueeFeed />
          </div>
          <div className="flex-1 min-h-0">
            <AnimatedRankingPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
