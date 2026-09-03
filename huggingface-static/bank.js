// ============================================================
//  ترنم مهر — وب‌اپ بانک سوالات کنکور
//  از data/exams.json روی RAG Space می‌خواند و امکان فیلتر بر اساس
//  رشته، درس و سال را می‌دهد. وقتی موضوعی انتخاب شود، همه‌ی سوالات
//  کنکور آن موضوع نمایش داده می‌شود.
// ============================================================

const DATA_URL = "data/exams.json";
const STRUCT_URL = "data/konkur-structure.json";
const STORAGE_IMPORTED = "taranom_exam_rag_imported_v1";

let EXAMS = [];
const $ = (s) => document.querySelector(s);
const faNum = (n) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[d]);
const escapeHtml = (s = "") => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function loadImported() { try { return JSON.parse(localStorage.getItem(STORAGE_IMPORTED) || "[]"); } catch (_) { return []; } }

function unique(arr) { return [...new Set(arr.filter(Boolean))].sort(); }

function buildFilters() {
  const fields = unique(EXAMS.map((r) => r.field));
  const subjects = unique(EXAMS.map((r) => r.subject));
  const years = unique(EXAMS.map((r) => r.year)).sort();

  const fill = (sel, opts, label) => {
    sel.innerHTML = `<option value="">${label} (همه)</option>` + opts.map((o) => `<option value="${escapeHtml(o)}">${escapeHtml(o)}</option>`).join("");
  };
  fill($("#fField"), fields, "رشته");
  fill($("#fSubject"), subjects, "درس");
  fill($("#fYear"), years, "سال");
}

function applyFilters() {
  const f = $("#fField").value, s = $("#fSubject").value, y = $("#fYear").value, q = ($("#fSearch").value || "").trim().toLowerCase();
  let res = EXAMS;
  if (f) res = res.filter((r) => r.field === f);
  if (s) res = res.filter((r) => r.subject === s);
  if (y) res = res.filter((r) => r.year === y);
  if (q) res = res.filter((r) => (r.question + " " + (r.options || []).join(" ")).toLowerCase().includes(q));
  renderResults(res);
}

function renderResults(list) {
  $("#count").textContent = faNum(list.length);
  if (list.length === 0) {
    $("#list").innerHTML = `<div class="empty">❌ هیچ سوالی برای این فیلتر یافت نشد.</div>`;
    return;
  }
  $("#list").innerHTML = list.map((r, i) => {
    const opts = (r.options || []).map((o, idx) =>
      `<li class="${o === r.answer ? "correct" : ""}">${faNum(idx + 1)}) ${escapeHtml(o)} ${o === r.answer ? "✓" : ""}</li>`
    ).join("");
    return `
      <div class="qcard">
        <div class="qhead">
          <span class="qnum">${faNum(i + 1)}</span>
          <span class="badge year">📅 ${escapeHtml(r.source || "کنکور " + faNum(r.year))}</span>
          <span class="badge subj">📚 ${escapeHtml(r.subject)}</span>
          <span class="badge field">${escapeHtml(r.field)}</span>
        </div>
        <p class="qtext">«${escapeHtml(r.question)}»</p>
        ${opts ? `<ol class="opts">${opts}</ol>` : ""}
        ${r.answer ? `<p class="ans">✅ پاسخ صحیح: <b>${escapeHtml(r.answer)}</b></p>` : ""}
        ${r.explanation ? `<p class="exp">💡 ${escapeHtml(r.explanation)}</p>` : ""}
      </div>`;
  }).join("");
}

function renderStructure(struct) {
  const el = $("#struct");
  if (!el || !struct) return;
  const tabs = [["tajrobi", "تجربی"], ["riazi", "ریاضی"], ["ensani", "انسانی"]];
  let html = `<div class="struct-tabs">${tabs.map(([k, n], i) => `<button class="sttab ${i === 0 ? "active" : ""}" data-key="${k}">${n}</button>`).join("")}</div>`;
  const renderField = (key) => {
    const t = struct[key];
    let h = `<div class="struct-total">مجموع اختصاصی: <b>${faNum(t.totalSpecific)}</b> سوال</div>`;
    for (const b of t.booklets) {
      h += `<div class="booklet"><div class="booklet-name">${escapeHtml(b.name)} <span>(${faNum(b.time)} دقیقه)</span></div>`;
      for (const s of b.subjects) h += `<div class="booklet-subj"><span>${escapeHtml(s.subject)}</span><b>${faNum(s.count)} سوال ${s.coefficient && s.coefficient !== "-" ? "(ضریب " + faNum(s.coefficient) + ")" : ""}</b></div>`;
      h += `</div>`;
    }
    return h;
  };
  const all = {};
  for (const [k] of tabs) all[k] = renderField(k);
  html += `<div id="structBody">${all["tajrobi"]}</div>`;
  el.innerHTML = html;
  el.querySelectorAll(".sttab").forEach((btn) => {
    btn.addEventListener("click", () => {
      el.querySelectorAll(".sttab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      $("#structBody").innerHTML = all[btn.dataset.key];
    });
  });
}

async function init() {
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    EXAMS = await res.json();
    const imported = loadImported();
    if (imported.length) EXAMS = EXAMS.concat(imported);
    buildFilters();
    applyFilters();
    $("#loaded").textContent = faNum(EXAMS.length);
  } catch (e) {
    $("#list").innerHTML = `<div class="empty">⚠️ خطا در بارگذاری بانک: ${escapeHtml(e.message)}</div>`;
  }
  try {
    const sres = await fetch(STRUCT_URL, { cache: "no-store" });
    if (sres.ok) renderStructure(await sres.json());
  } catch (_) {}
  ["#fField", "#fSubject", "#fYear"].forEach((s) => $(s).addEventListener("change", applyFilters));
  $("#fSearch").addEventListener("input", applyFilters);
  $("#clearBtn").addEventListener("click", () => {
    $("#fField").value = $("#fSubject").value = $("#fYear").value = $("#fSearch").value = "";
    applyFilters();
  });
}

document.addEventListener("DOMContentLoaded", init);
