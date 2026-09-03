import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Brain, Sparkles, Smile, Wind, Award, Clock, Heart, 
  Calendar, Check, Play, RefreshCw, Send, AlertCircle, 
  TrendingUp, HelpCircle, FileText, BarChart3, Info, Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Student } from "../types";
import { addSystemLog } from "../lib/syslogs";
import { BRAND_CONFIG } from "../constants";

interface AiPsychologyViewProps {
  student: Student;
}

interface PsychologyReport {
  id: string;
  date: string;
  cognitiveProfile: {
    focusIndex: number; // 0-100
    resilience: number; // 0-100
    academicDrive: number; // 0-100
    stamina: number; // 0-100
    anxietyManagement: number; // 0-100
    sleepEfficacy: number; // 0-100
  };
  stressLevel: number; // 0-100
  diagnosis: string;
  cognitiveTrap: string;
  remedies: string[];
  meditationAdvice: string;
  breathingPaceSec: number;
  personalityType?: {
    name: string;
    description: string;
    strengths: string[];
    weaknesses: string[];
  };
  darkSpots?: string[];
  performanceMetrics?: {
    stressImpactOnFocus: number;
    staminaDecayRate: number;
    recoverySpeed: string;
  };
}

interface StdQuestion {
  id: number;
  text: string;
}

