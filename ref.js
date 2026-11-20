"use strict";
/* ===================== מילון, טבלאות ורגשות =====================
   • חיפוש: מושגים (גם מרווחים כמו "ספטימה"), וכל שורה בכל המצגות, עם קפיצה לשקף.
   • טבלאות: טבלת המרווחים בצבעים של המצגת + השקפים המקוריים של שאר הטבלאות.
   • רגשות: מה כל סולם / מרווח / אקורד / מודוס "נותן" – ציטוטים מדויקים מהשקפים. */

/* ---------- רגשות ותחושות (ציטוטים מדויקים; נבדקים אוטומטית מול תמלול השקפים) ---------- */
const FEEL = [
  { id: "major", name: "סולם מז'ור", en: "Major", color: "#e8a317", emoji: "☀️", feel: "שמח · רגוע · קופצני · צפוי", q: [
    [1, 9, "המז'ור בתרבות המערבית משויך לתחושות נעימות, רגועות, שמחות, קופצניות, נדושות, צפויות וכדומה. המז'ור נמצא בשימוש רב במוזיקה הפופולרית. נשמע אותו בנוסף בשירי חג, שירי ילדים, פרסומות, צלילי המתנה וכו'."],
    [4, 4, "באופן כללי נוטים לתאר את המז'ור כ\"שמח\" ומינור כ\"עצוב\"."],
    [11, 5, "\"שמחה, רוגע, קופצניות, פרסומות, מוזיקת ילדים...\" – מג'ור"]] },
  { id: "minor", name: "סולם מינור (טבעי)", en: "Natural minor", color: "#3b6fd1", emoji: "🌧️", feel: "עצוב · דרמטי · מרגש", q: [
    [6, 3, "סולם זה מאופיין בצליל \"עצוב\" יותר."],
    [11, 5, "\"בלדה, דרמה, ריגוש, עצב...\" – מינור"],
    [12, 6, "נגיד מינור הוא עצוב, מרגש..."]] },
  { id: "harm", name: "מינור הרמוני / מלודי", en: "Harmonic / Melodic minor", color: "#9b3fb5", emoji: "🕌", feel: "מזרחי · ספרדי · דרמטי", q: [
    [6, 17, "תוכלו ליצור אחלה של מוזיקה מזרחית/ ספרדית עם המינור ההרמוני"],
    [6, 14, "סקונדה זו נשמעה לאוזן של המוסיקאים המערבים כדבר מה שמזכיר את המזרח"]] },
  { id: "pentmaj", name: "פנטטוני מז'ור", en: "Major pentatonic", color: "#2e9e5b", emoji: "🌍", feel: "אפריקאי · סיני · בלוז/ג'אז", q: [
    [11, 7, "ניתן להשתמש בו בשביל לקבל גוון צליל של מוזיקה אפריקאית וסינית."]] },
  { id: "pentmin", name: "פנטטוני מינור", en: "Minor pentatonic", color: "#c0392b", emoji: "🎸", feel: "מגניב · עוצמתי · רוק/בלוז", q: [
    [11, 8, "לסולם גוון \"מגניב\" ועוצמתי."],
    [12, 6, "פנטטוני מינור הוא מגניב ועוצמתי"]] },
  { id: "dorian", name: "דורי", en: "Dorian", color: "#5d7fb8", emoji: "🌫️", feel: "מינור \"מרוכך\" · מוזר וחלומי · פאנק", q: [
    [15, 11, "דורי – מינור שהזריקו לו טיפה מג'ור, מינור \"מרוכך\". סאונד מוזר וחלומי, יעשו בו שימוש בבלדות מוזרות כמו MAD WORLD. מצד שני נעשה בו גם שימוש רב בFאנק ובפיוזן בצורה מרימה וקצבית."]] },
  { id: "phrygian", name: "פריגי", en: "Phrygian", color: "#8e2c2c", emoji: "💃", feel: "אפל · לא מערבי · ספרדי/מזרחי/מטאל", q: [
    [15, 11, "פריגי – מינור אפל יותר שהזריקו לתוכו תחושה לא מערבית (בגלל הסקונדה הקטנה בראשית הסולם). יעשו בו שימוש במוזיקה ספרדית, מזרחית, מטאל ועוד."]] },
  { id: "lydian", name: "לידי", en: "Lydian", color: "#17a2b8", emoji: "🚀", feel: "מוזר · הרפתקני · מפיח השראה", q: [
    [15, 12, "לידי – מג'ור שהזריקו לתוכו טריטון. למודוס סאונד מוזר, הרפתקני ומפיח השראה. עושים בסולם שימוש רב בהלחנות לסרטים וסדרות ובפרט לסרטי הרפתקאות (סימפסונס לדוגמא)"]] },
  { id: "mixo", name: "מיקסולידי", en: "Mixolydian", color: "#d9822b", emoji: "🤘", feel: "מג'ור עם טיפה מינוריות · בלוז · רוק שמח", q: [
    [15, 12, "מיקסולידי – מג'ור שהזריקו לו טיפה מגניבות, טיפה מינוריות. זאת נעשה על ידי ניטרול הleading tone, בכך קיבלנו גרסא פחות נדושה של מג'ור. שימוש רב יעשה בו בבלוז, ב\"רוק שמח\" ACDC, בפופ ועוד..."]] },
  { id: "modesall", name: "אאולי · איוניין · לוקריין", en: "Aeolian / Ionian / Locrian", color: "#6c757d", emoji: "🎼", feel: "מינור טבעי · מז'ור טבעי · מוקטן (יוצא דופן)", q: [
    [15, 9, "אאולי – סולם מינור טבעי"], [15, 9, "איוניין – סולם מג'ור טבעי"], [15, 9, "לוקריין – מוקטן (יוצא דופן)"],
    [15, 11, "הדבר המשמעותי ביותר שניתן להגיד על המודוסים זה כי הם מרחיבים משמעותית את היקף הרגשות והתחושות שאתם יכולים ליצור איתם!"]] },
  { id: "triads", name: "אקורדים משולשים", en: "Triads", color: "#b0124f", emoji: "🎹", feel: "מז'ור \"שמח\" · מינור \"עצוב\" · מוקטן/מוגדל \"מוזר/צורם\"", q: [
    [4, 6, "אקורד מז'ור \"שמח\""], [4, 5, "אקורד מינור \"עצוב\""], [4, 7, "אקורד מוקטן \"מוזר/צורם\""], [4, 8, "אקורד מוגדל \"מוזר/צורם\""]] },
  { id: "power", name: "אקורד כוח", en: "Power chord", color: "#444", emoji: "⚡", feel: "עוצמה · בהירות · יציב וכוחני", q: [
    [12, 5, "צמצום ההרמוניות מוביל לתחושה של עוצמה ובהירות אצל המאזינים."]] },
  { id: "sevenths", name: "ספטאקורדים", en: "Seventh chords", color: "#7b4fb0", emoji: "🌀", feel: "רגשות מורכבים · לא יציב · מתח", q: [
    [14, 5, "אקורדים אלו רווי הרמוניות וייצרו תחושות רגשיות מורכבות שנשענות על חוסר יציבות."],
    [14, 5, "רגשות מורכבים ולא יציבים, מתח רב, שלווה מוזרה של שמחעצוב"],
    [14, 11, "למז'ור שבע סאונד רגוע ונוגה."]] },
  { id: "ivl", name: "מרווחים", en: "Intervals", color: "#0f7b8a", emoji: "↔️", feel: "חלול · שמח/עצוב · מתח", q: [
    [7, 4, "טרצות וסקסטות– מרווחים הרמוניים– במצלול שלהם הם מרמזים על שמח או עצוב (טרצה וסקסטה קטנות נותנות תחושה של עצב ואילו טרצה וסקסטה גדולות תחושה של שמחה)."],
    [7, 4, "פרימה, קוורטה, קווינטה, אוקטבה– מרווחים חלולים- כלומר לא ניתן להבין דרכם אם מדובר באופי שמח או עצוב."],
    [3, 12, "Thirds מגדירות אופי מז'ור/מינור – שמח/עצוב."]] },
  { id: "degrees", name: "דרגות", en: "Degrees", color: "#a05a2c", emoji: "🧭", feel: "מתח · התרה · צבע", q: [
    [9, 2, "חלק מהדרגות יעציבו אותו, ישמחו אותו, יפחידו אותו, יצרו מתח באופן כללי ויפתרו אותו."],
    [10, 3, "בנוסף, במז'ור דרגה זאת יכולה לתת צבע עצוב ורצוי מאוד בסיפור על מז'ור, סיפור שלרוב יכול להישמע שמח, ילדותי וקופצני."]] },
];

