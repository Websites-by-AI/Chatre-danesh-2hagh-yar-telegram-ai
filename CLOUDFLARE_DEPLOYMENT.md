# ☁️ راهنمای جامع استقرار سامانه چتر دانش و ربات‌های بله و تلگرام روی Cloudflare

این سند راهنمای گام‌به‌گام استقرار پلتفرم ابری چتر دانش (حق‌یار)، دیتابیس D1، موتور Hugging Face RAG و ربات‌های رسمی بله و تلگرام است.

---

## ۱. مشخصات پیکربندی ابری

- **Account ID:** `5b456a2b43bb367410c50b35b9e7f71f`
- **D1 Database Name:** `chattre_danesh_db`
- **D1 Database UUID:** `a2816f97-1f6c-4546-b7a5-932444db8578`
- **Telegram Bot:** `@ChatreDanesh_Law_Bot` (https://t.me/ChatreDanesh_Law_Bot)
- **Bale Bot:** `@ChatreDanesh_Law_Bot` (https://ble.ir/ChatreDanesh_Law_Bot)

---

## ۲. گام‌های استقرار سریع (Deployment Steps)

### گام ۱: اعمال جداول دیتابیس D1
```bash
npx wrangler d1 execute chattre_danesh_db --remote --file=./schema.sql
```

### گام ۲: ست کردن توکن‌ها و سکرت‌ها در Cloudflare
```bash
# توکن ربات تلگرام
npx wrangler secret put TELEGRAM_BOT_TOKEN
# مقدار وارد شود: 8952421998:AAGD9p1PovfIj9TFrYoVOlQBNoauOpT03-I

# توکن بازوی پیام‌رسان بله
npx wrangler secret put BALE_BOT_TOKEN
# مقدار وارد شود: 1691759945:D7uWFoY-Kkw8Wb83RioHOclyofhbbH815Dw

# کلید هوش مصنوعی Google Gemini (اختیاری برای هوش مصنوعی پیشرفته)
npx wrangler secret put GEMINI_API_KEY
```

### گام ۳: استقرار پرتال وب و توابع سرورلس
```bash
npm run build
npx wrangler deploy
```

### گام ۴: ست کردن وب‌هوک تلگرام و بله به دامنه آنلاین شما
پس از استقرار و دریافت دامنه اختصاصی (یا دامنه `pages.dev`):

```bash
# ۱. ست کردن وب‌هوک تلگرام
curl -F "url=https://YOUR_DOMAIN/api/telegram-webhook" \
  https://api.telegram.org/bot8952421998:AAGD9p1PovfIj9TFrYoVOlQBNoauOpT03-I/setWebhook

# ۲. ست کردن وب‌هوک بله
curl -F "url=https://YOUR_DOMAIN/api/bale-webhook" \
  https://tapi.bale.ai/bot1691759945:D7uWFoY-Kkw8Wb83RioHOclyofhbbH815Dw/setWebhook
```

### گام ۵: استقرار کرون‌جاب ارسال خودکار به کانال‌ها
```bash
cd channel-worker
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put BALE_BOT_TOKEN
npx wrangler deploy
```

---

## ۳. بررسی سلامت وب‌هوک‌ها و دیتابیس

- وضعیت وب‌هوک تلگرام:
  `https://api.telegram.org/bot8952421998:AAGD9p1PovfIj9TFrYoVOlQBNoauOpT03-I/getWebhookInfo`
- وضعیت وب‌هوک بله:
  `https://tapi.bale.ai/bot1691759945:D7uWFoY-Kkw8Wb83RioHOclyofhbbH815Dw/getWebhookInfo`
- تست وضعیت سرور:
  `GET https://YOUR_DOMAIN/api/health`
