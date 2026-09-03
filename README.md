<div align="center">

# ⚖️ سامانه جامع هوشمند آموزش و سنجش وکالت چتر دانش (حق‌یار)
### Chatre Danesh & HaqYar — AI Law Education, Bar Exam Analytics & Dual Messenger Bots

[![React](https://img.shields.io/badge/React-19.0.1-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-Serverless-f38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Cloudflare D1](https://img.shields.io/badge/Cloudflare_D1-SQL_Database-f38020?style=for-the-badge&logo=sqlite&logoColor=white)](https://developers.cloudflare.com/d1/)
[![Hugging Face RAG](https://img.shields.io/badge/Hugging_Face-RAG_%26_LoRA-ffcc4d?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co)
[![Telegram Bot](https://img.shields.io/badge/Telegram_Bot-@ChatreDanesh__Law__Bot-26a5e4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/ChatreDanesh_Law_Bot)
[![Bale Bot](https://img.shields.io/badge/Bale_Bot-ble.ir/ChatreDanesh__Law__Bot-00a693?style=for-the-badge)](https://ble.ir/ChatreDanesh_Law_Bot)

<p align="center">
  <strong>پلتفرم یکپارچه آموزش، سنجش، برنامه‌ریزی و شبیه‌سازی آزمون‌های حقوقی ایران</strong><br>
  (وکالت اسکودا، مرکز وکلای قوه قضائیه، قضاوت، سردفتری و ارشد حقوق)
</p>

</div>

---

## 🏛️ معماری کلی سامانه (System Architecture)

```
                               ┌─────────────────────────────────────────────────────────────┐
                               │   پرتال مرکزی و اکوسیستم حقوقی چتر دانش (حق‌یار)             │
                               └──────────────────────────────┬──────────────────────────────┘
                                                              │
               ┌──────────────────────────────────────────────┼──────────────────────────────────────────────┐
               │                                              │                                              │
               ▼                                              ▼                                              ▼
 ┌───────────────────────────┐                  ┌───────────────────────────┐                  ┌───────────────────────────┐
 │ ۱. پرتال وب و داشبورد     │                  │ ۲. موتور دوگانه ربات‌ها   │                  │ ۳. موتور RAG و دیتاست     │
 │    (React 19 + TypeScript)│                  │    (Telegram + Bale API)  │                  │    (Hugging Face + Colab) │
 ├───────────────────────────┤                  ├───────────────────────────┤                  ├───────────────────────────┤
 │ • کارنامه ۶ درس وکالت     │                  │ • ربات تلگرام و بله       │                  │ • بانک ۱۰۵ سوال شناسنامه‌دار│
 │ • محاسبه‌گر قانون تسهیل   │                  │ • تست روزانه با دکمه شیشه │                  │ • استخراج خودکار شماره ماده │
 │ • کارگاه آزمون شفاهی AI   │                  │ • ورود ۱-کلیکی بدون رمز   │                  │ • تطبیق آراء وحدت رویه    │
 │ • اطلس تله‌های مواد قانون  │                  │ • ارزیابی صوتی گفتار ویس │                  │ • فاین‌تیون و لاگ W&B     │
 │ • باشگاه رتبه‌های برتر    │                  │ • کرون‌جاب خودکار کانال‌ها │                  │ • جستجوی هیبرید زیر ۳۰ms  │
 └───────────────────────────┘                  └───────────────────────────┘                  └───────────────────────────┘
```

---

## ✨ امکانات و ماژول‌های پلتفرم

### ۱. کارنامه تحلیلی و شبیه‌ساز قانون تسهیل
- **فرمول استاندارد قانون تسهیل صدور مجوزهای کسب‌وکار:** ارزیابی قبولی با مقایسه تراز داوطلب نسبت به ۷۰٪ میانگین تراز ۱٪ برتر کشور (۶۰٪ برای ایثارگران).
- **تفکیک ضرایب ۶ گانه:** حقوق مدنی (۳)، آیین دادرسی مدنی (۳)، حقوق تجارت (۲)، حقوق جزا (۲)، آیین دادرسی کیفری (۲) و اصول فقه و متون فقه (۱).
- **عارضه‌یابی نوسان تمرکز داوطلب:** سنجش شاخص‌های شتاب‌زدگی، تردید گزینه‌ای و فرسودگی ذهنی.

### ۲. کارگاه آزمون شفاهی و اختبار وکالت با هوش مصنوعی (AI Oral Examiner)
- طرح مسائل پیچیده پرونده‌ای (نظیر بیع مال موهوبه در ماده ۸۰۳ ق.م یا استرداد دعوا در ماده ۱۰۷ ق.آ.د.م).
- ضبط صدای داوطلب با قابلیت پیاده‌سازی صوت به متن (Speech-to-Text).
- نمره‌دهی از ۰ تا ۲۰ توسط هیئت ممتحنین هوش مصنوعی همراه با سنجش سلاست کلام، صحت استدلال و استناد به مواد قانون.

### ۳. اطلس تله‌های تستی مواد قانونی (Test Traps Atlas)
- ترسیم نمودار درختی تله‌های پرتکرار طراحان آزمون.
- تحلیل تله‌های مهم: خیار شرط بدون مدت (ماده ۴۰۱ ق.م)، تلف مبیع قبل از قبض (ماده ۳۸۷ ق.م)، مالکیت مافی‌الذمه در تعدد وراث (ماده ۳۰۰ ق.م) و صلاحیت دادگاه‌های صلح جدید مصوب ۱۴۰۲.

### ۴. موتور دوگانه ربات‌های پیام‌رسان (Telegram & Bale Dual Engine)
- **ربات تلگرام:** [`@ChatreDanesh_Law_Bot`](https://t.me/ChatreDanesh_Law_Bot)
- **بازوی بله:** [`ble.ir/ChatreDanesh_Law_Bot`](https://ble.ir/ChatreDanesh_Law_Bot)
- **ورود ۱-کلیکی (SSO):** صدور توکن امن یک‌بارمصرف برای ورود خودکار از پیام‌رسان به پرتال وب بدون نیاز به رمز عبور.
- **تست روزانه با دکمه‌های شیشه‌ای:** تصحیح آنی، محاسبه نمره منفی و ارسال مستند صریح ماده قانون.

### ۵. موتور RAG و پایگاه دانش در Hugging Face
- **بانک ۱۰۵ سواله استاندارد:** تفکیک شده بر اساس سال‌های ۱۴۰۰ تا ۱۴۰۴، درس، درجه سختی و مواد قانونی در مسیر `huggingface-static/data/exams.json`.
- **نوت‌بوک آموزش و ارزیابی در Google Colab:** پیاده‌سازی TF-IDF کاراکتری، امبدینگ‌های فقهی و ثبت لاگ دقت در Weights & Biases (W&B).

### ۶. باشگاه رتبه‌های برتر، معرف‌ها و تسویه حساب شبا (CRM & Payouts)
- پنل مدیریت سفیران، مشاوران و رتبه‌های تک‌رقمی آزمون وکالت.
- صدور کدهای تخفیف اختصاصی، محاسبه خودکار پورسانت ۲۰٪ و فرم تسویه حساب بانکی با شماره شبا (IBAN).

---

## 🚀 راهنمای راه‌اندازی و اجرای محلی (Local Setup)

```bash
# ۱. کلون کردن مخزن
git clone https://github.com/Websites-by-AI/Chatre-danesh-2hagh-yar-telegram-ai.git
cd Chatre-danesh-2hagh-yar-telegram-ai

# ۲. نصب وابستگی‌ها
npm install

# ۳. تنظیم فایل محیطی
cp .env.example .env

# ۴. اجرای سرور توسعه
npm run dev
```

---

## ☁️ راهنمای استقرار روی Cloudflare (Pages / D1 / Workers)

```bash
# ۱. اعمال جدول‌های دیتابیس D1 چتر دانش
npx wrangler d1 execute chattre_danesh_db --remote --file=./schema.sql

# ۲. ذخیره سکرت‌ها و توکن‌های ربات در کلودفلر
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put BALE_BOT_TOKEN

# ۳. استقرار پلتفرم و توابع هوش مصنوعی
npm run build
npx wrangler deploy

# ۴. فعال‌سازی وب‌هوک‌های تلگرام و بله
curl -F "url=https://YOUR_DOMAIN/api/telegram-webhook" \
  https://api.telegram.org/bot8952421998:AAGD9p1PovfIj9TFrYoVOlQBNoauOpT03-I/setWebhook

curl -F "url=https://YOUR_DOMAIN/api/bale-webhook" \
  https://tapi.bale.ai/bot1691759945:D7uWFoY-Kkw8Wb83RioHOclyofhbbH815Dw/setWebhook
```

---

## 📁 ساختار پرونده‌ها (Directory Structure)

```
├── src/                        # فرانت‌اند اصلی React 19 + Tailwind
│   ├── components/             # کارنامه، آزمون شفاهی اختبار، تله‌ها، CRM و داشبورد
│   ├── lib/                    # توابع تله‌ها، پروفایل‌ها، ثبت لاگ و دیتابیس
│   ├── types.ts                # تایپ‌های اختصاصی آزمون‌های وکالت
│   └── constants.ts            # تنظیمات برند چتر دانش و موسسات همکار
├── lib/                        # روتر سرورلس بک‌اند و هندلرهای ربات (api-router.ts)
├── channel-worker/             # کرون‌جاب خودکار ارسال تست روزانه به کانال‌ها
├── huggingface-static/         # اسپیس استاتیک Hugging Face RAG و دیتابیس ۱۰۵ تست
├── scripts/                    # اسکریپت‌های تست، دیباگ زنده ربات‌ها و تولید دیتابیس
├── schema.sql                  # ساختار کامل دیتابیس Cloudflare D1
├── wrangler.json               # تنظیمات اتصال به chattre_danesh_db
└── chatre_danesh_ui_architecture.html # پیش‌نمایش تصویری اطلس صفحات و رابط کاربری
```

---

<div align="center">
  <sub>© موسسه آموزش عالی آزاد چتر دانش (حق‌یار) — کلیه حقوق مادی و معنوی محفوظ است.</sub>
</div>
