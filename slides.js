"use strict";
/* ===================== מצגות השיעורים (שקפים מקוריים) =====================
   כל שקף הוא תמונה של המצגת המקורית. בגרסה המפורסמת הקבצים מוצפנים (אותו מפתח כמו שאר החומר) ונפתחים בדפדפן.
   openSlide(l, s) פותח את השקף בכל מקום באפליקציה; ה-viewer מכיל הקודם/הבא, החלקה, הגדלה, טקסט השקף ורשימת שקפי השיעור. */
const SLIDE_COUNT = { 1: 15, 2: 17, 3: 13, 4: 20, 5: 13, 6: 18, 7: 11, 9: 13, 10: 16, 11: 15, 12: 13, 13: 10, 14: 12, 15: 16 };
const LESSON_IDS = Object.keys(SLIDE_COUNT).map(Number);
const SL_CACHE = {};   // lesson -> Promise<string[]> (object URLs)

async function slidesFetchPack(name) {
  const encrypted = typeof ENC !== "undefined";
  const r = await fetch(`slides/${name}.${encrypted ? "bin" : (name === "summary" ? "pdf" : "pack")}`, { cache: "force-cache" });
  if (!r.ok) throw new Error("חסר קובץ " + name);
  const buf = await r.arrayBuffer();
  if (!encrypted) return buf;
  if (!window.SLIDE_KEY) throw new Error("אין מפתח");
  const u = new Uint8Array(buf); const iv = u.slice(0, 12), ct = u.slice(12);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, window.SLIDE_KEY, ct);
}
function slidesLoad(l) {
  if (!SL_CACHE[l]) SL_CACHE[l] = slidesFetchPack("L" + l).then(buf => {
    const dv = new DataView(buf); const n = dv.getUint32(0, true); const lens = []; for (let i = 0; i < n; i++) lens.push(dv.getUint32(4 + i * 4, true));
    let off = 4 + n * 4; const urls = [];
    for (const len of lens) { urls.push(URL.createObjectURL(new Blob([buf.slice(off, off + len)], { type: "image/webp" }))); off += len; }
    return urls;
  }).catch(e => { delete SL_CACHE[l]; throw e; });
  return SL_CACHE[l];
}
async function slidesOpenSummaryPdf() {
  try { const buf = await slidesFetchPack("summary"); const url = URL.createObjectURL(new Blob([buf], { type: "application/pdf" })); const w = window.open(url, "_blank"); if (!w) location.href = url; }
  catch (e) { alert("לא הצלחתי לפתוח את הסיכום: " + e.message); }
}
const slideTitle = l => `שיעור ${l} – ${LESSON_TITLES[l] || ""}`;
const slideText = (l, s) => { const d = CORPUS.find(x => x.l === l && x.s === s); return d ? d.t : ""; };

