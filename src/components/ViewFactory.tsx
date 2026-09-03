import React, { Suspense, lazy } from "react";
import { Student } from "../types";

// Lazy load all system view components to reduce initial bundle size
const WelcomeTourPortal = lazy(() => import("./WelcomeTourPortal"));
const DashboardView = lazy(() => import("./DashboardView"));
const ManovaDashboard = lazy(() => import("./ManovaDashboard"));
// ReportCardView is imported eagerly to prevent dynamic import chunk hashing mismatch / stale cache error
import ReportCardView from "./ReportCardView";
const StudyPlanView = lazy(() => import("./StudyPlanView"));
const CounselorView = lazy(() => import("./CounselorView"));
const ProgressView = lazy(() => import("./ProgressView"));
const TestTrapsView = lazy(() => import("./TestTrapsView"));
const CustomQuizGenerator = lazy(() => import("./CustomQuizGenerator"));
const AssessmentView = lazy(() => import("./AssessmentView"));
const MetacognitionLabView = lazy(() => import("./MetacognitionLabView"));
const CounselingAdvisorView = lazy(() => import("./CounselingAdvisorView"));
const HistoricalDatabaseView = lazy(() => import("./HistoricalDatabaseView"));
const AdminView = lazy(() => import("./AdminView"));
const SmartStressTrainerView = lazy(() => import("./SmartStressTrainerView"));
const ParentsView = lazy(() => import("./ParentsView"));
const CounselorDashboardView = lazy(() => import("./CounselorDashboardView"));
const CoursesView = lazy(() => import("./CoursesView"));
const InPersonView = lazy(() => import("./InPersonView"));
const TeacherDashboardView = lazy(() => import("./TeacherDashboardView"));
const StudyDashboardView = lazy(() => import("./StudyDashboardView"));
const KonkurExamView = lazy(() => import("./KonkurExamView"));
// BlogView is imported eagerly: it is small and avoids stale dynamic chunks.
import BlogView from "./BlogView";
const MobileDownloadView = lazy(() => import("./MobileDownloadView"));
const AdvancedStudyPlanner = lazy(() => import("./AdvancedStudyPlanner"));

export type RoleType = "student" | "parent" | "admin" | "counselor" | "teacher";

export interface ViewFactoryProps {
  view: string;
  role: RoleType;
  student: Student;
  onNavigate: (target: string) => void;
  onSwitchRole: (newRole: RoleType) => void;
  onUpdateStudent: (updatedStudent: Student) => void;
  onUpdateBrand: () => void;
}

/**
 * Access Control Specification for and secure view routing
 */
export const ALLOWED_VIEWS_BY_ROLE: Record<RoleType, string[]> = {
  student: [
    "welcome", "dashboard", "manova", "report", "schedule", "counselor", 
    "progress", "traps", "quiz", "psychology", "metacognition", "counseling", 
    "historical-db", "courses", "inperson", "shop", "blog", "contact", "study-planner", "smart-stress-trainer", "konkur", "download", "planner-gen", "counselor-chat"
  ],
  parent: [
    "welcome", "parents", "manova", "report", "psychology", "counseling", 
    "historical-db", "courses", "inperson", "shop", "blog", "contact", "konkur", "download"
  ],
  admin: [
    "welcome", "admin", "manova", "courses", "inperson", "shop", "blog", "contact", "download"
  ],
  counselor: [
    "welcome", "counselor-dashboard", "manova", "report", "psychology", 
    "counselor-chat", "traps", "courses", "inperson", "shop", "blog", "contact", "download"
  ],
  teacher: [
    "welcome", "teacher-dashboard", "report", "traps", "courses", "inperson", "shop", "blog", "contact", "download"
  ]
};

/**
 * ViewFactory Component
 * Standardized presentation, responsive transition layout, and modular integration of panels.
 */
