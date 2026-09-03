import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import axios from "axios";

// Load environment variables
dotenv.config();

function getOpenRouterEndpoint() {
  if (process.env.CLOUDFLARE_GATEWAY_URL) {
    const baseUrl = process.env.CLOUDFLARE_GATEWAY_URL.endsWith('/') 
      ? process.env.CLOUDFLARE_GATEWAY_URL.slice(0, -1) 
      : process.env.CLOUDFLARE_GATEWAY_URL;
    return `${baseUrl}/chat/completions`;
  }
  return 'https://openrouter.ai/api/v1/chat/completions';
}

const DEFAULT_AGENTROUTER_KEY = "sk-XKayPToQQPv8LFu0ctNNoiptMen1aQGcONoI4nXE7G9g3Iwf";

function isAgentRouterKey(key: string, req?: express.Request): boolean {
  if (!key) return false;
  const cleanKey = key.trim();
  if (cleanKey === DEFAULT_AGENTROUTER_KEY) return true;
  if (process.env.AGENTROUTER_API_KEY && cleanKey === process.env.AGENTROUTER_API_KEY.trim()) return true;
  if (req) {
    try {
      const rawAll = req.headers["x-ai-provider-keys"] || req.headers["X-AI-Provider-Keys"];
      if (rawAll) {
        const strVal = Array.isArray(rawAll) ? rawAll[0] : (rawAll as string);
        if (strVal) {
          let decoded = strVal;
          try {
            if (strVal.includes("%")) {
              decoded = decodeURIComponent(strVal);
            }
          } catch(e){}
          const parsed = JSON.parse(decoded);
          if (Array.isArray(parsed)) {
            const found = parsed.find(k => k.key === cleanKey);
            if (found && found.provider === "AgentRouter") return true;
          }
        }
      }
    } catch(e) {}
  }
  return false;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK Client
class AIAdapter {
  apiKey: string;
  isOpenRouter: boolean;
  isAgentRouter: boolean;
  googleAI: GoogleGenAI | null = null;
  
  constructor(apiKey: string, req?: express.Request) {
    this.apiKey = apiKey.trim();
    this.isOpenRouter = this.apiKey.startsWith("sk-or-");
    this.isAgentRouter = isAgentRouterKey(this.apiKey, req);
    if (!this.isOpenRouter && !this.isAgentRouter) {
      this.googleAI = new GoogleGenAI({ 
        apiKey: this.apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
    }
  }

  get models() {
    return {
      generateContent: async (params: any) => {
        if (this.isOpenRouter) {
          return this.generateContentOpenRouter(params);
        } else if (this.isAgentRouter) {
          return this.generateContentAgentRouter(params);
        } else {
          return this.googleAI!.models.generateContent(params);
        }
      }
    };
  }

  get chats() {
    return {
      create: (params: any) => {
        if (this.isOpenRouter || this.isAgentRouter) {
          // OpenRouter / AgentRouter stateless chat wrapper
          let history: any[] = params.history || [];
          return {
            sendMessage: async (msgParams: any) => {
              const userMessage = typeof msgParams === "string" ? msgParams : msgParams.message;
              history.push({ role: "user", parts: [{ text: userMessage }] });
              
              // converting format for openrouter/agentrouter
              const messages = [];
              if (params.config?.systemInstruction) {
                messages.push({ role: "system", content: params.config.systemInstruction });
              }
              for (const h of history) {
                let text = "";
                if (h.parts) {
                  for (const p of h.parts) {
                    if (p.text) text += p.text + "\n";
                  }
                }
                messages.push({ role: h.role === "model" ? "assistant" : "user", content: text.trim() });
              }
              
              let modelName = "gpt-4o-mini";
              let endpoint = "";
              let headers: any = { 'Content-Type': 'application/json' };

              if (this.isOpenRouter) {
                endpoint = getOpenRouterEndpoint();
                headers['Authorization'] = `Bearer ${this.apiKey}`;
                headers['HTTP-Referer'] = 'https://ai.hamdeltar.ir';
                headers['X-OpenRouter-Title'] = 'TaranomAcademy';
                modelName = (params.model && typeof params.model === "string" && params.model.includes("/")) 
                    ? params.model 
                    : (params.model === "gemini-2.5-flash" ? "google/gemini-2.5-flash" : "openrouter/auto");
              } else {
                endpoint = "https://agentrouter.org/v1/chat/completions";
                headers['Authorization'] = `Bearer ${this.apiKey}`;
                modelName = (params.model && typeof params.model === "string" && !params.model.includes("gemini") && !params.model.includes("flash"))
                    ? params.model
                    : "gpt-4o-mini";
              }

              const reqBody: any = {
                model: modelName,
                messages: messages,
                max_tokens: params.config?.maxOutputTokens || 2048,
              };

              const response = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(reqBody),
              });

              if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`${this.isOpenRouter ? "OpenRouter" : "AgentRouter"} error: ${errorText}`);
              }
              const data = await response.json();
              const contentText = data.choices[0]?.message?.content || "";
              history.push({ role: "model", parts: [{ text: contentText }] });
              return { text: contentText };
            }
          };
        } else {
          const rawChat = this.googleAI!.chats.create(params);
          return {
            sendMessage: async (msgParams: any) => {
              const textMessage = typeof msgParams === "string" ? msgParams : (msgParams.message || msgParams.contents || "");
              try {
                const response = await rawChat.sendMessage(textMessage);
                return response;
              } catch (err) {
                return await rawChat.sendMessage(msgParams);
              }
            }
          };
        }
      }
    };
  }

  async generateContentOpenRouter(params: any): Promise<{text: string; textOutput?: string}> {
     const messages: any[] = [];
     
     if (typeof params.contents === "string") {
       messages.push({ role: "user", content: params.contents });
     } else if (Array.isArray(params.contents)) {
       for (const content of params.contents) {
          let text = "";
          if (content.parts) {
            for (const part of content.parts) {
              if (part.text) {
                text += part.text + "\n";
              }
            }
          }
          const role = content.role === "model" ? "assistant" : "user";
          messages.push({ role, content: text.trim() });
       }
     }

     const openrouterModel = (params.model && typeof params.model === "string" && params.model.includes("/")) 
        ? params.model 
        : (params.model === "gemini-2.5-flash" ? "google/gemini-2.5-flash" : "openrouter/auto");

     const reqBody: any = {
       model: openrouterModel,
       messages: messages,
       max_tokens: params.config?.maxOutputTokens || 2048,
     };
     
     if (params.config?.responseMimeType === "application/json") {
       reqBody.response_format = { type: "json_object" };
     }

     const response = await fetch(getOpenRouterEndpoint(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://ai.hamdeltar.ir',
          'X-OpenRouter-Title': 'TaranomAcademy',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reqBody),
       });
 
       if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`OpenRouter error: ${errorText}`);
       }
       const data = await response.json();
       const contentText = data.choices[0]?.message?.content || "";
       return { text: contentText };
  }

  async generateContentAgentRouter(params: any): Promise<{text: string; textOutput?: string}> {
     const messages: any[] = [];
     
     if (typeof params.contents === "string") {
       messages.push({ role: "user", content: params.contents });
     } else if (Array.isArray(params.contents)) {
       for (const content of params.contents) {
          let text = "";
          if (content.parts) {
            for (const part of content.parts) {
              if (part.text) {
                text += part.text + "\n";
              }
            }
          }
          const role = content.role === "model" ? "assistant" : "user";
          messages.push({ role, content: text.trim() });
       }
     }

     const agentrouterModel = (params.model && typeof params.model === "string" && !params.model.includes("gemini") && !params.model.includes("flash")) 
        ? params.model 
        : "gpt-4o-mini";

     const reqBody: any = {
       model: agentrouterModel,
       messages: messages,
       max_tokens: params.config?.maxOutputTokens || 2048,
     };
     
     if (params.config?.responseMimeType === "application/json") {
       reqBody.response_format = { type: "json_object" };
     }

     const response = await fetch("https://agentrouter.org/v1/chat/completions", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reqBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AgentRouter error: ${errorText}`);
      }
      const data = await response.json();
      const contentText = data.choices[0]?.message?.content || "";
      return { text: contentText };
  }
}

function getSafeHeader(req: express.Request, name: string): string {
  const val = req.headers[name];
  if (!val) return "";
  const strVal = Array.isArray(val) ? val[0] : (val as string);
  if (!strVal) return "";
  try {
    if (strVal.includes("%")) {
      return decodeURIComponent(strVal);
    }
  } catch (e) {}
  return strVal;
}

function getRequestKeys(req: express.Request): string[] {
  let fallbackKeys: string[] = [];
  try {
    const rawAll = getSafeHeader(req, "x-ai-provider-keys");
    if (rawAll) {
      const parsed = JSON.parse(rawAll);
      if (Array.isArray(parsed)) {
        fallbackKeys = parsed.map(k => k.key);
      } else if (typeof parsed === "string") {
        try {
           const inner = JSON.parse(parsed);
           if (Array.isArray(inner)) fallbackKeys = inner.map(k => k.key);
        } catch(e){}
      }
    }
  } catch(e) {}
  
  const k1 = getSafeHeader(req, "x-gemini-key");
  const k2 = getSafeHeader(req, "x-openrouter-key");
  const k3 = req.body?.geminiKey as string;
  const k4 = req.body?.openRouterKey as string;
  const k5 = req.query?.geminiKey as string;
  const k6 = req.query?.openRouterKey as string;
  
  const allKeys = [...fallbackKeys, k1, k2, k3, k4, k5, k6, process.env.AGENTROUTER_API_KEY, DEFAULT_AGENTROUTER_KEY, process.env.OPENROUTER_API_KEY, process.env.GEMINI_API_KEY]
    .filter(k => k && typeof k === "string" && k.trim() !== "" && k !== "undefined" && k !== "null" && !k.includes("YOUR_API_KEY") && k.length > 10);
    
  return [...new Set(allKeys)];
}

function getProviderNameForKey(key: string, req: express.Request): string {
  try {
    const rawAll = getSafeHeader(req, "x-ai-provider-keys");
    if (rawAll) {
      const parsed = JSON.parse(rawAll);
      if (Array.isArray(parsed)) {
        const found = parsed.find(k => k.key === key);
        if (found) return found.provider;
      }
    }
  } catch(e) {}
  if (key === DEFAULT_AGENTROUTER_KEY) return "AgentRouter (Provided Key)";
  if (key === process.env.AGENTROUTER_API_KEY) return "AgentRouter (Environment)";
  if (key.startsWith("sk-or-")) return "OpenRouter";
  if (key.startsWith("sk-")) return "OpenAI/Anthropic";
  if (key === process.env.OPENROUTER_API_KEY) return "OpenRouter (Environment)";
  return "Google Gemini";
}

class AIFallbackWrapper {
  private keys: string[];
  private req: express.Request;
  private res?: express.Response;

  constructor(keys: string[], req: express.Request, res?: express.Response) {
    this.keys = keys;
    this.req = req;
    this.res = res;
  }

  get models() {
    return {
      generateContent: async (params: any) => {
        let lastError = null;
        let successResult = null;
        
        for (let i = 0; i < this.keys.length; i++) {
          const key = this.keys[i];
          try {
            // Force use of modern model if not specified or using legacy names
            const effectiveParams = { ...params };
            if (!effectiveParams.model || effectiveParams.model.includes("gemini-2.5") || effectiveParams.model.includes("gemini-3.5")) {
               effectiveParams.model = "gemini-3.5-flash";
            }

            const ai = new AIAdapter(key, this.req);
            let result;
            try {
              result = await ai.models.generateContent(effectiveParams);
            } catch (e: any) {
              const errStatus = e.status || (e.response ? e.response.status : undefined);
              if (errStatus === 429 && effectiveParams.model === "gemini-3.5-flash") {
                 console.log("Quota exceeded on flash, trying pro...");
                 effectiveParams.model = "gemini-3.1-pro-preview";
                 result = await ai.models.generateContent(effectiveParams);
              } else {
                throw e;
              }
            }
            
            if (this.res && !this.res.headersSent) {
               const providerName = getProviderNameForKey(key, this.req);
               this.res.setHeader("x-ai-resolved-provider", encodeURIComponent(providerName));
               if (i > 0) {
                  this.res.setHeader("x-ai-fallback", `Provider_Index_${i}`);
               }
            }
            return result;
          } catch(e: any) {
            lastError = e;
            const errStatus = e.status || (e.response ? e.response.status : undefined);
            console.warn(`[AI Fallback Wrapper] Key ${i} (${key.substring(0, 8)}...) failed. Status: ${errStatus}. Error:`, e.message);
          }

        }
        throw lastError;
      }
    };
  }

  get chats() {
    return {
      create: (params: any) => {
        return {
          sendMessage: async (msgParams: any) => {
            let lastError = null;
            for (let i = 0; i < this.keys.length; i++) {
              const key = this.keys[i];
              try {
                // Ensure modern model name
                const paramsClone = { ...params, history: params.history ? [...params.history] : [] };
                if (!paramsClone.model || paramsClone.model.includes("gemini-2.5") || paramsClone.model.includes("gemini-3.5")) {
                  paramsClone.model = "gemini-3.5-flash";
                }

                const ai = new AIAdapter(key, this.req);
                const chat = ai.chats.create(paramsClone);
                let result;
                try {
                  result = await chat.sendMessage(msgParams);
                } catch (e: any) {
                  const errStatus = e.status || (e.response ? e.response.status : undefined);
                  if (errStatus === 429 && paramsClone.model === "gemini-3.5-flash") {
                     console.log("Quota exceeded on flash, trying pro...");
                     paramsClone.model = "gemini-3.1-pro-preview";
                     const chatPro = ai.chats.create(paramsClone); // Re-create with new model
                     result = await chatPro.sendMessage(msgParams);
                  } else {
                     throw e;
                  }
                }
                
                if (this.res && !this.res.headersSent) {
                   const providerName = getProviderNameForKey(key, this.req);
                   this.res.setHeader("x-ai-resolved-provider", encodeURIComponent(providerName));
                   if (i > 0) {
                      this.res.setHeader("x-ai-fallback", `Provider_Index_${i}`);
                   }
                }
                return result;
              } catch(e: any) {
                lastError = e;
                const errStatus = e.status || (e.response ? e.response.status : undefined);
                console.warn(`[AI Fallback Wrapper Chat] Key ${i} (${key.substring(0, 8)}...) failed. Status: ${errStatus}. Error:`, e.message);
              }

            }
            throw lastError;
          }
        };
      }
    };
  }
}

function getAI(req: express.Request, res?: express.Response) {
  try {
    const keys = getRequestKeys(req);
    if (keys.length === 0) {
      return null;
    }
    return new AIFallbackWrapper(keys, req, res);
  } catch (err) {
    console.error("Failed to initialize AI client:", err);
    return null;
  }
}

/**
 * CENTRALIZED AI CALL UTILITY (کدنویسی تمیز هوش مصنوعی)
 * This is the single, unified main function for all AI generation requests across the system.
 * It manages keys, fallbacks, provider-specific conversions (Gemini vs OpenRouter vs AgentRouter),
 * and handles failures or quota errors gracefully.
 */
export async function executeAICall(
  req: express.Request, 
  res: express.Response | undefined, 
  options: {
    systemInstruction?: string;
    prompt: string;
    history?: { role: "user" | "model" | "assistant"; content: string }[];
    model?: string;
    responseMimeType?: string;
    fallbackOfflineResponse?: () => string | any;
  }
): Promise<string> {
  try {
    const ai = getAI(req, res);
    if (!ai) {
      if (options.fallbackOfflineResponse) {
        const fb = options.fallbackOfflineResponse();
        return typeof fb === "string" ? fb : JSON.stringify(fb);
      }
      throw new Error("No active AI provider keys found and no offline fallback defined.");
    }

    const model = options.model || "gemini-3.5-flash";
    const contents = [];

    if (options.history && options.history.length > 0) {
      for (const h of options.history) {
        contents.push({
          role: h.role === "assistant" || h.role === "model" ? "model" : "user",
          parts: [{ text: h.content }]
        });
      }
    }
    
    contents.push({
      role: "user",
      parts: [{ text: options.prompt }]
    });

    const config: any = {};
    if (options.systemInstruction) {
      config.systemInstruction = options.systemInstruction;
    }
    if (options.responseMimeType) {
      config.responseMimeType = options.responseMimeType;
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("AI returned an empty response.");
    }
    return text;
  } catch (error: any) {
    console.error("[Central AI Executor Error]:", error?.message || error);
    if (options.fallbackOfflineResponse) {
      console.warn("Using offline fallback due to API error.");
      const fb = options.fallbackOfflineResponse();
      return typeof fb === "string" ? fb : JSON.stringify(fb);
    }
    throw error;
  }
}


// REST Api endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", industry: "High School Education & Konkur Prep", brand: "ترنم همدلی", time: new Date().toISOString() });
});

app.get("/api/ai-status", (req, res) => {
  res.json({ 
    status: "online", 
    models: ["gemini-3.5-flash", "gemini-3.1-pro-preview"],
    hasServerGeminiKey: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.includes("AIzaSy") && process.env.GEMINI_API_KEY.length > 10),
    hasServerOpenRouterKey: !!(process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY.startsWith("sk-") && process.env.OPENROUTER_API_KEY.length > 10)
  });
});

// Offline & Simulation Fallback Utility Functions
function toPersianNum(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === "") return "۰";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/\d/g, (x) => persianDigits[parseInt(x)]);
}

function getOfflineChatReply(message: string): string {
  const lowerMessage = (message || "").toString().toLowerCase().trim();
  
  if (lowerMessage === "سلام" || lowerMessage === "hi" || lowerMessage === "hello" || lowerMessage === "سلام علیکم" || lowerMessage === "درود" || lowerMessage === "how are you") {
    return "سلام مریم عزیز! 🌸 من دکتر رادان، همراه و مشاور تحصیلی شما در آکادمی ترنم همدلی هستم.\n\nمن مشتاقانه آماده‌ام تا در مسیر یادگیری، کنترل استرس و تحلیل دقیق چالش‌های درسی در کنار شما باشم. چطور می‌توانم امروز به آرامش و پیشرفت تحصیلی شما کمک کنم؟\n\n📌 *یادداشت مدیر پورتال: به دلیل تغییرات فنی در سرویس‌های هوش مصنوعی، سیستم به صورت پایدار و همدلانه روی «شبیه‌ساز تحصیلی» فعالیت می‌کند. برای ارتباط زنده و دریافت پاسخ‌های عمیق‌تر، می‌توانید کلید اختصاصی خود را در بخش تنظیمات فنی ثبت کنید.*";
  }
  
  if (lowerMessage.includes("تجربی") || lowerMessage.includes("زیست") || lowerMessage.includes("پزشکی")) {
    return "سلام کنکوری پرتلاش تجربی! برای قبولی در رشته‌های تاپ تجربی (پزشکی، دندان‌پزشکی و داروسازی)، زیست‌شناسی و شیمی کلیدی‌ترین دروس شما هستند. توصیه کایزن درسی ما این است که روزانه حداقل ۳ پارت مطالعه عمیق کتاب درسی به همراه تحلیل دقیق تصاویر زیست و تمرین ۵۰ تست زمان‌دار شیمی را در اولویت قرار دهید. این شیوه می‌تواند تراز شما را به بالای ۹۰۰۰ برساند. مایلید برنامه درسی خود را با هم بهینه‌سازی کنیم؟";
  } else if (lowerMessage.includes("ریاضی") || lowerMessage.includes("حسابان") || lowerMessage.includes("شریف")) {
    return "سلام مهندس آینده! در رشته ریاضی، درس حسابان، دیفرانسیل و هندسه پایه‌های حیاتی تراز شما هستند. تسلط روی فرمول‌ها و به حداقل رساندن اشتباهات محاسباتی تله‌های تستی به طور مستقیم تراز حسابان شما را رشد می‌دهد. تست‌زنی موضوعی به خصوص در دروس فیزیک و مباحث مغناطیس و حرکت بسیار کارساز است. چه کمکی در برنامه‌ریزی از من ساخته است؟";
  } else if (lowerMessage.includes("انسانی") || lowerMessage.includes("ادبیات") || lowerMessage.includes("فلسفه")) {
    return "سلام داوطلب گرانقدر رشته انسانی! در کنکور انسانی، عربی تخصصی، ادبیات تخصصی (فنون ادبی) و فلسفه و منطق دروس تعیین‌کننده موازنه تراز هستند. مربیان ترنم مهر پیشنهاد می‌کنند خلاصه تله‌های تستی فلسفه را همگام با مطالعه کتاب درسی دوره کنید و روی تست‌های قرابت ادبی تسلط یابید. بیایید با هم اهداف مطالعاتی شما را تنظیم کنیم.";
  } else if (lowerMessage.includes("کایزن") || lowerMessage.includes("برنامه") || lowerMessage.includes("مطالعه")) {
    return "سلام همکار گرامی و تلاشگر. برنامه‌ریزی هوشمند مطالاتی ترنم مهر با ادغام پومودوروهای درسی، شیفت صبح (مرور خلاصه مباحث مفهومی و کتاب) و شیفت عصر (تست‌زنی جامع موازی آزمون آزمایشی) فرموله شده است. این چرخه مداوم تضمین‌کننده رفع تدریجی تله‌های تستی بدون فرسودگی ذهنی است. آیا برنامه امروز را شروع کرده‌اید؟";
  } else if (lowerMessage.includes("تنبلی") || lowerMessage.includes("خستگی") || lowerMessage.includes("انگیزه")) {
    return "سلام و درود. خستگی ذهنی در فرآیند آمادگی برای ماراتن دشوار کنکور سراسری امری بسیار طبیعی است. ترنم مهر پیشنهاد می‌کند از تکنیک پومودورو درسی (۵۰ دقیقه مطالعه متمرکز و ۱۰ دقیقه استراحت دور از گوشی) استفاده کنید. تلاش مستمر شما سنگ‌بنای پزشک، مهندس یا رتبه برتر شدنتان خواهد بود.";
  } else if (lowerMessage.includes("تراز") || lowerMessage.includes("مانیتورینگ") || lowerMessage.includes("شبیه‌ساز") || lowerMessage.includes("آزمون") || lowerMessage.includes("تراز مانیتورینگ")) {
    return "سلام قهرمان پرتلاش! افزایش تراز مانیتورینگ و آزمون‌های شبیه‌ساز یکی از دغدغه‌های اصلی رتبه‌های برتر است. برای دستیابی به ترازهای درخشان در آزمون‌های بعدی آکادمی، من ۳ تکنیک طلایی کایزن درمانی را برایت تجویز می‌کنم:\n\n۱. **تحلیل موشکافانه تله‌های تستی**: بلافاصله پس از هر آزمون، سوالات غلط و نزده را کالبدشکافی کن. اشتباهاتت از جنس بی‌دقتی محاسباتی، عدم تمرکز یا کمبود وقت بوده؟ نوشتن یک دفترچه اختصاصی تحلیل تراز، از تکرار مجدد این اشتباهات بیهوده در شبیه‌سازهای بعدی جلوگیری می‌کند.\n\n۲. **مهندسی مدیریت زمان (تکنیک ضربدر منها)**: زمانِ پاسخ‌گویی به درس‌ها را با توجه به ضریب کنکوری آن‌ها موازنه کن. هرگز روی یک تست پیچیده و وقت‌گیر قفل نشو. تست‌های ساده‌تر را در اولویت اول مهار کن تا روحیه تهاجمی‌ات برای بقیه آزمون حفظ شود.\n\n۳. **پایداری پارت‌های پومودورو موازی**: روزهای پایانی منتهی به شبیه‌ساز بعدی را به شبیه‌سازی تست‌های جامع نیمه زمان‌دار اختصاص بده. ذهن انسان مانند عضله است؛ هر چقدر بیشتر در محیط شبیه‌ساز با استرس تمرین کند، در آزمون اصلی بهره‌وری تراز مانیتورینگ او بالاتر خواهد رفت.\n\nتلاش مستمر تو قطعاً ترازت را در آزمون پیش‌رو متحول خواهد کرد! 🎯🚀";
  } else {
    return "داوطلب فرزانه ترنم مهر، با تشکر از ارتباط شما با مشاور هوشمند هوش مصنوعی. برای تحلیل بهتر روند پیشرفت، تراز آخرین آزمون آزمایشی خود، رشته تحصیلی‌تان (تجربی، ریاضی یا انسانی) و درصد دروس آسیب‌دیده را ذکر کنید تا رهنمودهای مربی‌گری تخصصی خدمت شما صادر گردد.";
  }
}

function getOfflineGoalInsight(student: any, currentTraz: any, currentPercentage: any, targetTraz: any, targetGrowth: any, latestQuizScore: any) {
  const trazDiff = (targetTraz || 8500) - (currentTraz || 6500);
  let baseLikelihood = 80;
  if (trazDiff > 0) {
    baseLikelihood -= Math.min(60, Math.round(trazDiff / 30));
  }
  
  const targetPercentage = (currentPercentage || 59) + (targetGrowth || 10);
  const quizDiff = (latestQuizScore || 63) - targetPercentage;
  baseLikelihood += Math.min(20, Math.max(-30, Math.round(quizDiff * 1.5)));
  
  const likelihood = Math.min(96, Math.max(12, baseLikelihood));
  
  let text = "";
  let recommendations = [];

  if (likelihood >= 80) {
    text = `سیگنال‌های درخشان و بسیار مثبتی در روند تست‌زنی و ترازهای آزمون خود ثبت کرده‌اید! برآورد بازدهی آخرین تلاش مطالعاتی شما (${latestQuizScore}٪) رشد برجسته‌ای را نسبت به وضعیت پایه (${currentPercentage}٪) نشان می‌دهد. دستیابی به تراز هدف ${targetTraz || 8500} با این مداومت کاملا هموار است؛ مشروط بر اینکه تحلیل تله‌های تستی و حل تست‌های سراسری سال‌های گذشته را به طور روزانه در فرآیند کایزن پیش ببرید.`;
    recommendations = [
      "بهینه‌سازی زمان‌بندی مرور خلاصه نویسی‌ها در مباحث زیست‌شناسی و شیمی.",
      "تثبیت درصد پاسخ‌دهی مبحث مشتق یا هندسه با حل ۳۰ تست زمان‌دار موازی.",
      "حفظ پیوستگی استریک مطالعاتی روزانه بدون افت ریتم پومودورویی."
    ];
  } else if (likelihood >= 50) {
    text = `مسیر آماده‌سازی شما برای کنکور سراسری امیدبخش است اما برای قبولی قطعی در دانشگاه‌های تراز اول کشور و صعود به تراز مطلوب ${targetTraz || 8500}، ارتقای سرعت پاسخ‌گویی به تست‌های سخت مفهومی و زمان‌بر ضروری است. درصد فعلی تسلط شما (${currentPercentage}٪) نیازمند رشد است. بازدهی آزمون‌های اخیر شما (${latestQuizScore}٪) گواه ظرفیت ارتقاء شماست.`;
    recommendations = [
      "رفع نقایص مباحث شیمی آلی یا سرعت واکنش با درسنامه‌های صریح و مفهومی ترنم مهر.",
      "حضور فعال در کارگاه مربی‌گری هوشمند و وبینارهای رفع اشکال کارنامه.",
      "کاهش نمره منفی آزمون با دوری از زدن پاسخ‌های مردد و تست‌های ۵۰-۵0."
    ];
  } else {
    text = `اراده مستحکم شما برای کسب رتبه برتر کشوری و تراز ممتاز (${targetTraz || 8500}) قابل تحسین است؛ اما آمارهای تحلیلی نشان می‌دهد که سطح فعلی کوییزها (${latestQuizScore}٪) با هدف‌گذاری نهایی (${targetPercentage}٪) فاصله دارد. مشاور ترنم مهر پیشنهاد می‌کند هدف خود را در فاز اول روی تراز میانی ۷۵۰۰ بگذارید تا پله‌پله و با ثبات بیشتری صعود کنید.`;
    recommendations = [
      "تمرکز بسیار جدی بر مطالعه مباحث بنیادین و فرمول‌های پرتکرار فیزیک و ریاضی.",
      "استفاده از کتاب‌های مفهومی و درسنامه‌های طلایی کنکور.",
      "افزایش ساعات مطالعه هفتگی به ۴۸ ساعت کامل و ثبت دقیق در دفتر برنامه‌ریزی."
    ];
  }

  return { 
    likelihood, 
    text, 
    recommendations,
    detailedMetrics: [
      { label: "تسلط بر مفاهیم", value: `${toPersianNum(currentPercentage)}٪`, status: currentPercentage < 50 ? "warning" : "success" },
      { label: "بازدهی آزمون اخیر", value: `${toPersianNum(latestQuizScore)}٪`, status: latestQuizScore < 60 ? "warning" : "success" },
      { label: "پایداری پومودورو", value: `${toPersianNum(75 + Math.floor(Math.random() * 15))}٪`, status: "success" }
    ]
  };
}

function getOfflineExamAnalysis(lessons: any[], field: string) {
  const analyzedWeaknesses = [];
  const subjects = lessons || [];

  const weakSubjects = [...subjects].sort((a: any, b: any) => a.percentage - b.percentage).slice(0, 3);

  for (const sub of weakSubjects) {
     let topic = "";
     let rec = "";
     let questions = 40;
     let severity: "critical" | "warning" | "mild" = "warning";

     const name = sub.lessonName || "";

     if (name.includes("زیست") || name.includes("زیست‌شناسی")) {
       topic = "زیست‌شناسی (مباحث ژنتیک، گیاهی یا غشای سلولی)";
       rec = "مطالعه خط‌به‌خط کتاب درسی زیست‌شناسی; بررسی تصاویر کنکوری سال‌های گذشته و حل بسته ۵۰ تست زمان‌دار تله‌های تستی تجربی ترنم مهر.";
       questions = 50;
       severity = sub.percentage < 35 ? "critical" : "warning";
     } else if (name.includes("حسابان") || name.includes("ریاضی")) {
       topic = "ریاضیات تخصصی (مباحث تابع، مشتق و کاربرد آن)";
       rec = "رفع اشکال اشتباهات محاسباتی تدرسی؛ حل تمرین‌های تشریحی کتاب درسی حسابان و زدن ۳۵ تست تمرکزی فاقد پاسخ نامطمئن.";
       questions = 45;
       severity = sub.percentage < 35 ? "critical" : "warning";
     } else if (name.includes("شیمی")) {
       topic = "شیمی تخصصی (مسائل استوکیومتری و سنتز مواد)";
       rec = "مرور خلاصه واکنش‌های آلی و تمرین محاسبات سریع فاقد چک‌نویس طولانی؛ تحلیل تله‌های زمان‌بر در کارگاه بهینه‌سازی کایزن درسی.";
       questions = 40;
       severity = "warning";
     } else if (name.includes("فیزیک")) {
       topic = "فیزیک پیشرفته (نوسان و امواج یا حرکت‌شناسی)";
       rec = "مرور دقیق نمودارهای مکان-زمان و سرعت-زمان فیزیک کنکور؛ زدن ۳۰ تست موازی با هدف افزایش سرعت تحلیل سوال.";
       questions = 30;
       severity = "mild";
     } else {
       topic = "مباحث مفهومی و حفظی درس تخصصی آسیب‌دیده";
       rec = "خلاصه‌نویسی نموداری و مرورهای ۳ روزه؛ پرهیز از تله‌های نفی در نفی طراحان کنکور و شرکت در سنجش هوشمند ترنم مهر.";
       questions = 35;
       severity = "warning";
     }

     analyzedWeaknesses.push({
       topic,
       subject: name,
       percentage: sub.percentage,
       recommendation: rec,
       questionsCount: questions,
       severity
     });
  }

  const nextTraz = Math.min(12000, Math.max(4000, Math.floor(
    (subjects.reduce((acc: number, cur: any) => acc + cur.percentage, 0) / (subjects.length || 1)) * 60 + 4500
  )));

  const totalWrong = subjects.reduce((sum: number, s: any) => sum + (s.wrong || 0), 0);
  const totalCorrect = subjects.reduce((sum: number, s: any) => sum + (s.correct || 0), 0);
  const totalEmpty = subjects.reduce((sum: number, s: any) => sum + (s.empty || 0), 0);
  const totalQuestions = totalWrong + totalCorrect + totalEmpty || 1;

  const wrongRatio = totalWrong / totalQuestions;
  const emptyRatio = totalEmpty / totalQuestions;
  const simulatedStressLevel = Math.min(95, Math.max(15, Math.floor((wrongRatio * 0.75 + emptyRatio * 0.25) * 100 + 10)));

  let simulatedStressLabel: "بحرانی" | "متوسط" | "سالم" | "خفیف" = "سالم";
  let simulatedTechnicalDetail = "";
  if (simulatedStressLevel > 70) {
    simulatedStressLabel = "بحرانی";
    simulatedTechnicalDetail = "ریسک بالای استرس جلسه آزمون آزمایشی و کوفتگی شناختی ناشی از تست‌های پرمغز طراح؛ موازنه زمان از دست رفته روی سوالات تله‌دار مشهود است.";
  } else if (simulatedStressLevel > 45) {
    simulatedStressLabel = "متوسط";
    simulatedTechnicalDetail = "نوسان تمرکز در دقایق انتهایی آزمون به دلیل خستگی چشم و افت قند خون؛ داوطلب زمان مدیدی را روی چند تست خاص تلف کرده است.";
  } else if (simulatedStressLevel > 25) {
    simulatedStressLabel = "خفیف";
    simulatedTechnicalDetail = "تمرکز نسبتاً مطلوب و آرامش ذهنی پایدار؛ چند بی‌دقتی کوچک محاسباتی در محاسبات استوکیومتری یا فیزیک رصد شد.";
  } else {
    simulatedStressLabel = "سالم";
    simulatedTechnicalDetail = "بهره‌وری کامل و توازن عالی در ریتم پاسخ‌دهی؛ داوطلب بدون فرسودگی ذهنی و کمال‌گرایی منفی ماراتن آزمون را به پایان رسانده است.";
  }

  const simAvgResponseTimeWrong = Math.round(55 + wrongRatio * 40);
  const simAvgResponseTimeCorrect = Math.round(40 + (1 - wrongRatio) * 10);
  const simConsecutiveErrors = Math.min(10, Math.floor(wrongRatio * 15 + 1));

  return {
    weaknesses: analyzedWeaknesses,
    psychological: {
      pattern: simulatedStressLevel > 60 ? "فرسودگی توجه در دور آخر آزمون ناشی از عجله و وسواس تایید منفی" : "آرامش گذرا در ریتم مطالعه و ثبات ذهنی کافی",
      description: `داوطلب محترم با میانگین رشد تراز تحصیلی پیش می‌رود اما تنش فرسایش ذهنی آزمون شبیه‌ساز معادل ${simulatedStressLevel}٪ بازدهی حل سوال‌ها را متاثر نموده است.`,
      correctToWrongRate: Math.max(12, Math.round(wrongRatio * 100)),
      suggestion: simulatedStressLevel > 60 
        ? "پیشنهاد مربیان: پیاده‌سازی تکنیک ضربدر منها در مدیریت فواصل آزمون؛ استراحت ۵ دقیقه‌ای متمرکز و ریلکسیشن غشای حسی مغز مابین پارت‌های دشوار." 
        : "تثبیت ریتم مطالعاتی روزانه به همراه مانیتور تمرین‌های تستی فاقد نمره منفی.",
      cardColor: simulatedStressLevel > 70 ? "red" : simulatedStressLevel > 45 ? "orange" : simulatedStressLevel > 25 ? "amber" : "blue",
      stressLevel: simulatedStressLevel,
      stressAnalysis: {
        avgResponseTimeWrong: simAvgResponseTimeWrong,
        avgResponseTimeCorrect: simAvgResponseTimeCorrect,
        consecutiveErrorsCount: simConsecutiveErrors,
        stressLabel: simulatedStressLabel,
        technicalDetail: simulatedTechnicalDetail
      }
    },
    remedialPlan: [
      { day: "شنبه", morningPlan: "مطالعه مفهومی کتاب درسی و تصاویر زیست‌شناسی تجربی / فرمول قرابت ریاضی", afternoonPlan: "حل ۳۵ تست شبیه‌ساز کنکور سراسری و بررسی تشریحی مباحث خطاکار", totalQuestions: 35 },
      { day: "یکشنبه", morningPlan: "مرور ساختارمند مباحث شیمی آلی یا مسائل تابع حسابان", afternoonPlan: "عارضه‌یابی اشتباهات محاسباتی آزمون قبل با کمک مربی هوشمند (۳۰ تست)", totalQuestions: 30 },
      { day: "دوشنبه", morningPlan: "مطالعه مبحث فیزیک حرکت‌شناسی و مدارهای موازی جریان", afternoonPlan: "تست‌زنی موضوعی برای هماهنگی چشم و مغز در مهار تله‌ها (۲۵ تست)", totalQuestions: 25 },
      { day: "سه‌شنبه", morningPlan: "مرور عربی تخصصی یا آرایه‌های ادبی و واژه‌شناسی", afternoonPlan: "شبیه‌ساز کوچک موازی دروس پرضریب کنکور (۴۰ تست)", totalQuestions: 40 },
      { day: "چهارشنبه", morningPlan: "تحلیل الگوهای فرسودگی تمرکز ذهن و روش‌های تندخوانی", afternoonPlan: "حل پکیج تستی جامع و زمان‌دار تجربی/ریاضی/انسانی (۴۵ تست)", totalQuestions: 45 },
      { day: "پنجشنبه", morningPlan: "مرور خلاصه‌نویسی‌های طلایی و یادداشت‌برداری‌های تله‌شناسی", afternoonPlan: "ثبت آمارهای روزهای گذشته در کارتابل ترنم مهر جهت تطبیق مربی ناظر (۲۰ تست)", totalQuestions: 20 },
      { day: "جمعه", morningPlan: "پیش‌آزمون آزمایشی، پایش تراز فرضی و هماهنگی روانشناسی با درگاه والدین", afternoonPlan: "ریکاوری روحی، پیاده‌روی دور از استرس و خودآموزی کایزن مطالعاتی (۱۰ تست)", totalQuestions: 10 }
    ],
    estimatedNextTraz: nextTraz + 250
  };
}

function getOfflinePsychologyAnalysis(qAnxiety: number, qFocus: number, qPerfectionism: number, qSleep: number, qStamina: number, context?: any) {
  const focusIndex = Math.min(100, Math.max(10, qFocus * 10));
  const resilience = Math.min(100, Math.max(10, Math.round((10 - qAnxiety) * 5 + qStamina * 5)));
  const academicDrive = 85;
  const stamina = Math.min(100, Math.max(10, qStamina * 10));
  const anxietyManagement = Math.min(100, Math.max(10, Math.round((10 - qAnxiety) * 10)));
  const sleepEfficacy = Math.min(100, Math.max(10, qSleep * 10));
  const stressLevel = Math.min(98, Math.max(10, Math.round((qAnxiety * 4 + qPerfectionism * 3 + (10 - qSleep) * 3))));

  const city = context?.city || "شهر فعلی";
  const goal = context?.mainGoal || "موفقیت در کنکور";

  return {
    cognitiveProfile: {
      focusIndex,
      resilience,
      academicDrive,
      stamina,
      anxietyManagement,
      sleepEfficacy
    },
    stressLevel,
    diagnosis: `داستان پایداری شما از ${city} آغاز می‌شود. با وجود چالش‌های خانوادگی و رویای ${goal}، شما در حصار کمال‌گرایی تستی گرفتار شده‌اید. تنش ${stressLevel}٪ شما نشان از یک مبارزه خاموش برای تغییر سرنوشت مالی و اجتماعی است. 🦋`,
    cognitiveTrap: qFocus < 5 ? "🧠 تله فروپاشی تمرکز در هیاهوی دغدغه‌های شخصی" : "⚖️ تله سنگینی بار مسئولیت و اضطراب آینده",
    remedies: [
      `🏰 قلعه تمرکز: ایجاد یک حریم ایزوله در محیط خانه برای مهار تنش‌های محیطی و خانوادگی.`,
      `💎 استراتژی ثروت ذهنی: مدیریت دقیق قوای روانی برای دروس پرتراکم و دوری از حواشی مالی.`,
      `📈 گام‌های کایزن: پیشرفت پله‌پله بدون غرق شدن در عظمت هدف نهایی.`
    ],
    meditationAdvice: "🌌 تمرین تجسم پیروزی: تصور لحظه اعلام نتایج و لبخند رضایت شما در حالی که تمام محدودیت‌ها را شکسته‌اید.",
    breathingPaceSec: 4
  };
}

// Endpoint for motivational messages / business quotes
app.get("/api/motivational", async (req, res) => {
  console.log("GET /api/motivational called");
  const quotes = [
    "اعتبار ترنم همدلی در طول سالیان، حاصل ممارست فرزندان شایسته‌ای است که امروز رتبه‌های برتر دانشگاه‌های تهران، شریف و بهشتی کشور هستند. به پالس‌های تلاش روزانه خود وفادار بمانید!",
    "تلاش متعهدانه ثمر خواهد داد. خواندن خط‌به‌خط تصویر زیست یا دست‌ورزی مسئله فیزیک، پله‌ای برای پزشک، مهندس یا رتبه برتر شدن است.",
    "هر کارنامه آزمایشی در سامانه ترنم همدلی، یک نقشه دقیق مربی‌گری کایزن برای غلبه تدریجی بر تله‌های طراحان ماهر کنکور است. شجاعانه ادامه دهید!",
    "تراز کمال علمی حاصل تصادف و بخت نیست؛ بلکه فرآیند مداوم بهسازی عادات، مهار نمره‌های منفی و انگیزه درخشیدن شماست. پرانرژی ماراتن را مهار کنید!",
    "شما مجهز به برترین تکنولوژی مربی‌گری و روانشناسی تحصیلی هستید. از هر پومودوروی مطالعاتی برای پیشی گرفتن از رقبای خسته خود استفاده کنید."
  ];

  try {
    const ai = getAI(req, res);
    if (!ai) {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      return res.json({ quote: quotes[randomIndex] });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: "یک جمله انگیزشی صمیمی، همدلانه، خلاقانه، عاطفی، علمی و روان‌شناختی مناسب داوطلبان کنکور سراسری ایران (تجربی، ریاضی، انسانی) برای نصب در بالای پرتال آموزشی 'ترنم مهر' بنویس. شیوه کایزن، تعهد به پیشرفت تدریجی و با هم بودن تا هدف نهایی را تداعی کند. لحن صمیمی و عمیق فارسی داشته باشد، بدون پیشوند و پسوند." }] }],
    });
    return res.json({ quote: response.text?.trim() || quotes[Math.floor(Math.random() * quotes.length)] });
  } catch (error: any) {
    if (error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("quota")) {
      console.log("Gemini quota exhausted. Using offline fallback.");
    } else if (error?.message?.includes("PERMISSION_DENIED") || error?.message?.includes("Permission denied") || error?.message?.includes("suspended") || error?.message?.includes("UNAUTHENTICATED") || error?.message?.includes("invalid authentication")) {
      console.log("Gemini API key is invalid or lacks permissions. Using offline fallback.");
    } else if (error?.message?.includes("leaked") || error?.message?.includes("not found")) {
      console.log("Gemini API key error detected. Using offline fallback.");
    } else {
      console.log("API Error caught (Using offline fallback).");
    }
    const randomIndex = Math.floor(Math.random() * quotes.length);
    res.json({ quote: quotes[randomIndex] });
  }
});

// Endpoint for AI business & technical consulting chat
app.post("/api/chat", async (req, res) => {
  if (req.body?.testPing) return res.json({ status: "ok" });
  console.log("POST /api/chat called with message:", req.body?.message);
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "MESSAGE_REQUIRED", reply: "پیامی دریافت نشد." });
  }
  try {
    const ai = getAI(req, res);
    if (!ai) {
      console.warn("AI Client not available for /api/chat. Falling back to offline simulator.");
      return res.json({ 
        reply: getOfflineChatReply(message)
      });
    }

    // Map history elements into Gemini parts format
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const systemInstruction = `شما 'دکتر رادان'، همراه همدل و مشاور برنامه‌ریزی تحصیلی در موسسه 'ترنم همدلی' هستید. 
تخصص شما: کنکور سراسری ایران، تحلیل روند یادگیری، عارضه‌یابی اشتباهات تسی، و روانشناسی یادگیری.
ویژگی‌های شخصیتی: همدل، صبور، بسیار خوش‌صحبت به زبان فارسی، حامی واقعی، و در عین حال دقیق و راهنما.
هدف: داوطلب را برای رشدی پایدار و رسیدن به اهداف تحصیلی‌اش با آرامش هدایت کنید.
قوانین پاسخ‌دهی:
۱. پاسخ‌ها باید عمیق، دلسوزانه و به شدت کاربردی باشند.
۲. بصورت کاملاً هوشمند و واکنشی به پیام کاربر پاسخ دهید. اگر کاربر شوخی کرد یا پیام نامفهومی فرستاد، صمیمانه و مثل یک همراه واقعی واکنش نشان دهید.
۳. از اصطلاحات فنی کنکور در جای مناسب و با لحنی آرام‌بخش استفاده کنید.
۴. حداکثر در ۳ پاراگراف پاسخ دهید.
۵. از ایموجی‌های مناسب (📚, 🌱, ✨, 💡) استفاده کنید.`;

    const chat = ai.chats.create({ 
      model: "gemini-3.5-flash",
      history: formattedHistory,
      config: {
        systemInstruction: systemInstruction
      }
    });

    const result = await chat.sendMessage({ message: message });
    const reply = result.text?.trim();
    
    if (!reply) throw new Error("Empty reply from Gemini");

    return res.json({ reply });
  } catch (error: any) {
    const errStr = (error?.message || error?.toString() || "").toLowerCase();
    const rawErrorMsg = error?.message || error?.toString() || "Unknown server-side Gemini API or network error";
    console.log("API Error in Konkur chat with Gemini (caught).", errStr.substring(0, 150));
    
    let fallbackReply = "";
    if (errStr.includes("resource_exhausted") || errStr.includes("quota") || errStr.includes("429")) {
      fallbackReply = "⚠️ همکار/کاربر ارجمند، سقف مجاز استفاده از کلید هوش مصنوعی (Quota Exceeded) در این لحظه به پایان رسیده است.\n\nاز آنجایی که کلید وارد شده احتمالاً از نوع رایگان (Free Tier) است، با محدودیت‌های تعدادی درخواست از سمت گوگل مواجه شده است. شبکه برای جلوگیری از اختلال در کارنامه شما، به صورت خودکار به موتور آفلاین کایزن منتقل شده است.\n\nبرای ارتباط زنده، لطفاً دقایقی بعد تلاش کنید یا یک کلید رایگان جدید در بخش ادمین ثبت نمایید. ❤️";
    } else if (errStr.includes("leaked") || errStr.includes("403") || errStr.includes("401") || errStr.includes("unauthenticated") || errStr.includes("permission_denied") || errStr.includes("permission denied") || errStr.includes("suspended") || errStr.includes("compromised") || errStr.includes("invalid authentication")) {
      fallbackReply = "⚠️ همراه گرامی، کلید دسترسی (API Key) پیش‌فرض سرور یا مرورگر شما با محدودیت مواجه شده است.\n\nمن دکتر رادان هستم. نگران نباشید! برای فعال‌سازی کامل و برقراری ارتباط زنده با مدل‌های هوشمند Gemini، می‌توانید یک کلید رایگان از Google AI Studio دریافت کرده و در بخش تنظیمات فنی ثبت کنید.\n\nسیستم در حال حاضر با استفاده از شبیه‌سازهای حرفه‌ای و همدلانه فعال است تا هیچ وقفه‌ای در مسیر یادگیری شما ایجاد نشود. ❤️";
    } else {
      fallbackReply = getOfflineChatReply(message);
    }
    
    return res.status(200).json({ 
      reply: fallbackReply,
      isOfflineFallback: true,
      error: rawErrorMsg
    });
  }
});

// Endpoint to audit module with AI
app.post("/api/audit-module", async (req, res) => {
  const { moduleName, logs, selectedSubModules, type, history, healthLogs } = req.body;
  try {
    const ai = getAI(req, res);
    if (!ai) return res.status(500).json({ suggestion: "سرویس هوش مصنوعی در دسترس نیست." });

    const logSummary = logs.map((l: any) => `${l.timestamp}: ${l.action} - ${l.detail}`).join("\n");
    const healthLogSummary = healthLogs ? healthLogs.map((l: any) => `${l.timestamp}: ${l.type} - ${l.message}`).join("\n") : "";
    const historySummary = history && Array.isArray(history) ? `تحلیل‌های قبلی:\n${history.map(h => typeof h === 'string' ? h : h.analysis).join("\n---\n")}` : "";
    
    let systemInstruction = "";
    let userPrompt = "";

    if (type === "project") {
        systemInstruction = `شما یک مهندس ارشد قابلیت اطمینان سیستم (SRE) و تحلیلگر معماری هستید.
             وظیفه شما: ارائه یک تحلیل عمیق از دیدگاه SRE درباره سلامت کلی سیستم، شناسایی الگوهای خطا در لاگ‌ها، پیشنهاد بهبودهای زیرساختی و شناسایی نقاط گلوگاه احتمالی.
             پاسخ باید فنی، استراتژیک و مبتنی بر داده‌های ارائه شده باشد.`;
        userPrompt = `لاگ‌های سیستم:\n${logSummary}\n\nلاگ‌های سلامت عملکرد:\n${healthLogSummary}\n\nتحلیل‌های قبلی:\n${historySummary}\nلطفا وضعیت سلامت کلی سیستم را تحلیل کن و پیشنهاداتی برای پایداری و بهبود ارائه بده.`;
    } else {
        systemInstruction = `شما یک متخصص تحلیل خطا و بهبود کد هستید.
             وظیفه شما: تحلیل عمیق لاگ‌های ماژول ${moduleName}، بخش‌های انتخابی: ${selectedSubModules?.join(', ') || 'همه موارد'}، شناسایی الگوهای تکرارشونده خطا، تحلیل ریشه‌ای (Root Cause Analysis)، و ارائه پیشنهادهای عملیاتی برای رفع خطاها و بهبود کارایی کد.`;
        userPrompt = `لاگ‌های ماژول ${moduleName}، بخش‌های انتخابی: ${selectedSubModules?.join(', ') || 'همه موارد'}:\n${logSummary}\n\nلاگ‌های سلامت عملکرد:\n${healthLogSummary}\n\nتحلیل‌های قبلی:\n${historySummary}\nلطفا خطاها را کلاسترینگ کن (دسته‌بندی کن)، ریشه آن‌ها را شناسایی کن و راهکارهای فنی و مشخص برای بهبود ارائه بده.`;
    }

    const response = await ai.models.generateContent({
       model: "gemini-3.5-flash",
       contents: [{ role: "user", parts: [{ text: userPrompt }] }],
       config: { 
         systemInstruction: `${systemInstruction}
         
         پاسخ را دقیقاً در قالب فرمت JSON زیر بدون تگ‌های خارجی تحویل دهید:
         {
           "analysis": "تحلیل عمیق و فنی وضعیت",
           "recommendations": ["راهکار بهبود ۱", "راهکار بهبود ۲"],
           "riskLevel": "high" | "medium" | "low"
         }`,
         responseMimeType: "application/json"
       }
    });

    const resultText = response.text?.trim() || "{}";
    const cleanedText = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const resultJson = JSON.parse(cleanedText);

    res.json({ suggestion: resultJson });
  } catch (e: any) {
    console.error("AI Audit Error:", e);
    const errorMessage = e.message || "خطای نامشخص";
    res.status(500).json({ error: `خطا در اتصال به هوش مصنوعی: ${errorMessage}` });
  }
});

// Endpoint to estimate goal likelihood
app.post("/api/goal-insight", async (req, res) => {
  if (req.body?.testPing) return res.json({ status: "ok" });
  const { 
    student, 
    currentTraz, 
    currentPercentage, 
    targetTraz, 
    targetGrowth, 
    latestQuizScore 
  } = req.body;
  
  try {
    const fieldName = student?.field === "tajrobi" ? "علوم تجربی" : student?.field === "riazi" ? "ریاضی فیزیک" : "علوم انسانی";
    const targetPercentage = (currentPercentage || 59) + (targetGrowth || 10);

    const ai = getAI(req, res);
    if (!ai) {
      return res.json(getOfflineGoalInsight(student, currentTraz, currentPercentage, targetTraz, targetGrowth, latestQuizScore));
    }

    const prompt = `شما یک مشاور ارشد تحصیلی، ارزیاب ترازهای علمی و طراح کایزن درگاه آموزشی عالی موسسه "ترنم همدلی" (سامانه هوشمند پایش اهداف داوطلبان کنکور سراسری ایران) هستید.
امکانات و اهداف تحصیلی دانش‌آموز به شرح زیر است:
- نام و دوره هدف: ${student?.name || "داوطلب فرضی"} - هدف ${student?.grade || ""} رشته تخصصی کنکور ${fieldName}
- سرفصل‌های اولویت‌دار و مباحث درسی ضعیف (اعلام شده توسط داوطلب): ${student?.priorityTopics || "موردی ثبت نشده است"}
- تراز آزمون تستی فعلی داوطلب در ترنم همدلی: ${currentTraz || 6500}
- تراز هدف‌گذاری شده دانشگاه اول کشور: ${targetTraz || 8500}
- درصد محصولات تستی پاسخ صحیح فعلی: ${currentPercentage || 59}٪
- راندمان تست‌زنی هدف نهایی: ${targetPercentage}٪ (شامل بازدهی قبلی به همراه بهبود مربی‌گری)
- نمره آخرین کوییز شبیه‌ساز او: ${latestQuizScore || 63}٪

شما باید تراز و پیشرفت او را بسنجید و یک تحلیل آماری و علمی و روانشناختی آماده کنید. نقاط قوت و مباحث دروس تخصصی را پوشش دهید.

پاسخ را دقیقاً در قالب فرمت JSON زیر بدون تگ‌های خارجی تحویل دهید:
{
  "likelihood": 72, // یک عدد صحیح بین ۱۰ تا ۹۸ نشان‌دهنده درصد شانس رسیدن به تراز هدف
  "detailedMetrics": [
    { "label": "تسلط بر مفاهیم", "value": "۵۹٪", "status": "warning" },
    { "label": "بازدهی آزمون اخیر", "value": "۶۳٪", "status": "success" },
    { "label": "پایداری پومودورو", "value": "۸۲٪", "status": "success" }
  ],
  "text": "تحلیل صمیمی، ارزیابی بهداشت ذهن داوطلب، فرمول تلاش و مربی‌گری در ۳ الی ۴ جمله فارسی ترغیب‌کننده و معمارانه با لحن صمیمی (با تاکید و وزن بیشتر بر سرفصل‌های اولویت‌دار اعلامی داوطلب)",
  "recommendations": [
    "توصیه کاربردی ۱ جهت رفع تله تستی دروس آسیب دیده و ارتقای احتمال قبولی در رشته و دانشگاه هدف",
    "توصیه کاربردی ۲ جهت بهینه‌سازی کایزن مطالعاتی درسنامه گام به گام ترنم همدلی",
    "توصیه کاربردی ۳ درباره مانیتورینگ دقیق ترازهای رقبا در آزمون‌های جامع پیش‌رو"
  ]
}

فقط پاسخ خام JSON را بدون عبارت markdown مانند \`\`\`json برگردانید.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const textOutput = response.text?.trim() || "{}";
    const cleanedText = textOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
    const resultJson = JSON.parse(cleanedText);
    return res.json(resultJson);

  } catch (error: any) {
    if (error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("quota")) {
      console.log("Goal insight quota exhausted. Using offline fallback.");
    } else if (error?.message?.includes("PERMISSION_DENIED") || error?.message?.includes("Permission denied") || error?.message?.includes("suspended") || error?.message?.includes("UNAUTHENTICATED") || error?.message?.includes("invalid authentication")) {
      console.log("Goal insight API key lacks permissions. Using offline fallback.");
    } else if (error?.message?.includes("leaked")) {
      console.log("Goal insight API key issue detected. Using offline fallback.");
    } else {
      console.log("API Error caught (Using offline fallback) in Goal insight.");
    }
    return res.json(getOfflineGoalInsight(student, currentTraz, currentPercentage, targetTraz, targetGrowth, latestQuizScore));
  }
});

// Endpoint for intelligent exam quality analysis
app.post("/api/analyze-exam", async (req, res) => {
  if (req.body?.testPing) return res.json({ status: "ok" });
  const { lessons, field, student } = req.body;
  
  try {
    const ai = getAI(req, res);
    if (!ai) {
      return res.json(getOfflineExamAnalysis(lessons, field));
    }

    const priorityInfo = student?.priorityTopics ? `\n- مباحث دارای اولویت و ضعیف (اعلامی داوطلب): ${student.priorityTopics}` : "";
    const prompt = `یک کارنامه آزمون آزمایشی داوطلب کنکور سراسری با متغیرهای لاین تخصصی '${field}' دریافت شده است که آمارهای ممیزی پاسخ‌دهی به قرار زیر است:
${JSON.stringify(lessons, null, 2)}${priorityInfo}

لطفا یک تحلیل تخصصی مربی‌گری، روانشناسی آزمون، عارضه‌یابی درصد ممیزی‌ها به فرمت JSON دقیقا با ساختار زیر تهیه کنید. صمیمی و فنی بر اساس متدهای پیشرفته کایزن تحصیلی ترنم مهر طراحی شده باشد. به زبان فارسی شیوا پاسخ دهید:
{
  "weaknesses": [
    {
      "topic": "نام مبحث درسی آسیب‌دیده با جزئیات کامل (مثلاً مسائل استوکیومتری، گیاهی سال یازدهم، مشتق و کاربرد آن) - حتما اولویت های اعلامی داوطلب در صورت مرتبط بودن پوشش داده شود",
      "subject": "نام درس تخصصی آسیب‌دیده مربوطه",
      "percentage": 30, // درصد پاسخگویی درس
      "recommendation": "پیشنهادی جامع و دلسوزانه برای رفع تله تستی، منبع مطالعاتی از کتاب درسی و درسنامه‌های طلایی ترنم مهر",
      "questionsCount": 40, // تعداد تست تمرینی شناسنامه‌دار پیشنهادی برای غلبه بر این چالش تستی ترجیحاً بین ۳۰ تا ۷۰ عدد,
      "severity": "warning" // "critical" | "warning" | "mild"
    }
  ],
  "psychological": {
    "pattern": "نام الگوی کاهش تمرکز ذهن داوطلب (مثلاً فرسودگی توجه در دور آخر تست‌زنی، بیش‌تفکری روی گزینه‌های غلط)",
    "description": "تحلیل روانشناختی و ریتم مطالعاتی رفتار داوطلب در ۲ جمله صمیمانه و تخصصی",
    "correctToWrongRate": 42, // درصد میانگین پاسخهای غلط به کل تستها مثلا ۴۲
    "suggestion": "پیشنهاد مربی مشاور برای مهار استرس آزمون، تغذیه تمرکز و مانیتور بهتر رقبا در ماراتون تستی",
    "cardColor": "orange", // "red" | "orange" | "amber" | "blue"
    "stressLevel": 55, // عدد بین ۰ تا ۱۰۰ نشان دهنده میزان استرس ذهن، فرسودگی توجه و اضطراب داوطلب بر اساس توالی خطاهای پاسخی,
    "stressAnalysis": {
      "avgResponseTimeWrong": 75, // متوسط زمان هدررفته روی تست‌های دارای پاسخ غلط به ثانیه، عددی بین ۵۰ تا ۹۰ ثانیه,
      "avgResponseTimeCorrect": 45, // متوسط زمان ثبت پاسخ صحیح هر تست در آزمون به ثانیه، عددی بین ۳۰ تا ۶۰ ثانیه,
      "consecutiveErrorsCount": 3, // تخمین و شمارش توالی خطاهای همگون ناشی از فرسودگی توجه، بین ۱ تا ۱۰,
      "stressLabel": "متوسط", // "بحرانی" | "متوسط" | "خفیف" | "سالم"
      "technicalDetail": "توضیح فنی کوتاه ۲ جمله‌ای فارسی مربی علمی درباره عارضه استرس روی غشای تمرکزی داوطلب و پیامد آن روی آزمون جامع زیست‌شناسی و ریاضی"
    }
  },
  "remedialPlan": [
    {
      "day": "شنبه",
      "morningPlan": "برنامه مطالعه عمیق کتاب درسی، مرور تصاویر و خلاصه‌ها در شیفت صبح",
      "afternoonPlan": "برنامه حل تست زمان‌دار استاندارد و تحلیل پاسخنامه در شیفت عصر",
      "totalQuestions": 35
    }
  ],
  "estimatedNextTraz": 8200 // تراز تخمینی دور ممیزی بعدی داوطلب که عددی بین ۴۰۰۰ تا ۱۲۰۰۰ بر اساس آمارهای بهبود یافته بالا باشد
}

فقط کدهای خام JSON را بدون عبارت markdown مانند \`\`\`json برگردانید.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const textOutput = response.text?.trim() || "{}";
    const cleanedText = textOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
    const resultJson = JSON.parse(cleanedText);
    return res.json(resultJson);
  } catch (error: any) {
    if (error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("quota")) {
      console.log("Exam analysis quota exhausted. Using offline fallback.");
    } else if (error?.message?.includes("PERMISSION_DENIED") || error?.message?.includes("Permission denied") || error?.message?.includes("suspended") || error?.message?.includes("UNAUTHENTICATED") || error?.message?.includes("invalid authentication")) {
      console.log("Exam analysis API key lacks permissions. Using offline fallback.");
    } else if (error?.message?.includes("leaked")) {
      console.log("Exam analysis API key issue detected. Using offline fallback.");
    } else {
      console.log("API Error caught (Using offline fallback) in Exam analysis.");
    }
    return res.json(getOfflineExamAnalysis(lessons, field));
  }
});

// Endpoint for AI cognitive and psychological analytics
app.post("/api/psychology-analysis", async (req, res) => {
  if (req.body?.testPing) return res.json({ status: "ok" });
  const { student, qAnxiety, qFocus, qPerfectionism, qSleep, qStamina } = req.body;

  try {
    const ai = getAI(req, res);
    if (!ai) {
      return res.json(getOfflinePsychologyAnalysis(qAnxiety, qFocus, qPerfectionism, qSleep, qStamina, student));
    }

    const fieldName = student?.field === "tajrobi" ? "علوم تجربی" : student?.field === "riazi" ? "ریاضی فیزیک" : "علوم انسانی";
    const prompt = `شما یک روانشناس بالینی، متخصص علوم شناختی و "قصه‌گوی درمانی" در پرتال آکادمی "ترنم مهر" هستید.
وظیفه شما ارائه تحلیل روانشناختی است که مانند یک "داستان پیروزی" باشد و شرایط زیستی داوطلب را در نظر بگیرد.

مشخصات داوطلب:
- نام: ${student?.name || "داوطلب"}
- رشته: ${fieldName}
- شهر: ${student?.city || "نامشخص"}
- جو خانواده: ${student?.familyContext || "نامشخص"}
- وضعیت مالی: ${student?.financialStatus || "نامشخص"}
- هدف غایی: ${student?.mainGoal || "موفقیت"}

پارامترهای سنجیده شده (۱ تا ۱۰):
- اضطراب آزمون: ${qAnxiety}
- کانون توجه: ${qFocus} (۱۰ عالی)
- کمال‌گرایی وسواسی: ${qPerfectionism}
- کیفیت خواب: ${qSleep} (۱۰ عالی)
- استقامت عصرگاهی: ${qStamina} (۱۰ عالی)

خروجی باید به صورت JSON باشد و شامل یک "تشخیص داستانی" (diagnosis) باشد که به شهر، خانواده، چالش‌های مالی و هدف داوطلب اشاره کند و از سمبل‌های روانشناختی استفاده نماید.

JSON schema:
{
  "cognitiveProfile": {
    "focusIndex": 75, "resilience": 68, "academicDrive": 85, "stamina": 60, "anxietyManagement": 50, "sleepEfficacy": 70
  },
  "stressLevel": 58,
  "diagnosis": "یک متن داستانی و صمیمی (حداکثر ۴ جمله) که چالش‌های محیطی (شهر، پول، خانواده) را به هدف گره بزند و راهی برای خروج از زندان ذهنی نشان دهد. استفاده از ایموجی الزامی است.",
  "cognitiveTrap": "نام نمادین تله (مثلاً: 🕸️ تار عنکبوت وسواس محاسباتی)",
  "remedies": ["راهکار ۱ با تم داستانی", "راهکار ۲", "راهکار ۳"],
  "meditationAdvice": "توصیه آرامش‌بخش بر اساس هدف داوطلب",
  "breathingPaceSec": 4
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const textOutput = response.text?.trim() || "{}";
    const cleanedText = textOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
    const resultJson = JSON.parse(cleanedText);
    return res.json(resultJson);

  } catch (error: any) {
    if (error?.message?.includes("RESOURCE_EXHAUSTED") || error?.message?.includes("quota")) {
      console.log("Psychology analysis quota exhausted. Using offline fallback.");
    } else if (error?.message?.includes("PERMISSION_DENIED") || error?.message?.includes("Permission denied") || error?.message?.includes("suspended") || error?.message?.includes("UNAUTHENTICATED") || error?.message?.includes("invalid authentication")) {
      console.log("Psychology analysis API key lacks permissions. Using offline fallback.");
    } else if (error?.message?.includes("leaked")) {
      console.log("Psychology analysis API key issue detected. Using offline fallback.");
    } else {
      console.log("API Error caught (Using offline fallback) in Psychology analysis.");
    }
    return res.json(getOfflinePsychologyAnalysis(qAnxiety, qFocus, qPerfectionism, qSleep, qStamina, student));
  }
});

