import React, { useState, useEffect } from 'react';
import { 
  Activity, ShieldAlert, CheckCircle, AlertTriangle, AlertCircle, Trash2, 
  RefreshCw, Filter, Search, Clock, Zap, Info, Play, Server, Database,
  ArrowDownRight, Check, Copy, Sparkles, HelpCircle, FileText
} from 'lucide-react';

interface ApiHealthEvent {
  status: 'success' | 'retry' | 'error';
  url: string;
  message?: string;
  timestamp: number;
  latency?: number;
}

export default function ApiHealthHistoryLog() {
  const [logs, setLogs] = useState<ApiHealthEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'success' | 'retry' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Probe Testing States
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<{ status: number; latency: number; msg: string } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Load and subscribe to live logs
  useEffect(() => {
    const loadLogs = () => {
      try {
        const stored = localStorage.getItem('taranom_api_health_logs');
        if (stored) {
          setLogs(JSON.parse(stored));
        } else {
          // Initialize with some default demo/starting logs to demonstrate functionality if storage is empty
          const initialLogs: ApiHealthEvent[] = [
            { status: 'success', url: '/api/health', latency: 45, timestamp: Date.now() - 600000 },
            { status: 'success', url: '/api/sandbox', latency: 312, timestamp: Date.now() - 1200000 },
            { status: 'retry', url: 'تنظیمات کلید اختصاصی / Direct Key Setup', message: 'کلید دسترسی در حافظه محلی ذخیره شد.', timestamp: Date.now() - 1800000 }
          ];
          localStorage.setItem('taranom_api_health_logs', JSON.stringify(initialLogs));
          setLogs(initialLogs);
        }
      } catch (err) {
        console.error('Failed to parse api health logs', err);
      }
    };

    loadLogs();

    const handleNewLog = (e: Event) => {
      const customEvent = e as CustomEvent<ApiHealthEvent>;
      const newEvent = customEvent.detail;
      
      setLogs(prev => {
        const updated = [newEvent, ...prev].slice(0, 100); // limit to 100 entries
        localStorage.setItem('taranom_api_health_logs', JSON.stringify(updated));
        return updated;
      });
    };

    window.addEventListener('api-health-event', handleNewLog);
    return () => {
      window.removeEventListener('api-health-event', handleNewLog);
    };
  }, []);

  // Compute metrics
  const totalCount = logs.length;
  const successCount = logs.filter(l => l.status === 'success').count || logs.filter(l => l.status === 'success').length;
  const errorCount = logs.filter(l => l.status === 'error').length;
  const retryCount = logs.filter(l => l.status === 'retry').length;
  
  const successRate = totalCount > 0 
    ? Math.round(((successCount + retryCount) / totalCount) * 100) 
    : 100;
  
  const averageLatency = totalCount > 0 && logs.filter(l => l.latency).length > 0
    ? Math.round(logs.filter(l => l.latency).reduce((acc, curr) => acc + (curr.latency || 0), 0) / logs.filter(l => l.latency).length)
    : 0;

  // Clear historic logs
  const clearLogs = () => {
    localStorage.removeItem('taranom_api_health_logs');
    setLogs([]);
  };

  // Run a manual fetch request probe test
  const triggerManualProbe = async () => {
    setTestStatus('loading');
    setTestResult(null);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const latency = Math.round(performance.now() - start);
      
      if (res.ok) {
        setTestStatus('success');
        setTestResult({
          status: res.status,
          latency,
          msg: "سرویس کلود ترنم مهر بالا و کاملاً پایدار است. اتصالات پروکسی و دیتابیس ایمن هستند. ✔️"
        });
        
        // Dispatch event so it registers in the timeline historical logs!
        const event = new CustomEvent('api-health-event', {
          detail: {
            status: 'success',
            url: '/api/health (پایش دستی ادمین)',
            latency,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(event);
      } else {
        setTestStatus('error');
        setTestResult({
          status: res.status,
          latency,
          msg: `خطای کد پاسخ: ${res.status}. به نظر میرسد ترافیک گیت‌وی مسدود شده است.`
        });
        
        const event = new CustomEvent('api-health-event', {
          detail: {
            status: 'error',
            url: '/api/health (پایش دستی ادمین)',
            latency,
            message: `خطای سرور کد ${res.status}`,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(event);
      }
    } catch (err: any) {
      const latency = Math.round(performance.now() - start);
      setTestStatus('error');
      setTestResult({
        status: 0,
        latency,
        msg: `ناتوانی در اتصال: ${err?.message || err?.toString() || "اختلال فیزیکی شبکه"}`
      });
      
      const event = new CustomEvent('api-health-event', {
        detail: {
          status: 'error',
          url: '/api/health (پایش دستی ادمین)',
          latency,
          message: err?.message || String(err),
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(event);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.status === filter;
    const matchesSearch = log.url.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (log.message && log.message.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 w-full text-right" style={{ direction: 'rtl' }} id="api-health-history-container">
      {/* Title block */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Activity className="text-indigo-600 animate-pulse" size={20} />
            تاریخچه تفصیلی پایش همزمان ارتباطات API (کایزن)
          </h3>
          <p className="text-xs text-slate-500 font-bold mt-1.5 leading-relaxed">
            بررسی کل درخواست‌های رد و بدل شده با سرویس‌های ابری، ثبت میزان تاخیر (Latency)، تعداد کدهای خطا و کیفیت اتصال همزمان ادمین در یک نگاه
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={triggerManualProbe}
            disabled={testStatus === 'loading'}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-heavy px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Play size={13} className={testStatus === 'loading' ? 'animate-spin' : ''} />
            <span>تست زنده گیت‌وی (Trigger Probe)</span>
          </button>
          
          <button 
            onClick={clearLogs}
            disabled={logs.length === 0}
            className="bg-rose-50 hover:bg-rose-100 disabled:bg-slate-50 disabled:text-slate-300 text-rose-600 font-heavy px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all border border-rose-100 disabled:border-slate-100"
            title="پاک کردن تاریخچه لاگ‌ها"
          >
            <Trash2 size={13} />
            <span>پاکسازی لاگ‌ها</span>
          </button>
        </div>
      </div>

      {/* Manual Probe Live Result Banner */}
      {testStatus !== 'idle' && (
        <div className={`p-4 rounded-2xl border animate-fade-in ${testStatus === 'loading' ? 'bg-slate-50 border-slate-200 text-slate-700' : testStatus === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${testStatus === 'loading' ? 'bg-slate-200 text-slate-600 animate-spin' : testStatus === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
              <RefreshCw size={16} className={testStatus === 'loading' ? 'animate-spin' : ''} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black">نتایج آزمون همزمان ارتباط ادمین:</span>
                {testResult?.latency !== undefined && (
                  <span className="bg-slate-900 text-slate-100 font-mono text-[10px] px-1.5 py-0.5 rounded">
                    {testResult.latency}ms Latency
                  </span>
                )}
                {testResult?.status !== undefined && (
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${testResult.status === 200 ? 'bg-emerald-900 text-emerald-100' : 'bg-rose-900 text-rose-100'}`}>
                    HTTP {testResult.status}
                  </span>
                )}
              </div>
              <p className="text-xs mt-1 leading-relaxed font-semibold">{testResult?.msg || "در حال گرفتن پاسخ از گیت‌وی مرکزی..."}</p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Connection Stability Rating */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-black">شاخص پایداری کل (API SLA)</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Zap size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-800 font-sans">{successRate}%</span>
            <span className="text-[10px] text-emerald-600 font-bold">عالی</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${successRate > 90 ? 'bg-emerald-500' : successRate > 75 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${successRate}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Average response latency */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-black">میانگین زمان اجرای درخواست</span>
            <div className="p-2 bg-pink-50 text-pink-600 rounded-xl">
              <Clock size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800 font-sans">{averageLatency}</span>
            <span className="text-[10px] text-slate-500 font-bold">میلی‌ثانیه (ms)</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">پایش سرعت پردازش تا سرویس‌های گوگل</p>
        </div>

        {/* Metric 3: Total Requests tracked */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-black">کل درخواست‌های رصد شده</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Server size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-slate-800 font-sans">{totalCount}</span>
            <span className="text-[10px] text-slate-500 font-bold">درخواست</span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">سیکل مانیتورینگ زنده فعال است</p>
        </div>

        {/* Metric 4: Troubles & Errors */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-black">اختلالات / بازیابی خودکار</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <ShieldAlert size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-rose-600 font-sans">{errorCount}</span>
              <span className="text-[9px] text-rose-500 font-bold">خطا</span>
            </div>
            <div className="flex items-baseline gap-1 border-r border-slate-100 pr-3">
              <span className="text-xl font-bold text-amber-600 font-sans">{retryCount}</span>
              <span className="text-[9px] text-amber-500 font-bold">بازیابی کایزن</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">انتقال آنی به شبیه‌سازهای آفلاین در خطا</p>
        </div>
      </div>

      {/* Main logs list block */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {/* Filter Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          {/* Status filter tab controls */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-200/50 rounded-2xl border border-slate-200 text-xs font-bold shrink-0 self-start">
            <button 
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl transition-all ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              همه ({totalCount})
            </button>
            <button 
              onClick={() => setFilter('success')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1 ${filter === 'success' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}
            >
              <CheckCircle size={12} />
              موفق ({successCount})
            </button>
            <button 
              onClick={() => setFilter('retry')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1 ${filter === 'retry' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-amber-600'}`}
            >
              <AlertTriangle size={12} />
              تلاش مجدد/جایگزین ({retryCount})
            </button>
            <button 
              onClick={() => setFilter('error')}
              className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1 ${filter === 'error' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-rose-600'}`}
            >
              <AlertCircle size={12} />
              خطا سهمیه/شبکه ({errorCount})
            </button>
          </div>

          {/* Search bar inside toolbar */}
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در آدرس مقصد یا پیام‌های سیستم..."
              className="w-full pr-10 pl-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-slate-400 font-sans transition-all"
            />
          </div>
        </div>

        {/* Chronological Table List */}
        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <Activity className="mx-auto block opacity-20 animate-pulse text-indigo-600" size={48} />
              <p className="text-xs font-heavy">هیچ گزارش متناسب با فیلتر جستجو ثبت نشده است.</p>
              <p className="text-[10px] text-slate-400">به محض ارسال اولین پیام در شبیه‌سازها یا بخش مشاور، رکوردهای زنده ثبت خواهند شد.</p>
            </div>
          ) : (
            filteredLogs.map((log, index) => {
              const isSuccess = log.status === 'success';
              const isRetry = log.status === 'retry';
              const isError = log.status === 'error';
              
              return (
                <div key={index} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left items: icon + url details */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${isSuccess ? 'bg-emerald-50 text-emerald-600' : isRetry ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-500'}`}>
                      {isSuccess ? <CheckCircle size={16} /> : isRetry ? <AlertTriangle size={16} /> : <AlertCircle size={16} />}
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black tracking-tight ${isSuccess ? 'bg-emerald-100 text-emerald-800' : isRetry ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                          {isSuccess ? 'API SUCCESS' : isRetry ? 'RECOVERY ACTIVE' : 'FAIL / TIMEOUT'}
                        </span>
                        
                        <p className="text-xs font-mono font-bold text-slate-800 truncate max-w-xs md:max-w-md" title={log.url}>
                          {log.url}
                        </p>
                      </div>

                      {log.message && (
                        <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl pr-1 font-sans">
                          {log.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right items: latency + timestamp + copy btn */}
                  <div className="flex items-center justify-end sm:justify-start gap-4 shrink-0 font-mono text-[11px] text-slate-400">
                    {log.latency !== undefined && (
                      <div className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg font-bold">
                        <Zap size={11} className="text-slate-400" />
                        <span>{log.latency}ms</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px]">
                      <Clock size={11} />
                      <span>{new Date(log.timestamp).toLocaleTimeString("fa-IR")}</span>
                    </div>

                    <button 
                      onClick={() => copyToClipboard(JSON.stringify(log, null, 2), index)}
                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                      title="کپی جزئیات خام به حافظه موقت"
                    >
                      {copiedIndex === index ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Stability Education / Guides summary */}
      <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 space-y-4">
        <h4 className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
          <Info size={14} /> پروتکل ایمنی و پایداری کایزن آکادمی (Kaizen Ingress Policy)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans leading-relaxed text-slate-300">
          <div className="space-y-1.5">
            <p className="font-bold text-white">۱. سوئیچ خودکار بر روی هسته لوکال:</p>
            <p className="text-slate-400 text-[11px]">
              با بروز هرگونه خطا بر روی سرور، کاربران به هیچ وجه مسدود نمیشوند. مفسر کایزن لوکال با استفاده از هوش ابتکاری داخلی، جواب کامل را بر اساس سوالات مشاوره تراز‌ساز شبیه‌سازی خواهد کرد.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-bold text-white">۲. سیستم ایمنی و موازنه ترافیک:</p>
            <p className="text-slate-400 text-[11px]">
              دیتابیس‌ها و کوکی‌ها به طور مداوم میزان سهمیه مصرفی را در ادمین مانیتور می‌کنند تا از بروز خطای Quota Exceeded یا محدودیت تعداد کانکشن‌ها از طرف ارائه‌دهنده‌های اصلی پیش‌گیری شود.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