/* ---------- חיפוש ---------- */
const REF_LETTERS = "אבגדהוזחטיכלמנסעפצקרשת".split("");
function refFirstLetter(t) { const x = t.replace(/^[^א-תA-Za-z]+/, ""); const c = x[0] || ""; return /[A-Za-z]/.test(c) ? "A–Z" : (c === "ך" ? "כ" : c === "ם" ? "מ" : c === "ן" ? "נ" : c === "ף" ? "פ" : c === "ץ" ? "צ" : c); }
function refEntries() { if (!KB) buildKB(); return KB.slice().sort((a, b) => a.title.replace(/^[^א-תA-Za-z]+/, "").localeCompare(b.title.replace(/^[^א-תA-Za-z]+/, ""), "he")); }
function refDefMatches(q) {
  if (!KB) buildKB(); const qn = nrm(q).trim(); const out = []; const seen = new Set(); const add = e => { if (!seen.has(e)) { seen.add(e); out.push(e); } };
  kbMatches(q).forEach(add);
  if (qn.length >= 2) {
    KB.forEach(e => { if (nrm(e.title + " " + (e.en || "")).includes(qn)) add(e); });
    const qt = toks(q); if (qt.length) KB.forEach(e => { if (e.aliases.some(a => qt.every(w => a.includes(w)))) add(e); });
    KB.forEach(e => { if (e.kind === "term" && e.quotes.some(x => nrm(x.q).includes(qn))) add(e); });
  }
  return out.slice(0, 12);
}
function hl(text, q) {
  const qn = q.trim(); if (qn.length < 2) return text;
  const i = text.indexOf(qn); if (i < 0) return text;
  return h("span", {}, text.slice(0, i), h("mark", {}, text.slice(i, i + qn.length)), text.slice(i + qn.length));
}
function entryCard(e, q) {
  const srcs = e.kind === "interval" ? e.srcs : [[e.quotes[0].l, e.quotes[0].s]];
  const card = h("div", { class: "card", style: "padding:10px 14px;margin:8px 0" });
  card.append(h("div", {}, h("b", {}, e.title), e.en ? h("span", { class: "muted ltr" }, " " + e.en) : null));
  if (e.kind === "interval") card.append(h("div", { html: e.html, style: "margin-top:4px" }));
  else card.append(h("div", { style: "margin-top:4px" }, hl(`"${e.quotes[0].q}"`, q || "")));
  card.append(h("div", { class: "row", style: "margin-top:6px" }, h("span", { class: "src" }, "מקור:"), ...srcs.map(([l, s]) => slideBtn(`שיעור ${l}, שקף ${s}`, l, s))));
  if (e.kind === "term" && e.quotes.length > 1) card.append(moreBox(e.quotes.slice(1).map(x => ({ l: x.l, s: x.s, q: x.q })), "עוד מהשקפים"));
  return card;
}
function entryFold(e) {
  const body = entryCard(e, ""); body.className = "fold-body"; body.removeChild(body.firstChild);
  return h("details", { class: "fold" }, h("summary", {}, h("b", {}, e.title), e.en ? h("span", { class: "muted ltr" }, " " + e.en) : null), body);
}
function lineRow(r, q) {
  return h("div", { style: "margin:8px 0;padding-bottom:8px;border-bottom:1px solid var(--line)" }, h("div", {}, hl(r.q, q)), h("div", { class: "row", style: "margin-top:4px" }, slideBtn(`שיעור ${r.l}, שקף ${r.s}`, r.l, r.s), h("span", { class: "src" }, LESSON_TITLES[r.l] || "")));
}
/* חיפוש מילה/צירוף בכל שורות המצגות: תחילה התאמה מדויקת של הטקסט, אחר כך לפי גזעים (סטימינג) */
function refLineSearch(q) {
  if (!LINES) buildLines(); const qn = nrm(q).trim(); const out = []; const seen = new Set();
  if (qn.length >= 2) LINES.forEach(x => { if (!seen.has(x.t) && nrm(x.t).includes(qn)) { seen.add(x.t); out.push({ l: x.l, s: x.s, q: x.t }); } });
  lineSearch(q, 40).forEach(r => { if (!seen.has(r.q)) { seen.add(r.q); out.push(r); } });
  return out;
}

