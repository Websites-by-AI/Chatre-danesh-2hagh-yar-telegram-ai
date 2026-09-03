import React, { useState, useEffect } from "react";
import { Student } from "../types";
import { 
  Zap, Clock, Target, Play, Pause, RefreshCw, AlertTriangle, CheckCircle, XCircle, Heart, Shield, RefreshCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StressTrainerProps {
  student: Student;
}

interface TrapQuestion {
  id: number;
  subject: string;
  question: string;
  options: string[];
  correctIdx: number;
  trapExplanation: string;
  tip: string;
}

export default function SmartStressTrainerView({ student }: StressTrainerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes for intense training
  const [selectedTopic, setSelectedTopic] = useState("زیست‌شناسی");
  const [heartRate, setHeartRate] = useState(72);
  const [userStress, setUserStress] = useState<"normal" | "high" | "critical">("normal");
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [breathingMode, setBreathingMode] = useState(false);
  const [breathingStep, setBreathingStep] = useState<"دم" | "نگه داشتن" | "بازدم">("دم");
  const [breathingTimer, setBreathingTimer] = useState(4);

  // High frequency Konkur traps
  const trapQuestions: TrapQuestion[] = [
    {
      id: 1,
      subject: "زیست‌شناسی",
      question: "کدام گزینه درباره غشای یاخته‌های جانوری کاملاً صحیح است؟",
      options: [
        "همه کربوهیدرات‌های غشا فقط در سطح خارجی آن قرار گرفته‌اند.",
        "پروتئین‌های سراسری غشا همواره با هر دو لایه فسفولیپیدی در تماس هستند.",
        "کلسترول موجود در غشا، سیالیت غشا را در دمای بالا افزایش می‌دهد.",
        "هر مولکولی که به غشا متصل است دارای بار الکتریکی مثبت می‌باشد."
      ],
      correctIdx: 0,
      trapExplanation: "تله‌ی طراح با استفاده از قیدهای مطلق! گزینه ۱ کاملاً درست است چون در کتاب درسی زیست‌شناسی قید شده که کربوهیدرات‌ها منحصراً در سطح خارجی غشا متصل به پروتئین‌ها یا لیپیدها قرار دارند. گزینه ۲ کلمه 'همواره' تله است زیرا برخی پروتئین‌های سراسری ممکن است فقط به یک سمت متمایل باشند.",
      tip: "تکنیک کایزن: کلمات مطلق مانند 'همه' و 'همواره' همیشه تله نیستند، بلکه باید با دقت علمی کتاب سنجیده شوند."
    },
    {
      id: 2,
      subject: "شیمی",
      question: "کدام عامل در تعیین سرعت واکنش‌های شیمیایی نقش کلیدی دارد؟",
      options: [
        "غلظت واکنش‌دهنده‌های جامد همواره سرعت واکنش را افزایش می‌دهد.",
        "انرژی فعال‌سازی بالاتر سبب کاهش ثابت سرعت و در نتیجه کاهش سرعت واکنش می‌شود.",
        "افزایش دما فقط بر روی واکنش‌های گرماگیر اثرگذار است.",
        "کاتالیزور با تغییر آنتالپی واکنش مسیر جدیدی ایجاد می‌کند."
      ],
      correctIdx: 1,
      trapExplanation: "گزینه ۴ تله‌ی معروف کنکور است؛ کاتالیزور هرگز آنتالپی واکنش (ΔH) را تغییر نمی‌دهد بلکه انرژی فعال‌سازی را کاهش می‌دهد. گزینه ۱ نیز غلط است زیرا غلظت جامدات در رابطه سرعت واکنش حضور ندارد و ثابت است.",
      tip: "تکنیک کایزن: فرمول‌ها و مفاهیم ثابت مانند پایستگی ΔH را در مغز خود فیکس نگه دارید."
    },
    {
      id: 3,
      subject: "فیزیک",
      question: "متحرکی در مسیری مستقیم با شتاب ثابت حرکت می‌کند. کدام گزاره صحیح است؟",
      options: [
        "اگر جهت شتاب منفی باشد، حرکت متحرک قطعاً کندشونده است.",
        "تغییر جهت حرکت متحرک زمانی رخ می‌دهد که شتاب صفر شود.",
        "اگر علامت سرعت و شتاب یکسان باشد، حرکت تندشونده است.",
        "در شتاب ثابت، مسافت طی شده همواره با جابجایی برابر است."
      ],
      correctIdx: 2,
      trapExplanation: "تله علامت شتاب و سرعت! منفی بودن شتاب به تنهایی به معنای کند شونده بودن نیست (اگر سرعت هم منفی باشد تندشونده است). هم علامت بودن سرعت و شتاب قطعاً نشان‌دهنده تندشونده بودن حرکت است.",
      tip: "تکنیک کایزن: تکیه بر فرمول‌های برداری و عدم تکیه بر حدس‌های شهودی عجولانه در شرایط تنش ثانیه‌ها."
    },
    {
      id: 4,
      subject: "ریاضیات",
      question: "اگر تابع f بر بازه [a, b] پیوسته باشد، کدام گزاره درباره آن درست است؟",
      options: [
        "تابع f قطعاً روی این بازه مشتق‌پذیر است.",
        "تابع f روی این بازه دارای مقادیر ماکزیمم و مینیمم مطلق است.",
        "تابع f همواره صعودی یا نزولی اکید است.",
        "تابع f فاقد هرگونه نقطه بحرانی است."
      ],
      correctIdx: 1,
      trapExplanation: "قضیه مقدار فرین (اکسترمم مطلق): طبق قضیه وایرشتراس، هر تابع پیوسته روی یک بازه بسته و کراندار قطعاً ماکزیمم و مینیمم مطلق خود را می‌پذیرد. پیوستگی ربطی به مشتق‌پذیری یا صعودی/نزولی بودن ندارد.",
      tip: "تکنیک کایزن: قضایای اصلی ریاضی را با فرضیات دقیق (بسته بودن بازه، پیوسته بودن) بشناسید."
    }
  ];

  // Simulated physiological dynamic effects
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        
        // Heart rate increases under time pressure
        setHeartRate(prev => {
          const change = Math.floor(Math.random() * 3) + 1;
          const next = prev + (timeLeft < 30 ? change * 2 : change);
          return Math.min(next, 135);
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  // Handle stress level indicator based on heart rate
  useEffect(() => {
    if (heartRate > 110) {
      setUserStress("critical");
    } else if (heartRate > 90) {
      setUserStress("high");
    } else {
      setUserStress("normal");
    }
  }, [heartRate]);

  // Breathing technique 4-7-8 loop
  useEffect(() => {
    let breathingInterval: NodeJS.Timeout;
    if (breathingMode) {
      breathingInterval = setInterval(() => {
        setBreathingTimer(prev => {
          if (prev <= 1) {
            // Cycle step
            if (breathingStep === "دم") {
              setBreathingStep("نگه داشتن");
              return 7;
            } else if (breathingStep === "نگه داشتن") {
              setBreathingStep("بازدم");
              return 8;
            } else {
              setBreathingStep("دم");
              // Reduce heart rate when completing cycle!
              setHeartRate(h => Math.max(h - 15, 68));
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(breathingInterval);
  }, [breathingMode, breathingStep]);

  const handleAnswer = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedAnswer(idx);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null || isAnswerSubmitted) return;
    setIsAnswerSubmitted(true);
    
    const currentQ = trapQuestions[currentQuestionIdx];
    if (selectedAnswer === currentQ.correctIdx) {
      setScore(s => s + 1);
      setHeartRate(h => Math.max(h - 5, 70));
    } else {
      // Wrong answer causes heart rate bump!
      setHeartRate(h => Math.min(h + 12, 140));
    }
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerSubmitted(false);
    setCurrentQuestionIdx(prev => (prev + 1) % trapQuestions.length);
  };

  const currentQ = trapQuestions[currentQuestionIdx];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 min-h-screen text-slate-100" dir="rtl">
      
      {/* Immersive Dark Header */}
      <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6" id="stress-header">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-red-500/15 text-red-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-red-500/20">تثبیت تمرکز در تنش شدید</span>
            <span className="bg-amber-500/15 text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-500/20">کنترل کورتیزول ذهنی</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <Zap className="text-amber-400 animate-pulse" size={28} />
            شبیه‌ساز آزمون فشرده کایزن (Smart Stress Trainer)
          </h2>
          <p className="text-xs text-slate-400 font-bold mt-2 leading-relaxed max-w-2xl">
            تمرین مدیریت تنش و مهار اضطراب قلبی با بودجه‌بندی زمانی فوق‌العاده سخت و فشرده. در این شبیه‌ساز، سوالات تله‌خیز کنکور سراسری همراه با پایش ضربان قلب شبیه‌سازی شده و تکنیک‌های آرام‌سازی تنفس کایزن قرار گرفته است.
          </p>
        </div>

        {/* Real-time Simulated Heart Rate Sensor */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center gap-4 shrink-0 shadow-inner">
          <div className="relative">
            <Heart className={`text-red-500 fill-red-500 ${isRunning ? 'animate-ping absolute opacity-50' : ''}`} size={28} />
            <Heart className="text-red-500 fill-red-500 relative" size={28} />
          </div>
          <div>
            <span className="block text-[9px] font-black text-slate-500">ضربان قلب شبیه‌سازی شده</span>
            <span className="text-lg font-mono font-black text-white flex items-baseline gap-1">
              {heartRate} <span className="text-[10px] text-slate-400">BPM</span>
            </span>
          </div>
          <div className="border-r border-slate-800 pr-3">
            <span className="block text-[9px] font-black text-slate-500">سطح هورمون تنش</span>
            <span className={`text-xs font-black ${userStress === "critical" ? 'text-red-400' : userStress === "high" ? 'text-amber-400' : 'text-emerald-400'}`}>
              {userStress === "critical" ? "بحرانی 🚨" : userStress === "high" ? "بالا ⚡" : "ایده‌آل ✨"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Test Simulator Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            {/* Top Bar inside Simulator */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6 text-xs font-bold text-slate-400">
              <span className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                مبحث: {currentQ.subject}
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-amber-400" />
                  زمان باقیمانده مرحله فشرده:
                </span>
                <span className="font-mono font-black text-sm text-amber-400 bg-slate-950 px-3 py-1 rounded">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Simulated Test Question */}
            <div className="space-y-6">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
                <p className="text-sm md:text-base font-black leading-relaxed text-white">
                  {currentQ.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((opt, idx) => {
                  let borderStyle = "border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300";
                  if (selectedAnswer === idx) {
                    borderStyle = "border-indigo-500 bg-indigo-950/40 text-white";
                  }
                  if (isAnswerSubmitted) {
                    if (idx === currentQ.correctIdx) {
                      borderStyle = "border-emerald-500 bg-emerald-950/40 text-emerald-200";
                    } else if (selectedAnswer === idx) {
                      borderStyle = "border-red-500 bg-red-950/40 text-red-200";
                    } else {
                      borderStyle = "border-slate-800 opacity-40 bg-slate-950 text-slate-500";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={isAnswerSubmitted}
                      className={`w-full p-4 rounded-xl text-xs md:text-sm text-right transition-all flex items-center justify-between border cursor-pointer ${borderStyle}`}
                    >
                      <span>{idx + 1}. {opt}</span>
                      {isAnswerSubmitted && idx === currentQ.correctIdx && <CheckCircle size={16} className="text-emerald-400 shrink-0" />}
                      {isAnswerSubmitted && selectedAnswer === idx && idx !== currentQ.correctIdx && <XCircle size={16} className="text-red-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Action Bar inside question */}
              <div className="flex flex-col md:flex-row justify-between items-center pt-4 gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsRunning(!isRunning)}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition cursor-pointer ${isRunning ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
                  >
                    {isRunning ? <><Pause size={14} /> توقف تایمر فشرده</> : <><Play size={14} /> شروع تست زمان‌دار</>}
                  </button>
                  <button
                    onClick={submitAnswer}
                    disabled={selectedAnswer === null || isAnswerSubmitted}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl disabled:opacity-40 transition cursor-pointer"
                  >
                    ثبت نهایی گزینه
                  </button>
                </div>

                {isAnswerSubmitted && (
                  <button
                    onClick={nextQuestion}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
                  >
                    تست بعدی <Clock size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Answer Explanation & Psychological analysis of the Trap */}
            <AnimatePresence>
              {isAnswerSubmitted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-3"
                >
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle size={16} />
                    <span className="text-xs font-black">تحلیل تله طراح سوال کنکور سراسری</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-bold">
                    {currentQ.trapExplanation}
                  </p>
                  <div className="p-3 bg-indigo-950/25 border border-indigo-900/40 rounded-xl text-[11px] text-indigo-300 font-bold">
                    {currentQ.tip}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

        {/* Psychological Breathing Guide Side Panel */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6">
            <h3 className="text-xs md:text-sm font-black text-white flex items-center gap-2">
              <Shield className="text-indigo-400 animate-pulse" size={18} />
              متد آرام‌سازی ضربان قلب ۴-۷-۸ کایزن
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed font-bold">
              در زمان تنش و افزایش ضربان قلب، دکمه زیر را فشار دهید و با راهنمای دایره تنفسی کایزن همگام شوید تا کارایی مغزتان فوراً احیا شود.
            </p>

            <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800/80">
              {breathingMode ? (
                <div className="flex flex-col items-center space-y-6">
                  {/* Dynamic Expanding Circle */}
                  <motion.div 
                    animate={{ 
                      scale: breathingStep === "دم" ? 1.4 : breathingStep === "نگه داشتن" ? 1.4 : 0.8 
                    }}
                    transition={{ 
                      duration: breathingStep === "دم" ? 4 : breathingStep === "نگه داشتن" ? 0 : 8,
                      ease: "easeInOut"
                    }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center font-black text-xs text-slate-950 ${breathingStep === "دم" ? 'bg-emerald-400' : breathingStep === "نگه داشتن" ? 'bg-amber-400' : 'bg-indigo-400'}`}
                  >
                    {breathingStep}
                  </motion.div>
                  <div className="text-center">
                    <span className="block text-[10px] font-black text-slate-500 mb-1">زمان باقیمانده گام</span>
                    <span className="text-sm font-mono font-black text-white">{breathingTimer} ثانیه</span>
                  </div>
                  <button
                    onClick={() => { setBreathingMode(false); }}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-black text-[10px] rounded-lg transition"
                  >
                    توقف تنفس درمانی
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setBreathingMode(true); setBreathingStep("دم"); setBreathingTimer(4); }}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  <Heart size={16} />
                  فعال‌سازی متد تنفس همگام ۴-۷-۸
                </button>
              )}
            </div>
          </div>

          {/* Training Scores Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">امتیاز مهار استرس کایزن</h4>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">تست‌های با موفقیت پاسخ داده شده:</span>
              <span className="text-xs font-black text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-900/30">
                {score} تست
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3">
              <span className="text-xs text-slate-300">راندمان مهار استرس:</span>
              <span className="text-xs font-black text-indigo-400 bg-indigo-950/50 px-2.5 py-1 rounded-md border border-indigo-900/30">
                {(score * 25).toFixed(0)}٪
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
