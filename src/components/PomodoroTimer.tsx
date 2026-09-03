import { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, RotateCcw, Coffee, Brain, Clock,
  AlertCircle, Sparkles, CheckCircle2, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BRAND_CONFIG } from "../constants";

type TimerMode = "work" | "shortBreak" | "longBreak";

export default function PomodoroTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<TimerMode>("work");
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  
  // AI Focus Monitoring State
  const [focusProgress, setFocusProgress] = useState(100);
  const [isFocusDropped, setIsFocusDropped] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("در حال آنالیز الگوهای تمرکزی داوطلب...");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const modeConfig = {
    work: { min: 25, label: "زمان مطالعه تمرکزی", icon: <Brain size={18} />, color: "blue", bg: "bg-blue-900" },
    shortBreak: { min: 5, label: "استراحت کوتاه", icon: <Coffee size={18} />, color: "emerald", bg: "bg-emerald-600" },
    longBreak: { min: 15, label: "استراحت طولانی", icon: <CheckCircle2 size={18} />, color: "indigo", bg: "bg-indigo-700" }
  };

  const startTimer = () => setIsActive(true);
  const pauseTimer = () => setIsActive(false);
  
  const resetTimer = () => {
    setIsActive(false);
    setMinutes(modeConfig[mode].min);
    setSeconds(0);
    setFocusProgress(100);
    setIsFocusDropped(false);
  };

  const toggleMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setMinutes(modeConfig[newMode].min);
    setSeconds(0);
    setFocusProgress(100);
    setIsFocusDropped(false);
  };

  // Timer Logic
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        if (seconds > 0) {
          setSeconds(seconds - 1);
        } else if (minutes > 0) {
          setMinutes(minutes - 1);
          setSeconds(59);
        } else {
          // Timer finished
          clearInterval(timerRef.current!);
          setIsActive(false);
          handleTimerCompletion();
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, minutes, seconds]);

  const handleTimerCompletion = () => {
    if (mode === "work") {
      setSessionsCompleted(prev => prev + 1);
      const nextMode = (sessionsCompleted + 1) % 4 === 0 ? "longBreak" : "shortBreak";
      toggleMode(nextMode);
    } else {
      toggleMode("work");
    }
  };

  // Simulated AI Focus Monitoring Logic
  useEffect(() => {
    let focusInterval: NodeJS.Timeout;
    if (isActive && mode === "work") {
      focusInterval = setInterval(() => {
        // Naturally decay focus a bit over time
        setFocusProgress(prev => {
          const decay = Math.random() * 2;
          const next = Math.max(0, prev - decay);
          
          if (next < 30 && !isFocusDropped) {
            triggerFocusWarning();
          }
          return next;
        });

        // AI Message updates
        const messages = [
            "الگوی چشمی و نرخ پلک زدن طبیعی است.",
            "ثبات در پوزیشن بدنی تشخیص داده شد.",
            "تداخل فرکانسی (شبکه‌های اجتماعی) تشخیص داده نشد.",
            "داوطلب در وضعیت جریان (Flow State) قرار دارد.",
            "دفعات جابجایی بین تب‌ها: ۰ نوبت."
        ];
        setAiAnalysis(messages[Math.floor(Math.random() * messages.length)]);
      }, 5000);
    }
    return () => clearInterval(focusInterval);
  }, [isActive, mode, isFocusDropped]);

  const triggerFocusWarning = () => {
    setIsFocusDropped(true);
    setAiAnalysis("⚠️ هشدار هوشمند: تشخیص افت تمرکز و خستگی ذهنی!");
  };

  const recoverFocus = () => {
    setFocusProgress(100);
    setIsFocusDropped(false);
    setAiAnalysis("تمرکز مجدداً بازیابی شد. ادامه دهید!");
  };

  const toPersianNum = (n: number) => n.toLocaleString("fa-IR");
  const formatTime = (m: number, s: number) => {
    const mm = m < 10 ? `۰${toPersianNum(m)}` : toPersianNum(m);
    const ss = s < 10 ? `۰${toPersianNum(s)}` : toPersianNum(s);
    return `${mm}:${ss}`;
  };

  return (
    <div className="bg-white rounded-[28px] md:rounded-[32px] border border-slate-150 shadow-sm overflow-hidden flex flex-col md:flex-row" id="pomodoro-timer-integrated">
      {/* Left: Timer Display */}
      <div className={`p-6 sm:p-8 w-full md:w-1/2 flex flex-col items-center justify-center text-white relative transition-all duration-500 ${modeConfig[mode].bg}`}>
        <div className="absolute top-4 right-6 flex items-center gap-2 opacity-60">
            <Clock size={14} />
            <span className="text-[10px] font-bold">سیستم پومودورو {BRAND_CONFIG.name}</span>
        </div>

        <div className="text-5xl sm:text-6xl font-black font-mono mb-6 tracking-widest drop-shadow-sm select-none">
          {formatTime(minutes, seconds)}
        </div>

        <div className="flex items-center gap-2 mb-8 bg-black/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
          {modeConfig[mode].icon}
          <span className="text-xs font-bold">{modeConfig[mode].label}</span>
        </div>

        <div className="flex items-center gap-4">
          {!isActive ? (
            <button 
              onClick={startTimer}
              className="w-13 h-13 sm:w-14 sm:h-14 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-110 transition shadow-lg cursor-pointer"
            >
              <Play fill="currentColor" size={24} />
            </button>
          ) : (
            <button 
              onClick={pauseTimer}
              className="w-13 h-13 sm:w-14 sm:h-14 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-110 transition shadow-lg cursor-pointer"
            >
              <Pause fill="currentColor" size={24} />
            </button>
          )}
          <button 
            onClick={resetTimer}
            className="w-11 h-11 sm:w-12 sm:h-12 bg-white/20 text-white rounded-full flex items-center justify-center hover:bg-white/30 transition border border-white/20 cursor-pointer"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        {/* Sessions indicator */}
        <div className="mt-8 flex gap-1.5">
          {[1, 2, 3, 4].map(i => (
            <div 
              key={i} 
              className={`w-2.5 h-2.5 rounded-full border border-white/30 transition-all ${
                sessionsCompleted >= i ? "bg-amber-400 border-amber-400 scale-125" : "bg-white/10"
              }`} 
            />
          ))}
        </div>
      </div>

      {/* Right: AI Monitoring & Config */}
      <div className="p-6 sm:p-8 w-full md:w-1/2 flex flex-col justify-between text-right space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-1.5 text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
                  <Sparkles size={14} className="animate-pulse" />
                  <span className="text-[10px] font-black italic">AI Monitoring Active</span>
               </div>
               <h3 className="text-sm font-black text-slate-800">پایش هوشمند تمرکز داوطلب</h3>
            </div>

            {/* Virtual Viewfinder / Camera Simulation */}
            <div className="relative aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 group">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent animate-pulse"></div>
              <div className="absolute top-3 left-3 flex gap-1">
                <div className="w-1 h-1 bg-red-500 rounded-full animate-ping"></div>
                <span className="text-[8px] text-white/50 font-mono">REC</span>
              </div>
              
              {/* Scanlines */}
              <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
              
              {/* AI Detection Label */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                <div className="flex gap-2">
                  <div className="px-1.5 py-0.5 bg-emerald-500/20 rounded text-[7px] text-emerald-400 font-black border border-emerald-500/30">EYE_FIXED</div>
                </div>
                <div className="text-[8px] text-white/60 font-mono tracking-tighter uppercase">STATED: {isActive ? 'TRACKING' : 'READY'}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black">
                  <span className={focusProgress < 30 ? "text-rose-600 animate-pulse" : "text-emerald-700"}>
                      {toPersianNum(Math.round(focusProgress))}٪ تراز تمرکز
                  </span>
                  <span className="text-slate-400">تحلیل آنی پردازش تصویر و رفتار</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                      initial={{ width: "100%" }}
                      animate={{ width: `${focusProgress}%` }}
                      className={`h-full rounded-full transition-colors ${
                          focusProgress > 60 ? "bg-emerald-500" : focusProgress > 30 ? "bg-amber-500" : "bg-rose-500"
                      }`}
                  />
              </div>
            </div>

          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="flex gap-2 items-start">
               <Info size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
               <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  {aiAnalysis}
               </p>
            </div>
          </div>

          <AnimatePresence>
            {isFocusDropped && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-3"
              >
                <div className="flex items-center gap-2 text-rose-700">
                    <AlertCircle size={18} />
                    <span className="text-xs font-black">تشخیص افت عمیق تمرکز!</span>
                </div>
                <p className="text-[11px] text-rose-600 leading-relaxed font-bold">
                    داوطلب گرامی، هوش مصنوعی {BRAND_CONFIG.name} متوجه کاهش سطح هوشیاری و تمرکز شما شده است. پیشنهاد می‌شود ۵ دقیقه استراحت چشم یا تنفس کایزنی انجام دهید.
                </p>
                <div className="flex gap-2">
                    <button 
                        onClick={() => toggleMode("shortBreak")}
                        className="flex-1 bg-white border border-rose-200 text-rose-700 py-2 rounded-xl text-[10px] font-black hover:bg-rose-500 hover:text-white transition cursor-pointer"
                    >
                        پذیرش استراحت هوشمند
                    </button>
                    <button 
                        onClick={recoverFocus}
                        className="flex-1 bg-rose-600 text-white py-2 rounded-xl text-[10px] font-black hover:bg-rose-700 transition cursor-pointer"
                    >
                        تمرکز مجدد (ادامه مطالعه)
                    </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-2">
            <div className="grid grid-cols-3 gap-2">
              <button 
                onClick={() => toggleMode("work")}
                className={`py-2 px-1 rounded-xl text-[10px] font-black border transition cursor-pointer ${
                    mode === "work" ? "bg-blue-50 border-blue-200 text-blue-900" : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                }`}
              >
                مطالعه (۲۵)
              </button>
              <button 
                onClick={() => toggleMode("shortBreak")}
                className={`py-2 px-1 rounded-xl text-[10px] font-black border transition cursor-pointer ${
                    mode === "shortBreak" ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                }`}
              >
                کوتاه (۵)
              </button>
              <button 
                onClick={() => toggleMode("longBreak")}
                className={`py-2 px-1 rounded-xl text-[10px] font-black border transition cursor-pointer ${
                    mode === "longBreak" ? "bg-indigo-50 border-indigo-200 text-indigo-900" : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                }`}
              >
                طولانی (۱۵)
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-slate-50">
            <button 
                onClick={triggerFocusWarning}
                className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 hover:text-rose-600 transition underline underline-offset-4 cursor-pointer"
            >
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                <span>تست دستی هشدار تمرکز (Manual Test)</span>
            </button>
            <span className="text-[9px] font-bold text-slate-400">ورژن ۱.۰.۲ - موتور K-Focus</span>
        </div>
      </div>
    </div>
  );
}
