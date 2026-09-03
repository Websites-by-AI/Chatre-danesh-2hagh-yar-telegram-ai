/**
 * startupCallAnswers — پاسخ‌های آماده (انگلیسی، قابل کپی) برای فرم هر فراخوان.
 * متقاضی: soheil.power@gmail.com | +1-208-5033653
 * استارتاپ: Taranom Hamdeli (hamdeltar.ir) — Persian AI study-counseling platform
 */

export interface FilledField {
  field: string;      // نام فیلد فرم (به فارسی برای UI)
  value: string;      // پاسخ آماده copy-paste (انگلیسی)
}

export const COMMON_PROFILE = {
  startupName: "Taranom Hamdeli",
  website: "https://hamdeltar.ir",
  oneLiner:
    "Taranom Hamdeli is an AI-powered study-counseling platform for Iranian university-entrance (Konkur) students, combining a Persian RAG engine over 1,886 real exam questions with live counselor-student study-plan syncing.",
  problem:
    "Over 1 million Iranian students take the Konkur exam each year, but quality study counseling is expensive and concentrated in big cities. Families pay up to $2,000/year for human counselors; most students get no personalized planning at all.",
  solution:
    "A bilingual (Persian-first) web platform where certified counselors build weekly study plans that sync live to students' dashboards, an AI advisor (Llama-3.3-70B + custom Persian RAG with 96.2% year-detection accuracy over 1,886 official exam questions) answers subject questions with real past-exam grounding, and Telegram/Bale bots deliver daily practice quizzes.",
  traction:
    "Live production at hamdeltar.ir on Cloudflare (D1 + Workers). Working RAG Space on Hugging Face (1,886 questions, 21 official exam-booklet PDFs, 7 years coverage). Telegram bot live with interactive real-exam quizzes. Payment gateway (Zarinpal) integrated. Early users onboarded for real-user testing.",
  market:
    "TAM: ~1M Konkur candidates/year in Iran (~$400M spent on prep). SAM: Persian-speaking students globally (Iran, Afghanistan, Tajikistan diaspora). Expansion: white-label exam-RAG for other national exams (Turkey YKS, India NEET).",
  team:
    "Founder: Soheil (soheil.power@gmail.com, +1-208-5033653) — product & full-stack development; built the entire platform (React/TypeScript, Cloudflare Workers/D1, HF Spaces, TF-IDF/RAG pipeline). Actively recruiting a technical co-founder (AI/NLP) and a growth co-founder.",
  ask:
    "Seeking acceptance to validate internationally, structure the company outside Iran (UAE/Turkey entity), access mentorship on B2C EdTech monetization, and raise pre-seed funding.",
  legalNote:
    "Team currently based in Iran; no visa/PR for US/Canada. Prefer remote programs or Iran-accessible hubs (Turkey visa-free, UAE easy visa). Willing to incorporate in ADGM (Abu Dhabi) or Turkey upon acceptance.",
};

