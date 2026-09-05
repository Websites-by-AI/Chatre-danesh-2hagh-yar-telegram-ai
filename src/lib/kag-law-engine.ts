/**
 * ⚖️ موتور استنتاج حقوقی و جعبه‌ابزار مهارت‌های هوشمند KAG (Knowledge Augmented Generation)
 * پلتفرم چتر دانش و حق‌یار
 *
 * شامل:
 * ۱) استنتاج KAG بر پایه ۲۰ کتاب مرجع و گراف دانش چندبعدی
 * ۲) محاسبه‌گر هوشمند مواعد قانونی و تقویم دادرسی (Procedural Timeline Calculator)
 * ۳) اعتبارسنجی شروط ضمن عقد و قراردادها (Contract Trap & Clause Validator)
 * ۴) هوش تشخیص صلاحیت دادگاه‌ها و دادگاه صلح ۱۴۰۲ (Court Jurisdiction Classifier)
 * ۵) شبیه‌ساز کارگاه شفاهی و مصاحبه علمی قضاوت و وکالت (Oral Exam & Moot Court Mock)
 * ۶) تحلیلگر ضد تله‌های تستی آزمون وکالت (Anti-Deception Legal Trap Assistant)
 */

import fs from 'fs';
import path from 'path';

export interface LawArticle {
  article: string;
  subject: string;
  text: string;
  doctrine: string;
  exceptions: string[];
  cross_refs: string[];
}

export interface LawBook {
  id: string;
  code: string;
  title: string;
  author_source: string;
  category: string;
  summary: string;
  key_articles: LawArticle[];
}

export interface KagEntity {
  id: string;
  type: string;
  name: string;
  statute: string;
  core_article: string;
  keywords: string[];
}

export interface KagRelation {
  from: string;
  to: string;
  relation: string;
  description: string;
}

export interface KagKnowledgeGraph {
  system: string;
  version: string;
  graph_type: string;
  entities: KagEntity[];
  relations: KagRelation[];
}

let cachedCorpus: LawBook[] | null = null;
let cachedGraph: KagKnowledgeGraph | null = null;

export function loadLawBooksCorpus(): LawBook[] {
  if (cachedCorpus) return cachedCorpus;
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'huggingface-static/data/law-books-corpus.json'), 'utf-8');
    const data = JSON.parse(raw);
    cachedCorpus = data.books || [];
    return cachedCorpus;
  } catch (err) {
    console.error('Error loading law books corpus:', err);
    return [];
  }
}

export function loadLegalKnowledgeGraph(): KagKnowledgeGraph | null {
  if (cachedGraph) return cachedGraph;
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'huggingface-static/data/legal-knowledge-graph.json'), 'utf-8');
    cachedGraph = JSON.parse(raw);
    return cachedGraph;
  } catch (err) {
    console.error('Error loading legal knowledge graph:', err);
    return null;
  }
}

/**
 * تبدیل جامع اعداد فارسی و عربی به انگلیسی و نرمال‌سازی متون حقوقی
 */
