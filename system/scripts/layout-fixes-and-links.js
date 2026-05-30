/**
 * layout-fixes-and-links.js
 * Updated: Tiered multi-service bracket priority sorting & queue assignment
 */

(function () {
"use strict";

function ready(fn) {
  if (document.readyState !== "loading") fn();
  else document.addEventListener("DOMContentLoaded", fn);
}

ready(async () => {

console.log("layout-fixes-and-links loaded");

/******************************************************
 * UTILS
 ******************************************************/
function normalizeTitle(str) {
  return str
    // 1. line noise
    .replace(/[\n\r\t]+/g, " ")

    // 2. REMOVE ALL PREFIXES [V] [AP] [LIHC] etc
    .replace(/(\[[A-Z]+\]\s*)+/g, "")

    // 3. REMOVE ARTICLES
    .replace(/^\b(THE|A|AN)\b\s+/i, "")

    // 4. punctuation cleanup
    .replace(/[*]/g, "")
    .replace(/["“”]/g, "")
    .replace(/[–—]/g, "-")

    // 5. normalize spaces
    .replace(/\s+/g, " ")

    .trim()
    .toUpperCase();
}

function isRTL(text) {
  return /[\u0590-\u08FF]/.test(text);
}

/******************************************************
 * SERVICE ORDER (TIERED LITURGICAL MOMENTS)
 ******************************************************/
const serviceOrder = {
  // Vespers Priorities
  V: {
    LIHC: 1,
    AP: 2,
    LT: 3
  },
  // Orthros Priorities
  O: {
    KA: 1,
    EX: 2,
    PR: 3,
    PS: 4
  }
};

/******************************************************
 * TABLE CLEANUP
 ******************************************************/
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

  const remaining = Array.from(tr.children).filter(td => td.tagName === "TD");

  if (remaining.length === 1) remaining[0].setAttribute("colspan", "2");
  if (remaining.length === 2) remaining.forEach(td => td.removeAttribute("colspan"));
});

/******************************************************
 * FORCE LTR TABLES
 ******************************************************/
document.querySelectorAll("table").forEach(table => {
  table.setAttribute("dir", "ltr");
});

/******************************************************
 * PARAGRAPH RTL/LTR FIX
 ******************************************************/
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

/******************************************************
 * COLUMN FIX
 ******************************************************/
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

/******************************************************
 * LOAD TITLE LINKS (Sequential Grouping & Multi-Tier Sorting)
 ******************************************************/
let titleLinks = {};

try {

  const base = window.location.pathname.includes("/byzmusic/") ? "/byzmusic" : "";
  const res = await fetch(`${base}/system/data/titleLink.json`);

  if (!res.ok) throw new Error("titleLink.json missing");

  const raw = await res.json();

  for (const key in raw) {
    const item = raw[key];
    const baseKey = normalizeTitle(key);

    if (!titleLinks[baseKey]) {
      titleLinks[baseKey] = [];
    }

    const itemsArray = (item.type === "multi" && Array.isArray(item.versions)) ? item.versions : [item];

    itemsArray.forEach(v => {
      titleLinks[baseKey].push({
        url: v.url,
        name: v.name || "",
        label: v.label || "",
        description: v.description || key
      });
    });
  }

  /**
   * Helper function to parse both Service Tier (V/O) and Liturgical Moment
   * Returns a numerical rank weight. Lower values = higher priority.
   */
  const calculateLiturgicalRank = (desc) => {
    if (!desc) return 9999;
    
    // Extract raw tags from formatting brackets (e.g. ["[V]", "[LIHC]"])
    const matches = desc.match(/\[([A-Z]+)\]/g);
    if (!matches) return 9999;

    const tokens = matches.map(m => m.replace(/[\[\]]/g, ""));
    
    // 1. Establish structural high-level tier priority (Vespers defaults before Orthros)
    let serviceType = "V"; 
    if (tokens.includes("O")) serviceType = "O";
    
    const serviceBaseWeight = serviceType === "V" ? 100 : 200;

    // 2. Identify inner moment index inside designated sub-category mapping
    let innerPriority = 99;
    const tierMap = serviceOrder[serviceType];

    for (let token of tokens) {
      if (tierMap && tierMap[token] !== undefined) {
        innerPriority = tierMap[token];
        break;
      }
    }

    return serviceBaseWeight + innerPriority; 
  };

  // Sort queues based on comprehensive calculated ranks
  for (const baseKey in titleLinks) {
    titleLinks[baseKey].sort((a, b) => {
      return calculateLiturgicalRank(a.description) - calculateLiturgicalRank(b.description);
    });
  }

} catch (e) {
  console.warn("TitleLink load failed:", e.message);
}

/******************************************************
 * APPLY LINKS (Sequential Queue Assignment)
 ******************************************************/
document.querySelectorAll("td p").forEach(p => {

  if (p.querySelector("a")) return;

  const originalText = p.textContent.trim();
  if (!originalText) return;

  const baseKey = normalizeTitle(originalText);
  const queue = titleLinks[baseKey];
  
  if (!queue || queue.length === 0) return;

  // Extract the correctly prioritized item from the sorted queue array
  const item = queue.shift();

  if (!item.url) return;

  const a = document.createElement("a");
  a.href = item.url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  if (item.label) {
    const span = document.createElement("span");
    span.innerHTML = p.innerHTML;

    const space = document.createTextNode(" ");
    const labelSpan = document.createElement("span");
    labelSpan.textContent = `(${item.label})`;
    labelSpan.style.fontWeight = "bold";
    labelSpan.style.marginLeft = "4px";

    span.appendChild(space);
    span.appendChild(labelSpan);
    a.appendChild(span);
  } else {
    a.innerHTML = p.innerHTML;
  }

  if (item.name) a.title = item.name;

  p.innerHTML = "";
  p.appendChild(a);
});

/******************************************************
 * CLEAN WORD FORMATTING
 ******************************************************/
document.querySelectorAll("[style*='font-size']").forEach(el => {
  el.style.fontSize = "";
});

document.querySelectorAll("font[size]").forEach(el => {
  el.removeAttribute("size");
});

document.querySelectorAll("font[face]").forEach(el => {
  el.removeAttribute("face");
});

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
