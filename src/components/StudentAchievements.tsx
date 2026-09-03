import React, { useState, useEffect } from "react";
import { Award, Trophy, Star, Shield, Zap, Sparkles, AlertCircle, Heart, Flame, Compass, Target, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  type: "medal" | "trophy" | "badge" | "star";
  iconName: "trophy" | "star" | "zap" | "shield" | "flame" | "target";
  unlocked: boolean;
  unlockedAt?: string;
  progress: number; // Percentage out of 100
  rarity: "نایاب" | "پیشرفته" | "عادی" | "افسانه‌ای";
  points: number;
}

export default function StudentAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Load existing metrics or initiate elegant starting medals list for the student
    const loadAchievements = () => {
      const storageKey = "taranom_student_achievements";
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setAchievements(parsed);
          calculateStats(parsed);
          return;
        } catch (e) {
          console.error("Failed to parse student achievements", e);
        }
      }

      // Initial starting list
      const initial: Achievement[] = [
        {
          id: "ach-1",
          title: "شکارچی تله‌های تستی زیست",
          description: "غلبه و پاسخگویی درست به ۵ سوال تله‌دار سنگین در بخش آزمون‌ساز هوشمند گوگول تارانوم کایزن.",
          type: "trophy",
          iconName: "trophy",
          unlocked: true,
          unlockedAt: "۱۴۰۶/۰۳/۱۰",
          progress: 100,
          rarity: "پیشرفته",
          points: 150
        },
        {
          id: "ach-2",
          title: "ثبات تحسین‌برانگیز ساعت مطالعه",
          description: "نگهداری پیوسته زنجیره مطالعه روزانه (بیش از ۸ ساعت) برای مدت ۱۴ روز مداوم.",
          type: "medal",
          iconName: "flame",
          unlocked: true,
          unlockedAt: "۱۴۰۶/۰۳/۰۸",
          progress: 100,
          rarity: "نایاب",
          points: 300
        },
        {
          id: "ach-3",
          title: "انضباط عصب‌شناختی مانوا",
          description: "کالیبره کردن رادار بهداشت روان و آمادگی روحی در ۳ روز بدون نوسان شدید اضطراب.",
          type: "badge",
          iconName: "shield",
          unlocked: false,
          progress: 60,
          rarity: "پیشرفته",
          points: 200
        },
        {
          id: "ach-4",
          title: "استاد طراح آزمون کایزن",
          description: "سفارشی‌سازی و استنتاج مستقیم یک دفترچه آزمون با پرامپت اختصاصی و تگ اصالت هوش مصنوعی.",
          type: "star",
          iconName: "star",
          unlocked: true,
          unlockedAt: "۱۴۰۶/۰۳/۱۱",
          progress: 100,
          rarity: "عادی",
          points: 100
        },
        {
          id: "ach-5",
          title: "سردار پیوستگی رتبه برتر",
          description: "رسیدن به امتیاز تراز کایزن بالای ۷۰۰۰ در تحلیل‌های آزمون شبیه‌ساز.",
          type: "medal",
          iconName: "zap",
          unlocked: false,
          progress: 85,
          rarity: "افسانه‌ای",
          points: 500
        },
        {
          id: "ach-6",
          title: "تسهیل‌گر تعامل اولیا",
          description: "اشتراک‌گذاری گزارش سلامت ذهن و ممیزی درصدهای تراز با حساب کاربری فعال والدین.",
          type: "badge",
          iconName: "target",
          unlocked: false,
          progress: 0,
          rarity: "عادی",
          points: 80
        }
      ];

      localStorage.setItem(storageKey, JSON.stringify(initial));
      setAchievements(initial);
      calculateStats(initial);
    };

    loadAchievements();
  }, []);

  const calculateStats = (list: Achievement[]) => {
    const unlocked = list.filter(a => a.unlocked);
    setUnlockedCount(unlocked.length);
    const sumPoints = unlocked.reduce((acc, curr) => acc + curr.points, 0);
    setTotalPoints(sumPoints);
  };

  const getIcon = (name: string, unlocked: boolean) => {
    const color = unlocked ? "text-indigo-600" : "text-slate-400";
    switch (name) {
      case "trophy":
        return <Trophy className={`${color} shrink-0`} size={20} />;
      case "star":
        return <Star className={`${unlocked ? "text-amber-500 fill-amber-300" : "text-slate-400"} shrink-0`} size={20} />;
      case "zap":
        return <Zap className={`${unlocked ? "text-yellow-500 fill-yellow-100 animate-pulse" : "text-slate-400"} shrink-0`} size={20} />;
      case "shield":
        return <Shield className={`${color} shrink-0`} size={20} />;
      case "flame":
        return <Flame className={`${unlocked ? "text-rose-500 fill-rose-100" : "text-slate-400"} shrink-0`} size={20} />;
      case "target":
      default:
        return <Target className={`${color} shrink-0`} size={20} />;
    }
  };

  const forceUnlock = (id: string) => {
    const updated = achievements.map(a => {
      if (a.id === id && !a.unlocked) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
        return {
          ...a,
          unlocked: true,
          progress: 100,
          unlockedAt: "امروز"
        };
      }
      return a;
    });

    localStorage.setItem("taranom_student_achievements", JSON.stringify(updated));
    setAchievements(updated);
    calculateStats(updated);
  };

  const toPersianNum = (num: number | string) => {
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 text-right" style={{ direction: "rtl" }} id="student-achievements-container">
      {/* Confetti Micro celebration header alert */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-emerald-550 to-teal-600 text-white p-3 rounded-2xl text-xs font-black flex items-center justify-between gap-3 shadow-md"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-300 animate-spin" />
              <span>تبریک! مدال افتخار جدید با موفقیت در بهسازی مستمر کایزن آزاد شد و به کارنامه علمی افزوده گشت!</span>
            </div>
            <button onClick={() => setShowConfetti(false)} className="text-white hover:text-emerald-250 font-bold">×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Block with metrics info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
        <div className="space-y-1">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Award className="text-amber-500 animate-pulse" size={20} />
            برج نام‌آوران و مدال‌های کایزن داوطلب (Achievements)
          </h4>
          <p className="text-[11px] text-slate-400 font-bold">
            رصد پله‌پله دستاوردها، مدال‌های انضباط روان و نشان‌های پیروزی در سنجش‌های علمی
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Unlocked badges score */}
          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-2xl text-center">
            <span className="text-[9px] text-slate-400 font-bold block leading-none">مدال‌های کسب شده</span>
            <span className="text-sm font-sans font-black text-slate-800">{toPersianNum(unlockedCount)} از {toPersianNum(achievements.length)}</span>
          </div>

          {/* Gamified experience points score */}
          <div className="bg-amber-50/70 border border-amber-100 px-3/5 py-1.5 rounded-2xl text-center">
            <span className="text-[9px] text-amber-600 font-black block leading-none">امتیاز نخبگان (XP)</span>
            <span className="text-sm font-sans font-black text-amber-700">{toPersianNum(totalPoints)} XP</span>
          </div>
        </div>
      </div>

      {/* Achievements Horizontal Bento and Detail preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="achievements-bento-grid">
        {achievements.map((item) => {
          const isRarityLegendary = item.rarity === "افسانه‌ای";
          const isRarityRare = item.rarity === "نایاب";
          const isRarityAdvanced = item.rarity === "پیشرفته";

          return (
            <div 
              key={item.id}
              onClick={() => setSelectedAchievement(item)}
              className={`p-4 rounded-2xl border transition-all duration-300 relative group cursor-pointer ${
                item.unlocked 
                  ? "bg-white border-slate-100 hover:border-slate-300 shadow-sm"
                  : "bg-slate-50/50 border-slate-100 opacity-80"
              }`}
            >
              {/* Rarity & Status Badge top line */}
              <div className="flex justify-between items-center mb-3">
                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black ${
                  isRarityLegendary ? "bg-purple-100 text-purple-800" :
                  isRarityRare ? "bg-rose-100 text-rose-800" :
                  isRarityAdvanced ? "bg-indigo-100 text-indigo-800" :
                  "bg-slate-100 text-slate-600"
                }`}>
                  {item.rarity} • {toPersianNum(item.points)} XP
                </span>

                <span className={`font-bold text-[8px] ${item.unlocked ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {item.unlocked ? `آزاد شد (${item.unlockedAt})` : "قفل شده"}
                </span>
              </div>

              {/* Icon & Title */}
              <div className="flex items-start gap-2.5">
                <div className={`p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-110 ${
                  item.unlocked 
                    ? "bg-indigo-50 text-indigo-600" 
                    : "bg-slate-200/60 text-slate-400"
                }`}>
                  {getIcon(item.iconName, item.unlocked)}
                </div>

                <div className="space-y-1">
                  <h5 className={`text-xs font-black ${item.unlocked ? 'text-slate-800' : 'text-slate-400'}`}>
                    {item.title}
                  </h5>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-semibold line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Progress Bar & interaction to boost offline testing */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold text-slate-400 font-sans">
                  <span>پیشرفت هدف</span>
                  <span>{toPersianNum(item.progress)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.unlocked ? "bg-indigo-500" : "bg-slate-300"
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>

                {!item.unlocked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      forceUnlock(item.id);
                    }}
                    className="w-full mt-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-heavy text-[9px] py-1 px-2 rounded-lg transition-colors border border-indigo-100 cursor-pointer"
                  >
                    ارتقاء آزمایشی و آزادسازی مدال (Simulation)
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Achievement Details Drawer Mockup / Box */}
      {selectedAchievement && (
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in text-right">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-650 text-white rounded-xl">
              {getIcon(selectedAchievement.iconName, true)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800">{selectedAchievement.title}</span>
                <span className="text-[9px] bg-slate-900 text-slate-100 font-bold px-1.5 py-0.5 rounded">
                  {selectedAchievement.rarity}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold leading-normal">{selectedAchievement.description}</p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedAchievement(null)}
            className="bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-700 px-3.5 py-1.5 text-[10px] font-black shrink-0 cursor-pointer"
          >
            بستن جزئیات تفصیلی
          </button>
        </div>
      )}
    </div>
  );
}
