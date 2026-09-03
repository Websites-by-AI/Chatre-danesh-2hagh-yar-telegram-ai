import React, { useState, useEffect, useRef } from "react";
import { Student } from "../types";
import { 
  BookOpen, Target, Volume2, VolumeX, BarChart3, Clock, Brain, Compass, 
  Sparkles, CheckCircle2, ChevronDown, Award, Play, Pause, RotateCcw, 
  Flame, Search, Filter, Check, HelpCircle, AlertTriangle, UserCheck, ShieldAlert, ArrowRight, MessageSquare, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getProfileMetadata } from "../lib/userProfiles";
import { loadStudyPlan, subscribeToStudyPlan, type StudyPlan } from "../lib/studyPlans";

interface StudyDashboardProps {
  student: Student;
  onNavigate: (target: string) => void;
}

export default function StudyDashboardView({ student, onNavigate }: StudyDashboardProps) {
  const [activeAmbiance, setActiveAmbiance] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0.4);
  const [selectedDay, setSelectedDay] = useState<string>("شنبه");
  const [dayCompleted, setDayCompleted] = useState<Record<string, boolean>>({});
  
  // Get counselor profile dynamically
  const counselor = getProfileMetadata("counselor") as any;
  const counselorName = counselor?.name || "استاد مریم رحیمی";
  const counselorSpecialty = counselor?.specialty || "ارشد کایزن و عارضه‌یابی تراز";

  // Load the counselor plan from D1 with local demo/offline fallback. The
  // subscription updates this view instantly when both panels are open.
  const [customPlan, setCustomPlan] = useState<StudyPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setPlanLoading(true);
    loadStudyPlan(student.id)
      .then((plan) => { if (active) setCustomPlan(plan); })
      .finally(() => { if (active) setPlanLoading(false); });
    const unsubscribe = subscribeToStudyPlan(student.id, (plan) => {
      if (active) setCustomPlan(plan);
    });
    return () => { active = false; unsubscribe(); };
  }, [student.id]);

  // Default rich Kaizen study schedule
  const defaultWeeklySchedule: Record<string, { qCount: number; morning: string; afternoon: string; trapTopic: string; advice: string }> = {
    "شنبه": {
      qCount: 45,
      morning: "زیست‌شناسی ۳ - همانندسازی دنا، رونویسی، عملکرد دناپلیمراز و عوامل رونویسی",
      afternoon: "حل و تحلیل ۴۵ تست زمان‌دار همانندسازی با کالیبراتور تله تستی",
      trapTopic: "دناپلیمراز و کدهای رونویسی",
      advice: "پیش‌خوانی سریع (SQ3R) + عارضه‌نگاری فیش‌ها."
    },
    "یکشنبه": {
      qCount: 35,
      morning: "شیمی تخصصی - استوکیومتری پیشرفته و محاسبات مولکولی",
      afternoon: "حل ۳۵ تست موازنه واکنش‌ها و محاسبه جرم مولی با تکنیک کایزن",
      trapTopic: "تله‌های کسر مول و ضریب استوکیومتری",
      advice: "محاسبات ذهنی سریع بدون چک‌نویس طولانی."
    },
    "دوشنبه": {
      qCount: 40,
      morning: "ریاضیات تخصصی - مشتق و کاربرد آن (خط مماس و اکسترمم)",
      afternoon: "حل ۴۰ تست زمان‌دار حسابان و بررسی نکات تله‌دار مشتق‌گیری",
      trapTopic: "نقاط بحرانی و مشتق سمت چپ و راست",
      advice: "رسم سریع نمودار توابع بدون استفاده از ماشین‌حساب."
    },
    "سه‌شنبه": {
      qCount: 30,
      morning: "فیزیک پیشرفته - دینامیک نیوتونی و نیروهای اصطکاک",
      afternoon: "تحلیل ۳۰ تست برآیند نیروها در سطوح شیب‌دار",
      trapTopic: "نیروی عمودی تکیه‌گاه در شتاب‌های قائمه",
      advice: "تجزیه بردارها و رسم دقیق دستگاه مختصات."
    },
    "چهارشنبه": {
      qCount: 25,
      morning: "فلسفه و منطق - منطق صوری و قضایای حملی",
      afternoon: "حل ۲۵ تست منطق دهم و بررسی عکس مستوی",
      trapTopic: "نقض اوسط و شرایط استدلال قیاسی",
      advice: "حل تست‌های عروضی و استخراج اوزان شعر."
    },
    "پنجشنبه": {
      qCount: 40,
      morning: "شبیه‌ساز جامع نیمه‌رسمی کنکور (تمام دروس پایه)",
      afternoon: "تحلیل کامل کارنامه و بررسی خطاهای محاسباتی در دفتر اشتباهات",
      trapTopic: "مدیریت زمان در تست‌های وقت‌گیر",
      advice: "اجرای دقیق تکنیک ضربدر منها."
    },
    "جمعه": {
      qCount: 10,
      morning: "مرور خلاصه‌نویسی‌های طلایی هفته و استراحت بازسازنده",
      afternoon: "ارسال گزارش عملکرد هفتگی به مشاور و والدین",
      trapTopic: "ریکاوری ذهنی و آماده‌سازی هفته جدید",
      advice: "پیاده‌روی سبک و دوری از فضای متراکم مطالعه."
    }
  };

  const currentDayData = (customPlan && customPlan.schedule) ? 
    (customPlan.schedule.find((s: any) => s.day === selectedDay) || defaultWeeklySchedule[selectedDay]) :
    defaultWeeklySchedule[selectedDay];

  // Web Audio API refs for local ambient noise synthesis
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<any[]>([]);
  const noiseNodeRef = useRef<any>(null);

  const stopAllAudio = () => {
    oscillatorsRef.current.forEach(osc => {
      try { osc.stop(); } catch(e){}
    });
    oscillatorsRef.current = [];

    if (noiseNodeRef.current) {
      try { noiseNodeRef.current.stop(); } catch(e){}
      noiseNodeRef.current = null;
    }
  };

  const playAmbiance = (type: string) => {
    stopAllAudio();
    if (activeAmbiance === type) {
      setActiveAmbiance(null);
      return;
    }
    setActiveAmbiance(type);
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      if (type === "alpha") {
        const oscL = ctx.createOscillator();
        const oscR = ctx.createOscillator();
        oscL.type = "sine";
        oscL.frequency.setValueAtTime(200, ctx.currentTime);
        oscR.type = "sine";
        oscR.frequency.setValueAtTime(210, ctx.currentTime);
        oscL.connect(masterGain);
        oscR.connect(masterGain);
        oscL.start();
        oscR.start();
        oscillatorsRef.current = [oscL, oscR];
      } else if (type === "rain") {
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.1;
        }
        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(600, ctx.currentTime);
        whiteNoise.connect(filter).connect(masterGain);
        whiteNoise.start();
        noiseNodeRef.current = whiteNoise;
      }
    } catch (e) {}
  };

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, []);

  const toggleDayCompletion = (day: string) => {
    setDayCompleted(prev => ({ ...prev, [day]: !prev[day] }));
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 bg-slate-50 min-h-screen text-right RTL" dir="rtl" style={{ direction: 'rtl' }}>
      
      {/* 👑 Counselor & System Header Card */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-8 rounded-[32px] text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-black text-indigo-200">
              <Sparkles size={14} className="text-amber-400" />
              <span>سیستم مطالعاتی کایزن • هماهنگ با هوش مصنوعی و کارنامه</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black">برنامه‌ریزی هوشمند مطالعاتی ترنم مهر</h1>
            <p className="text-xs md:text-sm text-indigo-200/90 font-medium leading-relaxed max-w-2xl">
              این ماژول پیشرفته به طور مستقیم با تحلیل تله‌های تستی، نقشه نقاط ابهام و رادار تخمین قبولی هماهنگ است و تضمین می‌کند شیفت‌های عصر شما مجهز به شبیه‌سازها و سنجش‌های موضوعی معتبر باشد.
            </p>
          </div>

          {/* Counselor Badge */}
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-right shrink-0 min-w-[240px]">
            <span className="block text-[10px] text-indigo-300 font-bold mb-1">مشاور اختصاصی شما:</span>
            <span className="block text-sm font-black text-white">{counselorName}</span>
            <span className="block text-[10px] text-amber-300 font-bold mt-0.5">{counselorSpecialty}</span>
            <button 
              onClick={() => onNavigate("counselor-chat")}
              className="mt-3 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageSquare size={13} />
              <span>گفتگو با مشاور و درخواست بازبینی برنامه</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📅 Weekly Timeline Selector (Saturday to Friday) */}
      <div className="bg-white p-6 rounded-[28px] border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar size={18} className="text-indigo-600" />
              <span>تایم‌لاین هفتگی — انتخاب روز مطالعاتی</span>
            </h3>
            <p className="text-xs text-slate-500 font-bold">برای مشاهده جزئیات پارت‌های صبح و عصر روی روز مورد نظر کلیک کنید.</p>
          </div>
          <span className="text-xs font-black px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-mono">
            رشته: {student.field === "tajrobi" ? "علوم تجربی" : student.field === "riazi" ? "ریاضی فیزیک" : "علوم انسانی"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"].map((dayName) => {
            const isSelected = selectedDay === dayName;
            const isDone = dayCompleted[dayName];
            return (
              <button
                key={dayName}
                onClick={() => setSelectedDay(dayName)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-right flex flex-col justify-between space-y-2 relative overflow-hidden group ${
                  isSelected 
                    ? "bg-indigo-950 text-white border-indigo-950 shadow-lg scale-105" 
                    : isDone
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className={`text-xs font-black ${isSelected ? "text-amber-400" : "text-slate-900"}`}>{dayName}</span>
                  {isDone ? <CheckCircle2 size={14} className="text-emerald-600" /> : <span className="w-2 h-2 rounded-full bg-indigo-500" />}
                </div>
                <div className="text-[10px] font-bold opacity-80">
                  {customPlan?.schedule.find((d) => d.day === dayName)?.qCount ?? defaultWeeklySchedule[dayName]?.qCount ?? 40} تست هدف
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 📖 Detailed Active Day Schedule Card */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-mono">
              پارت‌های اختصاصی روز {selectedDay}
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">
              جزئیات برنامه درسی روز {selectedDay} ({currentDayData.qCount} تست تخصصی)
            </h2>
            <p className="text-xs text-slate-500 font-bold">
              {planLoading
                ? "در حال همگام‌سازی برنامه با پنل مشاور..."
                : customPlan
                  ? `آخرین برنامه منتشرشده توسط ${customPlan.counselorName} • ${new Date(customPlan.updatedAt).toLocaleString("fa-IR")}`
                  : "برنامه پیش‌فرض نمایشی؛ هنوز برنامه اختصاصی توسط مشاور منتشر نشده است."}
            </p>
          </div>

          <button
            onClick={() => toggleDayCompletion(selectedDay)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              dayCompleted[selectedDay]
                ? "bg-emerald-600 text-white shadow-lg"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            <CheckCircle2 size={16} />
            <span>{dayCompleted[selectedDay] ? "مطالعه این روز تایید شده ✓" : "تایید اتمام مطالعات امروز"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Shift 1: Morning */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-indigo-600">
              <Clock size={18} />
              <h4 className="text-xs font-black">Part 1: شیفت فشرده صبح (۴ ساعت عمیق)</h4>
            </div>
            <p className="text-sm font-black text-slate-900 leading-relaxed">
              {currentDayData.morning}
            </p>
            <p className="text-xs text-slate-500 font-bold bg-white p-3 rounded-2xl border border-slate-150">
              روش پیشنهادی مربی ({counselorName}): پیش‌خوانی سریع (SQ3R) + عارضه‌نگاری فیش‌ها.
            </p>
          </div>

          {/* Shift 2: Afternoon */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2 text-emerald-600">
              <Target size={18} />
              <h4 className="text-xs font-black">Part 2: شیفت تمرینی عصر ({currentDayData.qCount} تست زمان‌دار)</h4>
            </div>
            <p className="text-sm font-black text-slate-900 leading-relaxed">
              {currentDayData.afternoon}
            </p>
            <p className="text-xs text-slate-500 font-bold bg-white p-3 rounded-2xl border border-slate-150">
              تمرکز تستی: حل با تکنیک ضربدر منها و ردیابی تله‌های کنکور.
            </p>
          </div>

        </div>

        {/* AI Damage Analysis & Trap Calibration */}
        <div className="p-6 bg-purple-50/60 rounded-3xl border border-purple-150 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-black text-purple-950 flex items-center gap-2">
              <Brain size={16} className="text-purple-600" />
              <span>تحلیل عارضه‌یابی و مانیتورینگ هوشمند کایزن</span>
            </h4>
            <button 
              onClick={() => onNavigate("traps")}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 transition cursor-pointer"
            >
              ورود به بانک تله‌ها
            </button>
          </div>
          <p className="text-xs text-purple-900 font-bold leading-relaxed">
            نقطه اصطکاک و ضعف (بر پایه هوش مصنوعی): <span className="underline">{currentDayData.trapTopic || "مرور اشتباهات ثبت‌شده و تحلیل تست‌های دشوار همان روز"}</span>. این بخش مستقیماً به مبحث ضعیف شما پیوند دارد.
          </p>
        </div>

      </div>

    </div>
  );
}
