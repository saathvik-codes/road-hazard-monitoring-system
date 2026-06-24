import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CountUp } from "@/components/CountUp";
import { Activity, CircleDot, AlertCircle, Ruler, Gauge } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

interface CardItem {
  title: string;
  value: number | string;
  decimals?: number;
  suffix?: string;
  icon: React.ReactNode;
  accentColor: string;
}

export function GsapHorizontalScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const cards: CardItem[] = [
    { title: "Total Roads", value: 12, icon: <Activity size={16} />, accentColor: "#2d4a7c" },
    { title: "Total Potholes", value: 24, icon: <CircleDot size={16} />, accentColor: "#c8a97e" },
    { title: "Critical Zones", value: 5, icon: <AlertCircle size={16} />, accentColor: "#f44336" },
    { title: "Avg Diameter", value: 28.5, decimals: 1, suffix: " cm", icon: <Ruler size={16} />, accentColor: "#5c8a5c" },
    { title: "Damage Score", value: 145.3, decimals: 1, suffix: "", icon: <Gauge size={16} />, accentColor: "#6b5b95" },
  ];

  useEffect(() => {
    const container = containerRef.current;
    const scrollContainer = scrollRef.current;
    if (!container || !scrollContainer) return;

    const scrollWidth = scrollContainer.scrollWidth - container.clientWidth;

    const tween = gsap.to(scrollContainer, {
      x: -scrollWidth,
      ease: "none",
      scrollTrigger: {
        trigger: container,
        start: "top 20%",
        end: () => `+=${scrollWidth}`,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
      },
    });

    return () => {
      tween.kill();
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === container) t.kill();
      });
    };
  }, []);

  return (
    <div ref={containerRef} className="overflow-hidden relative" style={{ height: 280 }}>
      <div className="absolute top-0 left-0 z-10 px-6 py-3">
        <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest">Scroll Horizontally</span>
      </div>
      <div ref={scrollRef} className="flex gap-5 h-full items-center px-6" style={{ width: "max-content" }}>
        {cards.map((card, i) => {
          const isNumber = typeof card.value === "number";
          return (
            <div
              key={i}
              className="w-[240px] h-[180px] bg-white rounded-2xl border border-[#e8e4df] p-6 relative overflow-hidden shrink-0 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: card.accentColor }} />
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.accentColor}14` }}>
                  <span style={{ color: card.accentColor }}>{card.icon}</span>
                </div>
                <span className="text-[10px] font-bold text-[#8a8a8a] uppercase tracking-widest">{card.title}</span>
              </div>
              <p className="text-4xl font-display font-bold text-[#2d2d2d] tracking-tight">
                {isNumber ? (
                  <CountUp end={card.value as number} decimals={card.decimals || 0} suffix={card.suffix || ""} />
                ) : (
                  <span className="text-3xl">{card.value}</span>
                )}
              </p>
            </div>
          );
        })}
        {/* Spacer card */}
        <div className="w-[40px] shrink-0" />
      </div>
    </div>
  );
}
