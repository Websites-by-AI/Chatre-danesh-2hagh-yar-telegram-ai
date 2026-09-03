import React, { useState, useEffect } from 'react';
import { Target, FileSpreadsheet, Calendar, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';

interface TourGuideProps {
  onComplete: () => void;
  role: 'student' | 'parent' | 'counselor' | 'teacher' | 'admin';
}

const steps = [
  {
    id: 'welcome',
    title: 'به سیستم هوشمند خوش آمدید!',
    description: 'در این تور کوتاه، با مهم‌ترین بخش‌های پلتفرم که برای موفقیت شما طراحی شده‌اند آشنا می‌شویم.',
    icon: Sparkles,
    color: 'text-indigo-500',
    bg: 'bg-indigo-100',
  },
  {
    id: 'report',
    title: 'کارنامه ترازها',
    description: 'در این بخش می‌توانید مسیر پیشرفت تحصیلی خود را رصد کنید، نقاط قوت و ضعف خود را بشناسید و با دریافت بازخوردهای هوشمند، عملکرد خود را بهبود ببخشید.',
    icon: FileSpreadsheet,
    color: 'text-emerald-500',
    bg: 'bg-emerald-100',
  },
  {
    id: 'schedule',
    title: 'برنامه‌ریزی و تقویم',
    description: 'برنامه مطالعه روزانه و هفتگی خود را با دقت مدیریت کنید. ما به شما کمک می‌کنیم تا زمان خود را برای بیشترین بازدهی تنظیم کنید.',
    icon: Calendar,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
  },
  {
    id: 'traps',
    title: 'بانک تله‌های تستی',
    description: 'رایج‌ترین اشتباهات و تله‌های کنکور را بشناسید! با تحلیل این تله‌ها، دقت خود را در آزمون‌ها افزایش دهید.',
    icon: Target,
    color: 'text-amber-500',
    bg: 'bg-amber-100',
  }
];

export default function TourGuide({ onComplete, role }: TourGuideProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Only show for students on their first login
    if (role === 'student') {
      const hasSeenTour = localStorage.getItem('manova_has_seen_tour');
      if (!hasSeenTour) {
        // slight delay for better UX
        const timer = setTimeout(() => setIsOpen(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [role]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(curr => curr - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('manova_has_seen_tour', 'true');
    setIsOpen(false);
    onComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
        
        {/* Progress bar */}
        <div className="h-1.5 w-full bg-slate-100 flex">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-full flex-1 transition-colors duration-300 ${idx <= currentStep ? 'bg-indigo-500' : 'bg-transparent'}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-8 pb-6 flex flex-col items-center text-center">
          <div className={`w-20 h-20 flex items-center justify-center rounded-2xl ${step.bg} ${step.color} mb-6 shadow-inner`}>
            <Icon size={40} strokeWidth={1.5} />
          </div>
          
          <h2 className="text-xl font-black text-slate-800 mb-3 block">{step.title}</h2>
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            {step.description}
          </p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-4 bg-indigo-500' : 'w-1.5 bg-slate-200'}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            onClick={handleComplete}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-2 transition-colors"
          >
            رد کردن تور
          </button>
          
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            )}
            
            <button
              onClick={handleNext}
              className="px-5 h-10 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-200"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <span>شروع فعالیت</span>
                  <Check size={16} />
                </>
              ) : (
                <>
                  <span>بعدی</span>
                  <ChevronLeft size={16} />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
