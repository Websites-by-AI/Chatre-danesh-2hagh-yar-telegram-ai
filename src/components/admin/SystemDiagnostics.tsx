import React from "react";
import { Activity, Database, RefreshCw, Zap, ShieldAlert, Eye, Terminal, Search } from "lucide-react";

interface SystemDiagnosticsProps {
  diagLogs: string[];
  diagRunning: boolean;
  isSimulatingRegistration: boolean;
  onRunDiagnostics: () => void;
  onSimulateRegistration: () => void;
  onMergeLeads: () => void;
  onTestFirebase: () => void;
  onClearLogs: () => void;
}

export default function SystemDiagnostics({
  diagLogs, diagRunning, isSimulatingRegistration,
  onRunDiagnostics, onSimulateRegistration, onMergeLeads, onTestFirebase, onClearLogs
}: SystemDiagnosticsProps) {
  return (
    <div className="space-y-6" id="admin-tab-diagnostics">
      <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 text-white space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
              <h4 className="text-sm font-black text-indigo-200">مدیریت اتصال، پایش صحت و خطایابی لیدهای ثبت‌نامی</h4>
            </div>
            <p className="text-[10px] text-slate-400 font-bold">این بخش پاسخگوی مستقیم سوالات شما درباره نحوه اتصال ثبت‌نام‌های لندینگ مشتریان به بانک اطلاعاتی است.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button onClick={onRunDiagnostics} disabled={diagRunning} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/40 text-white rounded-xl text-[10px] font-black tracking-tight transition cursor-pointer flex items-center gap-1.5">
              {diagRunning ? "در حال پایش..." : "🔎 پایش و تست سلامت دیتابیس مرکزی"}
            </button>
            <button onClick={onSimulateRegistration} disabled={isSimulatingRegistration} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/40 text-white rounded-xl text-[10px] font-black tracking-tight transition cursor-pointer flex items-center gap-1.5">
              {isSimulatingRegistration ? "ثبت تستی..." : "🌱 شبیه‌سازی ثبت‌نام آنلاین"}
            </button>
            <button onClick={onMergeLeads} className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black rounded-xl text-[10px] tracking-tight transition cursor-pointer flex items-center gap-1.5">
              🔄 ادغام دسته‌ای لیدهای جدید
            </button>
            <button onClick={onTestFirebase} disabled={diagRunning} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/40 text-white rounded-xl text-[10px] font-black tracking-tight transition cursor-pointer flex items-center gap-1.5">
              🚀 تست اتصال Firebase
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-black text-slate-400">
            <span>📡 ترمینال پایش جریان داده‌های زنده (Real-time Live Sync Log):</span>
            {diagLogs.length > 0 && (
              <button onClick={onClearLogs} className="text-rose-400 hover:underline hover:text-rose-300 font-black">پاکسازی ترمینال 🧹</button>
            )}
          </div>
          
          <div className="bg-slate-950 font-mono text-[11px] leading-relaxed p-4 rounded-2xl border border-white/5 h-48 overflow-y-auto text-right space-y-1">
            {diagLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <Database size={24} className="opacity-40" />
                <span className="text-[10px] font-bold">هیچ لاگی ثبت نشده است.</span>
              </div>
            ) : (
              diagLogs.map((log, idx) => {
                let colorClass = "text-indigo-300";
                if (log.includes("✅") || log.includes("🏆") || log.includes("🏁")) colorClass = "text-emerald-400 font-bold";
                else if (log.includes("❌")) colorClass = "text-rose-400 font-bold animate-pulse";
                else if (log.includes("👉") || log.includes("ℹ️")) colorClass = "text-amber-300";
                return <div key={idx} className={`${colorClass} whitespace-pre-wrap`}>{log}</div>;
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
