import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface GsapScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  y?: number;
  duration?: number;
  delay?: number;
}

export function GsapScrollReveal({
  children,
  className = "",
  stagger = 0.1,
  y = 30,
  duration = 0.6,
  delay = 0,
}: GsapScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const items = container.children;
    if (items.length === 0) return;

    gsap.fromTo(
      items,
      { opacity: 0, y: y },
      {
        opacity: 1,
        y: 0,
        duration: duration,
        stagger: stagger,
        delay: delay,
        ease: "power2.out",
        scrollTrigger: {
          trigger: container,
          start: "top 85%",
          once: true,
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => {
        if (t.trigger === container) t.kill();
      });
    };
  }, [stagger, y, duration, delay]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