export default function ViewFactory({
  view,
  role,
  student,
  onNavigate,
  onSwitchRole,
  onUpdateStudent,
  onUpdateBrand
}: ViewFactoryProps) {
  
  const [demoTier, setDemoTier] = React.useState<"Basic" | "Intermediate" | "Full">(() => {
    return (localStorage.getItem("taranom_demo_tier") as any) || "Full";
  });

  const handleTierChange = (tier: "Basic" | "Intermediate" | "Full") => {
    setDemoTier(tier);
    localStorage.setItem("taranom_demo_tier", tier);
    window.dispatchEvent(new Event('demoTierChanged'));
  };

  // 1. Role-based view authorization verification guard
  let isAllowed = ALLOWED_VIEWS_BY_ROLE[role]?.includes(view);
  
  if (isAllowed && role === "student") {
    // Demo Tier logic for testing constraints
    const basicViews = ["welcome", "dashboard", "schedule", "report", "courses", "inperson", "shop", "blog", "contact", "study-planner"];
    const intermediateViews = [...basicViews, "progress", "traps", "quiz"];
    
    if (demoTier === "Basic" && !basicViews.includes(view)) {
      isAllowed = false;
    } else if (demoTier === "Intermediate" && !intermediateViews.includes(view)) {
      isAllowed = false;
    }

    if (view !== "welcome" && view !== "dashboard" && view !== "admin" && view !== "study-planner") {
      try {
        const saved = localStorage.getItem("taranom_enabled_modules");
        if (saved) {
          const enabledModules = JSON.parse(saved);
          if (enabledModules[view] === false) {
            isAllowed = false;
          }
        }
      } catch (e) {}
    }
  }
  
  if (!isAllowed) {
    return (
      <>
        <div 
          id="view-factory-access-denied"
          className="p-8 text-center bg-white border border-rose-200 rounded-3xl space-y-4 max-w-2xl mx-auto shadow-md animate-fade-in"
          style={{ direction: "rtl" }}
        >
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h4 className="text-base font-black text-slate-900">عدم دسترسی مجاز مانیتورینگ</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              کاربر با نقش گرامی <span className="font-extrabold text-indigo-650">«{role}»</span>، مجوز دسترسی مستقیم به صفحه <span className="font-extrabold text-slate-800">«{view}»</span> را در این سطح دسترسی ندارد (احتمالاً به دلیل محدودیت دمو).
            </p>
          </div>
          <button
            onClick={() => onNavigate("welcome")}
            className="bg-slate-900 text-white text-xs font-black px-5 py-2.5 rounded-xl hover:bg-slate-800 transition active:scale-95"
          >
            بازگشت به پیشخوان معرفی کایزن
          </button>
        </div>
        <DemoTierSwitcher demoTier={demoTier} handleTierChange={handleTierChange} />
      </>
    );
  }

  const renderContent = () => {
    switch (view) {
    case "welcome":
      return (
        <WelcomeTourPortal 
          currentRole={role} 
          onNavigate={onNavigate} 
          onSwitchRole={(newRole) => onSwitchRole(newRole as RoleType)} 
        />
      );
    
    case "dashboard":
      return <DashboardView student={student} onNavigate={onNavigate} onUpdateStudent={onUpdateStudent} />;
    
    case "manova":
      return <ManovaDashboard student={student} onNavigate={onNavigate} />;
    
    case "report":
      // Supports dynamic page redirection
      return <ReportCardView student={student} onNavigate={onNavigate} />;
    
    case "schedule":
      return <StudyPlanView student={student} onNavigate={onNavigate} />;
    
    case "counselor":
    case "counselor-chat":
      return <CounselorView role={role} student={student} onNavigate={onNavigate} />;
    
    case "progress":
      return <ProgressView />;
    
    case "traps":
      return <TestTrapsView student={student} />;
    
    case "quiz":
      return <CustomQuizGenerator student={student} />;
    
    case "psychology":
      return <AssessmentView role={role} student={student} onNavigateChange={onNavigate} />;
    
    case "metacognition":
      return <MetacognitionLabView student={student} />;
    
    case "counseling":
      return <CounselingAdvisorView student={student} />;
    
    case "historical-db":
      return <HistoricalDatabaseView student={student} />;
    
    case "study-planner":
      return <StudyDashboardView student={student} onNavigate={onNavigate} />;
    
    case "smart-stress-trainer":
      return <SmartStressTrainerView student={student} />;
    
    case "konkur":
      return <KonkurExamView student={student} />;
        case "admin":
      return <AdminView student={student} onUpdateBrand={onUpdateBrand} />;
    
    case "parents":
      return <ParentsView student={student} />;
    
    case "counselor-dashboard":
      return (
        <CounselorDashboardView 
          student={student} 
          role={role}
          onNavigate={onNavigate} 
          onUpdateStudent={onUpdateStudent} 
        />
      );
    
    case "teacher-dashboard":
      return (
        <TeacherDashboardView 
          student={student} 
          onNavigate={onNavigate} 
          onUpdateStudent={onUpdateStudent} 
        />
      );

    case "courses":
      return <CoursesView />;

    case "inperson":
      return <InPersonView />;

    case "shop":
      return (
        <div className="p-12 text-center bg-white border border-slate-100 rounded-[2.5rem] shadow-xl space-y-8 animate-in fade-in zoom-in-95 duration-500 RTL" style={{ direction: 'rtl' }}>
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner ring-4 ring-indigo-50/50">
             <span className="text-4xl animate-bounce">🛍️</span>
          </div>
          <div className="space-y-3">
             <h2 className="text-3xl font-black text-slate-900">فروشگاه ابزارهای کایزن</h2>
             <p className="text-sm text-slate-500 font-bold max-w-md mx-auto leading-relaxed">
               به زودی مجموعه کاملی از دفترهای برنامه‌ریزی، اشتراک‌های ویژه تحلیل آزمون و کتاب‌های نایاب در این بخش قرار می‌گیرد.
             </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
             {["کتاب‌های تخصصی", "اشتراک نقره‌ای", "دوره مربیگری"].map((item, i) => (
                <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all cursor-pointer group">
                   <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                      <span className="text-lg">⭐</span>
                   </div>
                   <h4 className="text-xs font-black text-slate-850 mb-1">{item}</h4>
                   <span className="text-[10px] text-slate-400 font-bold">به زودی...</span>
                </div>
             ))}
          </div>
          <button onClick={() => onNavigate("welcome")} className="text-indigo-600 text-xs font-black hover:underline">بازگشت به پیشخوان</button>
        </div>
      );

    case "blog":
      return <BlogView onNavigate={onNavigate} />;

    case "download":
      return <MobileDownloadView onNavigate={onNavigate} />;

    case "planner-gen":
      return <AdvancedStudyPlanner student={student} onNavigate={onNavigate} />;

    case "contact":
      return (
        <div className="p-12 text-center bg-white border border-slate-100 rounded-[2.5rem] shadow-xl space-y-8 animate-in fade-in zoom-in-95 duration-500 RTL" style={{ direction: 'rtl' }}>
          <div className="w-20 h-20 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner ring-4 ring-amber-50/50">
             <span className="text-4xl">📞</span>
          </div>
          <div className="space-y-3">
             <h2 className="text-3xl font-black text-slate-900">مرکز همدلی و پشتیبانی</h2>
             <p className="text-sm text-slate-500 font-bold max-w-md mx-auto leading-relaxed">
               تیم پشتیبانی ما ۲۴ ساعته برای پاسخ به سوالات شما و حل مشکلات فنی در کنار شماست.
             </p>
          </div>
          <div className="max-w-xl mx-auto p-8 bg-slate-50 rounded-3xl border border-slate-100 text-right space-y-4">
             <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 mr-2">موضوع پیام</label>
                <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-amber-500/20 outline-none transition-all" placeholder="مثلاً: سوال در مورد پنل والدین" />
             </div>
             <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 mr-2">شرح پیام شما</label>
                <textarea className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-amber-500/20 outline-none transition-all min-h-[120px]" placeholder="پیام خود را اینجا بنویسید..." />
             </div>
             <button className="w-full bg-slate-900 text-white py-4 rounded-xl text-xs font-black hover:bg-slate-800 transition active:scale-[0.98] shadow-lg shadow-slate-200">ارسال پیام به تیم فنی</button>
          </div>
          <button onClick={() => onNavigate("welcome")} className="text-amber-600 text-xs font-black hover:underline">بازگشت به پیشخوان</button>
        </div>
      );
    
    default:
      return (
        <div 
          id="view-factory-missing-route"
          className="p-8 text-center bg-white border border-slate-200 rounded-3xl space-y-2"
          style={{ direction: "rtl" }}
        >
          <span className="text-xl">⚙️</span>
          <h4 className="text-xs font-black text-slate-800">صفحه یافت نگردید</h4>
          <p className="text-[10px] text-slate-400">شناسه صفحه نامعتبر است: {view}</p>
        </div>
      );
    }
  };

  return (
    <>
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <div className="text-slate-500 font-bold text-sm">در حال بارگذاری ماژول...</div>
        </div>
      }>
        {renderContent()}
      </Suspense>
      <DemoTierSwitcher demoTier={demoTier} handleTierChange={handleTierChange} />
    </>
  );
}

function DemoTierSwitcher({ demoTier, handleTierChange }: { demoTier: string, handleTierChange: (tier: any) => void }) {
  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-2 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-2xl border border-slate-200 animate-in slide-in-from-bottom-5" style={{ direction: 'rtl' }}>
      <div className="text-[10px] font-black text-slate-800 text-center mb-1">تست دمو (سطح دسترسی)</div>
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {(['Basic', 'Intermediate', 'Full'] as const).map(tier => (
          <button
            key={tier}
            onClick={() => handleTierChange(tier)}
            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
              demoTier === tier 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-200'
            }`}
          >
            {tier === 'Basic' ? 'پایه' : tier === 'Intermediate' ? 'استاندارد' : 'جامع'}
          </button>
        ))}
      </div>
    </div>
  );
}
