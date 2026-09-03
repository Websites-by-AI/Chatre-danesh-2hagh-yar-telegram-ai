// ============================================================
//  ترنم مهر — حالت تمرین و آزمون (Practice/Quiz mode)
//  کاربر یک رشته و درس را انتخاب می‌کند، سوال‌ها را یکی‌یکی پاسخ
//  می‌دهد و پس از هر پاسخ، سال + درس + سختی + نوع + پاسخ صحیح
//  و توضیح را می‌بیند. امتیاز نگه‌داری می‌شود.
// ============================================================

const DATA_URL = "data/exams.json";
const STORAGE_IMPORTED = "taranom_exam_rag_imported_v1";
let POOL = [];        // سوالات انتخاب‌شده برای این دور
let IDX = 0;          // شماره سوال جاری
let SCORE = 0;        // تعداد پاسخ‌های درست
let ANSWERED = false; // آیا سوال فعلی پاسخ داده شده؟

const $ = (s) => document.querySelector(s);
const faNum = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const escapeHtml = (s = "") => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);
function loadImported() { try { return JSON.parse(localStorage.getItem(STORAGE_IMPORTED) || "[]"); } catch (_) { return []; } }
function unique(arr) { return [...new Set(arr.filter(Boolean))].sort(); }

let ALL = [];
async function loadData() {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  ALL = await res.json();
  const imp = loadImported();
  if (imp.length) ALL = ALL.concat(imp);
  // populate filters
  fill($("#pField"), unique(ALL.map((r) => r.field)), "همه رشته‌ها");
  fill($("#pSubject"), unique(ALL.map((r) => r.subject)), "همه دروس");
  fill($("#pDiff"), ["آسان", "متوسط", "سخت"], "همه سطوح");
}
function fill(sel, opts, label) {
  sel.innerHTML = `<option value="">${label}</option>` + opts.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("");
}

function startQuiz() {
  const f = $("#pField").value, s = $("#pSubject").value, d = $("#pDiff").value;
  const count = parseInt($("#pCount").value) || 5;
  POOL = ALL.filter((r) =>
    (!f || r.field === f) && (!s || r.subject === s) && (!d || r.difficulty === d)
  );
  if (POOL.length === 0) { alert("هیچ سوالی برای این فیلتر پیدا نشد."); return; }
  POOL = shuffle(POOL).slice(0, Math.min(count, POOL.length));
  IDX = 0; SCORE = 0;
  $("#setup").style.display = "none";
  $("#quiz").style.display = "block";
  renderQuestion();
}

function renderQuestion() {
  if (IDX >= POOL.length) { return finish(); }
  ANSWERED = false;
  const r = POOL[IDX];
  $("#progress").textContent = `سوال ${faNum(IDX + 1)} از ${faNum(POOL.length)} — امتیاز: ${faNum(SCORE)}`;
  $("#qSource").innerHTML = `<span class="badge year">📅 ${escapeHtml(r.source || "کنکور " + faNum(r.year))}</span>
    <span class="badge subj">📚 ${escapeHtml(r.subject)}</span>
    <span class="badge field">${escapeHtml(r.field)}</span>
    <span class="badge diff">⚡ ${escapeHtml(r.difficulty || "-")}</span>
    <span class="badge type">🏷️ ${escapeHtml(r.type || "-")}</span>`;
  $("#qText").textContent = r.question;
  // shuffle options so correct isn't always first
  const opts = shuffle(r.options || []);
  $("#qOptions").innerHTML = opts.map((o, i) =>
    `<button class="opt" data-opt="${escapeHtml(o)}">${faNum(i + 1)}) ${escapeHtml(o)}</button>`
  ).join("");
  $("#reveal").style.display = "none";
  $("#nextBtn").style.display = "none";
  $("#qOptions").querySelectorAll(".opt").forEach((btn) => btn.addEventListener("click", () => answer(btn, r)));
}

