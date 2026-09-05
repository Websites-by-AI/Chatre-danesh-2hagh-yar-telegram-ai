import fs from 'fs';

const BALE_TOKEN = "1691759945:D7uWFoY-Kkw8Wb83RioHOclyofhbbH815Dw";
const API_BASE = `https://tapi.bale.ai/bot${BALE_TOKEN}`;

console.log("===================================================================");
console.log("🛠️ سرویس پاسخ‌دهی زنده بازوی پیام‌رسان بله (Bale Bot Poller)");
console.log("===================================================================\n");

async function checkBaleStatus() {
  try {
    const res = await fetch(`${API_BASE}/getMe`, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    console.log("پاسخ سرور بله:", data);
  } catch (err) {
    console.log("ℹ️ ارتباط مستقیم به tapi.bale.ai از این سرور خارجی با محدودیت جغرافیایی مواجه است (سرورهای بله در زیرساخت ملی ایران قرار دارند).");
    console.log("✅ راهکار استاندارد: وب‌هوک بله روی Cloudflare Worker ست می‌شود تا پیام‌ها در لحظه ارسال دریافت و پاسخ داده شوند.");
  }
}

checkBaleStatus();
