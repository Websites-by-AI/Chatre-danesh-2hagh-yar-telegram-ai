import React, { useMemo, useState } from "react";
import { MapPin, School, Users, Briefcase, CalendarCheck, Phone, CheckCircle2, AlertCircle, Building2, GraduationCap, Navigation, Clock, Banknote } from "lucide-react";

/**
 * InPersonView — «جلسه حضوری اسنپی» ترنم همدلی
 * مدل اسنپ برای آموزش: دانش‌آموز آنلاین رزرو می‌کند → مربی + فضای نزدیک او
 * (مدرسه‌ای که کلاس خالی‌اش را اجاره می‌دهد یا فضای کار اشتراکی) هماهنگ می‌شود.
 * سه سمت بازار: دانش‌آموز (رزرو) | مربی (همکاری) | مدرسه/فضا (اجاره دادن کلاس).
 * نقشه: SVG داخلی (بدون تایل خارجی، سریع از ایران) + لینک مسیریابی بلد/گوگل‌مپ.
 */

interface Venue {
  id: string;
  name: string;
  type: "مدرسه" | "فضای کار اشتراکی" | "دفتر آموزشی";
  district: string;
  capacity: number;
  rentPerHour: [number, number]; // بازه تومان
  lat: number; lng: number;
  x: number; y: number;          // موقعیت روی نقشه SVG شهر (درصد)
  status: "فعال" | "در حال عقد قرارداد";
}

const CITY_VENUES: Record<string, { intro: string; venues: Venue[] }> = {
  "تهران": {
    intro: "پرتقاضاترین شهر — اولویت راه‌اندازی",
    venues: [
      { id: "thr1", name: "مدرسه همکار — صادقیه (منطقه ۲)", type: "مدرسه", district: "صادقیه", capacity: 25, rentPerHour: [150000, 250000], lat: 35.7219, lng: 51.3347, x: 22, y: 38, status: "در حال عقد قرارداد" },
      { id: "thr2", name: "فضای کار اشتراکی همکار — جردن", type: "فضای کار اشتراکی", district: "جردن", capacity: 8, rentPerHour: [250000, 400000], lat: 35.7715, lng: 51.4171, x: 55, y: 22, status: "در حال عقد قرارداد" },
      { id: "thr3", name: "مدرسه همکار — تهرانپارس (منطقه ۴)", type: "مدرسه", district: "تهرانپارس", capacity: 30, rentPerHour: [120000, 200000], lat: 35.7346, lng: 51.5453, x: 82, y: 30, status: "در حال عقد قرارداد" },
      { id: "thr4", name: "دفتر آموزشی همکار — انقلاب", type: "دفتر آموزشی", district: "میدان انقلاب", capacity: 12, rentPerHour: [180000, 300000], lat: 35.7009, lng: 51.3919, x: 43, y: 55, status: "در حال عقد قرارداد" },
      { id: "thr5", name: "فضای کار اشتراکی همکار — ونک", type: "فضای کار اشتراکی", district: "ونک", capacity: 10, rentPerHour: [250000, 450000], lat: 35.7561, lng: 51.4105, x: 52, y: 30, status: "در حال عقد قرارداد" },
    ],
  },
  "شیراز": {
    intro: "شهر دوم راه‌اندازی",
    venues: [
      { id: "shz1", name: "مدرسه همکار — معالی‌آباد", type: "مدرسه", district: "معالی‌آباد", capacity: 25, rentPerHour: [100000, 180000], lat: 29.6606, lng: 52.4707, x: 25, y: 35, status: "در حال عقد قرارداد" },
      { id: "shz2", name: "فضای کار اشتراکی همکار — قصردشت", type: "فضای کار اشتراکی", district: "قصردشت", capacity: 8, rentPerHour: [150000, 280000], lat: 29.6355, lng: 52.5063, x: 48, y: 48, status: "در حال عقد قرارداد" },
      { id: "shz3", name: "مدرسه همکار — بلوار مدرس", type: "مدرسه", district: "بلوار مدرس", capacity: 28, rentPerHour: [90000, 160000], lat: 29.6151, lng: 52.5749, x: 75, y: 60, status: "در حال عقد قرارداد" },
    ],
  },
  "اصفهان": {
    intro: "شهر سوم راه‌اندازی",
    venues: [
      { id: "esf1", name: "مدرسه همکار — ملک‌شهر", type: "مدرسه", district: "ملک‌شهر", capacity: 26, rentPerHour: [100000, 170000], lat: 32.7085, lng: 51.6420, x: 40, y: 22, status: "در حال عقد قرارداد" },
      { id: "esf2", name: "فضای کار اشتراکی همکار — چهارباغ بالا", type: "فضای کار اشتراکی", district: "چهارباغ بالا", capacity: 10, rentPerHour: [150000, 260000], lat: 32.6260, lng: 51.6577, x: 52, y: 55, status: "در حال عقد قرارداد" },
      { id: "esf3", name: "دفتر آموزشی همکار — سپاهان‌شهر", type: "دفتر آموزشی", district: "سپاهان‌شهر", capacity: 14, rentPerHour: [120000, 200000], lat: 32.5620, lng: 51.6650, x: 55, y: 80, status: "در حال عقد قرارداد" },
    ],
  },
  "مشهد": {
    intro: "شهر چهارم راه‌اندازی",
    venues: [
      { id: "mhd1", name: "مدرسه همکار — وکیل‌آباد", type: "مدرسه", district: "وکیل‌آباد", capacity: 28, rentPerHour: [100000, 180000], lat: 36.2605, lng: 59.5210, x: 25, y: 55, status: "در حال عقد قرارداد" },
      { id: "mhd2", name: "فضای کار اشتراکی همکار — احمدآباد", type: "فضای کار اشتراکی", district: "احمدآباد", capacity: 9, rentPerHour: [150000, 270000], lat: 36.2926, lng: 59.5946, x: 58, y: 40, status: "در حال عقد قرارداد" },
      { id: "mhd3", name: "مدرسه همکار — قاسم‌آباد", type: "مدرسه", district: "قاسم‌آباد", capacity: 30, rentPerHour: [90000, 160000], lat: 36.3439, lng: 59.4930, x: 15, y: 25, status: "در حال عقد قرارداد" },
    ],
  },
};

