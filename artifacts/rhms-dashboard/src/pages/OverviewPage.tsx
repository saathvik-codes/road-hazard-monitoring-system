import { useState } from "react";
import { motion } from "framer-motion";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { AnimatedMap } from "@/components/AnimatedMap";
import { AnimatedFeedPanel } from "@/components/AnimatedFeedPanel";
import { AnimatedRankingPanel } from "@/components/AnimatedRankingPanel";
import { AnimatedSummaryCards } from "@/components/AnimatedSummaryCards";
import { DetectionDrawer } from "@/components/DetectionDrawer";

export function OverviewPage() {
  const [selectedDetectionId, setSelectedDetectionId] = useState<number | null>(null);

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <AnimatedSummaryCards />

      {/* Main Content Area */}
      <div className="flex gap-5" style={{ height: "calc(100vh - 200px)", minHeight: 520 }}>
        {/* Map */}
        <div className="relative flex-1 rounded-2xl overflow-hidden border border-[#e8e4df] shadow-sm bg-white">
          <AnimatedMap onMarkerClick={setSelectedDetectionId} />
          {selectedDetectionId && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
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
        <div className="w-[320px] shrink-0 flex flex-col gap-5">
          <AnimatedFeedPanel />
          <AnimatedRankingPanel />
        </div>
      </div>
    </div>
  );
}
