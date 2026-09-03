import React, { useState, useEffect } from "react";
import { PlayCircle, ExternalLink, BookOpen, Clock, Star, GraduationCap, Filter, Users, Search } from "lucide-react";

/**
 * CoursesView — دوره‌های آموزشی رایگان از یوتیوب، آپارات و فرادرس
 * منابع معتبر فارسی برای دروس کنکور و پایه — فیلتر بر اساس رشته/درس.
 * ویدیوها لینک مستقیم به منبع اصلی هستند (بدون embed تا از ایران سریع باز شود).
 */

interface Course {
  id: string;
  title: string;
  provider: "یوتیوب" | "آپارات" | "فرادرس";
  channel: string;
  subject: string;
  fields: string[];      // رشته‌های مرتبط
  grade: string;         // پایه پیشنهادی
  duration: string;
  level: "مقدماتی" | "متوسط" | "پیشرفته" | "جمع‌بندی";
  url: string;
  free: boolean;
}

const COURSES: Course[] = [
  // ── زیست‌شناسی (تجربی)
  { id: "c1", title: "آموزش کامل زیست دهم — فصل به فصل", provider: "آپارات", channel: "کلاسینو", subject: "زیست‌شناسی", fields: ["تجربی"], grade: "دهم", duration: "۴۰+ جلسه", level: "مقدماتی", url: "https://www.aparat.com/result/زیست_دهم_کلاسینو", free: true },
  { id: "c2", title: "زیست کنکور — نکته و تست جمع‌بندی", provider: "آپارات", channel: "آلاء (سنا)", subject: "زیست‌شناسی", fields: ["تجربی"], grade: "دوازدهم", duration: "۲۵ جلسه", level: "جمع‌بندی", url: "https://www.aparat.com/result/زیست_کنکور_آلاء", free: true },
  { id: "c3", title: "آموزش ژنتیک از پایه تا کنکور", provider: "فرادرس", channel: "فرادرس", subject: "زیست‌شناسی", fields: ["تجربی"], grade: "یازدهم", duration: "۱۲ ساعت", level: "متوسط", url: "https://faradars.org/how-to-learn/biology", free: false },
  // ── ریاضی
  { id: "c4", title: "ریاضی کنکور تجربی — تمام فصل‌ها", provider: "آپارات", channel: "آلاء", subject: "ریاضی", fields: ["تجربی", "ریاضی"], grade: "دوازدهم", duration: "۶۰+ جلسه", level: "متوسط", url: "https://www.aparat.com/alaatv", free: true },
  { id: "c5", title: "حسابان و مشتق — آموزش مفهومی", provider: "یوتیوب", channel: "Mehdi Amiri Math", subject: "ریاضی", fields: ["ریاضی"], grade: "دوازدهم", duration: "۳۰ جلسه", level: "متوسط", url: "https://www.youtube.com/results?search_query=حسابان+مشتق+کنکور", free: true },
  { id: "c6", title: "آموزش ریاضی پایه هفتم تا نهم", provider: "فرادرس", channel: "فرادرس", subject: "ریاضی", fields: ["عمومی"], grade: "متوسطه اول", duration: "۲۰ ساعت", level: "مقدماتی", url: "https://faradars.org/how-to-learn/mathematics", free: false },
  // ── فیزیک
  { id: "c7", title: "فیزیک کنکور — حرکت‌شناسی تا مدار", provider: "آپارات", channel: "آلاء (کازرانیان)", subject: "فیزیک", fields: ["تجربی", "ریاضی"], grade: "دوازدهم", duration: "۵۰ جلسه", level: "متوسط", url: "https://www.aparat.com/result/فیزیک_کنکور_آلاء", free: true },
  { id: "c8", title: "Physics Fundamentals — پایه قوی فیزیک", provider: "یوتیوب", channel: "Khan Academy", subject: "فیزیک", fields: ["تجربی", "ریاضی"], grade: "دهم", duration: "سری کامل", level: "مقدماتی", url: "https://www.youtube.com/@khanacademy/playlists", free: true },
  // ── شیمی
  { id: "c9", title: "شیمی کنکور — از صفر تا صد", provider: "آپارات", channel: "آلاء (مصلایی)", subject: "شیمی", fields: ["تجربی", "ریاضی"], grade: "دوازدهم", duration: "۷۰ جلسه", level: "متوسط", url: "https://www.aparat.com/result/شیمی_کنکور", free: true },
  { id: "c10", title: "آموزش شیمی آلی", provider: "فرادرس", channel: "فرادرس", subject: "شیمی", fields: ["تجربی", "ریاضی"], grade: "یازدهم", duration: "۸ ساعت", level: "پیشرفته", url: "https://faradars.org/how-to-learn/chemistry", free: false },
  // ── عمومی‌ها
  { id: "c11", title: "عربی کنکور — قواعد + ترجمه", provider: "آپارات", channel: "آلاء (ناصح‌زاده)", subject: "عربی", fields: ["عمومی"], grade: "دوازدهم", duration: "۳۵ جلسه", level: "جمع‌بندی", url: "https://www.aparat.com/result/عربی_کنکور_آلاء", free: true },
  { id: "c12", title: "ادبیات کنکور — آرایه و قرابت", provider: "آپارات", channel: "آلاء (راد)", subject: "ادبیات", fields: ["عمومی"], grade: "دوازدهم", duration: "۴۰ جلسه", level: "جمع‌بندی", url: "https://www.aparat.com/result/ادبیات_کنکور", free: true },
  { id: "c13", title: "زبان انگلیسی کنکور + تکنیک تست", provider: "یوتیوب", channel: "English with Emma / کنکور", subject: "زبان انگلیسی", fields: ["عمومی", "زبان"], grade: "دوازدهم", duration: "سری کامل", level: "متوسط", url: "https://www.youtube.com/results?search_query=زبان+انگلیسی+کنکور", free: true },
  { id: "c14", title: "دین و زندگی — آیات و روایات", provider: "آپارات", channel: "آلاء (کاغذی)", subject: "دین و زندگی", fields: ["عمومی"], grade: "دوازدهم", duration: "۳۰ جلسه", level: "جمع‌بندی", url: "https://www.aparat.com/result/دینی_کنکور", free: true },
  // ── انسانی
  { id: "c15", title: "منطق و فلسفه — آموزش مفهومی", provider: "فرادرس", channel: "فرادرس", subject: "فلسفه و منطق", fields: ["انسانی"], grade: "یازدهم", duration: "۱۰ ساعت", level: "متوسط", url: "https://faradars.org/how-to-learn/philosophy", free: false },
  { id: "c16", title: "ریاضی و آمار انسانی", provider: "آپارات", channel: "کلاسینو", subject: "ریاضی و آمار", fields: ["انسانی"], grade: "دوازدهم", duration: "۲۵ جلسه", level: "متوسط", url: "https://www.aparat.com/result/ریاضی_انسانی_کنکور", free: true },
  // ── مهارتی/روانشناسی
  { id: "c17", title: "تکنیک‌های مدیریت استرس آزمون", provider: "یوتیوب", channel: "TED / روانشناسی", subject: "روانشناسی", fields: ["عمومی"], grade: "همه پایه‌ها", duration: "ویدیوهای کوتاه", level: "مقدماتی", url: "https://www.youtube.com/results?search_query=مدیریت+استرس+کنکور", free: true },
  { id: "c18", title: "برنامه‌ریزی و مطالعه مؤثر (متد کایزن)", provider: "فرادرس", channel: "فرادرس", subject: "مهارت مطالعه", fields: ["عمومی"], grade: "همه پایه‌ها", duration: "۶ ساعت", level: "مقدماتی", url: "https://faradars.org/how-to-learn/study-skills", free: false },
];

