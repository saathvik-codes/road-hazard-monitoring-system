import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  MapPin,
  BarChart3,
  LineChart,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const NAV = [
  { path: "/", label: "Overview", icon: LayoutDashboard },
  { path: "/detections", label: "Detections", icon: MapPin },
  { path: "/roads", label: "Roads", icon: BarChart3 },
  { path: "/analytics", label: "Analytics", icon: LineChart },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [location] = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sidebarWidth = collapsed ? 72 : 240;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#faf8f5]">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-col shrink-0 border-r border-[#e8e4df] bg-[#f5f2ed] relative"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 shrink-0 border-b border-[#e8e4df]">
          <div className="w-9 h-9 rounded-xl bg-[#2d4a7c] flex items-center justify-center shrink-0">
            <Zap size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <AnimatePresence>
            {!collapsed && mounted && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
              >
                <span className="text-sm font-bold text-[#2d2d2d] tracking-tight leading-tight">
                  RHMS
                </span>
                <span className="block text-[10px] text-[#8a8a8a] font-medium tracking-widest uppercase leading-tight">
                  Monitoring
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = location === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                  active
                    ? "bg-[#2d4a7c] text-white shadow-sm"
                    : "text-[#6b6b6b] hover:bg-[#ebe8e3] hover:text-[#2d2d2d]"
                )}
                style={collapsed ? { justifyContent: "center" } : undefined}
              >
                <Icon size={18} strokeWidth={2} />
                <AnimatePresence>
                  {!collapsed && mounted && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#c8a97e]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="px-3 py-3 border-t border-[#e8e4df] shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-[#8a8a8a] hover:text-[#2d2d2d] hover:bg-[#ebe8e3] transition-colors"
            style={collapsed ? { justifyContent: "center" } : undefined}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            <AnimatePresence>
              {!collapsed && mounted && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="text-xs font-medium"
                >
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 shrink-0 bg-white/60 backdrop-blur-xl border-b border-[#e8e4df] flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-[#2d2d2d] tracking-tight">
              {NAV.find((n) => n.path === location)?.label || "Dashboard"}
            </h1>
            <span className="text-[10px] text-[#8a8a8a] font-medium uppercase tracking-widest">
              / Hyderabad
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0f5f0] border border-[#c8e6c8]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4caf50] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4caf50]" />
              </span>
              <span className="text-xs font-bold text-[#4caf50] uppercase tracking-widest">Live</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
