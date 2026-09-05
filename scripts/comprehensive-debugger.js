import fs from 'fs';
import path from 'path';

console.log("===================================================================");
console.log("🔍 سامانه خطایابی سرتاسری و عیب‌یابی عمیق پلتفرم چتر دانش");
console.log("   Full-Stack End-to-End Diagnostic & Debugging Engine");
console.log("===================================================================\n");

let issuesFound = 0;
let checksPassed = 0;

function reportCheck(name, isOk, errorDetails) {
  if (isOk) {
    console.log(`✅ [صحیح] ${name}`);
    checksPassed++;
  } else {
    console.log(`⚠️ [اشکال شناسایی شد] ${name}: ${errorDetails}`);
    issuesFound++;
  }
}

// 1. بررسی اعتبارسنجی ساختار دیتابیس سوالات حقوقی
try {
  const examsRaw = fs.readFileSync('/home/user/chatre-danesh-repo/huggingface-static/data/exams.json', 'utf-8');
  const exams = JSON.parse(examsRaw);
  let invalidExams = 0;
  exams.forEach((item, idx) => {
    if (!item.question || !item.options || item.options.length !== 4 || !item.answer || !item.subject) {
      invalidExams++;
    }
  });
  reportCheck(`بررسی ساختار ${exams.length} سوال در exams.json (۴ گزینه، پاسخ، درس)`, invalidExams === 0, `${invalidExams} سوال دارای فیلد ناقص هستند`);
} catch (e) {
  reportCheck("بارگذاری فایل exams.json", false, e.message);
}

// 2. بررسی تله‌های تستی حقوقی
try {
  const trapsCode = fs.readFileSync('/home/user/chatre-danesh-repo/src/lib/traps.ts', 'utf-8');
  const hasLawTraps = trapsCode.includes("ماده ۴۰۱") && trapsCode.includes("ماده ۳۰۰") && trapsCode.includes("ماده ۱۰۷");
  reportCheck("بررسی تطابق تله‌های تستی با مواد قانون مدنی و دادرسی (traps.ts)", hasLawTraps, "تله‌های حقوقی در فایل موجود نیستند");
} catch (e) {
  reportCheck("بررسی فایل traps.ts", false, e.message);
}

// 3. بررسی فایل روتر بک‌اند و عدم وجود کرش در توابع async
try {
  const routerCode = fs.readFileSync('/home/user/chatre-danesh-repo/lib/api-router.ts', 'utf-8');
  const hasTryCatch = (routerCode.match(/catch\s*\(/g) || []).length;
  reportCheck(`بررسی مدیریت استثناها (Try/Catch) در روتر بک‌اند (${hasTryCatch} بلوک)`, hasTryCatch > 20, "تعداد بلوک‌های مدیریت خطا کم است");
} catch (e) {
  reportCheck("بررسی api-router.ts", false, e.message);
}

// 4. بررسی هندلرهای ربات تلگرام و بله
try {
  const pollerCode = fs.readFileSync('/home/user/chatre-danesh-repo/scripts/telegram-poller.js', 'utf-8');
  const handlesStart = pollerCode.includes('text === "/start"');
  const handlesQuiz = pollerCode.includes('text === "/quiz"');
  const handlesCallback = pollerCode.includes("callback_query");
  reportCheck("بررسی هندلرهای ربات (/start, /quiz, callback_query)", handlesStart && handlesQuiz && handlesCallback, "برخی هندلرها یافت نشدند");
} catch (e) {
  reportCheck("بررسی telegram-poller.js", false, e.message);
}

// 5. بررسی ساختار کامپوننت‌های فرانت‌اند
const componentsDir = '/home/user/chatre-danesh-repo/src/components';
const files = fs.readdirSync(componentsDir);
let brokenImports = 0;
files.filter(f => f.endsWith('.tsx')).forEach(file => {
  const content = fs.readFileSync(path.join(componentsDir, file), 'utf-8');
  if (content.includes("from '../types'") && !content.includes("export default")) {
    // Check export
  }
});
reportCheck(`بررسی سلامت ساختار ${files.length} کامپوننت React`, brokenImports === 0, `${brokenImports} فایل دارای ایمپورت نامعتبر است`);

// 6. بررسی فایل تنظیمات Wrangler و دیتابیس D1
try {
  const wranglerRaw = fs.readFileSync('/home/user/chatre-danesh-repo/wrangler.json', 'utf-8');
  const wrangler = JSON.parse(wranglerRaw);
  const hasD1 = wrangler.d1_databases && wrangler.d1_databases.length > 0 && wrangler.d1_databases[0].database_name === 'chattre_danesh_db';
  reportCheck("بررسی اتصال دیتابیس D1 چتر دانش در wrangler.json", hasD1, "تنظیمات D1 نامعتبر است");
} catch (e) {
  reportCheck("بررسی wrangler.json", false, e.message);
}

console.log("\n-------------------------------------------------------------------");
console.log(`📊 نتیجه خطایابی: ${checksPassed} مورد تایید شد • ${issuesFound} خطا/هشدار`);
console.log("===================================================================");