function refSearchTab(app, arg) {
  const box = h("input", { class: "search", type: "search", placeholder: "חפש מושג או מילה בכל המצגות (למשל: ספטימה, טריטון, מיקסולידי)…", style: "direction:rtl;text-align:right;font-size:17px", autocomplete: "off", value: (arg && arg.q) || "" });
  const letters = h("div", { class: "row", style: "gap:6px;margin:10px 0" }); const res = h("div");
  let letter = "";
  function paintLetters() {
    letters.innerHTML = ""; const have = new Set(refEntries().map(e => refFirstLetter(e.title)));
    ["הכל", ...REF_LETTERS, "A–Z"].forEach(c => { const val = c === "הכל" ? "" : c; if (val && !have.has(val)) return; letters.append(h("button", { class: "pill lt" + (letter === val ? " on" : ""), "aria-pressed": letter === val ? "true" : "false", onclick: () => { letter = val; box.value = ""; paintLetters(); run(); } }, c)); });
  }
  let more = 10;
  function run() {
    res.innerHTML = ""; const q = box.value.trim();
    if (!q) { const es = refEntries().filter(e => !letter || refFirstLetter(e.title) === letter); res.append(h("p", { class: "muted" }, `${es.length} ערכים${letter ? ` באות ${letter}` : " במילון"} – או חפש למעלה בכל המצגות.`)); es.forEach(e => res.append(entryFold(e))); return; }
    const defs = refDefMatches(q); const lines = refLineSearch(q);
    if (defs.length) { res.append(h("h3", { style: "margin:12px 0 4px" }, `📖 מושגים ומרווחים (${defs.length})`)); defs.forEach(e => res.append(entryCard(e, q))); }
    res.append(h("h3", { style: "margin:16px 0 4px" }, `📄 מופיע בשקפים (${lines.length})`));
    if (!lines.length) res.append(h("p", { class: "muted" }, defs.length ? "לא נמצאו שורות נוספות." : "לא נמצא. נסה מילה אחרת, בלי ניקוד, או חלק מהמילה."));
    const holder = h("div"); res.append(holder);
    (function showMore() { holder.innerHTML = ""; lines.slice(0, more).forEach(r => holder.append(lineRow(r, q))); if (lines.length > more) holder.append(h("button", { class: "btn alt", onclick: () => { more += 15; showMore(); } }, `הצג עוד (${lines.length - more})`)); })();
  }
  let tm; box.addEventListener("input", () => { clearTimeout(tm); tm = setTimeout(() => { letter = ""; more = 10; paintLetters(); run(); }, 120); });
  app.append(h("div", { class: "card" }, h("h2", {}, "🔎 מילון וחיפוש בכל המצגות"), box, letters), res);
  paintLetters(); run(); if (arg && arg.q) setTimeout(() => { try { box.focus(); } catch (e) { } }, 50);
}

