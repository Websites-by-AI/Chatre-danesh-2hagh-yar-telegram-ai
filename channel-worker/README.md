# Taranom Channel Poster — پست خودکار روزانه دو کاناله

Worker جداگانه Cloudflare (`taranom-channel-poster`) که هر روز ساعت ۰۶:۳۰ UTC (~۱۰:۰۰ تهران) خودکار پست می‌گذارد:

| کانال | پیام‌رسان |
|---|---|
| `@ai_exam_iran` | تلگرام |
| `@taranom_hamdeli_channel` (ble.ir/taranom_hamdeli_channel) | بله |

## محتوای هر روز
1. 🌅 **سوال روز** — از بانک ۴۰۰ سواله کنکور (RAG هاگینگ‌فیس) + دکمه لینک به ربات (t.me برای تلگرام، ble.ir برای بله)
2. 💡 **نکته روز AI** — تولید با Workers AI (Llama-3.3-70B، فال‌بک Llama-4-Scout)، ۷ موضوع چرخشی

## دیپلوی
```bash
cd channel-worker
wrangler deploy
# secrets (فقط بار اول):
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put BALE_BOT_TOKEN
wrangler secret put RUN_KEY
```

## Endpoint ها
- `GET /` — وضعیت سرویس
- `GET /run?key=RUN_KEY` — اجرای دستی پست روزانه (تست)
- `GET /bale-check?key=RUN_KEY` — تشخیص وضعیت ربات بله + دسترسی کانال

## نکته
ربات باید در هر دو کانال **ادمین با اجازه ارسال پیام** باشد.
در بله: تنظیمات کانال ← مدیران ← افزودن `@taranom_hamdeli_bot`.
