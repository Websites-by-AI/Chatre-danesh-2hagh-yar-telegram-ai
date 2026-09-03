import React, { useState, useEffect } from "react";
import {
  Rocket, Calendar, Clock, Mail, ExternalLink, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, CircleDashed, Send, BellRing, DollarSign, Copy, ClipboardCheck,
} from "lucide-react";
import { FILLED_FORMS, buildAllFormsEmailBody, type FilledField } from "./startupCallAnswers";

/**
 * StartupCallsTracker — رهگیر فراخوان‌های استارتاپی/گرنت (کانادا) در پنل ادمین
 * - جدول ۱۰ فراخوان با ددلاین، زمان پاسخ‌دهی، مبلغ، ایمیل تماس
 * - شمارش معکوس روزهای مانده + هشدار «روزهای آخر»
 * - فیلدهای فرم موردنیاز هر فراخوان (بازشونده)
 * - دکمه ایمیل یادآوری (mailto از پیش پرشده به آدرس متقاضی)
 * - وضعیت هر فراخوان در localStorage ذخیره می‌شود
 */

const APPLICANT_EMAIL = "soheil.power@gmail.com";
const APPLICANT_PHONE = "+1-208-5033653";

interface StartupCall {
  id: string;
  name: string;
  nameEn: string;            // English name (bilingual table)
  match: number;             // درصد مناسب‌بودن برای ثبت‌نام (0-100)
  funder: string;
  amount: string;
  deadline: string | null;      // ISO date or null (rolling)
  deadlineNote: string;
  answerTime: string;           // زمان پاسخ‌دهی/اعلام نتیجه
  avgResponseDays: string;      // میانگین زمان بررسی
  link: string;
  applyLink: string;         // لینک مستقیم صفحه ثبت‌نام/Apply
  contactEmail: string;
  formFields: string[];         // فیلدهای فرم درخواست
  fit: string;                  // چرا مرتبط است
}

