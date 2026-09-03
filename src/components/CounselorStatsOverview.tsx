import React, { useState, useEffect, useCallback } from "react";
import {
  Users, BookOpen, ClipboardList, Activity, RefreshCw, FileText, CalendarClock, TrendingUp,
} from "lucide-react";
import { motion } from "motion/react";

/**
 * CounselorStatsOverview — آمار زندهٔ داشبورد مشاور/ادمین از D1
 * منبع: GET /api/dashboard-stats (فقط نقش counselor/admin)
 */

interface DashboardTotals {
  users: number;
  students: number;
  studyPlans: number;
  studentsWithProgress: number;
  reportsLast7Days: number;
  reportsAllTime: number;
}
interface RecentReport { student_id: string; student_name: string; preview: string; created_at: string; }
interface PlanUpdate { student_id: string; updated_at: string; }
interface WeeklyDay { day: string; n: number; }

interface StatsPayload {
  generatedAt: string;
  totals: DashboardTotals;
  recentReports: RecentReport[];
  recentPlanUpdates: PlanUpdate[];
  weeklyActivity: WeeklyDay[];
}

const FA = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
const fa = (n: number | string) => String(n).split("").map(c => /\d/.test(c) ? FA[Number(c)] : c).join("");

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "همین الان";
  if (mins < 60) return `${fa(mins)} دقیقه پیش`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${fa(hours)} ساعت پیش`;
  return `${fa(Math.floor(hours / 24))} روز پیش`;
}

export default function CounselorStatsOverview({ onSelectStudent }: { onSelectStudent?: (id: string) => void }) {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/dashboard-stats", { credentials: "include", cache: "no-store" });
      if (res.status === 401 || res.status === 403) { setStats(null); setError("hidden"); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStats(await res.json());
    } catch (e: any) {
      setError(e?.message || "خطا در دریافت آمار");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  // بدون سشن مشاور/ادمین چیزی نشان نده (حالت دمو/آفلاین)
  if (error === "hidden") return null;

  const totals = stats?.totals;
  const cards = [
    { label: "کل کاربران", value: totals?.users, icon: Users, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { label: "دانش‌آموزان", value: totals?.students, icon: BookOpen, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { label: "برنامه‌های فعال", value: totals?.studyPlans, icon: ClipboardList, color: "text-amber-600 bg-amber-50 border-amber-100" },
    { label: "گزارش ۷ روز اخیر", value: totals?.reportsLast7Days, icon: Activity, color: "text-rose-600 bg-rose-50 border-rose-100" },
  ];

  const week = stats?.weeklyActivity || [];
  const maxN = Math.max(1, ...week.map(w => w.n));

  return (
    <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <TrendingUp size={20} className="text-indigo-600" />
          <span>نمای زندهٔ سامانه</span>
        </h3>
        <div className="flex items-center gap-2">
          {stats && (
            <span className="text-[9px] text-slate-400 font-bold hidden sm:inline">
              به‌روزرسانی: {timeAgo(stats.generatedAt)}
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-black text-slate-600 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">به‌روزرسانی</span>
          </button>
        </div>
      </div>

      {error && error !== "hidden" && (
        <p className="text-xs text-rose-500 font-bold text-center py-2">خطا در دریافت آمار زنده: {error}</p>
      )}

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-4 rounded-2xl border ${c.color.split(" ").slice(1).join(" ")}`}
          >
            <c.icon size={18} className={c.color.split(" ")[0]} />
            <div className="mt-2 text-2xl font-black text-slate-900">
              {loading && totals === undefined ? "…" : fa(c.value ?? 0)}
            </div>
            <div className="text-[10px] font-bold text-slate-500 mt-0.5">{c.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* فعالیت هفتگی */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <h4 className="text-xs font-black text-slate-600 mb-3 flex items-center gap-1.5">
            <Activity size={14} className="text-indigo-500" /> گزارش‌های روزانه (۷ روز اخیر)
          </h4>
          {week.length === 0 ? (
            <p className="text-[10px] text-slate-400 text-center py-4">هنوز گزارشی در این هفته ثبت نشده است.</p>
          ) : (
            <div className="flex items-end gap-1.5 h-20" dir="ltr">
              {week.map((w) => (
                <div key={w.day} className="flex-1 flex flex-col items-center gap-1" title={`${w.day}: ${w.n}`}>
                  <div
                    className="w-full rounded-t-md bg-indigo-400/80 min-h-[4px] transition-all"
                    style={{ height: `${Math.round((w.n / maxN) * 64)}px` }}
                  />
                  <span className="text-[8px] text-slate-400 font-bold">{w.day.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 pt-2 border-t border-slate-200/60 flex justify-between text-[10px] font-bold text-slate-500">
            <span>مجموع کل گزارش‌ها: {fa(totals?.reportsAllTime ?? 0)}</span>
            <span>دانش‌آموزان دارای پیشرفت ثبت‌شده: {fa(totals?.studentsWithProgress ?? 0)}</span>
          </div>
        </div>

        {/* آخرین گزارش‌ها */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <h4 className="text-xs font-black text-slate-600 mb-3 flex items-center gap-1.5">
            <FileText size={14} className="text-emerald-500" /> آخرین گزارش‌های دانش‌آموزان
          </h4>
          {(stats?.recentReports || []).length === 0 ? (
            <p className="text-[10px] text-slate-400 text-center py-4">گزارشی ثبت نشده است.</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(stats?.recentReports || []).map((r, i) => (
                <li key={i}>
                  <button
                    onClick={() => onSelectStudent?.(r.student_id)}
                    className="w-full text-right p-2.5 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all min-h-[44px]"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-black text-slate-700">{r.student_name}</span>
                      <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                        <CalendarClock size={10} /> {timeAgo(r.created_at)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{r.preview}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
