"use strict";
/* ===================== כלי עזר ===================== */
const $ = (s, r = document) => r.querySelector(s);
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const k in (attrs || {})) {
    if (k === "class") e.className = attrs[k];
    else if (k === "html") e.innerHTML = attrs[k];
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== undefined && attrs[k] !== null) e.setAttribute(k, attrs[k]);
  }
  for (const c of kids.flat()) if (c !== null && c !== undefined && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c)));
  return e;
}
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function weightedPick(items, wf) { const ws = items.map(wf); let r = Math.random() * ws.reduce((a, b) => a + b, 0); for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; }
const L = s => `<span class="ltr">${s}</span>`;
const fmtNote = n => n.replace(/##/g, "𝄪").replace(/bb/g, "𝄫").replace(/#/g, "♯").replace(/b/g, "♭");
const NL = n => L(fmtNote(n));            // הצגת תו
const NLs = a => L(a.map(fmtNote).join(" "));

/* ===================== תאוריה: תווים, סולמות, מרווחים ===================== */
const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NAT = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function parse(n) { const m = /^([A-G])(##|bb|#|b)?$/.exec(n); return { l: m[1], a: m[2] === "#" ? 1 : m[2] === "b" ? -1 : m[2] === "##" ? 2 : m[2] === "bb" ? -2 : 0 }; }
function pc(n) { const p = parse(n); return ((NAT[p.l] + p.a) % 12 + 12) % 12; }
const accStr = a => a === 0 ? "" : a === 1 ? "#" : a === -1 ? "b" : a === 2 ? "##" : "bb";
function spell(root, steps, semis, dbl) {
  const p = parse(root), letter = LETTERS[(LETTERS.indexOf(p.l) + steps) % 7];
  const target = (pc(root) + semis) % 12;
  let acc = ((target - NAT[letter]) % 12 + 12) % 12; if (acc > 6) acc -= 12;
  if (Math.abs(acc) > (dbl ? 2 : 1)) return null;
  return letter + accStr(acc);
}
function normNote(t) { t = t.trim().replace(/♯/g, "#").replace(/♭/g, "b"); if (!t) return ""; return t[0].toUpperCase() + t.slice(1).replace(/B(?=$)/, "b").replace(/B/g, "b"); }
function normList(s) { return s.replace(/,/g, " ").split(/\s+/).filter(Boolean).map(x => { x = x.replace(/♯/g, "#").replace(/♭/g, "b"); return x[0].toUpperCase() + x.slice(1).replace(/B/g, "b"); }); }
const GEN_HE = { intTones: "כמה טונים במרווח", intName: "זיהוי מרווח בין שני תווים", intFind: "מציאת תו לפי מרווח", intType: "קונסוננטי/דיסוננטי", intChar: "אופי המרווחים", majNotes: "תווי סולם מז'ור", majDegree: "דרגה בסולם מז'ור", majFormula: "נוסחאות מרווחים", minNotes: "תווי סולמות מינור", minFacts: "מינור הרמוני/מלודי", stableTones: "צלילים יציבים", triadQ: "סוגי אקורדים משולשים", degChord: "אקורד בדרגה (מז'ור)", degName: "שמות הדרגות", degMin: "דרגות במינור", minChord: "אקורד בדרגה (מינור)", chordNotes: "תווי אקורד", chordFacts: "אקורדים והיפוכים", sevHow: "בניית ספטאקורדים", sevDegreeMaj: "ספטאקורדים בדרגות", sevIVminor: "ספטאקורד על דרגה IV", sevNotes: "תווי ספטאקורד", sevFacts: "ספטאקורדים – עובדות", funcRole: "תפקידי דרגות", cadenceDef: "קדנצות והגדרות", progression: "מהלכי דרגות", modeDesc: "תיאור מודוסים", modeFromC: "מודוסים של C מז'ור", modeNotes: "תווי מודוס", modeChord: "ספטאקורד יחסי", modeUse: "שימושי מודוסים", modeFacts: "מודוסים – עובדות", pentRemoved: "דרגות מוחסרות בפנטטוני", pentNotes: "תווי פנטטוני", bluesBar: "דרגה בתיבת בלוז", bluesKey: "אקורד בבלוז", bluesFacts: "בלוז ושאפל", chromaticSync: "כרומטי וסינקופה", noteCount: "ערכים קצביים", bpmFacts: "קצב וטמפו", formFacts: "מבנה שיר", conceptDef: "הגדרה → מושג", conceptTerm: "מושג → הגדרה" };
let EXAM_TIMER = null;

const SCALES = {
  major: { he: "מז'ור", semis: [0, 2, 4, 5, 7, 9, 11] },
  natural: { he: "מינור טבעי", semis: [0, 2, 3, 5, 7, 8, 10] },
  harmonic: { he: "מינור הרמוני", semis: [0, 2, 3, 5, 7, 8, 11] },
  melodic: { he: "מינור מלודי (בעלייה)", semis: [0, 2, 3, 5, 7, 9, 11] },
  ionian: { he: "איוניין", semis: [0, 2, 4, 5, 7, 9, 11] },
  dorian: { he: "דורי", semis: [0, 2, 3, 5, 7, 9, 10] },
  phrygian: { he: "פריגי", semis: [0, 1, 3, 5, 7, 8, 10] },
  lydian: { he: "לידי", semis: [0, 2, 4, 6, 7, 9, 11] },
  mixolydian: { he: "מיקסולידי", semis: [0, 2, 4, 5, 7, 9, 10] },
  aeolian: { he: "אאולי", semis: [0, 2, 3, 5, 7, 8, 10] },
  locrian: { he: "לוקריין", semis: [0, 1, 3, 5, 6, 8, 10] },
};
function scaleNotes(root, type) {
  const out = [];
  for (let i = 0; i < 7; i++) { const n = spell(root, i, SCALES[type].semis[i]); if (!n) return null; out.push(n); }
  return out;
}
const MAJ_ROOTS = ["C", "G", "D", "A", "E", "B", "F#", "F", "Bb", "Eb", "Ab", "Db", "Gb"];
const MIN_ROOTS = ["A", "E", "B", "F#", "C#", "G#", "D", "G", "C", "F", "Bb", "Eb"];
const ANY_ROOTS = ["C", "D", "E", "F", "G", "A", "B", "Bb", "Eb", "Ab", "F#", "C#"];
function randRoot(type, roots) {
  for (let t = 0; t < 60; t++) { const r = pick(roots); if (scaleNotes(r, type)) return r; }
  return "C";
}

const INTERVALS = [
  { he: "פרימה (יוניסון)", en: "Perfect unison", semi: 0, steps: 0, type: "p" },
  { he: "סקונדה קטנה", en: "Minor 2nd", semi: 1, steps: 1, type: "d" },
  { he: "סקונדה גדולה", en: "Major 2nd", semi: 2, steps: 1, type: "d" },
  { he: "טרצה קטנה", en: "Minor 3rd", semi: 3, steps: 2, type: "c" },
  { he: "טרצה גדולה", en: "Major 3rd", semi: 4, steps: 2, type: "c" },
  { he: "קוורטה", en: "Perfect 4th", semi: 5, steps: 3, type: "p" },
  { he: "טריטון", en: "Tritone", semi: 6, steps: 3, type: "d" },
  { he: "קווינטה", en: "Perfect 5th", semi: 7, steps: 4, type: "p" },
  { he: "סקסטה קטנה", en: "Minor 6th", semi: 8, steps: 5, type: "c" },
  { he: "סקסטה גדולה", en: "Major 6th", semi: 9, steps: 5, type: "c" },
  { he: "ספטימה קטנה", en: "Minor 7th", semi: 10, steps: 6, type: "d" },
  { he: "ספטימה גדולה", en: "Major 7th", semi: 11, steps: 6, type: "d" },
  { he: "אוקטבה", en: "Perfect octave", semi: 12, steps: 7, type: "p" },
];
const TYPE_HE = { p: "קונסוננטי (מושלם)", c: "קונסוננטי", d: "דיסוננטי" };
const tones = s => String(s / 2);
/* "ספטימה גדולה" → "הספטימה הגדולה" (כמו בשקף 3.13: "מהי הספטימה הגדולה מ-E?") */
const defIv = he => he.replace(/\s*\(.*\)/, "").split(" ").map(w => "ה" + w).join(" ");
const halves = n => n === 0 ? "0 חצאי טון" : n === 1 ? "חצי טון אחד" : `${n} חצאי טון`;

const DEG_MAJ = [["I", "טוניקה", "מז'ור"], ["II", "סופרטוניקה", "מינור"], ["III", "מדיאנטה", "מינור"], ["IV", "סובדומיננטה", "מז'ור"], ["V", "דומיננטה", "מז'ור"], ["VI", "סובמדיאנטה", "מינור"], ["VII", "טון מוביל", "מוקטן"]];
const DEG_MIN = ["מינור", "מוקטן", "מז'ור", "מינור", "מינור", "מז'ור", "מז'ור"];

function triadAt(scale, i) {
  const r = scale[i], t = scale[(i + 2) % 7], f = scale[(i + 4) % 7];
  const a = (pc(t) - pc(r) + 12) % 12, b = (pc(f) - pc(r) + 12) % 12;
  const q = a === 4 && b === 7 ? "" : a === 3 && b === 7 ? "m" : a === 3 && b === 6 ? "dim" : a === 4 && b === 8 ? "aug" : "?";
  return { root: r, q, name: r + q, notes: [r, t, f] };
}
function seventhAt(scale, i) {
  const t = triadAt(scale, i), s = scale[(i + 6) % 7];
  const c = (pc(s) - pc(t.root) + 12) % 12, a = (pc(t.notes[1]) - pc(t.root) + 12) % 12, b = (pc(t.notes[2]) - pc(t.root) + 12) % 12;
  const key = `${a},${b},${c}`;
  const map = { "4,7,11": "maj7", "4,7,10": "7", "3,7,10": "m7", "3,6,10": "ø7", "3,6,9": "dim7", "3,7,11": "m(maj7)" };
  const q = map[key] || "?";
  return { root: t.root, q, name: t.root + q, notes: [...t.notes, s] };
}
const SEVENTHS = {
  maj7: { he: "Major 7", semis: [0, 4, 7, 11], how: "אקורד משולש מז'ור + ספטימה גדולה" },
  "7": { he: "Dominant 7", semis: [0, 4, 7, 10], how: "אקורד משולש מז'ור + ספטימה קטנה" },
  m7: { he: "Minor 7", semis: [0, 3, 7, 10], how: "אקורד משולש מינור + ספטימה קטנה" },
  "ø7": { he: "Half diminished 7", semis: [0, 3, 6, 10], how: "אקורד משולש מוקטן + ספטימה קטנה" },
  dim7: { he: "Diminished 7", semis: [0, 3, 6, 9], how: "אקורד משולש מוקטן + ספטימה מוקטנת" },
};

/* ===================== בניית שאלות ===================== */
function mc(topic, gen, prompt, correct, distractors, expl, src) {
  const ds = [];
  for (const d of shuffle(distractors)) { if (d !== correct && !ds.includes(d)) ds.push(d); if (ds.length === 3) break; }
  const options = shuffle([correct, ...ds]);
  return { topic, gen, kind: "mc", prompt, options, correct: options.indexOf(correct), answerText: correct, expl, src };
}
function txt(topic, gen, prompt, answerList, expl, src) {
  return { topic, gen, kind: "text", prompt, answerList, answerText: answerList.join(" "), expl, src };
}
const S = (l, s, what) => `שיעור ${l}${s ? ", שקף " + s : ""}${what ? " – " + what : ""}`;

const TOPICS = {};
function topic(id, he, desc, gens) { TOPICS[id] = { id, he, desc, gens }; }

/* ---- מרווחים ---- */
topic("intervals", "מרווחים", "טבלת המרווחים, שמות, טונים, קונסוננס ודיסוננס", [
  function intTones() {
    const iv = pick(INTERVALS);
    const all = INTERVALS.map(x => tones(x.semi));
    return mc("intervals", "intTones", `כמה <b>טונים</b> יש ב<b>${iv.he}</b>?`, tones(iv.semi), all, `${iv.he} (${iv.en}) = ${halves(iv.semi)} = ${tones(iv.semi)} טונים.`, S(3, 7, "טבלת המרווחים"));
  },
  function intName() {
    const root = pick(["C", "D", "E", "F", "G", "A", "B", "Bb", "Eb", "Ab"]);
    for (let t = 0; t < 40; t++) {
      const iv = pick(INTERVALS.filter(x => x.semi !== 6 && x.semi !== 0 && x.semi !== 12));
      const target = spell(root, iv.steps, iv.semi); if (!target) continue;
      return mc("intervals", "intName", `מה המרווח שנוצר כאשר מנגנים ${L(fmtNote(root) + " + " + fmtNote(target))}?`, iv.he, INTERVALS.map(x => x.he), `${L(fmtNote(root) + " → " + fmtNote(target))} הם ${iv.steps + 1} שמות תווים (${iv.he.split(" ")[0]}), ${halves(iv.semi)}: ${iv.he}.`, S(3, "7, 8, 13", "מרווח = מספר צעדים בסולם + גודל"));
    }
  },
  function intFind() {
    const root = pick(["C", "D", "E", "F", "G", "A", "B", "Bb", "Eb", "Ab", "F#"]);
    for (let t = 0; t < 40; t++) {
      const iv = pick(INTERVALS.filter(x => x.semi !== 6 && x.semi !== 0));
      const target = spell(root, iv.steps, iv.semi); if (!target) continue;
      const wrong = [spell(root, iv.steps, iv.semi + 1), spell(root, iv.steps, iv.semi - 1), spell(root, iv.steps + 1, iv.semi), spell(root, iv.steps - 1 < 0 ? 6 : iv.steps - 1, iv.semi)].filter(Boolean);
      const extra = shuffle(["C", "D", "E", "F", "G", "A", "B", "Db", "Eb", "Gb", "Ab", "Bb"]);
      return mc("intervals", "intFind", `מהי <b>${defIv(iv.he)}</b> מ-${NL(root)}?`, fmtNote(target), [...wrong, ...extra].map(fmtNote), `${iv.he} = ${halves(iv.semi)} ו-${iv.steps + 1} שמות תווים מ-${NL(root)}: ${NL(target)}.`, S(3, "7, 13"));
    }
  },
  function intType() {
    const iv = pick(INTERVALS);
    return mc("intervals", "intType", `לפי הטבלה בקורס: מהו סוג המרווח <b>${iv.he}</b>?`, TYPE_HE[iv.type], Object.values(TYPE_HE), `בטבלה: ${iv.he} – ${TYPE_HE[iv.type]}. מושלמים: פרימה, קוורטה, קווינטה, אוקטבה. דיסוננטיים: סקונדות, ספטימות וטריטון.`, S(3, 7, "טבלת המרווחים"));
  },
  function intChar() {
    const facts = [
      ["אילו מרווחים נחשבים \"חלולים\" (אי אפשר להבין דרכם אם האופי שמח או עצוב)?", "פרימה, קוורטה, קווינטה, אוקטבה", ["טרצות וסקסטות", "סקונדה, ספטימה, טריטון", "רק סקונדות", "רק טרצות"], S(7, 4)],
      ["אילו מרווחים הם \"הרמוניים\" – במצלול שלהם מרמזים על שמח או עצוב?", "טרצות וסקסטות", ["פרימה, קוורטה, קווינטה, אוקטבה", "סקונדה, ספטימה, טריטון", "רק אוקטבה", "קוורטה וקווינטה"], S(7, 4)],
      ["אילו מרווחים הם דיסוננטים – מתוחים ודורשים פתרון?", "סקונדה, ספטימה, טריטון", ["פרימה, קוורטה, קווינטה, אוקטבה", "טרצות וסקסטות", "קוורטה וקווינטה", "רק טרצות"], S(7, 4)],
      ["כמה סוגי מרווחים יש (למרות 12 צלילים)?", "שמונה", ["שניים עשר", "שבעה", "תשעה", "חמישה"], S(3, 3)],
      ["הטריטון הוא מרווח של...", "שלושה טונים", ["שני טונים", "טון וחצי", "ארבעה טונים", "חצי טון"], S(7, 3)],
      ["הטריטון יכול להיכתב כ...", "קוורטה מוגדלת או קווינטה מוקטנת", ["קוורטה זכה או קווינטה זכה", "סקסטה מוגדלת בלבד", "ספטימה קטנה", "טרצה מוגדלת"], S(7, 3)],
      ["איזה שיר מופיע בשקפים לשינון האוקטבה?", "Somewhere Over the Rainbow", ["סופרמן", "הארי פוטר", "שלומית בונה סוכה", "Mad World"], S(3, 11)],
      ["איזה שיר מופיע בשקפים לשינון הקווינטה (Perfect 5th)?", "סופרמן", ["Somewhere Over the Rainbow", "הארי פוטר", "Mad World", "שלומית בונה סוכה"], S(3, 11)],
      ["Thirds (טרצות) מגדירות אופי...", "מז'ור/מינור – שמח/עצוב", ["חלול", "דיסוננטי וקרוב", "מושלם", "ללא אופי מוגדר"], S(3, 12)],
    ];
    const f = pick(facts);
    return mc("intervals", "intChar", f[0], f[1], f[2], f[1], f[3]);
  },
]);

/* ---- סולמות ---- */
topic("scales", "סולמות מז'ור ומינור", "תווי הסולמות, נוסחאות, הרמוני ומלודי", [
  function majNotes() {
    const r = randRoot("major", MAJ_ROOTS); const sc = scaleNotes(r, "major");
    return txt("scales", "majNotes", `אילו תווים מרכיבים את סולם ${NL(r)} מז'ור?<br><span class="muted">הקלד את 7 התווים לפי הסדר (עם רווחים, למשל ${L("F# G# A")}; אפשר # ו-b)</span>`, sc, `מז'ור: 1-1-½-1-1-1-½ (טון, טון, חצי, טון, טון, טון, חצי). בסולם כל שבעת שמות האותיות חייבים להופיע – לכן ${fmtNote(sc[6])} ולא שם אחר.`, S(1, "10, 11, 15"));
  },
  function majDegree() {
    const r = randRoot("major", MAJ_ROOTS); const sc = scaleNotes(r, "major"); const n = 2 + rnd(6);
    return mc("scales", "majDegree", `מהו התו ה-${n} בסולם ${NL(r)} מז'ור?`, fmtNote(sc[n - 1]), shuffle(MAJ_ROOTS.concat(["Cb", "E#", "A#", "D#", "Fb"])).map(fmtNote), `סולם ${NL(r)} מז'ור: ${NLs(sc)}.`, S(1, 10));
  },
  function majFormula() {
    const pats = ["1 1 ½ 1 1 1 ½", "1 ½ 1 1 ½ 1 1", "1 1 1 ½ 1 1 ½", "½ 1 1 1 ½ 1 1", "1 ½ 1 1 1 ½ 1", "1 1 ½ 1 ½ 1 1"];
    const kind = pick(["major", "minor"]);
    if (kind === "major") return mc("scales", "majFormula", "מהם המרווחים (בטונים) בין דרגות הסולם המז'ורי?", pats[0], pats.slice(1), "מז'ור: 1-1-½-1-1-1-½. חצאי הטון בין 3→4 ו-7→8.", S(1, 10));
    return mc("scales", "majFormula", "מהם המרווחים (בטונים) בין דרגות הסולם המינורי הטבעי?", pats[1], [pats[0], pats[2], pats[3], pats[4], pats[5]], "מינור טבעי: 1-½-1-1-½-1-1.", S(6, 5));
  },
  function minNotes() {
    const type = pick(["natural", "natural", "harmonic", "melodic"]);
    const r = randRoot(type, MIN_ROOTS); const sc = scaleNotes(r, type);
    const why = type === "natural" ? "מינור טבעי: 1-½-1-1-½-1-1." : type === "harmonic" ? "מינור הרמוני: מגביהים את הצליל השביעי (טון מוביל)." : "מינור מלודי: מגביהים גם את השישי וגם את השביעי בעלייה (בירידה חוזרים לטבעי).";
    return txt("scales", "minNotes", `אילו תווים מרכיבים את סולם ${NL(r)} ${SCALES[type].he}?<br><span class="muted">הקלד 7 תווים לפי הסדר (עם רווחים)</span>`, sc, why, S(6, "5, 11, 14, 16"));
  },
  function minFacts() {
    const facts = [
      ["איזה צליל מגביהים במינור הרמוני?", "הצליל השביעי", ["הצליל השישי", "הצליל השלישי", "הצליל השישי והשביעי", "הצליל החמישי"], "כך השביעי הופך לטון מוביל (חצי טון מתחת לשורש).", S(6, 11)],
      ["אילו צלילים מגביהים במינור מלודי?", "השישי והשביעי", ["רק השביעי", "רק השישי", "השלישי והשביעי", "השני והשישי"], "כדי להיפטר מהסקונדה המוגדלת (בין 6 ל-7) ועדיין לקבל טון מוביל.", S(6, 14)],
      ["איזו בעיה נוצרת במינור ההרמוני?", "סקונדה מוגדלת בין הצליל השישי לשביעי", ["אין טון מוביל", "קווינטה מוקטנת", "הטוניקה נעלמת", "המרווח בין 1 ל-2 הופך לחצי טון"], "הסקונדה המוגדלת נשמעה מזרחית – ולכן נוצר המינור המלודי.", S(6, 14)],
      ["איך נהוג להשתמש במינור המלודי?", "בעלייה עם 6 ו-7 מוגבהות, ובירידה חוזרים למינור הטבעי", ["תמיד עם 6 ו-7 מוגבהות", "רק בירידה", "תמיד כמו מינור טבעי", "רק על האקורדים"], "בעלייה: שינויים בדרגות שבע ושש; בירידה: מינור טבעי.", S(6, 16)],
      ["מדוע במינור הטבעי אין טון מוביל?", "המרחק בין הצליל השביעי לשורש הוא טון ולא חצי טון", ["אין דרגה שביעית", "הדרגה השביעית נמוכה בחצי טון", "השורש מוגבה", "הטרצה קטנה"], "טון מוביל = דרגה 7 חצי טון מתחת לשורש.", S(6, 10)],
      ["האם המינור ההרמוני והמלודי הם סולמות נפרדים?", "לא – זה אותו סולם מינור עם שינויים קלים", ["כן, סולמות נפרדים לגמרי", "רק ההרמוני", "רק המלודי", "תלוי בטונליות"], "השמות רק מציינים את השינויים ולא שימוש בסולם אחר.", S(6, 16)],
      ["איזה סולם מתאים לצליל מזרחי/ספרדי לפי השקפים?", "מינור הרמוני", ["מז'ור", "מינור מלודי", "פנטטוני מז'ור", "מינור טבעי"], "\"אפשר ליצור אחלה של מוזיקה מזרחית/ספרדית עם המינור ההרמוני\".", S(6, 17)],
    ];
    const f = pick(facts); return mc("scales", "minFacts", f[0], f[1], f[2], f[3], f[4]);
  },
  function stableTones() {
    const facts = [
      ["מהם הצלילים היציבים בסולם?", "1-3-5", ["1-4-5", "1-2-3", "1-5-7", "2-4-6"], "הצלילים היציבים 1-3-5 הם \"שלד הסולם\".", S(5, "5, 6")],
      ["איזו דרגה נקראת הטון המוביל ומה מיוחד בה?", "דרגה 7, חצי טון מתחת לשורש – נמשכת מעלה", ["דרגה 2, נמשכת מטה", "דרגה 4, חצי טון מעל", "דרגה 6, נמשכת מעלה", "דרגה 5, נמשכת מטה"], "הטון המוביל הוא הצליל היחיד שנמשך מעלה ולא מטה.", S(5, 8)],
      ["לאיזה צליל נמשך הצליל ה-4 לפי מוקדי המשיכה?", "3", ["1", "5", "6", "2"], "2→1, 4→3, 6→5, 7→8.", S(5, 5)],
      ["מהי תנועה צפופה?", "קו מלודי של צעדים קרובים בסולם (תווי מעבר ותווים שכנים)", ["קפיצות גדולות בלבד", "ניגון אקורדים בבת אחת", "שינוי טמפו", "שקט מוחלט"], "תווי מעבר נעים באותו כיוון בין תווי ארפג'יו; תווים שכנים יוצאים ושבים.", S(5, 10)],
    ];
    const f = pick(facts); return mc("scales", "stableTones", f[0], f[1], f[2], f[3], f[4]);
  },
]);

/* ---- אקורדים ודרגות ---- */
topic("chords", "אקורדים ודרגות", "משולשים, דרגות במז'ור ובמינור, היפוכים, Power chords", [
  function triadQ() {
    const t = pick([[1.5, 2, "מינור"], [2, 1.5, "מז'ור"], [1.5, 1.5, "מוקטן"], [2, 2, "מוגדל"]]);
    return mc("chords", "triadQ", `באקורד משולש המרחק בין I ל-III הוא ${t[0]} טונים, ובין III ל-V ${t[1]} טונים. איזה אקורד זה?`, t[2], ["מינור", "מז'ור", "מוקטן", "מוגדל"], "מינור 1.5+2 · מז'ור 2+1.5 · מוקטן 1.5+1.5 · מוגדל 2+2.", S(4, "5–8"));
  },
  function degChord() {
    const r = randRoot("major", ["C", "G", "D", "A", "E", "F", "Bb", "Eb"]); const sc = scaleNotes(r, "major"); const i = rnd(7);
    const t = triadAt(sc, i); const roman = DEG_MAJ[i][0];
    const wrong = [];
    for (let k = 0; k < 7; k++) if (k !== i) wrong.push(triadAt(sc, k).name);
    wrong.push(sc[i] + (t.q === "" ? "m" : ""));
    return mc("chords", "degChord", `מהו האקורד בדרגה ${L(roman)} בסולם ${NL(r)} מז'ור?`, fmtNote(t.name), wrong.map(fmtNote), `סולם ${NL(r)} מז'ור: ${L(sc.map((n, k) => fmtNote(triadAt(sc, k).name)).join(" · "))}. דרגה ${roman} = ${DEG_MAJ[i][1]} (${DEG_MAJ[i][2]}).`, S(4, "14, 15"));
  },
  function degName() {
    const i = rnd(7); const d = DEG_MAJ[i];
    if (Math.random() < .5) return mc("chords", "degName", `איך נקראת הדרגה ${L(d[0])} בסולם מז'ור?`, d[1], DEG_MAJ.map(x => x[1]), `${d[0]} – ${d[1]}, אקורד ${d[2]}.`, S(4, 14));
    return mc("chords", "degName", `מהו סוג האקורד על דרגה ${L(d[0])} (${d[1]}) בסולם מז'ור?`, d[2], ["מז'ור", "מינור", "מוקטן", "מוגדל"], `מז'ור: I, IV, V מז'ור · II, III, VI מינור · VII מוקטן.`, S(4, 14));
  },
  function degMin() {
    const i = rnd(7);
    return mc("chords", "degMin", `מהו סוג האקורד על דרגה ${L(DEG_MAJ[i][0])} בסולם מינור (טבעי)?`, DEG_MIN[i], ["מז'ור", "מינור", "מוקטן", "מוגדל"], `במינור: I מינור · II מוקטן · III מז'ור · IV מינור · V מינור · VI מז'ור · VII מז'ור. (דוגמה ב-Cm: Cm, D dim, Eb, Fm, Gm, Ab, Bb)`, S(6, "8, 9"));
  },
  function minChord() {
    const r = randRoot("natural", ["A", "E", "D", "G", "C", "F", "B"]); const sc = scaleNotes(r, "natural"); const i = rnd(7); const t = triadAt(sc, i);
    const wrong = []; for (let k = 0; k < 7; k++) if (k !== i) wrong.push(triadAt(sc, k).name);
    return mc("chords", "minChord", `מהו האקורד בדרגה ${L(DEG_MAJ[i][0])} בסולם ${NL(r)} מינור (טבעי)?`, fmtNote(t.name), wrong.map(fmtNote), `${NL(r)} מינור: ${L(sc.map((n, k) => fmtNote(triadAt(sc, k).name)).join(" · "))}.`, S(6, "8, 9"));
  },
  function chordNotes() {
    const r = randRoot("major", ["C", "G", "D", "A", "F", "Bb"]); const sc = scaleNotes(r, "major"); const i = rnd(7); const t = triadAt(sc, i);
    return txt("chords", "chordNotes", `אילו תווים מרכיבים את האקורד ${NL(t.name)}?<br><span class="muted">הקלד 3 תווים (שורש, טרצה, קווינטה)</span>`, t.notes, `${NL(t.name)} = ${NLs(t.notes)}`, S(4, "9, 15"));
  },
  function chordFacts() {
    const facts = [
      ["מהו אקורד כוח (Power Chord)?", "שורש וקווינטה – משולש ללא הטרצה", ["שורש וטרצה בלבד", "ארבעה תווים עם ספטימה", "אקורד מוקטן", "שלושה תווים עם סקונדה"], "מסומן ב-5, למשל C5. אי אפשר לקבוע אם מז'ורי או מינורי.", S(12, 4)],
      ["מה ההבדל בין אקורד מז'ור למינור על אותו שורש?", "תו אחד – הטרצה", ["שני תווים", "השורש", "הקווינטה", "אין הבדל"], "\"ההבדל בין המז'ור למינור מתבטא בתו אחד!\"", S(4, 9)],
      ["מהו ארפג'יו?", "נגינת תווי האקורד אחד אחרי השני בצורה מלודית", ["נגינת כל התווים יחד", "אקורד ללא טרצה", "סולם פנטטוני", "היפוך שני"], "אפשר להשתמש בארפג'יו באילתור, בליווי ובקישוט.", S(4, 10)],
      ["באקורד Sus הטרצה מוחלפת ב...", "דרגה שנייה (Sus2) או רביעית (Sus4)", ["דרגה שישית", "דרגה שביעית", "דרגה חמישית", "דרגה שלישית מוקטנת"], "יוצר \"השהיית פתרון\" – לא ברור אם מז'ור או מינור.", S(7, 11)],
      ["מהו סקסטאקורד (היפוך ראשון)?", "אקורד שבו הטרצה בבס", ["אקורד שבו הקווינטה בבס", "אקורד עם ספטימה בבס", "אקורד ללא שורש", "אקורד בן שישה תווים"], "המרווחים מעל הבס הם טרצה וסקסטה.", S(9, 9)],
      ["מהו קוורטסקסטאקורד (היפוך שני)?", "אקורד שבו הקווינטה בבס", ["אקורד שבו הטרצה בבס", "אקורד שורשי", "היפוך שלישי", "אקורד עם ספטימה"], "הקוורטה מעל הבס נחשבת דיסוננס ולכן מחייב פתרון.", S(9, 10)],
      ["איך כותבים אקורד C שבו התו E בבס?", "C/E", ["E/C", "CE", "C-E", "Em"], "שורש+גוון, קו אלכסוני, והבס: C/E, C/G, Cm/Eb, Cm/G.", S(9, 11)],
      ["מהו יתרון של היפוכים לפי השקפים?", "תנועה הרמונית איכותית וצפופה, וקו בס מלודי משכנע", ["תמיד נשמע שמח", "מפחית מספר האקורדים", "מבטל את הצורך בקדנצה", "משנה את הסולם"], "קולות עצמאיים יותר (כמו הכוראלים של באך) ותנועת צעדים קרובים בבס.", S(9, 12)],
    ];
    const f = pick(facts); return mc("chords", "chordFacts", f[0], f[1], f[2], f[3], f[4]);
  },
]);

/* ---- ספטאקורדים ---- */
topic("sevenths", "ספטאקורדים", "ארבעה צלילים: בנייה, דרגות, סימונים", [
  function sevHow() {
    const k = pick(Object.keys(SEVENTHS)); const s = SEVENTHS[k];
    return mc("sevenths", "sevHow", `איך בונים אקורד <b>${s.he}</b>?`, s.how, Object.values(SEVENTHS).map(x => x.how).concat(["אקורד משולש מוגדל + ספטימה גדולה"]), `${s.he}: ${s.how}.`, S(14, 8, "טבלת ספטים"));
  },
  function sevDegreeMaj() {
    const i = rnd(7); const sc = scaleNotes("C", "major"); const s = seventhAt(sc, i);
    const label = { maj7: "Major 7", "7": "Dominant 7", m7: "Minor 7", "ø7": "Half diminished (ø7)" }[s.q];
    return mc("sevenths", "sevDegreeMaj", `איזה ספטאקורד נוצר מדרגה ${L(DEG_MAJ[i][0])} בסולם מז'ור (למשל ${NL(s.name)} ב-C)?`, label, ["Major 7", "Dominant 7", "Minor 7", "Half diminished (ø7)", "Diminished 7"], `ספטאקורדים ב-C מז'ור: Cmaj7 · Dm7 · Em7 · Fmaj7 · G7 · Am7 · Bø7.`, S(14, 7));
  },
  function sevIVminor() {
    const q = [["מז'ור", "Major 7 (maj7)"], ["מינור", "Minor 7 (m7)"]]; const k = rnd(2);
    return mc("sevenths", "sevIVminor", `כשהופכים את הדרגה הרביעית ב${q[k][0]} לספטאקורד, איזה ספטאקורד היא תהיה?`, q[k][1], ["Major 7 (maj7)", "Minor 7 (m7)", "Dominant 7", "Half diminished (ø7)"], k === 0 ? "ב-C מז'ור: Fmaj7." : "ב-Cm: Fm7 (דרגה IV במינור מינורית + ספטימה קטנה).", S(15, 2));
  },
  function sevNotes() {
    const k = pick(["maj7", "7", "m7", "ø7", "dim7"]); const roots = ["C", "D", "E", "F", "G", "A", "B", "Bb", "Eb"];
    for (let t = 0; t < 40; t++) {
      const r = pick(roots); const steps = [0, 2, 4, 6]; const ns = SEVENTHS[k].semis.map((x, j) => spell(r, steps[j], x, k === "dim7")); if (ns.some(n => !n) || ns.filter(n => n.length > 2).length > 1) continue;   /* ספטימה מוקטנת כמו בשקף (C: Bbb) – לכל היותר כפול-במול אחד */
      return txt("sevenths", "sevNotes", `אילו תווים מרכיבים את האקורד ${NL(r + k)}?<br><span class="muted">הקלד 4 תווים</span>`, ns, `${SEVENTHS[k].he}: ${SEVENTHS[k].how}. ${NLs(ns)}`, S(14, "8, 9"));
    }
  },
  function sevFacts() {
    const facts = [
      ["מדוע הדומיננט 7 יוצר מתח?", "הספטימה יוצרת טריטון עם הטרצה", ["הוא מורכב מאקורד מוקטן", "אין בו קווינטה", "הוא תמיד מינורי", "השורש בבס"], "\"השבע יוצר טריטון עם הטרצה\".", S(14, 10)],
      ["מה אופי הספט אקורדים בספקטרום ההלחנתי?", "רגשות מורכבים ולא יציבים, מתח רב", ["יציב וכוחני", "עצוב/שמח/רגוע בלבד", "ללא הרמוניה", "חלול"], "ספט אקורדים – משולשים – Power Chords: מהמורכב-לא-יציב עד היציב-כוחני.", S(14, 5)],
      ["איך נקרא ההיפוך הראשון של ספטאקורד?", "קווינט-סקסטאקורד", ["טרצ-קוורטאקורד", "סקונדאקורד", "קוורטסקסטאקורד", "סקסטאקורד"], "שלושת ההיפוכים: קווינט-סקסט, טרצ-קוורט, סקונד.", S(14, 6)],
      ["מהו אקורד מז'ור-קטן (לפי השקפים)?", "דומיננט 7: אקורד מז'ור עם ספטימה קטנה", ["Major 7", "Minor 7", "Diminished 7", "Half diminished"], "\"אקורד מז'ור עם ספטימה קטנה ייקרא לעיתים אקורד מז'ור-קטן\".", S(14, 6)],
    ];
    const f = pick(facts); return mc("sevenths", "sevFacts", f[0], f[1], f[2], f[3], f[4]);
  },
]);

/* ---- קדנצות והרמוניה פונקציונלית ---- */
topic("functional", "קדנצות והרמוניה פונקציונלית", "תפקידי הדרגות, קדנצה, פתרון מדומה", [
  function funcRole() {
    const roles = [
      ["הבית – מרכז הסולם", "I – טוניקה"], ["מושכת בצורה הברורה והחזקה ביותר לטוניקה", "V – דומיננטה"], ["בית שני חזק; תנועה קדנציאלית IV–V–I", "IV – סאב דומיננטה"],
      ["מתח מתון; בג'אז 2–5–1", "II – סופרטוניקה"], ["תחליף לטוניקה/הכנה לדרגה השישית; צבע עצוב במז'ור", "III – מדיאנטה"], ["מכילה שני צלילים יציבים (1 ו-3) – משמשת לפתרון מדומה", "VI – סאב מדיאנטה"],
      ["מוקטנת, צורמת ודורשת פתרון (במז'ור)", "VII – טון מוביל"],
    ];
    const r = pick(roles); return mc("functional", "funcRole", `איזו דרגה מתוארת כך: "${r[0]}"?`, r[1], roles.map(x => x[1]), `${r[1]}.`, S(9, "3–8") + " ו-" + S(10, "3–13"));
  },
  function cadenceDef() {
    const facts = [
      ["מהי קדנצה?", "מהלך של לפחות שני אקורדים שמביא את המשפט המוסיקלי לסיומו (למשל V-I)", ["אקורד אחד ארוך", "נגינת אקורד בבס שונה", "קישוט מלודי בלבד", "מעבר לסולם אחר"], S(9, 5)],
      ["איזו תנועה נהוג היה לסיים בה יצירה קלאסית?", "V–I", ["I–II", "II–VI", "I–IV", "VI–III"], S(9, 4)],
      ["איזו קדנצה ברורה ומשכנעת יותר מוזכרת בשקפים?", "IV–V–I", ["I–III–I", "II–VI–I", "I–VII–I", "III–VI–II"], S(9, 7)],
      ["מהו פתרון מדומה?", "אחרי הדומיננטה מגיעה דרגה שישית במקום הטוניקה", ["אחרי הדומיננטה מגיעה הטוניקה", "אחרי הטוניקה מגיעה דומיננטה", "דרגה שביעית אחרי הרביעית", "אקורד ללא טרצה"], S(10, 6)],
      ["מדוע פתרון מדומה נשמע כהפתעה?", "דרגה שישית דומה לטוניקה (שני צלילים יציבים משותפים) אך אינה ממש טוניקה", ["היא נמוכה בחצי טון", "היא מוקטנת", "היא תמיד מינורית", "היא מכילה טריטון"], S(10, 6)],
      ["מהו \"פתרון מושהה\"?", "דרגה רביעית אחרי הדומיננטה; לרוב חוזרים על המהלך ומגיעים לטוניקה", ["דרגה שנייה אחרי הטוניקה", "פתרון לדרגה שביעית", "אקורד Sus", "קדנצה במינור בלבד"], S(10, 6)],
      ["איך הופכים את הדרגה החמישית במינור לדומיננטה?", "הופכים אותה למז'ורית ומנגנים מינור הרמוני על גביה", ["מוסיפים ספטימה גדולה", "מנמיכים את הטרצה", "משתמשים במינור מלודי", "מעבירים לפריגי"], S(9, 6)],
      ["איך משתמשים בדרגה הרביעית במינור כחלק מקדנצה?", "הופכים אותה למז'ורית ומנגנים מינור מלודי על גביה", ["מנגנים מינור הרמוני", "מוקטנים אותה", "משמיטים את הקווינטה", "משתמשים רק בהיפוך"], S(9, 8)],
      ["הדרגה השביעית במינור היא...", "מז'ורית ובעלת סאונד \"רוקרי\"", ["מוקטנת וצורמת", "מינורית", "מוגדלת", "אין לה אקורד"], S(10, 13)],
      ["הדרגות 7 ו-2 כדרגות חלופיות: 7 היא גרסה רכה של...", "החמישית (והשנייה – של הרביעית)", ["הראשונה", "השלישית", "השישית", "הטוניקה"], S(10, 15)],
      ["מהי הרמוניה פונקציונלית?", "התפקידים של האקורדים השונים והאופן שבו הם גורמים לנו להרגיש", ["שיטת נגינה בבס", "קצב אקורדים בלבד", "סולם פנטטוני", "סימון תווים"], S(9, 2)],
    ];
    const f = pick(facts); return mc("functional", "cadenceDef", f[0], f[1], f[2], f[1], f[3]);
  },
  function progression() {
    const r = pick(["C", "G", "D", "A", "F", "Bb", "E"]); const sc = scaleNotes(r, "major");
    /* כל המהלכים כאן מופיעים בשקפים עצמם (שיעורים 9–10); המקור מצוין לצד כל מהלך */
    const progs = [
      [[4, 0], "V–I", S(9, 4)], [[3, 4, 0], "IV–V–I", S(9, 7)], [[1, 4, 0], "II–V–I (2-5-1)", S(10, 11)],
      [[0, 2, 0], "I–III–I", S(10, 4)], [[0, 2, 5, 4, 0], "I–III–VI–V–I", S(10, 4)], [[0, 3, 2, 6, 0], "I–IV–III–VII–I", S(10, 4)],
      [[0, 5, 3, 4], "I–VI–IV–V", S(10, 7)], [[0, 4, 5, 3], "I–V–VI–IV", S(10, 7)], [[0, 3, 4, 5], "I–IV–V–VI", S(10, 7)],
      [[4, 3, 2, 1, 0], "V–IV–III–II–I", S(10, 12)], [[0, 4, 1], "I–V–II", S(10, 12)], [[0, 1, 0], "I–II–I", S(10, 12)],
    ];
    const p = pick(progs);
    const names = p[0].map(i => triadAt(sc, i).name);
    const same = progs.filter(x => x !== p && x[0].length === p[0].length), other = progs.filter(x => x !== p && x[0].length !== p[0].length);
    const wrong = [...shuffle(same), ...shuffle(other)].map(x => x[1]);
    return mc("functional", "progression", `במז'ור ${NL(r)}: ${L(names.map(fmtNote).join(" – "))}. איזה מהלך דרגות זה?`, p[1], wrong, `לפי דרגות סולם ${NL(r)} מז'ור: ${L(sc.map((n, k) => fmtNote(triadAt(sc, k).name)).join(" · "))}`, p[2]);
  },
]);

/* ---- מודוסים ---- */
const MODES = [
  { k: "ionian", he: "איוניין", d: "מז'ור טבעי", ch: "Maj7", use: "המז'ור הרגיל" },
  { k: "dorian", he: "דורי", d: "מינור עם שישית מוגבהת", ch: "Min7", use: "בלדות מוזרות כמו MAD WORLD; פאנק ופיוז'ן" },
  { k: "phrygian", he: "פריגי", d: "מינור עם שנייה מונמכת", ch: "Min7", use: "מוזיקה ספרדית, מזרחית, מטאל" },
  { k: "lydian", he: "לידי", d: "מז'ור עם רביעית מוגבהת", ch: "Maj7", use: "סרטים וסדרות הרפתקאות (סימפסונס)" },
  { k: "mixolydian", he: "מיקסולידי", d: "מז'ור עם שביעית מונמכת", ch: "Dom7", use: "בלוז, \"רוק שמח\" כמו ACDC, פופ" },
  { k: "aeolian", he: "אאולי", d: "מינור טבעי", ch: "Min7", use: "המינור הרגיל" },
  { k: "locrian", he: "לוקריין", d: "מוקטן (יוצא דופן)", ch: "Min7b5", use: "" },
];
topic("modes", "מודוסים", "שבעת המודוסים של סולם המז'ור", [
  function modeDesc() {
    const m = pick(MODES); return mc("modes", "modeDesc", `איזה מודוס הוא "${m.d}"?`, m.he, MODES.map(x => x.he), `${m.he} – ${m.d}.`, S(15, 9));
  },
  function modeFromC() {
    const idx = rnd(7); const note = ["C", "D", "E", "F", "G", "A", "B"][idx];
    return mc("modes", "modeFromC", `אם נבחר את התו ${NL(note)} כצליל השורש בסולם C מז'ור (נשארים עם אותם צלילים), איזה מודוס נקבל?`, MODES[idx].he, MODES.map(x => x.he), `C Ionian · D Dorian · E Phrygian · F Lydian · G Mixolydian · A Aeolian · B Locrian. ${note} → ${MODES[idx].he}.`, S(15, "4–8"));
  },
  function modeNotes() {
    const m = pick(MODES.slice(1)); const roots = ["C", "D", "E", "F", "G", "A", "B", "Bb", "Eb"];
    for (let t = 0; t < 40; t++) { const r = pick(roots); const sc = scaleNotes(r, m.k); if (!sc) continue;
      return txt("modes", "modeNotes", `אילו תווים מרכיבים את ${NL(r)} ${m.he}?<br><span class="muted">הקלד 7 תווים לפי הסדר</span>`, sc, `${m.he}: ${m.d} – ${NLs(sc)}.`, S(15, "7, 8, 9")); }
  },
  function modeChord() {
    const m = pick(MODES); return mc("modes", "modeChord", `מהו הספטאקורד היחסי של המודוס ${m.he}?`, m.ch, ["Maj7", "Min7", "Dom7", "Min7b5"], `${m.he} – ${m.ch}.`, S(15, 8));
  },
  function modeUse() {
    const ms = MODES.filter(x => x.use && x.k !== "ionian" && x.k !== "aeolian"); const m = pick(ms);
    return mc("modes", "modeUse", `באיזה מודוס נעשה שימוש ב: ${m.use}?`, m.he, ms.map(x => x.he).concat(["איוניין"]), `${m.he}: ${m.use}.`, S(15, "11, 12"));
  },
  function modeFacts() {
    const facts = [
      ["מהו הדבר החשוב ביותר בסולם לפי שיעור 15?", "צליל השורש – המגנט שאליו נמשכים הצלילים", ["מספר התווים", "הצליל החמישי", "הקצב", "הדינמיקה"], S(15, 3)],
      ["למה מודוסים \"פחות פופולריים\"?", "הטוניקה שלהם פחות משכנעת והם מתפקדים פחות טוב", ["הם קשים לניגון", "אין בהם דרגות", "הם גבוהים מדי", "הם מערביים מדי"], S(15, 15)],
      ["מה העצה לשימוש במלודיות במודוס?", "להדגיש את התו המיוחד שעושה את המודוס למה שהוא", ["להימנע מהשורש", "לנגן רק אקורדים", "להשמיט את הטרצה", "לשנות את הטמפו"], S(15, 15)],
      ["מתי חזרו מלחינים להשתמש בתפיסה המודלית?", "בסוף המאה ה-19 (ראוול ודביוסי) – מוזיקה אימפרסיוניסטית", ["בתקופת הבארוק", "במאה ה-16", "בשנות החמישים", "בתקופה הקלאסית"], S(15, 14)],
      ["לאיזו משפחה שייך הדורי?", "משפחת המינורים", ["משפחת המז'ורים", "משפחת המוקטנים", "משפחת הפנטטוניים", "אף אחת"], "אאולי, דורי, פריגי = מינורים; איוניין, לידי, מיקסולידי = מז'ורים; לוקריין – מוקטן.", S(15, 9)],
    ];
    const f = pick(facts); return mc("modes", "modeFacts", f[0], f[1], f[2], f[3] && f[3].length > 40 ? f[3] : f[1], f[3] && f[3].length > 40 ? S(15, 9) : f[3]);
  },
]);

/* ---- פנטטוני ובלוז ---- */
topic("pentatonic", "פנטטוני ובלוז", "פנטטוני, בלוז 12 תיבות, שאפל, אקורדי כוח", [
  function pentRemoved() {
    const k = pick(["major", "minor"]);
    if (k === "major") return mc("pentatonic", "pentRemoved", "אילו דרגות מחסירים מהסולם המז'ורי כדי לקבל פנטטוני מז'ור?", "הרביעית והשביעית", ["השנייה והשישית", "השלישית והשביעית", "הרביעית והשישית", "הראשונה והחמישית"], "פנטטוני מז'ור: I-II-III-V-VI (ב-C: C D E G A).", S(11, 7));
    return mc("pentatonic", "pentRemoved", "אילו דרגות מחסירים מהסולם המינורי כדי לקבל פנטטוני מינור?", "השנייה והשישית", ["הרביעית והשביעית", "השלישית והשביעית", "הרביעית והשישית", "השנייה והחמישית"], "פנטטוני מינור: I-III-IV-V-VII (ב-Cm: C Eb F G Bb).", S(11, 8));
  },
  function pentNotes() {
    const k = pick(["major", "minor"]);
    if (k === "major") { const r = randRoot("major", MAJ_ROOTS); const sc = scaleNotes(r, "major"); const pn = [sc[0], sc[1], sc[2], sc[4], sc[5]];
      return txt("pentatonic", "pentNotes", `אילו תווים מרכיבים את ${NL(r)} מז'ור פנטטוני?<br><span class="muted">5 תווים</span>`, pn, `I-II-III-V-VI: ${NLs(pn)} (מוחסרים IV ו-VII).`, S(11, 7)); }
    const r = randRoot("natural", MIN_ROOTS); const sc = scaleNotes(r, "natural"); const pn = [sc[0], sc[2], sc[3], sc[4], sc[6]];
    return txt("pentatonic", "pentNotes", `אילו תווים מרכיבים את ${NL(r)} מינור פנטטוני?<br><span class="muted">5 תווים</span>`, pn, `I-III-IV-V-VII: ${NLs(pn)} (מוחסרים II ו-VI).`, S(11, 8));
  },
  function bluesBar() {
    const bars = ["I", "I", "I", "I", "IV", "IV", "I", "I", "V", "IV", "I", "V"]; const i = rnd(12);
    return mc("pentatonic", "bluesBar", `במבנה 12 תיבות הבלוז, איזו דרגה מנוגנת בתיבה ${i + 1}?`, bars[i], ["I", "IV", "V", "II"], "I I I I | IV IV I I | V IV I V (חזרה).", S(11, 11));
  },
  function bluesKey() {
    const r = pick(["E", "A", "G", "C", "D"]); const sc = scaleNotes(r, "major"); const roman = [0, 3, 4]; const bars = [0, 0, 0, 0, 3, 3, 0, 0, 4, 3, 0, 4]; const i = rnd(12);
    const name = n => fmtNote(n) + (roman[2] === bars[i] ? "7" : "");
    const cor = sc[bars[i]] + (bars[i] === 4 ? "7" : "");
    return mc("pentatonic", "bluesKey", `בלוז 12 תיבות ב-${NL(r)}: מהו האקורד בתיבה ${i + 1}? (השקף מציג את הדוגמה ב-E: ${L("E E E E | A A E E | B7 A E B7")})`, fmtNote(cor), [sc[0], sc[3], sc[4] + "7", sc[4], sc[3] + "7", sc[1]].map(fmtNote), `I=${NL(sc[0])}, IV=${NL(sc[3])}, V=${NL(sc[4] + "7")}.`, S(11, "11, 12"));
  },
  function bluesFacts() {
    const facts = [
      ["מהו ה-Blues Scale?", "פנטטוני מינור + הטריטון (Blue Note)", ["פנטטוני מז'ור + ספטימה", "מינור הרמוני", "מיקסולידי", "מז'ור + 4 מוגבהת"], S(11, 13)],
      ["על איזה סולם נעשה האילתור בבלוז פעמים רבות?", "פנטטוני מינור", ["פנטטוני מז'ור בלבד", "לוקריין", "מינור מלודי", "איוניין"], S(11, 13)],
      ["איך בנוי קצב השאפל?", "מחלקים רבע לטריולות שמיניות ומנגנים את הראשונה והשלישית", ["16ות מנוקדות", "ארבע רבעים אחידים", "שמיניות עם סינקופה", "חמישיות"], S(11, 14)],
      ["שאפל קשור לתחושת...", "סווינג – השמינית הראשונה ארוכה מהשנייה", ["הכפלת קצב", "פוליריתמיקה", "רובטו", "אקסלרנדו"], S(11, 14)],
      ["כמה תיבות יש במבנה הבלוז הקלאסי?", "12", ["8", "16", "10", "24"], S(11, 11)],
      ["איזו תחושה מוסיף הסולם הפנטטוני לפי השקפים?", "סאונד מגניב ועוצמתי, ומוזיקה מאזורים לא-מערביים", ["עצב", "שמחה ילדותית", "מתח קלאסי", "פתרון מדומה"], S(11, 5)],
      ["איזה סולם נקרא לפי הקורס 'פנטטוני'?", "סולם בן חמישה צלילים באוקטבה", ["סולם בן שבעה צלילים", "סולם בן שישה צלילים", "סולם בן שמונה צלילים", "סולם כרומטי"], S(11, 4)],
    ];
    const f = pick(facts); return mc("pentatonic", "bluesFacts", f[0], f[1], f[2], f[1], f[2] && f[3]);
  },
  function chromaticSync() {
    const facts = [
      ["מהי סינקופה?", "הטעמה של פעמה שלא אמורה להיות מוטעמת, או אי נגינה של פעמה שאמורה להיות מוטעמת", ["האטה בסוף יצירה", "החלפת סולם", "ניגון חצי טון", "חלוקת פעמה ל-3"], S(12, 9)],
      ["מהו מהלך כרומטי?", "מהלך הבנוי מעליות או ירידות של חצי טון", ["מהלך בסולם דיאטוני בלבד", "מהלך של קווינטות", "מהלך של אוקטבות", "מהלך פנטטוני"], S(12, 7)],
      ["מהו צליל כרומטי?", "צליל זר שאינו שייך לסולם המנוגן", ["צליל השורש", "הטון המוביל בלבד", "תו ארוך", "הצליל הגבוה ביותר"], S(12, 7)],
      ["הכפלת קצב יוצרת תחושה ש...", "הטמפו קפץ פי 2", ["הטמפו ירד בחצי", "המשקל השתנה ל-3/4", "הסולם השתנה", "האקורדים נעלמו"], S(12, 12)],
      ["באילו ז'אנרים נשענים על סינקופות כאמצעי הלחנתי מרכזי?", "FUNK ומוזיקה לטינית", ["שירי ילדים", "מוזיקה קלאסית בלבד", "אמביינט", "מוזיקת פתיחה"], S(12, 11)],
      ["מתי מופיעה סינקופה בנוסף על העברת הדגש?", "כשההטעמה באה בין הפעמות (אוף-ביט)", ["כשיש פזמון", "כשהסולם מז'ור", "בכל אקורד מינורי", "רק בפתיחה"], S(12, 9)],
    ];
    const f = pick(facts); return mc("pentatonic", "chromaticSync", f[0], f[1], f[2], f[1], f[3]);
  },
]);

/* ---- קצב ---- */
topic("rhythm", "קצב, משקל וטמפו", "ערכים קצביים, BPM, שש-עשיריות, טריולה, נקודה", [
  function noteCount() {
    const v = pick([["שלם", 1], ["חצי", 2], ["רבע", 4], ["שמינית", 8], ["שש-עשירית", 16]]);
    return mc("rhythm", "noteCount", `כמה תווי ${v[0]} נכנסים בתיבה של 4/4?`, String(v[1]), ["1", "2", "4", "8", "16"], "שלם = 2 חצאים = 4 רבעים = 8 שמיניות (= 16 שש-עשיריות).", S(2, "8, 10") + " ו-" + S(7, 6));
  },
  function bpmFacts() {
    const facts = [
      ["מהו BPM?", "Beats Per Minute – כמה רבעים נכנסים בדקה", ["מספר התיבות בשיר", "גובה הצליל", "אורך השיר", "מספר האקורדים"], S(2, 11)],
      ["שיר רוק ממוצע מנוגן בערך ב-...", "120 BPM", ["60 BPM", "90 BPM", "180 BPM", "30 BPM"], S(2, 11)],
      ["קצב תופים סטנדרטי ב-90 BPM ישמע כמו...", "היפהופ", ["רוק", "טראנס", "ואלס", "פולקה"], S(2, 11)],
      ["במשקל 4/4 על אילו פעמות הדגשים הרגילים?", "1 וגם 3", ["2 וגם 4", "1 בלבד", "רק 4", "1, 2, 3, 4 שווים"], S(2, 6)],
      ["מה מייצגים המכנה והמונה במשקל?", "מכנה – \"מה סופרים?\", מונה – \"כמה יש?\"", ["מונה – סוג הערך", "אין להם משמעות", "מכנה – הטמפו", "מונה – הסולם"], S(2, 5)],
      ["איך סופרים שש-עשיריות?", "טה קה טי קה (לכל רבע)", ["טה קה קה", "אחד ואו", "אחת שתיים", "טה-טה"], S(7, 6)],
      ["איך סופרים טריולת שמיניות?", "טה קה קה", ["טה קה טי קה", "אחד ואו", "טה-טה", "בום-טס"], S(7, 8)],
      ["מה ההבדל בין 16ות לטריולות לפי טיפ הטראנס?", "טראנס \"שבטי\" – טריולות, טראנס \"כאסח\" – 16ות", ["ההפך", "אין הבדל", "16ות בבלוז בלבד", "טריולות רק בבס"], S(7, 8)],
      ["מה פירוש 'מנוקד'?", "סופרים את הערך + חצי מהערך", ["הערך מוכפל פי 2", "הערך מוקטן בחצי", "מוסיפים טון", "הערך נעצר"], S(7, 9)],
      ["כמה פעמות שווה שמינית מנוקדת?", "¾ פעמה", ["½ פעמה", "1 פעמה", "1½ פעמות", "¼ פעמה"], "½ + ¼ (חצי מ-½) = ¾.", S(7, 9)],
      ["מהו קצב הרמוני?", "המהירות שבה משתנים האקורדים", ["מהירות הטמפו", "קצב התופים", "קצב המלודיה", "מספר הנגנים"], S(7, 5)],
    ];
    const f = pick(facts); return mc("rhythm", "bpmFacts", f[0], f[1], f[2], f[3].length > 30 && !f[3].startsWith("שיעור") ? f[3] : f[1], f[3].startsWith("שיעור") ? f[3] : S(7, 9));
  },
]);

/* ---- מבנה שיר ---- */
topic("form", "מבנה שיר פופולרי", "בית, פזמון, C-Part, הוק, פרי קורוס", [
  function formFacts() {
    const facts = [
      ["מהם שני המרכיבים שאי אפשר לוותר עליהם בשיר מערבי?", "בית (Verse) ופזמון (Chorus)", ["פתיחה וסיום", "הוק וריף", "C-Part ופרי קורוס", "אינטרו ואאוטרו"], S(13, 3)],
      ["מה תפקיד ה-C-Part?", "לגרום למאזין להתגעגע לבית/לפזמון ולתבל את השיר", ["להחליף את הפזמון", "לפתוח את השיר", "לסיים את השיר", "להציג את ההוק"], S(13, 4)],
      ["מהו הוק ליין?", "מוטיב מלודי, קצבי או סאונד שמזכיר למאזין את השיר", ["חלק הסיום", "אקורד כוח", "תבנית 12 תיבות", "פזמון ארוך"], S(13, 4)],
      ["איזה חלק מעצים את כניסת הפזמון ובונה מתח?", "פרי קורוס / Bridge", ["אאוטרו", "אינטרו", "פוסט קורוס", "C-Part"], S(13, 5)],
      ["מה תפקיד פוסט קורוס / אינטרו לבית שני?", "להעביר את המוזיקה מהפזמון לבית", ["לסיים את השיר", "לפתוח את השיר", "להעצים את הפזמון", "להחליף את ההוק"], S(13, 6)],
      ["באיזה אורך נערכים רוב השירים ברדיו?", "כשלוש וחצי דקות (ויש שאומרים שלוש ומטה)", ["שמונה דקות", "חמש דקות", "דקה אחת", "עשר דקות"], S(13, 8)],
      ["כל כמה זמן כדאי להוסיף אלמנט מוזיקלי חדש לפי השקפים?", "כל 15 שניות / 8 תיבות", ["כל דקה", "כל 4 תיבות", "כל 30 שניות", "רק בפזמון"], S(13, 9)],
      ["מתי מקובל להציג את ההוק ליין היום?", "בשניות הראשונות של השיר", ["בסוף השיר", "רק בפזמון השני", "ב-C-Part", "לא מציגים"], S(13, 4)],
      ["לפי תרשימי המבנה, מתי הפזמון הראשון צריך להגיע?", "לפני דקה", ["אחרי שתי דקות", "בסוף השיר", "אחרי ה-C-Part", "אחרי 3 דקות"], S(13, 7)],
      ["מהו Breakdown?", "גרסה מצומצמת של הבית/הפזמון", ["פזמון כפול", "סיום מהיר", "הרחבה של הבית", "סולו תופים"], S(13, 4)],
    ];
    const f = pick(facts); return mc("form", "formFacts", f[0], f[1], f[2], f[1], f[3]);
  },
]);

/* ---- מושגים (מהמילון) ---- */
function maskTerm(q, term) {
  let out = q; const words = term.replace(/[()\/\-–,]/g, " ").split(/\s+/).filter(w => w.length >= 3);
  words.forEach(w => { out = out.split(w).join("_____"); });
  return out;
}
/* מושגים שסומנו "לא ידעתי" (בכרטיסיות או בשאלות) מופיעים בשאלות בתדירות גבוהה יותר */
const withTerm = (i, q) => { q.termIdx = i; return q; };
function pickTerm() { const cand = TERMS.map((t, i) => ({ t, i })).filter(x => x.t.quotes.length); return weightedPick(cand, x => { const m = (typeof kMastery === "function") ? kMastery("C:" + x.i) : null; return m === null ? 1.5 : 0.5 + 5 * (1 - m); }); }
topic("concepts", "מושגים והגדרות", "התאמת הגדרה לשם המושג – מתוך מילון הקורס", [
  function conceptDef() {
    const { t, i } = pickTerm();
    const q = pick(t.quotes); const masked = maskTerm(q.q, t.term);
    return withTerm(i, mc("concepts", "conceptDef", `איזה מושג מוגדר כך בשקפים?<br><i>"${masked}"</i>`, t.term, shuffle(TERMS).map(x => x.term), `${t.term}: "${q.q}"`, S(q.l, q.s)));
  },
  function conceptTerm() {
    const { t, i } = pickTerm(); const q = pick(t.quotes);
    const others = shuffle(TERMS.filter(x => x.term !== t.term)).slice(0, 3).map(x => pick(x.quotes).q);
    return withTerm(i, mc("concepts", "conceptTerm", `איזה משפט מהשקפים מתאר את <b>${t.term}</b>?`, q.q, others, `המשפט מתוך ${S(q.l, q.s)}.`, S(q.l, q.s)));
  },
]);

const TOPIC_ORDER = ["intervals", "scales", "chords", "sevenths", "functional", "modes", "pentatonic", "rhythm", "form", "concepts"];
function genQuestion(topicId, genIndex) {
  const T = TOPICS[topicId]; const gens = T.gens;
  for (let t = 0; t < 30; t++) { const g = genIndex === undefined ? pick(gens) : gens[genIndex % gens.length]; try { const q = g(); if (q) return q; } catch (e) { console.error(e); } }
  return null;
}

/* ===================== אחסון והתקדמות ===================== */
const KEY = "theoryApp.v2";
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
function save(st) { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } }
let ST = load(); ST.stats = ST.stats || {}; ST.srs = ST.srs || {}; ST.exams = ST.exams || []; ST.ear = ST.ear || {}; ST.active = ST.active || {};
/* שמירה אוטומטית של מבחן/תרגיל באמצע: LEAVE_GUARD שואל לפני יציאה, FLUSH_ACTIVE שומר מצב עדכני (גם כשהאפליקציה נסגרת) */
let LEAVE_GUARD = null, FLUSH_ACTIVE = null;
document.addEventListener("visibilitychange", () => { if (document.hidden && FLUSH_ACTIVE) { try { FLUSH_ACTIVE(); } catch (e) { } } });
window.addEventListener("pagehide", () => { if (FLUSH_ACTIVE) { try { FLUSH_ACTIVE(); } catch (e) { } } });
/* ===================== מודל ידע אחיד =====================
   כל תשובה – תרגול, מבחן, שאלון קצר, כרטיסיות מושגים, תרגילי אוזן – מעדכנת "שליטה" (0–1) לפי שיעור (L:), נושא (T:) ומושג (C:).
   התרגול החכם, המושגים בשאלות, מפת הלמידה והשאלון הקצר כולם נשענים על אותו מידע. */
ST.k = ST.k || {};
function kUpdate(tag, ok) { const e = ST.k[tag] = ST.k[tag] || { n: 0, s: 0.5, w: 0, t: 0 }; e.n++; e.s = e.n === 1 ? (ok ? 0.85 : 0.15) : 0.65 * e.s + 0.35 * (ok ? 1 : 0); if (!ok) e.w++; e.t = Date.now(); }
const kMastery = tag => { const e = ST.k[tag]; return e ? e.s : null; };
function lessonsOfSrc(src) { const out = new Set(); String(src || "").replace(/שיעור\s*(\d+)/g, (m, l) => out.add(+l)); return [...out]; }
function kRecord(tags, ok) { tags.forEach(t => kUpdate(t, ok)); save(ST); }
function record(q, ok) {
  const k = q.topic + ":" + q.gen; const s = ST.stats[k] = ST.stats[k] || { n: 0, r: 0 };
  s.n++; if (ok) s.r++;
  const tags = ["T:" + q.topic, ...lessonsOfSrc(q.src).map(l => "L:" + l)]; if (q.termIdx !== undefined) tags.push("C:" + q.termIdx);
  tags.forEach(t => kUpdate(t, ok)); save(ST);
}
function topicStats(id) { let n = 0, r = 0; for (const k in ST.stats) if (k.startsWith(id + ":")) { n += ST.stats[k].n; r += ST.stats[k].r; } return { n, r }; }
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15];
const lessonStatus = l => { const m = kMastery("L:" + l); return m === null ? "new" : m < 0.5 ? "weak" : m < 0.75 ? "mid" : "good"; };
const STATUS_HE = { new: "טרם תורגל", weak: "צריך חיזוק", mid: "בדרך", good: "שולט" };
const weakLessons = (n = 3) => LESSONS.map(l => ({ l, m: kMastery("L:" + l) })).filter(x => x.m !== null && x.m < 0.75).sort((a, b) => a.m - b.m).slice(0, n);
const weakTermList = () => TERMS.map((t, i) => ({ t, i, m: kMastery("C:" + i) })).filter(x => x.m !== null && x.m < 0.6).sort((a, b) => a.m - b.m);
const weightOf = m => m === null ? 0.7 : Math.max(0.08, 1.05 - m);
/* שאלה חכמה: בוחרים שיעור לפי חולשה, ואז שואלים עליו (נושא לפי חולשה) */
function smartQuestion() {
  const L = weightedPick(LESSONS, l => weightOf(kMastery("L:" + l)));
  for (let t = 0; t < 90; t++) { const id = weightedPick(TOPIC_ORDER, x => weightOf(kMastery("T:" + x))); const q = genQuestion(id); if (q && lessonsOfSrc(q.src).includes(L)) return q; }
  return genQuestion(weightedPick(TOPIC_ORDER, x => weightOf(kMastery("T:" + x))));
}
function weakSummary() {
  const wl = weakLessons(3), wt = weakTermList().length;
  if (!wl.length && !wt) return Object.keys(ST.k).length ? "אין כרגע נקודות חלשות – כל הכבוד. אפשר לעשות שאלון קצר כדי לבדוק שוב." : "עוד אין נתונים. התחל בשאלון קצר – הוא ימפה במה לחזק.";
  return "מתמקד ב: " + [...wl.map(x => `שיעור ${x.l}`), wt ? `${wt} מושגים` : null].filter(Boolean).join(" · ");
}

/* ===================== ממשק ===================== */
const TABS = [["home", "🏠", "בית"], ["practice", "✏️", "תרגול"], ["ear", "👂", "אוזן"], ["ref", "📚", "חומר"], ["chat", "💬", "צ'אט"]];
const TAB_OF = { home: "home", practice: "practice", flash: "practice", exam: "practice", quiz: "practice", ear: "ear", ref: "ref", slides: "ref", chat: "chat" };
let view = "home";
function renderNav() {
  const bar = $("#tabbar"); if (!bar) return; bar.innerHTML = "";
  TABS.forEach(([id, ic, t]) => bar.append(h("button", { class: TAB_OF[view] === id ? "on" : "", "aria-label": t, "aria-current": TAB_OF[view] === id ? "page" : null, onclick: () => go(id) }, h("span", { class: "ti" }, ic), h("span", { class: "tl" }, t))));
}
function go(v, arg) { if (LEAVE_GUARD) { if (!LEAVE_GUARD(v, arg)) return; if (FLUSH_ACTIVE) { try { FLUSH_ACTIVE(); } catch (e) { } } LEAVE_GUARD = null; FLUSH_ACTIVE = null; } stopAudio(); if (EXAM_TIMER) { clearInterval(EXAM_TIMER); EXAM_TIMER = null; } view = v; renderNav(); const app = $("#app"); app.innerHTML = ""; ({ home, chat, practice, ear, flash, exam, ref, quiz, slides: (a, g) => ref(a, { tab: "slides" }) })[v](app, arg); window.scrollTo(0, 0); }

/* ---- בית ---- */
const det = (title, ...kids) => { const d = h("details", { class: "fold" }, h("summary", {}, title), ...kids); return d; };
function home(app) {
  const qs = h("input", { class: "search", type: "search", placeholder: "🔎 חיפוש מושג או מילה בכל המצגות", style: "direction:rtl;text-align:right;font-size:17px", autocomplete: "off", onkeydown: e => { if (e.key === "Enter" && e.target.value.trim()) go("ref", { tab: "search", q: e.target.value.trim() }); } });
  const sv = ST.active.exam || ST.active.ear;
  const detail = h("div", { id: "lessonpanel" });
  const map = h("div", { class: "lmap" }, ...LESSONS.map(l => h("button", { class: "lchip " + lessonStatus(l), "aria-label": `שיעור ${l}: ${STATUS_HE[lessonStatus(l)]}`, onclick: () => { detail.innerHTML = ""; detail.append(lessonPanel(l)); } }, String(l))));
  const lastExam = ST.exams.length ? ST.exams[ST.exams.length - 1] : null;
  app.append(...[
    h("div", { class: "card" }, qs),
    sv ? h("div", { class: "card", style: "border-color:var(--acc)" }, h("b", {}, "⏸ יש משהו שלא סיימת"), h("div", { class: "row", style: "margin-top:8px" }, ST.active.exam ? h("button", { class: "btn", onclick: () => go("exam", { resume: true }) }, "▶ המשך מבחן") : null, ST.active.ear ? h("button", { class: "btn", onclick: () => { unlockAudio(); go("ear", { stage: "run", resume: true }); } }, "▶ המשך תרגיל אוזן") : null)) : null,
    h("div", { class: "card hero" }, h("button", { class: "btn big", onclick: () => go("practice", { smart: true }) }, "▶ תרגול חכם"), h("div", { class: "muted", style: "margin-top:6px" }, weakSummary()),
      h("div", { class: "row", style: "margin-top:10px" }, h("button", { class: "btn alt", onclick: () => go("quiz") }, "⚡ שאלון קצר"), h("button", { class: "btn alt", onclick: () => go("flash") }, "🃏 כרטיסיות"), h("button", { class: "btn alt", onclick: () => go("exam") }, "📝 מבחן"))),
    h("div", { class: "card" }, h("h3", { style: "margin:0 0 6px" }, "🗺 מפת הלמידה"), h("div", { class: "muted", style: "font-size:13px;margin-bottom:8px" }, "לחץ על שיעור: ירוק = שולט · כתום = בדרך · אדום = לחזק · אפור = טרם תורגל"), map, detail),
    lastExam ? h("div", { class: "card muted" }, `מבחן אחרון: ${lastExam.pct}% (${lastExam.n} שאלות)`) : null,
    det("📈 פירוט לפי נושא", ...TOPIC_ORDER.map(id => { const s = topicStats(id); const pct = s.n ? Math.round(100 * s.r / s.n) : 0; return h("div", { style: "margin:8px 0" }, h("div", { class: "row", style: "justify-content:space-between" }, h("span", {}, TOPICS[id].he), h("span", { class: "muted" }, s.n ? `${pct}% (${s.r}/${s.n})` : "טרם תורגל")), h("div", { class: "bar" }, h("i", { style: `width:${pct}%` }))); })),
    det("⚙️ עוד: התקנה בטלפון וגיבוי", location.protocol.startsWith("http") ? h("p", {}, "אייפון (Safari): כפתור השיתוף ⬆︎ ← \"הוסף למסך הבית\". אנדרואיד (Chrome): תפריט ⋮ ← \"התקן אפליקציה\". אחרי ההתקנה האפליקציה נפתחת במסך מלא וגם עובדת בלי אינטרנט.") : null,
      window.__installPrompt ? h("button", { class: "btn", onclick: () => window.__installPrompt.prompt() }, "התקן עכשיו") : null,
      h("p", { class: "muted" }, "ההתקדמות נשמרת במכשיר הזה בלבד. כדי להעביר בין טלפון למחשב: ייצא קוד, הדבק אותו במכשיר השני וייבא."),
      h("div", { class: "row" }, h("button", { class: "btn alt", onclick: exportProgress }, "📤 ייצוא התקדמות"), h("button", { class: "btn alt", onclick: importProgress }, "📥 ייבוא התקדמות")),
      h("button", { class: "btn alt", style: "margin-top:8px", onclick: slidesOpenSummaryPdf }, "📕 הסיכום המלא (PDF)"))
  ].filter(Boolean));
}
function lessonPanel(l) {
  const m = kMastery("L:" + l); const st = lessonStatus(l);
  return h("div", { class: "fb good", style: "margin-top:10px" }, h("b", {}, `שיעור ${l} – ${LESSON_TITLES[l] || ""}`), h("div", { class: "muted" }, `${STATUS_HE[st]}${m !== null ? ` · שליטה ${Math.round(m * 100)}%` : ""}`),
    h("div", { class: "row", style: "margin-top:8px" }, h("button", { class: "btn", onclick: () => openSlide(l, 1) }, "📄 פתח מצגת"), h("button", { class: "btn alt", onclick: () => go("quiz", { scope: "lesson", l }) }, "⚡ שאלון על השיעור"), h("button", { class: "btn alt", onclick: () => go("practice", { lesson: l }) }, "🔁 תרגל שיעור")));
}
function exportProgress() {
  const code = btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, k: ST.k, stats: ST.stats, srs: ST.srs, exams: ST.exams }))));
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(() => alert("הקוד הועתק. הדבק אותו במכשיר השני דרך 'ייבוא התקדמות'."), () => prompt("העתק את הקוד:", code)); else prompt("העתק את הקוד:", code);
}
function importProgress() {
  const code = prompt("הדבק כאן את קוד ההתקדמות:"); if (!code) return;
  try { const d = JSON.parse(decodeURIComponent(escape(atob(code.trim())))); if (!d || d.v !== 1) throw 0; if (!confirm("הייבוא יחליף את ההתקדמות במכשיר הזה. להמשיך?")) return; ST.k = d.k || {}; ST.stats = d.stats || {}; ST.srs = d.srs || {}; ST.exams = d.exams || []; save(ST); go("home"); }
  catch (e) { alert("הקוד לא תקין."); }
}

