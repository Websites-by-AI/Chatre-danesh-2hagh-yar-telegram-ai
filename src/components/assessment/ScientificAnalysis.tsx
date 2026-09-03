import React from "react";
import { BookMarked, TrendingUp, BarChart3, Info, ExternalLink } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const toPersianNum = (n: number | string): string => {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};

export default function ScientificAnalysis() {
  const lineData = [
    { name: "آزمون ۱", score: 65 },
    { name: "آزمون ۲", score: 72 },
    { name: "آزمون ۳", score: 68 },
    { name: "آزمون ۴", score: 82 }
  ];

  return (
    <div className="space-y-8" id="scientific-analysis-tab">
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BookMarked size={20} className="text-indigo-600" />
              <span>گزارش جامع روایی و پایایی عملکرد (Scientific Audit)</span>
            </h2>
            <p className="text-xs text-slate-400 font-bold">تحلیل آماری بر اساس استانداردهای آموزشی روان‌سنجی.</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black border border-emerald-100">درجه روایی: بالا</span>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[9px] font-black border border-indigo-100">پایایی: ۰.۸۹</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
             <div className="h-64 w-full bg-slate-50 p-4 rounded-3xl border border-slate-100">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={lineData}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                   <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                   <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} domain={[0, 100]} />
                   <Tooltip />
                   <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={4} dot={{ r: 6, fill: "#4f46e5", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 8 }} />
                 </LineChart>
               </ResponsiveContainer>
             </div>
             <p className="text-[11px] text-slate-500 font-bold leading-relaxed text-center">نمودار روند آمادگی تحصیلی در ۴ آزمون اخیر</p>
          </div>

          <div className="space-y-4">
             <div className="p-5 bg-indigo-900 text-white rounded-[32px] space-y-4">
                <h4 className="text-xs font-black">شاخص آمادگی نهایی</h4>
                <div className="text-4xl font-black">{toPersianNum(82)}٪</div>
                <p className="text-[10px] text-indigo-200 font-bold">میزان هماهنگی منابع ذهنی با سطح دشواری سوالات تخصصی.</p>
             </div>
             <div className="p-5 bg-white border border-slate-150 rounded-[32px] space-y-2">
                <h4 className="text-[11px] font-black text-slate-800">تحلیل پایایی آزمون</h4>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">ثبات عملکرد شما در بخش محاسبات ریاضی نسبت به آزمون قبلی ۱۵٪ رشد داشته است.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
