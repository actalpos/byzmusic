/**

layout-fixes-and-links.js

Generated on: 2026-03-10 21:42

// [V] - Vespers:
// [LIHC] = Lord I Have Cried
// [AP] = Aposticha
// [O] = Orthros:
// [PR] = Praises
// [EX] = Exaposteilarion
// [KA] = Kathisma
// [PS] = Praises Stichera
// [LT] = Litia
// [V][LIHC] DOXASTIKON FOR PENTECOST IN TONE EIGHT
// [V][AP] DOXASTIKON FOR PENTECOST IN TONE EIGHT
// [O][PR] DOXASTIKON FOR...



Layout cleanup + RTL/LTR detection + title links

Typography controlled entirely by CSS

June 3 2026 - add festal to the kewords to be ignored (for FESTAL TROPARIA AFTER PSALM 50)
June 4 2026 - fix for linking [V] header and [O] header
June 30 2026 remove Sticheras from the title
June 30 2026 - fix for in one place FIFTH EOTHINON EXAPOSTEILARION IN TONE TWO in other FIFTH EOTHINON EXAPOSTEILARION TONE TWO
July 7 2026 - fix for overlapping [V] [LIHC] For St. Paisios in Tone One | Karam with [O] For St. Paisios in Tone One | Karamnot shouwn in Orthros as well. Only when the service moment is provided.
            - struct change: do not include LITART in VESP only for customizations. So Always keep [LT] as separate entity
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
  if (path.includes("litart")) return "LT";

  // if ((path.includes("liturgy") || path.includes("divine")) && !path.includes("variables")) {
  //   return "L";
  // }

  if ((path.includes("liturgy") || path.includes("divine")) && path.includes("variables")) {
    return "LV";
  }

  return null;
}

const SERVICE = detectServiceType();

const SERVICE_ORDER = {
  V: {
    LIHC: 1,
    LT: 2,
    AP: 3,
  }
};

/**********************
 * UTILS
 **********************/
function normalizeTitle(str) {
  str = str
      .replace(/[\n\r\t]+/g, " ")
    .replace(/\(\s*\*\*.*?\*\*\s*\)/g, "")   // (** ... **)
    .replace(/\*\*.*?\*\*/g, "")             // fallback
    .replace(/[*]/g, "")
    .replace(/["“”]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\(\s*/g, "( ")
    .replace(/\s*\)/g, " )")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^(the|a|an|sticheras)\s+/i, "")          // remove leading article
    .replace(/\bin\s+tone\b/gi, "tone")                

  const prefixMatch = str.match(/^((\[[a-z]+\])+)\s*(.*)$/);

  if (prefixMatch) {
    const prefixes = prefixMatch[1];
    let title = prefixMatch[3];

    title = title.replace(/^(the|a|an|festal)\s+/, "");

    return `${prefixes} ${title}`.trim();
  }

  return str.replace(/^(the|a|an|festal)\s+/, "");
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

let titleGroups = {};
let titleUsage = {};

try {

  const base = window.location.pathname.includes("/byzmusic/") ? "/byzmusic" : "";
  const res = await fetch(`${base}/system/data/titleLink.json`);

  if (!res.ok) throw new Error("titleLink.json missing");

  const raw = await res.json();


  for (const key in raw) {

    const item = raw[key];

    titleLinks[normalizeTitle(key)] =
      typeof item === "string" ? { url: item, name: null } : item;

    const m = key.match(
      /^\[([A-Z]+)\]\s+\[([A-Z]+)\]\s+(.*)$/i
    );

    if (m) {

      const service = m[1].toUpperCase();
      const moment = m[2].toUpperCase();
      const title = normalizeTitle(m[3]);

      if (!titleGroups[title]) {
        titleGroups[title] = [];
      }

      titleGroups[title].push({
        service,
        moment,
        item
      });
    }

    Object.keys(titleGroups).forEach(title => {

      titleGroups[title].sort((a, b) => {

        const order =
          SERVICE_ORDER[a.service] || {};

        const pa = order[a.moment] || 999;
        const pb = order[b.moment] || 999;

        return pa - pb;
      });

    });    
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
  if (originalText.toUpperCase().includes("EOTHINON")) {
    console.log(originalText);
  }

  const baseKey = normalizeTitle(originalText);

  if (baseKey.toLowerCase().includes("eothinon")) {

    console.log(baseKey)
  }

  let item = null;

  if (
    SERVICE &&
    titleGroups[baseKey] &&
    titleGroups[baseKey].length
  ) {

    const index = titleUsage[baseKey] || 0;

    item =
      titleGroups[baseKey][
        Math.min(
          index,
          titleGroups[baseKey].length - 1
        )
      ]?.item;

    titleUsage[baseKey] = index + 1;
  }

  //fix for linking [V] header and [O] header
  if (!item && SERVICE) {
    item = titleLinks[
      `[${SERVICE.toLowerCase()}] ${baseKey}`
    ];
  }

  if (!item) {
    item = titleLinks[baseKey];
  }
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