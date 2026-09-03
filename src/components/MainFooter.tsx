import React from 'react';
import { ShoppingBag, BookOpen, MessageSquare, Heart, Github, Twitter, Instagram, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BRAND_CONFIG } from '../constants';

export default function MainFooter() {
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();

  const handleNav = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(path);
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-900 pt-16 pb-8 RTL" style={{ direction: 'rtl' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => handleNav('/welcome')}>
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                <span className="text-white font-black text-xl">ت</span>
              </div>
              <span className="text-xl font-heavy text-white tracking-tight">{BRAND_CONFIG.name}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs font-medium">
              سامانه هوشمند پایش و ارتقای تراز داوطلبان آزمون‌های سراسری. مسیر حرفه‌ای برای رسیدن به قله‌های موفقیت علمی با متدولوژی کایزن.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-all" title="توئیتر">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-all" title="اینستاگرام">
                <Instagram size={18} />
              </a>
              <a href="https://t.me/taranom_hamdeli_bot" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-indigo-400 hover:border-indigo-700 transition-all" title="ربات تلگرام: @taranom_hamdeli_bot">
                <MessageSquare size={18} />
              </a>
              <a href="https://ble.ir/taranom_hamdeli_bot" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-700 transition-all" title="بازوی بله: @taranom_hamdeli_bot">
                <span className="font-bold text-[10px]">بله</span>
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-all" title="گیت‌هاب">
                <Github size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-black text-sm mb-6 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
              بخش‌های اصلی
            </h4>
            <ul className="space-y-4">
              <li>
                <button onClick={() => handleNav('/shop')} className="group flex items-center gap-2.5 text-slate-400 hover:text-indigo-400 transition-colors text-sm font-bold cursor-pointer bg-transparent border-none p-0 outline-none">
                  <ShoppingBag size={16} className="text-slate-500 group-hover:text-indigo-500 transition-colors" />
                  فروشگاه محصولات آموزشی
                  <ArrowUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('/blog')} className="group flex items-center gap-2.5 text-slate-400 hover:text-indigo-400 transition-colors text-sm font-bold cursor-pointer bg-transparent border-none p-0 outline-none">
                  <BookOpen size={16} className="text-slate-500 group-hover:text-indigo-500 transition-colors" />
                  وبلاگ و تحلیل‌های تخصصی
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('/contact')} className="group flex items-center gap-2.5 text-slate-400 hover:text-indigo-400 transition-colors text-sm font-bold cursor-pointer bg-transparent border-none p-0 outline-none">
                  <MessageSquare size={16} className="text-slate-500 group-hover:text-indigo-500 transition-colors" />
                  تماس با پشتیبانی
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-black text-sm mb-6 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              منابع داوطلبان
            </h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">بودجه‌بندی آزمون‌ها</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">جامعه آماری کشوری</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">قوانین و مقررات سامانه</a></li>
              <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors">حریم خصوصی کاربر</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-white font-black text-sm mb-6 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
              خبرنامه تحلیلی
            </h4>
            <p className="text-slate-400 text-[11px] font-bold leading-6 mb-4">
              جدیدترین متدهای تست‌زنی و اخبار تغییرات کنکور را در ایمیل خود دریافت کنید.
            </p>
            <div className="flex gap-2">
              <input 
                type="email" 
                placeholder="ایمیل شما..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-600 transition-all font-mono"
              />
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl transition-all active:scale-95">
                <ArrowUpRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-bold">
            <span>© {currentYear} تمامی حقوق برای {BRAND_CONFIG.name} محفوظ است.</span>
          </div>
          
          <div className="flex items-center gap-6 text-[10px] uppercase tracking-widest text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              DESIGNED WITH <Heart size={10} className="text-rose-500 fill-rose-500" /> FOR IRANIAN STUDENTS
            </span>
            <span className="hidden sm:inline opacity-30">|</span>
            <span className="hidden sm:inline">VERSION 2.4.0-STABLE</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
