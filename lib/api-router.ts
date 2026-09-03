/**
 * Cloudflare Pages Function — catch-all API router.
 *
 * This replaces the Express `server.ts` so the API actually runs on
 * Cloudflare Pages (which is static-only and cannot run a Node/Express server).
 *
 * It reproduces every /api/* route from the original server.ts using the
 * Workers runtime (fetch-based), reading secrets from the `env` binding and
 * custom keys from request headers. Gemini calls use the REST API directly
 * (the @google/genai SDK is Node-oriented) with a model fallback chain so AI
 * keeps working across model deprecations.
 *
 * Routes:
 *   GET  /api/health
 *   GET  /api/ai-status
 *   GET  /api/motivational
 *   POST /api/chat
 *   POST /api/goal-insight
 *   POST /api/analyze-exam
 *   POST /api/audit-module
 *   POST /api/psychology-analysis
 *   POST /api/payment/request
 *   GET  /api/payment/verify
 *   POST /api/test-ai-connection
 *   POST /api/sandbox
 *   POST /api/test-provider
 *   POST /api/generate-quiz-question
 */

/* ----------------------------------------------------------------------------
 * Types & small helpers
 * ------------------------------------------------------------------------- */

export interface Env {
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  ZARINPAL_MERCHANT_ID?: string;
  ZARINPAL_CALLBACK_URL?: string;
  /** Set to "true" to use the Zarinpal sandbox API (test payments). */
  ZARINPAL_SANDBOX?: string;
  APP_URL?: string;
  /** Cloudflare D1 database binding (set in wrangler.json). */
  DB?: any;
  /** Cloudflare Workers AI binding (set in wrangler.json) — embeddings + fallback LLM. */
  AI?: any;
  /** Cloudflare account id — enables D1 access over REST on non-CF hosts (Vercel). */
  CF_ACCOUNT_ID?: string;
  /** D1 database id used with CF_ACCOUNT_ID + D1_API_TOKEN for REST access. */
  D1_DATABASE_ID?: string;
  /** Cloudflare API token with D1 Edit permission (REST queries on Vercel). */
  D1_API_TOKEN?: string;
  /** Hugging Face token for Llama / open models (Inference Providers). */
  HF_TOKEN?: string;
  /** Hugging Face model id, e.g. "meta-llama/Llama-3.2-3B-Instruct:featherless-ai". */
  HF_MODEL?: string;
  /** Weights & Biases API key (training metrics in admin). */
  WANDB_API_KEY?: string;
  /** URL of the education exam-RAG static Space. */
  EXAM_RAG_URL?: string;
  /** Telegram Bot Token for @taranom_hamdeli_bot */
  TELEGRAM_BOT_TOKEN?: string;
  /** Bale Bot Token for @taranom_hamdeli_bot */
  BALE_BOT_TOKEN?: string;
  /** Kavenegar API key for OTP SMS. */
  KAVENEGAR_API_KEY?: string;
  /** Kavenegar sender line number (e.g. \"10004346\"). */
  KAVENEGAR_SENDER?: string;
  /** Comma-separated Telegram chat IDs allowed to run admin bot commands (/post_channel). */
  BOT_ADMIN_IDS?: string;
  /** شماره کارت برای پرداخت کارت‌به‌کارت در ربات (مثلاً 6037-xxxx-xxxx-xxxx). */
  PAYMENT_CARD_NUMBER?: string;
  /** نام صاحب کارت برای پرداخت کارت‌به‌کارت. */
  PAYMENT_CARD_NAME?: string;
  /** Channel for daily posts, e.g. "@ai_exam_iran". */
  CHANNEL_ID?: string;
  /** Local development only. Never set this to true in production. */
  DEV_AUTH_CODES?: string;
}

interface Ctx {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
}

type Json = Record<string, any>;

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, x-gemini-key, x-openrouter-key, x-ai-provider-keys",
      "Access-Control-Expose-Headers": "x-ai-resolved-provider, x-ai-fallback",
      ...extraHeaders,
    },
  });
}

/** Mutable bag the AI layer writes provider telemetry headers into. */
class RespMeta {
  headers: Record<string, string> = {};
  set(k: string, v: string) {
    this.headers[k] = v;
  }
}

function getSafeHeader(req: Request, name: string): string {
  const val = req.headers.get(name);
  if (!val) return "";
  try {
    if (val.includes("%")) return decodeURIComponent(val);
  } catch (_) {}
  return val;
}

/** Collect every candidate API key (header > body > query > env), de-duped. */
function getRequestKeys(req: Request, body: any, env: Env): string[] {
  let fallbackKeys: string[] = [];
  try {
    const rawAll = getSafeHeader(req, "x-ai-provider-keys");
    if (rawAll) {
      const parsed = JSON.parse(rawAll);
      if (Array.isArray(parsed)) {
        fallbackKeys = parsed.map((k: any) => k.key).filter(Boolean);
      } else if (typeof parsed === "string") {
        try {
          const inner = JSON.parse(parsed);
          if (Array.isArray(inner)) fallbackKeys = inner.map((k: any) => k.key).filter(Boolean);
        } catch (_) {}
      }
    }
  } catch (_) {}

  const url = new URL(req.url);
  const k1 = getSafeHeader(req, "x-gemini-key");
  const k2 = getSafeHeader(req, "x-openrouter-key");
  const k3 = body?.geminiKey as string;
  const k4 = body?.openRouterKey as string;
  const k5 = url.searchParams.get("geminiKey") as string;
  const k6 = url.searchParams.get("openRouterKey") as string;

  const all = [
    ...fallbackKeys,
    k1, k2, k3, k4, k5, k6,
    env.OPENROUTER_API_KEY,
    env.GEMINI_API_KEY,
    env.HF_TOKEN,
  ].filter(
    (k): k is string =>
      !!k && typeof k === "string" && k.trim() !== "" && k !== "undefined" && k !== "null" &&
      !k.includes("YOUR_API_KEY") && k.length > 10
  );

  return [...new Set(all)];
}

function getProviderNameForKey(key: string, req: Request): string {
  try {
    const rawAll = getSafeHeader(req, "x-ai-provider-keys");
    if (rawAll) {
      const parsed = JSON.parse(rawAll);
      if (Array.isArray(parsed)) {
        const found = parsed.find((k: any) => k.key === key);
        if (found) return found.provider;
      }
    }
  } catch (_) {}
  if (key.startsWith("sk-or-")) return "OpenRouter";
  if (key.startsWith("hf_")) return "Hugging Face (Llama)";
  if (key.startsWith("sk-")) return "OpenAI/Anthropic";
  return "Google Gemini";
}

/* ----------------------------------------------------------------------------
 * AI layer (fetch-based, works on the Workers runtime)
 * ------------------------------------------------------------------------- */

// Model fallback chain so AI survives model deprecations.
const GEMINI_MODEL_CHAIN = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.0-flash"];

function pickGeminiModels(requested?: string): string[] {
  const chain = [...GEMINI_MODEL_CHAIN];
  if (requested && requested.startsWith("gemini-") && !chain.includes(requested)) {
    chain.unshift(requested);
  }
  return chain;
}

/** Low-level call to one Gemini model via the REST API. */
async function geminiRawGenerate(apiKey: string, model: string, params: any): Promise<{ text: string; raw: any }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let contents: any[] = [];
  if (typeof params.contents === "string") {
    contents = [{ role: "user", parts: [{ text: params.contents }] }];
  } else if (Array.isArray(params.contents)) {
    contents = params.contents;
  } else if (params.contents) {
    contents = [params.contents];
  }

  const body: any = { contents };

  const cfg = params.config || {};
  if (cfg.systemInstruction) {
    const si = cfg.systemInstruction;
    body.systemInstruction = typeof si === "string" ? { parts: [{ text: si }] } : si;
  }

  const generationConfig: any = {};
  if (cfg.responseMimeType) generationConfig.responseMimeType = cfg.responseMimeType;
  if (cfg.maxOutputTokens) generationConfig.maxOutputTokens = cfg.maxOutputTokens;
  if (cfg.temperature != null) generationConfig.temperature = cfg.temperature;
  if (Object.keys(generationConfig).length) body.generationConfig = generationConfig;

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "taranom-pages-fn" },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const t = await resp.text();
    const e: any = new Error(`Gemini error ${resp.status}: ${t}`);
    e.status = resp.status;
    throw e;
  }

  const data: any = await resp.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const text = parts.map((p: any) => p.text || "").join("");
  return { text, raw: data };
}

/** Try the model fallback chain; skip model-not-found errors, propagate others. */
async function geminiGenerate(apiKey: string, params: any): Promise<{ text: string }> {
  const models = pickGeminiModels(params.model);
  let lastErr: any;
  for (const model of models) {
    try {
      return await geminiRawGenerate(apiKey, model, params);
    } catch (e: any) {
      lastErr = e;
      const status = e.status;
      const msg = (e.message || "").toLowerCase();
      const modelIssue =
        status === 404 ||
        status === 400 ||
        msg.includes("not found") ||
        msg.includes("not_supported") ||
        msg.includes("does not support") ||
        msg.includes("not found") ||
        msg.includes("model");
      if (modelIssue) continue;
      throw e; // quota / auth / network → let the route's fallback handle it
    }
  }
  throw lastErr;
}

/** Convert Gemini-style contents to OpenRouter messages and call it. */
async function openRouterGenerate(apiKey: string, params: any): Promise<{ text: string }> {
  const messages: any[] = [];

  if (typeof params.contents === "string") {
    messages.push({ role: "user", content: params.contents });
  } else if (Array.isArray(params.contents)) {
    for (const content of params.contents) {
      let text = "";
      if (content.parts) {
        for (const p of content.parts) {
          if (p.text) text += p.text + "\n";
        }
      }
      const role = content.role === "model" ? "assistant" : "user";
      messages.push({ role, content: text.trim() });
    }
  }

  const cfg = params.config || {};
  if (cfg.systemInstruction) {
    const si = typeof cfg.systemInstruction === "string"
      ? cfg.systemInstruction
      : (cfg.systemInstruction?.parts?.map((p: any) => p.text).join("\n") || "");
    if (si) messages.unshift({ role: "system", content: si });
  }

  const requested: string = params.model || "";
  const openrouterModel =
    requested.includes("/") ? requested
      : requested.includes("gemini-2.5") ? "google/gemini-2.5-flash"
      : requested.includes("gemini-3") ? "google/gemini-3.5-flash"
      : "openrouter/auto";

  const reqBody: any = {
    model: openrouterModel,
    messages,
    max_tokens: cfg.maxOutputTokens || 2048,
  };
  if (cfg.responseMimeType === "application/json") reqBody.response_format = { type: "json_object" };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://hamdeltar.ir",
      "X-Title": "TaranomAcademy",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(reqBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const e: any = new Error(`OpenRouter error: ${errorText}`);
    e.status = response.status;
    throw e;
  }
  const data: any = await response.json();
  return { text: data.choices?.[0]?.message?.content || "" };
}

/** Call a Llama / open model via the Hugging Face Inference Providers router
 *  (OpenAI-compatible chat completions endpoint). */
async function huggingFaceGenerate(apiKey: string, model: string, params: any): Promise<{ text: string }> {
  const messages: any[] = [];

  if (params.config?.systemInstruction) {
    const si = params.config.systemInstruction;
    const text = typeof si === "string" ? si : (si?.parts?.map((p: any) => p.text).join("\n") || "");
    if (text) messages.push({ role: "system", content: text });
  }

  if (typeof params.contents === "string") {
    messages.push({ role: "user", content: params.contents });
  } else if (Array.isArray(params.contents)) {
    for (const content of params.contents) {
      let text = "";
      if (content.parts) {
        for (const p of content.parts) { if (p.text) text += p.text + "\n"; }
      }
      const role = content.role === "model" ? "assistant" : "user";
      messages.push({ role, content: text.trim() });
    }
  }

  // مدل اصلی (از env) + زنجیرهٔ پشتیبان: اگر مدل روی ظرفیت نبود یا پشتیبانی نمی‌شد، مدل بعدی امتحان می‌شود.
  const HF_FALLBACK_MODELS = [
    "meta-llama/Llama-3.3-70B-Instruct:featherless-ai",
    "Qwen/Qwen2.5-7B-Instruct:featherless-ai",
    "meta-llama/Llama-3.2-3B-Instruct:featherless-ai",
  ];
  const tryModels = [model, ...HF_FALLBACK_MODELS.filter((m) => m !== model)];
  const HF_TIMEOUT_MS = 12000; // سقف زمانی هر مدل تا مدلِ کند سریع‌تر به بعدی برسد
  let lastErr: any = null;
  for (const m of tryModels) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), HF_TIMEOUT_MS);
    let resp: Response;
    try {
      resp = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: m,
          messages,
          max_tokens: params.config?.maxOutputTokens || 512,
          temperature: params.config?.temperature ?? 0.7,
        }),
        signal: ctrl.signal,
      });
    } catch (netErr: any) {
      clearTimeout(timer);
      lastErr = netErr; // تایم‌اوت/شبکه → مدل بعدی
      continue;
    }
    clearTimeout(timer);
    if (resp.ok) {
      const data: any = await resp.json();
      const text = data.choices?.[0]?.message?.content || "";
      if (text) return { text };
      lastErr = new Error(`HuggingFace empty reply from ${m}`);
      continue;
    }
    const errorText = await resp.text().catch(() => "");
    const e: any = new Error(`HuggingFace error ${resp.status} (${m}): ${errorText}`);
    e.status = resp.status;
    lastErr = e;
    // خطای احراز هویت → تلاش برای مدل‌های دیگر بی‌فایده است؛ همین حالا پرتاب کن.
    if (resp.status === 401 || resp.status === 403) throw e;
    // ۴xx (مدل پشتیبانی‌نشده) یا ۵xx/ظرفیت → مدل بعدی را امتحان کن.
  }
  throw lastErr || new Error("HuggingFace: all models failed");
}

/** Adapter exposing the same .models / .chats surface the handlers expect. */
class AIAdapter {
  apiKey: string;
  isOpenRouter: boolean;
  isHuggingFace: boolean;
  constructor(apiKey: string) {
    this.apiKey = apiKey.trim();
    this.isOpenRouter = this.apiKey.startsWith("sk-or-");
    this.isHuggingFace = this.apiKey.startsWith("hf_");
  }

  get models() {
    return {
      generateContent: async (params: any) => {
        if (this.isOpenRouter) return openRouterGenerate(this.apiKey, params);
        if (this.isHuggingFace) {
          const hfModel = (params.model && params.model.includes("/")) ? params.model : (params.hfModel || "meta-llama/Llama-3.3-70B-Instruct:featherless-ai");
          return huggingFaceGenerate(this.apiKey, hfModel, params);
        }
        return geminiGenerate(this.apiKey, params);
      },
    };
  }

  get chats() {
    return {
      create: (params: any) => {
        const history: any[] = params.history ? [...params.history] : [];
        return {
          sendMessage: async (msgParams: any) => {
            const userMessage =
              typeof msgParams === "string" ? msgParams : (msgParams?.message ?? "");
            const contents = [...history, { role: "user", parts: [{ text: userMessage }] }];
            const paramsForCall: any = {
              model: params.model,
              hfModel: params.hfModel,
              contents,
            };
            if (params.config?.systemInstruction) {
              paramsForCall.config = { systemInstruction: params.config.systemInstruction };
            }
            if (this.isOpenRouter) return openRouterGenerate(this.apiKey, paramsForCall);
            if (this.isHuggingFace) return huggingFaceGenerate(this.apiKey, params.hfModel || "meta-llama/Llama-3.3-70B-Instruct:featherless-ai", paramsForCall);
            return geminiGenerate(this.apiKey, paramsForCall);
          },
        };
      },
    };
  }
}

/**
 * Wraps a list of keys and falls back across them, mirroring the original
 * AIFallbackWrapper. Forces a current Gemini model (the old 1.5/2.5 names are
 * deprecated). Writes resolved-provider telemetry into `meta`.
 */
class AIFallbackWrapper {
  private keys: string[];
  private req: Request;
  private meta: RespMeta;
  private hfModel: string;
  constructor(keys: string[], req: Request, meta: RespMeta, hfModel?: string) {
    this.keys = keys;
    this.req = req;
    this.meta = meta;
    this.hfModel = hfModel || "meta-llama/Llama-3.3-70B-Instruct:featherless-ai";
  }

  /** Pick the right model for a given key. */
  private modelForKey(key: string): any {
    if (key.startsWith("hf_")) return this.hfModel;
    if (key.startsWith("sk-or-")) return undefined;
    return "gemini-3.5-flash";
  }

  get models() {
    return {
      generateContent: async (params: any) => {
        let lastError: any = null;
        for (let i = 0; i < this.keys.length; i++) {
          const key = this.keys[i];
          try {
            const effectiveParams = { ...params, model: this.modelForKey(key), hfModel: this.hfModel };
            const ai = new AIAdapter(key);
            const result = await ai.models.generateContent(effectiveParams);
            const providerName = getProviderNameForKey(key, this.req);
            this.meta.set("x-ai-resolved-provider", encodeURIComponent(providerName));
            if (i > 0) this.meta.set("x-ai-fallback", `Provider_Index_${i}`);
            return result;
          } catch (e: any) {
            lastError = e;
          }
        }
        throw lastError;
      },
    };
  }

  get chats() {
    return {
      create: (params: any) => ({
        sendMessage: async (msgParams: any) => {
          let lastError: any = null;
          for (let i = 0; i < this.keys.length; i++) {
            const key = this.keys[i];
            try {
              const paramsClone = {
                ...params,
                model: this.modelForKey(key),
                hfModel: this.hfModel,
                history: params.history ? [...params.history] : [],
              };
              const ai = new AIAdapter(key);
              const chat = ai.chats.create(paramsClone);
              const result = await chat.sendMessage(msgParams);
              const providerName = getProviderNameForKey(key, this.req);
              this.meta.set("x-ai-resolved-provider", encodeURIComponent(providerName));
              if (i > 0) this.meta.set("x-ai-fallback", `Provider_Index_${i}`);
              return result;
            } catch (e: any) {
              lastError = e;
            }
          }
          throw lastError;
        },
      }),
    };
  }
}

function getAI(req: Request, body: any, env: Env, meta: RespMeta): AIFallbackWrapper | null {
  try {
    const keys = getRequestKeys(req, body, env);
    if (keys.length === 0) return null;
    return new AIFallbackWrapper(keys, req, meta, env.HF_MODEL);
  } catch (_) {
    return null;
  }
}

/* ----------------------------------------------------------------------------
 * Offline / simulation fallbacks (verbatim from server.ts)
 * ------------------------------------------------------------------------- */

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
  let recommendations: string[] = [];

  if (likelihood >= 80) {
    text = `سیگنال‌های درخشان و بسیار مثبتی در روند تست‌زنی و ترازهای آزمون خود ثبت کرده‌اید! برآورد بازدهی آخرین تلاش مطالعاتی شما (${latestQuizScore}٪) رشد برجسته‌ای را نسبت به وضعیت پایه (${currentPercentage}٪) نشان می‌دهد. دستیابی به تراز هدف ${targetTraz || 8500} با این مداومت کاملا هموار است؛ مشروط بر اینکه تحلیل تله‌های تستی و حل تست‌های سراسری سال‌های گذشته را به طور روزانه در فرآیند کایزن پیش ببرید.`;
    recommendations = [
      "بهینه‌سازی زمان‌بندی مرور خلاصه نویسی‌ها در مباحث زیست‌شناسی و شیمی.",
      "تثبیت درصد پاسخ‌دهی مبحث مشتق یا هندسه با حل ۳۰ تست زمان‌دار موازی.",
      "حفظ پیوستگی استریک مطالعاتی روزانه بدون افت ریتم پومودورویی.",
    ];
  } else if (likelihood >= 50) {
    text = `مسیر آماده‌سازی شما برای کنکور سراسری امیدبخش است اما برای قبولی قطعی در دانشگاه‌های تراز اول کشور و صعود به تراز مطلوب ${targetTraz || 8500}، ارتقای سرعت پاسخ‌گویی به تست‌های سخت مفهومی و زمان‌بر ضروری است. درصد فعلی تسلط شما (${currentPercentage}٪) نیازمند رشد است. بازدهی آزمون‌های اخیر شما (${latestQuizScore}٪) گواه ظرفیت ارتقاء شماست.`;
    recommendations = [
      "رفع نقایص مباحث شیمی آلی یا سرعت واکنش با درسنامه‌های صریح و مفهومی ترنم مهر.",
      "حضور فعال در کارگاه مربی‌گری هوشمند و وبینارهای رفع اشکال کارنامه.",
      "کاهش نمره منفی آزمون با دوری از زدن پاسخ‌های مردد و تست‌های ۵۰-۵0.",
    ];
  } else {
    text = `اراده مستحکم شما برای کسب رتبه برتر کشوری و تراز ممتاز (${targetTraz || 8500}) قابل تحسین است؛ اما آمارهای تحلیلی نشان می‌دهد که سطح فعلی کوییزها (${latestQuizScore}٪) با هدف‌گذاری نهایی (${targetPercentage}٪) فاصله دارد. مشاور ترنم مهر پیشنهاد می‌کند هدف خود را در فاز اول روی تراز میانی ۷۵۰۰ بگذارید تا پله‌پله و با ثبات بیشتری صعود کنید.`;
    recommendations = [
      "تمرکز بسیار جدی بر مطالعه مباحث بنیادین و فرمول‌های پرتکرار فیزیک و ریاضی.",
      "استفاده از کتاب‌های مفهومی و درسنامه‌های طلایی کنکور.",
      "افزایش ساعات مطالعه هفتگی به ۴۸ ساعت کامل و ثبت دقیق در دفتر برنامه‌ریزی.",
    ];
  }

  return {
    likelihood,
    text,
    recommendations,
    detailedMetrics: [
      { label: "تسلط بر مفاهیم", value: `${toPersianNum(currentPercentage)}٪`, status: currentPercentage < 50 ? "warning" : "success" },
      { label: "بازدهی آزمون اخیر", value: `${toPersianNum(latestQuizScore)}٪`, status: latestQuizScore < 60 ? "warning" : "success" },
      { label: "پایداری پومودورو", value: `${toPersianNum(75 + Math.floor(Math.random() * 15))}٪`, status: "success" },
    ],
  };
}

function getOfflineExamAnalysis(lessons: any[], field: string) {
  const analyzedWeaknesses: any[] = [];
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

    analyzedWeaknesses.push({ topic, subject: name, percentage: sub.percentage, recommendation: rec, questionsCount: questions, severity });
  }

  const nextTraz = Math.min(12000, Math.max(4000, Math.floor((subjects.reduce((acc: number, cur: any) => acc + cur.percentage, 0) / (subjects.length || 1)) * 60 + 4500)));

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
        technicalDetail: simulatedTechnicalDetail,
      },
    },
    remedialPlan: [
      { day: "شنبه", morningPlan: "مطالعه مفهومی کتاب درسی و تصاویر زیست‌شناسی تجربی / فرمول قرابت ریاضی", afternoonPlan: "حل ۳۵ تست شبیه‌ساز کنکور سراسری و بررسی تشریحی مباحث خطاکار", totalQuestions: 35 },
      { day: "یکشنبه", morningPlan: "مرور ساختارمند مباحث شیمی آلی یا مسائل تابع حسابان", afternoonPlan: "عارضه‌یابی اشتباهات محاسباتی آزمون قبل با کمک مربی هوشمند (۳۰ تست)", totalQuestions: 30 },
      { day: "دوشنبه", morningPlan: "مطالعه مبحث فیزیک حرکت‌شناسی و مدارهای موازی جریان", afternoonPlan: "تست‌زنی موضوعی برای هماهنگی چشم و مغز در مهار تله‌ها (۲۵ تست)", totalQuestions: 25 },
      { day: "سه‌شنبه", morningPlan: "مرور عربی تخصصی یا آرایه‌های ادبی و واژه‌شناسی", afternoonPlan: "شبیه‌ساز کوچک موازی دروس پرضریب کنکور (۴۰ تست)", totalQuestions: 40 },
      { day: "چهارشنبه", morningPlan: "تحلیل الگوهای فرسودگی تمرکز ذهن و روش‌های تندخوانی", afternoonPlan: "حل پکیج تستی جامع و زمان‌دار تجربی/ریاضی/انسانی (۴۵ تست)", totalQuestions: 45 },
      { day: "پنجشنبه", morningPlan: "مرور خلاصه‌نویسی‌های طلایی و یادداشت‌برداری‌های تله‌شناسی", afternoonPlan: "ثبت آمارهای روزهای گذشته در کارتابل ترنم مهر جهت تطبیق مربی ناظر (۲۰ تست)", totalQuestions: 20 },
      { day: "جمعه", morningPlan: "پیش‌آزمون آزمایشی، پایش تراز فرضی و هماهنگی روانشناسی با درگاه والدین", afternoonPlan: "ریکاوری روحی، پیاده‌روی دور از استرس و خودآموزی کایزن مطالعاتی (۱۰ تست)", totalQuestions: 10 },
    ],
    estimatedNextTraz: nextTraz + 250,
  };
}

function getOfflinePsychologyAnalysis(qAnxiety: number, qFocus: number, qPerfectionism: number, qSleep: number, qStamina: number, context?: any) {
  const focusIndex = Math.min(100, Math.max(10, qFocus * 10));
  const resilience = Math.min(100, Math.max(10, Math.round((10 - qAnxiety) * 5 + qStamina * 5)));
  const academicDrive = 85;
  const stamina = Math.min(100, Math.max(10, qStamina * 10));
  const anxietyManagement = Math.min(100, Math.max(10, Math.round((10 - qAnxiety) * 10)));
  const sleepEfficacy = Math.min(100, Math.max(10, qSleep * 10));
  const stressLevel = Math.min(98, Math.max(10, Math.round(qAnxiety * 4 + qPerfectionism * 3 + (10 - qSleep) * 3)));

  const city = context?.city || "شهر فعلی";
  const goal = context?.mainGoal || "موفقیت در کنکور";

  return {
    cognitiveProfile: { focusIndex, resilience, academicDrive, stamina, anxietyManagement, sleepEfficacy },
    stressLevel,
    diagnosis: `داستان پایداری شما از ${city} آغاز می‌شود. با وجود چالش‌های خانوادگی و رویای ${goal}، شما در حصار کمال‌گرایی تستی گرفتار شده‌اید. تنش ${stressLevel}٪ شما نشان از یک مبارزه خاموش برای تغییر سرنوشت مالی و اجتماعی است. 🦋`,
    cognitiveTrap: qFocus < 5 ? "🧠 تله فروپاشی تمرکز در هیاهوی دغدغه‌های شخصی" : "⚖️ تله سنگینی بار مسئولیت و اضطراب آینده",
    remedies: [
      `🏰 قلعه تمرکز: ایجاد یک حریم ایزوله در محیط خانه برای مهار تنش‌های محیطی و خانوادگی.`,
      `💎 استراتژی ثروت ذهنی: مدیریت دقیق قوای روانی برای دروس پرتراکم و دوری از حواشی مالی.`,
      `📈 گام‌های کایزن: پیشرفت پله‌پله بدون غرق شدن در عظمت هدف نهایی.`,
    ],
    meditationAdvice: "🌌 تمرین تجسم پیروزی: تصور لحظه اعلام نتایج و لبخند رضایت شما در حالی که تمام محدودیت‌ها را شکسته‌اید.",
    breathingPaceSec: 4,
  };
}

/* ----------------------------------------------------------------------------
 * Route handlers
 * ------------------------------------------------------------------------- */

function health(): Response {
  return json({ status: "ok", industry: "High School Education & Konkur Prep", brand: "ترنم همدلی", time: new Date().toISOString() });
}

function aiStatus(env: Env): Response {
  return json({
    status: "online",
    models: ["gemini-3.5-flash", "gemini-3.1-pro-preview"],
    hasServerGeminiKey: !!(env.GEMINI_API_KEY && env.GEMINI_API_KEY.includes("AIzaSy") && env.GEMINI_API_KEY.length > 10),
    hasServerOpenRouterKey: !!(env.OPENROUTER_API_KEY && env.OPENROUTER_API_KEY.startsWith("sk-") && env.OPENROUTER_API_KEY.length > 10),
    hasHuggingFace: !!(env.HF_TOKEN && env.HF_TOKEN.startsWith("hf_") && env.HF_TOKEN.length > 10),
    huggingFaceModel: env.HF_MODEL || "meta-llama/Llama-3.3-70B-Instruct:featherless-ai",
    hasWandb: !!(env.WANDB_API_KEY && env.WANDB_API_KEY.length > 10),
    examRagUrl: env.EXAM_RAG_URL || "https://sosa123454321-taranom-exam-rag.static.hf.space",
  });
}

/** Hugging Face + W&B + RAG status for the admin panel. */
async function hfStatus(env: Env): Promise<Response> {
  const hasHf = !!(env.HF_TOKEN && env.HF_TOKEN.startsWith("hf_") && env.HF_TOKEN.length > 10);
  const model = env.HF_MODEL || "meta-llama/Llama-3.3-70B-Instruct:featherless-ai";
  let inferenceOk = false;
  let inferenceError = "";
  let inferenceSample = "";
  let inferenceMs: number | null = null;

  if (hasHf) {
    const start = performance.now();
    try {
      const resp = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.HF_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: "سلام" }], max_tokens: 12 }),
      });
      inferenceMs = Math.round(performance.now() - start);
      if (resp.ok) {
        const data: any = await resp.json();
        inferenceSample = data.choices?.[0]?.message?.content || "";
        inferenceOk = true;
      } else {
        inferenceError = `HTTP ${resp.status}: ${(await resp.text()).slice(0, 160)}`;
      }
    } catch (e: any) {
      inferenceError = e?.message || String(e);
    }
  }

  return json({
    huggingface: {
      configured: hasHf,
      tokenMasked: hasHf ? `${env.HF_TOKEN!.substring(0, 6)}...${env.HF_TOKEN!.slice(-4)}` : null,
      model,
      inferenceReachable: inferenceOk,
      inferenceError,
      inferenceSample: inferenceSample.slice(0, 200),
      inferenceMs,
      note: !hasHf ? "HF_TOKEN not set" : (!inferenceOk ? "Token may lack 'Make calls to Inference Providers' permission, or model is gated." : "Live Llama inference OK"),
    },
    wandb: { configured: !!(env.WANDB_API_KEY && env.WANDB_API_KEY.length > 10), project: "taranom-exam-rag" },
    examRag: { configured: true, url: env.EXAM_RAG_URL || "https://sosa123454321-taranom-exam-rag.static.hf.space" },
    workersAi: await (async () => {
      let chatOk = false, chatErr = "", sample = "";
      try {
        if (env.AI) {
          const out: any = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", { messages: [{ role: "user", content: "سلام" }], max_tokens: 16 });
          sample = (out?.response || out?.choices?.[0]?.message?.content || "").slice(0, 60);
          chatOk = !!sample;
          if (!chatOk) chatErr = "empty: " + JSON.stringify(out).slice(0, 120);
        } else chatErr = "no AI binding";
      } catch (e: any) { chatErr = (e?.message || String(e)).slice(0, 140); }
      return { configured: !!env.AI, chatModel: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", embeddingModel: "@cf/baai/bge-m3", semanticRag: !!env.AI, chatOk, chatErr, sample };
    })(),
  });
}

async function motivational(ctx: Ctx, meta: RespMeta): Promise<Response> {
  const quotes = [
    "اعتبار ترنم همدلی در طول سالیان، حاصل ممارست فرزندان شایسته‌ای است که امروز رتبه‌های برتر دانشگاه‌های تهران، شریف و بهشتی کشور هستند. به پالس‌های تلاش روزانه خود وفادار بمانید!",
    "تلاش متعهدانه ثمر خواهد داد. خواندن خط‌به‌خط تصویر زیست یا دست‌ورزی مسئله فیزیک، پله‌ای برای پزشک، مهندس یا رتبه برتر شدن است.",
    "هر کارنامه آزمایشی در سامانه ترنم همدلی، یک نقشه دقیق مربی‌گری کایزن برای غلبه تدریجی بر تله‌های طراحان ماهر کنکور است. شجاعانه ادامه دهید!",
    "تراز کمال علمی حاصل تصادف و بخت نیست؛ بلکه فرآیند مداوم بهسازی عادات، مهار نمره‌های منفی و انگیزه درخشیدن شماست. پرانرژی ماراتن را مهار کنید!",
    "شما مجهز به برترین تکنولوژی مربی‌گری و روانشناسی تحصیلی هستید. از هر پومودوروی مطالعاتی برای پیشی گرفتن از رقبای خسته خود استفاده کنید.",
  ];

  try {
    const body = await readJson(ctx.request);
    const ai = getAI(ctx.request, body, ctx.env, meta);
    if (!ai) {
      return json({ quote: quotes[Math.floor(Math.random() * quotes.length)] }, 200, meta.headers);
    }
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: "یک جمله انگیزشی صمیمی، همدلانه، خلاقانه، عاطفی، علمی و روان‌شناختی مناسب داوطلبان کنکور سراسری ایران (تجربی، ریاضی، انسانی) برای نصب در بالای پرتال آموزشی 'ترنم مهر' بنویس. شیوه کایزن، تعهد به پیشرفت تدریجی و با هم بودن تا هدف نهایی را تداعی کند. لحن صمیمی و عمیق فارسی داشته باشد، بدون پیشوند و پسوند." }] }],
    });
    return json({ quote: response.text?.trim() || quotes[Math.floor(Math.random() * quotes.length)] }, 200, meta.headers);
  } catch (_) {
    return json({ quote: quotes[Math.floor(Math.random() * quotes.length)] });
  }
}