/* ---- בניית ממשק שאלה (משותף) ---- */
function questionView(q, opts) { // opts: {onAnswer(ok), showNow:true/false, preset}
  const box = h("div", { class: "card" });
  box.append(h("div", { class: "src" }, TOPICS[q.topic].he), h("div", { class: "prompt", html: q.prompt }));
  const fbWrap = h("div");
  let done = false;
  function finish(ok, chosenText) {
    if (done) return; done = true;
    if (opts.instant) {
      fbWrap.innerHTML = "";
      fbWrap.append(h("div", { class: "fb " + (ok ? "good" : "no") }, h("b", {}, ok ? "✔ נכון" : "✘ לא נכון"), " ", ok ? "" : h("span", {}, "התשובה הנכונה: ", h("span", { class: "ltr", html: fmtAns(q) })), h("div", { html: q.expl || "" }), h("div", { class: "src" }, srcNode(q.src))));
    }
    opts.onAnswer(ok, chosenText);
  }
  if (q.kind === "mc") {
    const wrap = h("div", { class: "opts" });
    q.options.forEach((o, i) => {
      const b = h("button", { class: "opt", onclick: () => {
        if (opts.instant) { if (done) return; [...wrap.children].forEach((c, j) => { c.disabled = true; if (j === q.correct) c.classList.add("right"); else if (j === i) c.classList.add("wrong"); }); finish(i === q.correct, o); }
        else { [...wrap.children].forEach(c => c.classList.remove("sel")); b.classList.add("sel"); opts.onSelect && opts.onSelect(i, o); }
      } }); b.innerHTML = o; wrap.append(b);
    });
    box.append(wrap);
    if (opts.preset !== undefined) { const c = wrap.children[opts.preset]; c && c.classList.add("sel"); }
  } else {
    const inp = h("input", { type: "text", placeholder: "למשל: C D E F G A B", autocomplete: "off", spellcheck: "false" });
    if (opts.presetText) inp.value = opts.presetText;
    const check = () => { const user = normList(inp.value); const ok = user.length === q.answerList.length && user.every((x, i) => x === q.answerList[i]); inp.disabled = true; btn.disabled = true; finish(ok, inp.value); };
    const btn = h("button", { class: "btn", onclick: check }, "בדוק");
    inp.addEventListener("keydown", e => { if (e.key === "Enter" && opts.instant) check(); });
    inp.addEventListener("input", () => opts.onSelect && opts.onSelect(null, inp.value));
    box.append(inp, h("div", { class: "row", style: "margin-top:8px" }, opts.instant ? btn : null));
  }
  box.append(fbWrap);
  return box;
}
function fmtAns(q) { return q.kind === "mc" ? q.options[q.correct] : q.answerList.map(fmtNote).join(" "); }
function checkText(q, val) { const user = normList(val || ""); return user.length === q.answerList.length && user.every((x, i) => x === q.answerList[i]); }

