import React, { useState, useEffect, useMemo } from "react";
import { Table, Brain, Smile, CalendarCheck, ShieldCheck, Download, Sparkles, AlertCircle, Share2, ClipboardList, Clock, Activity, Zap, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Student, Exam, Weakness, PsychologicalAnalysis, DailyPlan } from "../types";
import { BRAND_CONFIG } from "../constants";
import { getTestTraps, saveTestTrap } from "../lib/traps";
import { addSystemLog } from "../lib/syslogs";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const fatigueValue = data["میزان خستگی"] || 0;
    const hasteValue = data["شاخص شتاب‌زدگی"] || 0;
    const hesitationValue = data["شاخص تردید"] || 0;
    
    let stressLabel = "ایمن و با تمرکز بالا";
    let stressColorClass = "text-emerald-500 font-black";
    let dotColorClass = "bg-emerald-500";

    if (fatigueValue > 70) {
      stressLabel = "خستگی مفرط ذهنی";
      stressColorClass = "text-rose-500 font-black";
      dotColorClass = "bg-rose-500 animate-pulse";
    } else if (fatigueValue > 45) {
      stressLabel = "خستگی مرزی";
      stressColorClass = "text-amber-500 font-bold";
      dotColorClass = "bg-amber-500";
    } else if (fatigueValue > 25) {
      stressLabel = "خستگی خفیف مطالعاتی";
      stressColorClass = "text-blue-500 font-semibold";
      dotColorClass = "bg-blue-400";
    }

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl border border-slate-800 shadow-2xl text-right font-sans text-xs space-y-2.5 max-w-[240px]" dir="rtl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-2">
          <span className="font-black text-slate-100 text-[11px] truncate max-w-[150px]">{data.fullTitle}</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">{data.date}</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>خستگی ذهنی داوطلب:</span>
            </span>
            <span className={`font-mono text-sm font-black ${stressColorClass}`}>
              {fatigueValue}٪
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
              <span>شاخص شتاب‌زدگی تستی:</span>
            </span>
            <span className="font-mono text-xs font-bold text-rose-400">
              {hasteValue}٪
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span>شاخص تردید گزینه‌ای:</span>
            </span>
            <span className="font-mono text-xs font-bold text-amber-400">
              {hesitationValue}٪
            </span>
          </div>
          
          <div className="flex items-center justify-end gap-1.5 text-[10px] pt-1 border-t border-slate-800/40">
            <span className="text-slate-400">وضعیت تمرکز داوطلب:</span>
            <span className={`${stressColorClass} font-bold`}>{stressLabel}</span>
            <span className={`w-2 h-2 rounded-full ${dotColorClass}`}></span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-350">
          <span>تراز مانیتورینگ عملکرد:</span>
          <span className="font-mono text-slate-100 font-extrabold">{data.traz}</span>
        </div>
      </div>
    );
  }
  return null;
};

interface ReportCardViewProps {
  student: Student;
  onNavigate?: (view: any) => void;
}