async function chat(ctx: Ctx, meta: RespMeta): Promise<Response> {
  const body = await readJson(ctx.request);
  if (body?.testPing) return json({ status: "ok" });

  const { message, history } = body;
  if (!message) return json({ error: "MESSAGE_REQUIRED", reply: "پیامی دریافت نشد." }, 400);

  try {
    // 🧠 RAG معنایی مشترک با ربات‌ها: بازیابی سوالات مرتبط کنکور از بانک HF Space
    const rag = await botRagContext(ctx.env, message);

    const systemInstructionBase = `شما 'دکتر رادان'، همراه همدل و مشاور برنامه‌ریزی تحصیلی در موسسه 'ترنم همدلی' هستید.
تخصص شما: کنکور سراسری ایران، تحلیل روند یادگیری، عارضه‌یابی اشتباهات تسی، و روانشناسی یادگیری.
ویژگی‌های شخصیتی: همدل، صبور، بسیار خوش‌صحبت به زبان فارسی، حامی واقعی، و در عین حال دقیق و راهنما.
هدف: داوطلب را برای رشدی پایدار و رسیدن به اهداف تحصیلی‌اش با آرامش هدایت کنید.
قوانین پاسخ‌دهی:
۱. پاسخ‌ها باید عمیق، دلسوزانه و به شدت کاربردی باشند.
۲. بصورت کاملاً هوشمند و واکنشی به پیام کاربر پاسخ دهید. اگر کاربر شوخی کرد یا پیام نامفهومی فرستاد، صمیمانه و مثل یک همراه واقعی واکنش نشان دهید.
۳. از اصطلاحات فنی کنکور در جای مناسب و با لحنی آرام‌بخش استفاده کنید.
۴. حداکثر در ۳ پاراگراف پاسخ دهید.
۵. از ایموجی‌های مناسب (📚, 🌱, ✨, 💡) استفاده کنید.`;
    const systemInstruction = rag.context
      ? `${systemInstructionBase}\n\nسوالات مرتبط از بانک رسمی کنکور (در صورت ارتباط با پرسش کاربر، با ذکر سال به آن‌ها استناد کن):\n${rag.context}`
      : systemInstructionBase;

    const related = rag.hits.map((h) => ({ question: h.q, year: h.y, subject: h.s, field: h.f }));

    // مسابقه موازی دو Llama-70B (HF + Workers AI) — سریع‌ترین موفق؛ سپس Gemini/OpenRouter؛ سپس آفلاین
    {
      const race = await bestAiReply(ctx.env, systemInstruction, message);
      if (race) return json({ reply: race.text, engine: race.engine, ragMode: rag.mode, related }, 200, meta.headers);
    }

    const ai = getAI(ctx.request, body, ctx.env, meta);
    if (!ai) {
      return json({ reply: getOfflineChatReply(message), ragMode: rag.mode, related }, 200, meta.headers);
    }

    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const chatSession = ai.chats.create({ model: "gemini-3.5-flash", history: formattedHistory, config: { systemInstruction } });
    const result = await chatSession.sendMessage({ message });
    const reply = result.text?.trim();
    if (!reply) throw new Error("Empty reply from Gemini");
    return json({ reply, engine: "gemini", ragMode: rag.mode, related }, 200, meta.headers);
  } catch (error: any) {
    const errStr = (error?.message || error?.toString() || "").toLowerCase();
    const rawErrorMsg = error?.message || error?.toString() || "Unknown server-side Gemini API or network error";

    let fallbackReply = "";
    if (errStr.includes("resource_exhausted") || errStr.includes("quota") || errStr.includes("429")) {
      fallbackReply = "⚠️ همکار/کاربر ارجمند، سقف مجاز استفاده از کلید هوش مصنوعی (Quota Exceeded) در این لحظه به پایان رسیده است.\n\nاز آنجایی که کلید وارد شده احتمالاً از نوع رایگان (Free Tier) است، با محدودیت‌های تعدادی درخواست از سمت گوگل مواجه شده است. شبکه برای جلوگیری از اختلال در کارنامه شما، به صورت خودکار به موتور آفلاین کایزن منتقل شده است.\n\nبرای ارتباط زنده، لطفاً دقایقی بعد تلاش کنید یا یک کلید رایگان جدید در بخش ادمین ثبت نمایید. ❤️";
    } else if (errStr.includes("leaked") || errStr.includes("403") || errStr.includes("401") || errStr.includes("unauthenticated") || errStr.includes("permission_denied") || errStr.includes("permission denied") || errStr.includes("suspended") || errStr.includes("compromised") || errStr.includes("invalid authentication")) {
      fallbackReply = "⚠️ همراه گرامی، کلید دسترسی (API Key) پیش‌فرض سرور یا مرورگر شما با محدودیت مواجه شده است.\n\nمن دکتر رادان هستم. نگران نباشید! برای فعال‌سازی کامل و برقراری ارتباط زنده با مدل‌های هوشمند Gemini، می‌توانید یک کلید رایگان از Google AI Studio دریافت کرده و در بخش تنظیمات فنی ثبت کنید.\n\nسیستم در حال حاضر با استفاده از شبیه‌سازهای حرفه‌ای و همدلانه فعال است تا هیچ وقفه‌ای در مسیر یادگیری شما ایجاد نشود. ❤️";
    } else {
      fallbackReply = getOfflineChatReply(message);
    }
    return json({ reply: fallbackReply, isOfflineFallback: true, error: rawErrorMsg }, 200, meta.headers);
  }
}

async function goalInsight(ctx: Ctx, meta: RespMeta): Promise<Response> {
  const body = await readJson(ctx.request);
  if (body?.testPing) return json({ status: "ok" });
  const { student, currentTraz, currentPercentage, targetTraz, targetGrowth, latestQuizScore } = body;

  try {
    const fieldName = student?.field === "tajrobi" ? "علوم تجربی" : student?.field === "riazi" ? "ریاضی فیزیک" : "علوم انسانی";
    const targetPercentage = (currentPercentage || 59) + (targetGrowth || 10);

    const ai = getAI(ctx.request, body, ctx.env, meta);
    if (!ai) {
      return json(getOfflineGoalInsight(student, currentTraz, currentPercentage, targetTraz, targetGrowth, latestQuizScore), 200, meta.headers);
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
  "likelihood": 72,
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
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const textOutput = response.text?.trim() || "{}";
    const cleanedText = textOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
    return json(JSON.parse(cleanedText), 200, meta.headers);
  } catch (_) {
    return json(getOfflineGoalInsight(student, currentTraz, currentPercentage, targetTraz, targetGrowth, latestQuizScore));
  }
}

async function analyzeExam(ctx: Ctx, meta: RespMeta): Promise<Response> {
  const body = await readJson(ctx.request);
  if (body?.testPing) return json({ status: "ok" });
  const { lessons, field, student } = body;

  try {
    const ai = getAI(ctx.request, body, ctx.env, meta);
    if (!ai) return json(getOfflineExamAnalysis(lessons, field), 200, meta.headers);

    const priorityInfo = student?.priorityTopics ? `\n- مباحث دارای اولویت و ضعیف (اعلامی داوطلب): ${student.priorityTopics}` : "";
    const prompt = `یک کارنامه آزمون آزمایشی داوطلب کنکور سراسری با متغیرهای لاین تخصصی '${field}' دریافت شده است که آمارهای ممیزی پاسخ‌دهی به قرار زیر است:
${JSON.stringify(lessons, null, 2)}${priorityInfo}

لطفا یک تحلیل تخصصی مربی‌گری، روانشناسی آزمون، عارضه‌یابی درصد ممیزی‌ها به فرمت JSON دقیقا با ساختار زیر تهیه کنید. صمیمی و فنی بر اساس متدهای پیشرفته کایزن تحصیلی ترنم مهر طراحی شده باشد. به زبان فارسی شیوا پاسخ دهید:
{
  "weaknesses": [
    {
      "topic": "نام مبحث درسی آسیب‌دیده با جزئیات کامل",
      "subject": "نام درس تخصصی آسیب‌دیده مربوطه",
      "percentage": 30,
      "recommendation": "پیشنهادی جامع و دلسوزانه برای رفع تله تستی",
      "questionsCount": 40,
      "severity": "warning"
    }
  ],
  "psychological": {
    "pattern": "نام الگوی کاهش تمرکز ذهن داوطلب",
    "description": "تحلیل روانشناختی و ریتم مطالعاتی رفتار داوطلب در ۲ جمله",
    "correctToWrongRate": 42,
    "suggestion": "پیشنهاد مربی مشاور",
    "cardColor": "orange",
    "stressLevel": 55,
    "stressAnalysis": {
      "avgResponseTimeWrong": 75,
      "avgResponseTimeCorrect": 45,
      "consecutiveErrorsCount": 3,
      "stressLabel": "متوسط",
      "technicalDetail": "توضیح فنی کوتاه ۲ جمله‌ای فارسی"
    }
  },
  "remedialPlan": [
    { "day": "شنبه", "morningPlan": "...", "afternoonPlan": "...", "totalQuestions": 35 }
  ],
  "estimatedNextTraz": 8200
}

فقط کدهای خام JSON را بدون عبارت markdown مانند \`\`\`json برگردانید.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const textOutput = response.text?.trim() || "{}";
    const cleanedText = textOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
    return json(JSON.parse(cleanedText), 200, meta.headers);
  } catch (_) {
    return json(getOfflineExamAnalysis(lessons, field));
  }
}

async function psychologyAnalysis(ctx: Ctx, meta: RespMeta): Promise<Response> {
  const body = await readJson(ctx.request);
  if (body?.testPing) return json({ status: "ok" });
  const { student, qAnxiety, qFocus, qPerfectionism, qSleep, qStamina } = body;

  try {
    const ai = getAI(ctx.request, body, ctx.env, meta);
    if (!ai) return json(getOfflinePsychologyAnalysis(qAnxiety, qFocus, qPerfectionism, qSleep, qStamina, student), 200, meta.headers);

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
  "cognitiveProfile": { "focusIndex": 75, "resilience": 68, "academicDrive": 85, "stamina": 60, "anxietyManagement": 50, "sleepEfficacy": 70 },
  "stressLevel": 58,
  "diagnosis": "یک متن داستانی و صمیمی (حداکثر ۴ جمله) با استفاده از ایموجی.",
  "cognitiveTrap": "نام نمادین تله",
  "remedies": ["راهکار ۱", "راهکار ۲", "راهکار ۳"],
  "meditationAdvice": "توصیه آرامش‌بخش بر اساس هدف داوطلب",
  "breathingPaceSec": 4
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const textOutput = response.text?.trim() || "{}";
    const cleanedText = textOutput.replace(/```json/gi, "").replace(/```/g, "").trim();
    return json(JSON.parse(cleanedText), 200, meta.headers);
  } catch (_) {
    return json(getOfflinePsychologyAnalysis(qAnxiety, qFocus, qPerfectionism, qSleep, qStamina, student));
  }
}

/* --- ZarinPal payment --- */

async function paymentRequest(ctx: Ctx): Promise<Response> {
  const body = await readJson(ctx.request);
  if (body?.testPing) return json({ status: "ok" });
  const { amount, description, mobile, email, studentId } = body;
  const merchantId = ctx.env.ZARINPAL_MERCHANT_ID;
  const callbackUrl = ctx.env.ZARINPAL_CALLBACK_URL || `${ctx.env.APP_URL || ""}/api/payment/verify`;

  // Amount is required for a real payment (in Rial — Zarinpal uses Rial).
  const amountRial = Number(amount);
  if (!merchantId || merchantId === "" || merchantId === "undefined") {
    return json({
      status: 100,
      authority: "MOCK_AUTHORITY_" + Date.now(),
      url: `https://www.zarinpal.com/pg/StartPay/MOCK_AUTHORITY`,
    });
  }

  if (!amountRial || amountRial <= 0) {
    return json({ error: "مبلغ پرداخت نامعتبر است." }, 400);
  }

  // Sandbox mode: ZARINPAL_SANDBOX=true → use the sandbox API host.
  const apiHost = ctx.env.ZARINPAL_SANDBOX === "true" ? "sandbox.zarinpal.com" : "api.zarinpal.com";

  try {
    const resp = await fetch(`https://${apiHost}/pg/v4/payment/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant_id: merchantId, amount: amountRial, callback_url: callbackUrl, description, metadata: { mobile, email } }),
    });
    const data: any = await resp.json();
    if (data?.data && data.data.code === 100) {
      // Persist the amount keyed by authority so verify can confirm the exact amount.
      if (ctx.env.DB) {
        try {
          await ctx.env.DB.prepare(
            "INSERT INTO payment_sessions (authority, amount, student_id, created_at) VALUES (?,?,?,?)"
          ).bind(data.data.authority, amountRial, studentId || null, new Date().toISOString()).run();
        } catch (_) {}
      }
      return json({ status: 100, authority: data.data.authority, url: `https://${apiHost}/pg/StartPay/${data.data.authority}` });
    }
    return json({ error: "Failed to generate payment authority", details: data }, 400);
  } catch (error: any) {
    return json({ error: "Internal server error during payment request", detail: error?.message }, 500);
  }
}

async function paymentVerify(ctx: Ctx): Promise<Response> {
  const url = new URL(ctx.request.url);
  const Authority = url.searchParams.get("Authority") || "";
  const Status = url.searchParams.get("Status");
  const merchantId = ctx.env.ZARINPAL_MERCHANT_ID;

  if (Status !== "OK") return Response.redirect(`${url.origin}/?payment=failed`, 302);

  if (!merchantId || merchantId === "" || merchantId === "undefined") {
    return Response.redirect(`${url.origin}/?payment=success&refid=MOCK_REF_${Date.now()}`, 302);
  }

  // Recover the original amount for this authority from D1.
  let amount = 0;
  if (ctx.env.DB) {
    try {
      const row: any = await ctx.env.DB.prepare(
        "SELECT amount FROM payment_sessions WHERE authority = ?"
      ).bind(Authority).first();
      amount = Number(row?.amount || 0);
    } catch (_) {}
  }
  if (!amount) return Response.redirect(`${url.origin}/?payment=error`, 302);

  const apiHost = ctx.env.ZARINPAL_SANDBOX === "true" ? "sandbox.zarinpal.com" : "api.zarinpal.com";

  try {
    const resp = await fetch(`https://${apiHost}/pg/v4/payment/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant_id: merchantId, amount, authority: Authority }),
    });
    const data: any = await resp.json();
    if (data?.data && (data.data.code === 100 || data.data.code === 101)) {
      // Clean up the stored session after successful verification.
      if (ctx.env.DB) {
        try { await ctx.env.DB.prepare("DELETE FROM payment_sessions WHERE authority = ?").bind(Authority).run(); } catch (_) {}
      }
      return Response.redirect(`${url.origin}/?payment=success&refid=${data.data.ref_id}`, 302);
    }
    return Response.redirect(`${url.origin}/?payment=failed`, 302);
  } catch (_) {
    return Response.redirect(`${url.origin}/?payment=error`, 302);
  }
}

async function testAiConnection(ctx: Ctx, meta: RespMeta): Promise<Response> {
  const body = await readJson(ctx.request);
  const userKey = getSafeHeader(ctx.request, "x-gemini-key") || getSafeHeader(ctx.request, "x-openrouter-key") || body?.geminiKey || body?.openRouterKey;
  const testSection = body?.section || "chat";

  const activeKey = userKey || ctx.env.GEMINI_API_KEY || "";
  const isOpenRouter = activeKey.trim().startsWith("sk-or-");

  const responseData: any = {
    section: testSection,
    apiKeySource: userKey ? "Custom Client Key (LocalStorage)" : "Environment Secret (Cloudflare)",
    configuredModel: isOpenRouter ? "OpenRouter (GPT or other)" : "gemini-3.5-flash",
    activeKeyMasked: userKey
      ? `${userKey.substring(0, 7)}...${userKey.substring(userKey.length - 4)}`
      : ctx.env.GEMINI_API_KEY
      ? `${ctx.env.GEMINI_API_KEY.substring(0, 7)}...`
      : "ثبت نشده - اتصال آفلاین",
  };

  try {
    const ai = getAI(ctx.request, body, ctx.env, meta);
    if (!ai) {
      responseData.connected = false;
      responseData.errorMessage = "کلید دسترسی معتبری از گوگل برای راه‌اندازی یافت نشد. سیستم در وضعیت آفلاین (نظیره‌یابی کایزن) قرار دارد.";
      responseData.fallbackUsed = "شبیه‌ساز آفلاین هوشمند آکادمی ترنم";
      return json(responseData, 200, meta.headers);
    }

    let promptSample = "در ۳ کلمه بگو مربی کایزن ترنم مهر چه تاثیری دارد؟";
    if (testSection === "goal") promptSample = "ماژول تخمین شانس قبولی متصل است؟ در ۳ کلمه بگو.";
    else if (testSection === "exam") promptSample = "ماژول عارضه‌یابی کارنامه زیست متصل است؟ در ۳ کلمه بگو.";
    else if (testSection === "psychology") promptSample = "ماژول قصه درمانی و مهار کمال‌گرایی متصل است؟ در ۳ کلمه بگو.";
    else if (testSection === "motivational") promptSample = "ماژول شعار و الهام روزانه متصل است؟ در ۳ کلمه بگو.";

    const start = performance.now();
    const response = await ai.models.generateContent({ model: "gemini-3.5-flash", contents: promptSample });
    const elapsed = (performance.now() - start).toFixed(0);

    responseData.connected = true;
    responseData.responseTimeMs = parseInt(elapsed);
    responseData.sampleReply = response.text?.trim() || "اتصال موفق ولی فاقد خروجی متنی";
    responseData.actualModelUsed = userKey?.startsWith("sk-or-") ? "OpenRouter Models" : "Google Gemini 3.5 Flash";
    return json(responseData, 200, meta.headers);
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
    return json(responseData, 200, meta.headers);
  }
}

async function sandbox(ctx: Ctx): Promise<Response> {
  const body = await readJson(ctx.request);
  let { provider, apiKey, prompt } = body;
  const keyToUse = apiKey || ctx.env.GEMINI_API_KEY;

  if (!prompt || typeof prompt !== "string") return json({ success: false, error: "Prompt is required." }, 400);
  if (!keyToUse) return json({ success: false, error: "لطفا ابتدا یک کلید دسترسی معتبر (API Key) ثبت کنید." }, 400);

  const start = performance.now();
  try {
    let adapterType = provider;
    if (keyToUse.trim().startsWith("sk-or-")) adapterType = "OpenRouter";

    if (adapterType === "Google Gemini" || adapterType === "OpenRouter" || !adapterType) {
      const tempAi = new AIAdapter(keyToUse);
      const result = await tempAi.models.generateContent({ model: "gemini-3.5-flash", contents: prompt });
      return json({
        success: true,
        reply: result.text || "پاسخ خالی است.",
        responseTimeMs: Math.round(performance.now() - start),
        model: adapterType === "OpenRouter" ? "OpenRouter Endpoint" : "Gemini 3.5 Flash",
      });
    }
    return json({ success: false, error: `پروایدر ${adapterType} هنوز پشتیبانی نمی‌شود.` }, 400);
  } catch (err: any) {
    let errorMsg = err.message || "خطای ناشناخته";
    if (err?.status === 401 || err?.status === 403 || errorMsg.includes("API_KEY_INVALID")) {
      errorMsg = "کلید API نامعتبر است یا منقضی شده است. لطفا کلید را بررسی کنید.";
    }
    return json({ success: false, error: errorMsg, responseTimeMs: Math.round(performance.now() - start) }, 500);
  }
}

async function testProvider(ctx: Ctx): Promise<Response> {
  const body = await readJson(ctx.request);
  const { provider, apiKey } = body;
  if (!apiKey) return json({ valid: false, error: "API Key is missing." }, 400);

  const start = performance.now();
  try {
    if (provider === "Google Gemini" || provider === "OpenRouter") {
      const tempAi = new AIAdapter(apiKey);
      await tempAi.models.generateContent({ model: "gemini-3.5-flash", contents: "test" });
      return json({ valid: true, responseTimeMs: parseInt((performance.now() - start).toFixed(0)) });
    } else if (provider === "OpenAI") {
      const resp = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${apiKey}` } });
      if (!resp.ok) throw new Error("Invalid OpenAI API Key");
      return json({ valid: true, responseTimeMs: parseInt((performance.now() - start).toFixed(0)) });
    } else if (provider === "Anthropic") {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-3-haiku-20240307", max_tokens: 1, messages: [{ role: "user", content: "test" }] }),
      });
      if (resp.status === 401 || resp.status === 403) throw new Error("Invalid Anthropic API Key");
      return json({ valid: true, responseTimeMs: parseInt((performance.now() - start).toFixed(0)) });
    } else {
      await new Promise((r) => setTimeout(r, 600));
      return json({ valid: true, responseTimeMs: parseInt((performance.now() - start).toFixed(0)) });
    }
  } catch (error: any) {
    let errorMsg = "";
    if (typeof error?.message === "string") errorMsg = error.message;
    else if (typeof error === "string") errorMsg = error;
    else { try { errorMsg = JSON.stringify(error); } catch (_) { errorMsg = "Unknown error"; } }

    if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("quota") || errorMsg.includes("429")) {
      errorMsg = "سقف مجاز استفاده از این کلید به پایان رسیده است (Quota Exceeded). لطفا یک کلید جدید ایجاد کنید یا از حساب پولی استفاده کنید.";
    } else if (errorMsg.includes("PERMISSION_DENIED") || errorMsg.includes("Permission denied") || errorMsg.includes("suspended")) {
      errorMsg = "این کلید مسدود شده است (Suspended). لطفاً یک کلید جدید ایجاد کنید.";
    } else if (errorMsg.includes("API key not valid") || errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("UNAUTHENTICATED") || errorMsg.includes("invalid authentication")) {
      errorMsg = "کلید وارد شده نامعتبر است. لطفا کلید را به درستی کپی کنید.";
    } else if (errorMsg.includes("402") || errorMsg.includes("credits")) {
      errorMsg = "موجودی این حساب کافی نیست. لطفا حساب خود را در OpenRouter شارژ کنید.";
    }
    return json({ valid: false, error: errorMsg }, 400);
  }
}

/** AI module audit (ported from server.ts) — previously MISSING here, which
 *  made every deployed /api/audit-module call return 404. */
async function auditModule(ctx: Ctx, meta: RespMeta): Promise<Response> {
  const body = await readJson(ctx.request);
  const { moduleName, logs, selectedSubModules, type, history, healthLogs } = body;
  try {
    const ai = getAI(ctx.request, body, ctx.env, meta);
    if (!ai) return json({ suggestion: "سرویس هوش مصنوعی در دسترس نیست." }, 200, meta.headers);

    const logSummary = (logs || []).map((l: any) => `${l.timestamp}: ${l.action} - ${l.detail}`).join("\n");
    const healthLogSummary = healthLogs ? healthLogs.map((l: any) => `${l.timestamp}: ${l.type} - ${l.message}`).join("\n") : "";
    const historySummary = history && Array.isArray(history)
      ? `تحلیل‌های قبلی:\n${history.map((h: any) => (typeof h === "string" ? h : h.analysis)).join("\n---\n")}`
      : "";

    let systemInstruction = "";
    let userPrompt = "";

    if (type === "project") {
      systemInstruction = `شما یک مهندس ارشد قابلیت اطمینان سیستم (SRE) و تحلیلگر معماری هستید.
             وظیفه شما: ارائه یک تحلیل عمیق از دیدگاه SRE درباره سلامت کلی سیستم، شناسایی الگوهای خطا در لاگ‌ها، پیشنهاد بهبودهای زیرساختی و شناسایی نقاط گلوگاه احتمالی.
             پاسخ باید فنی، استراتژیک و مبتنی بر داده‌های ارائه شده باشد.`;
      userPrompt = `لاگ‌های سیستم:\n${logSummary}\n\nلاگ‌های سلامت عملکرد:\n${healthLogSummary}\n\nتحلیل‌های قبلی:\n${historySummary}\nلطفا وضعیت سلامت کلی سیستم را تحلیل کن و پیشنهاداتی برای پایداری و بهبود ارائه بده.`;
    } else {
      systemInstruction = `شما یک متخصص تحلیل خطا و بهبود کد هستید.
             وظیفه شما: تحلیل عمیق لاگ‌های ماژول ${moduleName}، بخش‌های انتخابی: ${selectedSubModules?.join(", ") || "همه موارد"}، شناسایی الگوهای تکرارشونده خطا، تحلیل ریشه‌ای (Root Cause Analysis)، و ارائه پیشنهادهای عملیاتی برای رفع خطاها و بهبود کارایی کد.`;
      userPrompt = `لاگ‌های ماژول ${moduleName}، بخش‌های انتخابی: ${selectedSubModules?.join(", ") || "همه موارد"}:\n${logSummary}\n\nلاگ‌های سلامت عملکرد:\n${healthLogSummary}\n\nتحلیل‌های قبلی:\n${historySummary}\nلطفا خطاها را کلاسترینگ کن (دسته‌بندی کن)، ریشه آن‌ها را شناسایی کن و راهکارهای فنی و مشخص برای بهبود ارائه بده.`;
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
        responseMimeType: "application/json",
      },
    });

    const resultText = response.text?.trim() || "{}";
    const cleanedText = resultText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const resultJson = JSON.parse(cleanedText);
    return json({ suggestion: resultJson }, 200, meta.headers);
  } catch (e: any) {
    const errorMessage = e?.message || "خطای نامشخص";
    return json({ suggestion: `خطا در اتصال به هوش مصنوعی: ${errorMessage}` }, 200, meta.headers);
  }
}

/* ----------------------------------------------------------------------------
 * Messenger bots (Telegram + Bale) — shared engine
 * - Real Konkur questions from the RAG Space (quiz-lite bank, cached in memory)
 * - Inline answer buttons (callback_query) with instant grading
 * - Reply keyboard menu, live /status backed by D1
 * ------------------------------------------------------------------------- */

interface BotQuizItem { q: string; o: string[]; a: number; y: string; s: string; f: string; l?: string; src?: string; kc?: string; pg?: number; qn?: number; }
let botQuizCache: { at: number; items: BotQuizItem[] } | null = null;

async function getBotQuizBank(env: Env): Promise<BotQuizItem[]> {
  if (botQuizCache && Date.now() - botQuizCache.at < 10 * 60 * 1000) return botQuizCache.items;
  try {
    const base = env.EXAM_RAG_URL || "https://sosa123454321-taranom-exam-rag.static.hf.space";
    const resp = await fetch(`${base}/data/quiz-lite.json`, { signal: AbortSignal.timeout(8000) } as any);
    if (resp.ok) {
      const itemsAll = (await resp.json()) as BotQuizItem[];
      // سوالاتی که کلیدشان در حال بازبینی است (kc=review) سرو نمی‌شوند
      const items = Array.isArray(itemsAll) ? itemsAll.filter((it) => it.kc !== "review") : [];
      if (items.length > 0) {
        botQuizCache = { at: Date.now(), items };
        return items;
      }
    }
  } catch (_) { /* fall through to built-in question */ }
  return [{
    q: "پمپ سدیم-پتاسیم به ازای خروج هر ۳ یون سدیم چند یون پتاسیم وارد می‌کند؟",
    o: ["۱ یون", "۲ یون", "۳ یون", "۴ یون"], a: 1, y: "1402", s: "زیست‌شناسی", f: "تجربی",
  }];
}

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
function faNum(n: number): string { return String(n).split("").map((c) => /\d/.test(c) ? FA_DIGITS[Number(c)] : c).join(""); }