/* ---- תרגול ---- */
function practice(app, arg) {
  if (!arg || (!arg.topic && !arg.smart && !arg.lesson)) {
    const sv = ST.active.exam;
    app.append(
      h("div", { class: "card hero" }, h("h2", { style: "margin:0 0 6px" }, "✏️ תרגול"), h("button", { class: "btn big", onclick: () => go("practice", { smart: true }) }, "▶ תרגול חכם"), h("div", { class: "muted", style: "margin-top:6px" }, weakSummary()),
        h("div", { class: "row", style: "margin-top:10px" }, h("button", { class: "btn alt", onclick: () => go("quiz") }, "⚡ שאלון קצר"), h("button", { class: "btn alt", onclick: () => go("flash") }, "🃏 כרטיסיות"), h("button", { class: "btn alt", onclick: () => go("exam") }, sv ? "📝 מבחן (יש שמור)" : "📝 מבחן סימולציה"))),
      det("📚 לפי נושא", h("div", { class: "grid" }, h("button", { class: "tile", onclick: () => go("practice", { topic: "all" }) }, "🔀 מיקס מכל הנושאים", h("small", {}, "כמו במבחן, עם משוב מיידי")), ...TOPIC_ORDER.map(id => { const s = topicStats(id); return h("button", { class: "tile", onclick: () => go("practice", { topic: id }) }, TOPICS[id].he, h("small", {}, s.n ? `דיוק ${Math.round(100 * s.r / s.n)}% · ${s.n} שאלות` : "טרם תורגל")); }))),
      det("🔢 לפי שיעור", h("div", { class: "lmap" }, ...LESSONS.map(l => h("button", { class: "lchip " + lessonStatus(l), "aria-label": `תרגל שיעור ${l}`, onclick: () => go("practice", { lesson: l }) }, String(l))))),
      h("p", { class: "muted", style: "font-size:13px" }, "💾 כל תשובה נשמרת ומשפיעה על התרגול החכם."));
    return;
  }
  let count = 0, right = 0;
  const title = arg.smart ? "תרגול חכם" : arg.lesson ? `שיעור ${arg.lesson}` : arg.topic === "all" ? "מיקס" : TOPICS[arg.topic].he;
  const host = h("div"); app.append(h("div", { class: "row", style: "justify-content:space-between" }, h("button", { class: "btn alt", onclick: () => go("practice") }, "← חזרה"), h("b", {}, title), h("span", { class: "pill", id: "score" }, "0/0")), host);
  function nextQ() {
    if (arg.smart) return smartQuestion();
    if (arg.lesson) { for (let t = 0; t < 120; t++) { const q = genQuestion(pick(TOPIC_ORDER)); if (q && lessonsOfSrc(q.src).includes(arg.lesson)) return q; } return smartQuestion(); }
    return genQuestion(arg.topic === "all" ? pick(TOPIC_ORDER) : arg.topic);
  }
  function next() {
    const q = nextQ(); host.innerHTML = "";
    host.append(questionView(q, { instant: true, onAnswer: ok => { count++; if (ok) right++; record(q, ok); $("#score").textContent = `${right}/${count}`; const nb = h("button", { class: "btn big", style: "width:100%", onclick: next }, "שאלה הבאה ←"); host.append(nb); setTimeout(() => { try { nb.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) { } }, 60); } }));
  }
  next();
}

