import { useState } from "react";
import { Student } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { X, Save, Target, AlertCircle, Sparkles } from "lucide-react";
import { addSystemLog } from "../lib/syslogs";

interface ProfileSettingsViewProps {
  student: Student;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedStudent: Student) => void;
}

export default function ProfileSettingsView({ student, isOpen, onClose, onUpdate }: ProfileSettingsViewProps) {
  const [priorityTopics, setPriorityTopics] = useState(student.priorityTopics || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      const updatedStudent = { ...student, priorityTopics };
      onUpdate(updatedStudent);
      addSystemLog("بروزرسانی پروفایل هوشمند", student.name, "سرفصل‌های اولویت‌دار و مباحث ضعیف توسط داوطلب بروزرسانی شد.");
      setIsSaving(false);
      onClose();
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col text-right font-sans"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <h2 className="text-lg font-black text-slate-900">پروفایل هوشمند و تنظیمات مربیگری</h2>
                  <p className="text-[10px] text-slate-500 font-bold">شخصی‌سازی اولویت‌های درسی برای تحلیل‌های AI</p>
                </div>
                <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-2xl">
                  <Target size={24} />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-black text-slate-800 justify-end mb-2">
                  <AlertCircle size={16} className="text-amber-500" />
                  <span>سرفصل‌های اولویت‌دار و مباحث درسی ضعیف</span>
                </label>
                <textarea
                  value={priorityTopics}
                  onChange={(e) => setPriorityTopics(e.target.value)}
                  placeholder="مثلاً: مشتق و کاربرد آن، زیست دوازدهم فصل ۲، استوکیومتری شیمی..."
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none text-right placeholder:text-slate-300"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed text-right font-medium">
                  با وارد کردن مباحثی که در آن‌ها احساس ضعف می‌کنید، هوش مصنوعی ترنم مهر در تحلیل‌های کارنامه، برنامه‌ریزی هفتگی و تخمین شانس قبولی، وزن و تمرکز بیشتری به این سرفصل‌ها اختصاص خواهد داد.
                </p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl shrink-0">
                  <Sparkles size={16} />
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-black text-indigo-900 mb-1">تاثیر در کایزن درسی</h4>
                  <p className="text-[10px] text-indigo-700/80 leading-relaxed">
                    این اطلاعات مستقیماً به موتور پردازش کایزن متصل شده و به صورت خودکار تست‌های شناسنامه‌دار و درسنامه‌های صریح مطابق با این اولویت‌ها را برای شما فعال می‌کند.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-slate-500 hover:text-slate-700 font-bold text-xs"
              >
                انصراف
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>در حال ذخیره...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>ذخیره تنظیمات هوشمند</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
