import React, { useState } from 'react';
import { 
  Sparkles, User, Users, Brain, Target, 
  ArrowLeft, Activity, HelpCircle, CheckCircle,
  Zap, Phone, Globe, Mail, Clock, Award,
  Star, LayoutGrid, Fingerprint, Building2, BarChart3, Home, LayoutDashboard,
  ShoppingBag, BookOpen, MessageCircle, Menu, X, Check, CheckCircle2, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BRAND_CONFIG } from '../constants';
import { Student } from '../types';
import { BLOG_ARTICLES } from '../data/blogArticles';

import MainFooter from './MainFooter';

interface WelcomeTourPortalProps {
  currentRole: string;
  onNavigate: (view: string) => void;
  onSwitchRole: (role: "student" | "parent" | "admin" | "counselor" | "teacher") => void;
}

export default function WelcomeTourPortal({ currentRole, onNavigate, onSwitchRole }: WelcomeTourPortalProps) {
  // Simulator State
  const [streakDays, setStreakDays] = useState<number>(14);

  // Character Toggle State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Konkur Assessment Widget States (Inspired by Rabinedu)
  const [quizStep, setQuizStep] = useState(1);
  const [quizHours, setQuizHours] = useState("۵ تا ۸ ساعت");
  const [quizChallenge, setQuizChallenge] = useState("کندخوانی / تست‌زنی ضعیف");
  const [quizLevel, setQuizLevel] = useState("متوسط و خوب");
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizAnalyzing, setQuizAnalyzing] = useState(false);

  // Handle simulated Quick Demo Login
  const handleDemoLogin = (studentId: string, roleType: "student" | "parent" | "admin" | "counselor" | "teacher", name: string, grade: string) => {
    localStorage.setItem("arateb_student_profile_name", name);
    localStorage.setItem("arateb_student_profile_grade", grade);
    onSwitchRole(roleType);
    
    if (roleType === "student") {
      onNavigate("dashboard");
    } else if (roleType === "counselor") {
      onNavigate("counselor-dashboard");
    } else if (roleType === "parent") {
      onNavigate("manova");
    } else {
      onNavigate("admin");
    }
  };

  const handleRunQuizAnalysis = () => {
    setQuizAnalyzing(true);
    setTimeout(() => {
      setQuizAnalyzing(false);
      setQuizFinished(true);
    }, 1500);
  };

  // ورود به صفحه وبلاگ — در صورت داشتن slug، همان مقاله مستقیم باز می‌شود
  const openBlog = (slug?: string) => {
    try {
      if (slug) localStorage.setItem("taranom_blog_pending_slug", slug);
    } catch (e) {}
    onNavigate("blog");
  };

  const toPersianNum = (num: number | string) => {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans text-right selection:bg-indigo-100 selection:text-indigo-900 relative overflow-x-hidden" style={{ direction: 'rtl' }} id="welcome-portal-root">
      
      {/* 🔮 Background Mesh Orbs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -right-[5%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] bg-blue-50/40 rounded-full blur-[100px]" />
        <div className="absolute -bottom-[5%] right-[20%] w-[35%] h-[35%] bg-violet-50/30 rounded-full blur-[110px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* 🚀 Dynamic Floating Header */}
      <header className="sticky top-0 z-50 transition-all duration-500" id="welcome-sticky-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-white/70 backdrop-blur-xl border border-slate-200/50 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 px-4 sm:px-6 h-16 flex items-center justify-between">
            
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onNavigate("welcome")}>
                <div className="p-2 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform duration-500">
                  <Sparkles size={20} className="animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none">ترنم همدلی</h1>
                  <span className="text-[10px] text-indigo-600 font-extrabold tracking-widest block">همراه گام‌به‌گام در مسیر یادگیری</span>
                </div>
              </div>

              <nav className="hidden lg:flex items-center gap-1 text-[11px] font-black text-slate-500">
                {[
                  { id: "hero", label: "خانه", icon: Home },
                  { id: "features", label: "قابلیت‌ها", icon: Zap },
                  { id: "quiz-section", label: "سنجش وضعیت", icon: Target },
                  { id: "success-stories", label: "قبولی‌های برتر", icon: Award },
                  { id: "comparison", label: "مقایسه روش‌ها", icon: BarChart3 },
                  { id: "shop", label: "فروشگاه", icon: ShoppingBag },
                  { id: "blog", label: "وبلاگ", icon: BookOpen },
                ].map((link) => (
                  <a 
                    key={link.id}
                    href={link.id === "blog" ? "/blog" : `#${link.id}`}
                    onClick={link.id === "blog" ? (e) => { e.preventDefault(); openBlog(); } : undefined}
                    className="px-4 py-2 rounded-xl hover:bg-slate-100/50 hover:text-indigo-600 transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <link.icon size={13} className="text-indigo-400 group-hover:text-indigo-600" />
                    <span>{link.label}</span>
                  </a>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2.5 text-slate-500 hover:text-indigo-600 bg-slate-100 rounded-xl transition-all active:scale-90"
              >
                <Menu size={20} />
              </button>
              <button 
                onClick={() => onNavigate("login")} 
                className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] sm:text-[11px] font-black px-4 sm:px-6 py-2.5 rounded-2xl transition-all duration-300 active:scale-95 shadow-lg shadow-slate-200 cursor-pointer flex items-center gap-2 whitespace-nowrap"
              >
                <span className="hidden xs:inline">ورود به سامانه</span>
                <span className="xs:hidden">ورود</span>
                <ArrowLeft size={14} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 📱 Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-6 flex flex-col gap-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3 text-indigo-600 font-black">
                  <Sparkles size={24} />
                  <span>ترنم همدلی</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-xl text-slate-500">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-2">
                {[
                  { id: "hero", label: "خانه", icon: Home },
                  { id: "features", label: "قابلیت‌ها", icon: Zap },
                  { id: "quiz-section", label: "سنجش وضعیت کنکوری", icon: Target },
                  { id: "success-stories", label: "قبولی‌های درخشان", icon: Award },
                  { id: "comparison", label: "مقایسه با روش سنتی", icon: BarChart3 },
                  { id: "shop", label: "فروشگاه", icon: ShoppingBag },
                  { id: "blog", label: "وبلاگ", icon: BookOpen },
                ].map((link) => (
                  <a 
                    key={link.id}
                    href={link.id === "blog" ? "/blog" : `#${link.id}`}
                    onClick={(e) => {
                      setIsMobileMenuOpen(false);
                      if (link.id === "blog") { e.preventDefault(); openBlog(); }
                    }}
                    className="p-4 rounded-2xl bg-slate-50/50 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-heavy text-sm flex items-center gap-4"
                  >
                    <div className="p-2 bg-white rounded-lg text-slate-400 group-hover:text-indigo-600 border border-slate-100">
                      <link.icon size={18} />
                    </div>
                    <span>{link.label}</span>
                  </a>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🚀 Premium Hero Section */}
      <section className="relative pt-12 pb-12 md:pt-16 md:pb-16" id="hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center space-y-12">
            
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2.5 px-5 py-2 bg-white border border-indigo-100 text-indigo-700 rounded-full text-[10px] font-black shadow-sm ring-4 ring-indigo-50/30"
            >
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                </span>
                <span>هوش مصنوعی فعال — Gemini 2.0 Flash و Llama 3.3</span>
              </div>
            </motion.div>

            <div className="space-y-8 max-w-5xl">
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-5xl md:text-7xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight"
              >
                انتخاب اول رتبه‌های برتر <br />
                <span className="relative inline-block mt-4">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 via-violet-600 to-indigo-700">در سال‌های اخیر ❤️</span>
                  <div className="absolute -bottom-3 left-0 w-full h-5 bg-indigo-100/60 -rotate-1 -z-10 rounded-full blur-md" />
                </span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                viewport={{ once: true }}
                className="text-lg md:text-2xl text-slate-600 font-bold max-w-3xl leading-relaxed mx-auto"
              >
                قبولی در رشته‌های تاپ (پزشکی، دندانپزشکی، مهندسی و حقوق) دیگر یک رویا نیست. با برنامه‌ریزی کاملاً شخصی‌سازی شده و پیگیری هرشبه!
              </motion.p>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-6 pt-4"
            >
              <button 
                onClick={() => onNavigate("login")}
                className="group px-12 py-6 bg-indigo-600 hover:bg-slate-900 text-white font-heavy rounded-[2.5rem] shadow-2xl shadow-indigo-200 hover:shadow-slate-300 transition-all duration-500 active:scale-95 flex items-center justify-center gap-4 overflow-hidden relative cursor-pointer"
              >
                <span className="text-lg">ثبت درخواست مشاوره رایگان</span>
                <ArrowLeft size={24} className="group-hover:-translate-x-2 transition-transform" />
              </button>
              <a 
                href="#quiz-section"
                className="px-12 py-6 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-heavy rounded-[2.5rem] transition-all shadow-xl shadow-slate-100 active:scale-95 flex items-center justify-center gap-3"
              >
                <Target size={22} className="text-indigo-500" />
                <span className="text-lg">سنجش وضعیت کنکوری من</span>
              </a>
            </motion.div>

            {/* Floating Trust Bar */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="w-full max-w-5xl pt-16"
            >
              <div className="bg-white/60 backdrop-blur-2xl border border-white/80 rounded-[3.5rem] p-6 md:p-10 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12 shadow-xl shadow-slate-100/50">
                <StatItem icon={<Users size={20} />} label="همسفران مسیر یادگیری" value="+۱۰,۰۰۰" />
                <StatItem icon={<Building2 size={20} />} label="مراکز علمی همراه" value="+۵۰۰" />
                <StatItem icon={<Award size={20} />} label="تعهد به کیفیت" value="تجربه برتر" />
                <StatItem icon={<Fingerprint size={20} />} label="دقت در تحلیل" value="آگاهی کامل" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 🎯 Section: Interactive Konkur Assessment Widget (Inspired by Rabinedu) */}
      <section className="py-20 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white relative overflow-hidden" id="quiz-section">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
          
          <div className="text-center space-y-4">
            <span className="text-[10px] font-black text-amber-400 bg-white/10 px-4 py-1.5 rounded-full border border-white/10 tracking-widest uppercase">
              ارزیابی هوشمند رابین و کایزن
            </span>
            <h2 className="text-3xl md:text-5xl font-black">سنجش وضعیت کنکوری شما</h2>
            <p className="text-slate-300 text-xs md:text-sm font-medium">به ۳ سوال کوتاه پاسخ بده تا بهت بگیم دقیقاً چه پکیج و برنامه‌ای برات مناسبه!</p>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-8 md:p-12 rounded-[3rem] shadow-2xl space-y-8">
            {!quizFinished ? (
              <div className="space-y-8">
                <div className="flex justify-between items-center text-xs font-bold text-indigo-300 border-b border-white/10 pb-4">
                  <span>سوال {toPersianNum(quizStep)} از ۳</span>
                  <div className="w-32 bg-white/20 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-400 h-full rounded-full transition-all duration-300" style={{ width: `${(quizStep / 3) * 100}%` }} />
                  </div>
                </div>

                {quizStep === 1 && (
                  <div className="space-y-6 text-right">
                    <h3 className="text-lg md:text-xl font-black text-white">۱. در روز به طور میانگین چند ساعت درس می‌خوانی؟</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {["زیر ۵ ساعت", "بین ۵ تا ۸ ساعت", "بالای ۸ ساعت"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setQuizHours(opt)}
                          className={`p-5 rounded-2xl border font-bold text-xs transition cursor-pointer text-center ${
                            quizHours === opt ? "bg-amber-400 text-slate-950 border-amber-400 font-black shadow-lg" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {quizStep === 2 && (
                  <div className="space-y-6 text-right">
                    <h3 className="text-lg md:text-xl font-black text-white">۲. بزرگترین مشکلت در مسیر کنکور چیه؟</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {["کندخوانی / تست‌زنی ضعیف", "نداشتن برنامه و بی‌نظمی", "عدم تمرکز و استرس", "نیاز به پیگیری و تلنگر"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setQuizChallenge(opt)}
                          className={`p-5 rounded-2xl border font-bold text-xs transition cursor-pointer text-center ${
                            quizChallenge === opt ? "bg-amber-400 text-slate-950 border-amber-400 font-black shadow-lg" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {quizStep === 3 && (
                  <div className="space-y-6 text-right">
                    <h3 className="text-lg md:text-xl font-black text-white">۳. سطح فعلی درسی یا معدل سال قبلت چطوره؟</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {["متوسط رو پایین", "متوسط و خوب", "عالی (دنبال رتبه برترم)"].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setQuizLevel(opt)}
                          className={`p-5 rounded-2xl border font-bold text-xs transition cursor-pointer text-center ${
                            quizLevel === opt ? "bg-amber-400 text-slate-950 border-amber-400 font-black shadow-lg" : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-6 border-t border-white/10">
                  {quizStep > 1 ? (
                    <button
                      onClick={() => setQuizStep(prev => prev - 1)}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      مرحله قبل
                    </button>
                  ) : <div />}

                  {quizStep < 3 ? (
                    <button
                      onClick={() => setQuizStep(prev => prev + 1)}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-md"
                    >
                      مرحله بعد
                    </button>
                  ) : (
                    <button
                      onClick={handleRunQuizAnalysis}
                      disabled={quizAnalyzing}
                      className="px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer shadow-xl flex items-center gap-2"
                    >
                      {quizAnalyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>در حال تحلیل وضعیت با هوش مصنوعی...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          <span>مشاهده نتیجه و پیشنهاد ویژه</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center space-y-6 py-4 animate-in zoom-in duration-300">
                <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-black text-white">شما پتانسیل بالایی برای قبولی در رشته‌های تاپ دارید!</h3>
                <p className="text-slate-300 text-xs md:text-sm font-medium max-w-xl mx-auto leading-relaxed">
                  با توجه به پاسخ‌های شما، مشکل اصلی «<span className="text-amber-300 font-bold">{quizChallenge}</span>» است. پیشنهاد ویژه ما برای شما **"طرح مربیگری VIP"** است تا با کمک رتبه‌های برتر، این ضعف‌ها به سرعت پوشش داده شوند.
                </p>
                <div className="pt-4 flex justify-center gap-4">
                  <button
                    onClick={() => onNavigate("login")}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black shadow-lg transition cursor-pointer"
                  >
                    شروع طرح حرفه‌ای و ثبت‌نام
                  </button>
                  <button
                    onClick={() => { setQuizFinished(false); setQuizStep(1); }}
                    className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition cursor-pointer"
                  >
                    تست مجدد
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 🏆 Section: Success Stories / Top Rankers Showcase (Inspired by Rabinedu) */}
      <section className="py-20 bg-slate-50" id="success-stories">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest leading-none">
              Result & Trust
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900">بخشی از قبولی‌های درخشان ترنم همدلی</h2>
            <p className="text-slate-500 text-xs md:text-sm font-bold">نتیجه اعتماد به سیستم اصولی برنامه‌ریزی و پایش مداوم مربیان</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "آیناز امیدی", rank: "رتبه ۱۷۱ کنکور تجربی", major: "پزشکی علوم پزشکی اصفهان", img: "https://rabinedu.com/wp-content/uploads/2026/06/ainaz-omidi.webp" },
              { name: "حسین اکبری", rank: "رتبه ۷۰۵ کنکور تجربی", major: "دندانپزشکی ایلام", img: "https://rabinedu.com/wp-content/uploads/2026/06/hossein-akbari.webp" },
              { name: "مائده مدنی", rank: "رتبه برتر کنکور تجربی", major: "گفتار درمانی علوم پزشکی ایران", img: "https://rabinedu.com/wp-content/uploads/2026/06/maedeh-madani.webp" },
              { name: "مبینا عدالت‌خواه", rank: "رتبه برتر کنکور انسانی", major: "راهنمایی و مشاوره فرهنگیان", img: "https://rabinedu.com/wp-content/uploads/2026/06/mobina-edalat-khah.webp" }
            ].map((stu, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -6 }}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-xl transition-all text-center space-y-4 group overflow-hidden"
              >
                <div className="w-24 h-24 rounded-full mx-auto overflow-hidden border-4 border-indigo-50 shadow-md group-hover:scale-105 transition-transform duration-500">
                  <img src={stu.img} alt={stu.name} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900">{stu.name}</h4>
                  <p className="text-[11px] text-indigo-600 font-extrabold">{stu.rank}</p>
                  <p className="text-[10px] text-slate-400 font-bold">{stu.major}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 📊 Section: Comparison Table (Inspired by Rabinedu) */}
      <section className="py-20 bg-white" id="comparison">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest leading-none">
              Why Us
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900">تفاوت ترنم همدلی با روش‌های سنتی</h2>
            <p className="text-slate-500 text-xs md:text-sm font-bold">ما با سیستم‌های هوشمند، کیفیت را تضمین می‌کنیم. نظارت کامل در دست شماست.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            
            {/* Traditional Method */}
            <div className="bg-slate-50 border border-slate-200 rounded-[3rem] p-8 md:p-10 space-y-6 text-right">
              <div className="flex items-center gap-3 pb-6 border-b border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-black text-lg">✕</div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">سایر مشاوران / روش‌های سنتی</h3>
                  <p className="text-xs text-slate-400 font-bold">معمولی، بدون پشتوانه تحلیلی و پراکنده</p>
                </div>
              </div>
              <ul className="space-y-4 text-xs font-bold text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-black mt-0.5">✕</span>
                  <span>برنامه‌های آماده و از پیش نوشته شده برای همه داوطلبان</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-black mt-0.5">✕</span>
                  <span>گزارش‌گیری سنتی (فقط پرسش تلفنی) بدون تحلیل آماری دقیق تله‌های تستی</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-black mt-0.5">✕</span>
                  <span>عدم نظارت بر کیفیت کار مشاور و نبود سیستم ارزیابی مستمر</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-black mt-0.5">✕</span>
                  <span>بی‌خبری والدین از وضعیت دقیق و ساعت مطالعه واقعی دانش‌آموز</span>
                </li>
              </ul>
            </div>

            {/* Taranom Hamdali Method */}
            <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-950 text-white border border-indigo-900 rounded-[3rem] p-8 md:p-10 space-y-6 shadow-2xl text-right relative overflow-hidden">
              <div className="absolute -top-10 -left-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="flex items-center gap-3 pb-6 border-b border-indigo-800/80">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg">✓</div>
                <div>
                  <h3 className="text-lg font-black text-white">گروه مشاوره‌ای ترنم همدلی</h3>
                  <p className="text-xs text-indigo-200 font-bold">هوش مصنوعی + مشاور رتبه برتر + پایش والدین</p>
                </div>
              </div>
              <ul className="space-y-4 text-xs font-bold text-indigo-100">
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-black mt-0.5">✓</span>
                  <span>برنامه‌ریزی کاملاً شخصی و روزانه بر اساس کارنامه دیتابیس</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-black mt-0.5">✓</span>
                  <span>ارائه کارنامه آماری دقیق و نمودار پیشرفت (هفتگی و روزانه) برای تحلیل تله‌ها</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-black mt-0.5">✓</span>
                  <span>سیستم ارزیابی عملکرد مشاور و پیگیری هرشبه گزارش کار</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-emerald-400 font-black mt-0.5">✓</span>
                  <span>داشبورد اختصاصی والدین برای نظارت مستمر و آرامش خاطر خانواده</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* 💎 Section 2: Smart Tools (Bento Grid Style) */}
      <section className="py-16 relative overflow-hidden bg-slate-50" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col items-center text-center space-y-6 mb-24 max-w-4xl mx-auto">
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-5 py-2 rounded-full border border-indigo-100 uppercase tracking-[0.2em] leading-none mb-2">
              Our Compassion
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.2] tracking-tight">همراهی هوشمند <br /><span className="text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 to-indigo-400">در کنار یادگیری شما</span></h2>
            <div className="w-24 h-1.5 bg-indigo-600/10 rounded-full mt-4" />
            <p className="text-lg md:text-xl text-slate-500 font-bold max-w-3xl leading-relaxed mt-6">
              ما در کنار شما هستیم تا با پایش مداوم و همدلی، چالش‌های مسیر تحصیلی را به فرصت‌هایی برای رشد و آرامش تبدیل کنیم.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">
            <BentoCard 
              className="md:col-span-3 lg:col-span-4"
              color="indigo"
              icon={<Brain size={24} />}
              title="دستیار شخصی و صبور"
              desc="دیگه لازم نیست بین هزارتا منبع گم بشی. معلم هوشمندت بر اساسِ خودِ تو، بهترین راه رو پیدا می‌کنه."
              badge="صمیمانه"
              image="/img/w-1516321318423-f0.jpg"
            />
            <BentoCard 
              className="md:col-span-3 lg:col-span-8"
              color="violet"
              icon={<BarChart3 size={24} />}
              title="خودشناسی تحصیلی با مانوا"
              desc="ببین کجاها واقعاً وقتت تلف می‌شه و کدوم ساعت‌ها بیشترین بازدهی رو داری. ما بهت کمک می‌کنیم خودت رو بهتر بشناسی تا هوشمندانه‌تر تلاش کنی."
              image="/img/w-1460925895917-af.jpg"
            />
            <BentoCard 
              className="md:col-span-6 lg:col-span-4"
              color="emerald"
              icon={<Target size={24} />}
              title="حلِ چالش‌های تستی"
              desc="هر تستی که اشتباه می‌زنی، یه فرصته. ما تله‌هایی که طراح‌ها برات گذاشتن رو برات کالبدشکافی می‌کنیم."
              image="/img/w-1434030216411-0b.jpg"
            />
            <BentoCard 
              className="md:col-span-3 lg:col-span-4"
              color="rose"
              icon={<Activity size={24} />}
              title="آرامش و سلامتِ ذهن"
              desc="کنکور فقط درس نیست. ما حواسمون به سطح استرس و خستگی‌ت هست تا همیشه با انرژیِ خوب درس بخونی."
              image="/img/w-1506126613408-ec.jpg"
            />
            <BentoCard 
              className="md:col-span-3 lg:col-span-4"
              color="amber"
              icon={<LayoutDashboard size={24} />}
              title="برنامه‌ریزی که باهات راه میاد"
              desc="برنامه‌ای که خشک نیست! اگه یه روز خسته بودی، باهات هماهنگ می‌شه تا هیچ‌وقت احساس عقب‌موندگی نکنی."
              image="/img/w-1484480974693-6c.jpg"
            />
          </div>
        </div>
      </section>

      {/* 🛒 Section: Marketplace & Blog Preview */}
      <section className="py-16 bg-white relative border-y border-slate-100" id="shop">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-12">
            <div className="lg:w-7/12 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <ShoppingBag size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg">فروشگاه ترنم همدلی</span>
                </div>
                <h2 className="text-4xl font-black text-slate-900 leading-tight">منابع علمی و <br /> ابزارهای یادگیری</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "کارت‌های یادگیری عمیق زیست", price: "۱۴۰,۰۰۰ تومان", img: "/img/w-1576086213369-97.jpg" },
                  { title: "دفتر برنامه‌ریزی کایزن", price: "۹۵,۰۰۰ تومان", img: "/img/w-1517842645767-c6.jpg" },
                  { title: "بسته آزمون‌های جامع شبیه‌ساز", price: "۲۱۰,۰۰۰ تومان", img: "/img/w-1497633762265-9d.jpg" },
                  { title: "کتاب کار عارضه‌یابی تحصیلی", price: "۱۲۵,۰۰۰ تومان", img: "/img/w-1512820790803-83.jpg" }
                ].map((item, idx) => (
                  <motion.div 
                    key={idx} 
                    whileHover={{ y: -5 }}
                    className="group cursor-pointer bg-slate-50 p-3 rounded-2xl border border-slate-150 shadow-sm hover:shadow-xl transition-all"
                  >
                    <div className="aspect-[4/3] rounded-xl overflow-hidden mb-3 relative shadow-sm border border-slate-50">
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <div className="px-1">
                      <h4 className="text-[11px] font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors uppercase">{item.title}</h4>
                      <p className="text-[10px] text-indigo-600 font-black mt-2">{item.price}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="lg:w-5/12 w-full space-y-8 lg:border-r lg:border-slate-200 lg:pr-12" id="blog">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <BookOpen size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-lg">مجله آموزشی</span>
                  </div>
                  <button
                    onClick={() => openBlog()}
                    className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-100 px-3 py-1.5 rounded-full shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer"
                  >
                    مشاهده همه مقالات ←
                  </button>
                </div>
                <h2 className="text-4xl font-black text-slate-900 leading-tight">یادداشت‌های <br /> نوین</h2>
              </div>

              <div className="space-y-4">
                {BLOG_ARTICLES.slice(0, 3).map((post) => (
                  <button
                    key={post.slug}
                    onClick={() => openBlog(post.slug)}
                    className="w-full text-right p-4 bg-slate-50 rounded-2xl border border-slate-150 hover:border-indigo-200 shadow-sm transition-all cursor-pointer group flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-black text-lg">
                      {post.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[8px] font-black text-indigo-500 uppercase">{post.category}</span>
                      <h4 className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{post.title}</h4>
                    </div>
                    <ArrowLeft size={16} className="text-slate-300 group-hover:text-indigo-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <MainFooter />
    </div>
  );
}

function BentoCard({ icon, title, desc, className, color, badge, image }: { 
  icon: React.ReactNode, 
  title: string, 
  desc: string, 
  className?: string, 
  color: string, 
  badge?: string,
  image?: string
}) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white",
    violet: "bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white",
    emerald: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white",
    rose: "bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white",
    amber: "bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white",
  };

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className={`group bg-white p-10 rounded-[3rem] border border-slate-200/60 hover:border-indigo-200 shadow-sm hover:shadow-3xl transition-all duration-700 overflow-hidden relative flex flex-col justify-between min-h-[340px] ${className}`}
    >
      <div className="relative z-10 space-y-8">
        <div className="flex items-center justify-between">
          <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 shadow-inner ${colors[color as keyof typeof colors]}`}>
            {icon}
          </div>
          {badge && <span className="text-[10px] font-black px-3.5 py-1.5 bg-slate-900 text-white rounded-full tracking-wider shadow-lg">{badge}</span>}
        </div>
        <div className="space-y-5">
          <h3 className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors duration-500">{title}</h3>
          <p className="text-sm text-slate-500 font-bold leading-relaxed">{desc}</p>
        </div>
      </div>
      
      {image && (
        <div className="absolute bottom-0 left-0 right-0 h-1/2 opacity-5 group-hover:opacity-100 transition-all duration-1000">
           <img src={image} alt="feature" className="w-full h-full object-cover scale-125 group-hover:scale-100 transition-transform duration-1000" />
           <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent" />
        </div>
      )}
    </motion.div>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex flex-col items-center lg:items-end lg:flex-row gap-4 px-2 py-4 group cursor-default">
      <div className="w-14 h-14 bg-indigo-50/50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
        {icon}
      </div>
      <div className="text-center lg:text-right space-y-1">
        <div className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">{value}</div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</div>
      </div>
    </div>
  );
}

function PlanCard({ title, price, features, btnText, icon, recommended, onNavigate }: { 
  title: string, 
  price: string, 
  features: string[], 
  btnText: string, 
  icon: React.ReactNode,
  recommended?: boolean,
  onNavigate?: () => void
}) {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className={`p-10 rounded-[3rem] border transition-all duration-500 flex flex-col text-right h-full ${
        recommended 
          ? 'bg-slate-900 text-white border-slate-800 shadow-2xl relative shadow-indigo-500/20' 
          : 'bg-white text-slate-900 border-slate-150 shadow-lg shadow-slate-100 hover:shadow-xl'
      }`}
    >
      <div className="space-y-6 mb-10 flex-grow">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${recommended ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-black">{title}</h3>
          <div className="text-2xl font-black mt-1 mb-2">{price}</div>
        </div>
        <ul className="space-y-4">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-xs font-bold">
              <CheckCircle size={14} className={recommended ? 'text-indigo-400' : 'text-emerald-500'} />
              <span className={recommended ? 'text-slate-300' : 'text-slate-600'}>{f}</span>
            </li>
          ))}
        </ul>
      </div>
      <button 
        onClick={onNavigate}
        className={`w-full py-4 rounded-2xl font-heavy text-xs transition-all active:scale-95 shadow-md cursor-pointer ${
        recommended 
          ? 'bg-indigo-600 hover:bg-white hover:text-slate-900 text-white' 
          : 'bg-slate-900 hover:bg-indigo-600 text-white'
      }`}>
        {btnText}
      </button>
    </motion.div>
  );
}
