import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { AnimatedMap } from "@/components/AnimatedMap";
import { AnimatedRankingPanel } from "@/components/AnimatedRankingPanel";
import { AnimatedSummaryCards } from "@/components/AnimatedSummaryCards";
import { DetectionPopup } from "@/components/DetectionPopup";
import { CountUp } from "@/components/CountUp";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { MapPinned } from "lucide-react";

const SEVERITY_COLORS = {
  Low: "#4caf50",
  Medium: "#ffc107",
  High: "#ff9800",
  Critical: "#f44336",
};

export function OverviewPage() {
  const [selectedDetectionId, setSelectedDetectionId] = useState<number | null>(null);
  const { data: summary } = useGetDashboardSummary({
    query: { refetchInterval: 30000, queryKey: getGetDashboardSummaryQueryKey() },
  });

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInView = useInView(mapRef, { once: true, margin: "-80px" });

  const breakdown = summary
    ? [
        { name: "Low",      value: summary.severity_breakdown.Low,      color: SEVERITY_COLORS.Low },
        { name: "Medium",   value: summary.severity_breakdown.Medium,   color: SEVERITY_COLORS.Medium },
        { name: "High",     value: summary.severity_breakdown.High,     color: SEVERITY_COLORS.High },
        { name: "Critical", value: summary.severity_breakdown.Critical, color: SEVERITY_COLORS.Critical },
      ]
    : [];

  const totalPotholes = summary?.total_potholes ?? 0;
  const hasChartData = breakdown.some((b) => b.value > 0);

  return (
    <div className="flex flex-col gap-4 lg:gap-6">

      {/* ── Hero map ─────────────────────────────────────── */}
      <motion.div
        ref={mapRef}
        initial={{ opacity: 0, y: 24 }}
        animate={mapInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="relative rounded-2xl overflow-hidden border border-[#e8e4df] shadow-sm bg-white"
        style={{ height: "clamp(260px, 56vh, 620px)" }}
      >
        <AnimatedMap onMarkerClick={setSelectedDetectionId} />

        {/* floating label */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="absolute top-3 left-3 bg-white/90 backdrop-blur-xl rounded-xl px-3.5 py-2.5 shadow-sm border border-[#e8e4df] flex items-center gap-2"
        >
          <MapPinned size={14} className="text-[#2d4a7c]" />
          <div>
            <p className="text-xs font-bold text-[#2d2d2d] leading-tight">Live Hazard Map</p>
            <p className="text-[9px] text-[#8a8a8a] font-semibold uppercase tracking-wider leading-tight">Auto-fitted</p>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Summary cards ─────────────────────────────────── */}
      <AnimatedSummaryCards />

      {/* ── Severity chart + Worst roads ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">

        {/* Severity donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45 }}
          className="bg-white rounded-2xl border border-[#e8e4df] shadow-sm p-5 flex flex-col"
          style={{ minHeight: 340 }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest">Severity Breakdown</span>
            <span className="text-xs font-bold text-[#2d4a7c] font-display">
              <CountUp end={totalPotholes} /> total
            </span>
          </div>

          {hasChartData ? (
            <>
              <div className="flex-1 relative" style={{ minHeight: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius="45%"
                      outerRadius="70%"
                      paddingAngle={4}
                      dataKey="value"
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {breakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} cursor="pointer" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid #e8e4df",
                        fontSize: 12,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-2xl font-display font-bold text-[#2d2d2d]">
                      <CountUp end={totalPotholes} />
                    </p>
                    <p className="text-[9px] font-bold text-[#8a8a8a] uppercase tracking-widest">Potholes</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-3">
                {breakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] font-bold text-[#6b6b6b]">{item.name}</span>
                    <span className="text-[10px] font-bold text-[#2d2d2d] font-display">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-8">
              <p className="text-sm font-semibold text-[#2d2d2d]">No detection data yet</p>
              <p className="text-xs text-[#8a8a8a] max-w-xs">
                Upload a road image or video on the Upload tab — YOLO will detect potholes and populate this chart automatically.
              </p>
            </div>
          )}
        </motion.div>

        {/* Worst roads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45, delay: 0.1 }}
          style={{ minHeight: 340 }}
        >
          <AnimatedRankingPanel />
        </motion.div>
      </div>

      <DetectionPopup
        id={selectedDetectionId}
        onClose={() => setSelectedDetectionId(null)}
      />
    </div>
  );
}