/* ---------- מציג השקפים (חלון מלא) ---------- */
let SV = null;
function openSlide(l, s, opts) {
  l = +l; s = Math.max(1, +s || 1); if (!SLIDE_COUNT[l]) return;
  if (SV) closeSlide();
  const st = { l, s, zoom: false, text: false, notes: !!(opts && opts.notes), grid: false, range: opts && opts.range || null };
  const ov = h("div", { id: "slideview", role: "dialog", "aria-modal": "true", "aria-label": "מציג שקפים" });
  const title = h("div", { class: "sv-title" }), counter = h("div", { class: "sv-count" });
  const stage = h("div", { class: "sv-stage" }), info = h("div", { class: "sv-info" });
  const btn = (txt, fn, cls, label) => h("button", { class: "btn alt " + (cls || ""), "aria-label": label || null, onclick: fn }, txt);
  const prev = btn("→ הקודם", () => go2(-1)), next = btn("הבא ←", () => go2(1));
  const zoomB = btn("🔍 הגדל", () => { st.zoom = !st.zoom; paint(); }), textB = btn("📝 טקסט", () => { st.text = !st.text; paint(); }), gridB = btn("🗂 כל השקפים", () => { st.grid = !st.grid; paint(); }), notesB = btn("💬 המרצה אמר", () => { st.notes = !st.notes; paint(); });
  const close = btn("✕ סגור", closeSlide, "sv-close", "סגור");
  const lessonSel = h("select", { class: "sv-sel", "aria-label": "בחר שיעור", onchange: e => { st.l = +e.target.value; st.s = 1; st.range = null; st.grid = false; paint(); } }, ...LESSON_IDS.map(i => h("option", { value: i, ...(i === l ? { selected: "selected" } : {}) }, `שיעור ${i}`)));
  ov.append(h("div", { class: "sv-top" }, close, h("div", { class: "sv-mid" }, title, counter), lessonSel), stage, info,
    h("div", { class: "sv-bar" }, prev, next), h("div", { class: "sv-bar" }, zoomB, textB, gridB, notesB));
  document.body.append(ov); document.body.style.overflow = "hidden"; SV = { ov, st };
  function go2(d) { const n = SLIDE_COUNT[st.l]; const t = st.s + d; if (t < 1) { const pl = LESSON_IDS[LESSON_IDS.indexOf(st.l) - 1]; if (pl) { st.l = pl; st.s = SLIDE_COUNT[pl]; st.range = null; } } else if (t > n) { const nl = LESSON_IDS[LESSON_IDS.indexOf(st.l) + 1]; if (nl) { st.l = nl; st.s = 1; st.range = null; } } else st.s = t; st.zoom = false; paint(); }
  async function paint() {
    const { l: L, s: S } = st; lessonSel.value = L; title.textContent = slideTitle(L); counter.textContent = `שקף ${S} מתוך ${SLIDE_COUNT[L]}` + (st.range ? ` · (מומלץ לקרוא שקפים ${st.range[0]}–${st.range[1]})` : "");
    zoomB.textContent = st.zoom ? "🔍 הקטן" : "🔍 הגדל"; textB.classList.toggle("on", st.text); notesB.classList.toggle("on", st.notes); gridB.classList.toggle("on", st.grid);
    stage.innerHTML = ""; info.innerHTML = ""; stage.className = "sv-stage" + (st.zoom ? " zoom" : "");
    if (st.notes) { const ns = (typeof NOTES !== "undefined" ? NOTES : []).filter(n => n.l === L); info.append(h("div", { class: "sv-text" }, h("b", {}, `💬 מה שהמרצה אמר – שיעור ${L}`), "\n\n", ns.length ? ns.map(n => n.t).join("\n\n— — —\n\n") : "(אין הערות לשיעור הזה)")); }
    if (st.text) info.append(h("div", { class: "sv-text" }, slideText(L, S) || "(אין טקסט לשקף)"));
    const loading = h("div", { class: "muted", style: "padding:30px;text-align:center" }, "טוען שקף…"); stage.append(loading);
    let urls; try { urls = await slidesLoad(L); } catch (e) { stage.innerHTML = ""; stage.append(h("div", { style: "padding:20px;text-align:center" }, "לא הצלחתי לטעון את השקפים: " + e.message, h("br"), h("button", { class: "btn", onclick: paint }, "נסה שוב"))); return; }
    if (!SV || SV.st !== st || st.l !== L || st.s !== S) return;   // המשתמש עבר הלאה בזמן הטעינה
    stage.innerHTML = "";
    if (st.grid) {
      const g = h("div", { class: "sv-grid" }, ...urls.map((u, i) => h("button", { class: "sv-th" + (i + 1 === S ? " cur" : ""), "aria-label": `שקף ${i + 1}`, onclick: () => { st.s = i + 1; st.grid = false; paint(); } }, h("img", { src: u, alt: `שקף ${i + 1}`, loading: "lazy" }), h("span", {}, String(i + 1)))));
      stage.append(g); stage.className = "sv-stage grid"; return;
    }
    const img = h("img", { src: urls[S - 1], alt: `${slideTitle(L)}, שקף ${S}`, class: "sv-img", draggable: "false" });
    img.addEventListener("dblclick", () => { st.zoom = !st.zoom; paint(); });
    stage.append(img);
    [-1, 1].forEach(d => { const t = SLIDE_COUNT[L], k = S + d; if (k >= 1 && k <= t) { const im = new Image(); im.src = urls[k - 1]; } });   // טעינה מראש של השקף הסמוך
  }
  let tx = null, ty = null;
  stage.addEventListener("touchstart", e => { if (st.zoom || e.touches.length !== 1) { tx = null; return; } tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  stage.addEventListener("touchend", e => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; tx = null; if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) go2(dx < 0 ? 1 : -1); }, { passive: true });
  SV.key = e => { if (e.key === "Escape") closeSlide(); else if (e.key === "ArrowLeft") go2(1); else if (e.key === "ArrowRight") go2(-1); };
  document.addEventListener("keydown", SV.key);
  history.pushState({ sv: 1 }, ""); SV.pop = () => { if (SV) closeSlide(true); }; window.addEventListener("popstate", SV.pop);
  paint(); close.focus();
}
function closeSlide(fromPop) {
  if (!SV) return; const { ov, key, pop } = SV; document.removeEventListener("keydown", key); window.removeEventListener("popstate", pop); ov.remove(); document.body.style.overflow = ""; SV = null;
  if (!fromPop && history.state && history.state.sv) history.back();
}

