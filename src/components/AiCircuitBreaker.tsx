import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { AIProviderKey } from '../types';

export default function AiCircuitBreaker({ role }: { role?: string | null }) {
  const [lastFail, setLastFail] = useState<{ timestamp: number, providerName: string, activeProviderName?: string } | null>(null);
  const isAdmin = role === "admin";

  useEffect(() => {
    let errorCount = 0;
    
    // Add a response interceptor to standard window.fetch
    const originalFetch = window.fetch;
    const fetchWithBreaker = async (...args: Parameters<typeof originalFetch>) => {
      const response = await originalFetch(...args);
      
      const url = args[0] as string;
      if (typeof url === 'string' && (url.includes("/api/") || url.includes("test-ai-connection"))) {
        // If a request fails via status code, track consecutive errors
        // Note: For AI chat streams or typical APIs, the backend may return 503 or an error object.
        let isErrorResponse = false;
        
        if (response.status === 429 || response.status === 500 || response.status === 503) {
          isErrorResponse = true;
        }

        // Also check if backend issued an x-ai-fallback header to indicate it *already* fell back
        if (response.headers.get("x-ai-fallback")) {
            isErrorResponse = true;
        }
        
        if (isErrorResponse) {
          errorCount++;
          if (errorCount >= 2) {
            triggerCircuitBreaker();
            errorCount = 0;
          }
        } else {
          // Reset on success
          if (response.status === 200) {
            errorCount = 0;
          }
        }
      }
      return response;
    };
    
    window.fetch = fetchWithBreaker;
    
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const triggerCircuitBreaker = () => {
    try {
      const saved = localStorage.getItem("arateb_ai_provider_keys");
      if (saved) {
        let keys: AIProviderKey[] = JSON.parse(saved);
        if (keys.length > 1) {
          const failingProvider = keys[0];
          // Move the failing provider to the end.
          const newKeys = [...keys.slice(1), keys[0]];
          
          localStorage.setItem("arateb_ai_provider_keys", JSON.stringify(newKeys));
          // Make sure legacy geminiKey matches the new primary
          const defaultGemini = newKeys.find(p => p.provider === "Google Gemini" || p.provider === "OpenRouter");
          if (defaultGemini) {
            localStorage.setItem("arateb_gemini_api_key", defaultGemini.key);
          }
          
          setLastFail({ 
            timestamp: Date.now(), 
            providerName: failingProvider.provider, 
            activeProviderName: newKeys[0].provider 
          });
          
          // Add Admin System Log
          const logRaw = localStorage.getItem('arateb_sys_logs') || '[]';
          const logs = JSON.parse(logRaw);
          logs.unshift({
            id: Date.now().toString(),
            module: "مدیریت بحران (Circuit Breaker)",
            admin: "سیستم خودکار",
            action: `سوئیچ موفق نود پردازشی. پروایدر خراب '${failingProvider.provider}' موقتاً به استندبای رفت و پروایدر '${newKeys[0].provider}' جایگزین شد.`,
            timestamp: new Date().toISOString(),
          });
          localStorage.setItem('arateb_sys_logs', JSON.stringify(logs.slice(0, 40)));

          // Trigger a storage event so AdminView updates live if open
          window.dispatchEvent(new Event("storage"));
        }
      }
    } catch(e) {
      console.error("Circuit breaker shift failed", e);
    }
  };

  if (!isAdmin || !lastFail) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-bounce cursor-pointer flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl shadow-lg"
         title={`به تازگی سیستم دچار افت کیفیت در ارائه دهنده ${lastFail.providerName} شد و سوییچ خودکار انجام شد.`}
         onClick={() => setLastFail(null)}
         style={{ direction: 'rtl' }}
    >
      <ShieldAlert size={14} className="text-rose-600 animate-pulse" />
      <div className="flex flex-col">
          <span className="text-[10px] font-black text-rose-900">سوییچ خودکار سرویس دهنده هوش مصنوعی</span>
          <span className="text-[9px] font-bold text-rose-600">پروایدر فعال جدید: {lastFail.activeProviderName || "نامشخص"}</span>
          <span className="text-[8.5px] text-rose-500">منتقل شده از {lastFail.providerName} (به دلیل تاخیر یا اتمام سهمیه)</span>
      </div>
    </div>
  );
}