const CALLS: StartupCall[] = [
  {
    id: "eaai27",
    nameEn: "EAAI-27 Symposium on AI Education (AAAI, Montreal)",
    match: 95,
    name: "EAAI-27 — سمپوزیوم آموزش AI (AAAI مونترال)",
    funder: "AAAI — ارسال مقاله بدون نیاز به ویزا",
    amount: "اعتبار علمی (مقاله/گزارش تجربه)",
    deadline: "2026-09-01",
    deadlineNote: "چکیده: ۱ سپتامبر — مقاله کامل: ۸ سپتامبر ۲۰۲۶",
    answerTime: "اعلام نتیجه: ۱۷ نوامبر ۲۰۲۶",
    avgResponseDays: "~۷۰ روز پس از ارسال",
    link: "https://aaai.org/conference/aaai/aaai-27/eaai-27-call/",
    applyLink: "https://openreview.net/group?id=AAAI.org/2027/Symposium/EAAI",
    contactEmail: "eaai27chairs@aaai.org",
    formFields: ["عنوان مقاله", "چکیده (~۲۰۰ کلمه)", "نویسندگان و ایمیل", "ترک (Main یا K-12)", "نوع (پژوهشی/گزارش تجربه)", "PDF مقاله (فرمت AAAI)"],
    fit: "ارسال مقاله از ایران کاملاً ممکن است — RAG فارسی کنکور برای ترک K-12",
  },
  {
    id: "yc",
    nameEn: "Y Combinator — W27 Batch (USA)",
    match: 50,
    name: "Y Combinator — بچ W27",
    funder: "YC (آمریکا) — پذیرش بین‌المللی از هر کشور",
    amount: "۵۰۰ هزار دلار سرمایه",
    deadline: "2026-11-09",
    deadlineNote: "پیش‌بینی ددلاین W27: ~نوامبر ۲۰۲۶ (درخواست دیرهنگام هم بررسی می‌شود)",
    answerTime: "مصاحبه + نتیجه: ~۳–۵ هفته پس از ددلاین",
    avgResponseDays: "~۳۰ روز",
    link: "https://apply.ycombinator.com/",
    applyLink: "https://apply.ycombinator.com/",
    contactEmail: "فرم آنلاین apply.ycombinator.com",
    formFields: ["توضیح یک‌خطی استارتاپ", "ویدیو ۱ دقیقه‌ای بنیان‌گذاران", "ترکشن و کاربران", "چرا این تیم؟", "مدل درآمد", "اطلاعات هم‌بنیان‌گذاران"],
    fit: "از هر کشوری می‌پذیرد؛ برای خود بچ ۳ ماه حضور در سانفرانسیسکو لازم است (YC در روند ویزا کمک می‌کند)",
  },
  {
    id: "masschallenge",
    nameEn: "MassChallenge Switzerland — Early Stage 2027",
    match: 60,
    name: "MassChallenge Switzerland — Early Stage 2027",
    funder: "MassChallenge — بدون سهام، هر جغرافیایی",
    amount: "سهم از ۱.۲۶ میلیون دلار جایزه بدون سهام",
    deadline: "2027-03-04",
    deadlineNote: "دور ۲۰۲۷: بازشدن ~۱۴ ژانویه، ددلاین ~۴ مارس ۲۰۲۷",
    answerTime: "انتخاب نهایی: ~۸ هفته پس از ددلاین",
    avgResponseDays: "~۶۰ روز",
    link: "https://masschallenge.org/our-accelerators/",
    applyLink: "https://masschallenge.org/apply/",
    contactEmail: "فرم پورتال masschallenge.org",
    formFields: ["پروفایل استارتاپ", "مرحله و ترکشن", "سرمایه جذب‌شده (<۲M CHF)", "ویدیو پیچ", "تیم"],
    fit: "بدون سهام، بدون نیاز به ثبت شرکت، از هر کشور — فقط ۲ سفر کوتاه به سوئیس (ویزای شینگن کوتاه‌مدت)",
  },
  {
    id: "itucekirdek",
    nameEn: "ITU Cekirdek — Istanbul (Big Bang)",
    match: 75,
    name: "ITU Çekirdek — استانبول (Big Bang)",
    funder: "دانشگاه فنی استانبول — ایرانیان بدون ویزا",
    amount: "جوایز نقدی Big Bang + دفتر رایگان",
    deadline: null,
    deadlineNote: "پذیرش دوره‌ای — دور بعدی اوایل ۲۰۲۷ (سایت را رصد کن)",
    answerTime: "ارزیابی: ~۴–۶ هفته",
    avgResponseDays: "~۳۵ روز",
    link: "https://itucekirdek.com/en/",
    applyLink: "https://itucekirdek.com/en/apply/",
    contactEmail: "فرم آنلاین itucekirdek.com",
    formFields: ["فرم آنلاین استارتاپ", "پیچ‌دک", "دمو محصول", "تیم", "مصاحبه حضوری/آنلاین"],
    fit: "سفر ایران→ترکیه بدون ویزا — یکی از عملی‌ترین گزینه‌ها برای تیم مستقر در ایران",
  },
  {
    id: "hub71",
    nameEn: "Hub71 — Abu Dhabi (UAE Gov)",
    match: 80,
    name: "Hub71 — ابوظبی",
    funder: "دولت امارات — ویزای امارات برای ایرانیان آسان",
    amount: "بسته مشوق تا ~۲۵۰ هزار درهم + ویزا",
    deadline: null,
    deadlineNote: "۲ دور پذیرش در سال — دور بعدی ~پاییز ۲۰۲۶",
    answerTime: "غربالگری + مصاحبه: ~۶–۸ هفته",
    avgResponseDays: "~۵۰ روز",
    link: "https://hub71.com/",
    applyLink: "https://hub71.com/apply",
    contactEmail: "فرم آنلاین hub71.com",
    formFields: ["پیچ‌دک", "ترکشن و درآمد", "برنامه استقرار در ابوظبی", "ثبت شرکت در ADGM پس از پذیرش", "تیم"],
    fit: "به استارتاپ ویزای امارات می‌دهد — مسیر واقعی خروج از محدودیت تحریم با ثبت شرکت اماراتی",
  },
  {
    id: "fi",
    nameEn: "Founder Institute — Virtual / Dubai / Istanbul",
    match: 90,
    name: "Founder Institute — فصل مجازی/دبی/استانبول",
    funder: "FI — بزرگ‌ترین پیش‌شتاب‌دهنده جهان",
    amount: "شبکه و ساختار (~۴٪ سهام مشترک + شهریه)",
    deadline: null,
    deadlineNote: "کوهورت‌های متعدد در سال — پذیرش چرخشی",
    answerTime: "آزمون استعداد + نتیجه: ~۱–۲ هفته",
    avgResponseDays: "~۱۰ روز",
    link: "https://fi.co/",
    applyLink: "https://fi.co/join",
    contactEmail: "فرم fi.co (فصل Virtual یا Dubai/Istanbul)",
    formFields: ["فرم ثبت‌نام", "آزمون استعداد کارآفرینی (رایگان)", "ایده استارتاپ", "رزومه"],
    fit: "کاملاً آنلاین قابل انجام از ایران — فصل‌های منطقه‌ای دبی/استانبول هم دارد",
  },
  {
    id: "1m1m",
    nameEn: "1Mby1M — Global Virtual Accelerator",
    match: 85,
    name: "1Mby1M — شتاب‌دهنده مجازی جهانی",
    funder: "1Mby1M — بدون سهام، کاملاً آنلاین",
    amount: "منتورشیپ بدون سهام (اشتراک سالانه)",
    deadline: null,
    deadlineNote: "پذیرش دائمی — از هر کشور",
    answerTime: "شروع فوری پس از ثبت‌نام",
    avgResponseDays: "~۷ روز",
    link: "https://1m1m.sramanamitra.com/",
    applyLink: "https://1m1m.sramanamitra.com/free-trial/",
    contactEmail: "فرم آنلاین سایت",
    formFields: ["پروفایل استارتاپ", "مرحله فعلی", "اشتراک برنامه"],
    fit: "صفر تا صد آنلاین، بدون سهام، بدون محدودیت جغرافیایی — مناسب شروع از ایران",
  },
  {
    id: "freshmango",
    nameEn: "Freshmango — Remote Pre-Seed Accelerator",
    match: 70,
    name: "Freshmango — شتاب‌دهنده ریموت Pre-Seed",
    funder: "Freshmango — بدون سهام",
    amount: "منتورشیپ + اتصال به سرمایه‌گذار (هزینه ماهانه)",
    deadline: null,
    deadlineNote: "پذیرش دائمی (start-anytime) — هر کشوری",
    answerTime: "بررسی: ~۱–۲ هفته",
    avgResponseDays: "~۱۰ روز",
    link: "https://freshmango.io/",
    applyLink: "https://freshmango.io/apply",
    contactEmail: "فرم آنلاین سایت",
    formFields: ["ایده/محصول", "تیم و اهداف", "مرحله فعلی"],
    fit: "ریموت کامل و بدون محدودیت جغرافیایی — بدون سهام",
  },
  {
    id: "seedstars",
    nameEn: "Seedstars — Emerging Markets Competition",
    match: 65,
    name: "Seedstars — رقابت بازارهای نوظهور",
    funder: "Seedstars (سوئیس) — تمرکز بر بازارهای نوظهور و منا",
    amount: "تا ۵۰۰ هزار دلار سرمایه برای برنده جهانی",
    deadline: null,
    deadlineNote: "رقابت‌های منطقه‌ای سالانه — مراحل اول آنلاین",
    answerTime: "هر مرحله: ~۴–۶ هفته",
    avgResponseDays: "~۳۵ روز",
    link: "https://seedstars.com/",
    applyLink: "https://seedstars.com/programs/",
    contactEmail: "فرم آنلاین seedstars.com",
    formFields: ["پروفایل استارتاپ", "پیچ‌دک", "ترکشن", "ویدیو پیچ"],
    fit: "مخصوص بازارهای نوظهور — مراحل اولیه بدون سفر",
  },
  {
    id: "nvidia",
    nameEn: "NVIDIA Inception — AI Startup Program",
    match: 40,
    name: "NVIDIA Inception — برنامه استارتاپ‌های AI",
    funder: "NVIDIA — رایگان، بدون سهام، ریموت",
    amount: "کردیت GPU/کلود + منتورشیپ فنی",
    deadline: null,
    deadlineNote: "پذیرش دائمی",
    answerTime: "تأیید: ~۱–۲ هفته",
    avgResponseDays: "~۱۰ روز",
    link: "https://www.nvidia.com/en-us/startups/",
    applyLink: "https://www.nvidia.com/en-us/startups/apply/",
    contactEmail: "فرم آنلاین nvidia.com/startups",
    formFields: ["پروفایل شرکت", "حوزه AI", "وب‌سایت محصول", "ایمیل شرکتی"],
    fit: "⚠️ شرکت آمریکایی — به‌دلیل تحریم، ثبت‌نام با نهاد ثبت‌شده خارج از ایران (مثلاً امارات/ترکیه) انجام شود",
  },
];

