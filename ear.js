"use strict";
/* ===================== אימון אוזן =====================
   תרגילים של N שאלות: מסך הסבר → שומעים → בוחרים בכפתורים גדולים → רואים חמשה + פסנתר.
   הפסנתר ניתן לנגינה (לחיצה על קלידים) כדי להשוות ולבדוק את עצמך.
   אפשר לנגן בכמה מצבים (עולה / יורד / יחד / ארפג'יו) בכל שאלה, ולהשוות בין התשובה הנכונה למה שבחרת. */

/* ---------- שמע (יציב באייפון) ---------- */
let AC = null, master = null, silentEl = null, liveNodes = [];
function silentWavUri() {
  const n = 8000, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE"); w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 16000, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, "data"); v.setUint32(40, n * 2, true);
  let bin = ""; const u = new Uint8Array(buf); for (let i = 0; i < u.length; i++) bin += String.fromCharCode(u[i]);
  return "data:audio/wav;base64," + btoa(bin);
}
function unlockAudio() {
  try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) { }
  if (!AC) {
    const C = window.AudioContext || window.webkitAudioContext; AC = new C();
    const comp = AC.createDynamicsCompressor(); master = AC.createGain(); master.gain.value = .9; master.connect(comp); comp.connect(AC.destination);
  }
  if (AC.state !== "running") AC.resume();
  if (!silentEl) { try { silentEl = new Audio(silentWavUri()); silentEl.loop = true; silentEl.volume = 0.01; silentEl.play().catch(() => { }); } catch (e) { } }
  try { const b = AC.createBuffer(1, 1, 22050), s = AC.createBufferSource(); s.buffer = b; s.connect(AC.destination); s.start(0); } catch (e) { }
  return AC;
}
document.addEventListener("pointerdown", () => { try { unlockAudio(); } catch (e) { } }, { passive: true });
document.addEventListener("touchend", () => { try { unlockAudio(); } catch (e) { } }, { passive: true });
function stopAudio() { liveNodes.forEach(o => { try { o.stop(); } catch (e) { } }); liveNodes = []; }
const midiToHz = m => 440 * Math.pow(2, (m - 69) / 12);
function playNote(m, when, dur, vol = .5) {
  const ctx = unlockAudio(); const t0 = ctx.currentTime + 0.03 + when; const f = midiToHz(m);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + .015); g.gain.exponentialRampToValueAtTime(.0008, t0 + dur); g.connect(master);
  [[1, "triangle", 1], [2, "sine", .35], [3, "sine", .12]].forEach(([mul, type, a]) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f * mul; const og = ctx.createGain(); og.gain.value = a; o.connect(og); og.connect(g); o.start(t0); o.stop(t0 + dur + .05); liveNodes.push(o); });
}
function playSeq(midis, step, dur) { midis.forEach((m, i) => playNote(m, i * step, dur)); }
function playChord(midis, dur) { midis.forEach(m => playNote(m, 0, dur, midis.length > 2 ? .26 : .34)); }

