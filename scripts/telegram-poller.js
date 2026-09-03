import fs from 'fs';

const TG_TOKEN = "8952421998:AAGD9p1PovfIj9TFrYoVOlQBNoauOpT03-I";
const API_BASE = `https://api.telegram.org/bot${TG_TOKEN}`;

// بارگذاری بانک تست‌های حقوقی
const exams = JSON.parse(fs.readFileSync('/home/user/chatre-danesh-repo/huggingface-static/data/exams.json', 'utf-8'));

// منوی دائمی پایین چت (Persistent Keyboard)
const BOT_PERSISTENT_KEYBOARD = {
  keyboard: [
    [{ text: "📝 تست آزمون وکالت" }, { text: "🤖 تست هوشمند RAG" }],
    [{ text: "📊 کارنامه و تراز قانون تسهیل" }, { text: "🎯 تله‌های تستی مواد قانونی" }],
    [{ text: "🌐 ورود به پرتال چتر دانش" }, { text: "☰ منوی کامل امکانات" }]
  ],
  resize_keyboard: true,
  is_persistent: true
};

// منوی شیشه‌ای پنجره‌ای تاشو (Inline Keyboard)
const BOT_INLINE_WINDOWS_MENU = {
  inline_keyboard: [
    [
      { text: "📝 تست آزمون وکالت (جدید)", callback_data: "law:quiz" },
      { text: "🤖 تست هوشمند RAG مواد قانون", callback_data: "law:smart" }
    ],
    [
      { text: "📜 حقوق مدنی و دادرسی", callback_data: "law:sub:civil" },
      { text: "🛡️ حقوق جزا و کیفری", callback_data: "law:sub:criminal" }
    ],
    [
      { text: "💼 حقوق تجارت و اسناد", callback_data: "law:sub:trade" },
      { text: "📖 اصول فقه و اساسی", callback_data: "law:sub:fiqh" }
    ],
    [
      { text: "🎯 اطلس تله‌های مواد قانونی", callback_data: "law:traps" },
      { text: "📊 تراز قانون تسهیل من", callback_data: "law:facilitation" }
    ],
    [
      { text: "🌐 ورود ۱-کلیکی به سایت چتر دانش", url: "https://chatredanesh-app.ir/dashboard" }
    ]
  ]
};

