import React, { useState, useEffect } from "react";
import { 
  Users, Sparkles, BookOpen, HeartPulse, Brain, Plus, Calendar, 
  Settings, Database, Compass, CheckCircle2, ChevronLeft, 
  HelpCircle, UserCheck, GraduationCap, AlertCircle, ClipboardList, FileSpreadsheet, Target,
  Edit2, Shield, Award, Briefcase, MapPin, Clock, Send, MessageSquare, RefreshCw, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Student } from "../types";
import { BRAND_CONFIG } from "../constants";
import { saveCounselorProfile, CounselorProfile, getProfileMetadata, getHydratedStudent } from "../lib/userProfiles";
import { loadStudyPlan, saveStudyPlan } from "../lib/studyPlans";
import { loadDailyReports, loadTaskProgress, type DailyReport, type TaskProgress } from "../lib/studentSync";
import DbStatusAlert from "./DbStatusAlert";
import CounselorStatsOverview from "./CounselorStatsOverview";
import CounselingCRM from "./admin/CounselingCRM";
import CounselorStudentManager from "./admin/CounselorStudentManager";

const getSupervisedStudents = (): Student[] => {
  const baseStudents = [
    { id: "1", name: "مریم حسینی", code: "9812405", field: "tajrobi" as const },
    { id: "2", name: "علیرضا رضایی", code: "9786431", field: "riazi" as const },
    { id: "3", name: "امیرمحمد اکبری", code: "9921477", field: "ensani" as const }
  ];

  let newlyRegistered: Student[] = [];
  try {
    const data = localStorage.getItem("arateb_new_registrations");
    if (data) {
      newlyRegistered = JSON.parse(data);
    }
  } catch (e) {
    console.error(e);
  }

  const all = [...baseStudents];
  newlyRegistered.forEach(ns => {
    if (!all.some(s => s.id === ns.id || s.code === ns.code)) {
      all.push({
        id: ns.id,
        name: ns.name,
        code: ns.code,
        field: ns.field
      });
    }
  });

  return all.map(s => getHydratedStudent(s));
};

interface CounselorDashboardViewProps {
  student: Student;
  role?: string | null;
  onNavigate: (view: any) => void;
  onUpdateStudent?: (updated: Student) => void;
}