type CallStatus = "notStarted" | "preparing" | "submitted" | "answered";
const STATUS_META: Record<CallStatus, { label: string; cls: string; icon: any }> = {
  notStarted: { label: "شروع‌نشده", cls: "bg-slate-100 text-slate-500", icon: CircleDashed },
  preparing: { label: "در حال آماده‌سازی", cls: "bg-amber-100 text-amber-700", icon: Clock },
  submitted: { label: "ارسال شد", cls: "bg-indigo-100 text-indigo-700", icon: Send },
  answered: { label: "پاسخ آمد", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
};

const FA = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
const fa = (v: number | string) => String(v).split("").map(c => /\d/.test(c) ? FA[Number(c)] : c).join("");

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null;
  return Math.ceil((new Date(deadline + "T23:59:59").getTime() - Date.now()) / 86400000);
}

function reminderMailto(call: StartupCall): string {
  const d = daysLeft(call.deadline);
  const subject = encodeURIComponent(`یادآوری فراخوان: ${call.name}${d !== null ? ` — ${d} روز مانده` : ""}`);
  const body = encodeURIComponent(
    `فراخوان: ${call.name}\nنهاد: ${call.funder}\nمبلغ: ${call.amount}\nددلاین: ${call.deadlineNote}\nزمان پاسخ‌دهی: ${call.answerTime}\nمیانگین بررسی: ${call.avgResponseDays}\nلینک: ${call.link}\nایمیل تماس فراخوان: ${call.contactEmail}\n\nفیلدهای فرم:\n${call.formFields.map(f => "- " + f).join("\n")}\n\nمتقاضی: ${APPLICANT_EMAIL} | ${APPLICANT_PHONE}\nپروژه: ترنم همدلی (hamdeltar.ir) — RAG کنکور با ۱۸۸۶ سوال، دقت سال ۹۶.۲٪`
  );
  return `mailto:${APPLICANT_EMAIL}?subject=${subject}&body=${body}`;
}