/** منوی جمع‌وجور پایین (فقط ۱ ردیف) — بقیه امکانات در «☰ منو» به‌صورت دکمه شیشه‌ای تاشو. */
const BOT_MENU_KEYBOARD = {
  keyboard: [
    [{ text: "📝 تست" }, { text: "☰ منو" }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

/** منوی کامل تاشو (inline) — جای زیادی از صفحه نمی‌گیرد و با یک پیام باز/بسته می‌شود. */
const BOT_FULL_MENU_INLINE = {
  inline_keyboard: [
    [{ text: "📝 تست کنکور واقعی", callback_data: "menu:quiz" }, { text: "🤖 تست هوشمند RAG", callback_data: "menu:smart" }],
    [{ text: "📚 تست موضوعی (انتخاب درس)", callback_data: "menu:subjects" }, { text: "🗓 تست بر اساس سال", callback_data: "menu:years" }],
    [{ text: "📊 داشبورد من", callback_data: "qz:dash" }, { text: "🧠 تحلیل روانشناسی", callback_data: "menu:analysis" }],
    [{ text: "💬 مشاوره", callback_data: "menu:chat" }, { text: "📋 ثبت‌نام/تغییر رشته", callback_data: "menu:register" }],
    [{ text: "📜 تاریخچه من", callback_data: "menu:history" }, { text: "💳 اعتبار و خرید", callback_data: "menu:credit" }],
    [{ text: "🎬 دبیر و دوره رایگان", callback_data: "menu:courses" }, { text: "🌐 ورود به سایت", callback_data: "menu:sitelogin" }],
    [{ text: "📈 تحلیل ساختار کنکور", callback_data: "menu:structure" }],
    [{ text: "📈 وضعیت", callback_data: "menu:status" }, { text: "ℹ️ راهنما", callback_data: "menu:help" }],
  ],
};

/* --- بازیابی معنایی (Semantic RAG): امبدینگ‌های بانک روی HF Space + مدل bge-m3 در Workers AI --- */
let botEmbCache: { at: number; dims: number; vectors: Float32Array[] } | null = null;

function decodeQuantVec(b64: string, dims: number): Float32Array {
  const bin = atob(b64);
  const v = new Float32Array(dims);
  for (let i = 0; i < dims; i++) {
    let x = bin.charCodeAt(i);
    if (x > 127) x -= 256;
    v[i] = x / 127;
  }
  return v;
}

async function getBotEmbeddings(env: Env): Promise<{ dims: number; vectors: Float32Array[] } | null> {
  if (botEmbCache && Date.now() - botEmbCache.at < 30 * 60 * 1000) return botEmbCache;
  try {
    const base = env.EXAM_RAG_URL || "https://sosa123454321-taranom-exam-rag.static.hf.space";
    const resp = await fetch(`${base}/data/quiz-embeddings.json`, { signal: AbortSignal.timeout(10000) } as any);
    if (!resp.ok) return null;
    const data: any = await resp.json();
    const vectors = (data.vectors as string[]).map((b: string) => decodeQuantVec(b, data.dims));
    botEmbCache = { at: Date.now(), dims: data.dims, vectors };
    return botEmbCache;
  } catch (_) { return null; }
}

/* پروفایل‌های روند ساختار کنکور (تولیدشده از بانک + تحلیل AI، ذخیره روی HF Space) */
let structProfCache: { at: number; profiles: any[] } | null = null;
async function getStructureProfiles(env: Env): Promise<any[]> {
  if (structProfCache && Date.now() - structProfCache.at < 60 * 60 * 1000) return structProfCache.profiles;
  try {
    const base = env.EXAM_RAG_URL || "https://sosa123454321-taranom-exam-rag.static.hf.space";
    const resp = await fetch(`${base}/data/exam-structure-profiles.json`, { signal: AbortSignal.timeout(8000) } as any);
    if (!resp.ok) return [];
    const data: any = await resp.json();
    structProfCache = { at: Date.now(), profiles: data.profiles || [] };
    return structProfCache.profiles;
  } catch (_) { return []; }
}

function cosineSim(a: Float32Array, b: Float32Array): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

/** امبدینگ کوئری کاربر با Workers AI (bge-m3 چندزبانه) — فقط با باینده AI. */
async function embedQuery(env: Env, text: string): Promise<Float32Array | null> {
  try {
    if (!env.AI) return null;
    const out: any = await env.AI.run("@cf/baai/bge-m3", { text: [text.slice(0, 512)] });
    const vec: number[] | undefined = out?.data?.[0];
    return vec ? Float32Array.from(vec) : null;
  } catch (_) { return null; }
}

/** بازیابی سوالات مرتبط از بانک RAG — اول معنایی (امبدینگ)، بعد واژگانی (fallback). */
async function botRagContext(env: Env, userText: string): Promise<{ context: string; hits: BotQuizItem[]; mode: string }> {
  try {
    const bank = await getBotQuizBank(env);

    // ۱) مسیر معنایی: Workers AI embeddings + بردارهای از پیش محاسبه‌شده روی HF Space
    const [emb, qVec] = await Promise.all([getBotEmbeddings(env), embedQuery(env, userText)]);
    if (emb && qVec) {
      if (emb.vectors.length !== bank.length) {
        // عدم تطابق بردار/بانک = امبدینگ‌ها کهنه‌اند؛ فقط تا حداقل مشترک پیش برو (به‌جای مرگ کامل مسیر معنایی)
        console.warn(`RAG embeddings/bank mismatch: ${emb.vectors.length} vs ${bank.length}`);
      }
      const n = Math.min(emb.vectors.length, bank.length);
      const scored = [] as { item: BotQuizItem; score: number }[];
      for (let i = 0; i < n; i++) scored.push({ item: bank[i], score: cosineSim(qVec, emb.vectors[i]) });
      const top = scored.sort((a, b) => b.score - a.score).slice(0, 3).filter((x) => x.score > 0.45);
      if (top.length > 0) {
        const ctxLines = top.map(({ item }, i) =>
          `${i + 1}) [کنکور ${item.y} — ${item.s}${item.pg ? ` ص${item.pg}` : ""}] ${item.q}\nگزینه‌ها: ${item.o.join(" | ")}\nپاسخ صحیح: ${item.o[item.a] || "-"}`);
        return { context: ctxLines.join("\n\n"), hits: top.map((x) => x.item), mode: emb.vectors.length === bank.length ? "semantic" : "semantic-partial" };
      }
    }

    // ۲) مسیر واژگانی (وقتی AI binding نیست یا امتیاز معنایی پایین بود)
    const norm = (s: string) => (s || "")
      .replace(/[يك]/g, (c) => (c === "ي" ? "ی" : "ک"))
      .replace(/[\u200c\u200f]/g, " ")
      .toLowerCase();
    const qTokens = norm(userText).split(/[\s،؟?!.:()«»"']+/).filter((t) => t.length >= 3);
    if (qTokens.length === 0) return { context: "", hits: [], mode: "none" };
    const scored = bank.map((item) => {
      const hay = norm(item.q + " " + item.s + " " + item.o.join(" "));
      let score = 0;
      for (const t of qTokens) if (hay.includes(t)) score += t.length;
      return { item, score };
    }).filter((x) => x.score >= 6).sort((a, b) => b.score - a.score).slice(0, 3);
    if (scored.length === 0) return { context: "", hits: [], mode: "none" };
    const ctxLines = scored.map(({ item }, i) =>
      `${i + 1}) [کنکور ${item.y} — ${item.s}] ${item.q}\nگزینه‌ها: ${item.o.join(" | ")}\nپاسخ صحیح: ${item.o[item.a] || "-"}`);
    return { context: ctxLines.join("\n\n"), hits: scored.map((x) => x.item), mode: "lexical" };
  } catch (_) {
    return { context: "", hits: [], mode: "error" };
  }
}

/** مسابقه موازی بین موتورهای AI — اولین جواب غیرخالی برنده است (کمترین تاخیر برای بات‌ها). */
function firstAiSuccess(promises: Promise<{ text: string; engine: string } | null>[]): Promise<{ text: string; engine: string } | null> {
  return new Promise((resolve) => {
    let pending = promises.length;
    let done = false;
    if (pending === 0) return resolve(null);
    for (const p of promises) {
      p.then((v) => {
        pending--;
        if (!done && v && v.text) { done = true; resolve(v); }
        else if (pending === 0 && !done) resolve(null);
      }).catch(() => { pending--; if (pending === 0 && !done) resolve(null); });
    }
  });
}

/** بهترین پاسخ AI: HF Llama-70B و Workers AI Llama-70B همزمان اجرا می‌شوند؛ سریع‌ترینِ موفق برمی‌گردد. */
async function bestAiReply(env: Env, sys: string, userText: string): Promise<{ text: string; engine: string } | null> {
  const racers: Promise<{ text: string; engine: string } | null>[] = [];
  if (env.HF_TOKEN && env.HF_TOKEN.startsWith("hf_")) {
    racers.push(
      huggingFaceGenerate(env.HF_TOKEN, env.HF_MODEL || "meta-llama/Llama-3.3-70B-Instruct:featherless-ai",
        { contents: [{ role: "user", parts: [{ text: userText }] }], config: { systemInstruction: sys, maxOutputTokens: 384 } })
        .then((r) => (r.text?.trim() ? { text: r.text.trim(), engine: "hf-llama-70b" } : null))
        .catch(() => null)
    );
  }
  racers.push(
    workersAiChat(env, sys, userText)
      .then((t) => (t ? { text: t, engine: "workers-ai-llama-70b" } : null))
      .catch(() => null)
  );
  return firstAiSuccess(racers);
}

/** پاسخ‌گویی با Workers AI (لاما ۸B روی خود کلودفلر — بدون وابستگی خارجی، سریع و رایگان). */
async function workersAiChat(env: Env, sys: string, userText: string): Promise<string> {
  if (!env.AI) return "";
  const WAI_MODELS = ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/mistralai/mistral-small-3.1-24b-instruct"];
  for (const m of WAI_MODELS) {
    try {
      const out: any = await env.AI.run(m, {
        messages: [{ role: "system", content: sys }, { role: "user", content: userText }],
        max_tokens: 384,
      });
      const t = (out?.response || out?.choices?.[0]?.message?.content || "").trim();
      if (t) return t;
    } catch (_) { /* مدل بعدی */ }
  }
  return "";
}
async function logBotQuizAnswer(
  env: Env, platform: string, chatId: string | number,
  item: BotQuizItem | null, correct: boolean
): Promise<void> {
  try {
    if (!env.DB) return;
    await env.DB.prepare(
      "INSERT INTO bot_quiz_log (id, platform, chat_id, subject, field, year, correct, created_at) VALUES (?,?,?,?,?,?,?,?)"
    ).bind(
      randomToken(12), platform, String(chatId),
      item?.s || null, item?.f || null, item?.y || null,
      correct ? 1 : 0, new Date().toISOString()
    ).run();
  } catch (_) { /* silent */ }
}

interface BotQuizStats {
  total: number; correct: number;
  bySubject: { subject: string; total: number; correct: number }[];
  last10: number[]; // 1/0 آخرین ۱۰ پاسخ (جدید → قدیم)
}

/** آمار تست‌های یک کاربر ربات از D1. */
async function getBotQuizStats(env: Env, platform: string, chatId: string | number): Promise<BotQuizStats | null> {
  try {
    if (!env.DB) return null;
    const cid = String(chatId);
    const tot: any = await env.DB.prepare(
      "SELECT COUNT(*) n, SUM(correct) c FROM bot_quiz_log WHERE platform=? AND chat_id=?"
    ).bind(platform, cid).first();
    if (!tot || !tot.n) return { total: 0, correct: 0, bySubject: [], last10: [] };
    const subj: any = await env.DB.prepare(
      "SELECT subject, COUNT(*) n, SUM(correct) c FROM bot_quiz_log WHERE platform=? AND chat_id=? AND subject IS NOT NULL GROUP BY subject ORDER BY n DESC LIMIT 8"
    ).bind(platform, cid).all();
    const last: any = await env.DB.prepare(
      "SELECT correct FROM bot_quiz_log WHERE platform=? AND chat_id=? ORDER BY created_at DESC LIMIT 10"
    ).bind(platform, cid).all();
    return {
      total: Number(tot.n), correct: Number(tot.c || 0),
      bySubject: (subj.results || []).map((r: any) => ({ subject: r.subject, total: Number(r.n), correct: Number(r.c || 0) })),
      last10: (last.results || []).map((r: any) => Number(r.correct)),
    };
  } catch (_) { return null; }
}

function progressBar(pct: number): string {
  const filled = Math.round(pct / 10);
  return "▰".repeat(filled) + "▱".repeat(10 - filled);
}

/** 📊 داشبورد شخصی کاربر ربات — نسخه گرافیکی با پروگرس‌بار قبل از هر نتیجه. */
function buildBotDashboard(st: BotQuizStats, profile?: BotProfile | null): string {
  if (st.total === 0) {
    return "📊 داشبورد من\n\nهنوز تستی نزده‌ای! دکمه «📝 تست» را بزن تا اولین سوال بیاید — بعد از چند تست، اینجا کارنامه گرافیکی می‌بینی.";
  }
  const pct = Math.round((100 * st.correct) / st.total);
  const grade = pct >= 80 ? "🏆 عالی" : pct >= 60 ? "🥇 خوب" : pct >= 40 ? "🥈 قابل قبول" : "🥉 نیاز به تلاش";
  const who = profile && profile.step === "done"
    ? `👤 ${profile.name || ""}${(profile as any).last_name ? " " + (profile as any).last_name : ""} | 📚 ${profile.field} | 🎓 ${profile.grade}\n`
    : "";
  const lines = [
    "📊 داشبورد من",
    "━━━━━━━━━━━━━━━",
    who + `وضعیت کلی: ${grade}`,
    "",
    `${progressBar(pct)} ${faNum(pct)}٪ دقت کلی`,
    `📝 ${faNum(st.total)} تست | ✅ ${faNum(st.correct)} درست | ❌ ${faNum(st.total - st.correct)} غلط`,
    "",
    "📚 نمودار درس‌ها (پروگرس‌بار → نتیجه):",
  ];
  for (const s of st.bySubject) {
    const sp = Math.round((100 * s.correct) / s.total);
    lines.push(`${progressBar(sp)} ${faNum(sp)}٪ ${sp >= 70 ? "🟢" : sp >= 40 ? "🟡" : "🔴"} ${s.subject} (${faNum(s.correct)}/${faNum(s.total)})`);
  }
  if (st.last10.length >= 3) {
    const rpct = Math.round((100 * st.last10.reduce((a, b) => a + b, 0)) / st.last10.length);
    lines.push("", `📈 روند اخیر: ${st.last10.slice().reverse().map((x) => (x ? "✅" : "❌")).join("")}`,
      `${progressBar(rpct)} ${faNum(rpct)}٪ در ${faNum(st.last10.length)} تست آخر`);
  }
  lines.push("━━━━━━━━━━━━━━━", "🧠 «تحلیل روانشناسی» = تفسیر این نمودارها + پیشنهاد مسیر");
  return lines.join("\n");
}

/* ── سهمیه روزانه مشاوره هوشمند (پیش‌فرض ۱۵ پیام در روز برای هر کاربر) ── */
const BOT_CHAT_DAILY_LIMIT = 15;
async function checkChatQuota(env: Env, platform: string, chatId: string | number): Promise<{ ok: boolean; used: number; limit: number }> {
  try {
    if (!env.DB) return { ok: true, used: 0, limit: BOT_CHAT_DAILY_LIMIT };
    const day = new Date().toISOString().slice(0, 10);
    const cid = String(chatId);
    const row: any = await env.DB.prepare("SELECT used FROM bot_chat_quota WHERE platform=? AND chat_id=? AND day=?").bind(platform, cid, day).first();
    const used = Number(row?.used || 0);
    if (used >= BOT_CHAT_DAILY_LIMIT) return { ok: false, used, limit: BOT_CHAT_DAILY_LIMIT };
    await env.DB.prepare(
      "INSERT INTO bot_chat_quota (platform, chat_id, day, used) VALUES (?,?,?,1) ON CONFLICT(platform, chat_id, day) DO UPDATE SET used = used + 1"
    ).bind(platform, cid, day).run();
    return { ok: true, used: used + 1, limit: BOT_CHAT_DAILY_LIMIT };
  } catch (_) { return { ok: true, used: 0, limit: BOT_CHAT_DAILY_LIMIT }; }
}

/* ── سیستم اعتبار ربات ──
 * ۱) هر کاربر از لحظه ثبت‌نام ۷ روز «اشتراک رایگان» دارد (همه‌چیز آزاد).
 * ۲) بعد از پایان هفته رایگان، اعتبار هدیه ۱۰۰,۰۰۰ تومانی سایت فعال می‌شود؛
 *    هر پیام مشاوره هوشمند ۲,۰۰۰ تومان از آن کم می‌کند (تست و داشبورد همیشه رایگان).
 * ۳) بعد از اتمام اعتبار → خرید از طریق زرین‌پال (سایت) یا کارت‌به‌کارت.
 * مصرف از جدول bot_chat_quota (روزهای بعد از پایان دوره رایگان) محاسبه می‌شود و
 * پرداخت‌ها در bot_payments ثبت می‌شوند — همه در دیتابیس مرکزی D1. */
const BOT_TRIAL_DAYS = 7;
const BOT_FREE_CREDIT_TOMAN = 100_000;
const BOT_CHAT_COST_TOMAN = 2_000;

interface BotCredit {
  hasProfile: boolean;
  inTrial: boolean;
  trialDaysLeft: number;
  trialEndDay: string;      // YYYY-MM-DD
  signupDay: string;        // YYYY-MM-DD
  consumedToman: number;    // مصرف بعد از دوره رایگان
  paidToman: number;        // مجموع شارژهای خریداری‌شده
  totalToman: number;       // 100هزار هدیه + شارژها
  balanceToman: number;     // مانده
}

async function getBotCredit(env: Env, platform: string, chatId: string | number): Promise<BotCredit> {
  const none: BotCredit = { hasProfile: false, inTrial: true, trialDaysLeft: BOT_TRIAL_DAYS, trialEndDay: "", signupDay: "", consumedToman: 0, paidToman: 0, totalToman: BOT_FREE_CREDIT_TOMAN, balanceToman: BOT_FREE_CREDIT_TOMAN };
  try {
    if (!env.DB) return none;
    const cid = String(chatId);
    const prof: any = await env.DB.prepare("SELECT created_at FROM bot_profiles WHERE platform=? AND chat_id=?").bind(platform, cid).first();
    if (!prof?.created_at) return none;
    const signup = Date.parse(prof.created_at);
    const trialEnd = signup + BOT_TRIAL_DAYS * 86400000;
    const nowMs = Date.now();
    const inTrial = nowMs < trialEnd;
    const trialDaysLeft = inTrial ? Math.max(0, Math.ceil((trialEnd - nowMs) / 86400000)) : 0;
    const trialEndDay = new Date(trialEnd).toISOString().slice(0, 10);
    // مصرف: پیام‌های مشاوره در روزهای بعد از پایان دوره رایگان
    const usedRow: any = await env.DB.prepare(
      "SELECT COALESCE(SUM(used),0) n FROM bot_chat_quota WHERE platform=? AND chat_id=? AND day >= ?"
    ).bind(platform, cid, trialEndDay).first();
    const consumedToman = inTrial ? 0 : Number(usedRow?.n || 0) * BOT_CHAT_COST_TOMAN;
    let paidToman = 0;
    try {
      const payRow: any = await env.DB.prepare(
        "SELECT COALESCE(SUM(amount),0) s FROM bot_payments WHERE platform=? AND chat_id=?"
      ).bind(platform, cid).first();
      paidToman = Number(payRow?.s || 0);
    } catch (_) { /* جدول هنوز ساخته نشده */ }
    const totalToman = BOT_FREE_CREDIT_TOMAN + paidToman;
    return {
      hasProfile: true, inTrial, trialDaysLeft, trialEndDay,
      signupDay: prof.created_at.slice(0, 10),
      consumedToman, paidToman, totalToman,
      balanceToman: Math.max(0, totalToman - consumedToman),
    };
  } catch (_) { return none; }
}

function faDayShort(isoDay: string): string {
  try {
    const parts = new Date(isoDay + "T12:00:00Z").toLocaleDateString("fa-IR").split("/");
    return parts.length === 3 ? `${parts[1]}/${parts[2]}` : isoDay.slice(5);
  } catch (_) { return isoDay.slice(5); }
}
function faDate(isoDay: string): string {
  try { return new Date(isoDay + "T12:00:00Z").toLocaleDateString("fa-IR"); } catch (_) { return isoDay; }
}
function faMoney(n: number): string {
  // جداکننده هزارگان با ارقام فارسی
  const s = String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return s.split("").map((c) => (/\d/.test(c) ? FA_DIGITS[Number(c)] : c)).join("");
}

/** پیام گرافیکی «💳 اعتبار من» + دکمه‌های خرید. */
function buildBotCreditView(env: Env, credit: BotCredit, profileName?: string | null): { text: string; reply_markup: any } {
  const lines: string[] = [`💳 اعتبار ${profileName || "شما"} — متصل به حساب مرکزی hamdeltar.ir`, "━━━━━━━━━━━━━━━"];
  if (!credit.hasProfile) {
    lines.push("هنوز ثبت‌نام نکرده‌ای! اول /start را بزن تا هفته رایگان و اعتبار هدیه فعال شود. 🎁");
    return { text: lines.join("\n"), reply_markup: BOT_MENU_KEYBOARD };
  }
  if (credit.inTrial) {
    const usedDays = BOT_TRIAL_DAYS - credit.trialDaysLeft;
    const pct = Math.min(100, Math.round((100 * usedDays) / BOT_TRIAL_DAYS));
    lines.push(
      "🎁 اشتراک هدیه ۱ هفته‌ای: فعال ✅",
      `${progressBar(pct)} ${faNum(usedDays)} از ${faNum(BOT_TRIAL_DAYS)} روز گذشته`,
      `⏳ ${faNum(credit.trialDaysLeft)} روز دیگر از هفته رایگان مانده (تا ${faDate(credit.trialEndDay)})`,
      "",
      `بعد از پایان هفته رایگان، اعتبار هدیه ${faMoney(BOT_FREE_CREDIT_TOMAN)} تومانی سایت فعال می‌شود:`,
      `💬 هر پیام مشاوره هوشمند = ${faMoney(BOT_CHAT_COST_TOMAN)} تومان`,
      "📝 تست، داشبورد و تحلیل = همیشه رایگان",
    );
  } else {
    const pct = credit.totalToman > 0 ? Math.min(100, Math.round((100 * credit.consumedToman) / credit.totalToman)) : 100;
    lines.push(
      `🎁 هفته رایگان: تمام شد (${faDate(credit.signupDay)} تا ${faDate(credit.trialEndDay)})`,
      "",
      `💰 اعتبار کل: ${faMoney(credit.totalToman)} تومان` + (credit.paidToman > 0 ? ` (${faMoney(BOT_FREE_CREDIT_TOMAN)} هدیه + ${faMoney(credit.paidToman)} شارژ)` : " (هدیه سایت)"),
      `📉 مصرف‌شده: ${faMoney(Math.min(credit.consumedToman, credit.totalToman))} تومان`,
      `${progressBar(pct)} ${faNum(pct)}٪ مصرف شده`,
      `✅ مانده: ${faMoney(credit.balanceToman)} تومان (≈ ${faNum(Math.floor(credit.balanceToman / BOT_CHAT_COST_TOMAN))} پیام مشاوره)`,
      "",
      `💬 هر پیام مشاوره = ${faMoney(BOT_CHAT_COST_TOMAN)} تومان | 📝 تست و داشبورد رایگان`,
    );
    if (credit.balanceToman <= 0) {
      lines.push("", "⛔ اعتبارت تمام شده — برای ادامه مشاوره هوشمند، شارژ کن:");
    } else if (credit.balanceToman <= 10 * BOT_CHAT_COST_TOMAN) {
      lines.push("", "⚠️ اعتبارت رو به اتمام است — همین حالا شارژ کن تا مشاوره قطع نشود:");
    }
  }
  const rows: any[] = [
    [{ text: "🛒 خرید اعتبار (زرین‌پال - سایت)", url: (env.APP_URL || "https://hamdeltar.ir") + "/?buy=credit" }],
    [{ text: "🏦 کارت‌به‌کارت (نمایش شماره کارت)", callback_data: "credit:card" }],
    [{ text: "🔄 به‌روزرسانی اعتبار", callback_data: "menu:credit" }, { text: "📜 تاریخچه من", callback_data: "menu:history" }],
  ];
  return { text: lines.join("\n"), reply_markup: { inline_keyboard: rows } };
}

/** پیام کارت‌به‌کارت. */
function buildCardToCardText(env: Env): string {
  const card = (env as any).PAYMENT_CARD_NUMBER || "";
  const name = (env as any).PAYMENT_CARD_NAME || "ترنم همدلی";
  const lines = ["🏦 پرداخت کارت‌به‌کارت", "━━━━━━━━━━━━━━━"];
  if (card) {
    lines.push(`💳 شماره کارت: \n${card}`, `👤 به نام: ${name}`, "", `مبلغ پیشنهادی: ${faMoney(BOT_FREE_CREDIT_TOMAN)} تومان (۵۰ پیام مشاوره)`,
      "", "بعد از واریز، تصویر رسید را همین‌جا بفرست یا به پشتیبانی سایت hamdeltar.ir اطلاع بده تا اعتبارت ظرف چند ساعت شارژ شود. ✅");
  } else {
    lines.push("شماره کارت به‌زودی اعلام می‌شود.", "", "فعلاً از دکمه «🛒 خرید اعتبار (زرین‌پال)» استفاده کن یا از طریق سایت hamdeltar.ir اقدام کن.");
  }
  return lines.join("\n");
}

/** 📜 تاریخچه کامل کاربر از دیتابیس مرکزی سایت (پروفایل + تست‌ها + مشاوره‌ها). */
async function buildBotHistory(env: Env, platform: string, chatId: string | number): Promise<string> {
  const cid = String(chatId);
  const lines: string[] = ["📜 تاریخچه تو — از دیتابیس مرکزی hamdeltar.ir", "━━━━━━━━━━━━━━━"];
  try {
    if (!env.DB) return "تاریخچه فعلاً در دسترس نیست.";
    const p: any = await env.DB.prepare(
      "SELECT name, last_name, field, grade, gpa, created_at, updated_at FROM bot_profiles WHERE platform=? AND chat_id=?"
    ).bind(platform, cid).first();
    if (p) {
      // ثبت‌نام ناقص → دعوت به تکمیل به‌جای نمایش خط تیره‌های زشت
      if (!p.field || !p.grade) {
        lines.push(`👤 ${p.name || "دوست عزیز"}`, "");
        lines.push("⏳ ثبت‌نامت هنوز کامل نشده — چند سوال کوتاه مانده تا پروفایل و کارنامه‌ات فعال شود.", "", "همین الان /start را بزن و ادامه بده! 🚀");
        return lines.join("\n");
      }
      const fullName = `${p.name || ""}${p.last_name ? " " + p.last_name : ""}`.trim() || "دوست عزیز";
      lines.push(`👤 ${fullName} | 📚 ${p.field} | 🎓 ${p.grade}${p.gpa ? ` | 📊 معدل ${faNum(p.gpa)}` : ""}`);
      if (p.created_at) lines.push(`🗓 عضو از: ${faDate(String(p.created_at).slice(0, 10))}`);
    } else {
      lines.push("هنوز ثبت‌نام نکرده‌ای — /start را بزن تا پروفایلت ساخته شود.");
      return lines.join("\n");
    }
    // آمار کلی تست‌ها
    const tot: any = await env.DB.prepare(
      "SELECT COUNT(*) n, COALESCE(SUM(correct),0) c FROM bot_quiz_log WHERE platform=? AND chat_id=?"
    ).bind(platform, cid).first();
    const nTests = Number(tot?.n || 0);
    if (nTests > 0) {
      const acc = Math.round((100 * Number(tot?.c || 0)) / nTests);
      lines.push("", `📝 کل تست‌ها: ${faNum(nTests)} | دقت کلی: ${progressBar(acc)} ${faNum(acc)}٪`);
      // ۱۰ تست آخر با تاریخ و درس
      const last: any = await env.DB.prepare(
        "SELECT subject, year, correct, substr(created_at,1,10) day FROM bot_quiz_log WHERE platform=? AND chat_id=? ORDER BY created_at DESC LIMIT 10"
      ).bind(platform, cid).all();
      const rows = last.results || [];
      if (rows.length) {
        lines.push("", "🕐 ۱۰ تست آخر:");
        for (const r of rows) {
          lines.push(`${r.correct ? "✅" : "❌"} ${r.subject || "عمومی"}${r.year ? ` (کنکور ${faNum(Number(r.year))})` : ""} — ${faDayShort(String(r.day))}`);
        }
      }
    } else {
      lines.push("", "📝 هنوز تستی نزده‌ای — دکمه «📝 تست» را بزن!");
    }
    // مشاوره‌ها (از جدول سهمیه روزانه)
    const chats: any = await env.DB.prepare(
      "SELECT day, used FROM bot_chat_quota WHERE platform=? AND chat_id=? ORDER BY day DESC LIMIT 7"
    ).bind(platform, cid).all();
    const cRows = chats.results || [];
    if (cRows.length) {
      const totalChats = cRows.reduce((a: number, r: any) => a + Number(r.used || 0), 0);
      lines.push("", `💬 مشاوره‌های اخیر (${faNum(totalChats)} پیام در ${faNum(cRows.length)} روز):`);
      for (const r of cRows) lines.push(`• ${faDayShort(String(r.day))} → ${faNum(Number(r.used))} پیام`);
    }
    lines.push("", "━━━━━━━━━━━━━━━", "🌐 نسخه کامل کارنامه و برنامه مطالعاتی: hamdeltar.ir");
  } catch (_) { /* silent */ }
  return lines.join("\n");
}

/* ── پست روزانه کانال (@ai_exam_iran): سوال روز + نکته — فقط ادمین ربات ── */
function isBotAdmin(env: Env, chatId: string | number): boolean {
  const raw = (env as any).BOT_ADMIN_IDS || "";
  return String(raw).split(",").map((s: string) => s.trim()).filter(Boolean).includes(String(chatId));
}

async function buildChannelDailyPost(env: Env): Promise<{ text: string; reply_markup: any } | null> {
  const bank = await getBotQuizBank(env);
  if (!bank.length) return null;
  // سوال روز: بر اساس روز سال، هر روز متفاوت و تکرارنشونده تا چرخه کامل
  const dayOfYear = Math.floor((Date.now() - Date.parse(new Date().getFullYear() + "-01-01")) / 86400000);
  const qi = (dayOfYear * 37) % bank.length;
  const item = bank[qi];
  const lines = item.o.map((opt, i) => `${faNum(i + 1)}) ${opt}`);
  const today = new Date().toLocaleDateString("fa-IR");
  const text = [
    `🌅 سوال روز — ${today}`,
    `📚 ${item.s} | کنکور ${faNum(Number(item.y))} (${item.f})`,
    "━━━━━━━━━━━━━━━",
    item.q,
    "",
    lines.join("\n"),
    "━━━━━━━━━━━━━━━",
    "✍️ جوابت را در ربات بفرست و کارنامه بگیر:",
    "🤖 @taranom_hamdeli_bot",
    "🌐 hamdeltar.ir",
  ].join("\n");
  return {
    text,
    reply_markup: { inline_keyboard: [[{ text: "📝 پاسخ در ربات + تست‌های بیشتر", url: "https://t.me/taranom_hamdeli_bot" }]] },
  };
}

/** 🧠 تحلیل روانشناسی مبتنی بر لاگ تست‌ها (قاعده‌محور + در صورت امکان AI). */
/** نمودار زمانی پاسخ‌ها بر اساس تاریخ (روزانه) از لاگ D1. */
async function buildBotTimeline(env: Env, platform: string, chatId: string | number): Promise<string> {
  try {
    if (!env.DB) return "";
    const rows: any = await env.DB.prepare(
      "SELECT substr(created_at,1,10) day, COUNT(*) n, SUM(correct) c FROM bot_quiz_log WHERE platform=? AND chat_id=? GROUP BY day ORDER BY day DESC LIMIT 7"
    ).bind(platform, String(chatId)).all();
    const days = (rows.results || []).reverse();
    if (days.length === 0) return "";
    const lines = ["", "🗓 نمودار روند (۷ روز اخیر — تاریخ | تعداد | دقت):"];
    for (const d of days) {
      const pct = Math.round((100 * Number(d.c || 0)) / Number(d.n));
      lines.push(`${faDayShort(String(d.day))} | ${faNum(Number(d.n))} تست | ${progressBar(pct)} ${faNum(pct)}٪`);
    }
    return lines.join("\n");
  } catch (_) { return ""; }
}

/** پیشنهاد مسیر مطالعه/تست بعدی بر اساس کارنامه — قبل از تحلیل روانشناسی نمایش داده می‌شود. */
function buildStudySuggestion(st: BotQuizStats): string {
  const lines = ["🧭 پیشنهاد مسیر بعدی (بر اساس تست‌هایی که تا الان زده‌ای):"];
  const weak = st.bySubject.filter((s) => s.total >= 2 && (100 * s.correct) / s.total < 50)
    .sort((a, b) => (a.correct / a.total) - (b.correct / b.total));
  const mid = st.bySubject.filter((s) => s.total >= 2 && (100 * s.correct) / s.total >= 50 && (100 * s.correct) / s.total < 75);
  if (weak.length) lines.push(`۱) اولویت تست بعدی: «${weak[0].subject}» (دقت ${faNum(Math.round(100*weak[0].correct/weak[0].total))}٪) — دکمه 🤖 تست هوشمند همین را برایت می‌آورد.`);
  if (mid.length) lines.push(`۲) برای تثبیت: «${mid.map(s=>s.subject).slice(0,2).join("، ")}» — روزی ۵ تست کافی است.`);
  const strong = st.bySubject.filter((s) => s.total >= 2 && (100 * s.correct) / s.total >= 75);
  if (strong.length) lines.push(`۳) «${strong.map(s=>s.subject).slice(0,2).join("، ")}» خوب است — فقط مرور هفتگی.`);
  if (lines.length === 1) lines.push("هنوز داده کافی از درس‌های مختلف نداری — چند «🤖 تست هوشمند» بزن تا مسیر دقیق بدهم.");
  return lines.join("\n");
}

/** هدر پروفایل کاربر از D1 برای ابتدای تحلیل. */
async function botProfileHeader(env: Env, platform?: string, chatId?: string | number): Promise<string> {
  if (!platform || chatId === undefined) return "";
  const p = await getBotProfile(env, platform, chatId);
  if (!p || p.step !== "done") return "";
  const gpa = p.gpa && p.gpa > 0 ? ` | 📊 معدل ${faNum(p.gpa)}` : "";
  const mood = p.mood && p.mood >= 1 && p.mood <= 4 ? ` | 💚 خلق: ${BOT_MOODS[p.mood - 1]}` : "";
  return `👤 ${p.name || "دوست عزیز"} | 📚 ${p.field} | 🎓 ${p.grade}${gpa}${mood}\n(پروفایل از دیتابیس مرکزی)\n\n`;
}

/** شاخص‌های روانشناختی کمّی از شواهد رفتاری لاگ تست‌ها (غربالگری اولیه — نه تشخیص بالینی). */
async function buildPsychIndicators(env: Env, platform: string, chatId: string | number, st: BotQuizStats): Promise<string> {
  try {
    if (!env.DB) return "";
    const rows: any = await env.DB.prepare(
      "SELECT substr(created_at,1,10) day, COUNT(*) n, SUM(correct) c FROM bot_quiz_log WHERE platform=? AND chat_id=? GROUP BY day ORDER BY day"
    ).bind(platform, String(chatId)).all();
    const days = rows.results || [];
    if (days.length === 0) return "";

    // --- اضطراب آزمون: زنجیره خطا + افت دقت اخیر + خطا در حجم بالا
    let streak = 0, maxStreak = 0;
    for (const x of st.last10) { if (!x) { streak++; maxStreak = Math.max(maxStreak, streak); } else streak = 0; }
    const pct = st.total ? (100 * st.correct) / st.total : 0;
    const recentPct = st.last10.length ? (100 * st.last10.reduce((a, b) => a + b, 0)) / st.last10.length : pct;
    let anxiety = 0;
    const anxEv: string[] = [];
    if (maxStreak >= 3) { anxiety += 35; anxEv.push(`${faNum(maxStreak)} خطای پیاپی`); }
    if (recentPct < pct - 15) { anxiety += 30; anxEv.push(`افت ${faNum(Math.round(pct - recentPct))}٪ در تست‌های اخیر`); }
    if (pct < 40 && st.total >= 6) { anxiety += 20; anxEv.push("دقت پایین با وجود تلاش زیاد"); }
    anxiety = Math.min(95, anxiety);

    // --- افت خلق: روند نزولی دقت روزانه + کاهش فعالیت
    let mood = 0;
    const moodEv: string[] = [];
    if (days.length >= 3) {
      const firstHalf = days.slice(0, Math.floor(days.length / 2));
      const secondHalf = days.slice(Math.floor(days.length / 2));
      const acc = (arr: any[]) => { const n = arr.reduce((s, d) => s + Number(d.n), 0); const c = arr.reduce((s, d) => s + Number(d.c || 0), 0); return n ? (100 * c) / n : 0; };
      const vol = (arr: any[]) => arr.reduce((s, d) => s + Number(d.n), 0) / arr.length;
      if (acc(secondHalf) < acc(firstHalf) - 12) { mood += 40; moodEv.push(`دقت روزانه از ${faNum(Math.round(acc(firstHalf)))}٪ به ${faNum(Math.round(acc(secondHalf)))}٪ افت کرده`); }
      if (vol(secondHalf) < vol(firstHalf) * 0.55) { mood += 30; moodEv.push("حجم تمرین روزانه نصف شده"); }
    }
    mood = Math.min(95, mood);

    // --- الگوی وسواسی/کمال‌گرایی: حجم غیرعادی در یک روز + تکرار با دقت بالا
    let ocd = 0;
    const ocdEv: string[] = [];
    const maxDay = Math.max(...days.map((d: any) => Number(d.n)));
    const avgDay = days.reduce((s: number, d: any) => s + Number(d.n), 0) / days.length;
    if (maxDay >= 25 && maxDay > avgDay * 3) { ocd += 35; ocdEv.push(`${faNum(maxDay)} تست در یک روز (۳ برابر میانگین)`); }
    if (pct >= 85 && st.total >= 15 && maxDay > avgDay * 2) { ocd += 25; ocdEv.push("تکرار زیاد با وجود تسلط بالا"); }
    ocd = Math.min(95, ocd);

    const level = (v: number) => v >= 60 ? "بالا 🔴" : v >= 30 ? "متوسط 🟡" : "کم 🟢";
    const bar = (v: number) => progressBar(v);
    const lines = [
      "",
      "📐 شاخص‌های روانشناختی (غربالگری اولیه از شواهد رفتاری — تشخیص بالینی نیست):",
      `• اضطراب آزمون: ${bar(anxiety)} ${faNum(anxiety)}٪ (${level(anxiety)})${anxEv.length ? "\n  شواهد: " + anxEv.join("؛ ") : "\n  شواهد: الگوی نگران‌کننده‌ای دیده نشد"}`,
      `• افت خلق/انگیزه: ${bar(mood)} ${faNum(mood)}٪ (${level(mood)})${moodEv.length ? "\n  شواهد: " + moodEv.join("؛ ") : "\n  شواهد: روند فعالیت پایدار است"}`,
      `• الگوی وسواسی/کمال‌گرایی: ${bar(ocd)} ${faNum(ocd)}٪ (${level(ocd)})${ocdEv.length ? "\n  شواهد: " + ocdEv.join("؛ ") : "\n  شواهد: الگوی تکرار غیرعادی دیده نشد"}`,
    ];
    if (anxiety >= 60 || mood >= 60) lines.push("⚠️ اگر این حال‌وهوا در زندگی روزمره هم هست، با مشاور انسانی سایت گفت‌وگو کن: hamdeltar.ir");
    return lines.join("\n");
  } catch (_) { return ""; }
}

async function buildBotPsychAnalysis(ctx: Ctx, meta: RespMeta, st: BotQuizStats, platform?: string, chatId?: string | number): Promise<string> {
  if (st.total < 3) {
    const hdr0 = await botProfileHeader(ctx.env, platform, chatId);
    return hdr0 + "🧠 تحلیل روانشناسی\n\nبرای تحلیل معتبر حداقل ۳ تست لازم است. الان «📝 تست» را بزن — بعد از چند تست برگرد!";
  }
  const profHdr = await botProfileHeader(ctx.env, platform, chatId);
  const pct = Math.round((100 * st.correct) / st.total);
  const recent = st.last10;
  const recentPct = recent.length ? Math.round((100 * recent.reduce((a, b) => a + b, 0)) / recent.length) : pct;
  const trend = recentPct - pct;
  // تشخیص الگوها
  let streakWrong = 0, maxStreakWrong = 0;
  for (const x of recent) { if (!x) { streakWrong++; maxStreakWrong = Math.max(maxStreakWrong, streakWrong); } else streakWrong = 0; }
  const weak = st.bySubject.filter((s) => s.total >= 2 && (100 * s.correct) / s.total < 40).map((s) => s.subject);
  const strong = st.bySubject.filter((s) => s.total >= 2 && (100 * s.correct) / s.total >= 70).map((s) => s.subject);

  const facts = [
    `دقت کلی ${pct}٪ در ${st.total} تست`,
    `دقت ${recent.length} تست اخیر ${recentPct}٪ (روند ${trend >= 0 ? "صعودی/ثابت" : "نزولی"})`,
    maxStreakWrong >= 3 ? `زنجیره ${maxStreakWrong} پاسخ غلط پیاپی در تست‌های اخیر` : "",
    weak.length ? `درس‌های ضعیف: ${weak.join("، ")}` : "",
    strong.length ? `درس‌های قوی: ${strong.join("، ")}` : "",
  ].filter(Boolean).join(" | ");

  const indicators = platform && chatId !== undefined ? await buildPsychIndicators(ctx.env, platform, chatId, st) : "";

  // تحلیل AI با مسابقه دو Llama-70B (همان موتور مشاوره)؛ در نبود آن، قاعده‌محور
  try {
    const sys = "شما دکتر رادان، روانشناس تحصیلی ترنم همدلی هستید. بر اساس داده‌های تستی، یک تحلیل روانشناسی کوتاه فارسی بده (حداکثر ۸ جمله): ۱) وضعیت روحی/اضطراب احتمالی از روی الگوی خطاها ۲) نقطه قوت ۳) دو توصیه عملی کایزن. لحن گرم و امیدبخش.";
    const race = await bestAiReply(ctx.env, sys, `داده‌های عملکرد تستی دانش‌آموز: ${facts}`);
    if (race) {
      const timeline = platform && chatId !== undefined ? await buildBotTimeline(ctx.env, platform, chatId) : "";
      const engFa = race.engine.startsWith("hf") ? "Llama-70B هاگینگ‌فیس" : "Llama-70B کلودفلر";
      return `${profHdr}${buildStudySuggestion(st)}\n\n🧠 تحلیل روانشناسی دکتر رادان\n\n${race.text}${indicators}${timeline}\n\n📊 ${faNum(st.total)} تست، دقت ${faNum(pct)}٪ | 🤖 تحلیل با ${engFa} ✓`;
    }
  } catch (_) { /* fall back */ }

  // قاعده‌محور
  const lines = ["🧠 تحلیل روانشناسی دکتر رادان", ""];
  if (pct >= 70) lines.push("عملکردت نشان‌دهنده تسلط و اعتمادبه‌نفس سالم است. 🌟 مغزت الگوهای سوالات را خوب شناخته.");
  else if (pct >= 45) lines.push("عملکردت متوسط رو به بالاست — پایه خوبی داری ولی هنوز تثبیت نشده. این طبیعیِ مرحله یادگیری است.");
  else lines.push("دقت پایین فعلی بیشتر از آنکه ضعف علمی باشد، معمولاً نشانه عجله در پاسخ یا اضطراب تست است. نفس عمیق، خواندن کامل صورت سوال.");
  if (trend < -10) lines.push(`⚠️ روند ${faNum(Math.abs(trend))}٪ افت اخیر داری — احتمالاً خستگی ذهنی. یک استراحت کوتاه (تکنیک پومودورو) قبل از ادامه توصیه می‌شود.`);
  else if (trend > 10) lines.push(`📈 روند اخیرت ${faNum(trend)}٪ بهتر از میانگین است — یادگیری‌ات در حال شتاب گرفتن است، همین مسیر را ادامه بده.`);
  if (maxStreakWrong >= 3) lines.push(`الگوی ${faNum(maxStreakWrong)} غلط پیاپی دیده شد — بعد از هر پاسخ غلط، قبل از سوال بعدی ۱۰ ثانیه مکث کن تا «اثر دومینوی خطا» قطع شود.`);
  if (weak.length) lines.push(`🔴 تمرکز مطالعه این هفته: ${weak.join("، ")}.`);
  if (strong.length) lines.push(`🟢 نقطه قوت تو: ${strong.join("، ")} — از این اعتمادبه‌نفس برای شروع جلسات مطالعه استفاده کن.`);
  const timeline = platform && chatId !== undefined ? await buildBotTimeline(ctx.env, platform, chatId) : "";
  lines.push("", `📊 ${faNum(st.total)} تست، دقت ${faNum(pct)}٪ | 🤖 موتور آفلاین (AI در دسترس نبود)`);
  return profHdr + buildStudySuggestion(st) + "\n\n" + lines.join("\n") + indicators + timeline;
}

/** Build a quiz message + inline keyboard from a random real Konkur question. */
/* --- پروفایل ثبت‌نام کاربر ربات (رشته/پایه) برای تست شخصی‌سازی‌شده --- */
interface BotProfile { platform: string; chat_id: string; name: string | null; last_name?: string | null; field: string | null; grade: string | null; step: string; gpa?: number | null; age?: number | null; mood?: number | null; }

async function getBotProfile(env: Env, platform: string, chatId: string | number): Promise<BotProfile | null> {
  try {
    if (!env.DB) return null;
    return await env.DB.prepare("SELECT platform, chat_id, name, last_name, field, grade, step, gpa, age, mood FROM bot_profiles WHERE platform=? AND chat_id=?")
      .bind(platform, String(chatId)).first();
  } catch (_) { return null; }
}

async function upsertBotProfile(env: Env, platform: string, chatId: string | number, patch: Partial<BotProfile>): Promise<void> {
  try {
    if (!env.DB) return;
    const now = new Date().toISOString();
    const cur = await getBotProfile(env, platform, chatId);
    if (!cur) {
      await env.DB.prepare("INSERT INTO bot_profiles (platform, chat_id, name, last_name, field, grade, step, gpa, age, mood, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
        .bind(platform, String(chatId), patch.name ?? null, patch.last_name ?? null, patch.field ?? null, patch.grade ?? null, patch.step ?? "field", patch.gpa ?? null, patch.age ?? null, patch.mood ?? null, now, now).run();
    } else {
      await env.DB.prepare("UPDATE bot_profiles SET name=COALESCE(?,name), last_name=COALESCE(?,last_name), field=COALESCE(?,field), grade=COALESCE(?,grade), step=COALESCE(?,step), gpa=COALESCE(?,gpa), age=COALESCE(?,age), mood=COALESCE(?,mood), updated_at=? WHERE platform=? AND chat_id=?")
        .bind(patch.name ?? null, patch.last_name ?? null, patch.field ?? null, patch.grade ?? null, patch.step ?? null, patch.gpa ?? null, patch.age ?? null, patch.mood ?? null, now, platform, String(chatId)).run();
    }
  } catch (_) { /* silent */ }
}

const BOT_FIELDS = ["تجربی", "ریاضی", "انسانی", "هنر", "زبان"];
// پایه‌ها: متوسطه اول (۱-۳) + متوسطه دوم (۴-۶) + پشت کنکوری (۷)
const BOT_GRADES = ["هفتم (متوسطه اول)", "هشتم (متوسطه اول)", "نهم (متوسطه اول)", "دهم", "یازدهم", "دوازدهم", "پشت کنکوری"];
const isMiddleSchool = (g?: string | null) => !!g && (g.includes("هفتم") || g.includes("هشتم") || g.includes("نهم"));
// درس‌های عمومی و تخصصی هر رشته (متوسطه دوم) + درس‌های متوسطه اول
const FIELD_SUBJECTS: Record<string, { core: string[]; general: string[] }> = {
  "تجربی": { core: ["زیست‌شناسی", "شیمی", "فیزیک", "ریاضی", "زمین‌شناسی"], general: ["ادبیات فارسی", "عربی", "دین و زندگی", "زبان انگلیسی"] },
  "ریاضی": { core: ["حسابان/ریاضی", "هندسه", "گسسته", "فیزیک", "شیمی"], general: ["ادبیات فارسی", "عربی", "دین و زندگی", "زبان انگلیسی"] },
  "انسانی": { core: ["ادبیات اختصاصی", "عربی اختصاصی", "ریاضی و آمار", "اقتصاد", "جامعه‌شناسی", "روانشناسی", "فلسفه و منطق", "تاریخ", "جغرافیا"], general: ["ادبیات فارسی", "دین و زندگی", "زبان انگلیسی"] },
  "هنر": { core: ["درک عمومی هنر", "ترسیم فنی", "خلاقیت تصویری", "خواص مواد"], general: ["ادبیات فارسی", "عربی", "دین و زندگی", "زبان انگلیسی"] },
  "زبان": { core: ["زبان تخصصی انگلیسی"], general: ["ادبیات فارسی", "عربی", "دین و زندگی"] },
};
const MIDDLE_SUBJECTS = ["ریاضی", "علوم تجربی", "ادبیات فارسی", "عربی", "زبان انگلیسی", "مطالعات اجتماعی", "پیام‌های آسمان"];

function subjectsTextForProfile(field?: string | null, grade?: string | null): string {
  if (isMiddleSchool(grade)) return `📖 درس‌های پایه‌ات: ${MIDDLE_SUBJECTS.join("، ")}`;
  const fs = field ? FIELD_SUBJECTS[field] : null;
  if (!fs) return "";
  return `📖 تخصصی: ${fs.core.join("، ")}\n📗 عمومی: ${fs.general.join("، ")}`;
}

const BOT_MOODS = ["عالی و پرانرژی 😄", "معمولی 🙂", "خسته/بی‌حوصله 😔", "مضطرب/تحت فشار 😰"];

/* ── 🎬 دوره‌ها و دبیرهای معروف کنکور — دیتای مشترک ربات (نسخه کامل: صفحه /courses سایت) ──
 * دبیرهای شناخته‌شده هر درس + دوره‌های رایگان آپارات/آلاء/یوتیوب.
 * لینک‌ها لینک جستجو/کانال عمومی‌اند (بدون embed) تا از ایران سریع باز شوند. */
interface BotCourseTeacher { name: string; subject: string; fields: string[]; known: string; free: string; url: string; provider: string; }
const BOT_COURSE_TEACHERS: BotCourseTeacher[] = [
  // زیست
  { name: "جلال موقاری", subject: "زیست‌شناسی", fields: ["تجربی"], known: "زیست مفهومی — آلاء", free: "دوره کامل رایگان آلاء", url: "https://alaatv.com/c/33", provider: "آلاء" },
  { name: "علی محمد عمارلو", subject: "زیست‌شناسی", fields: ["تجربی"], known: "جمع‌بندی و نکته‌وتست", free: "فیلم‌های رایگان آپارات", url: "https://www.aparat.com/result/عمارلو_زیست", provider: "آپارات" },
  // شیمی
  { name: "شیروانی", subject: "شیمی", fields: ["تجربی", "ریاضی"], known: "شیمی از پایه — آلاء", free: "دوره رایگان آلاء", url: "https://alaatv.com/c/13", provider: "آلاء" },
  { name: "مهدی صنیعی طهرانی", subject: "شیمی", fields: ["تجربی", "ریاضی"], known: "حل تست سریع", free: "فیلم‌های رایگان آپارات", url: "https://www.aparat.com/result/صنیعی_شیمی_کنکور", provider: "آپارات" },
  // ریاضی
  { name: "محمدصادق ثابتی", subject: "ریاضی", fields: ["تجربی", "ریاضی"], known: "ریاضی مفهومی — آلاء", free: "دوره کامل رایگان", url: "https://alaatv.com/c/29", provider: "آلاء" },
  { name: "علی هاشمی", subject: "ریاضی", fields: ["تجربی", "ریاضی"], known: "حسابان و ریاضی تجربی", free: "نمونه تدریس‌های آپارات", url: "https://www.aparat.com/result/علی_هاشمی_ریاضی", provider: "آپارات" },
  // فیزیک
  { name: "فرشید داداشی", subject: "فیزیک", fields: ["تجربی", "ریاضی"], known: "فیزیک صفر تا صد — آلاء", free: "دوره کامل رایگان آلاء", url: "https://alaatv.com/c/16", provider: "آلاء" },
  { name: "کامیار کازرانیان", subject: "فیزیک", fields: ["تجربی", "ریاضی"], known: "نکته و تست", free: "فیلم‌های رایگان آپارات", url: "https://www.aparat.com/result/کازرانیان_فیزیک", provider: "آپارات" },
  // عمومی‌ها
  { name: "علیرضا عبدالمحمدی", subject: "ادبیات فارسی", fields: ["عمومی"], known: "آرایه و قرابت — آلاء", free: "دوره رایگان آلاء", url: "https://alaatv.com/c/8", provider: "آلاء" },
  { name: "ناصح‌زاده", subject: "عربی", fields: ["عمومی"], known: "قواعد + ترجمه — آلاء", free: "دوره کامل رایگان", url: "https://alaatv.com/c/10", provider: "آلاء" },
  { name: "محمد کاغذی", subject: "دین و زندگی", fields: ["عمومی"], known: "آیات و روایات", free: "فیلم‌های رایگان آپارات", url: "https://www.aparat.com/result/کاغذی_دینی", provider: "آپارات" },
  { name: "دانیال نیک‌نداف", subject: "زبان انگلیسی", fields: ["عمومی", "زبان"], known: "واژگان و کلوز تست", free: "فیلم‌های رایگان آپارات", url: "https://www.aparat.com/result/زبان_کنکور_نیک_نداف", provider: "آپارات" },
  // انسانی
  { name: "امیر قاسمی", subject: "فلسفه و منطق", fields: ["انسانی"], known: "منطق مفهومی", free: "جستجوی رایگان آپارات", url: "https://www.aparat.com/result/فلسفه_منطق_کنکور", provider: "آپارات" },
  { name: "سابقی", subject: "ریاضی و آمار", fields: ["انسانی"], known: "ریاضی انسانی از پایه", free: "فیلم‌های رایگان آپارات", url: "https://www.aparat.com/result/ریاضی_انسانی_کنکور", provider: "آپارات" },
];

/* ── 🌐 ورود یک‌کلیکی به سایت از ربات ──
 * ۱) اگر کاربر ربات هنوز حساب سایت ندارد، خودکار در جدول users می‌سازیم (اتصال از طریق bot_profiles.site_user_id).
 * ۲) توکن یک‌بارمصرف ۱۵ دقیقه‌ای در bot_login_tokens صادر و لینک hamdeltar.ir/api/bot-login?t=... داده می‌شود.
 * ۳) کلیک روی لینک → ست شدن کوکی سشن (همان سشن لاگین عادی) → ریدایرکت به داشبورد سایت. */
const FIELD_FA_TO_EN: Record<string, string> = { "تجربی": "tajrobi", "ریاضی": "riazi", "انسانی": "ensani", "هنر": "honar", "زبان": "zaban" };

/** رمز خوانا برای کاربر ربات (حروف/ارقام بدون ابهام O0lI). */
function friendlyPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const arr = new Uint8Array(8); crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => chars[b % chars.length]).join("");
}

async function setUserPassword(env: Env, userId: string, password: string): Promise<boolean> {
  try {
    if (!env.DB) return false;
    const { hash, salt } = await hashPassword(password);
    await env.DB.prepare("UPDATE users SET password_hash=?, password_salt=? WHERE id=?").bind(hash, salt, userId).run();
    return true;
  } catch (_) { return false; }
}

async function ensureSiteUserForBot(env: Env, store: AuthStore, platform: string, chatId: string | number, prof: BotProfile): Promise<{ user: UserRow; created: boolean; password?: string } | null> {
  try {
    if (!env.DB) return null;
    const cid = String(chatId);
    // ۱) اتصال قبلی؟
    const row: any = await env.DB.prepare("SELECT site_user_id FROM bot_profiles WHERE platform=? AND chat_id=?").bind(platform, cid).first();
    if (row?.site_user_id) {
      const u = await store.findUserById(String(row.site_user_id));
      if (u) return { user: u, created: false };
    }
    // ۲) ساخت حساب جدید متصل به ربات — رمز خوانا که به کاربر نشان داده می‌شود
    const plainPassword = friendlyPassword();
    const { hash, salt } = await hashPassword(plainPassword);
    const gradeMap: Record<string, string> = {
      "هفتم (متوسطه اول)": "پایه هفتم", "هشتم (متوسطه اول)": "پایه هشتم", "نهم (متوسطه اول)": "پایه نهم",
      "دهم": "پایه دهم", "یازدهم": "پایه یازدهم", "دوازدهم": "پایه دوازدهم", "پشت کنکوری": "پشت کنکوری",
    };
    const user: UserRow = {
      id: randomToken(12),
      email: `${platform}.${cid}@bot.hamdeltar.ir`,   // شناسه یکتای داخلی — کاربر بعداً می‌تواند ایمیل/موبایل واقعی ست کند
      mobile: null,
      name: `${prof.name || "کاربر ربات"}${prof.last_name ? " " + prof.last_name : ""}`,
      password_hash: hash, password_salt: salt,
      role: "student",
      field: FIELD_FA_TO_EN[prof.field || ""] || "tajrobi",
      grade: gradeMap[prof.grade || ""] || "پایه دوازدهم",
      city: null, age: prof.age || null, avatar: null, target_major: null,
      created_at: new Date().toISOString(),
    };
    await store.insertUser(user);
    await env.DB.prepare("UPDATE bot_profiles SET site_user_id=? WHERE platform=? AND chat_id=?").bind(user.id, platform, cid).run();
    return { user, created: true, password: plainPassword };
  } catch (_) { return null; }
}

async function makeBotLoginLink(env: Env, platform: string, chatId: string | number, userId: string): Promise<string | null> {
  try {
    if (!env.DB) return null;
    const token = randomToken(24);
    const now = Date.now();
    await env.DB.prepare(
      "INSERT INTO bot_login_tokens (token, platform, chat_id, user_id, expires_at, created_at) VALUES (?,?,?,?,?,?)"
    ).bind(token, platform, String(chatId), userId, new Date(now + 15 * 60 * 1000).toISOString(), new Date(now).toISOString()).run();
    return `${env.APP_URL || "https://hamdeltar.ir"}/api/bot-login?t=${token}`;
  } catch (_) { return null; }
}

/** GET /api/bot-login?t=... — مصرف توکن، ست کوکی سشن، ریدایرکت به سایت. */
async function botLoginRoute(ctx: Ctx, store: AuthStore): Promise<Response> {
  const url = new URL(ctx.request.url);
  const t = url.searchParams.get("t") || "";
  const fail = (msg: string) => new Response(
    `<!doctype html><html dir="rtl" lang="fa"><meta charset="utf-8"><body style="font-family:Tahoma;text-align:center;padding:60px 20px;background:#f8fafc">
     <h2>🔗 ${msg}</h2><p>از داخل ربات دوباره دکمه «🌐 ورود به سایت» را بزن تا لینک تازه بگیری.</p>
     <a href="https://t.me/taranom_hamdeli_bot" style="color:#4f46e5">بازگشت به ربات تلگرام</a></body></html>`,
    { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
  if (!t || !ctx.env.DB) return fail("لینک نامعتبر است");
  const row: any = await ctx.env.DB.prepare("SELECT * FROM bot_login_tokens WHERE token=?").bind(t).first();
  if (!row) return fail("این لینک قبلاً استفاده شده یا نامعتبر است");
  await ctx.env.DB.prepare("DELETE FROM bot_login_tokens WHERE token=?").bind(t).run(); // یک‌بارمصرف
  if (Date.now() > Date.parse(row.expires_at)) return fail("لینک منقضی شده (۱۵ دقیقه اعتبار دارد)");
  const user = await store.findUserById(String(row.user_id));
  if (!user) return fail("حساب پیدا نشد");
  const token = randomToken(32);
  const now = new Date();
  await store.upsertSession({ token, user_id: user.id, created_at: now.toISOString(), expires_at: new Date(now.getTime() + SESSION_TTL_MS).toISOString() });
  return new Response(null, {
    status: 302,
    headers: {
      "Location": "/dashboard",
      "Set-Cookie": sessionCookieHeader(token, SESSION_TTL_MS),
    },
  });
}

/** پیام «🌐 ورود به سایت»: ساخت/اتصال حساب + لینک ورود یک‌کلیکی + راهنمای ورود دستی. */
async function buildSiteLoginMessage(env: Env, platform: string, chatId: string | number): Promise<{ text: string; reply_markup: any }> {
  const prof = await getBotProfile(env, platform, chatId);
  if (!prof || prof.step !== "done") {
    return {
      text: "برای ورود به سایت اول ثبت‌نام کوتاه ربات را کامل کن (فقط ۵ سوال) — /start را بزن. 😊",
      reply_markup: BOT_MENU_KEYBOARD,
    };
  }
  const store = getAuthStore(env);
  if (!store) return { text: "سرویس حساب‌ها موقتاً در دسترس نیست.", reply_markup: BOT_MENU_KEYBOARD };
  const res = await ensureSiteUserForBot(env, store, platform, chatId, prof);
  if (!res) return { text: "خطا در ساخت حساب — کمی بعد دوباره امتحان کن.", reply_markup: BOT_MENU_KEYBOARD };
  const link = await makeBotLoginLink(env, platform, chatId, res.user.id);
  if (!link) return { text: "خطا در ساخت لینک ورود — دوباره امتحان کن.", reply_markup: BOT_MENU_KEYBOARD };
  const lines = [
    res.created ? "🎉 حساب سایتت ساخته شد و به همین ربات وصل است!" : "🌐 حسابت از قبل به ربات وصل است.",
    "━━━━━━━━━━━━━━━",
    `👤 ${res.user.name}`,
    "📚 پروفایل، کارنامه تست‌ها و اعتبارت بین ربات و سایت مشترک است.",
    "",
    "🚀 راه ۱ — ورود یک‌کلیکی (راحت‌ترین):",
    "دکمه «🌐 ورود به سایت» را بزن؛ بدون رمز، خودکار وارد داشبورد می‌شوی. (لینک ۱۵ دقیقه اعتبار دارد و یک‌بارمصرف است)",
    "",
    "🔐 راه ۲ — ورود دستی با نام کاربری و رمز:",
    `▪️ نام کاربری: ${res.user.email}`,
  ];
  if (res.created && res.password) {
    lines.push(`▪️ رمز عبور: ${res.password}`, "⚠️ این رمز را همین حالا یادداشت کن — فقط همین یک‌بار نمایش داده می‌شود!");
  } else {
    lines.push("▪️ رمز عبور: اگر یادت نیست، دکمه «🔑 رمز جدید» را بزن تا رمز تازه بگیری.");
  }
  lines.push("", "مسیر ورود دستی: hamdeltar.ir → دکمه «ورود» → تب «ورود با رمز عبور» → نام کاربری و رمز بالا");
  return {
    text: lines.join("\n"),
    reply_markup: {
      inline_keyboard: [
        [{ text: "🌐 ورود به سایت (یک‌کلیکی)", url: link }],
        [{ text: "🔑 رمز جدید", callback_data: "site:newpass" }, { text: "🔄 لینک جدید", callback_data: "menu:sitelogin" }],
      ],
    },
  };
}

/** 🎬 پیام «دبیر و دوره رایگان» شخصی‌سازی‌شده بر اساس رشته + ضعیف‌ترین درس کارنامه. */
async function buildBotCourseFinder(env: Env, platform: string, chatId: string | number, subjectFilter?: string): Promise<{ text: string; reply_markup: any }> {
  const prof = await getBotProfile(env, platform, chatId);
  const field = prof?.field || null;
  // ضعیف‌ترین درس از کارنامه (اگر تست زده باشد) برای پیشنهاد اول
  let weakest: string | null = null;
  try {
    if (env.DB) {
      const w: any = await env.DB.prepare(
        "SELECT subject, COUNT(*) n, SUM(correct) c FROM bot_quiz_log WHERE platform=? AND chat_id=? AND subject IS NOT NULL GROUP BY subject HAVING n>=2 ORDER BY (CAST(c AS REAL)/n) ASC LIMIT 1"
      ).bind(platform, String(chatId)).first();
      if (w?.subject) weakest = String(w.subject);
    }
  } catch (_) { /* silent */ }

  // 🧑‍🏫 مربیان رسمی خود سامانه (نقش counselor/teacher در D1) — اولویت اول
  let systemMentors: { name: string; role: string; field: string | null }[] = [];
  try {
    const storeM = getAuthStore(env);
    if (storeM) {
      const all = await storeM.listUsers();
      systemMentors = all.filter((u) => u.role === "counselor" || u.role === "teacher")
        .map((u) => ({ name: u.name, role: u.role, field: u.field || null })).slice(0, 10);
    }
  } catch (_) { /* silent */ }

  const matches = BOT_COURSE_TEACHERS.filter((t) =>
    (!field || t.fields.includes(field) || t.fields.includes("عمومی")) &&
    (!subjectFilter || t.subject === subjectFilter)
  );
  const pick = subjectFilter ? matches : matches.slice(0, 8);
  const lines: string[] = [subjectFilter ? `🎬 دبیرهای پیشنهادی «${subjectFilter}»` : `🎬 دبیر و دوره رایگان${field ? ` — رشته ${field}` : ""}`, "━━━━━━━━━━━━━━━"];
  if (!subjectFilter && systemMentors.length) {
    lines.push("🏠 مربیان رسمی ترنم همدلی (داخل سامانه):");
    const FIELD_FA: Record<string, string> = { tajrobi: "تجربی", riazi: "ریاضی", ensani: "انسانی", honar: "هنر", zaban: "زبان" };
    for (const m of systemMentors) lines.push(`⭐ ${m.name} — ${m.role === "counselor" ? "مشاور" : "دبیر"}${m.field ? ` (${FIELD_FA[m.field] || m.field})` : ""}`);
    lines.push("📞 رزرو جلسه با مربیان سامانه: hamdeltar.ir/inperson", "");
    lines.push("👇 و دبیرهای معروف کشوری با دوره رایگان قابل راستی‌آزمایی:");
  }
  if (weakest && !subjectFilter) {
    const wTeachers = BOT_COURSE_TEACHERS.filter((t) => t.subject === weakest);
    if (wTeachers.length) {
      lines.push(`🎯 بر اساس کارنامه‌ات، اول «${weakest}» را تقویت کن:`);
      for (const t of wTeachers) lines.push(`⭐ ${t.name} — ${t.known}\n   🆓 ${t.free}`);
      lines.push("");
    }
  }
  if (pick.length === 0) {
    lines.push("برای این درس هنوز دبیر ثبت نشده — لیست کامل در سایت:");
  } else {
    for (const t of pick) {
      if (weakest && !subjectFilter && t.subject === weakest) continue; // تکراری نشود
      lines.push(`👨‍🏫 ${t.name} | ${t.subject}\n   ${t.known} — 🆓 ${t.free}`);
    }
  }
  lines.push("━━━━━━━━━━━━━━━", "🔗 لینک مستقیم دوره‌ها + فیلتر درس/رشته: دکمه‌های زیر 👇");
  // دکمه‌ها: لینک وب هر دبیر (حداکثر ۴) + لینک صفحه کامل سایت + فیلتر درس
  const rows: any[] = [];
  const linkTeachers = (subjectFilter ? matches : (weakest ? BOT_COURSE_TEACHERS.filter((t) => t.subject === weakest) : pick)).slice(0, 4);
  for (const t of linkTeachers) rows.push([{ text: `▶️ ${t.name} (${t.provider})`, url: t.url }]);
  // فیلتر درس‌ها (درس‌های رشته کاربر)
  const subjectsAvail = [...new Set(matches.map((t) => t.subject))].slice(0, 6);
  for (let i = 0; i < subjectsAvail.length; i += 3) {
    rows.push(subjectsAvail.slice(i, i + 3).map((s) => ({ text: s, callback_data: `crs:${s.slice(0, 30)}` })));
  }
  rows.push([{ text: "🌐 صفحه کامل دوره‌ها + دبیرها در سایت", url: (env.APP_URL || "https://hamdeltar.ir") + "/courses" }]);
  return { text: lines.join("\n"), reply_markup: { inline_keyboard: rows } };
}
function fieldQuestionText(userName: string): string {
  return `📋 ${userName} عزیز، برای اینکه تست‌های مناسب خودت را بدهم، ثبت‌نام کوتاه (۵ مرحله):\n\n۱از۵) رشته‌ات کدام است؟ عددش را بفرست:\n${BOT_FIELDS.map((f, i) => `${faNum(i + 1)}) ${f}`).join("\n")}\n\n(اگر متوسطه اول هستی و هنوز رشته نداری، ۱ را بزن — در مرحله بعد پایه را مشخص کن)`;
}
function gradeQuestionText(): string {
  return `۲از۵) پایه تحصیلی‌ات؟ عددش را بفرست:\n${BOT_GRADES.map((g, i) => `${faNum(i + 1)}) ${g}`).join("\n")}`;
}
function gpaQuestionText(): string {
  return "۳از۵) معدل (نمره درسی) سال گذشته‌ات چند بود؟ (مثلاً 17.5 — اگر نمی‌خواهی بگویی: 0)";
}
function ageQuestionText(): string {
  return "۴از۵) چند سالته؟ (مثلاً 17 — اگر نمی‌خواهی بگویی: 0)";
}
function moodQuestionText(): string {
  return `۵از۵) این روزها روحیه و خلق‌ات چطور است؟ عددش را بفرست:\n${BOT_MOODS.map((m, i) => `${faNum(i + 1)}) ${m}`).join("\n")}`;
}
function profileSummary(p: BotProfile): string {
  const gpaTxt = p.gpa && p.gpa > 0 ? `\n📊 معدل: ${faNum(p.gpa)}` : "";
  const ageTxt = p.age && p.age > 0 ? `\n🎂 سن: ${faNum(p.age)}` : "";
  const moodTxt = p.mood && p.mood >= 1 && p.mood <= 4 ? `\n💚 خلق امروز: ${BOT_MOODS[p.mood - 1]}` : "";
  const subj = subjectsTextForProfile(p.field, p.grade);
  const fullName = `${p.name || "دوست عزیز"}${p.last_name ? " " + p.last_name : ""}`;
  return `🎉 ثبت‌نام کامل شد!\n\n👤 ${fullName}\n📚 رشته: ${p.field}\n🎓 پایه: ${p.grade}${gpaTxt}${ageTxt}${moodTxt}\n\n${subj}\n\n🎁 هدیه ثبت‌نام: ۱ هفته اشتراک کامل رایگان + بعد از آن اعتبار ۱۰۰,۰۰۰ تومانی سایت («💳 اعتبار من» را بزن)\n\n📝 «تست کنکور واقعی» = تصادفی از رشته‌ات\n🤖 «تست هوشمند RAG» = بر اساس نقاط ضعفت!`;
}

/** درس‌های موجود در بانک برای رشته کاربر (مرتب بر اساس تعداد سوال). */
function subjectsForField(bank: BotQuizItem[], field?: string | null): { subject: string; count: number }[] {
  const pool = bank.filter((it) => !field || field === "عمومی" || it.f === field || it.f === "عمومی");
  const m: Record<string, number> = {};
  for (const it of pool) m[it.s] = (m[it.s] || 0) + 1;
  return Object.entries(m).map(([subject, count]) => ({ subject, count }))
    .filter((x) => x.count >= 2).sort((a, b) => b.count - a.count).slice(0, 12);
}

function yearsForField(bank: BotQuizItem[], field?: string | null): { year: string; count: number }[] {
  const pool = bank.filter((it) => !field || field === "عمومی" || it.f === field || it.f === "عمومی");
  const m: Record<string, number> = {};
  for (const it of pool) m[it.y] = (m[it.y] || 0) + 1;
  return Object.entries(m).map(([year, count]) => ({ year, count }))
    .filter((x) => x.count >= 2).sort((a, b) => b.year.localeCompare(a.year)).slice(0, 8);
}

/** سوال تصادفی از یک درس یا سال مشخص (در محدوده رشته کاربر). */
/* فیلتر فعال تست هر کاربر (درس/سال) — تا «🔄 سوال بعدی» در همان درس بماند */
async function setQuizFilter(env: Env, platform: string, chatId: string | number, subject: string | null, year: string | null): Promise<void> {
  try {
    if (!env.DB) return;
    await env.DB.prepare(
      "INSERT INTO bot_quiz_filter (platform, chat_id, subject, year, created_at) VALUES (?,?,?,?,?) " +
      "ON CONFLICT(platform, chat_id) DO UPDATE SET subject=excluded.subject, year=excluded.year, created_at=excluded.created_at"
    ).bind(platform, String(chatId), subject, year, new Date().toISOString()).run();
  } catch (_) { /* silent */ }
}
async function getQuizFilter(env: Env, platform: string, chatId: string | number): Promise<{ subject: string | null; year: string | null } | null> {
  try {
    if (!env.DB) return null;
    const r: any = await env.DB.prepare("SELECT subject, year FROM bot_quiz_filter WHERE platform=? AND chat_id=?").bind(platform, String(chatId)).first();
    return r ? { subject: r.subject || null, year: r.year || null } : null;
  } catch (_) { return null; }
}
async function clearQuizFilter(env: Env, platform: string, chatId: string | number): Promise<void> {
  try { if (env.DB) await env.DB.prepare("DELETE FROM bot_quiz_filter WHERE platform=? AND chat_id=?").bind(platform, String(chatId)).run(); } catch (_) { /* silent */ }
}

/** 📈 تحلیل ساختار کنکور: توزیع سوالات درس×سال×سختی از بانک رسمی + تفسیر روند با AI. */
async function buildExamStructureAnalysis(ctx: Ctx, platform: string, chatId: string | number, subjectFilter?: string): Promise<string> {
  const env = ctx.env;
  const bank = await getBotQuizBank(env);
  const prof = await getBotProfile(env, platform, chatId);
  const field = prof?.field || null;
  const pool = bank.filter((it) =>
    (!field || field === "عمومی" || it.f === field || it.f === "عمومی") &&
    (!subjectFilter || it.s === subjectFilter));
  if (pool.length < 3) return "برای این درس/رشته هنوز داده کافی در بانک نیست.";

  // ماتریس درس×سال + سختی
  const bySubYear: Record<string, Record<string, number>> = {};
  const byLevel: Record<string, number> = { "آسان": 0, "متوسط": 0, "سخت": 0 };
  const years = new Set<string>();
  for (const it of pool) {
    (bySubYear[it.s] = bySubYear[it.s] || {})[it.y] = (bySubYear[it.s]?.[it.y] || 0) + 1;
    years.add(it.y);
    if (it.l && byLevel[it.l] !== undefined) byLevel[it.l]++;
  }
  const yrs = [...years].sort();
  const lines: string[] = [
    subjectFilter ? `📈 تحلیل ساختار «${subjectFilter}»${field ? ` — رشته ${field}` : ""}` : `📈 تحلیل ساختار کنکور${field ? ` — رشته ${field}` : ""}`,
    `(بر اساس ${faNum(pool.length)} سوال بانک رسمی، سال‌های ${yrs.map((y) => faNum(Number(y))).join("، ")})`,
    "━━━━━━━━━━━━━━━",
  ];
  const subs = Object.entries(bySubYear).sort((a, b) =>
    Object.values(b[1]).reduce((x, y) => x + y, 0) - Object.values(a[1]).reduce((x, y) => x + y, 0)).slice(0, 10);
  for (const [sub, ymap] of subs) {
    const tot = Object.values(ymap).reduce((a, b) => a + b, 0);
    const trend = yrs.map((y) => `${faNum(Number(y) % 100)}:${faNum(ymap[y] || 0)}`).join(" ");
    lines.push(`📚 ${sub} (${faNum(tot)}): ${trend}`);
  }
  const totL = byLevel["آسان"] + byLevel["متوسط"] + byLevel["سخت"];
  if (totL > 0) {
    lines.push("", `⚖️ سختی: 🟢 ${faNum(Math.round(100 * byLevel["آسان"] / totL))}٪ آسان | 🟡 ${faNum(Math.round(100 * byLevel["متوسط"] / totL))}٪ متوسط | 🔴 ${faNum(Math.round(100 * byLevel["سخت"] / totL))}٪ سخت`);
  }
  // آمار جمعی کاربران (دقت واقعی روی این درس‌ها)
  try {
    if (env.DB) {
      const qs: any = subjectFilter
        ? await env.DB.prepare("SELECT SUM(attempts) a, SUM(correct) c FROM question_stats WHERE subject=?").bind(subjectFilter).first()
        : await env.DB.prepare("SELECT SUM(attempts) a, SUM(correct) c FROM question_stats" + (field ? " WHERE field=?" : "")).bind(...(field ? [field] : [])).first();
      if (qs && Number(qs.a) >= 5) lines.push(`👥 دقت جمعی کاربران سامانه: ${faNum(Math.round(100 * Number(qs.c) / Number(qs.a)))}٪ در ${faNum(Number(qs.a))} پاسخ`);
    }
  } catch (_) { /* silent */ }
  // مقایسه سال‌به‌سال کل رشته (از آمار ۲۱ دفترچه رسمی — پیش‌تولیدشده)
  try {
    const base = env.EXAM_RAG_URL || "https://sosa123454321-taranom-exam-rag.static.hf.space";
    const resp = await fetch(`${base}/data/exam-structure-profiles.json`, { signal: AbortSignal.timeout(8000) } as any);
    if (resp.ok) {
      const data: any = await resp.json();
      if (!subjectFilter && field && data.field_comparisons?.[field]) {
        lines.push("", `🗂 مقایسه سال‌به‌سال رشته ${field} (از ${faNum((data.booklets || []).filter((b: any) => String(b.field).startsWith(field)).length)} دفترچه رسمی):`, String(data.field_comparisons[field]).slice(0, 400));
      }
    }
  } catch (_) { /* silent */ }
  // تفسیر AI روند درس‌ها
  try {
    const facts = subs.map(([sub, ymap]) => `${sub}: ${yrs.map((y) => `${y}=${ymap[y] || 0}`).join(",")}`).join(" | ");
    const sys = "شما تحلیلگر ساختار کنکور هستید. بر اساس داده‌های تعداد سوال هر مبحث در سال‌های اخیر، در حداکثر ۴ جمله فارسی: ۱) روند تغییر بودجه‌بندی ۲) کدام مباحث پرتکرارترند ۳) توصیه اولویت مطالعه. فقط از همین داده‌ها استفاده کن، عدد از خودت نساز.";
    const race = await bestAiReply(env, sys, `توزیع سوالات (درس: سال=تعداد): ${facts}`);
    if (race?.text) lines.push("", "🤖 تفسیر روند (هوش مصنوعی):", race.text.slice(0, 600));
  } catch (_) { /* silent */ }
  lines.push("", "⚠️ توجه: این تحلیل فقط بر اساس سوالات موجود در بانک ماست (نمونه، نه کل دفترچه) — بودجه‌بندی کامل را از دفترچه‌های رسمی sanjesh.org ببینید.");
  return lines.join("\n");
}

function pickFiltered(bank: BotQuizItem[], field: string | null | undefined, subject?: string, year?: string): { qi: number; item: BotQuizItem } | null {
  const idxs = bank.map((it, i) => ({ it, i }))
    .filter(({ it }) => !field || field === "عمومی" || it.f === field || it.f === "عمومی")
    .filter(({ it }) => (!subject || it.s === subject) && (!year || it.y === year))
    .map(({ i }) => i);
  if (idxs.length === 0) return null;
  const qi = idxs[Math.floor(Math.random() * idxs.length)];
  return { qi, item: bank[qi] };
}

function subjectMenuKeyboard(subs: { subject: string; count: number }[]): any {
  const rows: any[] = [];
  for (let i = 0; i < subs.length; i += 2) {
    rows.push(subs.slice(i, i + 2).map((s, j) => ({ text: `${s.subject} (${faNum(s.count)})`, callback_data: `qsub:${i + j}` })));
  }
  rows.push([{ text: "🗓 بر اساس سال کنکور", callback_data: "menu:years" }]);
  rows.push([{ text: "📈 تحلیل ساختار درس (سال‌به‌سال)", callback_data: "qstruct:menu" }]);
  return { inline_keyboard: rows };
}

function yearMenuKeyboard(years: { year: string; count: number }[]): any {
  const rows: any[] = [];
  for (let i = 0; i < years.length; i += 3) {
    rows.push(years.slice(i, i + 3).map((y) => ({ text: `کنکور ${faNum(Number(y.year))}`, callback_data: `qyear:${y.year}` })));
  }
  rows.push([{ text: "📚 بر اساس درس", callback_data: "menu:subjects" }]);
  return { inline_keyboard: rows };
}

/** 🤖 انتخاب هوشمند سوال با RAG: ضعیف‌ترین درس از کارنامه + بازیابی معنایی/سطح‌بندی معدل. */
async function buildSmartQuiz(env: Env, platform: string, chatId: string | number, profile: BotProfile | null): Promise<{ text: string; reply_markup: any; qi: number; item: BotQuizItem } | null> {
  const bank = await getBotQuizBank(env);
  const f = profile?.field;
  const pool = bank.map((it, i) => ({ it, i })).filter(({ it }) => !f || f === "عمومی" || it.f === f || it.f === "عمومی");
  if (pool.length === 0) return null;

  // ۱) ضعیف‌ترین درس کاربر از لاگ کارنامه
  let weakSubject: string | null = null;
  try {
    if (env.DB) {
      const row: any = await env.DB.prepare(
        "SELECT subject, COUNT(*) n, SUM(correct) c FROM bot_quiz_log WHERE platform=? AND chat_id=? AND subject IS NOT NULL GROUP BY subject HAVING n>=2 ORDER BY (CAST(c AS REAL)/n) ASC, n DESC LIMIT 1"
      ).bind(platform, String(chatId)).first();
      if (row && Number(row.n) >= 2 && Number(row.c) / Number(row.n) < 0.75) weakSubject = row.subject;
    }
  } catch (_) { /* ignore */ }

  // ۲) کاندیدها: سوالات درس ضعیف؛ اگر کارنامه‌ای نیست، امبدینگ رشته+پایه برای انتخاب معنایی
  let candidates = weakSubject ? pool.filter(({ it }) => it.s === weakSubject) : [];
  let reason = weakSubject ? `درس ضعیف کارنامه‌ات: ${weakSubject}` : "";
  if (candidates.length === 0) {
    const [emb, qVec] = await Promise.all([
      getBotEmbeddings(env),
      embedQuery(env, `سوال کنکور ${f || ""} ${profile?.grade || ""}`),
    ]);
    if (emb && qVec && emb.vectors.length > 0) {
      const nv = emb.vectors.length;
      candidates = pool.filter(({ i }) => i < nv).map(({ it, i }) => ({ it, i, score: cosineSim(qVec, emb.vectors[i]) }))
        .sort((a: any, b: any) => b.score - a.score).slice(0, 25) as any;
      reason = reason || "انتخاب معنایی RAG برای رشته تو";
    }
  }
  if (candidates.length === 0) { candidates = pool; reason = reason || "تصادفی از رشته تو"; }

  // ۳) سطح‌بندی با معدل: اول با فیلد level بانک (l)، بعد سال به‌عنوان فال‌بک
  const gpa = profile?.gpa || 0;
  if (gpa > 0 && candidates.length > 6) {
    const lvlRank = (it: BotQuizItem) => it.l === "سخت" ? 2 : it.l === "آسان" ? 0 : 1;
    const hasLvl = candidates.some((c: any) => c.it.l);
    if (hasLvl) {
      const wanted = gpa >= 17 ? [2, 1] : [0, 1];
      const filtered = candidates.filter((c: any) => wanted.includes(lvlRank(c.it)));
      if (filtered.length >= 3) candidates = filtered;
    } else {
      const sorted = [...candidates].sort((a, b) => Number(b.it.y) - Number(a.it.y));
      candidates = gpa >= 17 ? sorted.slice(0, Math.ceil(sorted.length / 2)) : sorted.slice(Math.floor(sorted.length / 2));
    }
  }

  // ۴) 📊 مرتب‌سازی با سختی واقعی (question_stats از پاسخ همه کاربران):
  //    دقت شخصی بالا → سوالات سخت‌تر (دقت جمعی پایین)؛ دقت پایین → سوالات آسان‌تر. + حذف سوالات پرگزارش (dislikes>likes+2)
  try {
    if (env.DB && candidates.length > 4) {
      const ids = candidates.map((c: any) => c.i);
      const qmarks = ids.map(() => "?").join(",");
      const rows: any = await env.DB.prepare(
        `SELECT qi, attempts, correct, likes, dislikes FROM question_stats WHERE qi IN (${qmarks})`
      ).bind(...ids).all();
      const stats: Record<number, any> = {};
      for (const r of rows.results || []) stats[Number(r.qi)] = r;
      // حذف سوالات معیوب (کاربران گزارش منفی زیاد داده‌اند)
      const clean = candidates.filter((c: any) => {
        const s = stats[c.i];
        return !(s && Number(s.dislikes) >= Number(s.likes) + 3);
      });
      if (clean.length >= 3) candidates = clean;
      // دقت شخصی کاربر
      const me: any = await env.DB.prepare(
        "SELECT COUNT(*) n, COALESCE(SUM(correct),0) c FROM bot_quiz_log WHERE platform=? AND chat_id=?"
      ).bind(platform, String(chatId)).first();
      const myAcc = me && Number(me.n) >= 5 ? Number(me.c) / Number(me.n) : null;
      if (myAcc !== null) {
        const withDiff = candidates.map((c: any) => {
          const s = stats[c.i];
          const commAcc = s && Number(s.attempts) >= 3 ? Number(s.correct) / Number(s.attempts) : 0.5;
          return { ...c, commAcc };
        });
        // کاربر قوی (>=70%) → سخت‌ترین‌ها (commAcc کم)؛ کاربر ضعیف (<40%) → آسان‌ترها
        if (myAcc >= 0.7) withDiff.sort((a: any, b: any) => a.commAcc - b.commAcc);
        else if (myAcc < 0.4) withDiff.sort((a: any, b: any) => b.commAcc - a.commAcc);
        if (myAcc >= 0.7 || myAcc < 0.4) {
          candidates = withDiff.slice(0, Math.max(3, Math.ceil(withDiff.length / 2)));
          reason += myAcc >= 0.7 ? " + سطح سخت (آمار جمعی)" : " + سطح آسان‌تر (آمار جمعی)";
        }
      }
    }
  } catch (_) { /* silent */ }

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  const base = formatBotQuiz(pick.it, pick.i, platform);
  return { text: `🤖 تست هوشمند RAG — ${reason}\n\n${base.text}`, reply_markup: base.reply_markup, qi: pick.i, item: pick.it };
}

async function buildBotQuiz(env: Env, platform?: string, profile?: BotProfile | null): Promise<{ text: string; reply_markup: any; qi: number; item: BotQuizItem }> {
  const bank = await getBotQuizBank(env);
  // شخصی‌سازی: اگر رشته کاربر ثبت شده، سوال از همان رشته (+ دروس عمومی) انتخاب می‌شود
  let pool: number[] = bank.map((_, i) => i);
  const f = profile?.field;
  if (f && f !== "عمومی") {
    const filtered = bank.map((it, i) => ({ it, i })).filter(({ it }) => it.f === f || it.f === "عمومی").map(({ i }) => i);
    if (filtered.length >= 5) pool = filtered;
  }
  const qi = pool[Math.floor(Math.random() * pool.length)];
  const item = bank[qi];
  const base = formatBotQuiz(item, qi, platform);
  const tag = f && f !== "عمومی" ? `\n🎯 شخصی‌سازی‌شده برای رشته ${f}` : "";
  return { text: base.text + tag, reply_markup: base.reply_markup, qi, item };
}

/** قالب مشترک سوال — در بله دکمه‌ها گاهی کار نمی‌کنند؛ راهنمای پاسخ عددی همیشه اضافه می‌شود. */
function formatBotQuiz(item: BotQuizItem, qi: number, platform?: string): { text: string; reply_markup: any } {
  const lines = item.o.map((opt, i) => `${faNum(i + 1)}) ${opt}`);
  const numHint = platform === "bale"
    ? "\n\n👇 پاسخ را با ارسال «عدد گزینه» بدهید (مثلاً 2)"
    : "\n\n👇 گزینه را لمس کنید یا عددش را بفرستید:";
  const lvl = item.l === "سخت" ? " 🔴 سخت" : item.l === "آسان" ? " 🟢 آسان" : item.l === "متوسط" ? " 🟡 متوسط" : "";
  const text = `📝 سوال واقعی کنکور ${faNum(Number(item.y))} — ${item.s} (${item.f})${lvl}\n\n${item.q}\n\n${lines.join("\n")}${numHint}`;
  const reply_markup = {
    inline_keyboard: [
      item.o.map((_, i) => ({ text: faNum(i + 1), callback_data: `qz:${qi}:${item.a}:${i}` })),
      [{ text: "🔄 سوال بعدی", callback_data: "qz:next" }],
    ],
  };
  return { text, reply_markup };
}

/** ذخیره سوال فعال کاربر تا پاسخ عددی (بدون دکمه) هم قابل تصحیح باشد — لازمهٔ بله. */
async function saveBotQuizState(env: Env, platform: string, chatId: string | number, qi: number, correctIdx: number): Promise<void> {
  try {
    if (!env.DB) return;
    await env.DB.prepare(
      "INSERT INTO bot_quiz_state (platform, chat_id, qi, correct_idx, created_at) VALUES (?,?,?,?,?) " +
      "ON CONFLICT(platform, chat_id) DO UPDATE SET qi=excluded.qi, correct_idx=excluded.correct_idx, created_at=excluded.created_at"
    ).bind(platform, String(chatId), qi, correctIdx, new Date().toISOString()).run();
  } catch (_) { /* silent */ }
}

async function popBotQuizState(env: Env, platform: string, chatId: string | number): Promise<{ qi: number; correct_idx: number } | null> {
  try {
    if (!env.DB) return null;
    const cid = String(chatId);
    // اتمیک (ضد race): DELETE ... RETURNING — فقط یکی از دو درخواست هم‌زمان ردیف را می‌گیرد
    try {
      const del: any = await env.DB.prepare(
        "DELETE FROM bot_quiz_state WHERE platform=? AND chat_id=? RETURNING qi, correct_idx"
      ).bind(platform, cid).first();
      if (!del) return null;
      return { qi: Number(del.qi), correct_idx: Number(del.correct_idx) };
    } catch (_) {
      // فال‌بک برای درایورهایی که RETURNING ندارند (SELECT سپس DELETE مشروط)
      const row: any = await env.DB.prepare(
        "SELECT qi, correct_idx FROM bot_quiz_state WHERE platform=? AND chat_id=?"
      ).bind(platform, cid).first();
      if (!row) return null;
      const res: any = await env.DB.prepare(
        "DELETE FROM bot_quiz_state WHERE platform=? AND chat_id=? AND qi=? AND correct_idx=?"
      ).bind(platform, cid, row.qi, row.correct_idx).run();
      const changed = Number(res?.meta?.changes ?? res?.changes ?? 1);
      if (changed === 0) return null; // درخواست هم‌زمان دیگر آن را برداشته
      return { qi: Number(row.qi), correct_idx: Number(row.correct_idx) };
    }
  } catch (_) { return null; }
}

/** تصحیح پاسخ (مشترک بین دکمه و پاسخ عددی). */
async function gradeBotAnswer(
  env: Env, send: (m: string, p: any) => Promise<void>, platform: string,
  chatId: string | number, qi: number, correct: number, chosen: number
): Promise<void> {
  const bank = await getBotQuizBank(env);
  const item = bank[qi] || null;
  const correctText = item && item.o[correct] ? item.o[correct] : `گزینه ${faNum(correct + 1)}`;
  const verdict = chosen === correct
    ? `✅ آفرین! پاسخ درست است.\n\nگزینه ${faNum(correct + 1)}) ${correctText}`
    : `❌ پاسخ درست نبود.\n\nپاسخ صحیح: گزینه ${faNum(correct + 1)}) ${correctText}`;
  const src = item ? `\n\n📚 منبع: کنکور سراسری ${faNum(Number(item.y))} — ${item.s} (${item.f})${item.qn ? ` — سوال ${faNum(item.qn)}` : ""}${item.pg ? ` — صفحه ${faNum(item.pg)} دفترچه` : ""}${item.src ? "" : "\n🏛 قابل راستی‌آزمایی در سایت سنجش: sanjesh.org"}` : "";
  await logBotQuizAnswer(env, platform, chatId, item, chosen === correct);
  // 📊 آمار سوال (سختی واقعی بر اساس پاسخ همه کاربران) — برای مرتب‌سازی بهتر بانک
  await bumpQuestionStat(env, qi, item, chosen === correct);
  // 🔥 امتیاز امروز — بازخورد فوری برای ادامه دادن
  let todayLine = "";
  try {
    if (env.DB) {
      const day = new Date().toISOString().slice(0, 10);
      const t: any = await env.DB.prepare(
        "SELECT COUNT(*) n, COALESCE(SUM(correct),0) c FROM bot_quiz_log WHERE platform=? AND chat_id=? AND substr(created_at,1,10)=?"
      ).bind(platform, String(chatId), day).first();
      const n = Number(t?.n || 0), c = Number(t?.c || 0);
      if (n > 0) todayLine = `\n🔥 امروز: ${faNum(c)} از ${faNum(n)} درست${n >= 5 && c / n >= 0.8 ? " — عالی داری پیش می‌ری! 👏" : ""}`;
    }
  } catch (_) { /* silent */ }
  // سختی سوال از آمار جمعی (اگر حداقل ۳ نفر جواب داده باشند)
  let diffLine = "";
  try {
    if (env.DB) {
      const qs: any = await env.DB.prepare("SELECT attempts, correct FROM question_stats WHERE qi=?").bind(qi).first();
      if (qs && Number(qs.attempts) >= 3) {
        const pct = Math.round((100 * Number(qs.correct)) / Number(qs.attempts));
        const label = pct >= 70 ? "🟢 آسان" : pct >= 40 ? "🟡 متوسط" : "🔴 سخت";
        diffLine = `\n${label} — ${faNum(pct)}٪ کاربران درست زدند (${faNum(Number(qs.attempts))} پاسخ)`;
      }
    }
  } catch (_) { /* silent */ }
  // 📈 بینش روند درس (از پروفایل‌های ساختار) — مشاوره بعد از تست
  let trendLine = "";
  try {
    if (item) {
      const profs = await getStructureProfiles(env);
      const tp = profs.find((p: any) => p.subject === item.s && p.field === item.f) || profs.find((p: any) => p.subject === item.s);
      if (!tp) {
        // فال‌بک: آمار زنده از خود بانک — تحلیل هیچ‌وقت حذف نشود
        try {
          const bankT = await getBotQuizBank(env);
          const same = bankT.filter((it) => it.s === item.s);
          if (same.length >= 1) {
            const ys: Record<string, number> = {};
            for (const it of same) ys[it.y] = (ys[it.y] || 0) + 1;
            const dist = Object.keys(ys).sort().map((y) => `${faNum(Number(y))}: ${faNum(ys[y])} سوال`).join("، ");
            trendLine = `\n\n📈 روند «${item.s}» در بانک ما: ${dist}. سهم این درس محدود است — نکات پایه را جمع کن و تمرکز اصلی را روی درس‌های پرسوال بگذار.`;
          }
        } catch (_) { /* silent */ }
      }
      if (tp?.ai_trend) {
        // متن کامل تا ۶۰۰ حرف؛ اگر بلندتر بود، در پایان آخرین جمله کامل ببُر (نه وسط جمله)
        let t = String(tp.ai_trend);
        if (t.length > 600) {
          const cut = t.slice(0, 600);
          const lastEnd = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("؟"), cut.lastIndexOf("!"), cut.lastIndexOf("؛"));
          t = lastEnd > 200 ? cut.slice(0, lastEnd + 1) : cut + "…";
        }
        trendLine = `\n\n📈 روند «${item.s}» در کنکورهای اخیر:\n${t}`;
      }
    }
  } catch (_) { /* silent */ }
  await send("sendMessage", {
    chat_id: chatId,
    text: `${verdict}${src}${todayLine}${diffLine}${trendLine}\n\n💡 «📊 داشبورد من» کارنامه‌ات را نشان می‌دهد.`,
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🔄 سوال بعدی", callback_data: "qz:next" },
          { text: "📊 داشبورد", callback_data: "qz:dash" },
        ],
        [
          { text: "👍", callback_data: `qr:up:${qi}` },
          { text: "👎", callback_data: `qr:dn:${qi}` },
          { text: "💬 نظر روی این سوال", callback_data: `qc:${qi}` },
        ],
        ...(item?.src ? [[{ text: item.pg ? `📄 دفترچه رسمی (صفحه ${faNum(item.pg)})` : "📄 دفترچه رسمی این کنکور (PDF)", url: `${env.APP_URL || "https://hamdeltar.ir"}/api/exam-files/pdfs/${item.src.split("/").pop()}${item.pg ? `#page=${item.pg}` : ""}` }]] : []),
      ],
    },
  });
}

/** آمار تجمیعی هر سوال — پایه مرتب‌سازی هوشمند بانک. */
async function bumpQuestionStat(env: Env, qi: number, item: BotQuizItem | null, wasCorrect: boolean): Promise<void> {
  try {
    if (!env.DB) return;
    await env.DB.prepare(
      "INSERT INTO question_stats (qi, subject, field, year, attempts, correct, updated_at) VALUES (?,?,?,?,1,?,?) " +
      "ON CONFLICT(qi) DO UPDATE SET attempts = attempts + 1, correct = correct + excluded.correct, updated_at = excluded.updated_at"
    ).bind(qi, item?.s || null, item?.f || null, item?.y || null, wasCorrect ? 1 : 0, new Date().toISOString()).run();
  } catch (_) { /* silent */ }
}

/** ثبت لایک/دیس‌لایک سوال. */
async function rateQuestion(env: Env, qi: number, item: BotQuizItem | null, up: boolean): Promise<void> {
  try {
    if (!env.DB) return;
    const col = up ? "likes" : "dislikes";
    await env.DB.prepare(
      `INSERT INTO question_stats (qi, subject, field, year, ${col}, updated_at) VALUES (?,?,?,?,1,?) ` +
      `ON CONFLICT(qi) DO UPDATE SET ${col} = ${col} + 1, updated_at = excluded.updated_at`
    ).bind(qi, item?.s || null, item?.f || null, item?.y || null, new Date().toISOString()).run();
  } catch (_) { /* silent */ }
}

/** Live status text (D1 user count + RAG bank size). */
async function buildBotStatus(env: Env, platform: "telegram" | "bale"): Promise<string> {
  let userCount = "—";
  try {
    const store = getAuthStore(env);
    if (store) userCount = faNum(await store.countUsers());
  } catch (_) { /* ignore */ }
  let bankCount = "—";
  try { bankCount = faNum((await getBotQuizBank(env)).length); } catch (_) { /* ignore */ }
  const hasAi = !!(env.HF_TOKEN || env.GEMINI_API_KEY || env.OPENROUTER_API_KEY);
  const channel = platform === "telegram" ? "ربات تلگرام" : "بازوی بله";
  return [
    "🟢 وضعیت زنده سامانه ترنم همدلی:",
    `- ${channel}: فعال و متصل (@taranom_hamdeli_bot)`,
    `- کاربران ثبت‌شده: ${userCount} نفر`,
    `- بانک تست فعال ربات: ${bankCount} سوال واقعی کنکور`,
    `- موتور هوش مصنوعی: ${hasAi ? "آماده ✅" : "غیرفعال ⚠️"}`,
    "- سامانه اصلی: hamdeltar.ir",
    "- نسخه: 3.0.0",
  ].join("\n");
}

const BOT_HELP_TEXT = [
  "📌 راهنمای ربات ترنم همدلی",
  "",
  "این ربات متصل به سامانه hamdeltar.ir است.",
  "",
  "📝 تست کنکور واقعی — سوال واقعی از بانک ۱۸۰۰+ سوالی (تصحیح فوری + ثبت در کارنامه)",
  "🔢 پاسخ‌دادن: روی دکمه گزینه بزن، یا فقط «عدد گزینه» را بفرست (مثلاً 2) — در بله همیشه با عدد جواب بده",
  "📊 داشبورد من — کارنامه شخصی: دقت کلی، تفکیک درس‌ها، روند ۱۰ تست آخر",
  "🧠 تحلیل روانشناسی — تفسیر دکتر رادان از الگوی پاسخ‌هایت + توصیه عملی",
  "💬 مشاوره — هر سوال درسی/انگیزشی را بنویس",
  "📈 وضعیت سامانه — آمار زنده",
  "",
  "🤖 تست هوشمند RAG — سوال بعدی را بر اساس نقاط ضعف کارنامه و رشته/معدل تو انتخاب می‌کند",
  "",
  "📜 تاریخچه — پروفایل + تست‌ها + مشاوره‌های قبلی‌ات از دیتابیس سایت",
  "💳 اعتبار من — هفته اول رایگان 🎁، بعد اعتبار هدیه ۱۰۰,۰۰۰ تومانی سایت؛ شارژ با زرین‌پال یا کارت‌به‌کارت",
  "🎬 دبیر و دوره رایگان — دبیرهای معروف هر درس + لینک دوره رایگان (آلاء/آپارات)، شخصی‌سازی با ضعیف‌ترین درست",
  "",
  "✏️ /setname نام نام‌خانوادگی — اصلاح اطلاعات ثبت‌نامی",
  "🌐 ورود به سایت — حساب سایت خودکار + لینک ورود یک‌کلیکی + نام کاربری/رمز",
  "🔗 /link موبایل رمز — اتصال حساب قبلی سایت (ثبت‌نامی با موبایل) به ربات: هویت واحد در همه‌جا",
  "",
  "دستورات: /start /quiz /smartquiz /dashboard /analysis /history /credit /courses /site /setname /status /help",
].join("\n");

/** Shared update handler for Telegram-compatible bot APIs (Telegram + Bale). */
async function handleBotUpdate(
  ctx: Ctx,
  meta: RespMeta,
  platform: "telegram" | "bale"
): Promise<Response> {
  const body = await readJson(ctx.request);
  const token = platform === "telegram" ? ctx.env.TELEGRAM_BOT_TOKEN : ctx.env.BALE_BOT_TOKEN;
  const apiBase = platform === "telegram"
    ? `https://api.telegram.org/bot${token}`
    : `https://tapi.bale.ai/bot${token}`;

  const send = async (method: string, payload: any) => {
    try {
      await fetch(`${apiBase}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(9000) as any,
      });
    } catch (err) {
      console.error(`${platform} ${method} error:`, err);
    }
  };

  // --- 1) inline button presses (quiz answers) ---
  const cb = body?.callback_query;
  if (cb && cb.message?.chat?.id) {
    const chatId = cb.message.chat.id;
    const data = String(cb.data || "");
    await send("answerCallbackQuery", { callback_query_id: cb.id });

    if (data === "qz:next") {
      const profNext = await getBotProfile(ctx.env, platform, chatId);
      // اگر کاربر درس/سال خاصی انتخاب کرده، سوال بعدی هم از همان باشد
      const filt = await getQuizFilter(ctx.env, platform, chatId);
      if (filt && (filt.subject || filt.year)) {
        const bankN = await getBotQuizBank(ctx.env);
        const pickN = pickFiltered(bankN, profNext?.field, filt.subject || undefined, filt.year || undefined);
        if (pickN) {
          const qN = formatBotQuiz(pickN.item, pickN.qi, platform);
          await saveBotQuizState(ctx.env, platform, chatId, pickN.qi, pickN.item.a);
          const tag = filt.subject ? `📚 ادامه تست ${filt.subject}` : `🗓 ادامه کنکور ${faNum(Number(filt.year))}`;
          await send("sendMessage", { chat_id: chatId, text: `${tag}\n(برای تست از همه درس‌ها: «📝 تست» را بزن)\n\n${qN.text}`, reply_markup: qN.reply_markup });
          return json({ ok: true });
        }
      }
      const quiz = await buildBotQuiz(ctx.env, platform, profNext);
      await saveBotQuizState(ctx.env, platform, chatId, quiz.qi, quiz.item.a);
      await send("sendMessage", { chat_id: chatId, text: quiz.text, reply_markup: quiz.reply_markup });
      return json({ ok: true });
    }
    const showM = data.match(/^qz:show:(\d+)$/);
    if (showM) {
      const bank = await getBotQuizBank(ctx.env);
      const qi = Math.min(Number(showM[1]), bank.length - 1);
      const item = bank[qi];
      if (item) {
        const q = formatBotQuiz(item, qi, platform);
        await saveBotQuizState(ctx.env, platform, chatId, qi, item.a);
        await send("sendMessage", { chat_id: chatId, text: q.text, reply_markup: q.reply_markup });
      }
      return json({ ok: true });
    }
    if (data.startsWith("menu:")) {
      const item = data.slice(5);
      if (item === "quiz" || item === "smart") {
        const prof = await getBotProfile(ctx.env, platform, chatId);
        if (!prof || prof.step !== "done") {
          // نام موجود کاربر را حفظ کن؛ اگر پروفایل نیست فقط رکورد ناقص بساز (COALESCE در upsert نام قبلی را نگه می‌دارد)
          const keepName = prof?.name || "دوست عزیز";
          if (!prof) await upsertBotProfile(ctx.env, platform, chatId, { name: keepName, step: "field" });
          // اگر پروفایل نیمه‌کاره است، از همان مرحله ادامه بده — ریست نکن
          const step = prof?.step || "field";
          const stepMsg = step === "grade" ? gradeQuestionText() : step === "gpa" ? gpaQuestionText() : step === "age" ? ageQuestionText() : step === "mood" ? moodQuestionText() : fieldQuestionText(keepName);
          await send("sendMessage", { chat_id: chatId, text: `اول ثبت‌نام کوتاه را تمام کنیم تا تست مناسب خودت بیاید:\n\n${stepMsg}` });
          return json({ ok: true });
        }
        await clearQuizFilter(ctx.env, platform, chatId);
        const q = item === "smart"
          ? await buildSmartQuiz(ctx.env, platform, chatId, prof)
          : await buildBotQuiz(ctx.env, platform, prof);
        if (q) {
          await saveBotQuizState(ctx.env, platform, chatId, q.qi, q.item.a);
          await send("sendMessage", { chat_id: chatId, text: q.text, reply_markup: q.reply_markup });
        }
        return json({ ok: true });
      }
      if (item === "analysis") {
        await send("sendChatAction", { chat_id: chatId, action: "typing" });
        const st = await getBotQuizStats(ctx.env, platform, chatId);
        const msg = st ? await buildBotPsychAnalysis(ctx, meta, st, platform, chatId) : "تحلیل فعلاً در دسترس نیست.";
        await send("sendMessage", { chat_id: chatId, text: msg, reply_markup: BOT_MENU_KEYBOARD });
        return json({ ok: true });
      }
      if (item === "subjects" || item === "years") {
        const prof = await getBotProfile(ctx.env, platform, chatId);
        const bank = await getBotQuizBank(ctx.env);
        if (item === "subjects") {
          const subs = subjectsForField(bank, prof?.field);
          await send("sendMessage", { chat_id: chatId, text: "📚 کدام درس؟", reply_markup: subjectMenuKeyboard(subs) });
        } else {
          const yrs = yearsForField(bank, prof?.field);
          await send("sendMessage", { chat_id: chatId, text: "🗓 کدام سال کنکور؟", reply_markup: yearMenuKeyboard(yrs) });
        }
        return json({ ok: true });
      }
      if (item === "chat") { await send("sendMessage", { chat_id: chatId, text: "💬 سوالت را همین‌جا بنویس تا دکتر رادان جواب بدهد." }); return json({ ok: true }); }
      if (item === "structure") {
        await send("sendChatAction", { chat_id: chatId, action: "typing" });
        const txt = await buildExamStructureAnalysis(ctx, platform, chatId);
        await send("sendMessage", { chat_id: chatId, text: txt, reply_markup: BOT_MENU_KEYBOARD });
        return json({ ok: true });
      }
      if (item === "history") {
        await send("sendMessage", { chat_id: chatId, text: await buildBotHistory(ctx.env, platform, chatId), reply_markup: BOT_MENU_KEYBOARD });
        return json({ ok: true });
      }
      if (item === "credit") {
        const prof = await getBotProfile(ctx.env, platform, chatId);
        const credit = await getBotCredit(ctx.env, platform, chatId);
        const v = buildBotCreditView(ctx.env, credit, prof?.name);
        await send("sendMessage", { chat_id: chatId, text: v.text, reply_markup: v.reply_markup });
        return json({ ok: true });
      }
      if (item === "courses") {
        const cf = await buildBotCourseFinder(ctx.env, platform, chatId);
        await send("sendMessage", { chat_id: chatId, text: cf.text, reply_markup: cf.reply_markup });
        return json({ ok: true });
      }
      if (item === "sitelogin") {
        const r = await buildSiteLoginMessage(ctx.env, platform, chatId);
        await send("sendMessage", { chat_id: chatId, text: r.text, reply_markup: r.reply_markup });
        return json({ ok: true });
      }
      if (item === "register") {
        await upsertBotProfile(ctx.env, platform, chatId, { field: null, grade: null, step: "field" });
        await send("sendMessage", { chat_id: chatId, text: fieldQuestionText("دوست عزیز") });
        return json({ ok: true });
      }
      if (item === "status") { await send("sendMessage", { chat_id: chatId, text: await buildBotStatus(ctx.env, platform) }); return json({ ok: true }); }
      if (item === "help") { await send("sendMessage", { chat_id: chatId, text: BOT_HELP_TEXT }); return json({ ok: true }); }
      return json({ ok: true });
    }
    if (data === "site:newpass") {
      const prof = await getBotProfile(ctx.env, platform, chatId);
      const store2 = getAuthStore(ctx.env);
      if (!prof || prof.step !== "done" || !store2) {
        await send("sendMessage", { chat_id: chatId, text: "اول ثبت‌نام ربات را کامل کن (/start) و بعد «🌐 ورود به سایت» را بزن." });
        return json({ ok: true });
      }
      const acc = await ensureSiteUserForBot(ctx.env, store2, platform, chatId, prof);
      if (!acc) { await send("sendMessage", { chat_id: chatId, text: "خطا — دوباره امتحان کن." }); return json({ ok: true }); }
      const newPass = friendlyPassword();
      const ok = await setUserPassword(ctx.env, acc.user.id, newPass);
      await send("sendMessage", {
        chat_id: chatId,
        text: ok
          ? `🔑 رمز جدید ساخته شد:\n\n▪️ نام کاربری: ${acc.user.email}\n▪️ رمز عبور: ${newPass}\n\n⚠️ همین حالا یادداشت کن — دیگر نمایش داده نمی‌شود.\nورود: hamdeltar.ir → «ورود» → تب «ورود با رمز عبور»`
          : "خطا در تغییر رمز — دوباره امتحان کن.",
      });
      return json({ ok: true });
    }
    if (data === "credit:card") {
      await send("sendMessage", { chat_id: chatId, text: buildCardToCardText(ctx.env), reply_markup: BOT_MENU_KEYBOARD });
      return json({ ok: true });
    }
    const crsM = data.match(/^crs:(.+)$/);
    if (crsM) {
      const cf = await buildBotCourseFinder(ctx.env, platform, chatId, crsM[1]);
      await send("sendMessage", { chat_id: chatId, text: cf.text, reply_markup: cf.reply_markup });
      return json({ ok: true });
    }
    // 👍/👎 امتیاز به سوال
    const qrM = data.match(/^qr:(up|dn):(\d+)$/);
    if (qrM) {
      const qi = Number(qrM[2]);
      const bank = await getBotQuizBank(ctx.env);
      await rateQuestion(ctx.env, qi, bank[qi] || null, qrM[1] === "up");
      await send("sendMessage", { chat_id: chatId, text: qrM[1] === "up" ? "👍 ممنون! امتیازت به این سوال ثبت شد." : "👎 ثبت شد — اگر سوال مشکل دارد، با «💬 نظر روی این سوال» دقیقاً بگو چه ایرادی دارد تا اصلاحش کنیم." });
      return json({ ok: true });
    }
    // 💬 شروع ثبت نظر روی سوال
    const qcM = data.match(/^qc:(\d+)$/);
    if (qcM) {
      const qi = Number(qcM[1]);
      try {
        if (ctx.env.DB) {
          await ctx.env.DB.prepare(
            "INSERT INTO bot_comment_state (platform, chat_id, qi, created_at) VALUES (?,?,?,?) " +
            "ON CONFLICT(platform, chat_id) DO UPDATE SET qi=excluded.qi, created_at=excluded.created_at"
          ).bind(platform, String(chatId), qi, new Date().toISOString()).run();
        }
      } catch (_) { /* silent */ }
      await send("sendMessage", {
        chat_id: chatId,
        text: "💬 نظرت درباره این سوال را در یک پیام بنویس و بفرست:\n(مثلاً: «گزینه ۲ هم درست است»، «برچسب درسش اشتباه است»، «تایپش غلط دارد» یا هر پیشنهادی)\n\nبرای انصراف: /cancel",
      });
      return json({ ok: true });
    }
    if (data === "qstruct:menu") {
      // انتخاب درس برای تحلیل ساختار
      const profQ = await getBotProfile(ctx.env, platform, chatId);
      const bankQ = await getBotQuizBank(ctx.env);
      const subsQ = subjectsForField(bankQ, profQ?.field);
      const rows = [] as any[];
      for (let i = 0; i < subsQ.length; i += 2)
        rows.push(subsQ.slice(i, i + 2).map((x, j) => ({ text: `📈 ${x.subject}`, callback_data: `qstruct:${i + j}` })));
      await send("sendMessage", { chat_id: chatId, text: "📈 تحلیل ساختار کدام درس؟ (تعداد سوال هر سال + سختی + تفسیر AI)", reply_markup: { inline_keyboard: rows } });
      return json({ ok: true });
    }
    const structM = data.match(/^qstruct:(\d+)$/);
    if (structM) {
      await send("sendChatAction", { chat_id: chatId, action: "typing" });
      const profS = await getBotProfile(ctx.env, platform, chatId);
      const bankS = await getBotQuizBank(ctx.env);
      const subsS = subjectsForField(bankS, profS?.field);
      const sel = subsS[Number(structM[1])];
      const txt = await buildExamStructureAnalysis(ctx, platform, chatId, sel?.subject);
      await send("sendMessage", {
        chat_id: chatId, text: txt,
        reply_markup: { inline_keyboard: [[{ text: `📝 تمرین از ${sel?.subject || "این درس"}`, callback_data: `qsub:${structM[1]}` }], [{ text: "📈 درس دیگر", callback_data: "qstruct:menu" }]] },
      });
      return json({ ok: true });
    }
    const subM = data.match(/^qsub:(\d+)$/);
    if (subM) {
      const prof = await getBotProfile(ctx.env, platform, chatId);
      const bank = await getBotQuizBank(ctx.env);
      const subs = subjectsForField(bank, prof?.field);
      const s = subs[Number(subM[1])];
      const pick = s ? pickFiltered(bank, prof?.field, s.subject) : null;
      if (pick) {
        await setQuizFilter(ctx.env, platform, chatId, s.subject, null);
        const q = formatBotQuiz(pick.item, pick.qi, platform);
        await saveBotQuizState(ctx.env, platform, chatId, pick.qi, pick.item.a);
        await send("sendMessage", { chat_id: chatId, text: `📚 تست ${s.subject}\n\n${q.text}`, reply_markup: q.reply_markup });
      } else {
        await send("sendMessage", { chat_id: chatId, text: "برای این درس فعلاً سوال کافی نداریم." });
      }
      return json({ ok: true });
    }
    const yearM = data.match(/^qyear:(\d+)$/);
    if (yearM) {
      const prof = await getBotProfile(ctx.env, platform, chatId);
      const bank = await getBotQuizBank(ctx.env);
      const pick = pickFiltered(bank, prof?.field, undefined, yearM[1]);
      if (pick) {
        await setQuizFilter(ctx.env, platform, chatId, null, yearM[1]);
        const q = formatBotQuiz(pick.item, pick.qi, platform);
        await saveBotQuizState(ctx.env, platform, chatId, pick.qi, pick.item.a);
        await send("sendMessage", { chat_id: chatId, text: `🗓 کنکور ${faNum(Number(yearM[1]))}\n\n${q.text}`, reply_markup: q.reply_markup });
      } else {
        await send("sendMessage", { chat_id: chatId, text: "برای این سال سوال کافی نداریم." });
      }
      return json({ ok: true });
    }
    if (data === "qz:dash") {
      const st = await getBotQuizStats(ctx.env, platform, chatId);
      await send("sendMessage", {
        chat_id: chatId,
        text: st ? buildBotDashboard(st, await getBotProfile(ctx.env, platform, chatId)) : "داشبورد فعلاً در دسترس نیست.",
        reply_markup: st ? {
        inline_keyboard: [
          [{ text: "🧠 تحلیل روانشناسی + پیشنهاد مسیر", callback_data: "menu:analysis" }],
          [{ text: "🤖 تست هوشمند (نقطه‌ضعف)", callback_data: "menu:smart" }, { text: "📚 تست موضوعی", callback_data: "menu:subjects" }],
        ],
      } : BOT_MENU_KEYBOARD,
      });
      return json({ ok: true });
    }
    const m = data.match(/^qz:(\d+):(\d+):(\d+)$/);
    if (m) {
      // ضد double-count: اگر همین سوال در ۲ دقیقه اخیر تصحیح شده، کلیک دوم روی گزینه‌ها را نادیده بگیر
      try {
        if (ctx.env.DB) {
          const bank0 = await getBotQuizBank(ctx.env);
          const subj0 = bank0[Number(m[1])]?.s || null;
          const recent: any = await ctx.env.DB.prepare(
            "SELECT COUNT(*) n FROM bot_quiz_log WHERE platform=? AND chat_id=? AND subject IS ? AND created_at > ?"
          ).bind(platform, String(chatId), subj0, new Date(Date.now() - 120000).toISOString()).first();
          const st0 = await ctx.env.DB.prepare("SELECT qi FROM bot_quiz_state WHERE platform=? AND chat_id=?").bind(platform, String(chatId)).first() as any;
          const stateMatches = st0 && Number(st0.qi) === Number(m[1]);
          if (!stateMatches && Number(recent?.n || 0) > 0) {
            await send("sendMessage", { chat_id: chatId, text: "این سوال قبلاً تصحیح شده ✅ — «🔄 سوال بعدی» را بزن!", reply_markup: { inline_keyboard: [[{ text: "🔄 سوال بعدی", callback_data: "qz:next" }]] } });
            return json({ ok: true });
          }
        }
      } catch (_) { /* silent */ }
      await popBotQuizState(ctx.env, platform, chatId); // پاک‌سازی سوال فعال
      await gradeBotAnswer(ctx.env, send, platform, chatId, Number(m[1]), Number(m[2]), Number(m[3]));
      return json({ ok: true });
    }
    return json({ ok: true });
  }

  // --- 2) plain messages ---
  const message = body?.message || body?.edited_message;
  if (!message || !message.chat || !message.chat.id) {
    return json({ ok: true, note: "No message found in update" });
  }
  const chatId = message.chat.id;
  const text = (message.text || "").trim();
  // پیام غیرمتنی (عکس/استیکر/ویس/فایل) → راهنمای کوتاه، نه AI و نه مصرف سهمیه
  if (!text) {
    await send("sendMessage", {
      chat_id: chatId,
      text: "فعلاً فقط پیام متنی می‌فهمم! 🙏\n\n📷 اگر رسید کارت‌به‌کارت فرستادی، لطفاً «مبلغ + ۴ رقم آخر کارت» را به‌صورت متن هم بنویس تا پشتیبانی سریع‌تر شارژ کند.\nسوالت را به‌صورت متن بنویس یا «📝 تست» را بزن.",
      reply_markup: BOT_MENU_KEYBOARD,
    });
    return json({ ok: true });
  }
  const userName = message.from?.first_name || "همسفر";
  const userLastName = message.from?.last_name || null;

  if (text === "/start") {
    const home = platform === "telegram" ? "@taranom_hamdeli_bot" : "ble.ir/taranom_hamdeli_bot";
    const prof = await getBotProfile(ctx.env, platform, chatId);
    // 🧠 حافظه: اگر قبلاً ثبت‌نام کرده، دوباره نپرس — خوش‌آمد با پروفایل ذخیره‌شده
    if (prof && prof.step === "done") {
      const gpaTxt = prof.gpa && prof.gpa > 0 ? ` | 📊 معدل ${faNum(prof.gpa)}` : "";
      const cr = await getBotCredit(ctx.env, platform, chatId);
      const crTxt = cr.inTrial
        ? `🎁 اشتراک رایگان: ${faNum(cr.trialDaysLeft)} روز دیگر فعال است`
        : cr.balanceToman > 0
          ? `💳 اعتبار سایت: ${faMoney(cr.balanceToman)} تومان مانده`
          : `⛔ اعتبارت تمام شده — «💳 اعتبار من» را بزن برای شارژ`;
      await send("sendMessage", {
        chat_id: chatId,
        text: `سلام ${prof.name || userName} عزیز، خوش برگشتی! 🌸\n\nپروفایلت را یادم هست:\n📚 ${prof.field} | 🎓 ${prof.grade}${gpaTxt}\n${crTxt}\n\nهمین الان «📝 تست» یا «🤖 تست هوشمند» را بزن.\n📜 «تاریخچه» = همه تست‌ها و مشاوره‌های قبلی‌ات\n(برای تغییر رشته: «📋 ثبت‌نام / تغییر رشته» در ☰ منو)`,
        reply_markup: BOT_MENU_KEYBOARD,
      });
      return json({ ok: true });
    }
    // اگر ثبت‌نام نیمه‌کاره است، از همان مرحله ادامه بده — از اول شروع نکن
    if (prof && prof.step !== "done") {
      const stepMsg = prof.step === "grade" ? gradeQuestionText() : prof.step === "gpa" ? gpaQuestionText() : prof.step === "age" ? ageQuestionText() : prof.step === "mood" ? moodQuestionText() : fieldQuestionText(userName);
      await send("sendMessage", { chat_id: chatId, text: `سلام ${userName}! ثبت‌نامت نیمه‌کاره مانده — ادامه بدهیم:\n\n${stepMsg}`, reply_markup: BOT_MENU_KEYBOARD });
      return json({ ok: true });
    }
    // کاربر کاملاً جدید → ثبت‌نام
    await send("sendMessage", {
      chat_id: chatId,
      text: `سلام ${userName} عزیز! 🌸\n\nبه ربات هوشمند ترنم همدلی (${home}) خوش آمدید.\nمن دکتر رادان هستم؛ مشاور تحصیلی شما در مسیر کنکور. 🚀`,
      reply_markup: BOT_MENU_KEYBOARD,
    });
    await upsertBotProfile(ctx.env, platform, chatId, { name: userName, last_name: userLastName, step: "field" });
    await send("sendMessage", { chat_id: chatId, text: fieldQuestionText(userName) });
    return json({ ok: true });
  }
  // فقط دستور صریح «تغییر رشته» پروفایل را ریست می‌کند
  if (text === "/register" || text === "📋 ثبت‌نام / تغییر رشته") {
    await upsertBotProfile(ctx.env, platform, chatId, { name: userName, last_name: userLastName, step: "field" });
    await send("sendMessage", { chat_id: chatId, text: fieldQuestionText(userName), reply_markup: BOT_MENU_KEYBOARD });
    return json({ ok: true });
  }
  if (text === "/help" || text === "ℹ️ راهنما") {
    await send("sendMessage", { chat_id: chatId, text: BOT_HELP_TEXT, reply_markup: BOT_MENU_KEYBOARD });
    return json({ ok: true });
  }
  if (text === "/smartquiz" || text === "🤖 تست هوشمند RAG" || text === "🤖 تست هوشمند") {
    const prof = await getBotProfile(ctx.env, platform, chatId);
    if (!prof || prof.step !== "done") {
      // ثبت‌نام نیمه‌کاره را ریست نکن — از همان مرحله ادامه بده
      if (!prof) await upsertBotProfile(ctx.env, platform, chatId, { name: userName, step: "field" });
      const stepS = prof?.step || "field";
      const stepMsgS = stepS === "grade" ? gradeQuestionText() : stepS === "gpa" ? gpaQuestionText() : stepS === "age" ? ageQuestionText() : stepS === "mood" ? moodQuestionText() : fieldQuestionText(userName);
      await send("sendMessage", { chat_id: chatId, text: `برای تست هوشمند اول باید بشناسمت! 😊\n\n${stepMsgS}` });
      return json({ ok: true });
    }
    await clearQuizFilter(ctx.env, platform, chatId); // تست هوشمند = خروج از حالت موضوعی
    const sq = await buildSmartQuiz(ctx.env, platform, chatId, prof);
    if (sq) {
      await saveBotQuizState(ctx.env, platform, chatId, sq.qi, sq.item.a);
      await send("sendMessage", { chat_id: chatId, text: sq.text, reply_markup: sq.reply_markup });
    } else {
      await send("sendMessage", { chat_id: chatId, text: "بانک سوال در دسترس نیست؛ کمی بعد دوباره امتحان کن.", reply_markup: BOT_MENU_KEYBOARD });
    }
    return json({ ok: true });
  }
  if (text === "/subjects" || text === "📚 تست موضوعی") {
    const prof = await getBotProfile(ctx.env, platform, chatId);
    const bank = await getBotQuizBank(ctx.env);
    const subs = subjectsForField(bank, prof?.field);
    await send("sendMessage", { chat_id: chatId, text: "📚 کدام درس؟", reply_markup: subjectMenuKeyboard(subs) });
    return json({ ok: true });
  }
  // ✏️ ویرایش اطلاعات ثبت‌نامی: تغییر نام و نام خانوادگی
  if (text.startsWith("/setname")) {
    const parts = text.replace("/setname", "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      await send("sendMessage", { chat_id: chatId, text: "✏️ فرمت: /setname نام نام‌خانوادگی\nمثال: /setname علی رضایی\n\n(برای تغییر رشته/پایه/معدل: «📋 ثبت‌نام / تغییر رشته» در ☰ منو)", reply_markup: BOT_MENU_KEYBOARD });
      return json({ ok: true });
    }
    const newFirst = parts[0].slice(0, 40);
    const newLast = parts.slice(1).join(" ").slice(0, 60) || null;
    await upsertBotProfile(ctx.env, platform, chatId, { name: newFirst, last_name: newLast });
    // 🔄 سینک با حساب سایت (اگر متصل است) — نام در همه‌جا یکی می‌ماند
    let siteSynced = false;
    try {
      if (ctx.env.DB) {
        const link: any = await ctx.env.DB.prepare("SELECT site_user_id FROM bot_profiles WHERE platform=? AND chat_id=?").bind(platform, String(chatId)).first();
        if (link?.site_user_id) {
          await ctx.env.DB.prepare("UPDATE users SET name=? WHERE id=?").bind(`${newFirst}${newLast ? " " + newLast : ""}`, String(link.site_user_id)).run();
          siteSynced = true;
        }
      }
    } catch (_) { /* silent */ }
    await send("sendMessage", { chat_id: chatId, text: `✅ نام به‌روزرسانی شد: ${newFirst}${newLast ? " " + newLast : ""}${siteSynced ? "\n🌐 حساب سایتت هم همگام شد." : ""}`, reply_markup: BOT_MENU_KEYBOARD });
    return json({ ok: true });
  }
  // 📢 پست روزانه کانال — فقط ادمین ربات
  if (text === "/post_channel" || text === "/daily_post") {
    if (!isBotAdmin(ctx.env, chatId)) {
      await send("sendMessage", { chat_id: chatId, text: "⛔ این دستور مخصوص ادمین ربات است." });
      return json({ ok: true });
    }
    const post = await buildChannelDailyPost(ctx.env);
    if (!post) { await send("sendMessage", { chat_id: chatId, text: "بانک سوال در دسترس نیست." }); return json({ ok: true }); }
    const channel = (ctx.env as any).CHANNEL_ID || "@ai_exam_iran";
    await send("sendMessage", { chat_id: channel, text: post.text, reply_markup: post.reply_markup });
    await send("sendMessage", { chat_id: chatId, text: `✅ سوال روز در کانال ${channel} منتشر شد.`, reply_markup: BOT_MENU_KEYBOARD });
    return json({ ok: true });
  }
  if (text === "☰ منو" || text === "/menu") {
    await send("sendMessage", { chat_id: chatId, text: "☰ منوی کامل — یکی را انتخاب کن:", reply_markup: BOT_FULL_MENU_INLINE });
    return json({ ok: true });
  }
  if (text === "/quiz" || text === "📝 تست کنکور واقعی" || text === "📝 تست") {
    const prof = await getBotProfile(ctx.env, platform, chatId);
    if (prof && prof.step === "field") { await send("sendMessage", { chat_id: chatId, text: fieldQuestionText(userName) }); return json({ ok: true }); }
    if (prof && prof.step === "grade") { await send("sendMessage", { chat_id: chatId, text: gradeQuestionText() }); return json({ ok: true }); }
    if (prof && prof.step === "gpa") { await send("sendMessage", { chat_id: chatId, text: gpaQuestionText() }); return json({ ok: true }); }
    if (prof && prof.step === "age") { await send("sendMessage", { chat_id: chatId, text: ageQuestionText() }); return json({ ok: true }); }
    if (prof && prof.step === "mood") { await send("sendMessage", { chat_id: chatId, text: moodQuestionText() }); return json({ ok: true }); }
    await clearQuizFilter(ctx.env, platform, chatId);
    const quiz = await buildBotQuiz(ctx.env, platform, prof);
    await saveBotQuizState(ctx.env, platform, chatId, quiz.qi, quiz.item.a);
    await send("sendMessage", { chat_id: chatId, text: quiz.text, reply_markup: quiz.reply_markup });
    return json({ ok: true });
  }

  // 💬 اگر کاربر در حالت «ثبت نظر روی سوال» است، این پیام = نظر او
  if (text === "/cancel") {
    try { if (ctx.env.DB) await ctx.env.DB.prepare("DELETE FROM bot_comment_state WHERE platform=? AND chat_id=?").bind(platform, String(chatId)).run(); } catch (_) {}
    await send("sendMessage", { chat_id: chatId, text: "باشه، لغو شد. 👌", reply_markup: BOT_MENU_KEYBOARD });
    return json({ ok: true });
  }
  {
    let cState: any = null;
    try {
      if (ctx.env.DB) {
        cState = await ctx.env.DB.prepare("SELECT qi, created_at FROM bot_comment_state WHERE platform=? AND chat_id=?").bind(platform, String(chatId)).first();
        // حالت نظر بعد از ۱۰ دقیقه منقضی می‌شود تا پیام‌های مشاوره بعدی را قورت ندهد
        if (cState && Date.now() - Date.parse(cState.created_at) > 10 * 60 * 1000) {
          await ctx.env.DB.prepare("DELETE FROM bot_comment_state WHERE platform=? AND chat_id=?").bind(platform, String(chatId)).run();
          cState = null;
        }
      }
    } catch (_) { /* silent */ }
    const isMenuBtn = ["📝 تست", "🤖 تست هوشمند", "☰ منو", "📜 تاریخچه", "💳 اعتبار", "🎬 دبیر", "📊 داشبورد", "🧠 تحلیل"].some((b) => text.startsWith(b));
    if (cState && text.length >= 2 && !text.startsWith("/") && !isMenuBtn) {
      const qi = Number(cState.qi);
      try {
        if (ctx.env.DB) {
          const bank = await getBotQuizBank(ctx.env);
          await ctx.env.DB.prepare("DELETE FROM bot_comment_state WHERE platform=? AND chat_id=?").bind(platform, String(chatId)).run();
          await ctx.env.DB.prepare(
            "INSERT INTO question_comments (id, platform, chat_id, qi, subject, comment, created_at) VALUES (?,?,?,?,?,?,?)"
          ).bind(randomToken(12), platform, String(chatId), qi, bank[qi]?.s || null, text.slice(0, 500), new Date().toISOString()).run();
        }
      } catch (_) { /* silent */ }
      await send("sendMessage", {
        chat_id: chatId,
        text: "✅ نظرت روی این سوال ثبت شد — ممنون! 🙏\nنظرات کاربران مستقیم در دیتابیس مرکزی ذخیره می‌شود و برای اصلاح بانک سوالات استفاده می‌کنیم.",
        reply_markup: {
          inline_keyboard: [[
            { text: "🔄 سوال بعدی", callback_data: "qz:next" },
            { text: "📊 داشبورد", callback_data: "qz:dash" },
          ]],
        },
      });
      return json({ ok: true });
    }
  }

  // اعداد آزاد (معدل/سن) در میانه ثبت‌نام
  {
    const prof0 = await getBotProfile(ctx.env, platform, chatId);
    if (prof0 && (prof0.step === "gpa" || prof0.step === "age")) {
      const numTxt = text.replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace("/", ".").replace("٫", ".");
      const val = parseFloat(numTxt);
      if (!isNaN(val) && val >= 0) {
        if (prof0.step === "gpa") {
          if (val > 20) { await send("sendMessage", { chat_id: chatId, text: "معدل باید بین ۰ تا ۲۰ باشد. دوباره بفرست:" }); return json({ ok: true }); }
          await upsertBotProfile(ctx.env, platform, chatId, { gpa: val, step: "age" });
          await send("sendMessage", { chat_id: chatId, text: `✅ معدل: ${val > 0 ? faNum(val) : "ترجیح دادی نگویی"}\n\n${ageQuestionText()}` });
          return json({ ok: true });
        }
        if (val !== 0 && (val < 10 || val > 80)) { await send("sendMessage", { chat_id: chatId, text: "سن معتبر بفرست (۱۰ تا ۸۰) یا 0:" }); return json({ ok: true }); }
        await upsertBotProfile(ctx.env, platform, chatId, { age: Math.round(val), step: "mood" });
        await send("sendMessage", { chat_id: chatId, text: `✅ سن ثبت شد.\n\n${moodQuestionText()}` });
        return json({ ok: true });
      }
      return json({ ok: true });
    }
    // مرحله خلق (۱-۴)
    const profM = await getBotProfile(ctx.env, platform, chatId);
    if (profM && profM.step === "mood") {
      const mnum = text.match(/^[\s]*([1-4۱-۴])[\s]*$/);
      if (mnum) {
        const mmap: Record<string, number> = { "1":1,"2":2,"3":3,"4":4,"۱":1,"۲":2,"۳":3,"۴":4 };
        await upsertBotProfile(ctx.env, platform, chatId, { mood: mmap[mnum[1]], step: "done" });
        const done = await getBotProfile(ctx.env, platform, chatId);
        await send("sendMessage", { chat_id: chatId, text: profileSummary(done!), reply_markup: BOT_MENU_KEYBOARD });
        // بلافاصله بپرس کدام درس را دوست دارد تست بزند
        const bankD = await getBotQuizBank(ctx.env);
        const subsD = subjectsForField(bankD, done?.field);
        if (subsD.length) {
          await send("sendMessage", {
            chat_id: chatId,
            text: "📚 دوست داری از کدام درس تست بزنی؟ (عدد داخل پرانتز = تعداد سوال موجود)",
            reply_markup: subjectMenuKeyboard(subsD),
          });
        } else {
          // بانک در دسترس نبود/درسی پیدا نشد — کاربر را بلاتکلیف نگذار
          await send("sendMessage", { chat_id: chatId, text: "برای شروع، دکمه «📝 تست» را بزن تا اولین سوال کنکور واقعی برایت بیاید! 🚀", reply_markup: BOT_MENU_KEYBOARD });
        }
        return json({ ok: true });
      }
      await send("sendMessage", { chat_id: chatId, text: moodQuestionText() });
      return json({ ok: true });
    }
  }

  // پاسخ عددی (۱ تا ۵): اولویت ۱) تکمیل ثبت‌نام  ۲) پاسخ به سوال فعال تست
  const numAns = text.match(/^[\s]*([1-7۱-۷])[\s]*$/);
  if (numAns) {
    const map: Record<string, number> = { "1":0,"2":1,"3":2,"4":3,"5":4,"6":5,"7":6,"۱":0,"۲":1,"۳":2,"۴":3,"۵":4,"۶":5,"۷":6 };
    const chosen = map[numAns[1]];
    // --- جریان ثبت‌نام (رشته → پایه → معدل → سن) ---
    const prof = await getBotProfile(ctx.env, platform, chatId);
    if (prof && prof.step === "field") {
      if (chosen >= BOT_FIELDS.length) { await send("sendMessage", { chat_id: chatId, text: fieldQuestionText(userName) }); return json({ ok: true }); }
      const field = BOT_FIELDS[chosen];
      await upsertBotProfile(ctx.env, platform, chatId, { field, step: "grade" });
      await send("sendMessage", { chat_id: chatId, text: `✅ رشته: ${field}\n\n${gradeQuestionText()}` });
      return json({ ok: true });
    }
    if (prof && prof.step === "grade") {
      if (chosen >= BOT_GRADES.length) { await send("sendMessage", { chat_id: chatId, text: gradeQuestionText() }); return json({ ok: true }); }
      const grade = BOT_GRADES[chosen];
      await upsertBotProfile(ctx.env, platform, chatId, { grade, step: "gpa" });
      await send("sendMessage", { chat_id: chatId, text: `✅ پایه: ${grade}\n\n${gpaQuestionText()}` });
      return json({ ok: true });
    }
    const st = await popBotQuizState(ctx.env, platform, chatId);
    if (st) {
      if (chosen > 3) { await send("sendMessage", { chat_id: chatId, text: "گزینه ۱ تا ۴ را بفرست." }); await saveBotQuizState(ctx.env, platform, chatId, st.qi, st.correct_idx); return json({ ok: true }); }
      await gradeBotAnswer(ctx.env, send, platform, chatId, st.qi, st.correct_idx, chosen);
      return json({ ok: true });
    }
    await send("sendMessage", {
      chat_id: chatId,
      text: "سوال فعالی نداری! اول «📝 تست کنکور واقعی» یا /quiz را بزن.",
      reply_markup: BOT_MENU_KEYBOARD,
    });
    return json({ ok: true });
  }
  if (text === "/dashboard" || text === "📊 داشبورد من") {
    const st = await getBotQuizStats(ctx.env, platform, chatId);
    await send("sendMessage", {
      chat_id: chatId,
      text: st ? buildBotDashboard(st, await getBotProfile(ctx.env, platform, chatId)) : "داشبورد فعلاً در دسترس نیست.",
      reply_markup: st ? {
        inline_keyboard: [
          [{ text: "🧠 تحلیل روانشناسی + پیشنهاد مسیر", callback_data: "menu:analysis" }],
          [{ text: "🤖 تست هوشمند (نقطه‌ضعف)", callback_data: "menu:smart" }, { text: "📚 تست موضوعی", callback_data: "menu:subjects" }],
        ],
      } : BOT_MENU_KEYBOARD,
    });
    return json({ ok: true });
  }
  if (text === "/analysis" || text === "🧠 تحلیل روانشناسی") {
    await send("sendChatAction", { chat_id: chatId, action: "typing" });
    const st = await getBotQuizStats(ctx.env, platform, chatId);
    const msg = st ? await buildBotPsychAnalysis(ctx, meta, st, platform, chatId) : "تحلیل فعلاً در دسترس نیست.";
    await send("sendMessage", { chat_id: chatId, text: msg, reply_markup: BOT_MENU_KEYBOARD });
    return json({ ok: true });
  }
  if (text === "/history" || text === "📜 تاریخچه" || text === "📜 تاریخچه من") {
    await send("sendMessage", { chat_id: chatId, text: await buildBotHistory(ctx.env, platform, chatId), reply_markup: BOT_MENU_KEYBOARD });
    return json({ ok: true });
  }
  // 🔗 /link موبایل رمز — اتصال حساب موجود سایت (ثبت‌نامی با موبایل) به همین ربات
  if (text.startsWith("/link")) {
    const parts = text.replace("/link", "").trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) {
      await send("sendMessage", { chat_id: chatId, text: "🔗 اتصال حساب سایت به ربات:\n/link شماره‌موبایل رمزعبور\nمثال: /link 09121234567 mypass123\n\nبعد از اتصال، کارنامه و پروفایل ربات و سایت یکی می‌شود.", reply_markup: BOT_MENU_KEYBOARD });
      return json({ ok: true });
    }
    const store3 = getAuthStore(ctx.env);
    if (!store3 || !ctx.env.DB) { await send("sendMessage", { chat_id: chatId, text: "سرویس حساب‌ها در دسترس نیست." }); return json({ ok: true }); }
    const identifier = parts[0].replace(/[۰-۹]/g, (c) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(c)));
    const password = parts[1];
    const target = await store3.findUserByIdentifier(identifier);
    const okPass = target ? safeEqual(await pbkdf2(password, target.password_salt), target.password_hash) : false;
    if (!target || !okPass) {
      await send("sendMessage", { chat_id: chatId, text: "❌ موبایل/ایمیل یا رمز اشتباه است. (همان اطلاعات ورود سایت را بفرست)", reply_markup: BOT_MENU_KEYBOARD });
      return json({ ok: true });
    }
    // اتصال: پروفایل ربات به این حساب وصل می‌شود؛ حساب bot-ساخته قبلی (اگر بود و خالی بود) رها می‌شود
    await ctx.env.DB.prepare("UPDATE bot_profiles SET site_user_id=?, name=COALESCE(?, name) WHERE platform=? AND chat_id=?")
      .bind(target.id, target.name || null, platform, String(chatId)).run();
    await send("sendMessage", {
      chat_id: chatId,
      text: `✅ حسابت وصل شد!\n👤 ${target.name}\n📱 ${target.mobile || target.email}\n\nاز الان ربات و سایت یک هویت واحدند: کارنامه، اعتبار و پروفایل مشترک. دکمه «🌐 ورود به سایت» هم با همین حساب لینک می‌دهد.`,
      reply_markup: BOT_MENU_KEYBOARD,
    });
    return json({ ok: true });
  }
  if (text === "/site" || text === "🌐 ورود به سایت") {
    const r = await buildSiteLoginMessage(ctx.env, platform, chatId);
    await send("sendMessage", { chat_id: chatId, text: r.text, reply_markup: r.reply_markup });
    return json({ ok: true });
  }
  if (text === "/courses" || text === "🎬 دبیر و دوره رایگان" || text === "🎬 دوره‌ها") {
    const cf = await buildBotCourseFinder(ctx.env, platform, chatId);
    await send("sendMessage", { chat_id: chatId, text: cf.text, reply_markup: cf.reply_markup });
    return json({ ok: true });
  }
  if (text === "/credit" || text === "💳 اعتبار من" || text === "💳 اعتبار و خرید" || text === "💳 اعتبار") {
    const profC = await getBotProfile(ctx.env, platform, chatId);
    const credit = await getBotCredit(ctx.env, platform, chatId);
    const v = buildBotCreditView(ctx.env, credit, profC?.name);
    await send("sendMessage", { chat_id: chatId, text: v.text, reply_markup: v.reply_markup });
    return json({ ok: true });
  }
  if (text === "/status" || text === "📈 وضعیت سامانه" || text === "📊 وضعیت سامانه") {
    await send("sendMessage", { chat_id: chatId, text: await buildBotStatus(ctx.env, platform), reply_markup: BOT_MENU_KEYBOARD });
    return json({ ok: true });
  }
  if (text === "💬 مشاوره با دکتر رادان") {
    await send("sendMessage", {
      chat_id: chatId,
      text: "💬 بفرمایید! سوال درسی، برنامه‌ریزی یا هر دغدغه‌ای دارید همین‌جا بنویسید تا پاسخ بدهم.",
      reply_markup: BOT_MENU_KEYBOARD,
    });
    return json({ ok: true });
  }

  // دستور ناشناخته (مثل /foobar) → راهنما، نه AI و نه مصرف سهمیه
  if (text.startsWith("/")) {
    await send("sendMessage", {
      chat_id: chatId,
      text: `دستور «${text.split(/\s/)[0].slice(0, 30)}» را نمی‌شناسم. 🤔\n\nدستورات موجود:\n/start /quiz /smartquiz /dashboard /analysis /history /credit /courses /subjects /setname /status /help`,
      reply_markup: BOT_MENU_KEYBOARD,
    });
    return json({ ok: true });
  }

  // --- 3) free text → AI counselor (RAG + Hugging Face Llama) ---
  // سهمیه روزانه: جلوگیری از مصرف بی‌رویه AI (هر کاربر جدا شمرده می‌شود)
  // 💳 کنترل اعتبار: بعد از هفته رایگان، هر پیام از اعتبار ۱۰۰هزار تومانی کم می‌شود
  const creditPre = await getBotCredit(ctx.env, platform, chatId);
  if (creditPre.hasProfile && !creditPre.inTrial && creditPre.balanceToman < BOT_CHAT_COST_TOMAN) {
    await send("sendMessage", {
      chat_id: chatId,
      text: [
        "⛔ اعتبار مشاوره‌ات تمام شد!",
        "━━━━━━━━━━━━━━━",
        `🎁 هفته رایگان: مصرف شد (${faDate(creditPre.signupDay)} تا ${faDate(creditPre.trialEndDay)})`,
        `💰 اعتبار هدیه ${faMoney(BOT_FREE_CREDIT_TOMAN)} تومانی سایت: مصرف شد (${faMoney(Math.min(creditPre.consumedToman, creditPre.totalToman))} تومان)`,
        "",
        "برای ادامه مشاوره هوشمند با دکتر رادان، اعتبار بخر:",
        "🛒 پرداخت آنلاین زرین‌پال از سایت، یا 🏦 کارت‌به‌کارت",
        "",
        "📝 تست، داشبورد و تحلیل همچنان رایگان است!",
      ].join("\n"),
      reply_markup: {
        inline_keyboard: [
          [{ text: "🛒 خرید اعتبار (زرین‌پال - سایت)", url: (ctx.env.APP_URL || "https://hamdeltar.ir") + "/?buy=credit" }],
          [{ text: "🏦 کارت‌به‌کارت (شماره کارت)", callback_data: "credit:card" }],
          [{ text: "💳 وضعیت اعتبار من", callback_data: "menu:credit" }],
        ],
      },
    });
    return json({ ok: true });
  }
  const quota = await checkChatQuota(ctx.env, platform, chatId);
  if (!quota.ok) {
    await send("sendMessage", {
      chat_id: chatId,
      text: `⏳ سهمیه مشاوره امروزت تمام شد (${faNum(quota.limit)} پیام در روز).\n\nفردا دوباره می‌توانی سوال بپرسی — تا آن موقع «📝 تست» و «📊 داشبورد» بدون محدودیت فعال‌اند!\n🌐 مشاوره نامحدود: hamdeltar.ir`,
      reply_markup: BOT_MENU_KEYBOARD,
    });
    return json({ ok: true });
  }
  let replyText = "";
  let usedEngine = "";
  // ⌨️ نشانگر «در حال نوشتن…» — کاربر بداند ربات مشغول فکر کردن است (پاسخ AI چند ثانیه طول می‌کشد)
  await send("sendChatAction", { chat_id: chatId, action: "typing" });
  try {
    // ۱) بازیابی سوالات مرتبط از بانک RAG هاگینگ‌فیس برای زمینه (کاهش هالوسینیشن)
    const rag = await botRagContext(ctx.env, text);
    // اگر بازیابی به درس مشخصی خورد، پروفایل روند همان درس هم به کانتکست اضافه شود
    let structCtx = "";
    try {
      if (rag.hits.length > 0) {
        const profs = await getStructureProfiles(ctx.env);
        const subj = rag.hits[0].s;
        const tp = profs.find((p: any) => p.subject === subj);
        if (tp) structCtx = `\n\nروند ساختار درس «${subj}» در کنکورهای اخیر (از بانک رسمی): توزیع سال: ${tp.year_dist} | سختی: آسان${tp.difficulty?.["آسان"]}٪ متوسط${tp.difficulty?.["متوسط"]}٪ سخت${tp.difficulty?.["سخت"]}٪ | تحلیل: ${tp.ai_trend}`;
      }
    } catch (_) { /* silent */ }
    const sysBase = `شما دکتر رادان، مشاور تحصیلی ترنم همدلی در ${platform === "telegram" ? "تلگرام" : "پیام‌رسان بله"} هستید. کوتاه (حداکثر ۶ جمله)، صمیمی و همدلانه به فارسی پاسخ دهید.`;
    const sys = rag.context
      ? `${sysBase}\n\nسوالات مرتبط از بانک رسمی کنکور (در صورت ارتباط، با ذکر سال به آن‌ها استناد کن):\n${rag.context}${structCtx}`
      : sysBase + structCtx;

    // ۲) مسابقه موازی دو Llama-70B (هاگینگ‌فیس + Workers AI) — سریع‌ترین موفق برنده
    const race = await bestAiReply(ctx.env, sys, text);
    if (race) { replyText = race.text; usedEngine = race.engine; }
    if (!replyText) {
      const ai = getAI(ctx.request, { message: text }, ctx.env, meta);
      if (ai) {
        const res = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [{ role: "user", parts: [{ text }] }],
          config: { systemInstruction: sys },
        });
        replyText = res.text?.trim() || "";
      }
    }
    if (!replyText) replyText = getOfflineChatReply(text);
    // ۳) اگر سوال مرتبط در بانک بود، دکمه «تمرین همین مبحث» اضافه شود
    if (rag.hits.length > 0) {
      const bank = await getBotQuizBank(ctx.env);
      const qi = bank.indexOf(rag.hits[0]);
      if (qi >= 0) {
        await send("sendMessage", {
          chat_id: chatId,
          text: replyText + `\n\n📚 ${faNum(rag.hits.length)} سوال مرتبط از کنکورهای واقعی در بانک داریم.`,
          reply_markup: {
            inline_keyboard: [[
              { text: "📝 تمرین همین مبحث", callback_data: `qz:show:${qi}` },
              { text: "🔄 سوال تصادفی", callback_data: "qz:next" },
            ]],
          },
        });
        return json({ ok: true });
      }
    }
  } catch (_) {
    replyText = replyText || getOfflineChatReply(text);
  }
  const engineFa = usedEngine === "hf-llama-70b" ? "Llama-70B (هاگینگ‌فیس)" : usedEngine === "workers-ai-llama-70b" ? "Llama-70B (کلودفلر)" : "موتور آفلاین";
  const creditTxt = creditPre.hasProfile && !creditPre.inTrial
    ? ` | 💳 مانده: ${faMoney(Math.max(0, creditPre.balanceToman - BOT_CHAT_COST_TOMAN))} ت`
    : creditPre.hasProfile && creditPre.inTrial
      ? ` | 🎁 هفته رایگان (${faNum(creditPre.trialDaysLeft)} روز مانده)`
      : "";
  const footer = `\n\n─────\n🤖 ${engineFa} | 💬 ${faNum(quota.used)}/${faNum(quota.limit)} پیام امروز${creditTxt}`;
  await send("sendMessage", { chat_id: chatId, text: replyText + footer, reply_markup: BOT_MENU_KEYBOARD });
  return json({ ok: true });
}

async function telegramWebhook(ctx: Ctx, meta: RespMeta): Promise<Response> {
  return handleBotUpdate(ctx, meta, "telegram");
}

async function baleWebhook(ctx: Ctx, meta: RespMeta): Promise<Response> {
  return handleBotUpdate(ctx, meta, "bale");
}

async function generateQuizQuestion(ctx: Ctx, meta: RespMeta): Promise<Response> {
  const body = await readJson(ctx.request);
  const { subject, difficulty, customTopic } = body;
  const start = performance.now();

  const offlineFallbacks: Record<string, any[]> = {
    "زیست‌شناسی": [
      {
        id: "Q-OFFLINE-BIO-1", subject: "زیست‌شناسی", title: "غشای سلولی و انتقال فعال",
        text: "کدام گزینه درباره پمپ سدیم-پتاسیم در غشای یک نورون حرکتی مغز درست است؟",
        options: [
          "به ازای خروج هر ۳ یون سدیم، ۲ یون پتاسیم را با مصرف یک مولکول ATP وارد می‌کند.",
          "فعالیت آن همواره غلظت سدیم درون سلول را بالاتر از بیرون نگه می‌دارد.",
          "تنها در هنگام تولید پتانسیل عمل شروع به کار کرده و به سرعت غیرفعال می‌شود.",
          "با خروج یون سدیم، غلظت آب درون نورون را به شدت افزایش می‌دهد.",
        ],
        correctIdx: 0,
        explanation: "گزینه ۱ پاسخ صحیح است. پمپ سدیم پتاسیم یک پروتئین غشایی ناقل فعال است که با مصرف ATP سه یون Na+ را خارج و دو یون پتاسیم را وارد می‌کند.",
        trapType: "تله جابجایی تعداد یون‌ها یا غلظت درون سلولی که معمولاً دانش‌آموزان در استرس آزمون اشتباه می‌کنند.",
        difficulty: difficulty || "سخت", importance: "high",
      },
    ],
    "شیمی": [
      {
        id: "Q-OFFLINE-CHEM-1", subject: "شیمی", title: "محلول‌ها و غلظت‌ها",
        text: "در دمای معین غلظت یون هیدرونیوم در محلول اسیدی با pH برابر ۳ چند برابر غلظت آن در محلولی با pH برابر ۵ است؟",
        options: ["۱۰۰ برابر", "۱۰ برابر", "۲ برابر", "۰.۰۱ برابر"],
        correctIdx: 0,
        explanation: "تفاوت pH برابر ۲ به معنی تفاوت غلظت ۱۰ به توان ۲ برابر یعنی ۱۰۰ برابر می‌باشد.",
        trapType: "تله‌ی عکس پنداشتن نسبت غلظت با تغییرات یون هیدرونیوم در مقیاس لگاریتمی.",
        difficulty: difficulty || "سخت", importance: "high",
      },
    ],
    "ریاضی": [
      {
        id: "Q-OFFLINE-MATH-1", subject: "ریاضی", title: "مشتق و پیوستگی",
        text: "کدام یک از جملات زیر درباره مشتق‌پذیری توابع در بازه مفروض همواره برقرار است؟",
        options: [
          "هر تابع پیوسته‌ای در بازه مفروض قطعا مشتق‌پذیر نیز هست.",
          "هر تابع مشتق‌پذیری در بازه مفروض قطعا پیوسته است.",
          "نقاط عطف تابع همواره دارای مشتق اول برابر صفر می‌باشند.",
          "تابع پیوسته لزوما فاقد نقطه گوشه‌ای یا عطف می‌باشد.",
        ],
        correctIdx: 1,
        explanation: "طبق قضیه اساسی حساب دیفرانسیل، شرط لازم برای مشتق‌پذیری یک تابع در یک نقطه، پیوسته بودن آن در آن نقطه است. اما عکس آن برقرار نیست.",
        trapType: "استفاده غلط از عکس قضیه منطقی پیوستگی و مشتق‌پذیری.",
        difficulty: difficulty || "متوسط", importance: "high",
      },
    ],
    "فیزیک": [
      {
        id: "Q-OFFLINE-PHYS-1", subject: "فیزیک", title: "الکتریسیته و مدارها",
        text: "با افزایش مقاومت متغیر در یک مدار ساده تک‌حلقه که دارای باتری با مقاومت درونی غیرصفر است، اختلاف پتانسیل دو سر باتری چگونه تغییر می‌کند؟",
        options: ["کاهش می‌یابد.", "افزایش می‌یابد.", "تغییری نمی‌کند.", "ابتدا کاهش و سپس افزایش پیدا می‌کند."],
        correctIdx: 1,
        explanation: "فرمول پتانسیل ترمینال باتری V = E - ir است. با افزایش مقاومت خارجی، جریان کاهش یافته و پتانسیل ترمینال افزایش می‌یابد.",
        trapType: "تله‌ی پنداشتن اینکه پتانسیل دو سر همواره با مقاومت خارجی رابطه عکس دارد.",
        difficulty: difficulty || "سخت", importance: "high",
      },
    ],
  };

  const defaultQuestions = offlineFallbacks[subject] || [
    {
      id: "Q-OFFLINE-GEN-1", subject: subject || "عمومی", title: "مفهوم پایه و عارضه‌یابی",
      text: `یک سوال تستی ارزشمند درباره مبحث (${customTopic || subject || "تحلیل تحصیلی"}) طراحی آزمون های شبیه‌ساز ترنم مهر.`,
      options: [
        "پالت کایزن و بهبود مستمر عادات ذهنی تستی",
        "تمرکز صِرف روی تست زنی بدون تحلیل بهداشت روان",
        "حذف دوره‌های مرور دوره‌ای مباحث پرضریب کنکور",
        "کمال‌گرایی منفی در حل سوالات وقت‌گیر و تله‌دار",
      ],
      correctIdx: 0,
      explanation: "سیستم کایزن ترنم مهر بر بهبود مداوم و تحلیل بهداشت روان تاکید دارد.",
      trapType: "وسواس کمال‌گرایی در مدیریت تست‌ها", difficulty: "سخت", importance: "medium",
    },
  ];

  try {
    const ai = getAI(ctx.request, body, ctx.env, meta);
    if (!ai) {
      const selected = defaultQuestions[Math.floor(Math.random() * defaultQuestions.length)];
      if (customTopic && selected.id === "Q-OFFLINE-GEN-1") {
        selected.text = `یک سوال تستی ارزشمند درباره مبحث تخصصی (${customTopic}) منطبق بر آزمون های شبیه‌سازی کایزن درگاه ترنم مهر.`;
      }
      return json({
        success: true, question: selected,
        metadata: {
          model: "Kaizen Local Logic Suite", mode: "offline", timestamp: new Date().toISOString(),
          latencyMs: Math.round(performance.now() - start),
          apiStatus: "هیچ کلید فعالی در پنل ادمین یافت نشد. برای تست زنده کلید اختصاصی خود را وارد کنید.",
        },
      }, 200, meta.headers);
    }

    const aiPrompt = `You are an elite, highly experienced question designer for the Iranian National College Entrance Exam (Konkur) for the subject "${subject || "زیست‌شناسی"}".
Generate EXACTLY ONE high-quality, conceptual, and difficult multiple-choice test question in Persian.
The question MUST cover the following precise topic: "${customTopic || "مفاهیم خلاقانه و پر بازده کتاب درسی"}".
Focus on designing a difficult but logically flawless question with difficulty level: "${difficulty || "سخت"}".
Include a strong psychological or conceptual test trap ("تله تستی") that matches high-yield school curriculum standards.

You must respond with EXACTLY a valid JSON object matching this structure (do not wrap in markdown, use Persian language for user-facing values):
{
  "id": "Q-AI-${Math.floor(Math.random() * 9000 + 1000)}",
  "subject": "${subject || "زیست‌شناسی"}",
  "title": "A brief Persian title of the subtopic inside ${subject}",
  "text": "The full Persian question, written in a clear, educational, standard Konkur style.",
  "options": ["Persian Option 1", "Persian Option 2", "Persian Option 3", "Persian Option 4"],
  "correctIdx": 0,
  "explanation": "Extremely detailed Persian explanation.",
  "trapType": "Explain the trap in Persian in 1 elegant sentence.",
  "difficulty": "${difficulty || "سخت"}",
  "importance": "high"
}

Verify that correctIdx is a valid number from 0 to 3 and references the actual correct option.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
      config: { responseMimeType: "application/json" },
    });

    const replyText = response.text?.trim() || "";
    let questionObj: any;
    try {
      questionObj = JSON.parse(replyText);
    } catch (_) {
      const jsonMatch = replyText.match(/\{[\s\S]*\}/);
      if (jsonMatch) questionObj = JSON.parse(jsonMatch[0]);
      else throw new Error("Failed to parse AI output as JSON: " + replyText.substring(0, 50));
    }

    if (!questionObj.title || !questionObj.text || !Array.isArray(questionObj.options) || questionObj.options.length < 4) {
      throw new Error("Generated question structure was invalid.");
    }

    return json({
      success: true, question: questionObj,
      metadata: {
        model: "Google Gemini 3.5-flash", mode: "live", timestamp: new Date().toISOString(),
        latencyMs: Math.round(performance.now() - start), apiStatus: "ارتباط موفق زنده (Real-Time API)",
      },
    }, 200, meta.headers);
  } catch (error: any) {
    const selectedFallback = defaultQuestions[Math.floor(Math.random() * defaultQuestions.length)];
    if (customTopic && selectedFallback.id === "Q-OFFLINE-GEN-1") {
      selectedFallback.text = `یک سوال تستی ارزشمند درباره مبحث تخصصی (${customTopic}) منطبق بر آزمون های شبیه‌سازی کایزن درگاه ترنم مهر.`;
    }
    return json({
      success: true, question: selectedFallback,
      metadata: {
        model: "Kaizen Local Simulator Mode", mode: "fallback", timestamp: new Date().toISOString(),
        latencyMs: Math.round(performance.now() - start),
        apiStatus: "انتقال خودکار به شبیه‌ساز پایدار: " + (error?.message || "خطای ارتباطی با API"),
      },
    }, 200, meta.headers);
  }
}

/* ----------------------------------------------------------------------------
 * Authentication (Cloudflare D1 + Web Crypto, no Node deps)
 * -------------------------------------------------------------------------
 * Routes:
 *   POST /api/auth/register   {name,email,mobile,password,field,city,age,targetMajor}
 *   POST /api/auth/login      {identifier,password}
 *   POST /api/auth/otp-send   {mobile}
 *   POST /api/auth/otp-verify {mobile,code}
 *   GET  /api/auth/me
 *   POST /api/auth/logout
 *   GET  /api/auth/count
 * ------------------------------------------------------------------------- */

const SESSION_COOKIE = "taranom_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const OTP_TTL_MS = 1000 * 60 * 5; // 5 minutes

/* --- Rate limiting (brute-force protection) --- */
const LOGIN_WINDOW_MS = 15 * 60 * 1000;   // 15 minutes
const LOGIN_MAX_ATTEMPTS = 5;             // per identifier (account)
const LOGIN_IP_MAX_ATTEMPTS = 20;         // per client IP (distributed attempts)
const OTP_SEND_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const OTP_SEND_MAX = 3;                   // OTP sends per mobile
const OTP_VERIFY_WINDOW_MS = 10 * 60 * 1000;
const OTP_VERIFY_MAX = 5;                 // OTP verify attempts per mobile

function getClientIp(req: Request): string {
  const raw = req.headers.get("CF-Connecting-IP") || req.headers.get("x-forwarded-for") || "unknown";
  return raw.split(",")[0].trim();
}

async function rateLimitStatus(store: AuthStore, key: string, windowMs: number, max: number):
  Promise<{ blocked: boolean; retryAfterSec: number }> {
  const row = await store.getRateLimit(key);
  if (!row) return { blocked: false, retryAfterSec: 0 };
  const elapsed = Date.now() - new Date(row.window_start).getTime();
  if (elapsed >= windowMs) return { blocked: false, retryAfterSec: 0 }; // window expired
  if (row.count >= max) {
    return { blocked: true, retryAfterSec: Math.ceil((windowMs - elapsed) / 1000) };
  }
  return { blocked: false, retryAfterSec: 0 };
}

async function recordRateLimit(store: AuthStore, key: string, windowMs: number): Promise<void> {
  const row = await store.getRateLimit(key);
  const now = Date.now();
  let count = 1;
  let windowStart = new Date(now).toISOString();
  if (row) {
    const elapsed = now - new Date(row.window_start).getTime();
    if (elapsed < windowMs) {
      count = row.count + 1;
      windowStart = row.window_start;
    }
  }
  await store.upsertRateLimit(key, count, windowStart);
}

function rateLimited(retryAfterSec: number): Response {
  return json(
    { error: "تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید.", retryAfter: retryAfterSec },
    429,
    { "Retry-After": String(retryAfterSec) }
  );
}

interface UserRow {
  id: string; email: string | null; mobile: string | null; name: string;
  password_hash: string; password_salt: string; role: string; field: string;
  grade: string | null; city: string | null; age: number | null; avatar: string | null;
  target_major: string | null; created_at: string;
}
interface SessionRow { token: string; user_id: string; created_at: string; expires_at: string; }
interface OtpRow { mobile: string; code: string; created_at: string; expires_at: string; }

/** Minimal user-datastore interface so auth is testable without real D1. */
interface AuthStore {
  insertUser(u: UserRow): Promise<void>;
  findUserByIdentifier(identifier: string): Promise<UserRow | null>;
  findUserById(id: string): Promise<UserRow | null>;
  countUsers(): Promise<number>;
  listUsers(): Promise<UserRow[]>;
  updateUserRole(id: string, role: string): Promise<void>;
  upsertSession(s: SessionRow): Promise<void>;
  findSession(token: string): Promise<SessionRow | null>;
  deleteSession(token: string): Promise<void>;
  upsertOtp(o: OtpRow): Promise<void>;
  findOtp(mobile: string): Promise<OtpRow | null>;
  deleteOtp(mobile: string): Promise<void>;
  getRateLimit(key: string): Promise<RateLimitRow | null>;
  upsertRateLimit(key: string, count: number, windowStart: string): Promise<void>;
  deleteRateLimit(key: string): Promise<void>;
}

interface RateLimitRow {
  key: string;
  count: number;
  window_start: string;
  updated_at: string;
}

/** D1-backed store (production). */
class D1AuthStore implements AuthStore {
  constructor(private db: any) {}
  async insertUser(u: UserRow) {
    await this.db.prepare(
      "INSERT INTO users (id,email,mobile,name,password_hash,password_salt,role,field,grade,city,age,avatar,target_major,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    ).bind(u.id, u.email, u.mobile, u.name, u.password_hash, u.password_salt, u.role, u.field, u.grade, u.city, u.age, u.avatar, u.target_major, u.created_at).run();
  }
  async findUserByIdentifier(identifier: string) {
    return (await this.db.prepare("SELECT * FROM users WHERE email = ? OR mobile = ?").bind(identifier, identifier).first()) as UserRow | null;
  }
  async findUserById(id: string) {
    return (await this.db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first()) as UserRow | null;
  }
  async countUsers() {
    const r: any = await this.db.prepare("SELECT COUNT(*) as c FROM users").first();
    return Number(r?.c || 0);
  }
  async listUsers() {
    const r = await this.db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
    return (r?.results || []) as UserRow[];
  }
  async updateUserRole(id: string, role: string) {
    await this.db.prepare("UPDATE users SET role = ? WHERE id = ?").bind(role, id).run();
  }
  async upsertSession(s: SessionRow) {
    await this.db.prepare("INSERT OR REPLACE INTO sessions (token,user_id,created_at,expires_at) VALUES (?,?,?,?)")
      .bind(s.token, s.user_id, s.created_at, s.expires_at).run();
  }
  async findSession(token: string) {
    return (await this.db.prepare("SELECT * FROM sessions WHERE token = ?").bind(token).first()) as SessionRow | null;
  }
  async deleteSession(token: string) {
    await this.db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }
  async upsertOtp(o: OtpRow) {
    await this.db.prepare("INSERT OR REPLACE INTO otp_codes (mobile,code,created_at,expires_at) VALUES (?,?,?,?)")
      .bind(o.mobile, o.code, o.created_at, o.expires_at).run();
  }
  async findOtp(mobile: string) {
    return (await this.db.prepare("SELECT * FROM otp_codes WHERE mobile = ?").bind(mobile).first()) as OtpRow | null;
  }
  async deleteOtp(mobile: string) {
    await this.db.prepare("DELETE FROM otp_codes WHERE mobile = ?").bind(mobile).run();
  }
  async getRateLimit(key: string) {
    return (await this.db.prepare("SELECT * FROM rate_limits WHERE key = ?").bind(key).first()) as RateLimitRow | null;
  }
  async upsertRateLimit(key: string, count: number, windowStart: string) {
    const now = new Date().toISOString();
    await this.db.prepare(
      "INSERT INTO rate_limits (key,count,window_start,updated_at) VALUES (?,?,?,?) " +
      "ON CONFLICT(key) DO UPDATE SET count=excluded.count, window_start=excluded.window_start, updated_at=excluded.updated_at"
    ).bind(key, count, windowStart, now).run();
  }
  async deleteRateLimit(key: string) {
    await this.db.prepare("DELETE FROM rate_limits WHERE key = ?").bind(key).run();
  }
}

/**
 * D1-backed store over the Cloudflare D1 REST API.
 * Lets a non-Cloudflare host (e.g. Vercel) read/write the SAME D1 database used on
 * Cloudflare Pages, so auth works identically on both platforms.
 * Active only when CF_ACCOUNT_ID + D1_DATABASE_ID + D1_API_TOKEN are set.
 */
class D1RestAuthStore implements AuthStore {
  constructor(private env: Env) {}

  private async query(sql: string, params: any[] = []): Promise<any[]> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.env.CF_ACCOUNT_ID}/d1/database/${this.env.D1_DATABASE_ID}/query`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.env.D1_API_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ sql, params }),
    });
    const data: any = await resp.json().catch(() => ({}));
    if (!resp.ok || !data.success) {
      throw new Error(`D1 REST ${resp.status}: ${JSON.stringify(data.errors || data).slice(0, 220)}`);
    }
    return (data?.result?.[0]?.results as any[]) || [];
  }

  async insertUser(u: UserRow) {
    await this.query(
      "INSERT INTO users (id,email,mobile,name,password_hash,password_salt,role,field,grade,city,age,avatar,target_major,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [u.id, u.email, u.mobile, u.name, u.password_hash, u.password_salt, u.role, u.field, u.grade, u.city, u.age, u.avatar, u.target_major, u.created_at]
    );
  }
  async findUserByIdentifier(identifier: string) {
    const rows = await this.query("SELECT * FROM users WHERE email = ? OR mobile = ?", [identifier, identifier]);
    return (rows[0] as UserRow) || null;
  }
  async findUserById(id: string) {
    const rows = await this.query("SELECT * FROM users WHERE id = ?", [id]);
    return (rows[0] as UserRow) || null;
  }
  async countUsers() {
    const rows = await this.query("SELECT COUNT(*) as c FROM users");
    return Number(rows[0]?.c || 0);
  }
  async listUsers() {
    return (await this.query("SELECT * FROM users ORDER BY created_at DESC")) as UserRow[];
  }
  async updateUserRole(id: string, role: string) {
    await this.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
  }
  async upsertSession(s: SessionRow) {
    await this.query("INSERT OR REPLACE INTO sessions (token,user_id,created_at,expires_at) VALUES (?,?,?,?)", [s.token, s.user_id, s.created_at, s.expires_at]);
  }
  async findSession(token: string) {
    const rows = await this.query("SELECT * FROM sessions WHERE token = ?", [token]);
    return (rows[0] as SessionRow) || null;
  }
  async deleteSession(token: string) {
    await this.query("DELETE FROM sessions WHERE token = ?", [token]);
  }
  async upsertOtp(o: OtpRow) {
    await this.query("INSERT OR REPLACE INTO otp_codes (mobile,code,created_at,expires_at) VALUES (?,?,?,?)", [o.mobile, o.code, o.created_at, o.expires_at]);
  }
  async findOtp(mobile: string) {
    const rows = await this.query("SELECT * FROM otp_codes WHERE mobile = ?", [mobile]);
    return (rows[0] as OtpRow) || null;
  }
  async deleteOtp(mobile: string) {
    await this.query("DELETE FROM otp_codes WHERE mobile = ?", [mobile]);
  }
  async getRateLimit(key: string) {
    const rows = await this.query("SELECT * FROM rate_limits WHERE key = ?", [key]);
    return (rows[0] as RateLimitRow) || null;
  }
  async upsertRateLimit(key: string, count: number, windowStart: string) {
    const now = new Date().toISOString();
    await this.query(
      "INSERT INTO rate_limits (key,count,window_start,updated_at) VALUES (?,?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count, window_start=excluded.window_start, updated_at=excluded.updated_at",
      [key, count, windowStart, now]
    );
  }
  async deleteRateLimit(key: string) {
    await this.query("DELETE FROM rate_limits WHERE key = ?", [key]);
  }
}

function getAuthStore(env: Env): AuthStore | null {
  // Cloudflare Pages: native D1 binding.
  if (env.DB) return new D1AuthStore(env.DB);
  // Any host (e.g. Vercel) without a D1 binding: reach the SAME D1 database via REST.
  if (env.CF_ACCOUNT_ID && env.D1_DATABASE_ID && env.D1_API_TOKEN) {
    return new D1RestAuthStore(env);
  }
  return null;
}

/* --- Web Crypto helpers --- */
const textEncoder = new TextEncoder();

function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hexToBuf(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  return arr;
}
function randomToken(byteLen = 32): string {
  const arr = new Uint8Array(byteLen);
  crypto.getRandomValues(arr);
  return bufToHex(arr.buffer);
}
function generateOtp(): string {
  const arr = new Uint8Array(3);
  crypto.getRandomValues(arr);
  const n = ((arr[0] << 16) | (arr[1] << 8) | arr[2]) % 1000000;
  return n.toString().padStart(6, "0");
}

/** Send an OTP via Kavenegar. Returns true if the SMS was accepted. */
async function sendSmsOtp(env: Env, mobile: string, code: string): Promise<boolean> {
  const apiKey = env.KAVENEGAR_API_KEY;
  const sender = env.KAVENEGAR_SENDER || "";
  if (!apiKey) return false;
  try {
    const resp = await fetch(`https://api.kavenegar.com/v1/${apiKey}/sms/send.json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        receptor: mobile,
        sender,
        message: `کد ورود ترنم همدلی: ${code}\nاین کد ۵ دقیقه معتبر است.`,
      }),
    });
    if (!resp.ok) return false;
    const data: any = await resp.json();
    // Kavenegar returns { return: { status: 200 } } on success.
    return data?.return?.status === 200;
  } catch {
    return false;
  }
}