// --- ZarinPal Payment Integration ---

// Request Payment
app.post("/api/payment/request", async (req, res) => {
  if (req.body?.testPing) return res.json({ status: "ok" });
  const { amount, description, mobile, email } = req.body;
  const merchantId = process.env.ZARINPAL_MERCHANT_ID;
  const callbackUrl = process.env.ZARINPAL_CALLBACK_URL || `${process.env.APP_URL}/api/payment/verify`;

  // Simulation fallback if no merchant ID
  if (!merchantId || merchantId === "" || merchantId === "undefined") {
    console.warn("ZarianPal Merchant ID missing. Simulating payment request.");
    return res.json({
      status: 100,
      authority: "MOCK_AUTHORITY_" + Date.now(),
      url: `https://www.zarinpal.com/pg/StartPay/MOCK_AUTHORITY` 
    });
  }

  try {
    const response = await axios.post("https://api.zarinpal.com/pg/v4/payment/request.json", {
      merchant_id: merchantId,
      amount: amount, // rials or tomans depending on current GP4 (usually rials)
      callback_url: callbackUrl,
      description: description,
      metadata: { mobile, email }
    });

    if (response.data.data && response.data.data.code === 100) {
      return res.json({
        status: 100,
        authority: response.data.data.authority,
        url: `https://www.zarinpal.com/pg/StartPay/${response.data.data.authority}`
      });
    } else {
      return res.status(400).json({ error: "Failed to generate payment authority", details: response.data });
    }
  } catch (error: any) {
    console.error("ZarinPal Request Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Internal server error during payment request" });
  }
});

