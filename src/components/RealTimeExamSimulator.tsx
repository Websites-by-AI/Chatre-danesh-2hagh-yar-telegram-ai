import { useState, useEffect, useRef } from "react";
import { 
  Timer, Brain, AlertTriangle, ShieldAlert, CheckCircle2, XCircle, 
  RefreshCw, Heart, ChevronLeft, Volume2, Sparkles, Award, Zap, HelpCircle, 
  TrendingUp, Compass, Play, FileCheck, ArrowRight, Activity, Smile, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Student, TestTrap } from "../types";
import { saveTestTrap } from "../lib/traps";
import { addSystemLog } from "../lib/syslogs";

interface RealTimeExamSimulatorProps {
  student: Student;
  onRefreshStats?: () => void;
}

interface ExamQuestion {
  id: string;
  subject: string;
  topic: string;
  text: string;
  options: string[];
  correctIdx: number;
  explanation: string;
  trapType: string;
  difficulty: "سخت" | "بسیار سخت" | "المپیاد علمی";
}

const SIMULATED_EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: "SIM-01",
    subject: "زیست‌شناسی",
    topic: "کروماتین و رونویسی ژن‌ها",
    text: "در ساختار کروماتین سلول‌های یوکاریوتی، به هنگام آغاز رونویسی توسط RNA پلیمراز ۲، کدام‌یک از موارد زیر مستقیماً بر باز شدن پیچ خوردگی هیستون‌ها تأثیر گذار است؟",
    options: [
      "۱. متیلاسیون اسیدهای آمینه بازی در دم هیستونی",
      "۲. استیلاسیون لیزین در زنجیره پلی‌پپتیدی هیستون‌ها توسط HAT",
      "۳. غیرفعال شدن کامل آنزیم استیل‌تراز هیستونی در هسته",
      "۴. هیدرولیز پیوندهای فسفودی‌استر کروماتین توسط نوکلئاز کاهنده"
    ],
    correctIdx: 1,
    explanation: "استیلاسیون لیزین در بازوهای انتهای آمینی پروتئین‌های هیستونی توسط آنزیم‌های استیل‌تراز (HAT) بار مثبت هیدرواستاتیکی هیستون‌ها را کاتالیز و کاهش داده و میل ترکیبی آن‌ها به DNA دارای بار منفی را سست می‌کند. این امر ساختار فشرده کرماتین را باز کرده و توالی پروموتر را در دسترس RNA کالیبراتور قرار می‌دهد.",
    trapType: "تله جابجایی متیلاسیون (انسداد رونویسی) با استیلاسیون (فعال‌سازی)",
    difficulty: "بسیار سخت"
  },
  {
    id: "SIM-02",
    subject: "شیمی تخصصی",
    topic: "تعادل‌های شیمیایی و اصل لوشاتلیه",
    text: "در یک ظرف دربسته صلب تحت دمای ثابت، مخلوط تعادلی گازها به صورت N2O4(g) <=> 2NO2(g) با انتالپی مثبت برقرار است. اگر حجم ظرف را ناگهان به نصف کاهش دهیم، پس از برقراری تعادل جدید، تعداد مول‌های N2O4 و غلظت NO2 نسبت به تعادل اولیه به ترتیب چه تغییری خواهند کرد؟",
    options: [
      "۱. افزایش - کاهش",
      "۲. کاهش - افزایش",
      "۳. افزایش - افزایش",
      "۴. بدون تغییر - افزایش"
    ],
    correctIdx: 2,
    explanation: "کاهش حجم به معنای افزایش فشار کل است. طبق اصل لوشاتلیه، تعادل به سمت مول کمتر (سمت چپ یعنی N2O4) می‌رود، پس تعداد مول N2O4 افزایش می‌یابد. اما به دلیل کاهش حجم به نصف، تمام غلظت‌ها در لحظه اول ۲ برابر می‌شوند و پس از شیفت تعادلی نیز غلظت NO2 کاملاً به مقدار اولیه برنمی‌گردد، بنابراین غلظت تعادلی نهایی هر دو گاز نسبت به تعادل اولیه افزایش می‌یابد.",
    trapType: "تله ذهنی متدوال که شیفت تعادل را با غلظت لحظه‌ای کل اشتباه می‌گیرد",
    difficulty: "بسیار سخت"
  },
  {
    id: "SIM-03",
    subject: "فیزیک تخصصی",
    topic: "حرکت دایره‌ای یکنواخت و نیروی مرکزگرا",
    text: "یک اتومبیل به جرم m در یک پیچ افقی بدون شیب خارجی به شعاع R با سرعت ثابت v در حال حرکت است. اگر ضریب اصطکاک تام ایستایی بین لاستیک و آسفالت mu باشد، برای اینکه خودرو بدون لغزش پیچ را رد کند، حداکثر نیروی اصطکاک وارد بر آن چقدر است؟",
    options: [
      "۱. mu * m * g",
      "۲. m * v^2 / R",
      "۳. کمتر از مقدار m * v^2 / R",
      "۴. صفر به دلیل یکنواختی سرعت افقی"
    ],
    correctIdx: 1,
    explanation: "برای حرکت در پیچ بدون لغزش، نیروی واقعی اصطکاک ایستایی دقیقاً به عنوان نیروی مرکزگرا عمل می‌کند، پس برابر با m * v^2 / R است. دقت کنید فرمول mu * m * g مقدار حداکثر اصطکاک ممکن ایستایی در آستانه حرکت است، نه لزوماً نیروی اصطکاک فعلی خودرو در این تندی خاص.",
    trapType: "تله فرمول‌گذاری خطی و استفاده بدون شرط از اصطکاک آستانه سرخوردگی",
    difficulty: "سخت"
  },
  {
    id: "SIM-04",
    subject: "ریاضیات",
    topic: "بهینه‌سازی و کاربرد مشتق",
    text: "می‌خواهیم یک قوطی استوانه‌ای شکل دربسته به حجم مشخص V با کمترین مساحت سطح کل ورق بسازیم. در این حالت بهینه‌ترین نسبت ارتفاع استوانه (h) به شعاع قاعده آن (r) چقدر باید باشد؟",
    options: [
      "۱. h/r = 1",
      "۲. h/r = 2",
      "۳. h/r = sqrt(2)",
      "۴. h/r = 4"
    ],
    correctIdx: 1,
    explanation: "مساحت کل استوانه S = 2*pi*r^2 + 2*pi*r*h است. از رابطه حجم V = pi*r^2*h، ارتفاع را جایگذاری می‌کنیم: h = V/(pi*r^2). پس S = 2*pi*r^2 + 2*V/r. مشتق نسبت به r را می‌گیریم و صفر قرار می‌دهیم: dS/dr = 4*pi*r - 2*V/r^2 = 0. نتیجه می‌دهد V = 2*pi*r^3. با همسان‌سازی فرمول حجم داریم: pi*r^2*h = 2*pi*r^3 که ساده‌سازی آن h = 2r یا نسبت h/r = 2 را به دست می‌دهد.",
    trapType: "تله محاسباتی در حذف صحیح متغیر وابسته و نادیده گرفتن دربسته بودن استوانه",
    difficulty: "بسیار سخت"
  },
  {
    id: "SIM-05",
    subject: "زیست‌شناسی",
    topic: "پتانسیل عمل و کانال‌های کاتیونی نورون",
    text: "در طی فاز دپولاریزاسیون شدید در پتانسیل عمل یک نورون وابران پستانداران، باز شدن ناگهانی دروازه‌های فعال‌سازی کانال‌های وابسته به ولتاژ سدیمی، جریان خالص غشایی را به کدام سمت سوق می‌دهد و چه جابجایی در پتانسیل ایجاد می‌کند؟",
    options: [
      "۱. ورود سدیم به درون سلول - کاهش بار منفی داخل نسبت به بیرون",
      "۲. خروج سدیم به فضای سیناپسی - افزایش قطبیت سلولی",
      "۳. ورود سدیم و خروج همزمان پتاسیم - ثبات موقت گرادیان الکتریکی",
      "۴. خروج یک‌طرفه با پمپ مکانیکی - منفی‌تر شدن سریع سیتوزول"
    ],
    correctIdx: 0,
    explanation: "سدیم به علت داشتن غلظت بالای بیرونی و بار منفی داخل سلول، بلافاصله پس از باز شدن دریچه‌های سدیمی، با جریان خالص شدیدی به داخل جریان یافته و پتانسیل داخل سلول را از منفی به سمت مثبت (تا حدود +۳۰ میلی‌ولت) می‌رساند که این پدیده دپولاریزاسیون نام دارد.",
    trapType: "تله جابجایی فاز بازگشت (پتاسیم) با فاز صعودی دپولاریزاسیون سدیم",
    difficulty: "سخت"
  }
];

