/**
 * Taranom Channel Poster — پست خودکار روزانه در دو کانال:
 *   تلگرام: @ai_exam_iran | بله: @taranom_hamdeli_channel (ble.ir/taranom_hamdeli_channel)
 * ۱) سوال روز از بانک RAG (هاگینگ‌فیس)
 * ۲) نکته/ترند روز AI و آموزش — تولید با Workers AI (Llama-3.3-70B)
 */
const FA = ["۰","۱","۲","۳","۴","۵","۶","۷","۸","۹"];
const fa = (n) => String(n).replace(/\d/g, (c) => FA[+c]);

async function tg(env, method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });
  return r.json();
}

async function bale(env, method, payload) {
  const r = await fetch(`https://tapi.bale.ai/bot${env.BALE_BOT_TOKEN}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });
  return r.json();
}

async function questionOfDay(env, platform) {
  const r = await fetch(`${env.EXAM_RAG_URL}/data/quiz-lite.json`, { signal: AbortSignal.timeout(15000) });
  const bank = await r.json();
  const doy = Math.floor((Date.now() - Date.parse(new Date().getUTCFullYear() + "-01-01")) / 86400000);
  const item = bank[(doy * 37) % bank.length];
  const lines = item.o.map((o, i) => `${fa(i + 1)}) ${o}`).join("\n");
  const today = new Date().toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" });
  const botLink = platform === "bale" ? "ble.ir/taranom_hamdeli_bot" : "@taranom_hamdeli_bot";
  const btnUrl = platform === "bale" ? "https://ble.ir/taranom_hamdeli_bot" : "https://t.me/taranom_hamdeli_bot";
  return {
    text: `🌅 سوال روز — ${today}\n📚 ${item.s} | کنکور ${fa(item.y)} (${item.f})\n━━━━━━━━━━━━━━━\n${item.q}\n\n${lines}\n━━━━━━━━━━━━━━━\n✍️ جوابت را در ربات بفرست و کارنامه بگیر:\n🤖 ${botLink} | 🌐 hamdeltar.ir`,
    reply_markup: { inline_keyboard: [[{ text: "📝 پاسخ در ربات + تست‌های بیشتر", url: btnUrl }]] },
  };
}

const TIP_TOPICS = [
  "یک ترند مهم هوش مصنوعی در آموزش (مثل تدریس خصوصی با AI، آزمون تطبیقی CAT، یا RAG) را برای دانش‌آموزان کنکوری ساده توضیح بده",
  "یک تکنیک علمی مطالعه (پومودورو، مرور فاصله‌دار، بازیابی فعال و...) را با یک مثال کنکوری توضیح بده",
  "یک خبر یا پیشرفت جدید هوش مصنوعی در دنیا را ساده توضیح بده و بگو چه ربطی به یادگیری دانش‌آموزان دارد",
  "یک ابزار هوش مصنوعی رایگان مفید برای دانش‌آموزان معرفی کن و روش استفاده‌اش در درس خواندن را بگو",
  "یک باور غلط رایج درباره هوش مصنوعی یا کنکور را رد کن و واقعیت علمی را بگو",
  "درباره روانشناسی یادگیری و مدیریت اضطراب آزمون یک نکته کاربردی مبتنی بر پژوهش بگو",
  "آینده شغل‌ها در عصر هوش مصنوعی — به یک دانش‌آموز کنکوری بگو چه مهارتی کنار درس بخواند",
];

async function aiTip(env) {
  const doy = Math.floor(Date.now() / 86400000);
  const topic = TIP_TOPICS[doy % TIP_TOPICS.length];
  const models = ["@cf/meta/llama-3.3-70b-instruct-fp8-fast", "@cf/meta/llama-4-scout-17b-16e-instruct"];
  for (const m of models) {
    try {
      const out = await env.AI.run(m, {
        messages: [
          { role: "system", content: "شما نویسنده کانال «هوش مصنوعی برای مشاوره کنکور» هستید. یک پست فارسی کوتاه (۵ تا ۸ جمله)، دقیق و جذاب بنویس. بدون مقدمه‌چینی، مستقیم سر اصل مطلب. از ۱-۲ ایموجی مناسب استفاده کن. آخر پست هشتگ نگذار." },
          { role: "user", content: topic },
        ],
        max_tokens: 500,
      });
      const t = (out?.response || out?.choices?.[0]?.message?.content || "").trim();
      if (t) return t;
    } catch (e) { /* مدل بعدی */ }
  }
  return "";
}

function tipText(tip, platform) {
  const today = new Date().toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran" });
  const botLink = platform === "bale" ? "ble.ir/taranom_hamdeli_bot" : "@taranom_hamdeli_bot";
  return `💡 نکته روز — ${today}\n━━━━━━━━━━━━━━━\n${tip}\n━━━━━━━━━━━━━━━\n🤖 مشاوره رایگان با هوش مصنوعی: ${botLink}\n🌐 hamdeltar.ir`;
}

async function postDaily(env) {
  const results = { telegram: { question: null, tip: null }, bale: { question: null, tip: null } };
  const tip = await aiTip(env);

  // ── تلگرام (@ai_exam_iran)
  try {
    const q = await questionOfDay(env, "telegram");
    const r1 = await tg(env, "sendMessage", { chat_id: env.CHANNEL_ID, text: q.text, reply_markup: q.reply_markup });
    results.telegram.question = r1.ok ? r1.result.message_id : r1.description;
  } catch (e) { results.telegram.question = "err: " + e.message; }
  try {
    if (tip) {
      const r2 = await tg(env, "sendMessage", { chat_id: env.CHANNEL_ID, text: tipText(tip, "telegram") });
      results.telegram.tip = r2.ok ? r2.result.message_id : r2.description;
    } else results.telegram.tip = "ai empty";
  } catch (e) { results.telegram.tip = "err: " + e.message; }

  // ── بله (@taranom_hamdeli_channel — ble.ir/taranom_hamdeli_channel)
  if (env.BALE_BOT_TOKEN && env.BALE_CHANNEL_ID) {
    try {
      const qb = await questionOfDay(env, "bale");
      const b1 = await bale(env, "sendMessage", { chat_id: env.BALE_CHANNEL_ID, text: qb.text, reply_markup: qb.reply_markup });
      results.bale.question = b1.ok ? b1.result.message_id : (b1.description || JSON.stringify(b1));
    } catch (e) { results.bale.question = "err: " + e.message; }
    try {
      if (tip) {
        const b2 = await bale(env, "sendMessage", { chat_id: env.BALE_CHANNEL_ID, text: tipText(tip, "bale") });
        results.bale.tip = b2.ok ? b2.result.message_id : (b2.description || JSON.stringify(b2));
      } else results.bale.tip = "ai empty";
    } catch (e) { results.bale.tip = "err: " + e.message; }
  } else {
    results.bale.question = results.bale.tip = "bale not configured";
  }
  return results;
}

export default {
  // اجرای خودکار طبق cron (هر روز)
  async scheduled(event, env, ctx) {
    ctx.waitUntil(postDaily(env));
  },
  // اجرای دستی/تست: GET /run?key=SECRET
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/run" && url.searchParams.get("key") === env.RUN_KEY) {
      const r = await postDaily(env);
      return new Response(JSON.stringify(r), { headers: { "Content-Type": "application/json" } });
    }
    if (url.pathname === "/bale-check" && url.searchParams.get("key") === env.RUN_KEY) {
      // تشخیص: وضعیت ربات بله + دسترسی به کانال
      const me = await bale(env, "getMe", {}).catch((e) => ({ err: e.message }));
      const chat = await bale(env, "getChat", { chat_id: env.BALE_CHANNEL_ID }).catch((e) => ({ err: e.message }));
      const member = await bale(env, "getChatMember", { chat_id: env.BALE_CHANNEL_ID, user_id: 298530966 }).catch((e) => ({ err: e.message }));
      return new Response(JSON.stringify({ me, chat, member }), { headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ ok: true, service: "taranom-channel-poster", channels: ["telegram:@ai_exam_iran", "bale:@taranom_hamdeli_channel"], schedule: "daily 06:30 UTC (~10:00 Tehran)" }), { headers: { "Content-Type": "application/json" } });
  },
};
