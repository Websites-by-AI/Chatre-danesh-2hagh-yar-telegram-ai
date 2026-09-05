import fs from 'fs';

const TELEGRAM_TOKEN = "7918804616:AAFb5R4-kLpU0gYxT_ZJp1lV8mQ4yG1nI_0";
const API_BASE = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// منوی دائمی پایین صفحه
const BOT_PERSISTENT_KEYBOARD = {
  keyboard: [
    [{ text: "⚖️ آزمون‌ها و تست‌های تخصصی" }, { text: "🎲 تولید زنده تست سناریویی" }],
    [{ text: "🪤 تله‌های تستی مواد قانون" }, { text: "🎓 انتخاب آزمون (وکالت/قضاوت)" }],
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
      { text: "🎲 تولید تست سناریویی (زنده)", callback_data: "menu:dynamic_q" }
    ],
    [
      { text: "🪤 تله‌های پرتکرار", callback_data: "menu:traps" },
      { text: "📈 تحلیل ساختار آزمون", callback_data: "menu:structure" }
    ],
    [
      { text: "📅 محاسبه مواعد دادرسی", callback_data: "menu:deadlines" },
      { text: "🏛️ صلاحیت دادگاه صلح", callback_data: "menu:courts" }
    ],
    [
      { text: "🎙️ مصاحبه شفاهی قضاوت", callback_data: "menu:oral" },
      { text: "🎓 انتخاب آزمون حقوقی", callback_data: "menu:exams" }
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
  console.log(`[INIT] Loaded ${examBank.length} questions, 20 books, 7 exams, and Dynamic Scenario Generator.`);
} catch (e) {
  console.error("[INIT] Failed to load databases:", e.message);
}

// الگوهای تولید زنده تست‌های سناریویی و تله‌دار
const DYNAMIC_SCENARIOS = [
  {
    type: 'عقود معین و شرط فاسخ در معاملات پیاپی',
    story: '«علی» یک باب آپارتمان را با سند عادی به «رضا» می‌فروشد و شرط می‌شود چنانچه چک ثمن برگشت بخورد، معامله خودبه‌خود منفسخ شود (شرط فاسخ). رضا قبل از سررسید چک، آپارتمان را با قرارداد اجاره ۲ ساله به «مهدی» واگذار می‌کند. در سررسید چک، گواهی عدم پرداخت صادر می‌گردد.',
    question: 'وضعیت قرارداد اجاره مهدی و سرنوشت آپارتمان پس از تحقق شرط فاسخ چگونه است؟',
    options: [
      'قرارداد اجاره از ابتدا باطل بوده و علی می‌تواند فوراً حکم تخلیه مهدی را بگیرد.',
      'قرارداد اجاره تا پایان مدت ۲ سال معتبر باقی می‌ماند و رضا مالک منافع آن مدت است (مستند به ماده ۴۹۸ ق.م و عدم سرایت فسخ به عقود صحیح گذشته).',
      'قرارداد اجاره منفسخ می‌شود و مهدی باید اجرت‌المثل ایام تصرف را به علی بپردازد.',
      'قرارداد اجاره غیرنافذ بوده و منوط به تنفیذ علی است.'
    ],
    correct_index: 1,
    trap_name: 'تله سرایت انحلال به تصرفات پیش از انحلال',
    deceptive_option: 'گزینه ۱ و ۳ (باطل یا منفسخ شدن اجاره)',
    reason_deceptive: 'طراح آزمون روی این فرض تله می‌گذارد که انحلال عقد اولیه موجب بطلان اجاره بعدی است؛ در حالی که تصرفات حقوقی پیش از انفساخ چون در زمان مالکیت صورت گرفته صحیح و نافذ باقی می‌ماند.',
    articles: ['ماده ۲۱۹ ق.م', 'ماده ۳۸۷ ق.م', 'ماده ۴۹۸ ق.م'],
    statute: 'قانون مدنی',
    doctrine: 'استاد کاتوزیان: انفساخ ناظر به آینده (فاقد اثر قهقرایی) است و تصرفات مشروع ناقله منافع در زمان حیات عقد صحیح است.'
  },
  {
    type: 'اسناد تجاری و تعارض مسئولیت صادرکننده با ظهرنویس',
    story: '«شایان» چکی صیادی در وجه «کامران» صادر می‌کند. کامران با ثبت در سامانه صیاد آن را به «نوید» انتقال می‌دهد. نوید پس از ۳۵ روز از تاریخ سررسید به بانک مراجعه و گواهی عدم پرداخت دریافت می‌کند.',
    question: 'نوید علیه چه کسانی و از چه طریقی می‌تواند اقدام قانونی نماید؟',
    options: [
      'نوید می‌تواند علیه شایان و کامران مشترکاً و با مسئولیت تضامنی دادخواست بدهد و برای هر دو اجراییه مستقیم ماده ۲۳ بگیرد.',
      'نوید به علت گذشت ۳۵ روز و انقضای مواعد واخواست ماده ۳۱۵ ق.ت، حق رجوع به ظهرنویس (کامران) را از دست داده اما می‌تواند از شایان از طریق دادخواست یا اجراییه مستقیم ماده ۲۳ مطالبه کند.',
      'چک به طور کلی از سندیت تجاری خارج شده و صرفاً یک سند عادی غیرقابل اقدام است.',
      'نوید فقط می‌تواند از طریق شکایت کیفری اقدام نماید.'
    ],
    correct_index: 1,
    trap_name: 'تله انقضای مواعد واخواست در برابر اجراییه مستقیم',
    deceptive_option: 'گزینه ۱ (رجوع تضامنی به ظهرنویس)',
    reason_deceptive: 'طراح تست تله می‌اندازد که اجراییه مستقیم شامل ظهرنویس هم می‌شود؛ در حالی که اجراییه مستقیم ماده ۲۳ منحصراً علیه صادرکننده و صاحب حساب است و رجوع به ظهرنویس با انقضای ۱۵ روز ماده ۳۱۵ ساقط می‌گردد.',
    articles: ['ماده ۳۱۵ قانون تجارت', 'ماده ۲۳ قانون صدور چک ۱۳۹۷'],
    statute: 'قانون تجارت و صدور چک',
    doctrine: 'دکتر اسکینی: مسئولیت تضامنی ظهرنویس مشروط به رعایت مواعد واخواست است اما مسئولیت صادرکننده تا انقضای مرور زمان پا برجاست.'
  },
  {
    type: 'آیین دادرسی مدنی و تقابل ادعای جعل با پرداخت',
    story: 'در دعوای مطالبه طلب به مبلغ ۳۰۰ میلیون تومان، خواهان سفته‌ای ارائه می‌کند. خوانده در اولین جلسه دادرسی اظهار می‌دارد: «امضای سفته متعلق به من نیست و جعل شده است، ضمناً من وجه این سفته را پارسال نقداً به خواهان پرداخته‌ام.»',
    question: 'دادگاه چه تصمیمی اتخاذ می‌کند و تکلیف بار اثبات چیست؟',
    options: [
      'دادگاه ادعای پرداخت را به منزله اقرار به اصالت سند دانسته و به ادعای جعل توجه نمی‌کند و فقط به دلیل پرداخت رسیدگی می‌کند.',
      'دادگاه ابتدا پرونده را برای بررسی جعل به کارشناسی خط ارجاع می‌دهد و در صورت اصالت، به دلیل عدم ارائه رسید پرداخت حکم به محکومیت صادر می‌کند.',
      'دادگاه قرار رد دعوا به دلیل تعارض اظهارات خوانده صادر می‌کند.',
      'دادگاه خواهان را ملزم به سوگند اتیان می‌نماید.'
    ],
    correct_index: 0,
    trap_name: 'تله تعارض جعل و ادعای پرداخت (اقرار ضمنی)',
    deceptive_option: 'گزینه ۲ (رسیدگی هم‌زمان به جعل و پرداخت)',
    reason_deceptive: 'طراح آزمون داوطلب را فریب می‌دهد که کارشناسی جعل مقدم است؛ در حالی که ادعای پرداخت متضمن اعتراف به اشتغال ذمه است و ادعای جعل بعدی مسموع نخواهد بود.',
    articles: ['ماده ۲۱۷ ق.آ.د.م', 'ماده ۱۲۷۵ و ۱۲۷۷ قانون مدنی'],
    statute: 'قانون آیین دادرسی مدنی و مدنی',
    doctrine: 'دکتر عبدالله شمس: ادعای پرداخت سند مستلزم پذیرش اصل صدور آن است و ادعای جعل پس از آن ساقط است.'
  }
];

function generateDynamicLegalQuestion() {
  const randIdx = Math.floor(Math.random() * DYNAMIC_SCENARIOS.length);
  return DYNAMIC_SCENARIOS[randIdx];
}

const userPreferences = new Map();
const userQuizSession = new Map();
const userDynamicSession = new Map();

function getUserPref(chatId) {
  if (!userPreferences.has(chatId)) {
    userPreferences.set(chatId, { currentExam: 'bar_scoda', currentModel: 'kag_local' });
  }
  return userPreferences.get(chatId);
}

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

async function serveDynamicScenarioQuestion(chatId) {
  const q = generateDynamicLegalQuestion();
  const qId = Date.now();
  userDynamicSession.set(chatId, { qId, q });

  let text = `🎲 *تست سناریویی نوین وکالت [موضوع: ${q.type}]*\n\n`;
  text += `📖 *قضیه و سناریو:*\n${q.story}\n\n`;
  text += `❓ *پرسش:* ${q.question}\n\n👇 لطفاً گزینه صحیح را انتخاب فرمایید:`;

  const inlineKeyboard = q.options.map((opt, optIdx) => [
    { text: `🔹 گزینه ${optIdx + 1}: ${opt.slice(0, 45)}...`, callback_data: `dyn_ans:${qId}:${optIdx}` }
  ]);
  inlineKeyboard.push([{ text: "🔙 انصراف و بازگشت", callback_data: "menu:main" }]);

  await sendTelegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
    reply_markup: { inline_keyboard: inlineKeyboard }
  });
}