export default function CounselorDashboardView({ student, role, onNavigate, onUpdateStudent }: CounselorDashboardViewProps) {
  const [studentsUnderSupervision, setStudentsUnderSupervision] = useState<Student[]>(() => getSupervisedStudents());
  const [activeStudent, setActiveStudent] = useState<Student>(() => getSupervisedStudents()[0]);

  // In production, load real student accounts from D1. Demo/offline mode keeps
  // the local sample list. The API only allows counselor/admin sessions.
  useEffect(() => {
    fetch("/api/auth/list", { credentials: "include", cache: "no-store" })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (!Array.isArray(data?.users) || data.users.length === 0) return;
        const remoteStudents = data.users.map((u: any) => getHydratedStudent({
          id: u.id,
          name: u.name,
          code: u.code || u.mobile || u.id,
          field: u.field || "tajrobi",
          grade: u.grade || "دانش‌آموز ثبت‌شده",
          city: u.city,
          age: u.age,
          mobile: u.mobile,
          accountRole: "student",
        }));
        setStudentsUnderSupervision(remoteStudents);
        setActiveStudent((current) => remoteStudents.find((s: Student) => s.id === current.id) || remoteStudents[0]);
      })
      .catch(() => {});
  }, []);
  
  const [counselorProfile, setCounselorProfile] = useState<CounselorProfile>(() => {
    return getProfileMetadata("counselor") as CounselorProfile;
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  
  const [cName, setCName] = useState(counselorProfile.name);
  const [cLicense, setCLicense] = useState(counselorProfile.licenseNumber);
  const [cField, setCField] = useState(counselorProfile.fieldOfStudy);
  const [cExperience, setCExperience] = useState(counselorProfile.experienceYears);
  const [cWorkplace, setCWorkplace] = useState(counselorProfile.workplace);
  const [cWorkHours, setCWorkHours] = useState(counselorProfile.workHours);
  const [cSpecialty, setCSpecialty] = useState(counselorProfile.specialty);
  
  // Custom manual study planner builder states for counselor (Synced with Student View exact schema)
  // All 7 days are editable (morning / afternoon / test count) — data-driven array.
  interface PlanDayInput { day: string; morning: string; afternoon: string; qCount: number; }

  const DEFAULT_PLAN_DAYS: PlanDayInput[] = [
    { day: "شنبه", morning: "پارت جبرانی ریاضی (مشتق و تابع) - ۴ ساعت", afternoon: "حل ۴۰ تست زمان‌دار تله‌دار ریاضی + ثبت در دفتر اشتباهات", qCount: 40 },
    { day: "یکشنبه", morning: "مطالعه ژنتیک و غشای سلولی زیست‌شناسی - ۴ ساعت", afternoon: "تحلیل ۵۰ تست تله‌دار زیست‌شناسی کنکور", qCount: 50 },
    { day: "دوشنبه", morning: "مرور فرمول‌های فیزیک و شیمی - ۳ ساعت", afternoon: "تست‌زنی جامع و بررسی پاسخ‌نامه تشریحی", qCount: 40 },
    { day: "سه‌شنبه", morning: "شبیه‌ساز نیمه‌جامع کنکور با رویکرد مدیریت زمان - ۴ ساعت", afternoon: "تحلیل موشکافانه تراز و تکنیک ضربدر منها", qCount: 60 },
    { day: "چهارشنبه", morning: "مرور دروس حفظی و ادبیات اختصاصی - ۳ ساعت", afternoon: "حل تست‌های سطح المپیاد و تله‌های پرتکرار", qCount: 35 },
    { day: "پنجشنبه", morning: "آزمون جامع آزمایشی شبیه‌ساز - ۴ ساعت", afternoon: "تحلیل کارنامه و استراحت بازسازنده ذهن", qCount: 50 },
    { day: "جمعه", morning: "مرور خلاصه‌ها، استراحت و ریکاوری روحی کایزن", afternoon: "ارسال گزارش هفتگی به مشاور و والدین", qCount: 20 },
  ];

  const [customPlanTitle, setCustomPlanTitle] = useState("نقشه راه و برنامه مهندسی‌شده کایزن بر اساس کارنامه");
  const [planDays, setPlanDays] = useState<PlanDayInput[]>(DEFAULT_PLAN_DAYS);
  const [planSuccessMsg, setPlanSuccessMsg] = useState("");
  const [planErrorMsg, setPlanErrorMsg] = useState("");
  const [advisorComment, setAdvisorComment] = useState("");
  const [commentSavedMsg, setCommentSavedMsg] = useState("");
  const [expandedDay, setExpandedDay] = useState<number | null>(0); // فقط روز اول باز

  const updatePlanDay = (index: number, patch: Partial<PlanDayInput>) => {
    setPlanDays(prev => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const resetPlan = () => {
    setCustomPlanTitle("نقشه راه و برنامه مهندسی‌شده کایزن بر اساس کارنامه");
    setPlanDays(DEFAULT_PLAN_DAYS);
  };

  // Student → counselor reverse sync: daily reports + task completion ticks.
  const [studentReports, setStudentReports] = useState<DailyReport[]>([]);
  const [studentProgress, setStudentProgress] = useState<TaskProgress | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReportsLoading(true);
    (async () => {
      const [reports, progress] = await Promise.all([
        loadDailyReports(activeStudent.id),
        loadTaskProgress(activeStudent.id),
      ]);
      if (cancelled) return;
      setStudentReports(reports);
      setStudentProgress(progress);
      setReportsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [activeStudent.id]);

  // Load every editable day when switching students. Resetting first prevents
  // one student's plan leaking into another student's form.
  useEffect(() => {
    let active = true;
    loadStudyPlan(activeStudent.id).then((plan) => {
      if (!active) return;
      setCustomPlanTitle(plan?.title || "نقشه راه و برنامه مهندسی‌شده کایزن بر اساس کارنامه");
      if (plan && Array.isArray(plan.schedule) && plan.schedule.length > 0) {
        setPlanDays(plan.schedule.map((s: any, i: number) => ({
          day: s.day || DEFAULT_PLAN_DAYS[i]?.day || `روز ${i + 1}`,
          morning: s.morning || "",
          afternoon: s.afternoon || "",
          qCount: Math.max(0, Number(s.qCount ?? s.totalQ ?? 0) || 0),
        })));
      } else {
        setPlanDays(DEFAULT_PLAN_DAYS);
      }
    });
    return () => { active = false; };
  }, [activeStudent.id]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CounselorProfile = {
      id: counselorProfile.id,
      name: cName,
      licenseNumber: cLicense,
      fieldOfStudy: cField,
      experienceYears: Number(cExperience),
      workplace: cWorkplace,
      workHours: cWorkHours,
      specialty: cSpecialty,
    };
    saveCounselorProfile(updated);
    setCounselorProfile(updated);
    setIsEditingProfile(false);
  };

  const [customAdvisorComment, setCustomAdvisorComment] = useState(() => {
    return localStorage.getItem(`taranom_advisor_comment_${activeStudent.id}`) || 
           "داوطلب کایزن درسی مناسبی دارد؛ اما برای فائق آمدن بر تله‌های مفهومی زیست، افزایش تحلیل پاسخ تشریحی ضروری است.";
  });

  const handleStudentSwitch = (selected: Student) => {
    setActiveStudent(selected);
    const storedComment = localStorage.getItem(`taranom_advisor_comment_${selected.id}`) || 
           "داوطلب کایزن درسی مناسبی دارد؛ اما برای فائق آمدن بر تله‌های مفهومی زیست، افزایش تحلیل پاسخ تشریحی ضروری است.";
    setCustomAdvisorComment(storedComment);
    if (onUpdateStudent) {
      onUpdateStudent(selected);
    }
  };

  const handleSaveComment = () => {
    localStorage.setItem(`taranom_advisor_comment_${activeStudent.id}`, customAdvisorComment);
    setCommentSavedMsg("توصیه‌نامه با موفقیت ذخیره شد.");
    setTimeout(() => setCommentSavedMsg(""), 4000);
  };

  const handlePublishManualPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlanSuccessMsg("");
    setPlanErrorMsg("");
    setPlanSuccessMsg("در حال ذخیره و همگام‌سازی برنامه...");
    const planPayload = {
      title: customPlanTitle,
      counselorName: counselorProfile.name,
      updatedAt: new Date().toISOString(),
      warnings: [
        `⚠️ توصیه مشاور (${counselorProfile.name}): برنامه هفتگی شما به صورت اختصاصی بازنویسی و تنظیم شد.`,
        "💡 لطفا تمامی پارت‌های شیفت صبح و عصر زیر را با دقت و متد پومودورو اجرا کنید."
      ],
      schedule: planDays.map(d => ({
        day: d.day,
        morning: d.morning,
        afternoon: d.afternoon,
        qCount: d.qCount,
      })),
      extracurricular: [
        "کارگاه رفع اشکال اضطراری دروس تخصصی (با حضور مشاور)",
        "جلسه مشاوره گروهی مدیریت استرس کنکور"
      ]
    };
    try {
      const result = await saveStudyPlan(activeStudent.id, planPayload);
      setPlanSuccessMsg(result.synced
        ? `✅ برنامه «${activeStudent.name}» در D1 ذخیره شد و اکنون در پنل دانش‌آموز قابل مشاهده است.`
        : `✅ برنامه «${activeStudent.name}» ذخیره شد. برای همگام‌سازی بین دستگاه‌ها با حساب مشاور وارد شوید.`);
      setTimeout(() => setPlanSuccessMsg(""), 7000);
    } catch (error: any) {
      setPlanSuccessMsg("");
      setPlanErrorMsg(error?.message || "خطا در ذخیره‌سازی برنامه.");
      setTimeout(() => setPlanErrorMsg(""), 7000);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-right" style={{ direction: "rtl" }} id="counselor-portal-hub">
      {/* وضعیت اتصال به دیتابیس — فقط برای ادمین/مشاور */}
      <DbStatusAlert role={role} />

      {/* ثبت‌نام و مدیریت دانش‌آموز توسط خود مشاور */}
      <CounselorStudentManager />

      {/* CRM درخواست‌های مشاوره */}
      <CounselingCRM />

      {/* نمای زندهٔ آماری سامانه از D1 */}
      <CounselorStatsOverview
        onSelectStudent={(id) => {
          const found = studentsUnderSupervision.find((s) => s.id === id);
          if (found) setActiveStudent(found);
        }}
      />

      {/* Hero Welcome banner */}
      <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 rounded-[35px] p-8 text-white relative overflow-hidden shadow-xl border border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[80px]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-3 flex-grow">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black border border-indigo-500/10">
                <UserCheck size={12} />
                <span>پورتال اختصاصی و نظارت مشاوران ارشد</span>
              </span>
              <button 
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 text-[10px] font-black border border-amber-500/20 transition-all cursor-pointer shadow-xs"
              >
                <Edit2 size={10} />
                <span>{isEditingProfile ? "بستن فرم ویرایش" : "ویرایش کارت شناسایی و امضا"}</span>
              </button>
            </div>
            <h1 className="text-2xl md:text-3xl font-black">سلام {counselorProfile.name} گرامی، به اتاق مشاورهٔ کایزن خوش آمدید</h1>
            <p className="text-slate-450 text-xs max-w-2xl leading-relaxed">
              تخصص شما: <span className="text-amber-300 font-bold">{counselorProfile.specialty}</span> | سابقه: <span className="text-emerald-300 font-extrabold">{counselorProfile.experienceYears} سال مربیگری رتبه برترها</span>
            </p>
          </div>
          <div className="bg-slate-800/60 backdrop-blur-md p-5 rounded-2xl border border-slate-700/50 text-right min-w-[240px] shadow-lg self-stretch flex flex-col justify-between">
             <div>
               <span className="text-[10px] text-slate-400 block font-bold mb-1">کد یکتا و تأییدیه نظام مشاور</span>
               <span className="text-xs font-black font-mono text-amber-400 block">{counselorProfile.licenseNumber}</span>
             </div>
             <div className="h-px bg-slate-700/50 my-2" />
             <div className="text-[10px] text-slate-300 font-semibold space-y-1">
               <div className="flex items-center gap-1.5">
                 <Award size={12} className="text-indigo-400 shrink-0" />
                 <span className="truncate">{counselorProfile.fieldOfStudy}</span>
               </div>
               <div className="flex items-center gap-1.5">
                 <MapPin size={12} className="text-emerald-400 shrink-0" />
                 <span className="truncate">{counselorProfile.workplace}</span>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Toggleable Profile Editor Row */}
      <AnimatePresence>
        {isEditingProfile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSaveProfile} className="bg-indigo-950/40 border border-indigo-900/30 p-6 rounded-[30px] space-y-4 text-white">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-900/40">
                <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <Shield size={16} />
                  <span>تنظیمات هویتی و ویرایش پروفایل مشاور کایزن (پویای سیستمی)</span>
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">نام و نام خانوادگی مشاور</label>
                  <input
                    type="text"
                    required
                    value={cName}
                    onChange={(e) => setCName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/80 border border-indigo-800/40 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">شماره نظام روان‌شناختی / مربیگری</label>
                  <input
                    type="text"
                    required
                    value={cLicense}
                    onChange={(e) => setCLicense(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/80 border border-indigo-800/40 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">رشته و مقطع تحصیلی</label>
                  <input
                    type="text"
                    required
                    value={cField}
                    onChange={(e) => setCField(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900/80 border border-indigo-800/40 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition duration-150 cursor-pointer shadow-md"
                >
                  ذخیره و اعتباردهی به امضا دیجیتال
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* RIGHT COLUMN: Active Student Switcher & Background Data */}
        <div className="lg:col-span-4 space-y-6">
          {/* Student Switcher Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Users size={16} className="text-indigo-600" />
                <span>داوطلبان تحت نظارت شما</span>
              </h3>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">تعداد: {studentsUnderSupervision.length} داوطلب</span>
            </div>

            <div className="space-y-2">
              {studentsUnderSupervision.map((studentItem) => {
                const isActive = activeStudent.id === studentItem.id;
                return (
                  <button
                    key={studentItem.id}
                    onClick={() => handleStudentSwitch(studentItem)}
                    className={`w-full text-right p-3.5 rounded-2xl transition duration-150 border flex items-center justify-between group ${
                      isActive 
                        ? "bg-indigo-50 border-indigo-300 text-indigo-950 shadow-sm" 
                        : "bg-slate-50 border-transparent hover:bg-slate-100/70 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div>
                      <span className="block text-xs font-black mb-1 group-hover:text-indigo-900 transition-colors">
                        {studentItem.name} 
                        <span className="text-[9px] text-slate-400 font-bold block mt-0.5">شناسه: {studentItem.code}</span>
                      </span>
                      <span className="text-[10px] block opacity-80 leading-none">{studentItem.grade}</span>
                    </div>
                    {isActive ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                    ) : (
                      <ChevronLeft size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* LEFT COLUMN: Active Assessment & Manual Plan Builder Form (Synced with Student View exact schema) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main stats ribbon of selected student */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[9px] text-slate-500 font-black block mb-1">داوطلب فعال</span>
              <span className="text-sm font-black text-indigo-950">{activeStudent.name}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[9px] text-slate-500 font-black block mb-1">رشته تخصصی</span>
              <span className="text-sm font-black text-indigo-950">
                {activeStudent.field === "tajrobi" ? "علوم تجربی" : activeStudent.field === "riazi" ? "ریاضی فیزیک" : "علوم انسانی"}
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[9px] text-slate-500 font-black block mb-1">تراز کنونی</span>
              <span className="text-sm font-black font-mono text-emerald-700">{activeStudent.academicProfile?.currentTraz || 7200}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[9px] text-slate-500 font-black block mb-1">ساعت مطالعه</span>
              <span className="text-sm font-black font-mono text-amber-600">{activeStudent.academicProfile?.studyHoursPerDay || 10} ساعت</span>
            </div>
          </div>

          {/* 📝 FORM FOR MANUAL STUDY PLAN CREATION & REWRITE (Exact Match with Student Schedule Grid) */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <ClipboardList size={20} className="text-indigo-600" />
                  <span>تدوین و بازنویسی جدول برنامه هفتگی برای {activeStudent.name}</span>
                </h3>
                <p className="text-xs text-slate-500 font-bold">این جدول دقیقاً همان ساختاری است که دانش‌آموز در پنل خود تحت عنوان «جدول زمان‌بندی پارت‌های مطالعاتی هفته» مشاهده می‌کند.</p>
              </div>
            </div>

            {planSuccessMsg && (
              <div className="p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 text-xs font-black text-center animate-fade-in">
                {planSuccessMsg}
              </div>
            )}

            <form onSubmit={handlePublishManualPlan} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">عنوان کلان برنامه مطالعاتی:</label>
                <input 
                  type="text"
                  required
                  value={customPlanTitle}
                  onChange={e => setCustomPlanTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
                />
              </div>

              {/* All 7 days, editable — collapsible accordion */}
              <div className="space-y-2">
                {planDays.map((d, i) => {
                  const isOpen = expandedDay === i;
                  const hasContent = d.morning.trim() || d.afternoon.trim();
                  return (
                    <div key={d.day} className={`rounded-2xl border overflow-hidden transition-all ${isOpen ? "bg-slate-50 border-indigo-300 shadow-sm" : "bg-white border-slate-200 hover:border-slate-300"}`}>
                      {/* Header (click to toggle) */}
                      <button
                        type="button"
                        onClick={() => setExpandedDay(isOpen ? null : i)}
                        className="w-full flex items-center justify-between gap-2 px-4 py-3 min-h-[52px] cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black font-mono shrink-0 ${isOpen ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 border border-indigo-100"}`}>
                            {d.day.slice(0, 1)}
                          </div>
                          <div className="text-right min-w-0">
                            <span className="text-xs font-black text-slate-800 block">روز {d.day}</span>
                            {!isOpen && (
                              <span className="text-[10px] text-slate-400 font-bold block truncate max-w-[220px]">
                                {hasContent ? (d.morning || d.afternoon) : "خالی — برای تنظیم کلیک کنید"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!isOpen && (
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-mono">{d.qCount} تست</span>
                          )}
                          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                        </div>
                      </button>

                      {/* Body (only when open) */}
                      {isOpen && (
                        <div className="px-4 pb-4 space-y-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-slate-500">تعداد تست هدف:</span>
                            <input
                              type="number"
                              min={0}
                              value={d.qCount}
                              onChange={e => updatePlanDay(i, { qCount: Math.max(0, Number(e.target.value) || 0) })}
                              className="w-20 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-center text-xs font-mono font-black text-indigo-700 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 mb-1">شیفت اول (صبح):</label>
                              <textarea
                                rows={2}
                                value={d.morning}
                                onChange={e => updatePlanDay(i, { morning: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold resize-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 mb-1">شیفت دوم (عصر):</label>
                              <textarea
                                rows={2}
                                value={d.afternoon}
                                onChange={e => updatePlanDay(i, { afternoon: e.target.value })}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {planErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl text-center">
                  {planErrorMsg}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-4 px-6 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send size={15} />
                  <span>انتشار و بارگذاری برنامه برای دانش‌آموز</span>
                </button>
                <button
                  type="button"
                  onClick={resetPlan}
                  className="px-4 py-4 bg-white border border-slate-200 text-slate-500 hover:text-slate-700 font-black text-xs rounded-2xl transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw size={15} />
                  <span>ریست</span>
                </button>
              </div>
            </form>
          </div>

          {/* 📬 Student → counselor reverse sync: progress + daily reports */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-emerald-600" />
                <span>گزارش روزانه و پیشرفت {activeStudent.name}</span>
              </h3>
              <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-black border border-emerald-100">
                همگام‌سازی زنده از D1
              </span>
            </div>

            {reportsLoading ? (
              <p className="text-xs text-slate-400 text-center py-4">در حال دریافت گزارش‌ها…</p>
            ) : (
              <>
                {/* Task progress summary */}
                <div>
                  <h4 className="text-xs font-black text-slate-600 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-indigo-500" /> وضعیت تکمیل پارت‌ها
                  </h4>
                  {studentProgress ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(studentProgress).map(([day, shifts]) => {
                        const done = Object.values(shifts || {}).filter(Boolean).length;
                        const total = Object.keys(shifts || {}).length || 2;
                        return (
                          <div key={day} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                            <span className="text-[10px] font-black text-slate-600 block mb-1">{day}</span>
                            <span className={`text-xs font-black ${done === total && total > 0 ? "text-emerald-600" : "text-indigo-600"}`}>
                              {done}/{total} پارت
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3 text-center">
                      دانش‌آموز هنوز هیچ پارت مطالعه‌ای را تیک نزده است.
                    </p>
                  )}
                </div>

                {/* Daily reports */}
                <div>
                  <h4 className="text-xs font-black text-slate-600 mb-2 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-amber-500" /> گزارش‌های روزانه دانش‌آموز
                  </h4>
                  {studentReports.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {studentReports.map(r => (
                        <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-indigo-700">{r.student_name || "دانش‌آموز"}</span>
                            <span className="text-[9px] text-slate-400 font-mono" dir="ltr">
                              {new Date(r.created_at).toLocaleDateString("fa-IR")}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">{r.text}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3 text-center">
                      هنوز گزارشی از این دانش‌آموز دریافت نشده است.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
