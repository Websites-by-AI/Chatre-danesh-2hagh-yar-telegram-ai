import React, { useEffect, useState } from "react";
import { MapPin, RefreshCw, Phone, School, CalendarCheck } from "lucide-react";

/** InPersonCRM — مدیریت رزروهای جلسه حضوری اسنپی + فضاهای ثبت‌شده (مدرسه/فضای کار اشتراکی) */

const B_STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "جدید", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  contacted: { label: "تماس گرفته شد", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  confirmed: { label: "تایید شد", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  done: { label: "برگزار شد", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  canceled: { label: "لغو", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};
const V_STATUS: Record<string, { label: string; cls: string }> = {
  new: { label: "جدید", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  reviewing: { label: "در حال بررسی", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  approved: { label: "قرارداد بسته شد", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "رد شد", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function InPersonCRM() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true); setErr("");
    try {
      const [b, v] = await Promise.all([
        fetch("/api/inperson-booking", { credentials: "include" }).then((r) => r.json()),
        fetch("/api/venue-offer", { credentials: "include" }).then((r) => r.json()),
      ]);
      if (b.bookings) setBookings(b.bookings); else if (b.error) setErr(b.error);
      if (v.offers) setOffers(v.offers);
    } catch (_) { setErr("خطا در دریافت داده‌ها"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setBookingStatus = async (id: string, status: string) => {
    await fetch("/api/inperson-booking", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    load();
  };
  const setOfferStatus = async (id: string, status: string) => {
    await fetch("/api/venue-offer", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    load();
  };

  return (
    <div className="space-y-8" style={{ direction: "rtl" }}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><MapPin className="w-6 h-6 text-rose-500" /> جلسات حضوری اسنپی — CRM</h2>
        <button onClick={load} className="flex items-center gap-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-xl px-3 py-2 font-bold text-slate-600">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> به‌روزرسانی
        </button>
      </div>
      {err && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">{err}</div>}

      {/* رزروها */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div className="font-black text-slate-700 mb-4 flex items-center gap-2"><CalendarCheck className="w-5 h-5 text-indigo-500" /> درخواست‌های رزرو ({bookings.length.toLocaleString("fa-IR")})</div>
        {bookings.length === 0 && <p className="text-sm text-slate-400">درخواستی ثبت نشده است.</p>}
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="border border-slate-100 rounded-xl p-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="text-sm space-y-1">
                <div className="font-bold text-slate-800">{b.name} <span className="text-xs text-slate-400">({b.requester_role === "coach" ? "🧑‍🏫 مربی" : "🎒 دانش‌آموز"})</span></div>
                <div className="text-xs text-slate-500">
                  <a href={`tel:${b.mobile}`} className="text-indigo-600 font-mono" dir="ltr">{b.mobile}</a>
                  {" • "}{b.city || "—"}{b.venue_name ? ` • ${b.venue_name}` : ""}{b.tutor_tier ? ` • مربی ${b.tutor_tier}` : ""}
                </div>
                <div className="text-xs text-slate-500">{b.session_type || ""}{b.preferred_date ? ` • زمان: ${b.preferred_date}` : ""}{b.est_price ? ` • برآورد: ${Number(b.est_price).toLocaleString("fa-IR")} تومان` : ""}</div>
                {b.note && <div className="text-xs text-slate-400">📝 {b.note}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs border rounded-full px-2.5 py-1 font-bold ${B_STATUS[b.status]?.cls || ""}`}>{B_STATUS[b.status]?.label || b.status}</span>
                <select value={b.status} onChange={(e) => setBookingStatus(b.id, e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
                  {Object.entries(B_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* فضاها */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <div className="font-black text-slate-700 mb-4 flex items-center gap-2"><School className="w-5 h-5 text-emerald-500" /> فضاهای ثبت‌شده برای اجاره ({offers.length.toLocaleString("fa-IR")})</div>
        {offers.length === 0 && <p className="text-sm text-slate-400">فضایی ثبت نشده است.</p>}
        <div className="space-y-3">
          {offers.map((v) => (
            <div key={v.id} className="border border-slate-100 rounded-xl p-4 flex flex-wrap items-center gap-3 justify-between">
              <div className="text-sm space-y-1">
                <div className="font-bold text-slate-800">{v.org_name} <span className="text-xs text-slate-400">({v.venue_type || "—"})</span></div>
                <div className="text-xs text-slate-500">
                  {v.contact_name ? `${v.contact_name} • ` : ""}<a href={`tel:${v.mobile}`} className="text-indigo-600 font-mono" dir="ltr">{v.mobile}</a>
                  {" • "}{v.city || "—"}{v.capacity ? ` • ظرفیت ${Number(v.capacity).toLocaleString("fa-IR")}` : ""}
                  {v.price_per_hour ? ` • ${Number(v.price_per_hour).toLocaleString("fa-IR")} تومان/ساعت` : ""}
                </div>
                {v.address && <div className="text-xs text-slate-400">📍 {v.address}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs border rounded-full px-2.5 py-1 font-bold ${V_STATUS[v.status]?.cls || ""}`}>{V_STATUS[v.status]?.label || v.status}</span>
                <select value={v.status} onChange={(e) => setOfferStatus(v.id, e.target.value)} className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white">
                  {Object.entries(V_STATUS).map(([k, v2]) => <option key={k} value={k}>{v2.label}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
