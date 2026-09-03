import { useState } from "react";
import { MessageSquare, Bell, Sliders, TrendingUp, AlertTriangle, ShieldAlert, Check } from "lucide-react";
import { Student, ParentingAlert } from "../types";

interface ParentsViewProps {
  student: Student;
}

export default function ParentsView({ student }: ParentsViewProps) {
  const [alerts, setAlerts] = useState<ParentingAlert[]>([
    { id: "1", type: "success", message: `داوطلب گرامی در مبحث ژنتیک زیست‌شناسی با بهبود چشمگیر ۳۲٪ تراز علمی مواجه شده و رتبه اول آزمون دوره‌ای را از آن خود کرد.`, date: "۲۹ اردیبهشت" },
    { id: "2", type: "warning", message: `کاهش ریتم مطالعه در شیفت عصر روز گذشته (افت تمرکز در تست‌زنی مفاهیم فیزیک) گزارش شد. برنامه کایزن ترمیمی به طور خودکار صادر گردید.`, date: "۱۵ اردیبهشت" },
    { id: "3", type: "info", message: `ساعت مطالعه خالص ثبت شده دیروز: ۷ ساعت کامل شامل تسلط بر مباحث استوکیومتری شیمی دهم و یازدهم.`, date: "۱۴ اردیبهشت" }
  ]);

  const [notifSms, setNotifSms] = useState(true);
  const [notifDrop, setNotifDrop] = useState(true);
  const [notifProgress, setNotifProgress] = useState(true);
  const [notifCounselor, setNotifCounselor] = useState(false);

  const handleToggleSmsAlert = (config: string) => {
    if (config === "notifSms") setNotifSms(!notifSms);
    if (config === "notifDrop") setNotifDrop(!notifDrop);
    if (config === "notifProgress") setNotifProgress(!notifProgress);
    if (config === "notifCounselor") setNotifCounselor(!notifCounselor);
  };

  return (
    <div className="space-y-6" id="parents-view-container">
      {/* Visual Welcome Board */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm bg-gradient-to-tr from-indigo-50/10 to-transparent text-right">
        <div>
          <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 inline-block mb-1.5">سامانه پایش والدین ترنم مهر</span>
          <h2 className="text-xl font-black text-slate-900">پورتال پایش و نظارت برخط والدین و حامیان علمی</h2>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            اولیاء محترم؛ در این صفحه می‌توانید تراز علمی آزمون‌های شبیه‌ساز، میزان پیشرفت درصدی دروس، هشدارهای مشاور تخصصی و استریک‌های روزانه داوطلب گرامی **{student.name}** را مانیتور کنید.
          </p>
        </div>
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
          <Bell className="text-slate-500" size={24} />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block">شماره تماس پیامک اضطراری حامی</span>
            <span className="text-xs font-mono font-bold text-slate-800">0912****628</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
        {/* Statistics and alerts summary */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4" id="parent-messages-timeline">
            <span className="font-bold text-slate-805 text-sm block flex items-center gap-1.5 border-b border-slate-50 pb-2 text-right justify-start">
              <MessageSquare className="text-blue-900" size={18} />
              <span>اعلانات خودکار و بازخورد مربیان ناظر موسسه ترنم مهر</span>
            </span>

            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-2xl border flex gap-4 items-start text-right ${
                    alert.type === "success" 
                      ? "bg-emerald-50/40 border-emerald-100 text-emerald-950" 
                      : alert.type === "warning" 
                        ? "bg-red-50/40 border-red-100 text-red-950" 
                        : "bg-blue-50/40 border-blue-100 text-blue-950"
                  }`}
                >
                  <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${
                    alert.type === "success" 
                      ? "bg-emerald-600 text-white" 
                      : alert.type === "warning" 
                        ? "bg-rose-600 text-white" 
                        : "bg-blue-900 text-white"
                  }`}>
                    {alert.type === "success" && <TrendingUp size={14} />}
                    {alert.type === "warning" && <AlertTriangle size={14} />}
                    {alert.type === "info" && <Bell size={14} />}
                  </div>
                  <div className="flex-1 space-y-1 text-right">
                    <p className="text-xs/relaxed font-semibold leading-relaxed">{alert.message}</p>
                    <span className="text-[10px] text-slate-400 block font-mono font-medium">{alert.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alert Configurations Box */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5" id="parent-notification-switches">
          <span className="font-bold text-slate-800 text-sm block flex items-center gap-1.5 border-b border-slate-50 pb-2 text-right justify-start">
            <Sliders className="text-blue-900" size={18} />
            <span>تنظیمات پیام‌های برخط حامیان علمی</span>
          </span>

          <p className="text-xs text-slate-400 leading-relaxed text-right">
            آستانه و نحوه اطلاع‌رسانی از روند یادگیری فرزندتان و دریافت گزارش‌های کایزن در پیوند با ترازهای آزمون سراسری را شخصی‌سازی کنید:
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="text-right">
                <strong className="text-xs font-black text-slate-800 block">ارسال خلاصه تراز کیفی هفتگی</strong>
                <span className="text-[9px] text-slate-400 block mt-0.5">دریافت گزارش هفتگی تراز آزمون و رتبه کشوری داوطلب در پایان هفته</span>
              </div>
              <button 
                onClick={() => handleToggleSmsAlert("notifSms")}
                className={`w-11 h-6 rounded-full p-1 transition flex items-center leading-none border cursor-pointer ${
                  notifSms ? "bg-blue-900 border-blue-900 flex-row-reverse" : "bg-slate-100 border-slate-200"
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-sm block"></span>
              </button>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="text-right">
                <strong className="text-xs font-black text-slate-800 block">پیام خطر کاهش اضطراری تراز</strong>
                <span className="text-[9px] text-slate-400 block mt-0.5">ارسال پیامک هشدار در صورت افت تراز علمی به زیر مرز ۵,۰۰۰</span>
              </div>
              <button 
                onClick={() => handleToggleSmsAlert("notifDrop")}
                className={`w-11 h-6 rounded-full p-1 transition flex items-center leading-none border cursor-pointer ${
                  notifDrop ? "bg-blue-900 border-blue-900 flex-row-reverse" : "bg-slate-100 border-slate-200"
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-sm block"></span>
              </button>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="text-right">
                <strong className="text-xs font-black text-slate-800 block">ثبت رکوردهای استثنایی و مداومت</strong>
                <span className="text-[9px] text-slate-400 block mt-0.5">اعلام تراز بالای ۶,۲۰۰ و رکوردهای برتر استریک‌های مطالعاتی</span>
              </div>
              <button 
                onClick={() => handleToggleSmsAlert("notifProgress")}
                className={`w-11 h-6 rounded-full p-1 transition flex items-center leading-none border cursor-pointer ${
                  notifProgress ? "bg-blue-900 border-blue-900 flex-row-reverse" : "bg-slate-100 border-slate-200"
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-sm block"></span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-right">
                <strong className="text-xs font-black text-slate-800 block">ارسال نسخه گزارش‌های تحلیلی AI</strong>
                <span className="text-[9px] text-slate-400 block mt-0.5">دریافت توصیه‌های عارضه‌یابی و مربی‌گری مشاور هوش مصنوعی</span>
              </div>
              <button 
                onClick={() => handleToggleSmsAlert("notifCounselor")}
                className={`w-11 h-6 rounded-full p-1 transition flex items-center leading-none border cursor-pointer ${
                  notifCounselor ? "bg-blue-900 border-blue-900 flex-row-reverse" : "bg-slate-100 border-slate-200"
                }`}
              >
                <span className="w-4 h-4 bg-white rounded-full shadow-sm block"></span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-2.5 text-right">
            <ShieldAlert className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-[10px] text-amber-900 leading-relaxed text-right">
              پیکربندی هوشمند شما با موفقیت ذخیره شد. کادر ناظرین ترنم مهر اهتمام مستمر خود را در همیاری داوطلبان به کار خواهد بست.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