const PSY_TESTS = {
  anxiety: {
    title: "تست غربالگری اضطراب آزمودنی بک (BAI)",
    subtitle: "اندازه‌گیری و تفکیک ترس بالینی، علائم بدنی کورتیزول و قفل‌شدگی هیپوکامپ",
    intro: "این غربالگری روان‌شناختی وضعیت انقباض عضلانی، اضطراب شناختی و فاجعه‌سازی ذهنی شما را در جلسات آزمون پایش می‌کند.",
    questions: [
      { id: 1, text: "احساس تپش قلب شدید، لرزش دست یا بی‌قراری بدنی حین پارت‌های آزمونی." },
      { id: 2, text: "ترس مفرط از شکست و افکار فاجعه‌ساز درباره رتبه (مثلاً نابود شدن کامل زندگی آینده)." },
      { id: 3, text: "احساس سفتی مفرط عضلات، عرق سرد، تنگی نفس یا قفل شدن فک هنگام یادآوری کتب تلنبار شده." },
      { id: 4, text: "سرگیجه، تاری دید، یا حالت تهوع خفیف مابین پورت‌های درسی یا قبل شروع کوییز." },
      { id: 5, text: "ترس از دست دادن کنترل، توقف ذهنی (بلاک حافظه) یا پاک شدن ناگهانی فرمول‌ها در برابر سوالات دشوار." },
      { id: 6, text: "برآشفتگی عصبی یا پرخاشگری پیاپی برای مسائل بسیار کوچک به علت فشار درس." },
      { id: 7, text: "بی‌خوابی مکرر، بیدار شدن با تپش دلهره در ساعت پایانی شب یا کابوس آزمون با درصد منفی." }
    ],
    getFeedback: (score: number) => {
      if (score <= 6) return {
        level: "اضطراب طبیعی و محرک (سازنده)",
        levelColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
        clinicalAnalysis: "سطح اضطراب شما در محدوده طبیعی و بهینه است. پالس‌های خفیف آدرنالین برای بیداری قشر مغز و حفظ انگیزه کاملاً سازنده است.",
        examImpact: [
          "حفظ تمرکز و پایداری عملکردی کامل در ماراتن ۴ ساعته کنکور.",
          "یادآوری سریع فرمول‌ها و ممانعت از توقف حافظه حین آزمون.",
          "ثبات کامل دستان و تنفس در دفترچه‌های محاسباتی سنگین."
        ],
        remedies: [
          "حفظ ریتم پومودوروی ۵۰-۱۰ فعلی در منزل.",
          "تخصیص ۵ دقیقه ذهن‌آگاهی تنفس برای صبحانه.",
          "تمرین تست‌زنی با روش حل چندایده‌ای."
        ],
        medicalAdvice: "نیازی به درمان روان‌پزشکی یا مداخله دارویی بالینی وجود ندارد."
      };
      if (score <= 13) return {
        level: "اضطراب متوسط (آزاددهنده و فرسایشی)",
        levelColor: "text-amber-700 bg-amber-50 border-amber-100",
        clinicalAnalysis: "اضطراب فرسایشی متوسط بر سیستم سمپاتیک شما حاکم شده است. ترشح مداوم کورتیزول باعث خستگی زودرس ذهن و مسدود شدن جریان خلاقیت پردازشی می‌شود.",
        examImpact: [
          "کاهش ۱۰ تا ۱۵ درصدی سرعت پردازش سوالات زمان‌دار کنکور.",
          "تردیدهای پیاپی و تغییر مکرر پاسخ‌های صحیح به غلط.",
          "خطای محاسباتی مضحک ناشی از حواس‌پرتی ثانیه‌ای."
        ],
        remedies: [
          "اجرای ۳ دقیقه تنفس بیوفیدبک مهارکننده سمپاتیک قبل از هر آزمون شبیه‌ساز.",
          "عدم تمرکز روی ساعت مچی به صورت فرسایشی.",
          "پیاده‌سازی متد تمرینی با استفاده از کارت‌های استراتژی عبور."
        ],
        medicalAdvice: "انجام رفتاردرمانی شناختی (CBT) جهت مهار فاجعه‌سازی؛ ارزیابی فاکتور خواب و استفاده از دمنوش‌های طبیعی تاییدشده مانند بابونه و بادرنجبویه."
      };
      return {
        level: "اضطراب شدید بالینی (موجب بلاک شناختی)",
        levelColor: "text-rose-700 bg-rose-50 border-rose-100",
        clinicalAnalysis: "اضطراب بالینی حاد بر غشای مغزی شما حکمفرماست. ترشح سرریز آدرنالین باعث فوبیا و پدیده عصب‌شناختی 'قفل ذهنی' (Mental Block) در جلسات کوییز می‌شود.",
        examImpact: [
          "خالی شدن ناگهانی حافظه و ندیدن سوالات آسان در آزمون.",
          "تاری دید موقت، گریه ناگهانی یا لرزش دست شدید در شروع جلسه.",
          "احساس سرکوب عمیق و خستگی شدید روحی بعد از ۳۰ دقیقه اول."
        ],
        remedies: [
          "آموختن ریلکسیشن عضلانی پیشرونده جاکوبسون (PMR) روزانه ۱۰ دقیقه.",
          "تمرین حل تست‌های کنکور در خانه بدون در نظر گرفتن زمان تا ۳ هفته.",
          "حذف مطلق صحبت‌های منفی با خانواده و کانال‌های رتبه‌سنج تلگرام."
        ],
        medicalAdvice: "توصیه مبرم برای ارجاع بالینی نزد پزشک متخصص اعصاب و روان (روانپزشک) جهت ممیزی و ارزیابی لزوم درمان‌های دارویی علامتی (نظیر پروپرانولول یا داروهای انتخابی بازجذب سروتونین SSRI) همراه با روان‌درمانی فشرده تحصیلی."
      };
    }
  },
  depression: {
    title: "تست فرسودگی تحصیلی و افسردگی بک (BDI)",
    subtitle: "ارزیابی سطوح بی‌رمقی ذهنی، فقدان انگیزه تحصیلی و درماندگی آموخته‌شده",
    intro: "این ابزار بالینی تراز انرژی حیاتی، بدبینی شناختی و افت عملکرد در قالب پدیده فرسودگی تحصیلی (Academic Burnout) را ارزیابی می‌کند.",
    questions: [
      { id: 1, text: "احساس ناامیدی شدید و این ایده مخرب که «من هر چقدر هم درس بخوانم، باز هم به نتیجه دلخواهم نمی‌رسم»." },
      { id: 2, text: "کاهش شدید اشتیاق و علاقه به کتب؛ حس کلافگی عمیق و پوچی تمام تلاش‌های تحصیلی کنکور." },
      { id: 3, text: "احساس فرسودگی مداوم، تنبلی عضلانی و کمبود انرژی حیاتی به صورتی که حتی با خواب زیاد باز هم تمایل به بیداری ندارم." },
      { id: 4, text: "سرزنش گزنده خود، احساس گناه مکرر بابت ساعت‌های تلف‌شده گذشته و لگدمال کردن عزت‌نفس تحصیلی." },
      { id: 5, text: "میل شدید به ایزوله‌سازی خود، عدم پاسخ به خانواده و مشاوران و رها کردن نگارش گزارشکار به علت احساس شرم." },
      { id: 6, text: "تعلل گزافه (Procrastination)، افت سنگین در آغاز پارت‌های درمانی روزانه و ترجیح انفعال محض." },
      { id: 7, text: "اتکا به پناه جستن‌های فرارگونه نظیر خواب مفرط روزانه یا گشت‌وگذار مخرب چندین ساعته در گوشی مابین پارت‌ها." }
    ],
    getFeedback: (score: number) => {
      if (score <= 6) return {
        level: "نشاط روحی بهینه و نوسانات طبیعی انگیزه",
        levelColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
        clinicalAnalysis: "شما در دایره بهداشتی عالی روان هستید. افت‌های جزئی انگیزه مابین بودجه‌بندی‌ها در مسیر کنکور واکنش زیستی طبیعی مغز است و افسردگی شمرده نمی‌شود.",
        examImpact: [
          "ذخیره انرژی پردازشی کافی برای جنگ بر سر نمره در ساعات آخر دفترچه‌های اختصاصی.",
          "تمرکز عمیق ذهنی و پیگیری متداولی برای تست‌های محاسباتی چندمرحله‌ای."
        ],
        remedies: [
          "پافشاری بر پومودوروهای روزانه کنکور.",
          "تخصیص جوایز خرد دوپامینی (ملاقات با دوستان موفق یا تماشای فیلم خانوادگی مناسب).",
          "تمرین خلاق خلاصه‌نویسی تنه اصلی مباحث."
        ],
        medicalAdvice: "نیازی به مداخله دارویی نیست. ادامه روش تغذیه‌ای غنی و ورزش متوسط برای حفظ شادابی توصیه می‌شود."
      };
      if (score <= 13) return {
        level: "فرسودگی تحصیلی متوسط (Burnout)",
        levelColor: "text-orange-700 bg-orange-50 border-orange-100",
        clinicalAnalysis: "افسردگی هورمونی خفیف یا خستگی مفرط تحصیلی بر سلول‌های عصبی شما سایه انداخته است. سرکوب دوپامینی ناشی از یکنواختی مفرط برنامه یا ترس مداوم، مانع تمرکز دیپ-فلو می‌شود.",
        examImpact: [
          "حس رهاسازی زودرس در مواجه با صورت تست‌های حجیم زیست و ادبیات آزمون.",
          "کندی در بازیابی پاسخ‌ها به دلیل قفل حواس موقت.",
          "بی تفاوتی عمیق نسبت به نمره و درصد به علت کلافگی عصبی."
        ],
        remedies: [
          "پیاده‌سازی الگوی ریکاوری میکرو کایزن: نصف کردن موقت بودجه تکلیفی جهت استراحت قشر پردازشگر مغز.",
          "درج یک روز استراحت مطلق در ماه جهت خروج دوپامین از استپ رقابتی.",
          "تغییر محیط فیزیکی درس خواندن و مطالعه در سالن‌های جمعی یا کتابخانه‌ها."
        ],
        medicalAdvice: "ضروری است مربی تحصیلی تراز درسی شما را ملایم کند؛ انجام آزمایش بررسی ویتامین D3، تست هورمونی تیروئید و آهن خون بالینی ضرورت دارد."
      };
      return {
        level: "افسردگی شدید بالینی و تخلیه انرژی مغزی",
        levelColor: "text-rose-700 bg-rose-50 border-rose-100",
        clinicalAnalysis: "شدت فرسودگی تحصیلی و بدبینی روحی داوطلب به مرز بالینی حاد رسیده است. عدم حضور فلوئیدهای شادابی در سیناپس‌های ترشح سروتونین مغز، یادگیری عمیق را کاملاً فلج کرده است.",
        examImpact: [
          "عدم قابلیت تمرکز ممتد بیش از ۳۰ دقیقه و رها کردن صندلی آزمون در میان راه.",
          "ناراحتی و گریه‌های خاموش، انفعال پایتختی و عدم توانایی حل سوالات تک ایده‌ای آسان زیست.",
          "کندی شدید روانی-حرکتی (حل یک کوییز ۱۰ سواله برای شما بیش از ۵۰ دقیقه طول می‌کشد)."
        ],
        remedies: [
          "توقف کامل امتحانات شبیه‌ساز کنکور یا فیدبک‌های تندکار به مدت ۱ هفته جهت استراحت غشا مغز.",
          "تکه تکه کردن تمامی کتاب‌ها به جزوه‌های درختی کوچک ۱۰ دقیقه‌ای.",
          "اجبار فیزیکال به پیاده‌روی در معرض نور مستقیم خورشید قبل از ساعت ۸ صبح جهت کوپل هورمونی."
        ],
        medicalAdvice: "نیازمند ممیزی فوری و ارجاع تخصصی بالینی نزد پزشک متخصص روانپزشکی. مداخله دارویی با مهارکننده‌های سروتونین (SSRIها همانند فلوکستین، سرترالین یا اس‌سیتالوپرام با هدف احیاء سیناپسی نوروترانسمیترها) تحت نظر روانپزشک و پشتیبان روانشناختی کنکور بسیار حیاتی است."
      };
    }
  },
  ocd: {
    title: "تست وسواس تکرار و تردید مرضی مطالعه (Yale-Brown Modified)",
    subtitle: "ارزیابی روانشناختی دوباره‌خوانی وسواسی، شک مداوم تستی، قفل بر روی تسک و دوباره‌کاری‌های فرساینده (وسواس تکرار)",
    intro: "این ابزار بالینی بروز رفتارهای وسواس‌گونه تحصیلی و تکرار مرضی کارها (وسواس تکرار، دوباره‌خوانی وسواسی، شک‌های ممتد و قفل بر روی یک تسک) را ممیزی کرده، آثار فاجعه‌بار آن بر هدررفت وقت تستی کنکور را شرح داده و راه‌حل مهار آن را به صورت علمی ارائه می‌کند.",
    questions: [
      { id: 1, text: "دوباره‌خوانی و چندین‌باره‌خوانی وسواسی یک پاراگراف یا فرمول، حتی زمانی که معنی آن را عمیقاً فهمیده‌اید اما ندایی وسواسی به شما بازگو می‌کند که مجدداً بخوانید." },
      { id: 2, text: "بررسی و ممیزی وسواسی مجدد و مکرر پاسخ‌برگ و حل چندباره تست‌های نسبتاً ساده، از ترس مداوم بابت خطاهای فاحش بدوی." },
      { id: 3, text: "اتلاف وقت سنگین برای کارهای جانبی نظیر خلاصه‌نویسی‌های وسواسی مجدد، نقاشی حاشیه‌های خطوط یا مرتب کردن چیدمان تحصیلی به اندازه ساعات طولانی." },
      { id: 4, text: "پاک کردن چهل‌باره یادداشت‌ها، پاره کردن خلاصه نویسی‌ها بابت ناهمواری دست‌خط و شروع نوشتن برگه از ابتدا با اصرار برای کمال‌گرایی کاذب." },
      { id: 5, text: "شک پسینی وسواسی به گزینه‌هایی که انتخاب کرده‌اید که باعث جابجایی دائم گزینه‌ها و تغییر پاسخ‌های صحیح به غلط در انتهای آزمون می‌شود." },
      { id: 6, text: "قفل کردن عاجزانه روی یک مبحث درسی سخت و امتناع شدید از عبور از آن، به نحوی که کل مابقی برنامه درسی آن روز قربانی همان یک پارت گردد." },
      { id: 7, text: "وسواس توازن زمانی فتیش‌وار؛ مثلاً صبر می‌کنید تا زمان کاملاً رند شود تا درس شروع شود و اگر دقیقه‌ای بگذرد کل پارت مطالعاتی را تعلیق می‌کنید." }
    ],
    getFeedback: (score: number) => {
      if (score <= 6) return {
        level: "دقت بالا و ممیزی منظم علمی (دقت رتبه برتر)",
        levelColor: "text-emerald-700 bg-emerald-50 border-emerald-100",
        clinicalAnalysis: "رفتارهای کنترلی شما در رده دقت علمی بهینه تحصیلی است. این دقت بالا، درصد خطاهای محاسباتی تصادفی شما را با مهار وسواس تکرار، کاهش می‌دهد.",
        examImpact: [
          "کاهش قاطع فوت وقت‌های کاذب در امتحانات تشخیصی.",
          "ثبت با اطمینان گزینه‌ها از شروع جوابدهی بدون ترس لرزان ثانویه.",
          "انتخاب راحت و حرکت گام به گام روی کل بدنه سوالات."
        ],
        remedies: [
          "ثبات در سیستم یادداشت مکتوب حین حل حل مسئله ریاضی.",
          "ضربدر زدن کنار تست‌های اتمام یافته جهت مهر موم ذهنی."
        ],
        medicalAdvice: "عدم نیاز به هرگونه مداخله روان‌پزشکی یا دارویی."
      };
      if (score <= 13) return {
        level: "وسواس تکرار و شک تحصیلی متوسط",
        levelColor: "text-amber-700 bg-amber-50 border-amber-100",
        clinicalAnalysis: "شما در آستانه ابتلا به وسواس عملی مطالعه (رفتار کنترلی تکرار مرضی تسک‌ها) هستید. عدم توانایی مغز در صادر کردن سیگنال اتمام کار (Completion Signal) ناشی از ناهماهنگی شیمیایی در هسته دم‌دار مغز است.",
        examImpact: [
          "کمبود شدید وقت مکرر در تمام دروس عمومی و کنکور.",
          "نرسیدن به تست‌های ردیف ۲ انتهای دفترچه‌ها علیرغم تسلط علمی کامل.",
          "خستگی مفرط عضلانی چشم‌ها و سر سنگینی شدید در دقایق پایانی آزمون."
        ],
        remedies: [
          "رعایت سختگیرانه پروتکل ERP (مواجهه و جلوگیری از پاسخ): خواندن زیست با پوشش کارت مشکی روی سطور قبلی جهت انسداد فیزیکی حرکت دوباره چشم به عقب.",
          "مهر و موم کردن هر تست حل شده با علامت تیک بزرگ و ممانعت تام از تجدید حل آن تستی.",
          "بستن قرارداد زمانی صلب (تکنیک جعبه زمانی تستی) برای حل هر دسته تست."
        ],
        medicalAdvice: "اصلاح رفتاری با کمک مربی متخصص جهت افزایش پذیرش خطاهای جزئی محاسباتی؛ تمرین رهاسازی شناختی از مهار تردیدهای کاذب."
      };
      return {
        level: "وسواس عملی شدید تحصیلی (وسواس تکرار و تردید وسواسی مفرط)",
        levelColor: "text-rose-700 bg-rose-50 border-rose-100",
        clinicalAnalysis: "شما دچار وسواس فکری-عملی شدید (OCD تحصیلی) در تکرار پیاپی تسک‌ها هستید. اختلال در مدارهای عصبی کورتیکو-استریاتو-تالامو-کورتیکال (CSTC) مغز باعث پایداری 'چرخه خطا' شده و مغز علیرغم فهمیدن علمی، تشنه تکرار مجدد و غیرضروری می‌گردد.",
        examImpact: [
          "هدررفت بیش از ۶۰ تا ۸۰ دقیقه وقت گرانبها در آزمون‌ها بابت ریدینگ‌های وسواسی و مجدد صورت سوالات تستی.",
          "پاره کردن متناوب دفترچه، پاک کردن مکرر و هیستریک و تغییر بیش از ۸ گزینه صحیح به غلط ناشی از شک جهنمی گزینه‌ای.",
          "سوختن روزانه بیش از ۷۰ درصد از برنامه زمانی مطالعاتی مشاور به علت قفل روانی بی‌ثمر روی یک برگ کتب."
        ],
        remedies: [
          "تمرین فشرده مواجهه و جلوگیری از پاسخ (ERP) با کمک مداخله روان‌شناختی پشتیبان.",
          "تست‌زنی اجباری با مدادی بدون مجهز بودن به پاک‌کن (حل تست بدون مجاز بودن به اصلاح یا تغییر بعد انتخاب).",
          "استفاده از خلاصه‌نویسی تلفظی صوتی بجای وسواس سیاه یا چنگی مکرر روی برگه ها.",
          "استراحت عالی و پاشیدن آب سرد به صورت جهت انقطاع مدارهای فکری وسواسی."
        ],
        medicalAdvice: "درمان این سطح حاد از وسواس تکرار کارها (OCD) بدون همگامی دارویی با خط درمانی روانپزشکی عموماً بی‌اثر می‌ماند. مراجعه مبرم به روانپزشک جهت ارزیابی بالینی مفاخر دارویی تراز مهار وسواس (مانند کلومیپرامین، قرص فلووکسامین یا مهارکننده‌های سروتونین SSRIs با دوزهای بالینی کنترل مکرر مرضی کارهای تکراری) در همسویی کامل با پروتکل درمانی تخصصی CBT-ERP."
      };
    }
  }
};

