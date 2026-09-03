import React, { useState } from "react";
import { UserPlus, Phone, Hash, BookOpen, GraduationCap, CheckCircle, Smartphone } from "lucide-react";
import { motion } from "motion/react";

interface StudentRegistrationFormProps {
  onSuccess?: () => void;
}

export default function StudentRegistrationForm({ onSuccess }: StudentRegistrationFormProps) {
  const [formData, setFormData] = useState({
    mobile: "",
    nationalId: "",
    grade: "",
    field: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call and sending verification code
    setTimeout(() => {
      setIsSubmitting(false);
      setShowVerification(true);
      // Generate a random 5-digit verification code for simulation purposes
      const code = Math.floor(10000 + Math.random() * 90000).toString();
      setVerificationCode(code);
    }, 1500);
  };

  if (showVerification) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-8 text-center max-w-md mx-auto w-full"
      >
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} />
        </div>
        <h3 className="text-xl font-black text-slate-800 mb-2">ثبت نام اولیه با موفقیت انجام شد!</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          کد تایید به شماره موبایل {formData.mobile} ارسال شد. (شبیه‌سازی)
        </p>
        
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
          <div className="text-xs text-slate-500 font-bold mb-1">کد تایید شما:</div>
          <div className="text-3xl font-black text-indigo-600 tracking-widest">{verificationCode}</div>
        </div>
        
        <button 
          onClick={() => {
            setShowVerification(false);
            setFormData({ mobile: "", nationalId: "", grade: "", field: "" });
            if (onSuccess) onSuccess();
          }}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition"
        >
          ثبت نام دانش‌آموز جدید
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-md mx-auto w-full" dir="rtl">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
          <UserPlus size={20} />
        </div>
        <div>
          <h2 className="text-lg font-black text-slate-800">فرم ثبت نام دانش‌آموز</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">ثبت نام در سامانه آموزشی ترنم مهر</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mobile */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">شماره موبایل</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Smartphone size={16} />
            </div>
            <input 
              type="tel"
              required
              value={formData.mobile}
              onChange={(e) => setFormData({...formData, mobile: e.target.value})}
              className="block w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300 font-mono text-left"
              placeholder="09123456789"
              dir="ltr"
            />
          </div>
        </div>

        {/* National ID */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">کد ملی</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <Hash size={16} />
            </div>
            <input 
              type="text"
              required
              value={formData.nationalId}
              onChange={(e) => setFormData({...formData, nationalId: e.target.value})}
              className="block w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300 font-mono text-left"
              placeholder="1234567890"
              dir="ltr"
            />
          </div>
        </div>

        {/* Grade */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">پایه تحصیلی</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <GraduationCap size={16} />
            </div>
            <select 
              required
              value={formData.grade}
              onChange={(e) => setFormData({...formData, grade: e.target.value})}
              className="block w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none bg-white"
            >
              <option value="">انتخاب پایه تحصیلی...</option>
              <optgroup label="متوسطه اول">
                <option value="هفتم">پایه هفتم</option>
                <option value="هشتم">پایه هشتم</option>
                <option value="نهم">پایه نهم</option>
              </optgroup>
              <optgroup label="متوسطه دوم">
                <option value="دهم">پایه دهم</option>
                <option value="یازدهم">پایه یازدهم</option>
                <option value="دوازدهم">پایه دوازدهم</option>
                <option value="پشت کنکوری">پشت کنکوری (فارغ التحصیل)</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Field of Study */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">رشته تحصیلی</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <BookOpen size={16} />
            </div>
            <select 
              required
              value={formData.field}
              onChange={(e) => setFormData({...formData, field: e.target.value})}
              className="block w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none bg-white"
            >
              <option value="">انتخاب رشته تحصیلی...</option>
              <option value="تجربی">علوم تجربی</option>
              <option value="ریاضی">ریاضی فیزیک</option>
              <option value="انسانی">علوم انسانی</option>
              <option value="هنر">هنر</option>
              <option value="زبان">زبان‌های خارجی</option>
            </select>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>در حال ثبت...</span>
            </>
          ) : (
            <>
              <span>ثبت نام و دریافت کد تایید</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
