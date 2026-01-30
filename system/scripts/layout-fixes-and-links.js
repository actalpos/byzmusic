
document.addEventListener("DOMContentLoaded", async () => {

  /**********************
   *  LAYOUT FIXES
   **********************/

  // Elimină toate <center> din Word/LibreOffice
  document.querySelectorAll("center").forEach(c => {
    const parent = c.parentNode;
    while (c.firstChild) parent.insertBefore(c.firstChild, c);
    parent.removeChild(c);
  });

  // Detectare RTL (arabă, ebraică, etc.)
  function isRTL(text) {
    return /[\u0590-\u08FF]/.test(text);
  }

  // Aliniere automată în celule: arabă → dreapta, engleză → stânga
  document.querySelectorAll("td p").forEach(p => {
    const text = (p.innerText || p.textContent).trim();
    if (!text) return;

    p.removeAttribute("align");
    p.style.textAlign = "";
    p.style.direction = "";

    if (isRTL(text)) {
      p.style.textAlign = "right";
      p.style.direction = "rtl";
      p.setAttribute("dir", "rtl");
    } else {
      p.style.textAlign = "left";
      p.style.direction = "ltr";
      p.setAttribute("dir", "ltr");
    }
  });

  // Titluri cu colspan → centrate
  document.querySelectorAll("td[colspan] > p").forEach(p => {
    p.removeAttribute("align");
    p.style.textAlign = "center";
    p.style.direction = "ltr";
  });


  /**********************
   *  LINK REPLACEMENT
   **********************/

  function normalizeTitle(str) {
    return str
      .replace(/\s+/g, " ")
      .replace(/[\n\r\t]/g, " ")
      .trim()
      .toLowerCase();
  }

  let titleLinks = {};

  try {
    const base = window.location.pathname.includes("/byzmusic/")
      ? "/byzmusic"
      : "";

    const response = await fetch(`${base}/system/data/titleLink.json`);
    if (!response.ok) throw new Error("titleLink.json not found");
    const data = await response.json();

    // Normalizare chei
    for (const key in data) {
      titleLinks[normalizeTitle(key)] = data[key];
    }
  } catch (e) {
    console.warn("titleLink.json could not be loaded:", e.message);
  }

  // Aplică linkurile păstrând HTML-ul original
  document.querySelectorAll("td p").forEach(p => {
    const textOnly = (p.innerText || p.textContent).trim();
    if (!textOnly) return;

    const normalized = normalizeTitle(textOnly);

    if (titleLinks[normalized]) {
      const url = titleLinks[normalized];

      const span = document.createElement("span");
      span.innerHTML = p.innerHTML;

      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.innerHTML = span.innerHTML;

      p.innerHTML = "";
      p.appendChild(a);
    }
  });

  /**********************
   *  CLEAN LINK COLORS
   **********************/

  // Elimină culorile și stilurile Word/LibreOffice din interiorul linkurilor
  document.querySelectorAll("a font, a span").forEach(el => {
    if (el.hasAttribute("color")) el.removeAttribute("color");
    if (el.style && el.style.color) el.style.color = "";
  });

  console.log("Layout fixes and link replacements applied successfully.");
});