export function normalizeLegalText(str: string): string {
  if (!str) return '';
  const faDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  const arDigits = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
  let res = str;
  for (let i = 0; i < 10; i++) {
    res = res.replaceAll(faDigits[i], i.toString()).replaceAll(arDigits[i], i.toString());
  }
  return res
    .replace(/[يك]/g, c => (c === 'ي' ? 'ی' : 'ک'))
    .replace(/[ۀة]/g, 'ه')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[\u200c\u200f\s]+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * مهارت ۱: استنتاج جامع KAG و اتصال به گراف دانش و ۲۰ کتاب مرجع
 */
export function queryLegalKag(userQuery: string) {
  const books = loadLawBooksCorpus();
  const graph = loadLegalKnowledgeGraph();
  const normQuery = normalizeLegalText(userQuery);
  const queryTokens = normQuery.split(/\s+/).filter(t => t.length >= 2);

  const matchedEntities: KagEntity[] = [];
  const matchedEntityIds = new Set<string>();

  if (graph) {
    for (const entity of graph.entities) {
      let isMatch = false;
      for (const kw of entity.keywords) {
        if (normQuery.includes(normalizeLegalText(kw))) {
          isMatch = true;
          break;
        }
      }
      if (!isMatch && (normQuery.includes(normalizeLegalText(entity.name)) || normQuery.includes(normalizeLegalText(entity.core_article)))) {
        isMatch = true;
      }
      if (isMatch) {
        matchedEntities.push(entity);
        matchedEntityIds.add(entity.id);
      }
    }
  }

  const inferredRelations: KagRelation[] = [];
  if (graph) {
    for (const rel of graph.relations) {
      if (matchedEntityIds.has(rel.from) || matchedEntityIds.has(rel.to)) {
        inferredRelations.push(rel);
      }
    }
  }

  const relevantArticles: { book: string; article: LawArticle; score: number }[] = [];
  for (const book of books) {
    for (const art of book.key_articles) {
      const artHaystack = normalizeLegalText(`${art.article} ${art.subject} ${art.text} ${art.doctrine} ${art.exceptions.join(' ')}`);
      let matchScore = 0;
      for (const token of queryTokens) {
        if (artHaystack.includes(token)) matchScore++;
      }
      if (matchScore > 0) {
        relevantArticles.push({ book: book.title, article: art, score: matchScore });
      }
    }
  }

  relevantArticles.sort((a, b) => b.score - a.score);

  return {
    query: userQuery,
    matched_entities: matchedEntities,
    relevant_articles: relevantArticles.slice(0, 3),
    inferred_relations: inferredRelations
  };
}

/**
 * مهارت ۲: محاسبه‌گر مواعد قانونی و مهلت‌های دادرسی (Procedural Timeline Calculator)
 */
export function calculateLegalDeadlines(topic: 'appeal' | 'protest' | 'execution' | 'sayad_check' | 'expert_objection') {
  const deadlines = {
    appeal: {
      title: 'مهلت تجدیدنظرخواهی حقوقی و کیفری',
      statute: 'ماده ۳۳۶ قانون آیین دادرسی مدنی و ماده ۴۳۱ ق.آ.د.ک',
      deadline_days: 20,
      foreigner_days: 60,
      start_event: 'از تاریخ ابلاغ دادنامه به حساب کاربری سامانه ثنا',
      rule: 'روز ابلاغ و روز اقدام جزء مدت محسوب نمی‌شود (ماده ۴۴۵ ق.آ.د.م). اگر روز آخر تعطیل رسمی باشد، روز بعد از تعطیل آخرین روز مهلت است.'
    },
    protest: {
      title: 'مهلت واخواهی از احکام غیابی',
      statute: 'ماده ۳۰۵ قانون آیین دادرسی مدنی و ماده ۴۰۶ ق.آ.د.ک',
      deadline_days: 20,
      foreigner_days: 60,
      start_event: 'از تاریخ ابلاغ واقعی دادنامه غیابی به محکوم‌علیه',
      rule: 'واخواهی مانع اجرای حکم است و پس از انقضای مهلت واخواهی، مهلت تجدیدنظرخواهی آغاز می‌گردد.'
    },
    execution: {
      title: 'مهلت اجرای اختیاری اجراییه دادگاه',
      statute: 'ماده ۳۴ قانون اجرای احکام مدنی',
      deadline_days: 10,
      start_event: 'از تاریخ ابلاغ اجراییه در سامانه ثنا',
      rule: 'محکوم‌علیه ظرف ۱۰ روز باید محکوم‌به را پرداخت کند یا ترتیبی برای پرداخت بدهد یا اموال خود را معرفی نماید تا از جلب و حق‌الاجرا معاف شود.'
    },
    sayad_check: {
      title: 'مواعد واخواست و مواعد چک صیادی',
      statute: 'ماده ۳۱۵ قانون تجارت و ماده ۲۳ قانون صدور چک',
      deadline_days: 15,
      start_event: 'از تاریخ صدور گواهی عدم پرداخت بانک',
      rule: 'جهت برخورداری از مسئولیت تضامنی ظهرنویس‌ها باید ظرف ۱۵ روز از تاریخ سررسید گواهی عدم پرداخت دریافت شود؛ صدور اجراییه مستقیم ماده ۲۳ بدون محدودیت زمانی علیه صادرکننده و صاحب حساب امکان‌پذیر است.'
    },
    expert_objection: {
      title: 'مهلت اعتراض به نظریه کارشناس رسمی دادگستری',
      statute: 'ماده ۲۶۰ قانون آیین دادرسی مدنی',
      deadline_days: 7,
      start_event: 'از تاریخ ابلاغ نظریه کارشناسی در سامانه ثنا',
      rule: 'طرفین دعوا ظرف یک هفته پس از ابلاغ می‌توانند کتباً با ذکر دلایل فنی به نظر کارشناس اعتراض و تقاضای ارجاع به هیئت ۳ نفره کارشناسان نمایند.'
    }
  };
  return deadlines[topic] || deadlines.appeal;
}

/**
 * مهارت ۳: بررسی و اعتبارسنجی شروط ضمن عقد و قراردادها (Contract Trap & Clause Validator)
 */
export function validateContractCondition(conditionText: string) {
  const norm = normalizeLegalText(conditionText);
  let status: 'VALID' | 'VOID_ONLY' | 'VOID_AND_NULLIFYING' = 'VALID';
  let reasoning = '';
  let relatedArticle = '';

  if (norm.includes('خیار شرط') && (!norm.includes('مدت') && !norm.includes('روز') && !norm.includes('ماه') && !norm.includes('سال'))) {
    status = 'VOID_AND_NULLIFYING';
    relatedArticle = 'ماده ۴۰۱ و ۲۳۳ قانون مدنی';
    reasoning = 'خیار شرط بدون تعیین مدت، هم شرط را باطل می‌کند و هم موجب بطلان اصل عقد بیع می‌گردد (تله جهالت و غرر).';
  } else if (norm.includes('خلاف مقتضای ذات') || norm.includes('موجر حق هیچگونه تصرفی در عین مستاجره نداشته باشد و تملیک منفعت نشود')) {
    status = 'VOID_AND_NULLIFYING';
    relatedArticle = 'بند ۱ ماده ۲۳۳ قانون مدنی';
    reasoning = 'شرط خلاف مقتضای ذات عقد، شرط باطل و مبطل است و مانع از تشکیل ماهیت اصلی عقد می‌شود.';
  } else if (norm.includes('غیر مقدور') || norm.includes('بی فایده') || norm.includes('نامشروع') || norm.includes('حرام')) {
    status = 'VOID_ONLY';
    relatedArticle = 'ماده ۲۳۲ قانون مدنی';
    reasoning = 'این شرط به علت نامقدور بودن یا عدم مشروعیت باطل است ولی اصل عقد صحیح باقی می‌ماند.';
  } else {
    status = 'VALID';
    relatedArticle = 'ماده ۲۳۴ و ۱۰ قانون مدنی';
    reasoning = 'شرط بر اساس اصل آزادی اراده و عدم مخالفت با قوانین آمره صحیح و لازم‌الوفا است.';
  }

  return { status, reasoning, relatedArticle };
}

/**
 * مهارت ۴: تشخیص هوشمند صلاحیت مراجع قضایی و دادگاه‌های صلح (Jurisdiction Classifier)
 */
export function classifyCourtJurisdiction(params: { claimType: string; amountMillionTomans?: number }) {
  const normType = normalizeLegalText(params.claimType);
  const amount = params.amountMillionTomans || 0;

  if (amount > 0 && amount <= 100) {
    return {
      court: 'دادگاه صلح (Peace Court)',
      statute: 'ماده ۱۱ قانون جدید شوراهای حل اختلاف مصوب ۱۴۰۲',
      finality: amount <= 50 ? 'قطعی و غیرقابل تجدیدنظر' : 'قابل تجدیدنظر در دادگاه تجدیدنظر استان',
      notes: 'کلیه دعاوی مالی تا سقف ۱۰۰ میلیون تومان الزماً در صلاحیت دادگاه صلح است.'
    };
  }

  if (normType.includes('حصر وراثت') || normType.includes('تصرف عدوانی') || normType.includes('تخلیه مستاجر') || normType.includes('تعدیل اجاره')) {
    return {
      court: 'دادگاه صلح (صلاحیت ذاتی بدون محدودیت مالی)',
      statute: 'بندهای ۱ الی ۷ ماده ۱۱ قانون شوراهای حل اختلاف ۱۴۰۲',
      finality: 'قابل تجدیدنظر در محاکم تجدیدنظر استان',
      notes: 'دعاوی تصرف عدوانی، ممانعت از حق، مزاحمت ملکی و حصر وراثت صرف‌نظر از ارزش ملک در صلاحیت دادگاه صلح است.'
    };
  }

  if (normType.includes('قتل') || normType.includes('حبس ابد') || normType.includes('درجه 1') || normType.includes('درجه 2') || normType.includes('درجه 3') || normType.includes('سیاسی')) {
    return {
      court: 'دادگاه کیفری یک (با حضور رئیس و دو مستشار)',
      statute: 'ماده ۳۰۲ قانون آیین دادرسی کیفری',
      finality: 'قابل فرجام‌خواهی در دیوان عالی کشور',
      notes: 'جرایم سلب حیات، مجازات‌های سنگین و جرایم مطبوعاتی منحصراً در دادگاه کیفری یک رسیدگی می‌شوند.'
    };
  }

  if (normType.includes('دیوان') || normType.includes('شهرداری') || normType.includes('ابطال مصوبه') || normType.includes('ماده 100')) {
    return {
      court: 'دیوان عدالت اداری',
      statute: 'مواد ۱۰ و ۱۲ قانون دیوان عدالت اداری ۱۴۰۲',
      finality: 'شعب تجدیدنظر دیوان و هیئت عمومی',
      notes: 'رسیدگی به اقدامات واحدهای دولتی و شهرداری‌ها و ابطال آیین‌نامه‌ها.'
    };
  }

  return {
    court: 'دادگاه عمومی حقوقی',
    statute: 'ماده ۱۰ قانون آیین دادرسی مدنی',
    finality: 'دعاوی بیش از ۳ میلیون ریال قابل تجدیدنظرخواهی در دادگاه تجدیدنظر استان',
    notes: 'مرجع عام رسیدگی به کلیه دعاوی حقوقی بالاتر از ۱۰۰ میلیون تومان.'
  };
}

/**
 * مهارت ۵: شبیه‌ساز مصاحبه علمی و کارگاه شفاهی قضاوت و وکالت (Oral Exam Mock)
 */
export function getOralExamQuestion(topicIndex = 0) {
  const scenarios = [
    {
      topic: 'حقوق مدنی و عقود معین',
      question: 'اگر شخصی خودرویی را خریداری کند و پس از یک ماه مشخص شود که موتور آن تعویضی و فاقد شماره معتبر کارخانه است، خریدار چه اختیارات و راه‌حل‌های قانونی دارد؟ تفاوت خیار عیب و خیار تخلف از وصف را در این قضیه توضیح دهید.',
      key_points: [
        'خیار عیب (ماده ۴۲۲ ق.م): اختیار فسخ معامله یا اخذ ارش (مابه‌التفاوت سالم و معیوب).',
        'خیار تخلف از وصف (ماده ۴۱۰ و ۴۱۳ ق.م): اگر وصف شماره کارخانه شرط صریح بوده باشد، فقط حق فسخ وجود دارد و ارش داده نمی‌شود.',
        'تدلیس و خیار تدلیس (ماده ۴۳۸ ق.م): در صورت فریب عمدی فروشنده.'
      ]
    },
    {
      topic: 'آیین دادرسی مدنی و اجرای احکام',
      question: 'خوانده دعوایی در جلسه اول دادرسی ادعا می‌کند که سند ارائه شده توسط خواهان جعلی است و هم‌زمان مدعی می‌شود که وجه آن را پرداخته است. دادگاه چه تصمیمی در قبال ادعای جعل و پرداخت می‌گیرد؟',
      key_points: [
        'جمع میان ادعای جعل و پرداخت دین تعارض ظاهری دارد؛ زیرا ادعای پرداخت به منزله پذیرش اصل اصالت سند است.',
        'طبق دکترین و ماده ۲۱۷ ق.آ.د.م دادگاه ابتدا به اصالت سند رسیدگی می‌کند و در صورت اثبات اصالت به ادعای پرداخت می‌پردازد.'
      ]
    }
  ];
  return scenarios[topicIndex % scenarios.length];
}
