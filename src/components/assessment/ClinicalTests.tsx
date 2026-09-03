import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Clock, HelpCircle, Check, AlertCircle, Award, Wind, ShieldAlert, Printer, Trash2 } from "lucide-react";
import { PSY_TESTS, PsychologyTest, PsychologyFeedback } from "../../data/psychologyTests";

interface ClinicalTestsProps {
  studentName: string;
  onLogSystem?: (action: string, user: string, details: string) => void;
}

const toPersianNum = (n: number | string): string => {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
};

export default function ClinicalTests({ studentName, onLogSystem }: ClinicalTestsProps) {
  const [activeTestKey, setActiveTestKey] = useState<"anxiety" | "depression" | "ocd" | null>(null);
  const [currentTestQIndex, setCurrentTestQIndex] = useState(0);
  const [testAnswers, setTestAnswers] = useState<number[]>([]);
  const [testCompleted, setTestCompleted] = useState(false);

  const startTest = (key: "anxiety" | "depression" | "ocd") => {
    setActiveTestKey(key);
    setCurrentTestQIndex(0);
    setTestAnswers([]);
    setTestCompleted(false);
  };

  const handleAnswer = (val: number) => {
    const activeTest = activeTestKey ? PSY_TESTS[activeTestKey] : null;
    if (!activeTest) return;

    const newAnswers = [...testAnswers, val];
    setTestAnswers(newAnswers);

    if (currentTestQIndex < activeTest.questions.length - 1) {
      setCurrentTestQIndex(currentTestQIndex + 1);
    } else {
      setTestCompleted(true);
      if (onLogSystem) {
        onLogSystem("تکمیل تست روانشناختی", studentName, `تست: ${activeTest.title}`);
      }
    }
  };

  if (!activeTestKey) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="clinical-tests-menu">
        {Object.entries(PSY_TESTS).map(([key, test]) => (
          <div key={key} className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                {key === "anxiety" ? <Wind size={24} /> : key === "depression" ? <Brain size={24} /> : <Clock size={24} />}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">{test.title}</h3>
                <p className="text-[10px] text-slate-500 font-bold mt-1 leading-relaxed">{test.subtitle}</p>
              </div>
            </div>
            <button 
              onClick={() => startTest(key as any)}
              className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black rounded-xl transition"
            >
              شروع ارزیابی بالینی
            </button>
          </div>
        ))}
      </div>
    );
  }

  const activeTest = PSY_TESTS[activeTestKey];

  if (testCompleted) {
    const totalScore = testAnswers.reduce((sum, v) => sum + v, 0);
    const maxPossible = activeTest.questions.length * 3;
    const feedback = activeTest.getFeedback(totalScore);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="test-report-screen">
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-150 shadow-md flex flex-col justify-between items-center text-center">
          <div className="w-full flex justify-between items-center border-b border-slate-100 pb-3">
            <span className="text-[9px] font-black bg-rose-50 text-rose-700 px-2.5 py-1 rounded-md border border-rose-100">کارنامه تشخیص بالینی</span>
            <span className="text-[9px] font-mono text-slate-400">کد پرونده: PX-{totalScore * 9}</span>
          </div>

          <div className="my-8 relative flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle cx="72" cy="72" r="60" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
              <circle
                cx="72" cy="72" r="60"
                stroke={totalScore > 13 ? "#ef4444" : totalScore > 6 ? "#f59e0b" : "#10b981"}
                strokeWidth="12" fill="transparent"
                strokeDasharray={2 * Math.PI * 60}
                strokeDashoffset={2 * Math.PI * 60 * (1 - totalScore / maxPossible)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{toPersianNum(totalScore)}</span>
              <span className="text-slate-400 text-[10px] font-bold block mt-0.5">از {toPersianNum(maxPossible)} امتیاز</span>
            </div>
          </div>

          <div className="w-full space-y-4">
            <div className={`p-3 rounded-2xl text-xs font-black border text-center ${feedback.levelColor}`}>
              خروجی: {feedback.level}
            </div>
            
            <div className="flex gap-2">
              <button onClick={() => startTest(activeTestKey)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-[11px] font-black text-slate-700 rounded-xl transition">تکرار</button>
              <button onClick={() => setActiveTestKey(null)} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black rounded-xl transition">بازگشت</button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Brain size={18} className="text-rose-500" />
              <h3 className="text-xs font-black text-slate-900">آنالیز روان‌شناختی بالینی</h3>
            </div>
            <p className="text-xs font-semibold leading-relaxed text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">{feedback.clinicalAnalysis}</p>
          </div>

          <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-amber-200/45 pb-3">
              <AlertCircle size={18} className="text-amber-600" />
              <h3 className="text-xs font-black text-amber-950">تاثیر مستقیم این الگو بر کارنامه کنکور شما</h3>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {feedback.examImpact.map((impact, ind) => (
                <li key={ind} className="flex gap-2.5 items-start p-3 bg-white rounded-xl border border-amber-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                  <span className="text-[11px] text-slate-600 font-bold leading-relaxed">{impact}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = activeTest.questions[currentTestQIndex];

  return (
    <div className="bg-white rounded-[32px] p-8 border border-slate-150 shadow-xl max-w-3xl mx-auto space-y-8" id="test-interaction-box">
      <div className="space-y-2 border-b border-slate-100 pb-6 text-center">
        <h2 className="text-lg font-black text-slate-900">{activeTest.title}</h2>
        <p className="text-[11px] text-slate-400 font-bold leading-relaxed">{activeTest.subtitle}</p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center text-[10px] font-black text-indigo-600">
          <span>سوال {toPersianNum(currentTestQIndex + 1)} از {toPersianNum(activeTest.questions.length)}</span>
          <span className="bg-indigo-50 px-2.5 py-1 rounded-md">پاسخ‌ها خودکار ذخیره می‌شوند</span>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 min-h-[120px] flex items-center justify-center text-center">
          <p className="text-sm md:text-base font-black text-slate-800 leading-relaxed">{currentQ.text}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: "هرگز / اصلاً ندارم", val: 0, color: "hover:bg-emerald-50 hover:border-emerald-200" },
            { label: "به ندرت / کمی دارم", val: 1, color: "hover:bg-amber-50 hover:border-amber-200" },
            { label: "گاهی / متوسط دارم", val: 2, color: "hover:bg-orange-50 hover:border-orange-200" },
            { label: "همیشه / بسیار شدید دارم", val: 3, color: "hover:bg-rose-50 hover:border-rose-200" }
          ].map((ans) => (
            <button
              key={ans.val}
              onClick={() => handleAnswer(ans.val)}
              className={`p-4 rounded-2xl border border-slate-200 bg-white text-right transition-all group cursor-pointer active:scale-95 flex items-center justify-between ${ans.color}`}
            >
              <span className="text-xs font-black text-slate-700">{ans.label}</span>
              <span className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-white border border-slate-200 flex items-center justify-center text-[10px] font-mono font-black text-slate-400">{ans.val}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
