import React, { useState, useEffect, useMemo } from "react";
import { 
  Target, Plus, Search, Filter, Trash2, Brain, 
  AlertTriangle, BookOpen, Star, ChevronDown, CheckCircle, Download,
  TrendingDown, TrendingUp, Zap, Ghost, Eye, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TestTrap, Student, Exam } from "../types";
import { getTestTraps, saveTestTrap, deleteTestTrap } from "../lib/traps";
import { addSystemLog } from "../lib/syslogs";

interface TestTrapsViewProps {
  student: Student;
}

export default function TestTrapsView({ student }: TestTrapsViewProps) {
  const [traps, setTraps] = useState<TestTrap[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddingMode, setIsAddingMode] = useState(false);

  // Simulated frequency for demonstration (as per requirement)
  const [trapFrequencyMap, setTrapFrequencyMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchedTraps = getTestTraps(student.field, student.id);
    setTraps(fetchedTraps);
    
    // Simulate frequency: count occurrences of same trapType + subject
    const freq: Record<string, number> = {};
    fetchedTraps.forEach(t => {
      const key = `${t.subject}-${t.trapType}`;
      freq[key] = (freq[key] || 0) + 1;
    });
    setTrapFrequencyMap(freq);

    // Synchronize default values of newTrap form dynamically
    setNewTrap({
      questionTitle: "",
      subject: student.field === "ensani" ? "ادبیات فارسی تخصصی" : student.field === "riazi" ? "حسابان و ریاضیات" : "زیست‌شناسی",
      category: "مفهومی",
      trapType: "",
      correctAnswer: "",
      userMistake: "",
      educationalNote: "",
      importance: "medium"
    });
  }, [student]);

  // Calculate top 3 subjects with most negative marks based on student field
  const topNegativeSubjects = useMemo(() => {
    // Hardcoded mock stats based on field to match other views (Kaizen/ReportCard)
    if (student.field === "riazi") {
      return [
        { name: "حسابان و ریاضیات", count: 74, severity: "critical" },
        { name: "شیمی تخصصی", count: 59, severity: "critical" },
        { name: "فیزیک تخصصی", count: 42, severity: "warning" }
      ];
    } else if (student.field === "ensani") {
      return [
        { name: "ادبیات فارسی تخصصی", count: 74, severity: "critical" },
        { name: "عربی تخصصی", count: 59, severity: "critical" },
        { name: "جامعه‌شناسی", count: 42, severity: "warning" }
      ];
    } else {
      // tajrobi
      return [
        { name: "زیست‌شناسی", count: 74, severity: "critical" },
        { name: "شیمی", count: 59, severity: "critical" },
        { name: "فیزیک", count: 42, severity: "warning" }
      ];
    }
  }, [student.field]);

  const handleSave = () => {
    if (!newTrap.questionTitle || !newTrap.correctAnswer) {
      alert("لطفاً موارد ضروری را تکمیل کنید.");
      return;
    }
    const saved = saveTestTrap(newTrap, student.field, student.id);
    const updatedTraps = [saved, ...traps];
    setTraps(updatedTraps);
    
    // Update frequency
    const key = `${saved.subject}-${saved.trapType}`;
    setTrapFrequencyMap(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));

    addSystemLog("ثبت تله تستی", student.name, `تله جدید در مبحث ${newTrap.subject} ثبت شد.`);
    setIsAddingMode(false);
    setNewTrap({
      questionTitle: "",
      subject: student.field === "ensani" ? "ادبیات فارسی تخصصی" : student.field === "riazi" ? "حسابان و ریاضیات" : "زیست‌شناسی",
      category: "مفهومی",
      trapType: "",
      correctAnswer: "",
      userMistake: "",
      educationalNote: "",
      importance: "medium"
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این تله اطمینان دارید؟")) {
      deleteTestTrap(id, student.field, student.id);
      setTraps(traps.filter(t => t.id !== id));
    }
  };

  const handleExportPDF = () => {
    addSystemLog("خروجی PDF تله‌ها", student.name, "داوطلب گزارش جامع تله‌های تستی خود را جهت مرور آفلاین دریافت کرد.");
    window.print();
  };

  // Logic: "List test traps based on most frequency"
  const sortedAndFilteredTraps = useMemo(() => {
    return traps
      .filter(t => {
        const matchesSearch = t.questionTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             t.educationalNote.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        const freqA = trapFrequencyMap[`${a.subject}-${a.trapType}`] || 0;
        const freqB = trapFrequencyMap[`${b.subject}-${b.trapType}`] || 0;
        return freqB - freqA; // Descent order of frequency
      });
  }, [traps, searchTerm, selectedCategory, trapFrequencyMap]);

  // New trap form state
  const [newTrap, setNewTrap] = useState<Omit<TestTrap, "id" | "createdAt">>({
    questionTitle: "",
    subject: student.field === "ensani" ? "ادبیات فارسی تخصصی" : student.field === "riazi" ? "حسابان و ریاضیات" : "زیست‌شناسی",
    category: "مفهومی",
    trapType: "",
    correctAnswer: "",
    userMistake: "",
    educationalNote: "",
    importance: "medium"
  });

  return (
    <div className="space-y-6" style={{ direction: "rtl" }}>
      {/* 🛡️ TOP MONITORING MODULE: PRIORITY SUBJECTS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in print:hidden">
        {topNegativeSubjects.map((subj, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-5 rounded-3xl border-2 flex flex-col justify-between relative overflow-hidden group shadow-sm ${
              subj.severity === 'critical' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
            }`}
          >
            <div className="absolute -left-2 -bottom-2 opacity-5 group-hover:scale-110 transition-transform">
              <TrendingDown size={80} />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider mb-1 inline-block ${
                  subj.severity === 'critical' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {idx === 0 ? "اولویت اول رفع نقص" : idx === 1 ? "تمرکز ویژه" : "نیاز به بازبینی"}
                </span>
                <h3 className="text-sm font-black text-slate-900">{subj.name}</h3>
              </div>
              <div className={`p-2 rounded-xl ${subj.severity === 'critical' ? 'bg-rose-200/50 text-rose-700' : 'bg-amber-200/50 text-amber-700'}`}>
                <AlertTriangle size={18} />
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
               <div>
                  <span className="text-2xl font-black text-slate-800 tracking-tighter">{subj.count}</span>
                  <span className="text-[10px] text-slate-500 font-bold mr-1">نمره منفی مجموع</span>
               </div>
               <div className="text-[10px] text-slate-400 font-bold">پایش ۴ آزمون اخیر</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 rounded-2xl">
            <Target size={24} className="text-rose-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 italic">بانک تله‌های تستی شخصی (Traps Vault)</h2>
            <p className="text-xs text-slate-500 font-bold">مدیریت اشتباهات پرتکرار و نکات طلایی شب کنکور سراسری</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all shadow-sm"
          >
            <Download size={16} className="text-blue-600" />
            <span>خروجی گزارش PDF</span>
          </button>
          <button 
            onClick={() => setIsAddingMode(!isAddingMode)}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-2xl font-black text-xs hover:bg-rose-600 transition-all shadow-lg hover:shadow-rose-100"
          >
            <Plus size={16} />
            <span>ثبت تله جدید</span>
          </button>
        </div>
      </div>

      {/* Print Only Header */}
      <div className="hidden print:block mb-8 text-center border-b-2 border-slate-900 pb-6">
        <h1 className="text-2xl font-black text-slate-900 mb-2">گزارش جامع تله‌های تستی شخصی (Traps Vault)</h1>
        <div className="flex justify-between items-center text-sm font-bold text-slate-600 px-4">
          <span>نام داوطلب: {student.name}</span>
          <span>تعداد تله‌ها: {traps.length} مورد</span>
          <span>تاریخ گزارش: {new Date().toLocaleDateString("fa-IR")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters and Stats */}
        <div className="lg:col-span-1 space-y-4 print:hidden">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 space-y-4 shadow-sm">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-black block pr-1">جستجوی تله:</label>
              <div className="relative">
                <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="جستجو در سوالات و نکات..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pr-9 pl-3 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-slate-200 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-black block pr-1">فیلتر دسته‌بندی:</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-xs font-black text-slate-700 outline-none"
              >
                <option value="all">همه تله‌ها</option>
                <option value="مفهومی">مفهومی</option>
                <option value="زمان‌بر">زمان‌بر</option>
                <option value="اشتباه_محاسباتی">اشتباه محاسباتی</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-black">
              <span className="text-slate-400">تعداد کل تله‌ها:</span>
              <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{traps.length} مورد</span>
            </div>
          </div>

          <div className="bg-indigo-900 p-5 rounded-3xl text-white space-y-3 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Brain size={100} />
            </div>
            <h4 className="text-xs font-black flex items-center gap-2">
              <Star size={14} className="text-amber-400" />
              <span>استراتژی شب آزمون</span>
            </h4>
            <p className="text-[10px] text-indigo-200 leading-relaxed font-medium">
              تله‌های با اولویت <span className="text-white font-black underline">بسیار بالا</span> را در ۳ ساعت پایانی شب قبل آزمون مرور کنید تا از نمره منفی جلوگیری نمایید.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6 print:col-span-4">
          <AnimatePresence mode="wait">
            {isAddingMode ? (
              <motion.div
                key="add-trap"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-3xl border-2 border-slate-900 space-y-6 shadow-2xl"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <h3 className="text-base font-black text-slate-900">ثبت تله تستی جدید</h3>
                  <button onClick={() => setIsAddingMode(false)} className="text-slate-400 hover:text-rose-500">
                    <ChevronDown size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-black">عنوان سوال یا مبحث:</label>
                      <input 
                        type="text" 
                        value={newTrap.questionTitle}
                        onChange={(e) => setNewTrap({...newTrap, questionTitle: e.target.value})}
                        placeholder="مثلاً: تله طراح در سوالات مبحث مشتق یا ژنتیک"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold focus:bg-white transition-all outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-black">نام درس:</label>
                        <select 
                          value={newTrap.subject}
                          onChange={(e) => setNewTrap({...newTrap, subject: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs font-black text-slate-700 outline-none"
                        >
                          {student.field === "tajrobi" && (
                            <>
                              <option>زیست‌شناسی</option>
                              <option>شیمی</option>
                              <option>فیزیک</option>
                              <option>ریاضیات تجربی</option>
                              <option>زمین‌شناسی</option>
                            </>
                          )}
                          {student.field === "riazi" && (
                            <>
                              <option>حسابان و ریاضیات</option>
                              <option>هندسه و گسسته</option>
                              <option>فیزیک تخصصی</option>
                              <option>شیمی تخصصی</option>
                            </>
                          )}
                          {student.field === "ensani" && (
                            <>
                              <option>ادبیات فارسی تخصصی</option>
                              <option>عربی تخصصی</option>
                              <option>فلسفه و منطق</option>
                              <option>جامعه‌شناسی</option>
                              <option>روان‌شناسی</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-black">اولویت مرور:</label>
                        <select 
                          value={newTrap.importance}
                          onChange={(e) => setNewTrap({...newTrap, importance: e.target.value as any})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs font-black text-slate-700 outline-none"
                        >
                          <option value="high">بسیار بالا</option>
                          <option value="medium">متوسط</option>
                          <option value="low">کم</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-black">نوع تله (شگرد سوال):</label>
                      <input 
                        type="text" 
                        value={newTrap.trapType}
                        onChange={(e) => setNewTrap({...newTrap, trapType: e.target.value})}
                        placeholder="مثلاً: تله نفی در نفی یا بازی با کلمات"
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-rose-500 font-black block">اشتباه من در آزمون:</label>
                      <textarea 
                        value={newTrap.userMistake}
                        onChange={(e) => setNewTrap({...newTrap, userMistake: e.target.value})}
                        className="w-full bg-rose-50/30 border border-rose-100 rounded-xl px-4 py-2.5 text-xs font-bold min-h-[80px] outline-none"
                        placeholder="چرا اشتباه کردم؟"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-emerald-600 font-black block">پاسخ صحیح و تحلیل علمی:</label>
                      <textarea 
                        value={newTrap.correctAnswer}
                        onChange={(e) => setNewTrap({...newTrap, correctAnswer: e.target.value})}
                        className="w-full bg-emerald-50/30 border border-emerald-100 rounded-xl px-4 py-2.5 text-xs font-bold min-h-[80px] outline-none"
                        placeholder="پاسخ تشریحی بر اساس مراجع کنکور..."
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-indigo-600 font-black block">نکته طلایی برای شب آزمون (Cheat Sheet):</label>
                  <input 
                    type="text" 
                    value={newTrap.educationalNote}
                    onChange={(e) => setNewTrap({...newTrap, educationalNote: e.target.value})}
                    placeholder="یک خط طلایی که همیشه یادت بماند..."
                    className="w-full bg-indigo-50/30 border border-indigo-100 rounded-2xl px-4 py-3 text-xs font-black text-indigo-900 outline-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button onClick={() => setIsAddingMode(false)} className="px-6 py-2.5 text-xs font-black text-slate-500 hover:text-slate-800">انصراف</button>
                  <button 
                    onClick={handleSave}
                    className="bg-slate-900 text-white px-8 py-2.5 rounded-2xl text-xs font-black hover:bg-emerald-600 transition-colors shadow-lg"
                  >
                    ذخیره در بانک تله‌ها
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="traps-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 print:grid-cols-1"
              >
                {sortedAndFilteredTraps.length > 0 ? (
                  sortedAndFilteredTraps.map((trap) => {
                    const frequency = trapFrequencyMap[`${trap.subject}-${trap.trapType}`] || 0;
                    return (
                      <div 
                        key={trap.id} 
                        className="bg-white p-5 rounded-3xl border border-slate-150 relative group hover:border-slate-300 transition-all shadow-sm hover:shadow-md print:shadow-none print:border-slate-300 print:break-inside-avoid"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                               trap.importance === 'high' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' : 
                               trap.importance === 'medium' ? 'bg-amber-500' : 'bg-slate-400'
                            }`} />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">#{trap.id}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {frequency > 1 && (
                              <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg text-[9px] font-black border border-indigo-100">
                                <RefreshCw size={10} className="animate-spin-slow" />
                                <span>تکرار: {frequency} بار</span>
                              </span>
                            )}
                            <button 
                              onClick={() => handleDelete(trap.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-600 transition-opacity print:hidden"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-black text-slate-900 leading-tight">{trap.questionTitle}</h4>
                          <span className="p-1.5 bg-slate-50 rounded-lg text-[9px] font-black text-slate-500 border border-slate-100">{trap.subject}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="bg-rose-50/50 p-2.5 rounded-xl border-r-2 border-rose-400">
                             <div className="flex items-center gap-1.5 text-[9px] text-rose-700 font-black mb-1">
                               <AlertTriangle size={12} />
                               <span>اشتباه من:</span>
                             </div>
                             <p className="text-[10px] text-slate-600 font-bold leading-relaxed">{trap.userMistake}</p>
                          </div>

                          <div className="bg-emerald-50/50 p-2.5 rounded-xl border-r-2 border-emerald-400">
                             <div className="flex items-center gap-1.5 text-[9px] text-emerald-700 font-black mb-1">
                               <CheckCircle size={12} />
                               <span>پاسخ صریح:</span>
                             </div>
                             <p className="text-[10px] text-slate-700 font-black leading-relaxed">{trap.correctAnswer}</p>
                          </div>
                        </div>

                        <div className="bg-indigo-900 p-3 rounded-2xl flex items-center gap-2 group/tip shadow-inner">
                           <BookOpen size={14} className="text-amber-400 flex-shrink-0" />
                           <p className="text-[10px] text-indigo-50 font-black overflow-hidden text-ellipsis whitespace-nowrap">
                             {trap.educationalNote}
                           </p>
                        </div>

                        <div className="flex justify-between items-center pt-2 text-[9px] font-bold text-slate-400 border-t border-slate-50">
                           <span>دسته: {trap.category}</span>
                           <span>ثبت: {trap.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  );
                  })
                ) : (
                  <div className="col-span-2 py-20 text-center space-y-4">
                     <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <Target size={32} className="text-slate-200" />
                     </div>
                     <p className="text-sm font-black text-slate-400 italic">هیچ تله‌ای در این دسته‌بندی شکار نشده است!</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Print Only Footer */}
      <div className="hidden print:block mt-20 pt-10 border-t border-slate-200 text-center">
        <p className="text-[10px] font-black text-slate-400 italic">
          این گزارش توسط سامانه هوشمند «ترنم مهر» تهیه شده است. برای کسب موفقیت در کنکور، مرور هفتگی این تله‌ها اکیداً توصیه می‌شود.
        </p>
        <p className="text-[8px] text-slate-300 mt-2">Taranom Mehr AI - Traps Vault Report Engine</p>
      </div>
    </div>
  );
}