/* ---- שאלון קצר: מזהה במה לחזק ומעדכן את כל הנתונים ---- */
function quizQs(arg) {
  if (arg.scope === "all") return TOPIC_ORDER.map(id => genQuestion(id)).filter(Boolean);
  if (arg.scope === "topic") { const n = TOPICS[arg.topic].gens.length; return shuffle([...Array(n).keys()]).slice(0, 6).map(i => genQuestion(arg.topic, i)).filter(Boolean); }
  const used = new Set(), out = [];
  for (let t = 0; t < 500 && out.length < 5; t++) { const id = pick(TOPIC_ORDER), gi = rnd(TOPICS[id].gens.length), key = id + gi; if (used.has(key)) continue; const q = genQuestion(id, gi); if (q && lessonsOfSrc(q.src).includes(arg.l)) { used.add(key); out.push(q); } }
  return out.length >= 3 ? out : out.concat([...Array(5 - out.length)].map(() => smartQuestion()));
}
function quiz(app, arg) {
  if (!arg || !arg.scope) {
    app.append(h("div", { class: "card" }, h("h2", { style: "margin:0 0 6px" }, "⚡ שאלון קצר"), h("p", { class: "muted" }, "כמה שאלות בלבד כדי לדעת במה לחזק. התוצאות מתעדכנות במפת הלמידה ומשפיעות על התרגול החכם."),
      h("button", { class: "btn big", style: "width:100%", onclick: () => go("quiz", { scope: "all" }) }, "🌐 כל הנושאים – שאלה מכל נושא")),
      det("🔢 על שיעור מסוים", h("div", { class: "lmap" }, ...LESSONS.map(l => h("button", { class: "lchip " + lessonStatus(l), "aria-label": `שאלון על שיעור ${l}`, onclick: () => go("quiz", { scope: "lesson", l }) }, String(l))))),
      det("📚 על נושא מסוים", h("div", { class: "grid" }, ...TOPIC_ORDER.map(id => h("button", { class: "tile", onclick: () => go("quiz", { scope: "topic", topic: id }) }, TOPICS[id].he)))));
    return;
  }
  const qs = quizQs(arg); const res = []; let idx = 0;
  const bar = h("i", { style: "width:0%" }), host = h("div");
  app.append(h("div", { class: "row", style: "flex-wrap:nowrap" }, h("button", { class: "btn alt", style: "padding:8px 14px", "aria-label": "יציאה", onclick: () => go("quiz") }, "✕"), h("div", { class: "bar", style: "flex:1;height:14px" }, bar), h("span", { class: "muted", id: "qzc" }, "")), host);
  function show() {
    if (idx >= qs.length) return done();
    const q = qs[idx]; host.innerHTML = ""; bar.style.width = (100 * idx / qs.length) + "%"; $("#qzc").textContent = `${idx + 1}/${qs.length}`;
    host.append(questionView(q, { instant: true, onAnswer: ok => { record(q, ok); res.push({ q, ok }); const nb = h("button", { class: "btn big", style: "width:100%", onclick: () => { idx++; show(); } }, idx + 1 >= qs.length ? "לתוצאות ←" : "הבאה ←"); host.append(nb); setTimeout(() => { try { nb.scrollIntoView({ block: "nearest", behavior: "smooth" }); } catch (e) { } }, 60); } }));
  }
  function done() {
    bar.style.width = "100%"; host.innerHTML = ""; const r = res.filter(x => x.ok).length; const wrong = res.filter(x => !x.ok);
    const lessons = [...new Set(res.flatMap(x => lessonsOfSrc(x.q.src)))].sort((a, b) => a - b);
    host.append(h("div", { class: "card", style: "text-align:center" }, h("h2", { style: "margin:0" }, `${r} / ${res.length}`), h("p", {}, r === res.length ? "מצוין! הכל נכון 🎉" : wrong.length > res.length / 2 ? "יש מה לחזק – הנה מה שכדאי לעשות:" : "יפה! כמה נקודות לחיזוק:")),
      wrong.length ? h("div", { class: "card" }, h("h3", { style: "margin:0 0 6px" }, "לחזק"), ...wrong.map(x => h("div", { style: "margin:8px 0;padding-bottom:8px;border-bottom:1px solid var(--line)" }, h("div", { html: x.q.prompt }), h("div", { class: "fb good", style: "margin-top:6px" }, h("span", { class: "ltr", html: fmtAns(x.q) }), h("div", { class: "src", style: "margin-top:4px" }, srcNode(x.q.src)))))) : null,
      h("div", { class: "card" }, h("h3", { style: "margin:0 0 6px" }, "מפת השיעורים בשאלון"), h("div", { class: "lmap" }, ...lessons.map(l => h("button", { class: "lchip " + lessonStatus(l), onclick: () => openSlide(l, 1), "aria-label": `שיעור ${l}` }, String(l))))),
      h("div", { class: "row" }, h("button", { class: "btn big", onclick: () => go("practice", { smart: true }) }, "▶ תרגל את החלש"), h("button", { class: "btn alt", onclick: () => go("quiz", arg) }, "שאלון נוסף"), h("button", { class: "btn alt", onclick: () => go("home") }, "לבית")));
  }
  show();
}


