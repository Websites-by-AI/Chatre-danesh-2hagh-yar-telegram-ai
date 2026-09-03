import React, { useState, useMemo } from "react";
import { Search, AlertTriangle, CheckCircle, Shield, FileText, ChevronRight, RefreshCw, Trash2, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuditResult {
  id: string;
  location: string;
  content: string;
  context: "CRM" | "ExamAnalysis" | "Dashboard" | "SystemLog" | "Counseling";
  status: "flagged" | "resolved" | "ignored";
  date: string;
}

export default function ContentAuditModule() {
  const [searchTerm, setSearchTerm] = useState("ترنم مهر");
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<AuditResult[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  // Simulated content database to "search" through
  const simulatedDB = useMemo(() => [
    { id: "1", context: "CRM", location: "crm_leads table", content: "داوطلب متقاضی دوره های آمادگی کنکور سراسری ترنم مهر", date: "۱۴۰۴/۰۸/۱۲" },
    { id: "2", context: "ExamAnalysis", location: "exam_results_processor", content: "تحلیل آزمون های ترنم مهر بر اساس هوش مصنوعی اختصاصی ترنم مهر", date: "۱۴۰۴/۰۹/۰۵" },
    { id: "3", context: "Dashboard", location: "UI Components / DashboardView", content: "خوش آمدید به پنل مانیتورینگ آکادمی ترنم مهر", date: "۱۴۰۴/۱۰/۲۰" },
    { id: "4", context: "Counseling", location: "counselor_notes_122", content: "توصیه به استفاده از جزوات شرح صریح ترنم مهر برای بازه مرور کنکور", date: "۱۴۰۴/۱۱/۰۲" },
    { id: "5", context: "SystemLog", location: "sys_auth_logs", content: "ورود ادمین ترنم مهر به سامانه مرکزی آکادمی", date: "۱۴۰۴/۱۲/۱۵" },
    { id: "6", context: "ExamAnalysis", location: "questions_pool", content: "سوال شماره ۴۲ از آزمون آزمایشی کنکور ترنم مهر", date: "۱۴۰۵/۰۱/۱۰" },
  ], []);

  const handleScan = () => {
    setIsScanning(true);
    setResults([]);
    
    // Simulate deep scan
    setTimeout(() => {
      const filtered = simulatedDB.filter(item => 
        item.content.includes(searchTerm) || 
        item.location.includes(searchTerm) ||
        item.context.includes(searchTerm)
      ).map(item => ({
        ...item,
        status: "flagged" as const,
        context: item.context as any
      }));
      
      setResults(filtered);
      setIsScanning(false);
      setShowSummary(true);
    }, 1800);
  };

  const markAsResolved = (id: string, newContent?: string) => {
    setResults(prev => prev.map(res => 
      res.id === id ? { ...res, status: "resolved", content: newContent || res.content } : res
    ));
  };

  const handleDeleteEntry = (id: string) => {
    setResults(prev => prev.filter(res => res.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header & Search Interface */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <Shield size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">سامانه پایش محتوا و رفع ناهماهنگی نام تجاری</h3>
            <p className="text-xs text-slate-500 font-bold">جستجو و حذف هوشمند عبارات نامرتبط (مانند "نام سابق") از سراسر دیتابیس و لایههای UI</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="عبارت مورد نظر برای پایش (مثلاً: نام قدیمی)"
              className="w-full bg-slate-50 border border-slate-150 rounded-2xl pr-11 pl-4 py-3.5 text-sm font-bold outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all shadow-inner"
            />
          </div>
          <button 
            onClick={handleScan}
            disabled={isScanning || !searchTerm}
            className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-black transition-all disabled:bg-slate-300 shadow-lg shadow-slate-200"
          >
            {isScanning ? <RefreshCw size={18} className="animate-spin" /> : <Search size={18} />}
            <span>{isScanning ? "در حال اسکن عمیق..." : "شروع عملیات پایش"}</span>
          </button>
        </div>
      </div>

      {/* Progress & Summary */}
      {showSummary && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <AlertTriangle size={20} />
            </div>
            <div>
              <span className="text-[10px] text-rose-500 font-black block uppercase">موارد پرچم‌گذاری شده</span>
              <span className="text-xl font-black text-rose-700">{results.filter(r => r.status === 'flagged').length} مورد</span>
            </div>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <CheckCircle size={20} />
            </div>
            <div>
              <span className="text-[10px] text-emerald-500 font-black block uppercase">موارد اصلاح شده</span>
              <span className="text-xl font-black text-emerald-700">{results.filter(r => r.status === 'resolved').length} مورد</span>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center gap-4">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <span className="text-[10px] text-blue-500 font-black block uppercase">کل موارد اسکن شده</span>
              <span className="text-xl font-black text-blue-700">{simulatedDB.length} سند</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Results List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {results.length > 0 ? (
            results.map((res) => (
              <motion.div
                key={res.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white p-5 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between gap-4 transition-all ${
                  res.status === 'resolved' ? 'border-emerald-200 bg-emerald-50/10 opacity-75' : 'border-slate-100 hover:border-rose-200'
                }`}
              >
                <div className="flex gap-4">
                  <div className={`p-3 rounded-2xl h-fit ${
                    res.status === 'resolved' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'
                  }`}>
                    <FileText size={20} />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-lg uppercase tracking-wider">{res.context}</span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <ChevronRight size={10} />
                        {res.location}
                      </span>
                      {res.status === 'resolved' && (
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <CheckCircle size={10} />
                          اصلاح شد
                        </span>
                      )}
                    </div>
                    
                    <div className="relative group">
                      <p className={`text-sm font-bold leading-relaxed ${res.status === 'resolved' ? 'text-emerald-700 line-through decoration-emerald-300' : 'text-slate-800'}`}>
                        {res.content}
                      </p>
                      {res.status === 'flagged' && (
                        <div className="mt-2 p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-center gap-2">
                          <AlertTriangle className="text-rose-500" size={14} />
                          <span className="text-[11px] text-rose-700 font-bold">عبارت "{searchTerm}" در این بخش شناسایی شد. نام تجاری تایید نگردید.</span>
                        </div>
                      )}
                    </div>
                    
                    <span className="text-[10px] text-slate-400 font-mono inline-block">{res.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  {res.status === 'flagged' && (
                    <>
                      <button 
                        onClick={() => markAsResolved(res.id)}
                        className="p-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all border border-emerald-100 shadow-sm group relative"
                        title="تایید و جایگزینی با 'برند ترنم مهر'"
                      >
                        <Edit3 size={16} />
                        <span className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-slate-900 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap z-10">تبدیل به 'برند ترنم مهر'</span>
                      </button>
                      <button 
                        onClick={() => handleDeleteEntry(res.id)}
                        className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl transition-all border border-rose-100 shadow-sm"
                        title="حذف کامل ورودی"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                  {res.status === 'resolved' && (
                    <button className="text-[10px] font-black text-slate-400 cursor-default">عملیات تکمیل شد</button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            searchTerm && !isScanning && showSummary && (
              <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900">سیستم پاکسازی شد!</h4>
                  <p className="text-sm text-slate-500 font-medium">هیچ اثری از عبارت "{searchTerm}" در بخش‌های حساس یافت نشد.</p>
                </div>
              </div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Audit Log Footer */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-right">
        <span className="text-[10px] text-slate-400 font-bold">آخرین پایش هوشمند سیستم: ۲ ساعت پیش توسط ادمین</span>
        <div className="flex gap-4">
          <button className="text-[10px] font-black text-indigo-600 hover:underline">دریافت گزارش PDF پایش</button>
          <button className="text-[10px] font-black text-slate-500 hover:underline">مشاهده تاریخچه پاکسازی</button>
        </div>
      </div>
    </div>
  );
}
