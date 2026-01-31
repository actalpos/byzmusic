(function () {
  "use strict";

  /**********************
   *  SAFE DOM READY
   **********************/
  function ready(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  ready(async () => {

    console.log("layout-fixes-and-links v1 loaded");

    /**********************
     *  SERVICE TYPE
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
     *  TEXT UTIL
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
     *  PARAGRAPH FIXES
     **********************/
    document.querySelectorAll("td p").forEach(p => {
      const text = p.textContent.trim();
      if (!text) return;

      // curățăm Word / Libre
      p.removeAttribute("align");
      p.style.float = "none";
      p.style.position = "static";

      // direcție automată
      if (isRTL(text)) {
        p.style.direction = "rtl";
        p.style.textAlign = "right";
      } else {
        p.style.direction = "ltr";
        p.style.textAlign = "left";
      }
    });

    // titluri (colspan)
    document.querySelectorAll("td[colspan] > p").forEach(p => {
      p.style.textAlign = "center";
      p.style.direction = "ltr";
    });

    /**********************
     *  LOAD TITLE LINKS
     **********************/
    let rawLinks = {};
    let titleLinks = {};

    try {
      const base = window.location.pathname.includes("/byzmusic/")
        ? "/byzmusic"
        : "";

      const res = await fetch(`${base}/system/data/titleLink.json`);
      if (!res.ok) throw new Error("titleLink.json missing");

      rawLinks = await res.json();

      // normalizare chei
      for (const key in rawLinks) {
        titleLinks[normalizeTitle(key)] = rawLinks[key];
      }
    } catch (e) {
      console.warn("Title link data not loaded:", e.message);
    }

    /**********************
     *  APPLY LINKS
     **********************/
    document.querySelectorAll("td p").forEach(p => {
      const originalText = p.textContent.trim();
      if (!originalText) return;

      const baseKey = normalizeTitle(originalText);
      let url = null;

      // 1️⃣ prefixat [V][O][L]
      if (SERVICE) {
        const prefixedKey = `[${SERVICE.toLowerCase()}] ${baseKey}`;
        url = titleLinks[prefixedKey];
      }

      // 2️⃣ fallback vechi
      if (!url) {
        url = titleLinks[baseKey];
      }

      if (!url) return;

      // evităm dublarea linkurilor
      if (p.querySelector("a")) return;

      const span = document.createElement("span");
      span.innerHTML = p.innerHTML;

      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = span.innerHTML;

      p.innerHTML = "";
      p.appendChild(a);
    });

    /**********************
     *  CLEAN LINK COLORS
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