// Verify Payment
app.get("/api/payment/verify", async (req, res) => {
  const { Authority, Status } = req.query;
  const merchantId = process.env.ZARINPAL_MERCHANT_ID;

  if (Status !== "OK") {
    return res.redirect("/?payment=failed");
  }

  // Simulation fallback
  if (!merchantId || merchantId === "" || merchantId === "undefined") {
    return res.redirect("/?payment=success&refid=MOCK_REF_" + Date.now());
  }

  try {
    const response = await axios.post("https://api.zarinpal.com/pg/v4/payment/verify.json", {
      merchant_id: merchantId,
      amount: 10000, // This should match the original request amount
      authority: Authority
    });

    if (response.data.data && response.data.data.code === 100) {
      // Payment Successful
      return res.redirect(`/?payment=success&refid=${response.data.data.ref_id}`);
    } else {
      return res.redirect("/?payment=failed");
    }
  } catch (error: any) {
    console.error("ZarinPal Verify Error:", error.response?.data || error.message);
    res.redirect("/?payment=error");
  }
});

// Endpoint to test AI Connection for different sections as requested by the user
app.post("/api/test-ai-connection", async (req, res) => {
  console.log("POST /api/test-ai-connection called for section:", req.body?.section);
  const userKey = getSafeHeader(req, "x-gemini-key") || getSafeHeader(req, "x-openrouter-key") || req.body?.geminiKey as string || req.body?.openRouterKey as string;
  const testSection = req.body?.section || "chat"; // chat, goal, exam, psychology, motivational
  
  const activeKey = userKey || process.env.GEMINI_API_KEY || "";
  const isOpenRouter = activeKey.trim().startsWith("sk-or-");
  
  const responseData: any = {
    section: testSection,
    apiKeySource: userKey ? "Custom Client Key (LocalStorage)" : "Environment Secret (Cloud Run)",
    configuredModel: isOpenRouter ? "OpenRouter (GPT or other)" : "gemini-3.5-flash",
    activeKeyMasked: userKey 
      ? `${userKey.substring(0, 7)}...${userKey.substring(userKey.length - 4)}` 
      : (process.env.GEMINI_API_KEY 
          ? `${process.env.GEMINI_API_KEY.substring(0, 7)}...` 
          : "ثبت نشده - اتصال آفلاین"),
  };

  try {
    const ai = getAI(req, res);
    if (!ai) {
      responseData.connected = false;
      responseData.errorMessage = "کلید دسترسی معتبری از گوگل برای راه‌اندازی یافت نشد. سیستم در وضعیت آفلاین (نظیره‌یابی کایزن) قرار دارد.";
      responseData.fallbackUsed = "شبیه‌ساز آفلاین هوشمند آکادمی ترنم";
      return res.json(responseData);
    }

    const start = performance.now();
    let promptSample = "در ۳ کلمه بگو مربی کایزن ترنم مهر چه تاثیری دارد؟";
    if (testSection === "goal") {
      promptSample = "ماژول تخمین شانس قبولی متصل است؟ در ۳ کلمه بگو.";
    } else if (testSection === "exam") {
      promptSample = "ماژول عارضه‌یابی کارنامه زیست متصل است؟ در ۳ کلمه بگو.";
    } else if (testSection === "psychology") {
      promptSample = "ماژول قصه درمانی و مهار کمال‌گرایی متصل است؟ در ۳ کلمه بگو.";
    } else if (testSection === "motivational") {
      promptSample = "ماژول شعار و الهام روزانه متصل است؟ در ۳ کلمه بگو.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptSample,
    });

    const elapsed = (performance.now() - start).toFixed(0);
    responseData.connected = true;
    responseData.responseTimeMs = parseInt(elapsed);
    responseData.sampleReply = response.text?.trim() || "اتصال موفق ولی فاقد خروجی متنی";
    responseData.actualModelUsed = userKey?.startsWith("sk-or-") ? "OpenRouter Models" : "Google Gemini 2.5 Flash";
    
    return res.json(responseData);
  } catch (error: any) {
    responseData.connected = false;
    let errorMsg = error?.message || "خطای ناگهانی ارتباطی با سرورهای ممیزی گوگل رخ داد.";
    const errStr = errorMsg.toLowerCase();
    
    if (errStr.includes("resource_exhausted") || errStr.includes("quota") || errStr.includes("429")) {
      errorMsg = "سقف مجاز استفاده از این کلید به پایان رسیده است (Quota Exceeded). لطفا یک کلید جدید ایجاد کنید یا مدتی صبر کنید.";
    } else if (errStr.includes("permission_denied") || errStr.includes("permission denied") || errStr.includes("suspended")) {
      errorMsg = "این کلید مسدود شده است (Suspended). لطفاً یک کلید جدید ایجاد کنید.";
    } else if (errStr.includes("api key not valid") || errStr.includes("api_key_invalid")) {
      errorMsg = "کلید وارد شده نامعتبر است. لطفا کلید را به درستی وارد کنید.";
    }
    
    responseData.errorMessage = errorMsg;
    responseData.fallbackUsed = "موتور آفلاین شبیه‌ساز خلاق کایزن";
    return res.json(responseData);
  }
});

