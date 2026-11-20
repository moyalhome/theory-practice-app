"use strict";
/* ===================== צ'אט הקורס: חיפוש בחומר + מחשבון תאוריה =====================
   לא מודל שפה: מחפש אך ורק בתמלול השקפים ובמילון, ומחשב סולמות/אקורדים/מרווחים לפי הכללים שבקורס. */
const HE_STOP = new Set("את של על מה מהו מהי מהם מהן הוא היא זה זו אם כי גם או אל עם לא כל יש הם הן אני איך למה האם תסביר הסבר ספר לי בבקשה אפשר רוצה לדעת איזה איזו אילו כמה מתי איפה מי בין מן אבל רק כך אז עוד כמו לפי יהיה יהיו היה בו בה בהם הזה הזאת אלה שלי שלך אותו אותה ממש בעצם בכלל תן תני".split(" "));
function nrm(s) { return s.replace(/[֑-ׇ]/g, "").replace(/מג['׳]ור/g, "מזור").replace(/[׳'"״`´’‘“”]/g, "").toLowerCase(); }
/* גזע לפי אוצר המילים של הקורס: מסירים תחילית/סיומת רק אם המילה שנשארת קיימת בחומר ("האקורד"→"אקורד", "למלודי"→"מלודי", אבל "מלודי" נשאר "מלודי") */
let VOCAB = null;
function rawToks(s) { return nrm(s).split(/[^\p{L}\p{N}#♭♯]+/u).filter(Boolean); }
function ensureVocab() {
  if (VOCAB) return; VOCAB = {}; const add = t => rawToks(t).forEach(w => VOCAB[w] = (VOCAB[w] || 0) + 1);
  CORPUS.forEach(d => add(d.t)); TERMS.forEach(t => { add(t.term); add(t.en || ""); t.quotes.forEach(q => add(q.q)); });
}
function stem(w) {
  if (!/[א-ת]/.test(w)) return w; ensureVocab(); let x = w;
  for (let i = 0; i < 3; i++) {
    const r = x.slice(1), sfx = x.slice(0, -2);
    if (x.length > 4 && /^[והבכלמש]/.test(x) && r.length >= 4 && VOCAB[r]) x = r;
    else if (x.length > 4 && /(ים|ות)$/.test(x) && sfx.length >= 3 && VOCAB[sfx]) x = sfx;
    else break;
  }
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
    if (semis === 6 && (steps === 3 || steps === 4)) { return { html: `<b>${L(fmtNote(a) + " → " + fmtNote(b))}</b>: טריטון (${steps === 3 ? "קוורטה מוגדלת" : "קווינטה מוקטנת"}) – 3 טונים, דיסוננטי.`, src: [[3, 7], [7, 3]] }; }
    if (iv && semis === 0 && steps === 0) iv = INTERVALS[0];
    if (!iv) return { html: `<b>${L(fmtNote(a) + " → " + fmtNote(b))}</b>: ${steps + 1} שמות תווים ו-${halves(semis)}. שילוב כזה (מוגדל/מוקטן) לא מופיע בטבלת המרווחים של הקורס.`, src: [[3, 7], [3, 8]] };
    return { html: `<b>${L(fmtNote(a) + " → " + fmtNote(b))}</b>: ${iv.he} (${iv.en})<br>${halves(iv.semi)} = ${tones(iv.semi)} טונים · ${TYPE_HE[iv.type]}.`, src: [[3, 7], [3, 8], [3, 13]] };
  }
  return null;
}
const IV_NAME_RE = /(?:^|[^א-ת])[הבלמוכש]{0,2}(סקונדה|טרצה|קוורטה|קווינטה|סקסטה|ספטימה|אוקטבה|טריטון|פרימה|יוניסון)/;
function ansIvSize(q) {
  if (!/כמה\s+(?:טונים|חצאי?\s*טון|חצי\s*טון|טון|צעדים)/.test(q)) return null;
  const m = IV_NAME_RE.exec(q); if (!m) return null; const name = m[1] === "יוניסון" ? "פרימה" : m[1]; const qual = /(קטנה|גדולה)/.exec(q);
  const cands = INTERVALS.filter(i => i.he.startsWith(name) && (!qual || i.he.endsWith(qual[1]))); if (!cands.length) return null;
  return { html: cands.map(i => `<b>${i.he}</b> (${i.en}): ${tones(i.semi)} טונים = ${halves(i.semi)} · ${i.steps + 1} שמות תווים`).join("<br>"), src: [[3, 7]] };
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
  const ns = d.semis.map((s, i) => spell(root, d.steps[i], s, suf === "dim7"));
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

/* ---- מאגר ידע תמציתי: תשובה קצרה וממוקדת ----
   עיקרון: מציגים רק את מה ששאלת – הגדרה אחת (ציטוט מהשקף) + מראה מקום. כל השאר מקופל תחת "עוד מהשקפים". */
let KB = null;
const aliasToks = name => [...new Set(toks(name.replace(/[()\/|]/g, " ")))];
const IV_GROUPS = ["פרימה", "סקונדה", "טרצה", "קוורטה", "קווינטה", "סקסטה", "ספטימה"];
function buildKB() {
  KB = [];
  TERMS.forEach(t => {
    const names = []; [t.term, ...(t.en ? t.en.split(/\s*\/\s*/) : [])].forEach(r => r.split(/\s*[\/|]\s*/).forEach(p => { const base = p.replace(/\s*\(.*?\)\s*/g, " ").trim(); if (base) { names.push(base); const m2 = /^סולם\s+(.+)$/.exec(base); if (m2) names.push(m2[1]); } }));
    KB.push({ kind: "term", title: t.term, en: t.en, aliases: names.map(aliasToks).filter(a => a.length), quotes: t.quotes });
  });
  IV_GROUPS.forEach(g => {
    const vs = INTERVALS.filter(i => i.he.startsWith(g) || (g === "פרימה" && i.he.includes("יוניסון"))); if (!vs.length) return;
    const ex = i => L("C – " + fmtNote(spell("C", i.steps, i.semi)));
    const lines = vs.map(i => `${i.he} (${i.en}): ${tones(i.semi)} טונים (${ex(i)}), ${TYPE_HE[i.type]}`);
    const steps = vs[0].steps + 1;
    const intro = g === "פרימה" ? "מרווח של 0 טונים – אותו תו פעמיים (יוניסון)." : `מרווח של ${steps} צעדים בין שמות תווים (למשל מ-C עד ${spell("C", vs[0].steps, vs[0].semi).replace(/[#b]+$/, "")}).`;
    KB.push({ kind: "interval", title: g === "פרימה" ? "פרימה (יוניסון)" : g, en: vs[0].en.replace(/^(Minor|Major|Perfect)\s*/, ""), aliases: g === "פרימה" ? [["פרימה"], ["יוניסון"]] : [aliasToks(g)], html: `${intro}<br>${lines.join("<br>")}`, srcs: [[3, 8], [3, 7]] });
  });
}
const DEF_RE = /^\s*(?:מה\s+(?:זה|זאת|הוא|היא|הם|הן|הפירוש\s+של|ההגדרה\s+של|הכוונה\s+ב)|מהו|מהי|מהם|מהן|הסבר|תסביר|תסבירי|פירוש|הגדרה|הגדר|ספר\s+לי\s+על|what\s+is)(?![א-ת])/i;
const CMP_RE = /(?:ההבדל|הבדל|שונה|שונים|השוואה|לעומת|\bvs\.?\b)/i;
const USE_RE = /(?:מתי|איפה|לשם\s+מה|למה|באיזה)\s*.*(?:משתמשים|נשתמש|משמש|שימוש|מופיע|מופיעה|נשמע|נשמעת)|(?:שימוש|שימושים)\s+(?:של|ב)/;
function kbMatches(q) {
  if (!KB) buildKB(); const qt = new Set(toks(q)); const out = [];
  KB.forEach(e => { let best = 0; e.aliases.forEach(a => { if (a.every(w => qt.has(w))) best = Math.max(best, a.length * 10 + a.join("").length / 100); }); if (best) out.push({ e, sc: best }); });
  out.sort((a, b) => b.sc - a.sc);
  const res = []; const used = new Set();   // לא להציג ערך שכל המילים שלו כבר נכללו בערך ארוך יותר ("מינור הרמוני" מול "מינור")
  out.forEach(o => { const al = o.e.aliases.flat(); if (res.length && al.every(w => used.has(w)) && o.sc < res[0].sc) return; res.push(o); al.forEach(w => used.add(w)); });
  return res.map(o => o.e);
}
function briefOf(e, q) {
  if (e.kind === "interval") return { kind: "brief", title: e.title, en: e.en, html: e.html, srcs: e.srcs.map(([l, s]) => ({ l, s })), more: [] };
  const wantUse = USE_RE.test(q); const m = MODES.find(x => e.title === x.he || e.title.startsWith(x.he));
  if (wantUse && m && m.use) return { kind: "brief", title: e.title, en: e.en, html: `${m.he}: ${m.d}. <b>שימוש:</b> ${m.use}.`, srcs: [{ l: 15, s: 9 }], more: e.quotes.map(x => ({ l: x.l, s: x.s, q: x.q })) };
  const [q0, ...rest] = e.quotes; return { kind: "brief", title: e.title, en: e.en, text: q0.q, srcs: [{ l: q0.l, s: q0.s }], more: rest.map(x => ({ l: x.l, s: x.s, q: x.q })) };
}
/* חיפוש ברמת שורה (לא שקף שלם): מחזיר את השורות שמכסות את מילות השאלה, הטובה ביותר ראשונה */
let LINES = null, LINE_DF = null;
function buildLines() {
  LINES = []; LINE_DF = {};
  CORPUS.forEach(d => d.t.split("\n").forEach(ln => { ln = ln.trim(); if (!ln || ln.startsWith("[תמונה") || ln.length < 6) return; const tk = [...new Set(toks(ln))]; if (!tk.length) return; LINES.push({ l: d.l, s: d.s, t: ln, tk: new Set(tk), len: tk.length }); tk.forEach(w => LINE_DF[w] = (LINE_DF[w] || 0) + 1); }));
}
function lineSearch(q, k = 4) {
  if (!LINES) buildLines(); const qt = [...new Set(toks(q))]; if (!qt.length) return [];
  const N = LINES.length, idfOf = w => Math.log(1 + N / (LINE_DF[w] || 1)); const tot = qt.reduce((a, w) => a + idfOf(w), 0) || 1;
  const res = LINES.filter(x => !/\?\s*$/.test(x.t)).map(x => { let hit = 0, n = 0; qt.forEach(w => { if (x.tk.has(w)) { hit += idfOf(w); n++; } }); return { x, cov: hit / tot, n, sc: hit / tot - Math.min(x.len, 40) / 400 }; }).filter(r => r.n > 0 && r.cov >= (qt.length === 1 ? 1 : 0.6)).sort((a, b) => b.sc - a.sc);
  const seen = new Set(), out = []; res.forEach(r => { const key = r.x.t; if (seen.has(key) || out.length >= k) return; seen.add(key); out.push({ l: r.x.l, s: r.x.s, q: r.x.t, cov: r.cov }); });
  return out;
}

/* שאלות "איך בונים אקורד/סולם X" בלי תו: מדגימים על C לפי כללי הקורס */
const HOW_RE = /(?:^|\s)(?:איך|כיצד)\s|בונים|בניית|נוסחה|נוסחת|מרכיבים|מורכב/;
function chordSuffixFromWords(t) {
  if (/חצי\s*מוקטן|half/i.test(t)) return "ø7";
  if (/מוקטן\s*7|dim\s*7|ספטימה\s*מוקטנת/i.test(t)) return "dim7";
  if (/דומיננט|dominant/i.test(t)) return "7";
  if (/(?:מינור|מינורי)\s*7|minor\s*7/i.test(t)) return "m7";
  if (/מ[זג]['׳]?ור\s*7|major\s*7|maj7/i.test(t)) return "maj7";
  if (/סאס\s*2|sus\s*2/i.test(t)) return "sus2"; if (/סאס\s*4|sus\s*4/i.test(t)) return "sus4";
  if (/כוח|power/i.test(t)) return "5"; if (/מוגדל/.test(t)) return "aug"; if (/מוקטן/.test(t)) return "dim"; if (/מינור/.test(t)) return "m"; if (/מ[זג]['׳]?ור/.test(t)) return "";
  return null;
}
function demoCalc(q) {
  const lead = '<span class="muted">לדוגמה על C:</span> ';
  if (/אקורד|ספטאקורד|משולש/.test(q)) { const sfx = chordSuffixFromWords(q); if (sfx !== null) { const a = ansChord("אקורד C" + sfx); if (a) return { parts: [{ kind: "calc", html: lead + a.html }], sources: (a.src || []).map(([l, s]) => ({ l, s })) }; } }
  if (/סולם|פנטטוני|מודוס|דורי|פריגי|לידי|מיקסולידי|אאולי|לוקריין|איוניין|הרמוני|מלודי|בלוז/.test(q)) { const a = ansScale(q, ["C"]); if (a) return { parts: [{ kind: "calc", html: lead + a.html }], sources: (a.src || []).map(([l, s]) => ({ l, s })) }; }
  return null;
}

/* ---- המוח של הצ'אט ---- */
function chatAnswer(raw) {
  const q = solfegeToLatin(raw.trim()); const notes = findNotes(q);
  const scaleWords = /סולם|פנטטוני|הרמוני|מלודי|דורי|פריגי|לידי|מיקסולידי|אאולי|לוקריין|איוניין|בלוז\s*סקייל|blues\s*scale/i.test(q) && !/אקורד/.test(q);
  const calc = ansSlideRef(q) || ansIvSize(q) || ansInterval(q, notes) || ansScaleChords(q, notes) || (scaleWords ? (ansScale(q, notes) || ansChord(q)) : (ansChord(q) || ansScale(q, notes)));
  if (calc) { const srcs = (calc.src || []).map(([l, s]) => ({ l, s })); return { parts: [{ kind: "calc", html: calc.html }], sources: srcs, open: calc.open }; }
  if (!notes.length && HOW_RE.test(q) && !DEF_RE.test(q)) { const demo = demoCalc(q); if (demo) return demo; }
  const qt = toks(q); const ms = kbMatches(q); const isDef = DEF_RE.test(q) || (qt.length <= 2 && ms.length > 0);
  // השוואה: שני מושגים או יותר → שורה קצרה לכל אחד
  if (CMP_RE.test(q) && ms.length >= 2) return { parts: ms.slice(0, 3).map(e => briefOf(e, q)), sources: [], compare: true };
  const ls = lineSearch(q, 4);
  // שאלה שאינה "מה זה X": אם יש שורה בשקפים שמכסה כמעט את כל מילות השאלה – היא התשובה
  if (!isDef && qt.length >= 2 && ls.length && ls[0].cov >= 0.75) return { parts: [{ kind: "line", text: ls[0].q, l: ls[0].l, s: ls[0].s, more: ls.slice(1).map(x => ({ l: x.l, s: x.s, q: x.q })) }], sources: [] };
  if (ms.length && (isDef || USE_RE.test(q) || qt.length <= 4)) return { parts: [briefOf(ms[0], q)], sources: [] };
  // לא מצאנו מושג: שורת התשובה הכי קרובה מתוך השקפים (לא כל השקף)
  if (ls.length) return { parts: [{ kind: "line", text: ls[0].q, l: ls[0].l, s: ls[0].s, more: ls.slice(1).map(x => ({ l: x.l, s: x.s, q: x.q })) }], sources: [] };
  return { parts: [{ kind: "none" }], sources: [] };
}

/* ---- ממשק ---- */
function slideBlock(l, s) {
  const d = CORPUS.find(x => x.l === l && x.s === s); if (!d) return h("div", {}, "השקף לא נמצא.");
  return h("div", { class: "fb good", style: "white-space:pre-wrap" }, h("b", {}, `שיעור ${l} – ${LESSON_TITLES[l]}, שקף ${s}`), h("br"), d.t);
}
const slideRef = (l, s) => slideBtn(`שיעור ${l}, שקף ${s}`, l, s);
function moreBox(items, label) {
  const more = h("div", { style: "display:none;margin-top:6px" }, ...items.map(x => h("div", { style: "margin:4px 0" }, `"${x.q}" `, slideRef(x.l, x.s))));
  const btn = h("button", { class: "pill", style: "cursor:pointer;margin-top:6px", onclick: () => { const open = more.style.display === "none"; more.style.display = open ? "" : "none"; btn.textContent = open ? "הסתר" : `${label} (${items.length})`; } }, `${label} (${items.length})`);
  return h("div", {}, btn, more);
}
function renderBrief(p) {
  const wrap = h("div", { style: "margin:4px 0" });
  wrap.append(h("div", {}, h("b", {}, p.title), p.en ? h("span", { class: "muted ltr" }, " " + p.en) : null));
  wrap.append(p.html ? h("div", { html: p.html, style: "margin-top:2px" }) : h("div", { style: "margin-top:2px" }, `"${p.text}"`));
  wrap.append(h("div", { class: "row", style: "margin-top:4px" }, h("span", { class: "src" }, "מקור:"), ...p.srcs.map(x => slideRef(x.l, x.s))));
  if (p.more && p.more.length) wrap.append(moreBox(p.more, "עוד מהשקפים"));
  return wrap;
}
function renderAnswer(box, ans) {
  ans.parts.forEach(p => {
    if (p.kind === "calc") box.append(h("div", { html: p.html }));
    else if (p.kind === "brief") box.append(ans.compare ? h("div", { class: "fb good", style: "margin:6px 0" }, renderBrief(p)) : renderBrief(p));
    else if (p.kind === "line") {
      box.append(h("div", { style: "margin:4px 0" }, h("div", {}, `"${p.text}"`), h("div", { class: "row", style: "margin-top:4px" }, h("span", { class: "src" }, "מקור:"), slideRef(p.l, p.s))));
      if (p.more && p.more.length) box.append(moreBox(p.more, "עוד תוצאות קרובות"));
    }
    else box.append(h("div", {}, "לא מצאתי את זה בחומר הקורס. נסה לנסח עם המושגים של השקפים (למשל: קדנצה, דרגה, טריטון, מודוס), או שאל על סולם/אקורד/מרווח מסוים (למשל \"סולם E דורי\")."));
  });
  const uniq = []; (ans.sources || []).forEach(s => { if (!uniq.some(u => u.l === s.l && u.s === s.s)) uniq.push(s); });
  if (uniq.length) {
    const holder = h("div");
    box.append(h("div", { class: "row", style: "margin-top:8px" }, h("span", { class: "src" }, "מקורות:"), ...uniq.map(s => slideRef(s.l, s.s))), holder);
    if (ans.open) { if (typeof openSlide === "function") openSlide(uniq[0].l, uniq[0].s); else holder.append(slideBlock(uniq[0].l, uniq[0].s)); }
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