export default function ReportCardView({ student, onNavigate }: ReportCardViewProps) {
  const [selectedExamId, setSelectedExamId] = useState("1");
  const [activeTab, setActiveTab] = useState<"numeric" | "ai" | "psychology" | "remedial" | "custom_test">("numeric");
  const [expandedLessonIdx, setExpandedLessonIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [psychological, setPsychological] = useState<PsychologicalAnalysis | null>(null);
  const [remedialPlan, setRemedialPlan] = useState<DailyPlan[]>([]);
  const [estimatedTraz, setEstimatedTraz] = useState<number>(0);

  // Helper helper to convert numbers to Persian digits
  const toPersianNum = (n: number | string): string => {
    return n.toString().replace(/\d/g, (x) => "۰۱۲۳۴۵۶۷۸۹"[+x]);
  };

  // --- CUSTOM PERSONALIZED EXAM BUILDER STATES ---
  const [testPhase, setTestPhase] = useState<"config" | "running" | "result">("config");
  const [selectedCustomSubjects, setSelectedCustomSubjects] = useState<string[]>([]);
  const [testQuestionsCount, setTestQuestionsCount] = useState<number>(3);
  const [testDifficulty, setTestDifficulty] = useState<"simple" | "medium" | "hard">("medium");
  const [testTimer, setTestTimer] = useState<number>(180);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [savedTrapQuestionIds, setSavedTrapQuestionIds] = useState<Record<string, boolean>>({});

  interface BuiltQuestion {
    id: string;
    subject: string;
    text: string;
    options: string[];
    correctIdx: number;
    explanation: string;
    trapCategory: string;
  }
  const [currentTestQuestions, setCurrentTestQuestions] = useState<BuiltQuestion[]>([]);

  interface CustomTestResult {
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    emptyCount: number;
    scorePercent: number;
    estimatedTraz: number;
    bySubject: Record<string, { correct: number; wrong: number; empty: number; score: number }>;
  }
  const [customTestResult, setCustomTestResult] = useState<CustomTestResult | null>(null);

  // Dynamic exams list to align with student field (tajrobi, riazi, ensani)
  const mockExams: Exam[] = useMemo(() => {
    if (student.field === "riazi") {
      return [
        {
          id: "1",
          date: "۱۵ فروردین ۱۴۰۵",
          title: "آزمون شبیه‌ساز کنکور ریاضی ۱ - دپارتما‌ن ترنم مهر",
          traz: 5240,
          rank: 2450,
          overallPercentage: 51,
          lessons: [
            { lessonName: "حسابان و ریاضیات", percentage: 20, correct: 8, wrong: 18, empty: 14 },
            { lessonName: "هندسه و گسسته", percentage: 25, correct: 10, wrong: 20, empty: 10 },
            { lessonName: "فیزیک تخصصی", percentage: 30, correct: 12, wrong: 18, empty: 10 },
            { lessonName: "شیمی تخصصی", percentage: 65, correct: 26, wrong: 8, empty: 6 }
          ]
        },
        {
          id: "2",
          date: "۱۵ اردیبهشت ۱۴۰۵",
          title: "آزمون شبیه‌ساز کنکور ریاضی ۲ - دپارتما‌ن ترنم مهر",
          traz: 5575,
          rank: 1845,
          overallPercentage: 59,
          lessons: [
            { lessonName: "حسابان و ریاضیات", percentage: 25, correct: 10, wrong: 15, empty: 15 },
            { lessonName: "هندسه و گسسته", percentage: 32, correct: 12, wrong: 18, empty: 10 },
            { lessonName: "فیزیک تخصصی", percentage: 41, correct: 16, wrong: 14, empty: 10 },
            { lessonName: "شیمی تخصصی", percentage: 72, correct: 28, wrong: 5, empty: 7 }
          ]
        },
        {
          id: "3",
          date: "۲۹ اردیبهشت ۱۴۰۵",
          title: "آزمون جامع دوره‌ای ترنم مهر رشته ریاضی فیزیک",
          traz: 5720,
          rank: 1410,
          overallPercentage: 63,
          lessons: [
            { lessonName: "حسابان و ریاضیات", percentage: 35, correct: 14, wrong: 12, empty: 14 },
            { lessonName: "هندسه و گسسته", percentage: 45, correct: 18, wrong: 12, empty: 10 },
            { lessonName: "فیزیک تخصصی", percentage: 52, correct: 20, wrong: 10, empty: 10 },
            { lessonName: "شیمی تخصصی", percentage: 75, correct: 30, wrong: 4, empty: 6 }
          ]
        },
        {
          id: "4",
          date: "۲۵ خرداد ۱۴۰۵",
          title: "آزمون جامع نهایی شبیه‌ساز کنکور سراسری ریاضی",
          traz: 6180,
          rank: 890,
          overallPercentage: 74,
          lessons: [
            { lessonName: "حسابان و ریاضیات", percentage: 55, correct: 22, wrong: 8, empty: 10 },
            { lessonName: "هندسه و گسسته", percentage: 65, correct: 26, wrong: 6, empty: 8 },
            { lessonName: "فیزیک تخصصی", percentage: 72, correct: 29, wrong: 5, empty: 6 },
            { lessonName: "شیمی تخصصی", percentage: 85, correct: 34, wrong: 2, empty: 4 }
          ]
        }
      ];
    } else if (student.field === "ensani") {
      return [
        {
          id: "1",
          date: "۱۵ فروردین ۱۴۰۵",
          title: "آزمون شبیه‌ساز کنکور انسانی ۱ - دپارتما‌ن ترنم مهر",
          traz: 5240,
          rank: 2450,
          overallPercentage: 51,
          lessons: [
            { lessonName: "جامعه‌شناسی", percentage: 20, correct: 8, wrong: 18, empty: 14 },
            { lessonName: "ادبیات فارسی تخصصی", percentage: 25, correct: 10, wrong: 20, empty: 10 },
            { lessonName: "عربی تخصصی", percentage: 30, correct: 12, wrong: 18, empty: 10 },
            { lessonName: "فلسفه و منطق", percentage: 65, correct: 26, wrong: 8, empty: 6 },
            { lessonName: "روان‌شناسی", percentage: 75, correct: 30, wrong: 6, empty: 4 }
          ]
        },
        {
          id: "2",
          date: "۱۵ اردیبهشت ۱۴۰۵",
          title: "آزمون شبیه‌ساز کنکور انسانی ۲ - دپارتما‌ن ترنم مهر",
          traz: 5575,
          rank: 1845,
          overallPercentage: 59,
          lessons: [
            { lessonName: "جامعه‌شناسی", percentage: 25, correct: 10, wrong: 15, empty: 15 },
            { lessonName: "ادبیات فارسی تخصصی", percentage: 32, correct: 12, wrong: 18, empty: 10 },
            { lessonName: "عربی تخصصی", percentage: 41, correct: 16, wrong: 14, empty: 10 },
            { lessonName: "فلسفه و منطق", percentage: 72, correct: 28, wrong: 5, empty: 7 },
            { lessonName: "روان‌شناسی", percentage: 80, correct: 32, wrong: 4, empty: 4 }
          ]
        },
        {
          id: "3",
          date: "۲۹ اردیبهشت ۱۴۰۵",
          title: "آزمون جامع دوره‌ای ترنم مهر رشته علوم انسانی",
          traz: 5720,
          rank: 1410,
          overallPercentage: 63,
          lessons: [
            { lessonName: "جامعه‌شناسی", percentage: 35, correct: 14, wrong: 12, empty: 14 },
            { lessonName: "ادبیات فارسی تخصصی", percentage: 45, correct: 18, wrong: 12, empty: 10 },
            { lessonName: "عربی تخصصی", percentage: 52, correct: 20, wrong: 10, empty: 10 },
            { lessonName: "فلسفه و منطق", percentage: 75, correct: 30, wrong: 4, empty: 6 },
            { lessonName: "روان‌شناسی", percentage: 84, correct: 33, wrong: 3, empty: 4 }
          ]
        },
        {
          id: "4",
          date: "۲۵ خرداد ۱۴۰۵",
          title: "آزمون جامع نهایی شبیه‌ساز کنکور سراسری انسانی",
          traz: 6180,
          rank: 890,
          overallPercentage: 74,
          lessons: [
            { lessonName: "جامعه‌شناسی", percentage: 55, correct: 22, wrong: 8, empty: 10 },
            { lessonName: "ادبیات فارسی تخصصی", percentage: 65, correct: 26, wrong: 6, empty: 8 },
            { lessonName: "عربی تخصصی", percentage: 72, correct: 29, wrong: 5, empty: 6 },
            { lessonName: "فلسفه و منطق", percentage: 85, correct: 34, wrong: 2, empty: 4 },
            { lessonName: "روان‌شناسی", percentage: 92, correct: 37, wrong: 1, empty: 2 }
          ]
        }
      ];
    } else {
      // "tajrobi"
      return [
        {
          id: "1",
          date: "۱۵ فروردین ۱۴۰۵",
          title: "آزمون شبیه‌ساز کنکور تجربی ۱ - دپارتما‌ن ترنم مهر",
          traz: 5240,
          rank: 2450,
          overallPercentage: 51,
          lessons: [
            { lessonName: "زیست‌شناسی", percentage: 20, correct: 8, wrong: 18, empty: 14 },
            { lessonName: "شیمی", percentage: 25, correct: 10, wrong: 20, empty: 10 },
            { lessonName: "فیزیک", percentage: 30, correct: 12, wrong: 18, empty: 10 },
            { lessonName: "ریاضیات تجربی", percentage: 65, correct: 26, wrong: 8, empty: 6 },
            { lessonName: "زمین‌شناسی", percentage: 75, correct: 30, wrong: 6, empty: 4 }
          ]
        },
        {
          id: "2",
          date: "۱۵ اردیبهشت ۱۴۰۵",
          title: "آزمون شبیه‌ساز کنکور تجربی ۲ - دپارتما‌ن ترنم مهر",
          traz: 5575,
          rank: 1845,
          overallPercentage: 59,
          lessons: [
            { lessonName: "زیست‌شناسی", percentage: 25, correct: 10, wrong: 15, empty: 15 },
            { lessonName: "شیمی", percentage: 32, correct: 12, wrong: 18, empty: 10 },
            { lessonName: "فیزیک", percentage: 41, correct: 16, wrong: 14, empty: 10 },
            { lessonName: "ریاضیات تجربی", percentage: 72, correct: 28, wrong: 5, empty: 7 },
            { lessonName: "زمین‌شناسی", percentage: 80, correct: 32, wrong: 4, empty: 4 }
          ]
        },
        {
          id: "3",
          date: "۲۹ اردیبهشت ۱۴۰۵",
          title: "آزمون جامع دوره‌ای ترنم مهر رشته علوم تجربی",
          traz: 5720,
          rank: 1410,
          overallPercentage: 63,
          lessons: [
            { lessonName: "زیست‌شناسی", percentage: 35, correct: 14, wrong: 12, empty: 14 },
            { lessonName: "شیمی", percentage: 45, correct: 18, wrong: 12, empty: 10 },
            { lessonName: "فیزیک", percentage: 52, correct: 20, wrong: 10, empty: 10 },
            { lessonName: "ریاضیات تجربی", percentage: 75, correct: 30, wrong: 4, empty: 6 },
            { lessonName: "زمین‌شناسی", percentage: 84, correct: 33, wrong: 3, empty: 4 }
          ]
        },
        {
          id: "4",
          date: "۲۵ خرداد ۱۴۰۵",
          title: "آزمون جامع نهایی شبیه‌ساز کنکور سراسری تجربی",
          traz: 6180,
          rank: 890,
          overallPercentage: 74,
          lessons: [
            { lessonName: "زیست‌شناسی", percentage: 55, correct: 22, wrong: 8, empty: 10 },
            { lessonName: "شیمی", percentage: 65, correct: 26, wrong: 6, empty: 8 },
            { lessonName: "فیزیک", percentage: 72, correct: 29, wrong: 5, empty: 6 },
            { lessonName: "ریاضیات تجربی", percentage: 85, correct: 34, wrong: 2, empty: 4 },
            { lessonName: "زمین‌شناسی", percentage: 92, correct: 37, wrong: 1, empty: 2 }
          ]
        }
      ];
    }
  }, [student.field]);

  const calculateExamStressLevel = (exam: Exam): number => {
    const totalWrong = exam.lessons.reduce((sum, s) => sum + (s.wrong || 0), 0);
    const totalCorrect = exam.lessons.reduce((sum, s) => sum + (s.correct || 0), 0);
    const totalEmpty = exam.lessons.reduce((sum, s) => sum + (s.empty || 0), 0);
    const totalQuestions = totalWrong + totalCorrect + totalEmpty || 1;

    const wrongRatio = totalWrong / totalQuestions;
    const emptyRatio = totalEmpty / totalQuestions;
    return Math.min(95, Math.max(15, Math.floor((wrongRatio * 0.75 + emptyRatio * 0.25) * 100 + 10)));
  };

  const currentExam = mockExams.find(e => e.id === selectedExamId) || mockExams[0];

  const fetchWithRetry = async (url: string, options?: RequestInit, retries = 3, delay = 600): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      if (!response.ok && retries > 0 && [500, 502, 503, 504].includes(response.status)) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      }
      return response;
    } catch (err) {
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 1.5);
      }
      throw err;
    }
  };

  const triggerAiAnalysis = async (examToAnalyze: Exam) => {
    setLoading(true);
    try {
      const res = await fetchWithRetry("/api/analyze-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessons: examToAnalyze.lessons,
          field: student.field,
          student: student
        })
      });
      if (!res.ok) {
        throw new Error(`Server responded with status ${res.status}`);
      }
      const data = await res.json();
      setWeaknesses(data.weaknesses || []);
      setPsychological(data.psychological || null);
      setRemedialPlan(data.remedialPlan || []);
      setEstimatedTraz(data.estimatedNextTraz || 0);
    } catch (err) {
      console.warn("AI Analysis request failed, loading fallback local metrics...", err);
      
      const subjects = examToAnalyze.lessons || [];
      const weakSubjects = [...subjects].sort((a, b) => (a.percentage || 0) - (b.percentage || 0)).slice(0, 3);
      
      const computedStressLevel = calculateExamStressLevel(examToAnalyze);
      
      let simulatedStressLabel: "بحرانی" | "متوسط" | "سالم" | "خفیف" = "سالم";
      let simulatedTechnicalDetail = "";
      if (computedStressLevel > 70) {
        simulatedStressLabel = "بحرانی";
        simulatedTechnicalDetail = "به دلیل موازنه ناکافی میان ساعات مطالعه و استراحت، میزان فرسودگی ذهنی بالا گزارش شده و تله‌های مفهومی حاد بوده است.";
      } else if (computedStressLevel > 45) {
        simulatedStressLabel = "متوسط";
        simulatedTechnicalDetail = "تست‌زنی سرعتی در دقایق پایانی آزمون آزمایشی سبب افت ملموس تراز در بخش دروس تخصصی گردیده است.";
      } else if (computedStressLevel > 25) {
        simulatedStressLabel = "خفیف";
        simulatedTechnicalDetail = "تمرکز داوطلب در پاسخ‌گویی به سوالات دروس پایه کاملا مطلوب است، اما در مباحث ترکیبی نیاز به تمرکز پومودورو دارد.";
      } else {
        simulatedStressLabel = "سالم";
        simulatedTechnicalDetail = "عملکرد ذهنی عالی بدون بروز تردید تستی عمیق؛ تمرکز داوطلب در بالاترین سطح ارزیابی شد.";
      }

      const totalWrong = subjects.reduce((sum, s) => sum + (s.wrong || 0), 0);
      const totalCorrect = subjects.reduce((sum, s) => sum + (s.correct || 0), 0);
      const totalEmpty = subjects.reduce((sum, s) => sum + (s.empty || 0), 0);
      const totalQuestions = totalWrong + totalCorrect + totalEmpty || 1;
      const wrongRatio = totalWrong / totalQuestions;

      const simAvgResponseTimeWrong = Math.round(55 + wrongRatio * 40);
      const simAvgResponseTimeCorrect = Math.round(40 + (1 - wrongRatio) * 10);
      const simConsecutiveErrors = Math.min(10, Math.floor(wrongRatio * 15 + 1));

      setPsychological({
        pattern: computedStressLevel > 60 ? "خستگی ذهنی حاد پومودورو (آفلاین)" : "تطابق تمرکزی عالی در آزمون‌های تستی (آفلاین)",
        description: `کاندیدای گرامی؛ سنجش‌ها نشان می‌دهد نوسانات راندمان پاسخ‌دهی به علت کمبود استراحت بین شیفت‌های مطالعاتی بروز کرده و خستگی ذهنی معادل ${computedStressLevel}٪ ثبت شده است که عمیقا سرعت پردازش گزینه‌ها را در دروس تخصصی پایین می‌برد.`,
        correctToWrongRate: Math.max(12, Math.round(wrongRatio * 100)),
        suggestion: computedStressLevel > 60 
          ? "کاهش پارت‌های مطالعاتی پیوسته به فرکانس‌های ۲۵ دقیقه‌ای پومودورو و تخصیص ۵ دقیقه استراحت پویا بدون گوشی تلفن همراه." 
          : "ادامه همان فرآیند مطالعه منابع آموزشی به همراه حل تست‌های زمان‌دار در روزهای پایانی هفته.",
        cardColor: computedStressLevel > 70 ? "red" : computedStressLevel > 45 ? "orange" : computedStressLevel > 25 ? "amber" : "blue",
        stressLevel: computedStressLevel,
        stressAnalysis: {
          avgResponseTimeWrong: simAvgResponseTimeWrong,
          avgResponseTimeCorrect: simAvgResponseTimeCorrect,
          consecutiveErrorsCount: simConsecutiveErrors,
          stressLabel: simulatedStressLabel,
          technicalDetail: simulatedTechnicalDetail
        }
      });

      const localWeaknesses = weakSubjects.map((sub) => {
        let topic = "مباحث تحلیلی آزمون";
        let rec = "مرور درسنامه‌های تخصصی ترنم مهر و حل تست‌های طبقه‌بندی شده سالیان گذشته.";
        let questions = 30;
        let severity: "critical" | "warning" | "mild" = "warning";

        if (sub.lessonName.includes("زیست‌شناسی")) {
          topic = "ژنوم، میتوز و میوز از ژنتیک پایه";
          rec = "پیشنهاد می‌شود ابتدا درسنامه طلایی ترنم مهر مبحث یاخته را مطالعه نموده و سپس تست‌های سراسری سال‌های ۹۸ تا ۱۴۰۴ را تحلیل کنید.";
          questions = 45;
          severity = sub.percentage < 35 ? "critical" : "warning";
        } else if (sub.lessonName.includes("شیمی")) {
          topic = "موازنه واکنش‌ها و سینتیک شیمیایی";
          rec = "تمرکز مجدد روی فرمول سرعت متوسط واکنش؛ تحلیل ۳۰ تست طبقه‌بندی مکرر ترنم مهر.";
          questions = 40;
          severity = sub.percentage < 45 ? "critical" : "warning";
        } else if (sub.lessonName.includes("فیزیک")) {
          topic = "دینامیک و حرکت بر خط مستقیم";
          rec = "یادداشت نکات طلایی شتاب و نیرو؛ حل و تحلیل ۲۰ تست تشریحی کایزن.";
          questions = 35;
          severity = sub.percentage < 40 ? "critical" : "warning";
        } else if (sub.lessonName.includes("ریاضیات") || sub.lessonName.includes("حسابان")) {
          topic = "مشتق‌گیری و حد و پیوستگی توابع";
          rec = "مرور مکرر قضایای هم‌ارزی حد؛ تحلیل ۳۵ تست زمان‌دار آزمون‌های آزمایشی.";
          questions = 35;
          severity = sub.percentage < 40 ? "critical" : "warning";
        } else if (sub.lessonName.includes("جامعه") || sub.lessonName.includes("جزا") || sub.lessonName.includes("حقوق")) {
          topic = "فرمول‌های مشتق و انتگرال و مباحث ترکیبی";
          rec = "تمرکز روی مباحث پر تکرار و بودجه‌بندی سنجش؛ بررسی ۴۰ تست کنکوری کایزن.";
          questions = 40;
          severity = sub.percentage < 40 ? "critical" : "warning";
        }

        return {
          subject: sub.lessonName,
          topic,
          recommendation: rec,
          questions,
          percentage: sub.percentage,
          severity
        };
      });

      setWeaknesses(localWeaknesses);
      setEstimatedTraz(Math.round(5200 + (totalCorrect / totalQuestions) * 2000));
      setRemedialPlan(localWeaknesses.map(lw => ({
        subject: lw.subject,
        focusArea: lw.topic,
        task: lw.recommendation,
        done: false
      })));
    } finally {
      setLoading(false);
    }
  };

  // --- COMPLETE CONFIGURABLE QUESTIONS REGISTER ---
  const QUESTIONS_POOL: BuiltQuestion[] = [
    {
      id: "Q-1",
      subject: "زیست‌شناسی",
      text: "در فرآیند رونویسی رنای پیام‌رسان در یک یاخته یوکاریوتی، کدام عبارت درباره طناب رنای اولیه نادرست است؟",
      options: [
        "۱. با متیل‌دار شدن نوکلئوتید گوانین‌دار در انتهای پنج‌پریم کلاهک ایجاد می‌گردد.",
        "۲. در انتهای سه پریم آن توالی نوکلئوتیدی آدنین‌دار قرار می‌گیرد.",
        "۳. در ساختار پیوندهای فسفودی‌استر آن قند داکسی‌ریبوز دیده می‌شود.",
        "۴. مستقیماً در هسته با فعالیت آنزیم رناسپاراز تولید می‌شود."
      ],
      correctIdx: 2,
      explanation: "طناب رنا دارای قند ریبوز است. طراح کنکور عمداً با استفاده از لفظ 'داکسی‌ریبوز' که مخصوص دنا است، تله تستی فوق‌العاده ظریفی ایجاد می‌کند که داوطلب زیر فشار وقت متوجه آن نشود.",
      trapCategory: "تله اصطلاحات ظریف (ریبوز در برابر داکسی‌ریبوز)"
    },
    {
      id: "Q-2",
      subject: "شیمی",
      text: "در واکنش موازنه شده سوختن کامل یک مول گاز پروپان (C3H8)، ضریب استوکیومتری اکسیژن مصرفی و موازنه شمار مول‌های فرآورده‌ها و واکنش‌دهنده‌ها به ترتیب کدام است؟",
      options: [
        "۱. ضریب اکسیژن ۵ / تفاضل مول‌ها معادل ۱",
        "۲. ضریب اکسیژن ۴ / تفاضل مول‌ها معادل ۲",
        "۳. ضریب اکسیژن ۵ / تفاضل مول‌ها معادل ۲",
        "۴. ضریب اکسیژن ۳ / تفاضل مول‌ها معادل ۱"
      ],
      correctIdx: 0,
      explanation: "موازنه درست واکنش: C3H8 + 5 O2 -> 3 CO2 + 4 H2O است. مول‌های واکنش دهنده ۶ و فرآورده ۷ مول است (تفاضل = ۱ مول). در آزمون‌ها، داوطلببین پروپان یا حالات فیزیکی فرآورده را به غلط لحاظ می‌کنند.",
      trapCategory: "تله محاسباتی در شمارش تفاضل مول‌ها"
    },
    {
      id: "Q-3",
      subject: "فیزیک",
      text: "متحرکی در مسیر مستقیم با شتاب ثابت از حال سکون حرکت می‌کند. اگر مسافت طی شده در ثانیه سوم معادل ۵ متر باشد، شتاب حرکت چند متر بر مجذور ثانیه است؟",
      options: [
        "۱. ۲ متر بر ثانیه مربع",
        "۲. ۱.۵ متر بر ثانیه مربع",
        "۳. ۳ متر بر ثانیه مربع",
        "۴. ۴ متر بر ثانیه مربع"
      ],
      correctIdx: 0,
      explanation: "فرمول مسافت در ثانیه nام: Δx_n = a/2(2n - 1) + v0 است. با جایگذاری n=3 و v0=0 داریم: 5 = a/2(5) که شتاب برابر ۲ به دست می‌آید. داوطلبان نباید فرمول کل مسافت بازه را با ثانیه منفرد اشتباه بگیرند.",
      trapCategory: "تله فرمول ثانیه nام با مسافت کل"
    },
    {
      id: "Q-4",
      subject: "ریاضیات تجربی",
      text: "اگر تابع f(x) در نقطه x=2 حد داشته ولی ناپیوسته باشد، کدام گزینه همواره برقرار است؟",
      options: [
        "۱. حد چپ و راست تابع برابر نبوده و مقدار تعریف نشده است.",
        "۲. حد چپ و راست برابر است اما با مقدار حاصل از f(2) مغایرت دارد.",
        "۳. مشتق اول تابع در این نقطه موجود و برابر صفر است.",
        "۴. مخرج تابع حتماً ریشه مکرر از مرتبه زوج دارد."
      ],
      correctIdx: 1,
      explanation: "شرط ناپیوستگی با وجود داشتن حد این است که حد وجود داشته باشد ولی با مقدار f(2) نابرابر باشد.",
      trapCategory: "تله تعاریف صریح پیوستگی و حد"
    },
    {
      id: "Q-5",
      subject: "حسابان و ریاضیات",
      text: "اگر تابع f(x) در نقطه x=2 حد داشته ولی ناپیوسته باشد، کدام گزینه همواره برقرار است؟",
      options: [
        "۱. حد چپ و راست تابع برابر نبوده و مقدار تعریف نشده است.",
        "۲. حد چپ و راست برابر است اما با مقدار حاصل از f(2) مغایرت دارد.",
        "۳. مشتق اول تابع در این نقطه موجود و برابر صفر است.",
        "۴. مخرج تابع حتماً ریشه مکرر از مرتبه زوج دارد."
      ],
      correctIdx: 1,
      explanation: "شرط ناپیوستگی با وجود داشتن حد این است که حد وجود داشته باشد (حد راست = حد چپ) ولی با مقدار f(2) نابرابر باشد.",
      trapCategory: "تله تعاریف صریح پیوستگی و حد"
    },
    {
      id: "Q-12",
      subject: "هندسه و گسسته",
      text: "در گراف ساده مرتبه ۵ که بیشترین درجه رأس آن ۳ است، حداکثر تعداد یال‌ها چقدر می‌تواند باشد؟",
      options: [
        "۱. ۶ یال",
        "۲. ۷ یال",
        "۳. ۸ یال",
        "۴. ۱۰ یال"
      ],
      correctIdx: 1,
      explanation: "طبق قضیه دست دادن، مجموع درجات رئوس برابر ۲ برابر تعداد یال‌ها است. مجموع حداکثر می‌تواند ۱۵ باشد. چون این حاصل‌ضرب زوج است حداکثر درجات ۱۴ و تعداد یال‌ها حداکثر ۷ است.",
      trapCategory: "دست‌کم گرفتن گزاره گراف ساده و فرمول درجه"
    },
    {
      id: "Q-6",
      subject: "جامعه‌شناسی",
      text: "کدام عامل در نظریه‌های هویت و فرهنگ جامعه‌شناسان، عامل اصلی عبور جامعه از جهان فرهنگی توحیدی به جهان مادی‌گرای دنیوی قلمداد می‌شود؟",
      options: [
        "۱. غلبه عقل ابزاری، فراموشی حقیقت متعالی و رواج فردگرایی مادی",
        "۲. تکثر طبقاتی و تغییر نظام‌های مبادلاتی بازار",
        "۳. مهاجرت‌های گسترده اقوامی و فروپاشی نظام عشیره‌ای",
        "۴. ورود صنایع سنگین و بروز انقلاب‌های صنعتی بومی"
      ],
      correctIdx: 0,
      explanation: "جهان‌های مادی بر مدار غلبه عقل ابزاری و نادیده گرفتن حقیقت قدسی و متعالی می‌چرخند.",
      trapCategory: "تله شباهت گزینه‌های ابزاری با تحولات هویتی"
    },
    {
      id: "Q-7",
      subject: "ادبیات فارسی تخصصی",
      text: "آرایه‌های موجود در بیت «موج ز خود رفته‌ای، تیز خرامید و گفت / این همه دریاست پس قطره کجای کار ماست» کدام است؟",
      options: [
        "۱. تشخیص، جناس، تلمیح، استعاره مکنیه",
        "۲. تشخیص، کنایه، تقابل پارادوکسیکال تمثیلی, حسن تعلیل",
        "۳. استعاره مکنیه، تشخیص، کنایه، تقابل ادبی مکرر",
        "۴. مجاز، تشبیه بلیغ، تشخیص، کنایه"
      ],
      correctIdx: 2,
      explanation: "موج سخن می‌گوید (تشخیص)، ز خود رفته (کنایه از شیفتگی)، تقابل دریا و قطره در این بیت مشهود است.",
      trapCategory: "تله تشخیص آرایه‌های تبارشناسی و تقابل"
    },
    {
      id: "Q-8",
      subject: "عربی تخصصی",
      text: "عین الخطأ فی الترجمة لـ «مَن جَدَّ وَ جَدَ وَ مَن زَرَعَ حَصَدَ»:",
      options: [
        "۱. هر کس تلاش کند می‌یابد و هر کس بکارد درو می‌کند.",
        "۲. آن‌که جدی بود پیدا کرد و آن‌که کشت کرد برداشت نمود.",
        "۳. کسی که تلاش مستمری داشته باشد قطعاً برداشت خواهد کرد.",
        "۴. تلاش و برداشت، قانون همیشگی حیات بشری برای کاشتن است."
      ],
      correctIdx: 3,
      explanation: "عبارت گزینه‌ ۴ فاقد فعل شرط و جواب شرط اصولی مَن است و صرفاً مفهومی بی‌ربط از لغات مجزا ارایه داده است.",
      trapCategory: "تله ترجمه فعل شرط و جواب شرط"
    },
    {
      id: "Q-9",
      subject: "فلسفه و منطق",
      text: "در کدام نوع از براهین اثبات وجود خدا، از مفهوم کمال مطلق مستقیماً به ضرورت وجود عینی آن استدلال می‌شود؟",
      options: [
        "۱. برهان علّی و معلولی (صدیقین)",
        "۲. برهان نظم و غایتمندی جهان مادی",
        "۳. برهان وجودی (آنطولوژیک)",
        "۴. برهان حدوث و امکان جهان جوهری"
      ],
      correctIdx: 2,
      explanation: "برهان وجودی یا آنطولوژیک که توسط دکارت و آنسلم تبیین شده، از تعریف مفهوم خدا به عنوان کامل‌ترین موجود، ضرورت وجود عینی او را استنتاج می‌کند.",
      trapCategory: "تله تفکیک راهبردهای برهان وجودی از علّی"
    },
    {
      id: "Q-10",
      subject: "روان‌شناسی",
      text: "بر اساس نظریه پیاژه، کودک در کدام یک از مراحل رشد شناختی قادر به فهم فرآیند بازگشت‌پذیری ذهنی و نگهداری ذهنی مقادیر است؟",
      options: [
        "۱. مرحله حسی - حرکتی",
        "۲. مرحله پیش‌عملیاتی",
        "۳. مرحله عملیات عینی",
        "۴. مرحله عملیات صوری"
      ],
      correctIdx: 2,
      explanation: "در مرحله عملیات عینی (۷ تا ۱۱ سالگی)، کودک به توانایی تفکر منطقی در مورد اشیای عینی دست می‌یابد و نگهداری ذهنی مایعات و بازگشت‌پذیری را درک می‌کند.",
      trapCategory: "تله فرآیند نگهداری ذهنی پیاژه در مراحل میانی رشد"
    },
    {
      id: "Q-11",
      subject: "تاریخ تحلیلی",
      text: "کدام یک از سلسله‌های زیر در تاریخ ایران باستان، بیشترین نقش را در تمرکز اداری و نظامی و ایجاد ساختار ساتراپی داشتند؟",
      options: [
        "۱. مادها",
        "۲. هخامنشیان",
        "۳. اشکانیان",
        "۴. ساسانیان"
      ],
      correctIdx: 1,
      explanation: "داریوش بزرگ هخامنشی با تقسیم کشور به ایالت‌های مختلف (ساتراپی) و گماردن ساتراپ‌ها، نظام اداری متمرکزی را بنیان نهاد که تا قرن‌ها الگوی حکمرانی در منطقه بود.",
      trapCategory: "تله شباهت ساختارهای حکومتی ساسانی و هخامنشی"
    },
    {
      id: "Q-13",
      subject: "جغرافیای ایران",
      text: "کدام پدیده زمین‌شناسی، عامل اصلی شکل‌گیری دریاچه ارومیه و نوسانات سطحی آن در طول دوره‌های کواترنری بوده است؟",
      options: [
        "۱. فرونشست تکتونیکی ناشی از گسل‌های منطقه",
        "۲. فعالیت‌های آتشفشانی قله سهند",
        "۳. فرسایش بادی گسترده در حوضه آبریز",
        "۴. ذوب توده‌های یخی دوران یخبندان"
      ],
      correctIdx: 0,
      explanation: "دریاچه ارومیه در یک چاله‌ ساختمانی ناشی از فعالیت‌های تکتونیکی و گسل‌های بزرگ منطقه قرار دارد که فرونشست تدریجی آن بستری برای تجمع آب فراهم کرده است.",
      trapCategory: "تله فعالیت آتشفشانی مکرر در برابر فرونشست"
    },
    {
      id: "Q-14",
      subject: "اقتصاد",
      text: "در ساختار بازار انحصار کامل، منحنی تقاضای بنگاه و رابطه قیمت با درآمد نهایی چگونه است؟",
      options: [
        "۱. منحنی تقاضا کاملاً کشسان بوده و قیمت برابر درآمد نهایی است.",
        "۲. منحنی تقاضا دارای شیب منفی بوده و قیمت همواره بیشتر از درآمد نهایی است.",
        "۳. منحنی تقاضا عمودی بوده و درآمد نهایی صفر است.",
        "۴. قیمت همواره برابر هزینه نهایی در نقطه سربه سر است."
      ],
      correctIdx: 1,
      explanation: "در بازار انحصار کامل، به دلیل شیب منفی تقاضا، برای فروش واحد بیشتر باید قیمت کل واحدها کاهش یابد؛ لذا درآمد حاصل از آخرین واحد (MR) همواره کمتر از قیمت آن واحد (P) است.",
      trapCategory: "تله برابری قیمت و درآمد نهایی در بازارهای رقابتی"
    }
  ];

  // Helper properties to find the weakest subjects in active exam scorecard

  const weakestLessons = useMemo(() => {
    if (!currentExam || !currentExam.lessons) return [];
    return [...currentExam.lessons]
      .sort((a, b) => b.wrong - a.wrong) // Sort most wrongs descending
      .slice(0, 3);
  }, [currentExam]);

  // SMART AUTO DIAGNOSTIC TEST RUNNER from weakest subjects
  const handleStartSmartErrorTest = () => {
    const subjects = weakestLessons.map(l => l.lessonName);
    if (subjects.length === 0) {
      alert("دروس خطادار کافی برای این داوطلب یافت نشد.");
      return;
    }

    // Capture matching difficult questions
    let filtered = QUESTIONS_POOL.filter(q => {
      // Direct subject match
      const mathMatch = (q.subject.includes("ریاضی") || q.subject.includes("حسابان")) && 
                        (subjects.some(s => s.includes("ریاضی") || s.includes("حسابان")));
      
      const subjMatch = subjects.includes(q.subject) || q.subject.toLowerCase() === q.subject;
      return subjMatch || mathMatch;
    });

    if (filtered.length === 0) {
      // Fallback
      filtered = QUESTIONS_POOL.filter(q => q.subject === "جامعه‌شناسی" || q.subject === "ادبیات فارسی تخصصی" || q.subject === "عربی تخصصی");
    }

    // Sort or slice up to 5 items to ensure conceptual and difficult questions
    const chosen = filtered.slice(0, 5);

    // Synchronize selector states for UI visual feedback
    setSelectedCustomSubjects(subjects);
    setTestDifficulty("hard");
    setTestQuestionsCount(chosen.length);

    setCurrentTestQuestions(chosen);
    setTestTimer(chosen.length * 60); // 60s per question
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTestPhase("running");

    addSystemLog(
      "شبیه‌ساز هوشمند کایزن خطاها",
      student.name,
      `برگزاری آزمون پایش عیوب شامل ${toPersianNum(chosen.length)} تست سطح دشوار در دروس گلوگاهی: ${subjects.join("، ")}`
    );
  };

  const handleStartCustomTest = () => {
    if (selectedCustomSubjects.length === 0) {
      alert("لطفاً حداقل یک درس عمومی یا اختصاصی انتخاب نمایید.");
      return;
    }

    // Filter questions that match selectedCustomSubjects or closely related
    let filtered = QUESTIONS_POOL.filter(q => {
      return selectedCustomSubjects.includes(q.subject);
    });

    if (filtered.length === 0) {
      filtered = QUESTIONS_POOL.slice(0, Math.min(QUESTIONS_POOL.length, testQuestionsCount));
    }

    const chosen = filtered.slice(0, testQuestionsCount);

    setCurrentTestQuestions(chosen);
    setTestTimer(testQuestionsCount * 60); // 60s per question
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTestPhase("running");
    
    addSystemLog(
      "شبیه‌ساز آزمون تکمیلی",
      student.name,
      `آغاز آزمون با تعداد ${toPersianNum(chosen.length)} سوال تخصصی در سطح دشواری ${testDifficulty}`
    );
  };

  const handleSubmitCustomTest = () => {
    let corrVal = 0;
    let wrongVal = 0;
    let emptyVal = 0;

    const bySubMap: Record<string, { correct: number; wrong: number; empty: number; score: number }> = {};

    currentTestQuestions.forEach((q) => {
      const selected = userAnswers[q.id];
      if (!bySubMap[q.subject]) {
        bySubMap[q.subject] = { correct: 0, wrong: 0, empty: 0, score: 0 };
      }

      if (selected === undefined) {
        emptyVal++;
        bySubMap[q.subject].empty++;
      } else if (selected === q.correctIdx) {
        corrVal++;
        bySubMap[q.subject].correct++;
      } else {
        wrongVal++;
        bySubMap[q.subject].wrong++;
      }
    });

    const scoreVal = currentTestQuestions.length > 0
      ? Math.round(((corrVal * 3 - wrongVal) / (currentTestQuestions.length * 3)) * 100)
      : 0;

    const customTraz = Math.min(9500, Math.max(2200, 5000 + scoreVal * 42));

    Object.keys(bySubMap).forEach((subKey) => {
      const details = bySubMap[subKey];
      const subTotal = details.correct + details.wrong + details.empty;
      details.score = subTotal > 0 ? Math.round(((details.correct * 3 - details.wrong) / (subTotal * 3)) * 100) : 0;
    });

    setCustomTestResult({
      totalQuestions: currentTestQuestions.length,
      correctCount: corrVal,
      wrongCount: wrongVal,
      emptyCount: emptyVal,
      scorePercent: scoreVal,
      estimatedTraz: customTraz,
      bySubject: bySubMap
    });

    setTestPhase("result");

    addSystemLog(
      "اتمام آزمون تکمیلی",
      student.name,
      `کارنامه صادر شد با تراز تخمینی ${toPersianNum(customTraz)} و درصد کل ${toPersianNum(scoreVal)}٪`
    );
  };

  const handleDownloadPamphlet = () => {
    setIsAlertVisible(true);
    setTimeout(() => {
      setIsAlertVisible(false);
      alert("✅ پاسخ‌نامه صریح عارضه‌یابی و جزوه کایزن با عنوان 'TaranomMehr_Coaching_Guide.pdf' شامل روش‌های برخورد با تله‌های تستی کنکور با موفقیت در کارتابل شما دانلود شد.");
    }, 2000);
  };

  const handleShareWithParents = () => {
    alert("🔗 گزارش مانیتورینگ تراز فرسودگی، سرعت پاسخگویی و کایزن درسی داوطلب با موفقیت به کارتابل مشاور علمی و اولیای محترم ابلاغ گردید.");
  };

  return (
    <div className="space-y-6" id="report-card-view-container">
      {/* Top Selector and Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right">
        <div>
          <h2 className="text-xl font-black text-slate-900">سامانه کارنامه‌های مانیتورینگ آزمون‌های تخصصی ترنم مهر</h2>
          <p className="text-slate-500 text-xs mt-1">کارنامه علمی و آزمون‌های شبیه‌ساز را جهت عارضه‌یابی و مهار تله‌های تستی کنکور سراسری انتخاب نمایید.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full md:w-[320px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-950 focus:bg-white cursor-pointer text-right"
            id="exam-select-dropdown"
          >
            {mockExams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.date})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main summary headers displaying current statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4" id="report-assessment-stats">
        <div className="bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-950 p-5 rounded-2xl text-white text-right">
          <p className="text-slate-400 text-[10px] font-bold">تراز علمی نهایی کنکور</p>
          <div className="text-3xl font-black mt-1 font-mono">{currentExam.traz}</div>
        </div>
        <div className="bg-gradient-to-tr from-blue-950 to-indigo-950 p-5 rounded-2xl text-white text-right">
          <p className="text-indigo-200 text-[10px] font-bold">رتبه کشوری شبیه‌ساز</p>
          <div className="text-3xl font-black mt-1 font-mono">{currentExam.rank}</div>
        </div>
        <div className="bg-gradient-to-tr from-emerald-850 to-emerald-950 p-5 rounded-2xl text-white text-right">
          <p className="text-emerald-300 text-[10px] font-bold">درصد انطباق پاسخ‌های صحیح</p>
          <div className="text-3xl font-black mt-1 font-mono">{currentExam.overallPercentage}٪</div>
        </div>
        <div className="bg-gradient-to-tr from-purple-950 to-purple-950 p-5 rounded-2xl text-white text-right">
          <p className="text-purple-300 text-[10px] font-bold">تخمین تراز در آزمون بعد</p>
          <div className="text-3xl font-black mt-1 font-mono">{loading ? "پیگیری..." : `${estimatedTraz}`}</div>
        </div>
      </div>

      {/* Primary Tab Switching System */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-right" id="report-view-panels">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveTab("numeric")}
            className={`flex items-center gap-2 py-3 px-6 text-[11px] md:text-xs font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === "numeric" ? "bg-white text-blue-955 shadow-sm" : "text-slate-505 hover:text-slate-700 hover:bg-slate-100/50"
            }`}
          >
            <Table size={14} />
            <span>📊 ریز کارنامه درصدی دروس</span>
          </button>
          
          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 py-3 px-6 text-[11px] md:text-xs font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === "ai" ? "bg-white text-blue-955 shadow-sm" : "text-slate-505 hover:text-slate-705 hover:bg-slate-100/50"
            }`}
          >
            <Brain size={14} className="text-purple-600 animate-pulse" />
            <span>🧠 عارضه‌یابی اشتباهات تستی با AI</span>
          </button>
          
          <button
            onClick={() => setActiveTab("psychology")}
            className={`flex items-center gap-2 py-3 px-6 text-[11px] md:text-xs font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === "psychology" ? "bg-white text-blue-955 shadow-sm" : "text-slate-505 hover:text-slate-705 hover:bg-slate-100/50"
            }`}
          >
            <Smile size={14} />
            <span>🎯 پایش خستگی ذهنی و تردید تستی</span>
          </button>
          
          <button
            onClick={() => setActiveTab("remedial")}
            className={`flex items-center gap-2 py-3 px-6 text-[11px] md:text-xs font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === "remedial" ? "bg-white text-blue-955 shadow-sm" : "text-slate-505 hover:text-slate-705 hover:bg-slate-100/50"
            }`}
          >
            <CalendarCheck size={14} />
            <span>📅 چرخه برنامه درسی جبرانی داوطلب</span>
          </button>

          <button
            onClick={() => setActiveTab("custom_test")}
            className={`flex items-center gap-2 py-3 px-6 text-xs font-bold rounded-xl whitespace-nowrap transition cursor-pointer ${
              activeTab === "custom_test" ? "bg-white text-blue-955 shadow-sm" : "text-slate-505 hover:text-slate-705 hover:bg-slate-100/50"
            }`}
          >
            <Zap size={14} className="text-amber-500" />
            <span>📝 شبیه‌ساز آزمون تکمیلی شخصی‌سازی شده</span>
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 space-y-4"
                id="loading-spinner-container"
              >
                <div className="w-12 h-12 border-4 border-blue-950 border-t-amber-400 rounded-full animate-spin"></div>
                <div className="text-center space-y-1">
                  <p className="font-bold text-slate-800">هوش کایزن {BRAND_CONFIG.name} در حال پایش و سنجش کارنامه‌ علمی شما...</p>
                  <p className="text-xs text-slate-400">شناسایی تله‌های تستی کنکور، محاسبات سرعت انتقال، تخمین تراز و رسم روند پویای پیشرفت</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 animate-fade-in"
              >
                {/* 1. Numerical Table Tab */}
                {activeTab === "numeric" && (
                  <div className="space-y-4" id="numeric-tab-content">
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm text-right">
                      <table className="w-full text-right border-collapse text-xs min-w-[800px]" dir="rtl">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                            <th className="py-4 px-6 text-right">موضوع درسی حقوقی</th>
                            <th className="py-4 px-6 text-right">درصد انطباق علمی</th>
                            <th className="py-4 px-6 text-emerald-700 text-right">تعداد پاسخ‌های صحیح</th>
                            <th className="py-4 px-6 text-rose-600 text-right">تعداد پاسخ‌های غلط (تله)</th>
                            <th className="py-4 px-6 text-slate-400 text-right">گزینه‌های دست‌نخورده / سفید</th>
                            <th className="py-4 px-6 text-right">برچسب ممیزی علمی</th>
                            <th className="py-4 px-6 text-right">تحلیل</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentExam.lessons.map((lesson, idx) => {
                            let statusText = "مستعد تراز برتر";
                            let statusColor = "bg-emerald-50 text-emerald-800 border-emerald-100";
                            if (lesson.percentage < 30) {
                              statusText = "ریسک منفی مفرط / بحرانی";
                              statusColor = "bg-rose-50 text-rose-700 border-rose-150 font-extrabold";
                            } else if (lesson.percentage < 55) {
                              statusText = "نیازمند خلاصه نویسی مواد صریح";
                              statusColor = "bg-amber-50 text-amber-700 border-amber-100";
                            }

                            const conceptual = 45 + (idx * 13) % 40;
                            const computational = 100 - conceptual;

                            return (
                              <React.Fragment key={idx}>
                                <tr className="hover:bg-slate-50/50 transition whitespace-nowrap">
                                  <td className="py-4 px-6 font-bold text-slate-800 text-right">{lesson.lessonName}</td>
                                  <td className="py-4 px-6 text-right">
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono font-bold text-slate-900 w-10 shrink-0 text-right block">
                                        {lesson.percentage}٪
                                      </span>
                                      <div className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${lesson.percentage}%` }}
                                          transition={{ type: "spring", stiffness: 50, damping: 11, delay: idx * 0.08 }}
                                          className={`h-full rounded-full ${
                                            lesson.percentage < 30 
                                              ? "bg-gradient-to-r from-rose-500 to-red-600" 
                                              : lesson.percentage < 55 
                                                ? "bg-gradient-to-r from-amber-400 to-amber-500" 
                                                : "bg-gradient-to-r from-emerald-400 to-emerald-600"
                                          }`}
                                        />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 font-mono text-emerald-705 font-bold text-right">{lesson.correct} سوال</td>
                                  <td className="py-4 px-6 font-mono text-rose-600 font-bold text-right">{lesson.wrong} سوال</td>
                                  <td className="py-4 px-6 font-mono text-slate-400 text-right">{lesson.empty} سفید</td>
                                  <td className="py-4 px-6 text-right">
                                    <span className={`px-2.5 py-1 text-[9.5px] font-black border rounded-full ${statusColor}`}>
                                      {statusText}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                    <button 
                                      id={`expand-subject-details-${idx}`}
                                      onClick={() => setExpandedLessonIdx(expandedLessonIdx === idx ? null : idx)}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg text-[10px] font-black transition cursor-pointer"
                                    >
                                      <span>جزییات</span>
                                      {expandedLessonIdx === idx ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </button>
                                  </td>
                                </tr>
                                <AnimatePresence>
                                  {expandedLessonIdx === idx && (
                                    <motion.tr
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="bg-blue-50/30 overflow-hidden"
                                    >
                                      <td colSpan={7} className="p-0">
                                        <div className="p-6 space-y-4 border-b border-blue-100/50">
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                              <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                                                <span>ساختار سوالات مفهومی (Conceptual)</span>
                                                <span className="text-blue-600">{toPersianNum(conceptual)}٪</span>
                                              </div>
                                              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                                <motion.div 
                                                  initial={{ width: 0 }}
                                                  animate={{ width: `${conceptual}%` }}
                                                  className="h-full bg-blue-500 rounded-full"
                                                />
                                              </div>
                                              <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed">
                                                این بخش شامل سوالات تئوری، استدلال‌های منطقی و درک عمیق مفاهیم پایه است که نیازمند تحلیل ذهنی داوطلب می‌باشد.
                                              </p>
                                            </div>
                                            <div className="space-y-3">
                                              <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                                                <span>ساختار سوالات محاسباتی / مهارتی (Computational)</span>
                                                <span className="text-amber-600">{toPersianNum(computational)}٪</span>
                                              </div>
                                              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                                <motion.div 
                                                  initial={{ width: 0 }}
                                                  animate={{ width: `${computational}%` }}
                                                  className="h-full bg-amber-500 rounded-full"
                                                />
                                              </div>
                                              <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed">
                                                بخش محاسباتی شامل حل مسائل، بکارگیری فرمول‌ها و محاسبات عددی است که سرعت عمل و دقت در اجرا را می‌طلبد.
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </td>
                                    </motion.tr>
                                  )}
                                </AnimatePresence>
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 2. AI Recommendation Tab */}
                {activeTab === "ai" && (
                  <div className="space-y-6" id="ai-tab-content">
                    <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-right">
                      <div className="flex gap-3 items-center">
                        <span className="p-2 bg-purple-700 text-white rounded-xl"><Sparkles size={18} /></span>
                        <div>
                          <p className="text-purple-950 font-bold text-sm">بروشور طلایی عارضه‌یابی و مهار گلوگاه‌های آزمون صادر گردید!</p>
                          <p className="text-purple-700 text-xs mt-0.5">شامل تحلیل مباحث تست‌خیز زیست‌شناسی، فیزیک و شیمی {BRAND_CONFIG.examProvider} به عنوان مربی هوشمند علمی در جیب شما.</p>
                        </div>
                      </div>
                      <button 
                        onClick={handleDownloadPamphlet}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-purple-700 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex-shrink-0"
                      >
                        <Download size={14} />
                        <span>دانلود بروشور عارضه‌یابی کایزن</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right" id="ai-recommendations-list">
                      {weaknesses.map((weak, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between space-y-4 hover:shadow-sm transition">
                          <div className="space-y-2">
                            <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${
                              weak.severity === "critical" ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse" : "bg-amber-50 text-amber-600 border-amber-100"
                            }`}>
                              {weak.severity === "critical" ? "رفع عیب فوری" : "هشدار نوسان علمی"}
                            </span>
                            <h3 className="text-sm font-black text-slate-800">{weak.topic}</h3>
                            <p className="text-[11px] text-indigo-700 font-bold">{weak.subject} • درصد تطابق واقعی: {weak.percentage}٪</p>
                            <p className="text-xs text-slate-650 leading-relaxed font-semibold">{weak.recommendation}</p>
                          </div>
                          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] font-mono text-slate-400">
                            <button
                              onClick={() => {
                                if (onNavigate) {
                                  onNavigate("traps");
                                } else {
                                  alert(`🎯 مبحث '${weak.topic}' در لیست انتظار تله‌های تستی شما قرار گرفت. به 'بانک تله‌های تستی' بروید و جزئیات اشتباه خود را ثبت کنید.`);
                                }
                              }}
                              className="text-rose-600 font-black hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Plus size={10} />
                              <span>ثبت در بانک تله‌ها</span>
                            </button>
                            <div className="flex flex-col items-end">
                              <span>پایلوت آزمایشی: {weak.questionsCount} تست مکرر</span>
                              <span>اولویت: خیلی بالا</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {isAlertVisible && (
                      <div className="p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-200 text-xs flex items-center gap-2">
                        <AlertCircle className="animate-spin" size={16} />
                        <span>در پیشبرد تقاضای به خدمت‌گیری هوش مصنوعی {BRAND_CONFIG.examProvider} جهت دانلود اسناد...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Psychological Behavioral Analysis Tab */}
                {activeTab === "psychology" && psychological && (() => {
                  const sLevel = psychological.stressLevel ?? 45;
                  const sAnalysis = psychological.stressAnalysis ?? {
                    avgResponseTimeWrong: 72,
                    avgResponseTimeCorrect: 48,
                    consecutiveErrorsCount: 4,
                    stressLabel: "متوسط",
                    technicalDetail: "داغ شدن سر بازوی التراسونیک به علت کمبود هوای فونداسیون که سبب شده پرسنل درزها را با تعجیل رد کنند."
                  };

                  const chartData = mockExams.map((exam) => {
                    const computedStress = calculateExamStressLevel(exam);
                    const totalWrong = exam.lessons.reduce((sum, s) => sum + (s.wrong || 0), 0);
                    const totalCorrect = exam.lessons.reduce((sum, s) => sum + (s.correct || 0), 0);
                    const totalEmpty = exam.lessons.reduce((sum, s) => sum + (s.empty || 0), 0);
                    const totalQuestions = totalWrong + totalCorrect + totalEmpty || 1;
                    
                    const hasteIndex = Math.min(95, Math.max(10, Math.round((totalWrong / (totalWrong + totalCorrect || 1)) * 100)));
                    const emptyIndex = Math.min(95, Math.max(10, Math.round((totalEmpty / totalQuestions) * 100 * 1.5)));

                    return {
                      id: exam.id,
                      shortTitle: exam.title.replace("آزمون شبیه‌ساز ", "").replace("آزمون جامع ", ""),
                      fullTitle: exam.title,
                      date: exam.date,
                      traz: exam.traz,
                      "میزان خستگی": computedStress,
                      "شاخص شتاب‌زدگی": hasteIndex,
                      "شاخص تردید": emptyIndex,
                      isSelected: exam.id === selectedExamId
                    };
                  });

                  let stressColorText = "text-emerald-600";
                  let stressBg = "bg-emerald-555";
                  let stressBorder = "border-emerald-100";
                  
                  if (sLevel > 70) {
                    stressColorText = "text-rose-605 font-extrabold";
                    stressBg = "bg-rose-500";
                    stressBorder = "border-rose-100";
                  } else if (sLevel > 45) {
                    stressColorText = "text-amber-605 font-extrabold";
                    stressBg = "bg-amber-500";
                    stressBorder = "border-amber-100";
                  } else if (sLevel > 25) {
                    stressColorText = "text-blue-605 font-extrabold";
                    stressBg = "bg-blue-500";
                    stressBorder = "border-blue-100";
                  }

                  return (
                    <div className="space-y-6" id="psychology-tab-content">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        <div className="lg:col-span-2 space-y-4 text-right">
                          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 bg-gradient-to-tr from-blue-50/10 to-transparent">
                            <div className="flex items-center gap-2">
                              <span className="p-2 bg-blue-50 text-blue-900 rounded-xl"><Smile size={18} /></span>
                              <h3 className="text-xs font-black text-slate-900 font-sans">ریشه عیوب و تمرکز ذهن مانیتور شده: <span className="text-blue-950 font-extrabold">{psychological.pattern}</span></h3>
                            </div>
                            <p className="text-slate-650 text-xs leading-relaxed font-semibold">{psychological.description}</p>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 text-right">
                              <p className="text-xs text-slate-800 leading-relaxed font-sans">
                                <strong>💡 اقدام فوری کایزن تحصیلی: </strong>{psychological.suggestion}
                              </p>
                            </div>
                          </div>

                          {/* Stress Level Fluctuation Trend Chart Card */}
                          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                            <div>
                              <h3 className="text-xs font-black text-slate-905 flex items-center gap-2 font-sans">
                                <Activity className="text-purple-650" size={14} />
                                <span>نمودار نوسانات کارایی تمرکزی، خستگی ذهنی و تردید گزینه‌ای داوطلب کنکور</span>
                              </h3>
                              <p className="text-slate-400 text-[9px] mt-0.5">بر روی هر گره کلیک کنید تا متغیرهای تحلیلی مربوط به آزمون گزینش شده لود گردد.</p>
                            </div>

                            <div className="h-[210px] w-full font-sans text-xs" dir="ltr">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={chartData}
                                  onClick={(e: any) => {
                                    if (e && e.activePayload && e.activePayload.length) {
                                      setSelectedExamId(e.activePayload[0].payload.id);
                                    }
                                  }}
                                  margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                  <XAxis 
                                    dataKey="shortTitle" 
                                    stroke="#94a3b8" 
                                    tickLine={false} 
                                    axisLine={false}
                                    style={{ fontSize: "10px", fontWeight: "600" }}
                                  />
                                  <YAxis 
                                    domain={[0, 100]} 
                                    stroke="#94a3b8" 
                                    tickLine={false} 
                                    axisLine={false}
                                    style={{ fontSize: "10px", fontWeight: "600" }}
                                    tickFormatter={(v) => `${v}%`}
                                  />
                                  <RechartsTooltip content={<CustomTooltip />} />
                                  <Line
                                    type="monotone"
                                    dataKey="میزان خستگی"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={(props: any) => {
                                      const { cx, cy, payload } = props;
                                      const isSelected = payload.id === selectedExamId;
                                      return (
                                        <g key={`stress-dot-${payload.id}`}>
                                          <circle 
                                            cx={cx} 
                                            cy={cy} 
                                            r={isSelected ? 6 : 4} 
                                            fill={isSelected ? "#8b5cf6" : "#ffffff"} 
                                            stroke="#8b5cf6" 
                                            strokeWidth={isSelected ? 3 : 2}
                                            style={{ cursor: "pointer" }}
                                          />
                                          {isSelected && (
                                            <circle
                                              cx={cx}
                                              cy={cy}
                                              r={11}
                                              fill="none"
                                              stroke="#8b5cf6"
                                              strokeWidth={1}
                                              strokeDasharray="2 2"
                                            />
                                          )}
                                        </g>
                                      );
                                    }}
                                    activeDot={{ r: 7 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="شاخص شتاب‌زدگی"
                                    stroke="#f43f5e"
                                    strokeWidth={2.5}
                                    strokeDasharray="4 4"
                                    dot={(props: any) => {
                                      const { cx, cy, payload } = props;
                                      const isSelected = payload.id === selectedExamId;
                                      return (
                                        <circle 
                                          key={`haste-dot-${payload.id}`}
                                          cx={cx} 
                                          cy={cy} 
                                          r={isSelected ? 4 : 3} 
                                          fill={isSelected ? "#f43f5e" : "#ffffff"} 
                                          stroke="#f43f5e" 
                                          strokeWidth={2}
                                          style={{ cursor: "pointer" }}
                                        />
                                      );
                                    }}
                                    activeDot={{ r: 5 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="شاخص تردید"
                                    stroke="#fbbf24"
                                    strokeWidth={2.5}
                                    strokeDasharray="2 2"
                                    dot={(props: any) => {
                                      const { cx, cy, payload } = props;
                                      const isSelected = payload.id === selectedExamId;
                                      return (
                                        <circle 
                                          key={`doubt-dot-${payload.id}`}
                                          cx={cx} 
                                          cy={cy} 
                                          r={isSelected ? 4 : 3} 
                                          fill={isSelected ? "#fbbf24" : "#ffffff"} 
                                          stroke="#fbbf24" 
                                          strokeWidth={2}
                                          style={{ cursor: "pointer" }}
                                        />
                                      );
                                    }}
                                    activeDot={{ r: 5 }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            
                            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 pt-2 border-t border-slate-50 text-[10px] font-bold text-slate-500" dir="rtl">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                <span>خستگی ذهنی و تمرکزی (٪)</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                <span>شاخص شتاب‌زدگی تستی (٪)</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                <span>شاخص تردید و تعلیق بین گزینه‌ها (٪)</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Side details metrics list */}
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100 flex flex-col justify-between h-full text-right">
                            <div className="space-y-4">
                              <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                                <Zap className="text-amber-500" size={14} />
                                <span>ممیزی مشخصات عارضه‌یابی آزمون</span>
                              </h4>
                              
                              <div className="space-y-3.5">
                                <div className="bg-white p-3.5 rounded-2xl border border-slate-100/50 space-y-1">
                                  <span className="text-[10px] text-slate-400 block font-bold">متوسط زمان اختصاص یافته به سوال اشتباه</span>
                                  <span className="text-lg font-black font-mono text-slate-800">
                                    {sAnalysis.avgResponseTimeWrong} ثانیه
                                  </span>
                                  <span className="text-[9px] text-rose-550 font-bold block">🚨 زمان مفرط حاصل از تله و تردید در درس تخصصی اثرگذار</span>
                                </div>

                                <div className="bg-white p-3.5 rounded-2xl border border-slate-100/50 space-y-1">
                                  <span className="text-[10px] text-slate-400 block font-bold font-sans">سرعت پاسخ‌گویی به گزینه‌های صحیح</span>
                                  <span className="text-lg font-black font-mono text-slate-800">
                                    {sAnalysis.avgResponseTimeCorrect} ثانیه
                                  </span>
                                  <span className="text-[9px] text-emerald-600 font-bold block">✓ بهینه و در بازه هوشیاری مرجع</span>
                                </div>

                                <div className="bg-white p-3.5 rounded-2xl border border-slate-100/50 space-y-1">
                                  <span className="text-[10px] text-slate-400 block font-bold">پاسخ‌های منفی متوالی تله‌گذاری شده</span>
                                  <span className="text-lg font-black text-slate-800 font-mono">
                                    {sAnalysis.consecutiveErrorsCount} سوال متوالی منفی
                                  </span>
                                  <span className="text-[9px] text-rose-500 font-bold block">🚨 نیاز به مداخله فوری مشاور کایزن آموزشی</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={handleShareWithParents}
                              className="w-full mt-6 py-3 bg-blue-950 hover:bg-slate-900 border border-slate-200 text-white font-bold text-xs rounded-2xl shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Share2 size={13} />
                              <span>ابلاغ کارنامه به مشاور علمی و کارتابل والدین</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()}

                {/* 4. Remedial Schedule Tab */}
                {activeTab === "remedial" && (
                  <div className="space-y-4 text-right" id="remedial-tab-content">
                    <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1 text-right">
                        <h3 className="text-sm font-black text-indigo-950 flex items-center gap-1.5">
                          <ClipboardList size={16} />
                          <span>سند کایزن درسی و برنامه جبرانی رفع تله‌های تستی کنکور سراسری</span>
                        </h3>
                        <p className="text-xs text-indigo-700 font-semibold">مبتنی بر تله‌های علمی فرسودگی و درسی ممیزی‌ شده در کانون علمی {BRAND_CONFIG.name} شما</p>
                      </div>
                      <span className="px-3.5 py-1.5 bg-blue-950 text-white rounded-2xl text-[10px] font-black border border-indigo-900 animate-pulse">
                        چرخه هفتگی کایزن فعال است ⏱️
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="remedial-weekly-schedule">
                      {remedialPlan.map((plan, idx) => {
                        let isWeekend = plan.day === "جمعه" || plan.day === "پنجشنبه";
                        return (
                          <div key={idx} className={`p-5 rounded-2xl border transition-all ${
                            isWeekend 
                              ? "bg-slate-900 text-white border-slate-950 hover:bg-slate-950" 
                              : "bg-slate-50/60 border-slate-100 hover:border-slate-200 hover:bg-white"
                          }`}>
                            <div className="flex justify-between items-start border-b pb-2 mb-3 border-slate-200/55">
                              <span className={`text-sm font-black ${isWeekend ? "text-amber-400" : "text-blue-950"}`}>{plan.day}</span>
                              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${
                                isWeekend ? "bg-white/10 text-white" : "bg-white text-slate-650 border border-slate-100"
                              }`}>
                                {plan.totalQuestions} تست هدفمند
                              </span>
                            </div>
                            <div className="space-y-2.5 text-right">
                              <div className="space-y-0.5">
                                <span className={`text-[9px] block font-bold ${isWeekend ? "text-slate-400" : "text-slate-500"}`}>شیفت صبح: مطالعه و مرور کتاب درسی</span>
                                <p className={`text-xs font-bold leading-relaxed ${isWeekend ? "text-slate-100" : "text-slate-800"}`}>{plan.morningPlan}</p>
                              </div>
                              <div className="space-y-0.5">
                                <span className={`text-[9px] block font-bold ${isWeekend ? "text-slate-400" : "text-slate-500"}`}>شیفت عصر: پاسخ‌گویی و عیب‌یابی</span>
                                <p className={`text-xs leading-relaxed ${isWeekend ? "text-slate-300" : "text-slate-605"}`}>{plan.afternoonPlan}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. Custom Supplementary Test Simulator Tab */}
                {activeTab === "custom_test" && (
                  <div className="space-y-6 text-right" id="custom-test-simulation-container">
                    
                    {/* Phase 1: Config/Builder Screen */}
                    {testPhase === "config" && (
                      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                        <div className="border-b border-rose-100 pb-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-rose-50 rounded-xl text-rose-600 block">
                              <Sparkles size={18} />
                            </span>
                            <h3 className="text-base font-black text-slate-900">طراح و شبیه‌ساز آزمون تکمیلی شخصی‌سازی شده سراسری</h3>
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            بر پایه هوش کایزن {BRAND_CONFIG.name}، با توجه به نقاط ضعف درصدی گزارش شده شما، مباحث و تعداد سوالات آزمون خود را بسازید تا تحت زمان‌بندی مرجع کنکور مورد آزمون آنلاین پیوسته قرار بگیرید.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left Panel: Subjects Selection */}
                          <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 space-y-4">
                            <label className="text-xs font-black text-slate-800 block">۱. انتخاب دروس جهت شبیه‌سازی تست‌های تخصصی:</label>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {(student.field === "riazi" 
                                ? ["حسابان و ریاضیات", "هندسه و گسسته", "فیزیک تخصصی", "شیمی تخصصی"]
                                : student.field === "ensani"
                                ? ["جامعه‌شناسی", "ادبیات فارسی تخصصی", "عربی تخصصی", "فلسفه و منطق", "روان‌شناسی"]
                                : ["زیست‌شناسی", "شیمی", "فیزیک", "ریاضیات تجربی", "زمین‌شناسی"]
                              ).map((subjName) => {
                                const isSelected = selectedCustomSubjects.includes(subjName);
                                return (
                                  <button
                                    key={subjName}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCustomSubjects(prev => 
                                        isSelected ? prev.filter(x => x !== subjName) : [...prev, subjName]
                                      );
                                    }}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border font-bold text-xs transition cursor-pointer text-right w-full ${
                                      isSelected 
                                        ? "bg-rose-50/50 border-rose-200 text-rose-950 shadow-sm font-extrabold"
                                        : "bg-white border-slate-150 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                                    }`}
                                  >
                                    <span>{subjName}</span>
                                    <span className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                                      isSelected ? "bg-rose-600 border-rose-600 text-white" : "border-slate-300 bg-white"
                                    }`}>✓</span>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-slate-400">بهتر است دروسی که در ریزدرصدهای کارنامه بالا دارای ریسک تله علمی هستند را برگزینید.</p>
                          </div>

                          {/* Right Panel: Exam Specific parameters */}
                          <div className="space-y-4">
                            <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 space-y-4">
                              <label className="text-xs font-black text-slate-800 block">۲. تعداد تست‌های طراحی‌شده پس از بررسی هوش کایزن:</label>
                              <div className="flex gap-2">
                                {[3, 5, 8].map((qCount) => (
                                  <button
                                    key={qCount}
                                    type="button"
                                    onClick={() => setTestQuestionsCount(qCount)}
                                    className={`flex-1 py-2.5 rounded-xl border font-extrabold text-xs transition cursor-pointer ${
                                      testQuestionsCount === qCount
                                        ? "bg-slate-900 text-white border-slate-900"
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    {toPersianNum(qCount)} تست
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-100 space-y-4">
                              <label className="text-xs font-black text-slate-800 block">۳. سطح پیچیدگی تله‌ها و دام‌ها:</label>
                              <div className="flex gap-2">
                                {[
                                  { level: "simple", label: "ساده (تله‌های سطحی)" },
                                  { level: "medium", label: "متوسط (دام‌های روتین)" },
                                  { level: "hard", label: "دشوار (تله‌های عمیق)" }
                                ].map((item) => (
                                  <button
                                    key={item.level}
                                    type="button"
                                    onClick={() => setTestDifficulty(item.level as any)}
                                    className={`flex-1 py-2.5 rounded-xl border font-bold text-xs transition cursor-pointer ${
                                      testDifficulty === item.level
                                        ? "bg-rose-950 text-white border-rose-950"
                                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Start Button */}
                        <div className="pt-4 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            onClick={handleStartCustomTest}
                            className="w-full sm:w-auto px-8 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-2xl shadow-md cursor-pointer transition flex items-center justify-center gap-2"
                          >
                            <Zap size={14} />
                            <span>ساخت و آغاز سنجش آزمون تکمیلی تله‌های ذهنی</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Phase 2: Running mock interactive screen */}
                    {testPhase === "running" && currentTestQuestions.length > 0 && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* Questions index summary list */}
                        <div className="lg:col-span-4 space-y-4">
                          <div className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-950 space-y-4 shadow-lg text-right">
                            <div className="flex justify-between items-center bg-slate-800/60 px-4 py-3 rounded-2xl border border-slate-700">
                              <span className="text-[10px] text-slate-300 font-bold block">زمان باقی‌مانده آزمون:</span>
                              <div className="text-lg font-black font-mono text-amber-400 flex items-center gap-1.5" dir="ltr">
                                <Clock size={16} />
                                <span>
                                  {Math.floor(testTimer / 60)}:{(testTimer % 60).toString().padStart(2, "0")}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[11px] text-slate-400 block font-bold">میزان پیشرفت پاسخ‌دهی:</span>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                                  style={{ width: `${(Object.keys(userAnswers).length / currentTestQuestions.length) * 100}%` }}
                                ></div>
                              </div>
                              <div className="flex justify-between text-[10px] text-slate-400">
                                <span>{toPersianNum(Object.keys(userAnswers).length)} پاسخ داده شده</span>
                                <span>{toPersianNum(currentTestQuestions.length)} کل سوالات</span>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800 space-y-2.5">
                              <span className="text-xs font-black text-slate-200 block">سوالات دفترچه عارضه‌یابی:</span>
                              <div className="grid grid-cols-4 gap-2">
                                {currentTestQuestions.map((q, idx) => {
                                  const answered = userAnswers[q.id] !== undefined;
                                  const isCurrent = idx === currentQuestionIndex;
                                  return (
                                    <button
                                      key={q.id}
                                      onClick={() => setCurrentQuestionIndex(idx)}
                                      className={`py-2 px-1 text-xs font-black font-mono rounded-xl border transition cursor-pointer text-center ${
                                        isCurrent 
                                          ? "bg-rose-600 text-white border-rose-600 scale-105 shadow-sm"
                                          : answered
                                          ? "bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900"
                                          : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
                                      }`}
                                    >
                                      {toPersianNum(idx + 1)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <button
                              onClick={handleSubmitCustomTest}
                              className="w-full mt-4 py-3 bg-rose-605 hover:bg-rose-700 bg-rose-600 text-white font-extrabold text-xs rounded-2xl shadow transition cursor-pointer text-center flex items-center justify-center gap-2"
                            >
                              <ShieldCheck size={14} />
                              <span>ثبت نهایی و دریافت کارنامه تکمیلی</span>
                            </button>
                          </div>
                        </div>

                        {/* Interactive question panel */}
                        <div className="lg:col-span-8 flex flex-col justify-between bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] text-slate-700 font-extrabold">
                                  {currentTestQuestions[currentQuestionIndex].subject}
                                </span>
                                <span className="text-slate-400 text-xs font-bold">سوال شماره {toPersianNum(currentQuestionIndex + 1)} از {toPersianNum(currentTestQuestions.length)}</span>
                              </div>
                              <span className="text-rose-600 text-[10px] font-black tracking-tight">{toPersianNum(testDifficulty === "hard" ? "سطح تراز بالای ۸۰۰۰" : testDifficulty === "medium" ? "تراز روتین کنکور" : "ساده")}</span>
                            </div>

                            <p className="text-sm font-black text-slate-800 leading-relaxed font-sans text-right pt-2">
                              {currentTestQuestions[currentQuestionIndex].text}
                            </p>

                            <div className="space-y-2.5 pt-4 text-right">
                              {currentTestQuestions[currentQuestionIndex].options.map((optText, optIdx) => {
                                const isSelected = userAnswers[currentTestQuestions[currentQuestionIndex].id] === optIdx;
                                return (
                                  <button
                                    key={optIdx}
                                    onClick={() => {
                                      setUserAnswers(prev => ({
                                        ...prev,
                                        [currentTestQuestions[currentQuestionIndex].id]: optIdx
                                      }));
                                    }}
                                    className={`w-full p-4 rounded-xl border text-xs font-bold leading-relaxed text-right transition cursor-pointer ${
                                      isSelected
                                        ? "bg-rose-50/50 border-rose-300 text-rose-950 font-black shadow-sm"
                                        : "bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100/50 hover:border-slate-300"
                                    }`}
                                  >
                                    {optText}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Navigation Controls */}
                          <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                            <button
                              disabled={currentQuestionIndex === 0}
                              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                              className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                              سوال قبلی
                            </button>
                            
                            <button
                              onClick={() => {
                                setUserAnswers(prev => {
                                  const updated = { ...prev };
                                  delete updated[currentTestQuestions[currentQuestionIndex].id];
                                  return updated;
                                });
                              }}
                              className="text-[10px] font-bold text-slate-400 hover:text-rose-600 cursor-pointer transition"
                            >
                              پاک کردن گزینه انتخابی
                            </button>

                            {currentQuestionIndex < currentTestQuestions.length - 1 ? (
                              <button
                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-950 rounded-xl text-xs font-bold text-white cursor-pointer transition"
                              >
                                سوال بعدی
                              </button>
                            ) : (
                              <button
                                onClick={handleSubmitCustomTest}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-black text-white cursor-pointer transition"
                              >
                                ثبت و اتمام آزمون ✓
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                    {/* Phase 3: Detailed Scorecard / Traps Vault saver */}
                    {testPhase === "result" && customTestResult && (
                      <div className="space-y-6">
                        
                        {/* Summary details cards */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                          <div className="flex justify-between items-center border-b border-rose-100 pb-4">
                            <div>
                              <h3 className="text-base font-black text-slate-900">ریزکارنامه تحلیل دام‌های علمی آزمون تکمیلی کایزن</h3>
                              <p className="text-xs text-slate-500 mt-1">شناسایی عمیق تردیدهای گزینه‌ای و ممانعت از هدررفت تراز در تله‌های تستی کنکور سراسری</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setTestPhase("config")}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
                            >
                              + ساخت آزمون جدید
                            </button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-950 text-white p-5 rounded-2xl text-right">
                              <span className="text-slate-400 text-[9px] font-black">تراز علمی تخمینی شبیه‌ساز</span>
                              <div className="text-2xl font-black font-mono mt-1 text-amber-300">{toPersianNum(customTestResult.estimatedTraz)}</div>
                            </div>

                            <div className="bg-gradient-to-tr from-indigo-900 to-indigo-950 text-white p-5 rounded-2xl text-right">
                              <span className="text-indigo-200 text-[9px] font-black">درصد نهایی با جریمه نزولی</span>
                              <div className="text-2xl font-black font-mono mt-1">{toPersianNum(customTestResult.scorePercent)}٪</div>
                            </div>

                            <div className="bg-slate-100/60 p-5 rounded-2xl border border-slate-100 text-right">
                              <span className="text-slate-400 text-[9px] font-black">صحیح / غلط / سفید</span>
                              <div className="text-lg font-black mt-1 text-slate-800 font-mono">
                                <span className="text-emerald-600">{toPersianNum(customTestResult.correctCount)} ص</span> - <span className="text-rose-600">{toPersianNum(customTestResult.wrongCount)} غ</span> - <span className="text-slate-400">{toPersianNum(customTestResult.emptyCount)} س</span>
                              </div>
                            </div>

                            <div className="bg-rose-50 text-rose-950 p-5 rounded-2xl border border-rose-100 text-right flex flex-col justify-center">
                              <span className="text-[9px] font-black text-rose-800">تعداد تله‌ تستی فعال شده</span>
                              <div className="text-2xl font-black font-mono mt-1">{toPersianNum(customTestResult.wrongCount)} تله</div>
                            </div>
                          </div>
                        </div>

                        {/* Breakdown analysis of each question & SAVE TRAP */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-black text-slate-800">ممیزی تله‌ها و عیب‌یابی تک‌تک سوالات کلاس‌بندی شده:</h4>
                          
                          {currentTestQuestions.map((q, idx) => {
                            const selectedIdx = userAnswers[q.id];
                            const isCorrect = selectedIdx === q.correctIdx;
                            const isUnanswered = selectedIdx === undefined;
                            
                            const isSavedMap = savedTrapQuestionIds[q.id];

                            return (
                              <div 
                                key={q.id} 
                                className={`p-5 rounded-3xl border transition-all bg-white relative overflow-hidden ${
                                  isCorrect 
                                    ? "border-emerald-100 shadow-sm" 
                                    : isUnanswered
                                    ? "border-slate-100 shadow-sm"
                                    : "border-rose-100 shadow-md ring-1 ring-rose-100"
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 mb-4">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black font-mono text-xs flex items-center justify-center">
                                      {toPersianNum(idx + 1)}
                                    </span>
                                    <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md text-[10px] text-slate-500 font-bold">
                                      {q.subject}
                                    </span>
                                    {!isCorrect && !isUnanswered && (
                                      <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-black">
                                        افتاده در تله ⚠️
                                      </span>
                                    )}
                                  </div>

                                  {/* SAVE TRAP INTERACTION */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isSavedMap) return;
                                      
                                        saveTestTrap({
                                          questionTitle: q.text,
                                          subject: q.subject,
                                          category: (q.subject === "ریاضیات تجربی" || q.subject === "حسابان و ریاضیات" || q.subject === "شیمی" || q.subject === "فیزیک") ? "اشتباه_محاسباتی" : "مفهومی",
                                          trapType: q.trapCategory,
                                          correctAnswer: q.options[q.correctIdx],
                                          userMistake: selectedIdx !== undefined ? `انتخاب نادرست گزینه شماره ${toPersianNum(selectedIdx + 1)}` : "سوال را سفید باقی گذاشتم",
                                          educationalNote: q.explanation,
                                          importance: "high"
                                        });

                                      setSavedTrapQuestionIds(prev => ({
                                        ...prev,
                                        [q.id]: true
                                      }));

                                      addSystemLog(
                                        "ثبت تله تستی",
                                        student.name,
                                        `ذخیره خودکار تله ${q.trapCategory} در درس ${q.subject}`
                                      );

                                      alert("✓ این خطای تستی علمی با موفقیت در کیف تله‌های ذهنی ذخیره شد و در چرخه جبرانی هوشمند ترنم مهر قرار گرفت.");
                                    }}
                                    className={`py-1.5 px-3 rounded-xl border text-[10px] font-black transition cursor-pointer flex items-center gap-1 ${
                                      isSavedMap 
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-extrabold cursor-default"
                                        : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                                    }`}
                                  >
                                    <Sparkles size={11} />
                                    <span>{isSavedMap ? "در تله‌ها و عارضه‌ها ثبت شد ✓" : "ثبت در تله‌ها"}</span>
                                  </button>
                                </div>

                                <p className="text-xs font-bold text-slate-800 leading-relaxed mb-4 text-right">
                                  {q.text}
                                </p>

                                {/* Options */}
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-4">
                                  {q.options.map((optText, optIdx) => {
                                    const isCorrectOpt = optIdx === q.correctIdx;
                                    const isSelectedOpt = optIdx === selectedIdx;
                                    
                                    let borderStyle = "border-slate-100 bg-slate-50/40 opacity-70";
                                    if (isCorrectOpt) {
                                      borderStyle = "border-emerald-400 bg-emerald-50/50 text-emerald-900 font-extrabold";
                                    } else if (isSelectedOpt) {
                                      borderStyle = "border-rose-400 bg-rose-50 text-rose-900 font-extrabold";
                                    }
                                    
                                    return (
                                      <div key={optIdx} className={`p-3 rounded-xl border text-[11px] leading-relaxed text-right ${borderStyle}`}>
                                        <div className="flex items-center gap-1">
                                          {isCorrectOpt && <span className="text-emerald-600">✓</span>}
                                          {isSelectedOpt && !isCorrectOpt && <span className="text-rose-600">⚠️</span>}
                                          <span>{optText}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-right">
                                  <div className="flex items-center gap-1 text-[10px] font-black text-rose-800">
                                    <AlertCircle size={12} />
                                    <span>شناسایی تله تستی: {q.trapCategory}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-650 leading-relaxed font-semibold">
                                    <span className="font-bold text-slate-805 text-slate-800">راهبرد مقابله ممیز:</span> {q.explanation}
                                  </p>
                                </div>

                              </div>
                            );
                          })}
                        </div>

                      </div>
                    )}

                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
