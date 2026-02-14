/**
 * layout-fixes-and-links.js
 * Generated on: 2026-02-13 21:05
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
    console.log("layout-fixes-and-links FINAL loaded");

    /**********************
     * SERVICE TYPE (pentru title links)
     **********************/
    function detectServiceType() {
      const path = window.location.pathname.toLowerCase();
      if (path.includes("vesp")) return "V";
      if (path.includes("orthros")) return "O";
      if ((path.includes("liturgy") || path.includes("divine")) && !path.includes("variables")) return "L";
      if ((path.includes("liturgy") || path.includes("divine")) && path.includes("variables")) return "LV";
      return null;
    }
    const SERVICE = detectServiceType();

    /**********************
     * UTILS
     **********************/
    function normalizeTitle(str) {
      return str.replace(/\s+/g, " ").replace(/[\n\r\t]/g, " ").trim().toLowerCase();
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
      // Eliminăm td-uri goale sau cu width anormal (ghost column)
      const tds = Array.from(tr.children).filter(td => td.tagName === "TD");
      tds.forEach(td => {
        const text = td.textContent.replace(/\s+/g, "");
        const width = td.getAttribute("width");
        if (!text || (width && parseInt(width) > 1000)) {
          td.remove();
        }
      });

      // Recalculăm td-urile rămase
      const remainingTds = Array.from(tr.children).filter(td => td.tagName === "TD");

      if (remainingTds.length === 1) {
        remainingTds[0].setAttribute("colspan", "2");
      } else if (remainingTds.length === 2) {
        remainingTds.forEach(td => td.removeAttribute("colspan"));
      }
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

      if (isRTL(text)) {
        p.style.direction = "rtl";
        p.style.textAlign = "right";
      } else {
        p.style.direction = "ltr";
        p.style.textAlign = "left";
      }
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
        titleLinks[normalizeTitle(key)] = typeof item === "string" ? { url: item, name: null } : item;
      }
    } catch (e) {
      console.warn("TitleLink load failed:", e.message);
    }

    /**********************
     * APPLY LINKS
     **********************/
    document.querySelectorAll("td p").forEach(p => {
      if (p.querySelector("a")) return;
      const originalText = p.textContent.trim();
      if (!originalText) return;

      const baseKey = normalizeTitle(originalText);
      let item = SERVICE ? titleLinks[`[${SERVICE.toLowerCase()}] ${baseKey}`] : null;
      if (!item) item = titleLinks[baseKey];
      if (!item || !item.url) return;

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
     * CLEAN WORD COLORS
     **********************/
    document.querySelectorAll("a font").forEach(f => {
      f.removeAttribute("color");
      if (f.style) f.style.color = "";
    });
    document.querySelectorAll("a span").forEach(s => {
      if (s.style) s.style.color = "";
    });

    console.log("Layout + links applied, ghost columns removed, colspan fixed");
  });

})();
