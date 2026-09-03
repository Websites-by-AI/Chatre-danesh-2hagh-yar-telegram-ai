import { useState, useEffect } from "react";
import { 
  Brain, HeartPulse, ShieldAlert, Sparkles, Zap, ArrowLeft, RefreshCw, 
  Lock, CheckCircle, Flame, UserCheck, AlertCircle, Play, Pause, 
  Compass, Info, UserX, MessageCircleCode, Volume2, Smile, ArrowRightLeft
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Student } from "../types";
import { BRAND_CONFIG } from "../constants";
import { addSystemLog } from "../lib/syslogs";

interface IntelligentInterventionSystemProps {
  student: Student;
  onUpdateStudent?: (student: Student) => void;
}

export default function IntelligentInterventionSystem({ student, onUpdateStudent }: IntelligentInterventionSystemProps) {
  // Utility Farsi digits converter
  const toPersianNum = (num: number | string) => {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
  };

  // System State
  const [activeTab, setActiveTab] = useState<"student" | "counselor">("student");
  // We'll hide counselor tab for students if onUpdateStudent is provided (meaning it's likely the student dashboard)
  const showCounselorTab = !onUpdateStudent; 

  const [completedGoals, setCompletedGoals] = useState<Record<number, boolean>>({});

  const handleToggleGoal = (idx: number) => {
    const nextVal = !completedGoals[idx];
    setCompletedGoals(prev => ({ ...prev, [idx]: nextVal }));
    if (nextVal) {
      addSystemLog("تکمیل ریزهدف انگیزه", student.name, `کاربر هدف شماره ${idx + 1} را پاس کرد و امتیاز انگیزه گرفت.`);
    } else {
      addSystemLog("لغو ریزهدف انگیزه", student.name, `کاربر تیک هدف شماره ${idx + 1} را برداشت.`);
    }
  };
  const [isSelfReportOpen, setIsSelfReportOpen] = useState(false);
  const [reportState, setReportState] = useState<"initial" | "selected" | "breathing" | "cbt" | "call_scheduled">("initial");
  
  // Interactive Simulation variables
  const [motivationState, setMotivationState] = useState<"high" | "low" | "micro_goals">("low");
  const [studyDeclineSimulated, setStudyDeclineSimulated] = useState(false);
  const [anxietyTriageSimulated, setAnxietyTriageSimulated] = useState(false);
  const [breathStage, setBreathStage] = useState<"inhale" | "hold" | "exhale" | "hold_empty">("inhale");
  const [breathProgress, setBreathProgress] = useState(4);
  const [breathActive, setBreathActive] = useState(false);
  
  // Counselor Tab variables
  const [selectedRedFlagStudent, setSelectedRedFlagStudent] = useState<string>("maryam");

  // Motivational Quotes / Guidance for the different statuses
  const [cbtStep, setCbtStep] = useState(0);
  const cbtCards = [
    {
      distortion: "ذهن‌خوانی والدین و رتبه‌های تک‌رقمی",
      thought: "«همه از من انتظار دارند پزشکی تهران قبول شوم، اگر نشوم مایه‌ی سرشکستگی خانواده‌ام خواهم شد.»",
      reframing: "خانواده و مربیان تلاش، اراده و سلامت روان شما را دوست دارند. موفقیت تک‌مرحله‌ای نیست. روی گام‌های روزانه تمرکز کن، نه قضاوت دیگران."
    },
    {
      distortion: "تفکر همه‌یا‌هیچ (ارزیابی صفر تا صد)",
      thought: "«چون تراز آزمون امروز من افت کرده، پس تمام ماه‌ها تلاش بیهوده بوده و در کنکور هم شکست خواهم خورد.»",
      reframing: "افت تراز یک ابزار عارضه‌‌یابی علمی است، نه حکم نهایی! هر اشتباهی در آزمون آزمایشی یک تله‌ی لو رفته برای روز کنکور سراسری است."
    },
    {
      distortion: "فاجعه‌سازی (بزرگ‌نمایی عواقب)",
      thought: "«اگر تست‌های مشتق را یاد نگیرم، کل دفترچه ریاضی سفید خواهد ماند و رتبه‌ام نجومی می‌شود.»",
      reframing: "مبحث مشتق تنها ۴ تست را به خود اختصاص می‌دهد. ضعف در یک مبحث به معنی ناتوانی در کل درس نیست. گام‌های کوچک کایزن را شروع کن."
    }
  ];

  // Self-Reporting custom options
  const selfReportFeelings = [
    { id: "anxious", label: "شدیداً مضطربم و تپش قلب دارم", icon: "😰", color: "border-red-200 bg-red-50 text-red-700" },
    { id: "unmotivated", label: "هیچ رمق و انگیزه‌ای برای باز کردن کتاب ندارم", icon: "🥱", color: "border-amber-200 bg-amber-50 text-amber-700" },
    { id: "exhausted", label: "۳ روز است ساعت مطالعه‌ام افت کرده", icon: "📉", color: "border-orange-200 bg-orange-50 text-orange-700" },
    { id: "overwhelmed", label: "حجم مباحث بالا رفته و گیج شده‌ام", icon: "🤯", color: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  ];

  // Breathing simulation speed controller
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (breathActive) {
      interval = setInterval(() => {
        setBreathProgress(prev => {
          if (prev <= 1) {
            // Next breath stage transition
            setBreathStage(current => {
              switch (current) {
                case "inhale": return "hold";
                case "hold": return "exhale";
                case "exhale": return "hold_empty";
                case "hold_empty": return "inhale";
              }
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [breathActive]);

  // Handle Motivation Reset triggering (Goal Decomposition)
  const handleMotivationReset = () => {
    setMotivationState("micro_goals");
    addSystemLog("تنظیم مجدد انگیزه (Goal Decomposition)", student.name, "کاهش حجم اهداف ۲۴ ساعت آینده به حداقلهای ممکن گام‌به‌گام (Micro-Goals)");
  };

  const handleSelfReport = (feelingId: string) => {
    setReportState("selected");
    addSystemLog("اعلام وضعیت داوطلب", student.name, `احراز وضعیت داوطلب به حالت: ${feelingId}`);
    
    // Auto trigger related intervention states
    if (feelingId === "anxious") {
      setAnxietyTriageSimulated(true);
      setReportState("breathing");
      setBreathActive(true);
    } else if (feelingId === "unmotivated" || feelingId === "exhausted") {
      setStudyDeclineSimulated(true);
      setMotivationState("low");
    } else {
      setAnxietyTriageSimulated(true);
      setReportState("cbt");
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/50 via-slate-50 to-blue-50/30 rounded-3xl p-6 border border-slate-150/80 shadow-md text-right space-y-6 relative overflow-hidden" id="intelligent-intervention-system-widget">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 left-0 w-44 h-44 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-36 h-36 bg-amber-200/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header and Perspective switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-150 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 justify-start">
            <span className="p-1 px-2.5 bg-indigo-900 text-white text-[10px] rounded-lg font-black tracking-wider uppercase flex items-center gap-1 shadow-sm">
              <Sparkles size={11} className="text-amber-400 animate-pulse" />
              <span>پروتکل فعال DIS</span>
            </span>
            <h2 className="font-sans font-black text-slate-900 text-lg flex items-center gap-1.5">
              <span>سامانه ارزیابی پویا و مداخله‌گر کنکور (DIS)</span>
            </h2>
          </div>
          <p className="text-slate-500 text-xs">
            سیستم پایش وضعیت هوشمند، تشخیص زودرس افت عملکرد، تله‌زدایی علمی و مداخله همدلانه فوری هوش مصنوعی
          </p>
        </div>

        {/* View Switcher: Interactive Demo - Let client see both student flow and advisor flow */}
        {showCounselorTab && (
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/50 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("student")}
              className={`flex-1 sm:flex-initial py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "student" ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Brain size={14} />
              <span>بخش داوطلب (هوشمندِ همراه)</span>
            </button>
            
            <button
              onClick={() => setActiveTab("counselor")}
              className={`flex-1 sm:flex-initial py-2 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "counselor" ? "bg-white text-blue-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <UserCheck size={14} />
              <span>بخش مشاور (داشبورد وضعیت قرمز)</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: STUDENT VIEW IN INTERVENTION SYSTEM */}
      {activeTab === "student" && (
        <div className="space-y-6">
          
          {/* Top Panel: Companion Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Metric 1: Motivation & Study Hours Alarm Status */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-blue-50 text-blue-800 rounded-xl">
                  <Flame size={18} />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-extrabold block">آلارم هوشمند (EWS)</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mt-1 inline-block ${
                    studyDeclineSimulated ? "bg-red-50 text-red-650 animate-pulse border border-red-100" : "bg-emerald-50 text-emerald-700"
                  }`}>
                    {studyDeclineSimulated ? "⚠️ هشدار: تشخیص افت ۳ روزه" : "💚 ریتم پایدار (سالم)"}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs font-black text-slate-850 block mb-1">انگیزه و ریتم مطالعاتی</span>
                <p className="text-[11px] text-slate-400 leading-normal font-semibold">
                  {studyDeclineSimulated 
                    ? "ساعت مطالعه داوطلب ۳ روز متوالی از میانگین هفتگی کمتر بوده است." 
                    : "حضور مطالعاتی و داکت‌های ثبت تله‌ها در وضعیت تعادلی مطلوب قرار دارد."}
                </p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStudyDeclineSimulated(!studyDeclineSimulated)}
                  className={`w-full py-1.5 px-2 rounded-xl text-[9px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    studyDeclineSimulated ? "bg-slate-100 text-slate-650" : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/40"
                  }`}
                >
                  <ArrowRightLeft size={10} />
                  <span>{studyDeclineSimulated ? "رفع شبیه‌سازی افت" : "شبیه‌سازی افت ۳ روزه مطالعه"}</span>
                </button>
              </div>
            </div>

            {/* Metric 2: Motivation Reset Module (Micro-Goals) */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-amber-50 text-amber-800 rounded-xl">
                  <Zap size={18} />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-extrabold block">تنظیم انگیزه</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mt-1 inline-block ${
                    motivationState === "micro_goals" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {motivationState === "micro_goals" ? "🎯 اهداف خُرد شده فعال" : "⚡ آماده بازنشانی (Goal Dec)"}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs font-black text-slate-850 block mb-1">سیستم Micro-Goals</span>
                <p className="text-[11px] text-slate-400 leading-normal font-semibold">
                  {motivationState === "micro_goals" 
                    ? "برنامه‌ فشرده به ۲۴ ساعت آینده محدود و حجم مطالعه ۷۰٪ سبک‌تر شد تا سریعاً زنجیره شکست قطع گردد." 
                    : "در صورت فرسودگی، با این ماژول اهداف را به ریزاهداف تبدیل کنید تا طعم پیروزی کوچک را بچشید."}
                </p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                {motivationState !== "micro_goals" ? (
                  <button
                    type="button"
                    onClick={handleMotivationReset}
                    className="w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-[9px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    <CheckCircle size={10} />
                    <span>خُرد کردن اهداف ( Motivation Reset )</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMotivationState("low");
                      setCompletedGoals({});
                    }}
                    className="w-full py-1.5 px-2 bg-slate-100 text-slate-650 rounded-xl text-[9px] font-black transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <RefreshCw size={10} />
                    <span>لغو و بازگشت به حجم استاندارد</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metric 3: Anxiety Emergency Indicator */}
            <div className="bg-white border border-slate-150 p-4 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start">
                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                  <ShieldAlert size={18} />
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-extrabold block">اورژانس اضطراب</span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full mt-1 inline-block ${
                    anxietyTriageSimulated ? "bg-red-900 text-white animate-pulse" : "bg-blue-50 text-blue-800"
                  }`}>
                    {anxietyTriageSimulated ? "🚫 آزمون‌های سخت قفل شد" : "🛡️ مانیتورینگ آنلاین فعال"}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs font-black text-slate-850 block mb-1">سیستم مراقبت روانشناختی</span>
                <p className="text-[11px] text-slate-400 leading-normal font-semibold">
                  {anxietyTriageSimulated 
                    ? "آزمون‌های جامع کنکوری قفل شده و پلتفرم به وضعیت پشتیبانی و تثبیت روانی CBT سوئیچ شده است." 
                    : "پایش فعال اضطراب داوطلب. در صورت تپش قلب یا اضطراب فوراً از دکمه اورژانس زیر استفاده کنید."}
                </p>
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAnxietyTriageSimulated(!anxietyTriageSimulated)}
                  className={`w-full py-1.5 px-2 rounded-xl text-[9px] font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    anxietyTriageSimulated ? "bg-slate-100 text-slate-650" : "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/40"
                  }`}
                >
                  <Lock size={10} />
                  <span>{anxietyTriageSimulated ? "آزاد رها کردن آزمون‌ها" : "قفل هوشمند آزمون‌های سخت"}</span>
                </button>
              </div>
            </div>

          </div>

          {/* Warning Card triggered by early warning system or simulated study decline */}
          <AnimatePresence>
            {studyDeclineSimulated && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-amber-50 border-r-4 border-amber-500 rounded-2xl p-5 text-right overflow-hidden"
              >
                <div className="flex gap-3 items-start justify-start">
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl mt-0.5">
                    <AlertCircle size={18} />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-black text-amber-900">آلارم همدلانه هوشمند (Early Warning Action)</h4>
                    <p className="text-xs text-amber-950 leading-relaxed font-semibold">
                      « رفیق قشنگم، سیستم پایش علمی ترنم مهر متوجه شده که در این ۳ روز اخیر ساعت مطالعه و ثبت تستت از استاندارد فردی همیشگی‌ات کمی پایین‌تر اومده. این کاملاً طبیعیه! توی سال کنکور روزهای خستگی و فرسودگی سراغ همه میاد. خودت رو سرزنش نکن. مشاور ارشد ترنم مهر کنارت ایستاده تا با هم این خستگی موقت رو پشت سر بذاریم. می‌خوای برنامه ۲۴ ساعت آینده‌ات رو فوق‌العاده سبک و میکرو کنیم؟ 😊 »
                    </p>
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={handleMotivationReset}
                        className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black py-2 px-4 shadow-sm"
                      >
                        بله، حجم برنامه‌ام رو خرد کن (خرد گویی انگیزه)
                      </button>
                      <button
                        onClick={() => setStudyDeclineSimulated(false)}
                        className="bg-white/80 hover:bg-white text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black py-2 px-4"
                      >
                        ممنونم، ریتمم رو اصلاح می‌کنم
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Micro-goals interactive panel if motivation is low */}
          <AnimatePresence>
            {motivationState === "micro_goals" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-emerald-900 text-white rounded-3xl p-6 relative overflow-hidden"
              >
                {/* Decorative particles */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-800 rounded-full blur-2xl opacity-50" />
                
                <div className="relative z-10 space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-emerald-800 text-emerald-300 rounded-lg">
                        <CheckCircle size={14} />
                      </span>
                      <span className="text-xs font-black">ماژول بازخوانی انگیزه با ریزاهداف ۲۴ ساعت آینده (Micro-Goals)</span>
                    </div>
                    <span className="text-[10px] bg-white/10 text-emerald-200 px-2 py-0.5 rounded-full font-black">فعال با ۷۰٪ کاهش لود</span>
                  </div>

                  <p className="text-xs leading-relaxed text-emerald-100">
                    برای بازگرداندن انگیزه درونی، غول بزرگ آزمون‌ها را شکسته‌ایم! تا فردا شب ساعت ۲۲، تنها وظیفه مطالعاتی شما انجام کارهای زیر است. پس از تکمیل هر کدام تیک بزنید تا انگیزه شما مجدداً شارژ شود:
                  </p>

                  <div className="space-y-2.5">
                    {[
                      { text: "۱۰ تست فوق‌العاده ساده از کانسپت‌های مقدماتی مبحث مشتق (تنها برای روشن شدن موتور فکری)", points: 25 },
                      { text: "۱۵ دقیقه خلاصه‌نویسی روان‌شناختی یا نگاه اجمالی به فرمول‌های پایه شیمی یازدهم", points: 15 },
                      { text: "تماس تلفنی ۵ دقیقه‌ای همدلانه با مشاور ارشد جهت تنظیم روحیه", points: 30 }
                    ].map((item, idx) => {
                      const isDone = !!completedGoals[idx];
                      return (
                        <div 
                          key={idx} 
                          onClick={() => handleToggleGoal(idx)}
                          className={`flex justify-between items-center border rounded-2xl p-3.5 transition-all duration-300 cursor-pointer select-none ${
                            isDone 
                              ? "bg-emerald-950/40 border-emerald-500/40 opacity-80 scale-[0.99] shadow-inner" 
                              : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isDone ? "bg-emerald-600 border-emerald-500 text-white" : "border-white/30 bg-emerald-950/50"
                            }`}>
                              {isDone && <CheckCircle size={12} />}
                            </div>
                            <span 
                              className={`text-xs text-white/90 font-semibold transition-all ${
                                isDone ? "line-through text-white/50" : ""
                              }`}
                            >
                              {item.text}
                            </span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-sans font-bold transition-all ${
                            isDone ? "text-emerald-400 bg-emerald-900/40" : "text-amber-300 bg-white/10"
                          }`}>
                            {isDone ? "✓ کامل شد" : `+${item.points} XP`}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        setMotivationState("high");
                        setCompletedGoals({});
                        addSystemLog("دریافت پیروزی کوچک", student.name, "تکمیل موفقیت‌آمیز چرخه میکروگلز و بازگشت انگیزه به حد ایده‌آل");
                      }}
                      className="bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-2xl text-[10px] font-black py-2.5 px-5 flex items-center gap-1 shadow-md hover:scale-102 active:scale-95 transition-all"
                    >
                      <Sparkles size={12} />
                      <span>اتمام فاز و بازیابی کامل انگیزه اولیه</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Trigger Box: Standard Student Engagement */}
          <div className="bg-white border border-slate-150 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-6 shadow-sm">
            <div className="space-y-1.5 text-center sm:text-right">
              <h3 className="text-slate-900 font-sans font-black text-base flex justify-center sm:justify-start items-center gap-2">
                <HeartPulse className="text-red-500 animate-pulse" size={18} />
                <span>اورژانس روحی داوطلب (Self-Reporting Control)</span>
              </h3>
              <p className="text-slate-500 text-xs">
                اگر در حل تست‌ها مستأصل شده‌ای، اضطراب شدید یا تپش قلب داری، همین حالا بدون خجالت دکمه را فشار بده تا پورتال هوشمند پشتیبانی فعال شود.
              </p>
            </div>

            <button
              onClick={() => {
                setIsSelfReportOpen(true);
                setReportState("initial");
              }}
              className="py-3 px-6 bg-red-650 hover:bg-red-750 text-white rounded-2xl text-xs font-black shadow-lg shadow-red-600/10 active:scale-95 transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center hover:scale-[1.02]"
              id="btn-self-report-emergency"
            >
              <span>💔 حالم خوب نیست (پشتیبانی فوری عاطفی و تنفسی)</span>
            </button>
          </div>

        </div>
      )}

      {/* TAB 2: COUNSELOR RED FLAG DASHBOARD */}
      {activeTab === "counselor" && (
        <div className="space-y-6">
          <div className="bg-amber-50/50 border border-amber-150 rounded-2xl p-4 flex gap-2.5 items-start text-right">
            <Info size={16} className="text-amber-800 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-950 leading-relaxed font-semibold">
              <strong>نمای مشاور همیار (SaaS Core Portal):</strong> این پنل مخصوص مربیان و همیاران تحصیلی ترنم مهر طراحی شده است. سیستم به جای لیست کردن صدها داوطلب، تنها داوطلبانی را که در ۴۸ ساعت گذشته دچار افت شدید انگیزه یا شاخص پایداری علمی ERI شده‌اند، برای «مداخله فوری» به مشاور ارشد ارجاع می‌دهد.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Red Flag List Panel */}
            <div className="lg:col-span-1 bg-white border border-slate-150 rounded-3xl p-4 space-y-3">
              <h4 className="text-[11px] text-slate-400 font-extrabold flex justify-between items-center pb-2 border-b border-slate-100">
                <span>لیست پیگیری داوطلبان وضعیت قرمز (3 هشدار)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              </h4>

              <div className="space-y-2">
                {[
                  { id: "maryam", name: "مریم احمدی", issue: "افت شدید انگیزه به دلیل سختی زیست", status: "بحرانی - تپش قلب", val: "افت ERI به ۳۸٪" },
                  { id: "arash", name: "آرش صادقی", issue: "توالی خطاهای مکرر تحت خستگی", status: "در معرض فرسودگی", val: "افت ۶۰٪ ریاضی" },
                  { id: "sara", name: "سارا کریمی", issue: "کاهش مداوم ۲.۵ ساعته مطالعه روزانه", status: "افت ۳ روزه متوالی", val: "آلارم EWS فعال" }
                ].map((std) => (
                  <button
                    key={std.id}
                    onClick={() => {
                      setSelectedRedFlagStudent(std.id);
                      addSystemLog("بررسی پرونده قرمز", student.name, `مشاور پرونده ${std.name} را تحلیل کرد.`);
                    }}
                    type="button"
                    className={`w-full text-right p-3 rounded-2xl transition-all cursor-pointer flex justify-between items-center border ${
                      selectedRedFlagStudent === std.id 
                        ? "bg-red-50/50 border-red-200 ring-2 ring-red-100" 
                        : "bg-white border-slate-100 hover:bg-slate-50"
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        <span>{std.name}</span>
                      </span>
                      <p className="text-[10px] text-slate-400 font-semibold">{std.issue}</p>
                    </div>
                    <div className="text-left space-y-1">
                      <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-black block">{std.status}</span>
                      <span className="text-[8px] text-slate-400 font-mono block">{std.val}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Auto-Summary & Counselor Action Recommendation */}
            <div className="lg:col-span-2 bg-white border border-slate-150 rounded-3xl p-6 flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-extrabold">گزارش هوشمند مربیگری علمی (AI Auto-Summary)</span>
                    <h3 className="text-xs font-black text-slate-900">
                      داوطلب تحت تحلیل: {
                        selectedRedFlagStudent === "maryam" ? "مریم احمدی" : 
                        selectedRedFlagStudent === "arash" ? "آرش صادقی" : "سارا کریمی"
                      }
                    </h3>
                  </div>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-black border border-indigo-150">ارائه شده توسط مشاور ارشد هوش مصنوعی</span>
                </div>

                {/* Simulated AI report content based on requested structures */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3">
                  <div className="flex items-start gap-2 text-right">
                    <Info size={14} className="text-indigo-800 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-800 leading-relaxed font-semibold space-y-2">
                      {selectedRedFlagStudent === "maryam" && (
                        <>
                          <p>
                            📌 <strong className="text-red-700 font-black">وضعیت عارضه‌یابی:</strong> مریم در ۳ روز گذشته به دلیل فشار بالا در مبحث زیست‌شناسی، دچار افت شدید انگیزه شده و شاخص اضطرابش ۳۰٪ افزایش یافته است.
                          </p>
                          <p>
                            📊 <strong className="text-indigo-700 font-black">تکنیکال دیتا علمی:</strong> میزان ERI (تاب‌آوری هیجانی) او به ۳۸٪ کاهش یافت که بیشتر به دلیل اتلاف وقت روی تست‌های طولانی ژنتیک کنکور بوده است.
                          </p>
                        </>
                      )}
                      
                      {selectedRedFlagStudent === "arash" && (
                        <>
                          <p>
                            📌 <strong className="text-red-700 font-black">وضعیت عارضه‌یابی:</strong> آرش دچار توالی خطاهای مکرر (Conscutive Errors) تحت خستگی شده است. سیستم پایش حدس می‌زند در فاز پایانی شب، استراحت‌های پومودورو را نادیده گرفته است.
                          </p>
                          <p>
                            📊 <strong className="text-indigo-700 font-black">تکنیکال دیتا علمی:</strong> درصد پاسخ‌های غلط او در آزمون ریاضی به ۶۰٪ رسیده است. او مستعد تفکر کمال‌گرایی متزلزل برای تسلیم شدن در کل کتاب ریاضیات دوازدهم است.
                          </p>
                        </>
                      )}

                      {selectedRedFlagStudent === "sara" && (
                        <>
                          <p>
                            📌 <strong className="text-red-700 font-black">وضعیت عارضه‌یابی:</strong> سارا کریمی افت مداوم ۲.۵ ساعت مطالعه روزانه در ۳ روز اخیر نشان داده است. کاینزن درسی او نشان می‌دهد به دلیل بالا رفتن حجم مباحث پویای مشتق، احساس سردرگمی شدید و فرار مطالعاتی دارد.
                          </p>
                          <p>
                            📊 <strong className="text-indigo-700 font-black">تکنیکال دیتا علمی:</strong> آلارم زودهنگام (EWS) سیستم، روند منفی پایداری ساعت مطالعه او را تأیید کرده و در انتظار بازنشانی انگیزه (Motivation Reset) می‌باشد.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-right">
                  <h5 className="text-[10px] text-slate-400 font-black flex items-center gap-1">
                    <Compass size={12} />
                    <span>توصیه مداخله مربی برای تماس تلفنی یا قرار ملاقات:</span>
                  </h5>
                  <div className="bg-emerald-50/50 text-[11px] text-emerald-950 p-3.5 rounded-2xl border border-emerald-100 font-semibold leading-relaxed">
                    ⚙️ {
                      selectedRedFlagStudent === "maryam" ? "تماس تلفنی با رویکرد تشویق به Micro-Goals صورت پذیرد. به او اطمینان بدهید با نادیده گرفتن ژنتیک تا فردا عواقبی نخواهد داشت و به جای آن آزمون‌های ساده‌تر را به او پیشنهاد بدهید." :
                      selectedRedFlagStudent === "arash" ? "برای آرش تبیین کنید افت عملکرد به علت خستگی ذهنی است نه ضعف هوش وی. او را متعهد به پومودوروی منظم و حذف کمال‌گرایی کاذب در حل تست کنید." :
                      "توصیه می‌شود سریعاً دکمه «خرد کردن هدف» اهداف ۲۴ ساعت آینده سارا را در پرتکل فشار او از راه دور اعمال کنید تا حس اعتمادبه‌نفس مفقوده او مجدداً بازیابی گردد."
                    }
                  </div>
                </div>
              </div>

              {/* Action Buttons for Counselor */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4">
                <span className="text-[11px] text-slate-400 font-black flex items-center gap-1.5">
                  <Volume2 size={12} />
                  <span>آماده تماس فوری درگاه ترنم مهر</span>
                </span>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      alert(`درخواست مداخله همدلانه و ارسال پیامک فوری به شماره داوطلب (${
                        selectedRedFlagStudent === "maryam" ? "مریم احمدی" : 
                        selectedRedFlagStudent === "arash" ? "آرش صادقی" : "سارا کریمی"
                      }) با موفقیت ارسال شد.`);
                      addSystemLog("ارسال مداخله پیامکی", student.name, `ارسال پیام عاطفی/حمایتی به داوطلب وضعیت قرمز`);
                    }}
                    className="py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-sm transition-all"
                  >
                    ارسال پیامک همدلانه خودکار
                  </button>
                  <button
                    onClick={() => {
                      alert(`در کادر ویژه مشاور، رزرو تماس امن با مریم احمدی برای ساعت ۱۷:۰۰ الی ۱۷:۱۵ ثبت شد.`);
                      addSystemLog("رزرو تماس مشاور", student.name, "رزرو تماس برای دانش‌آموز وضعیت بحرانی");
                    }}
                    className="py-2 px-4 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-black shadow-sm transition-all animate-pulse"
                  >
                    📞 تماس فوری مشاور
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL / BOTTOM SLIDE WINDOW FOR DYNAMIC "حالم خوب نیست" SELF REPORT EMERGENCY */}
      <AnimatePresence>
        {isSelfReportOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSelfReportOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[1001]"
            />
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="fixed bottom-0 left-0 right-0 max-w-4xl mx-auto bg-white rounded-t-[40px] shadow-2xl border-t border-slate-200 z-[1002] p-6 md:p-8 text-right overflow-y-auto max-h-[90vh] font-sans"
              id="self-report-emergency-modal"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-150 mb-6">
                <button
                  onClick={() => setIsSelfReportOpen(false)}
                  className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition cursor-pointer"
                >
                  ✕
                </button>
                <div className="flex items-center gap-2.5 justify-start">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
                  <h3 className="font-sans font-black text-slate-900 text-lg sm:text-xl flex items-center gap-2">
                    <HeartPulse className="text-red-500" size={24} />
                    <span>پشتیبانی و همیار روانی کنکور (اورژانس اضطراب)</span>
                  </h3>
                </div>
              </div>

              {/* STATE 1: GREET & SELECT FEELING */}
              {reportState === "initial" && (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-5 rounded-2xl leading-relaxed text-slate-700 text-xs sm:text-sm font-semibold space-y-2">
                    <p>
                      🌸 <strong>داوطلب پرتلاش و صبور؛</strong>
                    </p>
                    <p>
                      کنکور سراسری یک مارتن روحی و علمی است. افت، خستگی، ناامیدی و اضطراب بخش کاملاً طبیعی از این مسیر پر فراز و فرود است. ما معتقدیم راندمان ذهنِ آرام چند برابر ذهن مضطرب است. اینجا قرار نیست کسی تو را سرزنش کند.
                    </p>
                    <p>
                      لطفاً انتخاب کن که الان در چه وضعیتی قرار داری تا فوراً سیستم مداخله متناسب با شرایطت را آغاز کنیم:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selfReportFeelings.map((feel) => (
                      <button
                        key={feel.id}
                        onClick={() => handleSelfReport(feel.id)}
                        className={`p-5 rounded-3xl border-2 hover:border-indigo-400 hover:bg-indigo-50/20 text-right transition-all duration-300 cursor-pointer flex gap-4 items-start ${feel.color}`}
                      >
                        <span className="text-3xl shrink-0 mt-1">{feel.icon}</span>
                        <div className="space-y-1">
                          <span className="text-xs font-black block">{feel.label}</span>
                          <span className="text-[10px] text-slate-400 block font-semibold">کلیک جهت دریافت مداخله فوری روحی/آموزشی</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 font-semibold">
                    <span>ثبت این داده‌ها کاملاً محرمانه است و فقط به مشاور ارشد ارجاع داده می‌شود.</span>
                    <button 
                      onClick={() => setIsSelfReportOpen(false)}
                      className="text-indigo-600 hover:text-indigo-800 font-black cursor-pointer"
                    >
                      بستن پنجره
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 2: BREATHING REGIME FOR HIGH ANXIETY */}
              {reportState === "breathing" && (
                <div className="space-y-6 flex flex-col items-center justify-center py-6 text-center">
                  
                  <div className="max-w-md space-y-2">
                    <span className="text-xs bg-red-100 text-red-800 font-black px-2.5 py-1 rounded-lg">شگردهای آرامش متمرکز کادربندی‌شده</span>
                    <h4 className="text-base font-black text-slate-800">آموزش تنفسی ۴-۴-۴ جهت مهار استرس تپش قلب</h4>
                    <p className="text-xs text-slate-550 leading-relaxed font-semibold text-center">
                      سیستم پاراسمپاتیک شما با دم آرام، حبس کوتاه و بازدم عمیق فعال شده و سطح هورمون کورتیزول خون فوراً کاش خواهد یافت. به پالس دایره مرکز توجه کرده و با هم تنفس کنیم:
                    </p>
                  </div>

                  {/* Pulsing Breathing Visualizer Ring */}
                  <div className="py-8 flex flex-col items-center justify-center relative w-full max-w-sm h-64">
                    
                    {/* Pulsing Circles */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={breathStage}
                        animate={{
                          scale: breathStage === "inhale" ? [1, 2.1] : 
                                 breathStage === "hold" ? 2.1 :
                                 breathStage === "exhale" ? [2.1, 1] : 1
                        }}
                        transition={{
                          duration: 4,
                          ease: "easeInOut"
                        }}
                        className={`absolute rounded-full filter blur-xs border ${
                          breathStage === "inhale" ? "bg-cyan-100/40 border-cyan-400/30" :
                          breathStage === "hold" ? "bg-emerald-100/40 border-emerald-400/30" :
                          "bg-amber-100/40 border-amber-400/30"
                        }`}
                        style={{ width: "100px", height: "100px" }}
                      />
                    </AnimatePresence>

                    {/* Central Core Circle */}
                    <div className="w-24 h-24 rounded-full bg-slate-900 border-4 border-white flex flex-col items-center justify-center text-white z-10 shadow-lg relative">
                      <span className="text-[10px] text-indigo-400 uppercase font-black">
                        {breathStage === "inhale" && "دم (بکش)"}
                        {breathStage === "hold" && "حبس (نگه‌دار)"}
                        {breathStage === "exhale" && "بازدم (خالی کن)"}
                        {breathStage === "hold_empty" && "استراحت"}
                      </span>
                      <span className="text-xl font-bold font-mono mt-1">{toPersianNum(breathProgress)}</span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setBreathActive(!breathActive)}
                      className={`py-2 px-6 rounded-2xl text-xs font-black flex items-center gap-1.5 cursor-pointer text-white shadow-md ${
                        breathActive ? "bg-red-600" : "bg-emerald-600"
                      }`}
                    >
                      {breathActive ? <Pause size={14} /> : <Play size={14} />}
                      <span>{breathActive ? "توقف تمرین" : "شروع خودکار ضربان تنفس"}</span>
                    </button>

                    <button
                      onClick={() => setReportState("cbt")}
                      className="py-2 px-6 rounded-2xl text-xs font-black text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                    >
                      برو به گام بازآفرینی دیدگاه شناختی (CBT)
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-400 font-semibold max-w-sm">
                    پیشنهاد کایزنی: ۳ چرخه کامل از این تنفس، ضربان قلب شما را از ۱۱۰ به ۷۲ پالس متعادل عمیق برمی‌گرداند.
                  </p>
                </div>
              )}

              {/* STATE 3: CBT COGNITIVE REFRAMING OF TEST ANXIETY */}
              {reportState === "cbt" && (
                <div className="space-y-6">
                  
                  <div className="bg-gradient-to-l from-indigo-900 to-slate-900 text-white rounded-3xl p-5 text-right space-y-1.5">
                    <div className="flex items-center gap-1.5 justify-start text-amber-400 font-black text-xs">
                      <Brain size={14} />
                      <span>کارت‌های شناخت‌درمانی رفتار متمرکز کنکور (CBT)</span>
                    </div>
                    <h4 className="text-sm font-black">غافلگیری تله‌های ذهنی و فاجعه‌سازی اضطراب</h4>
                    <p className="text-[11px] text-indigo-200 font-semibold leading-relaxed">
                      روانشناسان ترنم مهر اثبات کرده‌اند غالب اضطراب‌ها ناشی از افکار تحریفی کادوپیچ‌شده هستند. با کمال‌گرایی متزلزل خداحافظی و افکار را به کمک عقل بازآفرینی کنیم:
                    </p>
                  </div>

                  {/* CBT Card Display Carousel style */}
                  <div className="bg-slate-50 border border-slate-150 p-6 rounded-3xl space-y-4 text-right">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold pb-2 border-b border-slate-200">
                      <span>کارت عارضه‌یابی {toPersianNum(cbtStep + 1)} از ۳</span>
                      <span className="text-red-650">تحریف فکری شناسایی‌شده: {cbtCards[cbtStep].distortion}</span>
                    </div>

                    <div className="space-y-3.5">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 block">فکر مأیوس‌کننده ذهنت:</span>
                        <p className="text-xs font-bold text-slate-800 leading-relaxed bg-white p-3 rounded-2xl border border-red-100 shadow-sm">
                          {cbtCards[cbtStep].thought}
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-emerald-600 block">بازآفرینی منطقی و علمی مربی ارشد:</span>
                        <p className="text-xs text-slate-900 leading-relaxed bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm font-semibold">
                          ✅ {cbtCards[cbtStep].reframing}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        onClick={() => setCbtStep(prev => (prev > 0 ? prev - 1 : 2))}
                        className="text-xs text-slate-500 hover:text-slate-800 font-black cursor-pointer"
                      >
                        ← کارت قبلی
                      </button>
                      <button
                        onClick={() => setCbtStep(prev => (prev < 2 ? prev + 1 : 0))}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-black cursor-pointer"
                      >
                        کارت بعدی →
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setReportState("breathing")}
                      className="text-xs text-slate-500 hover:text-slate-800 font-black cursor-pointer"
                    >
                      ← برگشت به تمرین تنفسی آرامشبخش
                    </button>
                    
                    <button
                      onClick={() => setReportState("call_scheduled")}
                      className="py-2.5 px-5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl text-xs font-black shadow-md shadow-red-600/10 active:scale-95 transition-all"
                    >
                      نیاز به صحبت دارم؛ درخواست تماس اورژانسی مشاور
                    </button>
                  </div>

                </div>
              )}

              {/* STATE 4: CALL SCHEDULED COMFORT */}
              {reportState === "call_scheduled" && (
                <div className="space-y-6 flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <UserCheck size={32} />
                  </div>
                  
                  <div className="max-w-md space-y-2">
                    <h3 className="text-base font-black text-slate-900">مداخله هوشمند با موفقیت مستقر شد!</h3>
                    <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                      درخواست تماس اضطراری شما در صف ویژه **آلارم سرخ** مشاور ارشد (آقای دکتر سلیمانی) قرار گرفت. بر اساس مانیتورینگ ERI، مشاور شما حداکثر ظرف ۲ ساعت آینده جهت تحلیل مسائل درسی و کاهش فشار روحی با شما تماس حاصل خواهد نمود.
                    </p>
                    <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-2xl border border-emerald-100 leading-normal font-bold">
                      برنامه درسی ریاضیات و زیست‌شناسی سنگین شما برای امروز موقتاً پس‌انداز شد. امروز روی تفریح‌های انفرادی و مانیتورینگ سلامت ذهنی خود تمرکز کنید. خدا قوت رفیق! 💪
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsSelfReportOpen(false);
                      setAnxietyTriageSimulated(true);
                    }}
                    className="py-2.5 px-6 bg-slate-950 text-white rounded-2xl text-xs font-black cursor-pointer hover:bg-slate-850 shadow-md"
                  >
                    متوجه شدم، بازگشت به مرکز فرماندهی
                  </button>
                </div>
              )}

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
