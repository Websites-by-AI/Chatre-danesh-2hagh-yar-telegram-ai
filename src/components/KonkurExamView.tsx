import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Student } from "../types";
import { ExternalLink, FileQuestion, LibraryBig, NotebookPen } from "lucide-react";

/**
 * KonkurExamView — بانک سؤالات و شبیه‌ساز کنکور
 *
 * هر ابزار RAG آدرس اختصاصی خودش را دارد:
 *   /konkur            → (پیش‌فرض) آزمون تمرینی
 *   /konkur/practice   → آزمون تمرینی
 *   /konkur/bank       → بانک سؤالات
 *   /konkur/identifier → شناسایی سؤال
 *
 * ابزارها داخل سایت (با iframe) جاسازی می‌شوند تا دانش‌آموز بدون خروج تمرین کند.
 * منبع داده‌ها: sosa123454321/taranom-exam-rag (Space ایستا روی Hugging Face).
 */

const EXAM_RAG_BASE = "https://sosa123454321-taranom-exam-rag.static.hf.space";

type ToolId = "practice" | "bank" | "identifier";

interface Tool {
  id: ToolId;
  label: string;
  short: string;
  desc: string;
  icon: typeof NotebookPen;
  path: string;
}

const TOOLS: Tool[] = [
  {
    id: "practice",
    label: "آزمون تمرینی",
    short: "تمرین",
    desc: "رشته و درس را انتخاب کن، سؤال‌ها را پاسخ بده و پاسخ صحیح + سال + سختی + نوع هر سؤال را ببین.",
    icon: NotebookPen,
    path: "/practice.html",
  },
  {
    id: "bank",
    label: "بانک سؤالات",
    short: "بانک",
    desc: "همهٔ سؤالات بانک را بر اساس درس و سال کنکور مرور کن.",
    icon: LibraryBig,
    path: "/bank.html",
  },
  {
    id: "identifier",
    label: "شناسایی سؤال",
    short: "شناساگر",
    desc: "متن یک سؤال را بچسبان تا هوش مصنوعی رشته / درس / سال احتمالی آن را پیدا کند.",
    icon: FileQuestion,
    path: "/index.html",
  },
];

