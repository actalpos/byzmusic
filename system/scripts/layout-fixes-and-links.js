document.addEventListener("DOMContentLoaded", async () => {

  /**********************
   *  LAYOUT FIXES
   **********************/

  // Elimină toate <center>
  document.querySelectorAll("center").forEach(c => {
    const parent = c.parentNode;
    while (c.firstChild) parent.insertBefore(c.firstChild, c);
    parent.removeChild(c);
  });

  // Table wrapper pentru tabele mari (scroll pe mobil)
  document.querySelectorAll("table").forEach(table => {
    if (!table.parentElement.classList.contains("table-wrapper")) {
      const wrapper = document.createElement("div");
      wrapper.className = "table-wrapper";
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });

  // Detectare RTL (arabă, ebraică, etc.)
  function isRTL(text) {
    return /[\u0590-\u08FF]/.test(text);
  }

  // Aliniere automată în celule: arabă → dreapta, engleză → stânga
  document.querySelectorAll("td p").forEach(p => {
    const text = p.textContent.trim();
    if (!text) return;

    // curățăm doar alinierea veche
    p.removeAttribute("align");
    p.style.textAlign = "";
    p.style.direction = "";

    if (isRTL(text)) {
      p.style.textAlign = "right";
      p.style.direction = "rtl";
    } else {
      p.style.textAlign = "left";
      p.style.direction = "ltr";
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

  // Normalizează titluri (chei din titleLink.json)
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

  // Aplică linkurile
  document.querySelectorAll("td p").forEach(p => {
    const originalText = p.textContent.trim();
    if (!originalText) return;

    const normalized = normalizeTitle(originalText);

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

  // Elimină culoarea forțată de Word/Libre din interiorul linkurilor
  document.querySelectorAll("a font").forEach(f => {
    if (f.hasAttribute("color")) f.removeAttribute("color");
    if (f.style && f.style.color) f.style.color = "";
  });

  // În unele cazuri există <span style="color:#000000"> în interiorul linkului
  document.querySelectorAll("a span").forEach(s => {
    if (s.style && s.style.color) s.style.color = "";
  });

  console.log("Layout fixes and link fixes applied successfully.");
});
