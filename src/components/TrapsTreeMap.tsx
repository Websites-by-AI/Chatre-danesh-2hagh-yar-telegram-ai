import React, { useState, useEffect } from "react";
import { 
  Target, Layers, BookOpen, Scale, ShieldAlert, 
  HelpCircle, ChevronDown, ChevronUp, AlertCircle, 
  Plus, CheckCircle, Info, Sparkles, Brain
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TestTrap } from "../types";
import { getTestTraps, saveTestTrap } from "../lib/traps";
import { addSystemLog } from "../lib/syslogs";

interface TrapsTreeMapProps {
  studentId: string;
  studentName: string;
  onRefreshStats?: () => void;
}

export default function TrapsTreeMap({ studentId, studentName, onRefreshStats }: TrapsTreeMapProps) {
  const [traps, setTraps] = useState<TestTrap[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTrapDetail, setSelectedTrapDetail] = useState<TestTrap | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    "biology": true,
    "physics": true,
    "chemistry": true,
    "other": false
  });

  // Reload traps
  const loadTraps = () => {
    setTraps(getTestTraps());
  };

  useEffect(() => {
    loadTraps();
  }, []);

  // Categorize traps
  const biologyTraps = traps.filter(t => {
    const subj = t.subject.toLowerCase();
    return subj.includes("زیست") || subj.includes("ژنتیک") || subj.includes("سلولی");
  });

  const physicsTraps = traps.filter(t => {
    const subj = t.subject.toLowerCase();
    return subj.includes("فیزیک") || subj.includes("حرکت") || subj.includes("نوسان");
  });

  const chemistryTraps = traps.filter(t => {
    const subj = t.subject.toLowerCase();
    return subj.includes("شیمی") || subj.includes("استوکیومتری") || subj.includes("آلی");
  });

  const otherTraps = traps.filter(t => {
    const subj = t.subject.toLowerCase();
    const isBiology = subj.includes("زیست") || subj.includes("ژنتیک") || subj.includes("سلولی");
    const isPhysics = subj.includes("فیزیک") || subj.includes("حرکت") || subj.includes("نوسان");
    const isChemistry = subj.includes("شیمی") || subj.includes("استوکیومتری") || subj.includes("آلی");
    return !isBiology && !isPhysics && !isChemistry;
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [cat]: !prev[cat]
    }));
  };

  // Pre-populate mock traps if empty for a subject
  const handleAddMockTrap = (subjectKey: 'biology' | 'physics' | 'chemistry') => {
    let mockData: Omit<TestTrap, "id" | "createdAt">;

    if (subjectKey === 'biology') {
      mockData = {
        questionTitle: "تشخیص ساختارهای بدون غشا در یوکاریوت‌ها",
        subject: "زیست‌شناسی",
        category: "مفهومی",
        trapType: "تله غشای دو لایه لپیدی",
        correctAnswer: "ریبوزوم و سانتریول فاقد غشا هستند.",
        userMistake: "من فکر کردم ریبوزوم تک غشایی است و در محاسبات لایه‌های فسفولیپیدی واردش کردم.",
        educationalNote: "توجه شود که ریبوزوم و سانتریول از ساختارهای بدون غشا در سلول‌های یوکاریوتی هستند و نباید در محاسبات تعداد لایه‌های فسفولیپیدی وارد شوند.",
        importance: "high"
      };
    } else if (subjectKey === 'physics') {
      mockData = {
        questionTitle: "محاسبه سرعت متوسط در حرکت با شتاب غیرثابت",
        subject: "فیزیک تخصصی",
        category: "اشتباه_محاسباتی",
        trapType: "تله فرمول میانگین حسابی",
        correctAnswer: "تقسیم جابجایی کل بر زمان کل",
        userMistake: "سرعت اولیه و ثانویه را جمع کرده و تقسیم بر دو کردم در حالی که شتاب ثابت نبود.",
        educationalNote: "فرمول (v1 + v2)/2 فقط و فقط زمانی صادق است که شتاب حرکت ثابت باشد. در شتاب‌های متغیر باید انتگرال‌گیری یا سطح زیر نمودار محاسبه شود.",
        importance: "high"
      };
    } else {
      mockData = {
        questionTitle: "تعیین بازده درصدی در واکنش‌های استوکیومتری",
        subject: "شیمی تجربی و ریاضی",
        category: "اشتباه_محاسباتی",
        trapType: "تله بازده نظری در مقابل عملی",
        correctAnswer: "بازده درصدی = (مقدار عملی / مقدار نظری) × ۱۰۰",
        userMistake: "مقدار نظری را با مقدار عملی جابجا گرفتم و درصد بازده را بالای ۱۰۰ به دست آوردم.",
        educationalNote: "همیشه مقدار عملی کمتر یا مساوی مقدار نظری است. اگر بازده بالای ۱۰۰ شد، جای صورت و مخرج اشتباه شده است.",
        importance: "medium"
      };
    }

    saveTestTrap(mockData);
    loadTraps();
    addSystemLog("ایجاد تله تستی آزمایشی", studentName, `تله شبیه‌ساز در مبحث ${mockData.subject} برای ساختار درختی اضافه شد.`);
    if (onRefreshStats) onRefreshStats();
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-right" style={{ direction: "rtl" }} id="traps-tree-container">
      {/* Subject Tree Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-2xl shadow-inner-sm">
            <Layers size={22} className="text-indigo-600 animate-pulse" />
          </div>
          <div>
            <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 text-[9px] rounded-lg font-black border border-indigo-150 inline-block mb-1">نقشه راه بصری</span>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>درخت دانش و تفکیک موضوعی تله‌های تستی ذخیره شده</span>
              <Sparkles size={14} className="text-amber-500 fill-amber-100" />
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-1">ساختار سلسله‌مراتبی تله‌های شکارشده به موازات مباحث کنکور سراسری</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold font-sans">تعداد کل تله‌ها در درخت:</span>
          <span className="font-mono text-xs font-black bg-slate-150 text-slate-800 px-2.5 py-1 rounded-xl border border-slate-200">{traps.length} مورد</span>
        </div>
      </div>

      {/* Visual Dynamic Tree Diagram */}
      <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 relative overflow-hidden" id="visual-nodes-tree-wrapper">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-100/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center space-y-8 select-none">
          
          {/* ROOT NODE */}
          <div className="relative flex flex-col items-center">
            <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 text-white px-6 py-3.5 rounded-2xl shadow-xl border border-indigo-950 flex flex-col items-center justify-center min-w-[220px] text-center transform hover:scale-[1.02] transition-transform duration-300">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center mb-1.5 scroll-smooth">
                <Target size={16} className="text-amber-400" />
              </div>
              <strong className="text-xs font-black tracking-wide">ریشه اصلی درخت دانش</strong>
              <span className="text-[9px] text-indigo-300 mt-1 font-bold">تله‌های نجات‌بخش کنکور سراسری</span>
            </div>
            
            {/* Split connectors downward on desktop */}
            <div className="hidden md:block w-0.5 h-8 bg-indigo-300" />
          </div>

          {/* TREE BRANCHES & CONNECTORS CONTAINER */}
          <div className="w-full">
            {/* Desktop Connectors Overlay (straight linking lines) */}
            <div className="hidden md:flex justify-around items-center w-full relative -mt-8 h-8 pointer-events-none">
              <div className="absolute top-0 left-[25%] right-[25%] h-0.5 bg-indigo-300" />
              <div className="w-0.5 h-8 bg-indigo-300" />
              <div className="w-0.5 h-8 bg-indigo-300" />
              <div className="w-0.5 h-8 bg-indigo-300" />
              {otherTraps.length > 0 && <div className="w-0.5 h-8 bg-indigo-300" />}
            </div>

            {/* BRANCHES GRID */}
            <div className={`grid grid-cols-1 md:grid-cols-3 ${otherTraps.length > 0 ? 'lg:grid-cols-4' : ''} gap-6 w-full text-right`}>
              
              {/* BRANCH 1: BIOLOGY */}
              <div className={`flex flex-col items-center space-y-3 ${selectedSubject === 'biology' ? 'ring-2 ring-blue-500/20 p-2.5 rounded-2xl bg-white/50' : ''}`} id="branch-biology">
                <button
                  onClick={() => {
                    setSelectedSubject(selectedSubject === 'biology' ? null : 'biology');
                    toggleCategory('biology');
                  }}
                  className={`w-full text-right p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                    biologyTraps.length > 0 
                      ? "bg-blue-50/70 hover:bg-blue-50/90 border-blue-200 shadow-sm" 
                      : "bg-white border-dashed border-slate-300 hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <strong className="text-xs font-black text-blue-950 block">مبحث زیست‌شناسی</strong>
                      <span className="text-[9px] text-blue-800 font-bold block mt-0.5">ژنتیک، سلولی و فیزیولوژی</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-lg border border-blue-200">
                      {biologyTraps.length}
                    </span>
                    {expandedCategories.biology ? <ChevronUp size={14} className="text-blue-500" /> : <ChevronDown size={14} className="text-blue-500" />}
                  </div>
                </button>

                {/* Sub-branch expansion containing actual traps */}
                {expandedCategories.biology && (
                  <div className="w-full space-y-2 animate-fade-in">
                    {biologyTraps.length > 0 ? (
                      biologyTraps.map(trap => (
                        <div 
                          key={trap.id}
                          onClick={() => setSelectedTrapDetail(trap)}
                          className="bg-white p-3 rounded-xl border border-slate-150 hover:border-blue-300 hover:shadow-xs transition duration-200 text-right cursor-pointer flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2 truncate pl-2">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${trap.importance === 'high' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                            <p className="text-[10px] font-black text-slate-800 truncate leading-relaxed">{trap.questionTitle}</p>
                          </div>
                          <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md shrink-0 font-bold">{trap.category}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-white text-center space-y-2">
                        <p className="text-[10px] text-slate-405 font-bold italic">تله‌ای در این مبحث ثبت نشده است</p>
                        <button
                          onClick={() => handleAddMockTrap('biology')}
                          className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-900 px-3 py-1.5 rounded-lg text-[9px] font-black transition-colors cursor-pointer"
                        >
                          <Plus size={10} />
                          <span>تله آزمایشی زیست</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BRANCH 2: PHYSICS */}
              <div className={`flex flex-col items-center space-y-3 ${selectedSubject === 'physics' ? 'ring-2 ring-amber-500/20 p-2.5 rounded-2xl bg-white/50' : ''}`} id="branch-physics">
                <button
                  onClick={() => {
                    setSelectedSubject(selectedSubject === 'physics' ? null : 'physics');
                    toggleCategory('physics');
                  }}
                  className={`w-full text-right p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                    physicsTraps.length > 0 
                      ? "bg-amber-50/70 hover:bg-amber-50/90 border-amber-200 shadow-sm" 
                      : "bg-white border-dashed border-slate-300 hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Scale size={16} />
                    </div>
                    <div>
                      <strong className="text-xs font-black text-amber-950 block">مبحث فیزیک تخصصی</strong>
                      <span className="text-[9px] text-amber-800 font-bold block mt-0.5">حرکت‌شناسی، نوسان و اتمی</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-lg border border-amber-200">
                      {physicsTraps.length}
                    </span>
                    {expandedCategories.physics ? <ChevronUp size={14} className="text-amber-500" /> : <ChevronDown size={14} className="text-amber-500" />}
                  </div>
                </button>

                {/* Sub-branch expansion containing actual traps */}
                {expandedCategories.physics && (
                  <div className="w-full space-y-2 animate-fade-in">
                    {physicsTraps.length > 0 ? (
                      physicsTraps.map(trap => (
                        <div 
                          key={trap.id}
                          onClick={() => setSelectedTrapDetail(trap)}
                          className="bg-white p-3 rounded-xl border border-slate-150 hover:border-amber-300 hover:shadow-xs transition duration-200 text-right cursor-pointer flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2 truncate pl-2">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${trap.importance === 'high' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                            <p className="text-[10px] font-black text-slate-800 truncate leading-relaxed">{trap.questionTitle}</p>
                          </div>
                          <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md shrink-0 font-bold">{trap.category}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-white text-center space-y-2">
                        <p className="text-[10px] text-slate-405 font-bold italic">تله‌ای در این مبحث ثبت نشده است</p>
                        <button
                          onClick={() => handleAddMockTrap('physics')}
                          className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-900 px-3 py-1.5 rounded-lg text-[9px] font-black transition-colors cursor-pointer"
                        >
                          <Plus size={10} />
                          <span>تله آزمایشی فیزیک</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BRANCH 3: CHEMISTRY */}
              <div className={`flex flex-col items-center space-y-3 ${selectedSubject === 'chemistry' ? 'ring-2 ring-red-500/20 p-2.5 rounded-2xl bg-white/50' : ''}`} id="branch-chemistry">
                <button
                  onClick={() => {
                    setSelectedSubject(selectedSubject === 'chemistry' ? null : 'chemistry');
                    toggleCategory('chemistry');
                  }}
                  className={`w-full text-right p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                    chemistryTraps.length > 0 
                      ? "bg-red-50/70 hover:bg-red-50/90 border-red-200 shadow-sm" 
                      : "bg-white border-dashed border-slate-300 hover:border-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-100 text-red-800 flex items-center justify-center">
                      <ShieldAlert size={16} />
                    </div>
                    <div>
                      <strong className="text-xs font-black text-red-950 block">مبحث شیمی</strong>
                      <span className="text-[9px] text-red-800 font-bold block mt-0.5">استوکیومتری، آلی و محلول‌ها</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black bg-red-100 text-red-900 px-2.5 py-0.5 rounded-lg border border-red-200">
                      {chemistryTraps.length}
                    </span>
                    {expandedCategories.chemistry ? <ChevronUp size={14} className="text-red-500" /> : <ChevronDown size={14} className="text-red-500" />}
                  </div>
                </button>

                {/* Sub-branch expansion containing actual traps */}
                {expandedCategories.chemistry && (
                  <div className="w-full space-y-2 animate-fade-in">
                    {chemistryTraps.length > 0 ? (
                      chemistryTraps.map(trap => (
                        <div 
                          key={trap.id}
                          onClick={() => setSelectedTrapDetail(trap)}
                          className="bg-white p-3 rounded-xl border border-slate-150 hover:border-red-300 hover:shadow-xs transition duration-200 text-right cursor-pointer flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2 truncate pl-2">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${trap.importance === 'high' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                            <p className="text-[10px] font-black text-slate-800 truncate leading-relaxed">{trap.questionTitle}</p>
                          </div>
                          <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md shrink-0 font-bold">{trap.category}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 border border-dashed border-slate-200 rounded-xl bg-white text-center space-y-2">
                        <p className="text-[10px] text-slate-405 font-bold italic">تله‌ای در این مبحث ثبت نشده است</p>
                        <button
                          onClick={() => handleAddMockTrap('chemistry')}
                          className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-900 px-3 py-1.5 rounded-lg text-[9px] font-black transition-colors cursor-pointer"
                        >
                          <Plus size={10} />
                          <span>تله آزمایشی شیمی</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BRANCH 4 (Optional / Legacy template items): OTHER */}
              {otherTraps.length > 0 && (
                <div className="flex flex-col items-center space-y-3" id="branch-other">
                  <button
                    onClick={() => toggleCategory('other')}
                    className="w-full text-right p-4 rounded-2xl border bg-slate-50 hover:bg-slate-100 border-slate-250 transition-all cursor-pointer flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center">
                        <HelpCircle size={16} />
                      </div>
                      <div>
                        <strong className="text-xs font-black text-slate-800 block">سایر مباحث / عمومی</strong>
                        <span className="text-[9px] text-slate-550 font-bold block mt-0.5">دروس عمومی یا پایه کنکوری</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black bg-slate-200 text-slate-850 px-2.5 py-0.5 rounded-lg border border-slate-300">
                        {otherTraps.length}
                      </span>
                      {expandedCategories.other ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                    </div>
                  </button>

                  {/* Sub-branch other */}
                  {expandedCategories.other && (
                    <div className="w-full space-y-2 animate-fade-in">
                      {otherTraps.map(trap => (
                        <div 
                          key={trap.id}
                          onClick={() => setSelectedTrapDetail(trap)}
                          className="bg-white p-3 rounded-xl border border-slate-150 hover:border-slate-350 hover:shadow-xs transition duration-200 text-right cursor-pointer flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2 truncate pl-2">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${trap.importance === 'high' ? 'bg-rose-500' : 'bg-slate-400'}`} />
                            <p className="text-[10px] font-bold text-slate-700 truncate">{trap.questionTitle}</p>
                          </div>
                          <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md shrink-0 font-bold">{trap.subject}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>

      {/* POPUP SELECTED TRAP DETAILS */}
      <AnimatePresence>
        {selectedTrapDetail && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="p-5 border-2 border-indigo-900 bg-white rounded-3xl relative shadow-md mt-4 text-right"
            id="trap-detail-popup"
          >
            <div className="absolute top-4 left-4 shrink-0 flex gap-2">
              <span className={`px-2.5 py-1 text-[9px] font-black rounded-lg border font-mono ${
                selectedTrapDetail.importance === 'high' 
                  ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' 
                  : 'bg-slate-50 text-slate-505 border-slate-150'
              }`}>
                اولویت: {selectedTrapDetail.importance === 'high' ? 'بسیار بالا' : 'متوسط'}
              </span>
              <button 
                onClick={() => setSelectedTrapDetail(null)}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition flex items-center justify-center font-bold text-xs cursor-pointer"
                title="بستن پنجره جزئیات"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 max-w-4xl">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                <h3 className="text-sm font-black text-slate-900 leading-relaxed pl-16">
                  {selectedTrapDetail.questionTitle}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-rose-50/50 p-3.5 rounded-2xl border-r-4 border-rose-400 space-y-1">
                  <span className="text-[9px] text-rose-700 font-extrabold flex items-center gap-1.5">
                    <AlertCircle size={12} />
                    <span>اشتباه و تحلیل داوطلب:</span>
                  </span>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">
                    {selectedTrapDetail.userMistake}
                  </p>
                </div>

                <div className="bg-emerald-50/50 p-3.5 rounded-2xl border-r-4 border-emerald-400 space-y-1">
                  <span className="text-[9px] text-emerald-700 font-extrabold flex items-center gap-1.5">
                    <CheckCircle size={12} />
                    <span>پاسخ صحیح و استدلال علمی:</span>
                  </span>
                  <p className="text-xs font-black text-slate-800 leading-relaxed">
                    {selectedTrapDetail.correctAnswer}
                  </p>
                </div>
              </div>

              <div className="bg-indigo-900 text-white p-4 rounded-2xl flex items-start gap-3 space-y-1">
                <div className="p-1.5 bg-white/10 rounded-xl text-amber-300">
                  <Brain size={16} />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-indigo-200 font-black block">رهنمود طلایی شب آزمون (Cheat Sheet):</span>
                  <p className="text-xs font-bold text-indigo-50 leading-relaxed">
                    {selectedTrapDetail.educationalNote}
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-50 pt-3">
                <span className="flex items-center gap-1">
                  <Info size={11} />
                  <span>درس: {selectedTrapDetail.subject} | دسته‌بندی علمی: {selectedTrapDetail.category}</span>
                </span>
                <span>ثبت شده در سامانه: {selectedTrapDetail.createdAt}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide text */}
      <p className="text-[11px] text-slate-400 leading-relaxed text-right font-semibold">
        💡 <strong className="font-bold text-indigo-950">نکته آموزشی ترنم مهر:</strong> روی هر یک از کارت‌های تله تستی بالا کلیک کنید تا جزئیات سوال، تله طراحی شده، اشتباه شما و مستند علمی صریح جهت حذف خطا در تراز کنکور در این باکس خلاصه نشان داده شود.
      </p>
    </div>
  );
}