export const FILLED_FORMS: Record<string, FilledField[]> = {
  eaai27: [
    { field: "عنوان مقاله", value: "TaranomRAG: A Lightweight Persian Retrieval-Augmented System for University-Entrance Exam Counseling — an Experience Report from Production" },
    { field: "چکیده (~۲۰۰ کلمه)", value: "We present an experience report on deploying a retrieval-augmented generation (RAG) system for Konkur (Iranian university-entrance exam) preparation, serving students on a production counseling platform. Our system indexes 1,886 official exam questions spanning five academic tracks and two exam sessions (2021-2025 / Persian years 1400-1404), plus 21 official exam-booklet PDFs recovered from public archives. A character-bigram TF-IDF retriever with Persian-specific normalization (ZWNJ handling, Arabic/Persian character unification, digit folding) achieves 96.2% exam-year identification and 63.8% subject identification in leave-one-out evaluation — up from 15% year accuracy at the project's start with a 62-question bank, demonstrating the outsized effect of official-data curation over model complexity in low-resource languages. The retriever grounds a Llama-3.3-70B advisor that answers student questions with citations to real past-exam items, and feeds interactive quiz bots on Telegram and Bale (Iran's domestic messenger). We report design decisions forced by real constraints: serverless-only infrastructure, sanctions-related API limitations, low-bandwidth mobile users, and counselor-in-the-loop study planning. We discuss K-12 classroom implications: teachers use the same RAG bank to compose trap-aware practice sets. All the question bank and evaluation artifacts are publicly available on Hugging Face." },
    { field: "نویسندگان و ایمیل", value: "Soheil [LAST NAME], Independent Researcher / Taranom Hamdeli, soheil.power@gmail.com" },
    { field: "ترک (Main یا K-12)", value: "AI Education in K-12 Track (primary) — fallback: Main Track as Experience Report" },
    { field: "نوع (پژوهشی/گزارش تجربه)", value: "Experience Report" },
    { field: "PDF مقاله (فرمت AAAI)", value: "Use AAAI 2027 author kit (2-column). 6 pages + references. Structure: 1) Motivation & context, 2) System (RAG pipeline, Persian normalization), 3) Data curation (62→1,886 questions, PDF archive), 4) Evaluation (LOO year/subject accuracy table v1-v4), 5) Deployment lessons (Iran constraints), 6) K-12 classroom use." },
  ],
  yc: [
    { field: "توضیح یک‌خطی استارتاپ", value: "AI study-counselor for the 1M students who take Iran's national university-entrance exam every year." },
    { field: "ویدیو ۱ دقیقه‌ای بنیان‌گذاران", value: "Script: (0-10s) 'Hi, I'm Soheil, founder of Taranom Hamdeli.' (10-30s) Problem: counseling costs $2,000/yr, most of 1M yearly Konkur students get none. (30-45s) Demo screen-capture: counselor edits plan → student dashboard updates live; AI answers with real past-exam citations. (45-60s) Traction: live product, 1,886-question RAG at 96% year accuracy, Telegram bot, payments integrated. 'We're applying to build this for every national exam in the region.'" },
    { field: "ترکشن و کاربران", value: "Production platform live at hamdeltar.ir (Cloudflare). Persian exam-RAG public on Hugging Face: 1,886 official questions, 21 exam PDFs, 96.2% retrieval accuracy. Interactive Telegram quiz bot live. Zarinpal payments integrated. Currently onboarding first paid cohort; pre-revenue." },
    { field: "چرا این تیم؟", value: "Solo technical founder who shipped the entire stack alone in months under sanctions constraints: React/TS frontend, Cloudflare Workers/D1 backend, RAG pipeline, dual messenger bots, payment integration. Deep domain knowledge of Konkur prep market. Actively recruiting an AI/NLP co-founder (YC notes solo founders face a higher bar — recruitment in progress via platform banner)." },
    { field: "مدل درآمد", value: "B2C subscription (student plans ~$5-15/mo, 10x cheaper than human counselors); B2B2C license to counseling centers and schools; white-label exam-RAG for other national exams (Turkey YKS, India NEET) later." },
    { field: "اطلاعات هم‌بنیان‌گذاران", value: "Founder: Soheil — soheil.power@gmail.com — +1-208-5033653 — based in Iran, no US visa yet (YC assists with visas for the batch; alternatively remote-first participation history exists). Incorporation plan: Delaware C-Corp or ADGM entity upon acceptance." },
  ],
  masschallenge: [
    { field: "پروفایل استارتاپ", value: "Taranom Hamdeli — AI-powered exam counseling for Persian-speaking students. hamdeltar.ir. Founded 2025-26. HQ: Tehran, Iran (entity formation in UAE/Turkey planned). Sector: EdTech / AI. Stage: MVP live in production, pre-revenue." },
    { field: "مرحله و ترکشن", value: "Product live in production; RAG engine public on Hugging Face (1,886 official exam questions, 96.2% year-ID accuracy); Telegram bot live; payments integrated; first user cohort onboarding. Capital raised: $0 (bootstrapped) — well under the CHF 2M cap." },
    { field: "سرمایه جذب‌شده (<۲M CHF)", value: "CHF 0 — fully bootstrapped. No annual sales yet (pre-revenue) — under the CHF 2M sales cap." },
    { field: "ویدیو پیچ", value: "60-90s: problem (counseling inequality for 1M students/yr) → live demo (counselor→student sync + AI with real-exam citations) → traction metrics → social impact framing (democratizing education access — aligns with MassChallenge social-value requirement) → ask (network, validation, equity-free prize)." },
    { field: "تیم", value: "Soheil (founder, full-stack + AI) — soheil.power@gmail.com, +1-208-5033653. Note for travel: two short Switzerland bootcamps require Schengen short-stay visa from Iran — feasible with invitation letter from MassChallenge." },
  ],
  itucekirdek: [
    { field: "فرم آنلاین استارتاپ", value: "Startup: Taranom Hamdeli | Sector: EdTech-AI | Stage: MVP live | Country: Iran (Turkey-accessible, no visa needed) | Web: hamdeltar.ir | Contact: soheil.power@gmail.com, +1-208-5033653" },
    { field: "پیچ‌دک", value: "10 slides: 1 Problem (1M Konkur students, $400M prep market, counseling inequality) 2 Solution (AI counselor + live plan sync) 3 Product demo screenshots 4 RAG tech (1,886 Qs, 96.2%) 5 Market (Iran→Turkey YKS is the same pain!) 6 Business model (subscription) 7 Traction 8 Roadmap (Turkish YKS RAG as expansion — strong ITU fit) 9 Team 10 Ask." },
    { field: "دمو محصول", value: "Live: hamdeltar.ir (counselor demo: counselor@hamdeltar.ir) + RAG Space: sosa123454321-taranom-exam-rag.static.hf.space + Telegram bot @taranom_hamdeli_bot" },
    { field: "تیم", value: "Soheil — solo technical founder (recruiting co-founder). Willing to travel to Istanbul (visa-free for Iranians) for Big Bang and onsite phases." },
    { field: "مصاحبه حضوری/آنلاین", value: "Available for online interview any time; can attend Istanbul in person with ~1 week notice (no visa required)." },
  ],
  hub71: [
    { field: "پیچ‌دک", value: "Same 10-slide deck as ITU, with slide 8 replaced by MENA expansion: Arabic-language exam RAG (UAE EmSAT, Saudi Qiyas) — positions Taranom as the regional exam-AI layer, built from Abu Dhabi." },
    { field: "ترکشن و درآمد", value: "Live product + public RAG (1,886 Qs / 96.2%) + Telegram bot + integrated payments. Pre-revenue; first paid cohort onboarding. Bootstrapped." },
    { field: "برنامه استقرار در ابوظبی", value: "Founder relocates to Abu Dhabi within 60 days of acceptance (UAE visa straightforward for Iranian citizens; Hub71 sponsors visas). Iran team continues remote engineering; Abu Dhabi becomes commercial HQ for MENA." },
    { field: "ثبت شرکت در ADGM پس از پذیرش", value: "Commit to incorporating in ADGM immediately upon acceptance — this also unblocks US-sanctioned services (NVIDIA Inception, Stripe, etc.) for the company." },
    { field: "تیم", value: "Soheil (founder) — soheil.power@gmail.com, +1-208-5033653. Hiring 1 AI engineer + 1 growth lead from Hub71 talent pool after landing." },
  ],
  fi: [
    { field: "فرم ثبت‌نام", value: "Name: Soheil | Email: soheil.power@gmail.com | Phone: +1-208-5033653 | City: Tehran (select Virtual chapter, or Dubai/Istanbul chapter) | Startup: Taranom Hamdeli, EdTech-AI, MVP live" },
    { field: "آزمون استعداد کارآفرینی (رایگان)", value: "Free ~1hr online psychometric test — no preparation needed; taken after form submission. FI admits based on aptitude score, not idea stage." },
    { field: "ایده استارتاپ", value: "AI-powered exam counseling platform for Persian-speaking students; live at hamdeltar.ir; expanding to a multi-country national-exam AI layer." },
    { field: "رزومه", value: "Solo founder who built and shipped: React/TS PWA, Cloudflare Workers/D1 backend, Persian RAG (96.2% accuracy, public on HF), Telegram/Bale bots, Zarinpal payments — all in production." },
  ],
  "1m1m": [
    { field: "پروفایل استارتاپ", value: "Taranom Hamdeli — hamdeltar.ir — AI exam-counseling, Iran/MENA. Bootstrapped, pre-revenue, MVP live with public RAG engine." },
    { field: "مرحله فعلی", value: "Post-MVP, pre-revenue. Goal with 1Mby1M: pricing strategy + first $100K ARR playbook without dilution." },
    { field: "اشتراک برنامه", value: "Start with free trial / basic tier; upgrade after first revenue. Fully remote from Iran — no restrictions." },
  ],
  freshmango: [
    { field: "ایده/محصول", value: "Taranom Hamdeli (hamdeltar.ir): AI study-counselor + Persian exam RAG (1,886 official questions, 96.2% accuracy), live in production with bots and payments." },
    { field: "تیم و اهداف", value: "Solo technical founder (Soheil, soheil.power@gmail.com, +1-208-5033653). Goals: investor-ready deck, co-founder matching, pre-seed intro." },
    { field: "مرحله فعلی", value: "MVP live, first users onboarding, pre-revenue, bootstrapped." },
  ],
  seedstars: [
    { field: "پروفایل استارتاپ", value: "Taranom Hamdeli — EdTech-AI for emerging markets. Iran-based (Seedstars' core geography). hamdeltar.ir." },
    { field: "پیچ‌دک", value: "Emerging-market framing: education access inequality; $400M Iran prep market as beachhead; regional expansion (Turkey/MENA/Central Asia national exams)." },
    { field: "ترکشن", value: "Live product; public RAG (1,886 Qs, 96.2%); Telegram bot; payments live; first cohort onboarding." },
    { field: "ویدیو پیچ", value: "Reuse the 60-90s MassChallenge video with emerging-markets impact framing." },
  ],
  nvidia: [
    { field: "پروفایل شرکت", value: "⚠️ DO NOT register from an Iranian entity or Iranian IP — US sanctions. Register AFTER incorporating in ADGM (via Hub71) or Turkey. Company: Taranom Hamdeli FZ-LLC (or Turkish AS), AI-EdTech." },
    { field: "حوزه AI", value: "Generative AI / RAG — retrieval-augmented tutoring for national exams; Persian + planned Arabic/Turkish corpora." },
    { field: "وب‌سایت محصول", value: "hamdeltar.ir (+ international landing page in English recommended before applying — can be added as hamdeltar.ir/en)" },
    { field: "ایمیل شرکتی", value: "Use a domain email (e.g. info@hamdeltar.ir via Cloudflare Email Routing — pending your Gmail verification) — NOT a Gmail address." },
  ],
};