async function pbkdf2(password: string, saltHex: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBuf(saltHex), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bufToHex(bits);
}
async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomToken(16);
  const hash = await pbkdf2(password, salt);
  return { hash, salt };
}
/** Constant-time-ish string compare. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* --- cookie + mapping helpers --- */
function getCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie") || "";
  const match = header.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return match ? match[1] : null;
}
function sessionCookieHeader(token: string, maxAgeMs: number, sameSite = "Lax"): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${Math.floor(maxAgeMs / 1000)}; SameSite=${sameSite}; Secure`;
}
function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}

/** Map a DB user row to the Student shape the frontend expects. */
function userToStudent(u: UserRow): any {
  return {
    id: u.id,
    name: u.name,
    code: u.mobile || u.email || u.id,
    field: (u.field as any) || "tajrobi",
    grade: u.grade || "پایه دوازدهم",
    city: u.city || undefined,
    age: u.age || undefined,
    email: u.email || undefined,
    mobile: u.mobile || undefined,
    avatar: u.avatar || undefined,
    accountRole: (u.role as any) || "student",
  };
}

/** Resolve the session user from a request, or null. */
async function getSessionUser(req: Request, store: AuthStore): Promise<UserRow | null> {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) return null;
  const sess = await store.findSession(token);
  if (!sess) return null;
  if (Date.now() > new Date(sess.expires_at).getTime()) return null;
  return store.findUserById(sess.user_id);
}

function authUnavailable(): Response {
  return json({ error: "Database not configured", message: "D1 is not bound. Run `wrangler d1 create` and set database_id in wrangler.json." }, 503);
}

async function authRegister(ctx: Ctx, store: AuthStore): Promise<Response> {
  const body = await readJson(ctx.request);
  const name = (body?.name || "").toString().trim();
  const mobile = (body?.mobile || "").toString().trim();
  const email = (body?.email || "").toString().trim().toLowerCase();
  const password = (body?.password || "").toString();
  const field = ["tajrobi", "riazi", "ensani", "honar", "zaban"].includes(body?.field) ? body.field : "tajrobi";
  const VALID_GRADES = ["پایه هفتم", "پایه هشتم", "پایه نهم", "پایه دهم", "پایه یازدهم", "پایه دوازدهم", "پشت کنکوری"];
  const gradeReq = (body?.grade || "").toString().trim();
  const grade = VALID_GRADES.includes(gradeReq) ? gradeReq : "پایه دوازدهم";

  if (!name) return json({ error: "نام الزامی است." }, 400);
  if (mobile && !/^09\d{9}$/.test(mobile)) return json({ error: "شماره موبایل معتبر نیست (مثال: 09123456789)." }, 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "ایمیل معتبر نیست." }, 400);
  if (!mobile && !email) return json({ error: "ایمیل یا شماره موبایل الزامی است." }, 400);
  if (password.length < 6) return json({ error: "رمز عبور باید حداقل ۶ کاراکتر باشد." }, 400);

  if (mobile) {
    const existingMobile = await store.findUserByIdentifier(mobile);
    if (existingMobile) return json({ error: "این شماره موبایل قبلاً ثبت شده است. وارد شوید." }, 409);
  }
  if (email) {
    const existingEmail = await store.findUserByIdentifier(email);
    if (existingEmail) return json({ error: "این ایمیل قبلاً ثبت شده است. وارد شوید." }, 409);
  }

  const { hash, salt } = await hashPassword(password);
  const user: UserRow = {
    id: randomToken(12),
    email: email || null,
    mobile: mobile || null,
    name,
    password_hash: hash,
    password_salt: salt,
    role: "student",
    field,
    grade,
    city: (body?.city || "").toString().trim() || null,
    age: body?.age ? Number(body.age) : null,
    avatar: null,
    target_major: (body?.targetMajor || "").toString().trim() || null,
    created_at: new Date().toISOString(),
  };
  await store.insertUser(user);

  const token = randomToken(32);
  const now = Date.now();
  await store.upsertSession({ token, user_id: user.id, created_at: new Date(now).toISOString(), expires_at: new Date(now + SESSION_TTL_MS).toISOString() });

  return json({ user: userToStudent(user) }, 200, { "Set-Cookie": sessionCookieHeader(token, SESSION_TTL_MS) });
}

async function authLogin(ctx: Ctx, store: AuthStore): Promise<Response> {
  const body = await readJson(ctx.request);
  const identifier = (body?.identifier || "").toString().trim().toLowerCase();
  const password = (body?.password || "").toString();
  if (!identifier || !password) return json({ error: "ایمیل/موبایل و رمز عبور الزامی است." }, 400);

  const ip = getClientIp(ctx.request);
  const accKey = `login:${identifier}`;
  const ipKey = `login-ip:${ip}`;

  // Rate-limit check (per account + per IP) before authenticating.
  const accSt = await rateLimitStatus(store, accKey, LOGIN_WINDOW_MS, LOGIN_MAX_ATTEMPTS);
  if (accSt.blocked) return rateLimited(accSt.retryAfterSec);
  const ipSt = await rateLimitStatus(store, ipKey, LOGIN_WINDOW_MS, LOGIN_IP_MAX_ATTEMPTS);
  if (ipSt.blocked) return rateLimited(ipSt.retryAfterSec);

  const user = await store.findUserByIdentifier(identifier);
  // Unified error message to avoid account enumeration (no 404 vs 401 difference).
  const invalid = () => json({ error: "نام کاربری یا رمز عبور اشتباه است." }, 401);

  if (!user || !user.password_hash) {
    await recordRateLimit(store, accKey, LOGIN_WINDOW_MS);
    await recordRateLimit(store, ipKey, LOGIN_WINDOW_MS);
    return invalid();
  }

  const candidate = await pbkdf2(password, user.password_salt);
  if (!safeEqual(candidate, user.password_hash)) {
    await recordRateLimit(store, accKey, LOGIN_WINDOW_MS);
    await recordRateLimit(store, ipKey, LOGIN_WINDOW_MS);
    return invalid();
  }

  // Success → clear any accumulated failures.
  await store.deleteRateLimit(accKey);
  await store.deleteRateLimit(ipKey);

  const token = randomToken(32);
  const now = Date.now();
  await store.upsertSession({ token, user_id: user.id, created_at: new Date(now).toISOString(), expires_at: new Date(now + SESSION_TTL_MS).toISOString() });

  return json({ user: userToStudent(user) }, 200, { "Set-Cookie": sessionCookieHeader(token, SESSION_TTL_MS) });
}

async function authOtpSend(ctx: Ctx, store: AuthStore): Promise<Response> {
  const body = await readJson(ctx.request);
  const mobile = (body?.mobile || "").toString().trim();
  if (!/^09\d{9}$/.test(mobile)) return json({ error: "شماره موبایل معتبر نیست." }, 400);

  // OTP is enabled only when a real SMS provider (Kavenegar) is configured,
  // OR in explicit local-dev mode. Otherwise return early WITHOUT touching the
  // database (prevents anonymous DB-query abuse).
  const smsConfigured = !!ctx.env.KAVENEGAR_API_KEY;
  const devMode = ctx.env.DEV_AUTH_CODES === "true";
  if (!smsConfigured && !devMode) {
    return json({ error: "ارسال پیامک هنوز پیکربندی نشده است؛ از ورود با رمز عبور استفاده کنید." }, 503);
  }

  // Rate limit OTP sends per mobile (prevents SMS flooding).
  const sendSt = await rateLimitStatus(store, `otp-send:${mobile}`, OTP_SEND_WINDOW_MS, OTP_SEND_MAX);
  if (sendSt.blocked) return rateLimited(sendSt.retryAfterSec);

  const code = generateOtp();
  const now = Date.now();
  await store.upsertOtp({ mobile, code, created_at: new Date(now).toISOString(), expires_at: new Date(now + OTP_TTL_MS).toISOString() });

  // Send the code out-of-band. In production it goes via Kavenegar SMS.
  let smsSent = false;
  if (smsConfigured) smsSent = await sendSmsOtp(ctx.env, mobile, code);

  // Record the send (counts toward the per-mobile OTP send limit).
  await recordRateLimit(store, `otp-send:${mobile}`, OTP_SEND_WINDOW_MS);

  // The code may only be echoed back in an explicitly enabled local environment.
  const existing = await store.findUserByIdentifier(mobile);
  const response: Record<string, unknown> = {
    sent: true,
    message: existing ? "کد ورود ارسال شد." : "کد ورود ارسال شد. (شماره جدید = ثبت‌نام خودکار)",
  };
  if (smsConfigured && !smsSent) {
    return json({ error: "ارسال پیامک ناموفق بود. لطفاً دوباره تلاش کنید." }, 502);
  }
  if (devMode) response.devCode = code;
  return json(response);
}

async function authOtpVerify(ctx: Ctx, store: AuthStore): Promise<Response> {
  const body = await readJson(ctx.request);
  const mobile = (body?.mobile || "").toString().trim();
  const code = (body?.code || "").toString().trim();
  if (!/^09\d{9}$/.test(mobile) || !code) return json({ error: "موبایل و کد الزامی است." }, 400);

  // Rate limit OTP verify attempts per mobile (prevents code guessing).
  const verifyKey = `otp-verify:${mobile}`;
  const verifySt = await rateLimitStatus(store, verifyKey, OTP_VERIFY_WINDOW_MS, OTP_VERIFY_MAX);
  if (verifySt.blocked) return rateLimited(verifySt.retryAfterSec);

  const otp = await store.findOtp(mobile);
  if (!otp || Date.now() > new Date(otp.expires_at).getTime()) {
    await recordRateLimit(store, verifyKey, OTP_VERIFY_WINDOW_MS);
    return json({ error: "کد منقضی شده است. دوباره درخواست کنید." }, 410);
  }
  if (!safeEqual(otp.code, code)) {
    await recordRateLimit(store, verifyKey, OTP_VERIFY_WINDOW_MS);
    return json({ error: "کد نادرست است." }, 401);
  }

  // Success → clear accumulated verify attempts.
  await store.deleteRateLimit(verifyKey);

  // OTPs are single-use. Consume before creating the session to prevent replay.
  await store.deleteOtp(mobile);

  let user = await store.findUserByIdentifier(mobile);
  if (!user) {
    user = {
      id: randomToken(12), email: null, mobile, name: "کاربر " + mobile.slice(-4),
      password_hash: "", password_salt: "", role: "student", field: "tajrobi",
      grade: "پایه دوازدهم", city: null, age: null, avatar: null, target_major: null,
      created_at: new Date().toISOString(),
    };
    await store.insertUser(user);
  }

  const token = randomToken(32);
  const now = Date.now();
  await store.upsertSession({ token, user_id: user.id, created_at: new Date(now).toISOString(), expires_at: new Date(now + SESSION_TTL_MS).toISOString() });

  return json({ user: userToStudent(user) }, 200, { "Set-Cookie": sessionCookieHeader(token, SESSION_TTL_MS) });
}

async function authMe(ctx: Ctx, store: AuthStore): Promise<Response> {
  const user = await getSessionUser(ctx.request, store);
  if (!user) return json({ user: null }, 200);
  return json({ user: userToStudent(user) }, 200);
}

async function authLogout(ctx: Ctx, store: AuthStore): Promise<Response> {
  const token = getCookie(ctx.request, SESSION_COOKIE);
  if (token) await store.deleteSession(token);
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookieHeader() });
}

async function authCount(ctx: Ctx, store: AuthStore): Promise<Response> {
  const count = await store.countUsers();
  return json({ count }, 200);
}

async function authList(ctx: Ctx, store: AuthStore): Promise<Response> {
  const requester = await getSessionUser(ctx.request, store);
  if (!requester) return json({ error: "Authentication required" }, 401);
  if (requester.role !== "admin" && requester.role !== "counselor") {
    return json({ error: "Counselor or administrator access required" }, 403);
  }
  const users = await store.listUsers();
  // Staff dashboards only need student accounts, never password/session fields.
  return json({ users: users.filter((u) => u.role === "student").map(userToStudent) }, 200);
}

// List ALL users (with roles) — admin only, for role management.
async function authListAll(ctx: Ctx, store: AuthStore): Promise<Response> {
  const requester = await getSessionUser(ctx.request, store);
  if (!requester) return json({ error: "Authentication required" }, 401);
  if (requester.role !== "admin") return json({ error: "Administrator access required" }, 403);
  const users = await store.listUsers();
  return json({ users: users.map(u => ({ ...userToStudent(u), role: u.role })) }, 200);
}

// Change a user's role — admin only.
async function authUpdateRole(ctx: Ctx, store: AuthStore): Promise<Response> {
  const requester = await getSessionUser(ctx.request, store);
  if (!requester) return json({ error: "Authentication required" }, 401);
  if (requester.role !== "admin") return json({ error: "Administrator access required" }, 403);
  const body = await readJson(ctx.request);
  const userId = String(body?.userId || "").trim();
  const role = String(body?.role || "").trim();
  const allowed = ["student", "counselor", "teacher", "admin"];
  if (!userId || !allowed.includes(role)) return json({ error: "Invalid userId or role" }, 400);
  // Prevent an admin from demoting themselves (lockout protection).
  if (userId === requester.id && role !== "admin") {
    return json({ error: "نمی‌توانید نقش خودتان را تغییر دهید." }, 400);
  }
  const target = await store.findUserById(userId);
  if (!target) return json({ error: "کاربر یافت نشد." }, 404);
  await store.updateUserRole(userId, role);
  return json({ ok: true, userId, role });
}

/** POST /api/auth/update-profile — ویرایش نام/موبایل/شهر توسط خود کاربر + سینک به پروفایل ربات متصل. */
async function authUpdateProfile(ctx: Ctx, store: AuthStore): Promise<Response> {
  const me = await getSessionUser(ctx.request, store);
  if (!me) return json({ error: "ابتدا وارد شوید." }, 401);
  const body = await readJson(ctx.request);
  const name = (body?.name || "").toString().trim().slice(0, 100);
  const mobile = (body?.mobile || "").toString().trim();
  const city = (body?.city || "").toString().trim().slice(0, 50);
  if (mobile && !/^09\d{9}$/.test(mobile)) return json({ error: "شماره موبایل معتبر نیست." }, 400);
  if (mobile) {
    const other = await store.findUserByIdentifier(mobile);
    if (other && other.id !== me.id) return json({ error: "این موبایل به حساب دیگری متصل است." }, 409);
  }
  if (!ctx.env.DB) return json({ error: "D1 لازم است" }, 503);
  await ctx.env.DB.prepare("UPDATE users SET name=COALESCE(NULLIF(?,''), name), mobile=COALESCE(NULLIF(?,''), mobile), city=COALESCE(NULLIF(?,''), city) WHERE id=?")
    .bind(name, mobile, city, me.id).run();
  // 🔄 سینک برعکس: نام جدید به پروفایل ربات متصل هم برود
  try {
    if (name) {
      const p = name.split(/\s+/);
      await ctx.env.DB.prepare("UPDATE bot_profiles SET name=?, last_name=? WHERE site_user_id=?")
        .bind(p[0], p.slice(1).join(" ") || null, me.id).run();
    }
  } catch (_) { /* silent */ }
  const updated = await store.findUserById(me.id);
  return json({ ok: true, user: userToStudent(updated!) });
}


function validateStudyPlan(raw: any): any | null {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.schedule)) return null;
  if (raw.schedule.length < 1 || raw.schedule.length > 7) return null;
  const schedule = raw.schedule.map((day: any) => ({
    day: String(day?.day || "").slice(0, 20),
    morning: String(day?.morning || "").slice(0, 2000),
    afternoon: String(day?.afternoon || "").slice(0, 2000),
    qCount: Math.max(0, Math.min(1000, Number(day?.qCount ?? day?.totalQ ?? 0) || 0)),
    trapTopic: day?.trapTopic ? String(day.trapTopic).slice(0, 1000) : undefined,
    advice: day?.advice ? String(day.advice).slice(0, 1000) : undefined,
  }));
  if (schedule.some((d: any) => !d.day || !d.morning || !d.afternoon)) return null;
  return {
    title: String(raw.title || "برنامه هفتگی اختصاصی").slice(0, 500),
    counselorName: String(raw.counselorName || "مشاور تحصیلی").slice(0, 200),
    updatedAt: new Date().toISOString(),
    warnings: Array.isArray(raw.warnings) ? raw.warnings.slice(0, 10).map((x: any) => String(x).slice(0, 1000)) : [],
    extracurricular: Array.isArray(raw.extracurricular) ? raw.extracurricular.slice(0, 20).map((x: any) => String(x).slice(0, 1000)) : [],
    schedule,
  };
}

async function studyPlanRoute(ctx: Ctx, store: AuthStore, method: string): Promise<Response> {
  if (!ctx.env.DB) return json({ error: "Native D1 binding is required for study-plan sync" }, 503);
  const requester = await getSessionUser(ctx.request, store);
  if (!requester) return json({ error: "Authentication required" }, 401);

  if (method === "GET") {
    const studentId = (new URL(ctx.request.url).searchParams.get("studentId") || requester.id).trim();
    const canRead = requester.role === "admin" || requester.role === "counselor" ||
      (requester.role === "student" && requester.id === studentId);
    if (!canRead) return json({ error: "Access denied" }, 403);
    const row: any = await ctx.env.DB.prepare("SELECT plan_json, updated_at FROM study_plans WHERE student_id = ?")
      .bind(studentId).first();
    if (!row) return json({ error: "Study plan not found" }, 404);
    try {
      return json({ plan: JSON.parse(row.plan_json), updatedAt: row.updated_at });
    } catch {
      return json({ error: "Stored study plan is invalid" }, 500);
    }
  }

  if (method === "POST") {
    if (requester.role !== "admin" && requester.role !== "counselor") {
      return json({ error: "Counselor or administrator access required" }, 403);
    }
    const body = await readJson(ctx.request);
    const studentId = String(body?.studentId || "").trim();
    const plan = validateStudyPlan(body?.plan);
    if (!studentId || studentId.length > 128 || !plan) return json({ error: "Invalid studentId or plan" }, 400);
    const student = await store.findUserById(studentId);
    if (!student || student.role !== "student") return json({ error: "Student not found" }, 404);
    await ctx.env.DB.prepare(
      "INSERT INTO study_plans (student_id,plan_json,counselor_id,updated_at) VALUES (?,?,?,?) " +
      "ON CONFLICT(student_id) DO UPDATE SET plan_json=excluded.plan_json,counselor_id=excluded.counselor_id,updated_at=excluded.updated_at"
    ).bind(studentId, JSON.stringify(plan), requester.id, plan.updatedAt).run();
    return json({ ok: true, plan });
  }

  return json({ error: "Method not allowed" }, 405);
}

/* --- Student → counselor reverse sync (task ticks + daily reports) --- */

async function taskProgressRoute(ctx: Ctx, store: AuthStore, method: string): Promise<Response> {
  if (!ctx.env.DB) return json({ error: "Native D1 binding is required for task progress" }, 503);
  const requester = await getSessionUser(ctx.request, store);
  if (!requester) return json({ error: "Authentication required" }, 401);

  if (method === "GET") {
    const studentId = (new URL(ctx.request.url).searchParams.get("studentId") || requester.id).trim();
    const canRead = requester.role === "admin" || requester.role === "counselor" ||
      (requester.role === "student" && requester.id === studentId);
    if (!canRead) return json({ error: "Access denied" }, 403);
    const row: any = await ctx.env.DB.prepare("SELECT progress_json, updated_at FROM task_progress WHERE student_id = ?")
      .bind(studentId).first();
    if (!row) return json({ progress: null, updatedAt: null });
    try {
      return json({ progress: JSON.parse(row.progress_json), updatedAt: row.updated_at });
    } catch {
      return json({ error: "Stored progress is invalid" }, 500);
    }
  }

  if (method === "POST") {
    // Only the student themselves may mark tasks done.
    if (requester.role !== "student") return json({ error: "Only students update their own progress" }, 403);
    const body = await readJson(ctx.request);
    const progress = body?.progress;
    if (!progress || typeof progress !== "object" || Array.isArray(progress)) {
      return json({ error: "Invalid progress payload" }, 400);
    }
    const now = new Date().toISOString();
    await ctx.env.DB.prepare(
      "INSERT INTO task_progress (student_id,progress_json,updated_at) VALUES (?,?,?) " +
      "ON CONFLICT(student_id) DO UPDATE SET progress_json=excluded.progress_json, updated_at=excluded.updated_at"
    ).bind(requester.id, JSON.stringify(progress), now).run();
    return json({ ok: true, updatedAt: now });
  }

  return json({ error: "Method not allowed" }, 405);
}

async function dailyReportRoute(ctx: Ctx, store: AuthStore, method: string): Promise<Response> {
  if (!ctx.env.DB) return json({ error: "Native D1 binding is required for daily reports" }, 503);
  const requester = await getSessionUser(ctx.request, store);
  if (!requester) return json({ error: "Authentication required" }, 401);

  if (method === "GET") {
    const studentId = (new URL(ctx.request.url).searchParams.get("studentId") || requester.id).trim();
    const canRead = requester.role === "admin" || requester.role === "counselor" ||
      (requester.role === "student" && requester.id === studentId);
    if (!canRead) return json({ error: "Access denied" }, 403);
    const res = await ctx.env.DB.prepare(
      "SELECT id, student_id, student_name, text, created_at FROM daily_reports WHERE student_id = ? ORDER BY created_at DESC LIMIT 100"
    ).bind(studentId).all();
    return json({ reports: res.results || [] });
  }

  if (method === "POST") {
    if (requester.role !== "student") return json({ error: "Only students submit reports" }, 403);
    const body = await readJson(ctx.request);
    const text = String(body?.text || "").trim();
    if (!text) return json({ error: "Report text is required" }, 400);
    if (text.length > 4000) return json({ error: "Report text is too long" }, 400);
    const now = new Date().toISOString();
    const id = randomToken(16);
    await ctx.env.DB.prepare(
      "INSERT INTO daily_reports (id,student_id,student_name,text,created_at) VALUES (?,?,?,?,?)"
    ).bind(id, requester.id, requester.name, text, now).run();
    return json({ ok: true, id, createdAt: now });
  }

  return json({ error: "Method not allowed" }, 405);
}

/* ----------------------------------------------------------------------------
 * Dashboard live stats (counselor/admin) — one D1 round-trip for the whole
 * overview: users, plans, reports, weekly activity.
 * ------------------------------------------------------------------------- */
async function dashboardStatsRoute(ctx: Ctx, store: AuthStore): Promise<Response> {
  if (!ctx.env.DB) return json({ error: "Native D1 binding is required for dashboard stats" }, 503);
  const requester = await getSessionUser(ctx.request, store);
  if (!requester) return json({ error: "Authentication required" }, 401);
  if (requester.role !== "admin" && requester.role !== "counselor") {
    return json({ error: "Counselor or administrator access required" }, 403);
  }

  const db = ctx.env.DB;
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

  const [users, students, plans, progress, reports7, reportsAll, recentReports, planFresh] = await Promise.all([
    db.prepare("SELECT COUNT(*) AS n FROM users").first(),
    db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='student'").first(),
    db.prepare("SELECT COUNT(*) AS n FROM study_plans").first(),
    db.prepare("SELECT COUNT(*) AS n FROM task_progress").first(),
    db.prepare("SELECT COUNT(*) AS n FROM daily_reports WHERE created_at >= ?").bind(weekAgo).first(),
    db.prepare("SELECT COUNT(*) AS n FROM daily_reports").first(),
    db.prepare(
      "SELECT student_id, student_name, substr(text,1,120) AS preview, created_at FROM daily_reports ORDER BY created_at DESC LIMIT 8"
    ).all(),
    db.prepare(
      "SELECT student_id, updated_at FROM study_plans ORDER BY updated_at DESC LIMIT 8"
    ).all(),
  ]);

  // Per-day report counts for the last 7 days (activity sparkline).
  const daily = await db.prepare(
    "SELECT substr(created_at,1,10) AS day, COUNT(*) AS n FROM daily_reports WHERE created_at >= ? GROUP BY substr(created_at,1,10) ORDER BY day"
  ).bind(weekAgo).all();

  return json({
    generatedAt: new Date().toISOString(),
    totals: {
      users: Number(users?.n || 0),
      students: Number(students?.n || 0),
      studyPlans: Number(plans?.n || 0),
      studentsWithProgress: Number(progress?.n || 0),
      reportsLast7Days: Number(reports7?.n || 0),
      reportsAllTime: Number(reportsAll?.n || 0),
    },
    recentReports: recentReports?.results || [],
    recentPlanUpdates: planFresh?.results || [],
    weeklyActivity: daily?.results || [],
  });
}

/* ----------------------------------------------------------------------------
 * Bot admin panel (admin-only): bots info, webhooks, channel, stats, actions
 * ------------------------------------------------------------------------- */
async function botAdminRoute(ctx: Ctx, store: AuthStore, method: string): Promise<Response> {
  const requester = await getSessionUser(ctx.request, store);
  if (!requester || requester.role !== "admin") return json({ error: "دسترسی ادمین لازم است" }, 403);

  const tgToken = ctx.env.TELEGRAM_BOT_TOKEN || "";
  const baleToken = ctx.env.BALE_BOT_TOKEN || "";
  const channel = ctx.env.CHANNEL_ID || "@ai_exam_iran";

  if (method === "POST") {
    const body = await readJson(ctx.request);
    const action = String(body?.action || "");
    if (action === "post_channel") {
      const post = await buildChannelDailyPost(ctx.env);
      if (!post) return json({ error: "بانک سوال در دسترس نیست" }, 503);
      const r = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: channel, text: post.text, reply_markup: post.reply_markup }),
        signal: AbortSignal.timeout(15000) as any,
      });
      const d: any = await r.json();
      return json({ ok: !!d.ok, messageId: d.result?.message_id, error: d.description });
    }
    if (action === "test_message") {
      const chatId = String(body?.chatId || "");
      if (!chatId) return json({ error: "chatId لازم است" }, 400);
      const r = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: "🔔 پیام تست از پنل ادمین ترنم همدلی — اتصال سالم است ✅" }),
        signal: AbortSignal.timeout(15000) as any,
      });
      const d: any = await r.json();
      return json({ ok: !!d.ok, error: d.description });
    }
    return json({ error: "action نامعتبر" }, 400);
  }

  // GET — گردآوری همه اطلاعات
  const out: any = {
    settings: {
      channel,
      botAdminIds: ctx.env.BOT_ADMIN_IDS || "",
      chatDailyLimit: BOT_CHAT_DAILY_LIMIT,
      examRagUrl: ctx.env.EXAM_RAG_URL || "",
      telegramTokenSet: !!tgToken, baleTokenSet: !!baleToken,
      cronWorker: "taranom-channel-poster — هر روز 06:30 UTC (~10:00 تهران)",
    },
    telegram: {}, bale: {}, channelInfo: {}, stats: {},
  };
  try {
    const [me, wh] = await Promise.all([
      fetch(`https://api.telegram.org/bot${tgToken}/getMe`, { signal: AbortSignal.timeout(9000) as any }).then((r) => r.json()),
      fetch(`https://api.telegram.org/bot${tgToken}/getWebhookInfo`, { signal: AbortSignal.timeout(9000) as any }).then((r) => r.json()),
    ]);
    out.telegram = {
      username: (me as any).result?.username, ok: !!(me as any).ok,
      webhookUrl: (wh as any).result?.url, pending: (wh as any).result?.pending_update_count,
      lastError: (wh as any).result?.last_error_message || null,
    };
  } catch (e: any) { out.telegram = { ok: false, error: e?.message }; }
  try {
    const wh: any = await fetch(`https://tapi.bale.ai/bot${baleToken}/getWebhookInfo`, { signal: AbortSignal.timeout(9000) as any }).then((r) => r.json());
    out.bale = { ok: !!wh.ok, webhookUrl: wh.result?.url, pending: wh.result?.pending_update_count };
  } catch (e: any) { out.bale = { ok: false, error: "tapi.bale.ai از این سرور در دسترس نیست (فقط داخل ایران)" }; }
  try {
    const [ch, cnt] = await Promise.all([
      fetch(`https://api.telegram.org/bot${tgToken}/getChat?chat_id=${encodeURIComponent(channel)}`, { signal: AbortSignal.timeout(9000) as any }).then((r) => r.json()),
      fetch(`https://api.telegram.org/bot${tgToken}/getChatMemberCount?chat_id=${encodeURIComponent(channel)}`, { signal: AbortSignal.timeout(9000) as any }).then((r) => r.json()),
    ]);
    out.channelInfo = { title: (ch as any).result?.title, members: (cnt as any).result, ok: !!(ch as any).ok };
  } catch (_) { out.channelInfo = { ok: false }; }
  try {
    if (ctx.env.DB) {
      const day = new Date().toISOString().slice(0, 10);
      const s: any = await ctx.env.DB.prepare(
        "SELECT (SELECT COUNT(*) FROM bot_profiles) profiles, (SELECT COUNT(*) FROM bot_profiles WHERE step='done') completed, (SELECT COUNT(*) FROM bot_quiz_log) answers, (SELECT COUNT(DISTINCT chat_id) FROM bot_quiz_log) quiz_users, (SELECT COALESCE(SUM(used),0) FROM bot_chat_quota WHERE day=?) chats_today"
      ).bind(day).first();
      const byPlatform: any = await ctx.env.DB.prepare(
        "SELECT platform, COUNT(*) n FROM bot_profiles GROUP BY platform"
      ).all();
      out.stats = { ...s, byPlatform: byPlatform.results || [] };
    }
  } catch (_) { /* ignore */ }
  return json(out);
}

