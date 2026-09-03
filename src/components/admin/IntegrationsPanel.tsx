import React from "react";
import { Sparkles, Globe, Link, ShieldCheck, Zap } from "lucide-react";

interface IntegrationsPanelProps {
  serverStatus: any;
  activeAdminTheme: string;
  geminiKey: string;
  setGeminiKey: (val: string) => void;
  onSaveApiKey: () => void;
  liveValidationStatus: string;
  liveValidationMessage: string;
}

export default function IntegrationsPanel({
  serverStatus, activeAdminTheme,
  geminiKey, setGeminiKey, onSaveApiKey,
  liveValidationStatus, liveValidationMessage
}: IntegrationsPanelProps) {
  return (
    <div className="space-y-6" id="admin-tab-integrations">
      <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-8">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-6">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Globe size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">یکپارچه‌سازی و درگاه‌های خارجی</h2>
            <p className="text-xs text-slate-400 font-bold">اتصال به هوش مصنوعی، درگاه‌های پرداخت و وردپرس</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gemini API Key Section */}
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-150 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900">تنظیم کلید هوش مصنوعی (Gemini API)</h3>
            </div>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">برای استفاده از تحلیل‌های هوشمند روان‌شناختی، کلید API خود را اینجا وارد کنید.</p>
            <input 
              type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono bg-white"
              placeholder="AIzaSy..."
            />
            <button onClick={onSaveApiKey} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black rounded-xl transition shadow-md">
              ذخیره و اعتبارسنجی
            </button>
            {liveValidationStatus !== "idle" && (
              <div className={`text-[10px] font-black p-2 rounded-lg text-center ${liveValidationStatus === "valid" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                {liveValidationMessage}
              </div>
            )}
          </div>

          {/* Payment Gateways Section */}
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-150 space-y-4">
            <div className="flex items-center gap-2">
              <Link size={18} className="text-emerald-600" />
              <h3 className="text-sm font-black text-slate-900">درگاه پرداخت زرین‌پال</h3>
            </div>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">اتصال خودکار ثبت‌نام‌های لندینگ به پنل داوطلبان پس از تایید تراکنش.</p>
            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] font-black text-slate-600">وضعیت درگاه:</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black border border-emerald-100">فعال (Sandbox)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
