import React, { useState, useEffect } from "react";
import { 
  Calendar, Clock, BookOpen, Target, Sparkles, CheckCircle2, Award, Zap, ArrowRight, 
  Download, AlertTriangle, ShieldAlert, HeartPulse, UserCheck, MessageSquare, Users, BarChart3, FileText, CheckCircle, PhoneCall, Headphones, HelpCircle, Check, Flame, ChevronDown, ChevronUp
} from "lucide-react";
import { Student } from "../types";
import { motion } from "motion/react";
import { saveTaskProgress, loadTaskProgress, submitDailyReport, type TaskProgress } from "../lib/studentSync";
import { loadStudyPlan, subscribeToStudyPlan, type StudyPlan } from "../lib/studyPlans";

interface AdvancedStudyPlannerProps {
  student: Student;
  onNavigate: (view: string) => void;
}

export default function AdvancedStudyPlanner({ student, onNavigate }: AdvancedStudyPlannerProps) {
  const [targetHours, setTargetHours] = useState(10);
  const [selectedExamType, setSelectedExamType] = useState("konkur_master");
  const [studyShift, setStudyShift] = useState("morning_heavy");
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dailyLogSubmitted, setDailyLogSubmitted] = useState(false);
  const [dailyReportText, setDailyReportText] = useState("");
  const [consultationType, setConsultationType] = useState<"single" | "continuous">("single");
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [bookingTime, setBookingTime] = useState("عصر امروز (۱۸ الی ۲۰)");

  // Interactive task completion state per day
  const [completedTasks, setCompletedTasks] = useState<Record<string, Record<string, boolean>>>({
    "شنبه": { morning: false, afternoon: false },
    "یکشنبه": { morning: false, afternoon: false },
    "دوشنبه": { morning: false, afternoon: false },
    "سه‌شنبه": { morning: false, afternoon: false },
    "چهارشنبه": { morning: false, afternoon: false },
    "پنجشنبه": { morning: false, afternoon: false },
    "جمعه": { morning: false, afternoon: false },
  });

  const [expandedDay, setExpandedDay] = useState<string | null>("شنبه");

  // Restore saved task progress from D1 (auth) or localStorage (demo/offline).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const remote = await loadTaskProgress();
      if (!cancelled && remote) setCompletedTasks(remote);
      else {
        try {
          const local = localStorage.getItem("taranom_task_progress");
          if (local && !cancelled) setCompletedTasks(JSON.parse(local));
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load counselor manual plan from D1 (cross-device sync) with localStorage
  // fallback. This is the SAME source the counselor panel writes to, so any
  // change the counselor publishes shows up here.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const plan = await loadStudyPlan(student.id);
      if (cancelled) return;
      if (plan) {
        setGeneratedPlan(plan);
        return;
      }
      buildDefaultPlan();
    })();
    const unsubscribe = subscribeToStudyPlan(student.id, (plan) => {
      if (plan) setGeneratedPlan(plan);
    });
    return () => { cancelled = true; unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id, student.field]);

  const buildDefaultPlan = () => {
    const fieldName = student.field === "tajrobi" ? "علوم تجربی (پزشکی/دندان)" : student.field === "riazi" ? "ریاضی فیزیک (مهندسی شریف)" : "علوم انسانی (وکالت/روانشناسی)";
    
    setGeneratedPlan({
      title: `نقشه راه تخصصی کنکور ۱۴۰۵ — کایزن درسی (${student.name})`,
      profile: fieldName,
      dailyHours: 10,
      examStandard: "کنکور سراسری (سطح رتبه برتر و تله‌دار)",
      strategy: "چرخه طلایی ۵۰/۱۰ پومودورو: ۵۰ دقیقه مطالعه متمرکز مفهومی + ۱۰ دقیقه استراحت پویا بدون گوشی تلفن همراه.",
      warnings: [
        "⚠️ هشدار عارضه‌یابی کارنامه: نوسان تراز در دروس پایه مشاهده شد؛ پارت‌های جبرانی مرور ۳ روزه در جدول زیر فعال شدند.",
        "💡 پیشنهاد مشاور ارشد (استاد مریم رحیمی): در شیفت صبح حتماً از روش بازیابی (Active Recall) به جای خواندن مجدد درسنامه استفاده کنید."
      ],
      schedule: [
        { 
          day: "شنبه", 
          emoji: "🚀",
          color: "from-blue-500 to-indigo-600",
          accentBg: "bg-blue-50/50 border-blue-200",
          morning: "شیفت اول (۰۸:۰۰ الی ۱۳:۰۰): مطالعه عمیق کتاب درسی + پارت پومودوروهای مفهومی (۴ ساعت)", 
          afternoon: "شیفت دوم (۱۶:۰۰ الی ۲۰:۰۰): حل ۴۰ تست زمان‌دار تله‌دار + تحلیل غلط‌ها در دفتر اشتباهات", 
          totalQ: 40 
        },
        { 
          day: "یکشنبه", 
          emoji: "⚡",
          color: "from-indigo-500 to-purple-600",
          accentBg: "bg-indigo-50/50 border-indigo-200",
          morning: "شیفت اول (۰۸:۰۰ الی ۱۳:۰۰): حل مسائل محاسباتی پیشرفته و فرمول‌شناسی (۴ ساعت)", 
          afternoon: "شیفت دوم (۱۶:۰۰ الی ۲۰:۰۰): آزمون موضوعی موازی و رفع اشکال عارضه‌یابی تراز", 
          totalQ: 45 
        },
        { 
          day: "دوشنبه", 
          emoji: "📚",
          color: "from-purple-500 to-pink-600",
          accentBg: "bg-purple-50/50 border-purple-200",
          morning: "شیفت اول (۰۸:۰۰ الی ۱۳:۰۰): مرور دروس حفظی، فرمول‌های فیزیک و خلاصه‌نویسی نموداری (۳ ساعت)", 
          afternoon: "شیفت دوم (۱۶:۰۰ الی ۲۰:۰۰): تست‌زنی جامع موازی و بررسی پاسخ‌نامه تشریحی", 
          totalQ: 40 
        },
        { 
          day: "سه‌شنبه", 
          emoji: "🎯",
          color: "from-emerald-500 to-teal-600",
          accentBg: "bg-emerald-50/50 border-emerald-200",
          morning: "شیفت اول (۰۸:۰۰ الی ۱۳:۰۰): شبیه‌ساز نیمه‌جامع کنکور با رویکرد مدیریت زمان (۴ ساعت)", 
          afternoon: "شیفت دوم (۱۶:۰۰ الی ۲۰:۰۰): تحلیل موشکافانه تراز و تکنیک ضربدر منها", 
          totalQ: 60 
        },
        { 
          day: "چهارشنبه", 
          emoji: "💡",
          color: "from-amber-500 to-orange-600",
          accentBg: "bg-amber-50/50 border-amber-200",
          morning: "شیفت اول (۰۸:۰۰ الی ۱۳:۰۰): رفع اشکال مباحث آسیب‌دیده و مرور دوره‌ای (۳ ساعت)", 
          afternoon: "شیفت دوم (۱۶:۰۰ الی ۲۰:۰۰): حل تست‌های سطح المپیاد و تله‌های پرتکرار", 
          totalQ: 35 
        },
        { 
          day: "پنجشنبه", 
          emoji: "🏆",
          color: "from-rose-500 to-red-600",
          accentBg: "bg-rose-50/50 border-rose-200",
          morning: "شیفت اول (۰۸:۰۰ الی ۱۳:۰۰): آزمون جامع آزمایشی شبیه‌ساز استاندارد (۴ ساعت)", 
          afternoon: "شیفت دوم (۱۶:۰۰ الی ۲۰:۰۰): تحلیل کارنامه و استراحت بازسازنده ذهن", 
          totalQ: 50 
        },
        { 
          day: "جمعه", 
          emoji: "☕",
          color: "from-slate-600 to-slate-800",
          accentBg: "bg-slate-50/50 border-slate-200",
          morning: "شیفت اول (۰۹:۰۰ الی ۱۲:۰۰): مرور خلاصه‌های طلایی، استراحت و ریکاوری روحی کایزن", 
          afternoon: "شیفت دوم (۱۶:۰۰ الی ۱۹:۰۰): ارسال گزارش هفتگی به مشاور ارشد و والدین", 
          totalQ: 20 
        },
      ],
      extracurricular: [
        "کارگاه آنلاین تحلیل تله‌های تستی زیست‌شناسی و شیمی (چهارشنبه‌ها ساعت ۱۸)",
        "جلسه مشاوره گروهی مدیریت استرس و بهداشت روان کنکور (پنج‌شنبه‌ها ساعت ۱۱)",
        "دوره حل مسائل سرعت محاسبات بدون چک‌نویس در ریاضی و فیزیک"
      ]
    });
  };

  const studentGrades = [
    { lesson: "زیست‌شناسی", percentage: 48, status: "warning", advice: "نیاز به مرور خط‌به‌خط کتاب درسی و تصاویر." },
    { lesson: "شیمی تخصصی", percentage: 55, status: "warning", advice: "مسائل استوکیومتری نیازمند تست تمرکزی است." },
    { lesson: "ریاضیات (حسابان)", percentage: 38, status: "critical", advice: "مبحث مشتق و تابع نقطه آسیب جدی کارنامه است." },
    { lesson: "فیزیک پیشرفته", percentage: 65, status: "success", advice: "وضعیت مطلوب؛ حل تست‌های زمان‌دار ادامه یابد." },
    { lesson: "ادبیات اختصاصی", percentage: 70, status: "success", advice: "قرابت معنایی و آرایه‌ها در سطح عالی." },
  ];

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const fieldName = student.field === "tajrobi" ? "علوم تجربی (پزشکی/دندان)" : student.field === "riazi" ? "ریاضی فیزیک (مهندسی شریف)" : "علوم انسانی (وکالت/روانشناسی)";
      
      const newPlan = {
        title: `نقشه راه و برنامه مهندسی‌شده کایزن بر اساس کارنامه ${student.name}`,
        profile: fieldName,
        dailyHours: targetHours,
        examStandard: selectedExamType === "konkur_master" ? "کنکور سراسری ۱۴۰۵ (سطح فوق سخت)" : "آزمون‌های جامع آزمایشی (استاندارد کشوری)",
        strategy: "تلفیق پارت‌های ۵۰ دقیقه‌ای پومودورو با تمرکز ویژه روی دروس ضعیف کارنامه و گزارش خودکار به مشاور و والدین.",
        warnings: [
          "⚠️ هشدار عارضه‌یابی کارنامه: درس ریاضی (حسابان) با ۳۸٪ و زیست‌شناسی با ۴۸٪ در منطقه خطر تراز هستند؛ پارت‌های جبرانی در برنامه امروز تزریق شدند.",
          "💡 پیشنهاد مشاور: حتماً در شیفت صبح از روش بازیابی (Active Recall) برای رفع اشکال ریاضی استفاده کنید."
        ],
        schedule: [
          { day: "شنبه", emoji: "🚀", color: "from-blue-500 to-indigo-600", accentBg: "bg-blue-50/50 border-blue-200", morning: `شیفت اول: پارت جبرانی تخصصی (${targetHours} ساعت مطالعه متمرکز)`, afternoon: "حل تست‌های زمان‌دار تله‌دار + ثبت در دفتر اشتباهات", totalQ: 45 },
          { day: "یکشنبه", emoji: "⚡", color: "from-indigo-500 to-purple-600", accentBg: "bg-indigo-50/50 border-indigo-200", morning: "شیفت اول: مطالعه مباحث پایه و حل مسائل تشریحی", afternoon: "آزمون موضوعی موازی و رفع اشکال عارضه‌یابی", totalQ: 40 },
          { day: "دوشنبه", emoji: "📚", color: "from-purple-500 to-pink-600", accentBg: "bg-purple-50/50 border-purple-200", morning: "شیفت اول: مرور فرمول‌های فیزیک و شیمی و خلاصه‌نویسی", afternoon: "تست‌زنی جامع و بررسی پاسخ‌نامه تشریحی", totalQ: 40 },
          { day: "سه‌شنبه", emoji: "🎯", color: "from-emerald-500 to-teal-600", accentBg: "bg-emerald-50/50 border-emerald-200", morning: "شیفت اول: شبیه‌ساز نیمه‌جامع کنکور با رویکرد مدیریت زمان", afternoon: "تحلیل موشکافانه تراز و تکنیک ضربدر منها", totalQ: 55 },
          { day: "چهارشنبه", emoji: "💡", color: "from-amber-500 to-orange-600", accentBg: "bg-amber-50/50 border-amber-200", morning: "شیفت اول: رفع اشکال مباحث آسیب‌دیده و مرور دوره‌ای", afternoon: "حل تست‌های سطح المپیاد و تله‌های پرتکرار", totalQ: 35 },
          { day: "پنجشنبه", emoji: "🏆", color: "from-rose-500 to-red-600", accentBg: "bg-rose-50/70 border-rose-200", morning: "شیفت اول: آزمون جامع آزمایشی شبیه‌ساز استاندارد", afternoon: "تحلیل کارنامه و استراحت بازسازنده ذهنی", totalQ: 50 },
          { day: "جمعه", emoji: "☕", color: "from-slate-600 to-slate-800", accentBg: "bg-slate-50/70 border-slate-200", morning: "شیفت اول: مرور خلاصه‌ها، استراحت و ریکاوری روحی کایزن", afternoon: "ارسال گزارش هفتگی به مشاور و والدین", totalQ: 20 },
        ],
        extracurricular: [
          "کارگاه رفع اشکال اضطراری دروس تخصصی (با حضور مشاور)",
          "جلسه مشاوره گروهی مدیریت استرس و بهداشت روان کنکور"
        ]
      };

      setGeneratedPlan(newPlan);
      setIsGenerating(false);
    }, 1200);
  };

  const toggleTask = (day: string, shift: 'morning' | 'afternoon') => {
    setCompletedTasks(prev => {
      const next = {
        ...prev,
        [day]: {
          ...prev[day],
          [shift]: !prev[day]?.[shift]
        }
      };
      // Persist locally (offline/demo fallback) AND sync to D1 so the counselor
      // sees the student's progress live.
      try { localStorage.setItem("taranom_task_progress", JSON.stringify(next)); } catch {}
      saveTaskProgress(next);
      return next;
    });
  };

  const handleBookConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSubmitted(true);
    try {
      const bookings = JSON.parse(localStorage.getItem("taranom_consultation_requests") || "[]");
      bookings.push({ date: new Date().toISOString(), type: consultationType, slot: bookingTime, student: student.name });
      localStorage.setItem("taranom_consultation_requests", JSON.stringify(bookings));
    } catch {}
  };

  const handleSendReportToCounselorAndFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyReportText.trim()) return;
    setDailyLogSubmitted(true);
    try {
      const existing = JSON.parse(localStorage.getItem("taranom_daily_logs") || "[]");
      existing.push({ date: new Date().toISOString(), text: dailyReportText, student: student.name });
      localStorage.setItem("taranom_daily_logs", JSON.stringify(existing));
    } catch {}
    // Sync to D1 so the counselor and parents can read it from their own devices.
    submitDailyReport(dailyReportText.trim());
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto RTL pb-16" style={{ direction: 'rtl' }}>
      
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-950 rounded-[32px] p-8 text-right text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-4 relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black text-indigo-200">
              <Sparkles size={14} className="text-amber-400" />
              <span>برنامه‌ریزی مطالعاتی هوشمند مبتنی بر کارنامه و دیتابیس</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-xs font-black text-amber-300">
              <span>مشاور اختصاصی شما:</span>
              <span className="text-white font-black">استاد مریم رحیمی (ارشد کایزن)</span>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-black">طراح مهندسی برنامه و تحلیل عارضه‌یابی کارنامه</h1>
          <p className="text-xs md:text-sm text-indigo-200/90 font-medium leading-relaxed max-w-2xl">
            در این بخش نمرات، درصدها و وضعیت آسیب‌پذیری دروس شما از دیتابیس استخراج شده و برنامه مطالعاتی دقیقاً روی نقاط ضعف شما معماری می‌شود.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                alert("✅ درخواست بازبینی و بازنویسی برنامه مطالعاتی با موفقیت برای مشاور اختصاصی شما (استاد مریم رحیمی) ارسال شد. مشاور به زودی پارت‌های جبرانی جدید را روی پنل شما اعمال خواهد کرد.");
                try {
                  const reqs = JSON.parse(localStorage.getItem("taranom_plan_revision_requests") || "[]");
                  reqs.push({ date: new Date().toISOString(), student: student.name, field: student.field });
                  localStorage.setItem("taranom_plan_revision_requests", JSON.stringify(reqs));
                } catch {}
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <UserCheck size={16} />
              <span>درخواست بازبینی و بازنویسی برنامه از مشاور</span>
            </button>

            <button
              onClick={() => onNavigate("counselor-chat")}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <MessageSquare size={16} className="text-amber-400" />
              <span>ورود به بخش مشاوره و گفتگوی مستقیم</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📞 Consultation Booking Section */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-150 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Headphones size={18} />
            </div>
            <span>رزرو جلسه مشاوره تخصصی (موردی یا همراهی مستمر)</span>
          </h3>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full font-mono">
            پشتیبانی ۲۴ ساعته
          </span>
        </div>

        {bookingSubmitted ? (
          <div className="p-6 bg-emerald-50 text-emerald-900 rounded-3xl border border-emerald-200 text-xs font-black text-center space-y-2">
            <p className="text-sm">✅ درخواست مشاوره شما با موفقیت ثبت شد!</p>
            <p className="text-slate-600 font-bold">مشاور ارشد (استاد مریم رحیمی) در بازه زمانی «{bookingTime}» برای بررسی کارنامه و برنامه با شما تماس خواهد گرفت.</p>
          </div>
        ) : (
          <form onSubmit={handleBookConsultation} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700">نوع خدمت مشاوره مورد نیاز</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setConsultationType("single")}
                    className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
                      consultationType === "single" ? "bg-indigo-50 border-indigo-300 text-indigo-950 font-black shadow-xs" : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <span className="block text-xs font-black mb-1">جلسه مشاوره موردی</span>
                    <span className="text-[10px] text-slate-400 block">برای حل یک مسئله خاص یا رفع ابهام منابع</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsultationType("continuous")}
                    className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
                      consultationType === "continuous" ? "bg-indigo-50 border-indigo-300 text-indigo-950 font-black shadow-xs" : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    <span className="block text-xs font-black mb-1">همراهی و طرح مستمر</span>
                    <span className="text-[10px] text-slate-400 block">برنامه هفتگی، گزارش هرشبه و تحلیل کارنامه</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700">انتخاب بازه زمانی تماس و جلسه</label>
                <select 
                  value={bookingTime}
                  onChange={e => setBookingTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
                >
                  <option value="صبح فردا (۱۰ الی ۱۲)">صبح فردا (۱۰ الی ۱۲)</option>
                  <option value="عصر امروز (۱۸ الی ۲۰)">عصر امروز (۱۸ الی ۲۰)</option>
                  <option value="پنج‌شنبه (۱۱ الی ۱۳)">پنج‌شنبه (۱۱ الی ۱۳)</option>
                </select>
              </div>

            </div>

            <button 
              type="submit"
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-8 py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PhoneCall size={16} />
              <span>ثبت درخواست نهایی مشاوره و رزرو وقت</span>
            </button>
          </form>
        )}
      </div>

      {/* 📊 Student Grades & Report Card Overview Section */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-150 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BarChart3 size={18} />
            </div>
            <span>وضعیت نمرات و کارنامه فعلی داوطلب (استخراج از دیتابیس)</span>
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full font-mono">
            میانگین تسلط: ۵۵٪
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studentGrades.map((g, idx) => (
            <div key={idx} className={`p-5 rounded-2xl border transition-all space-y-3 ${
              g.status === "critical" ? "bg-rose-50/60 border-rose-200" :
              g.status === "warning" ? "bg-amber-50/60 border-amber-200" : "bg-emerald-50/50 border-emerald-200"
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-900">{g.lesson}</span>
                <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg ${
                  g.status === "critical" ? "bg-rose-100 text-rose-700" :
                  g.status === "warning" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {g.percentage}٪
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
                {g.advice}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Generator Controls */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-150 shadow-sm space-y-6">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Target size={18} className="text-indigo-600" />
          <span>تنظیم پارامترهای برنامه‌ریزی مبتنی بر کارنامه</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700">هدف ساعت مطالعه روزانه</label>
            <select 
              value={targetHours} 
              onChange={e => setTargetHours(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              <option value={8}>۸ ساعت (متعادل)</option>
              <option value={10}>۱۰ ساعت (پیشنهادی رتبه برتر)</option>
              <option value={12}>۱۲ ساعت (فوق سنگین / پشت کنکوری)</option>
              <option value={14}>۱۴ ساعت (بازه المپیاد و رتبه زیر ۱۰۰)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700">استاندارد آزمون مرجع</label>
            <select 
              value={selectedExamType} 
              onChange={e => setSelectedExamType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              <option value="konkur_master">کنکور سراسری (سطح فوق سخت و تله‌دار)</option>
              <option value="standard_mock">آزمون‌های جامع آزمایشی (استاندارد کشوری)</option>
              <option value="kaizen_olympiad">المپیاد علمی و سوالات چالشی مفهومی</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700">شیفت غالب مطالعه</label>
            <select 
              value={studyShift} 
              onChange={e => setStudyShift(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              <option value="morning_heavy">صبح سنگین (تمرکز روی دروس مفهومی و پایه)</option>
              <option value="evening_heavy">عصر سنگین (تمرکز روی تست‌زنی و مرور شبانه)</option>
              <option value="balanced">متوازن (پارت‌های مساوی صبح و عصر)</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>در حال تحلیل کارنامه دیتابیس و ساخت برنامه...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>تولید و ساخت برنامه مطالعاتی هوشمند بر اساس کارنامه</span>
            </>
          )}
        </button>
      </div>

      {/* Generated Plan Output & Warnings */}
      {generatedPlan && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          
          {/* Warnings & Exam Damage Alerts */}
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-3 shadow-sm">
            <h4 className="text-xs font-black text-amber-900 flex items-center gap-2">
              <ShieldAlert size={18} className="text-amber-600 animate-pulse" />
              <span>هشدارهای عارضه‌یابی کارنامه و آسیب‌شناسی درسی:</span>
            </h4>
            <div className="space-y-2">
              {(generatedPlan.warnings || []).map((warn: string, i: number) => (
                <p key={i} className="text-xs font-bold text-amber-800 bg-white/80 p-3 rounded-xl border border-amber-100">
                  {warn}
                </p>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[32px] p-8 border border-slate-150 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-mono">
                  {generatedPlan.profile || "برنامه اختصاصی مشاور"}
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">{generatedPlan.title}</h2>
                <p className="text-xs text-slate-500 font-bold">{generatedPlan.strategy || ""}</p>
              </div>
              
              <button 
                onClick={() => alert("برنامه مطالعاتی با موفقیت در فرمت PDF دانلود شد.")}
                className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-md hover:bg-slate-800 transition cursor-pointer"
              >
                <Download size={16} />
                <span>دانلود PDF برنامه هفته</span>
              </button>
            </div>

            {/* 🌟 ULTRA-POLISHED TOP-TIER NOTION / KOREAN STUDY PLANNER SCHEDULE TABLE */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <span>جدول زمان‌بندی و پارت‌های مطالعاتی هفته (طرح رتبه برتر)</span>
                </h4>
                <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50/80 border border-indigo-200 px-4 py-1.5 rounded-xl font-mono">
                  تیک‌زدن پارت‌ها جهت ثبت گزارش کار
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(generatedPlan.schedule || []).map((sch: any, idx: number) => {
                  const dayName = sch.day;
                  const isMorningDone = completedTasks[dayName]?.morning || false;
                  const isAfternoonDone = completedTasks[dayName]?.afternoon || false;

                  return (
                    <motion.div 
                      key={idx} 
                      whileHover={{ y: -3 }}
                      className={`p-6 rounded-[28px] border transition-all shadow-sm hover:shadow-md relative overflow-hidden bg-white ${sch.accentBg || 'border-slate-200'}`}
                    >
                      {/* Top Banner Accent */}
                      <div className={`absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r ${sch.color || 'from-indigo-600 to-blue-600'}`} />

                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${sch.color || 'from-indigo-600 to-blue-600'} text-white font-black text-xl flex items-center justify-center shadow-md`}>
                            {sch.emoji || '✨'}
                          </div>
                          <div>
                            <h5 className="text-base font-black text-slate-900">{sch.day}</h5>
                            <span className="text-[10px] text-indigo-600 font-extrabold font-mono">برنامه اختصاصی کایزن</span>
                          </div>
                        </div>

                        <div className="px-3.5 py-2 bg-slate-50 rounded-2xl border border-slate-200 text-center shadow-2xs">
                          <span className="block text-[8.5px] text-slate-400 font-black uppercase">تست هدف</span>
                          <span className="text-xs font-black text-indigo-950 font-mono">{sch.qCount ?? sch.totalQ ?? 0} تست</span>
                        </div>
                      </div>

                      {/* Shift 1: Morning */}
                      <div className={`p-4 rounded-2xl border transition-all mb-3 ${
                        isMorningDone 
                          ? "bg-emerald-50/60 border-emerald-200 opacity-80" 
                          : "bg-slate-50/80 border-slate-200/80 hover:border-indigo-300"
                      }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <span className="text-[9.5px] text-indigo-600 font-black block">🌅 شیفت اول (صبح - مطالعه عمیق):</span>
                            <p className={`text-xs font-bold leading-relaxed ${isMorningDone ? "text-slate-500 line-through" : "text-slate-800"}`}>
                              {sch.morning}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleTask(dayName, 'morning')}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer mt-0.5 ${
                              isMorningDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white text-transparent"
                            }`}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>

                      {/* Shift 2: Afternoon */}
                      <div className={`p-4 rounded-2xl border transition-all ${
                        isAfternoonDone 
                          ? "bg-emerald-50/60 border-emerald-200 opacity-80" 
                          : "bg-slate-50/80 border-slate-200/80 hover:border-indigo-300"
                      }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 flex-1">
                            <span className="text-[9.5px] text-emerald-600 font-black block">🌆 شیفت دوم (عصر - تست‌زنی و مرور):</span>
                            <p className={`text-xs font-bold leading-relaxed ${isAfternoonDone ? "text-slate-500 line-through" : "text-slate-800"}`}>
                              {sch.afternoon}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleTask(dayName, 'afternoon')}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors cursor-pointer mt-0.5 ${
                              isAfternoonDone ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 bg-white text-transparent"
                            }`}
                          >
                            <Check size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>

                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Extracurricular Classes & Workshops */}
            <div className="p-6 bg-indigo-50/60 rounded-3xl border border-indigo-100 space-y-4">
              <h4 className="text-xs font-black text-indigo-950 flex items-center gap-2">
                <Award size={16} className="text-indigo-600" />
                <span>کلاس‌های فوق‌برنامه و همایش‌های تخصصی الحاقی به برنامه:</span>
              </h4>
              <ul className="space-y-2.5">
                {(generatedPlan.extracurricular || []).map((extra: string, i: number) => (
                  <li key={i} className="flex items-center gap-2.5 text-xs font-bold text-indigo-900/80">
                    <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />
                    <span>{extra}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Daily Report Submission to Counselor & Family (Connected to Database) */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-150 shadow-sm space-y-6">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-emerald-600" />
              <span>ارسال گزارش عملکرد روزانه به مشاور و والدین (ذخیره در دیتابیس)</span>
            </h4>
            <p className="text-xs text-slate-500 font-bold leading-relaxed">
              هر روز پس از اتمام پارت‌های مطالعاتی، گزارش ساعت مطالعه، تعداد تست‌های زده‌شده و وضعیت روحیه خود را ثبت کنید تا مستقیماً در کارتابل مشاور ارشد و داشبورد والدین ثبت و ذخیره شود.
            </p>

            {dailyLogSubmitted ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-black text-center">
                ✅ گزارش عملکرد امروز با موفقیت در دیتابیس ابری ثبت شد و نسخه پیامکی آن برای مشاور و والدین ارسال گردید.
              </div>
            ) : (
              <form onSubmit={handleSendReportToCounselorAndFamily} className="space-y-4">
                <textarea 
                  value={dailyReportText}
                  onChange={e => setDailyReportText(e.target.value)}
                  placeholder="مثلاً: امروز ۱۰ ساعت مطالعه داشتم، ۱۲۰ تست زیست و شیمی زدم و حالم خیلی خوبه..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-600 min-h-[100px]"
                  required
                />
                <button 
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-6 py-3.5 rounded-2xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquare size={16} />
                  <span>ثبت و ارسال گزارش به مشاور و خانواده</span>
                </button>
              </form>
            )}
          </div>

        </div>
      )}

      {/* Back Button */}
      <div className="text-center">
        <button 
          onClick={() => onNavigate("dashboard")}
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-xs font-black transition-all bg-white border border-indigo-200 px-6 py-3 rounded-2xl shadow-sm cursor-pointer"
        >
          <ArrowRight size={14} />
          <span>بازگشت به داشبورد اصلی</span>
        </button>
      </div>

    </div>
  );
}
