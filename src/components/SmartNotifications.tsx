import { useState, useEffect } from "react";
import { 
  Bell, 
  Sparkles, 
  Zap, 
  Brain, 
  Trophy, 
  ChevronRight, 
  X,
  Target,
  Clock,
  LayoutGrid
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SmartNotification } from "../types";
import { BRAND_CONFIG } from "../constants";

interface SmartNotificationsProps {
  role?: "student" | "parent" | "admin" | "counselor" | "teacher" | null;
  onAction?: (action: string) => void;
}

// Reusable function to get dynamic banner alerts tailored to each user section
export function getRoleBannerAlert(role: string | null, brandName: string = "ترنم همدلی"): { title: string; message: string; badge: string; type: "success" | "warning" | "info" | "critical" } {
  switch (role) {
    case "student":
      return {
        title: "همراهی در مسیر یادگیری آگاهانه",
        message: `بر اساس فعالیت‌های اخیر شما، یک پیشنهاد کوچک برای بهبود ریتم مطالعه‌تان داریم تا با آرامش بیشتری پیش بروید.`,
        badge: "وضعیت یادگیری",
        type: "success"
      };
    case "parent":
      return {
        title: "پیام مهر و مراقبت فرزند",
        message: "فرزند شما تلاش خوبی در مطالعه داشته است. یک فنجان چای یا گفتگویی محبت‌آمیز می‌تواند خستگی او را به انرژی تبدیل کند.",
        badge: "همدلی والدین",
        type: "warning"
      };
    case "counselor":
      return {
        title: "نیاز به همراهی: چالش در ریتم مطالعه",
        message: "تعدادی از دانش‌آموزان در مباحث اخیر نیاز به راهنمایی بیشتری دارند. یک جلسه دوستانه می‌تواند به آن‌ها آرامش دهد.",
        badge: "پشتیبانی تحصیلی",
        type: "critical"
      };
    case "teacher":
      return {
        title: "افت ۵ درصدی میانگین درصد پاسخ صحیح آزمون دیروز",
        message: "دانش‌آموزان در تحلیل معانی صریح ادبیات و قیدهای زیست با چالش جدی روبرو شده‌اند. آماده‌سازی تست مکمل پیشنهاد می‌شود.",
        badge: "ارزیابی درسی دبیران",
        type: "warning"
      };
    case "admin":
      return {
        title: "وضعیت کلی پورتال ترنم همدلی",
        message: "تمامی بخش‌های پورتال در وضعیت پایدار هستند و دانش‌آموزان بدون وقفه در حال استفاده از خدمات مربیگری هستند.",
        badge: "پایش سیستم",
        type: "success"
      };
    default:
      return {
        title: "پلتفرم ارزیابی هوشمند فعال است",
        message: "به سامانه پایش یکپارچه تراز و تحلیل تله‌های تستی خوش آمدید. کلیه ماژول‌های ابری آماده به کار هستند.",
        badge: "اعلان عمومی",
        type: "info"
      };
  }
}

