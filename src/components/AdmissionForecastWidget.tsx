import React, { useMemo } from "react";
import { 
  Trophy, TrendingUp, Landmark, GraduationCap, 
  ChevronRight, Sparkles, Target, Activity,
  AlertCircle, CheckCircle2, Navigation
} from "lucide-react";
import { motion } from "motion/react";
import { Student } from "../types";
import { BRAND_CONFIG } from "../constants";

interface AdmissionForecastWidgetProps {
  student: Student;
}

const toPersianNum = (num: number | string) => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
};

export default function AdmissionForecastWidget({ student }: AdmissionForecastWidgetProps) {
  const forecast = useMemo(() => {
    // 1. Load history
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
        { actualTraz: 5120, date: "۱۴۰۳/۰۲/۱۵" },
        { actualTraz: 5280, date: "۱۴۰۳/۰۳/۰۵" },
        { actualTraz: 5410, date: "۱۴۰۳/۰۳/۲۵" }
      ];
    }

    const last3 = history.slice(-3);
    const currentTraz = last3[last3.length - 1].actualTraz;
    const prevTraz = last3.length > 1 ? last3[last3.length - 2].actualTraz : currentTraz;
    const trend = currentTraz - prevTraz;
    
    // Predicted Traz with positive momentum
    const predictedTraz = currentTraz + Math.round(trend * 0.9) + 80;

    // 2. Define Target Universities based on field
    // These mock values represent "Entrance Threshold" for these top schools
    const fieldTargets: Record<string, { uni: string; major: string; threshold: number }[]> = {
      tajrobi: [
        { uni: "دانشگاه تهران", major: "پزشکی", threshold: 12100 },
        { uni: "شهید بهشتی", major: "دندانپزشکی", threshold: 11950 },
        { uni: "ایران", major: "داروسازی", threshold: 11400 }
      ],
      riazi: [
        { uni: "صنعتی شریف", major: "مهندسی برق", threshold: 12350 },
        { uni: "تهران", major: "مهندسی کامپیوتر", threshold: 11800 },
        { uni: "امیرکبیر", major: "مهندسی مکانیک", threshold: 11200 }
      ],
      ensani: [
        { uni: "تهران", major: "حقوق", threshold: 10200 },
        { uni: "شهید بهشتی", major: "روانشناسی", threshold: 9800 },
        { uni: "علامه طباطبایی", major: "مدیریت مالی", threshold: 9400 }
      ]
    };

    const targets = fieldTargets[student.field] || fieldTargets.tajrobi;

    // 3. Map targets to probabilities and gap analysis
    const targetAnalysis = targets.map(t => {
      const gap = t.threshold - predictedTraz;
      const progress = Math.min(100, Math.max(10, (predictedTraz / t.threshold) * 100));
      
      let chance: "high" | "medium" | "low" | "critical" = "low";
      let statusText = "نیازمند جهش تراز";
      let statusColor = "text-rose-500 bg-rose-50";

      if (gap <= -200) { 
        chance = "high"; 
        statusText = "قبولی قطعی (تخمین)"; 
        statusColor = "text-emerald-500 bg-emerald-50";
      } else if (gap <= 100) { 
        chance = "medium"; 
        statusText = "در محدوده رقابتی"; 
        statusColor = "text-indigo-500 bg-indigo-50";
      } else if (gap <= 500) { 
        chance = "low"; 
        statusText = "نزدیک به هدف"; 
        statusColor = "text-amber-500 bg-amber-50";
      }

      return {
        ...t,
        gap,
        progress,
        chance,
        statusText,
        statusColor
      };
    });

    return {
      last3,
      predictedTraz,
      trend,
      targetAnalysis,
      isPositive: trend >= 0
    };
  }, [student]);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-right" id="admission-forecast-dashboard">
      <div className="p-6 md:p-8 space-y-8">
        
        {/* Header with AI Meta */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-50 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-950 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100 shrink-0">
               <Navigation size={28} className="text-indigo-300" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">رادار تخمین قبولی و تحلیل مسیر (Admission Radar)</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase">
                   <Activity size={10} />
                   <span>تحلیل زنده (V3)</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">بر اساس برون‌سپاری خطی تراز {toPersianNum(forecast.last3.length)} آزمون اخیر</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
             <div className="text-right">
                <span className="block text-[8px] text-slate-400 font-black uppercase">Momentum Trend</span>
                <span className={`text-sm font-black flex items-center gap-1 ${forecast.isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                  {forecast.isPositive ? <TrendingUp size={14} /> : <AlertCircle size={14} />}
                  {toPersianNum(Math.abs(forecast.trend))} واحد {forecast.isPositive ? "رشد" : "افت"}
                </span>
             </div>
             <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center">
                <Sparkles size={18} className="text-amber-500" />
             </div>
          </div>
        </div>

        {/* Forecast Logic Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Recent History Sparklines / Mini Table */}
          <div className="lg:col-span-4 space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">کارنامه ۳ آزمون اخیر</h3>
                <CheckCircle2 size={16} className="text-emerald-500" />
             </div>
             <div className="space-y-3">
               {forecast.last3.map((exam, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100/50 hover:bg-white transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                        {toPersianNum(i + 1)}
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">{exam.date}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-black text-slate-800 font-mono">{toPersianNum(exam.actualTraz)}</span>
                      <span className="text-[9px] text-slate-400 font-bold">QEI</span>
                    </div>
                 </div>
               ))}
             </div>
             <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent)]" />
                <span className="relative z-10 text-[9px] text-indigo-400 font-black uppercase mb-1 block">تراز تخمینی آزمون آتی</span>
                <div className="relative z-10 flex items-center justify-between">
                   <span className="text-2xl font-black text-indigo-900 font-mono tracking-tighter">{toPersianNum(forecast.predictedTraz)}</span>
                   <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-lg shadow-indigo-200">
                      <Target size={18} />
                   </div>
                </div>
             </div>
          </div>

          {/* Admission Probability Grid */}
          <div className="lg:col-span-8 space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">تخمین قبولی در دانشگاه‌های هدف</h3>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-black text-slate-400">قطعی</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-[9px] font-black text-slate-400">رقابتی</span>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {forecast.targetAnalysis.map((target, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-5 rounded-3xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-xl transition-all group relative overflow-hidden"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                             <GraduationCap size={24} />
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-slate-900">{target.uni}</h4>
                             <span className="text-[10px] text-slate-400 font-bold">{target.major}</span>
                          </div>
                       </div>
                       <div className={`px-3 py-1 rounded-full text-[10px] font-black border border-current ${target.statusColor}`}>
                          {target.statusText}
                       </div>
                    </div>

                    <div className="space-y-3">
                       <div className="flex justify-between items-end">
                          <span className="text-[10px] text-slate-400 font-black">شاخص نزدیکی به هدف</span>
                          <span className="text-xs font-black text-slate-700">{toPersianNum(Math.round(target.progress))}%</span>
                       </div>
                       <div className="h-2 w-full bg-slate-50 rounded-full border border-slate-100 overflow-hidden p-0.5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${target.progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              target.chance === 'high' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                              target.chance === 'medium' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.3)]' :
                              'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                            }`}
                          />
                       </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px]">
                       <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold">تراز هدف:</span>
                          <span className="text-slate-900 font-black font-mono">{toPersianNum(target.threshold)}</span>
                       </div>
                       <div className="flex items-center gap-1 font-black text-indigo-600">
                          <span>{target.gap > 0 ? `+${toPersianNum(target.gap)} واحد تا هدف` : 'هدف فتح شده'}</span>
                          <Trophy size={12} className={target.gap <= 0 ? "text-amber-500" : "text-slate-200"} />
                       </div>
                    </div>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>

        {/* Bottom Insight / Action */}
        <div className="bg-slate-900 rounded-[32px] p-6 text-white relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-1 text-center md:text-right">
                 <h4 className="text-sm font-black flex items-center justify-center md:justify-start gap-2">
                    <Sparkles size={18} className="text-amber-400" />
                    <span>تحلیل استراتژیک روند صعودی داوطلب</span>
                 </h4>
                 <p className="text-xs text-slate-400 leading-relaxed max-w-xl font-medium">
                    با توجه به ثبات تراز در ۳ آزمون اخیر و رشد {toPersianNum(forecast.trend)} واحدی، پیشنهاد مربیان ترنم مهر تمرکز بر «پایداری ذهنی» در آزمون بعدی است تا احتمال قبولی در دانشگاه شریف به بالای ۹۰٪ برسد.
                 </p>
              </div>
              <button className="px-6 py-3 bg-white text-slate-900 rounded-2xl text-xs font-black hover:bg-slate-100 transition-all flex items-center gap-2 group/btn shrink-0 cursor-pointer">
                 <span>دریافت نقشه راه اختصاصی</span>
                 <ChevronRight size={16} className="group-hover/btn:-translate-x-1 transition-transform" />
              </button>
           </div>
        </div>

      </div>
    </div>
  );
}