/* ---------- נתוני התרגילים ---------- */
const EAR_ROOTS = ["C", "D", "E", "F", "G", "A", "B", "Bb", "Eb", "Ab", "F#", "C#", "Db", "Gb"];
const IVL = INTERVALS.filter(i => i.semi > 0).map(i => ({ id: i.he, he: i.he, semis: [0, i.semi], steps: [0, i.steps], info: `${halves(i.semi)} · ${TYPE_HE[i.type]}` }));
const TRI = [
  { id: "מז'ור", he: "מז'ור", sym: "", semis: [0, 4, 7], steps: [0, 2, 4], info: "טרצה גדולה + טרצה קטנה" },
  { id: "מינור", he: "מינור", sym: "m", semis: [0, 3, 7], steps: [0, 2, 4], info: "טרצה קטנה + טרצה גדולה" },
  { id: "מוקטן", he: "מוקטן", sym: "dim", semis: [0, 3, 6], steps: [0, 2, 4], info: "שתי טרצות קטנות" },
  { id: "מוגדל", he: "מוגדל", sym: "aug", semis: [0, 4, 8], steps: [0, 2, 4], info: "שתי טרצות גדולות" },
];
const SEV = [
  { id: "Major 7", he: "Major 7", sym: "maj7", semis: [0, 4, 7, 11], steps: [0, 2, 4, 6], info: "משולש מז'ור + ספטימה גדולה" },
  { id: "Dominant 7", he: "Dominant 7", sym: "7", semis: [0, 4, 7, 10], steps: [0, 2, 4, 6], info: "משולש מז'ור + ספטימה קטנה" },
  { id: "Minor 7", he: "Minor 7", sym: "m7", semis: [0, 3, 7, 10], steps: [0, 2, 4, 6], info: "משולש מינור + ספטימה קטנה" },
  { id: "Half dim ø7", he: "Half dim ø7", sym: "ø7", semis: [0, 3, 6, 10], steps: [0, 2, 4, 6], info: "משולש מוקטן + ספטימה קטנה" },
  { id: "Dim 7", he: "Diminished 7", sym: "dim7", semis: [0, 3, 6, 9], steps: [0, 2, 4, 6], info: "משולש מוקטן + ספטימה מוקטנת" },
];
const INV_N3 = ["מצב יסודי", "היפוך ראשון (סקסטאקורד)", "היפוך שני (6/4)"], INV_N4 = ["מצב יסודי", "היפוך ראשון", "היפוך שני", "היפוך שלישי"];
const INV = []; [...TRI, ...SEV].forEach(b => b.semis.forEach((_, k) => INV.push({ id: b.id + "|" + k, he: `${b.he} – ${(b.semis.length === 3 ? INV_N3 : INV_N4)[k]}`, base: b, inv: k, sym: b.sym, info: b.info })));
const invIds = (bid, n) => Array.from({ length: n }, (_, k) => bid + "|" + k);
const SCL = [
  { id: "מז'ור", he: "מז'ור", key: "major" }, { id: "מינור טבעי", he: "מינור טבעי", key: "natural" }, { id: "מינור הרמוני", he: "מינור הרמוני", key: "harmonic" }, { id: "מינור מלודי", he: "מינור מלודי (עולה)", key: "melodic" },
  { id: "פנטטוני מז'ור", he: "פנטטוני מז'ור", key: "pentMaj" }, { id: "פנטטוני מינור", he: "פנטטוני מינור", key: "pentMin" }, { id: "Blues Scale", he: "Blues Scale", key: "blues" },
];
const MOD = MODES.map(m => ({ id: m.he, he: m.he, key: m.k, info: `${m.d}${m.use ? " · " + m.use : ""}` }));
const EX = {
  intervals: {
    he: "מרווחים", ic: "↕️", sub: "זיהוי מרווח", fam: "ivl", items: IVL, modes: [["asc", "עולה"], ["desc", "יורד"], ["harm", "יחד"]],
    presets: [["טרצה קטנה / גדולה", ["טרצה קטנה", "טרצה גדולה"]], ["המושלמים: קוורטה / קווינטה / אוקטבה", ["קוורטה", "קווינטה", "אוקטבה"]], ["סקונדות וספטימות (דיסוננטיים)", ["סקונדה קטנה", "סקונדה גדולה", "ספטימה קטנה", "ספטימה גדולה"]], ["קטנה מול גדולה (כל הסוגים)", ["סקונדה קטנה", "סקונדה גדולה", "טרצה קטנה", "טרצה גדולה", "סקסטה קטנה", "סקסטה גדולה", "ספטימה קטנה", "ספטימה גדולה"]], ["כל המרווחים", null]],
    desc: "תשמע מרווח ותבחר אותו מתוך כמה אפשרויות. רק תשובה אחת נכונה.", q: "איזה מרווח שמעת?"
  },
  triads: {
    he: "אקורדים משולשים", ic: "🎹", sub: "מז'ור, מינור, מוקטן, מוגדל", fam: "chord", items: TRI, modes: [["block", "יחד"], ["arp", "ארפג'יו"]],
    presets: [["מז'ור מול מינור", ["מז'ור", "מינור"]], ["מוקטן מול מוגדל", ["מוקטן", "מוגדל"]], ["כל ארבעת המשולשים", null]],
    desc: "תשמע אקורד משולש ותבחר את סוגו.", q: "איזה אקורד שמעת?"
  },
  sevenths: {
    he: "ספטאקורדים (7)", ic: "7️⃣", sub: "Major 7, Dominant 7, Minor 7…", fam: "chord", items: SEV, modes: [["block", "יחד"], ["arp", "ארפג'יו"]],
    presets: [["שלושת העיקריים: Major 7 / Dominant 7 / Minor 7", ["Major 7", "Dominant 7", "Minor 7"]], ["Dominant 7 מול Major 7", ["Dominant 7", "Major 7"]], ["Minor 7 מול Half dim ø7", ["Minor 7", "Half dim ø7"]], ["Half dim ø7 מול Diminished 7", ["Half dim ø7", "Dim 7"]], ["כל חמשת הספטאקורדים", null]],
    desc: "תשמע ספטאקורד ותבחר את סוגו. הספטאקורד הוא משולש + ספטימה.", q: "איזה ספטאקורד שמעת?"
  },
  inversions: {
    he: "היפוכי אקורדים", ic: "🔄", sub: "מצב יסודי / היפוך 1 / היפוך 2", fam: "chord", items: INV, modes: [["block", "יחד"], ["arp", "ארפג'יו"]], noCustom: true,
    presets: [["מז'ור – 3 צורות", invIds("מז'ור", 3)], ["מינור – 3 צורות", invIds("מינור", 3)], ["מוקטן – 3 צורות", invIds("מוקטן", 3)], ["מז'ור ומינור יחד (6 אפשרויות)", [...invIds("מז'ור", 3), ...invIds("מינור", 3)]], ["Major 7 – 4 צורות", invIds("Major 7", 4)], ["Dominant 7 – 4 צורות", invIds("Dominant 7", 4)], ["Minor 7 – 4 צורות", invIds("Minor 7", 4)]],
    desc: "תשמע אקורד ותבחר באיזה מצב הוא נוגן – לפי הצליל שנמצא בבס (שיעור 9: סקסטאקורד = היפוך ראשון, קוורטסקסטאקורד 6/4 = היפוך שני).", q: "באיזה מצב האקורד?"
  },
  scales: {
    he: "סולמות", ic: "🎼", sub: "מז'ור, מינורים, פנטטוני, בלוז", fam: "scale", items: SCL, modes: [["asc", "עולה"], ["desc", "יורד"]],
    presets: [["מז'ור מול מינור טבעי", ["מז'ור", "מינור טבעי"]], ["שלושת המינורים", ["מינור טבעי", "מינור הרמוני", "מינור מלודי"]], ["פנטטוני ובלוז", ["פנטטוני מז'ור", "פנטטוני מינור", "Blues Scale"]], ["כל הסולמות", null]],
    desc: "תשמע סולם ותבחר את סוגו.", q: "איזה סולם שמעת?"
  },
  modes: {
    he: "מודוסים", ic: "🌈", sub: "דורי, פריגי, לידי…", fam: "scale", items: MOD, modes: [["asc", "עולה"], ["desc", "יורד"]],
    presets: [["דורי מול פריגי", ["דורי", "פריגי"]], ["לידי מול מיקסולידי", ["לידי", "מיקסולידי"]], ["המודוסים המז'וריים: איוניין / לידי / מיקסולידי", ["איוניין", "לידי", "מיקסולידי"]], ["המודוסים המינוריים: דורי / פריגי / אאולי / לוקריין", ["דורי", "פריגי", "אאולי", "לוקריין"]], ["כל שבעת המודוסים", null]],
    desc: "תשמע מודוס ותבחר את שמו. בסוף תראה בדיוק אילו תווים הוא כולל.", q: "איזה מודוס שמעת?"
  },
};

