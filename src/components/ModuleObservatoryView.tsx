import React, { useState, useEffect } from "react";
import { 
  Cpu, Copy, Search, Check, Play, Settings, Sparkles, Filter, Code, FileCode, Layers, ShieldCheck, 
  HelpCircle, ChevronLeft, ArrowRight, Zap, RefreshCw, Terminal, HeartPulse, HardDrive, Target
} from "lucide-react";
import { addSystemLog } from "../lib/syslogs";

export interface SystemModule {
  id: string;
  name: string;
  role: "student" | "counselor" | "admin" | "teacher" | "parent" | "global";
  roleName: string;
  filePath: string;
  description: string;
  features: string[];
  importance: "بحرانی" | "بالا" | "متوسط";
  techStack: string[];
}

export default function ModuleObservatoryView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<SystemModule | null>(null);
  
  // Customization state for AI developer prompt generator
  const [devFocus, setDevFocus] = useState<"ui_ux" | "gamification" | "gemini_ai" | "firebase" | "security">("ui_ux");
  const [architectureStyle, setArchitectureStyle] = useState<"kaizen_standard" | "google_ux" | "offline_first" | "interactive_canvas">("kaizen_standard");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [copied, setCopied] = useState(false);
  
  // Live simulated startup/google benchmarking log
  const [benchmarkLogs, setBenchmarkLogs] = useState<string[]>([]);
  const [benchmarkingActive, setBenchmarkingActive] = useState(false);

  const modulesList: SystemModule[] = [
    // --- STUDENT DASHBOARD ---
    {
      id: "StudyPlanView",
      name: "برنامه‌ریز درسی هوشمند کایزن (StudyPlan)",
      role: "student",
      roleName: "میز کار داوطلب (دانشجو)",
      filePath: "src/components/StudyPlanView.tsx",
      description: "برنامه مطالعاتی روزانه مبتنی بر روش بهبود مستمر کایزن برای توزیع بهینه تست‌زنی و مطالعه مفهومی.",
      features: [
        "برنامه پویای شیفت صبح (کتاب و درسنامه)",
        "برنامه شیفت عصر (تست‌زنی زمان‌دار)",
        "شناساگر تست تعاملی مربی ویژه داوطلب",
        "ردیابی و تکمیل وضعیت کارهای روزانه"
      ],
      importance: "بحرانی",
      techStack: ["React Hooks", "lucide-react", "localStorage"]
    },
    {
      id: "RealTimeExamSimulator",
      name: "شبیه‌ساز آنلاین و فوق‌زنده آزمون کنکور (Simulator)",
      role: "student",
      roleName: "میز کار داوطلب (دانشجو)",
      filePath: "src/components/RealTimeExamSimulator.tsx",
      description: "شبیه‌ساز محیط فیزیکی جلسه کنکور به همراه سنسورهای پاسخدهی و پایش زمان ضربتی و زمان‌های مرده.",
      features: [
        "ثبت تپش ضربان قلب شبیه‌سازی‌شده متناسب با سختی سوال",
        "آمار زنده وقت هدر شده روی سوال‌های دارای پاسخ غلط",
        "سیستم علامت‌گذاری و پرچم تست‌ها",
        "محاسبه نمره منفی با فرمول سنجش کنکور سراسری"
      ],
      importance: "بحرانی",
      techStack: ["React State/Interval", "lucide-react", "CSS Animations"]
    },
    {
      id: "ReportCardView",
      name: "تحلیلگر هوشمند کارنامه فنی آزمون (ReportCard)",
      role: "student",
      roleName: "میز کار داوطلب (دانشجو)",
      filePath: "src/components/ReportCardView.tsx",
      description: "سند تشریحی بررسی عملکرد درصدی و تراز مانیتورینگ داوطلب همراه با تفکیک تست‌های درست، غلط و نزده.",
      features: [
        "پایگاه داده کارنامه‌های قبلی",
        "شاخص تراز مانیتورینگ بین ۴۰۰۰ تا ۱۲۰۰۰",
        "رتبه‌بندی کشوری و قیاس دپارتمانی",
        "تولید نمودار توزیع پاسخ‌ها"
      ],
      importance: "بحرانی",
      techStack: ["React Hooks", "Recharts Components", "lucide-react"]
    },
    {
      id: "TestTrapsView",
      name: "کارگاه پایش تله‌های تستی شناختی (TestTraps)",
      role: "student",
      roleName: "میز کار داوطلب (دانشجو)",
      filePath: "src/components/TestTrapsView.tsx",
      description: "ماژول طبقه‌بندی و مهار خطاهای تستی داوطلبان اعم از تله‌های مفهومی، فرمول‌محور، زمان‌بر و بی‌دقتی‌ها.",
      features: [
        "تفکیک و آرشیو تله‌های تستی به تفکیک درس",
        "برچسب اولویت شب آزمون (High, Medium, Low)",
        "تعریف درس آسیب‌دیده و نکته طلایی مربی",
        "دکمه خودکار تولید آزمون ضد تله"
      ],
      importance: "بالا",
      techStack: ["lucide-react", "CSS Transitions", "Local Storage"]
    },
    {
      id: "TrapsTreeMap",
      name: "نقشه درختی توزیع خطاها (TrapsTreeMap)",
      role: "student",
      roleName: "میز کار داوطلب (دانشجو)",
      filePath: "src/components/TrapsTreeMap.tsx",
      description: "نمودار سلسه‌مراتبی و رنگ‌بندی‌شده توزیع آماری تله‌های روی‌داده داوطلب بر اساس فراوانی خطاها.",
      features: [
        "محاسبه مساحت بلاک‌ها بنا بر فراوانی خطا",
        "رنگ‌بندی پویا بر حسب وخامت (قرمز، نارنجی، زرد)",
        "توضیحات تعاملی در هاور ماوس",
        "فیلتر آنی دروس منتخب"
      ],
      importance: "متوسط",
      techStack: ["D3.js integration / Custom SVG Hierarchy", "lucide-react"]
    },
    {
      id: "MetacognitionLabView",
      name: "آزمایشگاه فراشناخت و تست‌های توجه فعال (MetacognitionLab)",
      role: "student",
      roleName: "میز کار داوطلب (دانشجو)",
      filePath: "src/components/MetacognitionLabView.tsx",
      description: "مجموعه مینی‌گیم‌های علمی حافظه فعال و تحریک شناختی جهت بازیابی توجه و مهار هرزرفت ذهن.",
      features: [
        "آزمون ترتیبی اعدادی حافظه کار کوتاه مدت",
        "برآورد میلی‌ثانیه‌ای تاخیر شناختی",
        "تحلیل بازخورد استرس مربی ترنم",
        "ارتقاء تراز تمرکز دانش‌آموز"
      ],
      importance: "بالا",
      techStack: ["Interactive JS Canvas", "CSS Animatable States"]
    },
    {
      id: "PomodoroTimer",
      name: "تایمر پومودورو زمان‌سنج کنکوری (Pomodoro)",
      role: "student",
      roleName: "میز کار داوطلب (دانشجو)",
      filePath: "src/components/PomodoroTimer.tsx",
      description: "تایمر استقرار فیزیکی بر اساس چرخه ۲۵ دقیقه‌ای تمرکز و ۵ دقیقه‌ای بازیابی روحیه و تنفس عمیق جهت حفظ بهره‌وری.",
      features: [
        "تنظیم زنده مدت زمان‌های استراحت",
        "شمارش معکوس پویا در پس‌زمینه هدر",
        "پلیس حواس‌پرتی (نوتیفیکیشن هشدار)",
        "مدیریت چرخه مطالعه کایزن"
      ],
      importance: "متوسط",
      techStack: ["HTML5 Notification / Audio Alerts", "React Refs"]
    },
    {
      id: "GoalTracker",
      name: "ردیاب قبولی و شبیه‌ساز انتخاب رشته (GoalTracker)",
      role: "student",
      roleName: "میز کار داوطلب (دانشجو)",
      filePath: "src/components/GoalTracker.tsx",
      description: "برآورد هوشمند قبولی در رشته‌ها و دانشگاه‌های سراسر کشور بر اساس تراز فعلی داوطلب و داده‌های آماری سال‌های قبل.",
      features: [
        "پیش‌بینی قبولی قبوض مختلف (پزشکی تهران، مهندسی شریف، حقوق تهران ...)",
        "تراز تخمینی لازم برای صندلی هدف ارشد",
        "محاسبه ضریب دشواری کنکور بر حسب سهمیه منطقه",
        "داشبورد ردیابی پیشرفت علمی"
      ],
      importance: "بالا",
      techStack: ["Recharts Gauge", "Custom Probability Logic"]
    },
    {
      id: "ProgressView",
      name: "نمودار رشد علمی و همگام‌ساز دروس (Progress)",
      role: "student",
      roleName: "میز کار داوطلب (دانشجو)",
      filePath: "src/components/ProgressView.tsx",
      description: "ترسیم نمودارهای تراز چندوجهی در گذر مکرر آزمون‌ها برای پایش نوسانات داوطلب در دروس تکی.",
      features: [
        "نمودار پیشرفت خطی و ستونی تراز",
        "رهگیری درصد مباحث منتخب با کدهای رنگی",
        "گزارش مقایسه‌ای مربی"
      ],
      importance: "بالا",
      techStack: ["Recharts LineChart", "lucide-react"]
    },
    {
      id: "StudentAchievements",
      name: "جوایز و مدال‌های داوطلب کوشا (Achievements)",
      role: "student",
      roleName: "میز کار داوطلب (دانشجو)",
      filePath: "src/components/StudentAchievements.tsx",
      description: "سیستم گیمیفیکیشن مدال‌های تلاش، رکوردهای پومودورو و بسته‌های آزمونی موفق جهت بهبود انگیزش مستمر داوطلب.",
      features: [
        "بج‌های افتخار (فاتح زیست‌شناسی، سلطان فیزیک، پادشاه تمرکز)",
        "محاسبه امتیاز تجربه XP",
        "سطح‌بندی قهرمانی داوطلبان ترنم مهر"
      ],
      importance: "متوسط",
      techStack: ["Framer Motion / Tailwind animations"]
    },

    // --- COUNSELOR PANEL ---
    {
      id: "CounselorView",
      name: "دستیار مربی و چت عارضه‌یابی دکتر رادان (CounselorView)",
      role: "counselor",
      roleName: "پنل مربیان و پزشکان روان‌سنج",
      filePath: "src/components/CounselorView.tsx",
      description: "هسته ارتباطی و چت هوشمند مربی روان‌سنج (دکتر رادان) با داوطلب جهت واکاوی خستگی، استرس و ارائه برنامه‌های درسی.",
      features: [
        "نمایش وضعیت برخط مانیتورینگ مشاور علمی ارشد",
        "یکپارچه‌سازی با خروجی‌های هوشمند Circuit Breaker",
        "تغییر آنی پرووایدر چت بر حسب سرعت دهی API",
        "دکمه پاسخ‌های مربی شبیه‌ساز کنکوری"
      ],
      importance: "بحرانی",
      techStack: ["Fetch API", "Google Gemini SDK", "x-ai-provider-keys Parsing"]
    },
    {
      id: "CustomQuizGenerator",
      name: "طراح تطبیقی آزمون و کوئیزساز مربی (QuizGenerator)",
      role: "counselor",
      roleName: "پنل مربیان و پزشکان روان‌سنج",
      filePath: "src/components/CustomQuizGenerator.tsx",
      description: "برنامه طراحی کوئیزهای تخصصی بر اساس مباحث آسیب‌دیده داوطلب با قابلیت بارگذاری مستقیم در کارتابل او.",
      features: [
        "انتخاب تعداد تست‌ها و سطح تله (ساده، پیچیده، مرگبار)",
        "طراحی پیش‌نویس سوالات اختصاصی",
        "فرستادن با تله‌های تستی سفارشی مشاور"
      ],
      importance: "بالا",
      techStack: ["x-ai-provider-keys Integration", "Custom API schema"]
    },
    {
      id: "ManovaDashboard",
      name: "داشبورد آماری چندمتغیره مانوا (ManovaDashboard)",
      role: "counselor",
      roleName: "پنل مربیان و پزشکان روان‌سنج",
      filePath: "src/components/ManovaDashboard.tsx",
      description: "سیستم تحلیل همزمان اثر متولی و چندگانه روش‌های آموزشی روی ترازهای کل دانش‌آموزان به تفکیک رشته.",
      features: [
        "محاسبه شاخص پیلایز تریس (Pillai's Trace)",
        "ارزیابی کوواریانس نمرات و بررسی استقلال خطاها",
        "نمودارهای رگرسیون چندمتغیره دروس تخصصی",
        "تحلیل کایزن دپارتمانی مدارس هدف"
      ],
      importance: "متوسط",
      techStack: ["Math.js math logic", "Recharts Advanced Scatter", "D3-scale"]
    },

    // --- ADMIN PANEL ---
    {
      id: "AiCircuitBreaker",
      name: "کنترلر تاب‌آوری و سوئیچ پرووایدر (CircuitBreaker)",
      role: "admin",
      roleName: "پورتال ادمین / نظارت کل",
      filePath: "src/components/AiCircuitBreaker.tsx",
      description: "سیستم کنترلر مانیتورینگ برای سوئیچ خودکار بین پرووایدرهای هوش مصنوعی هنگام اختلال در گوگل، اوپن‌روتر یا انتروپیک.",
      features: [
        "پایش زنده نرخ تاخیر و خطاهای اتصال API",
        "سوئیچ زنده توکن‌ها در سطح هدرهای کلاینت",
        "ثبت لاگ اتومات تغییر نودها در دیتابیس سیستمی",
        "نمایش پرووایدر فعال جدید به کاربر"
      ],
      importance: "بحرانی",
      techStack: ["LocalStorage Events", "Custom Request Interceptor", "lucide-react"]
    },
    {
      id: "WordPressMigrationGuide",
      name: "پکیج‌ساز و فشرده‌ساز خودکار افزونه وردپرس (WPMigration)",
      role: "admin",
      roleName: "پورتال ادمین / نظارت کل",
      filePath: "src/components/WordPressMigrationGuide.tsx",
      description: "ماژول بسته‌بندی پویای کدهای تولیدشده در درخت‌واره ریشه و فشرده‌سازی در قالب فایل ZIP استاندارد افزونه وردپرسی جهت دانلود آنی.",
      features: [
        "بارگذاری زنده کدهای PHP، CSS و JS در ادیتور",
        "تولید خودکار استاندارد زیپ با jszip کلاینت",
        "پیش‌نویس خودکار پرامپت‌های کمکی توسعه افزونه",
        "ساختار استاندارد افزونه‌های رسمی مخزن وردپرس"
      ],
      importance: "بالا",
      techStack: ["JSZip Client API", "File-system simulated structure", "lucide-react"]
    },
    {
      id: "ContentAuditModule",
      name: "سیستم ممیزی امنیتی و فیلترینگ محتوای درسی (ContentAudit)",
      role: "admin",
      roleName: "پورتال ادمین / نظارت کل",
      filePath: "src/components/ContentAuditModule.tsx",
      description: "دستیار هوش مصنوعی ادمین جهت پایش زنده و حسابرسی سوالات کنکوری، جلوگیری از نشت اطلاعات، فحاشی و تقلب.",
      features: [
        "امتیاز آسیب‌شناسی و وخامت خطر هر سوال",
        "شناسایی عبارات نامتعارف با متد کایزن محتوا",
        "آمار عددی درصد سلامت کل پورتال",
        "تغییر وضعیت زنده تایید/رد در پایگاه داده"
      ],
      importance: "بالا",
      techStack: ["React State", "Tailwind animations", "lucide-react"]
    },
    {
      id: "StorageMonitorView",
      name: "سیستم پایش فضامحور حافظه و دیتابیس (StorageMonitor)",
      role: "admin",
      roleName: "پورتال ادمین / نظارت کل",
      filePath: "src/components/StorageMonitorView.tsx",
      description: "نمای تعاملی و سه‌بعدی حجم مصرفی و ایندکس‌های فعال دیتابیس لوکال استوریج، کشینگ وب و فایراستور ابری.",
      features: [
        "نمودار پیشرفت دایره‌ای حجم مصرفی به بایت",
        "آزمون یکپارچگی اتصالات و کانال‌های REST API",
        "مدیریت کش مرورگر ادمین",
        "شبیه‌ساز ترافیک سنگین"
      ],
      importance: "بالا",
      techStack: ["Recharts RadialBar", "lucide-react", "Browser Engine API"]
    }
  ];

  const handleSimulatedBenchmarkSearch = (module: SystemModule) => {
    setIsGenerating(true);
    setBenchmarkingActive(true);
    setBenchmarkLogs([]);
    setGeneratedPrompt("");

    const logs = [
      `🔍 اتصال به وب‌سرورهای پرسرعت توسعه ترنم مایت...`,
      `📡 ارسال درخواست خزنده علمی به پایگاه دانش Ed-Tech برتر گوگل و استارتاپ‌های کایزن...`,
      `📦 استخراج معماری و کامپوننت‌های بهینه مربوط بهِ [ ${module.name} ]...`,
      `🤖 تحلیل نیازمندی‌ها بر اساس فریم‌ورک: React 18, Tailwind CSS, Lucide icons`,
      `🎯 اعمال زاویه تمرکز انتخاب شده توسعه: [ ${
        devFocus === "ui_ux" ? "رابط کاربری شاهکار کایزن و افکت‌های پویانمایی" :
        devFocus === "gamification" ? "گیمیفیکیشن و غوطه‌وری روانشناختی داوطلبان" :
        devFocus === "gemini_ai" ? "هوشمندسازی پیشرفته با کیت توسعه @google/genai" :
        devFocus === "firebase" ? "پشتیبان قوی Firestore و کوئری‌های Real-time" :
        "پروتکل پایش و حریم خصوصی کایزن کلین"
      } ]`,
      `📐 تنظیم فایرد وال استاندارد استایلدهی: ${architectureStyle.toUpperCase()}`,
      `⚙️ ساخت کدهایی با ساختار بهینه‌سازی‌شده برای توکن پورتال...`,
      `✨ پیاده‌سازی و تدوین قالب پرامپت مهندسی نهایی...`
    ];

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < logs.length) {
        setBenchmarkLogs(prev => [...prev, logs[logIndex]]);
        logIndex++;
      } else {
        clearInterval(interval);
        setBenchmarkingActive(false);
        // Build the prompt content
        generateActualPromptText(module);
        setIsGenerating(false);
      }
    }, 450);
  };

  const generateActualPromptText = (module: SystemModule) => {
    let focusDirective = "";
    switch (devFocus) {
      case "ui_ux":
        focusDirective = `
- **بخش کاربری شگفت‌انگیز**: کله رابط کاربری را با اصول Minimalist & Swiss، فواصل استاندارد شیک، گرادینت‌های لوکس تیره به ملایم، و ترنزیشن‌های انیمیشنی CSS یا Motion/React پویاتر کنید.
- **تنوع ریتم**: از پدینگ‌ها و هدرهای متنوع استفاده کرده و از آیکون‌های lucide-react مکرر و خوش‌رنگ همگام با المان‌ها بهره ببرید.
`;
        break;
      case "gamification":
        focusDirective = `
- **امتیازات غوطه‌وری روانشناختی**: بخش گیمیفیکیشن جدیدی اضافه کنید که در صورت فعالیت بهینه کاربر به او امتیاز XP، مدال کایزن و افکت‌های جذاب بصری بدهد.
- **بهبود انگیزشی**: افکت‌های ریز و بازخوردهای استرس روان‌شناختی همراه با نقل‌قول‌های الهام‌بخش بومی کنکور ایجاد کنید.
`;
        break;
      case "gemini_ai":
        focusDirective = `
- **یکپارچه‌سازی با SDK رسمی @google/genai**: کدهایی برای اتصال به هوش مصنوعی با متد دلیور مستقیم طراحی کنید.
- **هوش پویای درخواستی**: با درایت کامل، پرامپت پیش‌فرضی به مدل بفرستید تا بر اساس تراز و ضعف‌های آزمونی کاربر، استراتژی بهبود ضد تله ایجاد کند.
`;
        break;
      case "firebase":
        focusDirective = `
- **پایگاه داده ابری Firestore**: کدهای اتصال مستقیم به Firestore جهت ذخیره سوابق این ماژول بنویسید.
- **بهره‌وری آفلاین (localStorage fallback)**: اگر اطلاعات اینترنت قطع بود، تراکنش‌ها را در لایه کش محلی مرورگر نگه دارید و سپس سینک کنید.
`;
        break;
      case "security":
        focusDirective = `
- **امنیت عمیق و ممیزی داده**: متدهای ضد هک در ورودی‌های ماژول، فیلترینگ کلمات رکیک و لاگ کلین کلاینت را در آن مستقر کنید.
- **داده‌های شخصی**: اطلاعات داوطلبی شامل کدهای تراز را فقط به صورت هش‌شده یا کاملاً بهینه پردازش نمایید.
`;
    }

    let styleDirective = "";
    switch (architectureStyle) {
      case "kaizen_standard":
        styleDirective = "ساختار استاندارد کایزن (بهبود تدریجی با استانداردهای فریم‌ورک React)";
        break;
      case "google_ux":
        styleDirective = "استاندارد کاربری برتر گوگل (Swiss design, Google Material guidelines, elegant feedback)";
        break;
      case "offline_first":
        styleDirective = "پروتکل اولویت با آفلاین (Caching first, seamless background synchronizer)";
        break;
      case "interactive_canvas":
        styleDirective = "طراحی تعاملی بوم دیجیتالی (SVG canvas based interactive charts, rich analytics layout)";
        break;
    }

    const text = `سلام توسعه‌دهنده هوشمند ترنم مهر!

ما می‌خواهیم ماژول "${module.name}" در مسیر فایل \`${module.filePath}\` را ارتقا داده و غنی‌تر کنیم. از تو می‌خواهیم بر اساس جزییات و کتب راهنمای استارتاپی زیر، بهترین و باکیفیت‌ترین کد تماماً تایپ‌اسکریپت (React/TSX) را تولید و پیاده‌سازی کنی.

### 📐 معماری و استاندارد هدف:
- **سبک طراحی**: ${styleDirective}
- **فناوری‌های مورد استفاده**: React 18+, Tailwind CSS, lucide-react, ${module.techStack.join(", ")}

### 🎯 اهداف کلیدی توسعه (زاویه تمرکز: ${devFocus.toUpperCase()}):
${focusDirective}

### 🛠️ ویژگی‌ها و جزئیات مورد نیاز در ماژول:
${module.features.map(f => `- ${f}`).join("\n")}

### 📝 مشخصات فنی موردنظر کلاینت:
- یکپارچگی کامل با سیستم لاگینگ ترنم مهر بوسیله فراخوانی \`addSystemLog\`.
- افزودن شناسه منحصر به فرد (\`id\`) به دکمه‌ها و فرم‌های کلیدی جهت مانیتورینگ دقیق و تست‌های کیفی.
- تمام پیام‌ها و متن‌های واسط کاربری باید به فارسی سلیس و با لحن انگیزشی/کنکوری موسسه باشد.
- تمام توابع استیت از جمله \`useEffect\` را طوری بنویس که رندرهای اضافی (infinite loops) در پنل رخ ندهد.

لطفاً کدهای کامل این ماژول را با ساختار بسیار خوانا، دارای کامنت‌های جذاب به زبان فارسی و با حفظ کلیه کلاس‌های پویای Tailwind صادر فرما. تشکر!`;
    
    setGeneratedPrompt(text);
    
    // Auto logging to system logs
    addSystemLog(
      `تولید پرامپت توسعه برای ${module.id}`,
      `رصدخانه ماژول‌ها`,
      `پرامپت توسعه پیشرفته ماژول با موفقیت از طریق کایزن AI و جستجوی شبیه‌ساز مهندسی شد.`
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter modules based on search & role
  const filteredModules = modulesList.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.filePath.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || m.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 text-right animate-fade-in" style={{ direction: "rtl" }}>
      
      {/* Intro Banner */}
      <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-indigo-900/40 p-6 rounded-3xl border border-indigo-900/60 text-right space-y-3 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-650 text-white rounded-2xl shadow-lg ring-4 ring-indigo-500/20">
              <Cpu size={26} className="text-emerald-400 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/25 uppercase">
                  Module Observatory v4.0
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">رصدخانه ماژول‌های فنی و برنامه‌ساز پرامپت توسعه</h3>
              <p className="text-slate-300 text-[11px] font-medium leading-relaxed">
                ردیابی، دسته‌بندی و تولید هوشمند پرامپت توسعه هم‌مبنا با اصول کایزن و استانداردهای UX گوگل برای هر ماژول
              </p>
            </div>
          </div>
          
          <div className="text-[10px] text-indigo-200 bg-indigo-950/80 rounded-xl px-4 py-2 border border-indigo-800/60 font-mono flex items-center gap-2">
            <Terminal size={12} className="text-emerald-400" />
            <span>نظارت زنده بر ۲۲ ماژول هسته پورتال</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Modules List (7 Columns) */}
        <div className="xl:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="جستجو در نام، کد، یا مستندات فایل ماژول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-right pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-650"
              />
            </div>

            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setSelectedRole("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${selectedRole === "all" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"}`}
              >
                همه بخش‌ها
              </button>
              <button 
                onClick={() => setSelectedRole("student")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${selectedRole === "student" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"}`}
              >
                داوطلبان
              </button>
              <button 
                onClick={() => setSelectedRole("counselor")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${selectedRole === "counselor" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"}`}
              >
                مربیان
              </button>
              <button 
                onClick={() => setSelectedRole("admin")}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${selectedRole === "admin" ? "bg-rose-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"}`}
              >
                ادمین
              </button>
            </div>
          </div>

          {/* Active List Grid Layout */}
          <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1.5 scrollbar-thin">
            {filteredModules.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <HelpCircle className="mx-auto text-slate-300" size={36} />
                <p className="text-xs text-slate-500 font-bold">هیچ ماژولی متناسب با عبارات جستجوی شما پیدا نشد.</p>
              </div>
            ) : (
              filteredModules.map((m) => {
                const isSelected = selectedModule?.id === m.id;
                return (
                  <div 
                    key={m.id}
                    onClick={() => setSelectedModule(m)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-right relative flex flex-col justify-between gap-4 ${
                      isSelected 
                        ? "bg-slate-900 text-white border-slate-900 shadow-md transform scale-[1.01]" 
                        : "bg-slate-50/50 hover:bg-slate-100/50 border-slate-200/80 text-slate-800"
                    }`}
                  >
                    {/* Module Title & Role tag */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                              m.role === "student" ? "bg-indigo-100 text-indigo-700" :
                              m.role === "counselor" ? "bg-emerald-100 text-emerald-700" :
                              "bg-rose-100 text-rose-700"
                            }`}>
                              {m.roleName}
                            </span>
                            <span className={`text-[8.5px] font-black px-1.5 py-0.5 rounded ${
                              m.importance === "بحرانی" ? "bg-rose-500 text-white" :
                              m.importance === "بالا" ? "bg-amber-500 text-black" :
                              "bg-slate-200 text-slate-700"
                            }`}>
                              {m.importance}
                            </span>
                          </div>
                          
                          <h4 className="text-xs font-black mt-1.5">{m.name}</h4>
                        </div>

                        {/* Top Right Filepath */}
                        <code className={`font-mono text-[9.5px] px-1.5 py-0.5 rounded ${isSelected ? "bg-slate-800 text-slate-300" : "bg-white text-slate-500 border border-slate-200"}`}>
                          {m.filePath}
                        </code>
                      </div>

                      <p className={`text-[10.5px] mt-2 leading-relaxed ${isSelected ? "text-slate-300" : "text-slate-500 font-bold"}`}>
                        {m.description}
                      </p>
                    </div>

                    {/* Dependencies and Footer button */}
                    <div className="pt-3 border-t border-dashed border-slate-200/20 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-1">
                        {m.techStack.map((tech, i) => (
                          <span key={i} className={`text-[8.5px] font-mono rounded px-1.5 py-0.5 ${
                            isSelected ? "bg-slate-800 text-slate-400" : "bg-white text-slate-600 border border-slate-100"
                          }`}>
                            {tech}
                          </span>
                        ))}
                      </div>

                      <button
                        id={`observatory-detail-btn-${m.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedModule(m);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black inline-flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer ${
                          isSelected 
                            ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                        }`}
                      >
                        <Zap size={11} className={isSelected ? "text-emerald-400 animate-pulse" : ""} />
                        <span>برنامه‌ریزی توسعه ماژول</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: AI Developer Planner (5 Columns) */}
        <div className="xl:col-span-5 space-y-6">
          
          {selectedModule ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Cpu className="text-indigo-600 animate-pulse" size={18} />
                  <span className="text-xs font-black text-slate-800">برنامه‌ریزی توسعه زنده AI</span>
                </div>
                <button
                  onClick={() => setSelectedModule(null)}
                  className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition"
                >
                  بستن پنل ×
                </button>
              </div>

              {/* Selection Summary banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/75 rounded-2xl space-y-1 text-right">
                <span className="text-[9.5px] font-bold text-indigo-600 uppercase">ماژول هدف انتخاب شده</span>
                <h5 className="text-xs font-black text-slate-900">{selectedModule.name}</h5>
                <code className="text-[9px] font-mono text-slate-500 block">{selectedModule.filePath}</code>
              </div>

              {/* Developer Config Parameters Form */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-600 block">۱. زاویه تمرکز ارتقا و بهینه‌سازی:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDevFocus("ui_ux")}
                      className={`p-2.5 text-right rounded-lg border text-[10px] font-black transition cursor-pointer ${
                        devFocus === "ui_ux"
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      🎨 شاهکار کاربری UI/UX
                    </button>
                    <button
                      onClick={() => setDevFocus("gamification")}
                      className={`p-2.5 text-right rounded-lg border text-[10px] font-black transition cursor-pointer ${
                        devFocus === "gamification"
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      🏆 گیمیفیکیشن و غوطه‌وری
                    </button>
                    <button
                      onClick={() => setDevFocus("gemini_ai")}
                      className={`p-2.5 text-right rounded-lg border text-[10px] font-black transition cursor-pointer ${
                        devFocus === "gemini_ai"
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      🤖 هوشمندسازی با Gemini
                    </button>
                    <button
                      onClick={() => setDevFocus("firebase")}
                      className={`p-2.5 text-right rounded-lg border text-[10px] font-black transition cursor-pointer ${
                        devFocus === "firebase"
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                      }`}
                    >
                      🗄️ ذخیره‌سازی Firestore
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-600 block">۲. سبک معماری و استانداردهای طراحی:</label>
                  <select
                    value={architectureStyle}
                    onChange={(e) => setArchitectureStyle(e.target.value as any)}
                    className="w-full text-right p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-650"
                  >
                    <option value="kaizen_standard">پروتکل بهبود مستمر کایزن (پیشنهادی)</option>
                    <option value="google_ux">رهنامه‌های تجربه کاربر شرکت گوگل (Google Design)</option>
                    <option value="offline_first">معماری آفلاین با محلی‌سازی (Offline-First-Cache)</option>
                    <option value="interactive_canvas">بوم تعاملی چندمتغیره (Interactive Scalable SVG)</option>
                  </select>
                </div>

                {/* Main Action Trigger */}
                <button
                  type="button"
                  id="observatory-trigger-search-btn"
                  onClick={() => handleSimulatedBenchmarkSearch(selectedModule)}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-indigo-700 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 disabled:opacity-50 text-white font-black text-xs py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>درحال سنجش کدهای مرجع و بررسی...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-emerald-400 animate-pulse" />
                      <span>تحلیل‌ زنده و تولید پرامپت مهندسی</span>
                    </>
                  )}
                </button>
              </div>

              {/* Benchmarking Crawler Logs */}
              {benchmarkingActive && (
                <div className="p-4 bg-slate-950 text-slate-400 rounded-2xl border border-slate-800 space-y-2 h-[160px] overflow-y-auto font-mono text-[9px] leading-relaxed scrollbar-none" dir="ltr">
                  {benchmarkLogs.map((log, i) => (
                    <div key={i} className="flex gap-1.5">
                      <span className="text-emerald-400 shrink-0">➜</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Generated Prompt Output box */}
              {generatedPrompt && !benchmarkingActive && (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-[10px] font-black text-slate-500">
                    <span className="font-mono">PROMPT PREVIEW (READY TO COPY)</span>
                    <button
                      onClick={handleCopy}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-black px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check size={11} className="text-emerald-500" />
                          <span>کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>کپی پرامپت</span>
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    readOnly
                    value={generatedPrompt}
                    className="w-full h-[220px] p-3 text-right text-[10.5px] leading-relaxed font-mono bg-slate-950 text-emerald-400 rounded-2xl border border-slate-900 resize-none focus:outline-none select-all"
                  />
                  <p className="text-[10px] text-slate-400 text-center font-bold">
                    💡 می‌توانید این پرامپت را کپی کرده و در همین چت برای من ارسال کنید تا فاز جدیدی برای توسعه این ماژول را برایتان پیاده‌سازی کنم!
                  </p>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-8 text-center space-y-3 shadow-inner">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                <Settings className="text-slate-400 animate-spin-slow" size={20} />
              </div>
              <h5 className="text-xs font-black text-slate-800">برنامه‌ریزی هوشمند توسعه یافت نشد</h5>
              <p className="text-[11px] text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
                لطفاً یکی از ماژول‌های فعال را در سمت راست انتخاب کرده و دکمه «برنامه‌ریزی توسعه ماژول» را کلیک کنید تا پنل دستیار هوشمند تولید پرامپت مهندسی کایزن بارگذاری شود.
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
