import fs from 'fs';
import { queryLegalKag, validateContractCondition, calculateLegalDeadlines, classifyCourtJurisdiction } from '../src/lib/kag-law-engine.ts';

console.log("===================================================================");
console.log("🔬 آزمون ارزیابی نرخ خطا، توهم و نقاط آسیب‌پذیر مدل KAG حقوقی");
console.log("   Legal AI Hallucination & Vulnerability Stress-Test");
console.log("===================================================================\n");

let passedStressTests = 0;
let totalStressTests = 0;

function runStressTest(id, name, query, validatorFn, vulnerableArea) {
  totalStressTests++;
  console.log(`[تست ${id}] موضوع: ${name}`);
  console.log(`- نقطه آسیب معمول مدل‌های هوش مصنوعی عمومی: ${vulnerableArea}`);
  try {
    const result = validatorFn(query);
    if (result.success) {
      console.log(`✅ نتیجه در مدل KAG: موفق (پاسخ دقیق و بدون توهم) -> ${result.detail}`);
      passedStressTests++;
    } else {
      console.log(`❌ نتیجه در مدل KAG: دارای ریسک یا خطا -> ${result.detail}`);
    }
  } catch (err) {
    console.log(`❌ خطای اجرایی: ${err.message}`);
  }
  console.log("-------------------------------------------------------------------");
}

// تست ۱: تله ماده ۴۰۱ (بطلان شرط + بطلان عقد در خیار شرط مجهول‌المدت)
runStressTest(
  1,
  "خیار شرط بدون مدت در عقد بیع",
  "خیار شرط بدون تعیین مدت چه تاثیری بر عقد بیع دارد؟",
  (q) => {
    const res = validateContractCondition(q);
    const isCorrect = res.status === 'VOID_AND_NULLIFYING' && res.relatedArticle.includes('۴۰۱');
    return { success: isCorrect, detail: `وضعیت: ${res.status} | مستند: ${res.relatedArticle}` };
  },
  "بسیاری از هوش مصنوعی‌ها اشتباهاً فقط شرط را باطل می‌دانند و عقد را صحیح اعلام می‌کنند."
);

// تست ۲: صلاحیت دادگاه صلح در دعوای ۷۰ میلیون تومانی
runStressTest(
  2,
  "صلاحیت در دعوای مالی ۷۰ میلیون تومانی",
  { claimType: 'مطالبه طلب', amountMillionTomans: 70 },
  (param) => {
    const res = classifyCourtJurisdiction(param);
    const isCorrect = res.court.includes('دادگاه صلح') && res.finality.includes('قابل تجدیدنظر');
    return { success: isCorrect, detail: `مرجع: ${res.court} | قطعیت: ${res.finality}` };
  },
  "هوش مصنوعی‌های قدیمی اشتباهاً پرونده را به شورای حل اختلاف یا دادگاه عمومی ارجاع می‌دهند."
);

// تست ۳: محاسبه مواعد و عدم احتساب روز ابلاغ و اقدام
runStressTest(
  3,
  "قاعده احتساب مواعد تجدیدنظر (ماده ۴۴۵ ق.آ.د.م)",
  'appeal',
  (topic) => {
    const res = calculateLegalDeadlines(topic);
    const isCorrect = res.deadline_days === 20 && res.rule.includes('روز ابلاغ و روز اقدام جزء مدت محسوب نمی‌شود');
    return { success: isCorrect, detail: `مهلت: ${res.deadline_days} روز | قاعده: ${res.rule}` };
  },
  "هوش مصنوعی‌های عمومی روز ابلاغ را جزء ۲۰ روز حساب کرده و تاریخ اشتباه اعلام می‌کنند."
);

// تست ۴: استرداد دعوا پس از ختم مذاکرات (ماده ۱۰۷ بند ج)
runStressTest(
  4,
  "استرداد دعوا پس از ختم مذاکرات دادرسی",
  "استرداد دعوا پس از ختم مذاکرات دادگاه چه قراری صادر می‌شود؟",
  (q) => {
    const res = queryLegalKag(q);
    const has107 = res.relevant_articles.some(a => a.article.article.includes('۱۰۷') && a.article.text.includes('سقوط دعوا'));
    return { success: has107, detail: "تشخیص دقیق قرار سقوط دعوا به استناد بند ج ماده ۱۰۷ ق.آ.د.م" };
  },
  "خلط میان سه مفهوم: قرار ابطال دادخواست، قرار رد دعوا و قرار سقوط دعوا."
);

// تست ۵: مطالبه بهای روز ملک در بیع مستحق‌للغیر (رای ۸۱۱)
runStressTest(
  5,
  "ضمان درک و جبران کاهش ارزش پول در معامله باطل",
  "اگر ملکی مستحق‌للغیر دربیاید خریدار چه خسارتی می‌تواند بگیرد؟",
  (q) => {
    const res = queryLegalKag(q);
    const has811 = res.matched_entities.some(e => e.core_article.includes('۸۱۱')) || res.inferred_relations.some(r => r.description.includes('۸۱۱'));
    return { success: has811, detail: "اعمال رای وحدت رویه ۸۱۱ جهت جبران تورم و قیمت روز ملک" };
  },
  "استناد به قوانین قدیمی و ادعای دریافت صرف ثمن معامله بدون در نظر گرفتن تورم."
);

console.log(`\n📊 نتیجه آزمون استرس و راستی‌آزمایی توهم:`);
console.log(`   تعداد تست‌های پاس‌شده بدون خطا: ${passedStressTests} از ${totalStressTests} (${Math.round((passedStressTests/totalStressTests)*100)}%)`);
console.log("===================================================================");
