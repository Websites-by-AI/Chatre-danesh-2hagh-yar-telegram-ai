import React, { useState, useEffect, useCallback } from "react";
import { HeartHandshake, RefreshCw, Phone, CheckCircle2, Clock, UserCheck } from "lucide-react";

/** CRM درخواست‌های مشاوره — GET/PATCH /api/counseling-request (مشاور/ادمین). */
interface CounselRequest {
  id: string; name: string; mobile: string; field: string | null;
  grade: string | null; topic: string | null; status: string; created_at: string;
}

const FA = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
const fa = (v: number | string) => String(v).split("").map(c => /\d/.test(c) ? FA[Number(c)] : c).join("");
const STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "جدید", cls: "bg-rose-100 text-rose-700" },
  contacted: { label: "تماس گرفته شد", cls: "bg-amber-100 text-amber-700" },
  done: { label: "انجام شد", cls: "bg-emerald-100 text-emerald-700" },
};

export default function CounselingCRM() {
  const [reqs, setReqs] = useState<CounselRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/counseling-request", { credentials: "include", cache: "no-store" });
      if (res.status === 403) { setErr("hidden"); return; }
      const d = await res.json();
      setReqs(d.requests || []);
      setErr("");
    } catch { setErr("خطا در دریافت"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);

  const setStatus = async (id: string, status: string) => {
    await fetch("/api/counseling-request", {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  };

  if (err === "hidden") return null;
  const newCount = reqs.filter(r => r.status === "new").length;

  return (
    <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 space-y-4" dir="rtl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <HeartHandshake size={20} className="text-rose-500" />
          <span>CRM مشاوره — درخواست‌های ثبت‌نام</span>
          {newCount > 0 && <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black">{fa(newCount)} جدید</span>}
        </h3>
        <button onClick={load} disabled={loading}
          className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center gap-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-black text-slate-600">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {reqs.length === 0 && !loading ? (
        <p className="text-xs text-slate-400 text-center py-6">هنوز درخواستی ثبت نشده. فرم ثبت‌نام مشاوره در صفحه اصلی فعال است.</p>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {reqs.map((r) => (
            <div key={r.id} className={`p-3 rounded-2xl border ${r.status === "new" ? "border-rose-200 bg-rose-50/40" : "border-slate-100 bg-slate-50/50"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="text-indigo-500" />
                  <span className="text-[12px] font-black text-slate-800">{r.name}</span>
                  <a href={`tel:${r.mobile}`} className="text-[11px] font-mono font-bold text-indigo-600 hover:underline flex items-center gap-1" dir="ltr">
                    <Phone size={11} /> {r.mobile}
                  </a>
                </div>
                <span className={`text-[9px] font-black px-2 py-1 rounded-full ${STATUS[r.status]?.cls || ""}`}>{STATUS[r.status]?.label || r.status}</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold">
                {r.field || "—"} | {r.grade || "—"} {r.topic ? `| 💬 ${r.topic.slice(0, 80)}` : ""}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1"><Clock size={10} /> {new Date(r.created_at).toLocaleString("fa-IR")}</span>
                <div className="flex gap-1.5">
                  {r.status !== "contacted" && (
                    <button onClick={() => setStatus(r.id, "contacted")} className="min-h-[32px] px-2.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 text-[9px] font-black">📞 تماس گرفتم</button>
                  )}
                  {r.status !== "done" && (
                    <button onClick={() => setStatus(r.id, "done")} className="min-h-[32px] px-2.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[9px] font-black flex items-center gap-1"><CheckCircle2 size={11} /> انجام شد</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
