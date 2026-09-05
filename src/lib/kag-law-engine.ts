/**
 * ⚖️ موتور استنتاج حقوقی مبتنی بر گراف دانش (KAG - Knowledge Augmented Generation)
 * پلتفرم چتر دانش و حق‌یار
 *
 * ترکیب گراف دانش (Knowledge Graph)، بازیابی معنایی (Semantic RAG) و نمایه ۲۰ کتاب قانون مرجع ایران
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

export interface KagQueryResult {
  query: string;
  matched_entities: KagEntity[];
  relevant_articles: { book: string; article: LawArticle }[];
  inferred_relations: KagRelation[];
  legal_reasoning: string;
  source_books: string[];
}

// بارگذاری پایگاه ۲۰ کتاب مرجع و گراف دانش KAG
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
 * نرمال‌سازی متون حقوقی برای جستجوی دقیق
 */
function normalizeLegalText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[يك]/g, c => (c === 'ي' ? 'ی' : 'ک'))
    .replace(/[ۀة]/g, 'ه')
    .replace(/[أإآ]/g, 'ا')
    .replace(/[\u200c\u200f\s]+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * جستجو و استنتاج بر روی گراف دانش KAG و پایگاه ۲۰ کتاب مرجع حقوقی
 */
export function queryLegalKag(userQuery: string): KagQueryResult {
  const books = loadLawBooksCorpus();
  const graph = loadLegalKnowledgeGraph();
  const normQuery = normalizeLegalText(userQuery);
  const queryTokens = normQuery.split(/\s+/).filter(t => t.length >= 2);

  const matchedEntities: KagEntity[] = [];
  const matchedEntityIds = new Set<string>();

  // ۱. انطباق نودهای گراف دانش بر اساس کلمات کلیدی
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

  // ۲. استخراج یال‌ها و روابط بین نودهای فعال‌شده (Relation Reasoning)
  const inferredRelations: KagRelation[] = [];
  if (graph) {
    for (const rel of graph.relations) {
      if (matchedEntityIds.has(rel.from) || matchedEntityIds.has(rel.to)) {
        inferredRelations.push(rel);
      }
    }
  }

  // ۳. جستجوی مقالات و مواد قانونی در ۲۰ کتاب مرجع (Hybrid Article Retrieval)
  const relevantArticles: { book: string; article: LawArticle }[] = [];
  const sourceBooks = new Set<string>();

  for (const book of books) {
    let bookHit = false;
    for (const art of book.key_articles) {
      const artHaystack = normalizeLegalText(`${art.article} ${art.subject} ${art.text} ${art.doctrine} ${art.exceptions.join(' ')}`);
      
      let matchScore = 0;
      for (const token of queryTokens) {
        if (artHaystack.includes(token)) {
          matchScore++;
        }
      }

      if (matchScore > 0 || (normQuery.includes('مدنی') && book.code === 'CIVIL_CODE') || (normQuery.includes('کیفری') && book.code === 'CRIMINAL_PROCEDURE')) {
        relevantArticles.push({ book: book.title, article: art });
        bookHit = true;
      }
    }
    if (bookHit) {
      sourceBooks.add(book.title);
    }
  }

  // ۴. ترکیب و ساخت استدلال حقوقی (Synthesis & Legal Reasoning Generation)
  let reasoningLines: string[] = [];
  
  if (matchedEntities.length > 0) {
    reasoningLines.push(`📌 **نهادهای حقوقی فعال در گراف دانش (KAG Entities):**`);
    matchedEntities.forEach(e => {
      reasoningLines.push(`• **${e.name}** (${e.statute} - ${e.core_article})`);
    });
  }

  if (inferredRelations.length > 0) {
    reasoningLines.push(`\n🔗 **روابط استنتاجی و استثنائات قانونی (Legal Graph Inferences):**`);
    inferredRelations.forEach(r => {
      reasoningLines.push(`• ${r.description} [رابطه: ${r.relation}]`);
    });
  }

  if (relevantArticles.length > 0) {
    reasoningLines.push(`\n📚 **مستندات قانونی بازیابی‌شده از کتب مرجع:**`);
    relevantArticles.slice(0, 3).forEach(({ book, article }) => {
      reasoningLines.push(`\n⚖️ **${article.article} (${book}) - ${article.subject}:**\n«${article.text}»\n💡 *دیدگاه دکترین:* ${article.doctrine}`);
      if (article.exceptions.length > 0) {
        reasoningLines.push(`⚠️ *استثنائات:* ${article.exceptions.join('، ')}`);
      }
    });
  }

  const legalReasoning = reasoningLines.length > 0 
    ? reasoningLines.join('\n')
    : `پایگاه KAG با ۲۰ کتاب مرجع حقوقی آماده پاسخگویی به مواد قانونی، تله‌های تستی و دکترین‌های استاد کاتوزیان و دکتر شهیدی می‌باشد.`;

  return {
    query: userQuery,
    matched_entities: matchedEntities,
    relevant_articles: relevantArticles,
    inferred_relations: inferredRelations,
    legal_reasoning: legalReasoning,
    source_books: Array.from(sourceBooks)
  };
}
