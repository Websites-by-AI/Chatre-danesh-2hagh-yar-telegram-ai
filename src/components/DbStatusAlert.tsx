import { useEffect, useState } from "react";
import { Database, AlertTriangle, CheckCircle2, RefreshCw, XCircle } from "lucide-react";

/* ============================================================
 * هشدار وضعیت اتصال به دیتابیس (فقط برای ادمین/مشاور)
 * DbStatusAlert: live D1 connectivity indicator.
 * Only rendered for admin/counselor roles — never for students.
 * ============================================================ */

type DbState = "checking" | "ok" | "error" | "offline";

interface DbStatusAlertProps {
  role?: string | null;
}

export default function DbStatusAlert({ role }: DbStatusAlertProps) {
  const [state, setState] = useState<DbState>("checking");
  const [detail, setDetail] = useState<string>("");
  const [count, setCount] = useState<number | null>(null);

  // Only staff roles should ever see this widget.
  const isStaff = role === "admin" || role === "counselor" || role === "teacher";
  if (!isStaff) return null;

  const checkDb = async () => {
    setState("checking");
    try {
      const res = await fetch("/api/auth/count", { credentials: "include", cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCount(typeof data?.count === "number" ? data.count : null);
        setState("ok");
        setDetail("دیتابیس D1 متصل و سالم است.");
        return;
      }
      // 503 = D1 not bound, 500 = query error
      if (res.status === 503) {
        setState("offline");
        setDetail("دیتابیس D1 متصل نیست (binding برقرار نشده).");
      } else {
        setState("error");
        setDetail(`خطا در اتصال دیتابیس (کد ${res.status}).`);
      }
    } catch {
      setState("error");
      setDetail("عدم دسترسی به دیتابیس — خطای شبکه یا سرور.");
    }
  };

  useEffect(() => {
    checkDb();
    const id = setInterval(checkDb, 30000); // هر ۳۰ ثانیه
    return () => clearInterval(id);
  }, []);

  const config = {
    checking: { icon: RefreshCw, cls: "bg-slate-50 border-slate-200 text-slate-600", label: "در حال بررسی اتصال دیتابیس…", spin: true },
    ok:       { icon: CheckCircle2, cls: "bg-emerald-50 border-emerald-200 text-emerald-800", label: "اتصال به دیتابیس برقرار است", spin: false },
    error:    { icon: XCircle, cls: "bg-rose-50 border-rose-200 text-rose-800", label: "مشکل در اتصال به دیتابیس", spin: false },
    offline:  { icon: AlertTriangle, cls: "bg-amber-50 border-amber-200 text-amber-800", label: "دیتابیس در دسترس نیست", spin: false },
  }[state];

  const Icon = config.icon;

  return (
    <div className={`p-3 rounded-2xl border flex items-center gap-3 ${config.cls}`} dir="rtl">
      <Icon size={18} className={config.spin ? "animate-spin shrink-0" : "shrink-0"} />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-black flex items-center gap-2">
          <Database size={14} className="opacity-70" />
          <span>{config.label}</span>
        </div>
        <p className="text-[10px] font-bold opacity-80 mt-0.5 leading-relaxed">{detail}</p>
      </div>
      <div className="text-left shrink-0">
        {count !== null && (
          <span className="text-[10px] font-black font-mono block" dir="ltr">{count} کاربر</span>
        )}
        <button
          onClick={checkDb}
          className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-black underline opacity-70 hover:opacity-100 transition cursor-pointer min-h-[40px] px-2"
        >
          <RefreshCw size={14} /> بررسی مجدد
        </button>
      </div>
    </div>
  );
}
