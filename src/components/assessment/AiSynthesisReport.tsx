import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Brain, Layers, Award, Wind, AlertCircle, Zap, ShieldAlert, Eye, RefreshCw } from "lucide-react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

interface AiSynthesisReportProps {
  studentName: string;
}

const toPersianNum = (n: number | string): string => {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};

export default function AiSynthesisReport({ studentName }: AiSynthesisReportProps) {
  const [loading, setLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState<any>(null);

  // Calibration states
  const [qAnxiety, setQAnxiety] = useState(4);
  const [qFocus, setQFocus] = useState(7);
  const [qPerfectionism, setQPerfectionism] = useState(5);
  const [qSleep, setQSleep] = useState(8);
  const [qStamina, setQStamina] = useState(6);

  const radarChartData = [
    { subject: "تمرکز (Focus)", A: qFocus * 10, fullMark: 100 },
    { subject: "کنترل اضطراب", A: (10 - qAnxiety) * 10, fullMark: 100 },
    { subject: "سرعت پردازش", A: qStamina * 10, fullMark: 100 },
    { subject: "دقت محاسباتی", A: (10 - qPerfectionism) * 10, fullMark: 100 },
    { subject: "ریکاوری ذهنی", A: qSleep * 10, fullMark: 100 }
  ];

  const handleAnalyze = () => {
    setLoading(true);
    setTimeout(() => {
      setCurrentReport({
        id: `PX-${Math.floor(Math.random() * 9000) + 1000}`,
        date: "امروز",
        stressLevel: qAnxiety * 10,
        diagnosis: "بررسی الگوهای رفتاری شما نشان می‌دهد که در پارت‌های پایانی آزمون دچار افت تمرکز مقطعی می‌شوید.",
        cognitiveTrap: "تله کمال‌گرایی در مدیریت زمان",
        meditationAdvice: "تنفس مربعی ۴ ثانیه‌ای بین دروس تخصصی",
        remedies: [
          "تکنیک ضربدر و منها در مدیریت زمان",
          "مرور سریع فرمول‌های کلیدی قبل از شروع محاسبات",
          "ایجاد فواصل استراحت کوتاه ۱۰ دقیقه‌ای"
        ]
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="ai-synthesis-tab">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-indigo-900">
            <Brain size={18} className="text-indigo-600" />
            <h2 className="text-sm font-black">کالیبراسیون شاخص‌های عصبی</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { label: "اضطراب آزمون", val: qAnxiety, set: setQAnxiety, color: "text-rose-600 bg-rose-50" },
              { label: "توان تمرکز", val: qFocus, set: setQFocus, color: "text-indigo-600 bg-indigo-50" },
              { label: "کمال‌گرایی", val: qPerfectionism, set: setQPerfectionism, color: "text-amber-600 bg-amber-50" },
              { label: "کیفیت خواب", val: qSleep, set: setQSleep, color: "text-emerald-600 bg-emerald-50" }
            ].map(s => (
              <div key={s.label} className="space-y-2">
                <div className="flex justify-between text-[11px] font-black">
                  <span className="text-slate-700">{s.label}</span>
                  <span className={`${s.color} px-2 py-0.5 rounded-lg`}>{toPersianNum(s.val)}</span>
                </div>
                <input type="range" min="1" max="10" value={s.val} onChange={e => s.set(Number(e.target.value))} className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              </div>
            ))}
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white py-3.5 rounded-2xl text-xs font-black transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} className="text-amber-400" />}
            <span>{loading ? "در حال تحلیل..." : "تحلیل چندمحوری عملکرد"}</span>
          </button>
        </div>
      </div>

      <div className="lg:col-span-8 space-y-6">
        {currentReport ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col items-center text-center">
              <h3 className="text-xs font-black text-slate-700 border-b border-slate-100 w-full pb-3 mb-6">سطح تنش و فرسودگی</h3>
              <div className="relative flex items-center justify-center">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="52" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                  <circle 
                    cx="64" cy="64" r="52" 
                    stroke={currentReport.stressLevel > 70 ? "#ef4444" : "#10b981"} 
                    strokeWidth="10" fill="transparent" 
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - currentReport.stressLevel / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <span className="absolute text-3xl font-black text-slate-800">{toPersianNum(currentReport.stressLevel)}٪</span>
              </div>
            </div>

            <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm">
              <h3 className="text-xs font-black text-indigo-950 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Award size={15} className="text-indigo-600" />
                <span>ماتریس مهارت‌های مدیریت آزمون</span>
              </h3>
              <div className="h-56 mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#64748b", fontSize: 9, fontWeight: 900 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar dataKey="A" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.15} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="col-span-12 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-2">
                <span className="text-[9px] font-black text-indigo-600 uppercase">Diagnosis Note</span>
                <p className="text-xs font-semibold leading-relaxed text-slate-700">{currentReport.diagnosis}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/30">
                  <span className="text-[9px] font-black text-amber-600 flex items-center gap-1"><AlertCircle size={10} /> تله فعال:</span>
                  <p className="text-xs font-black text-slate-800">{currentReport.cognitiveTrap}</p>
                </div>
                <div className="p-4 rounded-2xl border border-teal-100 bg-teal-50/30">
                  <span className="text-[9px] font-black text-teal-600 flex items-center gap-1"><Wind size={10} /> ریتم تنفس پیشنهادی:</span>
                  <p className="text-xs font-bold text-slate-700">{currentReport.meditationAdvice}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-12 text-center">
            <div className="space-y-4">
              <Sparkles size={48} className="mx-auto text-slate-200" />
              <p className="text-xs text-slate-400 font-bold">برای صدور گزارش هوشمند، دکمه «تحلیل چندمحوری» را کلیک کنید.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