export default function RealTimeExamSimulator({ student, onRefreshStats }: RealTimeExamSimulatorProps) {
  // Pressure Modes configuration
  const PRESSURE_MODES = [
    {
      id: "heartbeat",
      name: "حالت بحران ضربان (Heartbeat Rush)",
      desc: "تایمر معکوس فشرده با افزایش سرعت انیمیشن‌ها و صدای بوق هشدار فرضی با هر ثانیه کاهش زمان، شبیه‌سازی استرس شدید صندلی کنکور.",
      timePerQuestion: 30, // 30 seconds per question
      stressMultiplier: 1.5,
      accentColor: "from-rose-500 to-red-650",
      bgClass: "bg-red-50/50 border-red-200"
    },
    {
      id: "survival",
      name: "حالت بقای کایزن (Time Survival)",
      desc: "شروع با ۴۵ ثانیه زمان کل. پاسخ صحیح ۵+ ثانیه هدیه می‌دهد، اما پاسخ نادرست ۱۵- ثانیه غرامت دارد! چقدر می‌توانید دوام بیاورید؟",
      timePerQuestion: 45,
      stressMultiplier: 2.0,
      accentColor: "from-purple-650 to-indigo-900",
      bgClass: "bg-purple-50/40 border-purple-200"
    },
    {
      id: "konkur",
      name: "شبیه‌ساز استاندارد کنکور سراسری",
      desc: "تایم دقیق ۷۵ ثانیه برای هر سوال تخصصی عینا مطابق دفترچه‌های جدید سازمان سنجش بدون هیچ راهنما یا تحلیل تا ثانیه آخر.",
      timePerQuestion: 75,
      stressMultiplier: 1.0,
      accentColor: "from-slate-800 to-slate-950",
      bgClass: "bg-slate-50 border-slate-200"
    }
  ];

  // Component States
  const [activeTab, setActiveTab] = useState<"setup" | "active" | "results">("setup");
  const [selectedMode, setSelectedMode] = useState<string>("heartbeat");
  const [selectedSubject, setSelectedSubject] = useState<string>("همه دروس");
  const [numQuestions, setNumQuestions] = useState<number>(4);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isExamCompleted, setIsExamCompleted] = useState<boolean>(false);
  
  // Timer States
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [survivalTimeTotal, setSurvivalTimeTotal] = useState<number>(45);
  const [simulatedHeartRate, setSimulatedHeartRate] = useState<number>(75);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [soundActive, setSoundActive] = useState<boolean>(false);

  // Filtered Questions Pool
  const [activeQuestions, setActiveQuestions] = useState<ExamQuestion[]>([]);

  // Refs for tracking intervals
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sound triggering function (Generates mock low-freq heartbeat with Web Audio API if allowed)
  const triggerTickSound = (rate: number) => {
    if (!soundActive) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      // High pressure = higher sounding distress pitch slightly
      osc.frequency.setValueAtTime(rate > 110 ? 80 : 60, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      // Fail-safe silently if browser blocks audio
    }
  };

  // Convert English numbers to beautiful Persian numbers
  const toPersianNum = (num: number | string) => {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
  };

  // Initialize and filter questions
  const handleStartExam = () => {
    // Generate filtered pool
    let filtered = [...SIMULATED_EXAM_QUESTIONS];
    if (selectedSubject !== "همه دروس") {
      filtered = filtered.filter(q => q.subject === selectedSubject);
    }
    
    // Take subset up to numQuestions
    filtered = filtered.sort(() => 0.5 - Math.random()).slice(0, Math.min(numQuestions, filtered.length));
    
    if (filtered.length === 0) {
      alert("سوالی بازای این درس یافت نشد. لطفا 'همه دروس' را انتخاب کنید.");
      return;
    }

    setActiveQuestions(filtered);
    setCurrentIdx(0);
    setUserAnswers({});
    setIsExamCompleted(false);
    
    const modeObj = PRESSURE_MODES.find(m => m.id === selectedMode);
    const initialTime = modeObj ? modeObj.timePerQuestion : 30;

    if (selectedMode === "survival") {
      setSurvivalTimeTotal(45);
      setTimeRemaining(45);
    } else {
      setTimeRemaining(initialTime);
    }

    setSimulatedHeartRate(80);
    setIsTimerRunning(true);
    setActiveTab("active");

    addSystemLog(
      "آغاز شبیه‌ساز پرفشار کنکور",
      student.name,
      `کاندید یک آزمون زماندار با متد ${modeObj?.name} پیرامون مباحث تخصصی سازماندهی کرد.`
    );
  };

  // Timer Effect
  useEffect(() => {
    if (!isTimerRunning || activeTab !== "active") {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        // Heart rate scaling based on countdown stress
        let newHr = 75;
        if (selectedMode === "survival") {
          if (prev <= 15) {
            newHr = 130 + (15 - prev) * 2;
          } else {
            newHr = 85 + Math.round((45 - prev) * 0.8);
          }
        } else {
          const modeObj = PRESSURE_MODES.find(m => m.id === selectedMode);
          const maxQTime = modeObj ? modeObj.timePerQuestion : 30;
          const percentageLeft = (prev / maxQTime) * 100;
          if (percentageLeft < 30) {
            newHr = 120 + Math.round((30 - percentageLeft) * 0.8);
          } else if (percentageLeft < 60) {
            newHr = 95 + Math.round((60 - percentageLeft) * 0.4);
          } else {
            newHr = 80;
          }
        }
        setSimulatedHeartRate(Math.min(160, Math.max(70, newHr)));

        // Tick trigger heartbeat audio pitch
        if (prev % 2 === 0 || prev < 10) {
          triggerTickSound(newHr);
        }

        if (prev <= 1) {
          // Time expired
          if (selectedMode === "survival") {
            // End exam instantly in survival
            handleFinishExam(true);
            return 0;
          } else {
            // Standard or heartbeat: Move to next question or auto submit
            if (currentIdx < activeQuestions.length - 1) {
              setCurrentIdx(idx => idx + 1);
              const modeObj = PRESSURE_MODES.find(m => m.id === selectedMode);
              return modeObj ? modeObj.timePerQuestion : 30;
            } else {
              handleFinishExam(true);
              return 0;
            }
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, activeTab, currentIdx, selectedMode, activeQuestions]);

  const handleSelectAnswer = (optionIdx: number) => {
    setUserAnswers(prev => ({ ...prev, [currentIdx]: optionIdx }));

    // Survival mode instant calculation for thrill effect
    if (selectedMode === "survival") {
      const q = activeQuestions[currentIdx];
      const isCorrect = optionIdx === q.correctIdx;
      
      if (isCorrect) {
        setTimeRemaining(prev => Math.min(90, prev + 6));
        // Sparkle / small audio trigger would go here
      } else {
        setTimeRemaining(prev => Math.max(2, prev - 12));
      }

      // Automatically advance in survival mode after a split second
      setTimeout(() => {
        if (currentIdx < activeQuestions.length - 1) {
          setCurrentIdx(prev => prev + 1);
        } else {
          handleFinishExam();
        }
      }, 350);
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx < activeQuestions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      const modeObj = PRESSURE_MODES.find(m => m.id === selectedMode);
      if (selectedMode !== "survival") {
        setTimeRemaining(modeObj ? modeObj.timePerQuestion : 30);
      }
    } else {
      handleFinishExam();
    }
  };

  const handleFinishExam = (isImmediateTimeOut = false) => {
    setIsTimerRunning(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsExamCompleted(true);
    setActiveTab("results");

    // Add logging and auto-save of mistakes
    let correctCount = 0;
    activeQuestions.forEach((q, idx) => {
      const ans = userAnswers[idx];
      const isRight = ans === q.correctIdx;
      if (isRight) {
        correctCount++;
      } else if (ans !== undefined) {
        // Save to mistakes database (Kaizen) automatically to secure retention!
        saveTestTrap({
          questionTitle: q.topic,
          subject: q.subject,
          category: q.difficulty === "المپیاد علمی" ? "زمان‌بر" : "مفهومی",
          trapType: q.trapType,
          correctAnswer: q.options[q.correctIdx],
          userMistake: `گزینه انتخابی اشتباه من در شبیه‌ساز زمان‌دار: ${q.options[ans]}`,
          educationalNote: q.explanation,
          importance: "high"
        });
      }
    });

    const percent = Math.round((correctCount / activeQuestions.length) * 100);
    const estimatedTraz = Math.round(5000 + (percent * 28));

    localStorage.setItem(`arateb_latest_simulator_traz_${student.id}`, estimatedTraz.toString());
    addSystemLog(
      "ثبت نتیجه شبیه‌ساز پرفشار",
      student.name,
      `کاندید آزمون پرفشار را به اتمام رساند. درصد پاسخ‌دهی ثبت شده: ${percent}٪ ، تراز تخمینی شبیه‌سازی: ${estimatedTraz} QEI`
    );

    if (onRefreshStats) onRefreshStats();
  };

  // Re-start / Reset Config
  const handleResetExam = () => {
    setActiveTab("setup");
    setUserAnswers({});
    setCurrentIdx(0);
    setIsExamCompleted(false);
  };

  // Calculations for final report
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let skipped = 0;

  activeQuestions.forEach((q, idx) => {
    const ans = userAnswers[idx];
    if (ans === undefined) skipped++;
    else if (ans === q.correctIdx) totalCorrect++;
    else totalIncorrect++;
  });

  const accuracyPercent = activeQuestions.length > 0 ? Math.round((totalCorrect / activeQuestions.length) * 100) : 0;
  const estimatedTraz = Math.round(4800 + (accuracyPercent * 30) - (totalIncorrect * 85));

  // High pressure custom alert class
  const isEmergencyTime = timeRemaining <= 10 && selectedMode !== "konkur";

  return (
    <div className="bg-white rounded-[32px] border border-slate-150 p-6 md:p-8 shadow-sm space-y-6 text-right" id="high-pressure-exam-simulator">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-rose-50 text-rose-700 text-[10px] rounded-lg font-black border border-rose-150 flex items-center gap-1">
              <Activity size={12} className="animate-pulse" />
              <span>پرتال مهندسی تمرکز کایزن</span>
            </span>
            <span className="p-1 px-2.5 bg-amber-50 text-amber-700 text-[10px] rounded-lg font-black border border-amber-150">
              شبیه‌ساز واقعی
            </span>
          </div>
          <h3 className="font-sans font-black text-slate-900 text-lg sm:text-xl flex items-center gap-2 justify-start">
            ⏱️ شبیه‌ساز آزمون فشرده کایزن (Smart Stress Trainer)
          </h3>
          <p className="text-slate-500 text-xs font-semibold">
            تمرین و مهار اضطراب قلبی با بودجه‌بندی‌های زمانی غیرمنعطف و تحلیل درجا در تله‌های تستی پرتکرار زیست‌شناسی، شیمی، فیزیک و ریاضی کنکور مکرر.
          </p>
        </div>

        {/* Audio controller shortcut */}
        {activeTab === "active" && (
          <button
            onClick={() => setSoundActive(!soundActive)}
            className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              soundActive 
                ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" 
                : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Volume2 size={13} className={soundActive ? "animate-bounce" : ""} />
            <span>{soundActive ? "شبیه‌ساز صوتی فعال" : "فعال‌سازی بوق ضربان"}</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        
        {/* PHASE 1: SETUP PANEL */}
        {activeTab === "setup" && (
          <motion.div 
            key="exam-setup-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between text-slate-650">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl shrink-0 mt-0.5">
                  <Heart size={18} className="text-rose-500 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <strong className="text-xs text-slate-800 block font-black">هدف تکنولوژی کایزن از شبیه‌ساز پرفشار:</strong>
                  <p className="text-[11px] leading-relaxed font-semibold">
                    بر اساس مطالعات فراشناختی دانشگاهی، حل تست‌های سخت در تنگی زمان به مربیان کمک می‌کند ترشح آدرنالین داوطلب را بهینه نموده تا در زمان آزمون واقعی دچار فریز ذهنی نگردد.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option Left: Pick subject and question count */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700">۱. قلمروی تخصصی یا مبحث دفتـرچه:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["همه دروس", "زیست‌شناسی", "شیمی تخصصی", "فیزیک تخصصی", "ریاضیات"].map((subj) => (
                      <button
                        key={subj}
                        onClick={() => setSelectedSubject(subj)}
                        type="button"
                        className={`py-2.5 px-3 rounded-xl text-center transition-all cursor-pointer text-xs font-black border ${
                          selectedSubject === subj
                            ? "bg-indigo-950 border-indigo-950 text-white shadow-xs"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-black text-slate-700">۲. ابعاد سوالات شبیه‌ساز تله‌ساز:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[3, 4, 5].map((count) => (
                      <button
                        key={count}
                        onClick={() => setNumQuestions(count)}
                        type="button"
                        className={`py-2.5 px-3 rounded-xl text-center transition-all cursor-pointer text-xs font-black font-mono border ${
                          numQuestions === count
                            ? "bg-indigo-950 border-indigo-950 text-white shadow-xs"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        {toPersianNum(count)} تست تخصصی
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Option Right: Pick Stress Mode */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-700 block">۳. کالیبراسیون سطح فشار روانی (Stress Levels):</label>
                <div className="space-y-2.5">
                  {PRESSURE_MODES.map((mode) => {
                    const isSelected = selectedMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => {
                          setSelectedMode(mode.id);
                          // Suggest auto audio if high stress selected
                          if (mode.id !== "konkur") setSoundActive(true);
                          else setSoundActive(false);
                        }}
                        type="button"
                        className={`w-full p-4 rounded-2xl border text-right transition-all cursor-pointer flex gap-3 ${
                          isSelected
                            ? `${mode.bgClass} ring-1.5 ring-indigo-650/30`
                            : "bg-white border-slate-200 hover:bg-slate-550/5"
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${mode.accentColor} text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5`}>
                          {mode.id === "heartbeat" ? <Heart size={16} className="animate-pulse" /> : 
                           mode.id === "survival" ? <Zap size={16} /> : <Timer size={16} />}
                        </div>
                        <div className="space-y-1">
                          <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5 justify-start">
                            <span>{mode.name}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-650" />}
                          </span>
                          <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                            {mode.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleStartExam}
                className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-rose-550 to-indigo-950 hover:from-rose-650 hover:to-indigo-900 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
              >
                <Play size={14} className="fill-white" />
                <span>شروع آزمون شبـیه‌سازی شده واقعی (آدرنالین فعال)</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* PHASE 2: ACTIVE EXAM SCREEN */}
        {activeTab === "active" && activeQuestions[currentIdx] && (
          <motion.div 
            key="exam-active-view"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            className={`space-y-6 relative rounded-3xl p-1 transition-all duration-500 ${
              isEmergencyTime ? "ring-4 ring-rose-500/30 animate-pulse" : ""
            }`}
          >
            {/* STRESS HEADER STATUS PANEL */}
            <div className={`border rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 transition-all duration-500 ${
              isEmergencyTime ? "bg-rose-50 border-rose-300 text-rose-900" : "bg-slate-50 border-slate-200"
            }`}>
              {/* Timing Display */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl flex items-center justify-center border shrink-0 ${
                  isEmergencyTime 
                    ? "bg-rose-600 text-white border-rose-700 animate-ping-slow" 
                    : "bg-slate-900 text-white border-slate-850"
                }`}>
                  <Timer size={20} className={isEmergencyTime ? "animate-spin-slow" : ""} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-black">زمان معکوس سوال فعلی:</span>
                  <span className={`font-mono text-xl font-black ${isEmergencyTime ? "text-rose-700" : "text-slate-900"}`}>
                    {toPersianNum(timeRemaining)} ثانیه
                  </span>
                </div>
              </div>

              {/* Heart rate monitor sensor (Simulated) */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-50 border border-rose-100 rounded-xl shrink-0 flex items-center justify-center">
                  <Heart size={18} className="text-rose-600 animate-pulse" style={{ animationDuration: `${60 / simulatedHeartRate}s` }} />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-black">ضربان قلب شبیه‌سازی شده:</span>
                  <span className="text-xs font-black text-rose-700 font-mono block">
                    {toPersianNum(simulatedHeartRate)} BPM {simulatedHeartRate > 115 ? "(عامل اضطراب بالا)" : "(پایدار)"}
                  </span>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="text-xs font-black text-slate-800 bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-xl shadow-2xs">
                مبحث: <span className="text-indigo-650">{activeQuestions[currentIdx].subject}</span> | سوال <span className="font-mono text-sm">{toPersianNum(currentIdx + 1)}</span> از <span className="font-mono text-sm">{toPersianNum(activeQuestions.length)}</span>
              </div>
            </div>

            {/* PROGRESS TRACKER BAR */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>پیشروی کل در دفترچه آزمون</span>
                <span>{toPersianNum(Math.round((currentIdx / activeQuestions.length) * 100))}% تکمیل شده</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className="h-full rounded-full bg-gradient-to-l from-indigo-700 via-rose-500 to-rose-600 transition-all duration-300 shadow-xs"
                  style={{ width: `${((currentIdx + 1) / activeQuestions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* PRESTIGE QUESTION BOARD */}
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200/85 shadow-md shadow-slate-100/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-indigo-950" />
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-3.5">
                    <span className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black">
                      کد ثبت: {activeQuestions[currentIdx].id}
                    </span>
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg text-[9px] font-bold border border-rose-100">
                      پیمانه تله‌ساز: {activeQuestions[currentIdx].difficulty}
                    </span>
                    <span className="text-xs font-black text-slate-400">{activeQuestions[currentIdx].topic}</span>
                  </div>
                  
                  <p className="text-base sm:text-lg font-black text-slate-800 leading-relaxed md:leading-loose text-right">
                    {activeQuestions[currentIdx].text}
                  </p>
                </div>

                {/* Question options */}
                <div className="grid grid-cols-1 gap-3.5">
                  {activeQuestions[currentIdx].options.map((opt, oIdx) => {
                    const isSelected = userAnswers[currentIdx] === oIdx;

                    let btnStyle = "bg-white hover:bg-slate-50 border-slate-250 text-slate-800";
                    let numBadgeStyle = "bg-slate-100 text-slate-700 border-slate-200";

                    if (isSelected) {
                      btnStyle = "bg-indigo-50 border-indigo-650 text-indigo-950 ring-1 ring-indigo-500 shadow-xs";
                      numBadgeStyle = "bg-indigo-650 text-white border-indigo-650";
                    }

                    // Remove option prefix digit for absolute readability
                    let displayLabel = opt;
                    const matchPrefix = opt.match(/^([۱۲۳۴1234]\.\s*)/);
                    if (matchPrefix) {
                      displayLabel = opt.substring(matchPrefix[0].length);
                    }

                    return (
                      <button
                        key={oIdx}
                        onClick={() => handleSelectAnswer(oIdx)}
                        className={`text-right p-4 rounded-xl border text-xs sm:text-sm font-black transition-all duration-150 flex items-center justify-between gap-4 cursor-pointer hover:border-slate-350 hover:scale-[1.002] active:scale-99 ${btnStyle}`}
                      >
                        <div className="flex items-center gap-3 flex-grow">
                          <span className={`w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center border font-mono shrink-0 ${numBadgeStyle}`}>
                            {toPersianNum(oIdx + 1)}
                          </span>
                          <span className="leading-relaxed text-right">{displayLabel}</span>
                        </div>
                        
                        {/* Selected Radio Indicator */}
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-indigo-650 border-indigo-650" : "bg-white border-slate-300"
                        }`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* INTERACTIVE ACTIONS */}
            <div className="flex justify-between items-center bg-slate-50 border border-slate-150 p-5 rounded-2xl">
              <button
                onClick={() => {
                  if (confirm("آیا اطمینان دارید که می‌خواهید جلسه آزمون فشرده را ملغی کنید؟ هیچ اطلاعاتی ذخیره نمی‌گردد.")) {
                    handleResetExam();
                  }
                }}
                className="text-xs font-black text-slate-400 hover:text-red-650 hover:bg-red-50 p-2.5 px-4 rounded-xl transition-all"
              >
                انصراف و خروج اضطراری
              </button>

              {/* Custom manual Next button for non-survival mode */}
              {selectedMode !== "survival" && (
                <button
                  onClick={handleNextQuestion}
                  disabled={userAnswers[currentIdx] === undefined}
                  className="bg-indigo-950 hover:bg-indigo-900 disabled:opacity-40 text-white rounded-xl px-8 py-3 text-xs font-sans font-black transition shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>{currentIdx < activeQuestions.length - 1 ? 'تست تستی بعدی' : 'مشاهده ارزیابی و تراز نهایی'}</span>
                  <ChevronLeft size={14} />
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* PHASE 3: COMPREHENSIVE EXPERIMENT REPORT AND KAIZEN LESSONS */}
        {activeTab === "results" && (
          <motion.div 
            key="exam-finished-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* EXQUISITE SCORE HERO */}
            <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[36px] flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-xl border border-slate-800">
              <div className="absolute top-0 right-0 w-45 h-45 bg-indigo-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl" />
              
              <div className="space-y-3 flex-1 text-right relative z-10">
                <div className="flex items-center gap-2.5 justify-start">
                  <span className="p-1 px-3 bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 text-[9px] font-black rounded-full shadow-sm">
                    ارزیابی شده ✓
                  </span>
                  <h4 className="font-extrabold text-base md:text-lg text-indigo-150 font-sans">
                    بررسی عارضه‌شناسی و موازنه نهایی کارنامه شبیه‌سازی
                  </h4>
                </div>
                <h3 className="font-sans font-black text-2xl text-amber-300">
                  خداقوت {student.name}! شما فرآیند آموزش پرفشار را به پایان رساندید.
                </h3>
                <p className="text-xs leading-relaxed text-slate-300 font-semibold max-w-2xl">
                  تراز هدفی شما بر پایه فرمول {selectedMode === "survival" ? "بقا فرکانسی" : "زمان محدود کنکوری"} محاسبه گردید. پاسخ‌های نادرست شما به منظور مهندسی یادگیری کایزن و تله‌یابی عمیق بلافاصله صادر و در مخزن تله‌های شخصی شما ذخیره گردید تا در مرورهای پارت شبانه به سادگی تثبیت شوند.
                </p>
              </div>

              {/* ESTIMATED TRAZ METRIC CARD */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 text-center min-w-[180px] backdrop-blur-xs relative z-10 shadow-lg">
                <span className="text-[10px] text-indigo-200 block pb-0.5 font-bold uppercase tracking-wider">تراز شبیه‌ساز پرفشار</span>
                <span className="text-2xl font-black text-amber-300 font-mono block mb-1">
                  {toPersianNum(estimatedTraz)} QEI
                </span>
                <span className={`text-[9px] font-black p-1 px-2.5 rounded-lg inline-block ${
                  estimatedTraz > 6200 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/10" : 
                  estimatedTraz > 5200 ? "bg-amber-500/20 text-amber-300 border border-amber-500/10" : "bg-rose-500/20 text-rose-300 border border-rose-500/10"
                }`}>
                  رتبه تخمینی: {toPersianNum(estimatedTraz > 6200 ? "زیر ۱۰۰۰" : estimatedTraz > 5200 ? "بین ۱۰۰۰ تا ۳۰۰۰" : "بالای ۵۰۰۰")}
                </span>
              </div>
            </div>

            {/* DYNAMIC METRICS BOX */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "پاسخ‌های صحیح", val: `${toPersianNum(totalCorrect)} تست`, sub: "موفق بدون تله", icon: <CheckCircle2 className="text-emerald-500" size={16} /> },
                { label: "پاسخ‌های غلط", val: `${toPersianNum(totalIncorrect)} تست`, sub: "به دام افتاده در تله", icon: <XCircle className="text-rose-500" size={16} /> },
                { label: "تست‌های بی‌پاسخ", val: `${toPersianNum(skipped)} تست`, sub: "تصمیم استراتژیک درستی", icon: <HelpCircle className="text-amber-500" size={16} /> },
                { label: "درصد پاسخ‌گویی خالص", val: `${toPersianNum(accuracyPercent)}٪`, sub: "موفقیت نسبی دفترچه", icon: <TrendingUp className="text-indigo-600" size={16} /> }
              ].map((m, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    {m.icon}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold">{m.label}</span>
                    <span className="text-sm font-black text-slate-900 font-mono block">{m.val}</span>
                    <span className="text-[9px] text-slate-400 block font-semibold">{m.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* DYNAMIC ANXIETY LOWERING STRATEGY BASED ON PERFORMANCE */}
            <div className="bg-gradient-to-r from-indigo-50/50 via-white to-amber-50/30 p-5 rounded-2xl border border-indigo-150/60 space-y-4">
              <div className="flex items-center gap-2">
                <Brain size={18} className="text-indigo-600 animate-pulse" />
                <h4 className="text-xs font-black text-slate-900 font-sans">
                  فرمول روان‌شناختی کایزن جهت تمرکززدایی اضطراب و آمادگی روحی:
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                {accuracyPercent >= 75 
                  ? "عالی است! شما ثبات حسی فوق‌العاده‌ای در مهار تله‌های تستی دارید. توصیه می‌شود جهت تثبیت نهایی، مجدداً آزمون‌های فشرده مباحث رونویسی هیستون‌ها را در ساعات انتهایی خستگی ذهنی حل کنید تا سیناپس‌های مرجع برای موقعیت واقعی آماده باقی بمانند."
                  : accuracyPercent >= 40
                  ? "تمرکز شما پایدار بود اما عجله در چند سگمنت باعث افتادن در تله‌های تستی 'جابجایی قیدها یا ماهیت هیستونی' شد. نگران نباشید؛ خطاهای شما به کایزن شخصی اضافه شده است. تکنیک ضربدر منها را حتماً در شروع مطالعه فردا پیاده کنید تا راندمان ذخیره‌سازی رشد کند."
                  : "افت شدید غلظت تمرکز در این تایم بوجود آمده که نشان‌دهنده استرس یا فرسودگی اولیه کورتکس است. مربی ترنم مهر توصیه می‌کند قبل از آزمون مجدد، ۵ دقیقه استنشاق دیافراگمی عمیق انجام دهید و سپس با خرد کردن هر سوال به گزینه‌های جداگانه یک به یک فرآیند حل را از پایه بررسی کنید."}
              </p>
            </div>

            {/* REVIEW DETAILED TEST LOGS */}
            <div className="space-y-4 pt-1">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">تحلیل محتوایی تک به تک دفترچه آزمون فشرده کایزن</h4>
              
              <div className="space-y-3">
                {activeQuestions.map((q, idx) => {
                  const uAns = userAnswers[idx];
                  const isCorrect = uAns === q.correctIdx;
                  
                  return (
                    <div key={idx} className={`p-5 rounded-2xl border text-right space-y-3 ${
                      uAns === undefined ? "bg-slate-50 border-slate-200" :
                      isCorrect ? "bg-emerald-50/40 border-emerald-150" : "bg-rose-50/40 border-rose-150"
                    }`}>
                      <div className="flex flex-wrap justify-between items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center font-mono shrink-0 ${
                            uAns === undefined ? "bg-slate-200 text-slate-700" :
                            isCorrect ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                          }`}>
                            {toPersianNum(idx + 1)}
                          </span>
                          <strong className="text-xs font-black text-slate-800">{q.subject} - {q.topic}</strong>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-extrabold bg-white p-1 px-2.5 rounded-lg border border-slate-150">
                            طراح تله عمیق: {q.trapType}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                        {q.text}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1.5 font-bold">
                        <div className="bg-white/75 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                          <span className="text-slate-400">پاسخ علمی طراح:</span>
                          <span className="text-emerald-700 font-sans text-[10px]">{q.options[q.correctIdx]}</span>
                        </div>
                        <div className="bg-white/75 p-2 rounded-lg border border-slate-100 flex items-center justify-between">
                          <span className="text-slate-400">پاسخ فرستاده شما:</span>
                          <span className={`font-sans text-[10px] ${isCorrect ? "text-emerald-700" : uAns === undefined ? "text-slate-400" : "text-rose-700"}`}>
                            {uAns !== undefined ? q.options[uAns] : "بی‌پاسخ و گذشت زمان"}
                          </span>
                        </div>
                      </div>

                      {/* Diagnostic tip box */}
                      <div className="bg-white/95 p-4 rounded-xl border border-slate-150 text-[11px] space-y-1 font-semibold text-slate-600 leading-relaxed">
                        <div className="flex items-center gap-1.5 text-indigo-950 font-black mb-1.5">
                          <Info size={13} className="text-indigo-600" />
                          <span>تحلیل دقیق و فرمول کایزن تشریحی:</span>
                        </div>
                        <p>{q.explanation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* BUTTONS ROW */}
            <div className="flex justify-end gap-3 pt-3">
              <button
                onClick={handleResetExam}
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl cursor-pointer transition shadow-2xs"
              >
                پیکربندی مجدد و آغاز دوباره شبیه‌ساز
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