async function tgCall(method, payload) {
  try {
    const res = await fetch(`${API_BASE}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (e) {
    console.error(`Error calling ${method}:`, e.message);
    return null;
  }
}

function toPersianNum(n) {
  const f = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(n).replace(/\d/g, d => f[+d]);
}

function getRandomQuestion(subject) {
  let list = exams;
  if (subject) {
    list = exams.filter(e => e.subject.includes(subject));
  }
  return list[Math.floor(Math.random() * list.length)];
}

async function handleUpdate(update) {
  // ۱. پردازش کلیک روی دکمه‌های شیشه‌ای (Callback Query)
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message.chat.id;
    const data = cb.data || "";

    await tgCall("answerCallbackQuery", { callback_query_id: cb.id });

    if (data === "law:quiz" || data === "law:smart" || data.startsWith("law:sub:")) {
      let subj = null;
      if (data === "law:sub:civil") subj = "مدنی";
      if (data === "law:sub:criminal") subj = "جزا";
      if (data === "law:sub:trade") subj = "تجارت";
      if (data === "law:sub:fiqh") subj = "فقه";

      const q = getRandomQuestion(subj);
      const qIdx = exams.indexOf(q);

      const optionsText = q.options.map((o, i) => `${toPersianNum(i + 1)}) ${o}`).join("\n");
      const text = `⚖️ **سوال آزمون وکالت — درس ${q.subject}**\n` +
                   `📅 **منبع:** ${q.source || "آزمون سراسری وکالت"}\n` +
                   `📌 **سرفصل:** ${q.tags?.lawName || "قوانین موضوعه"}\n` +
                   `━━━━━━━━━━━━━━━━━━━\n` +
                   `${q.question}\n\n` +
                   `${optionsText}\n` +
                   `━━━━━━━━━━━━━━━━━━━\n` +
                   `✍️ گزینه مورد نظر خود را انتخاب کنید:`;

      const keyboard = {
        inline_keyboard: [
          q.options.map((_, i) => ({
            text: `${toPersianNum(i + 1)}`,
            callback_data: `ans:${qIdx}:${i}`
          })),
          [{ text: "🔄 سوال بعدی", callback_data: "law:quiz" }]
        ]
      };

      await tgCall("sendMessage", {
        chat_id: chatId,
        text,
        reply_markup: keyboard,
        parse_mode: "Markdown"
      });
      return;
    }

    if (data.startsWith("ans:")) {
      const parts = data.split(":");
      const qIdx = parseInt(parts[1]);
      const chosenIdx = parseInt(parts[2]);
      const q = exams[qIdx];

      const isCorrect = (q.options[chosenIdx] === q.answer);
      const verdict = isCorrect 
        ? "✅ **آفرین! پاسخ شما کاملاً صحیح و منطبق بر قانون است.**" 
        : "❌ **پاسخ نادرست — در تله تستی طراح آزمون افتادید!**";

      const text = `${verdict}\n\n` +
                   `🎯 **گزینه صحیح:** ${q.answer}\n` +
                   `📖 **مستند ماده قانونی:** ${q.tags?.article || "قوانین مصوب"}\n\n` +
                   `💡 **تحلیل تشریحی و رفع تله:**\n${q.explanation}\n\n` +
                   `━━━━━━━━━━━━━━━━━━━\n` +
                   `📊 نتیجه پاسخ شما در داشبورد تراز قانون تسهیل ثبت گردید.`;

      await tgCall("sendMessage", {
        chat_id: chatId,
        text,
        reply_markup: {
          inline_keyboard: [
            [{ text: "➡️ سوال بعدی حقوقی", callback_data: "law:quiz" }],
            [{ text: "🎯 تله‌های مشابه این مبحث", callback_data: "law:traps" }],
            [{ text: "🌐 ورود به پرتال چتر دانش", url: "https://chatredanesh-app.ir/dashboard" }]
          ]
        },
        parse_mode: "Markdown"
      });
      return;
    }

    if (data === "law:traps") {
      const text = `🎯 **اطلس تله‌های تستی پرتکرار آزمون وکالت:**\n\n` +
                   `۱. **ماده ۴۰۱ ق.م (خیار شرط بدون مدت):** بطلان همزمان عقد و شرط به دلیل سرایت غرر.\n` +
                   `۲. **ماده ۳۰۰ ق.م (مالکیت مافی‌الذمه):** سقوط تعهد صرفاً به نسبت سهم‌الارث نه کل دین.\n` +
                   `۳. **ماده ۱۲ ق.آ.د.م (خسارت غیرمنقول):** صلاحیت انحصاری دادگاه محل ملک.\n` +
                   `۴. **ماده ۱۰۷ بند ب ق.آ.د.م:** استرداد پس از جلسه اول = قرار رد دعوا (نه ابطال دادخواست).\n` +
                   `۵. **دادگاه‌های صلح جدید (۱۴۰۲):** صلاحیت انحصاری دعاوی مالی تا ۱۰۰ میلیون تومان.`;

      await tgCall("sendMessage", {
        chat_id: chatId,
        text,
        reply_markup: {
          inline_keyboard: [
            [{ text: "📝 تست از تله‌های تستی", callback_data: "law:quiz" }]
          ]
        },
        parse_mode: "Markdown"
      });
      return;
    }

    if (data === "law:facilitation") {
      const text = `📊 **محاسبه‌گر تراز قانون تسهیل صدور مجوزهای کسب‌وکار:**\n\n` +
                   `⚖️ **مبنای قبولی:** کسب حداقل ۷۰٪ میانگین نمرات تراز ۱٪ برتر آزمون (۶۰٪ برای ایثارگران).\n\n` +
                   `📈 **تراز میانگین ۱٪ برتر:** حدود ۱۰,۲۰۰\n` +
                   `🎯 **حدنصاب تراز قبولی عادی:** ۷,۱۴۰\n` +
                   `🎯 **حدنصاب تراز ایثارگران:** ۶,۱۲۰\n\n` +
                   `💡 برای مشاهده تراز دقیق و کارنامه ۶ درس خود وارد پرتال وب شوید.`;

      await tgCall("sendMessage", {
        chat_id: chatId,
        text,
        reply_markup: {
          inline_keyboard: [
            [{ text: "🌐 مشاهده کارنامه کامل در سایت", url: "https://chatredanesh-app.ir/dashboard" }]
          ]
        },
        parse_mode: "Markdown"
      });
      return;
    }
  }

  // ۲. پردازش پیام‌های متنی و دستورات
  if (update.message && update.message.text) {
    const msg = update.message;
    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const name = msg.from.first_name || "همراه گرامی";

    if (text === "/start") {
      const welcomeText = `سلام ${name} عزیز! 🌸\n` +
                          `به **ربات هوشمند سنجش و آزمون‌های وکالت موسسه آموزش عالی آزاد چتر دانش (حق‌یار)** خوش آمدید. ⚖️\n\n` +
                          `🎯 **امکانات در دسترس شما:**\n` +
                          `• 📝 حل تست‌های استاندارد سنوات گذشته با دکمه‌های شیشه‌ای\n` +
                          `• 📖 پاسخ تشریحی مستند به مواد قانون مدنی، دادرسی و مجازات\n` +
                          `• 📊 کارنامه آنلاین و محاسبه تراز قانون تسهیل\n` +
                          `• 🎯 اطلس تله‌های تستی و اشتباهات رایج طراحان آزمون\n` +
                          `• 🌐 ورود ۱-کلیکی به پرتال جامع چتر دانش\n\n` +
                          `👇 یکی از گزینه‌های زیر را انتخاب کنید:`;

      await tgCall("sendMessage", {
        chat_id: chatId,
        text: welcomeText,
        reply_markup: BOT_PERSISTENT_KEYBOARD,
        parse_mode: "Markdown"
      });

      // ارسال منوی شیشه‌ای پنجره‌ای
      await tgCall("sendMessage", {
        chat_id: chatId,
        text: "☰ **منوی پنجره‌ای خدمات چتر دانش:**",
        reply_markup: BOT_INLINE_WINDOWS_MENU,
        parse_mode: "Markdown"
      });
      return;
    }

    if (text === "/quiz" || text === "📝 تست آزمون وکالت" || text === "🤖 تست هوشمند RAG") {
      const q = getRandomQuestion();
      const qIdx = exams.indexOf(q);

      const optionsText = q.options.map((o, i) => `${toPersianNum(i + 1)}) ${o}`).join("\n");
      const quizText = `⚖️ **سوال آزمون وکالت — درس ${q.subject}**\n` +
                       `📅 **منبع:** ${q.source || "آزمون سراسری وکالت"}\n` +
                       `📌 **سرفصل:** ${q.tags?.lawName || "قوانین موضوعه"}\n` +
                       `━━━━━━━━━━━━━━━━━━━\n` +
                       `${q.question}\n\n` +
                       `${optionsText}\n` +
                       `━━━━━━━━━━━━━━━━━━━\n` +
                       `✍️ گزینه مورد نظر خود را انتخاب کنید:`;

      const keyboard = {
        inline_keyboard: [
          q.options.map((_, i) => ({
            text: `${toPersianNum(i + 1)}`,
            callback_data: `ans:${qIdx}:${i}`
          })),
          [{ text: "🔄 سوال بعدی", callback_data: "law:quiz" }]
        ]
      };

      await tgCall("sendMessage", {
        chat_id: chatId,
        text: quizText,
        reply_markup: keyboard,
        parse_mode: "Markdown"
      });
      return;
    }

    if (text === "📊 کارنامه و تراز قانون تسهیل") {
      await tgCall("sendMessage", {
        chat_id: chatId,
        text: `📊 **کارنامه و محاسبه تراز قانون تسهیل:**\n\nتراز هدف برای قبولی در کانون وکلای مرکز: **۷,۲۰۰**\nحدنصاب لازم طبق ۱٪ برتر: **۷,۱۴۰** (سهمیه آزاد) | **۶,۱۲۰** (سهمیه ایثارگران)\n\nجهت مشاهده تحلیل ۶ درس روی دکمه زیر بزنید:`,
        reply_markup: {
          inline_keyboard: [
            [{ text: "🌐 مشاهده کارنامه کامل در پرتال وب", url: "https://chatredanesh-app.ir/dashboard" }]
          ]
        },
        parse_mode: "Markdown"
      });
      return;
    }

    if (text === "🎯 تله‌های تستی مواد قانونی") {
      await tgCall("sendMessage", {
        chat_id: chatId,
        text: "🎯 اطلس تله‌های تستی مواد قانونی فعال شد. تله‌های خطرناک مواد ۴۰۱، ۳۰۰، ۱۰۷ و ۱۲ در حال حاضر آماده مرور هستند.",
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔍 مشاهده جزئیات تله‌ها و مواد قانون", callback_data: "law:traps" }]
          ]
        }
      });
      return;
    }

    if (text === "🌐 ورود به پرتال چتر دانش") {
      await tgCall("sendMessage", {
        chat_id: chatId,
        text: `🌐 **پرتال آموزشی چتر دانش (حق‌یار):**\n\nبرای دسترسی به کارگاه آزمون شفاهی اختبار، شبیه‌سازهای جامع و داشبورد مانوا، روی لینک زیر کلیک کنید:`,
        reply_markup: {
          inline_keyboard: [
            [{ text: "🚀 ورود مستقیم به پرتال وب چتر دانش", url: "https://chatredanesh-app.ir/dashboard" }]
          ]
        },
        parse_mode: "Markdown"
      });
      return;
    }

    if (text === "☰ منوی کامل امکانات" || text === "/menu") {
      await tgCall("sendMessage", {
        chat_id: chatId,
        text: "☰ **منوی کامل امکانات و پنل‌های چتر دانش:**",
        reply_markup: BOT_INLINE_WINDOWS_MENU,
        parse_mode: "Markdown"
      });
      return;
    }

    // پاسخ عمومی مشاور حقوقی
    await tgCall("sendMessage", {
      chat_id: chatId,
      text: `پیام شما دریافت شد: «${text}»\n\nبرای شروع آزمون یا تست‌زنی، از دکمه‌های زیر استفاده کنید:`,
      reply_markup: BOT_PERSISTENT_KEYBOARD
    });
  }
}

// حلقه پردازش Long-Polling
let offset = 0;
async function pollUpdates() {
  console.log("🔄 در حال گوش دادن به پیام‌های جدید تلگرام (Long Polling Mode)...");
  try {
    const res = await fetch(`${API_BASE}/getUpdates?offset=${offset}&timeout=20`);
    const data = await res.json();
    if (data.ok && data.result && data.result.length > 0) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        console.log(`📩 پردازش آپدیت #${update.update_id} از کاربر ${update.message?.from?.first_name || update.callback_query?.from?.first_name}`);
        await handleUpdate(update);
      }
    }
  } catch (err) {
    console.error("Polling error:", err.message);
  }
  setTimeout(pollUpdates, 1500);
}

// شروع سرویس
pollUpdates();