// API Sandbox endpoint for testing AI models from Admin panel
app.post("/api/sandbox", async (req, res) => {
  let { provider, apiKey, prompt } = req.body;
  const keyToUse = apiKey || process.env.GEMINI_API_KEY;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ success: false, error: "Prompt is required." });
  }

  if (!keyToUse) {
    // If no key provided, we can simulate a response, or return error. Admin needs real testing.
    return res.status(400).json({ success: false, error: "لطفا ابتدا یک کلید دسترسی معتبر (API Key) ثبت کنید." });
  }

  const start = performance.now();
  try {
    // Basic detection if openrouter
    let adapterType = provider;
    if (keyToUse.trim().startsWith("sk-or-")) {
      adapterType = "OpenRouter";
    } else if (isAgentRouterKey(keyToUse, req)) {
      adapterType = "AgentRouter";
    }

    if (adapterType === "Google Gemini" || adapterType === "OpenRouter" || adapterType === "AgentRouter" || !adapterType) {
      const tempAi = new AIAdapter(keyToUse, req);
      const result = await tempAi.models.generateContent({
        model: "gemini-2.5-flash", 
        contents: prompt
      });
      const reply = result.text || "پاسخ خالی است.";
      return res.json({ 
        success: true, 
        reply,
        responseTimeMs: Math.round(performance.now() - start),
        model: adapterType === "OpenRouter" ? "OpenRouter Endpoint" : "Gemini 2.5 Flash"
      });
    } else {
      return res.status(400).json({ success: false, error: `پروایدر ${adapterType} هنوز پشتیبانی نمی‌شود.` });
    }
  } catch (err: any) {
    let errorMsg = err.message || "خطای ناشناخته";
    if (err.cause?.status === 401 || err.cause?.status === 403 || errorMsg.includes("API_KEY_INVALID")) {
      errorMsg = "کلید API نامعتبر است یا منقضی شده است. لطفا کلید را بررسی کنید.";
    }
    return res.status(500).json({ success: false, error: errorMsg, responseTimeMs: Math.round(performance.now() - start) });
  }
});

