import React, { useState } from "react";
import { Calendar, Clock, BookOpen, Target, Sparkles, CheckCircle2, Award, Zap, ArrowRight, Download } from "lucide-react";
import { Student } from "../types";

interface StudyPlannerGeneratorProps {
  student: Student;
  onNavigate: (view: string) => void;
}

export default function StudyPlannerGenerator({ student, onNavigate }: StudyPlannerGeneratorProps) {
  const [targetHours, setTargetHours] = useState(10);
  const [selectedExamType, setSelectedExamType] = useState("konkur_master");
  const [studyShift, setStudyShift] = useState("morning_heavy");
  const [generatedPlan, setGeneratedPlan] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const fieldName = student.field === "tajrobi" ? "علوم تجربی (پزشکی/دندان)" : student.field === "riazi" ? "ریاضی فیزیک (مهندسی شریف)" : "علوم انسانی (وکالت/روانشناسی)";
      
      setGeneratedPlan({
        title: `نقشه راه مهندسی‌شده کایزن برای ${student.name}`,
        profile: fieldName,
        dailyHours: targetHours,
        examStandard: selectedExamType === "konkur_master" ? "کنکور سراسری ۱۴۰۵ (سطح فوق سخت)" : "آزمون‌های آزمایشی جامع (سطح استاندارد)",
        strategy: "تلفیق پارت‌های ۵۰ دقیقه‌ای پومودورو با تست‌های تله‌دار کایزن و مرورهای ۳ مرحله‌ای.",
        schedule: [
          { day: "شنبه", morning: "مطالعه خط‌به‌خط کتاب درسی و تحلیل مفهومی (۴ ساعت)", afternoon: "حل ۵۰ تست زمان‌دار تله‌دار + تحلیل غلط‌ها", totalQ: 50 },
          { day: "یکشنبه", morning: "مرور فرمول‌ها و حل مسائل محاسباتی پیشرفته (۴ ساعت)", afternoon: "آزمون موضوعی موازی و رفع اشکال عارضه‌یابی", totalQ: 45 },
          { day: "دوشنبه", morning: "مطالعه دروس حفظی/مفهومی و خلاصه‌نویسی نموداری (۳ ساعت)", afternoon: "تست‌زنی جامع و بررسی پاسخ‌نامه تشریحی", totalQ: 40 },
          { day: "سه‌شنبه", morning: "شبیه‌ساز نیمه‌جامع کنکور سال‌های گذشته (۴ ساعت)", afternoon: "تحلیل موشکافانه تراز و مدیریت زمان ضربدر منها", totalQ: 60 },
          { day: "چهارشنبه", morning: "رفع اشکال مباحث آسیب‌دیده و مرور دوره‌ای (۳ ساعت)", afternoon: "حل تست‌های سطح المپیاد و تله‌های پرتکرار", totalQ: 35 },
          { day: "پنجشنبه", morning: "آزمون جامع آزمایشی آزمون‌محور (۴ ساعت)", afternoon: "تحلیل کارنامه و استراحت بازسازنده ذهن", totalQ: 50 },
          { day: "جمعه", morning: "مرور خلاصه‌ها، استراحت و ریکاوری روحی کایزن", afternoon: "آماده‌سازی برای استریک هفته جدید", totalQ: 20 },
        ],
        extracurricular: [
          "کارگاه آنلاین تحلیل تله‌های تستی زیست‌شناسی و شیمی (چهارشنبه‌ها ساعت ۱۸)",
          "جلسه مشاوره گروهی مدیریت استرس و بهداشت روان کنکور (پنج‌شنبه‌ها ساعت ۱۱)",
          "دوره حل مسائل سرعت محاسبات بدون چک‌نویس در ریاضی و فیزیک"
        ]
      });
      setIsGenerating(false);
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto RTL pb-16" style={{ direction: 'rtl' }}>
      
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-950 rounded-[32px] p-8 text-right text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold text-indigo-200">
            <Sparkles size={14} className="text-amber-400" />
            <span>سیستم هوشمند مهندسی برنامه‌ریزی درسی و نقشه راه کنکور</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black">طراح تخصصی برنامه مطالعاتی بر اساس کارنامه و تراز</h1>
          <p className="text-xs md:text-sm text-indigo-200/90 font-medium leading-relaxed max-w-2xl">
            این سیستم بر اساس رشته تخصصی (${student.field})، ساعت مطالعه دلخواه شما، و استانداردهای آزمون‌های سراسری، یک نقشه راه اختصاصی همراه با کلاس‌های فوق‌برنامه و پارت‌های پومودورو تولید می‌کند.
          </p>
        </div>
      </div>

      {/* Generator Controls */}
      <div className="bg-white rounded-[32px] p-8 border border-slate-150 shadow-sm space-y-6">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Target size={18} className="text-indigo-600" />
          <span>تنظیم پارامترهای برنامه‌ریزی اختصاصی</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700">هدف ساعت مطالعه روزانه</label>
            <select 
              value={targetHours} 
              onChange={e => setTargetHours(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              <option value={8}>۸ ساعت (متعادل)</option>
              <option value={10}>۱۰ ساعت (پیشنهادی رتبه برتر)</option>
              <option value={12}>۱۲ ساعت (فوق سنگین / پشت کنکوری)</option>
              <option value={14}>۱۴ ساعت (بازه المپیاد و رتبه زیر ۱۰۰)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700">استاندارد آزمون مرجع</label>
            <select 
              value={selectedExamType} 
              onChange={e => setSelectedExamType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              <option value="konkur_master">کنکور سراسری (سطح فوق سخت و تله‌دار)</option>
              <option value="standard_mock">آزمون‌های جامع آزمایشی (استاندارد کشوری)</option>
              <option value="kaizen_olympiad">المپیاد علمی و سوالات چالشی مفهومی</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700">شیفت غالب مطالعه</label>
            <select 
              value={studyShift} 
              onChange={e => setStudyShift(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              <option value="morning_heavy">صبح سنگین (تمرکز روی دروس مفهومی و پایه)</option>
              <option value="evening_heavy">عصر سنگین (تمرکز روی تست‌زنی و مرور شبانه)</option>
              <option value="balanced">متوازن (پارت‌های مساوی صبح و عصر)</option>
            </select>
          </div>
        </div>

        <button 
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>در حال تحلیل کارنامه و ساخت برنامه مطالعاتی...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>تولید و ساخت نقشه راه مطالعاتی هوشمند</span>
            </>
          )}
        </button>
      </div>

      {/* Generated Plan Output */}
      {generatedPlan && (
        <div className="bg-white rounded-[32px] p-8 border border-slate-150 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-mono">
                {generatedPlan.profile}
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">{generatedPlan.title}</h2>
              <p className="text-xs text-slate-500 font-bold">{generatedPlan.strategy}</p>
            </div>
            
            <button 
              onClick={() => alert("برنامه مطالعاتی با موفقیت در فرمت PDF و به صورت دفترچه شخصی‌سازی‌شده دانلود شد.")}
              className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-md hover:bg-slate-800 transition"
            >
              <Download size={16} />
              <span>دانلود PDF برنامه هفته</span>
            </button>
          </div>

          {/* Weekly Schedule Table */}
          <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-600" />
              <span>جدول زمان‌بندی پارت‌های مطالعاتی هفته</span>
            </h4>

            <div className="grid grid-cols-1 gap-3">
              {generatedPlan.schedule.map((sch: any, idx: number) => (
                <div key={idx} className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-indigo-300 transition-all">
                  <div className="flex items-center gap-3 w-32 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center font-mono">
                      {sch.day}
                    </div>
                    <span className="text-xs font-black text-slate-900">{sch.day}</span>
                  </div>

                  <div className="flex-1 space-y-1 text-xs">
                    <p className="font-bold text-slate-800"><span className="text-indigo-600 font-black">شیفت اول:</span> {sch.morning}</p>
                    <p className="font-bold text-slate-600"><span className="text-emerald-600 font-black">شیفت دوم:</span> {sch.afternoon}</p>
                  </div>

                  <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-center shrink-0">
                    <span className="block text-[9px] text-slate-400 font-bold">تست هدف</span>
                    <span className="text-xs font-black text-indigo-950 font-mono">{sch.totalQ} تست</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extracurricular Classes & Workshops */}
          <div className="p-6 bg-indigo-50/60 rounded-3xl border border-indigo-100 space-y-4">
            <h4 className="text-xs font-black text-indigo-950 flex items-center gap-2">
              <Award size={16} className="text-indigo-600" />
              <span>کلاس‌های فوق‌برنامه و همایش‌های تخصصی الحاقی به برنامه:</span>
            </h4>
            <ul className="space-y-2.5">
              {generatedPlan.extracurricular.map((extra: string, i: number) => (
                <li key={i} className="flex items-center gap-2.5 text-xs font-bold text-indigo-900/80">
                  <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />
                  <span>{extra}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}

      {/* Back Button */}
      <div className="text-center">
        <button 
          onClick={() => onNavigate("dashboard")}
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-xs font-black transition-all bg-white border border-indigo-200 px-6 py-3 rounded-2xl shadow-sm"
        >
          <ArrowRight size={14} />
          <span>بازگشت به داشبورد اصلی</span>
        </button>
      </div>

    </div>
  );
}