/** پنل «فرم پرشده» — پاسخ آماده انگلیسی هر فیلد با دکمه کپی */
function FilledFormPanel({ callId }: { callId: string }) {
  const fields: FilledField[] | undefined = FILLED_FORMS[callId];
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  if (!fields || fields.length === 0) return null;

  const copy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch (_) { /* clipboard blocked */ }
  };

  return (
    <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4">
      <h5 className="text-[11px] font-black text-emerald-800 mb-3 flex items-center gap-1.5">
        <ClipboardCheck size={13} /> ✍️ فرم پرشده — پاسخ آماده هر فیلد (انگلیسی، فقط کپی کن)
      </h5>
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={i} className="bg-white rounded-xl border border-emerald-100 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black text-slate-700">{f.field}</span>
              <button
                onClick={() => copy(f.value, i)}
                className={`min-h-[32px] px-2.5 inline-flex items-center gap-1 rounded-lg text-[9px] font-black transition-all ${
                  copiedIdx === i
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-100 hover:bg-emerald-200 text-emerald-700"
                }`}
              >
                {copiedIdx === i ? <><CheckCircle2 size={11} /> کپی شد</> : <><Copy size={11} /> کپی</>}
              </button>
            </div>
            <p className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-wrap" dir="ltr" style={{ textAlign: "left" }}>
              {f.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function allFormsMailto(): string {
  const subject = encodeURIComponent("پاسخ‌های آماده فرم‌های ۱۰ فراخوان استارتاپی — Taranom Hamdeli");
  // mailto has URL-length limits in some clients; keep body but warn user in UI.
  const body = encodeURIComponent(buildAllFormsEmailBody().slice(0, 12000));
  return `mailto:${APPLICANT_EMAIL}?subject=${subject}&body=${body}`;
}

export default function StartupCallsTracker() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, CallStatus>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("taranom_startup_calls_status");
      if (raw) setStatuses(JSON.parse(raw));
    } catch (_) { /* ignore */ }
  }, []);

  const setStatus = (id: string, s: CallStatus) => {
    const next = { ...statuses, [id]: s };
    setStatuses(next);
    try { localStorage.setItem("taranom_startup_calls_status", JSON.stringify(next)); } catch (_) { /* ignore */ }
  };

  const sorted = [...CALLS].sort((a, b) => {
    const da = daysLeft(a.deadline); const db = daysLeft(b.deadline);
    if (da === null && db === null) return 0;
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  });

  const urgent = sorted.filter(c => { const d = daysLeft(c.deadline); return d !== null && d >= 0 && d <= 21; });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-tr from-indigo-950 via-slate-900 to-slate-950 rounded-[28px] p-6 text-white border border-white/5">
        <h2 className="text-xl font-black flex items-center gap-2">
          <Rocket size={22} className="text-amber-400" />
          رهگیر فراخوان‌های استارتاپی بین‌المللی 🌍
        </h2>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          {fa(CALLS.length)} فراخوان بین‌المللی (ریموت/بدون نیاز به ویزا و PR — مناسب تیم مستقر در ایران) — متقاضی: <span className="font-mono text-amber-300">{APPLICANT_EMAIL}</span> | <span className="font-mono text-emerald-300" dir="ltr">{APPLICANT_PHONE}</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={allFormsMailto()}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black transition-all"
          >
            <Mail size={13} /> ارسال همه فرم‌های پرشده به ایمیل من
          </a>
          <span className="text-[9px] text-slate-400 font-bold self-center">
            (هر فراخوان را باز کن تا پاسخ‌های آماده انگلیسی هر فیلد را با دکمه کپی ببینی)
          </span>
        </div>
      </div>


      {/* 🚀 وضعیت استارتاپ + جذب هم‌بنیان‌گذار (فقط ادمین — از صفحه عمومی برداشته شد) */}
      <div className="bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900 rounded-[28px] border border-indigo-500/20 p-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🚀</span>
          <h3 className="text-sm font-black">ترنم همدلی در مسیر استارتاپ جهانی</h3>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
          در حال ثبت‌نام در <strong className="text-amber-300">۱۰ فراخوان بین‌المللی</strong> (شتاب‌دهنده و رویداد) هستیم — از جمله
          <strong className="text-emerald-300"> Y Combinator، MassChallenge سوئیس، Hub71 ابوظبی، ITU Çekirdek استانبول و EAAI-27 مونترال</strong>.
          فراخوان‌های انتخابی ریموت یا بدون نیاز به ویزا/اقامت هستند.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <span className="text-xl font-black text-amber-300 block">۱۸۸۶</span>
            <span className="text-[9px] text-slate-400 font-bold">سوال کنکور در RAG</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <span className="text-xl font-black text-emerald-300 block">۹۶٪</span>
            <span className="text-[9px] text-slate-400 font-bold">دقت شناسایی سال</span>
          </div>
          <div className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <span className="text-xl font-black text-sky-300 block">۱۰</span>
            <span className="text-[9px] text-slate-400 font-bold">فراخوان فعال</span>
          </div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <p className="text-[11px] font-black text-amber-300 mb-1.5">🤝 دنبال هم‌بنیان‌گذار و همکار هستیم</p>
          <p className="text-[10px] text-slate-300 leading-relaxed mb-2.5">
            اگر توسعه‌دهنده، متخصص AI/NLP، مشاور تحصیلی یا علاقه‌مند به رشد محصول هستی، به تیم بپیوند.
          </p>
          <a
            href="mailto:soheil.power@gmail.com?subject=همکاری با استارتاپ ترنم همدلی&body=سلام، مایل به همکاری هستم.%0A%0Aتخصص من:%0Aسوابق:%0Aشماره تماس:"
            className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black transition-all"
          >
            📧 soheil.power@gmail.com
          </a>
          <span className="text-[9px] text-slate-400 font-bold block mt-2" dir="ltr">☎ +1-208-503-3653</span>
        </div>
      </div>

      {/* 🔗 جدول لینک‌های مستقیم ثبت‌نام — یک کلیک تا فرم */}
      <div className="bg-white rounded-[28px] border-2 border-indigo-200 shadow-sm overflow-hidden">
        <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-indigo-900 flex items-center gap-2">
            <ExternalLink size={16} /> لینک‌های مستقیم ثبت‌نام / Direct Apply Links
          </h3>
          <span className="text-[9px] font-bold text-indigo-400">مرتب بر اساس تناسب — کلیک = صفحه فرم</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[640px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 border-b border-slate-100">
                <th className="p-3">#</th>
                <th className="p-3">فراخوان / Call</th>
                <th className="p-3">تناسب</th>
                <th className="p-3">لینک ثبت‌نام / Apply URL</th>
                <th className="p-3">ثبت‌نام</th>
              </tr>
            </thead>
            <tbody>
              {[...CALLS].sort((a, b) => b.match - a.match).map((c, i) => (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-indigo-50/30 transition-colors">
                  <td className="p-3 text-[11px] font-black text-slate-400">{fa(i + 1)}</td>
                  <td className="p-3">
                    <span className="text-[11px] font-black text-slate-800 block">{c.name.split("—")[0].trim()}</span>
                    <span className="text-[9px] text-indigo-500 font-bold" dir="ltr">{c.nameEn}</span>
                  </td>
                  <td className="p-3">
                    <span className={`text-[11px] font-black px-2 py-1 rounded-full ${c.match >= 80 ? "bg-emerald-100 text-emerald-700" : c.match >= 60 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                      {fa(c.match)}٪
                    </span>
                  </td>
                  <td className="p-3">
                    <a href={c.applyLink} target="_blank" rel="noopener noreferrer"
                       className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline font-mono break-all"
                       dir="ltr">
                      {c.applyLink.replace(/^https?:\/\//, "")}
                    </a>
                  </td>
                  <td className="p-3">
                    <a href={c.applyLink} target="_blank" rel="noopener noreferrer"
                       className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black transition-all whitespace-nowrap">
                      <Rocket size={12} /> ثبت‌نام
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* هشدار روزهای آخر */}
      {urgent.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-rose-700 mb-1">⏰ روزهای آخر — اقدام فوری</p>
            <ul className="text-xs text-rose-600 font-bold space-y-1">
              {urgent.map(c => (
                <li key={c.id}>
                  {c.name}: فقط <span className="text-base font-black">{fa(daysLeft(c.deadline)!)}</span> روز مانده ({c.deadlineNote})
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* جدول اصلی */}
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 border-b border-slate-100">
                <th className="p-3">فراخوان / Call</th>
                <th className="p-3">تناسب / Match</th>
                <th className="p-3"><DollarSign size={12} className="inline ml-1" />مبلغ / Amount</th>
                <th className="p-3"><Calendar size={12} className="inline ml-1" />ددلاین / Deadline</th>
                <th className="p-3">روز مانده / Days left</th>
                <th className="p-3"><Clock size={12} className="inline ml-1" />زمان پاسخ / Answer time</th>
                <th className="p-3">وضعیت / Status</th>
                <th className="p-3">لینک / Apply</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => {
                const d = daysLeft(c.deadline);
                const st = statuses[c.id] || "notStarted";
                const S = STATUS_META[st];
                const isOpen = expanded === c.id;
                const lastDays = d !== null && d >= 0 && d <= 21;
                return (
                  <React.Fragment key={c.id}>
                    <tr className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${lastDays ? "bg-rose-50/40" : ""}`}>
                      <td className="p-3">
                        <button
                          onClick={() => setExpanded(isOpen ? null : c.id)}
                          className="text-right min-h-[40px] flex items-center gap-1.5 group"
                        >
                          {isOpen ? <ChevronUp size={14} className="text-indigo-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-400 shrink-0" />}
                          <div>
                            <span className="text-[11px] font-black text-slate-800 group-hover:text-indigo-700 block">{c.name}</span>
                            <span className="text-[9px] text-indigo-500 font-bold block" dir="ltr" style={{ textAlign: "right" }}>{c.nameEn}</span>
                            <span className="text-[9px] text-slate-400 font-bold">{c.funder}</span>
                          </div>
                        </button>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col items-center gap-1 min-w-[64px]">
                          <span className={`text-[12px] font-black ${c.match >= 80 ? "text-emerald-600" : c.match >= 60 ? "text-amber-600" : "text-slate-500"}`}>{fa(c.match)}٪</span>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${c.match >= 80 ? "bg-emerald-500" : c.match >= 60 ? "bg-amber-500" : "bg-slate-400"}`} style={{ width: `${c.match}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-[10px] font-bold text-emerald-700">{c.amount}</td>
                      <td className="p-3 text-[10px] font-bold text-slate-600">{c.deadlineNote}</td>
                      <td className="p-3">
                        {d === null ? (
                          <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-2 py-1 rounded-full">دائمی</span>
                        ) : d < 0 ? (
                          <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-full">گذشت</span>
                        ) : (
                          <span className={`text-[11px] font-black px-2 py-1 rounded-full ${lastDays ? "text-rose-700 bg-rose-100 animate-pulse" : "text-indigo-700 bg-indigo-50"}`}>
                            {fa(d)} روز
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] font-bold text-slate-700 block">{c.answerTime}</span>
                        <span className="text-[9px] text-slate-400 font-bold">میانگین بررسی: {c.avgResponseDays}</span>
                      </td>
                      <td className="p-3">
                        <select
                          value={st}
                          onChange={(e) => setStatus(c.id, e.target.value as CallStatus)}
                          className={`text-[10px] font-black rounded-xl px-2 py-2 border-0 cursor-pointer min-h-[36px] ${S.cls}`}
                        >
                          {(Object.keys(STATUS_META) as CallStatus[]).map(k => (
                            <option key={k} value={k}>{STATUS_META[k].label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={reminderMailto(c)}
                            className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 transition-all"
                            title={`ارسال ایمیل یادآوری به ${APPLICANT_EMAIL}`}
                          >
                            <BellRing size={14} />
                          </a>
                          <a
                            href={c.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[36px] inline-flex items-center gap-1 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 transition-all text-[9px] font-black"
                            title={c.link}
                          >
                            <ExternalLink size={12} />
                            <span dir="ltr">{c.link.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 22)}</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-slate-50/70 border-b border-slate-100">
                        <td colSpan={8} className="p-4">
                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <h5 className="text-[11px] font-black text-slate-700 mb-2">📋 فیلدهای فرم درخواست:</h5>
                              <ul className="space-y-1">
                                {c.formFields.map((f, i) => (
                                  <li key={i} className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" /> {f}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-slate-600">
                                <span className="text-slate-400">چرا مرتبط:</span> {c.fit}
                              </p>
                              <p className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                                <Mail size={11} className="text-indigo-500" />
                                <span className="text-slate-400">ایمیل فراخوان:</span>
                                <span className="font-mono" dir="ltr">{c.contactEmail}</span>
                              </p>
                              <a
                                href={reminderMailto(c)}
                                className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black transition-all"
                              >
                                <Send size={12} /> ارسال جزئیات کامل به ایمیل من
                              </a>
                            </div>
                          </div>
                          <FilledFormPanel callId={c.id} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-slate-400 font-bold text-center">
        💡 دکمه زنگوله، ایمیل یادآوری از پیش پرشده (با تمام جزئیات و فیلدهای فرم) برای {APPLICANT_EMAIL} باز می‌کند. وضعیت‌ها به‌صورت خودکار ذخیره می‌شوند.
      </p>
    </div>
  );
}
