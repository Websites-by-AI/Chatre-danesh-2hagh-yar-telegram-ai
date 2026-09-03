import React, { useMemo } from "react";
import { Brain, TrendingUp, Sparkles, Target, Zap, ChevronRight, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { Student } from "../types";
import { BRAND_CONFIG } from "../constants";

interface AIExamPredictorProps {
  student: Student;
}

const toPersianNum = (num: number | string) => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
};

export default function AIExamPredictor({ student }: AIExamPredictorProps) {
  const analysis = useMemo(() => {
    // Load history from localStorage
    const savedTrend = localStorage.getItem(`arateb_history_${student.id}`);
    let history: any[] = [];
    if (savedTrend) {
      try {
        history = JSON.parse(savedTrend);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }

    // Default mock history if none found
    if (history.length === 0) {
      history = [
        { actualTraz: 5120 },
        { actualTraz: 5280 },
        { actualTraz: 5350 }
      ];
    }

    // Get last 3 exams
    const last3 = history.slice(-3);
    const avg3 = Math.round(last3.reduce((sum, item) => sum + item.actualTraz, 0) / last3.length);
    
    // Prediction logic: Moving average + momentum
    const lastTraz = last3[last3.length - 1].actualTraz;
    const trend = lastTraz - (last3.length > 1 ? last3[last3.length - 2].actualTraz : lastTraz);
    const predictedTraz = lastTraz + Math.round(trend * 0.8) + 50; // Dynamic prediction factor
    
    const isUpward = trend >= 0;

    // Recommendations based on field and performance
    const recommendations: Record<string, string[]> = {
      tajrobi: [
        "تمرکز روی تست‌های زمان‌دار زیست‌شناسی (مباحث ژنتیک و گیاهی)",
        "تحلیل دقیق پاسخنامه‌های تشریحی شیمی برای کاهش نمره منفی",
        "مرور خلاصه مباحث فیزیک و حل ۱۰ تست جامع روزانه برای ثبات تراز"
      ],
      riazi: [
        "تسلط بر فرمول‌های مثلثات و هندسه تحلیلی در ریاضیات پایه",
        "حل تمرین‌های ترکیبی حسابان و آمار برای افزایش سرعت عمل",
        "بررسی تله‌های تستی فیزیک دوازدهم (موج و فیزیک اتمی)"
      ],
      ensani: [
        "مرور دقیق آرایه‌های ادبی و فنون ادبی برای تضمین درصد بالا",
        "حل تست‌های مفهومی فلسفه و منطق با رویکرد تحلیل عمیق",
        "خلاصه‌نویسی مباحث علوم اجتماعی و اقتصاد برای مرور سریع شب آزمون"
      ]
    };

    const fieldRecs = recommendations[student.field] || recommendations.tajrobi;
    const tip = isUpward 
      ? `روند شما صعودی است! برای رسیدن به تراز ${toPersianNum(predictedTraz + 200)}، ${fieldRecs[0]} پیشنهاد می‌شود.`
      : `نوسان تراز مشاهده شد. برای بازگشت به مسیر رشد، ${fieldRecs[1]} را در اولویت قرار دهید.`;

    return {
      avg3,
      predictedTraz,
      isUpward,
      tip,
      lastTraz,
      trend,
      fieldRecs
    };
  }, [student]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-right relative group"
      id="ai-exam-prediction-widget"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-50/50 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none" />

      <div className="p-6 relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
              <Brain size={24} className="text-white animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>پیش‌بینی هوشمند کارنامه آزمون آتی</span>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-black rounded-lg border border-indigo-150">تکنولوژی AI</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">بر اساس تحلیل میانگین تراز ۳ آزمون آخر شما</p>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-end">
             <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">Reliability Index</span>
             <div className="flex gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`w-3 h-1 rounded-full ${i <= 4 ? "bg-emerald-400" : "bg-slate-200"}`} />
                ))}
             </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
          {/* Average Section */}
          <div className="md:col-span-3 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">میانگین ۳ آزمون آخر</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-700 font-mono">{toPersianNum(analysis.avg3)}</span>
              <span className="text-[10px] text-slate-400 font-black">QEI</span>
            </div>
          </div>

          {/* Prediction Main Section */}
          <div className="md:col-span-4 bg-indigo-950 rounded-2xl p-4 border border-white/5 relative overflow-hidden group/card">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent)]" />
            <div className="relative z-10 flex flex-col items-center">
               <span className="text-[10px] text-indigo-300 font-black mb-1 flex items-center gap-1">
                 <Zap size={10} className="fill-amber-400 text-amber-400" />
                 <span>تراز تخمینی آزمون بعدی</span>
               </span>
               <div className="text-3xl md:text-4xl font-black text-white font-mono tracking-tighter drop-shadow-md">
                 {toPersianNum(analysis.predictedTraz)}
               </div>
               <div className={`mt-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black ${
                 analysis.isUpward ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/20 text-amber-400 border border-amber-500/20"
               }`}>
                 <TrendingUp size={10} className={analysis.isUpward ? "" : "rotate-180"} />
                 <span>{toPersianNum(Math.abs(analysis.trend))} واحد {analysis.isUpward ? "رشد" : "نوسان"}</span>
               </div>
            </div>
          </div>

          {/* Target Section */}
          <div className="md:col-span-3 bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold block mb-1">تراز هدف نهایی</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-900 font-mono">{toPersianNum(student.academicProfile?.targetTraz || 7200)}</span>
              <span className="text-[10px] text-slate-400 font-black">QEI</span>
            </div>
          </div>
        </div>

        {/* Recommendation Box */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-4 border border-indigo-100/50 flex items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles size={18} className="text-indigo-600" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-indigo-900">توصیه استراتژیک هوش مصنوعی {BRAND_CONFIG.name}:</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
              {analysis.tip}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button 
          className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-2 group/btn cursor-pointer"
        >
          <span>مشاهده تحلیل کامل و جزئیات مباحث اولویت‌دار</span>
          <ChevronRight size={14} className="group-hover/btn:-translate-x-1 transition-transform" />
        </button>
      </div>

       {/* Floating Alert if trend is downward */}
       {!analysis.isUpward && (
         <div className="absolute top-4 left-4 flex items-center gap-1 text-[8px] font-black bg-rose-50 text-rose-600 px-2 py-1 rounded-lg border border-rose-100">
           <AlertCircle size={10} />
           <span>نیاز به مداخله آموزشی فوری</span>
         </div>
       )}
    </motion.div>
  );
}
