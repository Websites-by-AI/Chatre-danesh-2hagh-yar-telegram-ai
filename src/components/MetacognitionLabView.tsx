import React, { useState } from "react";
import { 
  Brain, Target, Activity, Zap, ShieldAlert, Eye, 
  BookMarked, TrendingUp, BarChart3, Info, Check, 
  AlertCircle, ArrowRight, RefreshCw, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Student } from "../types";

interface MetacognitionLabViewProps {
  student: Student;
  onNavigate?: (view: string) => void;
}

export default function MetacognitionLabView({ student }: MetacognitionLabViewProps) {
  const [activeCycle, setActiveCycle] = useState<"forethought" | "performance" | "reflection">("reflection");

  const errorData = [
    { name: "آزمون ۱", precision: 85, focus: 70, strategy: 60 },
    { name: "آزمون ۲", precision: 78, focus: 85, strategy: 65 },
    { name: "آزمون ۳", precision: 92, focus: 80, strategy: 75 },
    { name: "آزمون ۴", precision: 88, focus: 90, strategy: 82 },
  ];

  const toPersianNum = (num: number | string) => {
    const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
  };

  return (
    <div className="space-y-8 animate-fade-in text-right" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
              <Brain size={14} />
              <span>Metacognitive Performance Lab</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">آزمایشگاه فراشناخت و خودتنظیمی (Zimmerman Model)</h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              این واحد تخصصی بر اساس استانداردهای **APA** و مدل‌های یادگیری خودتنظیمی (**SRL**)، به تحلیل عمیق چرخه یادگیری شما می‌پردازد. هدف ما تبدیل «اشتباهات آزمونی» به «استراتژی‌های پیروزی» است.
            </p>
          </div>
          <div className="flex gap-3">
             <div className="p-4 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 text-center min-w-[120px]">
               <span className="block text-[10px] text-slate-500 font-black mb-1">شاخص خودتنظیمی</span>
               <span className="text-2xl font-black text-emerald-400">{toPersianNum(78)}٪</span>
             </div>
             <div className="p-4 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 text-center min-w-[120px]">
               <span className="block text-[10px] text-slate-500 font-black mb-1">اتکای استراتژیک</span>
               <span className="text-2xl font-black text-indigo-400">{toPersianNum(62)}٪</span>
             </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Zimmerman SRL Cycle View */}
        <div className="lg:col-span-8 bg-white rounded-[40px] border border-slate-200 shadow-xl overflow-hidden flex flex-col">
          <div className="p-8 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-2xl text-white">
                <RefreshCw size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-900">چرخه یادگیری خودتنظیمی هوشمند</h2>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-2xl">
              {[
                { id: "forethought", label: "برنامه‌ریزی و باورها", icon: Target },
                { id: "performance", label: "کنترل حین اجرا", icon: Activity },
                { id: "reflection", label: "تأمل و عارضه‌یابی", icon: RefreshCw }
              ].map((cycle) => (
                <button
                  key={cycle.id}
                  onClick={() => setActiveCycle(cycle.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                    activeCycle === cycle.id ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <cycle.icon size={14} />
                  <span>{cycle.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-8 flex-grow">
            <AnimatePresence mode="wait">
              {activeCycle === "reflection" && (
                <motion.div
                  key="reflection"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                        <h3 className="text-sm font-black text-indigo-900 mb-4 flex items-center gap-2">
                          <BarChart3 size={18} />
                          <span>تحلیل علنی خطاها (Error Attribution)</span>
                        </h3>
                        <div className="space-y-4">
                          {[
                            { label: "کمبود دانش عمیق", val: 45, color: "bg-rose-500" },
                            { label: "بی‌دقتی و نارسایی توجه", val: 30, color: "bg-amber-500" },
                            { label: "مدیریت زمان و استرس", val: 15, color: "bg-indigo-500" },
                            { label: "تله‌های تستی طراح", val: 10, color: "bg-slate-500" }
                          ].map((err, i) => (
                            <div key={i} className="space-y-1.5">
                              <div className="flex justify-between text-[10px] font-black text-slate-600">
                                <span>{err.label}</span>
                                <span>{toPersianNum(err.val)}٪</span>
                              </div>
                              <div className="h-1.5 w-full bg-white rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${err.val}%` }}
                                  className={`h-full ${err.color}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-6 bg-slate-900 rounded-3xl text-white">
                        <div className="flex items-center gap-3 mb-4">
                           <Zap size={20} className="text-amber-400" />
                           <h4 className="text-xs font-black">اصلاحات استراتژیک (Strategic Shift)</h4>
                        </div>
                        <ul className="space-y-3">
                          <li className="flex gap-2 items-start text-xs font-medium text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <span>انتقال زمان از دروس نقاط قوت به دروس چالش‌برانگیز در نیمه دوم آزمون.</span>
                          </li>
                          <li className="flex gap-2 items-start text-xs font-medium text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <span>استفاده از تکنیک «علامت‌گذاری چندلایه» برای تست‌های شک‌دار.</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div className="h-full min-h-[300px]">
                      <h3 className="text-xs font-black text-slate-400 mb-4 text-center uppercase tracking-widest">روند بهبود مهارتهای فراشناختی</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={errorData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 800 }} 
                          />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip 
                            contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", direction: "rtl" }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="precision" 
                            name="دقت" 
                            stroke="#10b981" 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="strategy" 
                            name="استراتژی" 
                            stroke="#6366f1" 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: "#6366f1", strokeWidth: 2, stroke: "#fff" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Standards Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[40px] border border-slate-200 shadow-xl p-8 space-y-6">
              <div className="flex items-center gap-3 text-slate-900 border-b border-slate-100 pb-4">
                <BookMarked size={22} className="text-indigo-600" />
                <h3 className="text-sm font-black">استانداردهای علمی پایش</h3>
              </div>
              
              <div className="space-y-4">
                <div className="group cursor-default">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase">APA Standard 3.1</span>
                    <span className="text-[10px] font-black text-emerald-600">منطبق</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">عدالت در سنجش و روایی محتوایی</h4>
                  <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">تضمین اینکه سوالات آزمون صرفاً توانایی شما را می‌سنجند، نه اضطراب شما را.</p>
                </div>

                <div className="group cursor-default">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Zimmerman SRL</span>
                    <span className="text-[10px] font-black text-emerald-600">منطبق</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">چرخه خودتنظیمی زیمرمن</h4>
                  <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">مدل پیشرفته برای کنترل هیجان و رفتار قبل، حین و بعد از فعالیت آموزشی.</p>
                </div>

                <div className="group cursor-default">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase">CBT Protocols</span>
                    <span className="text-[10px] font-black text-indigo-600">در حال اجرا</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">بازسازی شناختی باورهای سمی</h4>
                  <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">شناسایی و جایگزینی افکوری مانند «من همیشه خراب می‌کنم» با واقعیت‌های آماری.</p>
                </div>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-100">
                 <button className="w-full py-4 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                   <TrendingUp size={14} />
                   <span>دریافت گزارش جامع علمی (PDF)</span>
                 </button>
              </div>
           </div>

           <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16" />
             <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ShieldAlert size={24} />
                </div>
                <h3 className="text-lg font-black leading-tight">پایش هوشمند تله‌های شناختی</h3>
                <p className="text-white/70 text-[10px] font-medium leading-relaxed">
                  هوش مصنوعی ترنم مهر هم‌اکنون در حال تحلیل ۳۴۲ پارامتر رفتاری شما برای شناسایی دقیق کانون‌های حواس‌پرتی است.
                </p>
                <div className="mt-4 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "65%" }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    className="h-full bg-white shadow-[0_0_10px_#fff]"
                  />
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
