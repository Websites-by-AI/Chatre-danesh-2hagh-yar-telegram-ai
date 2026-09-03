import { useState } from "react";
import {
  FlaskConical, Gauge, ShieldCheck, AlertTriangle, CheckCircle2, XCircle,
  Database, Users, Clock, Activity, Bug, ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";

/* ============================================================
 * بخش توسعه و تست — گزارش تست‌های مرزی، استرس و امنیت
 * Development & Testing dashboard: documents edge-case, stress
 * and security test results + known issues, for the dev/admin team.
 * ============================================================ */

interface TestCase {
  name: string;
  category: "امنیت" | "مرزی" | "استرس" | "کارایی" | "داده";
  status: "pass" | "fail" | "warn";
  detail: string;
}

interface KnownIssue {
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  suggestion: string;
}

const TEST_CASES: TestCase[] = [
  // امنیت
  { name: "دسترسی دانش‌آموز A به داده B", category: "امنیت", status: "pass", detail: "گزارش/پیشرفت/برنامه دانش‌آموز دیگر → 403 (مسدود)" },
  { name: "دسترسی بدون ورود (anonymous)", category: "امنیت", status: "pass", detail: "همه endpoint های حساس → 401" },
  { name: "مشاور نمی‌تواند به‌جای دانش‌آموز تیک بزند", category: "امنیت", status: "pass", detail: "POST task-progress توسط مشاور → 403" },
  { name: "نشت کد OTP در production", category: "امنیت", status: "pass", detail: "otp-send → 503 بدون بازگرداندن کد" },
  { name: "محدودیت نرخ (rate limit) ورود", category: "امنیت", status: "fail", detail: "۲۰ تلاش ورود غلط پشت سر هم → همه 401، بدون قفل/تأخیر" },
  // مرزی
  { name: "ایمیل/موبایل تکراری", category: "مرزی", status: "pass", detail: "ثبت‌نام دوم با همان موبایل → خطای 'قبلاً ثبت شده'" },
  { name: "نام خالی", category: "مرزی", status: "pass", detail: "→ 400 'نام الزامی است'" },
  { name: "رمز کوتاه (<۶)", category: "مرزی", status: "pass", detail: "→ 400 'حداقل ۶ کاراکتر'" },
  { name: "JSON خراب (malformed)", category: "مرزی", status: "pass", detail: "بدون کرش، خطای گرافیکی برگشت" },
  { name: "گزارش خیلی طولانی (۵۰۰۰ کاراکتر)", category: "مرزی", status: "pass", detail: "→ 400 'Report text is too long'" },
  { name: "گزارش خالی", category: "مرزی", status: "pass", detail: "→ 400 'Report text is required'" },
  { name: "متن فارسی + ایموجی + کاراکتر خاص + <script>", category: "مرزی", status: "pass", detail: "ذخیره شد؛ React خروجی را escape می‌کند (بدون XSS)" },
  { name: "study-plan بدون schedule", category: "مرزی", status: "pass", detail: "ساختار نامعتبر → رد می‌شود" },
  { name: "studentId خیلی طولانی (۲۰۰ کاراکتر)", category: "مرزی", status: "pass", detail: "محدودیت ۱۲۸ کاراکتر در سمت سرور" },
  // استرس
  { name: "ثبت‌نام انبوه ۱۰۰ کاربر", category: "استرس", status: "pass", detail: "۱۰۰/۱۰۰ موفق، بدون خطا یا افت" },
  { name: "۳۰۰۰ رکورد گزارش", category: "استرس", status: "pass", detail: "پاسخ GET در ۰.۱۱–۰.۲۶ ثانیه، بدون hang" },
  // کارایی
  { name: "لیست کاربران (auth/list با ۱۰۷ کاربر)", category: "کارایی", status: "pass", detail: "۰.۲۰ ثانیه پاسخ" },
  { name: "سقف بازگشت گزارش (LIMIT)", category: "کارایی", status: "pass", detail: "حداکثر ۱۰۰ رکورد برمی‌گردد" },
  // داده
  { name: "ماندگاری داده در D1", category: "داده", status: "pass", detail: "گزارش و تیک واقعاً در جداول daily_reports و task_progress ذخیره شد" },
  { name: "همگام‌سازی مشاور → دانش‌آموز", category: "داده", status: "pass", detail: "برنامه مشاور توسط دانش‌آموز از D1 خوانده شد" },
  { name: "همگام‌سازی دانش‌آموز → مشاور", category: "داده", status: "pass", detail: "تیک و گزارش دانش‌آموز توسط مشاور از D1 خوانده شد" },
];

const KNOWN_ISSUES: KnownIssue[] = [
  {
    severity: "high",
    title: "نبود محدودیت نرخ (Rate Limiting) روی ورود و OTP",
    description: "مهاجم می‌تواند بدون محدودیت رمز عبور را حدس بزند (brute-force). ۲۰ تلاش اشتباه پشت سر هم هیچ قفل یا تأخیری ایجاد نکرد.",
    suggestion: "افزودن rate limit در سطح Cloudflare (WAF) و لایه اپلیکیشن + شمارنده تلاش و قفل موقت حساب.",
  },
  {
    severity: "high",
    title: "auth/list بدون صفحه‌بندی (Pagination)",
    description: "لیست کاربران همه رکوردها را یک‌جا برمی‌گرداند (بدون limit/offset). با رشد به چند هزار کاربر، پاسخ سنگین می‌شود و اطلاعات زیادی یک‌جا لو می‌رود.",
    suggestion: "افزودن pagination (limit/offset یا cursor) و فقط فیلدهای ضروری برای UI.",
  },
  {
    severity: "medium",
    title: "کاربرهای دمو در دیتابیس نیستند",
    description: "داوطلبان پیش‌فرض (id=1,2,3) در D1 ثبت نشده‌اند. در حالت دمو، برنامه فقط در localStorage همان مرورگر می‌ماند و مشاور نمی‌تواند برای آن‌ها برنامه D1 بفرستد.",
    suggestion: "ثبت کاربرهای دمو به‌عنوان کاربر واقعی D1، یا ساخت یک کاربر آزمایشی واقعی برای نمایش.",
  },
  {
    severity: "medium",
    title: "پرداخت زرین‌پال در حالت MOCK",
    description: "درگاه پرداخت هنوز با شناسه واقعی زرین‌پال متصل نشده (MOCK_AUTHORITY).",
    suggestion: "اتصال ZARINPAL_MERCHANT_ID واقعی و تست پرداخت حقیقی قبل از راه‌اندازی فروش.",
  },
  {
    severity: "low",
    title: "OTP بدون درگاه پیامک واقعی",
    description: "تا وقتی SMS provider (کاوه‌نگار و...) متصل نشود، OTP در production غیرفعال است (503) و فقط ورود با رمز کار می‌کند.",
    suggestion: "اتصال درگاه پیامک + هش کردن کد OTP + یکبارمصرف بودن.",
  },
];

const CATEGORY_COLORS: Record<TestCase["category"], string> = {
  امنیت: "bg-rose-50 text-rose-700 border-rose-200",
  مرزی: "bg-amber-50 text-amber-700 border-amber-200",
  استرس: "bg-violet-50 text-violet-700 border-violet-200",
  کارایی: "bg-sky-50 text-sky-700 border-sky-200",
  داده: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const SEVERITY_META: Record<KnownIssue["severity"], { label: string; color: string }> = {
  critical: { label: "بحرانی", color: "bg-rose-600 text-white" },
  high: { label: "زیاد", color: "bg-rose-100 text-rose-700 border border-rose-300" },
  medium: { label: "متوسط", color: "bg-amber-100 text-amber-700 border border-amber-300" },
  low: { label: "کم", color: "bg-slate-100 text-slate-600 border border-slate-300" },
};

export default function DevTestingSection() {
  const [showIssues, setShowIssues] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("همه");

  const filtered = categoryFilter === "همه"
    ? TEST_CASES
    : TEST_CASES.filter(t => t.category === categoryFilter);

  const passCount = TEST_CASES.filter(t => t.status === "pass").length;
  const failCount = TEST_CASES.filter(t => t.status === "fail").length;
  const warnCount = TEST_CASES.filter(t => t.status === "warn").length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-72 h-72 bg-indigo-500/10 rounded-full blur-[70px]" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/15">
            <FlaskConical size={28} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-black">بخش توسعه و تست سامانه</h2>
            <p className="text-xs text-slate-300 mt-1">
              نتایج تست‌های مرزی، استرس، امنیت و کارایی + مشکلات شناخته‌شده برای تیم توسعه.
            </p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <CheckCircle2 size={22} className="text-emerald-600 mx-auto mb-2" />
          <span className="text-2xl font-black text-emerald-700 block">{passCount}</span>
          <span className="text-[10px] font-black text-slate-500">تست موفق</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <XCircle size={22} className="text-rose-600 mx-auto mb-2" />
          <span className="text-2xl font-black text-rose-700 block">{failCount}</span>
          <span className="text-[10px] font-black text-slate-500">تست ناموفق</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <AlertTriangle size={22} className="text-amber-600 mx-auto mb-2" />
          <span className="text-2xl font-black text-amber-700 block">{warnCount}</span>
          <span className="text-[10px] font-black text-slate-500">هشدار</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-center">
          <Bug size={22} className="text-indigo-600 mx-auto mb-2" />
          <span className="text-2xl font-black text-indigo-700 block">{KNOWN_ISSUES.length}</span>
          <span className="text-[10px] font-black text-slate-500">مشکل شناخته‌شده</span>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {["همه", "امنیت", "مرزی", "استرس", "کارایی", "داده"].map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-4 py-2 rounded-xl text-[11px] font-black border transition cursor-pointer ${
              categoryFilter === cat
                ? "bg-indigo-950 text-white border-indigo-950"
                : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Test cases table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-2">
          <Gauge size={16} className="text-indigo-600" />
          <h3 className="text-sm font-black text-slate-800">نتایج تست‌های اجرا شده ({filtered.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px]">
                <th className="px-4 py-2.5 font-black">وضعیت</th>
                <th className="px-4 py-2.5 font-black">دسته</th>
                <th className="px-4 py-2.5 font-black">تست</th>
                <th className="px-4 py-2.5 font-black">نتیجه</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-2.5">
                    {t.status === "pass" ? (
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    ) : t.status === "fail" ? (
                      <XCircle size={16} className="text-rose-500" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-500" />
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[t.category]}`}>
                      {t.category}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-black text-slate-700">{t.name}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-[11px]">{t.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Known issues */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowIssues(!showIssues)}
          className="w-full p-5 border-b border-slate-100 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Bug size={16} className="text-rose-500" />
            <h3 className="text-sm font-black text-slate-800">مشکلات و محدودیت‌های شناخته‌شده ({KNOWN_ISSUES.length})</h3>
          </div>
          {showIssues ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </button>
        {showIssues && (
          <div className="p-5 space-y-3">
            {KNOWN_ISSUES.map((issue, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-start gap-3">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${SEVERITY_META[issue.severity].color}`}>
                    {SEVERITY_META[issue.severity].label}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-800 mb-1">{issue.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{issue.description}</p>
                    <p className="text-[11px] text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2 border border-indigo-100 font-bold">
                      💡 راهکار: {issue.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance metrics */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-emerald-600" />
          <h3 className="text-sm font-black text-slate-800">شاخص‌های کارایی (اندازه‌گیری شده)</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "ثبت‌نام ۱۰۰ کاربر", value: "۱۰۰٪ موفق", icon: Users },
            { label: "لیست ۱۰۷ کاربر", value: "۰.۲۰ ثانیه", icon: Database },
            { label: "۳۰۰۰ گزارش", value: "۰.۱۱–۰.۲۶ ثانیه", icon: Clock },
            { label: "سقف بازگشت گزارش", value: "۱۰۰ رکورد", icon: RefreshCw },
          ].map((m, i) => (
            <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <m.icon size={18} className="text-indigo-500 mx-auto mb-2" />
              <span className="text-sm font-black text-slate-800 block font-mono" dir="ltr">{m.value}</span>
              <span className="text-[10px] font-black text-slate-500">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-slate-400 text-center leading-relaxed">
        این گزارش در تاریخ ۱۴ مرداد ۱۴۰۵ روی نسخه v3 (تولید) اجرا و اندازه‌گیری شده است.
        داده‌های تست پس از اجرا از دیتابیس پاک شده‌اند.
      </p>
    </div>
  );
}
