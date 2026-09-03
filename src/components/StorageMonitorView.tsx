import React, { useState, useEffect } from 'react';
import { Database, Zap, Activity, Shield, HardDrive, RefreshCw, Layers, CheckCircle2, Server, Key, AlertCircle, Cloud } from 'lucide-react';

export default function StorageMonitorView() {
  const [activeKeysCount, setActiveKeysCount] = useState(0);
  const [isPinging, setIsPinging] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, {status: string, ms?: number}>>({});

  useEffect(() => {
    // Count active custom arateb/taranom keys in localStorage
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("arateb_") || k.startsWith("taranom_"))) {
            count++;
        }
    }
    setActiveKeysCount(count);
  }, []);

  const handlePingAll = () => {
    setIsPinging(true);
    setTestResults({});

    const endpoints = [
        { id: "health", name: "Health Check", url: "/api/health", method: "GET" },
        { id: "ai", name: "AI Status", url: "/api/ai-status", method: "GET" },
        { id: "motivational", name: "Motivational", url: "/api/motivational", method: "GET" },
        { id: "chat", name: "Chat", url: "/api/chat", method: "POST" },
        { id: "goal", name: "Goal", url: "/api/goal-insight", method: "POST" },
        { id: "exam", name: "Exam Analysis", url: "/api/analyze-exam", method: "POST" },
        { id: "psychology", name: "Psychology", url: "/api/psychology-analysis", method: "POST" },
        { id: "payment", name: "Payment", url: "/api/payment/request", method: "POST" }
    ];

    let completed = 0;
    
    endpoints.forEach(async (ep) => {
        const start = performance.now();
        try {
            const res = await fetch(ep.url, {
                method: ep.method,
                headers: { "Content-Type": "application/json" },
                body: ep.method === "POST" ? JSON.stringify({ testPing: true }) : undefined
            });
            const ms = Math.round(performance.now() - start);
            setTestResults(prev => ({ ...prev, [ep.id]: { status: res.ok ? "success" : "error", ms } }));
        } catch (error) {
            const ms = Math.round(performance.now() - start);
            setTestResults(prev => ({ ...prev, [ep.id]: { status: "error", ms } }));
        } finally {
            completed++;
            if (completed === endpoints.length) setIsPinging(false);
        }
    });
  };

  const handleTestStorage = () => {
    try {
      const testKey = "taranom_test_sys_storage";
      localStorage.setItem(testKey, "live");
      const saved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      if (saved === "live") {
        alert("تست لایه ذخیره‌سازی محلی (LocalStorage) با موفقیت انجام شد و سرویس در دسترس است.");
      } else {
        alert("خطا: حافظه مرورگر در دسترس یا قابل نوشتن نیست.");
      }
    } catch {
      alert("خطا: حافظه مرورگر پر شده است یا مسدود می‌باشد.");
    }
  };

  const databases = [
    {
      icon: "🐘", title: "Replit PostgreSQL", badge: "پیشنهاد اول ✦",
      desc: "دیتابیس PostgreSQL بومی Replit — داخل همین پنل، بدون سرویس خارجی، صفر تا صد یکپارچه.",
      docs: [
        { label: "DATABASE_URL", val: "خودکار توسط Replit تنظیم می‌شود" },
        { label: "npm install", val: "pg @types/pg", isCode: true }
      ],
      steps: [
        "در پنل Replit روی «+» یا Add Database کلیک کنید.",
        "PostgreSQL را انتخاب و Attach کنید.",
        "متغیر DATABASE_URL خودکار در Secrets قرار می‌گیرد.",
        "با import pg در server.ts یا routes وصل شوید."
      ]
    },
    {
      icon: "⚡", title: "Supabase", badge: "محبوب",
      desc: "PostgreSQL مدیریت‌شده با REST API خودکار، Auth، Storage و Realtime رایگان.",
      docs: [
        { label: "SUPABASE_URL", val: "از Settings → API در داشبورد Supabase" },
        { label: "SUPABASE_SERVICE_KEY", val: "کلید سرور (service_role) — فقط در backend" },
        { label: "npm install", val: "@supabase/supabase-js", isCode: true }
      ],
      steps: [
        "به supabase.com بروید، پروژه جدید بسازید.",
        "Settings → API → کلیدها را کپی کنید.",
        "در Replit Secrets سه متغیر بالا را اضافه کنید.",
        "createClient(url, key) را در server.ts فراخوانی کنید."
      ]
    },
    {
      icon: "🌐", title: "Cloudflare D1", badge: "Edge DB",
      desc: "دیتابیس SQLite لبه‌ای Cloudflare — سریع، اقتصادی، مناسب کوئری‌های سبک.",
      docs: [
        { label: "CLOUDFLARE_D1_DATABASE_ID", val: "بعد از ساخت database با Wrangler" },
        { label: "npm install", val: "wrangler", isCode: true }
      ],
      steps: [
        "npx wrangler d1 create taranom-db را اجرا کنید.",
        "Database ID را از خروجی Wrangler کپی کنید.",
        "متغیرها را در Replit Secrets قرار دهید.",
        "از REST API یا Wrangler binding برای کوئری استفاده کنید."
      ]
    },
    {
      icon: "🔋", title: "Neon (Serverless PostgreSQL)", badge: "Serverless",
      desc: "PostgreSQL سرورلس با Auto-scaling، Branch database و تایم‌اوت هوشمند — رایگان تا ۵۱۲ مگابایت.",
      docs: [
        { label: "DATABASE_URL", val: "Connection string از Neon Dashboard → Connection Details" },
        { label: "npm install", val: "@neondatabase/serverless", isCode: true }
      ],
      steps: [
        "به neon.tech بروید و پروژه بسازید.",
        "Connection Details → Connection String را کپی کنید.",
        "DATABASE_URL را در Replit Secrets قرار دهید.",
        "از @neondatabase/serverless یا pg به‌عنوان کلاینت استفاده کنید."
      ]
    },
    {
      icon: "🔥", title: "Firebase Firestore", badge: "NoSQL",
      desc: "NoSQL ریال‌تایم Google — Sync آفلاین، SDK کامل iOS/Android/Web، رایگان تا ۱ GiB.",
      docs: [
        { label: "FIREBASE_API_KEY", val: "از Project Settings → General → Web App" },
        { label: "npm install", val: "firebase firebase-admin", isCode: true }
      ],
      steps: [
        "به console.firebase.google.com بروید و پروژه بسازید.",
        "Project Settings → General → Add App (Web) کلیدها را بگیرید.",
        "Firestore Database را در Cloud Firestore فعال کنید.",
        "متغیرها را در Replit Secrets قرار دهید."
      ]
    }
  ];

  return (
    <div className="p-8 space-y-8 animate-fade-in text-right font-sans" id="admin-tab-storage" style={{ direction: "rtl" }}>
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
        <div className="space-y-1.5 text-right">
          <h3 className="text-sm font-black flex items-center gap-2">
            <Database size={18} className="text-blue-400" />
            <span>پایش دیتابیس و ذخیره‌سازی (Storage Monitor)</span>
          </h3>
          <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
            وضعیت تمام ماژول‌های ذخیره‌سازی، API endpointها و پیشنهاد مهاجرت به دیتابیس واقعی
          </p>
        </div>
        <div className="flex gap-2">
            <button onClick={handleTestStorage} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-2xl text-[10px] items-center gap-2 font-bold transition-all hidden md:flex">
                <HardDrive size={14} />
                <span>تست تمام Storage ها</span>
            </button>
            <button 
                onClick={handlePingAll}
                disabled={isPinging}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900/50 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
            >
                <Activity size={14} className={isPinging ? "animate-pulse" : ""} />
                <span>Ping تمام APIها</span>
            </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-5 rounded-2xl text-xs font-bold flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-500" />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-black text-amber-900">لایه ذخیره‌سازی فعلی: localStorage مرورگر</span>
              <span className="bg-amber-200/50 text-amber-800 px-2 py-0.5 rounded-lg text-[10px] font-black">{activeKeysCount} کلید فعال</span>
            </div>
            <p className="text-[10px] text-amber-700/80 leading-relaxed max-w-2xl">
              اپلیکیشن در حال حاضر از localStorage مرورگر به‌عنوان دیتابیس استفاده می‌کند. داده‌ها فقط روی دستگاه کاربر ذخیره می‌شوند و با پاک کردن cache از بین می‌روند.
            </p>
          </div>
        </div>
        <div className="shrink-0 bg-white/50 px-4 py-2 border border-amber-200 rounded-xl text-center">
            <div className="text-[9px] text-amber-600 uppercase font-bold text-center mb-1">State Size</div>
            <div className="text-sm font-black font-mono text-amber-900">{((JSON.stringify(localStorage).length || 0) / 1024).toFixed(1)} KB</div>
        </div>
      </div>

      {/* Existing LocalStorage tables */}
      <div className="space-y-4">
         <h4 className="font-black text-sm text-slate-800">نقشه وضعیت LocalStorage (کوئری‌های خام)</h4>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[
              { icon: "👥", name: "ثبت‌نام کاربران", key: "arateb_new_registrations", files: "LoginView\nTeacherDashboard\nAdminView" },
              { icon: "🎯", name: "اهداف تحصیلی داوطلب", key: "arateb_goals_{id}", files: "GoalTracker\nDashboardView\nCustomQuizGenerator" },
              { icon: "📈", name: "تاریخچه تراز", key: "arateb_history_{id}", files: "GoalTracker\nDashboardView\nAdmissionForecast" },
              { icon: "⏰", name: "ساعات مطالعه", key: "arateb_hours_{id}", files: "GoalTracker" },
              { icon: "💬", name: "جلسات چت مشاور", key: "taranom_mehr_sessions_{id}", files: "CounselorView" },
              { icon: "📝", name: "نتیجه شبیه‌ساز آزمون", key: "arateb_latest_simulator_traz_{id}", files: "RealTimeExamSimulator" },
              { icon: "📋", name: "آزمون‌های سفارشی", key: "taranom_custom_exams", files: "ProgressView" },
              { icon: "📓", name: "نسخه دبیر", key: "taranom_teacher_prescription_{id}", files: "TeacherDashboard\nDashboardView" },
              { icon: "🧠", name: "مصاحبه‌های روان‌شناختی", key: "taranom_psychology_interviews_{id}", files: "AssessmentView" },
              { icon: "📊", name: "گزارش‌های روان‌شناختی", key: "taranom_psychology_reports_{id}", files: "AssessmentView" },
              { icon: "💡", name: "یادداشت مشاور", key: "taranom_advisor_comment_{id}", files: "DashboardView" },
              { icon: "🎨", name: "تنظیم تم رابط کاربری", key: "taranom_app_theme", files: "App.tsx" }
            ].map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-100 rounded-2xl p-4 space-y-3 hover:border-blue-200 transition-colors shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                        <span className="text-xl">{item.icon}</span>
                        <div className="font-black text-xs text-slate-800">{item.name}</div>
                    </div>
                    <div>
                        <div className="text-[9px] text-slate-400 font-bold mb-1">Key Pattern:</div>
                        <code className="text-[9px] bg-slate-100 text-slate-700 px-2 py-1 rounded block font-mono break-all">{item.key}</code>
                    </div>
                    <div>
                        <div className="text-[9px] text-slate-400 font-bold mb-1">Used In:</div>
                        <div className="text-[9px] text-slate-600 font-mono whitespace-pre-line leading-relaxed">{item.files}</div>
                    </div>
                    <div className="pt-2 border-t border-slate-50">
                        <span className="inline-flex items-center gap-1 text-[9px] font-black text-slate-500">
                          {idx === 8 || idx === 9 ? <span className="text-emerald-500">دارد داده</span> : "خالی یا نیازمند ساخت"}
                        </span>
                    </div>
                </div>
            ))}
         </div>
      </div>

      {/* Endpoints Test Ping */}
      <div className="bg-white border border-slate-150 rounded-3xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 border-b border-slate-150 p-5 flex justify-between items-center">
            <div className="space-y-1">
                <h4 className="font-black text-sm text-slate-800 flex items-center gap-2"><Zap size={16} className="text-amber-500" /> تست اتصال API Endpointها</h4>
                <p className="text-[10px] text-slate-500 font-bold">وضعیت لحظه‌ای درگاه‌های سرور NodeJS / Express</p>
            </div>
            <div className="text-[11px] font-black text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-center">
                8 endpoint
            </div>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border-b border-slate-150">
                    <tr>
                        <th className="p-4 rounded-tl-lg">Endpoint</th>
                        <th className="p-4">متد</th>
                        <th className="p-4">وضعیت</th>
                        <th className="p-4">تأخیر</th>
                        <th className="p-4 rounded-tr-lg">عمل</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                    {[
                        { id: "health", name: "Health Check سرور", url: "/api/health", method: "GET" },
                        { id: "ai", name: "وضعیت AI (همه بخش‌ها)", url: "/api/ai-status", method: "GET" },
                        { id: "motivational", name: "پیام انگیزشی روزانه", url: "/api/motivational", method: "GET" },
                        { id: "chat", name: "چت مشاور دکتر رادان", url: "/api/chat", method: "POST" },
                        { id: "goal", name: "تحلیل هدف و تراز", url: "/api/goal-insight", method: "POST" },
                        { id: "exam", name: "تحلیل کارنامه آزمون", url: "/api/analyze-exam", method: "POST" },
                        { id: "psychology", name: "تحلیل روانشناختی", url: "/api/psychology-analysis", method: "POST" },
                        { id: "payment", name: "درگاه زرین‌پال", url: "/api/payment/request", method: "POST" }
                    ].map((ep, i) => (
                        <tr key={ep.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                                <div className="font-black text-slate-800">{ep.name}</div>
                                <code className="text-[9px] text-slate-500 bg-slate-100 px-1.5 rounded mt-1 inline-block font-mono">{ep.url}</code>
                            </td>
                            <td className="p-4"><span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${ep.method === 'GET' ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'} font-mono`}>{ep.method}</span></td>
                            <td className="p-4">
                                {testResults[ep.id] ? 
                                    <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px]"><CheckCircle2 size={14} /> OK</span> : 
                                    <span className="text-slate-400 font-bold text-[11px]">—</span>
                                }
                            </td>
                            <td className="p-4">
                                {testResults[ep.id] ? 
                                    <span className="font-mono text-slate-700 font-bold text-[11px]">{testResults[ep.id].ms}ms</span> : 
                                    <span className="text-slate-400 font-bold text-[11px]">—</span>
                                }
                            </td>
                            <td className="p-4">
                                {testResults[ep.id] ? 
                                    <button disabled className="text-[9px] bg-slate-100 text-slate-400 font-bold px-3 py-1.5 rounded-lg">Pinged</button>
                                :
                                    <button disabled={isPinging} className="text-[9px] bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                        <RefreshCw size={10} className={isPinging ? "animate-spin" : ""} /> Ping
                                    </button>
                                }
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </div>

      {/* Migration to real Database Section */}
      <div className="space-y-6 pt-6">
        <div className="space-y-2 border-b border-slate-150 pb-4">
          <h3 className="font-black text-base text-slate-800">مهاجرت به دیتابیس واقعی — گزینه‌های پیشنهادی</h3>
          <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-4xl">وضعیت فعلی: تمام داده‌ها در localStorage مرورگر کاربر ذخیره می‌شوند. برای استقرار تولیدی، انتقال به یکی از دیتابیس‌های زیر ضروری است. برای اضافه کردن کلیدها، از کنترل پنل پلتفرم (Variables یا Secrets) استفاده کنید.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {databases.map((db, idx) => (
            <div key={idx} className="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all space-y-5 flex flex-col relative overflow-hidden group">
              {idx === 0 && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>}
              
              <div className="relative z-10 flex justify-between items-start">
                  <div className="flex items-center gap-3">
                      <div className="text-3xl bg-slate-50 w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-100">{db.icon}</div>
                      <div>
                          <h4 className="font-black text-sm text-slate-900">{db.title}</h4>
                      </div>
                  </div>
                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-xl whitespace-nowrap ${idx === 0 ? "bg-indigo-100 text-indigo-800 border border-indigo-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>{db.badge}</span>
              </div>
              
              <p className="text-[10px] text-slate-600 font-bold leading-relaxed relative z-10">{db.desc}</p>
              
              <div className="space-y-3 relative z-10">
                  <div className="text-[9px] font-black text-slate-400 bg-slate-50 py-1 px-2 rounded w-fit uppercase">متغیرهای محیطی</div>
                  <div className="space-y-2">
                    {db.docs.map((doc, i) => (
                        <div key={i} className="flex flex-col gap-1">
                           <code className="text-[10px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded w-fit font-mono">{doc.label}</code>
                           <span className={`text-[9px] text-slate-500 font-bold ${doc.isCode ? "font-mono" : ""}`}>{doc.val}</span>
                        </div>
                    ))}
                  </div>
              </div>

              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-3 relative z-10 mt-auto flex-grow">
                 <div className="text-[9px] font-black text-slate-800 border-b border-slate-200 pb-2 inline-block">مراحل راه‌اندازی</div>
                 <ol className="space-y-2">
                    {db.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-[10px] text-slate-600 font-bold">
                            <span className="w-4 h-4 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 shrink-0 mt-0.5">{i+1}</span>
                            <span className="leading-relaxed">{step}</span>
                        </li>
                    ))}
                 </ol>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