/* ----------------------------------------------------------------------------
 * Counselor-managed students: register & delete own students only
 * ------------------------------------------------------------------------- */
async function counselorStudentsRoute(ctx: Ctx, store: AuthStore, method: string): Promise<Response> {
  if (!ctx.env.DB) return json({ error: "D1 لازم است" }, 503);
  const requester = await getSessionUser(ctx.request, store);
  if (!requester || (requester.role !== "counselor" && requester.role !== "admin")) {
    return json({ error: "برای این عملیات باید با حساب واقعی مشاور وارد شوید (حالت دمو کافی نیست)." }, 403);
  }

  // GET: فقط دانش‌آموزهای ساخته‌شده توسط همین مشاور (ادمین: همه)
  if (method === "GET") {
    const rows = requester.role === "admin"
      ? await ctx.env.DB.prepare("SELECT id,name,mobile,email,field,grade,created_at,created_by FROM users WHERE role='student' ORDER BY created_at DESC LIMIT 200").all()
      : await ctx.env.DB.prepare("SELECT id,name,mobile,email,field,grade,created_at,created_by FROM users WHERE role='student' AND created_by=? ORDER BY created_at DESC LIMIT 200").bind(requester.id).all();
    return json({ students: rows.results || [] });
  }

  // POST: ثبت دانش‌آموز جدید توسط مشاور
  if (method === "POST") {
    const body = await readJson(ctx.request);
    const name = String(body?.name || "").trim().slice(0, 100);
    const mobile = String(body?.mobile || "").trim();
    const field = ["tajrobi", "riazi", "ensani", "honar", "zaban"].includes(body?.field) ? body.field : "tajrobi";
    const grade = String(body?.grade || "پایه دوازدهم").slice(0, 40);
    const password = String(body?.password || "");
    if (!name || name.length < 2) return json({ error: "نام معتبر وارد کنید." }, 400);
    if (!/^09\d{9}$/.test(mobile)) return json({ error: "شماره موبایل معتبر نیست (مثل 09121234567)." }, 400);
    if (password.length < 6) return json({ error: "رمز عبور حداقل ۶ کاراکتر." }, 400);
    const existing = await store.findUserByIdentifier(mobile);
    if (existing) return json({ error: "این شماره قبلاً ثبت شده است." }, 409);
    const { hash, salt } = await hashPassword(password);
    const id = randomToken(12);
    await ctx.env.DB.prepare(
      "INSERT INTO users (id,email,mobile,name,password_hash,password_salt,role,field,grade,city,age,avatar,target_major,created_at,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    ).bind(id, null, mobile, name, hash, salt, "student", field, grade, null, null, null, null, new Date().toISOString(), requester.id).run();
    return json({ ok: true, id, message: `دانش‌آموز «${name}» ثبت شد. ورود با موبایل ${mobile} و رمز تعیین‌شده.` });
  }

  // DELETE: حذف — مشاور فقط دانش‌آموزی که خودش ساخته؛ ادمین هر دانش‌آموزی
  if (method === "DELETE") {
    const body = await readJson(ctx.request);
    const id = String(body?.id || "");
    if (!id) return json({ error: "id لازم است" }, 400);
    const target: any = await ctx.env.DB.prepare("SELECT id, role, created_by, name FROM users WHERE id=?").bind(id).first();
    if (!target) return json({ error: "کاربر پیدا نشد." }, 404);
    if (target.role !== "student") return json({ error: "فقط حساب دانش‌آموز قابل حذف است." }, 400);
    if (requester.role !== "admin" && target.created_by !== requester.id) {
      return json({ error: "فقط دانش‌آموزی که خودتان ثبت کرده‌اید را می‌توانید حذف کنید." }, 403);
    }
    await ctx.env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(id).run();
    await ctx.env.DB.prepare("DELETE FROM users WHERE id=?").bind(id).run();
    return json({ ok: true, message: `دانش‌آموز «${target.name}» حذف شد.` });
  }

  return json({ error: "Method not allowed" }, 405);
}

/* ----------------------------------------------------------------------------
 * Counseling signup (public) + CRM (counselor/admin)
 * ------------------------------------------------------------------------- */
async function counselingRequestRoute(ctx: Ctx, store: AuthStore, method: string): Promise<Response> {
  if (!ctx.env.DB) return json({ error: "D1 لازم است" }, 503);
  if (method === "POST") {
    const body = await readJson(ctx.request);
    const name = String(body?.name || "").trim().slice(0, 100);
    const mobile = String(body?.mobile || "").trim();
    const field = String(body?.field || "").trim().slice(0, 30);
    const grade = String(body?.grade || "").trim().slice(0, 30);
    const topic = String(body?.topic || "").trim().slice(0, 500);
    if (!name || name.length < 2) return json({ error: "نام معتبر وارد کنید." }, 400);
    if (!/^09\d{9}$/.test(mobile)) return json({ error: "شماره موبایل معتبر نیست (مثل 09121234567)." }, 400);
    // rate limit ساده بر اساس IP
    const ip = getClientIp(ctx.request);
    const rlKey = `counsel-req:${ip}`;
    const rl = await rateLimitStatus(store, rlKey, 3600000, 5);
    if (rl.blocked) return rateLimited(rl.retryAfterSec);
    await recordRateLimit(store, rlKey, 3600000);
    const now = new Date().toISOString();
    const id = randomToken(12);
    await ctx.env.DB.prepare(
      "INSERT INTO counseling_requests (id,name,mobile,field,grade,topic,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)"
    ).bind(id, name, mobile, field || null, grade || null, topic || null, "new", now, now).run();
    return json({ ok: true, id, message: "درخواست مشاوره ثبت شد؛ به‌زودی با شما تماس می‌گیریم." });
  }
  if (method === "GET") {
    const requester = await getSessionUser(ctx.request, store);
    if (!requester || (requester.role !== "admin" && requester.role !== "counselor")) return json({ error: "دسترسی مشاور/ادمین لازم است" }, 403);
    const res = await ctx.env.DB.prepare(
      "SELECT id,name,mobile,field,grade,topic,status,created_at FROM counseling_requests ORDER BY created_at DESC LIMIT 200"
    ).all();
    return json({ requests: res.results || [] });
  }
  if (method === "PATCH") {
    const requester = await getSessionUser(ctx.request, store);
    if (!requester || (requester.role !== "admin" && requester.role !== "counselor")) return json({ error: "دسترسی مشاور/ادمین لازم است" }, 403);
    const body = await readJson(ctx.request);
    const id = String(body?.id || "");
    const status = String(body?.status || "");
    if (!id || !["new", "contacted", "done"].includes(status)) return json({ error: "id/status نامعتبر" }, 400);
    await ctx.env.DB.prepare("UPDATE counseling_requests SET status=?, updated_at=? WHERE id=?")
      .bind(status, new Date().toISOString(), id).run();
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405);
}

/* ----------------------------------------------------------------------------
 * بازخورد سوالات بانک: آمار سختی + نظرات کاربران (ادمین/مشاور)
 * ------------------------------------------------------------------------- */
async function questionFeedbackRoute(ctx: Ctx, store: AuthStore, method: string): Promise<Response> {
  if (!ctx.env.DB) return json({ error: "D1 لازم است" }, 503);
  const requester = await getSessionUser(ctx.request, store);
  if (!requester || (requester.role !== "admin" && requester.role !== "counselor")) return json({ error: "دسترسی مشاور/ادمین لازم است" }, 403);
  if (method === "GET") {
    const bank = await getBotQuizBank(ctx.env);
    const stats = await ctx.env.DB.prepare(
      "SELECT qi, subject, attempts, correct, likes, dislikes FROM question_stats ORDER BY attempts DESC LIMIT 100"
    ).all();
    const comments = await ctx.env.DB.prepare(
      "SELECT id, platform, chat_id, qi, subject, comment, created_at FROM question_comments ORDER BY created_at DESC LIMIT 100"
    ).all();
    // متن سوال را کنار هر رکورد بگذار تا پنل ادمین قابل فهم باشد
    const statRows = (stats.results || []).map((r: any) => ({ ...r, q: bank[Number(r.qi)]?.q?.slice(0, 120) || "؟" }));
    const commentRows = (comments.results || []).map((r: any) => ({ ...r, q: bank[Number(r.qi)]?.q?.slice(0, 120) || "؟" }));
    // خلاصه: سوالات پرمشکل (dislike بالا یا دقت خیلی پایین با تلاش زیاد)
    const flagged = statRows.filter((r: any) =>
      Number(r.dislikes) >= Number(r.likes) + 2 || (Number(r.attempts) >= 5 && Number(r.correct) / Number(r.attempts) < 0.15));
    return json({ stats: statRows, comments: commentRows, flagged, totals: { stats: statRows.length, comments: commentRows.length, flagged: flagged.length } });
  }
  if (method === "DELETE") {
    const body = await readJson(ctx.request);
    const id = String(body?.id || "");
    if (!id) return json({ error: "id لازم است" }, 400);
    await ctx.env.DB.prepare("DELETE FROM question_comments WHERE id=?").bind(id).run();
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405);
}

/* ----------------------------------------------------------------------------
 * جلسه حضوری «اسنپی» — رزرو دانش‌آموز/والد + ثبت فضای مدرسه/فضای کار اشتراکی
 * ------------------------------------------------------------------------- */
async function inpersonBookingRoute(ctx: Ctx, store: AuthStore, method: string): Promise<Response> {
  if (!ctx.env.DB) return json({ error: "D1 لازم است" }, 503);
  if (method === "POST") {
    const body = await readJson(ctx.request);
    const name = String(body?.name || "").trim().slice(0, 100);
    const mobile = String(body?.mobile || "").trim();
    if (!name || name.length < 2) return json({ error: "نام معتبر وارد کنید." }, 400);
    if (!/^09\d{9}$/.test(mobile)) return json({ error: "شماره موبایل معتبر نیست (مثل 09121234567)." }, 400);
    const ip = getClientIp(ctx.request);
    const rlKey = `inperson-req:${ip}`;
    const rl = await rateLimitStatus(store, rlKey, 3600000, 5);
    if (rl.blocked) return rateLimited(rl.retryAfterSec);
    await recordRateLimit(store, rlKey, 3600000);
    const now = new Date().toISOString();
    const id = randomToken(12);
    await ctx.env.DB.prepare(
      "INSERT INTO inperson_bookings (id,name,mobile,requester_role,city,venue_id,venue_name,tutor_tier,session_type,preferred_date,est_price,note,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
    ).bind(
      id, name, mobile,
      String(body?.requester_role || "student").slice(0, 20),
      String(body?.city || "").slice(0, 40) || null,
      String(body?.venue_id || "").slice(0, 40) || null,
      String(body?.venue_name || "").slice(0, 120) || null,
      String(body?.tutor_tier || "").slice(0, 30) || null,
      String(body?.session_type || "").slice(0, 60) || null,
      String(body?.preferred_date || "").slice(0, 40) || null,
      Number(body?.est_price || 0) || null,
      String(body?.note || "").slice(0, 500) || null,
      "new", now, now
    ).run();
    return json({ ok: true, id, message: "درخواست جلسه حضوری ثبت شد؛ برای هماهنگی نهایی با شما تماس می‌گیریم." });
  }
  if (method === "GET") {
    const requester = await getSessionUser(ctx.request, store);
    if (!requester || (requester.role !== "admin" && requester.role !== "counselor")) return json({ error: "دسترسی مشاور/ادمین لازم است" }, 403);
    const res = await ctx.env.DB.prepare(
      "SELECT id,name,mobile,requester_role,city,venue_name,tutor_tier,session_type,preferred_date,est_price,note,status,created_at FROM inperson_bookings ORDER BY created_at DESC LIMIT 200"
    ).all();
    return json({ bookings: res.results || [] });
  }
  if (method === "PATCH") {
    const requester = await getSessionUser(ctx.request, store);
    if (!requester || (requester.role !== "admin" && requester.role !== "counselor")) return json({ error: "دسترسی مشاور/ادمین لازم است" }, 403);
    const body = await readJson(ctx.request);
    const id = String(body?.id || "");
    const status = String(body?.status || "");
    if (!id || !["new", "contacted", "confirmed", "done", "canceled"].includes(status)) return json({ error: "id/status نامعتبر" }, 400);
    await ctx.env.DB.prepare("UPDATE inperson_bookings SET status=?, updated_at=? WHERE id=?")
      .bind(status, new Date().toISOString(), id).run();
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405);
}

async function venueOfferRoute(ctx: Ctx, store: AuthStore, method: string): Promise<Response> {
  if (!ctx.env.DB) return json({ error: "D1 لازم است" }, 503);
  if (method === "POST") {
    const body = await readJson(ctx.request);
    const orgName = String(body?.org_name || "").trim().slice(0, 120);
    const mobile = String(body?.mobile || "").trim();
    if (!orgName || orgName.length < 2) return json({ error: "نام مجموعه/مدرسه را وارد کنید." }, 400);
    if (!/^09\d{9}$/.test(mobile)) return json({ error: "شماره موبایل معتبر نیست." }, 400);
    const ip = getClientIp(ctx.request);
    const rlKey = `venue-offer:${ip}`;
    const rl = await rateLimitStatus(store, rlKey, 3600000, 5);
    if (rl.blocked) return rateLimited(rl.retryAfterSec);
    await recordRateLimit(store, rlKey, 3600000);
    const now = new Date().toISOString();
    const id = randomToken(12);
    await ctx.env.DB.prepare(
      "INSERT INTO venue_offers (id,org_name,contact_name,mobile,city,address,venue_type,capacity,price_per_hour,note,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)"
    ).bind(
      id, orgName,
      String(body?.contact_name || "").slice(0, 80) || null,
      mobile,
      String(body?.city || "").slice(0, 40) || null,
      String(body?.address || "").slice(0, 300) || null,
      String(body?.venue_type || "").slice(0, 40) || null,
      Number(body?.capacity || 0) || null,
      Number(body?.price_per_hour || 0) || null,
      String(body?.note || "").slice(0, 500) || null,
      "new", now, now
    ).run();
    return json({ ok: true, id, message: "ثبت فضا انجام شد؛ تیم ترنم همدلی برای عقد قرارداد اجاره با شما تماس می‌گیرد." });
  }
  if (method === "GET") {
    const requester = await getSessionUser(ctx.request, store);
    if (!requester || requester.role !== "admin") return json({ error: "دسترسی ادمین لازم است" }, 403);
    const res = await ctx.env.DB.prepare(
      "SELECT id,org_name,contact_name,mobile,city,address,venue_type,capacity,price_per_hour,note,status,created_at FROM venue_offers ORDER BY created_at DESC LIMIT 200"
    ).all();
    return json({ offers: res.results || [] });
  }
  if (method === "PATCH") {
    const requester = await getSessionUser(ctx.request, store);
    if (!requester || requester.role !== "admin") return json({ error: "دسترسی ادمین لازم است" }, 403);
    const body = await readJson(ctx.request);
    const id = String(body?.id || "");
    const status = String(body?.status || "");
    if (!id || !["new", "reviewing", "approved", "rejected"].includes(status)) return json({ error: "id/status نامعتبر" }, 400);
    await ctx.env.DB.prepare("UPDATE venue_offers SET status=?, updated_at=? WHERE id=?")
      .bind(status, new Date().toISOString(), id).run();
    return json({ ok: true });
  }
  return json({ error: "Method not allowed" }, 405);
}

/* ----------------------------------------------------------------------------
 * Body parsing + router
 * ------------------------------------------------------------------------- */

async function readJson(req: Request): Promise<any> {
  try {
    const text = await req.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch (_) {
    return {};
  }
}

export async function handleRequest(request: Request, env: Env, pathArray: string[]): Promise<Response> {
  const ctx: Ctx = { request, env, params: { path: pathArray } };
  const method = request.method;
  const pathArr = Array.isArray(pathArray) ? pathArray : (pathArray ? [pathArray as any] : []);
  const path = pathArr.join("/").replace(/^\/+|\/+$/g, "");
  const meta = new RespMeta();

  const isGet = method === "GET";
  const isPost = method === "POST";

  try {
    // --- auth routes (require D1) ---
    if (path.startsWith("auth/")) {
      const store = getAuthStore(ctx.env);
      if (!store) return authUnavailable();
      switch (path) {
        case "auth/register":       if (isPost) return await authRegister(ctx, store); break;
        case "auth/login":          if (isPost) return await authLogin(ctx, store); break;
        case "auth/otp-send":       if (isPost) return await authOtpSend(ctx, store); break;
        case "auth/otp-verify":     if (isPost) return await authOtpVerify(ctx, store); break;
        case "auth/me":             if (isGet)  return await authMe(ctx, store); break;
        case "auth/logout":         if (isPost) return await authLogout(ctx, store); break;
        case "auth/count":          if (isGet)  return await authCount(ctx, store); break;
        case "auth/list":           if (isGet)  return await authList(ctx, store); break;
        case "auth/list-all":       if (isGet)  return await authListAll(ctx, store); break;
        case "auth/update-role":    if (isPost) return await authUpdateRole(ctx, store); break;
        case "auth/update-profile": if (isPost) return await authUpdateProfile(ctx, store); break;
      }
      return json({ error: "Method not allowed", path, method }, 405);
    }

    if (path === "study-plan") {
      const store = getAuthStore(ctx.env);
      if (!store) return authUnavailable();
      return await studyPlanRoute(ctx, store, method);
    }

    if (path === "bot-admin") {
      const store = getAuthStore(ctx.env);
      if (!store) return authUnavailable();
      return await botAdminRoute(ctx, store, method);
    }

    if (path === "question-feedback") {
      const store = getAuthStore(ctx.env);
      if (!store) return authUnavailable();
      return await questionFeedbackRoute(ctx, store, method);
    }

    // پروکسی فایل‌های بانک/دفترچه‌ها روی دامنه خودمان — آدرس هاگینگ‌فیس برای کاربر نمایان نمی‌شود
    if (path.startsWith("exam-files/")) {
      if (!isGet) return json({ error: "Method not allowed" }, 405);
      const sub = path.slice("exam-files/".length);
      // فقط مسیرهای مجاز (جلوگیری از open-proxy)
      if (!/^(pdfs|data)\/[A-Za-z0-9._-]+$/.test(sub)) return json({ error: "not found" }, 404);
      const base = ctx.env.EXAM_RAG_URL || "https://sosa123454321-taranom-exam-rag.static.hf.space";
      try {
        const upstream = await fetch(`${base}/${sub}`, { signal: AbortSignal.timeout(30000) } as any, );
        if (!upstream.ok) return json({ error: "file unavailable" }, 502);
        const ct = sub.endsWith(".pdf") ? "application/pdf" : sub.endsWith(".json") ? "application/json; charset=utf-8" : (upstream.headers.get("content-type") || "application/octet-stream");
        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": ct,
            "Cache-Control": "public, max-age=86400",
            "Content-Disposition": sub.endsWith(".pdf") ? `inline; filename="${sub.split("/").pop()}"` : "inline",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (_) { return json({ error: "upstream timeout" }, 504); }
    }

    if (path === "public-mentors") {
      const store = getAuthStore(ctx.env);
      if (!store) return authUnavailable();
      if (isGet) {
        const all = await store.listUsers();
        const mentors = all.filter((u) => u.role === "counselor" || u.role === "teacher")
          .map((u) => ({ name: u.name, role: u.role, field: u.field || null }))
          .slice(0, 50);
        return json({ mentors, count: mentors.length });
      }
      return json({ error: "Method not allowed" }, 405);
    }

    if (path === "bot-login") {
      const store = getAuthStore(ctx.env);
      if (!store) return authUnavailable();
      if (isGet) return await botLoginRoute(ctx, store);
      return json({ error: "Method not allowed" }, 405);
    }

    if (path === "counselor-students") {
      const store = getAuthStore(ctx.env);
      if (!store) return authUnavailable();
      return await counselorStudentsRoute(ctx, store, method);
    }

    if (path === "counseling-request") {
      const store = getAuthStore(ctx.env);
      if (!store) return authUnavailable();
      return await counselingRequestRoute(ctx, store, method);
    }

    if (path === "inperson-booking") {
      const store = getAuthStore(ctx.env);
      if (!store) return authUnavailable();
      return await inpersonBookingRoute(ctx, store, method);
    }

    if (path === "venue-offer") {
      const store = getAuthStore(ctx.env);
      if (!store) return authUnavailable();
      return await venueOfferRoute(ctx, store, method);
    }

    if (path === "dashboard-stats") {
      const store = getAuthStore(ctx.env);
      if (!store) return authUnavailable();
      if (isGet) return await dashboardStatsRoute(ctx, store);
      return json({ error: "Method not allowed", path, method }, 405);
    }

    if (path === "task-progress") {
      const store = getAuthStore(ctx.env);
      if (!store) return authUnavailable();
      return await taskProgressRoute(ctx, store, method);
    }

    if (path === "daily-report") {
      const store = getAuthStore(ctx.env);
      if (!store) return authUnavailable();
      return await dailyReportRoute(ctx, store, method);
    }

    switch (path) {
      case "health":
        if (isGet) return health();
        break;
      case "ai-status":
        if (isGet) return aiStatus(ctx.env);
        break;
      case "hf-status":
        if (isGet) return await hfStatus(ctx.env);
        break;
      case "motivational":
        if (isGet) return await motivational(ctx, meta);
        break;
      case "chat":
        if (isPost) return await chat(ctx, meta);
        break;
      case "goal-insight":
        if (isPost) return await goalInsight(ctx, meta);
        break;
      case "analyze-exam":
        if (isPost) return await analyzeExam(ctx, meta);
        break;
      case "audit-module":
        if (isPost) return await auditModule(ctx, meta);
        break;
      case "psychology-analysis":
        if (isPost) return await psychologyAnalysis(ctx, meta);
        break;
      case "payment/request":
        if (isPost) return await paymentRequest(ctx);
        break;
      case "payment/verify":
        if (isGet) return await paymentVerify(ctx);
        break;
      case "test-ai-connection":
        if (isPost) return await testAiConnection(ctx, meta);
        break;
      case "sandbox":
        if (isPost) return await sandbox(ctx);
        break;
      case "test-provider":
        if (isPost) return await testProvider(ctx);
        break;
      case "generate-quiz-question":
        if (isPost) return await generateQuizQuestion(ctx, meta);
        break;
      case "telegram-webhook":
        if (isPost) return await telegramWebhook(ctx, meta);
        break;
      case "bale-webhook":
        if (isPost) return await baleWebhook(ctx, meta);
        break;
      default:
        return json({ error: "Not found", path }, 404);
    }
    // method not allowed for this path
    return json({ error: "Method not allowed", path, method }, 405);
  } catch (error: any) {
    return json({ error: "Internal server error", message: error?.message || String(error), path }, 500);
  }
}
