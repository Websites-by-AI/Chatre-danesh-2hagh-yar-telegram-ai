import React, { useEffect, useMemo, useState } from "react";
import { BLOG_ARTICLES, BlogArticle, BlogArticleSection, findArticle } from "../data/blogArticles";

/** تبدیل تاریخ شمسی ("۱۲ مرداد ۱۴۰۵") به ISO برای JSON-LD — تقریبی (بدون محاسبه کبیسه) */
const FA_MONTHS = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
function persianDateToISO(dateStr: string): string {
  try {
    const toEn = (t: string) => t.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
    const parts = dateStr.trim().split(/\s+/);
    const pd = parseInt(toEn(parts[0]), 10);
    const pm = FA_MONTHS.indexOf(parts[1]) + 1;
    const py = parseInt(toEn(parts[2]), 10);
    if (!pd || pm < 1 || !py) return "";
    const dayOfYear = pm <= 7 ? (pm - 1) * 31 + pd : 186 + (pm - 7) * 30 + pd;
    const start = new Date(Date.UTC(py + 621, 2, 21)); // نوروز ≈ ۲۱ مارس
    start.setUTCDate(start.getUTCDate() + (dayOfYear - 1));
    return start.toISOString().slice(0, 10);
  } catch (e) {
    return "";
  }
}

/** خواندن slug از مسیر /blog/:slug (برای URLهای قابل اشتراک) */
function getPathSlug(): string | null {
  try {
    const m = window.location.pathname.match(/^\/blog\/(.+)$/);
    if (m) {
      const s = decodeURIComponent(m[1]);
      if (findArticle(s)) return s;
    }
  } catch (e) {}
  return null;
}

/** به‌روزرسانی آدرس مرورگر بدون ریلود */
function pushBlogUrl(slug: string | null) {
  try {
    if (!window.location.pathname.startsWith("/blog")) return;
    const url = slug ? `/blog/${encodeURIComponent(slug)}` : "/blog";
    window.history.pushState({ blogSlug: slug }, "", url);
  } catch (e) {}
}

// ثابت نگه داشتن کلاس‌های Tailwind (بدون ساخت رشته‌ای در runtime)
const ACCENTS: Record<
  BlogArticle["accent"],
  { gradient: string; badge: string; text: string; hoverText: string; ring: string; callout: string }
> = {
  indigo: {
    gradient: "from-indigo-500 to-violet-600",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-100",
    text: "text-indigo-600",
    hoverText: "group-hover:text-indigo-600",
    ring: "ring-indigo-100",
    callout: "bg-indigo-50/70 border-indigo-200 text-indigo-900",
  },
  emerald: {
    gradient: "from-emerald-500 to-teal-600",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    text: "text-emerald-600",
    hoverText: "group-hover:text-emerald-600",
    ring: "ring-emerald-100",
    callout: "bg-emerald-50/70 border-emerald-200 text-emerald-900",
  },
  amber: {
    gradient: "from-amber-500 to-orange-600",
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    text: "text-amber-600",
    hoverText: "group-hover:text-amber-600",
    ring: "ring-amber-100",
    callout: "bg-amber-50/70 border-amber-200 text-amber-900",
  },
  rose: {
    gradient: "from-rose-500 to-pink-600",
    badge: "bg-rose-50 text-rose-700 border-rose-100",
    text: "text-rose-600",
    hoverText: "group-hover:text-rose-600",
    ring: "ring-rose-100",
    callout: "bg-rose-50/70 border-rose-200 text-rose-900",
  },
  sky: {
    gradient: "from-sky-500 to-cyan-600",
    badge: "bg-sky-50 text-sky-700 border-sky-100",
    text: "text-sky-600",
    hoverText: "group-hover:text-sky-600",
    ring: "ring-sky-100",
    callout: "bg-sky-50/70 border-sky-200 text-sky-900",
  },
};

interface BlogViewProps {
  onNavigate?: (target: string) => void;
}

