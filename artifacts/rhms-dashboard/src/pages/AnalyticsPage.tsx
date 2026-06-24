import { motion } from "framer-motion";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const SEVERITY_COLORS = {
  Low: "#4caf50",
  Medium: "#ffc107",
  High: "#ff9800",
  Critical: "#f44336",
};

export function AnalyticsPage() {
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { refetchInterval: 30000, queryKey: getGetDashboardSummaryQueryKey() },
  });

  const breakdown = summary
    ? [
        { name: "Low", value: summary.severity_breakdown.Low, color: SEVERITY_COLORS.Low },
        { name: "Medium", value: summary.severity_breakdown.Medium, color: SEVERITY_COLORS.Medium },
        { name: "High", value: summary.severity_breakdown.High, color: SEVERITY_COLORS.High },
        { name: "Critical", value: summary.severity_breakdown.Critical, color: SEVERITY_COLORS.Critical },
      ]
    : [];

  const barData = [
    { name: "Low", count: summary?.severity_breakdown.Low || 0, fill: SEVERITY_COLORS.Low },
    { name: "Medium", count: summary?.severity_breakdown.Medium || 0, fill: SEVERITY_COLORS.Medium },
    { name: "High", count: summary?.severity_breakdown.High || 0, fill: SEVERITY_COLORS.High },
    { name: "Critical", count: summary?.severity_breakdown.Critical || 0, fill: SEVERITY_COLORS.Critical },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-[#2d2d2d] tracking-tight">Analytics</h2>
        <p className="text-sm text-[#8a8a8a] mt-1">Severity distribution and statistical breakdown</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))
        ) : (
          [
            { label: "Total Roads", value: summary?.total_roads || 0, suffix: "" },
            { label: "Total Potholes", value: summary?.total_potholes || 0, suffix: "" },
            { label: "Critical Zones", value: summary?.critical_zones || 0, suffix: "" },
            { label: "Avg Diameter", value: summary?.avg_diameter_cm?.toFixed(1) || "0", suffix: "cm" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-[#e8e4df] shadow-sm p-5"
            >
              <p className="text-xs font-medium text-[#8a8a8a] uppercase tracking-widest mb-2">{stat.label}</p>
              <p className="text-3xl font-display font-bold text-[#2d2d2d]">
                {stat.value}
                {stat.suffix && <span className="text-lg text-[#8a8a8a] ml-1">{stat.suffix}</span>}
              </p>
            </motion.div>
          ))
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-5">
        {/* Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-white rounded-2xl border border-[#e8e4df] shadow-sm p-6"
        >
          <h3 className="text-sm font-bold text-[#2d2d2d] uppercase tracking-widest mb-4">
            Severity Distribution
          </h3>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#fff"
                  >
                    {breakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e8e4df",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex items-center justify-center gap-4 mt-2">
            {breakdown.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-[#6b6b6b]">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-white rounded-2xl border border-[#e8e4df] shadow-sm p-6"
        >
          <h3 className="text-sm font-bold text-[#2d2d2d] uppercase tracking-widest mb-4">
            Potholes by Severity
          </h3>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ece5" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#6b6b6b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#6b6b6b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e8e4df",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
