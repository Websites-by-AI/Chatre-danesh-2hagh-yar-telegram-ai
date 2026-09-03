import React, { useState, useMemo } from "react";
import { 
  GraduationCap, Target, MapPin, Landmark, 
  Search, Info, ChevronLeft, 
  CheckCircle2, AlertTriangle, Building2, Compass,
  BarChart3, Fingerprint
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Student } from "../types";

interface CounselingAdvisorViewProps {
  student: Student;
}

interface AcceptanceBenchmark {
  university: string;
  field: string;
  minRank: number;
  maxRank: number;
  minTraz: number;
  type: "state" | "private" | "medical";
  region: number;
}

export default function CounselingAdvisorView({ student }: CounselingAdvisorViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRegion, setFilterRegion] = useState<number | "all">("all");
  const [filterType, setFilterType] = useState<string>("all");

  const benchmarks: AcceptanceBenchmark[] = useMemo(() => [
    { university: "دانشگاه تهران", field: "پزشکی", minRank: 1, maxRank: 150, minTraz: 12000, type: "medical", region: 1 },
    { university: "شهید بهشتی", field: "دندانپزشکی", minRank: 20, maxRank: 220, minTraz: 11800, type: "medical", region: 1 },
    { university: "صنعتی شریف", field: "مهندسی کامپیوتر", minRank: 1, maxRank: 100, minTraz: 12500, type: "state", region: 1 },
    { university: "دانشگاه شیراز", field: "پزشکی", minRank: 200, maxRank: 600, minTraz: 10800, type: "medical", region: 2 },
    { university: "دانشگاه اصفهان", field: "حقوق", minRank: 50, maxRank: 450, minTraz: 9800, type: "state", region: 2 },
    { university: "دانشگاه تبریز", field: "مهندسی عمران", minRank: 500, maxRank: 1500, minTraz: 9200, type: "state", region: 3 },
    { university: "علوم تحقیقات", field: "داروسازی", minRank: 1000, maxRank: 3000, minTraz: 8800, type: "private", region: 1 },
    { university: "دانشگاه گیلان", field: "پرستاری", minRank: 2000, maxRank: 5000, minTraz: 8400, type: "medical", region: 2 },
  ], []);

  const studentTraz = student.academicProfile?.currentTraz || 9500;
  const studentRank = parseInt(student.grade.match(/\d+/)?.[0] || "1500");

  const filteredBenchmarks = benchmarks.filter(b => {
    const matchesSearch = b.university.includes(searchTerm) || b.field.includes(searchTerm);
    const matchesRegion = filterRegion === "all" || b.region === filterRegion;
    const matchesType = filterType === "all" || b.type === filterType;
    return matchesSearch && matchesRegion && matchesType;
  });

  const calculateProbability = (minTraz: number) => {
    const diff = studentTraz - minTraz;
    if (diff >= 500) return 98;
    if (diff >= 0) return Math.min(95, 70 + (diff / 500) * 25);
    if (diff >= -500) return Math.max(20, 30 + ((diff + 500) / 500) * 40);
    if (diff >= -1000) return Math.max(5, 5 + ((diff + 1000) / 500) * 25);
    return 1;
  };

  const getChanceVisuals = (prob: number) => {
    if (prob >= 80) return { label: "قبولی قطعی", color: "#10b981", bg: "bg-emerald-500/10", textColor: "text-emerald-500" };
    if (prob >= 50) return { label: "احتمال بالا", color: "#3b82f6", bg: "bg-blue-500/10", textColor: "text-blue-500" };
    if (prob >= 20) return { label: "ریسک متوسط", color: "#f59e0b", bg: "bg-amber-500/10", textColor: "text-amber-500" };
    return { label: "شانس ضعیف", color: "#ef4444", bg: "bg-rose-500/10", textColor: "text-rose-500" };
  };

  const toPersianNum = (num: number | string) => {
    const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return Math.round(Number(num)).toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
  };

  return (
    <div className="space-y-8 animate-fade-in text-right" style={{ direction: "rtl" }}>
      {/* Hero Section */}
      <div className="bg-slate-950 rounded-[30px] md:rounded-[40px] p-6 md:p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -mr-48 -mt-48 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
              <Compass size={14} className="animate-spin-slow" />
              <span>Statistical Admission Forecast</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">پنل مشاوره و تخمین آماری قبولی</h1>
            <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed">
              این واحد با استفاده از رگرسیون تراز و وزن‌دهی به سهمیه مناطق، احتمال حضور شما در دانشگاه‌های هدف را بر اساس داده‌های پذیرش قطعی سال ۱۴۰۲ تحلیل می‌کند.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            {[
              { label: "تراز مبنا", val: studentTraz, color: "text-indigo-400" },
              { label: "رتبه تخمینی", val: studentRank, color: "text-emerald-400" }
            ].map((stat, i) => (
              <div key={i} className="p-4 md:p-5 bg-white/[0.03] backdrop-blur-xl rounded-[24px] md:rounded-[32px] border border-white/10 text-center min-w-[120px] md:min-w-[140px] shadow-2xl">
                <span className="block text-[8px] md:text-[10px] text-slate-500 font-black mb-1 uppercase tracking-tighter">{stat.label}</span>
                <span className={`text-xl md:text-3xl font-black ${stat.color}`}>{toPersianNum(stat.val)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 shadow-xl flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="جستجو در دیتابیس پذیرش..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={filterRegion} 
            onChange={(e) => setFilterRegion(e.target.value === "all" ? "all" : parseInt(e.target.value))}
            className="flex-grow md:flex-grow-0 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black outline-none cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <option value="all">همه مناطق</option>
            <option value="1">منطقه ۱</option>
            <option value="2">منطقه ۲</option>
            <option value="3">منطقه ۳</option>
          </select>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-grow md:flex-grow-0 px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black outline-none cursor-pointer hover:bg-slate-100 transition-colors"
          >
            <option value="all">همه مدل‌ها</option>
            <option value="state">دولتی</option>
            <option value="medical">پزشکی</option>
            <option value="private">آزاد</option>
          </select>
        </div>
      </div>

      {/* Acceptance Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredBenchmarks.map((b, i) => {
                const prob = calculateProbability(b.minTraz);
                const visual = getChanceVisuals(prob);
                const pieData = [{ value: prob }, { value: 100 - prob }];

                return (
                  <motion.div 
                    key={`${b.university}-${b.field}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white border border-slate-100 p-6 rounded-[30px] md:rounded-[40px] shadow-lg hover:shadow-2xl hover:border-indigo-100 transition-all group overflow-hidden relative"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: visual.color }} />
                          <span className="text-[10px] font-black text-slate-400 uppercase">{b.university}</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 leading-tight">{b.field}</h3>
                      </div>
                      <div className="h-16 w-16 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              innerRadius={20}
                              outerRadius={28}
                              paddingAngle={0}
                              dataKey="value"
                              startAngle={90}
                              endAngle={-270}
                            >
                              <Cell fill={visual.color} stroke="none" />
                              <Cell fill="#f1f5f9" stroke="none" />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-black" style={{ color: visual.color }}>
                            {toPersianNum(prob)}٪
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                       <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 group-hover:bg-indigo-50/30 transition-colors">
                         <span className="block text-[8px] text-slate-400 font-bold mb-1 uppercase tracking-widest">تراز لازم</span>
                         <span className="text-sm font-black text-slate-800">{toPersianNum(b.minTraz)}</span>
                       </div>
                       <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 group-hover:bg-indigo-50/30 transition-colors">
                         <span className="block text-[8px] text-slate-400 font-bold mb-1 uppercase tracking-widest">منطقه بومی</span>
                         <span className="text-sm font-black text-slate-800">{toPersianNum(b.region)}</span>
                       </div>
                    </div>

                    <div className={`p-4 rounded-[28px] ${visual.bg} border border-transparent flex items-center justify-between`}>
                        <div className="flex items-center gap-2">
                           <Fingerprint size={16} className={visual.textColor} />
                           <span className={`text-[10px] font-black ${visual.textColor}`}>{visual.label}</span>
                        </div>
                        <button className="p-2 bg-white rounded-xl shadow-sm hover:scale-110 transition-transform">
                          <ChevronLeft size={14} className="text-slate-400" />
                        </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Sidebar Insights */}
        <div className="lg:col-span-4 space-y-6">
           <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-xl space-y-8">
             <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
               <div className="p-2 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
                 <BarChart3 size={20} />
               </div>
               <h3 className="text-sm font-black text-slate-900">توزیع شانس موفقیت</h3>
             </div>

             <div className="space-y-5">
                {[
                  { label: "بسیار خوش‌بینانه", count: 12, color: "bg-emerald-500", prob: "80%+" },
                  { label: "واقع‌بینانه", count: 28, color: "bg-blue-500", prob: "50-80%" },
                  { label: "خوش‌بینانه (ریسک بالا)", count: 45, color: "bg-amber-500", prob: "20-50%" },
                  { label: "صرفاً جهت بررسی", count: 110, color: "bg-rose-500", prob: "<20%" }
                ].map((stat, i) => (
                  <div key={i} className="group cursor-default">
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-xs font-black text-slate-700">{stat.label}</span>
                       <span className="text-[10px] font-bold text-slate-400">{toPersianNum(stat.count)} رشته/محل</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(stat.count/195)*100}%` }}
                        className={`h-full ${stat.color}`}
                       />
                    </div>
                  </div>
                ))}
             </div>

             <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 mt-8 text-right">
                <div className="flex items-center gap-2 mb-3 text-slate-900">
                   <Target size={18} />
                   <h4 className="text-xs font-black">هدف‌گذاری بهینه</h4>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  استراتژی پیشنهادی: با تراز {toPersianNum(studentTraz)}، تمرکز شما باید بر روی انتخاب‌های «واقع‌بینانه» در دانشگاه‌های مرکز استان باشد تا ضریب پذیرش به حداکثر برسد.
                </p>
             </div>
           </div>

           <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                   <Landmark className="text-indigo-400" size={24} />
                   <h3 className="text-lg font-black leading-tight">تغییرات ظرفیت آزمون ۱۴۰۳</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-bold text-slate-300">علوم پزشکی دانشگاه تهران</span>
                    <span className="text-[10px] font-black text-emerald-400">٪۸+ رشد</span>
                  </div>
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-bold text-slate-300">مهندسی صنعتی اصفهان</span>
                    <span className="text-[10px] font-black text-rose-400">٪۲- کاهش</span>
                  </div>
                </div>
                <button className="w-full py-4 bg-white/10 hover:bg-white text-indigo-100 hover:text-indigo-950 rounded-2xl text-[10px] font-black transition-all border border-white/10 shadow-lg flex items-center justify-center gap-2">
                  <Fingerprint size={14} />
                  <span>بررسی سهمیه داوطلب</span>
                </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