/* ---------- טבלאות ---------- */
function intervalTableHtml() {
  const d = CORPUS.find(x => x.l === 3 && x.s === 7); if (!d) return null;
  const rows = d.t.split("\n").filter(l => / \| /.test(l)).map(l => l.split("|").map(x => x.trim()).slice(0, 5));
  if (rows.length < 3) return null;
  const [head, ...body] = rows;
  const ltr = t => `<span class="ltr" style="direction:ltr;unicode-bidi:isolate;display:inline-block">${t}</span>`;
  return h("div", { class: "tblwrap" }, h("table", { class: "tbl-ivl", dir: "rtl" },
    h("tr", {}, ...head.map(c => h("th", {}, c))),
    ...body.map(r => { const dis = /דיסוננטי/.test(r[2]); const cls = dis ? "dis" : "con"; const perf = /מושלם/.test(r[2]);
      return h("tr", { class: cls }, h("td", {}, r[0]), h("td", { html: ltr(r[1] || "") }), h("td", {}, perf ? h("span", { class: "perf" }, r[2]) : r[2]), h("td", {}, r[3]), h("td", { html: ltr(r[4] || "") })); })));
}
const TABLE_SLIDES = [
  [3, 9, "טבלת המרווחים באנגלית (Interval Chart)"], [4, 14, "דרגות בסולם מז'ור"], [4, 15, "אקורדים בדרגות (מז'ור)"], [6, 8, "דרגות בסולם מינורי"], [6, 9, "הדרגות בסולם Cm"],
  [14, 7, "שייכות לסולם – ספטאקורדים על כל דרגה (מז'ור)"], [14, 8, "טבלת ספטים ושמותיהם (1)"], [14, 9, "טבלת ספטים ושמותיהם (2)"],
  [15, 6, "Relative Modes of C Major"], [15, 7, "טבלת המודוסים (Scale Mode / Notes / Formula)"], [15, 8, "המודוסים של C מז'ור – תווים, דרגות, שם ואקורד ספט"], [15, 10, "דרגות: סוג, שם ייעודי, ספרות רומיות"],
  [11, 11, "12 Bar Blues – הדרגות"], [11, 12, "12 Bar Blues – באקורדים (E)"], [2, 8, "יחידות מידה לתווים"], [2, 10, "תרשים עץ: ערכי תווים"], [13, 7, "Making arrangements – מבני שיר"], [1, 10, "סולם מז'ורי – המרווחים"],
];
function slideThumb(l, s, title) {
  const img = h("img", { alt: `${title} (שיעור ${l}, שקף ${s})`, class: "tbl-img", style: "min-height:180px;background:var(--line)" });
  const card = h("details", { class: "fold" }, h("summary", {}, title), h("div", { class: "row", style: "margin:6px 0" }, slideBtn(`שיעור ${l}, שקף ${s}`, l, s)), h("button", { class: "imgbtn", "aria-label": `פתח ${title}`, onclick: () => openSlide(l, s) }, img));
  let loaded = false;
  card.addEventListener("toggle", () => { if (!card.open || loaded) return; loaded = true; slidesLoad(l).then(u => { img.src = u[s - 1]; img.style.minHeight = ""; }).catch(() => { img.replaceWith(h("div", { class: "muted" }, "לא הצלחתי לטעון את השקף")); }); });
  return card;
}
function refTablesTab(app) {
  const it = intervalTableHtml();
  app.append(h("div", { class: "card" }, h("h2", {}, "📊 טבלאות – כמו במצגות"), h("p", { class: "muted" }, "הטבלאות מועתקות מהמצגות. בטבלת המרווחים הצבעים כמו במקור: ירוק = קונסוננטי, אדום = דיסוננטי, צהוב = קונסוננטי (מושלם). לחיצה על שקף פותחת אותו במלואו.")));
  if (it) app.append(h("div", { class: "card" }, h("div", { class: "row", style: "justify-content:space-between" }, h("h3", { style: "margin:0" }, "טבלת המרווחים (בעברית)"), slideBtn("שיעור 3, שקף 7", 3, 7)), it,
    h("div", { class: "row", style: "margin-top:8px" }, h("span", { class: "key con" }, "קונסוננטי"), h("span", { class: "key dis" }, "דיסוננטי"), h("span", { class: "key perf" }, "קונסוננטי (מושלם)"))));
  app.append(slideThumb(3, 7, "טבלת המרווחים – השקף המקורי"));
  TABLE_SLIDES.forEach(([l, s, t]) => app.append(slideThumb(l, s, t)));
}