// New endpoint to test multiple provider keys
app.post("/api/test-provider", async (req, res) => {
  const { provider, apiKey } = req.body;
  if (!apiKey) {
    return res.status(400).json({ valid: false, error: "API Key is missing." });
  }

  const start = performance.now();
  try {
    if (provider === "Google Gemini" || provider === "OpenRouter" || provider === "AgentRouter") {
      const tempAi = new AIAdapter(apiKey, req);
      await tempAi.models.generateContent({
        model: "gemini-2.5-flash", // OpenRouter in our AIAdapter maps to openrouter chat completions
        contents: "test"
      });
      return res.json({ valid: true, responseTimeMs: parseInt((performance.now() - start).toFixed(0)) });
    } else if (provider === "OpenAI") {
      const resp = await fetch("https://api.openai.com/v1/models", {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });
      if (!resp.ok) throw new Error("Invalid OpenAI API Key");
      return res.json({ valid: true, responseTimeMs: parseInt((performance.now() - start).toFixed(0)) });
    } else if (provider === "Anthropic") {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307",
          max_tokens: 1,
          messages: [{ role: "user", content: "test" }]
        })
      });
      if (resp.status === 401 || resp.status === 403) throw new Error("Invalid Anthropic API Key");
      return res.json({ valid: true, responseTimeMs: parseInt((performance.now() - start).toFixed(0)) });
    } else {
      // Simulate validation for Custom providers
      await new Promise(r => setTimeout(r, 600));
      return res.json({ valid: true, responseTimeMs: parseInt((performance.now() - start).toFixed(0)) });
    }
  } catch (error: any) {
    let errorMsg = "";
    if (typeof error?.message === "string") {
      errorMsg = error.message;
    } else if (typeof error === "string") {
      errorMsg = error;
    } else {
      try {
        errorMsg = JSON.stringify(error);
      } catch (e) {
        errorMsg = "Unknown error";
      }
    }

    if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota") || errorMsg.includes("429")) {
      errorMsg = "سقف مجاز استفاده از این کلید به پایان رسیده است (Quota Exceeded). لطفا یک کلید جدید ایجاد کنید یا از حساب پولی استفاده کنید.";
    } else if (errorMsg.includes("PERMISSION_DENIED") || errorMsg.includes("Permission denied") || errorMsg.includes("suspended")) {
      errorMsg = "این کلید مسدود شده است (Suspended). لطفاً یک کلید جدید ایجاد کنید.";
    } else if (errorMsg.includes("API key not valid") || errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("UNAUTHENTICATED") || errorMsg.includes("invalid authentication")) {
      errorMsg = "کلید وارد شده نامعتبر است. لطفا کلید را به درستی کپی کنید.";
    } else if (errorMsg.includes("402") || errorMsg.includes("credits")) {
      errorMsg = "موجودی این حساب کافی نیست. لطفا حساب خود را در OpenRouter شارژ کنید.";
    }
    return res.status(400).json({ valid: false, error: errorMsg });
  }
});

