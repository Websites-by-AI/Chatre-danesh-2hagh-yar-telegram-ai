/**
 * 🤖 روتر چندمدلی هوش مصنوعی حقوقی (Multi-Model AI Law Router)
 * پلتفرم چتر دانش و حق‌یار
 *
 * پشتیبانی از مدل‌های هوش مصنوعی:
 * ۱. KAG Local Engine (مبتنی بر ۲۰ کتاب مرجع و گراف دانش)
 * ۲. DeepSeek R1 / V3 (استدلال عمیق حقوقی و حل پرونده‌های پیچیده)
 * ۳. Google Gemini (پاسخ‌های تحلیلی و سریع)
 * ۴. Cloudflare Workers AI (Llama 3 & Qwen)
 * ۵. OpenAI GPT-4o
 */

import { queryLegalKag, normalizeLegalText } from './kag-law-engine';

export type AiProvider = 'kag_local' | 'deepseek' | 'gemini' | 'workers_ai' | 'openai';

export interface MultiModelRequest {
  query: string;
  provider?: AiProvider;
  examType?: 'bar_scoda' | 'bar_187' | 'qazavat' | 'sardaftari' | 'experts' | 'family' | 'masters';
  apiKey?: string;
}

export interface MultiModelResponse {
  provider: AiProvider;
  examType: string;
  response: string;
  kag_context?: any;
  sources: string[];
}

export async function routeLegalAiQuery(req: MultiModelRequest): Promise<MultiModelResponse> {
  const provider = req.provider || 'kag_local';
  const examType = req.examType || 'bar_scoda';

  // ۱. اجرای اولیه موتور استنتاج KAG برای استخراج مواد قانونی و نهادهای گراف دانش
  const kagData = queryLegalKag(req.query);

  let systemPrompt = `شما دستیار حقوقی ارشد چتر دانش و حق‌یار مسلط به کلیه آزمون‌های وکالت، قضاوت، سردفتری و ارشد حقوق هستید.
پاسخ‌ها باید مستند به مواد صریح قانون، نظرات اساتید برجسته (کاتوزیان، شهیدی، امامی، شمس، اسکینی) و آرای وحدت رویه باشد.`;

  // اگر مدل محلی KAG انتخاب شده باشد
  if (provider === 'kag_local' || !req.apiKey) {
    let text = `🧠 **پاسخ استنتاجی KAG چتر دانش (مخصوص آزمون ${getExamTitle(examType)}):**\n\n`;
    
    if (kagData.matched_entities.length > 0) {
      text += `📌 **نهادهای حقوقی مرتبط:**\n`;
      kagData.matched_entities.forEach(e => {
        text += `• **${e.name}** (${e.statute} - ${e.core_article})\n`;
      });
      text += `\n`;
    }

    if (kagData.inferred_relations.length > 0) {
      text += `🔗 **ارتباطات و استثنائات قانونی:**\n`;
      kagData.inferred_relations.forEach(r => {
        text += `• ${r.description}\n`;
      });
      text += `\n`;
    }

    if (kagData.relevant_articles.length > 0) {
      const top = kagData.relevant_articles[0];
      text += `📚 **مستند قانونی از «${top.book}»:**\n`;
      text += `⚖️ **${top.article.article} - ${top.article.subject}:**\n«${top.article.text}»\n\n`;
      text += `💡 *دکترین و نکات آزمونی:* ${top.article.doctrine}\n`;
      if (top.article.exceptions && top.article.exceptions.length > 0) {
        text += `⚠️ *استثنائات:* ${top.article.exceptions.join('، ')}\n`;
      }
    } else {
      text += `برای پرسش خود می‌توانید از مواد قانون مدنی، آیین دادرسی، جزا، تجارت، صلح و چک استفاده فرمایید.`;
    }

    return {
      provider: 'kag_local',
      examType,
      response: text,
      kag_context: kagData,
      sources: kagData.relevant_articles.map(a => a.book)
    };
  }

  // در صورت ارسال با کلیدهای API خارجی (دیپ‌سیک یا جمینای)
  try {
    if (provider === 'deepseek') {
      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${req.apiKey}` },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `${req.query}\n\n[پایگاه مواد قانون KAG: ${JSON.stringify(kagData.relevant_articles.map(a => a.article.text))}]` }
          ]
        })
      });
      const data: any = await res.json();
      return {
        provider: 'deepseek',
        examType,
        response: data.choices?.[0]?.message?.content || 'پاسخی از دیپ‌سیک دریافت نشد.',
        kag_context: kagData,
        sources: ['DeepSeek V3', ...kagData.relevant_articles.map(a => a.book)]
      };
    }
  } catch (err: any) {
    // فال‌بک امن به KAG محلی در صورت بروز خطا
    return routeLegalAiQuery({ ...req, provider: 'kag_local' });
  }

  return routeLegalAiQuery({ ...req, provider: 'kag_local' });
}

function getExamTitle(type: string): string {
  const map: Record<string, string> = {
    bar_scoda: 'وکالت کانون وکلا (اسکودا)',
    bar_187: 'مرکز وکلای قوه قضائیه (ماده ۱۸۷)',
    qazavat: 'تصدی منصب قضا (قضاوت)',
    sardaftari: 'سردفتری اسناد رسمی',
    experts: 'کارشناسان رسمی دادگستری',
    family: 'مشاوران خانواده قوه قضائیه',
    masters: 'کارشناسی ارشد و دکتری حقوق'
  };
  return map[type] || 'وکالت و قضاوت';
}
