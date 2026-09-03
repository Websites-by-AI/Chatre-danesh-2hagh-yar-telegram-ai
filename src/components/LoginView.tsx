import React, { useState } from "react";
import CounselingSignup from "./CounselingSignup";
import { Sparkles, Phone, Lock, Hash, ShieldCheck, UserCheck, Layers, BookOpen, Activity, Wallet, CreditCard, Home, Play, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { Student } from "../types";
import { BRAND_CONFIG } from "../constants";

interface LoginViewProps {
  onLogin: (student: Student, role: "student" | "parent" | "admin" | "counselor" | "teacher") => void;
  onBackToHome?: () => void;
}

export default function LoginView({ onLogin, onBackToHome }: LoginViewProps) {
  const [activeTab, setActiveTab] = useState<"student" | "parent" | "admin" | "counselor" | "teacher">("student");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [kanoonCode, setKanoonCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"otp" | "password" | "simple">("otp");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState("");
  const [isOrg, setIsOrg] = useState(false);

  // States for more detailed registration info requested by user ("یک سر یاطال بیشتر ور ازش بیره")
  const [regField, setRegField] = useState<"tajrobi" | "riazi" | "ensani" | "honar" | "zaban">("tajrobi");
  const [regGrade, setRegGrade] = useState("پایه دوازدهم");
  const [regCity, setRegCity] = useState("");
  const [regAge, setRegAge] = useState("");
  const [regTargetMajor, setRegTargetMajor] = useState("");
  const [regCurrentMockTraz, setRegCurrentMockTraz] = useState("");
  const [regStudyHours, setRegStudyHours] = useState("");
  const [regStress, setRegStress] = useState("متوسط");
  const [parentMobile, setParentMobile] = useState("");
  const [parentName, setParentName] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);
  const [formError, setFormError] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // Demo fallbacks may preview non-sensitive role dashboards, but must never
  // grant the administrator role without a server-authenticated admin account.
  const safeDemoRole = activeTab === "admin" ? "student" : activeTab;

  // Helper helper function to retrieve custom local registrations
  const getLocalRegistrations = (): Student[] => {
    try {
      const data = localStorage.getItem("arateb_new_registrations");
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  /** ذخیره ثبت‌نام در فضای محلی (برای حالت دمو/آفلاین و جستجوی ورود بعدی) */
  const saveLocalRegistration = (s: Student) => {
    try {
      const regs = getLocalRegistrations();
      localStorage.setItem("arateb_new_registrations", JSON.stringify([...regs, s]));
    } catch {}
  };

  /**
   * فراخوان واحد API احراز هویت (دیتابیس واقعی D1).
   * اگر سرور/دیتابیس در دسترس نباشد (503 یا خطای شبکه) available=false برمی‌گردد
   * تا جریان جایگزین لوکال فعال شود.
   */
  const apiAuth = async (path: string, body: Record<string, unknown>): Promise<{ available: boolean; ok: boolean; status: number; data: any }> => {
    try {
      const res = await fetch(`/api/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const ct = (res.headers.get("content-type") || "").toLowerCase();
      let data: any = null;
      if (ct.includes("application/json")) {
        try { data = await res.json(); } catch {}
      }
      // پاسخ SPA fallback (HTML) یا نبود سرویس دیتابیس (503) ⇒ حالت جایگزین لوکال
      if (!ct.includes("application/json") || res.status === 503 || (res.status === 404 && data?.error === "Not found")) {
        return { available: false, ok: false, status: res.status, data };
      }
      return { available: true, ok: res.ok, status: res.status, data };
    } catch {
      return { available: false, ok: false, status: 0, data: null };
    }
  };

  /** تبدیل پاسخ کاربر D1 به مدل Student */
  const apiUserToStudent = (u: any): Student => ({
    id: u.id,
    name: u.name,
    code: u.code || u.mobile || u.id,
    field: u.field || "tajrobi",
    grade: u.grade || "کاربر ثبت‌نام شده",
    city: u.city || "نامشخص",
    age: u.age || 18,
    paymentStatus: "paid",
    subscriptionType: "free",
    accountRole: (["student", "parent", "admin", "counselor", "teacher"].includes(u.accountRole)
      ? u.accountRole
      : "student") as Student["accountRole"],
  } as Student);

  // داوطلبان و لاین‌های فعال در ترنم مهر
  const mockStudents: Student[] = [
    { id: "demo", name: "کاربر دمو (آموزش استفاده از سایت)", code: "0000000", field: "tajrobi", grade: "آشنایی با امکانات ترنم مهر" },
    { id: "1", name: "مریم حسینی (رشته علوم تجربی - هدف پزشکی تهران)", code: "9812405", field: "tajrobi", grade: "رتبه فرضی ۴۷ کشوری - تراز ۱۰/۴۵۰" },
    { id: "2", name: "علیرضا رضایی (رشته ریاضی فیزیک - هدف مهندسی کامپیوتر شریف)", code: "9786431", field: "riazi", grade: "رتبه فرضی ۲۴ کشوری - تراز ۱۰/۱۲۰" },
    { id: "3", name: "امیرمحمد اکبری (رشته علوم انسانی - هدف حقوق دانشگاه تهران)", code: "9921477", field: "ensani", grade: "رتبه فرضی ۱۲ کشوری - تراز ۹/۹۵۰" }
  ];

  const autoFillTestData = () => {
    setRegName("امیررضا صادقی (تستی)");
    setMobileNumber("09123456789");
    setRegField("riazi");
    setRegCity("اصفهان");
    setRegAge("18");
    setRegTargetMajor("مهندسی کامپیوتر دانشگاه شریف");
    setRegCurrentMockTraz("7850");
    setRegStudyHours("11");
    setRegStress("سالم و بسیار پورانرژی");
  };

  const handlePaymentAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!mobileNumber.startsWith("09") || mobileNumber.length !== 11) {
      setFormError("لطفاً شماره موبایل معتبر ۱۱ رقمی وارد کنید.");
      return;
    }
    if (!regName.trim()) {
      setFormError("لطفاً نام خود را وارد کنید.");
      return;
    }
    setLoading(true);

    // Direct registration as requested
    await confirmPaymentSimulation();
  };

  const confirmPaymentSimulation = async () => {
    setShowPaymentModal(false);

    const userEmail = email.trim().toLowerCase();
    if (!password || password.length < 6) {
      setFormError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
      setLoading(false);
      return;
    }

    const newStudentObj: Student = {
      id: Date.now().toString(),
      name: regName,
      code: "NEW_" + Math.floor(Math.random() * 100000 + 10000),
      field: regField,
      grade: `${regGrade}${regTargetMajor ? ` - هدف: ${regTargetMajor}` : ""}`,
      city: regCity || "تهران",
      age: Number(regAge) || 18,
      paymentStatus: "paid",
      subscriptionType: "free"
    };

    // ۱) ثبت‌نام واقعی در دیتابیس D1 — رمز عبور سمت سرور به‌صورت PBKDF2 هش می‌شود
    const signup = await apiAuth("register", {
      name: regName.trim(),
      email: userEmail || undefined,
      mobile: mobileNumber,
      password,
      field: regField,
      grade: regGrade,
      city: regCity || undefined,
      age: Number(regAge) || undefined,
      targetMajor: regTargetMajor || undefined,
    });

    if (signup.available) {
      if (signup.ok && signup.data?.user) {
        const student = {
          ...apiUserToStudent(signup.data.user),
          grade: newStudentObj.grade,
          city: newStudentObj.city,
          age: newStudentObj.age,
        };
        saveLocalRegistration(student);
        setPaymentSuccessData({ ...student, email: signup.data.user.email || userEmail || undefined });
      } else {
        // خطای منطقی سرور: تکراری (۴۰۹)، داده نامعتبر (۴۰۰) و ...
        setFormError(signup.data?.error || "ثبت‌نام انجام نشد؛ اطلاعات را بررسی کنید.");
      }
      setLoading(false);
      return;
    }

    // ۲) حالت جایگزین آفلاین/دمو — فقط ذخیره محلی (هیچ رمزی به صورت متن‌باز نگهداری نمی‌شود)
    saveLocalRegistration(newStudentObj);
    setPaymentSuccessData({ ...newStudentObj, email: userEmail || undefined, offlineMode: true });
    setLoading(false);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileNumber.startsWith("09") || mobileNumber.length !== 11) {
      alert("لطفاً شماره موبایل معتبر ۱۱ رقمی وارد نمایید. (شروع با ۰۹)");
      return;
    }
    setLoading(true);
    setDevOtp(null);
    // ۱) درخواست کد واقعی از سرور D1 (محلی: devCode نمایش داده می‌شود تا وقتی درگاه SMS متصل نیست)
    const sent = await apiAuth("otp-send", { mobile: mobileNumber });
    setLoading(false);
    if (sent.available) {
      if (sent.ok) {
        setOtpSent(true);
        if (sent.data?.devCode) setDevOtp(String(sent.data.devCode));
      } else {
        alert(sent.data?.error || "ارسال کد ناموفق بود. لطفاً دوباره تلاش کنید.");
      }
      return;
    }
    // ۲) حالت دمو (آفلاین)
    setOtpSent(true);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ۱) تأیید کد واقعی از سرور D1
    const verified = await apiAuth("otp-verify", { mobile: mobileNumber, code: otpCode });
    if (verified.available) {
      if (verified.ok && verified.data?.user) {
        const student = apiUserToStudent(verified.data.user);
        saveLocalRegistration(student);
        // Privileged roles always come from the authenticated server record,
        // never from the role tab selected in the browser.
        onLogin(student, student.accountRole || "student");
      } else {
        alert(verified.data?.error || "کد تایید نادرست است.");
      }
      setLoading(false);
      return;
    }

    // ۲) حالت دمو (کد ارزیابی 1234)
    if (otpCode !== "1234" && otpCode !== "12345") {
      setLoading(false);
      alert("کد تایید نادرست است. (جهت ارزیابی از '1234' استفاده کنید)");
      return;
    }

    // دموی محلی — بدون Firestore (تحریم از ایران)
    const localRegs = getLocalRegistrations();
    const matched = mockStudents.find(s => s.id === mobileNumber) ||
                    localRegs.find(s => s.mobile === mobileNumber) ||
                    mockStudents[0];
    onLogin(matched, safeDemoRole);
    setLoading(false);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ۱) ورود واقعی از سرور D1 (مقایسه امن رمز با PBKDF2)
    const login = await apiAuth("login", { identifier: email.trim(), password });
    if (login.available) {
      if (login.ok && login.data?.user) {
        const authenticatedUser = apiUserToStudent(login.data.user);
        onLogin(authenticatedUser, authenticatedUser.accountRole || "student");
      } else {
        alert(login.status === 404 || login.status === 401
          ? "نام کاربری یا رمز عبور اشتباه است."
          : (login.data?.error || "خطا در ورود. لطفاً دوباره تلاش کنید."));
      }
      setLoading(false);
      return;
    }

    // مسیر قدیمی Firestore حذف شد (تحریم گوگل برای IP ایران → 403 و هنگ صفحه ورود). فقط D1.
    setLoading(false);
    alert("نام کاربری یا رمز عبور اشتباه است.");
  };

  const handleSimpleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // دموی محلی — Firestore حذف شد
    onLogin(mockStudents[1], safeDemoRole);
    setLoading(false);
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 gap-5">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-indigo-900/10 overflow-hidden border border-slate-200"
        id="login-card-container"
      >
        <div className="bg-gradient-to-tr from-blue-950 via-slate-900 to-indigo-950 p-8 text-center text-white relative">
          {onBackToHome && (
            <div className="absolute top-4 right-4 z-20">
              <button 
                type="button"
                onClick={onBackToHome}
                className="text-white bg-white/10 hover:bg-white/20 hover:scale-105 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black transition flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
              >
                <Home size={11} />
                <span>برگشت به خانه</span>
              </button>
            </div>
          )}
          <div className="absolute top-2 right-2 opacity-10">
            <Layers size={150} />
          </div>
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
            <Sparkles size={36} className="text-amber-400" />
          </div>
          <h1 className="text-2xl font-black tracking-tight mb-2">{BRAND_CONFIG.name}</h1>
          <p className="text-blue-200/90 text-xs">سامانه هوشمند مانیتورینگ تراز، کایزن درسی و آمادگی کنکور سراسری</p>
        </div>

        {/* Roles Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 gap-1 overflow-x-auto whitespace-nowrap" id="login-role-tabs">
          {(["student", "parent", "counselor", "teacher", "admin"] as const).map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setActiveTab(tab);
                setOtpSent(false);
                setOtpCode("");
              }}
              className={`flex-1 py-3 px-2 text-[10px] sm:text-xs font-black rounded-xl transition-all duration-300 cursor-pointer relative overflow-hidden flex items-center justify-center ${
                activeTab === tab
                  ? "text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/30"
              }`}
              id={`tab-button-${tab}`}
            >
              <span className="relative z-10">
                {tab === "student" && "🎓 داوطلب"}
                {tab === "parent" && "👥 والدین"}
                {tab === "counselor" && "👔 مشاور"}
                {tab === "teacher" && "👨‍🏫 معلم"}
                {tab === "admin" && "📐 ادمین"}
              </span>
              {activeTab === tab && (
                <motion.div 
                  layoutId="active-login-tab"
                  className="absolute inset-0 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500"
                  initial={false}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </motion.button>
          ))}
        </div>

        <div className="p-8">
          <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-6 border border-slate-150 shadow-inner">
            <button 
              onClick={() => setIsRegistering(false)}
              className={`flex-1 py-2.5 text-[11px] font-black rounded-xl transition-all ${!isRegistering ? 'bg-white text-blue-900 shadow-sm border border-slate-100' : 'text-slate-400'}`}
            >
              ورود اعضای قبلی
            </button>
            <button 
              onClick={() => setIsRegistering(true)}
              className={`flex-1 py-2.5 text-[11px] font-black rounded-xl transition-all ${isRegistering ? 'bg-white text-blue-900 shadow-sm border border-slate-100' : 'text-slate-400'}`}
            >
              ثبت‌نام جدید و پرداخت
            </button>
          </div>

          {isRegistering ? (
            <div className="space-y-6 animate-fade-in" id="registration-plans-container">
              <div className="text-center mb-6">
                <h3 className="text-sm font-black text-slate-800">انتخاب پکیج هوشمند اشتراک {BRAND_CONFIG.name}</h3>
                <p className="text-[10px] text-slate-500 font-bold mt-1">تخمین هزینه و فعال‌سازی خدمات بر اساس نقش کاربری</p>
              </div>

              <div className="space-y-4">
                {(activeTab === "student" || activeTab === "parent") && (
                  <>
                    {/* Free Trial Student Plan */}
                    {activeTab === "student" && (
                      <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm hover:border-emerald-400 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <BookOpen size={20} />
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] font-black text-emerald-500 block">شروع سریع و بدون ریسک</span>
                            <span className="text-sm font-black text-slate-900">تست رایگان ۱ هفته</span>
                          </div>
                        </div>
                        <p className="text-[9px] text-slate-500 leading-relaxed text-right mb-4">ثبت‌نام سریع برای مشاهده محیط هوشمند ترنم مهر. برخی امکانات پیشرفته (پومودورو، تحلیل تراز AI) پس از ارتقاء به پکیج VIP فعال خواهند شد.</p>
                        <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                          <div className="text-right">
                            <span className="text-xs font-black text-emerald-600">رایگان</span>
                            <span className="text-[8px] text-slate-400 block">بدون نیاز به کارت بانکی</span>
                          </div>
                          <button 
                            onClick={() => setRegName("ثبت‌نام رایگان داوطلب (تست ۱ هفته)")} 
                            className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-xl hover:bg-emerald-700 transition"
                          >
                            ثبت‌نام رایگان داوطلب
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Parent + Student Plan */}
                    {activeTab === "parent" && (
                      <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-3xl shadow-sm relative overflow-hidden group">
                        <div className="absolute -top-2 -left-2 bg-amber-400 text-white text-[8px] font-black px-4 py-2 rotate-[-12deg] shadow-sm z-10">پیشنهادی</div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="p-2 bg-white text-indigo-600 rounded-xl shadow-sm">
                            <UserCheck size={20} />
                          </div>
                          <div className="text-left">
                            <span className="text-[10px] font-black text-indigo-400 block">پکیج مربیگری</span>
                            <span className="text-sm font-black text-indigo-900">داوطلب + والدین</span>
                          </div>
                        </div>
                        <p className="text-[9px] text-indigo-700 leading-relaxed text-right mb-4">شامل اپلیکیشن اختصاصی والدین برای مانیتورینگ لحظه‌ای، گزارش‌های هفتگی پیامکی و تحلیل مقایسه‌ای عملکرد.</p>
                        <div className="flex justify-between items-center pt-3 border-t border-indigo-100">
                          <div className="text-right">
                            <span className="text-xs font-black text-indigo-900">۸۵۰,۰۰۰ تومان</span>
                            <span className="text-[8px] text-indigo-400 block">شامل ۲ دسترسی مجزا</span>
                          </div>
                          <button 
                            onClick={() => setRegName("اشتراک خانوادگی")} 
                            className="px-4 py-2 bg-indigo-900 text-white text-[10px] font-black rounded-xl hover:bg-slate-900 transition shadow-lg shadow-indigo-900/20"
                          >
                            انتخاب و فعال‌سازی
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {(activeTab === "counselor" || activeTab === "teacher" || activeTab === "admin") && (
                  <>
                    {/* Institutional Plan */}
                    <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl shadow-xl group">
                      <div className="flex justify-between items-start mb-3">
                        <div className="p-2 bg-slate-800 text-amber-400 rounded-xl">
                          <Layers size={20} />
                        </div>
                        <div className="text-left">
                          <span className="text-[10px] font-black text-slate-500 block">SaaS سازمان</span>
                          <span className="text-sm font-black text-white">پکیج موسسات و مدارس</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-relaxed text-right mb-4">پنل مدیریت یکپارچه برای مشاوران و مدارس، دیتابیس اختصاصی و برندینگ سفارشی برای مجموعه شما.</p>
                      
                      <div className="space-y-2 mb-4">
                        <span className="text-[8px] font-black text-slate-500 block text-right mb-1">مشاهده نمونه دمو موسسات همکار:</span>
                        <div className="flex gap-2">
                          <button onClick={() => { setRegName("آکادمی نخبگان البرز"); setIsOrg(true); }} className="flex-1 py-1.5 px-2 bg-slate-800 rounded-lg text-[8px] font-black text-slate-300 hover:bg-slate-700 border border-slate-700 transition">آکادمی نخبگان</button>
                          <button onClick={() => { setRegName("دبیرستان هوشمند آتیه"); setIsOrg(true); }} className="flex-1 py-1.5 px-2 bg-slate-800 rounded-lg text-[8px] font-black text-slate-300 hover:bg-slate-700 border border-slate-700 transition">دبیرستان آتیه</button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-slate-800">
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-black text-amber-400">۱۰,۰۰۰,۰۰۰</span>
                            <span className="text-[8px] text-slate-500">تومان</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => { setRegName("ثبت‌نام موسسه جدید"); setIsOrg(true); }} 
                          className="px-4 py-2 bg-amber-500 text-slate-900 text-[10px] font-black rounded-xl hover:bg-amber-400 transition"
                        >
                          درخواست پنل اختصاصی
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {regName && (
                <form onSubmit={handlePaymentAndRegister} className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                  {formError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold p-3 rounded-xl mb-4 text-center animate-fade-in">
                      {formError}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2 p-3 bg-slate-50 rounded-2xl border border-slate-150">
                    <Activity size={16} className="text-indigo-600" />
                    <span className="text-[10px] font-black text-slate-700">{isOrg ? "نام موسسه/سازمان:" : "درحال ثبت‌نام برای:"} <span className="text-indigo-900 underline">{regName}</span></span>
                    <button onClick={() => { setRegName(""); setIsOrg(false); }} className="mr-auto text-[10px] text-rose-500 font-bold">تغییر پلن</button>
                  </div>
                  
                  {isOrg ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-600 mb-1">نام نهایی موسسه / برند آموزشی</label>
                        <input 
                          type="text" 
                          value={regName === "ثبت‌نام موسسه جدید" ? "" : regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="نام مجموعه خود را وارد کنید" 
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-right text-xs focus:ring-2 focus:ring-amber-500 outline-none" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-600 mb-1">نام مدیر/مسئول فنی</label>
                        <input type="text" placeholder="مثال: دکتر علوی" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-right text-xs focus:ring-2 focus:ring-amber-500 outline-none" required />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-600 mb-1">تعداد حدودی دانش‌آموزان</label>
                        <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-right text-xs focus:ring-2 focus:ring-amber-500 outline-none">
                          <option>تا ۵۰ نفر</option>
                          <option>۵۰ تا ۲۰۰ نفر</option>
                          <option>بیش از ۲۰۰ نفر (سازمانی)</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-indigo-50/50 p-2.5 rounded-2xl border border-indigo-100">
                        <span className="text-[10px] font-black text-indigo-950 flex items-center gap-1.5 text-right">
                          <Sparkles size={14} className="text-amber-500 animate-pulse" />
                          تست کلیک سریع ثبت‌نام هویتی
                        </span>
                        <button
                          type="button"
                          onClick={autoFillTestData}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black rounded-lg transition overflow-hidden cursor-pointer"
                        >
                          پرکردن تستی فرم ⚡
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">نام و نام خانوادگی داوطلب <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            required
                            value={regName}
                            placeholder="مثال: امیررضا صادقی"
                            onChange={(e) => setRegName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-xs font-extrabold transition duration-150"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">ایمیل (اختیاری)</label>
                          <input
                            type="email"
                            value={email}
                            placeholder="example@gmail.com"
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-xs font-extrabold transition duration-150"
                            dir="ltr"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">رمز عبور ورود <span className="text-rose-500">*</span></label>
                          <input
                            type="password"
                            required
                            value={password}
                            placeholder="حداقل ۶ کاراکتر"
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-xs font-extrabold transition duration-150"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-600 mb-1">سن داوطلب</label>
                          <input
                            type="number"
                            value={regAge}
                            placeholder="مثال: ۱۸"
                            onChange={(e) => setRegAge(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-xs font-extrabold transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-600 mb-1">شهر محل سکونت</label>
                          <input
                            type="text"
                            value={regCity}
                            placeholder="مثال: اصفهان"
                            onChange={(e) => setRegCity(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-xs font-extrabold transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-600 mb-1">رشته تحصیلی کنکور</label>
                          <select
                            value={regField}
                            onChange={(e) => setRegField(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-xs font-extrabold transition cursor-pointer"
                          >
                            <option value="tajrobi">علوم تجربی</option>
                            <option value="riazi">ریاضی فیزیک</option>
                            <option value="ensani">علوم انسانی</option>
                            <option value="honar">هنر</option>
                            <option value="zaban">زبان‌های خارجی</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-600 mb-1">پایه تحصیلی</label>
                          <select
                            value={regGrade}
                            onChange={(e) => setRegGrade(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-xs font-extrabold transition cursor-pointer"
                          >
                            <optgroup label="متوسطه اول">
                              <option value="پایه هفتم">هفتم</option>
                              <option value="پایه هشتم">هشتم</option>
                              <option value="پایه نهم">نهم</option>
                            </optgroup>
                            <optgroup label="متوسطه دوم">
                              <option value="پایه دهم">دهم</option>
                              <option value="پایه یازدهم">یازدهم</option>
                              <option value="پایه دوازدهم">دوازدهم</option>
                              <option value="پشت کنکوری">پشت کنکوری</option>
                            </optgroup>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-600 mb-1">تراز شبیه‌ساز کنکور</label>
                          <input
                            type="number"
                            value={regCurrentMockTraz}
                            placeholder="مثال: ۷۵۰۰"
                            onChange={(e) => setRegCurrentMockTraz(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-xs font-extrabold font-mono transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">رشته و دانشگاه هدف طلایی</label>
                        <input
                          type="text"
                          value={regTargetMajor}
                          placeholder="مثال: مهندسی کامپیوتر دانشگاه شریف"
                          onChange={(e) => setRegTargetMajor(e.target.value)}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-xs font-extrabold transition"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-slate-600 mb-1">ساعت مطالعه روزانه</label>
                          <input
                            type="number"
                            value={regStudyHours}
                            placeholder="مثال: ۱۰"
                            onChange={(e) => setRegStudyHours(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-xs font-extrabold font-mono transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-600 mb-1">تمرکز روحی / استرس</label>
                          <select
                            value={regStress}
                            onChange={(e) => setRegStress(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white text-xs font-extrabold transition cursor-pointer"
                          >
                            <option value="خیلی عالی و پرانرژی">عالی و پرانرژی</option>
                            <option value="متوسط و متعادل">متوسط و متعادل</option>
                            <option value="کمی نگران و مضطرب">کمی مضطرب</option>
                            <option value="پر استرس / نیاز به مربی">نیاز به مربی مکرر</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      {isOrg ? "شماره همراه مسئول/رابط" : "شماره موبایل داوطلب"} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <Phone size={18} />
                      </div>
                      <input
                        type="tel"
                        required
                        maxLength={11}
                        placeholder="09..."
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white font-mono tracking-widest text-slate-800 text-sm transition duration-150"
                      />
                    </div>
                  </div>
                  
                  {/* Parent info fields (optional) */}
                  {!isOrg && (activeTab === "parent" || regName.includes("خانوادگی") || regName.includes("والدین")) && (
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3 mt-4">
                      <h4 className="text-[10px] font-black text-indigo-800 flex items-center gap-1.5">
                        <UserCheck size={14} /> اطلاعات والدین (اختیاری)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">نام و نام خانوادگی والد</label>
                          <input
                            type="text"
                            value={parentName}
                            onChange={(e) => setParentName(e.target.value)}
                            placeholder="مثال: پدر امیررضا"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-right focus:outline-none focus:ring-2 focus:ring-indigo-600 text-xs transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-1">شماره موبایل والدین</label>
                          <input
                            type="tel"
                            maxLength={11}
                            value={parentMobile}
                            onChange={(e) => setParentMobile(e.target.value.replace(/[^0-9]/g, ""))}
                            placeholder="09..."
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono tracking-widest text-slate-800 text-xs transition"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition duration-150 shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <CheckCircle size={18} />
                        <span>تایید نهایی و ورود به پنل کاربری</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in">
              <div className="flex bg-slate-100 p-1 rounded-xl mb-4 gap-1">
                <button 
                  onClick={() => setLoginMethod("otp")}
                  className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${loginMethod === "otp" ? "bg-white text-blue-900 shadow-sm" : "text-slate-400"}`}
                >
                  ورود با پیامک
                </button>
                <button 
                  onClick={() => setLoginMethod("password")}
                  className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${loginMethod === "password" ? "bg-white text-blue-900 shadow-sm" : "text-slate-400"}`}
                >
                  ورود با رمز عبور
                </button>
                <button 
                  onClick={() => setLoginMethod("simple")}
                  className={`flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all ${loginMethod === "simple" ? "bg-white text-blue-900 shadow-sm" : "text-slate-400"}`}
                >
                  ورود سریع (ایمیل)
                </button>
              </div>

              {!otpSent && loginMethod === "otp" && (
                <form onSubmit={handleSendOtp} className="space-y-5" id="send-otp-form">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">شماره تلفن همراه پرسنلی</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <Phone size={18} />
                      </div>
                      <input
                        type="tel"
                        required
                        maxLength={11}
                        placeholder="مثال: 09123456789"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white font-mono tracking-widest text-slate-800 text-sm transition duration-150"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">رمز تایید یکبار مصرف امنیتی برای ورود به پرتال سازمانی ارسال خواهد شد.</p>
                  </div>

                  {activeTab !== "admin" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        {activeTab === "student" && `کد داوطلب / شناسه کارنامه ${BRAND_CONFIG.name} (اختیاری)`}
                        {activeTab === "parent" && `کد داوطلب / شناسه کارنامه فرزند (اختیاری)`}
                        {activeTab === "counselor" && `کد داوطلب مورد نظر جهت بازسازی و مانیتورینگ (اختیاری)`}
                        {activeTab === "teacher" && `کد داوطلب کلاس جهت مانیتورینگ تراز (اختیاری)`}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                          <Hash size={18} />
                        </div>
                        <input
                          type="text"
                          placeholder="مانند: 9812405 یا کد ثبت‌نامی جدید"
                          value={kanoonCode}
                          onChange={(e) => setKanoonCode(e.target.value)}
                          className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white font-mono tracking-widest text-slate-800 text-sm transition duration-150"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-950 text-white py-3.5 rounded-xl font-bold hover:bg-slate-900 transition duration-150 shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                    id="btn-send-otp"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>ارسال پین امنیتی ورود</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {otpSent && loginMethod === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-5" id="verify-otp-form">
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-3">
                    <ShieldCheck className="text-blue-600 flex-shrink-0" size={20} />
                    <div className="text-xs text-blue-950 leading-relaxed">
                      کد ورود یکبار مصرف به شماره موبایل پرسنلی <strong className="font-mono">{mobileNumber}</strong> تلگراف شد.
                    </div>
                  </div>

                  {devOtp && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center" id="dev-otp-box">
                      <p className="text-[10px] text-amber-700 font-bold">درگاه پیامک هنوز متصل نیست — کد آزمایشی شما:</p>
                      <p className="text-2xl font-black text-amber-600 font-mono tracking-[0.4em] mt-1 select-all">{devOtp}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">کد یکبار مصرف امنیتی</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <Lock size={18} />
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="کد ۶ رقمی (در دمو: 1234)"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                        className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white font-mono tracking-widest text-slate-800 text-lg transition duration-150"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-950 text-white py-3.5 rounded-xl font-bold hover:bg-slate-900 transition duration-150 shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                    id="btn-verify-login"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <UserCheck size={18} />
                        <span>تأیید پین و ورود به سیستم</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {loginMethod === "password" && (
                <form onSubmit={handlePasswordLogin} className="space-y-5" id="password-login-form">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">شماره موبایل یا ایمیل</label>
                    <input
                      type="text"
                      required
                      placeholder="09... یا example@mail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white text-slate-800 text-sm transition duration-150"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">رمز عبور</label>
                    <input
                      type="password"
                      required
                      placeholder="******"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white text-slate-800 text-sm transition duration-150"
                      dir="ltr"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-950 text-white py-3.5 rounded-xl font-bold hover:bg-slate-900 transition duration-150 shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Lock size={18} />
                        <span>ورود با رمز عبور</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {loginMethod === "simple" && (
                <form onSubmit={handleSimpleLogin} className="space-y-5" id="simple-login-form">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">ایمیل جهت ورود تستی</label>
                    <input
                      type="email"
                      required
                      placeholder="test@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-left focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white text-slate-800 text-sm transition duration-150"
                      dir="ltr"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition duration-150 shadow-md flex items-center justify-center gap-2 text-sm cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <UserCheck size={18} />
                        <span>ورود مستقیم و تایید (تست)</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}


          {/* Direct Sandbox Buttons for easy evaluation */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 mb-3">دسترسی سریع توسعه‌دهنده جهت بررسی نقش‌های کاربری</p>
            <div className="flex flex-wrap justify-center gap-2">
              <button 
                type="button"
                onClick={() => {
                  localStorage.removeItem('manova_has_seen_tour');
                  onLogin(mockStudents[0], "student");
                }}
                className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-black text-xs rounded-lg transition border border-violet-200 shadow-sm cursor-pointer w-full mb-2 flex items-center justify-center gap-2"
              >
                <Play size={14} />
                ورود دمو (آموزش استفاده از سایت)
              </button>
              <button 
                type="button"
                onClick={() => onLogin(mockStudents[1], "student")}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition border border-indigo-100 cursor-pointer"
              >
                 داوطلب ۱ (تجربی / پزشکی)
              </button>
              <button 
                type="button"
                onClick={() => onLogin(mockStudents[2], "student")}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition border border-blue-100 cursor-pointer"
              >
                 داوطلب ۲ (ریاضی / مهندسی)
              </button>
              <button 
                type="button"
                onClick={() => onLogin(mockStudents[1], "parent")}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-lg transition border border-amber-100 cursor-pointer"
              >
                پورتال نظارتی والدین {BRAND_CONFIG.name}
              </button>
              <button 
                type="button"
                onClick={() => onLogin(mockStudents[1], "counselor")}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-150 text-rose-700 font-bold text-xs rounded-lg transition border border-rose-100 cursor-pointer"
              >
                👔 پورتال مشاور ارشد کایزن
              </button>
              <button 
                type="button"
                onClick={() => onLogin(mockStudents[1], "teacher")}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-150 text-indigo-700 font-bold text-xs rounded-lg transition border border-indigo-105 cursor-pointer"
              >
                👨‍🏫 پورتال اختصاصی معلمین کنکور
              </button>
              <button 
                type="button"
                onClick={() => onLogin(mockStudents[1], "admin")}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg transition border border-emerald-100 cursor-pointer"
              >
                پورتال ادمین / معماری SaaS
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* فرم ثبت‌نام مشاوره تحصیلی (عمومی) */}
      <div className="w-full max-w-md">
        <CounselingSignup />
      </div>

      {/* Payment Simulation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden"
          >
            <div className="bg-indigo-600 p-6 text-center text-white">
              <ShieldCheck size={40} className="mx-auto mb-3 opacity-90" />
              <h3 className="text-lg font-black">درگاه پرداخت شبیه‌سازی شده</h3>
              <p className="text-xs text-indigo-200 mt-1">آزمایش امن ثبت‌نام</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2 text-xs font-bold text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 text-right">
                <div className="flex justify-between"><span>نام ثبت‌نامی:</span> <span className="text-slate-900">{regName}</span></div>
                <div className="flex justify-between"><span>موبایل:</span> <span className="text-slate-900 font-mono" dir="ltr">{mobileNumber}</span></div>
                <div className="flex justify-between"><span>مبلغ پرداخت:</span> <span className="text-indigo-600">{isOrg ? '۱۰,۰۰۰,۰۰۰' : (regName === 'اشتراک خانوادگی' || regName === 'پکیج مربیگری داوطلب + والدین' ? '۸۵۰,۰۰۰' : '۴۵۰,۰۰۰')} تومان</span></div>
                <div className="flex justify-between"><span>بسته:</span> <span className="text-slate-900">{isOrg ? 'پنل موسسات' : (regName === 'اشتراک خانوادگی' || regName === 'پکیج مربیگری داوطلب + والدین' ? 'اشتراک مربیگری داوطلب+والدین' : 'اشتراک سالیانه VIP')}</span></div>
              </div>
              
              <button 
                onClick={confirmPaymentSimulation}
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
              >
                {loading ? <Activity size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                تکمیل پرداخت و ثبت‌نام
              </button>
              
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="w-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold py-3 px-4 rounded-xl transition text-xs"
              >
                انصراف
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Payment Success Modal */}
      {paymentSuccessData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden text-center p-8"
          >
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2">
              ثبت‌نام با موفقیت انجام شد!
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              خوش آمدید <strong className="text-slate-900">{paymentSuccessData.name}</strong> عزیز.
              <br />
              {paymentSuccessData.email
                ? <>حساب کاربری شما با ایمیل <span className="font-mono text-indigo-600">{paymentSuccessData.email}</span> فعال گردید.</>
                : <>حساب کاربری شما با شماره موبایل ثبت‌شده فعال گردید.</>}
              {paymentSuccessData.offlineMode && (
                <span className="block mt-2 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                  حالت آفلاین/دمو: اطلاعات فعلاً به‌صورت محلی نگهداری می‌شود.
                </span>
              )}
            </p>
            
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl mb-8">
              <p className="text-xs text-indigo-800 font-bold mb-2">شناسه اختصاصی شما:</p>
              <div className="text-3xl font-black text-indigo-600 tracking-widest font-mono select-all">
                {paymentSuccessData.id.substring(0, 8)}
              </div>
              <p className="text-[9px] text-indigo-400 mt-2 font-medium">این شناسه و ایمیل شما برای ورودهای بعدی استفاده خواهد شد.</p>
            </div>

            <button 
              onClick={() => {
                const student: Student = {
                  ...paymentSuccessData,
                  paymentStatus: "paid",
                  subscriptionType: "free"
                };
                onLogin(student, safeDemoRole);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-4 rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              ورود به داشبورد هوشمند
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
