import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { CountUp } from "@/components/CountUp";

interface CardData {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  decimals?: number;
  suffix?: string;
}

interface GsapScrollCardsProps {
  cards: CardData[];
  direction?: "horizontal" | "vertical";
}

export function GsapScrollCards({ cards, direction = "horizontal" }: GsapScrollCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (direction !== "horizontal" || !containerRef.current) return;

    const container = containerRef.current;
    let scrollPos = 0;
    let targetPos = 0;
    let raf: number;
    let autoScroll = true;
    const speed = 0.4;
    const maxScroll = container.scrollWidth - container.clientWidth;

    const tick = () => {
      if (autoScroll) {
        targetPos += speed;
        if (targetPos >= maxScroll) targetPos = 0;
      }
      // Lerp for smooth scrolling
      scrollPos += (targetPos - scrollPos) * 0.08;
      container.scrollLeft = scrollPos;
      raf = requestAnimationFrame(tick);
    };

    const handleMouseEnter = () => { autoScroll = false; };
    const handleMouseLeave = () => { autoScroll = true; };
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetPos = Math.max(0, Math.min(maxScroll, targetPos + e.deltaY));
      autoScroll = false;
    };

    container.addEventListener("mouseenter", handleMouseEnter);
    container.addEventListener("mouseleave", handleMouseLeave);
    container.addEventListener("wheel", handleWheel, { passive: false });

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("mouseenter", handleMouseEnter);
      container.removeEventListener("mouseleave", handleMouseLeave);
      container.removeEventListener("wheel", handleWheel);
    };
  }, [direction, cards.length]);

  if (direction === "horizontal") {
    return (
      <div
        ref={containerRef}
        className="flex gap-4 overflow-x-auto py-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {cards.map((card, i) => (
          <ScrollCard key={i} card={card} index={i} />
        ))}
        {/* Duplicate for seamless loop */}
        {cards.map((card, i) => (
          <ScrollCard key={`dup-${i}`} card={card} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card, i) => (
        <ScrollCard key={i} card={card} index={i} />
      ))}
    </div>
  );
}

function ScrollCard({ card, index }: { card: CardData; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const isNumber = typeof card.value === "number";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{
        y: -6,
        scale: 1.02,
        boxShadow: "0 16px 40px rgba(0,0,0,0.1)",
        transition: { duration: 0.3 },
      }}
      className="shrink-0 w-[220px] bg-white rounded-2xl border border-[#e8e4df] p-5 relative overflow-hidden cursor-default group"
    >
      {/* Accent bar */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
        style={{ backgroundColor: card.accentColor || "#2d4a7c" }}
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.6, delay: index * 0.08 + 0.2, ease: "easeOut" }}
      />
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      <div className="flex items-center gap-2 mb-3">
        {card.icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${card.accentColor}14` || "#2d4a7c14" }}
          >
            {card.icon}
          </div>
        )}
        <span className="text-[9px] font-bold text-[#8a8a8a] uppercase tracking-widest">{card.title}</span>
      </div>
      <p className="text-2xl font-display font-bold text-[#2d2d2d] tracking-tight">
        {isNumber ? (
          <CountUp
            end={card.value as number}
            decimals={card.decimals || 0}
            suffix={card.suffix || ""}
          />
        ) : (
          <span className="text-xl">{card.value}</span>
        )}
      </p>
      {card.subtitle && (
        <p className="text-[10px] text-[#8a8a8a] mt-1 font-bold uppercase tracking-widest">{card.subtitle}</p>
      )}
    </motion.div>
  );
}