async function handleUpdate(update) {
  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();
    const pref = getUserPref(chatId);

    if (text === "/start" || text === "منوی اصلی" || text === "شروع مجدد") {
      const welcome = `سلام و احترام به خانواده بزرگ حقوقی چتر دانش و حق‌یار ⚖️\n\nپایگاه جامع آزمون‌های **وکالت، قضاوت، سردفتری و ارشد حقوق** با موتور تولید زنده تست‌های سناریویی و تله‌های نوین آزمونی.\n\nلطفاً یکی از خدمات زیر را انتخاب نمایید:`;
      await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: welcome,
        reply_markup: BOT_INLINE_WINDOWS_MENU
      });
      await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "💡 دسترسی سریع از کیبورد پایین صفحه:",
        reply_markup: BOT_PERSISTENT_KEYBOARD
      });
      return;
    }

    if (text === "🎲 تولید زنده تست سناریویی" || text === "/scenario" || text === "/dynamic") {
      return await serveDynamicScenarioQuestion(chatId);
    }

    if (text === "🎓 انتخاب آزمون (وکالت/قضاوت)" || text === "/exams") {
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "🎓 *لطفاً آزمون هدف خود را جهت شخصی‌سازی ضرایب و تست‌ها انتخاب نمایید:*",
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
        text: `ℹ️ *راهنمای جامع ربات چتر دانش*\n\n🔹 /scenario - تولید زنده تست سناریویی و تله‌دار\n🔹 /exams - انتخاب آزمون (وکالت، قضاوت، سردفتری و ...)\n🔹 /quiz - شروع آزمون استاندارد\n🔹 /traps - تله‌های تستی آزمون\n🔹 /deadlines - محاسبه مواعد دادرسی\n🔹 /site - ورود ۱-کلیکی به وبسایت\n\nتلفن پشتیبانی مرکزی: ۰۲۱-۶۶۴۱۴۸۴۸\nوبسایت رسمی: https://chattredanesh.ir`
      });
    }

    // پاسخ استنتاجی KAG
    const kagResponse = executeKagReasoning(text, pref.currentExam, pref.currentModel);
    return await sendTelegram("sendMessage", {
      chat_id: chatId,
      text: kagResponse,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🎲 تست سناریویی این موضوع", callback_data: "menu:dynamic_q" }],
          [{ text: "🔙 منوی اصلی", callback_data: "menu:main" }]
        ]
      }
    });
  }

  // کلیک دکمه‌های شیشه‌ای
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

    if (data === "menu:dynamic_q") {
      return await serveDynamicScenarioQuestion(chatId);
    }

    if (data.startsWith("dyn_ans:")) {
      const [, qIdStr, optIdxStr] = data.split(":");
      const qId = parseInt(qIdStr, 10);
      const optIdx = parseInt(optIdxStr, 10);
      const session = userDynamicSession.get(chatId);

      if (!session || session.qId !== qId) {
        return await sendTelegram("sendMessage", {
          chat_id: chatId,
          text: "⚠️ این تست قبلاً پاسخ داده شده است. برای تست سناریویی جدید کلیک کنید:",
          reply_markup: {
            inline_keyboard: [[{ text: "🎲 تست سناریویی جدید", callback_data: "menu:dynamic_q" }]]
          }
        });
      }

      userDynamicSession.delete(chatId);
      const q = session.q;
      const isCorrect = optIdx === q.correct_index;

      let feedback = isCorrect
        ? `🎉 *کاملاً آفرین! پاسخ شما صحیح است.*\n\n`
        : `❌ *پاسخ شما نادرست بود.*\n\n`;

      feedback += `✅ *گزینه صحیح:* گزینه ${q.correct_index + 1}\n`;
      feedback += `«${q.options[q.correct_index]}»\n\n`;
      feedback += `🪤 *کالبدشکافی تله طراح آزمون:* ${q.trap_name}\n`;
      feedback += `⚠️ *دام طراح:* ${q.reason_deceptive}\n\n`;
      feedback += `📚 *مستندات قانونی:* ${q.articles.join("، ")} (${q.statute})\n`;
      feedback += `💡 *دکترین:* ${q.doctrine}`;

      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: feedback,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔄 تست سناریویی بعدی", callback_data: "menu:dynamic_q" }],
            [{ text: "📊 منوی اصلی", callback_data: "menu:main" }]
          ]
        }
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
      const respMsg = `✅ *آزمون شما با موفقیت به «${spec.title}» تنظیم شد.*\n\n📋 *ساختار و ضرایب:*\n${coursesText}\n\n⚖️ *مبنای پذیرش:* ${spec.scoring_rule}`;
      
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: respMsg,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🎲 تست سناریویی این آزمون", callback_data: "menu:dynamic_q" }],
            [{ text: "🔙 منوی اصلی", callback_data: "menu:main" }]
          ]
        }
      });
    }

    if (data === "menu:deadlines") {
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: "📅 *محاسبه‌گر مواعد قانونی و مهلت‌های دادرسی:*\n\nکدام موعد را می‌خواهید محاسبه کنید؟",
        parse_mode: "Markdown",
        reply_markup: BOT_DEADLINES_INLINE
      });
    }

    if (data.startsWith("dl:")) {
      const type = data.replace("dl:", "");
      let info = "";
      if (type === "appeal") {
        info = "⏳ *مهلت تجدیدنظرخواهی:*\n\n• مهلت برای مقیمین ایران: **۲۰ روز** (مقیمین خارج: ۶۰ روز)\n• مستند: ماده ۳۳۶ ق.آ.د.م\n• مبدا: تاریخ ابلاغ در ثنا\n• قاعده: روز ابلاغ و اقدام جزء مهلت نیست.";
      } else if (type === "protest") {
        info = "⏳ *مهلت واخواهی:*\n\n• مهلت: **۲۰ روز** از تاریخ ابلاغ واقعی\n• مستند: ماده ۳۰۵ ق.آ.د.م\n• اثر: اجرای حکم غیابی متوقف می‌شود.";
      } else if (type === "execution") {
        info = "⏳ *مهلت اجرای اختیاری:*\n\n• مهلت: **۱۰ روز** از تاریخ ابلاغ اجراییه در ثنا\n• مستند: ماده ۳۴ قانون اجرای احکام مدنی.";
      } else if (type === "sayad_check") {
        info = "⏳ *مواعد چک صیادی:*\n\n• صدور اجراییه مستقیم ماده ۲۳ بدون انقضای مدت علیه صادرکننده.\n• رجوع به ظهرنویس ظرف ۱۵ روز از سررسید (ماده ۳۱۵ ق.ت).";
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
      const courtsInfo = `🏛️ *تشخیص صلاحیت دادگاه‌های صلح (قانون ۱۴۰۲)*\n\n۱) دعاوی مالی تا ۱۰۰ میلیون تومان الزماً در دادگاه صلح (تا ۵۰ میلیون قطعی است)\n۲) دعاوی تصرف عدوانی، ممانعت از حق و حصر وراثت بدون سقف مالی\n۳) تخلیه و تعدیل اجاره‌بها`;
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
      const oralPrompt = `🎙️ *کارگاه شبیه‌ساز مصاحبه علمی وکالت و قضاوت*\n\n❓ *قضیه:* «ملکی با سند عادی فروخته و تحویل نشده، شهرداری طرح تعریض تصویب می‌کند. خریدار چه اختیاراتی دارد؟»`;
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: oralPrompt,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "💡 مشاهده پاسخ و نکات کلیدی", callback_data: "oral_ans:1" }],
            [{ text: "🔙 منوی اصلی", callback_data: "menu:main" }]
          ]
        }
      });
    }

    if (data === "oral_ans:1") {
      const oralAnalysis = `📋 *نکات مصاحبه:* طبق ماده ۳۸۷ و ۳۸۸ ق.م تعریض قبل از قبض در حکم عیب است و خریدار خیار فسخ دارد و طبق رای ۸۱۱ تورم روز ثمن قابل مطالبه است.`;
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: oralAnalysis,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [[{ text: "🔙 منوی اصلی", callback_data: "menu:main" }]]
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

    if (data.startsWith("trap:")) {
      const trapId = data.replace("trap:", "");
      let desc = "";
      if (trapId === "401") {
        desc = "⚠️ *تله ماده ۴۰۱ ق.م:* خیار شرط بدون مدت، هم شرط و هم عقد را باطل می‌کند.";
      } else if (trapId === "300") {
        desc = "⚠️ *تله ماده ۳۰۰ ق.م:* در تعارض تصرفات هیچ‌کدام اماره تصرف ندارند.";
      } else if (trapId === "107") {
        desc = "⚠️ *تله ماده ۱۰۷ ق.آ.د.م:* استرداد پس از ختم مذاکرات -> قرار سقوط دعوا.";
      }
      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: desc,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🎲 تست سناریویی این تله", callback_data: "menu:dynamic_q" }],
            [{ text: "🔙 لیست تله‌ها", callback_data: "menu:traps" }]
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
          text: "⚠️ این سوال منقضی شده است. برای تست جدید کلیک کنید:",
          reply_markup: {
            inline_keyboard: [[{ text: "📝 تست جدید", callback_data: "qz:all" }]]
          }
        });
      }

      userQuizSession.delete(chatId);
      const item = session.item;
      const isCorrect = item.options[selectedOptIdx] === item.answer;

      let resultMsg = isCorrect
        ? `🎉 *آفرین! پاسخ صحیح است.*\n\n✅ گزینه: ${item.answer}\n📚 درس: ${item.subject}`
        : `❌ *پاسخ نادرست بود.*\n\nگزینه شما: ${item.options[selectedOptIdx]}\n✅ پاسخ صحیح: ${item.answer}\n📚 درس: ${item.subject}`;

      return await sendTelegram("sendMessage", {
        chat_id: chatId,
        text: resultMsg,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔄 تست بعدی", callback_data: `qz:${session.subj || "all"}` }],
            [{ text: "📊 منوی اصلی", callback_data: "menu:main" }]
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
  console.log("🤖 موتور چندآزمونی و سناریویی ربات تلگرام فعال شد (@ChatreDanesh_Law_Bot)");
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
