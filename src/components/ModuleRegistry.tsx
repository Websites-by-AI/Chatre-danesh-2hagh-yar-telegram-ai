import React, { useState } from "react";
import { 
  Table, Cpu, Layout, Users, Shield, Copy, Check, Search, Filter, 
  Terminal, Sparkles, AlertTriangle, ArrowUpRight, Code, RefreshCw, X,
  Settings2, Sliders, Lock
} from "lucide-react";
import { addSystemLog } from "../lib/syslogs";

export interface ActiveModule {
  id: string;
  name: string;
  role: "student" | "counselor" | "admin" | "teacher" | "parent" | "global";
  roleLabel: string;
  filePath: string;
  description: string;
  features: string[];
  importance: "بحرانی" | "بالا" | "متوسط";
  techStack: string[];
  status: "تکمیل شده" | "در حال ارتقا" | "منتظر بهینه‌سازی";
}

export default function ModuleRegistry() {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [importanceFilter, setImportanceFilter] = useState<string>("all");
  
  // Interactive Prompt Generator State
  const [selectedModule, setSelectedModule] = useState<ActiveModule | null>(null);
  const [copied, setCopied] = useState(false);
  const [promptFocus, setPromptFocus] = useState<"ui" | "ai" | "firebase" | "security">("ui");
  const [benchmarkStatus, setBenchmarkStatus] = useState<"idle" | "scanning" | "ready">("idle");
  const [customNotes, setCustomNotes] = useState("");

  const [activePreset, setActivePreset] = useState<"lightweight" | "medium" | "full" | "custom" >(() => {
    return (localStorage.getItem("taranom_module_preset") as any) || "full";
  });

  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("taranom_enabled_modules");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      welcome: true,
      dashboard: true,
      manova: true,
      report: true,
      schedule: true,
      counselor: true,
      progress: true,
      traps: true,
      quiz: true,
      psychology: true,
      metacognition: true,
      counseling: true,
      "historical-db": true,
      "study-planner": true,
      "smart-stress-trainer": true,
      admin: true
    };
  });

  const studentToggleableModules = [
    { id: "welcome", name: "صفحه اصلی و آشنایی", desc: "معرفی آکادمی ترنم همدلی، قابلیت‌ها، جدیدترین مقالات وبلاگ و ورود به سامانه", category: "پیشخوان اصلی", isEssential: true },
    { id: "dashboard", name: "میز کار من", desc: "میز کار روزانه: استریک مطالعه، اقدام‌های امروز و ارزیابی آمادگی ذهنی", category: "پیشخوان اصلی", isEssential: true },
    { id: "study-planner", name: "میز مطالعه من", desc: "ثبت روزانه چرخه‌های یادگیری فعال (۵۰/۱۰) و مدیریت زمان مطالعه", category: "برنامه‌ریزی و آزمون", isEssential: true },
    { id: "admin", name: "تنظیمات آکادمی", desc: "بخش مدیریت سامانه، تنظیمات برندینگ و رجیستری ماژول‌ها", category: "مدیریت سیستم", isEssential: true },
    { id: "manova", name: "داشبورد تحلیلی مانوا", desc: "نمودارها و تحلیل مانیتورینگ چندبعدی کایزن", category: "ارزیابی و گزارش" },
    { id: "report", name: "روند یادگیری من (کارنامه‌ها)", desc: "کارنامه‌های ادواری ممیزی و تحلیل ترازهای کنکور", category: "ارزیابی و گزارش" },
    { id: "schedule", name: "برنامه‌ریزی و تقویم مطالعاتی", desc: "چرخه‌های مطالعاتی فعال هفتگی بر اساس اصول کایزن", category: "برنامه‌ریزی و آزمون" },
    { id: "counselor", name: "گفتگو و پشتیبانی (دستیار مربی)", desc: "چت تعاملی با مربی هوشمند و پشتیبانی ضد استرس", category: "پشتیبانی و مشاوره" },
    { id: "progress", name: "پایش عملکرد و سلامت روان", desc: "نمودارهای پیشرفت ساعت مطالعه و کیفیت خواب", category: "ارزیابی و گزارش" },
    { id: "traps", name: "شناخت چالش‌های تستی (تله‌ها)", desc: "کارگاه عارضه‌یابی و رفع تله‌های تستی بر اساس کارنامه‌های واقعی", category: "ارزیابی و گزارش" },
    { id: "quiz", name: "آزمون سفارشی (کوئیز ساز)", desc: "طراحی آزمون هوشمند از مباحث دلخواه با ضرایب کنکور", category: "برنامه‌ریزی و آزمون" },
    { id: "psychology", name: "پایش آمادگی ذهنی (رادار اضطراب)", desc: "آزمون‌های خودارزیابی آمادگی ذهنی، تنفس و مدیریت اضطراب", category: "پشتیبانی و مشاوره" },
    { id: "metacognition", name: "آزمایشگاه فراشناخت", desc: "مینی‌گیم‌های سنجش تمرکز و حافظه کوتاه‌مدت با ریتم پومودورو", category: "پشتیبانی و مشاوره" },
    { id: "counseling", name: "انتخاب رشته هوشمند", desc: "سیستم تحلیل سهمیه و تخمین قبولی پیشرفته", category: "برنامه‌ریزی و آزمون" },
    { id: "historical-db", name: "بانک تراز و قبولی کنکور", desc: "بانک جامع آماری رتبه‌ها و محل قبولی سال‌های گذشته", category: "برنامه‌ریزی و آزمون" },
    { id: "smart-stress-trainer", name: "شبیه‌ساز آزمون کایزن", desc: "شبیه‌سازی زنده کنکور با پایش استرس و زمان پاسخ‌دهی", category: "برنامه‌ریزی و آزمون" },
  ];

  const applyPreset = (preset: "lightweight" | "medium" | "full") => {
    const presetModules: Record<string, boolean> = {
      welcome: true,
      dashboard: true,
      manova: preset !== "lightweight",
      report: preset !== "lightweight",
      schedule: preset !== "lightweight",
      counselor: preset === "full",
      progress: preset === "full",
      traps: preset === "full",
      quiz: preset !== "lightweight",
      psychology: preset === "full",
      metacognition: preset === "full",
      counseling: preset === "full",
      "historical-db": preset === "full",
      "study-planner": true,
      "smart-stress-trainer": preset !== "lightweight",
      admin: true
    };

    setEnabledModules(presetModules);
    setActivePreset(preset);
    localStorage.setItem("taranom_module_preset", preset);
    localStorage.setItem("taranom_enabled_modules", JSON.stringify(presetModules));
    
    // Notify application window
    window.dispatchEvent(new Event("taranom_modules_changed"));
    
    addSystemLog(
      `تغییر پوسته ماژول‌ها به ${preset === "lightweight" ? "سبک" : preset === "medium" ? "متوسط" : "کامل"}`,
      "تنظیمات ماژول‌ها",
      `مدیر سیستم سطح دسترسی و نمایش ماژول‌های داوطلب را بر روی حالت پیش‌فرض "${preset}" قرار داد.`
    );
  };

  const toggleModule = (id: string) => {
    // Prevent disabling essential modules
    if (id === "welcome" || id === "dashboard" || id === "admin" || id === "study-planner") return;

    const updated = {
      ...enabledModules,
      [id]: enabledModules[id] === false ? true : false
    };
    
    setEnabledModules(updated);
    setActivePreset("custom");
    localStorage.setItem("taranom_module_preset", "custom");
    localStorage.setItem("taranom_enabled_modules", JSON.stringify(updated));
    
    window.dispatchEvent(new Event("taranom_modules_changed"));
    
    addSystemLog(
      `تغییر وضعیت ماژول ${id}`,
      "تنظیمات ماژول‌ها",
      `وضعیت ماژول با شناسه ${id} به ${updated[id] !== false ? "فعال" : "غیرفعال"} تغییر یافت.`
    );
  };

  const modulesData: ActiveModule[] = [
    {
      id: "StudyPlanView",
      name: "برنامه‌ریز درسی هوشمند کایزن (StudyPlan)",
      role: "student",
      roleLabel: "داوطلب (دانش‌آموز)",
      filePath: "src/components/StudyPlanView.tsx",
      description: "ماژول تنظیم چرخه‌های مطالعاتی صبح و عصر بر اساس اصول کایزن، شامل ردیاب پویا و چک‌لیست‌های یادگیری فعال.",
      features: [
        "چرخه‌های تست‌زنی زمان‌دار متناسب با ضرایب کنکور",
        "مدیریت زمان‌های مرده و زمان طلایی طلوع خورشید",
        "ارزیابی پویای خودکار وضعیت تکالیف مربی"
      ],
      importance: "بحرانی",
      techStack: ["React State", "localStorage", "lucide-react"],
      status: "تکمیل شده"
    },
    {
      id: "RealTimeExamSimulator",
      name: "شبیه‌ساز فوق‌زنده آزمون سراسری (Simulator)",
      role: "student",
      roleLabel: "داوطلب (دانش‌آموز)",
      filePath: "src/components/RealTimeExamSimulator.tsx",
      description: "سیستم هوشمند شبیه‌سازی کنکور سراسری با پایش ضربان قلب مصنوعی و تعیین وقت هدر رفته بر روی سوالات تله‌دار.",
      features: [
        "پایش زنده نرخ استرس و خطای محاسباتی",
        "سازوکار زمان‌سنجی معکوس مطابق ضوابط سازمان سنجش",
        "علامت‌گذاری چندگانه تست‌ها (شک‌دار، دشوار، نزده)"
      ],
      importance: "بحرانی",
      techStack: ["React State", "CSS Variables", "HTML5 Audio API"],
      status: "تکمیل شده"
    },
    {
      id: "ReportCardView",
      name: "تحلیلگر جامع کارنامه آزمون (ReportCard)",
      role: "student",
      roleLabel: "داوطلب (دانش‌آموز)",
      filePath: "src/components/ReportCardView.tsx",
      description: "برنامه تولید داده‌های توصیفی کارنامه آزمون کایزن شامل مقایسه تراز مانیتورینگ ۴۰۰۰ تا ۱۲۰۰۰.",
      features: [
        "آرشیو تاریخی نمرات و تراز زیست‌شناسی، فیزیک و شیمی",
        "معرفی رتبه‌بندی درون‌سازمانی و جایگاه داوطلبان ترنم همدلی",
        "تولید خودکار نمودارهای توزیع پاسخ به کمک Recharts"
      ],
      importance: "بحرانی",
      techStack: ["Recharts Engine", "React Hooks", "lucide-react"],
      status: "تکمیل شده"
    },
    {
      id: "TestTrapsView",
      name: "کارگاه عارضه‌یابی و پایش تله‌های تستی (TestTraps)",
      role: "student",
      roleLabel: "داوطلب (دانش‌آموز)",
      filePath: "src/components/TestTrapsView.tsx",
      description: "سیستم آرشیو و بهینه‌سازی تله‌های تستی به دست آمده از کارنامه‌های قبلی جهت مهار بی‌دقتی و عجله تستی.",
      features: [
        "دسته‌بندی تله‌های مفهومی و تله‌های فرمولی فیزیک و ریاضی",
        "تعیین ضریب فرکانس بروز تله در آزمون‌های ادواری",
        "فرمول طلایی پاتک و تذکر مربی روان‌سنج"
      ],
      importance: "بالا",
      techStack: ["React Context", "Framer Motion CSS", "Tailwind Theme"],
      status: "در حال ارتقا"
    },
    {
      id: "TrapsTreeMap",
      name: "نقشه توزیع چگالی خطاهای تستی (TrapsTreeMap)",
      role: "student",
      roleLabel: "داوطلب (دانش‌آموز)",
      filePath: "src/components/TrapsTreeMap.tsx",
      description: "نمای تعاملی و سلسله‌مراتبی فراوانی تله‌های تستی با بهره‌گیری از محاسبات مساحت جهت پیشگیری علمی.",
      features: [
        "ترسیم پویای خانه‌های نقشه منطبق بر تعداد خطاها",
        "تقسیم درس‌ها بر اساس رنگ‌بندی وخامت عارضه (قرمز، زرد)",
        "تولید توصیه‌های تعاملی با نگه داشتن ماوس روی کاشی‌ها"
      ],
      importance: "متوسط",
      techStack: ["Custom SVG Layout", "D3 Mathematical Scalers"],
      status: "تکمیل شده"
    },
    {
      id: "MetacognitionLabView",
      name: "آزمایشگاه سنجش فراشناخت و توجه (MetacognitionLab)",
      role: "student",
      roleLabel: "داوطلب (دانش‌آموز)",
      filePath: "src/components/MetacognitionLabView.tsx",
      description: "جعبه بازی مینی‌گیم‌های علمی تحریک شناختی شامل آزمون ترتیبی اعداد و بازخورد میلی ثانیه‌ای استرس.",
      features: [
        "سنجش حافظه کوتاه‌مدت کایزن به میلی‌ثانیه",
        "نوتیفیکیشن فعال و پایش ریتم تنفس عمیق ضد خستگی",
        "شاخص عددی ضریب تمرکز داوطلبان ترنم همدلی"
      ],
      importance: "بالا",
      techStack: ["HTML5 Canvas", "Javascript Game Loop"],
      status: "تکمیل شده"
    },
    {
      id: "CounselorView",
      name: "دستیار مربی هوشمند و چت تعاملی (CounselorView)",
      role: "counselor",
      roleLabel: "مشاور / مربی علمی",
      filePath: "src/components/CounselorView.tsx",
      description: "سیستم چت زنده با دکتر رادان (مشاور ارشد) همراه با یکپارچه‌ساز پرووایدر سوئیچ خودکار هنگام قطعی.",
      features: [
        "پایش همزمان سرویس فعال هوش مصنوعی و مدل فعال",
        "موتور تولید استراتژی بر اساس سوابق درسی داوطلب",
        "دکمه پاسخ سریع به چالش مهار اضطراب دوران کنکور"
      ],
      importance: "بحرانی",
      techStack: ["Google Gemini integration", "HTTP client headers interceptor"],
      status: "تکمیل شده"
    },
    {
      id: "CustomQuizGenerator",
      name: "طراح انطباقی آزمون با تله‌های سفارشی (QuizGenerator)",
      role: "counselor",
      roleLabel: "مشاور / مربی علمی",
      filePath: "src/components/CustomQuizGenerator.tsx",
      description: "طراح سوال هوشمند مربیان برای بازسازی تله‌های تستی دانش‌آموزان با درجات پیشرفته متد کایزن.",
      features: [
        "سطح‌بندی کوئیز (ساده، هوشمند، مرگبار)",
        "فرستادن مستقیم آزمون به کارپوشه داوطلب منتخب",
        "سنسور شناسایی خودکار درصد خطاها"
      ],
      importance: "بالا",
      techStack: ["x-ai-provider-keys Parsing", "Express JSON RPC"],
      status: "در حال ارتقا"
    },
    {
      id: "AiCircuitBreaker",
      name: "سیستم کنترلر تاب‌آوری و سوییچ اضطراری (CircuitBreaker)",
      role: "admin",
      roleLabel: "مدیر پرتال (ادمین)",
      filePath: "src/components/AiCircuitBreaker.tsx",
      description: "پایشگر زنده پایداری و خطاها که در صورت اتمام محدودیت‌ها، فوراً روی نودهای پشتیبان جابه جا می‌شود.",
      features: [
        "سیستم خودکار جابه‌جایی پرووایدرهای AI",
        "نمایش آلارم نویز و افت سهمیه توکن‌ها",
        "ثبت لاگ اتوماتیک در دپارتمان ثبت وقایع ادمین"
      ],
      importance: "بحرانی",
      techStack: ["LocalStorage Events", "Global Event Listener"],
      status: "تکمیل شده"
    },
    {
      id: "WordPressMigrationGuide",
      name: "بسته‌ساز و خروجی‌گیر افزونه رسمی وردپرس (WPMigration)",
      role: "admin",
      roleLabel: "مدیر پرتال (ادمین)",
      filePath: "src/components/WordPressMigrationGuide.tsx",
      description: "محیط فشرده‌سازی کلاینت کدهای PHP و دارایی‌های CSS و انتقال کامل آن‌ها به صورت فایل ZIP به پنل وردپرس.",
      features: [
        "نمایش درختی روت افزونه در سمت چپ",
        "فشرده‌ساز و سازنده آنلاین فایل ZIP با کتابخانه JSZip",
        "دستورالعمل بارگذاری افزونه در وردپرس فارسی"
      ],
      importance: "بالا",
      techStack: ["JSZip Library", "File Writer API"],
      status: "تکمیل شده"
    },
    {
      id: "ContentAuditModule",
      name: "سیستم ممیزی امنیت سوالات کنکور (ContentAudit)",
      role: "admin",
      roleLabel: "مدیر پرتال (ادمین)",
      filePath: "src/components/ContentAuditModule.tsx",
      description: "ماژول حسابرسی فنی متن و برچسب‌های پاسخ به منظور حذف عبارات نامتعارف یا نشت کلید سنجش.",
      features: [
        "محاسبه درصد سلامت کلی سوالات دیتابیس",
        "تعیین میزان ریسک نشت سوال به کمک هوش مصنوعی",
        "امکان تایید یا رد آنی دسترسی سوالات در پنل"
      ],
      importance: "بالا",
      techStack: ["Tailwind custom borders", "React state hooks"],
      status: "منتظر بهینه‌سازی"
    }
  ];

  const handleGeneratePromptClick = (module: ActiveModule) => {
    setSelectedModule(module);
    setBenchmarkStatus("idle");
    setCopied(false);
  };

  const handleSimulateBenchmark = (module: ActiveModule) => {
    setBenchmarkStatus("scanning");
    setTimeout(() => {
      setBenchmarkStatus("ready");
      addSystemLog(
        `تولید پرامپت توسعه برای ${module.id}`,
        "مدیریت ماژول‌ها",
        `پرامپت توسعه اختصاصی با بهینه‌سازی ${promptFocus.toUpperCase()} شبیه‌سازی و مهندسی شد.`
      );
    }, 1200);
  };

  const buildPromptText = (module: ActiveModule) => {
    let focusText = "";
    switch(promptFocus) {
      case "ui":
        focusText = `
- **شاهکار واسط کاربری و پویانمایی شیک (UI/UX Paint)**:
  - استفاده از فواصل و پدینگ‌های هماهنگ با استاندارد کایزن و بوم گوگل.
  - اعمال کدهای رنگ تیره ملایم و جذاب به همراه آیکون‌های متناسب از lucide-react.
  - روان‌سازی دکمه‌ها با حرکت‌های CSS و گالری تعاملی.
`;
        break;
      case "ai":
        focusText = `
- **هوشمندسازی پیشرفته به کمک @google/genai SDK**:
  - استفاده از متدهای سرور ساید با در نظر گرفتن متغیر GEMINI_API_KEY.
  - فرستادن اطلاعات تحلیلی داوطلبان به هوش مصنوعی برای تولید پاسخ‌های روان‌شناختی ضد استرس.
  - بهینه‌سازی هوشمند پاسخ‌ها به کمک مدل‌های قدرتمند.
`;
        break;
      case "firebase":
        focusText = `
- **بستر ابری و کوئری‌های پویا با Firestore**:
  - اتصال فرم‌ها و چک‌لیست‌ها به کالکشن‌های فایرستور به صورت بلادرنگ (Real-time).
  - پیاده‌سازی متد اولویت با آفلاین (LocalStorage) در صورت عدم پایداری اینترنت کلاینت.
`;
        break;
      case "security":
        focusText = `
- **امنیت ورودی‌ها و حریم شخصی کایزن**:
  - مهار تداخلات استیت و رندرهای بی‌پایان به کمک بهینه‌سازی آرایه وابستگی useEffect.
  - فیلترینگ و ممیزی عبارات نامتعارف کلین.
`;
    }

    return `سلام توسعه‌دهنده هوشمند ماژول‌های ترنم همدلی!

می‌خواهیم ماژول "${module.name}" در مسیر فایل \`${module.filePath}\` را طبق استانداردهای ارتقای ترنم همدلی توسعه و بهبود دهیم. لطفاً بر اساس اطلاعات زیر، کامل‌ترین کدهای تایپ‌اسکریپت (React/TSX) را تولید و پیاده‌سازی کن.

## 📐 مشخصات فنی و معماری ماژول:
- **مسیر فایل هدف**: \`${module.filePath}\`
- **کتابخانه‌های کلیدی**: React 18, Tailwind CSS, lucide-react, ${module.techStack.join(", ")}
- **نقش کاربری**: ${module.roleLabel}
- **درجه اهمیت سیستمی**: ${module.importance}

## 🎯 محور تمرکز توسعه و بهینه‌سازی (${promptFocus.toUpperCase()}):
${focusText}
${customNotes ? `\n- **یادداشت اختصاصی توسعه‌دهنده**: ${customNotes}` : ""}

## 🚀 ویژگی‌های کلیدی مورد نیاز:
${module.features.map(f => `- ${f}`).join("\n")}

## 📝 دستورالعمل‌های کنترل کیفی:
1. استفاده از شناسه‌های منحصر‌به‌فرد (\`id\`) در تگ‌های ورودی و خروجی دکمه‌ها جهت تست کلاینت.
2. رعایت کامل زبان فارسی سلیس همراه با لحن علمی و فوق‌العاده انگیزشی دوران کنکور.
3. پرهیز از ایجاد کدهای اضافی، شبیه‌سازی‌های صوری و ماژول‌های بدون استفاده.

منتظر کد بی‌نقص و زیبای تو هستم! تشکر فراوان.`;
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtration logic
  const filteredModules = modulesData.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          m.filePath.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    const matchesImportance = importanceFilter === "all" || m.importance === importanceFilter;
    
    return matchesSearch && matchesRole && matchesImportance;
  });

  return (
    <div className="space-y-6 text-right animate-fade-in" style={{ direction: "rtl" }}>
      
      {/* Module Title Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-950 p-6 rounded-3xl border border-slate-800 text-right space-y-3.5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-650/10">
              <Table size={24} className="text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-500/20 uppercase font-mono">
                  Module Register Hub
                </span>
                <span className="text-[10px] text-slate-400 font-bold">مدیریت هماهنگ ماژول‌های ابلاغی</span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">جدول مرجع و ردیاب ماژول‌های توسعه ترنم همدلی</h3>
              <p className="text-slate-300 text-xs font-bold">
                مشاهده ساختار فایل‌ها، استک فناوری، اهمیت و تولید خودکار پرامپت‌های توسعه هوش مصنوعی
              </p>
            </div>
          </div>

          <div className="bg-indigo-950/80 border border-indigo-900 rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] text-indigo-300 font-black block">مجموع کل ماژول‌های فعال</span>
            <span className="text-lg font-black text-emerald-400 font-mono leading-none">{modulesData.length} ماژول</span>
          </div>
        </div>
      </div>

      {/* ⚙️ INTEGRATED MODULE CUSTOMIZATION PANEL */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm text-right">
        <div className="flex items-center gap-3 border-b border-slate-150 pb-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Settings2 size={20} className="text-indigo-650" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900">کنترل پویای ماژول‌های پرتال داوطلب</h4>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">
              مدیریت و فیلترینگ امکانات نمایش‌داده‌شده برای کلاینت (دانش‌آموز) بر اساس پوسته‌های پیش‌فرض یا تنظیم تکی چک‌لیست‌ها
            </p>
          </div>
        </div>

        {/* Preset Selection */}
        <div className="space-y-3">
          <span className="text-xs font-black text-slate-700 block">۱. انتخاب پوسته کلی (Presets) ماژول‌ها:</span>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* Lightweight Preset */}
            <button
              onClick={() => applyPreset("lightweight")}
              className={`p-4 text-right rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                activePreset === "lightweight"
                  ? "bg-slate-950 text-white border-slate-950 shadow-md ring-2 ring-slate-950/25"
                  : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100/70"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black">🌱 پوسته سبک (ماژول‌های پایه)</span>
                {activePreset === "lightweight" && <Check size={14} className="text-emerald-400" />}
              </div>
              <span className={`text-[10px] leading-relaxed ${activePreset === "lightweight" ? "text-slate-300" : "text-slate-500"} font-bold`}>
                فقط شامل بخش‌های حیاتی: خانه، میز مطالعه کایزن، ثبت چرخه‌های زمان مطالعاتی و تنظیمات. بسیار سریع و فوق متمرکز.
              </span>
            </button>

            {/* Medium Preset */}
            <button
              onClick={() => applyPreset("medium")}
              className={`p-4 text-right rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                activePreset === "medium"
                  ? "bg-indigo-950 text-white border-indigo-950 shadow-md ring-2 ring-indigo-900/25"
                  : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100/70"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black">⚡ پوسته متوسط (کاربری متداول)</span>
                {activePreset === "medium" && <Check size={14} className="text-emerald-400" />}
              </div>
              <span className={`text-[10px] leading-relaxed ${activePreset === "medium" ? "text-slate-300" : "text-slate-500"} font-bold`}>
                علاوه بر بخش‌های حیاتی، شامل داشبورد تحلیل آزمون مانوا، کارنامه‌های ممیزی، تقویم مطالعاتی و آزمون‌ساز است.
              </span>
            </button>

            {/* Full Preset */}
            <button
              onClick={() => applyPreset("full")}
              className={`p-4 text-right rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                activePreset === "full"
                  ? "bg-emerald-950 text-white border-emerald-950 shadow-md ring-2 ring-emerald-900/25"
                  : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100/70"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black">🚀 پوسته کامل (تمام امکانات)</span>
                {activePreset === "full" && <Check size={14} className="text-emerald-400" />}
              </div>
              <span className={`text-[10px] leading-relaxed ${activePreset === "full" ? "text-slate-300" : "text-slate-500"} font-bold`}>
                فعال‌سازی همزمان تمام ماژول‌ها نظیر مربی آنلاین، رادار استرس و اضطراب داوطلب، مینی‌گیم‌های تمرکز حواس و رتبه‌سازی.
              </span>
            </button>

            {/* Custom Indicator */}
            <div
              className={`p-4 text-right rounded-2xl border flex flex-col gap-1.5 ${
                activePreset === "custom"
                  ? "bg-amber-50 border-amber-300 text-amber-900 shadow-sm"
                  : "bg-slate-50/50 border-slate-100 text-slate-400 select-none"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black">⚙️ پوسته سفارشی (دستی)</span>
                {activePreset === "custom" && <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-black">فعال</span>}
              </div>
              <span className="text-[10px] leading-relaxed font-bold">
                شما چک‌باکس‌های ماژول‌ها را به طور دلخواه دستکاری کرده‌اید. تغییرات به صورت خودکار ثبت و ذخیره شده‌اند.
              </span>
            </div>

          </div>
        </div>

        {/* Detailed Modular Toggle Switches */}
        <div className="space-y-3">
          <span className="text-xs font-black text-slate-700 block">۲. چک‌لیست جزئیات ماژول‌های فعال داوطلب:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {studentToggleableModules.map((m) => {
              const isEssential = m.isEssential;
              const isEnabled = enabledModules[m.id] !== false;
              
              return (
                <div 
                  key={m.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    isEssential 
                      ? "bg-slate-50/80 border-slate-200" 
                      : isEnabled 
                        ? "bg-emerald-50/25 border-emerald-200/80 hover:border-emerald-300" 
                        : "bg-slate-100/40 border-slate-150 opacity-65 hover:opacity-100"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">{m.name}</span>
                      <span className="text-[9px] text-slate-400 font-bold">{m.category}</span>
                    </div>
                    <p className="text-[9.5px] text-slate-500 leading-relaxed font-semibold">{m.desc}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1">
                    {isEssential ? (
                      <span className="text-[9px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-black flex items-center gap-1">
                        <Lock size={10} />
                        <span>ماژول اساسی و غیرقابل تعویض</span>
                      </span>
                    ) : (
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={isEnabled} 
                          onChange={() => toggleModule(m.id)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        <span className="mr-2 text-[10px] font-black text-slate-600">
                          {isEnabled ? "فعال" : "غیرفعال"}
                        </span>
                      </label>
                    )}

                    <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                      isEnabled ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {isEnabled ? "Active" : "Disabled"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Table List Section - 8 Columns */}
        <div className="xl:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-sm">
          
          {/* Header Controls for Filtration */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            
            <div className="md:col-span-6 relative">
              <Search className="absolute right-3.5 top-3 text-slate-400" size={16} />
              <input 
                id="module-register-search-input"
                type="text"
                placeholder="جستجو در عنوان، شرح یا مسیر فایل ماژول..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-right pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              />
            </div>

            <div className="md:col-span-3">
              <select
                id="module-register-role-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full text-right px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
              >
                <option value="all">فیلتر تمامی نقش‌ها</option>
                <option value="student">داوطلب (دانش‌آموز)</option>
                <option value="counselor">مشاور / مربی علمی</option>
                <option value="admin">مدیر سیستم (ادمین)</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                id="module-register-importance-select"
                value={importanceFilter}
                onChange={(e) => setImportanceFilter(e.target.value)}
                className="w-full text-right px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
              >
                <option value="all">فیلتر درجه اهمیت</option>
                <option value="بحرانی">درجه اهمیت: بحرانی</option>
                <option value="بالا">درجه اهمیت: بالا</option>
                <option value="متوسط">درجه اهمیت: متوسط</option>
              </select>
            </div>

          </div>

          {/* Core Table Desktop View / List Mobile View */}
          <div className="overflow-x-auto border border-slate-150 rounded-2xl">
            <table className="w-full text-right border-collapse" id="module-register-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                  <th className="py-3.5 px-4 text-xs font-black">عنوان ماژول فعال</th>
                  <th className="py-3.5 px-4 text-xs font-black">مسیر فایل فیزیکی</th>
                  <th className="py-3.5 px-4 text-xs font-black text-center">نقش کاربری</th>
                  <th className="py-3.5 px-4 text-xs font-black text-center">درجه بحرانیت</th>
                  <th className="py-3.5 px-4 text-xs font-black text-center">اقدام فنی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredModules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-bold bg-slate-50/50">
                      <AlertTriangle className="mx-auto text-amber-500 mb-2 animate-bounce" size={24} />
                      <span className="text-xs">هیچ ماژولی منطبق با شرایط انتخابی پیدا نشد.</span>
                    </td>
                  </tr>
                ) : (
                  filteredModules.map((m) => {
                    const isSelected = selectedModule?.id === m.id;
                    return (
                      <tr 
                        key={m.id}
                        className={`hover:bg-slate-50/80 transition-all ${isSelected ? "bg-indigo-50/70 hover:bg-indigo-50" : ""}`}
                      >
                        {/* Title & Description */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1 max-w-[240px]">
                            <span className="text-xs font-black block text-slate-900">{m.name}</span>
                            <span className="text-[10px] text-slate-500 block leading-relaxed">{m.description}</span>
                          </div>
                        </td>

                        {/* Filepath */}
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-600">
                          <code>{m.filePath}</code>
                        </td>

                        {/* User Role Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            m.role === "student" ? "bg-indigo-100/80 text-indigo-700" :
                            m.role === "counselor" ? "bg-emerald-100/80 text-emerald-700" :
                            "bg-rose-100/80 text-rose-700"
                          }`}>
                            {m.roleLabel}
                          </span>
                        </td>

                        {/* Importance Level */}
                        <td className="py-3.5 px-4 text-center">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded border inline-block ${
                            m.importance === "بحرانی" ? "bg-rose-50 text-rose-600 border-rose-200" :
                            m.importance === "بالا" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-slate-50 text-slate-500 border-slate-200"
                          }`}>
                            {m.importance}
                          </span>
                        </td>

                        {/* Prompt Button */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            id={`module-prompt-btn-${m.id}`}
                            onClick={() => handleGeneratePromptClick(m)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 mx-auto cursor-pointer ${
                              isSelected 
                                ? "bg-indigo-650 text-white shadow-md shadow-indigo-600/10 animate-pulse" 
                                : "bg-slate-900 hover:bg-slate-800 text-white"
                            }`}
                          >
                            <Sparkles size={11} className="text-emerald-400" />
                            <span>ایجاد پرامپت توسعه</span>
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Quick Informative Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
            <Cpu className="text-indigo-600 mt-0.5 shrink-0" size={16} />
            <div className="space-y-1">
              <span className="text-[11px] font-black text-slate-800 block">مکانیزم کایزن توسعه و ردیابی مستمر آکادمی</span>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                هریک از ماژول‌های فوق با کدهای شناسنامه هماهنگ در پرتال ثبت شده است. مربیان و مدیران موسسه ترنم همدلی می‌توانند در صورت نیاز به افزودن ویژگی یا بازسازی استیت‌ها، به سرعت پرامپت استایل‌بندی مهندسی آن را برداشته و فرآیند ارتقا را پیگیری نمایند.
              </p>
            </div>
          </div>

        </div>

        {/* Right Side Prompt Panel - 4 Columns */}
        <div className="xl:col-span-4 space-y-6">
          
          {selectedModule ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-sm animate-fade-in">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-150">
                <div className="flex items-center gap-1.5">
                  <Terminal className="text-indigo-650" size={16} />
                  <span className="text-xs font-black text-slate-800">دستگاه برنامه‌ساز هوشمند</span>
                </div>
                <button
                  onClick={() => setSelectedModule(null)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Selection summary */}
              <div className="p-3.5 bg-slate-50/80 border border-slate-200 text-right rounded-2xl space-y-1">
                <span className="text-[9px] bg-indigo-100/80 text-indigo-700 font-bold px-1.5 py-0.5 rounded uppercase">ماژول هدف</span>
                <h5 className="text-xs font-black text-slate-900 mt-1">{selectedModule.name}</h5>
                <code className="text-[9.5px] font-mono text-slate-500 block leading-none">{selectedModule.filePath}</code>
              </div>

              {/* Tuning Options */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-600 block">۱. پارامتر بهینه‌سازی (Focus Target):</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onClick={() => { setPromptFocus("ui"); setBenchmarkStatus("idle"); }}
                    className={`py-2 px-2.5 text-right rounded-xl border text-[9.5px] font-semibold transition cursor-pointer ${promptFocus === "ui" ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  >
                    🎨 بهینه‌سازی ظاهر و UI
                  </button>
                  <button 
                    onClick={() => { setPromptFocus("ai"); setBenchmarkStatus("idle"); }}
                    className={`py-2 px-2.5 text-right rounded-xl border text-[9.5px] font-semibold transition cursor-pointer ${promptFocus === "ai" ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  >
                    🤖 هوشمندسازی با Gemini
                  </button>
                  <button 
                    onClick={() => { setPromptFocus("firebase"); setBenchmarkStatus("idle"); }}
                    className={`py-2 px-2.5 text-right rounded-xl border text-[9.5px] font-semibold transition cursor-pointer ${promptFocus === "firebase" ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  >
                    🗄️ ذخیره‌سازی ابری Firestore
                  </button>
                  <button 
                    onClick={() => { setPromptFocus("security"); setBenchmarkStatus("idle"); }}
                    className={`py-2 px-2.5 text-right rounded-xl border text-[9.5px] font-semibold transition cursor-pointer ${promptFocus === "security" ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  >
                    🛡️ امنیت و اصلاح استیت‌ها
                  </button>
                </div>
              </div>

              {/* Custom notes input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-600 block">۲. توضیحات یا ویژگی‌های اضافه کایزن (اختیاری):</label>
                <textarea
                  value={customNotes}
                  onChange={(e) => { setCustomNotes(e.target.value); setBenchmarkStatus("idle"); }}
                  placeholder="مثال: دکمه صادر کردن اکسل، تنظیم رنگ گرادینت تیره، مهار رندر مجدد کامپوننت..."
                  className="w-full h-16 p-2 text-right text-xs bg-slate-50 border border-slate-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-650"
                />
              </div>

              {/* Simulation/Search block */}
              <button
                id="module-registry-benchmark-btn"
                onClick={() => handleSimulateBenchmark(selectedModule)}
                disabled={benchmarkStatus === "scanning"}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white py-2.5 rounded-xl font-black text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                {benchmarkStatus === "scanning" ? (
                  <>
                    <RefreshCw size={13} className="animate-spin text-emerald-400" />
                    <span>جستجو و برقراری سنجش کنه کایزن...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} className="text-amber-400 animate-pulse" />
                    <span>بررسی کدهای مشابه و تحلیل گوگل</span>
                  </>
                )}
              </button>

              {/* Code output showing the generated prompt ready for copy */}
              {benchmarkStatus === "ready" && (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 font-mono">STATION-PROMPT READY</span>
                    <button
                      onClick={() => handleCopyToClipboard(buildPromptText(selectedModule))}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[9px] font-black flex items-center gap-1 transition"
                    >
                      {copied ? (
                        <>
                          <Check size={11} className="text-emerald-500" />
                          <span>کپی شد!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} />
                          <span>کپی متون پرامپت</span>
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    readOnly
                    value={buildPromptText(selectedModule)}
                    className="w-full h-44 p-2 text-right font-mono text-[10px] leading-relaxed bg-slate-950 text-emerald-400 rounded-xl border border-slate-900 resize-none select-all outline-none"
                  />
                  <span className="text-[9px] text-slate-400 text-center font-bold block">
                    🚀 این پرامپت را کپی کرده و به دستیار هوش فریم‌ورک بدهید تا ماژول را برایتان بسازد.
                  </span>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-200 p-8 text-center space-y-3 shadow-inner">
              <div className="mx-auto w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                <Cpu className="text-slate-400 animate-pulse" size={18} />
              </div>
              <h5 className="text-xs font-black text-slate-700">انتخاب ماژول فعال جهت پردازش</h5>
              <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                لطفاً برای تولید هوش‌پژوهانه و بهینه‌سازی هر ماژول، روی دکمه «ایجاد پرامپت توسعه» در جدول روبرو کلیک کنید.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