function answer(btn, r) {
  if (ANSWERED) return;
  ANSWERED = true;
  const chosen = btn.dataset.opt;
  const correct = r.answer;
  const isRight = chosen === correct;
  if (isRight) SCORE++;
  // mark options
  $("#qOptions").querySelectorAll(".opt").forEach((b) => {
    const v = b.dataset.opt;
    b.disabled = true;
    if (v === correct) b.classList.add("correct");
    else if (v === chosen) b.classList.add("wrong");
  });
  // reveal year/difficulty/type/explanation
  $("#revealHead").innerHTML = isRight
    ? `<span class="ok">✅ آفرین! پاسخ درست بود</span>`
    : `<span class="no">❌ پاسخ نادرست — پاسخ صحیح سبز است</span>`;
  $("#revealBody").innerHTML = `
    <div class="meta-row"><span>📅 سال و نوبت:</span><b>${escapeHtml(r.source || "کنکور " + faNum(r.year))} — نوبت ${escapeHtml(r.session || "-")}</b></div>
    <div class="meta-row"><span>📚 درس و رشته:</span><b>${escapeHtml(r.subject)} (${escapeHtml(r.field)})</b></div>
    <div class="meta-row"><span>📖 مبحث:</span><b>${escapeHtml(r.chapter || "-")}</b></div>
    <div class="meta-row"><span>⚡ درجه سختی:</span><b>${escapeHtml(r.difficulty || "-")}</b></div>
    <div class="meta-row"><span>🏷️ نوع سوال:</span><b>${escapeHtml(r.type || "-")}</b></div>
    <div class="meta-row"><span>📑 دفترچه / شماره:</span><b>${escapeHtml(r.booklet || "-")} — سوال ${faNum(r.qNo || 0)}</b></div>
    ${r.trapType ? `<div class="meta-row"><span>⚠️ تله تستی:</span><b>${escapeHtml(r.trapType)}</b></div>` : ""}
    ${r.explanation ? `<p class="expl">💡 ${escapeHtml(r.explanation)}</p>` : ""}
    ${r.sourceUrl ? `<a href="${escapeHtml(r.sourceUrl)}" target="_blank" rel="noopener" class="src-link">🔗 مشاهده دفترچه اصلی این سال (منبع رسمی)</a>` : ""}
    <div class="ai-box">
      <button id="aiBtn" class="ai-btn">🤖 بررسی هوش مصنوعی این سوال</button>
      <div id="aiOut" class="ai-out"></div>
    </div>`;
  $("#reveal").style.display = "block";
  $("#nextBtn").style.display = "inline-block";
  $("#nextBtn").textContent = IDX + 1 >= POOL.length ? "دیدن نتیجه 🏁" : "سوال بعدی ←";
  const aiBtn = $("#aiBtn");
  if (aiBtn) aiBtn.addEventListener("click", () => runAiAnalysis(r));
}

const AI_API = "https://taranom-psychology-school-10milion.vercel.app/api/chat";
async function runAiAnalysis(r) {
  const out = $("#aiOut");
  const btn = $("#aiBtn");
  if (!out) return;
  btn.disabled = true;
  out.innerHTML = '<span class="ai-loading">🤖 هوش مصنوعی در حال بررسی سوال است...</span>';
  try {
    const prompt = "این یک سوال کنکور است. تحلیل علمی کوتاه، دلیل درستی پاسخ صحیح و تله‌های تستی آن را به فارسی بگو.\n\nسوال: " + r.question + "\nگزینه‌ها: " + (r.options || []).join(" | ") + "\nپاسخ صحیح: " + r.answer;
    const resp = await fetch(AI_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: prompt, history: [] }) });
    const data = await resp.json();
    out.innerHTML = '<div class="ai-result">' + escapeHtml(data.reply || "پاسخی دریافت نشد.") + '</div>';
  } catch (err) {
    out.innerHTML = '<div class="ai-error">⚠️ هوش مصنوعی در دسترس نیست (احتمالاً کلید تنظیم نشده). از توضیح بالا استفاده کنید.</div>';
  }
  btn.disabled = false;
}

function next() { IDX++; renderQuestion(); }

function finish() {
  $("#quiz").style.display = "none";
  $("#result").style.display = "block";
  const pct = Math.round((SCORE / POOL.length) * 100);
  let msg = pct >= 80 ? "عالی! تسلط فوق‌العاده‌ای داری 🌟" : pct >= 50 ? "خوب بود، باز هم تمرین کن 💪" : "تلاش بیشتری لازم است، ادامه بده 🌱";
  $("#scoreText").innerHTML = `امتیاز تو: <b>${faNum(SCORE)} از ${faNum(POOL.length)}</b> (${faNum(pct)}٪)<br><span class="msg">${msg}</span>`;
}
function restart() { $("#result").style.display = "none"; $("#setup").style.display = "block"; }

async function init() {
  try { await loadData(); } catch (e) { $("#setup").innerHTML = "خطا در بارگذاری: " + escapeHtml(e.message); }
  $("#startBtn").addEventListener("click", startQuiz);
  $("#nextBtn").addEventListener("click", next);
  $("#restartBtn").addEventListener("click", restart);
}
document.addEventListener("DOMContentLoaded", init);
