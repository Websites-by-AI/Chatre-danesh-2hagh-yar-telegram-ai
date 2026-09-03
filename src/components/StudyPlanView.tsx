import { useState, useMemo, useEffect } from "react";
import { 
  Sparkles, CheckCircle2, RefreshCw, Calendar, Clock, 
  BookOpen, ArrowUp, ArrowDown, Brain, ExternalLink, 
  CheckCircle, AlertTriangle, ArrowLeftRight, HelpCircle, 
  Bookmark, Award, PlayCircle, Minimize2, Check, Send, 
  Flame, LayoutGrid, Zap, AlignJustify, LineChart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DailyPlan, Student } from "../types";
import PomodoroTimer from "./PomodoroTimer";
import { loadStudyPlan, subscribeToStudyPlan } from "../lib/studyPlans";

interface StudyPlanViewProps {
  student?: Student;
  onNavigate?: (view: string) => void;
}

// Helper to convert numbers to Persian locales
const toPersianNum = (num: number | string) => {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return num.toString().replace(/\d/g, (x) => persianDigits[parseInt(x)]);
};

// Static interactive questions bank for post-study tests based on topics
const QUIZ_BANK: Record<string, {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}[]> = {
  biology: [
    {
      question: "مهم‌ترین آنزیم در فرآیند آغاز همانندسازی که با گسستن پیوندهای هیدروژنی همراه است کدام است؟",
      options: ["دناپلیمراز (DNA Polymerase)", "هلیکاز (Helicase)", "لیگاز (Ligase)", "رناپلیمراز (RNA Polymerase)"],
      correct: 1,
      explanation: "توضیح مربی ترنم مهر: آنزیم هلیکاز با مصرف ATP پیوندهای هیدروژنی بین دو رشته مادری دنا را می‌شکند تا حباب همانندسازی تشکیل شود. همیشه توجه کنید رناپلیمراز در رونویسی کاربرد دارد و دناپلیمراز پیوند فسفودی‌استر ایجاد می‌کند."
    },
    {
      question: "کدام یک از صفات زیر در گیاهان با الگوهای غیرمندلی یا چندژنی به وضوح تطبیق دارد؟",
      options: ["رنگ گلبرگ‌های لاله عباسی", "میزان قند در ریشه چغندر قند", "شکل دانه‌های نخود فرنگی", "نوع کروموزوم‌های تعیین جنسیت ملخ"],
      correct: 1,
      explanation: "توضیح مربی ترنم مهر: صفت میزان قند در چغندر قند یک صفت پیوسته (چندژنی) با نمودار زنگوله‌ای متقارن است؛ در حالی که صفات نخود فرنگی مندلی ساده هستند."
    }
  ],
  chemistry: [
    {
      question: "در دمای اتاق، حاصل‌ضرب غلظت یون‌های هیدرونیوم و هیدروکسید در آب خالص یا هر محلول آبی چقدر است؟",
      options: ["۱۰ به توان منفی ۷", "۱۰ به توان منفی ۱۴", "۱۰ به توان ۷", "پاسخ متغیر بر حسب PH محلول اسیدی"],
      correct: 1,
      explanation: "توضیح مربی ترنم مهر: مقدار ثابت یونش آب (Kw) در دمای ۲۵ درجه سانتی‌گراد همواره برابر ۱۰ به توان منفی ۱۴ مولار مربع است. تغییر PH سبب افزایش یکی و کاهش دیگری می‌شود اما حاصل ضرب آن‌ها ثابت است."
    }
  ],
  riazi: [
    {
      question: "مشتق تابع y = x^3 - 3x^2 + 4 در نقطه بحرانی x = 2 چقدر است؟",
      options: ["۰", "۴-", "۱۲", "۸"],
      correct: 0,
      explanation: "توضیح مربی ترنم مهر: مشتق تابع برابر است با y' = 3x^2 - 6x. در نقطه x = 2 مقدار مشتق برابر صفر می‌شود. نقاط بحرانی نقاطی در داخل دامنه هستند که مشتق در آن‌ها صفر یا موجود نباشد."
    }
  ],
  ensani: [
    {
      question: "علت تامه در فلسفه اسلامی چه شرطی را برای وجود معلول برآورده می‌سازد؟",
      options: ["صرفاً شرط امکان ذاتی معلول را تایید می‌کند.", "وجوب وجود معلول را به طور قطعی و تام رقم می‌زند.", "تنها تقدم زمانی معلول را تسریع می‌کند.", "رابطه امتناع معلول را برطرف می‌سازد."],
      correct: 1,
      explanation: "توضیح مربی ترنم مهر: علت تامه علتی است که با وجود آن معلول بالضروره و به نحو وجوب موجود می‌گردد (قانون علیت وجودی)."
    },
    {
      question: "کدام تله تستی در بخش آرایه‌های ادبی عروض و قافیه کنکور تکرار می‌شود؟",
      options: ["اشتباه گرفتن وزن‌های دوری با عروض همسا‌ن‌نما", "یکسان دانستن هجاهای کشیده با هجاهای کوتاه متوالی", "عدم تناژ اختیارهای شاعری زبانی و وزنی", "همه موارد فوق"],
      correct: 3,
      explanation: "توضیح مربی ترنم مهر: طراح کنکور معمولا هجاهای کشیده انتهای مصراع را به دام تله‌های تسکینی پیوند می‌زند که نیازمند مرور دقیق عروض اختیارهای وزنی است."
    }
  ],
  general: [
    {
      question: "بهترین الگو برای غلبه بر خستگی ذهنی در پارت‌های طولانی مطالعاتی کدام است؟",
      options: ["تکنیک پومودورو کایزن (۲۵ دقیقه مطالعه، ۵ دقیقه استراحت مکرر)", "نیم‌ساعت خواب عمیق پس از هر ساعت مطالعه", "مطالعه مداوم ۴ ساعت بدون هیچ وقفه برای تمرکز کوبنده", "استفاده از محرک‌های قوی بدون توجه به بهداشت خواب"],
      correct: 0,
      explanation: "توضیح مربی ترنم مهر: بر پاشنه مربیگری کایزن، تناوب‌های کوتاه یادگیری همراه با استراحت‌های تمدد اعصاب (Pomodoro/Rest) پایداری توجه مغز را در بالاترین حد نگاه می‌دارد."
    }
  ]
};

