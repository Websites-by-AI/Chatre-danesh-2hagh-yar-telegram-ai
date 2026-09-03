import React, { useState, useEffect } from "react";
import { 
  Target, TrendingUp, Sparkles, Edit2, Check, Award, 
  LayoutList, CheckCircle, Brain, RefreshCw, AlertCircle, HelpCircle, Flame, PlusCircle, RotateCcw,
  Clock, Hourglass
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Student } from "../types";
import { BRAND_CONFIG } from "../constants";

export interface AIInsight {
  likelihood: number;
  text: string;
  recommendations: string[];
  detailedMetrics?: {
    label: string;
    value: string;
    status: "success" | "warning" | "danger";
  }[];
}

interface GoalTrackerProps {
  student: Student;
  currentTraz?: number;
  currentPercentage?: number;
  key?: string | number;
}

export default function GoalTracker({ student, currentTraz = 5575, currentPercentage = 59 }: GoalTrackerProps) {
  // Goals State (تراز -> شاخص کارایی کیفیت QEI)
  const [targetTraz, setTargetTraz] = useState<number>(6200);
  const [targetGrowth, setTargetGrowth] = useState<number>(10); // بهبود تراز
  const [latestQuizScore, setLatestQuizScore] = useState<number>(63); // عیار آخرین نمونه تستی کیفیت (کوییز)
  
  // تاریخچه سنجش تحصیلی {BRAND_CONFIG.examProvider}
  const [trazHistory, setTrazHistory] = useState<any[]>([]);
  const [showAddTrazForm, setShowAddTrazForm] = useState<boolean>(false);
  const [newExamLabel, setNewExamLabel] = useState<string>("");
  const [newExamActual, setNewExamActual] = useState<string>("");

  // AI Insights State
  const [aiInsight, setAiInsight] = useState<AIInsight | null>(null);
  const [loadingInsight, setLoadingInsight] = useState<boolean>(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  // UI State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [tempTraz, setTempTraz] = useState<number>(6200);
  const [tempGrowth, setTempGrowth] = useState<number>(10);
  const [quizInput, setQuizInput] = useState<string>("63");
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [quizSuccess, setQuizSuccess] = useState<boolean>(false);
  const [velocityPreset, setVelocityPreset] = useState<"slow" | "normal" | "intensive">("normal");
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [targetEstDate, setTargetEstDate] = useState<Date | null>(null);
  const [actualWeeklyHours, setActualWeeklyHours] = useState<number>(42); // ساعت مطالعه هفتگی داوطلب

  // بارگذاری داده‌های هدف‌گذاری از حافظه محلی
  useEffect(() => {
    let loadedTarget = 6200;
    const saved = localStorage.getItem(`arateb_goals_${student.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.targetTraz) {
          setTargetTraz(parsed.targetTraz);
          setTempTraz(parsed.targetTraz);
          loadedTarget = parsed.targetTraz;
        }
        if (parsed.targetGrowth) {
          setTargetGrowth(parsed.targetGrowth);
          setTempGrowth(parsed.targetGrowth);
        }
        if (parsed.latestQuizScore !== undefined) {
          setLatestQuizScore(parsed.latestQuizScore);
          setQuizInput(parsed.latestQuizScore.toString());
        }
        if (parsed.lastInsight) {
          setAiInsight(parsed.lastInsight);
        } else {
          setAiInsight(null);
        }
      } catch (e) {
        console.error("Failed to parse saved law study goals", e);
      }
    } else {
      setTargetTraz(6200);
      setTempTraz(6200);
      setTargetGrowth(10);
      setTempGrowth(10);
      setLatestQuizScore(63);
      setQuizInput("63");
      setAiInsight(null);
    }

    const savedTrend = localStorage.getItem(`arateb_history_${student.id}`);
    let loadedHistory = null;
    if (savedTrend) {
      try {
        loadedHistory = JSON.parse(savedTrend);
      } catch (e) {
        console.error(e);
      }
    }

    if (!loadedHistory || loadedHistory.length === 0) {
      loadedHistory = [
        { examName: "سنجش فروردین", actualTraz: 5120, targetTraz: Math.max(5000, loadedTarget - 400) },
        { examName: "سنجش اردیبهشت ۱", actualTraz: 5280, targetTraz: Math.max(5100, loadedTarget - 300) },
        { examName: "سنجش اردیبهشت ۲", actualTraz: 5350, targetTraz: Math.max(5200, loadedTarget - 200) },
        { examName: "پایش نیمه‌کاره", actualTraz: 5500, targetTraz: Math.max(5300, loadedTarget - 100) },
        { examName: "پایش هفتگی جاری", actualTraz: currentTraz, targetTraz: loadedTarget }
      ];
      localStorage.setItem(`arateb_history_${student.id}`, JSON.stringify(loadedHistory));
    }
    setTrazHistory(loadedHistory);
    setNewExamLabel(`پایش هفتگی ${toPersianNum(loadedHistory.length + 1)}`);

    const storedHours = localStorage.getItem(`arateb_hours_${student.id}`);
    if (storedHours) {
      setActualWeeklyHours(parseInt(storedHours));
    } else {
      setActualWeeklyHours(42);
    }
  }, [student.id]);

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    setTargetTraz(tempTraz);
    setTargetGrowth(tempGrowth);
    setIsEditing(false);

    const scaledHistory = trazHistory.map((item, idx) => {
      const distance = (trazHistory.length - 1 - idx) * 100;
      return {
        ...item,
        targetTraz: Math.max(5000, tempTraz - distance)
      };
    });
    setTrazHistory(scaledHistory);
    localStorage.setItem(`arateb_history_${student.id}`, JSON.stringify(scaledHistory));

    const dataToSave = {
      targetTraz: tempTraz,
      targetGrowth: tempGrowth,
      latestQuizScore,
      lastInsight: aiInsight
    };
    localStorage.setItem(`arateb_goals_${student.id}`, JSON.stringify(dataToSave));
    
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleLogQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    const scoreVal = parseFloat(quizInput);
    if (!isNaN(scoreVal) && scoreVal >= 0 && scoreVal <= 100) {
      setLatestQuizScore(scoreVal);
      
      const dataToSave = {
        targetTraz,
        targetGrowth,
        latestQuizScore: scoreVal,
        lastInsight: aiInsight
      };
      localStorage.setItem(`arateb_goals_${student.id}`, JSON.stringify(dataToSave));
      
      setQuizSuccess(true);
      setTimeout(() => setQuizSuccess(false), 3000);
    }
  };

  const handleAddNewTrazUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const actualVal = parseInt(newExamActual);
    if (!isNaN(actualVal) && actualVal >= 3000 && actualVal <= 9500) {
      const newItem = {
        examName: newExamLabel,
        actualTraz: actualVal,
        targetTraz: targetTraz
      };

      let updated = [...trazHistory, newItem];
      if (updated.length > 5) {
        updated = updated.slice(updated.length - 5);
      }

      setTrazHistory(updated);
      localStorage.setItem(`arateb_history_${student.id}`, JSON.stringify(updated));

      setNewExamLabel(`پایش نهایی ${toPersianNum(updated.length + 1)}`);
      setNewExamActual("");
      setShowAddTrazForm(false);
    }
  };

  const handleResetHistory = () => {
    if (confirm("آیا مایلید تاریخچه مانیتورینگ کارایی را به حالت اولیه ترنم مهر بازگردانید؟")) {
      const defaultHistory = [
        { examName: "سنجش فروردین", actualTraz: 5120, targetTraz: Math.max(5000, targetTraz - 400) },
        { examName: "سنجش اردیبهشت ۱", actualTraz: 5280, targetTraz: Math.max(5100, targetTraz - 300) },
        { examName: "سنجش اردیبهشت ۲", actualTraz: 5350, targetTraz: Math.max(5200, targetTraz - 200) },
        { examName: "پایش نیمه‌کاره", actualTraz: 5500, targetTraz: Math.max(5300, targetTraz - 100) },
        { examName: "پایش هفتگی جاری", actualTraz: currentTraz, targetTraz: targetTraz }
      ];
      setTrazHistory(defaultHistory);
      localStorage.setItem(`arateb_history_${student.id}`, JSON.stringify(defaultHistory));
      setNewExamLabel(`پایش هفتگی ${toPersianNum(defaultHistory.length + 1)}`);
      setShowAddTrazForm(false);
    }
  };

  // دریافت پیش‌بینی و توصیه‌های کایزن با بهره‌برداری از هوش مصنوعی سرور
  const fetchGoalInsight = async () => {
    setLoadingInsight(true);
    setInsightError(null);

    const fetchBtnWithRetry = async (url: string, options?: RequestInit, retries = 3, delay = 600): Promise<Response> => {
      try {
        const response = await fetch(url, options);
        if (!response.ok && retries > 0 && [500, 502, 503, 504].includes(response.status)) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchBtnWithRetry(url, options, retries - 1, delay * 1.5);
        }
        return response;
      } catch (err) {
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchBtnWithRetry(url, options, retries - 1, delay * 1.5);
        }
        throw err;
      }
    };

    try {
      const res = await fetchBtnWithRetry("/api/goal-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student,
          currentTraz,
          currentPercentage,
          targetTraz,
          targetGrowth,
          latestQuizScore
        })
      });

      if (!res.ok) {
        throw new Error(`اختلال شبکه در سرور هوشمند ${BRAND_CONFIG.examProvider}`);
      }

      const data = await res.json();
      if (data && typeof data.likelihood === "number") {
        setAiInsight(data);
        const dataToSave = {
          targetTraz,
          targetGrowth,
          latestQuizScore,
          lastInsight: data
        };
        localStorage.setItem(`arateb_goals_${student.id}`, JSON.stringify(dataToSave));
      } else {
        throw new Error("خطا در ساختار پاسخ کایزن هوشمند");
      }
    } catch (err: any) {
      console.error("AI Insight retrieval failed:", err);
      setInsightError("سیستم شبیه‌ساز ابری ترنم مهر با تاخیر مواجه شد. لطفاً چند ثانیه دیگر تلاش کنید.");
    } finally {
      setLoadingInsight(false);
    }
  };

  // شمارش معکوس مانیتورینگ تراز تا موعد آزمون اصلی
  useEffect(() => {
    const firstTraz = trazHistory[0]?.actualTraz || 5120;
    const lastTraz = trazHistory[trazHistory.length - 1]?.actualTraz || currentTraz;
    const historySteps = Math.max(1, trazHistory.length - 1);
    const calculatedVelocity = Math.round((lastTraz - firstTraz) / historySteps);
    const baseVelocity = calculatedVelocity > 0 ? calculatedVelocity : 70;
    
    const getMultiplier = () => {
      switch (velocityPreset) {
        case "slow": return 0.6;
        case "intensive": return 1.5;
        case "normal":
        default: return 1.0;
      }
    };
    
    const activeVelocity = Math.round(baseVelocity * getMultiplier());
    const trazDiff = targetTraz - lastTraz;
    
    if (trazDiff <= 0) {
      setTimeLeft(null);
      setTargetEstDate(null);
      return;
    }
    
    const daysNeeded = Math.ceil(trazDiff / activeVelocity) * 14;
    
    // موعد کنکور سراسری را بر اساس ثبات تحصیلی تخمین می‌زند
    const baseTime = new Date("2026-05-23T16:15:16Z").getTime();
    const targetTime = baseTime + (daysNeeded * 24 * 60 * 60 * 1000);
    setTargetEstDate(new Date(targetTime));
    
    const updateCountdown = () => {
      const difference = targetTime - Date.now();
      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const seconds = Math.floor((difference / 1000) % 60);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      
      setTimeLeft({ days, hours, minutes, seconds });
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetTraz, trazHistory, velocityPreset, currentTraz]);

  const trazProgressPercent = Math.min(100, Math.max(0, Math.round((currentTraz / targetTraz) * 100)));
  const targetPercentage = currentPercentage + targetGrowth;
  const actualGrowth = Math.max(0, latestQuizScore - currentPercentage);
  const growthProgressPercent = targetGrowth > 0 
    ? Math.min(100, Math.round((actualGrowth / targetGrowth) * 100)) 
    : 100;

  const toPersianNum = (num: number | string) => {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
  };

  const toPersianDateString = (date: Date) => {
    const jy = 1405;
    const jm = 3;
    const jd = Math.min(31, Math.max(1, Math.round((date.getTime() - new Date("2026-05-23").getTime()) / (24*60*60*1000)) + 3));
    return `${jy}/${jm.toString().padStart(2, '0')}/${jd.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6" id="goal-tracker-container">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-50">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-indigo-50 text-indigo-750 rounded-lg">
            <Target size={18} />
          </span>
          <h2 className="text-lg font-bold text-slate-900">سامانه پایش اهداف تحصیلی و کایزن درسی {BRAND_CONFIG.name}</h2>
        </div>
        <button
          onClick={() => {
            setTempTraz(targetTraz);
            setTempGrowth(targetGrowth);
            setIsEditing(!isEditing);
          }}
          className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
          id="btn-edit-goals"
        >
          {isEditing ? "انصراف" : "تنظیم اهداف تراز تحصیلی"}
          {!isEditing && <Edit2 size={12} className="mr-0.5" />}
        </button>
      </div>

      {/* Edit Form */}
      {isEditing ? (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          onSubmit={handleSaveGoals}
          className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4"
          id="goals-edit-form"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* QEI Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">شاخص تراز آزمون هدف کانون (QEI)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="5000"
                  max="8000"
                  step="50"
                  value={tempTraz}
                  onChange={(e) => setTempTraz(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-900"
                />
                <span className="text-xs font-black text-blue-950 font-mono bg-white border border-slate-200 px-2.5 py-1 rounded-lg w-16 text-center">
                  {toPersianNum(tempTraz)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">تراز آزمون جاری شما: {toPersianNum(currentTraz)}</p>
            </div>

            {/* Growth Percentage Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">رشد هدف برای راندمان پاسخ صحیح</label>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="2"
                  max="30"
                  step="1"
                  value={tempGrowth}
                  onChange={(e) => setTempGrowth(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <span className="text-xs font-black text-amber-750 font-mono bg-white border border-slate-200 px-2.5 py-1 rounded-lg w-14 text-center">
                  {toPersianNum(tempGrowth)}٪+
                </span>
              </div>
              <p className="text-[10px] text-slate-400">میانگین فعلی: {toPersianNum(currentPercentage)}٪ (هدف نهایی: {toPersianNum(currentPercentage + tempGrowth)}٪ بدون پاسخ اشتباه)</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-blue-950 hover:bg-slate-900 text-white text-xs font-bold py-2 px-4 rounded-xl shadow transition duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>ذخیره اهداف تحصیلی کایزن</span>
            </button>
          </div>
        </motion.form>
      ) : null}

      {/* Success Notification */}
      {saveSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 text-emerald-700 p-3 rounded-xl border border-emerald-100 text-xs font-bold flex items-center gap-1.5"
        >
          <CheckCircle size={14} />
          <span>اهداف تحصیلی داوطلب با موفقیت در ترنم مهر به‌روزرسانی شد.</span>
        </motion.div>
      )}

      {/* Tracking Visualization Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="goals-tracking-cards">
        {/* Traz Goal Progress */}
        <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-550 font-bold flex items-center gap-1">
                <Award size={14} className="text-blue-900" />
                <span>مسیر دستیابی به تراز هدف طلایی آزمون</span>
              </span>
              <span className="text-xs font-black text-blue-900 font-mono bg-blue-50 px-2 py-0.5 rounded-full">
                {toPersianNum(trazProgressPercent)}٪
              </span>
            </div>
            
            <div className="flex justify-between items-end pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block">آخرین تراز تجمعی ثبت‌شده</span>
                <span className="text-lg font-black text-slate-500 font-mono">{toPersianNum(currentTraz)}</span>
              </div>
              <div className="text-left">
                <span className="text-[10px] text-blue-950 font-black block">تراز هدف تعیین شده</span>
                <span className="text-2xl font-black text-blue-950 font-mono">{toPersianNum(targetTraz)}</span>
              </div>
            </div>
          </div>

          {/* Progress bar container */}
          <div className="space-y-1">
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${trazProgressPercent}%` }}
                transition={{ type: "spring", stiffness: 45, damping: 11, delay: 0.1 }}
                className="bg-gradient-to-r from-blue-600 to-indigo-950 h-2.5 rounded-full relative overflow-hidden"
              >
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full"
                />
              </motion.div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-450 font-mono">
              <span>{toPersianNum(5000)}</span>
              <span>فاصله تا تراز طلایی هدف: {toPersianNum(Math.max(0, targetTraz - currentTraz))} واحد</span>
              <span>{toPersianNum(targetTraz)}</span>
            </div>
          </div>
        </div>

        {/* Growth Percentage Progress */}
        <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-100 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-550 font-bold flex items-center gap-1">
                <TrendingUp size={14} className="text-amber-600" />
                <span>راندمان صحت پاسخ‌دهی آزمایشی ({toPersianNum(currentPercentage)}٪)</span>
              </span>
              <span className="text-xs font-black text-amber-750 font-mono bg-amber-50 px-2 py-0.5 rounded-full">
                {toPersianNum(growthProgressPercent)}٪
              </span>
            </div>
            
            <div className="flex justify-between items-end pt-1">
              <div>
                <span className="text-[10px] text-slate-400 block">میانگین قبولی تست فعلی</span>
                <span className="text-lg font-black text-slate-500 font-mono">{toPersianNum(currentPercentage)}٪</span>
              </div>
              <div className="text-left">
                <span className="text-[10px] text-amber-900 font-extrabold block">درصد پاسخ صحیح هدف</span>
                <span className="text-2xl font-black text-amber-900 font-mono">{toPersianNum(targetPercentage)}٪ <span className="text-xs text-amber-500">({toPersianNum(targetGrowth)}٪+)</span></span>
              </div>
            </div>
          </div>

          {/* Progress bar container */}
          <div className="space-y-1">
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${growthProgressPercent}%` }}
                transition={{ type: "spring", stiffness: 45, damping: 11, delay: 0.2 }}
                className="bg-gradient-to-r from-amber-400 to-amber-600 h-2.5 rounded-full relative overflow-hidden"
              >
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full"
                />
              </motion.div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-450 font-mono">
              <span>{toPersianNum(currentPercentage)}٪</span>
              <span>آخرین پایش صحت علمی: {toPersianNum(latestQuizScore)}٪</span>
              <span>{toPersianNum(targetPercentage)}٪</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic RECHARTS Trend Chart Tracking Traz Journey against projection */}
      <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col space-y-4" id="traz-trend-chart-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-blue-900" />
              <span>منحنی تغییرات تراز داوطلب در ۵ آزمون شبیه‌ساز اخیر {BRAND_CONFIG.examProvider}</span>
            </h3>
            <p className="text-[10px] text-slate-500">رصد پایداری تراز علمی واقعی در مقابل خط قرمز تراز هدف ترنم مهر</p>
          </div>
          
          <div className="flex items-center gap-1.5 self-start">
            <button 
              onClick={() => setShowAddTrazForm(!showAddTrazForm)}
              className="text-[10px] font-black bg-blue-50 text-blue-950 border border-blue-100 px-2.5 py-1.5 rounded-xl hover:bg-blue-100 transition cursor-pointer flex items-center gap-1"
            >
              <PlusCircle size={11} />
              <span>{showAddTrazForm ? "بستن پنل" : "ثبت کارنامه جدید"}</span>
            </button>
            <button
              onClick={handleResetHistory}
              className="text-[10px] p-1.5 bg-neutral-100 text-slate-600 border border-slate-200 hover:bg-neutral-200 rounded-xl transition cursor-pointer"
              title="بارگذاری مجدد فرضیات اولیه ترنم مهر"
            >
              <RotateCcw size={11} />
            </button>
          </div>
        </div>

        {/* Form to submit custom traz result update */}
        <AnimatePresence>
          {showAddTrazForm && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddNewTrazUpdate}
              className="bg-white p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end shadow-sm"
              id="logger-history-form"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">عنوان مرحله پایش (آزمون)</label>
                <input 
                  type="text" 
                  value={newExamLabel}
                  onChange={(e) => setNewExamLabel(e.target.value)}
                  placeholder="مثلا: پایش خرداد ۳"
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-blue-950"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 block">تراز کلمله کسب شده</label>
                <input 
                  type="number" 
                  min="3000" 
                  max="9500"
                  value={newExamActual}
                  onChange={(e) => setNewExamActual(e.target.value)}
                  placeholder="مثال: ۵۷۰۰"
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-left px-3 py-2 rounded-xl font-mono focus:outline-none focus:border-blue-950"
                  required
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-blue-950 hover:bg-slate-900 text-white text-[11px] font-bold py-2 rounded-xl shadow cursor-pointer text-center height-[36px]"
              >
                ثبت در کارنامه داوطلب
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Responsive Recharts Container */}
        <div className="h-60 w-full" style={{ direction: "ltr" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trazHistory} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="examName" 
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 'medium' }} 
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis 
                domain={['dataMin - 200', 'dataMax + 200']}
                tick={{ fill: '#475569', fontSize: 10, fontWeight: 'medium', fontFamily: 'monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                content={({ active, payload, label }: any) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-700/50 shadow-xl space-y-1.5 text-xs text-right">
                        <p className="font-bold text-slate-300 border-b border-white/10 pb-1">{label}</p>
                        {payload.map((entry: any, index: number) => (
                          <div key={index} style={{ color: entry.color }} className="font-semibold flex items-center justify-between gap-4 font-mono">
                            <span className="text-[11px]">{entry.name === "actualTraz" ? "تراز واقعی کسب‌شده داوطلب:" : "تراز کایزن انتخابی مربی:"}</span>
                            <span className="font-black text-xs">{toPersianNum(entry.value)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }} 
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 10, fontWeight: 'bold', paddingTop: 0 }}
                formatter={(value) => value === "actualTraz" ? "تراز شبیه‌ساز واقعی داوطلب" : `هدف‌گذاری میان‌مدت ${BRAND_CONFIG.name}`}
              />
              <Line 
                type="monotone" 
                dataKey="actualTraz" 
                name="actualTraz"
                stroke="#1e3a8a" 
                strokeWidth={3}
                activeDot={{ r: 6 }} 
                dot={{ r: 4, stroke: '#1e3a8a', strokeWidth: 2, fill: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="targetTraz" 
                name="targetTraz"
                stroke="#f59e0b" 
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={{ r: 3, stroke: '#f59e0b', strokeWidth: 1.5, fill: '#fff' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Projection tabular view of next 3 milestone projections */}
      {(() => {
        const firstTraz = trazHistory[0]?.actualTraz || 5120;
        const lastTraz = trazHistory[trazHistory.length - 1]?.actualTraz || currentTraz;
        const historySteps = Math.max(1, trazHistory.length - 1);
        const calculatedVelocity = Math.round((lastTraz - firstTraz) / historySteps);
        const baseVelocity = calculatedVelocity > 0 ? calculatedVelocity : 70;

        const getVelocityMultiplier = () => {
          switch (velocityPreset) {
            case "slow": return 0.6;
            case "intensive": return 1.5;
            case "normal":
            default: return 1.0;
          }
        };

        const activeVelocity = Math.round(baseVelocity * getVelocityMultiplier());
        
        const milestonesData = [
          {
            step: "گام ۱ (آزمون آزمایشی ماه بعد)",
            name: "سنجش جامع زیست‌شناسی، شیمی و فیزیک (اختصاصی ۱)",
            projectedTraz: lastTraz + activeVelocity,
            date: "۱۴۰۵/۰۳/۱۶",
            weeklyHours: velocityPreset === "slow" ? 36 : velocityPreset === "intensive" ? 54 : 45,
            focus: `رفع تله تستی مفاهیم با کتب تحلیل صریح ${BRAND_CONFIG.examProvider}`,
            badgeColor: "bg-teal-50 text-teal-700 border-teal-100"
          },
          {
            step: "گام ۲ (شبیه‌ساز پیشرفته)",
            name: "آزمون تخصصی ریاضیات، زمین‌شناسی و خلاقیت تصویری",
            projectedTraz: lastTraz + (activeVelocity * 2),
            date: "۱۴۰۵/۰۳/۳۰",
            weeklyHours: velocityPreset === "slow" ? 40 : velocityPreset === "intensive" ? 58 : 48,
            focus: "کمرنگ کردن ریسک نمره منفی در جزئیات محاسباتی و دقت علمی",
            badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-100"
          },
          {
            step: "گام ۳ (کنکور آزمایشی مرحله نهایی شبیه‌ساز)",
            name: `آزمون جامع شبیه‌ساز کنکور سراسری ${BRAND_CONFIG.examProvider}`,
            projectedTraz: lastTraz + (activeVelocity * 3),
            date: "۱۴۰۵/۰۴/۱۳",
            weeklyHours: velocityPreset === "slow" ? 42 : velocityPreset === "intensive" ? 64 : 52,
            focus: `تضمین ارتقای تراز، رفع نمره‌ منفی و پیش‌روی برنامه‌ درسی ${BRAND_CONFIG.examProvider}`,
            badgeColor: "bg-amber-50 text-amber-700 border-amber-100"
          }
        ];

        return (
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4" id="traz-projection-projection-milestones">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <LayoutList size={14} className="text-indigo-650" />
                  <span>پیش‌بینی هوشمند صعود تراز مطالعاتی بر مبنای آهنگ رشد شما</span>
                </h3>
                <p className="text-[10px] text-slate-500">تخمین رتبه و شانس قبولی در رشته‌های برتر بر اساس میزان پومودوروی هفتگی</p>
              </div>

              {/* Study Pace Interactive Switch */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm text-[10px] font-bold self-start sm:self-center">
                <span className="text-[9px] text-slate-405 px-1.5">شتاب مطالعه:</span>
                <button
                  type="button"
                  onClick={() => setVelocityPreset("slow")}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${velocityPreset === "slow" ? "bg-amber-100 text-amber-800" : "text-slate-650 hover:bg-slate-50"}`}
                >
                  مطالعه آرام (-۴۰٪)
                </button>
                <button
                  type="button"
                  onClick={() => setVelocityPreset("normal")}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${velocityPreset === "normal" ? "bg-blue-955 text-white" : "text-slate-655 hover:bg-slate-50"}`}
                >
                  نرمال ترنم مهر
                </button>
                <button
                  type="button"
                  onClick={() => setVelocityPreset("intensive")}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${velocityPreset === "intensive" ? "bg-emerald-100 text-emerald-800" : "text-slate-655 hover:bg-slate-50"}`}
                >
                  مطالعه فشرده کایکاکو (+۵۰٪)
                </button>
              </div>
            </div>

            {/* Interactive User hours input Panel */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/70 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-tr from-blue-900 to-indigo-950 text-white rounded-xl shadow-md">
                  <Clock size={16} />
                </div>
                <div className="space-y-0.5 text-right">
                  <h4 className="text-xs font-extrabold text-slate-800">ساعت مطالعه فعال داوطلب در هفته (Study Hours):</h4>
                  <p className="text-[10px] text-slate-500">ساعت مطالعه کل دروس تخصصی و عمومی خود را جهت پیشران برنامه‌ریزی تنظیم نمایید</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto flex-1 max-w-md justify-end">
                <input 
                  type="range"
                  min="10"
                  max="80"
                  step="1"
                  value={actualWeeklyHours}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setActualWeeklyHours(val);
                    localStorage.setItem(`arateb_hours_${student.id}`, val.toString());
                  }}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-xs font-black text-indigo-950 font-mono bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl w-20 text-center flex items-center justify-center gap-1 flex-shrink-0">
                  <span className="font-bold text-indigo-950">{toPersianNum(actualWeeklyHours)}</span>
                  <span className="text-[10px] text-indigo-600">ساعت</span>
                </span>
              </div>
            </div>

            {/* Projection Summary Metric Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 block pb-0.5">آهنگ رشد پایه داوطلب (دو هفته یک‌بار)</span>
                  <span className="text-xs font-extrabold text-slate-800 font-mono">+{toPersianNum(baseVelocity)} واحد تراز</span>
                </div>
                <div className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">به ازای هر پایش</div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 block pb-0.5">سرعت رشد مربیگری جاری</span>
                  <span className="text-xs font-extrabold text-indigo-900 font-mono">+{toPersianNum(activeVelocity)} واحد تراز</span>
                </div>
                <div className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg font-mono">ضریب {toPersianNum(getVelocityMultiplier())}x</div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between sm:col-span-2 md:col-span-1">
                <div>
                  <span className="text-[9px] text-slate-400 block pb-0.5">فاصله تا تراز ایده آل ({toPersianNum(targetTraz)})</span>
                  <span className="text-xs font-extrabold text-amber-950 font-mono">{toPersianNum(Math.max(0, targetTraz - lastTraz))} واحد</span>
                </div>
                {lastTraz + (activeVelocity * 3) >= targetTraz ? (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg">پوشش کامل در ۳ فاز</span>
                ) : (
                  <span className="text-[9px] font-bold text-amber-755 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">نیازمند بهسازی تستی</span>
                )}
              </div>
            </div>

            {/* Responsive Table Layout */}
            <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
              <table className="w-full text-right border-collapse table-auto">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500">عنوان آزمون شبیه‌ساز</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 text-center">تاریخ ممیزی</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 text-center">شاخص کارنامه QEI</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 text-center">بهبود خالص تراز</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 text-center">ساعت فشرده هوش</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 text-center">سیگنال ریسک تراز</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500">موضوع تمرکز علمی مربی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {milestonesData.map((milestone, idx) => {
                    const diff = milestone.projectedTraz - lastTraz;
                    const isSuccess = milestone.projectedTraz >= targetTraz;
                    const isSufficient = actualWeeklyHours >= milestone.weeklyHours;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition bg-white">
                        <td className="px-4 py-3 text-xs">
                          <div className="flex items-center gap-1.5 font-bold">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg border ${milestone.badgeColor}`}>
                              {milestone.step}
                            </span>
                            <span className="text-slate-800">{milestone.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 text-center font-mono">{toPersianNum(milestone.date)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-xs font-black text-slate-850 font-mono">{toPersianNum(milestone.projectedTraz)}</span>
                            {isSuccess ? (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-1.5 py-0.5 rounded-md">تراز رتبه برتر کنکور</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-bold text-emerald-600 font-mono">+{toPersianNum(diff)}</td>
                        <td className="px-4 py-3 text-center text-xs font-semibold text-slate-600 font-mono">{toPersianNum(milestone.weeklyHours)} ساعت</td>
                        <td className="px-4 py-3 text-center text-xs">
                          {isSufficient ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span>ایمن و مستمر ✓</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-[9px] font-black bg-rose-50 text-rose-600 border border-rose-200/60 rounded-full animate-bounce">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                              <span>ریسک افت تراز</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-[200px] truncate" title={milestone.focus}>
                          {milestone.focus}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Estimator Dynamic Timeline Card */}
      {targetEstDate && timeLeft && (
        <div className="bg-slate-900 text-white p-5 rounded-2xl border border-indigo-950/20 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden" id="countdown-goals-card">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl"></div>
          
          <div className="flex items-center gap-3 relative z-10 text-right">
            <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl">
              <Hourglass className="animate-spin-slow" size={20} />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-slate-100">زمان تخمینی باقیمانده تا قبولی قطعی داوطلب در {BRAND_CONFIG.examProvider}:</h4>
              <p className="text-[10px] text-slate-400">تاریخ فرضی کنکور نهایی شبیه‌ساز: <strong className="font-mono text-amber-300 block sm:inline">{toPersianNum(toPersianDateString(targetEstDate))}</strong></p>
            </div>
          </div>
          
          {/* Ticking Clock Items */}
          <div className="flex gap-2 relative z-10" style={{ direction: "ltr" }}>
            {[
              { label: "روز", val: timeLeft.days },
              { label: "ساعت", val: timeLeft.hours },
              { label: "دقیقه", val: timeLeft.minutes },
              { label: "ثانیه", val: timeLeft.seconds }
            ].map((timeUnit, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-center w-14 backdrop-blur-sm">
                <span className="block text-lg font-black font-mono text-amber-300 leading-none">{toPersianNum(timeUnit.val.toString().padStart(2, '0'))}</span>
                <span className="text-[9px] text-slate-400 block mt-1">{timeUnit.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Estimator Insight Box with interactive fetch trigger */}
      <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4" id="aiInsightBox-goals">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/20 text-amber-400 flex items-center justify-center">
              <Brain size={16} />
            </div>
            <div className="text-right">
              <h3 className="text-xs font-black text-slate-100">برآورد شانس قبولی و رتبه کنکور با هوش مصنوعی (AI)</h3>
              <p className="text-[10px] text-slate-400">محاسبه الگوریتمی احتمال موفقیت بر اساس بودجه‌بندی مباحث و تراز تجمعی</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchGoalInsight}
            disabled={loadingInsight}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition duration-150 flex items-center gap-1.5 cursor-pointer self-start sm:self-center shrink-0"
          >
            {loadingInsight ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>درحال تحلیل ابری...</span>
              </>
            ) : (
              <>
                <Sparkles size={11} />
                <span>{aiInsight ? "بروزرسانی تخمین عمیق" : "دریافت تخمین موفقیت با AI"}</span>
              </>
            )}
          </button>
        </div>

        {/* Content Box */}
        {loadingInsight ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-400 font-bold animate-pulse">موتور هوش سنج {BRAND_CONFIG.examProvider} در حال ارزیابی متغیرها، تعهدات مطالعاتی داوطلب و درصد پاسخ‌های منفی است...</p>
          </div>
        ) : insightError ? (
          <div className="p-4 bg-red-950/50 border border-red-800 rounded-2xl flex items-center gap-3 text-red-100 text-xs text-right leading-relaxed font-semibold">
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <span>{insightError}</span>
          </div>
        ) : aiInsight ? (
          <div className="space-y-5" id="insight-results">
            {/* Meter row */}
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/5 p-4 rounded-2xl border border-white/5">
              
              {/* Radial gauge */}
              <div className="relative flex-shrink-0 w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle 
                    cx="50" cy="50" r="40" 
                    stroke="rgba(255,255,255,0.06)" strokeWidth="8" fill="transparent" 
                  />
                  <circle 
                    cx="50" cy="50" r="40" 
                    stroke="#f59e0b" strokeWidth="8" fill="transparent" 
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - aiInsight.likelihood / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="block text-2xl font-black font-mono text-amber-300 leading-none">{toPersianNum(aiInsight.likelihood)}٪</span>
                  <span className="text-[8px] text-slate-400 block mt-1">شانس قبولی</span>
                </div>
              </div>

              <div className="space-y-1.5 flex-1 text-right">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[9px] bg-amber-400 text-slate-950 font-black rounded">رده تراز داوطلب</span>
                  <span className="text-[10px] text-amber-200 font-bold">
                    {aiInsight.likelihood >= 80 ? "رتبه زیر ۱۰۰۰ کشوری" : aiInsight.likelihood >= 50 ? "رده متوسط قبولی" : "تلاش مضاعف کایزن"}
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {aiInsight.text}
                </p>
              </div>
            </div>

            {/* Detailed metrics grid */}
            {aiInsight.detailedMetrics && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {aiInsight.detailedMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold">{metric.label}:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-100 font-mono">{metric.value}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${metric.status === 'success' ? 'bg-emerald-400' : metric.status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Subject-wise Detailed AI Insights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-indigo-300">
                  <Brain size={14} />
                  <span className="text-[11px] font-black">تحلیل عمق تسلط (Subject Depth):</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">دروس اختصاصی ۱ (Math/Bio):</span>
                    <span className="text-emerald-400 font-bold">بسیار خوب</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[72%]"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">دروس اختصاصی ۲ (Physics/Chem):</span>
                    <span className="text-amber-400 font-bold">نیاز به تمرکز</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[48%]"></div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-300">
                  <Flame size={14} />
                  <span className="text-[11px] font-black">تخمین رتبه احتمالی (Predicted Rank):</span>
                </div>
                <div className="flex items-end justify-between py-1">
                  <div>
                    <span className="text-[9px] text-slate-400 block">بدبینانه:</span>
                    <span className="text-sm font-black text-slate-300 font-mono">+{toPersianNum(4500)}</span>
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] text-amber-400 font-black block">پیش‌بینی کایزن:</span>
                    <span className="text-xl font-black text-amber-300 font-mono">{toPersianNum(1200)}</span>
                  </div>
                </div>
                <button 
                  onClick={fetchGoalInsight}
                  className="w-full py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 rounded-xl text-[10px] font-black transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={12} />
                  <span>مانیتورینگ آنی رده قبولی</span>
                </button>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-black text-amber-300 flex items-center gap-1.5 justify-start">
                <LayoutList size={12} />
                <span>اقدامات توصیه شده مربیگری جهت پیروزی در کنکور سراسری:</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {aiInsight.recommendations && aiInsight.recommendations.map((rec, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 flex gap-3 text-right">
                    <span className="w-5 h-5 bg-amber-400/20 text-amber-300 border border-amber-400/10 rounded-full flex items-center justify-center text-[10px] font-black font-mono flex-shrink-0 mt-0.5">
                      {toPersianNum(i + 1)}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/5 p-5 rounded-2xl text-center space-y-2.5">
            <HelpCircle size={32} className="mx-auto text-slate-600" />
            <p className="text-xs text-slate-400 font-semibold leading-relaxed">
              با فشردن دکمه «دریافت تخمین موفقیت با AI» در بالا، هوش مصنوعی کلان پارامترهای کارنامه (شاخص های تراز آزمون، ساعات مطالعه هفتگی و بودجه‌بندی کنکور) را مقایسه می‌کند تا شانس قبولی نهایی شما را برآورد کند.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