export default function KonkurExamView({ student }: { student?: Student }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [iframeLoaded, setIframeLoaded] = useState(false);

  // ابزار از روی آدرس انتخاب می‌شود: /konkur/practice → "practice"
  const segment = (location.pathname.split("/")[2] || "").toLowerCase();
  const tool: ToolId = TOOLS.find((t) => t.id === segment)?.id ?? "practice";
  const active = TOOLS.find((t) => t.id === tool)!;
  const activeUrl = EXAM_RAG_BASE + active.path;
  const ActiveIcon = active.icon;

  const goTo = (id: ToolId) => navigate(`/konkur/${id}`);

  // با تعویض ابزار، قاب دوباره لود شود
  useEffect(() => {
    setIframeLoaded(false);
  }, [tool]);

  return (
    <div className="RTL max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6" style={{ direction: "rtl" }}>
      {/* سربرگ */}
      <div className="bg-gradient-to-l from-amber-500 to-orange-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-amber-500/20">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🗂️</span>
              <h1 className="text-2xl sm:text-3xl font-black">بانک سؤالات و شبیه‌ساز کنکور</h1>
            </div>
            <p className="text-amber-50/95 text-sm sm:text-base leading-relaxed max-w-2xl">
              {student?.name ? `سلام ${student.name.split(" ")[0]}! ` : ""}
              مستقیماً داخل سایت تمرین کن: سؤال را پاسخ بده، بانک سؤالات را مرور کن یا
              سؤال ناشناخته را شناسایی کن. این ابزار روی موتور جستجوی هوشمند RAG کار می‌کند.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge value="۶۲" label="سؤال" />
            <Badge value="۳" label="رشته" />
            <Badge value="۲۰" label="سال" />
          </div>
        </div>
      </div>

      {/* انتخاب ابزار (هر کدام آدرس جدا دارد) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const isActive = t.id === tool;
          return (
            <button
              key={t.id}
              onClick={() => goTo(t.id)}
              className={`text-right rounded-2xl p-4 border-2 transition-all duration-200 ${
                isActive
                  ? "border-amber-500 bg-amber-50 shadow-md shadow-amber-500/10"
                  : "border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className={`font-black text-sm ${isActive ? "text-amber-700" : "text-slate-800"}`}>{t.label}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">{t.desc}</p>
              <p className="mt-1.5 text-[10px] text-slate-300 font-mono truncate" dir="ltr">/konkur/{t.id}</p>
            </button>
          );
        })}
      </div>

      {/* قاب جاسازی ابزار */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <ActiveIcon className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <div className="font-black text-sm text-slate-800 truncate">{active.label}</div>
              <div className="text-[10px] text-slate-400 truncate font-mono" dir="ltr">{activeUrl}</div>
            </div>
          </div>
          <a
            href={activeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 transition-colors px-3 py-2 rounded-xl"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            باز کردن تمام‌صفحه
          </a>
        </div>

        <div className="relative bg-slate-50">
          {!iframeLoaded && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 z-10">
              <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold">در حال بارگذاری {active.label}…</span>
            </div>
          )}
          <iframe
            key={tool}
            src={activeUrl}
            title={`ترنم مهر | ${active.label}`}
            onLoad={() => setIframeLoaded(true)}
            className="w-full h-[78vh] min-h-[560px] block"
            loading="lazy"
          />
        </div>
      </div>

      {/* 🏛 منابع رسمی و راستی‌آزمایی */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-xs text-emerald-900 leading-relaxed">
        <p className="font-black mb-2">🏛 منابع رسمی — خودتان راستی‌آزمایی کنید</p>
        <ul className="list-disc pr-5 space-y-1.5">
          <li>
            سوالات بانک از <b>دفترچه‌های رسمی کنکور سراسری ۱۳۹۸ تا ۱۴۰۴</b> استخراج شده‌اند؛ آرشیو کامل PDF دفترچه‌ها:{" "}
            <a href="https://sosa123454321-taranom-exam-rag.static.hf.space/pdfs/manifest.json" target="_blank" rel="noreferrer" className="underline font-bold">۲۱ دفترچه رسمی (دانلود مستقیم)</a>
          </li>
          <li>
            مرجع اصلی انتشار سوالات و کلید: <a href="https://www.sanjesh.org" target="_blank" rel="noreferrer" className="underline font-bold">سازمان سنجش آموزش کشور (sanjesh.org)</a>
            {" "}— بخش «دفترچه سوالات و کلید آزمون سراسری»
          </li>
          <li>
            🤖 <b>راستی‌آزمایی با هوش مصنوعی:</b> کلید <b>۱۰۰٪ سوالات بانک (۳۸۳ سوال)</b> با مدل Llama-3.3-70B دو مرحله‌ای (پاسخ سریع + حل با استدلال) بررسی شده؛ سوالاتی که کلیدشان محل اختلاف بود (۱۰۱ مورد) از چرخه تست خارج شده‌اند تا بازبینی انسانی شوند و فقط ۲۸۲ سوالِ دوبار-تاییدشده سرو می‌شود —{" "}
            <a href="https://sosa123454321-taranom-exam-rag.static.hf.space/data/suspect-keys.json" target="_blank" rel="noreferrer" className="underline font-bold">گزارش عمومی موارد مشکوک</a>
          </li>
          <li>زیر هر تصحیح در ربات تلگرام، سال و رشته دفترچه + دکمه «📄 دفترچه رسمی PDF» نمایش داده می‌شود تا هر سوال قابل ردیابی باشد.</li>
        </ul>
      </div>

      {/* یادداشت صادقانه دربارهٔ محدودیت‌ها */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-800 leading-relaxed">
        <p className="font-black mb-1">ℹ️ چند نکتهٔ مهم</p>
        <ul className="list-disc pr-5 space-y-1">
          <li>شناسایی سؤال، بانک و آزمون تمرینی کاملاً داخل همین سایت کار می‌کنند و به اینترنت نیاز دارند.</li>
          <li>
            دکمهٔ «تحلیل هوش مصنوعی» داخل آزمون، اکنون با مدل Llama (Hugging Face) به‌صورت زنده کار می‌کند.
          </li>
          <li>سؤالات بانک نمونهٔ ساختاریافتهٔ کنکور هستند؛ برای افزودن سؤال بیشتر از ابزار Import داخل بانک استفاده کنید.</li>
        </ul>
      </div>
    </div>
  );
}

function Badge({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 text-center min-w-[64px]">
      <div className="text-xl font-black leading-none">{value}</div>
      <div className="text-[10px] text-amber-50/90 mt-1">{label}</div>
    </div>
  );
}