export default function StudyPlanView({ student, onNavigate }: StudyPlanViewProps) {
  // Fallback default student if not provided
  const currentStudent = student || {
    id: "arateb_default",
    name: "داوطلب ترنم مهر",
    field: "tajrobi" as const,
    grade: "شبه‌کنکور تجربی تهران - تراز شبیه‌ساز ۶۲۰۰"
  };

  const [loading, setLoading] = useState(false);
  const [activeDayIdx, setActiveDayIdx] = useState<number>(0);
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("daily");
  
  // Custom interactive Quiz modal or panel states
  const [activeQuizTopic, setActiveQuizTopic] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showAiStrategicTip, setShowAiStrategicTip] = useState(true);

  // Initial Plans customized by Field
  const getFieldBasedPlans = (field: string): DailyPlan[] => {
    if (field === "riazi") {
      return [
        { day: "شنبه", morningPlan: "حسابان ۲ - حد بی‌نهایت و حد در بی‌نهایت، قضیه‌های فشردگی و توابع صعودی نزولی", afternoonPlan: "حل ۴۰ تست طلایی حسابان کنکورهای ۷ سال اخیر ترنم مهر", totalQuestions: 40, completed: true },
        { day: "یکشنبه", morningPlan: "هندسه ۳ - بررسی ماتریس، دترمینان، خواص وارون ماتریس و دستگاه معادلات خطی", afternoonPlan: "تحلیل تله‌های تستی ماتریس‌های قطری و شبه‌متقارن (۳۵ تست)", totalQuestions: 35, completed: false },
        { day: "دوشنبه", morningPlan: "فیزیک ۳ - دینامیک و قانون‌های نیوتون، اصطکاک ایستایی و جنبشی و تکانه", afternoonPlan: "تست‌زنی جامع از مسائل شتاب و نیروی اصطکاک و تکانه‌شناسی (۳۰ تست)", totalQuestions: 30, completed: false },
        { day: "سه‌شنبه", morningPlan: "شیمی ۳ - محلول‌ها و استوکیومتری واکنش‌های غلظتی در دماهای بالا", afternoonPlan: "تست‌زنی محاسباتی مسائل بازده درصدی و درجه کلریدی آب (۳۰ تست)", totalQuestions: 30, completed: false },
        { day: "چهارشنبه", morningPlan: "گسسته - گراف، مفهوم مرتبه، اندازه و درجه راس‌ها و قضیه دست‌دادن", afternoonPlan: "کارگاه شبیه‌ساز گراف‌های مسطح دپارتمان تخصصی (۲۵ تست)", totalQuestions: 25, completed: true },
        { day: "پنجشنبه", morningPlan: "ریاضیات پایه - معادلات درجه دوم و هندسه تحلیلی (تقسیم پذیری)", afternoonPlan: "آزمون شبیه‌ساز پیشرفته ریاضیات پایه ترنم مهر (۴۰ تست)", totalQuestions: 40, completed: false },
        { day: "جمعه", morningPlan: "مربیگری حضوری مطالعاتی و مانیتورینگ روند رشد عارضه‌یابی با مشاوران ارشد", afternoonPlan: "بررسی ترازهای پیش‌بینی و ترسیم نمودارهای کایزن رفع تله‌های تستی", totalQuestions: 10, completed: false }
      ];
    } else if (field === "ensani") {
      return [
        { day: "شنبه", morningPlan: "فلسفه و منطق - مبحث وجود و ماهیت، علیت و تقدم زمانی علت و معلول", afternoonPlan: "حل و تحلیل ۴۵ تست شبیه‌ساز خلاقانه عمیق فلسفه یازدهم", totalQuestions: 45, completed: true },
        { day: "یکشنبه", morningPlan: "فنون ادبی ۳ - عروض، تقطیع هجایی به ارکان و اختیارهای شاعری زبانی/وزنی", afternoonPlan: "بررسی ۳۵ تست تندسرعت عروض همسان و ناهمسان کنکورهای اخیر", totalQuestions: 35, completed: false },
        { day: "دوشنبه", morningPlan: "روان‌شناسی - بررسی دوره‌های رشد و نظریه شناخت پیاژه و ویگوتسکی مربی", afternoonPlan: "حل ۴۰ تست کاربردی پومودورو روان‌شناسی و سلامت روان", totalQuestions: 40, completed: false },
        { day: "سه‌شنبه", morningPlan: "جامعه‌شناسی ۳ - هویت ایرانی و تحولات فرهنگی جهان مدرن و بومی", afternoonPlan: "تست‌زنی تکالیفی خلاق آرایه‌های ادبی و کنش‌های اجتماعی (۳۰ تست)", totalQuestions: 30, completed: false },
        { day: "چهارشنبه", morningPlan: "عربی تخصصی - حروف مشبهه بالفعل و لای نفی جنس، نواسخ و ترجمه دقیق", afternoonPlan: "تمرین ترجمه پیشرفته و قواعد اسم تفضیل و مکان (۲۵ تست)", totalQuestions: 25, completed: true },
        { day: "پنجشنبه", morningPlan: "اقتصاد - مسئله‌های محاسبه تورم، شاخص قیمت مصرف‌کننده و توزیع درآمدها", afternoonPlan: "شبیه‌ساز جامع اقتصاد و ثبت در پنل پایش هوشمند تراز (۴۰ تست)", totalQuestions: 40, completed: false },
        { day: "جمعه", morningPlan: "بررسی روند افت‌وخیز تراز استراتژیک در آزمون آزمایشی با ناظر ارشد ترنم مهر", afternoonPlan: "رفع اشکال ذهنی عروضی و استخراج واژگان طلایی کلیدی", totalQuestions: 10, completed: false }
      ];
    } else {
      // "tajrobi"
      return [
        { day: "شنبه", morningPlan: "زیست‌شناسی ۳ - همانندسازی دنا، رونویسی، عملکرد دناپلیمراز و عوامل رونویسی", afternoonPlan: "حل و تحلیل ۴۵ تست زمان‌دار همانندسازی با کالیبراتور تله تستی", totalQuestions: 45, completed: true },
        { day: "یکشنبه", morningPlan: "شیمی ۳ - اسیدها و بازها، ثابت یونش اسیدهای ضعیف و سنجش PH مخازن آبی", afternoonPlan: "مسائل Ph و تست‌های تعادلی محاسباتی محاسبات یون هیدرونیوم (۳۵ تست)", totalQuestions: 35, completed: false },
        { day: "دوشنبه", morningPlan: "ریاضی ۳ - کاربرد مشتق، بهینه‌سازی، نقاط بحرانی و بررسی عطف توابع", afternoonPlan: "حل ۴۰ تست مشتق و حد مرتبط با مباحث ضعف آزمون اخیر", totalQuestions: 40, completed: false },
        { day: "سه‌شنبه", morningPlan: "زیست‌شناسی دوازدهم - تقسیم یاخته به همراه فرآیندهای کراسینگ‌اور و میتوز", afternoonPlan: "آزمون تستی ۳۰ سوالی ترکیبی زیست پایه دهم و دوازدهم کایزن", totalQuestions: 30, completed: false },
        { day: "چهارشنبه", morningPlan: "فیزیک ۳ - نوسان و امواج، مشخصه‌های موج، تندی انتشار و شدت صوت", afternoonPlan: "حل ۲۵ تست نوسان با نگرش کنکوری و ترفندهای زمان‌بر تله‌گیر", totalQuestions: 25, completed: true },
        { day: "پنجشنبه", morningPlan: "زمین‌شناسی - کانسارهای آذرین و دگرگونی، آبهای زیرزمینی و زمین‌گردشگری", afternoonPlan: "شبیه‌ساز جامع سنجشی زمین‌شناسی و زیست تجربی (۴۰ تست)", totalQuestions: 40, completed: false },
        { day: "جمعه", morningPlan: "کاووش و آنالیز تست‌های پرریسک کنکور زیر نظر ناظر ارشد زیست‌پژوهی", afternoonPlan: "پایش تکنیک‌های تندخوانی و عارضه‌یابی نوسانات تراز ۴ آزمون اخیر", totalQuestions: 10, completed: false }
      ];
    }
  };

  const [plans, setPlans] = useState<DailyPlan[]>(() => getFieldBasedPlans(currentStudent.field));

  // Override the hardcoded default schedule with the counselor-published plan
  // from D1 (cross-device sync). This is what makes a counselor's change appear
  // in the student panel.
  useEffect(() => {
    let cancelled = false;
    const applyPlan = (plan: any) => {
      if (!plan || !Array.isArray(plan.schedule) || plan.schedule.length === 0) return;
      setPlans(plan.schedule.map((s: any) => ({
        day: s.day,
        morningPlan: s.morning || "",
        afternoonPlan: s.afternoon || "",
        totalQuestions: Math.max(0, Number(s.qCount ?? s.totalQ ?? 0) || 0),
        completed: false,
      })));
    };
    loadStudyPlan(currentStudent.id).then((plan) => {
      if (!cancelled && plan) applyPlan(plan);
    });
    const unsubscribe = subscribeToStudyPlan(currentStudent.id, (plan) => {
      if (plan) applyPlan(plan);
    });
    return () => { cancelled = true; unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStudent.id]);

  const handleToggleTask = (index: number) => {
    const updated = [...plans];
    updated[index].completed = !updated[index].completed;
    setPlans(updated);
  };

  const handleRegeneratePlan = () => {
    setLoading(true);
    setTimeout(() => {
      let aiUpdates: DailyPlan[] = [];
      if (currentStudent.field === "riazi") {
        aiUpdates = [
          { day: "شنبه", morningPlan: "حسابان ۲ - مجانب‌های افقی و مایل به همراه اثبات براهین مثلثاتی", afternoonPlan: "حل ۴۵ تست به کلید کایزن با حذف ۳ تله متداول حد بی نهایت", totalQuestions: 45, completed: false },
          { day: "یکشنبه", morningPlan: "فیزیک دوازدهم - مبحث حرکت دورانی یکنواخت و شتاب مرکزگرا", afternoonPlan: "تحلیل تله‌های ۳۵ سوال از دینامیک چرخشی با رویکرد سرعت زاویه‌ای", totalQuestions: 35, completed: false },
          { day: "دوشنبه", morningPlan: "هندسه دوازدهم - بیضی و دایره، بررسی معادله کانون و نیم‌قطر بزرگ", afternoonPlan: "حل ۴۰ تست کاربردی مقاطع مخروطی در حضور داور ترنم مهر", totalQuestions: 40, completed: false },
          { day: "سه‌شنبه", morningPlan: "شیمی دوازدهم - الکتروشیمی و بررسی پتانسیل کاهشی قطب‌ها (نیم پیل)", afternoonPlan: "اجرای ۳۰ نمونه تستی مسائل برقکافت و سلول‌های حلبی", totalQuestions: 30, completed: false },
          { day: "چهارشنبه", morningPlan: "گسسته - قضیه الگوریتم تقسیم و عاد کردن مبحث ب.م.م", afternoonPlan: "تست‌زنی گسسته نوین با تاکید بر قضایای هم‌نهشتی نظریه اعداد", totalQuestions: 15, completed: false },
          { day: "پنجشنبه", morningPlan: "ریاضی عمومی - بخش مدلسازی بهینه‌سازی سطوح هندسی", afternoonPlan: "پایش آزمون شبیه‌ساز پیشرفته و خلاصه‌نویسی نکات در دفترچه طلایی", totalQuestions: 30, completed: false },
          { day: "جمعه", morningPlan: "آزمون کایزن مربیگری حضوری و رفع ابهامات محاسباتی با پشتیبان ارشد", afternoonPlan: "بررسی تراز مانیتورینگ کارایی و تدوین توصیه‌های کایزن مطالعاتی", totalQuestions: 10, completed: false }
        ];
      } else if (currentStudent.field === "ensani") {
        aiUpdates = [
          { day: "شنبه", morningPlan: "فلسفه دوازدهم - مبحث حقیقت و عقل در عرفان و منطق متعالی سهروردی", afternoonPlan: "انجام ۴۵ نمونه تست مفهومی و تله تستی فلسفه دپارتمان تالیف", totalQuestions: 45, completed: false },
          { day: "یکشنبه", morningPlan: "جامعه‌شناسی دوازدهم - مبحث بحران‌های زیست‌محیطی و تکنولوژی در جهان معاصر", afternoonPlan: "پایش تله‌های ۳۵ سوال از آخرین وبینارهای تخصصی علوم اجتماعی", totalQuestions: 35, completed: false },
          { day: "دوشنبه", morningPlan: "روان‌شناسی - مبحث انگیزش و هیجان به همراه تفکر و حل مسئله", afternoonPlan: "حل ۴۰ تست روان‌شناسی تحلیلی در حضور مشاور ویژه", totalQuestions: 40, completed: false },
          { day: "سه‌شنبه", morningPlan: "فنون ادبی دوازدهم - اختیارهای وزنی (تسکین و قلب هجا در پایه عروضی)", afternoonPlan: "اجرای ۳۰ نمونه تستی آرایه‌های ترکیبی بدون نمره منفی اضافی", totalQuestions: 30, completed: false },
          { day: "چهارشنبه", morningPlan: "تاریخ ۳ - علل و نتایج انقلاب مشروطه و بررسی متمم قانون اساسی", afternoonPlan: "تست‌زنی خلاق تاریخ با تصاویر و رویکرد ترتیبی سال‌ها", totalQuestions: 15, completed: false },
          { day: "پنجشنبه", morningPlan: "عربی دوازدهم - مبحث مستثنی به الا و بررسی اسلوب حصر مطالعاتی", afternoonPlan: "پایش آزمون شبیه‌ساز پیشرفته و خلاصه‌نویسی نکات عمیق نحو", totalQuestions: 30, completed: false },
          { day: "جمعه", morningPlan: "تحویل مکتوب آمار پایش کیفی به پنل مشاور ارشد جهت عارضه‌یابی دقیق", afternoonPlan: "بررسی تراز مانیتورینگ کارایی و تدوین توصیه‌های کایزن مطالعاتی", totalQuestions: 10, completed: false }
        ];
      } else {
        // tajrobi AI
        aiUpdates = [
          { day: "شنبه", morningPlan: "زیست‌شناسی دوازدهم - مطالعه عمیق فرآیند ترجمه و بیوسنتز پروتئین در پروکاریوت‌ها", afternoonPlan: "انجام ۴۵ نمونه تست مفهومی رمزه‌های آغاز و پایان و عوامل انسداد سنتز", totalQuestions: 45, completed: false },
          { day: "یکشنبه", morningPlan: "شیمی دوازدهم - بررسی سلول‌های گالوانی پیشرفته و پتانسیل استاندار کاهشی", afternoonPlan: "پایش تله‌های ۳۵ سوال از شیمی الکترولیتی با تمرکز بر ثابت‌های تعادل آب", totalQuestions: 35, completed: false },
          { day: "دوشنبه", morningPlan: "ریاضی دوازدهم - اکسترمم‌های مطلق و موضعی تابع به کمک آزمون مشتق اول", afternoonPlan: "حل ۴۰ تست جامع بهینه‌سازی هندسی کانون سوالات", totalQuestions: 40, completed: false },
          { day: "سه‌شنبه", morningPlan: "زیست‌شناسی دوازدهم - فرآیند تنفس سلولی، زنجیره انتقال الکترون و تولید ATP", afternoonPlan: "اجرای ۳۰ نمونه تستی زیست انرژی با بررسی تله‌های میتوکندریایی", totalQuestions: 30, completed: false },
          { day: "چهارشنبه", morningPlan: "فیزیک دوازدهم - بازتاب امواج نوری، قوانین بازتاب نور در آینه‌های تخت و کروی", afternoonPlan: "تست‌زنی فیزیک با تمرکز بر پرتوهای شکست‌خورده با پاسخ تشریحی عمیق", totalQuestions: 15, completed: false },
          { day: "پنجشنبه", morningPlan: "زمین‌شناسی - بررسی دوره‌های مختلف زمین‌شناسی و پیدایش فسیل‌های راهنما", afternoonPlan: "پایش آزمون شبیه‌ساز پیشرفته و خلاصه‌نویسی کایزن چالش زیست توده", totalQuestions: 30, completed: false },
          { day: "جمعه", morningPlan: "تحویل مکتوب آمار پایش کیفی زیست‌شناسی به مجمع مشاورین ارشد ترنم مهر", afternoonPlan: "بررسی راندمان تمرکز پومودورو و بررسی تراز مانیتورینگ کارایی مطالعاتی", totalQuestions: 10, completed: false }
        ];
      }
      setPlans(aiUpdates);
      setLoading(false);
    }, 1200);
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const updated = [...plans];
    const prev = updated[idx - 1];
    updated[idx - 1] = { ...updated[idx], day: prev.day };
    updated[idx] = { ...prev, day: updated[idx].day };
    setPlans(updated);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === plans.length - 1) return;
    const updated = [...plans];
    const next = updated[idx + 1];
    updated[idx + 1] = { ...updated[idx], day: next.day };
    updated[idx] = { ...next, day: updated[idx].day };
    setPlans(updated);
  };

  const completedCount = plans.filter(p => p.completed).length;
  const progressRatio = Math.round((completedCount / plans.length) * 100);

  // Helper connection data of subjects to other dashboard elements
  const getConnectionMetadata = (dayName: string) => {
    // Return connection elements to weaknesses & test traps dynamically
    const field = currentStudent.field;
    if (field === "riazi") {
      switch (dayName) {
        case "شنبه":
          return {
            weakTopic: "حد بی‌نهایت و مبهم",
            testTrapCategory: "زمان‌بر",
            quizKey: "riazi",
            note: "تراز پیش‌بینی شده شما در ریاضی بر اساس میانگین اخیر با نوسان نسبی روبرو بوده. کدهای ۲۳ و ۴۲ در بخش تله‌های تستی به این مبحث مربوط است."
          };
        case "یکشنبه":
          return {
            weakTopic: "ماتریس‌ها",
            testTrapCategory: "اشتباه_محاسباتی",
            quizKey: "riazi",
            note: "دچار تله‌های مکرر جابجایی دترمینان در آزمون‌های تستی شده‌اید. مطالعه عمیق تله‌ها توصیه می‌شود."
          };
        case "دوشنبه":
          return {
            weakTopic: "دینامیک نیوتونی",
            testTrapCategory: "مفهومی",
            quizKey: "general",
            note: "نیاز تستی فوری به پایش اصطکاک سطح ناهموار."
          };
        default:
          return {
            weakTopic: "یکپارچه‌سازی ریاضی کایزن",
            testTrapCategory: "فرمول‌محور",
            quizKey: "general",
            note: "حل تست‌های زمان‌دار عمومی جهت تعادل سرعت عمل."
          };
      }
    } else if (field === "ensani") {
      switch (dayName) {
        case "شنبه":
          return {
            weakTopic: "علت و معلول (فلسفه)",
            testTrapCategory: "مفهومی",
            quizKey: "ensani",
            note: "دچار نوسان درصد بین ۲۵٪ تا ۶۰٪. ممیزی‌های عصب‌شناختی ترنم مهر نشان می‌دهد یادگیری این مبحث نیازمند بازآرایی مفهومی است."
          };
        case "یکشنبه":
          return {
            weakTopic: "عروض اختیارهای وزنی",
            testTrapCategory: "زمان‌بر",
            quizKey: "ensani",
            note: "تنوع وزنی بالا کار سخت به دام انداختن را افزایش می‌دهد. تست‌های عروضی پس از پارت دوم الزامی است."
          };
        case "دوشنبه":
          return {
            weakTopic: "مکتب پیاژه و پساپیاژه",
            testTrapCategory: "اشتباه_محاسباتی",
            quizKey: "general",
            note: "توصیه می‌شود قبل از مطالعه به تست‌های شبیه‌ساز روانشناسی بخش Progress نگاه کنید."
          };
        default:
          return {
            weakTopic: "متون و منطق پایه",
            testTrapCategory: "مفهومی",
            quizKey: "general",
            note: "مبحث هدف تراز برای دفاع از رتبه کشوری مجدد بررسی شود."
          };
      }
    } else {
      // tajrobi connections
      switch (dayName) {
        case "شنبه":
          return {
            weakTopic: "دناپلیمراز و کدهای رونویسی",
            testTrapCategory: "مفهومی",
            quizKey: "biology",
            note: "این بخش مستقیماً به مبحث ضعیف شما یعنی 'تنظیم بیان ژن و کروماتین' پیوند دارد. ۲ تله تستی فوق حیاتی در بانک تله‌های شما وجود دارد."
          };
        case "یکشنبه":
          return {
            weakTopic: "غلظت یون هیدرونیوم و اسید قوی",
            testTrapCategory: "اشتباه_محاسباتی",
            quizKey: "chemistry",
            note: "با ثبت پیش‌بینی تراز در داشبورد فوقانی، مشخص شد افزایش ثبات محاسباتی در PH می‌تواند تراز شیمی را تا ۴۰۰ واحد بهبود بخشد."
          };
        case "دوشنبه":
          return {
            weakTopic: "بهینه‌سازی نقاط بحرانی",
            testTrapCategory: "فرمول‌محور",
            quizKey: "riazi",
            note: "نیاز به آزمون تستی بعد از پارت بعدازظهر جهت تثبیت شیب‌های مماسی."
          };
        default:
          return {
            weakTopic: "چرخه کربس و تیتراسیون اسید",
            testTrapCategory: "مفهومی",
            quizKey: "general",
            note: "منطبق با تحلیل آمادگی رادار عمیق شناختی، بازده ریکاوری خواب به این امر کمک می‌کند."
          };
      }
    }
  };

  const currentActivePlan = plans[activeDayIdx] || plans[0];
  const activeConnection = useMemo(() => getConnectionMetadata(currentActivePlan.day), [currentActivePlan]);

  // Quiz interactive engine handlers
  const startQuiz = (topic: string) => {
    setActiveQuizTopic(topic);
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  const selectOption = (qIdx: number, oIdx: number) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const submitQuiz = () => {
    setQuizSubmitted(true);
  };

  const getScore = () => {
    const qList = QUIZ_BANK[activeQuizTopic || "general"] || QUIZ_BANK.general;
    let corrects = 0;
    qList.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct) corrects++;
    });
    return {
      corrects,
      total: qList.length,
      percentage: Math.round((corrects / qList.length) * 100)
    };
  };

  return (
    <div className="space-y-6 text-right" id="study-plan-view-container">
      
      {/* Dynamic App Badge Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-lg">سیستم مطالعاتی کایزن</span>
            <span className="bg-amber-50 border border-amber-150 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Flame size={10} className="fill-amber-600" />
              <span>{toPersianNum(progressRatio)}٪ تطبیق</span>
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>برنامه‌ریزی هوشمند مطالعاتی</span>
            <span className="text-indigo-600 font-serif">ترنم مهر</span>
          </h1>
          <p className="text-slate-500 text-xs leading-relaxed max-w-3xl font-medium">
             این ماژول پیشرفته به طور مستقیم با <span className="font-bold text-indigo-600">تحلیل تله‌های تستی</span>، <span className="font-bold text-indigo-600">نقشه نقاط ابهام</span> و <span className="font-bold text-indigo-600">رادار تخمین قبولی</span> هماهنگ است و تضمین می‌کند شیفت‌های عصر شما مجهز به شبیه‌سازها و سنجش‌های موضوعی معتبر باشد.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto self-stretch md:self-auto shrink-0">
          <button
            onClick={handleRegeneratePlan}
            disabled={loading}
            className="flex-1 md:flex-initial bg-indigo-950 hover:bg-slate-900 text-white font-black text-xs py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-100"
            id="btn-ai-replan"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <Sparkles size={16} className="text-amber-400" />
            )}
            <span>بازآرایی برنامه هفتگی با هوش مصنوعی</span>
          </button>
        </div>
      </div>

      {/* Mode selectors & Progress layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Sidebar navigation to select days and mode switcher */}
        <div className="lg:col-span-4 space-y-4">
           
           {/* Visual View-Mode Selector Tab */}
           <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 flex gap-2">
              <button 
                onClick={() => setViewMode("daily")}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === "daily" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-850"
                }`}
              >
                <LayoutGrid size={15} />
                <span>بررسی عمیق روز جاری</span>
              </button>
              <button 
                onClick={() => setViewMode("weekly")}
                className={`flex-1 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  viewMode === "weekly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-850"
                }`}
              >
                <AlignJustify size={15} />
                <span>تایم‌لاین هفتگی</span>
              </button>
           </div>

           {/* Days Selector for Focus Mode */}
           <div className="bg-white p-4 md:p-5 rounded-[28px] border border-slate-150 shadow-xs space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">انتخاب روز مطالعاتی</h3>
              <div className="flex lg:flex-col gap-2 overflow-x-auto scrollbar-none pb-2 lg:pb-0 px-1 -mx-2 lg:mx-0 lg:px-0">
                 {plans.map((plan, idx) => {
                   const isSelected = activeDayIdx === idx && viewMode === "daily";
                   return (
                     <button
                       key={idx}
                       onClick={() => {
                         setActiveDayIdx(idx);
                         setViewMode("daily");
                         // reset quiz if user switches day
                         setActiveQuizTopic(null);
                       }}
                       className={`flex-shrink-0 min-w-[110px] lg:w-full flex lg:flex-row flex-col items-center justify-between p-3.5 rounded-2xl border transition-all text-right cursor-pointer gap-2 lg:gap-3 group ${
                         isSelected
                           ? "bg-indigo-950 border-indigo-950 text-white shadow-md shadow-indigo-950/10" 
                           : "bg-white border-slate-150 hover:bg-slate-50 text-slate-700 hover:border-slate-350"
                       }`}
                     >
                       <div className="flex lg:flex-row flex-col items-center gap-2 lg:gap-3 lg:text-right text-center w-full">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center border font-mono text-xs font-black shrink-0 ${
                            isSelected
                              ? "bg-white/10 border-white/15 text-white" 
                              : plan.completed 
                                ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                                : "bg-slate-50 border-slate-100 text-slate-500"
                          }`}>
                            {plan.completed ? <Check size={14} className="stroke-[3]" /> : toPersianNum(idx + 1)}
                          </div>
                          <div className="lg:text-right text-center">
                             <span className="text-xs font-black block whitespace-nowrap">{plan.day}</span>
                             <span className={`text-[9px] block whitespace-nowrap mt-0.5 ${
                               isSelected ? "text-indigo-200" : "text-slate-400"
                             } font-bold`}>{plan.totalQuestions} تست اولویت‌دار</span>
                          </div>
                       </div>

                       <div className="hidden lg:flex gap-2">
                          {plan.completed && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                          <ArrowLeftRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                     </button>
                   );
                 })}
              </div>
           </div>

           {/* Quick KPI completion panel */}
           <div className="bg-slate-900 p-5 rounded-[28px] text-white space-y-4 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -ml-16 -mt-16 pointer-events-none" />
             <div className="flex justify-between items-center text-xs">
                <span className="font-black text-indigo-300 flex items-center gap-1">
                   <Flame size={12} className="text-amber-500 fill-amber-500" />
                   <span>راندمان کایزن مطالعاتی هفته</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">{toPersianNum(progressRatio)}٪ انجام شده</span>
             </div>
             
             <div className="space-y-1.5">
                <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden p-0.5">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${progressRatio}%` }}
                     transition={{ duration: 1 }}
                     className="bg-gradient-to-l from-indigo-500 to-emerald-400 h-full rounded-full"
                   />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                   <span>تکمیل کایزن به دایرکت موروثی</span>
                   <span>هدف هفته بعد: تراز +۳۰۰</span>
                </div>
             </div>
           </div>

        </div>

        {/* Right column: Dynamic display according to Daily Focus or Weekly layout */}
        <div className="lg:col-span-8">
           <AnimatePresence mode="wait">
              {viewMode === "daily" ? (
                <motion.div
                  key={`daily-${activeDayIdx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  
                  {/* Selected Day Large Focus Card */}
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6 relative overflow-hidden">
                    <div className="absolute -top-12 -left-12 w-48 h-48 bg-slate-50 rounded-full blur-3xl pointer-events-none" />
                    
                    {/* Focus day Card Header */}
                    <div className="flex justify-between items-start border-b border-slate-50 pb-5">
                       <div className="space-y-1 text-right">
                          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                             <span>جزئیات برنامه درسی روز {currentActivePlan.day}</span>
                             <span className="text-xs font-bold text-slate-400 font-mono">({toPersianNum(currentActivePlan.totalQuestions)} تست تخصصی)</span>
                          </h2>
                          <div className="flex items-center gap-1.5">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
                             <span className="text-[10px] text-indigo-600 font-black">سازمان‌دهی اتوماتیک بر پایه تراز هدفی {toPersianNum(toPersianNum(7200))}</span>
                          </div>
                       </div>

                       <button
                         onClick={() => handleToggleTask(activeDayIdx)}
                         className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                           currentActivePlan.completed 
                             ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                             : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                         }`}
                       >
                         {currentActivePlan.completed ? <CheckCircle size={14} /> : <Clock size={14} />}
                         <span>{currentActivePlan.completed ? "مطالعه این روز تایید شده" : "علامت‌گذاری به عنوان تکمیل"}</span>
                       </button>
                    </div>

                    {/* Morning and Afternoon Study Blocks */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       
                       {/* Morning Session Block */}
                       <div className="p-5 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-4">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 text-indigo-900 font-black text-xs">
                                <Clock size={16} className="text-indigo-600" />
                                <span>Part 1: شیفت فشرده صبح</span>
                             </div>
                             <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">۴ ساعت عمیق</span>
                          </div>
                          
                          <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                            {currentActivePlan.morningPlan}
                          </p>

                          <div className="text-[10px] text-slate-400 font-bold border-t border-slate-200/50 pt-3">
                             روش پیشنهادی مربی: <span className="text-indigo-600 font-bold">پیش‌خوانی سریع (SQ3R)</span> + عارضه‌نگاری فیش‌ها.
                          </div>
                       </div>

                       {/* Afternoon Session Block */}
                       <div className="p-5 bg-gradient-to-br from-indigo-50/20 to-blue-50/20 rounded-2xl border border-indigo-50/80 space-y-4 relative">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                                <BookOpen size={16} className="text-amber-600" />
                                <span>Part 2: شیفت تمرینی عصر</span>
                             </div>
                             <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">۳.۵ ساعت تست‌زنی</span>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                            {currentActivePlan.afternoonPlan}
                          </p>

                          <div className="text-[10px] text-slate-400 font-bold border-t border-slate-200/50 pt-3">
                             تمرکز تستی: <span className="text-amber-700 font-bold">حل با تکنیک ضربدر منها</span> و ردیابی تله‌های کنکور.
                          </div>
                       </div>

                    </div>

                    {/* Connected Dashboard Metadata & Dynamic Weakness Integrations */}
                    <div className="bg-gradient-to-br from-rose-50/50 via-white to-indigo-50/30 p-6 rounded-[32px] border border-rose-100/60 text-right space-y-4 shadow-sm relative overflow-hidden group">
                       <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500/40 group-hover:bg-rose-500 transition-colors" />
                       
                       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex items-center gap-2.5">
                             <div className="p-2 bg-rose-100 text-rose-600 rounded-xl animate-pulse">
                                <AlertTriangle size={18} />
                             </div>
                             <h4 className="text-sm font-black text-slate-900">
                                تحلیل عارضه‌یابی و مانیتورینگ هوشمند کایزن
                             </h4>
                          </div>
                          
                          <button 
                            onClick={() => onNavigate?.("manova")}
                            className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-150 transition-all cursor-pointer"
                          >
                             <LineChart size={12} />
                             <span>مشاهده در رادار Manova</span>
                          </button>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-2">
                             <span className="text-[10px] text-slate-400 block font-black">نقطه اصطکاک و ضعف (بر پایه هوش مصنوعی):</span>
                             <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-2xl border border-slate-150 flex items-center justify-between group/item">
                                <div className="flex items-center gap-2.5">
                                   <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-200" />
                                   <span className="text-xs font-black text-slate-800">{activeConnection.weakTopic}</span>
                                </div>
                                <button 
                                  onClick={() => onNavigate?.("progress")}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                >
                                   <ExternalLink size={14} />
                                </button>
                             </div>
                          </div>
                          
                          <div className="space-y-2">
                             <span className="text-[10px] text-slate-400 block font-black">کالیبراتور تله تستی پیشنهادی:</span>
                             <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-2xl border border-indigo-150 flex items-center justify-between group/item">
                                <div className="flex items-center gap-2.5">
                                   <Brain size={14} className="text-indigo-600" />
                                   <span className="text-xs font-black text-indigo-900">تله‌های {activeConnection.testTrapCategory}</span>
                                </div>
                                <button 
                                  onClick={() => onNavigate?.("traps")}
                                  className="flex items-center gap-1 text-[9px] font-black bg-indigo-600 text-white px-2 py-1 rounded-lg shadow-sm hover:bg-indigo-700 transition-all cursor-pointer"
                                >
                                   <span>ورود به بانک تله</span>
                                   <ArrowUp size={10} className="rotate-45" />
                                </button>
                             </div>
                          </div>
                       </div> 
                       
                       <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                          <p className="text-[11px] text-slate-650 leading-relaxed font-bold flex items-start gap-2">
                             <Zap size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                             <span>{activeConnection.note}</span>
                          </p>
                       </div>
                    </div>

                    {/* Interactive Post-Study Test Action (آزمون تستی بعد از کار مطالعاتی) */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-slate-50 mt-2">
                       <div className="text-right space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-bold block">مرحله نهایی یادگیری کایزن</span>
                          <span className="text-xs font-black text-slate-800">سنجش و ارزشیابی تستی سریع جهت ارزیابی تثبیت مفاهیم</span>
                       </div>

                       <button
                         onClick={() => startQuiz(activeConnection.quizKey)}
                         className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer transition-all uppercase"
                       >
                         <PlayCircle size={16} />
                         <span>شروع ارزشیابی تستی سریع (پس از مطالعه)</span>
                       </button>
                    </div>

                  </div>

                  {/* Inline Interactive Micro Quiz Section if triggered */}
                  <AnimatePresence>
                     {activeQuizTopic && (
                       <motion.div
                         initial={{ opacity: 0, height: 0 }}
                         animate={{ opacity: 1, height: "auto" }}
                         exit={{ opacity: 0, height: 0 }}
                         className="bg-indigo-950 text-white rounded-3xl p-6 md:p-8 space-y-6 relative overflow-hidden"
                         id="post-study-interactive-quiz"
                       >
                         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800/20 rounded-full blur-3xl pointer-events-none" />
                         
                         {/* Quiz Header */}
                         <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <div className="flex items-center gap-2">
                               <Award size={18} className="text-amber-400" />
                               <div>
                                  <h3 className="text-sm font-black tracking-tight">سنجش آنلاین کایزن (آزمون تستی بعد از مطالعه)</h3>
                                  <p className="text-[10px] text-indigo-300 font-bold">بر مبنای استانداردهای کنکور سراسری</p>
                               </div>
                            </div>
                            <button 
                              onClick={() => setActiveQuizTopic(null)}
                              className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                              title="بستن آزمون سریع"
                            >
                              <Minimize2 size={16} />
                            </button>
                         </div>

                         {/* Questions Loop */}
                         <div className="space-y-6 text-right">
                            {(QUIZ_BANK[activeQuizTopic] || QUIZ_BANK.general).map((q, qIdx) => (
                              <div key={qIdx} className="space-y-3">
                                 <h4 className="text-xs font-black flex gap-2 items-start leading-relaxed">
                                    <span className="px-2 py-0.5 bg-indigo-900 rounded-md text-[10px] font-mono shrink-0">{toPersianNum(qIdx + 1)}</span>
                                    <span>{q.question}</span>
                                 </h4>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
                                    {q.options.map((opt, oIdx) => {
                                      const isSelected = quizAnswers[qIdx] === oIdx;
                                      const isCorrect = q.correct === oIdx;
                                      let optStyle = "bg-indigo-900/40 border-white/10 text-indigo-100 hover:bg-indigo-900/60";
                                      
                                      if (quizSubmitted) {
                                        if (isCorrect) optStyle = "bg-emerald-500/20 border-emerald-400 text-emerald-300";
                                        else if (isSelected) optStyle = "bg-rose-500/20 border-rose-400 text-rose-300";
                                        else optStyle = "opacity-50 bg-indigo-900/40 border-white/5 text-indigo-200";
                                      } else if (isSelected) {
                                        optStyle = "bg-indigo-500/50 border-indigo-400 text-white shadow-xl";
                                      }

                                      return (
                                        <button
                                          key={oIdx}
                                          type="button"
                                          onClick={() => selectOption(qIdx, oIdx)}
                                          className={`w-full text-right p-3.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${optStyle}`}
                                        >
                                           <span>{opt}</span>
                                           <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                             isSelected ? "bg-indigo-500 border-white" : "border-slate-500"
                                           }`}>
                                              {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                           </div>
                                        </button>
                                      );
                                    })}
                                 </div>

                                 {/* Explanations shown upon submission */}
                                 {quizSubmitted && (
                                   <motion.div 
                                     initial={{ opacity: 0, y: 5 }}
                                     animate={{ opacity: 1, y: 0 }}
                                     className="p-4 rounded-2xl bg-indigo-900/50 border border-white/5 text-[11px] leading-relaxed text-indigo-200"
                                   >
                                      {q.explanation}
                                   </motion.div>
                                 )}
                              </div>
                            ))}
                         </div>

                         {/* Action Footer for Quiz */}
                         <div className="pt-4 border-t border-white/10 flex justify-between items-center text-xs">
                            {quizSubmitted ? (
                              <div className="flex items-center gap-3">
                                 <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-white/10 text-amber-300 font-bold">
                                    امتیاز نهایی: {toPersianNum(getScore().corrects)} از {toPersianNum(getScore().total)} صحیح
                                 </div>
                                 <span className="text-slate-300 font-bold">({toPersianNum(getScore().percentage)}٪ موفقیت مطالعاتی)</span>
                              </div>
                            ) : (
                              <span className="text-indigo-300 font-bold font-serif">قبل از تایید، گزینه‌ها را با دقت تحلیل کنید.</span>
                            )}

                            {!quizSubmitted ? (
                              <button
                                onClick={submitQuiz}
                                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-black rounded-xl cursor-pointer shadow-lg shadow-emerald-500/10 transition-all uppercase"
                              >
                                 ثبت و پایش پاسخ‌ها
                              </button>
                            ) : (
                              <button
                                onClick={() => setActiveQuizTopic(null)}
                                className="px-6 py-3 bg-white hover:bg-slate-150 text-indigo-950 font-black rounded-xl cursor-pointer transition-all"
                              >
                                 تثبیت و ثبت در مانیتورینگ
                              </button>
                            )}
                         </div>
                       </motion.div>
                     )}
                  </AnimatePresence>

                  {/* AI Strategic Tip Hub Block */}
                  {showAiStrategicTip && (
                    <motion.div 
                      className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-right space-y-4"
                      id="ai-active-studying-copilot"
                    >
                      <div className="flex justify-between items-center">
                         <div className="flex items-center gap-2">
                           <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-100">
                              <Sparkles size={16} />
                           </div>
                           <h4 className="text-xs font-black text-slate-800">
                             دستیار هوشمند ترنم مهر: ترفند پیشرفته یادگیری و جعبه‌ابزار مرور روز جاری
                           </h4>
                         </div>
                         <button 
                           onClick={() => setShowAiStrategicTip(false)}
                           className="text-slate-300 hover:text-slate-500 text-[10px] cursor-pointer"
                         >
                           پنهان کردن
                         </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                            <span className="font-extrabold text-indigo-900 block">۱. ساختارهای تصویرسازی ذهنی</span>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                              برای مبحث روز ({currentActivePlan.morningPlan.split(" - ")[0]}) نمودارهای درختی و روابط علّی را روی کاغذ ترسیم کنید.
                            </p>
                         </div>
                         <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                            <span className="font-extrabold text-indigo-900 block">۲. ترفند تثبیت حافظه</span>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                              پس از پارت عصر و قبل از خواب، آزمون تستی بعد از کار را یک بار دیگر به همراه پاسخ تشریحی مرور کنید تا وارد حافظه بلندمدت شود.
                            </p>
                         </div>
                         <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                            <span className="font-extrabold text-indigo-900 block">۳. کدهای تله‌یابی عروضی/زیست</span>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-bold">
                              به تفاوت مفاهیم ظاهری گزینه‌ها و استدلال‌های مفهومی در حین کارهای شیفت عصر دقت کنید.
                            </p>
                         </div>
                      </div>
                    </motion.div>
                  )}

                </motion.div>
              ) : (
                
                /* Weekly Timeline Mode */
                <motion.div
                  key="weekly"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {plans.map((plan, idx) => (
                    <div 
                      key={idx}
                      className={`bg-white rounded-2xl p-5 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-right ${
                        plan.completed ? "border-emerald-100 shadow-sm bg-gradient-to-tr from-emerald-50/10 to-transparent" : "border-slate-100 shadow-sm hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-start md:items-center gap-4 flex-1">
                        
                        {/* Checkbox toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleTask(idx)}
                          className={`w-7 h-7 rounded-xl border flex items-center justify-center transition flex-shrink-0 cursor-pointer ${
                            plan.completed 
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" 
                              : "border-slate-300 hover:border-indigo-900 bg-slate-50 text-slate-300 hover:text-indigo-900"
                          }`}
                          id={`checkbox-day-${idx}`}
                        >
                          <CheckCircle2 size={16} />
                        </button>

                        {/* Day Header */}
                        <div className="w-16 flex-shrink-0">
                          <span className="font-black text-slate-900 block text-base">{plan.day}</span>
                          <span className="text-[9px] text-slate-400 font-bold block mt-0.5">پارت کایزن</span>
                        </div>

                        {/* Inner Text with Morning/Afternoon Plans */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-indigo-700 tracking-wide flex items-center gap-1 justify-start">
                              <Clock size={12} />
                              <span>☀️ شیفت صبح (مفاهیم)</span>
                            </span>
                            <p className={`text-xs font-semibold leading-relaxed ${plan.completed ? "text-slate-450 line-through" : "text-slate-700"}`}>
                              {plan.morningPlan}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-black uppercase text-amber-700 tracking-wide flex items-center gap-1 justify-start">
                              <BookOpen size={12} />
                              <span>🌙 شیفت عصر (تست‌زنی)</span>
                            </span>
                            <p className={`text-xs font-semibold leading-relaxed ${plan.completed ? "text-slate-450 line-through" : "text-slate-700"}`}>
                              {plan.afternoonPlan}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action columns */}
                      <div className="flex items-center justify-between md:justify-end gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50 shrink-0">
                        <span className="text-[10px] font-mono font-black bg-blue-50 text-indigo-950 px-3 py-1 rounded-full border border-blue-100/60 shrink-0">
                          {toPersianNum(plan.totalQuestions)} تست کنکوری
                        </span>
                        
                        {/* Shift arrows to simulate drag and drop optimization */}
                        <div className="flex gap-1" id={`plan-reorder-${idx}`}>
                          <button 
                            disabled={idx === 0}
                            onClick={() => handleMoveUp(idx)}
                            className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition disabled:opacity-30 cursor-pointer"
                            title="انتقال به بالا"
                          >
                            <ArrowUp size={13} className="text-slate-600" />
                          </button>
                          <button 
                            disabled={idx === plans.length - 1}
                            onClick={() => handleMoveDown(idx)}
                            className="p-1.5 bg-slate-50 border border-slate-100 rounded-lg hover:bg-slate-100 transition disabled:opacity-30 cursor-pointer"
                            title="انتقال به پایین"
                          >
                            <ArrowDown size={13} className="text-slate-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
           </AnimatePresence>
        </div>

      </div>

      {/* AI-Powered Pomodoro Focus Timer */}
      <PomodoroTimer />

      {/* Recommended Modules / Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="study-plan-shortcuts">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl text-white shadow-lg shadow-indigo-500/20 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-amber-300" />
              <h4 className="text-xs font-black uppercase tracking-wider">تحلیل تله‌های تستی مرجع</h4>
            </div>
            <p className="text-[11px] text-indigo-100 leading-relaxed font-semibold">
               بر اساس اشتباهات آزمون‌های اخیر، ۱۲ تله متداول در زیست‌شناسی و عروض فشرده برای شما کالیبره شده است.
            </p>
          </div>
          <button 
            onClick={() => onNavigate?.("traps")}
            className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black transition backdrop-blur-sm border border-white/10 cursor-pointer active:scale-95"
          >
            ورود مستقیم به بانک تله تستی
          </button>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-rose-600">
              <Brain size={18} />
              <h4 className="text-xs font-black uppercase tracking-wider">ارزیابی روانشناختی شناختی</h4>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold text-right">
               سطح فرسودگی ذهنی و استرس آزمون شما به همراه راه‌حل‌های علمی افزایش سرعت پاسخ‌گویی در این بخش ردیابی می‌شود.
            </p>
          </div>
          <button 
            onClick={() => onNavigate?.("psychology")}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10px] font-black transition shadow-md cursor-pointer active:scale-95"
          >
            مشاهده رادار استرس و عارضه شناختی
          </button>
        </div>

        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <Calendar size={18} />
              <h4 className="text-xs font-black uppercase tracking-wider">مشاوره تراز مربیان ترنم مهر</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold text-right">
               نزديک‌ترین وبینار ارزیابی استراتژیک رتبه‌ها و آمادگی روحی پایش کایزن، فردا ساعت ۱۸:۳۰ برگزار می‌گردد.
            </p>
          </div>
          <button 
            onClick={() => onNavigate?.("counselor")}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black transition border border-slate-700 cursor-pointer active:scale-95"
          >
            مشاهده جزئیات وبینار پشتیبانی
          </button>
        </div>
      </div>

    </div>
  );
}
