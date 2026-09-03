import React, { useState } from "react";
import { HeartHandshake, Send, CheckCircle2, User, Phone, BookOpen, MessageSquare } from "lucide-react";

/** فرم عمومی ثبت‌نام مشاوره — POST /api/counseling-request (بدون نیاز به لاگین). */
export default function CounselingSignup() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [field, setField] = useState("تجربی");
  const [grade, setGrade] = useState("دوازدهم");
  const [topic, setTopic] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setMsg("");
    try {
      const res = await fetch("/api/counseling-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile, field, grade, topic }),
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        setState("done");
        setMsg(d.message || "درخواست ثبت شد.");
      } else {
        setState("error");
        setMsg(d.error || "خطا در ثبت درخواست.");
      }
    } catch {
      setState("error");
      setMsg("خطای شبکه — دوباره تلاش کنید.");
    }
  };

  if (state === "done") {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-[2rem] p-8 text-center" dir="rtl">
        <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
        <h3 className="text-lg font-black text-emerald-800 mb-2">درخواست شما ثبت شد ✅</h3>
        <p className="text-sm text-emerald-700">{msg}</p>
        <p className="text-xs text-emerald-600 mt-2">کارشناس مشاوره ترنم همدلی با شماره شما تماس می‌گیرد.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-[2rem] border border-slate-200 shadow-lg p-6 space-y-4" dir="rtl" id="counseling-signup-form">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
        <HeartHandshake size={22} className="text-indigo-600" />
        <div>
          <h3 className="text-base font-black text-slate-900">ثبت‌نام مشاوره تحصیلی</h3>
          <p className="text-[10px] text-slate-400 font-bold">جلسه اول رایگان — مشاور واقعی با شما تماس می‌گیرد</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[11px] font-black text-slate-600 flex items-center gap-1 mb-1"><User size={12} /> نام و نام خانوادگی *</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2}
            className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none" placeholder="مثلاً مریم حسینی" />
        </label>
        <label className="block">
          <span className="text-[11px] font-black text-slate-600 flex items-center gap-1 mb-1"><Phone size={12} /> شماره موبایل *</span>
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} required dir="ltr" pattern="09\d{9}"
            className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm font-mono focus:border-indigo-400 focus:outline-none" placeholder="09121234567" />
        </label>
        <label className="block">
          <span className="text-[11px] font-black text-slate-600 flex items-center gap-1 mb-1"><BookOpen size={12} /> رشته</span>
          <select value={field} onChange={(e) => setField(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-indigo-400 focus:outline-none">
            {["تجربی", "ریاضی", "انسانی", "هنر", "زبان"].map((f) => <option key={f}>{f}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] font-black text-slate-600 mb-1 block">پایه</span>
          <select value={grade} onChange={(e) => setGrade(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-xl border border-slate-200 text-sm bg-white focus:border-indigo-400 focus:outline-none">
            {["هفتم (متوسطه اول)", "هشتم (متوسطه اول)", "نهم (متوسطه اول)", "دهم", "یازدهم", "دوازدهم", "پشت کنکوری"].map((g) => <option key={g}>{g}</option>)}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-[11px] font-black text-slate-600 flex items-center gap-1 mb-1"><MessageSquare size={12} /> موضوع مشاوره (اختیاری)</span>
        <textarea value={topic} onChange={(e) => setTopic(e.target.value)} rows={2} maxLength={500}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-400 focus:outline-none resize-none"
          placeholder="مثلاً: اضطراب آزمون دارم / برنامه‌ریزی نمی‌دانم / افت تراز..." />
      </label>

      {state === "error" && <p className="text-xs text-rose-500 font-bold">{msg}</p>}

      <button type="submit" disabled={state === "sending"}
        className="w-full min-h-[48px] bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 transition">
        <Send size={16} />
        {state === "sending" ? "در حال ارسال..." : "ثبت درخواست مشاوره"}
      </button>
    </form>
  );
}