/* ---- מבחן סימולציה ---- */
function examMenu(app) {
  const sv = ST.active.exam;
  const start = (n, m) => () => { if (sv && !confirm(`יש מבחן שלא הסתיים (שאלה ${sv.cur + 1} מתוך ${sv.qs.length}). התחלת מבחן חדש תמחק אותו.\nלהמשיך ולמחוק?`)) return; delete ST.active.exam; save(ST); go("exam", { n, minutes: m }); };
  const left = sv ? Math.ceil(sv.left / 60000) : 0;
  app.append(
    sv ? h("div", { class: "card", style: "border-color:var(--acc)" }, h("h3", {}, "⏸ מבחן שנשמר באמצע"), h("p", {}, `שאלה ${sv.cur + 1} מתוך ${sv.qs.length} · נשארו כ-${left} דקות (השעון עצור עד שתמשיך). ענית על ${sv.answers.filter(Boolean).length} שאלות.`),
      h("div", { class: "row" }, h("button", { class: "btn", onclick: () => go("exam", { resume: true }) }, "▶ המשך מבחן"), h("button", { class: "btn alt", onclick: () => { if (confirm("למחוק את המבחן השמור? לא ניתן לשחזר.")) { delete ST.active.exam; save(ST); go("exam"); } } }, "🗑 מחק"))) : null,
    h("div", { class: "card" }, h("h2", {}, "מבחן סימולציה"), h("p", {}, "שאלות מכל הנושאים, בלי משוב עד הסוף. בסוף תקבל ציון, פירוט לפי נושא ותיקון מלא עם מראי מקום."), h("p", { class: "muted", style: "font-size:13px" }, "💾 ההתקדמות נשמרת אוטומטית – אפשר לצאת ולחזור. לפני יציאה באמצע תקבל אזהרה."),
      h("div", { class: "row" }, ...[[20, 25], [30, 40], [45, 60]].map(([n, m]) => h("button", { class: "btn" + (sv ? " alt" : ""), onclick: start(n, m) }, `${n} שאלות · ${m} דק'`))),
      ST.exams.length ? h("div", {}, h("h3", {}, "ניסיונות קודמים"), h("table", {}, h("tr", {}, h("th", {}, "תאריך"), h("th", {}, "ציון"), h("th", {}, "שאלות")), ...ST.exams.slice(-8).reverse().map(e => h("tr", {}, h("td", {}, new Date(e.t).toLocaleDateString("he-IL")), h("td", {}, e.pct + "%"), h("td", {}, e.n))))) : null));
}
function exam(app, arg) {
  if (!arg || !(arg.n || arg.resume)) return examMenu(app);
  let qs, answers, cur, minutes, endAt, timerId;
  if (arg.resume && ST.active.exam) { const sv = ST.active.exam; qs = sv.qs; answers = sv.answers; cur = sv.cur; minutes = sv.minutes; endAt = Date.now() + sv.left; }
  else {
    qs = []; const per = TOPIC_ORDER.filter(t => t !== "concepts").concat(["concepts"]);
    for (let i = 0; i < arg.n; i++) { const q = genQuestion(per[i % per.length]); if (q) qs.push(q); }
    answers = new Array(qs.length).fill(null); cur = 0; minutes = arg.minutes; endAt = Date.now() + minutes * 60000;
  }
  const saveExam = () => { ST.active.exam = { qs, answers, cur, minutes, left: Math.max(0, endAt - Date.now()), t: Date.now() }; save(ST); };
  saveExam();
  FLUSH_ACTIVE = saveExam;
  LEAVE_GUARD = () => confirm("המבחן עדיין פתוח.\nאפשר לצאת – ההתקדמות נשמרת והשעון עוצר, ותוכל להמשיך מכרטיס 'מבחן סימולציה'.\n\nלצאת עכשיו?");
  const host = h("div"), timer = h("span", { class: "timer" }), prog = h("span", { class: "pill" });
  app.append(h("div", { class: "row", style: "justify-content:space-between" }, timer, prog, h("span", { class: "muted", style: "font-size:12px" }, "💾 נשמר אוטומטית"), h("button", { class: "btn bad", onclick: () => { if (confirm("לסיים את המבחן עכשיו?")) finishExam(); } }, "סיים")), host);
  let ticks = 0;
  function tick() { const left = Math.max(0, endAt - Date.now()); const m = Math.floor(left / 60000), s = Math.floor(left % 60000 / 1000); timer.textContent = `${m}:${String(s).padStart(2, "0")}`; if (++ticks % 20 === 0) saveExam(); if (left <= 0) finishExam(); }
  timerId = EXAM_TIMER = setInterval(tick, 500); tick();
  function show() {
    const q = qs[cur]; host.innerHTML = ""; prog.textContent = `שאלה ${cur + 1} מתוך ${qs.length}`;
    host.append(questionView(q, { instant: false, preset: answers[cur] && answers[cur].i, presetText: answers[cur] && answers[cur].txt, onSelect: (i, o) => { answers[cur] = q.kind === "mc" ? { i } : { txt: o }; saveExam(); }, onAnswer() { } }));
    host.append(h("div", { class: "row" }, h("button", { class: "btn alt", disabled: cur === 0, onclick: () => { cur--; saveExam(); show(); } }, "→ הקודמת"), h("button", { class: "btn", onclick: () => { if (cur < qs.length - 1) { cur++; saveExam(); show(); } else if (confirm("לסיים את המבחן?")) finishExam(); } }, cur < qs.length - 1 ? "הבאה ←" : "סיים")));
  }
  show();
  function finishExam() {
    clearInterval(timerId); app.innerHTML = ""; LEAVE_GUARD = null; FLUSH_ACTIVE = null; delete ST.active.exam; save(ST);
    let right = 0; const byTopic = {}; const wrong = [];
    qs.forEach((q, i) => { const a = answers[i]; const ok = a && (q.kind === "mc" ? a.i === q.correct : checkText(q, a.txt)); if (ok) right++; else wrong.push({ q, a }); const b = byTopic[q.topic] = byTopic[q.topic] || { n: 0, r: 0 }; b.n++; if (ok) b.r++; record(q, !!ok); });
    const pct = Math.round(100 * right / qs.length); ST.exams.push({ t: Date.now(), pct, n: qs.length }); save(ST);
    app.append(h("div", { class: "card" }, h("h2", {}, `ציון: ${pct}% (${right}/${qs.length})`), ...Object.entries(byTopic).map(([t, b]) => h("div", { style: "margin:6px 0" }, h("div", { class: "row", style: "justify-content:space-between" }, TOPICS[t].he, `${b.r}/${b.n}`), h("div", { class: "bar" }, h("i", { style: `width:${100 * b.r / b.n}%` })))), h("button", { class: "btn", onclick: () => go("exam") }, "מבחן נוסף")),
      h("h3", {}, wrong.length ? "תיקון הטעויות" : "אין טעויות – כל הכבוד!"),
      ...wrong.map(({ q, a }) => h("div", { class: "card" }, h("div", { class: "prompt", html: q.prompt }), h("div", { class: "fb no" }, "התשובה שלך: ", a ? (q.kind === "mc" ? q.options[a.i] : a.txt) : "לא נענתה"), h("div", { class: "fb good" }, "נכון: ", h("span", { class: "ltr", html: fmtAns(q) }), h("div", { html: q.expl || "" }), h("div", { class: "src" }, srcNode(q.src))))));
    window.scrollTo(0, 0);
  }
}