/** متن کامل ایمیل جزئیات همه فرم‌های پرشده (برای دکمه «ارسال همه به ایمیل من») */
export function buildAllFormsEmailBody(): string {
  const lines: string[] = [
    "پاسخ‌های آماده فرم‌های ۱۰ فراخوان استارتاپی — Taranom Hamdeli",
    `متقاضی: soheil.power@gmail.com | +1-208-5033653`,
    "",
    "=== پروفایل مشترک (برای همه فرم‌ها) ===",
    `One-liner: ${COMMON_PROFILE.oneLiner}`,
    `Problem: ${COMMON_PROFILE.problem}`,
    `Solution: ${COMMON_PROFILE.solution}`,
    `Traction: ${COMMON_PROFILE.traction}`,
    `Market: ${COMMON_PROFILE.market}`,
    `Team: ${COMMON_PROFILE.team}`,
    `Ask: ${COMMON_PROFILE.ask}`,
    `Visa note: ${COMMON_PROFILE.legalNote}`,
    "",
  ];
  for (const [callId, fields] of Object.entries(FILLED_FORMS)) {
    lines.push(`=== ${callId.toUpperCase()} ===`);
    for (const f of fields) lines.push(`--- ${f.field} ---`, f.value, "");
  }
  return lines.join("\n");
}
