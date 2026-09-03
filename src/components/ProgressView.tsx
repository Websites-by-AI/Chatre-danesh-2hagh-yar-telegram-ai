import React, { useState, useEffect } from "react";
import { 
  Sparkles, TrendingUp, Calendar, AlertCircle, ArrowUpRight, 
  BarChart3, Star, Plus, Trash2, Sliders, Check, Award, Calculator, Info, RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { addSystemLog } from "../lib/syslogs";
import { BRAND_CONFIG } from "../constants";

// Core interface for logged mock exams
interface CustomExamPoint {
  examName: string;
  traz: number;
  percentage: number;
  date: string;
  isCustom?: boolean;
}

// Persian Digit utility
function toPersianNum(num: number | string): string {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num
    .toString()
    .replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
}

export default function ProgressView() {
  const [selectedTopic, setSelectedTopic] = useState<"traz" | "lessons" | "optimizer">("traz");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state for adding custom exam results
  const [newExamName, setNewExamName] = useState("");
  const [newTraz, setNewTraz] = useState(5500);
  const [newPercentage, setNewPercentage] = useState(60);
  const [newDate, setNewDate] = useState("");

  // Core historic data state
  const [historyData, setHistoryData] = useState<CustomExamPoint[]>([]);

  // Initialize data with local storage persistence or standard fallbacks
  useEffect(() => {
    const saved = localStorage.getItem("chatre_custom_exams");
    if (saved) {
      try {
        setHistoryData(JSON.parse(saved));
      } catch (err) {
        loadDefaultExams();
      }
    } else {
      loadDefaultExams();
    }
  }, []);

  const loadDefaultExams = () => {
    const defaults: CustomExamPoint[] = [
      { examName: "شبیه‌ساز ۱ - زیست‌شناسی دهم", traz: 5120, percentage: 48, date: "۵ مهر" },
      { examName: "شبیه‌ساز ۲ - فیزیک دوازدهم", traz: 5240, percentage: 51, date: "۱۹ مهر" },
      { examName: "شبیه‌ساز ۳ - شیمی آلی", traz: 5575, percentage: 59, date: "۱۵ آبان" },
      { examName: "شبیه‌ساز ۴ - ریاضیات تجربی", traz: 5720, percentage: 63, date: "۲۹ آذر" },
      { examName: "شبیه‌ساز ۵ - ادبیات عمومی", traz: 5690, percentage: 61, date: "۱۲ دی" },
      { examName: "شبیه‌ساز ۶ - عربی تخصصی", traz: 5880, percentage: 65, date: "۲۶ دی" },
      { examName: "شبیه‌ساز ۷ - فلسفه و منطق", traz: 6010, percentage: 67, date: "۱۰ بهمن" },
      { examName: "شبیه‌ساز ۸ - جامع کنکور پایلوت", traz: 6150, percentage: 70, date: "۲۴ بهمن" }
    ];
    setHistoryData(defaults);
    localStorage.setItem("taranom_custom_exams", JSON.stringify(defaults));
  };

  // Add custom exam
  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName.trim() || !newDate.trim()) {
      alert("لطفاً تمامی فیلدها را با مقادیر معتبر تکمیل کنید.");
      return;
    }

    const newPoint: CustomExamPoint = {
      examName: newExamName.trim(),
      traz: Number(newTraz),
      percentage: Number(newPercentage),
      date: newDate.trim(),
      isCustom: true
    };

    const updated = [...historyData, newPoint];
    setHistoryData(updated);
    localStorage.setItem("chatre_custom_exams", JSON.stringify(updated));

    // Log the action to central system logs
    addSystemLog(
      "ثبت تراز آزمون جدید",
      "داوطلب",
      `کاربر تراز جدید آزمون "${newExamName}" با تراز ${newTraz} و درصد ${newPercentage}٪ را ثبت کرد.`
    );

    // Reset Form
    setNewExamName("");
    setNewTraz(5500);
    setNewPercentage(60);
    setNewDate("");
    setShowAddForm(false);
  };

  // Delete custom exam
  const handleDeleteExam = (index: number) => {
    const item = historyData[index];
    if (confirm(`آیا از حذف تاریخچه آزمون "${item.examName}" مطمئن هستید؟`)) {
      const updated = historyData.filter((_, i) => i !== index);
      setHistoryData(updated);
      localStorage.setItem("chatre_custom_exams", JSON.stringify(updated));
      addSystemLog(
        "حذف تراز آزمون",
        "داوطلب",
        `آزمون ${item.examName} با تراز ${item.traz} حذف شد.`
      );
    }
  };

  // Reset all custom data to default list
  const handleResetData = () => {
    if (confirm("آیا مایلید تمام داده‌های ثبت‌شده را به حالت فرضی پیش‌فرض بازنشانی کنید؟")) {
      loadDefaultExams();
      addSystemLog("بازنشانی تاریخچه تراز", "داوطلب", "کل تاریخچه ترازهای آزمایشی به پیش‌فرض‌های اولیه بازگشت داده شد.");
    }
  };

  // Lessons Static detailed stats
  const lessonsStats = [
    { name: "زیست‌شناسی (سلولی، گیاهی و ژنتیک)", current: 55, previous: 25, progress: 30, count: 120 },
    { name: "شیمی تخصصی (مباحث محلول‌ها و آلی)", current: 65, previous: 32, progress: 33, count: 145 },
    { name: "فیزیک و محاسبات (موج و الکتریسیته)", current: 72, previous: 41, progress: 31, count: 85 },
    { name: "ریاضیات تخصصی (توابع و دنباله‌ها)", current: 85, previous: 72, progress: 13, count: 40 },
    { name: "دروس عمومی (ادبیات و عربی)", current: 92, previous: 80, progress: 12, count: 45 }
  ];

  // Simulator Initial Sliders configuration & coefficients
  const [sliderScores, setSliderScores] = useState({
    biology: 55,     // Biology - Weight 4
    chemistry: 65,   // Chemistry - Weight 3
    physics: 60,     // Physics - Weight 3
    math: 75,        // Math - Weight 2
    literature: 80,  // Literature - Weight 1
    arabic: 70,      // Arabic - Weight 1
    philosophy: 65   // Philosophy - Weight 1
  });

  // Calculate composite weighted percentage
  const totalCoeff = 4 + 3 + 3 + 2 + 1 + 1 + 1; // 15
  const weightedAvg = Math.round(
    (sliderScores.biology * 4 +
      sliderScores.chemistry * 3 +
      sliderScores.physics * 3 +
      sliderScores.math * 2 +
      sliderScores.literature * 1 +
      sliderScores.arabic * 1 +
      sliderScores.philosophy * 1) /
      totalCoeff
  );

  // Standard Formula predicting final Traz dynamically based on weighted averages
  const simulatedTraz = Math.round(3000 + weightedAvg * 55);

  // Predict exam passing probability based on simulated Traz
  let passProbability = 0;
  let passAlertColor = "text-rose-605 bg-rose-50 border-rose-100";
  let passAletStatus = "مردود احتمالی!";
  let passAlertDesc = "متاسفانه تراز محاسباتی شما با قبولی در رشته‌های تاپ (پزشکی، مهندسی) فاصله دارد. تمرکز خود را روی دروس ضریب بالا مانند زیست و شیمی افزایش دهید.";

  if (simulatedTraz >= 8500) {
    passProbability = 98;
    passAlertColor = "text-emerald-800 bg-emerald-50 border-emerald-150";
    passAletStatus = "پذیرش ۱۰۰٪ تضمینی کشوری (رتبه زیر ۱۰۰ کنکور سراسری)";
    passAlertDesc = "تراز علمی فوق‌العاده با ضریب پایداری چشمگیر؛ با این روند شانس قبولی شما در بهترین دانشگاه‌های تهران (شریف، تهران، بهشتی) قطعی است.";
  } else if (simulatedTraz >= 7800) {
    passProbability = 85;
    passAlertColor = "text-blue-800 bg-blue-50 border-blue-150";
    passAletStatus = "قبولی در دانشگاه‌های تراز اول کشور";
    passAlertDesc = "تراز بسیار خوبی است. شما در کور علمی پذیرفته‌شدگان قطعی رشته‌های محبوب قرار دارید. روی عارضه‌یابی اشتباهات با تله‌های تستی مداومت کنید.";
  } else if (simulatedTraz >= 6500) {
    passProbability = 48;
    passAlertColor = "text-amber-800 bg-amber-50 border-amber-150";
    passAletStatus = "قبولی در دانشگاه‌های سراسری تراز متوسط";
    passAlertDesc = "وضعیت شما در محدوده میانی قرار دارد. برای رسیدن به رشته‌های پرطرفدار دانشگاه‌های تهران، تراز خود را با رفع خستگی مطالعاتی به بالای ۷۸۰۰ بکشانید.";
  } else {
    passProbability = Math.min(25, Math.max(2, Math.round(weightedAvg * 0.3)));
  }

  // Calculate interactive bounds of graph dynamically based on current list
  const trazValues = historyData.map((h) => h.traz);
  const minTraz = trazValues.length > 0 ? Math.max(1000, Math.min(...trazValues) - 300) : 4500;
  const maxTraz = trazValues.length > 0 ? Math.min(10000, Math.max(...trazValues) + 300) : 7000;

  const width = 800;
  const height = 240;
  const padding = 45;

  const points = historyData.map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / Math.max(1, historyData.length - 1);
    const y = height - padding - ((d.traz - minTraz) * (height - padding * 2)) / Math.max(1, maxTraz - minTraz);
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className="space-y-6 animate-fade-in" id="progress-view-container" style={{ direction: "rtl" }}>
      
      {/* Visual Header / Applet Control Hub */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 rounded-lg text-blue-900"><TrendingUp size={18} /></span>
            <h2 className="text-lg font-black text-slate-900 font-sans">پایش هوشمند تراز مکرر و شبیه‌ساز قبولی کنکور</h2>
          </div>
          <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
            روند تغییر علمی، محاسبات درصد رسمی آزمون و پیش‌بینی قبولی خود در دانشگاه‌های برتر کشور را مانیتور کنید.
          </p>
        </div>

        {/* Improved Navigation Tabs */}
        <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl gap-1 w-full md:w-auto justify-start">
          <button
            onClick={() => setSelectedTopic("traz")}
            className={`cursor-pointer px-3.5 py-2 text-xs font-black rounded-xl transition-all duration-300 flex items-center gap-1.5 ${
              selectedTopic === "traz" ? "bg-blue-950 text-white shadow-md" : "text-slate-550 hover:text-slate-800"
            }`}
          >
            <BarChart3 size={13} />
            <span>روند بازخورد تراز زنده</span>
          </button>
          
          <button
            onClick={() => setSelectedTopic("optimizer")}
            className={`cursor-pointer px-3.5 py-2 text-xs font-black rounded-xl transition-all duration-300 flex items-center gap-1.5 ${
              selectedTopic === "optimizer" ? "bg-indigo-900 text-white shadow-md" : "text-slate-550 hover:text-slate-800"
            }`}
          >
            <Sliders size={13} />
            <span className="text-indigo-950 font-black">پیش‌بینی ثبات رتبه (شبیه‌ساز)</span>
          </button>

          <button
            onClick={() => setSelectedTopic("lessons")}
            className={`cursor-pointer px-3.5 py-2 text-xs font-black rounded-xl transition-all duration-300 flex items-center gap-1.5 ${
              selectedTopic === "lessons" ? "bg-amber-900 text-white shadow-md" : "text-slate-550 hover:text-slate-800"
            }`}
          >
            <Star size={13} />
            <span>سنجش دروس شالوده</span>
          </button>
        </div>
      </div>

      {/* COMPONENT TAB 1: TRAZ LINE CHART WITH NEW EXAM logger */}
      {selectedTopic === "traz" && (
        <div className="space-y-6">
          
          {/* Main Chart area */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6" id="progress-graph-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-4">
              <div className="text-right">
                <span className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                  <BarChart3 className="text-blue-900" size={18} />
                  <span>آمار توزیع تراز در آزمون‌های شبیه‌ساز {BRAND_CONFIG.name} (مبتنی بر استانداردهای کنکور)</span>
                </span>
                <p className="text-[10px] text-slate-400 mt-1">ترازهای شما بین {toPersianNum(minTraz + 300)} تا {toPersianNum(maxTraz - 300)} در نوسان است. نقاط را کلیک یا لمس کنید.</p>
              </div>

              {/* Action triggers */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetData}
                  className="cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1"
                  title="بازنشانی اطلاعات به پیش‌فرض"
                >
                  <RotateCcw size={13} />
                  <span>ریست اولیه</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="cursor-pointer bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-xl text-xs font-extrabold shadow-md shadow-blue-900/10 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{showAddForm ? "بستن فرم" : "ثبت نمره شبیه‌ساز جدید"}</span>
                </button>
              </div>
            </div>

            {/* Dynamic Add Score Form Panel */}
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border border-blue-100 bg-blue-50/20 rounded-2xl p-5 space-y-3"
                >
                  <h4 className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500 animate-pulse" />
                    <span>فرم ثبت تراز و معدل آزمون آزمایشی جدید</span>
                  </h4>
                  
                  <form onSubmit={handleAddExam} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold block">عنوان آزمون تستی *</label>
                      <input
                        required
                        type="text"
                        value={newExamName}
                        onChange={(e) => setNewExamName(e.target.value)}
                        placeholder="مثال: جامع مدنی و تجارت"
                        className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold block">تراز نهایی (۲,۰۰۰ تا ۱۰,۰۰۰) *</label>
                      <input
                        required
                        type="number"
                        min="2000"
                        max="10000"
                        value={newTraz}
                        onChange={(e) => setNewTraz(Number(e.target.value))}
                        className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 font-mono text-left"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold block">درصد انطباق علمی (۰ تا ۱۰۰٪)</label>
                      <input
                        required
                        type="number"
                        min="0"
                        max="100"
                        value={newPercentage}
                        onChange={(e) => setNewPercentage(Number(e.target.value))}
                        className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900 font-mono text-left"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold block">تاریخ سنجش (مثال: ۲۰ اسفند) *</label>
                      <div className="flex gap-2">
                        <input
                          required
                          type="text"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                          placeholder="مثال: ۲۵ اسفند"
                          className="w-full text-xs font-bold p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                        />
                        <button
                          type="submit"
                          className="cursor-pointer bg-blue-900 hover:bg-black text-white px-4 rounded-lg text-xs font-black shrink-0 transition"
                        >
                          ثبت
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Custom SVG Graph with dynamic constraints */}
            <div className="relative overflow-x-auto select-none rounded-2xl p-2 bg-slate-50/50" id="svg-graph-scroller" dir="ltr">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[700px] h-60 text-slate-350">
                {/* Grid horizontal guidelines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = padding + ratio * (height - padding * 2);
                  const stepTraz = Math.round(maxTraz - ratio * (maxTraz - minTraz));
                  return (
                    <g key={idx}>
                      <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4 4" />
                      <text x={padding - 10} y={y + 4} textAnchor="end" className="text-[10px] font-mono font-bold fill-slate-400">{stepTraz}</text>
                    </g>
                  );
                })}

                {/* Main Path Curve Line */}
                {historyData.length > 1 && (
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.8 }}
                    d={pathD}
                    fill="none"
                    stroke="#1e3a8a"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                )}

                {/* Circles and metadata text mapping */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    <line x1={p.x} y1={padding} x2={p.x} y2={height - padding} stroke="#f1f5f9" strokeWidth="1.5" />
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="6" 
                      className="fill-amber-400 stroke-blue-950 stroke-2 cursor-pointer hover:r-8 transition duration-150" 
                    />
                    <text 
                      x={p.x} 
                      y={p.y - 12} 
                      textAnchor="middle" 
                      className="text-[11px] font-mono font-black fill-slate-800 bg-white px-1 rounded border border-slate-100"
                    >
                      {p.traz}
                    </text>
                    <text x={p.x} y={height - padding + 16} textAnchor="middle" className="text-[10px] font-bold fill-slate-500">{p.date}</text>
                  </g>
                ))}
              </svg>
            </div>

            {/* List of custom additions with Delete button for user management */}
            {historyData.length > 0 && (
              <div className="space-y-2 pt-2 text-right">
                <span className="text-[10px] text-slate-400 font-extrabold block">لیست ترازهای آزمون به تفکیک زمان:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {historyData.map((item, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-2xl border flex items-center justify-between text-right bg-white shadow-xs ${
                        item.isCustom ? "border-blue-150 bg-blue-50/5" : "border-slate-100"
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <strong className="text-[11px] font-black text-slate-800 block truncate">{item.examName}</strong>
                        <div className="flex items-center gap-2 text-[10px] text-slate-450 font-bold">
                          <span>تراز: <span className="font-mono text-blue-900 font-extrabold">{toPersianNum(item.traz)}</span></span>
                          <span>•</span>
                          <span>صحت: {toPersianNum(item.percentage)}٪</span>
                        </div>
                      </div>
                      
                      {/* Delete option for custom rows */}
                      {item.isCustom ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteExam(index)}
                          className="cursor-pointer p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition"
                          title="حذف این رکورد"
                        >
                          <Trash2 size={12} />
                        </button>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-md">پایه</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Core AI Strategic forecast card based on history dataset */}
          <div className="bg-gradient-to-tr from-blue-950 via-slate-950 to-indigo-950 text-white rounded-3xl p-6 relative overflow-hidden text-right shadow-lg">
            <div className="absolute top-2 left-2 text-white/5 opacity-5 scale-150 pointer-events-none">
              <Sparkles size={110} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5 justify-start">
              <Sparkles size={14} className="animate-spin-slow" />
              <span>تخمین و پیش‌بینی هوش مصنوعی {BRAND_CONFIG.name}</span>
            </span>
            <h3 className="text-base font-black mt-2 font-sans">
              برآورد اهداف ارتقاء تراز: هدف {historyData.length > 0 ? toPersianNum(historyData[historyData.length - 1].traz + 250) : toPersianNum(7200)}
            </h3>
            <p className="text-xs text-blue-105 mt-2 leading-relaxed">
              بررسی {toPersianNum(historyData.length)} دوره آزمونی نشان می‌دهد پسماند تراز شما در دروس اختصاصی بهبود یافته است. با غلبه بر تله‌های تستی در مباحث دشوار زیست‌شناسی و حسابان، تراز آزمون‌های جامع بعدی داوطلب با جهش ملموس پایا ارتقا پیدا خواهد کرد.
            </p>
          </div>
        </div>
      )}

      {/* COMPONENT TAB 2: INTERACTIVE OPTIMIZER & SLIDER GAME SIMULATOR */}
      {selectedTopic === "optimizer" && (
        <div className="space-y-6 animate-fade-in text-right">
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-black text-slate-850 flex items-center gap-2">
                <Calculator className="text-indigo-800" size={18} />
                <span>شبیه‌ساز هوشمند کایزنی درصد، تراز کنکور و شانس قبولی</span>
              </h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                درصد هر یک از سرفصل‌های آزمون سراسری را تغییر دهید تا تراز نهایی با استانداردهای سنجش و شانس قبولی شما بلافاصله به‌روزرسانی شود. این تخمین بر پایه ضرایب وزنی کنکور است.
              </p>
            </div>

            {/* Simulated Probability Gauge grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Core Output Metrics Column */}
              <div className="lg:col-span-1 bg-gradient-to-br from-indigo-950 to-slate-900 text-white p-6 rounded-3xl space-y-6 flex flex-col justify-between shadow-lg">
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl">
                    <span className="text-xs text-indigo-200 font-bold block">معدل تستی کل:</span>
                    <span className="text-lg font-black text-amber-300 font-mono">{toPersianNum(weightedAvg)}٪</span>
                  </div>

                  <div className="text-center py-4 bg-white/5 rounded-2xl border border-indigo-500/10">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest block">تراز کل تخمینی کانون</span>
                    <strong className="text-3xl font-black font-mono text-indigo-100 block mt-1 tracking-wider">
                      {toPersianNum(simulatedTraz)}
                    </strong>
                    <span className="text-[9px] text-slate-400 block mt-0.5">محاسبه بر اساس آخرین ضرایب آزمون سراسری سازمان سنجش</span>
                  </div>

                  {/* Probability Meter Arc */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold items-center">
                      <span className="text-indigo-200">شانس قبولی در رشته‌های برتر:</span>
                      <span className="text-amber-300 font-mono font-black">{toPersianNum(passProbability)}٪</span>
                    </div>
                    <div className="w-full bg-indigo-900/40 h-3 rounded-full overflow-hidden border border-indigo-500/10">
                      <div 
                        className="bg-gradient-to-r from-amber-400 to-indigo-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${passProbability}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Simulated dynamic Badge Alert */}
                <div className={`p-4 rounded-2xl border text-xs font-semibold leading-relaxed ${passAlertColor}`}>
                  <div className="flex items-center gap-1.5 font-black text-[11px] mb-1">
                    <Award size={14} />
                    <span>وضعیت: {passAletStatus}</span>
                  </div>
                  <p className="text-[10px] leading-relaxed opacity-90">{passAlertDesc}</p>
                </div>
              </div>

              {/* Sliders Input Column */}
              <div className="lg:col-span-2 space-y-5">
                <div className="flex justify-between items-center text-xs pb-1 mb-2">
                  <span className="font-extrabold text-slate-700">دروس امتحانی کنکور سراسری</span>
                  <button 
                    onClick={() => setSliderScores({
                      biology: 55,
                      chemistry: 65,
                      physics: 60,
                      math: 75,
                      literature: 80,
                      arabic: 70,
                      philosophy: 65
                    })}
                    className="cursor-pointer text-indigo-900 hover:font-black text-[10px] flex items-center gap-1"
                  >
                    <span>بازنشانی اسلایدرها</span>
                    <RotateCcw size={10} />
                  </button>
                </div>

                {/* Siders List mapping with official coefficients */}
                {[
                  { key: "biology", label: "زیست‌شناسی", coeff: 4, color: "bg-blue-600" },
                  { key: "chemistry", label: "شیمی تخصصی", coeff: 3, color: "bg-blue-700" },
                  { key: "physics", label: "فیزیک و محاسبات", coeff: 3, color: "bg-indigo-600" },
                  { key: "math", label: "ریاضیات پایه و پیشرفته", coeff: 2, color: "bg-amber-600" },
                  { key: "literature", label: "ادبیات فارسی", coeff: 1, color: "bg-rose-600" },
                  { key: "arabic", label: "عربی تخصصی", coeff: 1, color: "bg-red-600" },
                  { key: "philosophy", label: "فلسفه و منطق", coeff: 1, color: "bg-slate-700" }
                ].map((item) => (
                  <div key={item.key} className="space-y-1.5 p-3 rounded-2xl border border-slate-50 hover:bg-slate-50/30 transition">
                    <div className="flex justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-800">{item.label}</span>
                        <span className="text-[9px] bg-slate-100 text-slate-500 block px-1.5 py-0.5 rounded-md font-bold">
                          ضریب {toPersianNum(item.coeff)}
                        </span>
                      </div>
                      <span className="font-mono font-black text-slate-700 text-xs">
                        {toPersianNum(sliderScores[item.key as keyof typeof sliderScores])}٪
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderScores[item.key as keyof typeof sliderScores]}
                        onChange={(e) => {
                          setSliderScores({
                            ...sliderScores,
                            [item.key]: Number(e.target.value)
                          });
                        }}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-900"
                      />
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>

          {/* Quick analysis table of standard targets */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Info size={14} className="text-blue-900" />
              <span>جدول حد نصاب پذیرفته‌شدگان سال گذشته جهت مطابقت علمی رشته‌ها</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-right space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">رشته‌های تاپ (پزشکی / دندان‌ / شریف)</span>
                <span className="text-xs font-black text-slate-800 block">حداقل تراز قبولی: ۸,۵۰۰</span>
                <p className="text-[9px] text-slate-400">نیازمند میانگین حداقل ۷۰ الی ۸۰ درصد در دروس اختصاصی.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-right space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">دانشگاه‌های تراز ۱ (تهران / بهشتی / فردوسی)</span>
                <span className="text-xs font-black text-slate-800 block">حداقل تراز قبولی: ۷,۸۰۰</span>
                <p className="text-[9px] text-slate-400">نیازمند میانگین حداقل ۶۰ درصد در دروس اختصاصی و ادبیات فنی.</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-right space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block">سایر رشته‌های سراسری روزانه</span>
                <span className="text-xs font-black text-slate-800 block">حداقل تراز قبولی: ۶,۵۰۰</span>
                <p className="text-[9px] text-slate-400">نیازمند ثبات تراز کلی و کسب نمرات خوب در سرفصل‌های پایه.</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* COMPONENT TAB 3: DRILLDOWN BY IN-DEPTH SUBJECTS */}
      {selectedTopic === "lessons" && (
        <div className="space-y-4 animate-fade-in text-right" id="lessons-stats-panel">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5 pb-2 border-b border-slate-50 justify-start">
              <Star className="text-amber-500" size={18} />
              <span>پیشرفت عینی به تفکیک دروس تخصصی کنکور سراسری</span>
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
              {[
                { name: "زیست‌شناسی (مفهومی و ترکیبی)", current: 55, previous: 25, progress: 30, count: 120 },
                { name: "شیمی تخصصی (استوکیومتری و واکنش)", current: 65, previous: 32, progress: 33, count: 145 },
                { name: "فیزیک تخصصی (حرکت و فشار)", current: 72, previous: 41, progress: 31, count: 85 },
                { name: "ریاضیات (تابع و مشتق)", current: 85, previous: 72, progress: 13, count: 40 },
                { name: "ادبیات و عربی اختصاصی", current: 92, previous: 80, progress: 12, count: 45 }
              ].map((stat, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-right">
                  <div className="space-y-1 text-right">
                    <strong className="text-sm font-black text-slate-850 block">{stat.name}</strong>
                    <span className="text-xs text-slate-400 block font-semibold">تعداد تست‌های تحلیل شده کایزنی: {toPersianNum(stat.count)} تست</span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="text-left space-y-0.5">
                      <span className="text-base font-black text-slate-850 font-mono block">{toPersianNum(stat.current)}٪</span>
                      <span className="text-[10px] text-slate-400 font-medium block">قبلی {toPersianNum(stat.previous)}٪</span>
                    </div>
                    <span className="px-2.5 py-1 text-[11px] font-black bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-100">
                      ▲ {toPersianNum(stat.progress)}+
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Static Target goals indicator footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right" id="progress-ai-forecast">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <span className="text-slate-800 font-black text-xs block">حد نصاب‌های ممیزی داوطلب جهت کنترل</span>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">پذیرش در بهترین دانشگاه‌های تهران</span>
                <span className="font-bold text-blue-950 font-mono">تراز مطلوب: ۸,۵۰۰</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-900 h-full rounded-full w-[90%] font-sans"></div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">کسب ردیف تراز ممتاز و رتبه برتر کشوری</span>
                <span className="font-bold text-blue-950 font-mono">تراز مطلوب: ۹,۵۰۰</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full w-[75%] font-sans"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between text-right">
          <span className="text-slate-850 font-black text-xs block">توصیه نهایی مشاوران ارشد</span>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            روند شما نشان می‌دهد در دروس عمومی عملکرد رو به رشدی دارید اما برای کسب رتبه برتر، باید روی دروس اختصاصی (زیست و شیمی برای تجربی یا حسابان برای ریاضی) سرمایه‌گذاری بیشتری کنید. هر یک تست صحیح در این دروس، رتبه شما را هزاران نفر ارتقا می‌دهد.
          </p>
          <div className="text-[10px] font-black text-emerald-700 mt-2 bg-emerald-50 border border-emerald-100 rounded-lg p-2 flex items-center gap-1 justify-start">
            <Check size={12} />
            <span>سیستم مانیتورینگ متصل به کارتابل مشاور هوشمند (آماده ارسال گزارش)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
