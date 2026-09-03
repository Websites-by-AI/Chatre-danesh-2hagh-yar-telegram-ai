import React, { useState, useMemo } from "react";
import { 
  Sparkles, Wind, Activity, ClipboardList, ShieldAlert, BookMarked
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Student, Exam } from "../types";
import { addSystemLog } from "../lib/syslogs";

// Sub-components
import AssessmentDashboard from "./assessment/AssessmentDashboard";
import ClinicalTests from "./assessment/ClinicalTests";
import InterviewRecorder from "./assessment/InterviewRecorder";
import BreathingSession from "./assessment/BreathingSession";
import AiSynthesisReport from "./assessment/AiSynthesisReport";
import ScientificAnalysis from "./assessment/ScientificAnalysis";

interface AssessmentViewProps {
  student: Student;
  role?: "student" | "parent" | "admin" | "counselor" | "teacher" | null;
  onNavigateChange?: (view: string) => void;
}

export default function AssessmentView({ student, role, onNavigateChange }: AssessmentViewProps) {
  const [activeTab, setActiveTab] = useState<"ai-synthesis" | "breathing" | "smart-profile" | "scientific-analysis" | "re-design-showcase" | "clinical-tests">("re-design-showcase");

  const latestExam: Exam = useMemo(() => {
    if (student.field === "riazi") {
      return {
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
      };
    } else if (student.field === "ensani") {
      return {
        id: "4",
        date: "۲۵ خرداد ۱۴۰۵",
        title: "آزمون جامع نهایی شبیه‌ساز کنکور سراسری انسانی",
        traz: 5890,
        rank: 1200,
        overallPercentage: 68,
        lessons: [
          { lessonName: "ریاضی و آمار", percentage: 35, correct: 14, wrong: 10, empty: 16 },
          { lessonName: "ادبیات تخصصی", percentage: 78, correct: 31, wrong: 4, empty: 5 },
          { lessonName: "عربی تخصصی", percentage: 62, correct: 25, wrong: 8, empty: 7 },
          { lessonName: "فلسفه و منطق", percentage: 54, correct: 22, wrong: 12, empty: 6 }
        ]
      };
    }
    return {
      id: "4",
      date: "۲۵ خرداد ۱۴۰۵",
      title: "آزمون جامع نهایی شبیه‌ساز کنکور سراسری تجربی",
      traz: 6420,
      rank: 450,
      overallPercentage: 78,
      lessons: [
        { lessonName: "زیست‌شناسی", percentage: 82, correct: 33, wrong: 4, empty: 3 },
        { lessonName: "شیمی تخصصی", percentage: 71, correct: 28, wrong: 6, empty: 6 },
        { lessonName: "فیزیک تخصصی", percentage: 65, correct: 26, wrong: 8, empty: 6 },
        { lessonName: "ریاضیات تجربی", percentage: 58, correct: 23, wrong: 7, empty: 10 }
      ]
    };
  }, [student.field]);

  const renderContent = () => {
    switch (activeTab) {
      case "re-design-showcase":
        return <AssessmentDashboard student={student} latestExam={latestExam} onNavigateTab={setActiveTab} />;
      case "clinical-tests":
        return <ClinicalTests studentName={student.name} onLogSystem={addSystemLog} />;
      case "smart-profile":
        return <InterviewRecorder student={student} role={role || null} onLogSystem={addSystemLog} />;
      case "breathing":
        return <BreathingSession />;
      case "ai-synthesis":
        return <AiSynthesisReport studentName={student.name} />;
      case "scientific-analysis":
        return <ScientificAnalysis />;
      default:
        return <AssessmentDashboard student={student} latestExam={latestExam} onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-6" id="assessment-main-view">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 pb-4 scrollbar-hide no-scrollbar">
        {[
          { id: "re-design-showcase", label: "داشبورد روان‌سنجی", icon: Activity },
          { id: "clinical-tests", label: "غربالگری بالینی", icon: ShieldAlert },
          { id: "smart-profile", label: "مصاحبه و پرونده", icon: ClipboardList },
          { id: "ai-synthesis", label: "تحلیل هوش مصنوعی", icon: Sparkles },
          { id: "breathing", label: "تمرین تنفس", icon: Wind },
          { id: "scientific-analysis", label: "گزارش علمی", icon: BookMarked }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 whitespace-nowrap transition-all border ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100"
                : "bg-white text-slate-500 border-slate-100 hover:border-indigo-200"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
