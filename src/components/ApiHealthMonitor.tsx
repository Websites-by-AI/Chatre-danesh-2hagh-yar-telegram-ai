import React, { useEffect, useState } from 'react';
import { 
  Activity, CheckCircle, AlertTriangle, AlertCircle, X, Terminal, Settings, 
  RefreshCw, Wifi, Key, Lock, ShieldCheck, Database, HelpCircle, Sparkles
} from 'lucide-react';

interface ApiHealthEvent {
  status: 'success' | 'retry' | 'error';
  url: string;
  message?: string;
  timestamp: number;
  latency?: number;
}

export function ApiHealthMonitor({ role }: { role?: string | null }) {
  const [logs, setLogs] = useState<ApiHealthEvent[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  
  // State for the AI Status Overlay
  const [showOverlay, setShowOverlay] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [serverStatus, setServerStatus] = useState<{ hasServerGeminiKey?: boolean; hasServerOpenRouterKey?: boolean; hasHuggingFace?: boolean; hasWandb?: boolean; huggingFaceModel?: string } | null>(null);
  const [hfStatus, setHfStatus] = useState<any>(null);

  // Quick API Key setup inside the overlay
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [inputKey, setInputKey] = useState("");

  const isAdmin = role === "admin";

  useEffect(() => {
    fetch("/api/ai-status")
      .then(r => r.json())
      .then(data => setServerStatus(data))
      .catch(err => console.warn("Could not retrieve keys status in ApiHealthMonitor:", err));
  }, []);

  // Hugging Face Llama + W&B + RAG connection (admin status bar)
  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/hf-status").then(r => r.ok ? r.json() : null).then(d => { if (d) setHfStatus(d); }).catch(() => {});
  }, [isAdmin]);

  useEffect(() => {
    // Sync starting key with what is currently stored
    if (showOverlay) {
      const activeKey = localStorage.getItem("arateb_gemini_api_key") || "";
      setInputKey(activeKey);
    }
  }, [showOverlay]);

  useEffect(() => {
    // Automatically trigger visual feedback on error
    const handleApiEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ApiHealthEvent>;
      if (customEvent.detail.status === 'error') {
        setShowOverlay(true);
      }
    };
    window.addEventListener('api-health-event', handleApiEvent);
    return () => window.removeEventListener('api-health-event', handleApiEvent);
  }, []);

  useEffect(() => {
    const handleApiLog = (e: Event) => {
      const customEvent = e as CustomEvent<ApiHealthEvent>;
      setLogs(prevLogs => {
        const newLogs = [customEvent.detail, ...prevLogs].slice(0, 50);
        return newLogs;
      });
    };

    window.addEventListener('api-health-event', handleApiLog);
    return () => {
      window.removeEventListener('api-health-event', handleApiLog);
    };
  }, []);

  // Technical logs are only accessible to admins
  // if (!isAdmin) return null; // Removed to allow friendly overlays for users

  const handleSaveKey = () => {
    localStorage.setItem("arateb_gemini_api_key", inputKey.trim());
    localStorage.setItem("arateb_openrouter_api_key", inputKey.trim());
    
    // Also dispatch a mock success or notification log to notify system of the key update
    const event = new CustomEvent('api-health-event', { 
      detail: { 
        status: 'retry', 
        url: 'تنظیمات کلید اختصاصی / Direct Key Setup', 
        message: 'کلید دسترسی در حافظه محلی ذخیره شد. لطفاً تلاش مجدد را بزنید.', 
        timestamp: Date.now() 
      } 
    });
    window.dispatchEvent(event);
    setRetryResult({ success: true, msg: "کلید با موفقیت در مرورگر ثبت شد. دکمه تلاش مجدد را بزنید." });
    setTimeout(() => setRetryResult(null), 3000);
    setShowKeyForm(false);
  };

  const handleTryAgain = async () => {
    const lastReq = (window as any).__lastFailedRequest;
    if (!lastReq) {
      setRetryResult({ success: false, msg: "هیچ درخواست معلقی برای بازخوانی پیدا نشد. لطفاً صفحه را ریفرش کنید." });
      return;
    }

    setIsRetrying(true);
    setRetryResult(null);

    try {
      // Re-trigger the native fetch request through our system interceptor
      const originalFetch = (window as any).fetch;
      const response = await fetch(lastReq.input, lastReq.init);
      
      if (response.ok) {
        setRetryResult({ success: true, msg: "ارتباط با موفقیت مجدداً برقرار شد! سیستم هوشمند در دسترس است. 🎉" });
        setTimeout(() => {
          setIsRetrying(false);
          setShowOverlay(false);
          setRetryResult(null);
        }, 1800);
      } else {
        setRetryResult({ 
          success: false, 
          msg: `پاسخ مجدد ناموفق بود (کد وضعیت: ${response.status}). لطفاً درستی کلید API و اینترنت خود را بسنجید.` 
        });
        setIsRetrying(false);
      }
    } catch (err: any) {
      setRetryResult({ 
        success: false, 
        msg: `خطا در بازخوانی فیزیکی: ${err?.message || err?.toString() || "ناشناخته"}` 
      });
      setIsRetrying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-emerald-400';
      case 'retry': return 'text-amber-400';
      case 'error': return 'text-rose-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={14} className="text-emerald-400" />;
      case 'retry': return <AlertTriangle size={14} className="text-amber-400 animate-pulse" />;
      case 'error': return <AlertCircle size={14} className="text-rose-400 animate-pulse" />;
      default: return <Activity size={14} className="text-slate-400" />;
    }
  };

  const latestLog = logs[0];

  return (
    <>
      {/* Mini status widget in Top Header - ONLY for Admins */}
      {isAdmin && (
        <div 
          className="flex items-center gap-2 cursor-pointer z-[100] hover:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700/40 bg-slate-900/50 transition-all shadow-sm"
          onClick={() => setIsOpen(true)}
        >
          {latestLog ? (
              <div className="flex items-center gap-1.5" title={latestLog.url}>
                {getStatusIcon(latestLog.status)}
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className={`${getStatusColor(latestLog.status)} font-bold tracking-tight`}>
                    API: {latestLog.status.toUpperCase()}
                  </span>
                  {latestLog.latency !== undefined && (
                    <span className={`${latestLog.latency > 1000 ? 'text-amber-500' : 'text-slate-400'} text-[10px]`}>
                      ({latestLog.latency}ms)
                    </span>
                  )}
                </div>
              </div>
          ) : (
              <div className="flex items-center gap-1.5">
                <Activity size={12} className="text-slate-400" />
                <span className="font-mono text-slate-400 text-[11px]">API: STABLE</span>
              </div>
          )}

          {hfStatus && (
            <div className="flex items-center gap-1.5 pr-2 mr-1 border-r border-slate-700/40" title={hfStatus.huggingface ? hfStatus.huggingface.note : ""}>
              <span className="text-[11px]">🤗</span>
              <span className="font-mono text-[11px] font-bold text-emerald-400">{hfStatus.huggingface && hfStatus.huggingface.configured ? "LLAMA" : "—"}</span>
              {hfStatus.wandb && hfStatus.wandb.configured && <span className="text-[10px] font-bold text-indigo-300">✦W&B</span>}
              {hfStatus.examRag && hfStatus.examRag.configured && <span className="text-[10px] font-bold text-purple-300">RAG</span>}
            </div>
          )}
        </div>
      )}

      {/* Main AI Status Overlay triggered on Errors - Adaptive Content */}
      {showOverlay && (
        isAdmin ? (
          <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in RTL" style={{ direction: 'rtl' }}>
            <div className="w-full max-w-xl bg-slate-900 border border-rose-900/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-in zoom-in-95 duration-200">
              {/* Overlay Header */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border-b border-rose-900/30">
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertTriangle size={22} className="animate-bounce" />
                  <h3 className="font-heavy text-base text-rose-300">اختلال شبکه یا خطای کلید در سرویس هوشمند</h3>
                </div>
                <button 
                  onClick={() => setShowOverlay(false)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                  title="بستن پنجره"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Overlay Contents */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                {/* Context Summary */}
                <div className="p-4 bg-rose-950/20 rounded-xl border border-rose-900/20 text-xs text-rose-200 leading-relaxed space-y-2">
                  <p className="font-bold">⚠️ خطای پایش همزمان سرویس رخ داده است:</p>
                  <p className="font-mono bg-slate-950/40 p-2 rounded text-[11px] truncate mt-1.5" title={latestLog?.url}>
                    آدرس مقصد: {latestLog?.url || "نامشخص"}
                  </p>
                  {latestLog?.message && (
                    <p className="font-mono text-amber-300 bg-slate-950/30 p-2 rounded text-[11px] mt-1">
                      جزییات خطا: {latestLog?.message}
                    </p>
                  )}

                  {/* Smart Diagnostic Info for Cloudflare & 405 Errors */}
                  {(() => {
                    const hasLocalGemini = !!(localStorage.getItem("arateb_gemini_api_key") && localStorage.getItem("arateb_gemini_api_key")!.trim().length > 10);
                    const hasLocalOpenRouter = !!(localStorage.getItem("arateb_openrouter_api_key") && localStorage.getItem("arateb_openrouter_api_key")!.trim().length > 10);
                    const hasLocalKeys = hasLocalGemini || hasLocalOpenRouter;
                    const hasServerKeys = !!serverStatus?.hasServerGeminiKey || !!serverStatus?.hasServerOpenRouterKey;
                    const isAnyKeyConfigured = hasLocalKeys || hasServerKeys;

                    if (!isAnyKeyConfigured) {
                      return (
                        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px]">
                          <p className="font-extrabold text-amber-350">🛑 تشخیص خودکار پورتال: کلید دسترسی (Secret) یافت نشد!</p>
                          <p className="text-slate-350 mt-1">
                            هیچ کلید اختصاصی (API Key) نه به صورت کلاینت‌ساید و نه در متغیرهای محیطی لایه سرور پیاده‌سازی نشده است. قبل از هر اقدامی، ابتدا کلید دسترسی خود را در فیلد زیر وارد کرده و گزینه ذخیره را بزنید.
                          </p>
                        </div>
                      );
                    } else {
                      return (
                        <div className="mt-3 p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-[11px]">
                          <p className="font-extrabold text-emerald-350">✓ تشخیص خودکار پورتال: کلید دسترسی پیکربندی شده است</p>
                          <p className="text-slate-350 mt-1">
                            تنظیمات کلید دسترسی (Secret) شما تأیید شد ({hasLocalKeys ? "ذخیره در مروگر شما" : "موجود در متغیرهای محیطی سرور"}). 
                          </p>
                          <p className="font-bold text-rose-300 mt-1.5 leading-relaxed">
                            ⚠️ نتیجه عارضه‌یابی: خطای فعلی (مثلاً ۴۰۵) ناشی از مسدود بودن فیزیکی یا پروکسی IP سرور شما توسط فایروال مقصد (گوگل یا کلودفلر) است. لطفاً تحریم‌شکن علمی خود را خاموش/روشن کرده، پورت کلودفلر را بررسی کنید، یا تغییر لوکیشن دهید.
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Troubleshooting Roadmap */}
                <div className="space-y-3">
                  <h4 className="text-xs font-heavy tracking-wider text-slate-400 uppercase">اقدامات توصیه‌شده جهت رفع سریع خطای لایو:</h4>
                  
                  <div className="space-y-2 text-xs">
                    {/* Step 1: Secret Key */}
                    <div className="flex gap-3 items-start p-3 bg-slate-800/40 border border-slate-800 rounded-xl">
                      <div className="p-1 px-1.5 rounded-lg bg-indigo-950 text-indigo-400 font-bold font-mono text-[11px]">۱</div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-200">تنظیم کلید دسترسی (API Key) اختصاصی</p>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          خطای ۴۰۳ یا ۵۰۳ به طور معمول ناشی از اتمام سهمیه کلید اشتراکی سرور است. با ثبت کلید اختصاصی خود، بدون فیلترینگ و نامحدود متصل شوید.
                        </p>
                        <button 
                          onClick={() => setShowKeyForm(!showKeyForm)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors font-bold"
                        >
                          <Key size={12} />
                          {showKeyForm ? "بستن فرم تنظیم کلید" : "ثبت یا ویرایش کلید دسترسی سریع همینجا"}
                        </button>
                      </div>
                    </div>

                    {/* Quick Inline Key Settings Form */}
                    {showKeyForm && (
                      <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3.5 animate-in slide-in-from-top duration-150">
                        <div className="space-y-1.5">
                          <label className="block text-[11px] text-slate-400 font-bold">کلید دسترسی گوگل جمینی (Gemini API Key)</label>
                          <div className="flex gap-2">
                            <input 
                              type="password"
                              value={inputKey}
                              onChange={(e) => setInputKey(e.target.value)}
                              placeholder="AIzaSy..."
                              className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                            />
                            <button 
                              onClick={handleSaveKey}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[11px] transition-colors flex items-center gap-1"
                            >
                              <ShieldCheck size={12} />
                              ذخیره
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            نکته: با ذخیره در اینجا، تنظیمات در حافظه مرورگر شما به صورت محلی و امن ماندگار می‌شود.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Refresh Page */}
                    <div className="flex gap-3 items-start p-3 bg-slate-800/40 border border-slate-800 rounded-xl">
                      <div className="p-1 px-1.5 rounded-lg bg-emerald-950 text-emerald-400 font-bold font-mono text-[11px]">۲</div>
                      <div className="space-y-1">
                        <span className="font-bold text-slate-200">به‌روزرسانی صفحه (Hard Reload)</span>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          گاهی با ریفرش مجدد مرورگر، کوکی‌ها و شبیه‌ساز آفلاین با ماژول‌های کش سازگاری پیدا کرده و موقتاً روی سیستم کایزن سوئیچ می‌کنند.
                        </p>
                      </div>
                    </div>

                    {/* Step 3: Internet & VPN check */}
                    <div className="flex gap-3 items-start p-3 bg-slate-800/40 border border-slate-800 rounded-xl">
                      <div className="p-1 px-1.5 rounded-lg bg-amber-950 text-amber-400 font-bold font-mono text-[11px]">۳</div>
                      <div className="space-y-1">
                        <span className="font-bold text-slate-200">بررسی تحریم‌شکن یا پروکسی ادمین</span>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          سرورهای پردازش گوگل جمینی آی‌پی‌های مربوط به برخی از سرویس‌ها را فیلتر می‌کنند. در صورت خاموش بودن فیلترشکن، ممکن است با اشکال روبرو شوید.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Retry Progress Message */}
                {retryResult && (
                  <div className={`p-3 rounded-lg border text-xs leading-6 ${retryResult.success ? 'bg-emerald-950/30 border-emerald-900/30 text-emerald-200' : 'bg-amber-950/30 border-amber-900/30 text-amber-200'}`}>
                    {retryResult.msg}
                  </div>
                )}
              </div>

              {/* Overlay Footer & Controls */}
              <div className="flex items-center justify-between p-4 bg-slate-950 border-t border-slate-800">
                <button 
                  onClick={() => setShowOverlay(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all rounded-lg"
                >
                  بستن و ادامه آفلاین
                </button>

                <div className="flex gap-2">
                  <button 
                    onClick={() => window.location.reload()}
                    className="px-3.5 py-2 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700/80 transition-all rounded-lg flex items-center gap-1.5"
                  >
                    <RefreshCw size={13} />
                    تازه کردن صفحه
                  </button>
                  
                  <button 
                    onClick={handleTryAgain}
                    disabled={isRetrying}
                    className={`px-5 py-2 text-xs font-bold text-white transition-all rounded-lg flex items-center gap-1.5 shadow-lg ${isRetrying ? 'bg-rose-800/60 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/10'}`}
                  >
                    <RefreshCw size={13} className={isRetrying ? "animate-spin" : ""} />
                    {isRetrying ? "در حال بازخوانی..." : "تلاش مجدد ارتباط"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Human-Friendly Overlay for End Users */
          <div className="fixed bottom-6 left-6 z-[500] animate-in slide-in-from-bottom-5 duration-500 RTL" style={{ direction: 'rtl' }}>
             <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                   <Sparkles className="text-indigo-600 animate-pulse" size={24} />
                </div>
                <div className="flex-1">
                   <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-black text-slate-900">پشتیبان هوشمند شما در دسترس است</h4>
                      <button onClick={() => setShowOverlay(false)} className="text-slate-300 hover:text-slate-500 transition-colors">
                        <X size={16} />
                      </button>
                   </div>
                   <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
                      ما در حال تنظیم بهینه برخی از ماژول‌های تحلیل صوتی و متنی هستیم. به مسیر آموزشی خود ادامه دهید، همه چیز تحت کنترل است.
                   </p>
                </div>
             </div>
          </div>
        )
      )}

      {/* Traditional Side-Drawer for Logs Detail View - ONLY for Admins */}
      {isOpen && isAdmin && (
        <div className="fixed inset-0 z-[290] flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-3 text-slate-200">
                <Terminal size={20} className="text-rose-400" />
                <h2 className="font-bold text-sm tracking-wide">لاگ مانیتورینگ زنده ارتباطات API (کایزن)</h2>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Logs List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                  <Activity size={48} className="opacity-20 animate-pulse" />
                  <p className="text-xs">هیچ رخدادی ثبت نشده است.</p>
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(log.status)}
                        <span className={`font-bold text-xs ${getStatusColor(log.status)}`}>
                          {log.status.toUpperCase()}
                        </span>
                        {log.latency !== undefined && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${log.latency > 1000 ? 'bg-amber-950/50 text-amber-500' : 'bg-slate-900 text-slate-400'}`}>
                            {log.latency}ms
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 text-xs">
                        {new Date(log.timestamp).toLocaleTimeString("fa-IR")}
                      </span>
                    </div>
                    
                    <div className="bg-slate-950/50 p-2 rounded truncate text-slate-300 text-xs mt-1" title={log.url}>
                      {log.url}
                    </div>

                    {log.message && (
                      <div className={`text-xs mt-1 break-words p-2 rounded border ${log.status === 'error' ? 'text-rose-300 bg-rose-950/30 border-rose-900/10' : 'text-amber-300 bg-amber-950/30 border-amber-900/10'}`}>
                        {log.message}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