export function getNotificationsForRole(role: string | null, brandName: string = BRAND_CONFIG.name): SmartNotification[] {
  switch (role) {
    case "student":
      return [
        {
          id: "st-1",
          type: "challenge",
          title: "یک تمرین کوچک برای تمرکز",
          message: `دوست دارید نگاهی گذرا به الگوهای تستی زیست‌شناسی داشته باشیم؟ شاید جالب و مفید باشد.`,
          actionLabel: "ببینیم",
          timestamp: "۱۰ دقیقه پیش",
          read: false,
          points: 50
        },
        {
          id: "st-2",
          type: "motivation",
          title: "یادآوری دوستانه",
          message: `هر گام کوچک شما ارزشمند است. یادگیری یک مسیر مستمر است، نه یک فشار لحظه‌ای.`,
          timestamp: "۳۰ دقیقه پیش",
          read: true
        },
        {
          id: "st-3",
          type: "nudge",
          title: "پیشنهاد برای بهبود ریتم",
          message: "به نظر می‌رسد در برخی مباحث نیاز به مرور بیشتری دارید. ما اینجا هستیم تا به شما کمک کنیم.",
          actionLabel: "بررسی پیشنهاد",
          timestamp: "۲ ساعت پیش",
          read: false
        }
      ];
    case "parent":
      return [
        {
          id: "pa-1",
          type: "alert",
          title: "پایش رفتار آزمونی فرزند شما",
          message: "فرزندتان دیروز آزمون شبیه‌ساز مشتق را تکمیل کرد. تحلیل کایزن و تله‌های حسی او صادر گردید.",
          actionLabel: "مشاهده کارنامه",
          timestamp: "۵ دقیقه پیش",
          read: false
        },
        {
          id: "pa-2",
          type: "motivation",
          title: "رشد تراز و سرمایه‌گذاری آموزشی",
          message: "تراز فرزند شما در این ماه ۴۵۰ واحد رشد داشته است. پورتال نظارتی والدین رضایت‌بخش ارزیابی می‌کند.",
          timestamp: "۱ ساعت پیش",
          read: true
        },
        {
          id: "pa-3",
          type: "nudge",
          title: "توصیه‌نامه جدید مشاور ارشد",
          message: "مشاور تحصیلی برای بازیابی تمرکز و کاهش تنش کنکوری فرزندتان یک توصیه‌نامه رفتاری جدید ثبت کرد.",
          actionLabel: "خواندن توصیه",
          timestamp: "۱ روز پیش",
          read: false
        }
      ];
    case "counselor":
      return [
        {
          id: "co-1",
          type: "alert",
          title: "درخواست اورژانسی مشاوره",
          message: "داوطلب 'امیرحسین رضایی' سطح اضطراب بالایی (۸۵٪) در آزمون عصب‌سنجی شناختی ثبت کرده است.",
          actionLabel: "بررسی الگوها",
          timestamp: "هم‌اینک",
          read: false
        },
        {
          id: "co-2",
          type: "challenge",
          title: "ثبت توصیه‌نامه برای داوطلبان",
          message: "داوطلبان رشته علوم تجربی در تله آزمونی دیروز خستگی چشم ثبت کردند؛ توصیه کایزنی الزامی است.",
          actionLabel: "ثبت توصیه",
          timestamp: "۴۰ دقیقه پیش",
          read: false
        },
        {
          id: "co-3",
          type: "nudge",
          title: "کالیبره سلامت شناختی کلاود",
          message: "نتایج مصاحبه حضوری ۱۲ داوطلب منتظر بازرسی و ممیزی روانشناختی شماست.",
          timestamp: "۲ ساعت پیش",
          read: true
        }
      ];
    case "teacher":
      return [
        {
          id: "te-1",
          type: "alert",
          title: "تحلیل خطای همگانی کلاس",
          message: "در کوییز دیشب فیزیک، بیش از ۵۵٪ دانش‌آموزان در تله حسی گزینه ۳ افتادند! بازنگری لازم است.",
          actionLabel: "مشاهده سوالات",
          timestamp: "۱۰ دقیقه پیش",
          read: false
        },
        {
          id: "te-2",
          type: "challenge",
          title: "الصاق تست‌های جبرانی",
          message: "امکان ممیزی و الصاق تست‌های شبیه‌ساز با ضریب تراز مشخص برای داوطلبان آسیب‌دیده فراهم شد.",
          actionLabel: "ارسال تست",
          timestamp: "۱ ساعت پیش",
          read: false
        },
        {
          id: "te-3",
          type: "motivation",
          title: "تثبیت مطلوب یادگیری",
          message: "میانگین راندمان پاسخ‌گویی داوطلبان کلاس به درصد هدف ۸۷٪ توازن یافته است.",
          timestamp: "۳ ساعت پیش",
          read: true
        }
      ];
    case "admin":
      return [
        {
          id: "ad-1",
          type: "alert",
          title: "پایش وضعیت کلی سیستم",
          message: `تمامی لایه‌های پورتال ${brandName} در وضعیت پایدار و آماده خدمت‌رسانی به دانش‌آموزان هستند.`,
          timestamp: "هم‌اینک",
          read: false
        },
        {
          id: "ad-2",
          type: "challenge",
          title: "تنظیمات برندینگ",
          message: "تغییرات نام تجاری و هویت بصری با موفقیت در سراسر پورتال اعمال شده است.",
          actionLabel: "تنظیمات برند",
          timestamp: "۱۰ دقیقه پیش",
          read: true
        },
        {
          id: "ad-3",
          type: "nudge",
          title: "گزارش تراکنش‌ها",
          message: "تراکنش‌های اشتراک و ثبت‌نام‌های جدید به درستی در پایگاه داده ثبت و تایید شدند.",
          timestamp: "۴ ساعت پیش",
          read: false
        }
      ];
    default:
      return [
        {
          id: "def-1",
          type: "motivation",
          title: "به سامانه خوش آمدید",
          message: `کنترل یکپارچه ارزیابی تراز و کایزن تحصیلی در بستر ابری ${brandName} فعال است.`,
          timestamp: "الان",
          read: false
        }
      ];
  }
}

