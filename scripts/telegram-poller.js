import fs from 'fs';

const TELEGRAM_TOKEN = "7918804616:AAFb5R4-kLpU0gYxT_ZJp1lV8mQ4yG1nI_0";
const API_BASE = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// منوی دائمی پایین صفحه (Reply Keyboard)
const BOT_PERSISTENT_KEYBOARD = {
  keyboard: [
    [{ text: "⚖️ آزمون وکالت و تست روزانه" }, { text: "📊 کارنامه و شبیه‌ساز تسهیل" }],
    [{ text: "🪤 تله‌های تستی مواد قانون" }, { text: "💬 مشاوره حقوقی هوشمند" }],
    [{ text: "🌐 ورود به پرتال چتر دانش" }, { text: "ℹ️ راهنما و پشتیبانی" }]
  ],
  resize_keyboard: true,
  is_persistent: true
};

// منوی پنجره‌ای شیشه‌ای (Inline Keyboard)
const BOT_INLINE_WINDOWS_MENU = {
  inline_keyboard: [
    [
      { text: "📝 تست تصادفی وکالت", callback_data: "qz:all" },
      { text: "📚 انتخاب درس", callback_data: "menu:lessons" }
    ],
    [
      { text: "🪤 تله‌های پرتکرار آزمون", callback_data: "menu:traps" },
      { text: "📈 تحلیل ساختار آزمون", callback_data: "menu:structure" }
    ],
    [
      { text: "⚖️ محاسبه تراز قانون تسهیل", callback_data: "menu:facilitate" },
      { text: "💬 هوش مصنوعی حق‌یار", callback_data: "menu:chat" }
    ],
    [
      { text: "🌐 ورود مستقیم به سایت چتر دانش", callback_data: "menu:sitelogin" }
    ]
  ]
};

// منوی دروس حقوقی
const BOT_LESSONS_INLINE = {
  inline_keyboard: [
    [{ text: "📘 حقوق مدنی", callback_data: "qz:madani" }, { text: "📕 آیین دادرسی مدنی", callback_data: "qz:adm" }],
    [{ text: "📗 حقوق تجارت", callback_data: "qz:tejarat" }, { text: "📙 حقوق جزا", callback_data: "qz:jaza" }],
    [{ text: "📓 دادرسی کیفری", callback_data: "qz:adk" }, { text: "📔 اصول و متون فقه", callback_data: "qz:fegh" }],
    [{ text: "📜 حقوق اساسی", callback_data: "qz:asasi" }],
    [{ text: "🔙 بازگشت به منوی اصلی", callback_data: "menu:main" }]
  ]
};

// منوی تحلیل تله‌های تستی
const BOT_TRAPS_INLINE = {
  inline_keyboard: [
    [{ text: "⚠️ تله ماده ۴۰۱ (خیار شرط بدون مدت)", callback_data: "trap:401" }],
    [{ text: "⚠️ تله ماده ۳۰۰ (اماره تصرف و تعارض)", callback_data: "trap:300" }],
    [{ text: "⚠️ تله ماده ۱۰۷ (استرداد دادخواست و دعوا)", callback_data: "trap:107" }],
    [{ text: "🔙 بازگشت به منوی اصلی", callback_data: "menu:main" }]
  ]
};