const PROVIDER_STYLE: Record<string, string> = {
  "یوتیوب": "bg-red-50 text-red-600 border-red-200",
  "آپارات": "bg-pink-50 text-pink-600 border-pink-200",
  "فرادرس": "bg-blue-50 text-blue-600 border-blue-200",
  "آلاء": "bg-emerald-50 text-emerald-600 border-emerald-200",
};

/* ── 👨‍🏫 دبیریاب کنکور — دبیرهای معروف هر درس + دوره رایگان (همان دیتای ربات تلگرام) ── */
interface Teacher {
  name: string; subject: string; fields: string[];
  known: string;         // به چی معروف است
  freeNote: string;      // دوره/محتوای رایگان
  url: string; provider: "آلاء" | "آپارات" | "یوتیوب" | "فرادرس";
}
const TEACHERS: Teacher[] = [
  { name: "جلال موقاری", subject: "زیست‌شناسی", fields: ["تجربی"], known: "زیست مفهومی و ترکیبی — محبوب‌ترین زیست آلاء", freeNote: "دوره کامل رایگان آلاء", url: "https://alaatv.com/c/33", provider: "آلاء" },
  { name: "علی محمد عمارلو", subject: "زیست‌شناسی", fields: ["تجربی"], known: "جمع‌بندی و نکته‌وتست زیست", freeNote: "فیلم‌های رایگان آپارات", url: "https://www.aparat.com/result/عمارلو_زیست", provider: "آپارات" },
  { name: "شیروانی", subject: "شیمی", fields: ["تجربی", "ریاضی"], known: "شیمی از پایه تا کنکور — آلاء", freeNote: "دوره رایگان آلاء", url: "https://alaatv.com/c/13", provider: "آلاء" },
  { name: "مهدی صنیعی طهرانی", subject: "شیمی", fields: ["تجربی", "ریاضی"], known: "تکنیک‌های حل تست سریع شیمی", freeNote: "فیلم‌های رایگان آپارات", url: "https://www.aparat.com/result/صنیعی_شیمی_کنکور", provider: "آپارات" },
  { name: "محمدصادق ثابتی", subject: "ریاضی", fields: ["تجربی", "ریاضی"], known: "ریاضی مفهومی از صفر — آلاء", freeNote: "دوره کامل رایگان", url: "https://alaatv.com/c/29", provider: "آلاء" },
  { name: "علی هاشمی", subject: "ریاضی", fields: ["تجربی", "ریاضی"], known: "حسابان و ریاضی تجربی — کلاس‌های پرمخاطب", freeNote: "نمونه تدریس‌های آپارات", url: "https://www.aparat.com/result/علی_هاشمی_ریاضی", provider: "آپارات" },
  { name: "فرشید داداشی", subject: "فیزیک", fields: ["تجربی", "ریاضی"], known: "فیزیک صفر تا صد — آلاء", freeNote: "دوره کامل رایگان آلاء", url: "https://alaatv.com/c/16", provider: "آلاء" },
  { name: "کامیار کازرانیان", subject: "فیزیک", fields: ["تجربی", "ریاضی"], known: "نکته و تست فیزیک", freeNote: "فیلم‌های رایگان آپارات", url: "https://www.aparat.com/result/کازرانیان_فیزیک", provider: "آپارات" },
  { name: "علیرضا عبدالمحمدی", subject: "ادبیات فارسی", fields: ["عمومی"], known: "آرایه و قرابت — پرمخاطب‌ترین ادبیات", freeNote: "دوره رایگان آلاء", url: "https://alaatv.com/c/8", provider: "آلاء" },
  { name: "ناصح‌زاده", subject: "عربی", fields: ["عمومی"], known: "قواعد + ترجمه با روش ساده", freeNote: "دوره کامل رایگان آلاء", url: "https://alaatv.com/c/10", provider: "آلاء" },
  { name: "محمد کاغذی", subject: "دین و زندگی", fields: ["عمومی"], known: "آیات و روایات طبقه‌بندی‌شده", freeNote: "فیلم‌های رایگان آپارات", url: "https://www.aparat.com/result/کاغذی_دینی", provider: "آپارات" },
  { name: "دانیال نیک‌نداف", subject: "زبان انگلیسی", fields: ["عمومی", "زبان"], known: "واژگان و کلوز تست", freeNote: "فیلم‌های رایگان آپارات", url: "https://www.aparat.com/result/زبان_کنکور_نیک_نداف", provider: "آپارات" },
  { name: "امیر قاسمی", subject: "فلسفه و منطق", fields: ["انسانی"], known: "منطق مفهومی برای انسانی", freeNote: "فیلم‌های رایگان آپارات", url: "https://www.aparat.com/result/فلسفه_منطق_کنکور", provider: "آپارات" },
  { name: "سابقی", subject: "ریاضی و آمار", fields: ["انسانی"], known: "ریاضی انسانی از پایه", freeNote: "فیلم‌های رایگان آپارات", url: "https://www.aparat.com/result/ریاضی_انسانی_کنکور", provider: "آپارات" },
];

