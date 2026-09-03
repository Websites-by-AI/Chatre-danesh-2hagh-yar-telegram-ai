import React, { useState } from 'react';
import { Terminal, Bot, RefreshCw, Send, ShieldCheck, AlertTriangle, Copy, Check, FileCode, Cpu, ShieldAlert } from 'lucide-react';
import { AIProviderKey } from '../types';

interface SandboxProps {
  providerKeys: AIProviderKey[];
}

export default function AiHealthSandbox({ providerKeys }: SandboxProps) {
  const [prompt, setPrompt] = useState("سلام، لطفا یک جمله انگیزشی کوتاه برای موفقیت در کنکور بنویس.");
  const [selectedKeyId, setSelectedKeyId] = useState<string>("default");
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [response, setResponse] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [modelType, setModelType] = useState<string | null>(null);
  
  // States for absolute raw response tracking
  const [rawOutput, setRawOutput] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!rawOutput) return;
    navigator.clipboard.writeText(rawOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTest = async () => {
    if (!prompt.trim()) return;
    setStatus("loading");
    setResponse(null);
    setErrorMsg(null);
    setRawOutput(null);
    setLatency(null);
    setModelType(null);

    let provider = "";
    let apiKey = "";

    if (selectedKeyId !== "default") {
      const selected = providerKeys.find(k => k.id === selectedKeyId);
      if (selected) {
        provider = selected.provider;
        apiKey = selected.key;
      }
    } else {
      apiKey = localStorage.getItem("arateb_gemini_api_key") || "";
      provider = "Google Gemini";
    }

    const startTime = performance.now();

    try {
      const res = await fetch("/api/sandbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, provider, apiKey })
      });

      const data = await res.json();
      const endTime = performance.now();
      const actualDuration = Math.round(endTime - startTime);

      // Structure a fully detailed RAW payload showing exact response details
      const formattedRaw = JSON.stringify({
        endpoint: "/api/sandbox",
        timestamp: new Date().toISOString(),
        request: {
          provider,
          prompt,
          apiKeyMasked: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.slice(-4)}` : "Not Configured"
        },
        response: {
          status: res.status,
          statusText: res.statusText || (res.status === 200 ? "OK" : res.status === 400 ? "Bad Request" : "Server Error"),
          ok: res.ok,
          headers: {
            "content-type": "application/json",
            "x-response-time-ms": actualDuration
          },
          body: data
        }
      }, null, 2);

      setRawOutput(formattedRaw);

      if (res.ok && data.success) {
        setStatus("success");
        setResponse(data.reply);
        setLatency(data.responseTimeMs || actualDuration);
        setModelType(data.model);
      } else {
        setStatus("error");
        setErrorMsg(data.error || "خطای منطقی در مدل یا کلید رخ داده است.");
      }
    } catch (err: any) {
      const actualDuration = Math.round(performance.now() - startTime);
      const errRaw = JSON.stringify({
        endpoint: "/api/sandbox",
        timestamp: new Date().toISOString(),
        error: true,
        message: err.message || String(err),
        stack: err.stack,
        clientSideLatencyMs: actualDuration
      }, null, 2);

      setRawOutput(errRaw);
      setStatus("error");
      setErrorMsg(err.message || "مشکل در اتصال شبکه ای به سرور رخ داده است.");
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 mt-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-fuchsia-50 text-fuchsia-600 rounded-2xl">
            <Terminal size={24} />
          </div>
          <div className="text-right">
            <h4 className="text-sm font-black text-slate-900 leading-none">محیط ایزوله تست هوش مصنوعی (AI Health Sandbox)</h4>
            <span className="text-[10px] text-slate-400 font-bold">تست مستقیم و آنی پیام‌ها به مدل‌های مختلف با کلیدهای اختصاصی و پاسخ خام سیستم</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span className="text-slate-600 font-mono">Full-Isolation Test Sandbox</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings Column */}
        <div className="flex-1 space-y-4">
          <div className="space-y-1.5 text-right">
            <label className="text-[11px] font-black text-slate-700">کلید مورد استفاده جهت اعتبارسنجی</label>
            <select 
              value={selectedKeyId} 
              onChange={(e) => setSelectedKeyId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[11px] font-black text-slate-700 focus:outline-none focus:border-slate-400 transition"
            >
              <option value="default">🔑 کلید لایو فعلی مرورگر (ذخیره شده در LocalStorage)</option>
              {providerKeys.map(k => (
                <option key={k.id} value={k.id}>
                  {k.label} ({k.provider}) - {k.key.substring(0, 6)}...{k.key.slice(-4)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 text-right">
            <label className="text-[11px] font-black text-slate-700">پارامتر تست پیام (Prompt)</label>
            <textarea 
              value={prompt} 
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="پیام یا آزمون خود را به هوش مصنوعی بنویسید..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs leading-5 resize-none focus:ring-2 focus:ring-fuchsia-500/20 focus:border-fuchsia-500 transition-all font-sans text-right text-slate-800"
            />
          </div>

          <button 
            onClick={handleTest} 
            disabled={status === "loading" || !prompt.trim()}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {status === "loading" ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            <span>اجرا و دریافت پاسخ زنده</span>
          </button>
        </div>

        {/* Console and Output Viewer */}
        <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col relative min-h-[350px] text-slate-100 overflow-hidden">
          {/* Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Bot size={14} className="text-fuchsia-500" /> API OUTPUT VIEWER
            </span>

            {/* Segmented controls to toggle rendered vs raw */}
            <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold">
              <button
                onClick={() => setViewMode("rendered")}
                className={`px-2.5 py-1 rounded-md transition-all ${viewMode === "rendered" ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                رندر متنی
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`px-2.5 py-1 rounded-md transition-all font-sans flex items-center gap-1 ${viewMode === "raw" ? 'bg-slate-800 text-fuchsia-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <FileCode size={11} />
                پاسخ خام (JSON)
              </button>
            </div>
          </div>

          <div className="flex-grow overflow-auto text-xs relative">
            {/* Status indicators */}
            <div className="flex items-center justify-between mb-3 text-[10px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 animate-pulse" />
                <span>وضعیت: {status.toUpperCase()}</span>
              </div>
              {latency && (
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-400">
                  زمان پاسخ: {latency}ms
                </span>
              )}
            </div>

            {status === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-3">
                <Terminal size={32} className="opacity-40" />
                <span className="text-[11px] font-bold">جهت صادر شدن تست و دریافت پاسخ خام، دکمه اجرا را لمس کنید.</span>
              </div>
            )}

            {status === "loading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-fuchsia-400 gap-3">
                <RefreshCw size={24} className="animate-spin text-fuchsia-500" />
                <span className="text-[11px] font-bold animate-pulse">در حال ارسال پرامپت تحلیلی به هسته پردازش ...</span>
              </div>
            )}

            {/* RESPONSE VIEWIER */}
            {status !== "idle" && status !== "loading" && (
              <>
                {viewMode === "rendered" ? (
                  <div className="space-y-3 pb-3 text-right">
                    {modelType && (
                      <div className="inline-flex items-center gap-1.5 bg-fuchsia-950/40 border border-fuchsia-900/40 text-fuchsia-300 text-[9px] font-bold px-2 py-0.5 rounded font-mono">
                        <Cpu size={10} />
                        Model: {modelType}
                      </div>
                    )}

                    {status === "success" ? (
                      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-[12px] leading-relaxed text-slate-200 whitespace-pre-wrap font-sans">
                        {response}
                      </div>
                    ) : (
                      <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-900/20 flex items-start gap-3 text-right">
                        <ShieldAlert size={18} className="text-rose-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-black text-rose-300 text-right">تاییدیه کلید ناموفق بود</p>
                          <p className="text-[11px] leading-relaxed text-slate-400 mt-1">{errorMsg}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 relative pb-3">
                    <button
                      onClick={handleCopy}
                      disabled={!rawOutput}
                      className="absolute top-2 left-2 z-10 p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-800 transition"
                      title="کپی پاسخ خام"
                    >
                      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                    <pre className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-[10px] text-slate-300 font-mono text-left overflow-auto whitespace-pre leading-5 scrollbar-thin">
                      {rawOutput || "پاسخ خامی یافت نشد."}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
