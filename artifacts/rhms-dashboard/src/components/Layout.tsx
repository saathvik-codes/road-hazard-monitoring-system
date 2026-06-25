import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  MapPin,
  BarChart3,
  LineChart,
  Upload,
  ChevronLeft,
  ChevronRight,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const NAV = [
  { path: "/",           label: "Overview",   icon: LayoutDashboard },
  { path: "/detections", label: "Detections", icon: MapPin },
  { path: "/roads",      label: "Roads",       icon: BarChart3 },
  { path: "/analytics",  label: "Analytics",  icon: LineChart },
  { path: "/upload",     label: "Upload",      icon: Upload },
];

function LiveBadge() {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f0f5f0] border border-[#c8e6c8]">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4caf50] opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4caf50]" />
      </span>
      <span className="text-[10px] font-bold text-[#4caf50] uppercase tracking-widest">Live</span>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  const isMobile = useIsMobile();

  const currentLabel = NAV.find((n) => n.path === location)?.label ?? "Dashboard";

  /* ── Mobile layout ─────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#faf8f5] overflow-hidden">

        {/* Mobile top bar */}
        <header className="h-14 shrink-0 bg-white border-b border-[#e8e4df] flex items-center justify-between px-4 z-30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2d4a7c] flex items-center justify-center shrink-0">
              <Zap size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#2d2d2d] leading-tight">RHMS</p>
              <p className="text-[9px] text-[#8a8a8a] font-semibold uppercase tracking-widest leading-tight">Road Hazard Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LiveBadge />
            <button
              onClick={() => setMobileOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#f0ece5] transition-colors"
              aria-label="Open menu"
            >
              <Menu size={20} className="text-[#2d2d2d]" />
            </button>
          </div>
        </header>

        {/* Mobile drawer overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={() => setMobileOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed right-0 top-0 bottom-0 w-64 z-50 bg-white border-l border-[#e8e4df] flex flex-col shadow-2xl"
              >
                <div className="flex items-center justify-between px-4 h-14 border-b border-[#e8e4df]">
                  <span className="text-sm font-bold text-[#2d2d2d]">Navigation</span>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f0ece5] transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={16} className="text-[#6b6b6b]" />
                  </button>
                </div>
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                  {NAV.map((item) => {
                    const active = location === item.path;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all relative",
                          active
                            ? "bg-[#2d4a7c] text-white shadow-sm"
                            : "text-[#6b6b6b] hover:bg-[#f0ece5] hover:text-[#2d2d2d]",
                        )}
                      >
                        {active && (
                          <motion.span
                            layoutId="mobile-drawer-indicator"
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#c8a97e]"
                          />
                        )}
                        <Icon size={17} strokeWidth={2} className="shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Page name sub-bar */}
        <div className="px-4 py-2 border-b border-[#f0ece5] bg-[#faf8f5]/80 backdrop-blur-sm shrink-0">
          <p className="text-xs font-semibold text-[#8a8a8a]">{currentLabel}</p>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-4"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  /* ── Desktop layout ─────────────────────────────────── */
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#faf8f5]">

      {/* Collapsible sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 68 : 220 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-col shrink-0 border-r border-[#e8e4df] bg-[#f5f2ed] overflow-hidden"
      >
        {/* Logo */}
        <div className={cn("flex items-center h-16 shrink-0 border-b border-[#e8e4df] overflow-hidden", collapsed ? "justify-center px-2" : "gap-3 px-4")}>
          <div className="w-9 h-9 rounded-xl bg-[#2d4a7c] flex items-center justify-center shrink-0">
            <Zap size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                <span className="text-sm font-bold text-[#2d2d2d] leading-tight block">RHMS</span>
                <span className="text-[10px] text-[#8a8a8a] font-medium tracking-widest uppercase leading-tight block">Monitoring</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV.map((item) => {
            const active = location === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-all duration-150 relative overflow-hidden",
                  collapsed ? "justify-center" : "",
                  active
                    ? "bg-[#2d4a7c] text-white shadow-sm"
                    : "text-[#6b6b6b] hover:bg-[#ebe8e3] hover:text-[#2d2d2d]",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="desktop-indicator"
                    className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[#c8a97e]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={18} strokeWidth={2} className="shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.12 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="px-2 pt-3 pb-4 border-t border-[#e8e4df] shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full flex items-center rounded-lg px-2 py-2 text-[#8a8a8a] hover:text-[#2d2d2d] hover:bg-[#ebe8e3] transition-colors",
              collapsed ? "justify-center" : "justify-between",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {!collapsed && <span className="text-xs font-medium">Collapse</span>}
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">

        {/* Desktop top bar */}
        <header className="h-14 shrink-0 bg-white/70 backdrop-blur-xl border-b border-[#e8e4df] flex items-center justify-between px-5 z-10">
          <h1 className="text-base font-semibold text-[#2d2d2d] tracking-tight">{currentLabel}</h1>
          <LiveBadge />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="p-4 lg:p-5"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