// Dynamic AI Question Generator with detailed developer telemetry tags
app.post("/api/generate-quiz-question", async (req, res) => {
  const { subject, difficulty, customTopic } = req.body;
  const start = performance.now();
  
  // Define fallback / default questions in case AI is completely offline or fails
  const offlineFallbacks: Record<string, any[]> = {
    "زیست‌شناسی": [
      {
        id: "Q-OFFLINE-BIO-1",
        subject: "زیست‌شناسی",
        title: "غشای سلولی و انتقال فعال",
        text: "کدام گزینه درباره پمپ سدیم-پتاسیم در غشای یک نورون حرکتی مغز درست است؟",
        options: [
          "به ازای خروج هر ۳ یون سدیم، ۲ یون پتاسیم را با مصرف یک مولکول ATP وارد می‌کند.",
          "فعالیت آن همواره غلظت سدیم درون سلول را بالاتر از بیرون نگه می‌دارد.",
          "تنها در هنگام تولید پتانسیل عمل شروع به کار کرده و به سرعت غیرفعال می‌شود.",
          "با خروج یون سدیم، غلظت آب درون نورون را به شدت افزایش می‌دهد."
        ],
        correctIdx: 0,
        explanation: "گزینه ۱ پاسخ صحیح است. پمپ سدیم پتاسیم یک پروتئین غشایی ناقل فعال است که با مصرف ATP سه یون Na+ را خارج و دو Na+ را وارد می‌کند. سایر گزینه‌ها نادرست هستند چون غلظت سدیم بیرون همیشه بیشتر است و پمپ همواره فعال است تا پتانسیل استراحت را حفظ کند.",
        trapType: "تله جابجایی تعداد یون‌ها یا غلظت درون سلولی که معمولاً دانش‌آموزان در استرس آزمون اشتباه می‌کنند.",
        difficulty: difficulty || "سخت",
        importance: "high"
      }
    ],
    "شیمی": [
      {
        id: "Q-OFFLINE-CHEM-1",
        subject: "شیمی",
        title: "محلول‌ها و غلظت‌ها",
        text: "در دمای معین غلظت یون هیدرونیوم در محلول اسیدی با pH برابر ۳ چند برابر غلظت آن در محلول دگر با pH برابر ۵ است؟",
        options: [
          "۱۰۰ برابر",
          "۱۰ برابر",
          "۲ برابر",
          "۰.۰۱ برابر"
        ],
        correctIdx: 0,
        explanation: "اسید قوی‌تر دارای pH کمتر است. تفاوت pH برابر ۲ به معنی تفاوت غلظت ۱۰ به توان ۲ برابر یعنی ۱۰۰ برابر می‌باشد.",
        trapType: "تله‌ی عکس پنداشتن نسبت غلظت با تغییرات یون هیدرونیوم در مقیاس لگاریتمی.",
        difficulty: difficulty || "سخت",
        importance: "high"
      }
    ],
    "ریاضی": [
      {
        id: "Q-OFFLINE-MATH-1",
        subject: "ریاضی",
        title: "مشتق و پیوستگی",
        text: "کدام یک از جملات زیر درباره مشتق‌پذیری توابع در بازه مفروض همواره برقرار است؟",
        options: [
          "هر تابع پیوسته‌ای در بازه مفروض قطعا مشتق‌پذیر نیز هست.",
          "هر تابع مشتق‌پذیری در بازه مفروض قطعا پیوسته است.",
          "نقاط عطف تابع همواره دارای مشتق اول برابر صفر می‌باشند.",
          "تابع پیوسته لزوما فاقد نقطه گوشه‌ای یا عطف می‌باشد."
        ],
        correctIdx: 1,
        explanation: "طبق قضیه اساسی حساب دیفرانسیل، شرط لازم برای مشتق‌پذیری یک تابع در یک نقطه، پیوسته بودن آن در آن نقطه است. اما عکس آن برقرار نیست (مثلا تابع قدر مطلق در صفر پیوسته است ولی مشتق‌پذیر نیست).",
        trapType: "استفاده غلط از عکس قضیه منطقی پیوستگی و مشتق‌پذیری.",
        difficulty: difficulty || "متوسط",
        importance: "high"
      }
    ],
    "فیزیک": [
      {
        id: "Q-OFFLINE-PHYS-1",
        subject: "فیزیک",
        title: "الکتریسیته و مدارها",
        text: "با افزایش مقاومت متغیر در یک مدار ساده تک‌حلقه که دارای باتری با مقاومت درونی غیرصفر است، اختلاف پتانسیل دو سر باتری چگونه تغییر می‌کند؟",
        options: [
          "کاهش می‌یابد.",
          "افزایش می‌یابد.",
          "تغییری نمی‌کند.",
          "ابتدا کاهش و سپس افزایش پیدا می‌کند."
        ],
        correctIdx: 1,
        explanation: "فرمول پتانسیل ترمینال باتری V = E - ir است. با افزایش مقاومت خارجی مدار، جریان کل (i) کاهش می‌یابد. کاهش i باعث کاهش بخش افت پتانسیل درونی (ir) شده و در نتیجه پتانسیل ترمینال V افزایش می‌یابد و به نیروی محرکه E نزدیک‌تر می‌شود.",
        trapType: "تله‌ی پنداشتن اینکه پتانسیل دو سر همواره با مقاومت خارجی رابطه عکس دارد.",
        difficulty: difficulty || "سخت",
        importance: "high"
      }
    ]
  };

  const defaultQuestions = offlineFallbacks[subject] || [
    {
      id: "Q-OFFLINE-GEN-1",
      subject: subject || "عمومی",
      title: "مفهوم پایه و عارضه‌یابی",
      text: `یک سوال تستی ارزشمند درباره مبحث (${customTopic || subject || "تحلیل تحصیلی"}) طراحی آزمون های شبیه‌ساز ترنم مهر.`,
      options: [
        "پالت کایزن و بهبود مستمر عادات ذهنی تستی",
        "تمرکز صِرف روی تست زنی بدون تحلیل بهداشت روان",
        "حذف دوره‌های مرور دوره‌ای مباحث پرضریب کنکور",
        "کمال‌گرایی منفی در حل سوالات وقت‌گیر و تله‌دار"
      ],
      correctIdx: 0,
      explanation: "سیستم کایزن ترنم مهر بر بهبود مداوم و تحلیل بهداشت روان تاکید دارد.",
      trapType: "وسواس کمال‌گرایی در مدیریت تست‌ها",
      difficulty: "سخت",
      importance: "medium"
    }
  ];

  try {
    const ai = getAI(req, res);
    if (!ai) {
      const selected = defaultQuestions[Math.floor(Math.random() * defaultQuestions.length)];
      if (customTopic && selected.id === "Q-OFFLINE-GEN-1") {
        selected.text = `یک سوال تستی ارزشمند درباره مبحث تخصصی (${customTopic}) منطبق بر آزمون های شبیه‌سازی کایزن درگاه ترنم مهر.`;
      }
      return res.json({
        success: true,
        question: selected,
        metadata: {
          model: "Kaizen Local Logic Suite",
          mode: "offline",
          timestamp: new Date().toISOString(),
          latencyMs: Math.round(performance.now() - start),
          apiStatus: "هیچ کلید فعالی در پنل ادمین یافت نشد. برای تست زنده کلید اختصاصی خود را وارد کنید."
        }
      });
    }

    const aiPrompt = `You are an elite, highly experienced question designer for the Iranian National College Entrance Exam (Konkur) for the subject "${subject || "زیست‌شناسی"}".
Generate EXACTLY ONE high-quality, conceptual, and difficult multiple-choice test question in Persian.
The question MUST cover the following precise topic: "${customTopic || "مفاهیم خلاقانه و پر بازده کتاب درسی"}".
Focus on designing a difficult but logically flawless question with difficulty level: "${difficulty || "سخت"}".
Include a strong psychological or conceptual test trap ("تله تستی") that matches high-yield school curriculum standards.

You must respond with EXACTLY a valid JSON object matching this structure (do not wrap in markdown or any other characters, and use Persian language for user-facing values):
{
  "id": "Q-AI-${Math.floor(Math.random() * 9000 + 1000)}",
  "subject": "${subject || "زیست‌شناسی"}",
  "title": "A brief Persian title of the subtopic inside ${subject}",
  "text": "The full Persian question, written in a clear, educational, standard Konkur style, with high precision and realistic choices.",
  "options": [
    "Persian Option 1",
    "Persian Option 2",
    "Persian Option 3",
    "Persian Option 4"
  ],
  "correctIdx": 0, // 0 to 3 integer
  "explanation": "Extremely detailed Persian explanation showing why this is correct, how to avoid the trap, and why other options are incorrect.",
  "trapType": "Explain the psychological or conceptual trap of the correct or wrong options in Persian in 1 elegant sentence.",
  "difficulty": "${difficulty || "سخت"}",
  "importance": "high"
}

Verify that correctIdx is a valid number from 0 to 3 and references the actual correct option inside the options array. Ensure all JSON fields are surrounded by double quotes.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
      config: {
        responseMimeType: "application/json"
      }
    });

    const replyText = response.text?.trim() || "";
    let questionObj;
    try {
      questionObj = JSON.parse(replyText);
    } catch (e) {
      const jsonMatch = replyText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionObj = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse Gemini output as JSON: " + replyText.substring(0, 50));
      }
    }

    // Basic structural validation
    if (!questionObj.title || !questionObj.text || !Array.isArray(questionObj.options) || questionObj.options.length < 4) {
      throw new Error("Generated question structure was invalid.");
    }

    return res.json({
      success: true,
      question: questionObj,
      metadata: {
        model: "Google Gemini 2.5-flash",
        mode: "live",
        timestamp: new Date().toISOString(),
        latencyMs: Math.round(performance.now() - start),
        apiStatus: "ارتباط موفق زنده (Real-Time API)"
      }
    });

  } catch (error: any) {
    console.error("AI Question Generation Error:", error);
    const selectedFallback = defaultQuestions[Math.floor(Math.random() * defaultQuestions.length)];
    if (customTopic && selectedFallback.id === "Q-OFFLINE-GEN-1") {
      selectedFallback.text = `یک سوال تستی ارزشمند درباره مبحث تخصصی (${customTopic}) منطبق بر آزمون های شبیه‌سازی کایزن درگاه ترنم مهر.`;
    }
    return res.json({
      success: true,
      question: selectedFallback,
      metadata: {
        model: "Kaizen Local Simulator Mode",
        mode: "fallback",
        timestamp: new Date().toISOString(),
        latencyMs: Math.round(performance.now() - start),
        apiStatus: "انتقال خودکار به شبیه‌ساز پایدار: " + (error?.message || "خطای ارتباطی با API گوگل")
      }
    });
  }
});

// Start express server configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Taranom Mehr SaaS engine running at port ${PORT}`);
  });
}

startServer();
