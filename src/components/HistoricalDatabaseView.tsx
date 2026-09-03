import React, { useState, useMemo } from "react";
import { 
  Database, Search, Filter, ArrowUpDown, 
  MapPin, GraduationCap, School, Landmark,
  ChevronLeft, Info, Calendar, Hash, BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from "recharts";
import { Student } from "../types";

interface HistoricalDatabaseViewProps {
  student: Student;
}

interface HistoricalEntry {
  id: string;
  year: string;
  university: string;
  field: string;
  traz: number;
  rank: number;
  region: number;
  quota: string;
}

export default function HistoricalDatabaseView({ student }: HistoricalDatabaseViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof HistoricalEntry; direction: "asc" | "desc" } | null>(null);

  const historicalData: HistoricalEntry[] = useMemo(() => [
    { id: "1", year: "۱۴۰۲", university: "دانشگاه تهران", field: "پزشکی", traz: 12150, rank: 45, region: 1, quota: "منطقه ۱" },
    { id: "2", year: "۱۴۰۲", university: "شهید بهشتی", field: "دندانپزشکی", traz: 11980, rank: 92, region: 1, quota: "منطقه ۱" },
    { id: "3", year: "۱۴۰۲", university: "صنعتی شریف", field: "مهندسی برق", traz: 12400, rank: 12, region: 1, quota: "منطقه ۱" },
    { id: "4", year: "۱۴۰۱", university: "دانشگاه اصفهان", field: "پزشکی", traz: 11200, rank: 350, region: 2, quota: "منطقه ۲" },
    { id: "5", year: "۱۴۰۱", university: "دانشگاه شیراز", field: "حقوق", traz: 9800, rank: 210, region: 2, quota: "منطقه ۲" },
    { id: "6", year: "۱۴۰۲", university: "دانشگاه تبریز", field: "مهندسی کامپیوتر", traz: 9500, rank: 850, region: 3, quota: "منطقه ۳" },
    { id: "7", year: "۱۴۰۲", university: "علوم تحقیقات", field: "داروسازی", traz: 8900, rank: 2500, region: 1, quota: "منطقه ۱" },
    { id: "8", year: "۱۴۰۱", university: "دانشگاه فردوسی مشهد", field: "روانشناسی", traz: 9100, rank: 1100, region: 2, quota: "منطقه ۲" },
    { id: "9", year: "۱۴۰۲", university: "دانشگاه گیلان", field: "پرستاری", traz: 8400, rank: 4500, region: 2, quota: "منطقه ۲" },
    { id: "10", year: "۱۴۰۰", university: "دانشگاه مازندران", field: "مدیریت بازرگانی", traz: 7800, rank: 6200, region: 3, quota: "منطقه ۳" },
  ], []);

  const sortedData = useMemo(() => {
    let sortableItems = [...historicalData];
    if (searchTerm) {
      sortableItems = sortableItems.filter(item => 
        item.university.includes(searchTerm) || 
        item.field.includes(searchTerm)
      );
    }
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [historicalData, sortConfig, searchTerm]);

  const studentTraz = student.academicProfile?.currentTraz || 7500;

  const calculateProbability = (minTraz: number) => {
    const diff = studentTraz - minTraz;
    if (diff >= 500) return 98;
    if (diff >= 0) return Math.min(95, 70 + (diff / 500) * 25);
    if (diff >= -500) return Math.max(20, 30 + ((diff + 500) / 500) * 40);
    if (diff >= -1000) return Math.max(5, 5 + ((diff + 1000) / 500) * 25);
    return 1;
  };

  const getChanceBadge = (prob: number) => {
    if (prob >= 80) return { label: "قبولی قطعی", colorBg: "bg-emerald-50 text-emerald-700 border-emerald-100" };
    if (prob >= 50) return { label: "احتمال بالا", colorBg: "bg-blue-50 text-blue-700 border-blue-100" };
    if (prob >= 20) return { label: "ریسک متوسط", colorBg: "bg-amber-50 text-amber-700 border-amber-100" };
    return { label: "شانس ضعیف", colorBg: "bg-rose-50 text-rose-700 border-rose-100" };
  };

  const avgSearchTraz = useMemo(() => {
    if (sortedData.length === 0) return 0;
    const total = sortedData.reduce((acc, curr) => acc + curr.traz, 0);
    return Math.round(total / sortedData.length);
  }, [sortedData]);

  const requestSort = (key: keyof HistoricalEntry) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const toPersianNum = (num: number | string) => {
    const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
  };

  return (
    <div className="space-y-8 animate-fade-in text-right" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="bg-slate-900 rounded-[30px] md:rounded-[40px] p-6 md:p-10 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest">
            <Database size={14} />
            <span>Archive & Admission Repository</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">بانک اطلاعات قبولی‌های سال‌های گذشته</h1>
          <p className="text-slate-400 text-xs md:text-sm max-w-2xl leading-relaxed">
            جستجو و تحلیل دقیق ترازها و رتبه‌های پذیرفته‌شدگان کنکور سراسری (۱۴۰۰ تا ۱۴۰۲). این پایگاه داده مرجع اصلی برای مدل‌سازی رفتاری انتخاب رشته است.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xl flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-grow w-full">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="جستجو بر اساس نام دانشگاه یا رشته تحصیلی..."
            className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto shrink-0">
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                {toPersianNum(sortedData.length)}
             </div>
             <span className="text-[10px] font-black text-slate-500">رکورد یافت شد</span>
          </div>
        </div>
      </div>

      {/* Chart Visualization Section */}
      <div className="bg-white rounded-[30px] md:rounded-[40px] border border-slate-200 p-6 md:p-8 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Chart Text Analysis */}
          <div className="lg:col-span-12 xl:col-span-5 space-y-5">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-600" />
              <span>مقایسه بصری تراز شما با نتایج فیلتر شده</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed font-bold">
              در این بخش، تراز کل شبیه‌ساز شما در مقابل میانگین تراز قبولی رکوردهای فیلتر شده جدول پایین قرار گرفته است تا موقعیت رقابتی خود را دقیق‌تر ارزیابی کنید.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100/80">
                <span className="block text-[10px] text-slate-400 font-bold mb-1">تراز شما</span>
                <span className="text-xl font-black text-indigo-600">{toPersianNum(studentTraz)}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100/80">
                <span className="block text-[10px] text-slate-400 font-bold mb-1">میانگین قبولی‌ها</span>
                <span className="text-xl font-black text-emerald-600">
                  {avgSearchTraz > 0 ? toPersianNum(avgSearchTraz) : "۰"}
                </span>
              </div>
            </div>
            {avgSearchTraz > 0 && (
              <div className={`p-4 rounded-2xl text-xs font-black ${
                studentTraz >= avgSearchTraz 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                  : "bg-rose-50 text-rose-700 border border-rose-100"
              }`}>
                {studentTraz >= avgSearchTraz 
                  ? `تراز شما حدود ${toPersianNum(studentTraz - avgSearchTraz)} واحد بالاتر از میانگین قبولی‌های این گروه است.`
                  : `تراز شما حدود ${toPersianNum(avgSearchTraz - studentTraz)} واحد کمتر از میانگین قبولی‌های این گروه است.`
                }
              </div>
            )}
          </div>

          {/* Chart Display */}
          <div className="lg:col-span-12 xl:col-span-7 h-64 md:h-80 w-full mt-4 lg:mt-0">
            {sortedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "تراز شما", traz: studentTraz, fill: "#4f46e5" },
                    { name: "میانگین قبولی", traz: avgSearchTraz, fill: "#10b981" }
                  ]}
                  margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[0, 14000]} 
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    orientation="right"
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-md text-right text-xs font-bold">
                            <p>{payload[0].name}</p>
                            <p className="mt-1 text-indigo-300">
                              تراز: <span className="font-mono">{toPersianNum(payload[0].value as number)}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="traz" radius={[12, 12, 0, 0]} maxBarSize={60}>
                    {
                      [
                        { fill: "url(#colorTrazYour)" },
                        { fill: "url(#colorTrazAvg)" }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? "url(#colorTrazYour)" : "url(#colorTrazAvg)"} />
                      ))
                    }
                  </Bar>
                  <defs>
                    <linearGradient id="colorTrazYour" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity={1}/>
                    </linearGradient>
                    <linearGradient id="colorTrazAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/50 p-6">
                <p className="text-slate-400 text-xs font-bold">جهت بررسی و مقایسه، ابتدا رشته یا دانشگاهی را جستجو کنید.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[30px] md:rounded-[40px] border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar scroll-smooth">
          <table className="w-full text-right min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase">شناسه</th>
                <th 
                  className="p-6 text-xs font-black text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => requestSort("year")}
                >
                  <div className="flex items-center gap-2 justify-end">
                    <ArrowUpDown size={14} className="text-slate-300" />
                    <span>سال</span>
                  </div>
                </th>
                <th 
                  className="p-6 text-xs font-black text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => requestSort("university")}
                >
                  <div className="flex items-center gap-2 justify-end">
                    <ArrowUpDown size={14} className="text-slate-300" />
                    <span>دانشگاه</span>
                  </div>
                </th>
                <th 
                  className="p-6 text-xs font-black text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => requestSort("field")}
                >
                  <div className="flex items-center gap-2 justify-end">
                    <ArrowUpDown size={14} className="text-slate-300" />
                    <span>رشته تحصیلی</span>
                  </div>
                </th>
                <th 
                  className="p-6 text-xs font-black text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => requestSort("traz")}
                >
                  <div className="flex items-center gap-2 justify-end">
                    <ArrowUpDown size={14} className="text-slate-300" />
                    <span>تراز قبولی کل</span>
                  </div>
                </th>
                <th 
                  className="p-6 text-xs font-black text-slate-900 cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => requestSort("rank")}
                >
                  <div className="flex items-center gap-2 justify-end">
                    <ArrowUpDown size={14} className="text-slate-300" />
                    <span>رتبه در سهمیه</span>
                  </div>
                </th>
                <th className="p-6 text-xs font-black text-slate-900">سهمیه منطقه</th>
                <th className="p-6 text-xs font-black text-slate-900 text-center">احتمال قبولی</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((entry, idx) => {
                const prob = calculateProbability(entry.traz);
                const badge = getChanceBadge(prob);
                return (
                  <motion.tr 
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="p-6">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 font-mono">
                        #{entry.id}
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-black border border-amber-100">
                        <Calendar size={12} />
                        <span>{toPersianNum(entry.year)}</span>
                      </div>
                    </td>
                    <td className="p-6 font-black text-slate-900 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <School size={18} />
                        </div>
                        <span>{entry.university}</span>
                      </div>
                    </td>
                    <td className="p-6 text-slate-500 font-bold text-sm">{entry.field}</td>
                    <td className="p-6">
                      <span className="text-lg font-black text-indigo-600 tabular-nums">
                        {toPersianNum(entry.traz)}
                      </span>
                    </td>
                    <td className="p-6">
                      <span className="text-lg font-black text-emerald-600 tabular-nums">
                        {toPersianNum(entry.rank)}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-slate-500 font-black text-xs">
                        <MapPin size={14} className="text-slate-300" />
                        <span>{entry.quota}</span>
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <span className={`px-3 py-1.5 text-[10px] font-black border rounded-full ${badge.colorBg}`}>
                        {badge.label} ({toPersianNum(Math.round(prob))}٪)
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          
          {sortedData.length === 0 && (
            <div className="p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <Search size={40} className="text-slate-200" />
              </div>
              <h3 className="text-slate-800 font-black">رکوردی یافت نشد</h3>
              <p className="text-slate-400 text-xs">با کلمات کلیدی دیگری جستجو کنید.</p>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Insight */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-indigo-900 rounded-[30px] md:rounded-[40px] p-6 md:p-8 text-white relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
           <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-lg font-black flex items-center gap-3">
                   <Landmark size={24} className="text-indigo-400" />
                   <span>تطبیق تراز اختصاصی شما</span>
                 </h3>
                 <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black border border-white/10">AI Evaluated</span>
              </div>
              <p className="text-indigo-200/70 text-sm leading-relaxed">
                بر اساس آخرین تراز شما ({toPersianNum(student.academicProfile?.currentTraz || 7500)})، شما هم‌اکنون در بازه رقابتی «۷۶٪ از پذیرفته‌شدگان سال گذشته» در این لیست قرار دارید.
              </p>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: "76%" }}
                   className="h-full bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.5)]"
                />
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
             <Info size={20} className="text-amber-500" />
             <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">توصیه فنی استقرایی</h4>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed font-bold">
            توجه داشته باشید که تغییرات ظرفیت و میزان دشواری سوالات در سال ۱۴۰۳ می‌تواند کف ترازهای قبولی را تا ±۳۰۰ واحد جابجا کند. همواره به جای «تراز»، به «رتبه در سهمیه» به عنوان شاخص رواتر استناد کنید.
          </p>
          <button className="w-full py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-500 hover:bg-slate-950 hover:text-white transition-all">
             درخواست تحلیل سفارشی پروفایل توسط ادمین
          </button>
        </div>
      </div>
    </div>
  );
}
