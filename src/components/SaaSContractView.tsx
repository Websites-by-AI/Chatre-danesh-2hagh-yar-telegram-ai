import React, { useRef, useState } from "react";
import { 
  FileText, ShieldCheck, Cpu, HardDrive, Database, DollarSign, 
  Printer, Download, Calendar, Users, Zap, TrendingUp, Clock, Layers, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SaaSContractViewProps {
  onBack?: () => void;
}

type Tier = "bronze" | "silver" | "gold";

const SaaSContractView: React.FC<SaaSContractViewProps> = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedTier, setSelectedTier] = useState<Tier>("bronze");

  const handlePrint = () => {
    window.print();
  };

  const TIERS = {
    bronze: {
      name: "سطح برنزی (پایه)",
      price: "۱۰,۰۰۰,۰۰۰ تومان",
      capacity: "تا ۱۰۰ داوطلب",
      cpu: "2 vCPU Shared",
      ram: "8GB RAM",
      storage: "20GB SSD",
      ai: "هوش مصنوعی پایه (آنالیزور تراز)",
      ref: "TM-SAAS-BRONZE-2026",
      support: "تیکتینگ استاندارد",
    },
    silver: {
      name: "سطح نقره‌ای (پیشرفته)",
      price: "۴۵,۰۰۰,۰۰۰ تومان",
      capacity: "تا ۵۰۰ داوطلب",
      cpu: "4 vCPU Dedicated",
      ram: "16GB ECC RAM",
      storage: "50GB NVMe",
      ai: "هوش مصنوعی پیشرفته (Gemini Pro)",
      ref: "TM-SAAS-SILVER-2026",
      support: "پشتیبانی تلفنی اداری",
    },
    gold: {
      name: "سطح طلایی (نامحدود)",
      price: "۱۲۰,۰۰۰,۰۰۰ تومان",
      capacity: "نامحدود",
      cpu: "8 vCPU v4 (Scalable Architecture)",
      ram: "32GB ECC RAM",
      storage: "100GB NVMe SSD (Encrypted)",
      ai: "پورتال Enterprise و مدیریت عمیق روانشناسی",
      ref: "TM-SAAS-GOLD-2026",
      support: "پشتیبانی ۲۴/۷ اولویت‌دار VIP",
    }
  };

  const currentTier = TIERS[selectedTier];

  const INFRA_DETAILS = [
    { label: "پردازنده مختص سرویس", value: currentTier.cpu, icon: <Cpu size={16} /> },
    { label: "حافظه رم (ECC)", value: currentTier.ram, icon: <Layers size={16} /> },
    { label: "فضای دیسک ابری", value: currentTier.storage, icon: <HardDrive size={16} /> },
    { label: "ظرفیت داوطلبان", value: currentTier.capacity, icon: <Users size={16} /> },
    { label: "مدل هوش مصنوعی", value: currentTier.ai, icon: <Zap size={16} /> },
  ];

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm no-print">
        <div className="text-right">
          <h2 className="text-sm font-black text-slate-900 border-r-4 border-blue-600 pr-3">صدور هوشمند قرارداد و حق امتیاز (SaaS)</h2>
          <p className="text-[10px] text-slate-500 font-bold mt-1">ویرایش آنی پکیج، مشخصات فنی و دریافت نسخه چاپی مرکزگرا</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-2xl text-[10px] font-black hover:bg-blue-800 transition shadow-lg shadow-blue-900/20"
          >
            <Printer size={16} />
            <span>چاپ و تایید نهایی قرارداد</span>
          </button>
        </div>
      </div>

      {/* Tier Selection - Interactive Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
         {(Object.keys(TIERS) as Tier[]).map((tierKey) => (
           <button
             key={tierKey}
             onClick={() => setSelectedTier(tierKey)}
             className={`relative p-5 rounded-3xl border-2 transition-all flex flex-col items-start gap-2 text-right ${
               selectedTier === tierKey 
                 ? "border-blue-600 bg-blue-50/50 shadow-md ring-4 ring-blue-600/5" 
                 : "border-slate-100 bg-white hover:border-slate-200"
             }`}
           >
             <div className="flex justify-between items-center w-full">
                <span className={`text-[10px] font-black tracking-tighter ${selectedTier === tierKey ? "text-blue-900" : "text-slate-400"}`}>
                  {tierKey === "gold" ? "پکیج سازمانی" : tierKey === "silver" ? "پکیج حرفه‌ای" : "پکیج پایه"}
                </span>
                {selectedTier === tierKey && <CheckCircle2 size={16} className="text-blue-600" />}
             </div>
             <h3 className="text-xs font-black text-slate-900">{TIERS[tierKey].name}</h3>
             <span className="text-sm font-black text-blue-950 mt-1">{TIERS[tierKey].price}</span>
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
        {/* Left Column: Technical and Financial Sidebar */}
        <div className="lg:col-span-1 space-y-6 no-print">
          {/* Infrastructure Specs */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
               <Cpu size={120} />
            </div>
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Cpu className="text-blue-400" size={20} />
              <div className="text-right">
                <h3 className="text-xs font-black">کانفیگ ابری پکیج انتخابی</h3>
                <p className="text-[9px] opacity-60 font-bold">زیرساخت اختصاصی ترنم مهر</p>
              </div>
            </div>
            <div className="space-y-3 relative z-10">
              {INFRA_DETAILS.map((item, i) => (
                <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                  <span className="text-[10px] font-bold text-slate-300">{item.value}</span>
                  <div className="flex items-center gap-2 text-right">
                    <span className="text-[9px] font-black">{item.label}</span>
                    <div className="text-blue-400 opacity-80">{item.icon}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-2">
               <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-3 flex items-center gap-3">
                  <ShieldCheck size={16} className="text-blue-400" />
                  <span className="text-[9px] font-bold leading-relaxed">
                    پشتیبانی: {currentTier.support}
                  </span>
               </div>
            </div>
          </div>

          {/* Quick Stats Dashboard */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
             <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
                <TrendingUp size={16} className="text-emerald-600" />
                <h3 className="text-xs font-black text-slate-900">برآورد بازگشت سرمایه (ROI)</h3>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-950">{currentTier.capacity}</span>
                   <span className="text-[9px] text-slate-400 font-bold">ظرفیت پذیرش:</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-emerald-600">۴۸ ساعت</span>
                   <span className="text-[9px] text-slate-400 font-bold">زمان میانگین استقرار:</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-blue-900">مبتنی بر Cloud Run</span>
                   <span className="text-[9px] text-slate-400 font-bold">مدل میزبانی:</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Dynamic Contract Preview */}
        <div className="lg:col-span-2">
          <div 
            ref={printRef}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:border-0 print:shadow-none print:rounded-none relative"
            id="printable-contract"
          >
            {/* Watermark for print */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center rotate-45 select-none print:flex hidden">
               <span className="text-9xl font-black text-blue-900">TARANOM MEHR</span>
            </div>

            {/* Contract Header */}
            <div className="bg-slate-50 p-8 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6 print:bg-white print:border-b-4 print:border-blue-900">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-900 text-white rounded-2xl flex items-center justify-center shadow-lg print:shadow-none print:border print:border-slate-200">
                  <Layers size={32} />
                </div>
                <div className="text-right">
                  <h1 className="text-lg font-black text-blue-950">آکادمی تخصصی ترنم مهر</h1>
                  <p className="text-[10px] font-bold text-slate-500">پیشرو در هوش مصنوعی آموزشی و پلتفرم‌های SaaS</p>
                </div>
              </div>
              <div className="text-right space-y-1.5">
                 <div className="text-[10px] font-black text-slate-900">شناسه سند: <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">{currentTier.ref}</span></div>
                 <div className="text-[10px] font-black text-slate-900">تاریخ صدور: <span className="font-mono">۱۴۰۳/۰۳/۱۱</span></div>
                 <div className="text-[9px] bg-blue-100 text-blue-700 font-black px-3 py-1 rounded-full border border-blue-200 inline-block uppercase">نسخه پیش‌نویس نهایی سیستم</div>
              </div>
            </div>

            {/* Contract Interior Body */}
            <div className="p-10 text-right leading-loose" dir="rtl">
              <div className="text-center mb-10">
                 <h2 className="text-lg font-black text-slate-900 mb-2">قرارداد واگذاری حق امتیاز بهره‌برداری از سامانه هوشمند «ترنم مهر»</h2>
                 <div className="h-1 w-48 bg-blue-900 mx-auto rounded-full" />
              </div>

              <div className="space-y-8 text-[12px] font-bold text-slate-800">
                <p className="leading-relaxed">
                  این قرارداد بر اساس ماده ۱۰ قانون مدنی و تحت حاکمیت قوانین جمهوری اسلامی ایران، میان 
                  <strong> آکادمی تخصصی ترنم مهر</strong> (به‌عنوان واگذارکننده) و 
                  <strong> موسسه آموزشی طرف تقاضا</strong> (به‌عنوان بهره‌بردار) با شرایط ذیل منعقد می‌گردد.
                </p>

                <div className="space-y-6">
                  <section>
                    <h3 className="text-sm font-black text-blue-900 mb-3 flex items-center gap-2">
                       <span className="w-6 h-6 bg-blue-100 text-blue-900 rounded-lg flex items-center justify-center text-[10px]">۱</span>
                       <span>ماده ۱: موضوع قرارداد</span>
                    </h3>
                    <p className="pr-8 text-justify">واگذاری حقوق بهره‌برداری غیرانحصاری از ظرفیت موتور پردازش هوش مصنوعی «ترنم مهر» در <strong>{currentTier.name}</strong> جهت پایش، عارضه‌یابی و هدایت تحصیلی داوطلبان کنکور سراسری.</p>
                  </section>

                  <section>
                    <h3 className="text-sm font-black text-blue-900 mb-3 flex items-center gap-2">
                       <span className="w-6 h-6 bg-blue-100 text-blue-900 rounded-lg flex items-center justify-center text-[10px]">۲</span>
                       <span>ماده ۲: تعهدات فنی و زیرساخت (SaaS Deployment)</span>
                    </h3>
                    <p className="pr-8 mb-3 text-justify">واگذارکننده متعهد می‌گردد زیرساختی ابری با معماری توزیع شده و مشخصات فنی ذیل را در بستر کانتینری ایزوله برای بهره‌بردار مستقر نماید:</p>
                    <div className="grid grid-cols-2 gap-4 pr-8">
                       <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center">
                          <span className="text-[10px] font-mono text-blue-900">{currentTier.cpu}</span>
                          <span className="text-[10px] text-slate-500">پردازنده (CPU)</span>
                       </div>
                       <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center">
                          <span className="text-[10px] font-mono text-blue-900">{currentTier.ram}</span>
                          <span className="text-[10px] text-slate-500">حافظه (RAM)</span>
                       </div>
                       <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center">
                          <span className="text-[10px] font-mono text-blue-900">{currentTier.storage}</span>
                          <span className="text-[10px] text-slate-500">فضای ذخیره</span>
                       </div>
                       <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex justify-between items-center">
                          <span className="text-[10px] text-blue-900">Cloud Run / K8s</span>
                          <span className="text-[10px] text-slate-500">نوع استقرار</span>
                       </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-sm font-black text-blue-900 mb-3 flex items-center gap-2">
                       <span className="w-6 h-6 bg-blue-100 text-blue-900 rounded-lg flex items-center justify-center text-[10px]">۳</span>
                       <span>ماده ۳: ظرفیت و محدودیت‌های عملیاتی</span>
                    </h3>
                    <p className="pr-8">این قرارداد اجازه ثبت‌نام و مدیریت داوطلبان را حداکثر تا سقف <strong>{currentTier.capacity}</strong> به صورت همزمان در پایگاه داده‌های توزیع شده فراهم می‌آورد. افزایش ظرفیت منوط به خرید ماژول‌های جداگانه یا ارتقای پکیج می‌باشد.</p>
                  </section>

                  <section>
                    <h3 className="text-sm font-black text-blue-900 mb-3 flex items-center gap-2">
                       <span className="w-6 h-6 bg-blue-100 text-blue-900 rounded-lg flex items-center justify-center text-[10px]">۴</span>
                       <span>ماده ۴: مبلغ قرارداد و نحوه تسویه</span>
                    </h3>
                    <p className="pr-8">ارزش کل واگذاری حق امتیاز در این پکیج معادل <strong>{currentTier.price}</strong> می‌باشد که طبق توافقنامه الحاقی، ۲۰٪ در زمان تایید اولیه و مابقی پس از استقرار نهایی در کلاود اختصاصی موسسه تسویه می‌گردد.</p>
                  </section>
                </div>

                <div className="mt-16 flex justify-between items-start gap-12 pt-12 border-t border-slate-100">
                   <div className="flex-1 text-center space-y-8">
                      <p className="font-black text-slate-400">محل مهر و امضای موسسه (بهره‌بردار)</p>
                      <div className="h-20" />
                   </div>
                   <div className="flex-1 text-center space-y-4">
                      <p className="font-black text-slate-900">مهر و امضای مدیریت آکادمی ترنم مهر</p>
                      <div className="w-32 h-32 mx-auto bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center relative shadow-inner">
                         <ShieldCheck size={48} className="text-blue-900 opacity-10" />
                         <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                            <Layers size={64} className="text-blue-900" />
                         </div>
                      </div>
                      <p className="text-[9px] font-mono text-slate-400 select-all tracking-widest">{currentTier.ref}</p>
                   </div>
                </div>

                <div className="mt-12 p-5 bg-blue-50 rounded-3xl border border-blue-100 text-[9px] text-blue-800 text-center font-black leading-relaxed no-print">
                   « پلتفرم هوشمند ترنم مهر مجهز به پروتکل‌های مشاوره استاندارد و آنالیزورهای عمیق روانشناختی بر پایه تکنولوژی ابری »
                </div>
              </div>
            </div>

            {/* Footer for PDF */}
            <div className="p-8 bg-slate-950 text-white hidden print:flex items-center justify-between mt-auto">
               <div className="text-[9px] font-bold opacity-60">کپیرایت ۱۴۰۵ • تمامی حقوق مادی و معنوی متعلق به آکادمی ترنم مهر است.</div>
               <div className="text-[9px] font-mono">ais.taranom-mehr.ir</div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          html, body { 
            height: 100%; 
            margin: 0 !important; 
            padding: 0 !important;
            overflow: visible !important;
          }
          /* Hide everything except current module */
          body * { 
            visibility: hidden !important; 
            display: none !important;
          }
          #admin-view-container, 
          #admin-view-container *,
          #printable-contract, 
          #printable-contract * { 
            visibility: visible !important;
            display: block !important;
          }
          
          aside.no-print { display: none !important; }
          .no-print { display: none !important; }

          #printable-contract {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            padding: 0;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}} />
    </div>
  );
};

export default SaaSContractView;