export default function CoursesView() {
  const [field, setField] = useState("همه");
  const [provider, setProvider] = useState("همه");
  const [tQuery, setTQuery] = useState("");
  const [tSubject, setTSubject] = useState("همه");
  const [systemMentors, setSystemMentors] = useState<{ name: string; role: string; field: string | null }[]>([]);
  useEffect(() => {
    fetch("/api/public-mentors").then((r) => r.json()).then((d) => { if (d.mentors) setSystemMentors(d.mentors); }).catch(() => {});
  }, []);

  const fields = ["همه", "تجربی", "ریاضی", "انسانی", "زبان", "عمومی"];
  const providers = ["همه", "آپارات", "یوتیوب", "فرادرس"];

  const filtered = COURSES.filter((c) =>
    (field === "همه" || c.fields.includes(field) || c.fields.includes("عمومی")) &&
    (provider === "همه" || c.provider === provider)
  );

  const tSubjects = ["همه", ...Array.from(new Set(TEACHERS.map((t) => t.subject)))];
  const teachersFiltered = TEACHERS.filter((t) =>
    (field === "همه" || t.fields.includes(field) || t.fields.includes("عمومی")) &&
    (tSubject === "همه" || t.subject === tSubject) &&
    (tQuery.trim() === "" || t.name.includes(tQuery.trim()) || t.subject.includes(tQuery.trim()) || t.known.includes(tQuery.trim()))
  );

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Hero */}
      <div className="bg-gradient-to-tr from-indigo-950 via-slate-900 to-purple-950 rounded-[32px] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-[80px]" />
        <div className="relative z-10">
          <h1 className="text-2xl font-black flex items-center gap-2 mb-2">
            <GraduationCap size={26} className="text-amber-400" />
            دوره‌های آموزشی منتخب
          </h1>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            بهترین دوره‌های رایگان و پولی از <strong className="text-pink-300">آپارات</strong>، <strong className="text-red-300">یوتیوب</strong> و <strong className="text-blue-300">فرادرس</strong> — دستچین‌شده برای هر رشته و پایه. اکثر دوره‌ها کاملاً رایگان‌اند (آلاء و کلاسینو).
          </p>
        </div>
      </div>

      {/* فیلترها */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-wrap items-center gap-3">
        <Filter size={16} className="text-slate-400" />
        <div className="flex flex-wrap gap-1.5">
          {fields.map((f) => (
            <button key={f} onClick={() => setField(f)}
              className={`min-h-[38px] px-3.5 rounded-xl text-[11px] font-black transition ${field === f ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
              {f}
            </button>
          ))}
        </div>
        <span className="text-slate-200">|</span>
        <div className="flex flex-wrap gap-1.5">
          {providers.map((p) => (
            <button key={p} onClick={() => setProvider(p)}
              className={`min-h-[38px] px-3.5 rounded-xl text-[11px] font-black transition ${provider === p ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
              {p}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-slate-400 font-bold mr-auto">{filtered.length} دوره</span>
      </div>

      {/* 👨‍🏫 دبیریاب کنکور */}
      <div className="bg-white rounded-[28px] border border-slate-100 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Users size={22} className="text-violet-600" /> دبیریاب کنکور — دبیرهای معروف هر درس
          </h2>
          <span className="text-[10px] text-slate-400 font-bold">{teachersFiltered.length.toLocaleString("fa-IR")} دبیر</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-6">
          برای هر درس، دبیرهای شناخته‌شده کنکور + لینک <b className="text-emerald-600">دوره رایگان</b> آن‌ها (آلاء/آپارات).
          فیلتر رشته بالای صفحه روی این بخش هم اثر می‌کند. در ربات تلگرام هم دکمه «🎬 دبیر و دوره رایگان» همین را بر اساس ضعیف‌ترین درسِ کارنامه‌ات پیشنهاد می‌دهد.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
            <input value={tQuery} onChange={(e) => setTQuery(e.target.value)} placeholder="جستجوی نام دبیر یا درس..."
              className="pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 text-[11px] font-bold focus:ring-2 focus:ring-violet-200 outline-none w-52" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tSubjects.map((s) => (
              <button key={s} onClick={() => setTSubject(s)}
                className={`min-h-[36px] px-3 rounded-xl text-[10px] font-black transition ${tSubject === s ? "bg-violet-600 text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
        {systemMentors.length > 0 && (
          <div className="bg-violet-50/60 border border-violet-100 rounded-2xl p-4">
            <p className="text-[11px] font-black text-violet-700 mb-2">🏠 مربیان رسمی ترنم همدلی (عضو سامانه — رزرو جلسه حضوری/آنلاین)</p>
            <div className="flex flex-wrap gap-2">
              {systemMentors.map((m, i) => {
                const FIELD_FA: Record<string, string> = { tajrobi: "تجربی", riazi: "ریاضی", ensani: "انسانی", honar: "هنر", zaban: "زبان" };
                return (
                  <span key={i} className="bg-white border border-violet-200 rounded-full px-3 py-1.5 text-[10px] font-black text-slate-700">
                    ⭐ {m.name} <span className="text-violet-500">({m.role === "counselor" ? "مشاور" : "دبیر"}{m.field ? ` • ${FIELD_FA[m.field] || m.field}` : ""})</span>
                  </span>
                );
              })}
            </div>
            <a href="/inperson" className="inline-block mt-2 text-[10px] font-black text-violet-600 underline">📍 رزرو جلسه با مربیان سامانه ←</a>
          </div>
        )}
        <p className="text-[10px] text-slate-400 font-bold">
          👇 دبیرهای معروف کشوری (خارج از سامانه) — معرفی صرفاً بر اساس دوره‌های عمومی منتشرشده در
          {" "}<a href="https://alaatv.com" target="_blank" rel="noreferrer" className="underline">آلاء (alaatv.com)</a> و
          {" "}<a href="https://www.aparat.com" target="_blank" rel="noreferrer" className="underline">آپارات</a>؛
          خودتان از همین منابع راستی‌آزمایی کنید. ترنم همدلی با این اساتید قرارداد ندارد.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teachersFiltered.map((t) => (
            <a key={t.name + t.subject} href={t.url} target="_blank" rel="noopener noreferrer"
              className="group bg-slate-50/60 hover:bg-white rounded-2xl border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-black text-slate-800 group-hover:text-violet-700 transition">👨‍🏫 {t.name}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${PROVIDER_STYLE[t.provider]}`}>{t.provider}</span>
              </div>
              <span className="text-[10px] font-black text-indigo-500">{t.subject} • {t.fields.join("، ")}</span>
              <p className="text-[10px] text-slate-500 leading-5">{t.known}</p>
              <span className="mt-auto pt-2 border-t border-slate-100 text-[10px] font-black text-emerald-600 flex items-center gap-1">
                🆓 {t.freeNote} <ExternalLink size={10} className="mr-auto text-slate-300 group-hover:text-violet-400 transition" />
              </span>
            </a>
          ))}
          {teachersFiltered.length === 0 && (
            <p className="text-[11px] text-slate-400 font-bold col-span-full text-center py-6">دبیری با این فیلتر پیدا نشد.</p>
          )}
        </div>
      </div>

      {/* کارت دوره‌ها */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => (
          <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer"
            className="group bg-white rounded-3xl border border-slate-100 p-5 hover:border-indigo-200 hover:shadow-lg transition-all flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <span className={`text-[9px] font-black px-2.5 py-1 rounded-full border ${PROVIDER_STYLE[c.provider]}`}>{c.provider}</span>
              {c.free
                ? <span className="text-[9px] font-black px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">رایگان</span>
                : <span className="text-[9px] font-black px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">پولی</span>}
            </div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition">
                <PlayCircle size={22} />
              </div>
              <div>
                <h3 className="text-[13px] font-black text-slate-800 leading-snug group-hover:text-indigo-700 transition">{c.title}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{c.channel}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[9px] font-bold text-slate-500 mt-auto pt-2 border-t border-slate-50">
              <span className="flex items-center gap-1"><BookOpen size={10} /> {c.subject}</span>
              <span className="flex items-center gap-1"><Star size={10} /> {c.level}</span>
              <span className="flex items-center gap-1"><Clock size={10} /> {c.duration}</span>
              <span className="flex items-center gap-1 mr-auto text-indigo-500"><ExternalLink size={10} /> {c.grade}</span>
            </div>
          </a>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 font-bold text-center">
        💡 دوره‌های آپارات (آلاء، کلاسینو) بدون فیلترشکن و رایگان از ایران قابل مشاهده‌اند. لینک‌ها به منبع اصلی می‌روند.
      </p>
    </div>
  );
}