export default function SmartNotifications({ role = "student", onAction }: SmartNotificationsProps) {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [showPopup, setShowPopup] = useState<SmartNotification | null>(null);

  const toPersianNum = (num: number | string) => {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
  };

  useEffect(() => {
    // Generate role-specific initial notifications
    const initial = getNotificationsForRole(role);
    setNotifications(initial);

    // Random trigger for a popup (simulating dynamic feedback on the fly tailored to the role)
    const timer = setTimeout(() => {
      // De-clutter: only show intrusive popups for counselor/admin/parent, NOT students (unless explicitly requested)
      if (role === "student") return;

      const activeBanner = getRoleBannerAlert(role);
      const popup: SmartNotification = {
        id: `popup-${role || "user"}`,
        type: activeBanner.type === "critical" ? "alert" : activeBanner.type === "success" ? "motivation" : "nudge",
        title: `${activeBanner.badge}: ${activeBanner.title}`,
        message: activeBanner.message,
        actionLabel: (role as string) === "student" ? "مشاهده راهکار" : "بازرسی دقیق",
        timestamp: "الان",
        read: false
      };
      setShowPopup(popup);
      setNotifications(prev => {
        // Prevent duplicate popup alerts
        if (prev.some(p => p.id === popup.id)) return prev;
        return [popup, ...prev];
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [role]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleNotificationClick = (n: SmartNotification) => {
    setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item));
    if (n.actionLabel && onAction) {
      onAction(n.type);
    }
    if (showPopup?.id === n.id) setShowPopup(null);
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "challenge": return "bg-amber-50 text-amber-700 border-amber-100";
      case "motivation": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      case "nudge": return "bg-blue-50 text-blue-700 border-blue-100";
      default: return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "challenge": return <Zap size={14} />;
      case "motivation": return <Trophy size={14} />;
      case "nudge": return <Brain size={14} />;
      default: return <Sparkles size={14} />;
    }
  };

  return (
    <div className="relative font-sans" id="smart-notifications-root">
      {/* Bell Icon */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white border border-slate-150 rounded-2xl text-slate-600 hover:text-blue-900 transition-all hover:bg-slate-50 cursor-pointer shadow-sm group"
      >
        <Bell size={20} className={unreadCount > 0 ? "animate-swing" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {toPersianNum(unreadCount)}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute -right-24 sm:right-0 mt-3 w-76 sm:w-85 max-w-[calc(100vw-32px)] bg-white border border-slate-150 rounded-3xl shadow-2xl z-50 overflow-hidden text-right"
            >
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800">پیشنهادات هوشمند (Smart Insights)</span>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                </div>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center space-y-2">
                    <p className="text-xs text-slate-400 font-bold">فعلاً پیامی از مربی نداری...</p>
                    <p className="text-[10px] text-slate-300">مطالعه رو ادامه بده تا پیشنهادات فعال بشن!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n)}
                        className={`p-4 transition-colors cursor-pointer hover:bg-slate-50 ${!n.read ? "bg-blue-50/20" : ""}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-xl shrink-0 ${getTypeStyle(n.type)}`}>
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-slate-400 font-mono">{n.timestamp}</span>
                              <h4 className="text-[11px] font-black text-slate-900">{n.title}</h4>
                            </div>
                            <p className="text-[10px] text-slate-600 leading-relaxed font-bold">{n.message}</p>
                            {n.actionLabel && (
                              <div className="pt-2 flex justify-end">
                                <span className="text-[10px] bg-blue-900 text-white px-3 py-1 rounded-lg font-black flex items-center gap-1 group/btn">
                                  {n.actionLabel}
                                  <ChevronRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                <button className="text-[10px] font-black text-blue-900 hover:underline">مشاهده تاریخچه تمام مصوبات مربیگری</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Popup (Nudge) */}
      <AnimatePresence>
        {showPopup && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 sm:bottom-24 left-4 right-4 sm:left-auto sm:right-8 mx-auto sm:mx-0 w-[calc(100vw-32px)] sm:w-80 max-w-sm bg-white border border-blue-100 rounded-3xl shadow-2xl p-5 text-right font-sans ring-4 ring-blue-50/50 z-50"
          >
            <div className="absolute -top-3 -right-1 sm:-right-3 w-10 h-10 bg-blue-900 text-white rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
              <Brain size={22} />
            </div>
            
            <button 
              onClick={() => setShowPopup(null)}
              className="absolute top-3 left-3 text-slate-300 hover:text-slate-500"
            >
              <X size={14} />
            </button>
            
            <div className="space-y-3">
              <div className="pr-2">
                <h5 className="text-[11px] font-black text-blue-900 mb-1">{showPopup.title}</h5>
                <p className="text-xs text-slate-700 leading-relaxed font-bold">{showPopup.message}</p>
              </div>
              
              <div className="flex gap-2 justify-end">
                <button 
                  onClick={() => setShowPopup(null)}
                  className="px-4 py-2 text-[10px] font-black text-slate-400 hover:text-slate-600"
                >
                  بعداً
                </button>
                <button 
                  onClick={() => handleNotificationClick(showPopup)}
                  className="px-6 py-2 bg-blue-900 text-white rounded-xl text-[10px] font-black hover:bg-blue-950 transition-all shadow-md active:scale-95"
                >
                  {showPopup.actionLabel}
                </button>
              </div>
            </div>
            
            {/* Focus Bar Simulation */}
            <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 10, ease: "linear" }}
                className="h-full bg-blue-500"
                onAnimationComplete={() => setShowPopup(null)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