/* ---------- ציור: חמשה ופסנתר ---------- */
const NAT_IDX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
function noteMidi(name, oct) { const p = parse(name); return 12 * (oct + 1) + NAT[p.l] + p.a; }
function noteOct(name, midi) { const p = parse(name); return Math.round((midi - NAT[p.l] - p.a) / 12) - 1; }
function dpos(name, midi) { const p = parse(name); return noteOct(name, midi) * 7 + NAT_IDX[p.l]; }
const COL = { n: "currentColor", ok: "#3fa34d", bad: "#d4472a", tap: "#4d8dff" };
function svgEl(tag, attrs, ...kids) { const e = document.createElementNS("http://www.w3.org/2000/svg", tag); for (const k in attrs) e.setAttribute(k, attrs[k]); kids.forEach(c => e.append(c)); return e; }
function drawStaff(notes) {
  const W = 360, H = 190; const s = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, width: "100%", role: "img", "aria-label": "חמשה", style: "direction:ltr" });
  const TB = 70, BB = 150, step = 4;
  for (let i = 0; i < 5; i++) { s.append(svgEl("line", { x1: 8, x2: W - 8, y1: TB - i * 8, y2: TB - i * 8, stroke: "currentColor", "stroke-opacity": .55 })); s.append(svgEl("line", { x1: 8, x2: W - 8, y1: BB - i * 8, y2: BB - i * 8, stroke: "currentColor", "stroke-opacity": .55 })); }
  s.append(svgEl("line", { x1: 8, x2: 8, y1: TB - 32, y2: BB, stroke: "currentColor", "stroke-opacity": .55 }));
  const clefT = svgEl("text", { x: 14, y: TB - 6, "font-size": 56, fill: "currentColor", "fill-opacity": .8 }); clefT.textContent = "𝄞"; s.append(clefT);
  const clefB = svgEl("text", { x: 14, y: BB - 10, "font-size": 42, fill: "currentColor", "fill-opacity": .8 }); clefB.textContent = "𝄢"; s.append(clefB);
  const n = notes.length; const x0 = 70, x1 = W - 28; let prevX = null, prevPos = null;
  notes.forEach((nt, i) => {
    const treble = nt.midi >= 60; const p = dpos(nt.name, nt.midi);
    const base = treble ? 30 : 18, yb = treble ? TB : BB; const y = yb - (p - base) * step;
    let x = nt.x === undefined ? x0 + (n === 1 ? 0 : i * (x1 - x0) / (n - 1)) : x0 + nt.x * (x1 - x0);
    if (nt.same && prevPos !== null && Math.abs(p - prevPos) === 1 && prevX === x) x += 11;
    const lines = [];
    if (p < base) for (let q = base - 2; q >= p; q -= 2) lines.push(q); else if (p > base + 8) for (let q = base + 10; q <= p; q += 2) lines.push(q);
    lines.forEach(q => { const ly = yb - (q - base) * step; s.append(svgEl("line", { x1: x - 11, x2: x + 11, y1: ly, y2: ly, stroke: "currentColor", "stroke-opacity": .6 })); });
    const color = nt.color || COL.n;
    s.append(svgEl("ellipse", { cx: x, cy: y, rx: 6.2, ry: 4.6, fill: color, transform: `rotate(-20 ${x} ${y})` }));
    const up = p < (treble ? 34 : 22); s.append(svgEl("line", { x1: up ? x + 5.6 : x - 5.6, x2: up ? x + 5.6 : x - 5.6, y1: y, y2: up ? y - 26 : y + 26, stroke: color, "stroke-width": 1.5 }));
    const a = parse(nt.name).a; if (a !== 0) { const t = svgEl("text", { x: x - 17, y: y + 5, "font-size": 15, fill: color }); t.textContent = a === 1 ? "♯" : a === -1 ? "♭" : a === 2 ? "𝄪" : "𝄫"; s.append(t); }
    const lab = svgEl("text", { x, y: BB + 28, "font-size": 11, fill: color, "text-anchor": "middle" }); lab.textContent = fmtNote(nt.name); s.append(lab);
    prevX = x; prevPos = p;
  });
  return s;
}

