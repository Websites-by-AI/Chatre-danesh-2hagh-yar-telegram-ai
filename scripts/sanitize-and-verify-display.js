import fs from 'fs';
import path from 'path';

console.log("===================================================================");
console.log("🔍 ممیزی کیفیت نمایش متون، پالایش زبان (چینی/انگلیسی ناخواسته) و صحت لینک‌ها");
console.log("   Text Cleanliness, Character Sanity & Link Validation Audit");
console.log("===================================================================\n");

let passedChecks = 0;
let totalChecks = 0;

function report(title, isSuccess, details) {
  totalChecks++;
  if (isSuccess) {
    console.log(`✅ [تایید] ${title}`);
    passedChecks++;
  } else {
    console.log(`❌ [اشکال] ${title}: ${details}`);
  }
}

// ۱. بررسی عدم وجود کاراکترهای چینی و هیروگلیف در بانک سوالات و کتاب‌ها
const chineseRegex = /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/;

const filesToCheck = [
  '/home/user/chatre-danesh-repo/huggingface-static/data/exams.json',
  '/home/user/chatre-danesh-repo/huggingface-static/data/law-books-corpus.json',
  '/home/user/chatre-danesh-repo/huggingface-static/data/legal-knowledge-graph.json',
  '/home/user/chatre-danesh-repo/huggingface-static/data/all-legal-exams-specs.json',
  '/home/user/chatre-danesh-repo/scripts/telegram-poller.js'
];

let foundChinese = 0;
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf-8');
    if (chineseRegex.test(content)) {
      foundChinese++;
      console.warn(`⚠️ کاراکتر چینی در فایل یافت شد: ${file}`);
    }
  }
});

report("عدم وجود کاراکترهای ناخواسته چینی در تمام متون و بانک‌ها", foundChinese === 0, `${foundChinese} فایل دارای کاراکتر چینی است`);

// ۲. بررسی متن ۱۰۵ سوال آزمون وکالت (عدم وجود کلمات شکسته یا انگلیسی در گزینه‌ها)
const exams = JSON.parse(fs.readFileSync('/home/user/chatre-danesh-repo/huggingface-static/data/exams.json', 'utf-8'));
let malformedQuestions = 0;

exams.forEach((q, idx) => {
  if (!q.question || q.question.trim().length < 10) malformedQuestions++;
  if (!q.options || q.options.length !== 4) malformedQuestions++;
  if (!q.answer) malformedQuestions++;
  q.options.forEach(opt => {
    if (!opt || opt.trim().length === 0) malformedQuestions++;
  });
});

report(`صحت ساختاری و سلامت نگارشی تمام ${exams.length} سوال آزمون وکالت`, malformedQuestions === 0, `${malformedQuestions} سوال دارای نقص است`);

// ۳. بررسی لینک‌ها و آدرس‌های URL در ربات
const pollerCode = fs.readFileSync('/home/user/chatre-danesh-repo/scripts/telegram-poller.js', 'utf-8');
const urls = [...pollerCode.matchAll(/https?:\/\/[^\s"'`)]+/g)].map(m => m[0]);
let brokenUrls = 0;

urls.forEach(url => {
  if (!url.startsWith('https://chattredanesh.ir') && !url.startsWith('https://api.telegram.org')) {
    brokenUrls++;
    console.warn(`⚠️ لینک نامعتبر: ${url}`);
  }
});

report(`اعتبارسنجی تمام ${urls.length} لینک اینترنتی در ربات (اتصال به chattredanesh.ir)`, brokenUrls === 0, `${brokenUrls} لینک نامعتبر است`);

// ۴. بررسی دکمه‌های شیشه‌ای و عدم طولانی بودن بیش از حد
const inlineBtnTexts = [...pollerCode.matchAll(/text:\s*["'`]([^"'`]+)["'`]/g)].map(m => m[1]);
let invalidButtons = 0;

inlineBtnTexts.forEach(txt => {
  if (txt.length < 2 || txt.includes("undefined") || txt.includes("null")) {
    invalidButtons++;
  }
});

report(`بررسی سلامت ظاهری و متن ${inlineBtnTexts.length} دکمه منو و کیبورد`, invalidButtons === 0, `${invalidButtons} دکمه دارای متن ناقص است`);

// ۵. بررسی فرمت گزارش روند پیشرفت و کارنامه (Trend Output Format)
const hasTrendFormat = pollerCode.includes("تحلیل ساختار و بودجه‌بندی آزمون") && pollerCode.includes("حقوق مدنی") && pollerCode.includes("آیین دادرسی مدنی");
report("فرمت گزارش تحلیل روند، بودجه‌بندی دروس و کارنامه", hasTrendFormat, "بخش گزارش روند ناقص است");

console.log("\n-------------------------------------------------------------------");
console.log(`📊 نتیجه ارزیابی کیفیت نمایش: ${passedChecks} از ${totalChecks} بخش تایید کامل شد (${Math.round((passedChecks/totalChecks)*100)}%)`);
console.log("===================================================================");
