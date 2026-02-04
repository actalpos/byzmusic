(function () {
  "use strict";

  /**********************
   * SAFE DOM READY
   **********************/
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
     * SERVICE TYPE
     **********************/
    function detectServiceType() {
      const path = window.location.pathname.toLowerCase();
      if (path.includes("vesp")) return "V";
      if (path.includes("orthros")) return "O";
      if (path.includes("liturgy") || path.includes("divine")) return "L";
      return null;
    }

    const SERVICE = detectServiceType();

    /**********************
     * UTILS
     **********************/
    function normalizeTitle(str) {
      return str
        .replace(/\s+/g, " ")
        .replace(/[\n\r\t]/g, " ")
        .trim()
        .toLowerCase();
    }

    function isRTL(text) {
      return /[\u0590-\u08FF]/.test(text);
    }

    /**********************
     * FIX WORD COLGROUP BUG
     **********************/
    document.querySelectorAll("table colgroup, table col").forEach(el => {
      el.remove();
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

    document.querySelectorAll("td[colspan] > p").forEach(p => {
      p.style.textAlign = "center";
      p.style.direction = "ltr";
    });

    /**********************
     * REMOVE WORD GHOST COLUMNS
     **********************/
    document.querySelectorAll("table tr").forEach(tr => {
      const tds = Array.from(tr.children).filter(el => el.tagName === "TD");

      if (tds.length <= 2) return;

      for (let i = 2; i < tds.length; i++) {
        const td = tds[i];
        const text = td.textContent.replace(/\s+/g, "");
        if (!text) {
          td.remove();
        }
      }
    });

    /**********************
     * LOAD TITLE LINKS
     **********************/
    let titleLinks = {};

    try {
      const base = window.location.pathname.includes("/byzmusic/")
        ? "/byzmusic"
        : "";

      const res = await fetch(`${base}/system/data/titleLink.json`);
      if (!res.ok) throw new Error("titleLink.json missing");

      const raw = await res.json();

      // 🔥 Compatibil vechi + nou format JSON
      for (const key in raw) {
        const item = raw[key];

        if (typeof item === "string") {
          titleLinks[normalizeTitle(key)] = {
            url: item,
            name: null
          };
        } else {
          titleLinks[normalizeTitle(key)] = item;
        }
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

      let item = null;

      // prefix service
      if (SERVICE) {
        const prefixedKey = `[${SERVICE.toLowerCase()}] ${baseKey}`;
        item = titleLinks[prefixedKey];
      }

      // fallback
      if (!item) {
        item = titleLinks[baseKey];
      }

      if (!item || !item.url) return;

      const a = document.createElement("a");
      a.href = item.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = p.innerHTML;

      // ⭐ Tooltip cu numele fișierului
      if (item.name) {
        a.title = item.name;
      }

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

    console.log(
      "Layout + links applied",
      SERVICE ? `(service ${SERVICE})` : "(generic)"
    );

  });

})();
