import React from "react";
import { Brain, Sparkles, Wind, Award, Clock, Heart, Calendar, Check, Target, Activity, Zap, ShieldAlert, Eye, BarChart3, Smile, ChevronLeft } from "lucide-react";
import { Student, Exam } from "../../types";

interface AssessmentDashboardProps {
  student: Student;
  latestExam: Exam;
  onNavigateTab: (tab: any) => void;
}

const toPersianNum = (n: number | string): string => {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};

export default function AssessmentDashboard({ student, latestExam, onNavigateTab }: AssessmentDashboardProps) {
  const totalCorrect = latestExam.lessons.reduce((s, l) => s + l.correct, 0);
  const totalWrong = latestExam.lessons.reduce((s, l) => s + l.wrong, 0);
  const totalEmpty = latestExam.lessons.reduce((s, l) => s + l.empty, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="assessment-showcase">
      {/* Summary Left */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-indigo-900 p-8 rounded-[40px] text-white space-y-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="space-y-2 relative z-10">
            <h3 className="text-2xl font-black">{student.name}</h3>
            <p className="text-indigo-300 text-xs font-bold">تحلیل روان‌شناختی آخرین عملکرد آزمونی</p>
          </div>

          <div className="grid grid-cols-3 gap-2 relative z-10">
            <div className="text-center p-4 bg-white/5 rounded-3xl border border-white/5">
              <span className="block text-[9px] text-indigo-300 font-black mb-1">تراز نهایی</span>
              <span className="block text-xl font-black text-amber-400 font-mono">{toPersianNum(latestExam.traz)}</span>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-3xl border border-white/5">
              <span className="block text-[9px] text-indigo-300 font-black mb-1">رتبه معادل</span>
              <span className="block text-xl font-black text-indigo-100 font-mono">{toPersianNum(latestExam.rank)}</span>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-3xl border border-white/5">
              <span className="block text-[9px] text-indigo-300 font-black mb-1">درصد کل</span>
              <span className="block text-xl font-black text-emerald-400 font-mono">{toPersianNum(latestExam.overallPercentage)}٪</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10 relative z-10">
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400"><Check size={16} /></div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-indigo-100">پاسخ‌های صحیح</span>
                  <span className="text-[9px] text-indigo-400 font-bold">نقاط قوت تثبیت شده</span>
                </div>
              </div>
              <span className="text-sm font-black text-emerald-400">{toPersianNum(totalCorrect)} تست</span>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-rose-400"><ShieldAlert size={16} /></div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-indigo-100">خطاهای منفی</span>
                  <span className="text-[9px] text-rose-400/70 font-bold">تله شتاب‌زدگی</span>
                </div>
              </div>
              <span className="text-sm font-black text-rose-400">{toPersianNum(totalWrong)} تست</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab("ai-synthesis")}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-[20px] text-xs font-black transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 group"
        >
          <Sparkles size={16} className="text-amber-300" />
          <span>همگام‌سازی با هوش روان‌شناسی</span>
          <ChevronLeft size={16} className="text-white/50" />
        </button>
      </div>

      {/* Subject Matrix Right */}
      <div className="lg:col-span-7 bg-white p-7 rounded-[32px] border border-slate-200 shadow-2xl space-y-7 relative overflow-hidden">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><BarChart3 size={18} /></div>
            <div>
              <h3 className="text-sm font-black text-slate-900">ماتریس خطاها به تفکیک درس</h3>
              <p className="text-[10px] text-slate-400 font-bold">Performance Matrix</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-black text-[10px] uppercase">
                <th className="pb-4 pr-3">عنوان درس</th>
                <th className="pb-4 text-center">درصد</th>
                <th className="pb-4 text-center">صحیح</th>
                <th className="pb-4 text-center">غلط</th>
                <th className="pb-4 text-center">نزده</th>
              </tr>
            </thead>
            <tbody>
              {latestExam.lessons.map((lesson, idx) => (
                <tr key={idx} className="border-b border-slate-50 last:border-b-0 hover:bg-indigo-50/30 transition-colors">
                  <td className="py-4 pr-3 font-black text-slate-800">{lesson.lessonName}</td>
                  <td className="py-4 text-center font-black text-slate-900">{toPersianNum(lesson.percentage)}٪</td>
                  <td className="py-4 text-center font-black text-emerald-600">{toPersianNum(lesson.correct)}</td>
                  <td className="py-4 text-center font-black text-rose-600">{toPersianNum(lesson.wrong)}</td>
                  <td className="py-4 text-center font-black text-slate-500">{toPersianNum(lesson.empty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="relative bg-slate-50 border border-slate-100 p-5 rounded-3xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg"><Smile size={20} /></div>
            <h4 className="text-xs font-black text-slate-900">آسیب‌شناسی مشاور</h4>
          </div>
          <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
            بررسی ماتریس خطاها نشان می‌دهد که تله <span className="text-rose-600 font-black">«بلاک حافظه لحظه‌ای»</span> در دروس محاسباتی ریشه در استرس جلسه آزمون دارد.
          </p>
        </div>
      </div>
    </div>
  );
}