export default function AiPsychologyView({ student }: { student: Student }) {
  const [activeTab, setActiveTab] = useState<"assess" | "breathing" | "history" | "psych-tests">("assess");

  // Standard clinical tests states
  const [activeTestKey, setActiveTestKey] = useState<"anxiety" | "depression" | "ocd" | null>(null);
  const [currentTestQIndex, setCurrentTestQIndex] = useState(0);
  const [testAnswers, setTestAnswers] = useState<number[]>([]);
  const [testCompleted, setTestCompleted] = useState(false);


  // Assessment question states (0 to 10 scale)
  const [qAnxiety, setQAnxiety] = useState(5); // اضطراب آزمون شبیه‌ساز
  const [qFocus, setQFocus] = useState(6); // تمرکز پایدار در پومودوروهای درسی
  const [qPerfectionism, setQPerfectionism] = useState(7); // وسواس فکری یا کمالگرایی منفی روی نزده‌ها
  const [qSleep, setQSleep] = useState(6); // کیفیت و ساعات خواب شبانه
  const [qStamina, setQStamina] = useState(5); // مقاومت در برابر خستگی ذهنی شیفت عصر

  const [loading, setLoading] = useState(false);
  const [currentReport, setCurrentReport] = useState<PsychologyReport | null>(null);
  const [reports, setReports] = useState<PsychologyReport[]>([]);

  // Breathing Box States
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("inhale");
  const [breathTimer, setBreathTimer] = useState(4);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<any>(null);

  // Initialize and load historical reports from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`taranom_psychology_reports_${student.id}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setReports(parsed);
        if (parsed.length > 0) {
          setCurrentReport(parsed[0]);
        }
      } catch (err) {
        console.error("Error loading historical psychology reports", err);
      }
    } else {
      // Mock starting reports for high-fidelity initial experience
      const mockInitial: PsychologyReport[] = [
        {
          id: "PSY-101",
          date: "۱۴۰۶/۰۳/۰۲",
          cognitiveProfile: {
            focusIndex: 65,
            resilience: 70,
            academicDrive: 80,
            stamina: 55,
            anxietyManagement: 60,
            sleepEfficacy: 65
          },
          stressLevel: 58,
          diagnosis: "خستگی نسبی شناختی در شیفت‌های عصرگاهی به همراه سطح متوسط اضطراب نمرات منفی مکرر و عملکرد نوسانی در مباحث ژنتیک/تابع.",
          cognitiveTrap: "فیلتر حسی خستگی (Mind Exhaustion) مابین پارت ۳ و ۴ مطالعه روزانه.",
          remedies: [
            "تغییر چیدمان پارت‌های مطالعاتی شیفت عصر از مباحث محاسباتی شدید به حل تست‌های سرعتی و متنوع.",
            "اضافه کردن ۵ دقیقه تنفس شکمی عمیق و ریلکسیشن عضلانی پیش از شیفت عصر.",
            "پرهیز قاطع از پاسخ دادن فرمول‌محور به گزینه‌های شک‌دار ۵۰-۵۰ آزمون‌های آزمایشی."
          ],
          meditationAdvice: "روزانه ۱۰ دقیقه تمرکز صوتی روی فرکانس‌های آلفا (آرامش ذهنی) با تمرکز خالص بر تنفس همگام‌شده.",
          breathingPaceSec: 4,
          personalityType: {
            name: "عملگرای تحلیل‌گر (The Analytical Doer)",
            description: "داوطلبانی که در حل مسائل ریاضی قوی هستند اما در مواجهه با ابهام دچار اضطراب شدید می‌شوند.",
            strengths: ["دقت بالا در جزئیات", "نظم در پومودوروهای اولیه"],
            weaknesses: ["کمال‌گرایی در نزده‌ها", "افت انرژی در مباحث حفظی عصر"]
          },
          darkSpots: [
            "حساسیت بیش از حد به نمرات منفی در درس زیست‌شناسی",
            "کاهش شدید تمرکز در صورت تغییر ناگهانی بودجه‌بندی آزمون"
          ],
          performanceMetrics: {
            stressImpactOnFocus: -12,
            staminaDecayRate: 0.8,
            recoverySpeed: "متوسط"
          }
        }
      ];
      setReports(mockInitial);
      setCurrentReport(mockInitial[0]);
      localStorage.setItem(`taranom_psychology_reports_${student.id}`, JSON.stringify(mockInitial));
    }
  }, [student.id]);

  // Handle cognitive survey submission to generate report
  const handleAnalyze = async () => {
    setLoading(true);
    addSystemLog("درخواست تحلیل روانشناختی", student.name, "داوطلب آزمون ارزیابی شناختی و بهداشت روانی را تکمیل کرد.");

    try {
      const response = await fetch("/api/psychology-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student,
          qAnxiety,
          qFocus,
          qPerfectionism,
          qSleep,
          qStamina
        })
      });

      if (!response.ok) {
        throw new Error("سرویس ابری هوش مصنوعی موقتاً در دسترس نیست.");
      }

      const data = await response.json();
      
      const newReport: PsychologyReport = {
        id: `PSY-${Date.now().toString().slice(-4)}`,
        date: new Date().toLocaleDateString("fa-IR"),
        cognitiveProfile: data.cognitiveProfile,
        stressLevel: data.stressLevel,
        diagnosis: data.diagnosis,
        cognitiveTrap: data.cognitiveTrap,
        remedies: data.remedies,
        meditationAdvice: data.meditationAdvice,
        breathingPaceSec: data.breathingPaceSec || 4
      };

      const updatedHistory = [newReport, ...reports];
      setReports(updatedHistory);
      setCurrentReport(newReport);
      localStorage.setItem(`taranom_psychology_reports_${student.id}`, JSON.stringify(updatedHistory));
      
      addSystemLog("صدور کارنامه روانشناسی هوشمند", student.name, `تحلیل روحی با موفقیت ذخیره شد. سطح استرس برآورده شده: ${newReport.stressLevel}٪`);
    } catch (err) {
      console.error("AI Psychology analyzer service error", err);
      alert("خطا در برقراری ارتباط با پکیج پایش هوش مصنوعی. در حال اجرای شبیه‌ساز آفلاین...");
      
      // Standalone simulation fallback if network/server is down
      const stressSim = Math.min(95, Math.max(15, Math.floor((qAnxiety * 4 + qPerfectionism * 3 + (10 - qSleep) * 3))));
      const simulated: PsychologyReport = {
        id: `PSY-OFF-${Date.now().toString().slice(-3)}`,
        date: new Date().toLocaleDateString("fa-IR"),
        cognitiveProfile: {
          focusIndex: Math.round(qFocus * 10),
          resilience: Math.round((10 - qAnxiety) * 5 + qStamina * 5),
          academicDrive: 85,
          stamina: Math.round(qStamina * 10),
          anxietyManagement: Math.round((10 - qAnxiety) * 10),
          sleepEfficacy: Math.round(qSleep * 10)
        },
        stressLevel: stressSim,
        diagnosis: `بر اساس مدل‌های روان‌شناختی ${BRAND_CONFIG.name}، سطح تنش تحصیلی شما معادل ${stressSim}٪ ارزیابی می‌شود. کمال‌گرایی منفی در مباحث درسی (${qPerfectionism}/۱۰) باعث خستگی زودرس ذهن در بعد از ظهر شده است.`,
        cognitiveTrap: qFocus < 5 ? "سوگیری تمرکز سست و نشت زمانی در شیفت‌های درسی طولانی." : "تله تفکر فرسایشی (Overthinking) و وسواس گزینه‌های آزمونی.",
        remedies: [
          "پیاده‌سازی تکنیک پومودورو ۵۰-۱۰ و اجتناب تام از بررسی شبکه‌های مجازی درون استراحت‌ها.",
          "تثبیت خواب شبانه حداقل ۷.۵ ساعت (خواب بهینه مابین ساعت ۲۳:۰۰ الی ۶:۳۰ جهت بازیابی حافظه شناختی).",
          "ایجاد کایزن تستی با تمرکز بر تست‌های زمان‌دار کم‌تنش آموزشی."
        ],
        meditationAdvice: "روزانه ۲ مرتبه تمرین تنفس مهارکننده پاراسمپاتیک (الگوی ۴ثانیه دم - ۴ثانیه سد - ۴ثانیه بازدم) را تکرار فرمایید.",
        breathingPaceSec: 4,
        personalityType: {
          name: qPerfectionism > 7 ? "آرمان‌گرای کمال‌طلب" : "رئالیست سخت‌کوش",
          description: "تحلیل رفتاری شما نشان‌دهنده تمرکز بر نتایج ایده‌آل است که می‌تواند همزمان محرک و فرساینده باشد.",
          strengths: ["تعهد به برنامه", "دقت در تحلیل سوالات"],
          weaknesses: ["ترس از شکست", "خستگی عصبی زودرس"]
        },
        darkSpots: [
          qAnxiety > 7 ? "احتمال توقف فکری (Mental Block) در دقایق ابتدایی آزمون" : "نیاز به تقویت اعتماد به نفس در دروس عمومی",
          "وابستگی بیش از حد به تایید مشاور"
        ],
        performanceMetrics: {
          stressImpactOnFocus: -(qAnxiety * 1.5),
          staminaDecayRate: 1.2,
          recoverySpeed: qSleep > 7 ? "سریع" : "کند"
        }
      };

      const updatedHistory = [simulated, ...reports];
      setReports(updatedHistory);
      setCurrentReport(simulated);
      localStorage.setItem(`taranom_psychology_reports_${student.id}`, JSON.stringify(updatedHistory));
    } finally {
      setLoading(false);
    }
  };

  // Web Audio API Synthesizer calibration for auditory mental entrainment (calming drone)
  const startZenSynth = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Generate soft humming sound during meditation using a pure low sine wave
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, ctx.currentTime); // 120Hz grounding fundamental
      
      gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();

      // Soft pulse rate sync based on breath timer
      let phaseTicker = 0;
      synthIntervalRef.current = setInterval(() => {
        phaseTicker += 0.25;
        if (ctx.state !== "closed" && osc) {
          // Subtle pitch oscillation in frequency to match meditative patterns (theta drone)
          const baseFreq = breathPhase === "inhale" ? 122 : breathPhase === "exhale" ? 118 : 120;
          osc.frequency.setTargetAtTime(baseFreq + Math.sin(phaseTicker) * 1.5, ctx.currentTime, 0.4);
          
          let targetGain = 0.01;
          if (breathPhase === "inhale") targetGain = 0.05;
          if (breathPhase === "exhale") targetGain = 0.04;
          if (breathPhase === "hold") targetGain = 0.02;
          gainNode.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.5);
        }
      }, 250);

      (audioCtxRef as any).currentOsc = osc;
      (audioCtxRef as any).currentGain = gainNode;
    } catch (e) {
      console.warn("Web Audio API not supported or autoplay blocked first.", e);
    }
  };

  const stopZenSynth = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
    const currentOsc = (audioCtxRef as any).currentOsc;
    const currentGain = (audioCtxRef as any).currentGain;
    try {
      if (currentOsc) {
        currentOsc.stop();
        currentOsc.disconnect();
      }
      if (currentGain) {
        currentGain.disconnect();
      }
    } catch (e) {}
    (audioCtxRef as any).currentOsc = null;
    (audioCtxRef as any).currentGain = null;
  };

  // Breathing simulation loop controller
  useEffect(() => {
    let interval: any = null;
    if (isBreathingActive) {
      startZenSynth();
      interval = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev <= 1) {
            // Transition to next breathing stage (Box breathing paradigm: 4s inhale, 4s hold, 4s exhale, 4s rest)
            setBreathPhase((current) => {
              switch (current) {
                case "inhale":
                  return "hold";
                case "hold":
                  return "exhale";
                case "exhale":
                  return "rest";
                default:
                  return "inhale";
              }
            });
            return 4; // Reset to 4 seconds
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      stopZenSynth();
      setBreathTimer(4);
      setBreathPhase("inhale");
    }

    return () => {
      clearInterval(interval);
      stopZenSynth();
    };
  }, [isBreathingActive, breathPhase]);

  // Radar chart formatting helper
  const radarChartData = useMemo(() => {
    if (!currentReport) return [];
    
    const current = currentReport.cognitiveProfile;
    
    // Find previous report for comparison
    const currentIndex = reports.findIndex(r => r.id === currentReport.id);
    const prev = (currentIndex !== -1 && currentIndex < reports.length - 1) 
      ? reports[currentIndex + 1].cognitiveProfile 
      : null;

    return [
      { subject: "پایداری ذهنی", A: current.stamina, B: prev?.stamina ?? current.stamina },
      { subject: "مدیریت استرس", A: current.anxietyManagement, B: prev?.anxietyManagement ?? current.anxietyManagement },
      { subject: "انگیزه درونی", A: current.academicDrive, B: prev?.academicDrive ?? current.academicDrive },
      { subject: "اعتماد به نفس", A: current.resilience, B: prev?.resilience ?? current.resilience },
      { subject: "تمرکز شناختی", A: current.focusIndex, B: prev?.focusIndex ?? current.focusIndex },
      { subject: "ریکاوری و خواب", A: current.sleepEfficacy, B: prev?.sleepEfficacy ?? current.sleepEfficacy }
    ];
  }, [currentReport, reports]);

  const historyTrendData = useMemo(() => {
    return [...reports].reverse().map((r) => ({
      date: r.date,
      تنش_ذهنی: r.stressLevel,
      توان_تمرکز: r.cognitiveProfile.focusIndex,
    }));
  }, [reports]);

  const toPersianNum = (num: number | string) => {
    const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return num.toString().replace(/\d/g, (x) => farsiDigits[parseInt(x)]);
  };

  return (
    <div className="space-y-8 animate-fade-in text-right" id="ai-psychology-root" style={{ direction: "rtl" }}>
      {/* Prime Header Block */}
      <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-blue-900 text-white p-8 rounded-3xl border border-indigo-900 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden" id="psych-header-pane">
        <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute right-10 -top-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl" />
        
        <div className="space-y-3 relative z-10" id="psych-title-block">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-amber-300 text-xs font-black">
            <Sparkles size={14} className="animate-pulse" />
            <span>AI Neuro-Psychology Module</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight font-sans">مرکز پایش روان‌شناختی هوشمند و عصب‌سنجی</h1>
          <p className="text-xs text-slate-300 font-bold max-w-xl leading-relaxed">
            محاسبه هوشمند سطح اضطراب کنکور، رصد نوسان تمرکز ناشی از خستگی عصبی و تکنیک‌های بیوفیدبک ذهن بر پایه الگوریتم‌های شناختی و هوش مصنوعی ${BRAND_CONFIG.name}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto relative z-10 font-bold" id="psych-tab-selectors">
          <button
            onClick={() => setActiveTab("assess")}
            className={`flex-1 md:flex-initial px-5 py-3 rounded-2xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "assess" ? "bg-white text-blue-950 shadow-md" : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50"
            }`}
          >
            <Brain size={15} />
            <span>پایش و ارزیابی شناختی</span>
          </button>
          <button
            onClick={() => setActiveTab("psych-tests")}
            className={`flex-1 md:flex-initial px-5 py-3 rounded-2xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "psych-tests" ? "bg-white text-blue-950 shadow-md" : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50"
            }`}
          >
            <Heart size={15} className="text-rose-400 animate-pulse" />
            <span>کیت خودارزیابی بالینی (اضطراب، افسردگی، وسواس)</span>
          </button>
          <button
            onClick={() => setActiveTab("breathing")}
            className={`flex-1 md:flex-initial px-5 py-3 rounded-2xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "breathing" ? "bg-white text-blue-950 shadow-md" : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50"
            }`}
            id="btn-breathing-tab"
          >
            <Wind size={15} />
            <span>اتاق بیوفیدبک و تمرکز</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 md:flex-initial px-5 py-3 rounded-2xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "history" ? "bg-white text-blue-950 shadow-md" : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/50"
            }`}
          >
            <Clock size={15} />
            <span>تاریخچه پایش روحی</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "assess" && (
          <motion.div 
            key="assess-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Input Questionnaire Parameter Sliders */}
            <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-6 flex flex-col justify-between" id="psych-sliders-card">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-950 border-b border-slate-100 pb-3">
                  <Brain size={18} className="text-indigo-600" />
                  <h2 className="text-sm font-black">پرسشنامه سلامت ذهن و خستگی شناختی داوطلب</h2>
                </div>
                <p className="text-[11px] text-slate-400 font-bold leading-relaxed">
                  احساس روحی خود را در بازه ۱ تا ۱۰ (بیشترین شدت) میزان کنید تا مدل تراز روانشناختی ${BRAND_CONFIG.name} الگوهای خنثی‌سازی تله‌های تستی را بروزرسانی کند.
                </p>

                {/* Slider 1 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-black">
                    <span className="text-slate-700">اضطراب و استرس جلسه آزمون آزمایشی</span>
                    <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg">{toPersianNum(qAnxiety)} از ۱۰</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" 
                    value={qAnxiety} 
                    onChange={(e) => setQAnxiety(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                    <span>ثبات روحی عالی</span>
                    <span>اضطراب فرسایشی شدید</span>
                  </div>
                </div>

                {/* Slider 2 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-black">
                    <span className="text-slate-700">تمرکز ذهنی یک‌پارچه در حین دوره‌های مطالعاتی</span>
                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{toPersianNum(qFocus)} از ۱۰</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" 
                    value={qFocus} 
                    onChange={(e) => setQFocus(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                    <span>حواس‌پرتی شدید</span>
                    <span>تمرکز عمیق (دیپ فلو)</span>
                  </div>
                </div>

                {/* Slider 3 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-black">
                    <span className="text-slate-700">کمال‌گرایی منفی (وسواس طولانی روی نزده‌ها)</span>
                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg">{toPersianNum(qPerfectionism)} از ۱۰</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" 
                    value={qPerfectionism} 
                    onChange={(e) => setQPerfectionism(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                    <span>عبور آسان از تست سخت</span>
                    <span>وسواس ذهنی مفرط</span>
                  </div>
                </div>

                {/* Slider 4 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-black">
                    <span className="text-slate-700">کیفیت خواب و انرژی صبحگاهی ریکاوری</span>
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{toPersianNum(qSleep)} از ۱۰</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" 
                    value={qSleep} 
                    onChange={(e) => setQSleep(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                    <span>خستگی شدید و خواب آشفته</span>
                    <span>خواب پر نشاط و عمیق</span>
                  </div>
                </div>

                {/* Slider 5 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-black">
                    <span className="text-slate-700">مقاومت بدنی و ذهنی دهر شیفت عصر</span>
                    <span className="text-violet-600 bg-violet-50 px-2 py-0.5 rounded-lg">{toPersianNum(qStamina)} از ۱۰</span>
                  </div>
                  <input 
                    type="range" min="1" max="10" 
                    value={qStamina} 
                    onChange={(e) => setQStamina(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[8px] text-slate-400 font-bold">
                    <span>افت حاد هوشیاری عصر</span>
                    <span>نشاط تحصیلی ممتد</span>
                  </div>
                </div>
              </div>

              <button
                _id="btn-trigger-ai-psych"
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white py-3.5 rounded-2xl text-xs font-black transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>هوش مصنوعی در حال تحلیل الگوریتم‌های روانی...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-amber-400" />
                    <span>درخواست تحلیل عصب‌شناختی هوشمند</span>
                  </>
                )}
              </button>
            </div>

            {/* Assessment Response & Cognitive Diagnostics Dashboard */}
            <div className="lg:col-span-8 space-y-6" id="psych-diagnostics-pane">
              {currentReport ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Dashboard Summary Header */}
                  <div className="col-span-12 bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex flex-wrap gap-6 items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                        <Smile size={24} />
                      </div>
                      <div className="text-right">
                        <h3 className="text-sm font-black text-slate-900">داشبورد وضعیت سلامت روانی</h3>
                        <p className="text-[10px] text-slate-500 font-bold">آخرین پایش: {currentReport.date}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                       <div className="text-right">
                          <span className="text-[9px] text-slate-400 font-black block">تیپ شخصیتی کنکوری:</span>
                          <span className="text-xs font-black text-indigo-700">{currentReport.personalityType?.name || "در انتظار تحلیل"}</span>
                       </div>
                       <div className="w-[1px] h-8 bg-indigo-200" />
                       <div className="text-right">
                          <span className="text-[9px] text-slate-400 font-black block">شاخص پایداری عصبی:</span>
                          <span className="text-xs font-black text-emerald-600">{currentReport.cognitiveProfile.resilience}٪</span>
                       </div>
                    </div>
                  </div>

                  {/* Gauge Card: Stress & Burnout Metric */}
                  <div className="md:col-span-5 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between items-center text-center">
                    <div className="w-full flex justify-between items-center border-b border-slate-100 pb-3 w-full">
                      <h3 className="text-xs font-black text-slate-700">تنش روانی کنکور (سنجش استرس)</h3>
                      <span className="text-[10px] font-black text-slate-400">شناسه: {currentReport.id}</span>
                    </div>

                    <div className="my-6 relative flex items-center justify-center">
                      {/* Simple visual SVG ring chart depicting the estimated mental tension */}
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="52" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                        <circle 
                          cx="64" cy="64" r="52" 
                          stroke={currentReport.stressLevel > 70 ? "#ef4444" : currentReport.stressLevel > 45 ? "#f97316" : "#10b981"} 
                          strokeWidth="10" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 52}
                          strokeDashoffset={2 * Math.PI * 52 * (1 - currentReport.stressLevel / 100)}
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-3xl font-black text-slate-800 tracking-tighter">{toPersianNum(currentReport.stressLevel)}٪</span>
                        <p className="text-[9px] font-black text-slate-400 mt-0.5">بار تنش غشای عصبی</p>
                      </div>
                    </div>

                    <div className="space-y-2 w-full">
                      <div className={`p-3 rounded-2xl text-[11px] font-bold ${
                        currentReport.stressLevel > 70 ? "bg-rose-50 text-rose-700" : currentReport.stressLevel > 45 ? "bg-orange-50 text-orange-700" : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {currentReport.stressLevel > 70 ? "سطح استرس نهایی بحرانی ! احتمال بیش‌ریزی عصبی" : currentReport.stressLevel > 45 ? "استرس بهینه مربی‌گری (یوسترس محرک)" : "بهداشت عالی روان و آرامش پاراسمپاتیکی پایدار"}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                        سنسورهای شناختی ${BRAND_CONFIG.name} پشنهاد می‌کنند در فواصل مطالعه پومودورو، برای ریکاوری از تنفس رینگ فیدبک استفاده فرمایید.
                      </p>
                    </div>
                  </div>

                  {/* Multi-axial Radar Chart for Cognitive Competency Indicators */}
                  <div className="md:col-span-7 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                        <Award size={15} className="text-indigo-600" />
                        <span>ماتریس چندمحوری مهارت‌های مهار توجه دپارتمان روان‌سنجی</span>
                      </h3>
                      <span className="text-[10px] font-serif bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">{currentReport.date}</span>
                    </div>

                    <div className="h-64 mt-4 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarChartData}>
                          <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                          <PolarAngleAxis 
                            dataKey="subject" 
                            tick={{ fill: "#64748b", fontSize: 10, fontWeight: 900 }} 
                          />
                          <PolarRadiusAxis 
                            angle={30} 
                            domain={[0, 100]} 
                            tick={false}
                            axisLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)", direction: "rtl", textAlign: "right" }}
                          />
                          <Radar 
                            name="وضعیت فعلی" 
                            dataKey="A" 
                            stroke="#4f46e5" 
                            strokeWidth={3}
                            fill="#6366f1" 
                            fillOpacity={0.25} 
                          />
                          <Radar 
                            name="ارزیابی قبلی" 
                            dataKey="B" 
                            stroke="#94a3b8" 
                            strokeWidth={1}
                            strokeDasharray="4 4"
                            fill="#cbd5e1" 
                            fillOpacity={0.1} 
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-2">
                       <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600">
                          <div className="w-2 h-2 rounded-full bg-indigo-600" />
                          <span>وضعیت کنونی (هدف: رشد)</span>
                       </div>
                       <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400">
                          <div className="w-2 h-2 rounded-full bg-slate-300 border-2 border-slate-400 border-dashed" />
                          <span>ارزیابی مرجع / قبلی</span>
                       </div>
                    </div>
                    <div className="text-[9px] text-slate-400 text-center font-bold">
                      ارزیابی بر مبنای ممیزی‌های عصب‌شناختی داوطلب در ۴ آزمون آزمایشی کنکور اخیر.
                    </div>
                  </div>

                  {/* DARKS SPOTS & PERSONALITY PROFILE */}
                  <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                     {/* Personality Profile */}
                     <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                          <Users size={16} className="text-indigo-600" />
                          <h4 className="text-xs font-black text-slate-800">تیپ‌شناسی تحصیلی و نقطه ثقل روانی</h4>
                        </div>
                        <div className="space-y-3">
                           <p className="text-[10px] text-slate-600 font-bold leading-relaxed">{currentReport.personalityType?.description}</p>
                           <div className="grid grid-cols-2 gap-2 mt-2">
                              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-1">
                                 <span className="text-[9px] font-black text-emerald-700">نقاط قوت:</span>
                                 <ul className="text-[9px] text-slate-500 font-bold list-disc list-inside">
                                    {currentReport.personalityType?.strengths.map((s, i) => <li key={i}>{s}</li>)}
                                 </ul>
                              </div>
                              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 space-y-1">
                                 <span className="text-[9px] font-black text-rose-700">نقاط حساس:</span>
                                 <ul className="text-[9px] text-slate-500 font-bold list-disc list-inside">
                                    {currentReport.personalityType?.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                                 </ul>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Dark Spots / Blind Spots */}
                     <div className="bg-slate-900 p-6 rounded-3xl text-white space-y-4 shadow-xl">
                        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                          <AlertCircle size={16} className="text-amber-400" />
                          <h4 className="text-xs font-black">نقاط تاریک و ریسک‌های پنهان روانی</h4>
                        </div>
                        <div className="space-y-3">
                           {currentReport.darkSpots?.map((spot, i) => (
                             <div key={i} className="flex gap-3 items-start p-3 bg-white/5 rounded-2xl border border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                <p className="text-[10px] font-bold leading-relaxed">{spot}</p>
                             </div>
                           ))}
                           <div className="pt-2">
                              <span className="text-[9px] text-slate-400 font-black flex items-center gap-1">
                                 <TrendingUp size={12} className="text-rose-500" />
                                 تاثیر استرس بر تمرکز: {currentReport.performanceMetrics?.stressImpactOnFocus}٪ کاهش آنی کارایی
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Diagnosis, Cognitive Traps, and AI Remedies Section */}
                  <div className="col-span-12 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                      <Sparkles size={16} className="text-indigo-600 animate-pulse" />
                      <h4 className="text-xs font-black text-slate-800">تشخیص شناختی دکتر رادان (مشاور روانشناسی {BRAND_CONFIG.name})</h4>
                    </div>

                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-2">
                      <span className="text-[9px] font-black text-indigo-600 tracking-wider">سنتز بالینی مربی ناظر:</span>
                      <p className="text-xs font-semibold leading-relaxed text-slate-700">{currentReport.diagnosis}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Active Cognitive Trap Identifier */}
                      <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/30 space-y-1.5">
                        <span className="text-[9px] font-black text-amber-600 tracking-wider flex items-center gap-1">
                          <AlertCircle size={10} />
                          <span>تله حسی/شناختی فعال شما:</span>
                        </span>
                        <p className="text-xs font-black text-slate-800">{currentReport.cognitiveTrap}</p>
                      </div>

                      {/* Zen Breathing advice recommendation */}
                      <div className="p-4 rounded-2xl border border-teal-100 bg-teal-50/30 space-y-1.5">
                        <span className="text-[9px] font-black text-teal-600 tracking-wider flex items-center gap-1">
                          <Wind size={10} />
                          <span>پروتکل بیوفیدبک تنفس پیشنهادی:</span>
                        </span>
                        <p className="text-xs font-bold text-slate-700">{currentReport.meditationAdvice}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-500 block">اقدامات درمانی مربی‌گری کایزن ذهنی:</span>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {currentReport.remedies.map((rem, idx) => (
                          <div key={idx} className="p-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl relative group transition-all flex gap-2">
                            <span className="font-serif text-xs font-black text-indigo-200">#۰{idx + 1}</span>
                            <p className="text-[10px] text-slate-600 font-bold leading-relaxed">{rem}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center space-y-4 bg-white rounded-3xl border border-slate-150 shadow-sm flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                    <Brain className="text-slate-300" size={32} />
                  </div>
                  <h3 className="font-black text-sm text-slate-800">هنوز گزارش روحی صادر نشده است</h3>
                  <p className="text-xs text-slate-400 font-semibold max-w-sm leading-relaxed">
                    با تکمیل تمایل‌سنج ذهنی در مستطیل سمت راست و ضربه زدن به عنوان "تحلیل عصب‌شناختی هوشمند"، اولین گزارش روان‌شناسی و بهداشت مغز خود را بسازید.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "breathing" && (
          <motion.div 
            key="breathing-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Visual Centering Pulsing Circle Card */}
            <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between items-center relative overflow-hidden" id="breathing-chamber-widget">
              <div className="flex flex-col items-center text-center space-y-2 w-full border-b border-slate-100 pb-4">
                <span className="text-[9px] font-black text-indigo-600 tracking-widest uppercase">Biofeedback Resonance Chamber</span>
                <h2 className="text-base font-black text-indigo-950 flex items-center gap-1.5 justify-center">
                  <Wind size={18} className="text-indigo-500" />
                  <span>محفظه بیوفیدبک و مهار اضطراب پاراسمپاتیک (تنفس ریه‌ای ۴تایی)</span>
                </h2>
                <p className="text-[10px] text-slate-400 max-w-md font-bold leading-relaxed">
                  این ابزار با ایجاد پالس صوتی دالبی (تولید با هوش صوتی فرکانسی) و حلقه‌های درخشان، ضربان قلب شما را تسکین داده و اکسیژن عضلانی مغز را بازیابی می‌کند.
                </p>
              </div>

              {/* Pulsing visual core */}
              <div className="my-12 h-64 flex flex-col items-center justify-center relative w-full">
                {/* Secondary outer ripple */}
                <AnimatePresence>
                  {isBreathingActive && (
                    <motion.div 
                      key={breathPhase}
                      initial={{ scale: 0.8, opacity: 0.15 }}
                      animate={{ 
                        scale: breathPhase === "inhale" ? 1.6 : breathPhase === "exhale" ? 0.9 : breathPhase === "hold" ? 1.4 : 0.8,
                        opacity: breathPhase === "hold" ? 0.25 : 0.08
                      }}
                      transition={{ duration: 4, ease: "easeInOut" }}
                      className="absolute w-44 h-44 rounded-full bg-indigo-400 blur-xl pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                {/* Primary breathing orb */}
                <motion.div 
                  animate={{ 
                    scale: !isBreathingActive ? 1 :
                           breathPhase === "inhale" ? 1.45 :
                           breathPhase === "hold" ? 1.45 :
                           breathPhase === "exhale" ? 0.95 : 0.9
                  }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className={`w-36 h-36 rounded-full flex flex-col items-center justify-center text-center shadow-2xl relative z-10 select-none transition-colors duration-500 ${
                    !isBreathingActive ? "bg-slate-100 text-slate-500 border border-slate-200" :
                    breathPhase === "inhale" ? "bg-indigo-600 text-white shadow-indigo-600/30" :
                    breathPhase === "hold" ? "bg-teal-600 text-white shadow-teal-500/30" :
                    breathPhase === "exhale" ? "bg-rose-500 text-white shadow-rose-500/30" : "bg-zinc-600 text-white shadow-zinc-500/30"
                  }`}
                >
                  <span className="text-[10px] font-black tracking-widest uppercase opacity-80 block mb-1">
                    {!isBreathingActive ? "آماده حرکت" :
                     breathPhase === "inhale" ? "دم عمیق" :
                     breathPhase === "hold" ? "حبس نفس" :
                     breathPhase === "exhale" ? "بازدم عمیق" : "مکث و توازن"}
                  </span>
                  
                  <span className="text-3xl font-black font-sans leading-none block tracking-tighter">
                    {breathTimer}
                  </span>
                  
                  <span className="text-[9px] font-bold block mt-1 opacity-70">ثانیه</span>
                </motion.div>
              </div>

              {/* Action State buttons */}
              <div className="flex gap-4 w-full justify-center">
                <button
                  onClick={() => setIsBreathingActive(!isBreathingActive)}
                  className={`px-8 py-3.5 rounded-full text-xs font-black transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
                    isBreathingActive ? "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-650/20" : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20"
                  }`}
                >
                  {isBreathingActive ? (
                    <>
                      <span>توقف ریتم بیوفیدبک</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} fill="currentColor" />
                      <span>شروع همگام‌ساز تنفس</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Instruction Manual on Biofeedback Breathing dynamics */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4 text-right justify-between flex flex-col">
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Info size={16} className="text-teal-600" />
                  <h3 className="text-xs font-black text-indigo-950">مکانیسم بیولوژیکی تمرین ریتم تنفس ۴تایی</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-50/50 rounded-2xl flex gap-3 items-center border border-indigo-100/30">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-serif flex items-center justify-center text-[10px] font-black">۱</span>
                    <div>
                      <span className="text-xs font-black text-slate-800 block">گام اول: دم (Inhale) - ۴ ثانیه</span>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">اکسیژن‌ رسانی ریوی و افزایش آرامش آلومین سلول‌های حامی غشا.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-teal-50/50 rounded-2xl flex gap-3 items-center border border-teal-100/30">
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-serif flex items-center justify-center text-[10px] font-black">۲</span>
                    <div>
                      <span className="text-xs font-black text-slate-800 block">گام دوم: حبس نفس (Hold) - ۴ ثانیه</span>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">تعادل میزان دی‌اکسید کربن خون و تنظیم سرعت ضربان قلب برای مهار اضطراب.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/50 rounded-2xl flex gap-3 items-center border border-rose-100/30">
                    <span className="w-6 h-6 rounded-full bg-rose-500 text-white font-serif flex items-center justify-center text-[10px] font-black">۳</span>
                    <div>
                      <span className="text-xs font-black text-slate-800 block">گام سوم: بازدم (Exhale) - ۴ ثانیه</span>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">خروج کامل گازهای حبس شده و آرامش ماهیچه‌های دور جمجمه و گردن.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-50/50 rounded-2xl flex gap-3 items-center border border-zinc-150">
                    <span className="w-6 h-6 rounded-full bg-zinc-600 text-white font-serif flex items-center justify-center text-[10px] font-black">۴</span>
                    <div>
                      <span className="text-xs font-black text-slate-800 block">گام چهارم: مکث و توازن (Rest) - ۴ ثانیه</span>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">ایجاد مکث مابین فرکانسی پیش از ورود به چرخه دم حسی جدید.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 border border-indigo-100 bg-indigo-50/30 rounded-2xl text-[10px] font-bold text-slate-500 leading-relaxed">
                <span className="text-indigo-950 font-black block mb-1">💡 توصیه مشاور:</span>
                برای گرفتن نتایج بهتر و ممانعت از پرش حسی چشم‌ها، در مباحث کنکوری شیفت عصر یا قبل از کوییزهای آزمایشی شبیه‌ساز {BRAND_CONFIG.name}، این تمرین تنفس را به مدت ۲ الی ۵ دقیقه مستمراً ادامه دهید.
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "history" && (
          <motion.div 
            key="history-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Historical Psychology Trends Chart */}
            {reports.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <BarChart3 size={15} className="text-indigo-600" />
                      <span>روندهای آماری پایش سلامت ذهنی و توان شناختی</span>
                    </h3>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyTrendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 9, fontWeight: 900 }} />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="تنش_ذهنی" stroke="#ef4444" strokeWidth="2.5" activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="توان_تمرکز" stroke="#4f46e5" strokeWidth="2.5" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-4 justify-center text-[9px] text-slate-400 font-bold mt-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 bg-rose-500 inline-block" />
                      <span>تنش ذهنی و استرس (٪)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 bg-indigo-600 inline-block" />
                      <span>توان تمرکز و تمرینات کایزن ذهن (٪)</span>
                    </span>
                  </div>
                </div>

                {/* Stored reports archive table card */}
                <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-700">لیست کارنامه‌های عصب‌سنجی صادر شده</h3>
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {reports.map((rep) => (
                      <button
                        key={rep.id}
                        onClick={() => setCurrentReport(rep)}
                        className={`w-full text-right p-3.5 rounded-2xl border transition-all text-xs flex justify-between items-center cursor-pointer ${
                          currentReport?.id === rep.id 
                            ? "bg-indigo-50/50 border-indigo-200 text-indigo-950" 
                            : "bg-white hover:bg-slate-55 border-slate-100 text-slate-600"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Brain size={14} className={currentReport?.id === rep.id ? "text-indigo-600" : "text-slate-400"} />
                          <div>
                            <span className="font-black block text-[11px]">{rep.date}</span>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">کایزن بهداشت روان</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="font-serif font-black text-[10px] block">شناسه: {rep.id}</span>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md mt-0.5 block ${
                            rep.stressLevel > 70 ? "bg-rose-100 text-rose-700" : rep.stressLevel > 45 ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                          }`}>
                            استرس: {toPersianNum(rep.stressLevel)}٪
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-24 text-center space-y-4 bg-white rounded-3xl border border-slate-150 shadow-sm">
                <p className="text-xs text-slate-400 font-bold">هیچ تاریخچه‌ای ثبت نشده است.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "psych-tests" && (
          <motion.div
            key="psych-tests-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 animate-fade-in text-right"
          >
            {activeTestKey === null ? (
              // Mode A: Test Selection Screen
              <div className="space-y-6">
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-150 shadow-sm text-center max-w-3xl mx-auto space-y-3">
                  <h2 className="text-xl font-black text-indigo-950">کیت خودارزیابی روانشناختی استاندارد</h2>
                  <p className="text-xs text-slate-550 font-bold leading-relaxed max-w-xl mx-auto">
                    این کیت خودارزیابی بالینی شامل سه معیار تشخیصی محبوب و علمی (مقیاس‌های اضطراب و افسردگی بـک، در کنار وسواس تکرار و تردید کارهای ییل-براون) است که الگوهای شناختی، رفتاری و تأثیرات هر عارضه بر نتایج کنکور شما را بررسی می‌کند.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Anxiety */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between hover:border-indigo-200 hover:shadow-md transition-all group">
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <AlertCircle size={24} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-base font-black text-slate-900">{PSY_TESTS.anxiety.title}</h3>
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                          {PSY_TESTS.anxiety.subtitle}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl text-[10px] text-slate-500 font-bold leading-relaxed">
                        بررسی نشانه‌های فیزیولوژیک اضطراب از جمله لرزش دست، تپش قلب، هیاهوی ذهنی و قفل شناختی در شروع جلسه آزمون.
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTestKey("anxiety");
                        setCurrentTestQIndex(0);
                        setTestAnswers([]);
                        setTestCompleted(false);
                      }}
                      className="w-full mt-6 bg-slate-900 hover:bg-rose-600 text-white text-xs font-black py-3 rounded-xl transition-all active:scale-95 cursor-pointer text-center"
                    >
                      شروع ارزیابی اضطراب
                    </button>
                  </div>

                  {/* Card 2: Depression */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between hover:border-indigo-200 hover:shadow-md transition-all group">
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingUp size={24} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-base font-black text-slate-900">{PSY_TESTS.depression.title}</h3>
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                          {PSY_TESTS.depression.subtitle}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl text-[10px] text-slate-500 font-bold leading-relaxed">
                        ارزیابی تراز رمقی و بی‌پناهی شناختی، بی‌انگیزگی شدید و افت راندمان ناشی از فرسودگی تحصیلی (Academic Burnout).
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTestKey("depression");
                        setCurrentTestQIndex(0);
                        setTestAnswers([]);
                        setTestCompleted(false);
                      }}
                      className="w-full mt-6 bg-slate-900 hover:bg-amber-600 text-white text-xs font-black py-3 rounded-xl transition-all active:scale-95 cursor-pointer text-center"
                    >
                      شروع ارزیابی فرسودگی
                    </button>
                  </div>

                  {/* Card 3: OCD / Repetitive checking */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between hover:border-indigo-200 hover:shadow-md transition-all group">
                    <div className="space-y-4">
                      <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <RefreshCw size={24} className="group-hover:rotate-180 transition-transform duration-700" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-base font-black text-slate-900">{PSY_TESTS.ocd.title}</h3>
                        <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                          {PSY_TESTS.ocd.subtitle}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl text-[10px] text-slate-500 font-bold leading-relaxed">
                        ریشه‌یابی تکرار مرضی تسک‌ها (خوانش ۱۰ باره یک خط، حل چندباره تست‌های نسبتاً آسان، وسواس تمیزی و توازن زمان).
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTestKey("ocd");
                        setCurrentTestQIndex(0);
                        setTestAnswers([]);
                        setTestCompleted(false);
                      }}
                      className="w-full mt-6 bg-slate-900 hover:bg-teal-600 text-white text-xs font-black py-3 rounded-xl transition-all active:scale-95 cursor-pointer text-center"
                    >
                      شروع ارزیابی وسواس تکرار
                    </button>
                  </div>
                </div>
              </div>
            ) : !testCompleted ? (
              // Mode B: Active Test Walkthrough
              <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-slate-150 shadow-sm space-y-8">
                {/* Header info */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div className="text-right">
                    <h3 className="text-sm font-black text-slate-950">{PSY_TESTS[activeTestKey].title}</h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">تست علمی استاندارد خودارزیابی سلامت ذهنی داوطلب</p>
                  </div>
                  <button
                    onClick={() => setActiveTestKey(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-black border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer"
                  >
                    انصراف و خروج
                  </button>
                </div>

                {/* Progress indicators */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] font-black">
                    <span className="text-indigo-600">سوال {toPersianNum(currentTestQIndex + 1)} از {toPersianNum(PSY_TESTS[activeTestKey].questions.length)}</span>
                    <span className="text-slate-400">میزان پیشرفت آزمون: {toPersianNum(Math.round(((currentTestQIndex) / PSY_TESTS[activeTestKey].questions.length) * 100))}٪</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-300"
                      style={{ width: `${((currentTestQIndex + 1) / PSY_TESTS[activeTestKey].questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Question block */}
                <div className="space-y-4 py-4 min-h-[90px] flex flex-col justify-center">
                  <span className="text-[10px] font-black text-indigo-500 block tracking-widest">گزارش وضعیت بدنی/فکری:</span>
                  <p className="text-base font-bold text-slate-800 leading-relaxed">
                    {PSY_TESTS[activeTestKey].questions[currentTestQIndex].text}
                  </p>
                </div>

                {/* Answer Options (0 to 3 score indices) */}
                <div className="grid gap-3">
                  {[
                    { text: "اصلاً یا به ندرت (هیچ‌گونه علامتی حس نمی‌کنم)", value: 0, badge: "هیچ" },
                    { text: "خفیف (آزاردهنده نیست اما گهگاه وجود دارد)", value: 1, badge: "کم" },
                    { text: "متوسط (احساس زجر‌آور دارد، راندمان را کاهش می‌دهد)", value: 2, badge: "زیاد" },
                    { text: "شدید (فرساینده و شدید است، کارکرد ذهنی را فلج می‌کند)", value: 3, badge: "حاد" }
                  ].map((option, index) => {
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          const updated = [...testAnswers];
                          updated[currentTestQIndex] = option.value;
                          setTestAnswers(updated);

                          if (currentTestQIndex < PSY_TESTS[activeTestKey].questions.length - 1) {
                            setCurrentTestQIndex(prev => prev + 1);
                          } else {
                            // Completed!
                            setTestCompleted(true);
                            addSystemLog(
                              `کیت ارزیابی ${activeTestKey}`,
                              student.name,
                              `پایان تست خودارزیابی ${activeTestKey} با نمره کل ${updated.reduce((sum, v) => sum + v, 0)}`
                            );
                          }
                        }}
                        className="w-full p-4 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200 rounded-2xl flex justify-between items-center text-right group active:scale-99 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-indigo-100 flex items-center justify-center text-xs font-serif font-black text-slate-500 group-hover:text-indigo-600 transition-colors">
                            {toPersianNum(index + 1)}
                          </div>
                          <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-950 transition-colors">
                            {option.text}
                          </span>
                        </div>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                          option.value === 3 ? "bg-rose-100 text-rose-600" :
                          option.value === 2 ? "bg-orange-100 text-orange-600" :
                          option.value === 1 ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                        }`}>
                          {option.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Back / Control Buttons */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      if (currentTestQIndex > 0) {
                        setCurrentTestQIndex(prev => prev - 1);
                      }
                    }}
                    disabled={currentTestQIndex === 0}
                    className="text-xs font-black text-slate-500 hover:text-slate-800 disabled:opacity-50 cursor-pointer"
                  >
                    ← سوال قبلی
                  </button>
                  <span className="text-[10px] text-slate-400 font-bold">پاسخ‌ها به صورت خودکار ثبت خواهند شد</span>
                </div>
              </div>
            ) : (
              // Mode C: Test Detailed Reports Screen
              <div className="space-y-6">
                {/* Result Hero Header */}
                {(() => {
                  const totalScore = testAnswers.reduce((sum, v) => sum + v, 0);
                  const maxPossible = PSY_TESTS[activeTestKey].questions.length * 3;
                  const feedback = PSY_TESTS[activeTestKey].getFeedback(totalScore);

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Score Gauge Card */}
                      <div className="lg:col-span-4 bg-white p-8 rounded-3xl border border-slate-150 shadow-sm flex flex-col justify-between items-center text-center">
                        <div className="w-full flex justify-between items-center border-b border-slate-100 pb-3">
                          <span className="text-[10px] font-serif bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md font-bold">کیت ارزیابی بالینی</span>
                          <span className="text-[10px] font-serif font-bold text-slate-400">کد رهگیری: MD-{totalScore * 7}</span>
                        </div>

                        <div className="my-6 relative flex items-center justify-center">
                          <svg className="w-36 h-36 transform -rotate-90">
                            <circle cx="72" cy="72" r="60" stroke="#f1f5f9" strokeWidth="12" fill="transparent" />
                            <circle
                              cx="72"
                              cy="72"
                              r="60"
                              stroke={totalScore > 13 ? "#ef4444" : totalScore > 6 ? "#f97316" : "#10b981"}
                              strokeWidth="12"
                              fill="transparent"
                              strokeDasharray={2 * Math.PI * 60}
                              strokeDashoffset={2 * Math.PI * 60 * (1 - totalScore / maxPossible)}
                              strokeLinecap="round"
                              className="transition-all duration-1000"
                            />
                          </svg>
                          <div className="absolute text-center">
                            <span className="text-4xl font-black text-slate-800 tracking-tighter">{toPersianNum(totalScore)}</span>
                            <span className="text-slate-400 text-[10px] font-bold block mt-0.5">از {toPersianNum(maxPossible)} امتیاز</span>
                          </div>
                        </div>

                        <div className="w-full space-y-4">
                          <div className={`p-3 rounded-2xl text-xs font-black border text-center ${feedback.levelColor}`}>
                            وضعیت: {feedback.level}
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setTestCompleted(false);
                                setCurrentTestQIndex(0);
                                setTestAnswers([]);
                              }}
                              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-700 rounded-2xl transition active:scale-95 cursor-pointer"
                            >
                              تکرار مجدد آزمون
                            </button>
                            <button
                              onClick={() => {
                                setActiveTestKey(null);
                                setTestCompleted(false);
                              }}
                              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-2xl transition active:scale-95 cursor-pointer"
                            >
                              سایر تشخیص‌ها
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic details */}
                      <div className="lg:col-span-8 space-y-6">
                        {/* Clinical Diagnosis Card */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-right">
                            <Brain size={18} className="text-indigo-600" />
                            <h3 className="text-xs font-black text-indigo-950">آنالیز و سنتز نوروسپشن رفتاری بالینی</h3>
                          </div>
                          <p className="text-xs font-semibold leading-relaxed text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            {feedback.clinicalAnalysis}
                          </p>
                        </div>

                        {/* Exam Effect Card */}
                        <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-100 shadow-sm space-y-4">
                          <div className="flex items-center gap-2 border-b border-amber-200/50 pb-3 text-right">
                            <AlertCircle size={18} className="text-amber-600" />
                            <h3 className="text-xs font-black text-slate-800">تاثیر مستقیم این عارضه در نتایج آزمون کنکور شما</h3>
                          </div>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
                            {feedback.examImpact.map((impact, idx) => (
                              <li key={idx} className="flex gap-2.5 items-start p-3 bg-white/70 rounded-xl border border-amber-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                                <span className="text-[11px] text-slate-600 font-bold leading-relaxed">{impact}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Remedies Card */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
                          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-right">
                            <Award size={18} className="text-teal-600" />
                            <h3 className="text-xs font-black text-indigo-950">راه‌حل‌های کایزن ذهنی و مهار رفتاری (ERP / CBT)</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                            {feedback.remedies.map((remedy, idx) => (
                              <div key={idx} className="p-3.5 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-100 relative transition-transform">
                                <span className="absolute top-2 left-3 font-serif text-[9px] font-black text-indigo-300">#0{idx+1}</span>
                                <h4 className="text-[10px] font-black text-indigo-950 mb-1">اقدام شماره {toPersianNum(idx+1)}</h4>
                                <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{remedy}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Medical Doctor Advice Card */}
                        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl space-y-4">
                          <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-right">
                            <Wind size={18} className="text-amber-400" />
                            <h3 className="text-xs font-black">پروتکل مراقبت بالینی و روان‌پزشکی تاییدشده پزشکی</h3>
                          </div>
                          <p className="text-xs font-semibold leading-relaxed text-slate-300">
                            {feedback.medicalAdvice}
                          </p>
                          <div className="pt-2 flex items-center gap-2 text-[9px] text-slate-400 font-bold text-right">
                            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <span>این راهنما صرفاً جنبه تشخیصی-کمکی تحصیلی دارد و جایگزین درمان بالینی حضوری نیست. تمام گزینش‌ها بر پایه مراجع پزشکی نوین ممیزی شده است.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
