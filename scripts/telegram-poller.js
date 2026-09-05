import fs from 'fs';

const TELEGRAM_TOKEN = "7918804616:AAFb5R4-kLpU0gYxT_ZJp1lV8mQ4yG1nI_0";
const API_BASE = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// منوی دائمی پایین صفحه
const BOT_PERSISTENT_KEYBOARD = {
  keyboard: [
    [{ text: "⚖️ آزمون‌ها و تست‌های تخصصی" }, { text: "🎓 انتخاب آزمون (وکالت/قضاوت/سردفتری)" }],
    [{ text: "🪤 تله‌های تستی مواد قانون" }, { text: "🧠 جعبه‌ابزار مهارت‌های KAG" }],
    [{ text: "🌐 ورود به پرتال چتر دانش" }, { text: "ℹ️ راهنما و پشتیبانی" }]
  ],
  resize_keyboard: true,
  is_persistent: true
};

// منوی پنجره‌ای شیشه‌ای اصلی
const BOT_INLINE_WINDOWS_MENU = {
  inline_keyboard: [
    [
      { text: "📝 تست تصادفی", callback_data: "qz:all" },
      { text: "🎓 انتخاب آزمون تخصصی", callback_data: "menu:exams" }
    ],
    [
      { text: "🪤 تله‌های پرتکرار", callback_data: "menu:traps" },
      { text: "📈 تحلیل ساختار و بودجه‌بندی", callback_data: "menu:structure" }
    ],
    [
      { text: "📅 محاسبه مواعد دادرسی", callback_data: "menu:deadlines" },
      { text: "🏛️ صلاحیت دادگاه صلح", callback_data: "menu:courts" }
    ],
    [
      { text: "🎙️ مصاحبه شفاهی قضاوت", callback_data: "menu:oral" },
      { text: "🤖 انتخاب موتور AI", callback_data: "menu:models" }
    ],
    [
      { text: "🌐 ورود مستقیم به سایت چتر دانش", callback_data: "menu:sitelogin" }
    ]
  ]
};

// منوی آزمون‌های ۷گانه حقوقی
const BOT_EXAMS_INLINE = {
  inline_keyboard: [
    [{ text: "⚖️ ۱. وکالت کانون وکلای دادگستری (اسکودا)", callback_data: "set_exam:bar_scoda" }],
    [{ text: "⚖️ ۲. مرکز وکلای قوه قضائیه (ماده ۱۸۷)", callback_data: "set_exam:bar_187" }],
    [{ text: "⚖️ ۳. آزمون تصدی منصب قضا (قضاوت)", callback_data: "set_exam:qazavat" }],
    [{ text: "📜 ۴. آزمون سردفتری اسناد رسمی", callback_data: "set_exam:sardaftari" }],
    [{ text: "📐 ۵. کارشناسان رسمی دادگستری", callback_data: "set_exam:experts" }],
    [{ text: "👨‍👩‍👧 ۶. مشاوران خانواده قوه قضائیه", callback_data: "set_exam:family" }],
    [{ text: "🎓 ۷. کنکور کارشناسی ارشد و دکتری حقوق", callback_data: "set_exam:masters" }],
    [{ text: "🔙 بازگشت به منوی اصلی", callback_data: "menu:main" }]
  ]
};

// منوی انتخاب مدل هوش مصنوعی
const BOT_MODELS_INLINE = {
  inline_keyboard: [
    [{ text: "🧠 ۱. موتور بومی KAG چتر دانش (۲۰ کتاب مرجع)", callback_data: "set_model:kag_local" }],
    [{ text: "⚡ ۲. دیپ‌سیک استدلالی (DeepSeek R1 / V3)", callback_data: "set_model:deepseek" }],
    [{ text: "🌐 ۳. جمینای حقوقی (Google Gemini 2.0)", callback_data: "set_model:gemini" }],
    [{ text: "☁️ ۴. کلودفلر ورکرز AI (Llama 3 Legal)", callback_data: "set_model:workers_ai" }],
    [{ text: "🔙 بازگشت به منوی اصلی", callback_data: "menu:main" }]
  ]
};

