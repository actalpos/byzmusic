/**

layout-fixes-and-links.js

Generated on: 2026-03-10 21:42




Layout cleanup + RTL/LTR detection + title links

Typography controlled entirely by CSS
*/

(function () {
"use strict";

function ready(fn) {
if (document.readyState !== "loading") {
fn();
} else {
document.addEventListener("DOMContentLoaded", fn);
}
}

ready(async () => {

console.log("layout-fixes-and-links loaded");

/**********************
 * SERVICE TYPE
 **********************/
function detectServiceType() {
  const path = window.location.pathname.toLowerCase();

  if (path.includes("vesp")) return "V";
  if (path.includes("orthros")) return "O";

  if ((path.includes("liturgy") || path.includes("divine")) && !path.includes("variables")) {
    return "L";
  }

  if ((path.includes("liturgy") || path.includes("divine")) && path.includes("variables")) {
    return "LV";
  }

  return null;
}

const SERVICE = detectServiceType();

/**********************
 * UTILS
 **********************/
function normalizeTitle(str) {
  return str
    .replace(/[\n\r\t]+/g, " ")
    .replace(/[*]/g, "")
    .replace(/["“”]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\(\s*/g, "( ")
    .replace(/\s*\)/g, " )")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isRTL(text) {
  return /[\u0590-\u08FF]/.test(text);
}

/**********************
 * REMOVE GHOST COLUMNS
 **********************/
document.querySelectorAll("table col").forEach(col => {
  const width = parseInt(col.getAttribute("width"));
  if (!width || width > 1000) col.remove();
});

document.querySelectorAll("table tr").forEach(tr => {

  const tds = Array.from(tr.children).filter(td => td.tagName === "TD");

  tds.forEach(td => {

    const text = td.textContent.replace(/\s+/g, "");
    const width = td.getAttribute("width");

    if (!text || (width && parseInt(width) > 1000)) {
      td.remove();
    }

  });

  const remainingTds = Array.from(tr.children).filter(td => td.tagName === "TD");

  if (remainingTds.length === 1) {
    remainingTds[0].setAttribute("colspan", "2");
  }

  if (remainingTds.length === 2) {
    remainingTds.forEach(td => td.removeAttribute("colspan"));
  }

});

/**********************
 * FORCE LTR TABLE LAYOUT
 **********************/
document.querySelectorAll("table").forEach(table => {
  table.setAttribute("dir", "ltr");
});

/**********************
 * PARAGRAPH FIXES
 **********************/
document.querySelectorAll("td p").forEach(p => {

  const text = p.textContent.trim();
  if (!text) return;

  p.removeAttribute("align");
  p.style.float = "none";
  p.style.position = "static";

  const rtl = isRTL(text);

  p.style.direction = rtl ? "rtl" : "ltr";
  p.style.textAlign = rtl ? "right" : "left";

});

/**********************
 * FIX COLUMN ORDER
 **********************/
document.querySelectorAll("table tr").forEach(tr => {

  const tds = Array.from(tr.querySelectorAll("td"));
  if (tds.length !== 2) return;

  const leftText = tds[0].textContent.trim();
  const rightText = tds[1].textContent.trim();

  const leftRTL = isRTL(leftText);
  const rightRTL = isRTL(rightText);

  if (leftRTL && !rightRTL) {
    tr.insertBefore(tds[1], tds[0]);
  }

  tds.forEach(td => {

    const text = td.textContent.trim();
    if (!text) return;

    const rtl = isRTL(text);

    td.setAttribute("dir", rtl ? "rtl" : "ltr");
    td.style.textAlign = rtl ? "right" : "left";

  });

});

/**********************
 * LOAD TITLE LINKS
 **********************/
let titleLinks = {};

try {

  const base = window.location.pathname.includes("/byzmusic/") ? "/byzmusic" : "";
  const res = await fetch(`${base}/system/data/titleLink.json`);

  if (!res.ok) throw new Error("titleLink.json missing");

  const raw = await res.json();

  for (const key in raw) {

    const item = raw[key];

    titleLinks[normalizeTitle(key)] =
      typeof item === "string" ? { url: item, name: null } : item;

  }

} catch (e) {

  console.warn("TitleLink load failed:", e.message);

}

/**********************
 * APPLY TITLE LINKS
 **********************/
document.querySelectorAll("td p").forEach(p => {

  if (p.querySelector("a")) return;

  const originalText = p.textContent.trim();
  if (!originalText) return;

  const baseKey = normalizeTitle(originalText);

  let item = SERVICE
    ? titleLinks[`[${SERVICE.toLowerCase()}] ${baseKey}`]
    : null;

  if (!item) item = titleLinks[baseKey];
  if (!item) return;

  if (item.type === "multi" && Array.isArray(item.versions)) {

    const span = document.createElement("span");
    span.innerHTML = p.innerHTML;

    item.versions.forEach(v => {

      const space = document.createTextNode(" ");

      const a = document.createElement("a");
      a.href = v.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = `(${v.label})`;

      span.appendChild(space);
      span.appendChild(a);

    });

    p.innerHTML = "";
    p.appendChild(span);

    return;

  }

  if (!item.url) return;

  const a = document.createElement("a");

  a.href = item.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.innerHTML = p.innerHTML;

  if (item.name) a.title = item.name;

  p.innerHTML = "";
  p.appendChild(a);

});

/**********************
 * REMOVE WORD FONT SIZES
 **********************/
document.querySelectorAll("[style*='font-size']").forEach(el => {
  el.style.fontSize = "";
});

document.querySelectorAll("font[size]").forEach(el => {
  el.removeAttribute("size");
});

document.querySelectorAll("font[face]").forEach(el => {
  el.removeAttribute("face");
});

/**********************
 * CLEAN WORD COLORS
 **********************/
document.querySelectorAll("a font").forEach(f => {
  f.removeAttribute("color");
  if (f.style) f.style.color = "";
});

document.querySelectorAll("a span").forEach(s => {
  if (s.style) s.style.color = "";
});

console.log("Layout + links applied successfully.");

});

})();