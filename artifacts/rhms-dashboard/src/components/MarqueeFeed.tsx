import { useEffect, useRef } from "react";
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

const SEVERITY_DOT: Record<string, string> = {
  Low: "#4caf50",
  Medium: "#ffc107",
  High: "#ff9800",
  Critical: "#f44336",
};

export function MarqueeFeed() {
  const { data, isLoading } = useGetDetectionFeed(
    { limit: 20 },
    { query: { refetchInterval: 10000, queryKey: getGetDetectionFeedQueryKey({ limit: 20 }) } }
  );
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !data || data.length <= 3) return;

    let pos = 0;
    let speed = 0.5;
    let raf: number;

    const tick = () => {
      pos += speed;
      const max = el.scrollHeight - el.clientHeight;
      if (pos >= max) pos = 0;
      el.scrollTop = pos;
      raf = requestAnimationFrame(tick);
    };

    // Pause on hover, resume on leave
    const pause = () => { speed = 0; };
    const resume = () => { speed = 0.5; };

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
    };
  }, [data]);

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-[#e8e4df] shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-[#f0ece5] flex items-center justify-between shrink-0 bg-[#faf8f5]/50">
        <div className="flex items-center gap-2">
          <Radio size={14} className="text-[#f44336] animate-pulse" strokeWidth={2.5} />
          <h3 className="text-xs font-bold text-[#2d2d2d] uppercase tracking-widest">Live Feed</h3>
        </div>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4caf50] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4caf50]" />
        </span>
      </div>
      <div
        ref={scrollerRef}
        className="flex-1 overflow-hidden p-3 space-y-2"
      >
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
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
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, delay: i * 0.05, ease: "easeOut" }}
                whileHover={{ scale: 1.02, x: 4 }}
                className="p-3 rounded-xl border border-[#f0ece5] hover:border-[#e0dcd5] transition-all cursor-pointer bg-white group"
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                    style={{ backgroundColor: SEVERITY_DOT[item.severity] || "#ccc" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <span className="text-xs font-bold text-[#2d2d2d] truncate">{item.road_name}</span>
                      <span className="text-[10px] font-mono text-[#8a8a8a] shrink-0 ml-2">
                        {format(new Date(item.detected_at), "h:mm a")}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-[#8a8a8a]">
                        <span className="font-bold text-[#2d2d2d]">{item.pothole_count}</span> potholes
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold px-1.5 py-0 border ${SEVERITY_COLORS[item.severity] || ""}`}
                      >
                        {item.severity}
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