/* פסנתר שאפשר לנגן עליו: לחיצה על קליד משמיעה אותו. marks = תווים לסימון (ירוק/אדום). */
const PIANO_LO = 48, PIANO_HI = 84, KW = 38, KH = 150;
const WHITE_PC = [0, 2, 4, 5, 7, 9, 11], WHITE_NM = { 0: "C", 2: "D", 4: "E", 5: "F", 7: "G", 9: "A", 11: "B" };
let pianoScroll = null;
function piano(marks, focusMidi) {
  const whites = []; for (let m = PIANO_LO; m <= PIANO_HI; m++) if (WHITE_PC.includes(m % 12)) whites.push(m);
  const W = whites.length * KW;
  const s = svgEl("svg", { viewBox: `0 0 ${W} ${KH}`, width: W, height: KH, role: "group", "aria-label": "פסנתר – לחץ על קליד כדי לנגן", style: "direction:ltr;display:block;touch-action:manipulation" });
  const xOf = m => WHITE_PC.includes(m % 12) ? whites.indexOf(m) * KW + KW / 2 : (whites.indexOf(m - 1) + 1) * KW;
  const rects = {};
  const flash = m => { const r = rects[m]; if (!r) return; const old = r.getAttribute("data-fill"); r.setAttribute("fill", COL.tap); setTimeout(() => r.setAttribute("fill", old), 330); };
  const press = m => () => { playNote(m, 0, 1.6, .55); flash(m); };
  whites.forEach((m, i) => { const r = svgEl("rect", { x: i * KW + 1, y: 2, width: KW - 2, height: KH - 4, rx: 4, fill: "#e6e6ec", "data-fill": "#e6e6ec", stroke: "#8a8a93", style: "cursor:pointer" }); r.addEventListener("click", press(m)); rects[m] = r; s.append(r); });
  whites.forEach(m => { const t = svgEl("text", { x: xOf(m), y: KH - 8, "font-size": 12, fill: "#555", "text-anchor": "middle", style: "pointer-events:none" }); t.textContent = WHITE_NM[m % 12] + (m % 12 === 0 ? (Math.floor(m / 12) - 1) : ""); s.append(t); });
  for (let m = PIANO_LO; m <= PIANO_HI; m++) if (!WHITE_PC.includes(m % 12)) { const r = svgEl("rect", { x: xOf(m) - KW * .3, y: 2, width: KW * .6, height: (KH - 4) * .6, rx: 3, fill: "#1b1b20", "data-fill": "#1b1b20", style: "cursor:pointer" }); r.addEventListener("click", press(m)); rects[m] = r; s.append(r); }
  (marks || []).forEach(nt => { const black = !WHITE_PC.includes(nt.midi % 12); const cx = xOf(nt.midi), cy = black ? 2 + (KH - 4) * .6 - 16 : KH - 40;
    s.append(svgEl("circle", { cx, cy, r: 11, fill: nt.color || COL.ok, style: "pointer-events:none" })); const t = svgEl("text", { x: cx, y: cy + 4, "font-size": 10, fill: "#fff", "text-anchor": "middle", "font-weight": "700", style: "pointer-events:none" }); t.textContent = fmtNote(nt.name).slice(0, 3); s.append(t); });
  const box = h("div", { style: "overflow-x:auto;direction:ltr;-webkit-overflow-scrolling:touch;border-radius:8px" }, s);
  const target = focusMidi !== undefined ? focusMidi : 60;
  setTimeout(() => { box.scrollLeft = pianoScroll !== null ? pianoScroll : Math.max(0, xOf(Math.max(PIANO_LO, Math.min(PIANO_HI, target))) - box.clientWidth / 2); }, 0);
  box.addEventListener("scroll", () => { pianoScroll = box.scrollLeft; }, { passive: true });
  return box;
}