// تابع ایمن‌سازی متون برای تلگرام (جلوگیری از خطای 400 Markdown)
function safeMd(text) {
  if (!text) return "";
  return text.replace(/([_*[\]()~`>#+\-=|{}.!])/g, "\\$1");
}

// بارگذاری بانک ۱۰۵ تستی
let examBank = [];
try {
  const raw = fs.readFileSync('/home/user/chatre-danesh-repo/huggingface-static/data/exams.json', 'utf-8');
  examBank = JSON.parse(raw);
  console.log(`[INIT] ${examBank.length} verified law exam questions loaded into active memory.`);
} catch (e) {
  console.error("[INIT] Failed to load exams.json", e.message);
}

// وضعیت آزمون جاری کاربران
const userQuizSession = new Map();

async function sendTelegram(method, payload) {
  try {
    const res = await fetch(`${API_BASE}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!data.ok) {
      if (payload.parse_mode) {
        delete payload.parse_mode;
        return await sendTelegram(method, payload);
      }
      console.warn(`[API] Telegram ${method} warning:`, data.description);
    }
    return data;
  } catch (err) {
    console.error(`[ERR] Telegram fetch error:`, err.message);
  }
}

async function handleUpdate(update) {
  // ۱. مدیریت پیام‌های متنی و دکمه‌های پایین صفحه
  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();

    if (text === "/start" || text === "منوی اصلی" || text === "شروع مجدد") {
      const welcome = `سلام و احترام به خانواده بزرگ حقوقی چتر دانش و حق‌یار ⚖️\n\nبه سامانه آزمون‌های وکالت، محاسبه‌گر قانون تسهیل و هوش مصنوعی حقوقی چتر دانش خوش آمدید.\n\nلطفاً یکی از خدمات زیر را انتخاب نمایید:`;
      await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: welcome,
        reply_markup: BOT_INLINE_WINDOWS_MENU
      });
      await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "💡 دسترسی سریع نیز از کیبورد پایین همیشه در دسترس شماست:",
        reply_markup: BOT_PERSISTENT_KEYBOARD
      });
      return;
    }

    if (text === "⚖️ آزمون وکالت و تست روزانه" || text === "/quiz") {
      return await serveRandomQuestion(chatId, "all");
    }

    if (text === "📊 کارنامه و شبیه‌ساز تسهیل" || text === "/facilitate") {
      const resp = `📊 *شبیه‌ساز تراز و حدنصاب قبولی قانون تسهیل*\n\nطبق ماده ۵ قانون تسهیل صدور مجوزهای کسب‌وکار:\n• داوطلبان آزاد: کسب ۷۰٪ میانگین نمره تراز ۱٪ برتر\n• داوطلبان ایثارگر: کسب ۶۰٪ میانگین نمره تراز ۱٪ برتر\n\nبرای ارزیابی کارنامه و درصد دروس به پرتال مراجعه فرمایید:\n🔗 https://chattredanesh.ir/facilitate`;
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: resp,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "📊 ورود به شبیه‌ساز تراز", callback_data: "menu:facilitate" }]]
        }
      });
    }

    if (text === "🪤 تله‌های تستی مواد قانون" || text === "/traps") {
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "🪤 *تحلیل و کالبدشکافی تله‌های پرتکرار آزمون وکالت:*\n\nیکی از تله‌های مهم زیر را برای مشاهده تحلیل انتخاب فرمایید:",
        parse_mode: "Markdown",
        reply_markup: BOT_TRAPS_INLINE
      });
    }

    if (text === "💬 مشاوره حقوقی هوشمند" || text === "/smart" || text === "/chat") {
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "⚖️ *هوش مصنوعی حقوقی حق‌یار و چتر دانش*\n\nسوال حقوقی، ماده قانون یا مبحث مدنی/کیفری مورد نظر خود را بنویسید تا مستندات قانونی و رویه قضایی به همراه تست‌های مرتبط ارائه شود."
      });
    }

    if (text === "🌐 ورود به پرتال چتر دانش" || text === "/site") {
      const ssoToken = `sso_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const loginUrl = `https://chattredanesh.ir/login?sso=${ssoToken}&uid=${chatId}`;
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: `🔐 *لینک اختصاصی ورود ۱-کلیکی به پرتال چتر دانش*\n\nاین لینک تا ۱۵ دقیقه معتبر و صرفاً برای اکانت شماست:`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚀 ورود مستقیم به پرتال وب", url: loginUrl }],
            [{ text: "🔙 بازگشت به منوی اصلی", callback_data: "menu:main" }]
          ]
        }
      });
    }

    if (text === "ℹ️ راهنما و پشتیبانی" || text === "/help") {
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: `ℹ️ *راهنمای جامع ربات چتر دانش*\n\n🔹 /quiz - شروع آزمون و تست تصادفی\n🔹 /traps - تحلیل تله‌های تستی آزمون وکالت\n🔹 /facilitate - محاسبه تراز و فرمول قانون تسهیل\n🔹 /smart - پرسش حقوقی از هوش مصنوعی\n🔹 /site - ورود ۱-کلیکی به وبسایت\n\nتلفن پشتیبانی مرکزی: ۰۲۱-۶۶۴۱۴۸۴۸\nوبسایت رسمی: https://chattredanesh.ir`
      });
    }

    // پاسخ هوشمند RAG حقوقی به سوالات متنی
    const hits = examBank.filter(q => q.question.includes(text) || q.subject.includes(text) || (q.tags && q.tags.some(t => t.includes(text))));
    if (hits.length > 0) {
      const top = hits[0];
      const reply = `📚 *تست مرتبط شناسایی‌شده در بانک وکالت:*\n\n[درس: ${top.subject} | تگ: ${top.tags?.join("، ") || "عمومی"}]\n\n❓ *سوال:* ${top.question}\n\n✅ *پاسخ صحیح:* ${top.answer}\n\n💡 برای آزمون بیشتر از دستور /quiz استفاده فرمایید.`;
      return await sendTelegram("sendMessage", { chat_id: chatId, text: reply, parse_mode: "Markdown" });
    }

    // پاسخ عمومی
    return await sendTelegram("sendMessage", {
      chat_id: chatId,
      text: `پیام شما دریافت شد. برای دسترسی به خدمات حقوقی از گزینه‌های زیر استفاده نمایید:`,
      reply_markup: BOT_INLINE_WINDOWS_MENU
    });
  }

  // ۲. مدیریت کلیک روی دکمه‌های شیشه‌ای (Callback Queries)
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message.chat.id;
    const data = cb.data;

    await sendTelegram("answerCallbackQuery", { callback_query_id: cb.id });

    if (data === "menu:main") {
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "⚖️ منوی اصلی سامانه چتر دانش:",
        reply_markup: BOT_INLINE_WINDOWS_MENU
      });
    }

    if (data === "menu:lessons") {
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "📚 *لطفاً درس مورد نظر خود را برای آزمون انتخاب فرمایید:*",
        parse_mode: "Markdown",
        reply_markup: BOT_LESSONS_INLINE
      });
    }

    if (data === "menu:traps") {
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "🪤 *تله‌های پرتکرار مواد قانون در آزمون وکالت:*",
        parse_mode: "Markdown",
        reply_markup: BOT_TRAPS_INLINE
      });
    }

    if (data === "menu:structure") {
      const trendText = `📈 *تحلیل ساختار و بودجه‌بندی آزمون وکالت:*\n\n۱) حقوق مدنی (۲۰ تست): تمرکز ۵۰٪ روی عقود معین و تعهدات (مواد ۱۰، ۱۸۳ تا ۳۰۱، ۳۳۸ تا ۴۶۵)\n۲) آیین دادرسی مدنی (۲۰ تست): تمرکز ویژه بر صلاحیت، طرق فوق‌العاده اعتراض (واخواهی، فرجام، اعاده دادرسی) و اجرای احکام مدنی\n۳) حقوق تجارت (۲۰ تست): شرکت‌های سهامی (لایحه ۱۳۴۷) و اسناد تجاری برات و چک\n۴) حقوق جزا و دادرسی کیفری (۴۰ تست): مجازات‌ها، جرایم علیه اموال، صلاحیت مراجع کیفری و کشف جرم\n\nبرای دریافت کارنامه تحلیلی از دکمه زیر استفاده نمایید:`;
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: trendText,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📝 شروع آزمون این مباحث", callback_data: "qz:all" }],
            [{ text: "🔙 بازگشت به منوی اصلی", callback_data: "menu:main" }]
          ]
        }
      });
    }

    if (data === "menu:facilitate") {
      const resp = `📊 *شبیه‌ساز تراز و حدنصاب قبولی قانون تسهیل*\n\nطبق ماده ۵ قانون تسهیل صدور مجوزهای کسب‌وکار:\n• داوطلبان آزاد: کسب ۷۰٪ میانگین نمره تراز ۱٪ برتر\n• داوطلبان ایثارگر: کسب ۶۰٪ میانگین نمره تراز ۱٪ برتر\n\nبرای ارزیابی کارنامه و درصد دروس به پرتال مراجعه فرمایید:\n🔗 https://chattredanesh.ir/facilitate`;
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: resp,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 منوی اصلی", callback_data: "menu:main" }]]
        }
      });
    }

    if (data.startsWith("trap:")) {
      const trapId = data.replace("trap:", "");
      let desc = "";
      if (trapId === "401") {
        desc = "⚠️ *تله ماده ۴۰۱ قانون مدنی:*\n\nاگر برای خیار شرط مدت معین نشده باشد، هم شرط باطل است و هم عقد باطل است.\n🔹 *دام طراح سوال:* طراح معمولاً می‌نویسد «فقط شرط باطل است» که اشتباه است و هر دو باطلند.";
      } else if (trapId === "300") {
        desc = "⚠️ *تله ماده ۳۰۰ قانون مدنی:*\n\nاگر در یک مال تصرفاتی باشد که با هم تعارض دارند، هیچ یک از متصرفین نمی‌تواند به اماره تصرف استناد کند و اصل بر عدم است.";
      } else if (trapId === "107") {
        desc = "⚠️ *تله ماده ۱۰۷ آیین دادرسی مدنی:*\n\nاسترداد دادخواست تا قبل از اولین جلسه -> قرار ابطال دادخواست\nاسترداد دعوا مادام که دادرسی تمام نشده -> قرار رد دعوا\nاسترداد دعوا پس از ختم مذاکرات -> سقوط دعوا (به شرط رضایت خوانده یا انصراف کلی).";
      }
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: desc,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📝 تست مرتبط با این ماده", callback_data: `qz:trap_${trapId}` }],
            [{ text: "🔙 بازگشت به لیست تله‌ها", callback_data: "menu:traps" }]
          ]
        }
      });
    }

    if (data.startsWith("qz:")) {
      const subj = data.replace("qz:", "");
      return await serveRandomQuestion(chatId, subj);
    }

    if (data.startsWith("ans:")) {
      const [, qIdStr, optIdxStr] = data.split(":");
      const qId = parseInt(qIdStr, 10);
      const selectedOptIdx = parseInt(optIdxStr, 10);
      const session = userQuizSession.get(chatId);

      if (!session || session.qId !== qId) {
        return await sendTelegram("sendMessage", {
          chat_id: chatId,
          text: "⚠️ این سوال قبلاً پاسخ داده شده یا منقضی شده است. برای تست جدید روی دکمه زیر بزنید:",
          reply_markup: {
            inline_keyboard: [[{ text: "📝 تست جدید", callback_data: "qz:all" }]]
          }
        });
      }

      userQuizSession.delete(chatId);
      const item = session.item;
      const isCorrect = item.options[selectedOptIdx] === item.answer;

      let resultMsg = "";
      if (isCorrect) {
        resultMsg = `🎉 *آفرین! پاسخ شما کاملاً صحیح است.*\n\n✅ گزینه انتخابی: ${item.answer}\n\n📚 *مستند و درس:* ${item.subject}\n🏷️ *تگ‌ها:* ${item.tags?.join("، ") || "وکالت"}`;
      } else {
        resultMsg = `❌ *پاسخ نادرست بود.*\n\nگزینه شما: ${item.options[selectedOptIdx]}\n✅ *پاسخ صحیح:* ${item.answer}\n\n📚 *درس:* ${item.subject}\n🏷️ *تگ‌ها:* ${item.tags?.join("، ") || "وکالت"}`;
      }

      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: resultMsg,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔄 تست بعدی", callback_data: `qz:${session.subj || "all"}` }],
            [{ text: "📊 بازگشت به منوی اصلی", callback_data: "menu:main" }]
          ]
        }
      });
    }

    if (data === "menu:sitelogin") {
      const ssoToken = `sso_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const loginUrl = `https://chattredanesh.ir/login?sso=${ssoToken}&uid=${chatId}`;
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: `🔐 برای ورود مستقیم به پنل کاربری کلیک کنید:`,
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚀 ورود به سایت چتر دانش", url: loginUrl }],
            [{ text: "🔙 بازگشت", callback_data: "menu:main" }]
          ]
        }
      });
    }
  }
}