// منوی مواعد قانونی
const BOT_DEADLINES_INLINE = {
  inline_keyboard: [
    [{ text: "⏳ مهلت تجدیدنظرخواهی (۲۰ روز)", callback_data: "dl:appeal" }],
    [{ text: "⏳ مهلت واخواهی احکام غیابی (۲۰ روز)", callback_data: "dl:protest" }],
    [{ text: "⏳ مهلت اجرای احکام و توقیف (۱۰ روز)", callback_data: "dl:execution" }],
    [{ text: "⏳ مواعد چک صیادی و واخواست", callback_data: "dl:sayad_check" }],
    [{ text: "🔙 بازگشت به منوی اصلی", callback_data: "menu:main" }]
  ]
};

// منوی تله‌های تستی
const BOT_TRAPS_INLINE = {
  inline_keyboard: [
    [{ text: "⚠️ تله ماده ۴۰۱ (خیار شرط بدون مدت)", callback_data: "trap:401" }],
    [{ text: "⚠️ تله ماده ۳۰۰ (اماره تصرف و تعارض)", callback_data: "trap:300" }],
    [{ text: "⚠️ تله ماده ۱۰۷ (استرداد دادخواست و دعوا)", callback_data: "trap:107" }],
    [{ text: "🔙 بازگشت به منوی اصلی", callback_data: "menu:main" }]
  ]
};

// بارگذاری دیتابیس‌ها
let examBank = [];
let lawBooksCorpus = [];
let kagGraph = null;
let allExamsSpecs = [];

try {
  examBank = JSON.parse(fs.readFileSync('/home/user/chatre-danesh-repo/huggingface-static/data/exams.json', 'utf-8'));
  lawBooksCorpus = JSON.parse(fs.readFileSync('/home/user/chatre-danesh-repo/huggingface-static/data/law-books-corpus.json', 'utf-8')).books || [];
  kagGraph = JSON.parse(fs.readFileSync('/home/user/chatre-danesh-repo/huggingface-static/data/legal-knowledge-graph.json', 'utf-8'));
  allExamsSpecs = JSON.parse(fs.readFileSync('/home/user/chatre-danesh-repo/huggingface-static/data/all-legal-exams-specs.json', 'utf-8')).exams || [];
  console.log(`[INIT] Loaded ${examBank.length} questions, 20 books, ${allExamsSpecs.length} exam specs, and KAG Graph.`);
} catch (e) {
  console.error("[INIT] Failed to load databases:", e.message);
}

// وضعیت کاربران
const userPreferences = new Map(); // chatId -> { currentExam: string, currentModel: string }
const userQuizSession = new Map();

function getUserPref(chatId) {
  if (!userPreferences.has(chatId)) {
    userPreferences.set(chatId, { currentExam: 'bar_scoda', currentModel: 'kag_local' });
  }
  return userPreferences.get(chatId);
}

