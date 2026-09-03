import React, { useState } from "react";
import { Check, ChevronLeft, MousePointer2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface CollapsibleWidgetProps {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  summaryKpi?: React.ReactNode;
  colorClasses: { bg: string; text: string; border: string; accent: string; animateGlow?: string };
  isHoverEnabled: boolean;
  hoveredSection: string | null;
  setHoveredSection: (id: string | null) => void;
  lockedSections: string[];
  toggleLockSection: (id: string) => void;
  children: React.ReactNode;
  isDemoRestricted?: boolean;
  demoRequiredTier?: "Intermediate" | "Full";
  onUpgradeTier?: (tier: "Intermediate" | "Full") => void;
}

export function CollapsibleWidget({
  id,
  title,
  subtitle,
  icon,
  summaryKpi,
  colorClasses,
  isHoverEnabled,
  hoveredSection,
  setHoveredSection,
  lockedSections,
  toggleLockSection,
  children,
  isDemoRestricted = false,
  demoRequiredTier,
  onUpgradeTier
}: CollapsibleWidgetProps) {
  const isExpanded = lockedSections.includes(id) || (isHoverEnabled && hoveredSection === id);
  const isLocked = lockedSections.includes(id);

  return (
    <div 
      id={`section-${id}`}
      onMouseEnter={() => isHoverEnabled && setHoveredSection(id)}
      onMouseLeave={() => isHoverEnabled && setHoveredSection(null)}
      className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden relative ${
        isExpanded 
          ? `shadow-lg border-indigo-200 ring-4 ring-indigo-50/40` 
          : `${colorClasses.border} hover:border-slate-300 hover:shadow-xs shadow-xs`
      }`}
    >
      {/* Glow effect on hover/expand */}
      {isExpanded && colorClasses.animateGlow && (
        <div className={`absolute -right-32 -top-32 w-64 h-64 ${colorClasses.animateGlow} rounded-full blur-3xl pointer-events-none opacity-40`} />
      )}

      {/* SECTION HEADER BAR */}
      <div 
        onClick={() => toggleLockSection(id)}
        className={`px-4 py-3 md:px-6 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
          isExpanded ? "bg-slate-50/50 border-b border-slate-100" : "bg-white hover:bg-slate-50/40"
        }`}
      >
        <div className="flex items-center gap-3 text-right">
          {/* Styled Icon */}
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 ${
            isExpanded ? "scale-105" : "scale-100"
          } ${colorClasses.bg} ${colorClasses.text}`}>
            {icon}
          </div>
          <div className="space-y-0.5 text-right font-sans">
            <div className="flex items-center gap-2">
              <h3 className="font-sans font-black text-slate-900 text-sm md:text-base">
                {title}
              </h3>
              {isLocked && (
                <span className="text-[9px] bg-indigo-50 text-indigo-650 border border-indigo-100 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1 font-sans">
                  <Check size={10} strokeWidth={3} className="text-indigo-650" />
                  ثابت شده
                </span>
              )}
              {isDemoRestricted && (
                <span className="text-[9px] bg-amber-50 text-amber-650 border border-amber-150 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-1 font-sans">
                  🔒 غیرفعال در دمو {demoRequiredTier === 'Full' ? 'پایه و استاندارد' : 'پایه'}
                </span>
              )}
            </div>
            <p className="text-[10px] md:text-xs text-slate-400 font-medium">
              {subtitle}
            </p>
          </div>
        </div>

        {/* DYNAMIC KPI SUMMARY & TOGGLERS */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pointer-events-auto">
          {/* Mini Summary Badge */}
          <div className={`transition-opacity duration-300 ${isExpanded ? "opacity-30" : "opacity-100 animate-in fade-in"}`}>
            {isDemoRestricted ? (
              <span className="text-[9px] text-amber-600 font-extrabold bg-amber-50 border border-amber-150 px-2.5 py-1 rounded-xl font-sans">🔒 ارتقا دمو</span>
            ) : (
              summaryKpi ?? (
                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2.5 py-1 rounded-xl font-sans">پایش هوشمند</span>
              )
            )}
          </div>

          {/* Expand Controls Indicator */}
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-200/50 p-1 rounded-xl">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleLockSection(id);
              }}
              className={`p-1.5 rounded-lg transition-all text-xs font-black flex items-center gap-1 font-sans ${
                isLocked 
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs" 
                  : "bg-white text-slate-500 hover:text-indigo-950 hover:bg-slate-100 hover:scale-105"
              }`}
              title={isLocked ? "کلیک برای بازگشت به حالت تاشو" : "کلیک برای قفل تاشو در حالت تمام‌باز"}
            >
              {isLocked ? (
                <Check size={12} strokeWidth={3} className="text-white" />
              ) : (
                <MousePointer2 size={12} className="text-slate-400" />
              )}
              <span className="text-[9px] hidden md:inline font-sans">{isLocked ? "همواره باز" : "سنجاق"}</span>
            </button>

            <div className={`text-slate-400 transition-transform duration-300 p-0.5 ${isExpanded ? "rotate-90" : "-rotate-90"}`}>
              <ChevronLeft size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT EXPANSION WITH ANIMATION */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 md:p-6 text-right selection:bg-indigo-100 border-t border-slate-50 relative z-10 transition-colors">
              {isDemoRestricted ? (
                <div className="relative py-12 px-6 text-center flex flex-col items-center justify-center space-y-4 rounded-2xl bg-slate-50/50 border border-slate-100/50" style={{ direction: 'rtl' }}>
                  <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center ring-8 ring-amber-50/50 shadow-inner">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-900">محدودیت دسترسی شبیه‌ساز دمو</h4>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                      دسترسی به این ماژول پیشرفته نیازمند سطح دمو <span className="font-extrabold text-indigo-650">«{demoRequiredTier === 'Full' ? 'جامع' : 'استاندارد'}»</span> است. در حال حاضر شبیه‌ساز روی سطح <span className="font-extrabold text-amber-600">پایه</span> تنظیم شده است.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onUpgradeTier) onUpgradeTier(demoRequiredTier || 'Full');
                    }}
                    className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-[11px] font-black px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-amber-200/50"
                  >
                    <span>⚡ ارتقای موقت دمو به سطح {demoRequiredTier === 'Full' ? 'جامع' : 'استاندارد'}</span>
                  </button>
                </div>
              ) : (
                children
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
