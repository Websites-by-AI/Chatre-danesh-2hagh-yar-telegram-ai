import { useState } from "react";
import { 
  TrendingUp, Users, Target, ShieldCheck, 
  Map, Rocket, Layers, Cpu, CreditCard,
  Briefcase, BarChart3, ChevronRight, CheckCircle2,
  PieChart, Globe, Zap, FileText, Award, Server, Database, DollarSign,
  ChevronLeft, Info, HelpCircle, HardDrive
} from "lucide-react";
import { motion } from "motion/react";
import { jsPDF } from "jspdf";

export default function InvestmentView() {
  const [activeStep, setActiveStep] = useState(0);

  const stats = [
    { label: "ارزش‌گذاری (ساعت کار فنی)", value: "۴۸۰۰ ساعت تخصصی", icon: <TrendingUp size={20} />, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "هزینه نیروی برنامه‌نویسی", value: "۱.۲ میلیارد تومان", icon: <Layers size={20} />, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "ارزش برآوردی نهایی", value: "۳.۵ میلیارد تومان", icon: <BarChart3 size={20} />, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "مدل واگذاری", value: "B2B / حق امتیاز", icon: <Briefcase size={20} />, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  const downloadContract = () => {
    const doc = new jsPDF();
    const tier = tiers[activeTier];
    
    doc.setFont("helvetica", "bold");
    doc.text("Taranom Mehr Academy - Strategic Partnership Agreement", 10, 10);
    doc.setFont("helvetica", "normal");
    doc.text("--------------------------------------------------", 10, 15);
    doc.text(`Selected Tier: ${tier.name}`, 10, 25);
    doc.text(`Investment Value: ${tier.price}`, 10, 32);
    doc.text(`Student Capacity: ${tier.limit}`, 10, 39);
    
    doc.text("1. Infrastructure Specifications:", 10, 50);
    infraSpecs.forEach((spec, idx) => {
      doc.text(`${spec.label}: ${spec.value}`, 15, 57 + (idx * 7));
    });
    
    doc.text("2. Included Features:", 10, 110);
    tier.features.forEach((feature, idx) => {
      doc.text(`- ${feature}`, 15, 117 + (idx * 7));
    });
    
    doc.text("3. Taranom Mehr Guarantee:", 10, 160);
    doc.text("Platform uptime 99.9% guaranteed via Google Cloud Support.", 10, 167);
    doc.text("Security updates and AI model management included for 5 years.", 10, 174);
    
    doc.text("Date of Draft: 2026-05-31", 10, 200);
    doc.save(`Taranom_Mehr_${activeTier}_Contract.pdf`);
  };

  const roadmap = [
    { title: "تجهیز و شخصی‌سازی", description: "آماده‌سازی پلتفرم و کانفیگ اختصاصی برای موسسه (شامل برندینگ و دیتابیس اختصاصی)", icon: <Rocket />, duration: "۱ ماه اول" },
    { title: "استقرار هوش مصنوعی پایه", description: "ارائه پکیج مدیریت هوشمند داوطلب و تحلیلگر پایه روانشناسی (Gemini 1.5 Flash)", icon: <Cpu />, duration: "ماه دوم" },
    { title: "بازاریابی و جذب کاربر", description: "کمپین‌های مشترک با آکادمی ترنم مهر برای معرفی موسسه به ۳۰،۰۰۰ داوطلب فعال", icon: <Globe />, duration: "مداوم" },
    { title: "ارتقای ماژولار", description: "امکان افزودن تحلیل‌های پیشرفته متمرکز بر نورومارکتینگ و روان‌سنجی تخصصی با هزینه مجزا", icon: <Zap />, duration: "اختیاری" },
  ];

  const [activeTier, setActiveTier] = useState<"bronze" | "silver" | "gold">("bronze");

  const tiers = {
    bronze: {
      name: "سطح برنزی (پایه)",
      price: "۱۰ میلیون تومان",
      limit: "تا ۱۰۰ داوطلب",
      features: [
        "هوش مصنوعی آنالیزور روان‌سنجی (پایه)",
        "پنل اختصاصی مدیریت موسسه",
        "ارائه روی ساب‌دومین اختصاصی",
        "پایش تراز و رتبه داوطلب"
      ],
      color: "from-orange-100 to-orange-200",
      icon: <Award className="text-orange-600" size={24} />
    },
    silver: {
      name: "سطح نقره‌ای (پیشرفته)",
      price: "۴۵ میلیون تومان",
      limit: "تا ۵۰۰ داوطلب",
      features: [
        "هوش مصنوعی پیشرفته (Gemini Pro)",
        "سیستم پیشنهاددهنده هوشمند منابع",
        "یکپارچه‌سازی با CRM های خارجی",
        "گزارش‌دهی خودکار به والدین (Auto-Report)",
        "منتورینگ تخصصی تیم فروش"
      ],
      color: "from-slate-100 to-slate-300",
      icon: <Award className="text-slate-600" size={24} />
    },
    gold: {
      name: "سطح طلایی (نامحدود)",
      price: "۱۲۰ میلیون تومان",
      limit: "نامحدود",
      features: [
        "پورتال Enterprise اختصاصی",
        "دامنه اختصاصی IR / COM",
        "پشتیبانی ۲۴/۷ اولویت‌دار VIP",
        "ماژول تحلیل نورومارکتینگ و روان‌شناسی عمیق",
        "سفارشی‌سازی کامل رابط کاربری",
        "دسترسی به API های مرکزی ترنم مهر"
      ],
      color: "from-amber-100 to-amber-300",
      icon: <Award className="text-amber-600" size={24} />
    }
  };

  const infraSpecs = [
    { label: "نوع زیرساخت", value: "Cloud Native / Kubernetes", icon: <Server size={14} /> },
    { label: "نوع هاست", value: "Dedicated Cloud Instance (Isolated)", icon: <Globe size={14} /> },
    { label: "پردازنده (CPU)", value: "8 vCPU v4 (Scalable Architecture)", icon: <Cpu size={14} /> },
    { label: "حافظه موقت (RAM)", value: "32GB ECC RAM", icon: <Layers size={14} /> },
    { label: "ذخیره‌سازی (Storage)", value: "100GB NVMe SSD (Encrypted)", icon: <Database size={14} /> },
    { label: "هزینه نگهداری ماهانه", value: "۳،۵۰۰،۰۰۰ تومان (تخمینی)", icon: <DollarSign size={14} /> },
  ];

  const valueProps = [
    "پنل مدیریت اختصاصی با هوش مصنوعی محدود",
    "دسترسی به پروتکل‌های مشاوره استاندارد ترنم مهر",
    "سیستم گزارش‌دهی خودکار به والدین (Auto-Report)",
    "داشبورد پایش عملکرد مشاورین موسسه",
    "پشتیبانی فنی و امنیتی ۵ ساله"
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12" id="investment-view-root" style={{ direction: "rtl" }}>
      {/* Header Section */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 bg-indigo-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-emerald-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span className="text-xs font-black tracking-wider uppercase">Strategic Technology Partnership</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black">طرح توسعه و مشارکت مدنی-فنی</h1>
            <p className="text-slate-400 text-sm max-w-xl font-semibold leading-relaxed">
              ارزش واقعی این پلتفرم بسیار فراتر از اعداد فعلی است؛ اما ما برای ورود تکنولوژی به بدنه جامعه آموزشی، ارزش‌گذاری را صرفاً بر مبنای <span className="text-amber-400">ساعت کار فنی و هزینه برنامه‌نویس</span> انجام داده‌ایم تا مشارکت برای موسسات تسهیل گردد.
            </p>
          </div>
          <button 
            onClick={downloadContract}
            className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
          >
            <FileText size={18} />
            دریافت پروپوزال و پیش‌نویس قرارداد
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-400 font-black mb-0.5">{stat.label}</p>
              <p className="text-sm font-black text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Subscription Tiers Selection */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Award size={18} className="text-amber-500" />
            انتخاب پکیج و سطح مشارکت تجاری
          </h3>
          <p className="text-[10px] text-slate-400 font-bold">بر اساس مقیاس و نیاز موسسه آموزشی شما</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(Object.entries(tiers) as [keyof typeof tiers, typeof tiers.bronze][]).map(([key, tier]) => (
            <motion.div
              key={key}
              whileHover={{ y: -4 }}
              onClick={() => setActiveTier(key as any)}
              className={`relative bg-white rounded-[35px] border-2 p-8 transition-all duration-300 cursor-pointer overflow-hidden ${
                activeTier === key ? "border-indigo-600 shadow-xl shadow-indigo-100" : "border-slate-100 hover:border-slate-200"
              }`}
            >
              {activeTier === key && (
                <div className="absolute top-4 left-4">
                  <CheckCircle2 size={24} className="text-indigo-600" />
                </div>
              )}
              
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-6 shadow-sm`}>
                {tier.icon}
              </div>

              <div className="space-y-1 mb-6 text-right">
                <h4 className="text-lg font-black text-slate-900">{tier.name}</h4>
                <div className="flex items-baseline gap-1 text-indigo-600">
                  <span className="text-2xl font-black">{tier.price}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold">{tier.limit}</p>
              </div>

              <div className="space-y-3 border-t border-slate-50 pt-6">
                {tier.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-600 leading-normal">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Technical Stack / Infrastructure */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[35px] border border-slate-100 shadow-sm p-8 space-y-6 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />
            
            <div className="flex items-center gap-2 mb-2 relative z-10">
              <Server size={18} className="text-blue-600" />
              <h3 className="text-sm font-black text-slate-800">مشخصات فنی و زیرساخت SaaS</h3>
            </div>
            
            <div className="space-y-4 relative z-10">
              {infraSpecs.map((spec, sIdx) => (
                <div key={sIdx} className="flex items-center justify-between p-3.5 bg-slate-50/50 rounded-2xl border border-slate-100">
                   <div className="flex items-center gap-2 text-slate-400">
                      {spec.icon}
                      <span className="text-[10px] font-bold">{spec.label}</span>
                   </div>
                   <span className="text-[10px] font-black text-slate-700">{spec.value}</span>
                </div>
              ))}
            </div>

            <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start gap-3 relative z-10 mt-4">
               <Info size={16} className="text-orange-600 shrink-0 mt-0.5" />
               <p className="text-[10px] text-orange-900 font-bold leading-normal">
                  زیرساخت ابری ترنم مهر بر روی کلاود گوگل (Cloud Run) و با معماری کانتینری مدیریت می‌شود تا پایداری ۹۹.۹٪ را در زمان اوج بارهای ترافیکی آزمون‌ها تضمین کند.
               </p>
            </div>
          </div>
        </div>

        {/* Existing Details and Roadmap */}
        <div className="lg:col-span-2 space-y-8">
           {/* Collaboration Details Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Target size={18} className="text-indigo-600" />
                جزئیات پکیج مشارکت (۱۰ میلیون تومانی)
              </h3>
              <span className="text-[10px] font-bold text-slate-500 px-3 py-1 bg-white rounded-full border border-slate-100">ظرفیت محدود: بمانده ۲۴ از ۳۰</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50/30 text-slate-400 border-b border-slate-50">
                    <th className="p-4 font-black">عنوان خدمت</th>
                    <th className="p-4 font-black">وضعیت در پکیج پایه</th>
                    <th className="p-4 font-black">ارزش تقریبی</th>
                  </tr>
                </thead>
                <tbody className="text-slate-600 font-bold">
                  {[
                    { label: "هوش مصنوعی آنالیزور روان‌سنجی", status: "محدود (Basic Core)", value: "۴ میلیون" },
                    { label: "پنل اختصاصی مدیریت موسسه", status: "فعال", value: "۳ میلیون" },
                    { label: "ارائه روی ساب‌دومین اختصاصی", status: "فعال", value: "۱.۵ میلیون" },
                    { label: "آموزش و منتورینگ تیم فروش موسسه", status: "یک جلسه آفلاین", value: "۱.۵ میلیون" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-800">{row.label}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg ${row.status.includes("فعال") ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 font-mono tracking-tighter">{row.value} تومان</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 bg-slate-900 text-slate-400">
               <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-amber-400 mt-1 flex-shrink-0" />
                  <p className="text-[11px] leading-6">
                    این پکیج شامل «هوش مصنوعی پایه» است. موسساتی که نیاز به تحلیل‌های عمیق‌تر، سیستم پیشنهاددهنده هوشمند پیشرفته و یکپارچه‌سازی با CRM های خارجی دارند، می‌توانند در فاز دوم همکاری با پرداخت هزینه‌های ماژولار، سیستم خود را ارتقا دهند.
                  </p>
               </div>
            </div>
          </div>

          {/* Investment Value Proposition */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8 space-y-6">
             <h3 className="text-sm font-black text-slate-800">چرا با ترنم مهر مشارکت کنید؟</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {valueProps.map((prop, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 border border-slate-50 rounded-2xl bg-slate-50/30">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-emerald-500/20">
                            <CheckCircle2 size={12} strokeWidth={4} />
                        </div>
                        <span className="text-[11px] font-black text-slate-700">{prop}</span>
                    </div>
                ))}
             </div>
          </div>
        </div>

        {/* Roadmap Column */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <h3 className="text-sm font-black text-slate-800 mb-8 flex items-center gap-2">
              <Map size={18} className="text-amber-500" />
              نقشه راه مشارکت (Roadmap)
            </h3>
            
            <div className="relative border-r-2 border-slate-100 mr-2 space-y-10">
              {roadmap.map((step, idx) => (
                <div key={idx} className="relative pr-8" onMouseEnter={() => setActiveStep(idx)}>
                  {/* Indicator Dot */}
                  <div className={`absolute top-0 -right-[9px] w-4 h-4 rounded-full border-4 border-white shadow-sm transition-all duration-300 ${activeStep === idx ? "bg-indigo-600 scale-125 ring-4 ring-indigo-50" : "bg-slate-200"}`} />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className={`text-xs font-black transition-colors ${activeStep === idx ? "text-indigo-600" : "text-slate-800"}`}>
                        {step.title}
                      </h4>
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{step.duration}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-3 mb-3 text-indigo-900">
                    <CreditCard size={18} />
                    <span className="text-xs font-black">اطلاعات پرداختی</span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black">
                        <span className="text-indigo-600/60">هزینه اولیه ثبت‌نام:</span>
                        <span className="text-indigo-950">۲،۰۰۰،۰۰۰ تومان</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black">
                        <span className="text-indigo-600/60">باقیمانده پس از عقد قرارداد:</span>
                        <span className="text-indigo-950">۸،۰۰۰،۰۰۰ تومان</span>
                    </div>
                </div>
                <button 
                  onClick={downloadContract}
                  className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                    دانلود پیش‌نویس قرارداد
                </button>
            </div>
          </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white space-y-4">
                 <div className="flex items-center gap-2 text-amber-400">
                    <PieChart size={18} />
                    <span className="text-xs font-black italic">Investor Analytics</span>
                 </div>
                 <p className="text-[11px] font-bold text-slate-400 leading-relaxed">
                    پلتفرم ترنم مهر با بیش از ۲ سال سابقه در تحقیق و توسعه متدهای روان‌سنجی نوین، اکنون آماده ورود به بازارهای B2B است. ارزش‌گذاری ۳.۵ میلیارد تومانی فعلی بر اساس هزینه‌های فنی مستقیم و ارزش معنوی برند است.
                 </p>
              </div>
        </div>
      </div>
      {/* Detailed Contract Draft Preview (Persian) */}
      <div className="bg-white rounded-[35px] border border-slate-100 shadow-sm p-8 space-y-6">
         <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <div className="flex items-center gap-2">
               <FileText size={20} className="text-blue-600" />
               <h3 className="text-base font-black text-slate-800">پیش‌نویس قرارداد مشارکت هوشمند (نسخه زنده)</h3>
            </div>
            <button 
              onClick={downloadContract}
              className="text-[10px] bg-slate-900 text-white px-4 py-2 rounded-xl font-black hover:bg-slate-800 transition shadow-lg"
            >
              خروجی رسمی PDF
            </button>
         </div>

         <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100/50 font-medium text-slate-700 space-y-6 leading-relaxed text-right relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-l from-blue-600 to-indigo-600" />
            
            <div className="text-center space-y-2 border-b border-slate-200 pb-6">
               <h4 className="text-lg font-black text-slate-900">قرارداد واگذاری حق امتیاز بهره‌برداری از سامانه هوشمند «ترنم مهر»</h4>
               <p className="text-xs text-slate-400">طرفین قرارداد: آکادمی تخصصی ترنم مهر و موسسه آموزشی طرف تقاضا</p>
            </div>

            <div className="space-y-4">
               <div>
                  <h5 className="text-xs font-black text-slate-900 mb-1">ماده ۱: موضوع قرارداد</h5>
                  <p className="text-[11px]">واگذاری لایسنس بهره‌برداری از ظرفیت موتور پردازش هوش مصنوعی {tiers[activeTier].name} جهت پایش، عارضه‌یابی و هدایت تحصیلی داوطلبان کنکور سراسری.</p>
               </div>

               <div>
                  <h5 className="text-xs font-black text-slate-900 mb-1">ماده ۲: تعهدات فنی و زیرساخت</h5>
                  <p className="text-[11px]">آکادمی ترنم مهر متعهد می‌گردد زیرساختی با مشخصات {infraSpecs.find(s => s.label === "پردازنده (CPU)")?.value} و حافظه {infraSpecs.find(s => s.label === "حافظه موقت (RAM)")?.value} را در بستر کانتینری ایزوله برای طرف قرارداد مستقر نماید.</p>
               </div>

               <div>
                  <h5 className="text-xs font-black text-slate-900 mb-1">ماده ۳: ظرفیت و محدودیت‌ها</h5>
                  <p className="text-[11px]">این قرارداد اجازه ثبت‌نام و مدیریت حداکثر {tiers[activeTier].limit} داوطلب را به صورت همزمان در پایگاه داده‌های توزیع شده فراهم می‌آورد.</p>
               </div>

               <div>
                  <h5 className="text-xs font-black text-slate-900 mb-1">ماده ۴: مبلغ قرارداد و نحوه پرداخت</h5>
                  <p className="text-[11px]">ارزش کل این پکیج معادل {tiers[activeTier].price} می‌باشد که طبق توافق‌نامه الحاقی، ۲۰٪ در زمان ثبت‌نام اولیه و مابقی پس از استقرار نهایی در کلاود اختصاصی موسسه تسویه می‌گردد.</p>
               </div>
            </div>

            <div className="flex justify-between items-end pt-8 border-t border-slate-200">
               <div className="space-y-1">
                  <p className="text-[10px] text-slate-400 font-bold underline">مهر و امضای مدیریت آکادمی ترنم مهر</p>
                  <div className="w-24 h-12 bg-slate-100 rounded-lg border border-dashed border-slate-200 opacity-50" />
               </div>
               <div className="text-left">
                  <p className="text-[9px] text-slate-400 font-mono tracking-widest leading-none">REF: TM-SAAS-{activeTier.toUpperCase()}-2026</p>
               </div>
            </div>
         </div>
         
         <div className="flex items-center gap-2 justify-center text-[10px] text-slate-400 font-bold">
            <HelpCircle size={12} />
            <span>این یک پیش‌نویس سیستمی است و جهت نهایی‌سازی نیاز به تایید دپارتمان حقوقی هلدینگ دارد.</span>
         </div>
      </div>
    </div>
  );
}
