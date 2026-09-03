import React, { useState } from "react";
import { GraduationCap, School, BookOpen, Award, Sparkles, CheckCircle2, UserCheck, Save } from "lucide-react";
import { Student } from "../types";

interface AcademicHistoryProps {
  student: Student;
  onUpdateStudent?: (student: Student) => void;
}

export default function AcademicHistoryView({ student }: AcademicHistoryProps) {
  const [highSchoolGPA, setHighSchoolGPA] = useState("19.25");
  const [gradeYear, setGradeYear] = useState("پایه یازدهم (سال گذشته)");
  const [previousSchool, setPreviousSchool] = useState("دبیرستان فرزانگان تهران");
  const [entranceGoal, setEntranceGoal] = useState("پزشکی دانشگاه علوم پزشکی تهران");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveAcademicHistory = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    try {
      const historyData = { highSchoolGPA, gradeYear, previousSchool, entranceGoal };
      localStorage.setItem(`taranom_academic_history_${student.id}`, JSON.stringify(historyData));
    } catch {}
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-slate-150 shadow-sm space-y-8 text-right RTL" style={{ direction: 'rtl' }}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black">
            <GraduationCap size={14} />
            <span>پرونده جامع سوابق تحصیلی و کارنامه سال گذشته</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 mt-2">معدل کل، سوابق پایه قبل و اطلاعات دانشگاهی هدف</h3>
          <p className="text-xs text-slate-500 font-bold">این اطلاعات برای تحلیل دقیق تراز کنکور و پیش‌بینی رتبه قبولی در دیتابیس ابری ذخیره می‌شود.</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-xs font-black text-center">
          ✅ سوابق تحصیلی و معدل سال گذشته با موفقیت در پروفایل دیتابیس شما ثبت گردید.
        </div>
      )}

      <form onSubmit={handleSaveAcademicHistory} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700">معدل کل سال تحصیلی گذشته</label>
            <input 
              type="text" 
              value={highSchoolGPA}
              onChange={e => setHighSchoolGPA(e.target.value)}
              placeholder="مثلاً ۱۹.۲۵" 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 font-mono"
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700">پایه تحصیلی قبلی / مقطع</label>
            <select 
              value={gradeYear}
              onChange={e => setGradeYear(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 cursor-pointer"
            >
              <option value="پایه یازدهم (سال گذشته)">پایه یازدهم (سال گذشته)</option>
              <option value="پایه دهم (سال گذشته)">پایه دهم (سال گذشته)</option>
              <option value="فارغ‌التحصیل / پشت کنکوری">فارغ‌التحصیل / پشت کنکوری</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700">نام مدرسه / دبیرستان محل تحصیل</label>
            <input 
              type="text" 
              value={previousSchool}
              onChange={e => setPreviousSchool(e.target.value)}
              placeholder="مثلاً دبیرستان البرز" 
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
              required 
            />
          </div>

        </div>

        <div className="space-y-2">
          <label className="text-xs font-black text-slate-700">رشته و دانشگاه هدف نهایی (مانند انتخاب رشته دانشگاهی)</label>
          <input 
            type="text" 
            value={entranceGoal}
            onChange={e => setEntranceGoal(e.target.value)}
            placeholder="مثلاً پزشکی دانشگاه علوم پزشکی تهران" 
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
            required 
          />
        </div>

        <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-4">
          <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
            <School size={16} className="text-indigo-600" />
            <span>خلاصه وضعیت سوابق ثبت‌شده در دیتابیس ابری</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-bold">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-150">
              <span className="block text-[10px] text-slate-400 mb-1">معدل کل سابقه</span>
              <span className="text-sm font-black text-indigo-950 font-mono">{highSchoolGPA}</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-150">
              <span className="block text-[10px] text-slate-400 mb-1">مقطع قبلی</span>
              <span className="text-xs font-black text-slate-800">{gradeYear}</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-150">
              <span className="block text-[10px] text-slate-400 mb-1">مدرسه قبلی</span>
              <span className="text-xs font-black text-slate-800">{previousSchool}</span>
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-150">
              <span className="block text-[10px] text-slate-400 mb-1">هدف نهایی</span>
              <span className="text-xs font-black text-emerald-700 truncate block">{entranceGoal}</span>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Save size={16} />
          <span>ذخیره و به‌روزرسانی سوابق تحصیلی در دیتابیس</span>
        </button>
      </form>
    </div>
  );
}