/* ---------- קישורי "שיעור X, שקף Y" בכל מקום ---------- */
/* מקבל טקסט כמו "שיעור 15, שקף 4–8 – תיאור" או "שיעור 6, שקף 8, 9" ומחזיר שורת כפתורים שפותחים את השקף */
function srcNode(text, prefix = "מקור: ") {
  const wrap = h("span", { class: "srcrow" }); if (prefix) wrap.append(prefix);
  const re = /שיעור\s*(\d+)(?:\s*,?\s*שק(?:פים|ף)\s*([\d–\-,\s]+?))?(?=\s*(?:–\s|$|\||\)|ו-?שיעור))(?:\s*–\s*([^|]*))?/g; let m, last = 0, any = false;
  const t = String(text);
  while ((m = re.exec(t))) {
    any = true; if (m.index > last) wrap.append(t.slice(last, m.index));
    const l = +m[1]; const nums = (m[2] || "").split(",").map(x => x.trim()).filter(Boolean);
    if (!nums.length) wrap.append(slideBtn(`שיעור ${l}`, l, 1));
    else nums.forEach(n => { const rg = /^(\d+)\s*[–-]\s*(\d+)$/.exec(n); const first = rg ? +rg[1] : +n; wrap.append(slideBtn(`שיעור ${l}, שקפ${rg ? "ים" : "ף"} ${n}`, l, first, rg ? [+rg[1], +rg[2]] : null)); });
    if (m[3]) wrap.append(" – " + m[3].trim());
    last = re.lastIndex; if (re.lastIndex === m.index) re.lastIndex++;
  }
  if (!any) wrap.append(t); else if (last < t.length) wrap.append(t.slice(last));
  return wrap;
}
function slideBtn(label, l, s, range) { return h("button", { class: "pill sref", "aria-label": `פתח ${label}`, onclick: e => { e.stopPropagation(); openSlide(l, s, range ? { range } : null); } }, "📄 " + label); }

/* ---------- ספריית המצגות ---------- */
function slidesView(app, arg) {
  app.append(h("div", { class: "card" }, h("h2", {}, "📚 מצגות השיעורים"), h("p", { class: "muted" }, "השקפים המקוריים של כל השיעורים (1–15, ללא שיעור 8). לחיצה על שיעור פותחת אותו; מכל שאלה, מושג או תשובת צ'אט אפשר לקפוץ ישר לשקף."),
    h("div", { class: "row" }, h("button", { class: "btn alt", onclick: slidesOpenSummaryPdf }, "📕 הסיכום המלא (PDF)"))));
  const grid = h("div", { class: "grid" });
  LESSON_IDS.forEach(l => grid.append(h("button", { class: "tile", onclick: () => openSlide(l, 1) }, h("b", {}, `שיעור ${l}`), h("small", {}, LESSON_TITLES[l] || ""), h("small", {}, `${SLIDE_COUNT[l]} שקפים`))));
  app.append(grid);
}
