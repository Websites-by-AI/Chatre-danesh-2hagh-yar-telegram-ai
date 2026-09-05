import fs from 'fs';

const TELEGRAM_TOKEN = "7918804616:AAFb5R4-kLpU0gYxT_ZJp1lV8mQ4yG1nI_0";
const API_BASE = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// منوی دائمی پایین صفحه (Reply Keyboard)
const BOT_PERSISTENT_KEYBOARD = {
  keyboard: [
    [{ text: "⚖️ آزمون وکالت و تست روزانه" }, { text: "📊 کارنامه و شبیه‌ساز تسهیل" }],
    [{ text: "🪤 تله‌های تستی مواد قانون" }, { text: "🧠 مشاوره با هوش مصنوعی KAG" }],
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
      { text: "🧠 استنتاج حقوقی KAG (۲۰ کتاب)", callback_data: "menu:kag" }
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

// بارگذاری بانک ۱۰۵ تستی و پایگاه KAG
let examBank = [];
let lawBooksCorpus = [];
let kagGraph = null;

try {
  examBank = JSON.parse(fs.readFileSync('/home/user/chatre-danesh-repo/huggingface-static/data/exams.json', 'utf-8'));
  lawBooksCorpus = JSON.parse(fs.readFileSync('/home/user/chatre-danesh-repo/huggingface-static/data/law-books-corpus.json', 'utf-8')).books || [];
  kagGraph = JSON.parse(fs.readFileSync('/home/user/chatre-danesh-repo/huggingface-static/data/legal-knowledge-graph.json', 'utf-8'));
  console.log(`[INIT] Loaded ${examBank.length} questions, ${lawBooksCorpus.length} law books, and KAG Knowledge Graph.`);
} catch (e) {
  console.error("[INIT] Failed to load databases:", e.message);
}

// موتور استنتاج KAG بر روی ۲۰ کتاب و گراف دانش
function executeKagReasoning(userText) {
  const norm = (s) => (s || "").replace(/[يك]/g, c => c === 'ي' ? 'ی' : 'ک').replace(/[\u200c\u200f\s]+/g, ' ').trim().toLowerCase();
  const qNorm = norm(userText);
  const tokens = qNorm.split(/\s+/).filter(t => t.length >= 2);

  const matchedEntities = [];
  const matchedEntityIds = new Set();

  if (kagGraph && kagGraph.entities) {
    for (const ent of kagGraph.entities) {
      if (ent.keywords.some(kw => qNorm.includes(norm(kw))) || qNorm.includes(norm(ent.name)) || qNorm.includes(norm(ent.core_article))) {
        matchedEntities.push(ent);
        matchedEntityIds.add(ent.id);
      }
    }
  }

  const inferredRelations = [];
  if (kagGraph && kagGraph.relations) {
    for (const rel of kagGraph.relations) {
      if (matchedEntityIds.has(rel.from) || matchedEntityIds.has(rel.to)) {
        inferredRelations.push(rel);
      }
    }
  }

  const matchedArticles = [];
  for (const book of lawBooksCorpus) {
    for (const art of (book.key_articles || [])) {
      const artHay = norm(`${art.article} ${art.subject} ${art.text} ${art.doctrine} ${(art.exceptions || []).join(' ')}`);
      let score = 0;
      for (const t of tokens) {
        if (artHay.includes(t)) score++;
      }
      if (score > 0) {
        matchedArticles.push({ book: book.title, art, score });
      }
    }
  }

  matchedArticles.sort((a, b) => b.score - a.score);

  let resp = `🧠 *پاسخ استنتاجی هوش مصنوعی حقوقی چتر دانش (مبتنی بر مدل KAG & RAG)*\n`;
  resp += `────────────────────────────\n`;

  if (matchedEntities.length > 0) {
    resp += `📌 *نهادهای حقوقی تطبیق داده‌شده:*\n`;
    matchedEntities.slice(0, 2).forEach(e => {
      resp += `• ${e.name} (${e.statute} - ${e.core_article})\n`;
    });
    resp += `\n`;
  }

  if (inferredRelations.length > 0) {
    resp += `🔗 *روابط استنتاجی و استثنائات قانونی:*\n`;
    inferredRelations.slice(0, 2).forEach(r => {
      resp += `• ${r.description}\n`;
    });
    resp += `\n`;
  }

  if (matchedArticles.length > 0) {
    const top = matchedArticles[0];
    resp += `📚 *مستند قانونی از کتاب «${top.book}»:*\n`;
    resp += `⚖️ *${top.art.article} - ${top.art.subject}:*\n«${top.art.text}»\n\n`;
    resp += `💡 *دکترین و نظر اساتید:* ${top.art.doctrine}\n`;
    if (top.art.exceptions && top.art.exceptions.length > 0) {
      resp += `⚠️ *استثنائات:* ${top.art.exceptions.join('، ')}\n`;
    }
  } else {
    resp += `برای جستجوی دقیق‌تر می‌توانید شماره ماده قانون (مثلاً ماده ۴۰۱ ق.م، ماده ۱۰۷ ق.آ.د.م، ماده ۲۳ چک یا ماده ۱۱ صلح) را ارسال فرمایید.`;
  }

  return resp;
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
  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();

    if (text === "/start" || text === "منوی اصلی" || text === "شروع مجدد") {
      const welcome = `سلام و احترام به جامعه حقوقی چتر دانش و حق‌یار ⚖️\n\nپایگاه هوش مصنوعی حقوقی با ۲۰ کتاب قانون مرجع ایران، گراف دانش KAG، شبیه‌ساز قانون تسهیل و بانک تست‌های وکالت آماده خدمت به شماست.\n\nلطفاً یکی از خدمات زیر را انتخاب نمایید:`;
      await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: welcome,
        reply_markup: BOT_INLINE_WINDOWS_MENU
      });
      await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "💡 دسترسی سریع از کیبورد پایین صفحه نیز فعال است:",
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

    if (text === "🧠 مشاوره با هوش مصنوعی KAG" || text === "/smart" || text === "/chat" || text === "/kag") {
      const kagInfo = `🧠 *سامانه استنتاج حقوقی KAG (مبتنی بر ۲۰ کتاب مرجع)*\n\nپایگاه هوش مصنوعی مسلط به:\n۱) قانون مدنی (۱۳۳۵ ماده)\n۲) آیین دادرسی مدنی (۵۲۹ ماده)\n۳) قانون مجازات اسلامی ۱۳۹۲\n۴) آیین دادرسی کیفری\n۵) قانون تجارت و اسناد برات و چک\n۶) قانون دادگاه‌های صلح ۱۴۰۲\n۷) چک صیادی و ثبت اسناد و ...\n\n💬 کافیست سوال حقوقی یا ماده قانون مدنظر خود را همینجا تایپ کنید.`;
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: kagInfo,
        parse_mode: "Markdown"
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
        text: `ℹ️ *راهنمای جامع ربات چتر دانش و مدل KAG*\n\n🔹 /quiz - شروع آزمون و تست تصادفی\n🔹 /traps - تحلیل تله‌های تستی آزمون وکالت\n🔹 /kag - مشاوره استنتاجی با ۲۰ کتاب قانون\n🔹 /facilitate - محاسبه تراز قانون تسهیل\n🔹 /site - ورود ۱-کلیکی به وبسایت\n\nتلفن پشتیبانی مرکزی: ۰۲۱-۶۶۴۱۴۸۴۸\nوبسایت رسمی: https://chattredanesh.ir`
      });
    }

    // استنتاج KAG بر روی متن پیام کاربر
    const kagResponse = executeKagReasoning(text);
    return await sendTelegram("sendMessage", {
      chat_id: chatId,
      text: kagResponse,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "📝 تست مرتبط با این موضوع", callback_data: "qz:all" }],
          [{ text: "🔙 منوی اصلی", callback_data: "menu:main" }]
        ]
      }
    });
  }

  // مدیریت دکمه‌های شیشه‌ای
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

    if (data === "menu:kag") {
      const kagInfo = `🧠 *سامانه استنتاج حقوقی KAG (مبتنی بر ۲۰ کتاب مرجع)*\n\nپایگاه هوش مصنوعی مسلط به:\n۱) قانون مدنی (۱۳۳۵ ماده)\n۲) آیین دادرسی مدنی (۵۲۹ ماده)\n۳) قانون مجازات اسلامی ۱۳۹۲\n۴) آیین دادرسی کیفری\n۵) قانون تجارت و اسناد برات و چک\n۶) قانون دادگاه‌های صلح ۱۴۰۲\n۷) چک صیادی و ثبت اسناد و ...\n\n💬 کافیست سوال حقوقی یا ماده قانون مدنظر خود را همینجا تایپ کنید.`;
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: kagInfo,
        parse_mode: "Markdown"
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
  console.log("🤖 موتور پاسخ‌دهی زنده ربات تلگرام چتر دانش با KAG فعال شد (@ChatreDanesh_Law_Bot)");
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
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

startLongPolling();
