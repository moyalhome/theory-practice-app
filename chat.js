"use strict";
/* ===================== צ'אט הקורס: חיפוש בחומר + מחשבון תאוריה =====================
   לא מודל שפה: מחפש אך ורק בתמלול השקפים ובמילון, ומחשב סולמות/אקורדים/מרווחים לפי הכללים שבקורס. */
const HE_STOP = new Set("את של על מה מהו מהי מהם מהן הוא היא זה זו אם כי גם או אל עם לא כל יש הם הן אני איך למה האם תסביר הסבר ספר לי בבקשה אפשר רוצה לדעת איזה איזו אילו כמה מתי איפה מי בין מן אבל רק כך אז עוד כמו לפי יהיה יהיו היה בו בה בהם הזה הזאת אלה שלי שלך אותו אותה ממש בעצם בכלל תן תני".split(" "));
function nrm(s) { return s.replace(/[֑-ׇ]/g, "").replace(/מג['׳]ור/g, "מזור").replace(/[׳'"״`´’‘“”]/g, "").toLowerCase(); }
function stem(w) {
  if (!/[א-ת]/.test(w)) return w; let x = w;
  for (let i = 0; i < 2; i++) if (x.length > 3 && /^[והבכלמש]/.test(x)) x = x.slice(1);
  if (x.length > 4 && /(ים|ות|ית)$/.test(x)) x = x.slice(0, -2);
  return x;
}
function toks(s) { return nrm(s).split(/[^\p{L}\p{N}#♭♯]+/u).filter(w => w && !HE_STOP.has(w)).map(stem).filter(w => w.length > 1 || /\d/.test(w)); }

let IDX = null;
function buildIndex() {
  const docs = CORPUS.map(d => { const t = toks(d.t); const tf = {}; t.forEach(w => tf[w] = (tf[w] || 0) + 1); return { d, tf, len: t.length }; });
  const df = {}; docs.forEach(x => Object.keys(x.tf).forEach(w => df[w] = (df[w] || 0) + 1));
  const N = docs.length; const idf = {}; Object.keys(df).forEach(w => idf[w] = Math.log(1 + N / df[w]));
  IDX = { docs, idf };
}
function searchSlides(q, k = 3) {
  if (!IDX) buildIndex(); const qt = [...new Set(toks(q))]; if (!qt.length) return [];
  const res = IDX.docs.map(x => {
    let sc = 0, hit = 0;
    qt.forEach(w => { if (x.tf[w]) { sc += (IDX.idf[w] || 1) * (1 + Math.log(x.tf[w])); hit++; } });
    sc = sc * (0.5 + hit / qt.length) / Math.pow(1 + x.len, 0.25);
    return { d: x.d, sc, hit };
  }).filter(r => r.hit > 0).sort((a, b) => b.sc - a.sc).slice(0, k);
  return res.map(r => ({ ...r, qt }));
}
function snippet(text, qt) {
  const lines = text.split("\n").map(s => s.trim()).filter(Boolean);
  const scored = lines.map(l => { const lt = new Set(toks(l)); let s = 0; qt.forEach(w => { if (lt.has(w)) s++; }); return { l, s }; }).sort((a, b) => b.s - a.s);
  return scored.slice(0, 3).filter(x => x.s > 0).map(x => x.l).join("\n") || lines.slice(0, 2).join("\n");
}
function termHits(q) {
  const qt = new Set(toks(q)); const out = [];
  TERMS.forEach(t => { const tt = [...new Set(toks(t.term.replace(/[()\/]/g, " ")))]; if (tt.length && tt.every(w => qt.has(w))) out.push({ t, n: tt.length }); });
  return out.sort((a, b) => b.n - a.n).slice(0, 2).map(x => x.t);
}

/* ---- פענוח תווים ופקודות ---- */
const SOLF = { "דו": "C", "רה": "D", "מי": "E", "פה": "F", "סול": "G", "לה": "A", "סי": "B" };
function solfegeToLatin(q) {
  return q.replace(/(^|\s)(דו|רה|מי|פה|סול|לה|סי)(?:\s+(דיאז|במול))?(?=\s+(?:מז'?ור|מג'?ור|מינור|דורי|פריגי|לידי|מיקסולידי|אאולי|לוקריין|איוניין|פנטטוני))/g, (m, sp, n, a) => `${sp}${SOLF[n]}${a === "דיאז" ? "#" : a === "במול" ? "b" : ""}`);
}
function findNotes(q) {
  const out = []; const re = /(?<![A-Za-z])([A-G])(##|bb|[#b♯♭])?(?:m(?![A-Za-z]))?(?![A-Za-z0-9])/g; let m;
  while ((m = re.exec(q))) out.push(m[1] + (m[2] ? m[2].replace("♯", "#").replace("♭", "b") : ""));
  return out;
}
function minorSuffix(q) { return /(?<![A-Za-z])[A-G](?:##|bb|[#b♯♭])?m(?![A-Za-z])/.test(q); }
const IV_RE = /ה?(סקונדה|טרצה|קוורטה|קווינטה|סקסטה|ספטימה|אוקטבה|טריטון|פרימה|יוניסון)\s*(?:ה?(קטנה|גדולה))?\s*(?:מ|מן)-?\s*([A-G](?:##|bb|[#b♯♭])?)(?![A-Za-z])/;
const SCALE_KEYS = [
  [/מינור\s*הרמוני|הרמוני/, "harmonic"], [/מינור\s*מלודי|מלודי/, "melodic"], [/פנטטוני\s*מינור|מינור\s*פנטטוני/, "pentMin"], [/פנטטוני\s*(?:מז'?ור|מג'?ור)|(?:מז'?ור|מג'?ור)\s*פנטטוני/, "pentMaj"], [/בלוז\s*סקייל|blues\s*scale|סולם\s*(?:ה)?בלוז/i, "blues"],
  [/דורי/, "dorian"], [/פריגי/, "phrygian"], [/לידי/, "lydian"], [/מיקסולידי/, "mixolydian"], [/אאולי/, "aeolian"], [/לוקריין/, "locrian"], [/איוניין/, "ionian"], [/מינור\s*טבעי/, "natural"], [/מינור/, "natural"], [/מז'?ור|מג'?ור/, "major"],
];
function scaleByKey(root, key) {
  if (key === "pentMaj") { const s = scaleNotes(root, "major"); return s && [s[0], s[1], s[2], s[4], s[5]]; }
  if (key === "pentMin") { const s = scaleNotes(root, "natural"); return s && [s[0], s[2], s[3], s[4], s[6]]; }
  if (key === "blues") { const s = scaleNotes(root, "natural"); const t = spell(root, 4, 6); return s && t && [s[0], s[2], s[3], t, s[4], s[6]]; }
  return scaleNotes(root, key);
}
const KEY_HE = { harmonic: "מינור הרמוני", melodic: "מינור מלודי (בעלייה)", pentMin: "מינור פנטטוני", pentMaj: "מז'ור פנטטוני", blues: "Blues Scale (פנטטוני מינור + הטריטון)", dorian: "דורי", phrygian: "פריגי", lydian: "לידי", mixolydian: "מיקסולידי", aeolian: "אאולי", locrian: "לוקריין", ionian: "איוניין", natural: "מינור טבעי", major: "מז'ור" };
const KEY_SRC = { major: [[1, 10], [1, 11]], natural: [[6, 5], [6, 4]], harmonic: [[6, 11]], melodic: [[6, 14], [6, 16]], pentMaj: [[11, 7]], pentMin: [[11, 8]], blues: [[11, 13]], dorian: [[15, 7], [15, 8], [15, 9]], phrygian: [[15, 7], [15, 8], [15, 9]], lydian: [[15, 7], [15, 8], [15, 9]], mixolydian: [[15, 7], [15, 8], [15, 9]], aeolian: [[15, 7], [15, 8], [15, 9]], locrian: [[15, 7], [15, 8], [15, 9]], ionian: [[15, 7], [15, 8]] };
const KEY_NOTE = { harmonic: "מגביהים את הצליל השביעי (טון מוביל).", melodic: "בעלייה מגביהים את השישי והשביעי; בירידה חוזרים למינור טבעי.", natural: "מרווחים: 1-½-1-1-½-1-1.", major: "מרווחים: 1-1-½-1-1-1-½.", pentMaj: "מחסירים מהמז'ור את הדרגות 4 ו-7: I-II-III-V-VI.", pentMin: "מחסירים מהמינור את הדרגות 2 ו-6: I-III-IV-V-VII.", blues: "פנטטוני מינור + הטריטון (ה-Blue Note); כאן מופיע כ-♭5.", dorian: "מינור עם שישית מוגבהת (ספטאקורד יחסי: Min7).", phrygian: "מינור עם שנייה מונמכת (Min7).", lydian: "מז'ור עם רביעית מוגבהת (Maj7).", mixolydian: "מז'ור עם שביעית מונמכת (Dom7).", aeolian: "מינור טבעי (Min7).", locrian: "מוקטן, יוצא דופן (Min7♭5).", ionian: "מז'ור טבעי (Maj7)." };

const CH_RE = /(?<![A-Za-z])([A-G])(##|bb|[#b♯♭])?(maj7|M7|m7b5|min7|m7|dim7|dim|aug|ø7|m|sus2|sus4|7|5|\+)?(?![A-Za-z0-9#])/g;
const CH_DEF = {
  "": { he: "מז'ור", semis: [0, 4, 7], steps: [0, 2, 4] }, m: { he: "מינור", semis: [0, 3, 7], steps: [0, 2, 4] }, dim: { he: "מוקטן", semis: [0, 3, 6], steps: [0, 2, 4] }, aug: { he: "מוגדל", semis: [0, 4, 8], steps: [0, 2, 4] },
  maj7: { he: "Major 7", semis: [0, 4, 7, 11], steps: [0, 2, 4, 6] }, "7": { he: "Dominant 7", semis: [0, 4, 7, 10], steps: [0, 2, 4, 6] }, m7: { he: "Minor 7", semis: [0, 3, 7, 10], steps: [0, 2, 4, 6] }, "ø7": { he: "Half diminished 7", semis: [0, 3, 6, 10], steps: [0, 2, 4, 6] }, m7b5: { he: "Half diminished 7", semis: [0, 3, 6, 10], steps: [0, 2, 4, 6] }, dim7: { he: "Diminished 7", semis: [0, 3, 6, 9], steps: [0, 2, 4, 6] },
  sus2: { he: "Sus2", semis: [0, 2, 7], steps: [0, 1, 4] }, sus4: { he: "Sus4", semis: [0, 5, 7], steps: [0, 3, 4] }, "5": { he: "אקורד כוח (Power Chord)", semis: [0, 7], steps: [0, 4] },
};
function chordSuffix(s) { s = s || ""; if (s === "M7") return "maj7"; if (s === "min7") return "m7"; if (s === "+") return "aug"; return s; }
const CH_SRC = { "": [[4, 4], [4, 15]], m: [[4, 4], [4, 15]], dim: [[4, 7], [4, 15]], aug: [[4, 8]], maj7: [[14, 8], [14, 9]], "7": [[14, 8], [14, 9], [14, 10]], m7: [[14, 8], [14, 9]], "ø7": [[14, 8], [14, 9]], m7b5: [[14, 8], [14, 9]], dim7: [[14, 8], [14, 9]], sus2: [[7, 11]], sus4: [[7, 11]], "5": [[12, 4], [12, 5]] };

const row = (l, v) => `<div>${l}: ${v}</div>`;
function ansInterval(q, notes) {
  let a, b;
  const m = IV_RE.exec(q);
  if (m) { const he = m[1].replace("יוניסון", "פרימה"); const qual = m[2]; const root = m[3].replace("♯", "#").replace("♭", "b");
    const cands = INTERVALS.filter(i => i.he.startsWith(he) && (!qual || i.he.endsWith(qual)));
    if (cands.length === 1) { const iv = cands[0]; const t = spell(root, iv.steps, iv.semi);
      if (!t) return { html: `ה${iv.he} מ-${NL(root)} דורשת דאבל דיאז/במול – לא נפוץ בקורס.`, src: [[3, 7]] };
      return { html: `<b>${iv.he} מ-${NL(root)}</b> = ${NL(t)}<br>${halves(iv.semi)} (${tones(iv.semi)} טונים), ${TYPE_HE[iv.type]}.`, src: [[3, 7], [3, 13]] }; }
    if (cands.length > 1) return { html: `ל"${he}" יש כמה סוגים: ${cands.map(c => c.he).join(", ")}. ציין "קטנה" או "גדולה".`, src: [[3, 7]] };
  }
  if (notes.length >= 2 && /מרווח|בין|interval/.test(q)) {
    a = notes[0]; b = notes[1]; const pa = parse(a), pb = parse(b);
    const steps = (LETTERS.indexOf(pb.l) - LETTERS.indexOf(pa.l) + 7) % 7; const semis = (pc(b) - pc(a) + 12) % 12;
    let iv = INTERVALS.find(i => (i.semi % 12) === semis && i.steps % 7 === steps && i.semi !== 6);
    if (semis === 6 && (steps === 3 || steps === 4)) { return { html: `<b>${NL(a)} → ${NL(b)}</b>: טריטון (${steps === 3 ? "קוורטה מוגדלת" : "קווינטה מוקטנת"}) – 3 טונים, דיסוננטי.`, src: [[3, 7], [7, 3]] }; }
    if (iv && semis === 0 && steps === 0) iv = INTERVALS[0];
    if (!iv) return { html: `<b>${NL(a)} → ${NL(b)}</b>: ${steps + 1} שמות תווים ו-${halves(semis)}. שילוב כזה (מוגדל/מוקטן) לא מופיע בטבלת המרווחים של הקורס.`, src: [[3, 7], [3, 8]] };
    return { html: `<b>${NL(a)} → ${NL(b)}</b>: ${iv.he} (${iv.en})<br>${halves(iv.semi)} = ${tones(iv.semi)} טונים · ${TYPE_HE[iv.type]}.`, src: [[3, 7], [3, 8], [3, 13]] };
  }
  return null;
}
function ansScaleChords(q, notes) {
  if (!/אקורדי?ם?\s*(ב|של)?סולם|דרגות\s*(ב|של)?סולם|ספטאקורדים\s*(ב|של)?סולם|אקורדים\s*ב/.test(nrm(q)) && !/דרגות/.test(q)) return null;
  if (!notes.length) return null; const root = notes[0];
  const minor = (/מינור/.test(q) || minorSuffix(q)) && !/מז'?ור|מג'?ור/.test(q); const type = minor ? "natural" : "major"; const sc = scaleNotes(root, type); if (!sc) return null;
  const seven = /ספט/.test(q);
  const rows = sc.map((n, i) => { const t = seven ? seventhAt(sc, i) : triadAt(sc, i); const q2 = minor ? DEG_MIN[i] : DEG_MAJ[i][2]; return `<tr><td>${DEG_MAJ[i][0]}</td><td>${DEG_MAJ[i][1]}</td><td>${NL(t.name)}</td><td>${NLs(t.notes)}</td><td>${q2}</td></tr>`; }).join("");
  return { html: `<b>${seven ? "ספטאקורדים" : "אקורדים"} בסולם ${NL(root)} ${minor ? "מינור (טבעי)" : "מז'ור"}</b><table><tr><th>דרגה</th><th>שם</th><th>אקורד</th><th>תווים</th><th>סוג</th></tr>${rows}</table>`, src: minor ? [[6, 8], [6, 9]] : seven ? [[14, 7], [14, 8]] : [[4, 14], [4, 15]] };
}
function ansChord(q) {
  const useQ = /אקורד|תווי|chord/.test(q); CH_RE.lastIndex = 0; let m; const found = [];
  while ((m = CH_RE.exec(q))) found.push(m);
  const pick1 = found.find(f => f[3]) || (useQ ? found[0] : null); if (!pick1) return null;
  const root = pick1[1] + (pick1[2] ? pick1[2].replace("♯", "#").replace("♭", "b") : ""); const suf = chordSuffix(pick1[3]); const d = CH_DEF[suf]; if (!d) return null;
  const ns = d.semis.map((s, i) => spell(root, d.steps[i], s));
  if (ns.some(x => !x)) return { html: `האקורד ${NL(root + suf)} דורש דאבל דיאז/במול בכתיב הרגיל.`, src: CH_SRC[suf] };
  const how = suf === "" ? "מז'ור: טרצה גדולה (2 טונים) ואז קטנה (1.5)." : suf === "m" ? "מינור: טרצה קטנה (1.5 טונים) ואז גדולה (2)." : suf === "dim" ? "מוקטן: 1.5 + 1.5 טונים." : suf === "aug" ? "מוגדל: 2 + 2 טונים." : suf === "5" ? "שורש + קווינטה, בלי הטרצה – לא ניתן לקבוע מז'ור/מינור." : suf === "sus2" || suf === "sus4" ? "הטרצה מוחלפת בדרגה שנייה (Sus2) או רביעית (Sus4) – \"השהיית פתרון\"." : ({ maj7: "משולש מז'ור + ספטימה גדולה.", "7": "משולש מז'ור + ספטימה קטנה (השבע יוצר טריטון עם הטרצה).", m7: "משולש מינור + ספטימה קטנה.", "ø7": "משולש מוקטן + ספטימה קטנה.", m7b5: "משולש מוקטן + ספטימה קטנה.", dim7: "משולש מוקטן + ספטימה מוקטנת." })[suf];
  return { html: `<b>${NL(root + suf)}</b> (${d.he}) = ${NLs(ns)}<br>${how}`, src: CH_SRC[suf] };
}
function ansScale(q, notes) {
  if (!notes.length) return null; const minorHint = /מינור/.test(q) || minorSuffix(q), majorHint = /מז'?ור|מג'?ור/.test(q);
  let key = null;
  if (/פנטטוני/.test(q) && !/מינור\s*פנטטוני|פנטטוני\s*מינור|פנטטוני\s*(?:מז'?ור|מג'?ור)|(?:מז'?ור|מג'?ור)\s*פנטטוני/.test(q)) key = minorHint && !majorHint ? "pentMin" : "pentMaj";
  else for (const [re, k] of SCALE_KEYS) { if (re.test(q)) { key = k; break; } }
  if (!key && /סולם/.test(q)) key = minorHint && !majorHint ? "natural" : "major";
  if (!key) return null;
  if (!/סולם|מודוס|פנטטוני|תווים|בלוז|דורי|פריגי|לידי|מיקסולידי|אאולי|לוקריין|איוניין|מז'?ור|מג'?ור|מינור/.test(q)) return null;
  const root = notes[0]; const sc = scaleByKey(root, key);
  if (!sc) return { html: `${KEY_HE[key]} ב-${NL(root)} דורש דאבל דיאז/במול בכתיב הרגיל.`, src: KEY_SRC[key] };
  return { html: `<b>${NL(root)} ${KEY_HE[key]}</b> = ${NLs(sc)}<br>${KEY_NOTE[key]}`, src: KEY_SRC[key] };
}
function ansSlideRef(q) {
  const m = /שיעור\s*(\d+)(?:.*?שקף\s*(\d+))?/.exec(q) || null; const m2 = /שקף\s*(\d+).*?שיעור\s*(\d+)/.exec(q);
  let l, s; if (m2) { s = +m2[1]; l = +m2[2]; } else if (m) { l = +m[1]; s = m[2] ? +m[2] : null; } else return null;
  if (!LESSON_TITLES[l]) return { html: l === 8 ? "שיעור 8 הוא מבחן האמצע – אין לו מצגת." : `לא מצאתי מצגת לשיעור ${l}.`, src: [] };
  if (s) { const d = CORPUS.find(x => x.l === l && x.s === s); return d ? { html: `<b>שיעור ${l} – ${LESSON_TITLES[l]}, שקף ${s}</b>`, src: [[l, s]], open: true } : { html: `אין שקף ${s} בשיעור ${l}.`, src: [] }; }
  const sl = CORPUS.filter(x => x.l === l); return { html: `<b>שיעור ${l} – ${LESSON_TITLES[l]}</b> (${sl.length} שקפים). לדוגמה: ${sl.slice(1, 5).map(x => `שקף ${x.s}: ${x.t.split("\n")[0].slice(0, 40)}`).join(" · ")}<br><span class="muted">כתוב "שיעור ${l} שקף N" כדי לראות שקף מסוים.</span>`, src: [] };
}

/* ---- המוח של הצ'אט ---- */
function chatAnswer(raw) {
  const q = solfegeToLatin(raw.trim()); const notes = findNotes(q);
  const scaleWords = /סולם|פנטטוני|הרמוני|מלודי|דורי|פריגי|לידי|מיקסולידי|אאולי|לוקריין|איוניין|בלוז\s*סקייל|blues\s*scale/i.test(q) && !/אקורד/.test(q);
  const calc = ansSlideRef(q) || ansInterval(q, notes) || ansScaleChords(q, notes) || (scaleWords ? (ansScale(q, notes) || ansChord(q)) : (ansChord(q) || ansScale(q, notes)));
  const parts = [];
  if (calc) {
    parts.push({ kind: "calc", html: calc.html }); const srcs = (calc.src || []).map(([l, s]) => ({ l, s }));
    return { parts, sources: srcs, open: calc.open };
  }
  const th = termHits(q); th.forEach(t => parts.push({ kind: "def", t }));
  const res = searchSlides(q, 3).filter(r => r.sc > 0.6);
  const sources = []; res.forEach(r => { parts.push({ kind: "hit", l: r.d.l, s: r.d.s, text: snippet(r.d.t, r.qt) }); sources.push({ l: r.d.l, s: r.d.s }); });
  if (!parts.length) parts.push({ kind: "none" });
  return { parts, sources };
}

/* ---- ממשק ---- */
function slideBlock(l, s) {
  const d = CORPUS.find(x => x.l === l && x.s === s); if (!d) return h("div", {}, "השקף לא נמצא.");
  return h("div", { class: "fb good", style: "white-space:pre-wrap" }, h("b", {}, `שיעור ${l} – ${LESSON_TITLES[l]}, שקף ${s}`), h("br"), d.t);
}
function renderAnswer(box, ans) {
  ans.parts.forEach(p => {
    if (p.kind === "calc") box.append(h("div", { html: p.html }));
    else if (p.kind === "def") box.append(h("div", { class: "fb good", style: "margin:6px 0" }, h("b", {}, p.t.term), p.t.en ? h("span", { class: "muted ltr" }, " " + p.t.en) : null, ...p.t.quotes.map(x => h("div", {}, `"${x.q}" `, h("span", { class: "src" }, `(שיעור ${x.l}, שקף ${x.s})`)))));
    else if (p.kind === "hit") box.append(h("div", { style: "margin:6px 0" }, h("div", { class: "src" }, `שיעור ${p.l} – ${LESSON_TITLES[p.l]}, שקף ${p.s}`), h("div", { style: "white-space:pre-wrap" }, p.text)));
    else box.append(h("div", {}, "לא מצאתי את זה בחומר הקורס. נסה לנסח עם המושגים של השקפים (למשל: קדנצה, דרגה, טריטון, מודוס), או שאל על סולם/אקורד/מרווח מסוים (למשל \"סולם E דורי\")."));
  });
  const uniq = []; (ans.sources || []).forEach(s => { if (!uniq.some(u => u.l === s.l && u.s === s.s)) uniq.push(s); });
  if (uniq.length) {
    const holder = h("div");
    box.append(h("div", { class: "row", style: "margin-top:8px" }, h("span", { class: "src" }, "מקורות:"), ...uniq.map(s => h("button", { class: "pill", style: "cursor:pointer", onclick: () => { holder.innerHTML = ""; holder.append(slideBlock(s.l, s.s)); } }, `שיעור ${s.l}, שקף ${s.s}`))), holder);
    if (ans.open) { holder.append(slideBlock(uniq[0].l, uniq[0].s)); }
  }
}
function chat(app) {
  const log = h("div", { id: "chatlog" }); const inp = h("input", { type: "text", placeholder: "שאל על מושג, סולם, אקורד או מרווח…", style: "direction:rtl;text-align:right", autocomplete: "off" });
  function ask(text) {
    text = (text || inp.value).trim(); if (!text) return; inp.value = "";
    log.append(h("div", { class: "card", style: "background:var(--bg)" }, h("b", {}, "אתה: "), text));
    const box = h("div", { class: "card" }); let ans;
    try { ans = chatAnswer(text); } catch (e) { console.error(e); ans = { parts: [{ kind: "none" }], sources: [] }; }
    renderAnswer(box, ans); log.append(box); box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  inp.addEventListener("keydown", e => { if (e.key === "Enter") ask(); });
  const chips = ["מהי קדנצה?", "מה ההבדל בין פתרון מדומה לפתרון מושהה", "מרווח בין C ל-G", "סולם F# מז'ור", "E דורי", "אקורד Am7", "אקורדים בסולם G מז'ור", "הסקסטה הקטנה מ-F", "מתי משתמשים במיקסולידי", "מה זה שאפל", "שיעור 3 שקף 7"];
  app.append(h("div", { class: "card" }, h("h2", {}, "💬 צ'אט הקורס"), h("p", { class: "muted" }, "הצ'אט עונה אך ורק מתוך המצגות: הוא מחפש בחומר (עם מראה מקום ואפשרות לפתוח את השקף) ומחשב סולמות, אקורדים ומרווחים לפי כללי הקורס. הוא לא מודל שפה – עדיף שאלות קצרות עם מושגי הקורס."),
    h("div", { class: "row" }, ...chips.map(c => h("button", { class: "pill", style: "cursor:pointer", onclick: () => ask(c) }, c)))), log,
    h("div", { class: "card", style: "position:sticky;bottom:8px" }, h("div", { class: "row", style: "flex-wrap:nowrap" }, inp, h("button", { class: "btn", onclick: () => ask() }, "שלח"))));
  inp.focus();
}
