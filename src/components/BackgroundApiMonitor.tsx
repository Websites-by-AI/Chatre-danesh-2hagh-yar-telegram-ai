import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

export default function BackgroundApiMonitor() {
  const [status, setStatus] = useState<"ok" | "error" | "checking">("checking");
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    const endpoints = [
        { url: "/api/health", method: "GET" },
        { url: "/api/ai-status", method: "GET" },
        { url: "/api/motivational", method: "GET" },
        { url: "/api/chat", method: "POST" },
        { url: "/api/goal-insight", method: "POST" },
        { url: "/api/analyze-exam", method: "POST" },
        { url: "/api/psychology-analysis", method: "POST" },
        { url: "/api/payment/request", method: "POST" }
    ];

    const checkEndpoints = async () => {
      setStatus("checking");
      let errors = 0;
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep.url, {
            method: ep.method,
            headers: { "Content-Type": "application/json" },
            body: ep.method === "POST" ? JSON.stringify({ testPing: true }) : undefined
          });
          if (!res.ok) {
            errors++;
          }
        } catch {
          errors++;
        }
      }
      setErrorCount(errors);
      setStatus(errors > 0 ? "error" : "ok");
    };

    // Initial check
    checkEndpoints();

    // Set up polling interval (every 30 seconds)
    const intervalId = setInterval(checkEndpoints, 30000);

    return () => clearInterval(intervalId);
  }, []);

  if (status === "checking" && errorCount === 0) {
    return (
      <div className="flex items-center gap-1.5" title="در حال بررسی اتصال APIها...">
        <Activity size={12} className="text-blue-500 animate-pulse" />
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-200 rounded-full cursor-help hover:bg-rose-100 transition-colors" title={`خطا در اتصال به ${errorCount} سرویس! لطفا لاگ سرویس را بررسی کنید.`}>
        <Activity size={10} className="text-rose-600" />
        <span className="text-[9px] font-black text-rose-600 font-sans">{errorCount} خطا</span>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full cursor-help hover:bg-emerald-100 transition-colors" title="تمام API Endpointها در دسترس می‌باشند">
      <Activity size={10} className="text-emerald-600" />
      <span className="text-[9px] font-black text-emerald-600 font-sans cursor-pointer">آنلاین</span>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
    </div>
  );
}