/* ---------- רגשות ---------- */
function refFeelTab(app) {
  app.append(h("div", { class: "card" }, h("h2", {}, "🎭 איזה רגש כל סולם נותן"), h("p", { class: "muted" }, "ציטוטים מדויקים מהמצגות (הסבר המרצה: ההבחנה בין שמח לעצוב היא אישית ותלוית תרבות – ראה שיעור 4 שקף 4). כל ציטוט מקושר לשקף.")));
  FEEL.forEach(f => {
    const card = h("details", { class: "fold feel", style: `border-inline-start:6px solid ${f.color}` });
    card.append(h("summary", {}, h("span", { style: "font-size:22px" }, f.emoji + " "), h("b", {}, f.name), h("div", { class: "feel-tag", style: `background:${f.color}22;border:1px solid ${f.color}` }, f.feel)));
    f.q.forEach(([l, s, q]) => card.append(h("div", { style: "margin:8px 0" }, `"${q}" `, slideBtn(`שיעור ${l}, שקף ${s}`, l, s))));
    app.append(card);
  });
}

/* ---------- מסך ראשי ---------- */
function ref(app, arg) {
  const tabs = [["search", "🔎 מילון"], ["slides", "📚 מצגות"], ["tables", "📊 טבלאות"], ["feel", "🎭 רגשות"]]; const cur = (arg && arg.tab) || "search";
  app.append(h("div", { class: "seg", role: "tablist" }, ...tabs.map(([k, t]) => h("button", { class: "btn " + (k === cur ? "" : "alt"), role: "tab", "aria-selected": k === cur ? "true" : "false", onclick: () => go("ref", { tab: k }) }, t))));
  ({ search: refSearchTab, tables: refTablesTab, feel: refFeelTab, slides: slidesView })[cur](app, arg);
}
