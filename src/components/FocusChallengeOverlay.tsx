import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Zap, Timer, Check } from "lucide-react";

interface FocusChallengeOverlayProps {
  isActive: boolean;
  onClose: () => void;
  onComplete: (score: number) => void;
}

export default function FocusChallengeOverlay({ isActive, onClose, onComplete }: FocusChallengeOverlayProps) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  const toPersianNum = (num: number | string) => {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-slate-950 flex flex-col items-center justify-center p-6 text-right font-sans"
      >
        <div className="absolute top-8 right-8 left-8 flex justify-between items-center">
           <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
           >
             <X size={20} />
           </button>
           <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-black block">امتیاز کایزن</span>
                <span className="text-sm font-black text-amber-400 font-mono">+{toPersianNum(score)}</span>
              </div>
              <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Zap size={24} />
              </div>
           </div>
        </div>

        <div className="max-w-xl w-full space-y-12">
           {step === 0 && (
             <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center space-y-8"
             >
                <div className="w-32 h-32 bg-blue-600 rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/40 relative">
                   <Timer size={64} className="text-white animate-pulse" />
                   <div className="absolute -top-2 -right-2 bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-black border-2 border-slate-950">فوری</div>
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-black text-white">چالش تمرکز ۵ دقیقه‌ای</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    داوطلب گرامی، مربی کایزن تشخیص داده که الان بهترین زمان برای تست پایداری ذهنی شماست.
                    <br/>
                    آماده‌ای ۲ سوال مفهومی زیست‌شناسی رو زیر ۱ دقیقه جواب بدی؟
                  </p>
                </div>
                <button 
                  onClick={() => setStep(1)}
                  className="w-full py-5 bg-white text-blue-950 rounded-3xl text-lg font-black shadow-xl hover:bg-blue-50 transition-all active:scale-95 cursor-pointer"
                >
                  بزن بریم!
                </button>
             </motion.div>
           )}

           {step === 1 && (
             <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="space-y-8"
             >
                <div className="space-y-4">
                  <span className="text-blue-400 text-xs font-black">سوال ۱ از ۲</span>
                  <h3 className="text-xl font-bold text-white leading-relaxed">
                    کدام یک از گزینه‌های زیر در مورد غشای یاخته‌ای «نادرست» است؟
                  </h3>
                </div>
                <div className="grid gap-3">
                  {[
                    "بخش اعظم آن را فسفولیپیدها تشکیل می‌دهند.",
                    "کربوهیدرات‌ها فقط در سطح خارجی غشا دیده می‌شوند.",
                    "کلسترول در غشای تمام یاخته‌های زنده وجود دارد.",
                    "پروتئین‌ها می‌توانند در سراسر عرض غشا قرار بگیرند."
                  ].map((opt, i) => (
                    <button 
                      key={i}
                      onClick={() => {
                        if (i === 2) setScore(s => s + 50);
                        setStep(2);
                      }}
                      className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-right text-slate-200 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer font-medium"
                    >
                      <span className="ml-3 text-white/20 font-mono">{toPersianNum(i + 1)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
             </motion.div>
           )}

           {step === 2 && (
             <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-center space-y-8"
             >
                <div className="w-24 h-24 bg-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                   <Check size={48} className="text-white" />
                </div>
                <div className="space-y-3">
                  <h2 className="text-3xl font-black text-white">عالی بود!</h2>
                  <p className="text-slate-400 text-sm">
                    تمرکز شما در سطح «رتبه برتر» ارزیابی شد. 
                    ۵۰ امتیاز کایزن به کیف پول آموزشی شما اضافه شد.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      onComplete(score);
                      onClose();
                      setStep(0);
                      setScore(0);
                    }}
                    className="w-full py-5 bg-white text-blue-950 rounded-3xl text-lg font-black shadow-xl hover:bg-blue-50 transition-all cursor-pointer"
                  >
                    پایان چالش مربی
                  </button>
                </div>
             </motion.div>
           )}
        </div>
        
        <div className="absolute inset-0 z-[-1] opacity-20 pointer-events-none">
           <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[120px]" />
           <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[120px]" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
