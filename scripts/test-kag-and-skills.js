import fs from 'fs';
import path from 'path';

console.log("===================================================================");
console.log("🧪 بررسی موشکافانه مدل KAG و ارزیابی مهارت‌های حقوقی جدید");
console.log("   KAG Engine Debugging & Advanced Legal Skills Audit");
console.log("===================================================================\n");

// بررسی فایل‌های مرجع
const booksFile = '/home/user/chatre-danesh-repo/huggingface-static/data/law-books-corpus.json';
const graphFile = '/home/user/chatre-danesh-repo/huggingface-static/data/legal-knowledge-graph.json';

const booksData = JSON.parse(fs.readFileSync(booksFile, 'utf-8'));
const graphData = JSON.parse(fs.readFileSync(graphFile, 'utf-8'));

console.log(`✅ [پایگاه داده] تعداد ${booksData.books.length} کتاب قانون مرجع بارگذاری شد.`);
console.log(`✅ [گراف دانش] تعداد ${graphData.entities.length} نود و ${graphData.relations.length} یال استنتاجی فعال است.`);

// تست تطابق اعداد فارسی و انگلیسی (مثل 401 و ۴۰۱)
function normalizeAll(text) {
  if (!text) return "";
  const faDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  const arDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  let res = text;
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(faDigits[i], i.toString()).replaceAll(arDigits[i], i.toString());
  }
  return res.replace(/[يك]/g, c => c === 'ي' ? 'ی' : 'ک')
            .replace(/[ۀة]/g, 'ه')
            .replace(/[\u200c\u200f\s]+/g, ' ')
            .trim()
            .toLowerCase();
}

console.log("\n--- تست ۱: جستجوی ماده ۴۰۱ با اعداد انگلیسی (401) و فارسی (۴۰۱) ---");
const test1 = normalizeAll("ماده 401 قانون مدنی");
const test2 = normalizeAll("ماده ۴۰۱ قانون مدنی");
console.log("نرمال‌شده 401:", test1);
console.log("نرمال‌شده ۴۰۱:", test2);
console.log("آیا برابرند؟", test1 === test2 ? "✅ بله (تطابق کامل)" : "❌ خیر");

// تست ۲: صحت ارتباطات گراف دانش
let brokenEdges = 0;
const entityIds = new Set(graphData.entities.map(e => e.id));
graphData.relations.forEach(r => {
  if (!entityIds.has(r.from) || !entityIds.has(r.to)) {
    brokenEdges++;
    console.warn("⚠️ یال نامعتبر:", r);
  }
});
console.log(`\n--- تست ۲: سلامت یال‌های گراف دانش ---`);
console.log(brokenEdges === 0 ? "✅ تمام یال‌ها و روابط گراف دانش ۱۰۰٪ معتبر هستند." : `❌ ${brokenEdges} یال معیوب است.`);

console.log("\n===================================================================");
console.log("🎯 ۵ مهارت تخصصی جدید طراحی‌شده برای ارتقای مدل KAG:");
console.log("  ۱) مهارت محاسبه‌گر مواعد قانونی (Procedural Timeline Calculator)");
console.log("  ۲) مهارت بررسی و اعتبارسنجی شروط ضمن عقد و قراردادها (Contract Trap Checker)");
console.log("  ۳) مهارت تشخیص صلاحیت مراجع قضایی و دادگاه‌های صلح (Jurisdiction Classifier)");
console.log("  ۴) مهارت شبیه‌ساز مصاحبه علمی و کارگاه شفاهی وکالت/قضاوت (Oral Exam Mock)");
console.log("  ۵) مهارت هشدار ضد تله‌های تستی آزمون وکالت (Anti-Deception Assistant)");
console.log("===================================================================");
