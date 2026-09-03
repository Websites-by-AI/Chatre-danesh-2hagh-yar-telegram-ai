import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wind, Play, HelpCircle } from "lucide-react";

interface BreathingSessionProps {
  initialPace?: number;
}

const toPersianNum = (n: number | string): string => {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};

export default function BreathingSession({ initialPace = 4 }: BreathingSessionProps) {
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("inhale");
  const [breathTimer, setBreathTimer] = useState(initialPace);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isBreathingActive) {
      timer = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev > 1) return prev - 1;
          
          setBreathPhase((current) => {
            if (current === "inhale") return "hold";
            if (current === "hold") return "exhale";
            if (current === "exhale") return "rest";
            return "inhale";
          });
          return initialPace;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBreathingActive, initialPace]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="breathing-tab-content">
      <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-150 shadow-sm flex flex-col items-center relative overflow-hidden">
        <div className="flex flex-col items-center text-center space-y-2 w-full border-b border-slate-100 pb-4">
          <span className="text-[9px] font-black text-indigo-600 tracking-widest uppercase">Breathing Resonance Chamber</span>
          <h2 className="text-base font-black text-indigo-950 flex items-center gap-1.5 justify-center">
            <Wind size={18} className="text-indigo-500" />
            محفظه تمرین تنفس و کنترل تنش
          </h2>
          <p className="text-[10px] text-slate-400 max-w-lg font-bold">تکنیک تنفس ۴-۴-۴-۴ برای فعال‌سازی سیستم پاراسمپاتیک و بازیابی تمرکز.</p>
        </div>

        <div className="my-12 h-64 flex flex-col items-center justify-center relative w-full">
          <AnimatePresence>
            {isBreathingActive && (
              <motion.div 
                key={breathPhase}
                initial={{ scale: 0.8, opacity: 0.15 }}
                animate={{ 
                  scale: breathPhase === "inhale" ? 1.6 : breathPhase === "exhale" ? 0.9 : breathPhase === "hold" ? 1.4 : 0.8,
                  opacity: breathPhase === "hold" ? 0.25 : 0.08
                }}
                transition={{ duration: initialPace, ease: "easeInOut" }}
                className="absolute w-44 h-44 rounded-full bg-indigo-400 blur-xl pointer-events-none"
              />
            )}
          </AnimatePresence>

          <motion.div 
            animate={{ 
              scale: !isBreathingActive ? 1 : (breathPhase === "inhale" || breathPhase === "hold" ? 1.45 : 0.95)
            }}
            transition={{ duration: initialPace, ease: "easeInOut" }}
            className={`w-36 h-36 rounded-full flex flex-col items-center justify-center text-center shadow-2xl relative z-10 select-none transition-colors duration-500 ${
              !isBreathingActive ? "bg-slate-100 text-slate-500 border border-slate-200" :
              breathPhase === "inhale" ? "bg-indigo-600 text-white shadow-indigo-600/30" :
              breathPhase === "hold" ? "bg-teal-600 text-white shadow-teal-500/30" :
              breathPhase === "exhale" ? "bg-rose-500 text-white shadow-rose-500/30" : "bg-zinc-650 text-white shadow-zinc-500/30"
            }`}
          >
            <span className="text-[10px] font-black tracking-widest uppercase opacity-80 block mb-1">
              {!isBreathingActive ? "آماده" : breathPhase === "inhale" ? "دم عمیق" : breathPhase === "hold" ? "حبس نفس" : breathPhase === "exhale" ? "بازدم عمیق" : "مکث"}
            </span>
            <span className="text-3xl font-black font-sans leading-none block">{toPersianNum(breathTimer)}</span>
          </motion.div>
        </div>

        <button
          onClick={() => setIsBreathingActive(!isBreathingActive)}
          className={`px-8 py-3.5 rounded-full text-xs font-black transition-all shadow-lg active:scale-95 flex items-center gap-2 ${
            isBreathingActive ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-indigo-600 text-white hover:bg-indigo-400"
          }`}
        >
          {isBreathingActive ? "توقف تمرین" : "شروع همگام‌ساز تنفس"}
        </button>
      </div>

      <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4 text-right">
        <h3 className="text-xs font-black text-indigo-950 border-b border-slate-100 pb-3">مکانیسم آرام‌سازی ۴ ثانیه‌ای</h3>
        <div className="space-y-3">
          {[
            { step: 1, label: "دم (Inhale) - ۴ ثانیه", desc: "افزایش اکسیژن‌رسانی", color: "bg-indigo-600" },
            { step: 2, label: "حبس نفس (Hold) - ۴ ثانیه", desc: "هماهنگی ضربان قلب", color: "bg-teal-600" },
            { step: 3, label: "بازدم (Exhale) - ۴ ثانیه", desc: "تخلیه تنش انباشته", color: "bg-rose-500" },
            { step: 4, label: "مکث و توازن (Rest) - ۴ ثانیه", desc: "ایجاد تنفس تعادلی", color: "bg-zinc-650" }
          ].map(i => (
            <div key={i.step} className="p-3 bg-slate-50 rounded-2xl flex gap-3 items-center border border-slate-100">
              <span className={`w-6 h-6 rounded-full text-white font-serif flex items-center justify-center text-[10px] font-black ${i.color}`}>{i.step}</span>
              <div>
                <span className="text-xs font-black text-slate-800 block">{i.label}</span>
                <p className="text-[10px] text-slate-400 font-semibold">{i.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