/* ---------- בניית שאלה ---------- */
function noteSet(fam, item, rootName, rootMidi) {
  let names, midis;
  if (fam === "ivl") { names = item.semis.map((s, i) => spell(rootName, item.steps[i], s)); midis = item.semis.map(s => rootMidi + s); }
  else if (fam === "chord") {
    const b = item.base || item, k = item.inv || 0;
    names = b.semis.map((s, i) => spell(rootName, b.steps[i], s)); midis = b.semis.map((s, i) => rootMidi + s + (i < k ? 12 : 0));
    const ord = midis.map((_, i) => i).sort((a, c) => midis[a] - midis[c]); names = ord.map(i => names[i]); midis = ord.map(i => midis[i]);
  } else {
    names = scaleByKey(rootName, item.key); if (!names) return null; names = [...names, names[0]];
    const pcOf = n => (NAT[parse(n).l] + parse(n).a + 120) % 12, rp = pcOf(rootName);
    midis = names.map(() => 0); midis[0] = rootMidi; midis[names.length - 1] = rootMidi + 12; let prev = rootMidi;
    for (let i = 1; i < names.length - 1; i++) { let m = rootMidi + ((pcOf(names[i]) - rp + 12) % 12); while (m <= prev) m += 12; midis[i] = m; prev = m; }
  }
  if (!names || names.some(n => !n)) return null;
  return names.map((n, i) => ({ name: n, midi: midis[i] }));
}
function makeEarQ(kind, item) {
  const E = EX[kind];
  for (let t = 0; t < 80; t++) {
    const rootName = pick(EAR_ROOTS), rp = parse(rootName); const rootMidi = 48 + ((NAT[rp.l] + rp.a + 12) % 12);
    const notes = noteSet(E.fam, item, rootName, rootMidi); if (notes) return { kind, item, rootName, rootMidi, notes };
  }
  return null;
}
function playNotes(fam, notes, mode) {
  const ms = notes.map(n => n.midi);
  if (fam === "ivl") { if (mode === "harm") playChord(ms, 2.2); else if (mode === "desc") playSeq([...ms].reverse(), .8, 1.5); else playSeq(ms, .8, 1.5); }
  else if (fam === "chord") { if (mode === "arp") playSeq(ms, .45, 1.8); else playChord(ms, 2.4); }
  else playSeq(mode === "desc" ? [...ms].reverse() : ms, .4, .9);
}
const LTRS = t => h("span", { style: "direction:ltr;unicode-bidi:isolate;display:inline-block" }, t);
function nameLine(q, item) {
  const ns = q.notes.map(n => fmtNote(n.name));
  if (EX[q.kind].fam === "scale") ns.pop();
  let s = ns.join(" "); if (item.sym !== undefined) { const b = fmtNote(q.rootName) + item.sym; s = (item.inv ? `${b}/${ns[0]}` : b) + "  =  " + s; }
  return LTRS(s);
}

