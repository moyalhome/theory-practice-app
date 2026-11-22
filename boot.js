"use strict";
/* טעינת נתונים: מקומית (data.js + corpus.js גלויים) או מהאתר (enc.js מוצפן – נפתח במפתח שבקישור) */
const KEY_STORE = "theory.key";
function b64(s) { const bin = atob(s); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
async function decryptWith(pass) {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: b64(ENC.salt), iterations: ENC.iter, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  window.SLIDE_KEY = key;   // אותו מפתח פותח גם את קובצי המצגות המוצפנים
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(ENC.iv) }, key, b64(ENC.data));
  return JSON.parse(new TextDecoder().decode(plain));
}
function keyFromUrl() { const m = /[#&]k=([^&]+)/.exec(location.hash); return m ? decodeURIComponent(m[1]) : null; }
async function unlockData(msg) {
  let pass = keyFromUrl() || localStorage.getItem(KEY_STORE);
  while (true) {
    if (pass) {
      try { const d = await decryptWith(pass); localStorage.setItem(KEY_STORE, pass); window.TERMS = d.TERMS; window.CORPUS = d.CORPUS; window.LESSON_TITLES = d.LESSON_TITLES; window.NOTES = d.NOTES || []; return true; }
      catch (e) { localStorage.removeItem(KEY_STORE); msg = "הקוד שגוי – נסה שוב (או פתח את הקישור המקורי)."; }
    }
    pass = await askPass(msg);
  }
}
function askPass(msg) {
  return new Promise(res => {
    const app = document.getElementById("app"); app.innerHTML = "";
    const inp = h("input", { type: "text", placeholder: "קוד גישה", autocomplete: "off", style: "direction:ltr" });
    const go1 = () => res(inp.value.trim());
    inp.addEventListener("keydown", e => { if (e.key === "Enter") go1(); });
    app.append(h("div", { class: "card" }, h("h2", {}, "🔒 קוד גישה"), h("p", { class: "muted" }, msg || "חומרי הקורס מוצפנים. הדבק את קוד הגישה (או פתח את הקישור המלא שקיבלת)."), inp, h("div", { class: "row", style: "margin-top:8px" }, h("button", { class: "btn", onclick: go1 }, "פתח"))));
    inp.focus();
  });
}
function installHint() {
  const app = document.getElementById("app");
  let deferred = null;
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; const b = document.getElementById("installbtn"); if (b) b.style.display = ""; window.__installPrompt = deferred; });
}
async function boot() {
  installHint();
  if (typeof TERMS === "undefined" && typeof window.TERMS === "undefined") {
    if (typeof ENC === "undefined") { document.getElementById("app").textContent = "חסרים קובצי נתונים."; return; }
    await unlockData();
  }
  /* מציגים שם אנגלי רק אם הוא מופיע בשקפים עצמם (המצגת היא האמת) */
  try { const all = CORPUS.map(d => d.t).join("\n").toLowerCase(); TERMS.forEach(t => { if (!t.en) return; const ok = t.en.split(/\s*\/\s*/).some(p => all.includes(p.toLowerCase().replace(/[()]/g, "").trim())); if (!ok) t.en = ""; }); } catch (e) { }
  renderNav(); go("home");
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => { });
}
boot();
