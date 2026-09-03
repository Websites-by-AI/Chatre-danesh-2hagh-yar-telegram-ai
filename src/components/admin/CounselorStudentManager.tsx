import React, { useState, useEffect, useCallback } from "react";
import { UserPlus, Trash2, RefreshCw, GraduationCap, AlertTriangle, CheckCircle2, Phone } from "lucide-react";

/**
 * CounselorStudentManager — ثبت‌نام و حذف دانش‌آموز توسط خود مشاور
 * API: /api/counselor-students (GET/POST/DELETE)
 * قانون: هر مشاور فقط دانش‌آموزهایی که خودش ثبت کرده را می‌بیند و حذف می‌کند.
 * حالت دمو (بدون سشن واقعی) → پیام راهنما به‌جای فرم.
 */

interface StudentRow {
  id: string; name: string; mobile: string | null; email: string | null;
  field: string; grade: string | null; created_at: string; created_by: string | null;
}

const FIELD_FA: Record<string, string> = { tajrobi: "تجربی", riazi: "ریاضی", ensani: "انسانی", honar: "هنر", zaban: "زبان" };

export default function CounselorStudentManager() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  // فرم
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [field, setField] = useState("tajrobi");
  const [grade, setGrade] = useState("پایه دوازدهم");
  const [password, setPassword] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/counselor-students", { credentials: "include", cache: "no-store" });
      if (res.status === 401 || res.status === 403) { setDemoMode(true); return; }
      const d = await res.json();
      setStudents(d.students || []);
      setDemoMode(false);
    } catch { /* keep */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true); setMsg(null);
    try {
      const res = await fetch("/api/counselor-students", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile, field, grade, password }),
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        setMsg({ type: "ok", text: d.message });
        setName(""); setMobile(""); setPassword("");
        load();
      } else setMsg({ type: "err", text: d.error || "خطا در ثبت." });
    } catch { setMsg({ type: "err", text: "خطای شبکه." }); }
    finally { setSending(false); }
  };

  const remove = async (s: StudentRow) => {
    if (!confirm(`دانش‌آموز «${s.name}» حذف شود؟ این عمل قابل بازگشت نیست.`)) return;
    const res = await fetch("/api/counselor-students", {
      method: "DELETE", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id }),
    });
    const d = await res.json();
    setMsg(res.ok && d.ok ? { type: "ok", text: d.message } : { type: "err", text: d.error || "خطا در حذف." });
    load();
  };

  if (demoMode) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-[28px] p-6" dir="rtl">
        <div className="flex items-start gap-3">
          <AlertTriangle size={22} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-black text-amber-800 mb-1">ثبت‌نام دانش‌آموز نیاز به ورود واقعی مشاور دارد</h3>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              شما الان در <strong>حالت دمو</strong> هستید (دکمه ورود سریع). برای ثبت‌نام و مدیریت دانش‌آموز واقعی:
              از صفحه ورود، تب «مشاور» → <strong>«ورود با رمز عبور»</strong> → با حساب واقعی مشاور
              (مثل counselor@hamdeltar.ir) وارد شوید.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-6 space-y-5" dir="rtl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <GraduationCap size={20} className="text-indigo-600" />
          <span>دانش‌آموزهای من — ثبت‌نام و مدیریت</span>
          <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black">{students.length} نفر</span>
        </h3>
        <button onClick={load} disabled={loading}
          className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* فرم ثبت‌نام */}
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3 p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100">
        <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="نام و نام خانوادگی دانش‌آموز *"
          className="min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none" />
        <input value={mobile} onChange={(e) => setMobile(e.target.value)} required dir="ltr" pattern="09\d{9}" placeholder="09121234567 *"
          className="min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-mono focus:border-indigo-400 focus:outline-none" />
        <select value={field} onChange={(e) => setField(e.target.value)}
          className="min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm bg-white">
          {Object.entries(FIELD_FA).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={grade} onChange={(e) => setGrade(e.target.value)}
          className="min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm bg-white">
          {["پایه هفتم", "پایه هشتم", "پایه نهم", "پایه دهم", "پایه یازدهم", "پایه دوازدهم", "پشت کنکوری"].map((g) => <option key={g}>{g}</option>)}
        </select>
        <input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} type="text" dir="ltr"
          placeholder="رمز عبور اولیه (حداقل ۶ کاراکتر) *"
          className="min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-mono focus:border-indigo-400 focus:outline-none sm:col-span-2" />
        <button type="submit" disabled={sending}
          className="sm:col-span-2 min-h-[46px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2">
          <UserPlus size={15} /> {sending ? "در حال ثبت..." : "ثبت‌نام دانش‌آموز جدید"}
        </button>
      </form>

      {msg && (
        <p className={`text-xs font-bold flex items-center gap-1.5 ${msg.type === "ok" ? "text-emerald-600" : "text-rose-500"}`}>
          {msg.type === "ok" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {msg.text}
        </p>
      )}

      {/* لیست دانش‌آموزهای خود مشاور */}
      {students.length === 0 && !loading ? (
        <p className="text-xs text-slate-400 text-center py-4">هنوز دانش‌آموزی ثبت نکرده‌اید — با فرم بالا اولین نفر را اضافه کنید.</p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {students.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <span className="text-[12px] font-black text-slate-800 block">{s.name}</span>
                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                  <Phone size={10} /> <span dir="ltr" className="font-mono">{s.mobile || s.email}</span>
                  <span>| {FIELD_FA[s.field] || s.field} | {s.grade || "—"}</span>
                </span>
              </div>
              <button onClick={() => remove(s)}
                className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition"
                title="حذف دانش‌آموز (فقط دانش‌آموز خودتان)">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-[9px] text-slate-400 font-bold">🔒 فقط دانش‌آموزهایی که خودتان ثبت کرده‌اید اینجا نمایش داده و قابل حذف هستند.</p>
    </div>
  );
}
