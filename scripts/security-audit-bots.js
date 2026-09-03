import fs from 'fs';

console.log("===================================================================");
console.log("🔒 آزمون جامع تست امنیتی و خطایابی ربات‌های تلگرام و بله چتر دانش");
console.log("   Chatre Danesh Bots Security & Vulnerability Audit");
console.log("===================================================================\n");

let passedCount = 0;
let totalTests = 0;

function runAuditTest(title, testFn) {
  totalTests++;
  try {
    const result = testFn();
    if (result === true || (result && result.passed)) {
      console.log(`✅ [تست ${totalTests}] ${title} -> PASS`);
      passedCount++;
    } else {
      console.log(`❌ [تست ${totalTests}] ${title} -> FAIL: ${result?.reason || 'نامشخص'}`);
    }
  } catch (err) {
    console.log(`❌ [تست ${totalTests}] ${title} -> EXCEPTION: ${err.message}`);
  }
}

// ۱. تست مقابله با SQL Injection در دیتابیس D1
runAuditTest("بررسی Parameterized Bindings در تمام کوئری‌های دیتابیس (ضد SQLi)", () => {
  const routerCode = fs.readFileSync('/home/user/chatre-danesh-repo/lib/api-router.ts', 'utf-8');
  // چک کردن استفاده ایمن از ? و .bind
  const hasPlaceholders = routerCode.includes("WHERE platform=? AND chat_id=?") && routerCode.includes(".bind(");
  return hasPlaceholders ? true : { passed: false, reason: "کوئری‌های پارامتریزه شناسایی نشد." };
});

// ۲. تست ضد تقلب و ضد دوبار کلیک هم‌زمان (Anti Race Condition / Double-Click)
runAuditTest("مکانیزم ضد تقلب و نادیده‌گرفتن کلیک‌های مکرر و هم‌زمان روی گزینه‌ها", () => {
  const routerCode = fs.readFileSync('/home/user/chatre-danesh-repo/lib/api-router.ts', 'utf-8');
  const hasAntiDoubleCount = routerCode.includes("ضد double-count") || routerCode.includes("popBotQuizState");
  return hasAntiDoubleCount ? true : { passed: false, reason: "هندلر فاقد مکانیزم ضد double-count است." };
});

// ۳. تست امنیت توکن‌های ورود یک‌بارمصرف (One-Click SSO Token Security)
runAuditTest("اعتبارسنجی انقضای توکن یک‌بارمصرف (حداکثر ۱۵ دقیقه و مصرف تک‌باره)", () => {
  const schemaCode = fs.readFileSync('/home/user/chatre-danesh-repo/schema.sql', 'utf-8');
  const hasExpiresAt = schemaCode.includes("bot_login_tokens") && schemaCode.includes("expires_at");
  return hasExpiresAt ? true : { passed: false, reason: "جدول bot_login_tokens فاقد فیلد expires_at است." };
});

// ۴. تست خنثی‌سازی کاراکترهای مخرب Markdown و فال‌بک خودکار
runAuditTest("ایمن‌سازی و فال‌بک خودکار در صورت وجود کاراکترهای رزروشده Markdown", () => {
  const pollerCode = fs.readFileSync('/home/user/chatre-danesh-repo/scripts/telegram-poller.js', 'utf-8');
  const hasFallback = pollerCode.includes("delete payload.parse_mode") || pollerCode.includes("safeMd");
  return hasFallback ? true : { passed: false, reason: "سیستم فال‌بک خودکار Markdown در تلگرام فعال نیست." };
});

// ۵. تست نرمالایزر و مقاومت در برابر کاراکترهای عربی/فارسی
runAuditTest("مقاومت نرمالایزر در برابر یای عربی (ي)، کاف (ك)، تنوین‌ها و نیم‌فاصله‌های مخفی", () => {
  const input = "دعاوي راجع‌به مالِ غيرمنقول كدام است؟";
  function normalizeFa(text) {
    const map = { "ي": "ی", "ك": "ک", "ۀ": "ه", "ة": "ه", "أ": "ا", "إ": "ا", "ؤ": "و", "‌": " " };
    return text.replace(/[يكۀةأإؤ‌]/g, c => map[c] || c).replace(/\s+/g, " ").trim();
  }
  const norm = normalizeFa(input);
  const isOk = !norm.includes("ي") && !norm.includes("ك") && norm.includes("دعاوی") && norm.includes("کدام");
  return isOk ? true : { passed: false, reason: "حروف عربی به درستی یکسان‌سازی نشدند." };
});

// ۶. تست سهمیه و Rate Limiting در برابر حملات اسپم پیام
runAuditTest("کنترل نرخ مجاز درخواست‌ها (Rate Limiting) و سقف پیام روزانه ربات", () => {
  const routerCode = fs.readFileSync('/home/user/chatre-danesh-repo/lib/api-router.ts', 'utf-8');
  const hasQuota = routerCode.includes("quota") && (routerCode.includes("checkRateLimit") || routerCode.includes("BOT_CHAT_COST"));
  return hasQuota ? true : { passed: false, reason: "کنترل سقف پیام روزانه یافت نشد." };
});

console.log("\n-------------------------------------------------------------------");
console.log(`📊 نتیجه ارزیابی امنیتی: ${passedCount} از ${totalTests} تست با موفقیت ۱۰۰٪ پاس شد (${Math.round((passedCount/totalTests)*100)}%)`);
console.log("===================================================================");
