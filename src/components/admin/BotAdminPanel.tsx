import React, { useState, useEffect, useCallback } from "react";
import { Bot, RefreshCw, Send, Megaphone, CheckCircle2, XCircle, Users, MessageSquare, Radio, Settings2 } from "lucide-react";

/** BotAdminPanel — اطلاعات و تنظیمات ربات‌های تلگرام/بله + کانال (فقط ادمین). */

const FA = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
const fa = (v: any) => String(v ?? "—").split("").map(c => /\d/.test(c) ? FA[Number(c)] : c).join("");

function StatusDot({ ok }: { ok: boolean | undefined }) {
  return ok
    ? <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600"><CheckCircle2 size={12} /> فعال</span>
    : <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-500"><XCircle size={12} /> قطع/نامشخص</span>;
}

export default function BotAdminPanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [testChatId, setTestChatId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bot-admin", { credentials: "include", cache: "no-store" });
      if (res.status === 403) { setErr("دسترسی ادمین لازم است — با حساب واقعی ادمین وارد شوید."); return; }
      setData(await res.json());
      setErr("");
    } catch { setErr("خطا در دریافت اطلاعات"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const doAction = async (action: string, extra: any = {}) => {
    setActionMsg("⏳ در حال اجرا...");
    try {
      const res = await fetch("/api/bot-admin", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const d = await res.json();
      setActionMsg(d.ok ? `✅ انجام شد${d.messageId ? ` (پیام ${fa(d.messageId)})` : ""}` : `❌ ${d.error || "خطا"}`);
    } catch { setActionMsg("❌ خطای شبکه"); }
    setTimeout(() => setActionMsg(""), 6000);
  };

  if (err) return <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs font-bold text-amber-700" dir="rtl">{err}</div>;

  const s = data?.settings || {};
  const st = data?.stats || {};

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Bot size={22} className="text-indigo-600" /> مدیریت ربات‌های تلگرام و بله
        </h2>
        <button onClick={load} disabled={loading}
          className="min-h-[40px] px-4 inline-flex items-center gap-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-black text-slate-600">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> به‌روزرسانی
        </button>
      </div>

      {/* وضعیت ربات‌ها */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800">🤖 تلگرام</h3>
            <StatusDot ok={data?.telegram?.ok} />
          </div>
          <p className="text-[10px] text-slate-500 font-bold">@{data?.telegram?.username || "—"}</p>
          <p className="text-[9px] text-slate-400 font-mono break-all" dir="ltr">{data?.telegram?.webhookUrl || "webhook ست نشده"}</p>
          <p className="text-[10px] font-bold text-slate-500">پیام معطل: {fa(data?.telegram?.pending)} {data?.telegram?.lastError ? <span className="text-rose-500">| خطا: {data.telegram.lastError}</span> : ""}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800">🔵 بله</h3>
            <StatusDot ok={data?.bale?.ok} />
          </div>
          <p className="text-[9px] text-slate-400 font-mono break-all" dir="ltr">{data?.bale?.webhookUrl || "—"}</p>
          <p className="text-[10px] font-bold text-slate-500">{data?.bale?.error || `پیام معطل: ${fa(data?.bale?.pending)}`}</p>
        </div>
        <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800"><Radio size={14} className="inline ml-1" /> کانال</h3>
            <StatusDot ok={data?.channelInfo?.ok} />
          </div>
          <p className="text-[10px] text-slate-600 font-bold">{data?.channelInfo?.title || s.channel}</p>
          <p className="text-[10px] text-slate-500 font-bold"><Users size={11} className="inline ml-1" /> {fa(data?.channelInfo?.members)} عضو | {s.channel}</p>
          <p className="text-[9px] text-slate-400 font-bold">⏰ پست خودکار: {s.cronWorker}</p>
        </div>
      </div>

      {/* آمار کاربران ربات */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5">
        <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2"><MessageSquare size={16} className="text-indigo-500" /> آمار کاربران ربات (از D1)</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ["پروفایل‌ها", st.profiles], ["ثبت‌نام کامل", st.completed],
            ["پاسخ تست", st.answers], ["کاربر فعال تست", st.quiz_users], ["چت امروز", st.chats_today],
          ].map(([l, v]: any) => (
            <div key={l} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <span className="text-xl font-black text-indigo-600 block">{fa(v ?? 0)}</span>
              <span className="text-[9px] font-bold text-slate-500">{l}</span>
            </div>
          ))}
        </div>
        {(st.byPlatform || []).length > 0 && (
          <p className="text-[10px] text-slate-400 font-bold mt-2">
            به تفکیک: {(st.byPlatform || []).map((p: any) => `${p.platform}: ${fa(p.n)}`).join(" | ")}
          </p>
        )}
      </div>

      {/* تنظیمات */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5">
        <h3 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-2"><Settings2 size={16} className="text-slate-500" /> تنظیمات فعال</h3>
        <div className="grid md:grid-cols-2 gap-2 text-[11px] font-bold text-slate-600">
          <p>📢 کانال پست روزانه: <span className="font-mono text-indigo-600">{s.channel}</span></p>
          <p>👑 ادمین‌های ربات (chat_id): <span className="font-mono">{s.botAdminIds || "—"}</span></p>
          <p>💬 سقف چت روزانه هر کاربر: {fa(s.chatDailyLimit)} پیام</p>
          <p>🤖 توکن تلگرام: {s.telegramTokenSet ? "✅ ست شده" : "❌"} | توکن بله: {s.baleTokenSet ? "✅ ست شده" : "❌"}</p>
          <p className="md:col-span-2">🧠 بانک RAG: <span className="font-mono text-[9px]" dir="ltr">{s.examRagUrl}</span></p>
        </div>
      </div>

      {/* اقدامات */}
      <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-3">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-2"><Megaphone size={16} className="text-amber-500" /> اقدامات سریع</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => doAction("post_channel")}
            className="min-h-[44px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black inline-flex items-center gap-2">
            <Megaphone size={14} /> انتشار «سوال روز» در کانال (الان)
          </button>
          <div className="flex gap-1.5 items-center">
            <input value={testChatId} onChange={(e) => setTestChatId(e.target.value)} placeholder="chat_id تست" dir="ltr"
              className="min-h-[44px] px-3 rounded-xl border border-slate-200 text-xs font-mono w-36" />
            <button onClick={() => doAction("test_message", { chatId: testChatId })}
              className="min-h-[44px] px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-black inline-flex items-center gap-2">
              <Send size={13} /> پیام تست
            </button>
          </div>
        </div>
        {actionMsg && <p className="text-xs font-black text-slate-600">{actionMsg}</p>}
        <p className="text-[9px] text-slate-400 font-bold">پست خودکار هر روز ~۱۰ صبح تهران توسط Worker انجام می‌شود؛ دکمه بالا برای انتشار فوری دستی است.</p>
      </div>

      {/* 💬 بازخورد سوالات بانک: نظرات کاربران + آمار سختی */}
      <QuestionFeedbackSection />
    </div>
  );
}

function QuestionFeedbackSection() {
  const [fb, setFb] = useState<any>(null);
  const [fbErr, setFbErr] = useState("");
  const loadFb = useCallback(async () => {
    try {
      const res = await fetch("/api/question-feedback", { credentials: "include" });
      const d = await res.json();
      if (res.ok) setFb(d); else setFbErr(d.error || "خطا");
    } catch (_) { setFbErr("اتصال برقرار نشد"); }
  }, []);
  useEffect(() => { loadFb(); }, [loadFb]);
  const delComment = async (id: string) => {
    await fetch("/api/question-feedback", { method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadFb();
  };
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-5 space-y-4">
      <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">💬 بازخورد سوالات بانک (نظرات + آمار سختی از D1)</h3>
      {fbErr && <p className="text-xs text-rose-600 font-bold">{fbErr}</p>}
      {fb && (
        <>
          <div className="flex flex-wrap gap-2 text-[10px] font-black">
            <span className="bg-indigo-50 text-indigo-700 rounded-full px-3 py-1.5">📊 {Number(fb.totals?.stats || 0).toLocaleString("fa-IR")} سوال آماردار</span>
            <span className="bg-emerald-50 text-emerald-700 rounded-full px-3 py-1.5">💬 {Number(fb.totals?.comments || 0).toLocaleString("fa-IR")} نظر کاربران</span>
            <span className="bg-rose-50 text-rose-700 rounded-full px-3 py-1.5">🚩 {Number(fb.totals?.flagged || 0).toLocaleString("fa-IR")} سوال پرچم‌دار (نیاز به بررسی)</span>
          </div>
          {(fb.flagged || []).length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-black text-rose-600">🚩 سوالات مشکل‌دار (دیس‌لایک زیاد یا دقت &lt;۱۵٪):</p>
              {fb.flagged.slice(0, 5).map((r: any) => (
                <div key={r.qi} className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 text-[10px]">
                  <b>#{r.qi}</b> [{r.subject || "—"}] {r.q} — 👍{Number(r.likes)} 👎{Number(r.dislikes)} | {Number(r.attempts)} پاسخ، {r.attempts > 0 ? Math.round((100 * r.correct) / r.attempts) : 0}٪ درست
                </div>
              ))}
            </div>
          )}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            <p className="text-[11px] font-black text-slate-600">آخرین نظرات کاربران:</p>
            {(fb.comments || []).length === 0 && <p className="text-[10px] text-slate-400">هنوز نظری ثبت نشده.</p>}
            {(fb.comments || []).map((c: any) => (
              <div key={c.id} className="border border-slate-100 rounded-xl p-3 text-[10px] flex items-start justify-between gap-2">
                <div>
                  <div className="font-black text-slate-700">💬 {c.comment}</div>
                  <div className="text-slate-400 mt-1">سوال #{c.qi} [{c.subject || "—"}]: {c.q}</div>
                  <div className="text-slate-300 mt-0.5">{c.platform} • {String(c.created_at).slice(0, 16).replace("T", " ")}</div>
                </div>
                <button onClick={() => delComment(c.id)} className="text-rose-400 hover:text-rose-600 font-black shrink-0">حذف</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