/* ---------- ממשק ---------- */
function ear(app, arg) {
  ST.ear = ST.ear || {}; ST.ear.modes = ST.ear.modes || {}; ST.ear.n = ST.ear.n || 10;
  if (!arg) return earHub(app);
  if (arg.stage === "presets") return earPresets(app, arg);
  if (arg.stage === "intro") return earIntro(app, arg);
  if (arg.stage === "run") return earRun(app, arg);
  if (arg.stage === "piano") return earPiano(app);
}
function statLine(kind) { const s = ST.stats["ear:" + kind]; return s && s.n ? `הצלחה ${Math.round(100 * s.r / s.n)}% · ${s.n} שאלות` : null; }
function earHub(app) {
  app.append(h("div", { class: "card" }, h("h2", {}, "אימון אוזן"), h("p", { class: "muted", style: "margin:4px 0 10px" }, "בחר נושא. אחרי כל תשובה רואים את התווים על החמשה ועל הפסנתר, ואפשר לנגן ולהשוות."),
    h("div", { class: "row" }, h("button", { class: "btn alt", style: "padding:12px 16px", onclick: () => { unlockAudio(); playSeq([60, 64, 67, 72], .35, 1.2); } }, "🔊 בדיקת שמע"), h("span", { class: "muted", style: "font-size:13px" }, "לא שומעים? בטלפון: כבו מצב שקט (המתג בצד) והגבירו ווליום."))));
  const grid = h("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:12px" });
  Object.keys(EX).forEach(kind => { const E = EX[kind];
    grid.append(h("button", { class: "etile", onclick: () => go("ear", { stage: "presets", kind }) }, h("span", { class: "ic" }, E.ic), h("b", {}, E.he), h("small", {}, E.sub), statLine(kind) ? h("small", { style: "color:var(--ok)" }, statLine(kind)) : null)); });
  grid.append(h("button", { class: "etile", onclick: () => go("ear", { stage: "piano" }) }, h("span", { class: "ic" }, "🎹"), h("b", {}, "פסנתר חופשי"), h("small", {}, "נגן ובדוק בעצמך")));
  app.append(grid);
}
function earPiano(app) {
  pianoScroll = null;
  app.append(h("div", { class: "card" }, h("div", { class: "row" }, h("button", { class: "btn alt", onclick: () => go("ear") }, "✕ חזרה")), h("h2", {}, "פסנתר חופשי"), h("p", { class: "muted" }, "לחץ על קלידים כדי לשמוע. גלול ימינה ושמאלה לאוקטבות אחרות. אפשר להשתמש בו כדי לבדוק אינטרוול או אקורד שמצאת בראש."), piano([], 60)));
}
function earPresets(app, arg) {
  const E = EX[arg.kind];
  app.append(h("div", { class: "card" }, h("div", { class: "row" }, h("button", { class: "btn alt", onclick: () => go("ear") }, "✕ חזרה")), h("h2", { style: "text-align:center" }, `${E.ic} ${E.he}`), h("p", { class: "muted", style: "text-align:center" }, E.desc)));
  const list = h("div", { style: "display:grid;gap:10px" });
  E.presets.forEach(([label, ids]) => { const use = ids || E.items.map(x => x.id); list.append(h("button", { class: "opt", style: "min-height:60px;font-size:17px;text-align:center", onclick: () => go("ear", { stage: "intro", kind: arg.kind, ids: use, label }) }, label, h("br"), h("small", { class: "muted" }, use.length + " אפשרויות"))); });
  if (!E.noCustom) list.append(h("button", { class: "opt", style: "min-height:60px;font-size:17px;text-align:center", onclick: () => go("ear", { stage: "intro", kind: arg.kind, custom: true, ids: E.items.slice(0, 2).map(x => x.id), label: "מותאם אישית" }) }, "✏️ אני בוחר בעצמי…"));
  app.append(list);
}
function earIntro(app, arg) {
  const E = EX[arg.kind]; const ids = arg.ids; const chips = h("div", { class: "row", style: "justify-content:center" });
  const cnt = h("div", { class: "row", style: "justify-content:center" });
  function paintCnt() { cnt.innerHTML = ""; [5, 10, 20].forEach(n => cnt.append(h("button", { class: "btn " + (ST.ear.n === n ? "" : "alt"), style: "padding:8px 18px", onclick: () => { ST.ear.n = n; save(ST); paintCnt(); } }, String(n)))); }
  paintCnt();
  const start = h("button", { class: "btn", style: "width:100%;font-size:19px;padding:16px", onclick: () => { unlockAudio(); if (ids.length < 2) return alert("בחר לפחות שתי אפשרויות"); go("ear", { stage: "run", kind: arg.kind, ids: ids.slice(), label: arg.label }); } }, "▶ התחל תרגיל");
  function paint() {
    chips.innerHTML = ""; E.items.filter(x => arg.custom || ids.includes(x.id)).forEach(x => { const on = ids.includes(x.id); chips.append(h("button", { class: "btn " + (on ? "" : "alt"), style: "padding:8px 14px;font-size:15px", disabled: arg.custom ? null : "disabled", onclick: () => { const i = ids.indexOf(x.id); i >= 0 ? ids.splice(i, 1) : ids.push(x.id); paint(); } }, x.he)); });
  }
  paint();
  app.append(h("div", { class: "card", style: "text-align:center" }, h("div", { class: "row" }, h("button", { class: "btn alt", onclick: () => go("ear", { stage: "presets", kind: arg.kind }) }, "✕ חזרה")), h("div", { class: "muted", style: "margin-top:14px" }, "משימה"), h("h2", { style: "margin:4px 0" }, arg.label), h("div", { class: "muted" }, E.he), h("p", { style: "margin:20px 0" }, E.desc),
    h("h3", {}, arg.custom ? "סמן את האפשרויות בתרגיל" : "האפשרויות בתרגיל"), chips, h("h3", { style: "margin-top:20px" }, "כמה שאלות?"), cnt, h("div", { style: "margin-top:24px" }, start)));
}
function earRun(app, arg) {
  const kind = arg.kind, E = EX[kind]; const items = E.items.filter(x => arg.ids.includes(x.id)); const N = ST.ear.n || 10;
  let mode = ST.ear.modes[kind]; if (!E.modes.some(m => m[0] === mode)) mode = E.modes[0][0];
  let idx = 0, right = 0; const per = {}, wrong = new Set(); let q = null, answered = false;
  const bar = h("i", { style: "width:0%" }), host = h("div");
  app.append(h("div", { class: "row", style: "flex-wrap:nowrap" }, h("button", { class: "btn alt", style: "padding:8px 14px", "aria-label": "יציאה", onclick: () => { stopAudio(); go("ear", { stage: "presets", kind }); } }, "✕"), h("div", { class: "bar", style: "flex:1;height:14px" }, bar), h("span", { class: "muted", id: "earcnt" }, "")), host);
  function setBar() { bar.style.width = (100 * idx / N) + "%"; const c = document.getElementById("earcnt"); if (c) c.textContent = `${Math.min(idx + 1, N)}/${N}`; }
  function next() { if (idx >= N) return done(); q = makeEarQ(kind, pick(items)); if (!q) return next(); answered = false; pianoScroll = null; setBar(); paint(); play(); }
  function play() { playNotes(E.fam, q.notes, mode); }
  function paint(result) {
    host.innerHTML = "";
    const notes = result ? result.notes : [];
    const stNotes = notes.map(n => (E.fam === "ivl" ? n : { ...n, same: true, x: (E.fam === "scale" || (E.fam === "chord" && mode === "arp")) ? undefined : .5 }));
    host.append(h("div", { class: "card", style: "padding:6px" }, drawStaff(stNotes)), h("div", { class: "card", style: "padding:6px" }, piano(notes, q.rootMidi + 5), h("div", { class: "muted", style: "text-align:center;font-size:12px;margin-top:2px" }, "🎹 לחץ על הקלידים כדי לנגן ולבדוק את עצמך")));
    host.append(h("div", { class: "row", style: "justify-content:center;margin:6px 0" }, ...E.modes.map(([k, lab]) => h("button", { class: "btn " + (mode === k ? "" : "alt"), style: "padding:10px 20px;font-size:16px", onclick: () => { mode = k; ST.ear.modes[kind] = k; save(ST); paint(result); play(); } }, lab))));
    host.append(h("div", { class: "prompt", style: "text-align:center" }, result ? (result.ok ? "✔ נכון!" : "✘ לא נכון") : E.q));
    if (result) {
      host.append(h("div", { style: "text-align:center" }, h("div", {}, h("b", {}, result.item.he), result.item.info ? " – " + result.item.info : ""), h("div", { class: "muted" }, "תווים: ", nameLine(q, result.item)), result.ok ? null : h("div", { style: "color:var(--bad)" }, "בחרת: " + result.chosen)));
      const cmp = h("div", { class: "row", style: "justify-content:center;margin:10px 0" }, h("button", { class: "btn alt", style: "padding:10px 16px", onclick: () => playNotes(E.fam, q.notes, mode) }, "▶ הנכונה"));
      if (!result.ok && result.chosenNotes) cmp.append(h("button", { class: "btn alt", style: "padding:10px 16px", onclick: () => playNotes(E.fam, result.chosenNotes, mode) }, "▶ מה שבחרת"));
      host.append(cmp);
    }
    const grid = h("div", { style: `display:grid;grid-template-columns:${items.some(i => i.he.length > 17) || items.length < 3 ? "1fr" : "1fr 1fr"};gap:10px;margin:12px 0` });
    orderOf(items).forEach(it => {
      let cls = "opt"; if (result) { if (it.id === result.item.id) cls += " right"; else if (it.id === result.chosenId) cls += " wrong"; }
      grid.append(h("button", { class: cls, style: "min-height:60px;font-size:18px;text-align:center", disabled: result ? "disabled" : null, onclick: () => answer(it) }, it.he));
    });
    host.append(grid);
    host.append(result ? h("button", { class: "btn nextbtn", style: "width:100%;font-size:19px;padding:16px", onclick: () => { idx++; next(); } }, idx + 1 >= N ? "סיום" : "הבא ←")
      : h("div", { class: "row", style: "justify-content:space-between" }, h("button", { class: "btn alt", style: "flex:1;padding:16px;font-size:17px", onclick: play }, "🔁 שוב"), h("button", { class: "btn alt", style: "flex:1;padding:16px;font-size:17px", onclick: () => { idx++; next(); } }, "דלג")));
  }
  function answer(it) {
    if (answered) return; answered = true; const ok = it.id === q.item.id; if (ok) right++; else wrong.add(q.item.id);
    const p = per[q.item.he] = per[q.item.he] || { n: 0, r: 0 }; p.n++; if (ok) p.r++;
    const s = ST.stats["ear:" + kind] = ST.stats["ear:" + kind] || { n: 0, r: 0 }; s.n++; if (ok) s.r++; save(ST);
    let notes = q.notes.map(n => ({ ...n, color: COL.ok })); let chosenNotes = null;
    if (!ok) chosenNotes = noteSet(E.fam, it, q.rootName, q.rootMidi);
    if (E.fam === "ivl") {
      const [root, top] = notes; const harm = mode === "harm", desc = mode === "desc";
      const xs = harm ? [.35, .35] : desc ? [.5, .2] : [.2, .5]; root.x = xs[0]; top.x = xs[1]; root.same = top.same = true;
      if (!ok && chosenNotes) notes = [root, top, { ...chosenNotes[1], color: COL.bad, x: harm ? .7 : .8 }];
    } else if (!ok && chosenNotes && E.fam === "chord") {
      const have = new Set(q.notes.map(n => n.midi)); notes = [...notes, ...chosenNotes.filter(n => !have.has(n.midi)).map(n => ({ ...n, color: COL.bad }))].sort((a, b) => a.midi - b.midi);
    }
    paint({ ok, item: q.item, chosen: it.he, chosenId: it.id, notes, chosenNotes });
    const nb = host.querySelector(".nextbtn"); if (nb && nb.scrollIntoView) setTimeout(() => nb.scrollIntoView({ block: "nearest", behavior: "smooth" }), 60);
  }
  function orderOf(a) { if (!q._order) q._order = shuffle(a.map(x => x.id)); return q._order.map(id => a.find(x => x.id === id)); }
  function done() {
    stopAudio(); host.innerHTML = ""; setBar(); bar.style.width = "100%";
    const wr = [...wrong]; const pct = Math.round(100 * right / N);
    host.append(h("div", { class: "card", style: "text-align:center" }, h("h2", {}, `${right} / ${N}`), h("div", { class: "muted" }, pct + "%"), h("p", {}, right >= N * .9 ? "מעולה! 🎉" : right >= N * .7 ? "יפה מאוד – עוד קצת תרגול." : "המשך לתרגל – זה מתקבע."),
      h("table", {}, h("tr", {}, h("th", {}, "אפשרות"), h("th", {}, "נכון")), ...Object.keys(per).map(k => h("tr", {}, h("td", {}, k), h("td", {}, `${per[k].r}/${per[k].n}`)))),
      h("div", { class: "row", style: "justify-content:center;margin-top:12px" }, h("button", { class: "btn", style: "padding:12px 20px", onclick: () => go("ear", { stage: "run", kind, ids: arg.ids, label: arg.label }) }, "עוד פעם"),
        wr.length >= 2 ? h("button", { class: "btn alt", style: "padding:12px 20px", onclick: () => go("ear", { stage: "run", kind, ids: wr, label: "חזרה על הטעויות" }) }, "תרגל את מה שטעיתי") : null,
        h("button", { class: "btn alt", style: "padding:12px 20px", onclick: () => go("ear") }, "לתרגילים"))));
  }
  next();
}