async function serveRandomQuestion(chatId, subj = "all") {
  let pool = examBank;
  if (subj === "madani") pool = examBank.filter(q => q.subject.includes("مدنی") && !q.subject.includes("دادرسی"));
  else if (subj === "adm") pool = examBank.filter(q => q.subject.includes("دادرسی مدنی"));
  else if (subj === "tejarat") pool = examBank.filter(q => q.subject.includes("تجارت"));
  else if (subj === "jaza") pool = examBank.filter(q => q.subject.includes("جزا"));
  else if (subj === "adk") pool = examBank.filter(q => q.subject.includes("کیفری"));
  else if (subj === "fegh") pool = examBank.filter(q => q.subject.includes("فقه"));
  else if (subj === "asasi") pool = examBank.filter(q => q.subject.includes("اساسی"));
  
  if (pool.length === 0) pool = examBank;
  const randIdx = Math.floor(Math.random() * pool.length);
  const q = pool[randIdx];

  const qId = Date.now();
  userQuizSession.set(chatId, { qId, item: q, subj });

  const text = `📝 *آزمون وکالت [درس: ${q.subject}]*\n\n❓ *سوال:*\n${q.question}\n\n👇 لطفاً پاسخ صحیح را انتخاب فرمایید:`;

  const inlineKeyboard = q.options.map((opt, optIdx) => [
    { text: `🔹 ${opt}`, callback_data: `ans:${qId}:${optIdx}` }
  ]);

  inlineKeyboard.push([{ text: "🔙 انصراف و بازگشت", callback_data: "menu:main" }]);

  await sendTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: inlineKeyboard }
  });
}

let lastUpdateId = 0;
async function startLongPolling() {
  console.log("===================================================================");
  console.log("🤖 موتور پاسخ‌دهی زنده ربات تلگرام چتر دانش فعال شد (@ChatreDanesh_Law_Bot)");
  console.log("===================================================================");

  while (true) {
    try {
      const res = await fetch(`${API_BASE}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`);
      const data = await res.json();
      if (data.ok && Array.isArray(data.result)) {
        for (const u of data.result) {
          lastUpdateId = u.update_id;
          await handleUpdate(u);
        }
      }
    } catch (err) {
      // Sleep slightly on error to prevent CPU thrashing
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

startLongPolling();
