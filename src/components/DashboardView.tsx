import React, { useState, useEffect } from "react";
import { 
  Sparkles, Calendar, CheckSquare, Quote, HeartPulse, Clock, ArrowRight,
  TrendingUp, Award, Zap, Brain, ShieldAlert, Target, PlayCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Student, DailyPlan } from "../types";
import { loadStudyPlan, subscribeToStudyPlan } from "../lib/studyPlans";

interface DashboardViewProps {
  student: Student;
  onNavigate: (view: string) => void;
  onUpdateStudent?: (updatedStudent: Student) => void;
}

export default function DashboardView({ student, onNavigate }: DashboardViewProps) {
  const [quote, setQuote] = useState("یادگیری یک مسیر است، نه یک مسابقه. ما اینجا هستیم تا در هر گام، با آرامش و دقت بیشتری در کنار شما باشیم.");
  const [loadingQuote, setLoadingQuote] = useState(true);
  
  const [streakDays, setStreakDays] = useState<number>(15);
  const [todayTasks, setTodayTasks] = useState<DailyPlan[]>([]);
  const [machineState, setMachineState] = useState<string | null>("optimal");
  const [hardwareAdvice, setHardwareAdvice] = useState<string>("عالی! آمادگی و انگیزه شما در بالاترین سطح است. امروز روز صعود تراز شماست.");
  const [activeTabFilter, setActiveTabFilter] = useState<"all" | "pending" | "completed">("all");

  useEffect(() => {
    let active = true;
    async function fetchQuote() {
      try {
        const res = await fetch("/api/motivational");
        if (res.ok) {
          const data = await res.json();
          if (active && data.quote) {
            setQuote(data.quote);
          }
        }
      } catch (err) {
        console.warn("Could not fetch quote, using fallback.", err);
      } finally {
        if (active) setLoadingQuote(false);
      }
    }
    fetchQuote();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    // First try the counselor-published plan from D1. If present, it REPLACES
    // the hardcoded default tasks — this is what makes a counselor's change
    // visible on the student's main dashboard.
    const applyCounselorPlan = (plan: any) => {
      if (!plan || !Array.isArray(plan.schedule) || plan.schedule.length === 0) return;
      const tasks: DailyPlan[] = plan.schedule.map((s: any) => ({
        day: s.day,
        morningPlan: s.morning || "",
        afternoonPlan: s.afternoon || "",
        totalQuestions: Math.max(0, Number(s.qCount ?? s.totalQ ?? 0) || 0),
        completed: false,
      }));
      setTodayTasks(tasks);
    };

    loadStudyPlan(student.id).then((plan) => {
      if (!cancelled && plan) {
        applyCounselorPlan(plan);
      } else if (!cancelled) {
        loadDefaultTasks();
      }
    });
    const unsubscribe = subscribeToStudyPlan(student.id, (plan) => {
      if (plan) applyCounselorPlan(plan);
    });

    return () => { cancelled = true; unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student.id, student.field]);

  const loadDefaultTasks = () => {
    if (student.field === "riazi") {
      setTodayTasks([
        { day: "امروز", morningPlan: "مطالعه دقیق مبحث نظریه اعداد و ترکیبیات گسسته", afternoonPlan: "حل تشریحی ۴۰ تست زمان‌دار فیزیک پایه و دوازدهم", totalQuestions: 40, completed: false },
        { day: "امروز", morningPlan: "مرور قضیه رول و مشتق‌پذیری در حسابان", afternoonPlan: "بررسی تست‌های هندسه تحلیلی و مقاطع مخروطی", totalQuestions: 25, completed: true },
        { day: "امروز", morningPlan: "تمرین واژگان زبان انگلیسی پیشرفته", afternoonPlan: "آزمون سنجش سرعت محاسبات ذهنی", totalQuestions: 30, completed: false }
      ]);
    } else if (student.field === "ensani") {
      setTodayTasks([
        { day: "امروز", morningPlan: "تقطیع هجایی و استخراج اختیارهای وزنی عروض", afternoonPlan: "حل تشریحی ۳۰ تست قواعد عربی تخصصی", totalQuestions: 30, completed: false },
        { day: "امروز", morningPlan: "مرور مبحث مغالطه‌ها و منطق صوری", afternoonPlan: "مطالعه بخش عرضه و تقاضا و بازار در اقتصاد", totalQuestions: 20, completed: true },
        { day: "امروز", morningPlan: "تحلیل تست‌های تاریخ اسلام و ایران", afternoonPlan: "خلاصه‌نویسی جامعه‌شناسی دوازدهم", totalQuestions: 25, completed: false }
      ]);
    } else {
      setTodayTasks([
        { day: "امروز", morningPlan: "مطالعه خط‌به‌خط مبحث ژنتیک مولکولی و تنوع زیستی", afternoonPlan: "حل تشریحی ۵۰ تست استوکیومتری و غلظت محلول‌ها", totalQuestions: 50, completed: false },
        { day: "امروز", morningPlan: "مرور فرمول‌های نوسان و امواج در فیزیک", afternoonPlan: "بررسی تست‌های قرابت معنایی و آرایه‌های ادبی", totalQuestions: 25, completed: true },
        { day: "امروز", morningPlan: "مرور لغات عربی کنکور", afternoonPlan: "تست‌زنی جامع موازی زیست‌شناسی", totalQuestions: 40, completed: false }
      ]);
    }
  };

  const toggleTask = (index: number) => {
    const updated = [...todayTasks];
    updated[index].completed = !updated[index].completed;
    setTodayTasks(updated);
  };

  const completedCount = todayTasks.filter(t => t.completed).length;
  const progressPercentage = Math.round((completedCount / (todayTasks.length || 1)) * 100);

  const handleMachineStateChange = (state: string) => {
    setMachineState(state);
    switch (state) {
      case "normal": setHardwareAdvice("شما در وضعیت پایدار و متمرکز هستید. ادامه دهید."); break;
      case "warm": setHardwareAdvice("کمی خسته شده‌اید. بعد از ۵۰ دقیقه مطالعه، ۱۰ دقیقه استراحت کنید."); break;
      case "error_risk": setHardwareAdvice("احتمال فراموشی مطالب پایه وجود دارد. مرور سریع ۱۰ دقیقه‌ای توصیه می‌شود."); break;
      case "optimal": setHardwareAdvice("عالی! آمادگی و انگیزه شما در بالاترین سطح است. امروز روز صعود تراز شماست."); break;
      default: setHardwareAdvice("");
    }
  };

  const filteredTasks = todayTasks.filter(task => {
    if (activeTabFilter === "pending") return !task.completed;
    if (activeTabFilter === "completed") return task.completed;
    return true;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 RTL" style={{ direction: 'rtl' }}>
      
      {/* 1. Header Welcome Card (Hero Banner) */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-950 rounded-[32px] p-8 md:p-10 relative overflow-hidden text-right shadow-2xl shadow-indigo-950/20 border border-indigo-800/50"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-0 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-[11px] font-bold text-indigo-200">
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              <span>پرتال تخصصی پایش و ارتقای تراز — متدولوژی کایزن</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              سلام، {student.name} عزیز! 👋
            </h1>
            
            <p className="text-sm md:text-base text-indigo-200/90 font-medium leading-relaxed bg-black/20 backdrop-blur-sm p-4 rounded-2xl border border-white/5">
              {loadingQuote ? "در حال دریافت پیام روز از دکتر رادان..." : `« ${quote} »`}
            </p>
          </div>
          
          {/* Quick Stats Badges */}
          <div className="flex flex-wrap sm:flex-nowrap gap-4 shrink-0 w-full lg:w-auto justify-end">
            <div className="bg-white/10 backdrop-blur-md rounded-25 p-5 border border-white/15 text-center flex-1 sm:min-w-[130px] shadow-lg">
              <span className="block text-[11px] text-indigo-200 font-bold mb-1">استریک مطالعه</span>
              <span className="block text-3xl font-black text-amber-400 font-mono tracking-wider">{streakDays}</span>
              <span className="block text-[10px] text-indigo-300 mt-1">روز پیوسته 🔥</span>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-25 p-5 border border-white/15 text-center flex-1 sm:min-w-[130px] shadow-lg">
              <span className="block text-[11px] text-indigo-200 font-bold mb-1">پیشرفت امروز</span>
              <span className="block text-3xl font-black text-emerald-400 font-mono tracking-wider">{progressPercentage}٪</span>
              <span className="block text-[10px] text-indigo-300 mt-1">{completedCount} از {todayTasks.length} تسک</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Today's Plan & Quick Actions (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Daily Tasks Card */}
          <div className="bg-white rounded-[32px] p-7 border border-slate-150 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <span>برنامه مطالعاتی هوشمند امروز</span>
                </h2>
                <p className="text-xs text-slate-400 font-bold">همگام با شیفت‌های صبح و عصر کایزن درسی</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl text-[11px] font-bold">
                <button 
                  onClick={() => setActiveTabFilter("all")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${activeTabFilter === "all" ? "bg-white text-indigo-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  همه ({todayTasks.length})
                </button>
                <button 
                  onClick={() => setActiveTabFilter("pending")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${activeTabFilter === "pending" ? "bg-white text-indigo-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  مانده
                </button>
                <button 
                  onClick={() => setActiveTabFilter("completed")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${activeTabFilter === "completed" ? "bg-white text-indigo-950 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                >
                  انجام‌شده
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                <span>درصد تکمیل برنامه‌های امروز</span>
                <span className="font-mono text-indigo-600 font-black">{progressPercentage}٪</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-150">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-3.5 pt-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  هیچ برنامه‌ای در این فیلتر وجود ندارد. خسته نباشید! 🎉
                </div>
              ) : (
                filteredTasks.map((task, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => toggleTask(idx)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                      task.completed 
                        ? "bg-emerald-50/60 border-emerald-200 opacity-80" 
                        : "bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md"
                    }`}
                  >
                    <div className={`mt-0.5 w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                      task.completed ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 text-transparent"
                    }`}>
                      <CheckSquare size={14} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md font-mono">
                          پارت مطالعاتی
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">تست هدف: {task.totalQuestions} عدد</span>
                      </div>
                      <p className={`text-sm font-black transition-colors ${task.completed ? "text-slate-500 line-through" : "text-slate-900"}`}>
                        {task.morningPlan}
                      </p>
                      <p className={`text-xs font-bold ${task.completed ? "text-slate-400" : "text-slate-600"}`}>
                        {task.afternoonPlan}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            <button 
              onClick={() => onNavigate("schedule")}
              className="mt-6 w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-indigo-700 font-black text-xs rounded-2xl transition-all flex items-center justify-center gap-2 border border-slate-150"
            >
              مشاهده تقویم و برنامه کامل هفته
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Quick Access Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              onClick={() => onNavigate("quiz")} 
              className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white p-6 rounded-[28px] cursor-pointer hover:scale-[1.02] transition-all shadow-lg shadow-purple-900/10 flex flex-col justify-between space-y-4 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <Brain size={20} className="text-purple-300" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black">آزمون هوشمند تله‌های تستی</h3>
                <p className="text-[11px] text-purple-200/80 font-bold leading-relaxed">شبیه‌ساز پیشرفته سوالات کنکور با شناسایی نقاط اصطکاک.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-purple-300 group-hover:gap-2 transition-all">
                <span>شروع آزمون</span>
                <ArrowRight size={14} />
              </div>
            </div>

            <div 
              onClick={() => onNavigate("report")} 
              className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-6 rounded-[28px] cursor-pointer hover:scale-[1.02] transition-all shadow-lg shadow-blue-900/10 flex flex-col justify-between space-y-4 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <TrendingUp size={20} className="text-blue-300" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black">کارنامه جامع و تراز مانیتورینگ</h3>
                <p className="text-[11px] text-blue-200/80 font-bold leading-relaxed">تحلیل رتبه، پیش‌بینی تراز کنکور و عارضه‌یابی اشتباهات.</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-blue-300 group-hover:gap-2 transition-all">
                <span>مشاهده کارنامه</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Mental Readiness, Pomodoro & Advisor (1 span) */}
        <div className="space-y-6">
          
          {/* Mental Readiness Card */}
          <div className="bg-white rounded-[32px] p-6 border border-slate-150 shadow-sm text-center space-y-5">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 justify-center">
              <HeartPulse size={18} className="text-rose-500 animate-pulse" />
              <span>پایش آمادگی ذهنی کایزن</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: "optimal", icon: "✨", label: "ایده‌آل و آماده", desc: "تمرکز عالی" },
                { id: "normal", icon: "⚡", label: "پایدار و منظم", desc: "ریتم یکنواخت" },
                { id: "warm", icon: "🌡️", label: "خسته و سنگین", desc: "نیاز به استراحت" },
                { id: "error_risk", icon: "⚠️", label: "پریشان ذهن", desc: "نیاز به مرور" }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleMachineStateChange(m.id)}
                  className={`p-3.5 rounded-2xl transition-all border flex flex-col items-center gap-1 text-center ${
                    machineState === m.id
                      ? "bg-indigo-50 border-indigo-300 shadow-sm ring-2 ring-indigo-500/20 scale-[1.02]"
                      : "bg-slate-50/80 border-slate-150 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-xs font-black text-slate-800">{m.label}</span>
                  <span className="text-[9px] font-bold text-slate-400">{m.desc}</span>
                </button>
              ))}
            </div>

            <AnimatePresence>
              {machineState && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="text-right text-xs text-slate-600 leading-relaxed font-bold bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl">
                    <span className="block font-black text-indigo-950 mb-1">💡 توصیه مشاور:</span>
                    {hardwareAdvice}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pomodoro Timer Quick Widget */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-[32px] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Clock size={16} />
                تایمر متمرکز پومودورو
              </span>
              <span className="text-[10px] font-mono bg-white/10 px-2.5 py-1 rounded-full text-slate-300">۵۰ / ۱۰ دقیقه</span>
            </div>
            
            <div className="text-center py-4 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-3xl font-black font-mono tracking-widest text-white">۵۰:۰۰</span>
              <span className="block text-[10px] text-slate-400 mt-1">آماده برای شروع پارت مطالعاتی</span>
            </div>

            <button 
              onClick={() => onNavigate("pomodoro")}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <PlayCircle size={16} />
              <span>ورود به اتاق تمرکز و پومودورو</span>
            </button>
          </div>
          
          {/* Counselor Support Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[32px] p-6 border border-emerald-200/60 shadow-sm flex flex-col items-center text-center space-y-3">
             <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
               <Zap size={22} />
             </div>
             <h3 className="text-sm font-black text-emerald-950">ارتباط مستقیم با مشاور</h3>
             <p className="text-[11px] text-emerald-800/80 font-bold leading-relaxed">سوالات درسی، چالش‌های انگیزشی یا ابهامات برنامه‌ریزی خود را بپرسید.</p>
             <button 
                onClick={() => onNavigate("counselor")}
                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all"
             >
               گفتگو با مشاور هوش مصنوعی
             </button>
          </div>

        </div>

      </div>
      
    </div>
  );
}