export default function BlogView({ onNavigate }: BlogViewProps) {
  // Deep-link: اولویت با URL (/blog/slug) سپس localStorage pending از صفحه اول
  const [activeSlug, setActiveSlug] = useState<string | null>(() => {
    const fromPath = getPathSlug();
    if (fromPath) return fromPath;
    try {
      const pending = localStorage.getItem("taranom_blog_pending_slug");
      if (pending) {
        localStorage.removeItem("taranom_blog_pending_slug");
        if (findArticle(pending)) return pending;
      }
    } catch (e) {}
    return null;
  });
  const [categoryFilter, setCategoryFilter] = useState<string>("همه");

  const active = activeSlug ? findArticle(activeSlug) : undefined;

  /** باز/بستن مقاله + همگام‌سازی URL مرورگر */
  const openArticle = (slug: string | null) => {
    setActiveSlug(slug);
    pushBlogUrl(slug);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // دکمه‌های back/forward مرورگر
  useEffect(() => {
    const onPop = () => setActiveSlug(getPathSlug());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // متا تگ داینامیک title + description برای سئو
  const defaultsRef = React.useRef<{ title: string; desc: string } | null>(null);
  useEffect(() => {
    if (!defaultsRef.current) {
      defaultsRef.current = {
        title: document.title,
        desc: document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
      };
    }
    if (active) {
      document.title = `${active.title} | وبلاگ ترنم همدلی`;
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", active.excerpt.slice(0, 160));
    } else if (defaultsRef.current) {
      document.title = defaultsRef.current.title;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", defaultsRef.current.desc);
    }
  }, [activeSlug]);

  // JSON-LD نوع Article برای رتبه‌بندی موتورهای جستجو
  useEffect(() => {
    const id = "taranom-blog-jsonld";
    document.getElementById(id)?.remove();
    if (active) {
      const iso = persianDateToISO(active.date);
      const ld: Record<string, unknown> = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: active.title,
        description: active.excerpt,
        inLanguage: "fa",
        articleSection: active.category,
        keywords: active.keywords.join("، "),
        timeRequired: `PT${active.readMinutes}M`,
        author: { "@type": "Organization", name: "تیم آموزش و مشاوره آکادمی ترنم همدلی" },
        publisher: { "@type": "Organization", name: "آکادمی ترنم همدلی" },
        mainEntityOfPage: `${window.location.origin}/blog/${active.slug}`,
      };
      if (iso) ld.datePublished = iso;
      const el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      el.textContent = JSON.stringify(ld);
      document.head.appendChild(el);
    }
    return () => {
      document.getElementById(id)?.remove();
    };
  }, [activeSlug]);

  const categories = useMemo(
    () => ["همه", ...Array.from(new Set(BLOG_ARTICLES.map((a) => a.category)))],
    []
  );
  const filtered = useMemo(
    () => (categoryFilter === "همه" ? BLOG_ARTICLES : BLOG_ARTICLES.filter((a) => a.category === categoryFilter)),
    [categoryFilter]
  );

  // -------------------------------------- Reading view (تک مقاله)
  if (active) {
    const acc = ACCENTS[active.accent];
    const related = BLOG_ARTICLES.filter((a) => a.slug !== active.slug).slice(0, 3);
    const toc = active.sections
      .map((s, i) => ({ heading: s.heading, index: i }))
      .filter((x): x is { heading: string; index: number } => Boolean(x.heading));
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8" style={{ direction: "rtl" }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <button
            onClick={() => openArticle(null)}
            className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-full px-4 py-2 shadow-sm transition"
          >
            → بازگشت به همه مقالات
          </button>
          <button
            onClick={() => {
              const url = `${window.location.origin}/blog/${active.slug}`;
              if (navigator.clipboard) navigator.clipboard.writeText(url).catch(() => {});
              window.history.replaceState(null, "", window.location.pathname);
            }}
            title="کپی لینک مقاله برای اشتراک‌گذاری"
            className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-2 transition"
          >
            🔗 کپی لینک مقاله
          </button>
        </div>

        <article className="max-w-3xl mx-auto bg-white border border-slate-100 rounded-[2.5rem] shadow-xl overflow-hidden">
          <div className={`h-44 bg-gradient-to-tr ${acc.gradient} flex items-center justify-center relative`}>
            <span className="text-7xl drop-shadow-lg">{active.emoji}</span>
            <span className="absolute top-5 right-6 text-[10px] font-black text-white/90 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full border border-white/25">
              {active.category}
            </span>
          </div>

          <div className="p-6 sm:p-10 space-y-7">
            <header className="space-y-3 border-b border-slate-100 pb-6">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-relaxed">{active.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400">
                <span>📅 {active.date}</span>
                <span>⏱️ زمان مطالعه: {active.readMinutes} دقیقه</span>
                <span className={`border px-2 py-0.5 rounded-full ${acc.badge}`}>{active.category}</span>
              </div>
              <p className="text-xs text-slate-500 font-bold leading-7 text-right">{active.excerpt}</p>
            </header>

            {/* 📑 فهرست مطالب — برای مقاله‌های دارای حداقل ۲ سرفصل */}
            {toc.length >= 2 && (
              <nav className="bg-slate-50/80 border border-slate-100 rounded-2xl p-4 space-y-2" aria-label="فهرست مطالب">
                <p className="text-[10px] font-black text-slate-500">📑 فهرست این مقاله</p>
                <ol className="space-y-1">
                  {toc.map((h, n) => (
                    <li key={h.index}>
                      <button
                        onClick={() => document.getElementById(`blog-sec-${h.index}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                        className="text-[11px] font-bold text-slate-500 hover:text-slate-900 leading-6 text-right transition"
                      >
                        {n + 1}. {h.heading}
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {active.sections.map((sec, i) => (
              <section key={i} id={`blog-sec-${i}`} className="space-y-3 scroll-mt-6">
                {sec.heading && (
                  <h2 className={`text-base font-black ${acc.text} flex items-center gap-2`}>
                    <span className={`w-1.5 h-6 rounded-full bg-gradient-to-b ${acc.gradient}`} />
                    {sec.heading}
                  </h2>
                )}
                {(sec.paragraphs || []).map((p, j) => (
                  <p key={j} className="text-[13px] text-slate-600 font-bold leading-9 text-right">{p}</p>
                ))}
                {sec.list && (
                  <ul className="space-y-2.5">
                    {sec.list.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-[12px] text-slate-600 font-bold leading-7">
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 bg-gradient-to-br ${acc.gradient}`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {sec.callout && (
                  <div className={`border-r-4 rounded-2xl p-4 space-y-1.5 ${acc.callout}`}>
                    <p className="text-[11px] font-black">💡 {sec.callout.title}</p>
                    <p className="text-[12px] font-bold leading-7">{sec.callout.text}</p>
                  </div>
                )}
              </section>
            ))}

            <footer className="border-t border-slate-100 pt-5 space-y-5">
              <div className="flex flex-wrap gap-2">
                {active.keywords.map((k) => (
                  <span key={k} className="text-[9px] font-black bg-slate-50 text-slate-400 border border-slate-100 px-2.5 py-1 rounded-full">#{k}</span>
                ))}
              </div>

              {/* ✍️ باکس نویسنده (E-E-A-T) */}
              <div className="flex items-start gap-4 bg-gradient-to-l from-slate-50 to-white border border-slate-100 rounded-2xl p-5">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${acc.gradient} flex items-center justify-center text-2xl shrink-0 shadow-md`}>
                  ✍️
                </div>
                <div className="space-y-1">
                  <p className="text-[12px] font-black text-slate-800">تیم آموزش و مشاوره آکادمی ترنم همدلی</p>
                  <p className="text-[10px] text-slate-500 font-bold leading-6">
                    مشاوران کنکور و متخصصان روان‌شناسی یادگیری — محتوای این مقاله بر اساس منابع علمی معتبر و تجربه میدانی کار با داوطلبان رتبه‌برتر تدوین شده و هر دوره بازبینی تخصصی می‌شود.
                  </p>
                </div>
              </div>

              {/* 📚 منابع علمی */}
              {active.sources && active.sources.length > 0 && (
                <div className="border border-slate-100 rounded-2xl p-5 space-y-2.5 bg-white">
                  <p className="text-[11px] font-black text-slate-700">📚 منابع و مراجع علمی</p>
                  <ul className="space-y-1.5">
                    {active.sources.map((src, i) => (
                      <li key={i} className="text-[10px] text-slate-500 font-bold leading-5 flex gap-2">
                        <span className="text-slate-300 shrink-0 font-mono">{i + 1}.</span>
                        <span dir="auto">{src}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 🧩 ماژول‌های مرتبط در سایت */}
              {active.relatedModules && active.relatedModules.length > 0 && onNavigate && (
                <div className={`rounded-2xl p-5 space-y-3 border ${acc.callout}`}>
                  <p className="text-[11px] font-black">🧩 این مفاهیم را عملی اجرا کنید:</p>
                  <div className="flex flex-wrap gap-2">
                    {active.relatedModules.map((m) => (
                      <button
                        key={m.target}
                        onClick={() => onNavigate(m.target)}
                        className="bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 text-[11px] font-black px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition active:scale-95 flex items-center gap-2"
                      >
                        <span>{m.emoji}</span>
                        <span>{m.label}</span>
                        <span className="text-slate-400">←</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-slate-400 font-bold text-center pt-1">
                آکادمی ترنم همدلی — همراه گام‌به‌گام در مسیر یادگیری شما ❤️
              </p>
            </footer>
          </div>
        </article>

        {/* Related */}
        <div className="max-w-3xl mx-auto space-y-3">
          <h3 className="text-sm font-black text-slate-800 pr-1">مقالات مرتبط</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {related.map((a) => (
              <button
                key={a.slug}
                onClick={() => openArticle(a.slug)}
                className="text-right bg-white border border-slate-100 rounded-2xl p-4 hover:-translate-y-0.5 hover:shadow-lg transition group space-y-2"
              >
                <span className="text-2xl">{a.emoji}</span>
                <p className="text-[11px] font-black text-slate-800 leading-5 group-hover:text-indigo-600 line-clamp-2">{a.title}</p>
                <p className="text-[9px] font-bold text-slate-400">{a.category} • ⏱️ {a.readMinutes} دقیقه</p>
              </button>
            ))}
          </div>
        </div>

        {onNavigate && (
          <div className="text-center">
            <button onClick={() => onNavigate("welcome")} className="text-emerald-600 text-xs font-black hover:underline">
              بازگشت به پیشخوان
            </button>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------- Listing view (صفحه اصلی بلاگ)
  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 space-y-8" style={{ direction: "rtl" }}>
      {/* Header */}
      <div className="text-center bg-white border border-slate-100 rounded-[2.5rem] shadow-xl p-8 sm:p-10 space-y-4">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner ring-4 ring-emerald-50/50">
          <span className="text-3xl">✍️</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">وبلاگ آموزشی ترنم همدلی</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-bold max-w-lg mx-auto leading-relaxed">
          مقالات تخصصی مشاوره‌ای درباره روش مطالعه علمی، روانشناسی آزمون، تحلیل کارنامه و برنامه‌ریزی کایزن — هر مقاله بر پایه پژوهش‌های یادگیری و تجربه فنی مشاوران کنکور نوشته شده است.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`text-[11px] font-black px-4 py-2 rounded-full border transition ${
                categoryFilter === cat
                  ? "bg-slate-900 text-white border-slate-900 shadow-lg"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured (first article) */}
      {filtered.length > 0 && (
        <ArticleCard article={filtered[0]} featured onOpen={() => openArticle(filtered[0].slug)} />
      )}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 gap-5">
        {filtered.slice(1).map((a) => (
          <React.Fragment key={a.slug}>
            <ArticleCard article={a} onOpen={() => openArticle(a.slug)} />
          </React.Fragment>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-xs font-black text-slate-400 py-10">مقاله‌ای در این دسته‌بندی یافت نشد.</p>
      )}

      {onNavigate && (
        <div className="text-center">
          <button onClick={() => onNavigate("welcome")} className="text-emerald-600 text-xs font-black hover:underline">
            بازگشت به پیشخوان
          </button>
        </div>
      )}
    </div>
  );
}

function ArticleCard({
  article,
  featured = false,
  onOpen,
}: {
  article: BlogArticle;
  featured?: boolean;
  onOpen: () => void;
}) {
  const acc = ACCENTS[article.accent];
  return (
    <button
      onClick={onOpen}
      className={`w-full text-right bg-white border border-slate-100 rounded-[2rem] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden group ${
        featured ? "sm:flex" : "flex flex-col"
      }`}
    >
      <div className={`bg-gradient-to-tr ${acc.gradient} flex items-center justify-center relative shrink-0 ${featured ? "sm:w-64 h-36 sm:h-auto" : "h-32"}`}>
        <span className={featured ? "text-6xl" : "text-4xl"}>{article.emoji}</span>
        <span className="absolute top-4 right-4 text-[9px] font-black text-white/90 bg-white/15 backdrop-blur px-2.5 py-1 rounded-full border border-white/25">
          {article.category}
        </span>
        {featured && (
          <span className="absolute top-4 left-4 text-[9px] font-black bg-amber-400 text-amber-950 px-2.5 py-1 rounded-full">⭐ منتخب سردبیر</span>
        )}
      </div>
      <div className="p-6 space-y-3 flex-1">
        <h3 className={`font-black text-slate-900 ${acc.hoverText} transition-colors leading-6 ${featured ? "text-base" : "text-[13px]"}`}>
          {article.title}
        </h3>
        <p className="text-[11px] text-slate-500 font-bold leading-6 line-clamp-3">{article.excerpt}</p>
        <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-[9px] font-black text-slate-400">
          <span>📅 {article.date}</span>
          <span>⏱️ {article.readMinutes} دقیقه مطالعه</span>
          <span className={acc.text}>ادامه مطلب ←</span>
        </div>
      </div>
    </button>
  );
}