/* ---- כרטיסיות מושגים (חזרה מרווחת, נשמרות ומשפיעות על שאר התרגול) ---- */
const BOX_DAYS = [0, 1, 3, 7, 14, 30];
function flash(app) {
  const now = Date.now();
  const due = TERMS.map((t, i) => ({ t, i, s: ST.srs[i] || { box: 0, due: 0 } })).filter(x => x.s.due <= now);
  const mv = x => { const m = kMastery("C:" + x.i); return (m === null ? 0.5 : m) + (Math.random() - 0.5) * 0.35; };
  const order = due.slice().sort((a, b) => mv(a) - mv(b));
  const host = h("div"); const info = h("div", { class: "muted", style: "font-size:13px" });
  let know = 0, dont = 0, idx = 0; const missed = new Set(); const again = new Set();
  app.append(h("div", { class: "card" }, h("h2", { style: "margin:0 0 4px" }, "🃏 כרטיסיות מושגים"), h("div", { class: "muted" }, `${due.length} לחזרה מתוך ${TERMS.length} · 💾 נשמר אוטומטית ומשפיע על התרגול החכם`), info), host);
  function paintInfo() { info.textContent = `ידעתי ${know} · לא ידעתי ${dont} · נשארו ${Math.max(0, order.length - idx)}`; }
  function showCard() {
    host.innerHTML = ""; paintInfo();
    if (idx >= order.length) {
      const weak = [...missed].map(i => TERMS[i]);
      host.append(h("div", { class: "card" }, h("p", {}, due.length ? `סיימת! ידעת ${know}, לא ידעת ${dont}.` : "אין כרטיסיות לחזרה כרגע – הכל מעודכן 🎉"),
        weak.length ? h("div", {}, h("b", {}, "מושגים לחיזוק:"), ...weak.map(t => h("div", { style: "margin:6px 0" }, t.term, " ", srcNode(`שיעור ${t.quotes[0].l}, שקף ${t.quotes[0].s}`, "")))) : null,
        h("div", { class: "row", style: "margin-top:10px" }, h("button", { class: "btn big", onclick: () => go("practice", { topic: "concepts" }) }, "תרגל שאלות על מושגים"), h("button", { class: "btn alt", onclick: () => { if (confirm("לאפס את כל ההתקדמות בכרטיסיות?")) { TERMS.forEach((t, i) => { ST.srs[i] = { box: 0, due: 0 }; delete ST.k["C:" + i]; }); save(ST); go("flash"); } } }, "אפס"))));
      return;
    }
    const c = order[idx]; let flipped = false;
    const card = h("div", { class: "card flash" }); const front = () => { card.innerHTML = ""; card.append(h("div", {}, c.t.term), c.t.en ? h("div", { class: "muted ltr" }, c.t.en) : null, h("small", { class: "muted" }, "(לחץ להצגת ההגדרה)")); };
    const back = () => { card.innerHTML = ""; card.append(h("div", { class: "back" }, ...c.t.quotes.map(q => h("p", {}, `"${q.q}"`, h("br"), h("span", { class: "src" }, slideBtn(`שיעור ${q.l}, שקף ${q.s}`, q.l, q.s)))))); };
    front(); card.onclick = () => { flipped = !flipped; flipped ? back() : front(); };
    const rate = ok => {
      const s = ST.srs[c.i] || { box: 0, due: 0 }; s.box = ok ? Math.min(s.box + 1, BOX_DAYS.length - 1) : 0; s.due = ok ? Date.now() + BOX_DAYS[s.box] * 86400000 : Date.now(); ST.srs[c.i] = s;
      kRecord(["T:concepts", "C:" + c.i, ...[...new Set(c.t.quotes.map(q => "L:" + q.l))]], ok); if (ok) know++; else { dont++; missed.add(c.i); if (!again.has(c.i)) { again.add(c.i); order.push(c); } }
      idx++; showCard();
    };
    host.append(card, h("div", { class: "row" }, h("button", { class: "btn bad big", style: "flex:1", onclick: () => rate(false) }, "❌ לא ידעתי"), h("button", { class: "btn ok big", style: "flex:1", onclick: () => rate(true) }, "✅ ידעתי")));
  }
  showCard();
}