const TUTOR_TIERS = [
  { id: "همراه", title: "مربی همراه", desc: "دانشجوی رتبه‌برتر / مربی تازه‌کار تاییدشده — تحلیل کارنامه و برنامه هفتگی", price: [400000, 600000], icon: "🎓" },
  { id: "ارشد", title: "مربی ارشد", desc: "۳+ سال سابقه مشاوره کنکور — تحلیل درصدها، استراتژی جمع‌بندی، رفع اشکال", price: [800000, 1200000], icon: "🏅" },
  { id: "ویژه", title: "مشاور ویژه", desc: "مشاور ارشد + جلسه با حضور روانشناس (مدیریت اضطراب آزمون)", price: [1500000, 2200000], icon: "👑" },
];

const SESSION_TYPES = ["تحلیل کارنامه و درصدهای کنکور", "برنامه‌ریزی جمع‌بندی (اسفند تا کنکور)", "رفع اشکال درسی حضوری", "مشاوره روانشناسی و مدیریت استرس"];

const fmtT = (n: number) => n.toLocaleString("fa-IR");
const rangeT = (r: [number, number]) => `${fmtT(r[0])} تا ${fmtT(r[1])} تومان`;

export default function InPersonView() {
  const [city, setCity] = useState<string>("تهران");
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [tab, setTab] = useState<"student" | "coach" | "school">("student");

  // فرم رزرو دانش‌آموز
  const [bName, setBName] = useState(""); const [bMobile, setBMobile] = useState("");
  const [bTier, setBTier] = useState("همراه"); const [bType, setBType] = useState(SESSION_TYPES[0]);
  const [bDate, setBDate] = useState(""); const [bNote, setBNote] = useState("");
  const [bMsg, setBMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [bBusy, setBBusy] = useState(false);

  // فرم مربی
  const [cName, setCName] = useState(""); const [cMobile, setCMobile] = useState("");
  const [cNote, setCNote] = useState(""); const [cMsg, setCMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [cBusy, setCBusy] = useState(false);

  // فرم مدرسه/فضا
  const [vOrg, setVOrg] = useState(""); const [vContact, setVContact] = useState("");
  const [vMobile, setVMobile] = useState(""); const [vCity, setVCity] = useState("تهران");
  const [vType, setVType] = useState("مدرسه"); const [vCapacity, setVCapacity] = useState("");
  const [vPrice, setVPrice] = useState(""); const [vAddress, setVAddress] = useState("");
  const [vMsg, setVMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [vBusy, setVBusy] = useState(false);

  const cityData = CITY_VENUES[city];
  const tier = useMemo(() => TUTOR_TIERS.find((t) => t.id === bTier)!, [bTier]);
  const estLow = tier.price[0] + (selectedVenue ? selectedVenue.rentPerHour[0] * 1.5 : 0);
  const estHigh = tier.price[1] + (selectedVenue ? selectedVenue.rentPerHour[1] * 1.5 : 0);

  const submitBooking = async () => {
    setBMsg(null);
    if (!bName.trim() || bName.trim().length < 2) { setBMsg({ ok: false, text: "نام را وارد کنید." }); return; }
    if (!/^09\d{9}$/.test(bMobile.trim())) { setBMsg({ ok: false, text: "شماره موبایل معتبر وارد کنید (مثل 09121234567)." }); return; }
    setBBusy(true);
    try {
      const res = await fetch("/api/inperson-booking", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: bName.trim(), mobile: bMobile.trim(), requester_role: "student", city,
          venue_id: selectedVenue?.id || "", venue_name: selectedVenue?.name || "",
          tutor_tier: bTier, session_type: bType, preferred_date: bDate, note: bNote,
          est_price: Math.round((estLow + estHigh) / 2),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) { setBMsg({ ok: true, text: data.message || "درخواست ثبت شد؛ برای هماهنگی تماس می‌گیریم." }); setBName(""); setBMobile(""); setBDate(""); setBNote(""); }
      else setBMsg({ ok: false, text: data.error || "خطا در ثبت درخواست." });
    } catch (_) { setBMsg({ ok: false, text: "اتصال برقرار نشد — دوباره تلاش کنید." }); }
    setBBusy(false);
  };

  const submitCoach = async () => {
    setCMsg(null);
    if (!cName.trim() || cName.trim().length < 2) { setCMsg({ ok: false, text: "نام را وارد کنید." }); return; }
    if (!/^09\d{9}$/.test(cMobile.trim())) { setCMsg({ ok: false, text: "شماره موبایل معتبر وارد کنید." }); return; }
    setCBusy(true);
    try {
      const res = await fetch("/api/inperson-booking", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cName.trim(), mobile: cMobile.trim(), requester_role: "coach", city, session_type: "درخواست همکاری مربی", note: cNote }),
      });
      const data = await res.json();
      if (res.ok && data.ok) { setCMsg({ ok: true, text: "درخواست همکاری ثبت شد؛ تیم ترنم برای مصاحبه و احراز صلاحیت تماس می‌گیرد." }); setCName(""); setCMobile(""); setCNote(""); }
      else setCMsg({ ok: false, text: data.error || "خطا در ثبت." });
    } catch (_) { setCMsg({ ok: false, text: "اتصال برقرار نشد." }); }
    setCBusy(false);
  };

  const submitVenue = async () => {
    setVMsg(null);
    if (!vOrg.trim() || vOrg.trim().length < 2) { setVMsg({ ok: false, text: "نام مجموعه را وارد کنید." }); return; }
    if (!/^09\d{9}$/.test(vMobile.trim())) { setVMsg({ ok: false, text: "شماره موبایل معتبر وارد کنید." }); return; }
    setVBusy(true);
    try {
      const res = await fetch("/api/venue-offer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_name: vOrg.trim(), contact_name: vContact.trim(), mobile: vMobile.trim(), city: vCity,
          venue_type: vType, capacity: Number(vCapacity) || 0, price_per_hour: Number(vPrice.replace(/[,،]/g, "")) || 0, address: vAddress.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) { setVMsg({ ok: true, text: data.message || "ثبت شد؛ برای عقد قرارداد اجاره تماس می‌گیریم." }); setVOrg(""); setVContact(""); setVMobile(""); setVCapacity(""); setVPrice(""); setVAddress(""); }
      else setVMsg({ ok: false, text: data.error || "خطا در ثبت." });
    } catch (_) { setVMsg({ ok: false, text: "اتصال برقرار نشد." }); }
    setVBusy(false);
  };

  const typeIcon = (t: Venue["type"]) => t === "مدرسه" ? <School className="w-4 h-4" /> : t === "فضای کار اشتراکی" ? <Briefcase className="w-4 h-4" /> : <Building2 className="w-4 h-4" />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500" style={{ direction: "rtl" }}>
      {/* ── هدر */}
      <div className="bg-gradient-to-l from-indigo-600 via-violet-600 to-fuchsia-600 text-white rounded-[2rem] p-8 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">📍</span>
          <h1 className="text-2xl md:text-3xl font-black">جلسه حضوری اسنپی — مربی + کلاس، نزدیک خانه‌ات</h1>
        </div>
        <p className="text-indigo-100 leading-8 max-w-3xl">
          مثل اسنپ، ولی برای آموزش: دانش‌آموز آنلاین درخواست می‌دهد، ما یک <b>مربی تاییدشده</b> و یک <b>فضای نزدیک او</b>
          (کلاس خالی یک مدرسه یا اتاق جلسه فضای کار اشتراکی) را هماهنگ می‌کنیم. دانش‌آموز با کارنامه، درصدها و تست‌های ثبت‌شده‌اش
          در همین سامانه سر جلسه می‌آید — مربی از قبل تحلیل هوشمند او را دیده است. فصل طلایی: <b>اسفند تا کنکور (جمع‌بندی)</b>.
        </p>
        <div className="flex flex-wrap gap-2 mt-4 text-sm">
          {["🎯 تحلیل درصد و کارنامه", "🗓 برنامه جمع‌بندی اسفند", "🏫 مدرسه = درآمد اجاره کلاس", "🧑‍🏫 مربی = درآمد جلسه‌ای"].map((b) => (
            <span key={b} className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-full">{b}</span>
          ))}
        </div>
      </div>

      {/* ── مراحل مدل */}
      <div className="grid md:grid-cols-4 gap-4">
        {[
          { n: "۱", t: "درخواست آنلاین", d: "شهر، نوع جلسه و سطح مربی را انتخاب کن", i: <CalendarCheck className="w-6 h-6" /> },
          { n: "۲", t: "تطبیق هوشمند", d: "مربی + نزدیک‌ترین فضای همکار به تو هماهنگ می‌شود", i: <Navigation className="w-6 h-6" /> },
          { n: "۳", t: "جلسه حضوری", d: "مربی با کارنامه دیجیتال تو (تست‌ها و درصدها) سر جلسه می‌آید", i: <GraduationCap className="w-6 h-6" /> },
          { n: "۴", t: "پیگیری در اپ", d: "برنامه جلسه در سامانه ثبت و پیشرفتت رصد می‌شود", i: <CheckCircle2 className="w-6 h-6" /> },
        ].map((s) => (
          <div key={s.n} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">{s.i}<span className="font-black text-lg">{s.n}) {s.t}</span></div>
            <p className="text-sm text-slate-500 leading-6">{s.d}</p>
          </div>
        ))}
      </div>

      {/* ── انتخاب شهر + نقشه + فضاها */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><MapPin className="w-6 h-6 text-rose-500" /> شهرها و فضاهای همکار</h2>
          <div className="flex gap-2 flex-wrap">
            {Object.keys(CITY_VENUES).map((c) => (
              <button key={c} onClick={() => { setCity(c); setSelectedVenue(null); }}
                className={`px-4 py-2 rounded-full text-sm font-bold transition ${city === c ? "bg-indigo-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-slate-400">{cityData.intro} — <b className="text-amber-600">فضاهای زیر نمونه شبکه راه‌اندازی هستند و در مرحله عقد قرارداد؛ قیمت نهایی هنگام تایید رزرو اعلام می‌شود.</b></p>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* نقشه SVG سبک (بدون تایل خارجی — سریع از ایران) */}
          <div className="relative bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-slate-200 rounded-2xl overflow-hidden" style={{ minHeight: 320 }}>
            <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0" preserveAspectRatio="none">
              {/* شبکه خیابانی استایلیزه */}
              {[15, 35, 55, 75].map((p) => (<line key={"h" + p} x1="0" y1={p} x2="100" y2={p} stroke="#c7d2fe" strokeWidth="0.6" />))}
              {[20, 40, 60, 80].map((p) => (<line key={"v" + p} x1={p} y1="0" x2={p} y2="100" stroke="#c7d2fe" strokeWidth="0.6" />))}
              <line x1="0" y1="65" x2="100" y2="45" stroke="#a5b4fc" strokeWidth="1.4" />
              <line x1="30" y1="0" x2="70" y2="100" stroke="#a5b4fc" strokeWidth="1.1" />
            </svg>
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 text-sm font-black text-slate-700 shadow">🗺 نقشه {city}</div>
            {cityData.venues.map((v) => (
              <button key={v.id} onClick={() => setSelectedVenue(v)} title={v.name}
                className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all ${selectedVenue?.id === v.id ? "scale-125 z-10" : "hover:scale-110"}`}
                style={{ right: `${v.x}%`, top: `${v.y}%` }}>
                <span className={`flex items-center justify-center w-9 h-9 rounded-full shadow-lg border-2 border-white ${v.type === "مدرسه" ? "bg-emerald-500" : v.type === "فضای کار اشتراکی" ? "bg-indigo-500" : "bg-amber-500"} text-white`}>
                  {typeIcon(v.type)}
                </span>
                <span className="block mt-1 text-[10px] font-bold bg-white/90 rounded-full px-1.5 py-0.5 text-slate-700 shadow whitespace-nowrap">{v.district}</span>
              </button>
            ))}
            <div className="absolute bottom-3 right-3 flex gap-2 text-[11px] font-bold">
              <span className="bg-white/90 rounded-full px-2 py-1 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> مدرسه</span>
              <span className="bg-white/90 rounded-full px-2 py-1 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> فضای کار اشتراکی</span>
              <span className="bg-white/90 rounded-full px-2 py-1 flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> دفتر آموزشی</span>
            </div>
          </div>

          {/* لیست فضاها */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pl-1">
            {cityData.venues.map((v) => (
              <button key={v.id} onClick={() => setSelectedVenue(v)}
                className={`w-full text-right bg-white border rounded-2xl p-4 transition shadow-sm ${selectedVenue?.id === v.id ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-150 hover:border-indigo-200"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-black text-slate-800 flex items-center gap-2">{typeIcon(v.type)} {v.name}</div>
                    <div className="text-xs text-slate-400 mt-1">📍 {v.district} • ظرفیت {fmtT(v.capacity)} نفر • <span className="text-amber-600">{v.status}</span></div>
                  </div>
                  <span className="shrink-0 text-xs bg-slate-50 border border-slate-200 rounded-full px-2 py-1 text-slate-500">{v.type}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between mt-3 gap-2">
                  <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><Banknote className="w-4 h-4" /> اجاره: {rangeT(v.rentPerHour)} / ساعت</span>
                  <span className="flex gap-2">
                    <a onClick={(e) => e.stopPropagation()} href={`https://balad.ir/location?latitude=${v.lat}&longitude=${v.lng}&zoom=16`} target="_blank" rel="noreferrer"
                      className="text-xs bg-teal-50 text-teal-700 border border-teal-200 rounded-full px-2.5 py-1 hover:bg-teal-100">مسیریابی بلد</a>
                    <a onClick={(e) => e.stopPropagation()} href={`https://www.google.com/maps?q=${v.lat},${v.lng}`} target="_blank" rel="noreferrer"
                      className="text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-2.5 py-1 hover:bg-slate-100">Google Maps</a>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── تعرفه مربی‌ها */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
        <h2 className="text-xl font-black text-slate-800 mb-1 flex items-center gap-2"><Users className="w-6 h-6 text-indigo-500" /> تعرفه مربی (جلسه ۹۰ دقیقه‌ای)</h2>
        <p className="text-sm text-slate-400 mb-5">هزینه جلسه = دستمزد مربی + سهم اجاره فضا (حدود ۱.۵ ساعت). قیمت‌ها حدودی است و پیش از تایید رزرو قطعی اعلام می‌شود.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {TUTOR_TIERS.map((t) => (
            <button key={t.id} onClick={() => setBTier(t.id)}
              className={`text-right rounded-2xl border p-5 transition ${bTier === t.id ? "border-indigo-400 ring-2 ring-indigo-100 bg-indigo-50/40" : "border-slate-150 hover:border-indigo-200 bg-white"}`}>
              <div className="text-3xl mb-2">{t.icon}</div>
              <div className="font-black text-slate-800">{t.title}</div>
              <p className="text-xs text-slate-500 leading-6 mt-1 min-h-[48px]">{t.desc}</p>
              <div className="mt-3 text-sm font-bold text-emerald-600">{rangeT(t.price as [number, number])}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── سه تب: دانش‌آموز / مربی / مدرسه */}
      <div className="bg-white border border-slate-100 rounded-[2rem] p-6 md:p-8 shadow-sm">
        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { id: "student", label: "🎒 دانش‌آموز — رزرو جلسه" },
            { id: "coach", label: "🧑‍🏫 مربی — همکاری با ما" },
            { id: "school", label: "🏫 مدرسه/فضا — اجاره بدهید" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`px-4 py-2.5 rounded-xl text-sm font-black transition ${tab === t.id ? "bg-indigo-600 text-white shadow" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* تب دانش‌آموز */}
        {tab === "student" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <input value={bName} onChange={(e) => setBName(e.target.value)} placeholder="نام و نام خانوادگی *" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
              <input value={bMobile} onChange={(e) => setBMobile(e.target.value)} placeholder="موبایل (09xxxxxxxxx) *" dir="ltr" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-left focus:ring-2 focus:ring-indigo-200 outline-none" />
              <select value={bType} onChange={(e) => setBType(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white">
                {SESSION_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input value={bDate} onChange={(e) => setBDate(e.target.value)} placeholder="زمان پیشنهادی (مثلاً پنجشنبه‌ها عصر / ۱۵ اسفند)" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
              <textarea value={bNote} onChange={(e) => setBNote(e.target.value)} placeholder="توضیح (رشته، پایه، درس‌هایی که مشکل داری...)" rows={3} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-200 outline-none resize-none" />
            </div>
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 text-sm">
                <div className="font-black text-slate-700 mb-2 flex items-center gap-2"><Clock className="w-4 h-4" /> خلاصه رزرو</div>
                <div className="flex justify-between"><span className="text-slate-500">شهر:</span><b>{city}</b></div>
                <div className="flex justify-between"><span className="text-slate-500">فضا:</span><b className="text-left">{selectedVenue ? selectedVenue.name : "— از نقشه بالا انتخاب کن —"}</b></div>
                <div className="flex justify-between"><span className="text-slate-500">مربی:</span><b>{tier.icon} {tier.title}</b></div>
                <div className="flex justify-between"><span className="text-slate-500">نوع جلسه:</span><b>{bType}</b></div>
                <div className="border-t border-slate-200 pt-2 flex justify-between text-emerald-700">
                  <span className="font-bold">برآورد کل (مربی + فضا):</span>
                  <b>{selectedVenue ? `${fmtT(estLow)} تا ${fmtT(estHigh)} تومان` : rangeT(tier.price as [number, number])}</b>
                </div>
                <p className="text-[11px] text-slate-400 leading-5">پرداخت پس از تایید نهایی و از طریق درگاه سایت انجام می‌شود؛ الان فقط رزرو ثبت می‌کنی.</p>
              </div>
              {bMsg && (
                <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${bMsg.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                  {bMsg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{bMsg.text}
                </div>
              )}
              <button onClick={submitBooking} disabled={bBusy} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-3.5 font-black shadow transition">
                {bBusy ? "در حال ثبت..." : "ثبت درخواست جلسه حضوری 📍"}
              </button>
            </div>
          </div>
        )}

        {/* تب مربی */}
        {tab === "coach" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="نام و نام خانوادگی *" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
              <input value={cMobile} onChange={(e) => setCMobile(e.target.value)} placeholder="موبایل *" dir="ltr" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-left focus:ring-2 focus:ring-indigo-200 outline-none" />
              <textarea value={cNote} onChange={(e) => setCNote(e.target.value)} placeholder="سابقه مشاوره/تدریس، رتبه کنکور، شهر فعالیت..." rows={4} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-200 outline-none resize-none" />
              {cMsg && (
                <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${cMsg.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                  {cMsg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{cMsg.text}
                </div>
              )}
              <button onClick={submitCoach} disabled={cBusy} className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl py-3.5 font-black shadow transition">
                {cBusy ? "در حال ثبت..." : "درخواست همکاری مربی 🧑‍🏫"}
              </button>
            </div>
            <div className="bg-violet-50/60 border border-violet-100 rounded-2xl p-6 text-sm leading-8 text-slate-600">
              <div className="font-black text-violet-700 mb-2">چرا مربی ترنم شوید؟</div>
              • درآمد جلسه‌ای {rangeT([400000, 2200000] as [number, number])} بسته به سطح<br />
              • دانش‌آموز با کارنامه دیجیتال کامل (درصدها، تست‌ها، تحلیل هوش مصنوعی) سر جلسه می‌آید — وقت‌تان صرف شناخت نمی‌شود<br />
              • فضای جلسه را ما رزرو می‌کنیم؛ شما فقط تدریس/مشاوره می‌کنید<br />
              • اوج تقاضا: اسفند تا تیر (فصل جمع‌بندی و انتخاب رشته)
            </div>
          </div>
        )}

        {/* تب مدرسه/فضا */}
        {tab === "school" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-3">
              <input value={vOrg} onChange={(e) => setVOrg(e.target.value)} placeholder="نام مدرسه / فضای کار اشتراکی / دفتر *" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <input value={vContact} onChange={(e) => setVContact(e.target.value)} placeholder="نام رابط" className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
                <input value={vMobile} onChange={(e) => setVMobile(e.target.value)} placeholder="موبایل *" dir="ltr" className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-left focus:ring-2 focus:ring-indigo-200 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={vCity} onChange={(e) => setVCity(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white">
                  {[...Object.keys(CITY_VENUES), "شهر دیگر"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={vType} onChange={(e) => setVType(e.target.value)} className="border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white">
                  {["مدرسه", "فضای کار اشتراکی", "دفتر آموزشی"].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input value={vCapacity} onChange={(e) => setVCapacity(e.target.value)} placeholder="ظرفیت (نفر)" dir="ltr" className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-left focus:ring-2 focus:ring-indigo-200 outline-none" />
                <input value={vPrice} onChange={(e) => setVPrice(e.target.value)} placeholder="اجاره پیشنهادی هر ساعت (تومان)" dir="ltr" className="border border-slate-200 rounded-xl px-4 py-3 text-sm text-left focus:ring-2 focus:ring-indigo-200 outline-none" />
              </div>
              <input value={vAddress} onChange={(e) => setVAddress(e.target.value)} placeholder="آدرس (محله/خیابان)" className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-200 outline-none" />
              {vMsg && (
                <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${vMsg.ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                  {vMsg.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{vMsg.text}
                </div>
              )}
              <button onClick={submitVenue} disabled={vBusy} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl py-3.5 font-black shadow transition">
                {vBusy ? "در حال ثبت..." : "ثبت فضای من برای اجاره 🏫"}
              </button>
            </div>
            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-6 text-sm leading-8 text-slate-600">
              <div className="font-black text-emerald-700 mb-2">درآمد از کلاس‌های خالی مدرسه</div>
              • عصرها و پنجشنبه/جمعه کلاس‌ها خالی است — همان ساعت‌ها را اجاره بدهید<br />
              • درآمد حدودی: {rangeT([90000, 450000] as [number, number])} به‌ازای هر ساعت (بسته به شهر و امکانات)<br />
              • قرارداد رسمی با ترنم همدلی؛ هماهنگی و بیمه جلسات با ما<br />
              • برند مدرسه‌تان به‌عنوان «مرکز همکار کنکور» در نقشه سایت نمایش داده می‌شود
            </div>
          </div>
        )}
      </div>

      {/* ── پانوشت تماس */}
      <div className="text-center text-sm text-slate-400 flex items-center justify-center gap-2">
        <Phone className="w-4 h-4" /> سوالی دارید؟ از «💬 مشاوره با دکتر رادان» بپرسید یا فرم بالا را ثبت کنید تا تماس بگیریم.
      </div>
    </div>
  );
}