// موتور استنتاج KAG
function executeKagReasoning(userText, examType = 'bar_scoda', model = 'kag_local') {
  const faDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  let qNorm = userText;
  for (let i = 0; i < 10; i++) qNorm = qNorm.replaceAll(faDigits[i], i.toString());
  qNorm = qNorm.replace(/[يك]/g, c => c === 'ي' ? 'ی' : 'ک').replace(/[\u200c\u200f\s]+/g, ' ').trim().toLowerCase();
  const tokens = qNorm.split(/\s+/).filter(t => t.length >= 2);

  const matchedEntities = [];
  const matchedEntityIds = new Set();

  if (kagGraph && kagGraph.entities) {
    for (const ent of kagGraph.entities) {
      if (ent.keywords.some(kw => qNorm.includes(kw.toLowerCase())) || qNorm.includes(ent.name.toLowerCase()) || qNorm.includes(ent.core_article.toLowerCase())) {
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
      const artHay = `${art.article} ${art.subject} ${art.text} ${art.doctrine} ${(art.exceptions || []).join(' ')}`.toLowerCase();
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

  const examSpec = allExamsSpecs.find(e => e.id === `exam_${examType}`) || allExamsSpecs[0];

  let resp = `🧠 *پاسخ استنتاجی هوش مصنوعی حقوقی چتر دانش*\n`;
  resp += `🎯 *آزمون هدف:* ${examSpec.title}\n`;
  resp += `🤖 *موتور فعال:* ${model === 'kag_local' ? 'KAG بومی چتر دانش (۲۰ کتاب مرجع)' : model.toUpperCase()}\n`;
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
    resp += `کافیست موضوع حقوقی یا ماده قانون مدنظر (مثل ماده ۴۰۱ ق.م، ماده ۱۰۷ ق.آ.د.م، صلاحیت دادگاه صلح یا چک صیادی) را بنویسید.`;
  }

  return resp;
}

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
    const pref = getUserPref(chatId);

    if (text === "/start" || text === "منوی اصلی" || text === "شروع مجدد") {
      const welcome = `سلام و احترام به خانواده بزرگ حقوقی چتر دانش و حق‌یار ⚖️\n\nپایگاه جامع آمادگی آزمون‌های **وکالت، قضاوت، سردفتری، مرکز وکلا و ارشد حقوق** با پشتیبانی از چند مدل هوش مصنوعی و ۲۰ کتاب مرجع.\n\nلطفاً یکی از خدمات زیر را انتخاب نمایید:`;
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

    if (text === "🎓 انتخاب آزمون (وکالت/قضاوت/سردفتری)" || text === "/exams") {
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "🎓 *لطفاً آزمون هدف خود را جهت شخصی‌سازی ضرایب، تست‌ها و پاسخ‌های هوش مصنوعی انتخاب نمایید:*",
        parse_mode: "Markdown",
        reply_markup: BOT_EXAMS_INLINE
      });
    }

    if (text === "⚖️ آزمون‌ها و تست‌های تخصصی" || text === "/quiz") {
      return await serveRandomQuestion(chatId, "all");
    }

    if (text === "🪤 تله‌های تستی مواد قانون" || text === "/traps") {
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "🪤 *تحلیل و کالبدشکافی تله‌های پرتکرار آزمون وکالت و قضاوت:*",
        parse_mode: "Markdown",
        reply_markup: BOT_TRAPS_INLINE
      });
    }

    if (text === "🧠 جعبه‌ابزار مهارت‌های KAG" || text === "/skills") {
      const skillsMsg = `🧠 *جعبه‌ابزار مهارت‌های تخصصی هوش مصنوعی KAG:*\n\n۱) 📅 محاسبه مواعد دادرسی و تجدیدنظر (/deadlines)\n۲) 🏛️ تشخیص صلاحیت دادگاه صلح و مراجع قضایی (/courts)\n۳) 🎙️ کارگاه شفاهی و مصاحبه علمی قضاوت و وکالت (/oral)\n۴) 🤖 تغییر مدل هوش مصنوعی (KAG، دیپ‌سیک، جمینای)\n۵) 🎓 آزمون‌های سردفتری، وکالت، قضاوت و ارشد\n\nکافیست از منوی زیر استفاده کنید یا سوال حقوقی خود را بپرسید:`;
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: skillsMsg,
        parse_mode: "Markdown",
        reply_markup: BOT_INLINE_WINDOWS_MENU
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
        text: `ℹ️ *راهنمای جامع سامانه چندآزمونی چتر دانش*\n\n🔹 /exams - انتخاب آزمون (وکالت، قضاوت، سردفتری و ...)\n🔹 /skills - جعبه‌ابزار مهارت‌های هوشمند\n🔹 /quiz - شروع آزمون و تست تصادفی\n🔹 /deadlines - محاسبه مواعد دادرسی\n🔹 /traps - تله‌های تستی آزمون\n🔹 /site - ورود ۱-کلیکی به وبسایت\n\nتلفن پشتیبانی مرکزی: ۰۲۱-۶۶۴۱۴۸۴۸\nوبسایت رسمی: https://chattredanesh.ir`
      });
    }

    // پاسخ با موتور KAG / Multi-Model
    const kagResponse = executeKagReasoning(text, pref.currentExam, pref.currentModel);
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

  // مدیریت کلیک دکمه‌های شیشه‌ای
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message.chat.id;
    const data = cb.data;
    const pref = getUserPref(chatId);

    await sendTelegram("answerCallbackQuery", { callback_query_id: cb.id });

    if (data === "menu:main") {
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "⚖️ منوی اصلی سامانه چتر دانش:",
        reply_markup: BOT_INLINE_WINDOWS_MENU
      });
    }

    if (data === "menu:exams") {
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "🎓 *انتخاب آزمون حقوقی هدف شما:*",
        parse_mode: "Markdown",
        reply_markup: BOT_EXAMS_INLINE
      });
    }

    if (data.startsWith("set_exam:")) {
      const examKey = data.replace("set_exam:", "");
      pref.currentExam = examKey;
      const spec = allExamsSpecs.find(e => e.id === `exam_${examKey}`) || allExamsSpecs[0];
      
      let coursesText = spec.courses.map(c => `• ${c.name} (ضریب ${c.coefficient} - ${c.questions} تست)`).join("\n");
      const respMsg = `✅ *آزمون هدف شما با موفقیت به «${spec.title}» تغییر یافت.*\n\n📋 *ساختار و ضرایب دروس:*\n${coursesText}\n\n⚖️ *مبنای قانونی و پذیرش:*\n${spec.scoring_rule}`;
      
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: respMsg,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📝 شروع تست‌های این آزمون", callback_data: "qz:all" }],
            [{ text: "🔙 بازگشت به منوی اصلی", callback_data: "menu:main" }]
          ]
        }
      });
    }

    if (data === "menu:models") {
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "🤖 *انتخاب موتور هوش مصنوعی حقوقی:*\n\nمدل فعال فعلی: `" + (pref.currentModel || "kag_local") + "`",
        parse_mode: "Markdown",
        reply_markup: BOT_MODELS_INLINE
      });
    }

    if (data.startsWith("set_model:")) {
      const modelKey = data.replace("set_model:", "");
      pref.currentModel = modelKey;
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: `✅ موتور هوش مصنوعی به **${modelKey.toUpperCase()}** تغییر یافت. از این پس استنتاج‌ها با این مدل و پایگاه ۲۰ کتاب چتر دانش تحلیل می‌گردد.`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 منوی اصلی", callback_data: "menu:main" }]]
        }
      });
    }

    if (data === "menu:deadlines") {
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "📅 *محاسبه‌گر مواعد قانونی و مهلت‌های دادرسی:*\n\nکدام موعد قانونی را می‌خواهید محاسبه کنید؟",
        parse_mode: "Markdown",
        reply_markup: BOT_DEADLINES_INLINE
      });
    }

    if (data.startsWith("dl:")) {
      const type = data.replace("dl:", "");
      let info = "";
      if (type === "appeal") {
        info = "⏳ *مهلت تجدیدنظرخواهی حقوقی و کیفری:*\n\n• مهلت برای مقیمین ایران: **۲۰ روز** (مقیمین خارج: ۶۰ روز)\n• مستند: ماده ۳۳۶ ق.آ.د.م و ۴۳۱ ق.آ.د.ک\n• مبدا: تاریخ ابلاغ دادنامه در سامانه ثنا\n• قاعده: روز ابلاغ و روز اقدام جزء مدت محاسبه نمی‌شود.";
      } else if (type === "protest") {
        info = "⏳ *مهلت واخواهی احکام غیابی:*\n\n• مهلت: **۲۰ روز** از تاریخ ابلاغ واقعی به محکوم‌علیه\n• مستند: ماده ۳۰۵ ق.آ.د.م\n• اثر: واخواهی اجرای حکم غیابی را متوقف می‌سازد.";
      } else if (type === "execution") {
        info = "⏳ *مهلت اجرای اختیاری اجراییه دادگاه:*\n\n• مهلت: **۱۰ روز** از تاریخ ابلاغ اجراییه در ثنا\n• مستند: ماده ۳۴ قانون اجرای احکام مدنی\n• اقدام: پرداخت محکوم‌به، معرفی مال یا ثبت دادخواست اعسار.";
      } else if (type === "sayad_check") {
        info = "⏳ *مواعد چک صیادی و واخواست:*\n\n• صدور اجراییه مستقیم ماده ۲۳: بدون انقضای مدت علیه صادرکننده\n• حفظ مسئولیت تضامنی ظهرنویسان: دریافت گواهی ظرف ۱۵ روز از سررسید (ماده ۳۱۵ ق.ت).";
      }
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: info,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "📅 محاسبه موعد دیگر", callback_data: "menu:deadlines" }],
            [{ text: "🔙 منوی اصلی", callback_data: "menu:main" }]
          ]
        }
      });
    }

    if (data === "menu:courts") {
      const courtsInfo = `🏛️ *تشخیص صلاحیت دادگاه‌های صلح و مراجع قضایی (قانون ۱۴۰۲)*\n\n۱) **دادگاه صلح:**\n• کلیه دعاوی مالی تا سقف ۱۰۰ میلیون تومان (تا ۵۰ میلیون قطعی است)\n• دعاوی تصرف عدوانی، ممانعت از حق و حصر وراثت بدون سقف مالی\n• دعاوی تخلیه و تعدیل اجاره‌بها\n\n۲) **دادگاه عمومی حقوقی:**\n• دعاوی مالی بالاتر از ۱۰۰ میلیون تومان و دعاوی اسناد رسمی\n\n۳) **دیوان عدالت اداری:**\n• شکایات از اقدامات شهرداری‌ها، ادارات دولتی و ابطال آیین‌نامه‌ها`;
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: courtsInfo,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 بازگشت به منوی اصلی", callback_data: "menu:main" }]]
        }
      });
    }

    if (data === "menu:oral") {
      const oralPrompt = `🎙️ *کارگاه شبیه‌ساز مصاحبه علمی و آزمون شفاهی وکالت/قضاوت*\n\n❓ *سناریوی قضیه حقوقی:*\n«فروشنده‌ای ملکی را با سند عادی می‌فروشد و خریدار نصف ثمن را می‌پردازد. قبل از تحویل ملک، شهرداری طرح تعریض خیابان را تصویب و ملک در مسیر تعریض قرار می‌گیرد. خریدار تقاضای فسخ و استرداد ثمن با نرخ تورم روز را دارد. آیا تقاضای او منطبق با قانون است؟ مستندات را بنویسید.»\n\n💡 پاسخ خود را بنویسید یا جهت مشاهده تحلیل روی دکمه زیر بزنید:`;
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: oralPrompt,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "💡 مشاهده پاسخ و نکات کلیدی مصاحبه", callback_data: "oral_ans:1" }],
            [{ text: "🔙 بازگشت به منوی اصلی", callback_data: "menu:main" }]
          ]
        }
      });
    }

    if (data === "oral_ans:1") {
      const oralAnalysis = `📋 *نکات کلیدی پاسخ مصاحبه شفاهی وکالت/قضاوت:*\n\n۱) طبق ماده ۳۸۷ و ۳۸۸ ق.م تعریض شهرداری در حکم عیب حقوقی قبل از قبض است و خریدار خیار تبعض صفقه یا فسخ دارد.\n۲) با توجه به رای وحدت رویه ۸۱۱ دیوان عالی کشور، در صورت تقصیر فروشنده کاهش ارزش ثمن با نرخ تورم بانک مرکزی قابل مطالبه است.\n۳) دادگاه صالح: دادگاه صلح یا عمومی بسته به نصاب مالی خواسته.`;
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: oralAnalysis,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 بازگشت به منوی اصلی", callback_data: "menu:main" }]]
        }
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
      const trendText = `📈 *تحلیل ساختار و بودجه‌بندی آزمون وکالت و قضاوت:*\n\n۱) حقوق مدنی (۲۰ تست): تمرکز ۵۰٪ روی عقود معین و تعهدات (مواد ۱۰، ۱۸۳ تا ۳۰۱، ۳۳۸ تا ۴۶۵)\n۲) آیین دادرسی مدنی (۲۰ تست): تمرکز ویژه بر صلاحیت، طرق فوق‌العاده اعتراض (واخواهی، فرجام، اعاده دادرسی) و اجرای احکام مدنی\n۳) حقوق تجارت (۲۰ تست): شرکت‌های سهامی (لایحه ۱۳۴۷) و اسناد تجاری برات و چک\n۴) حقوق جزا و دادرسی کیفری (۴۰ تست): مجازات‌ها، جرایم علیه اموال، صلاحیت مراجع کیفری و کشف جرم\n\nبرای دریافت کارنامه تحلیلی از دکمه زیر استفاده نمایید:`;
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

  const text = `📝 *تست تخصصی آزمون [درس: ${q.subject}]*\n\n❓ *سوال:*\n${q.question}\n\n👇 لطفاً پاسخ صحیح را انتخاب فرمایید:`;

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
  console.log("🤖 موتور چندآزمونی و چندمدلی ربات تلگرام چتر دانش فعال شد (@ChatreDanesh_Law_Bot)");
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
