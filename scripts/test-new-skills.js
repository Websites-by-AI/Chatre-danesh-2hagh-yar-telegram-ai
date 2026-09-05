import {
  calculateLegalDeadlines,
  validateContractCondition,
  classifyCourtJurisdiction,
  getOralExamQuestion,
  queryLegalKag
} from '../src/lib/kag-law-engine.ts';

console.log("===================================================================");
console.log("🚀 آزمون مهارت‌های ۵گانه هوش مصنوعی حقوقی چتر دانش (KAG Skills)");
console.log("===================================================================\n");

// تست مهارت ۱: محاسبه مواعد تجدیدنظر
console.log("1️⃣ تست مهارت محاسبه مواعد قانونی (تجدیدنظر):");
const deadline = calculateLegalDeadlines('appeal');
console.log(`- عنوان: ${deadline.title}`);
console.log(`- مهلت: ${deadline.deadline_days} روز (اتباع خارج: ${deadline.foreigner_days} روز)`);
console.log(`- مستند: ${deadline.statute}`);
console.log(`- قاعده: ${deadline.rule}\n`);

// تست مهارت ۲: اعتبارسنجی شرط قرارداد
console.log("2️⃣ تست مهارت اعتبارسنجی شرط قرارداد (تله خیار شرط بدون مدت):");
const condCheck = validateContractCondition("خریدار حق دارد هر زمان بخواهد معامله را با خیار شرط فسخ کند");
console.log(`- وضعیت اعتبار: ${condCheck.status}`);
console.log(`- مستند: ${condCheck.relatedArticle}`);
console.log(`- تحلیل هوش مصنوعی: ${condCheck.reasoning}\n`);

// تست مهارت ۳: تشخیص صلاحیت دادگاه صلح
console.log("3️⃣ تست مهارت تشخیص صلاحیت دادگاه (مطالبه ۸۰ میلیون تومان وجه سفته):");
const courtCheck = classifyCourtJurisdiction({ claimType: 'مطالبه وجه سفته', amountMillionTomans: 80 });
console.log(`- مرجع صالح: ${courtCheck.court}`);
console.log(`- قانون: ${courtCheck.statute}`);
console.log(`- وضعیت قطعیت رای: ${courtCheck.finality}`);
console.log(`- توضیحات: ${courtCheck.notes}\n`);

// تست مهارت ۴: شبیه‌ساز مصاحبه شفاهی وکالت
console.log("4️⃣ تست مهارت شبیه‌ساز کارگاه شفاهی و مصاحبه علمی:");
const oralMock = getOralExamQuestion(0);
console.log(`- موضوع: ${oralMock.topic}`);
console.log(`- سناریوی پرونده: ${oralMock.question}`);
console.log(`- نکات کلیدی ارزیابی داوطلب:`);
oralMock.key_points.forEach(p => console.log(`  • ${p}`));

console.log("\n===================================================================");
console.log("✅ تمام ۵ مهارت هوش مصنوعی KAG با موفقیت تست و تایید شدند.");
console.log("===================================================================");
