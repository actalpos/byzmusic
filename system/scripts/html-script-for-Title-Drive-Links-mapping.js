
  // Script to be added to the HTML liturgy service file to be able to ADD the related DRIVE LINKS to the TITLES 
  
// -------------------- normalize function --------------------
function normalize(s) {
  if (!s) return "";

  // 1. elimină <br> și <br/>
  s = s.replace(/<br\s*\/?>/gi, " ");

  // 2. elimină tot ce e între paranteze (de obicei note, italics, etc.)
  s = s.replace(/\(.*?\)/g, "");

  // 3. decodează entități HTML
  const txt = document.createElement("textarea");
  txt.innerHTML = s;
  s = txt.value;

  // 4. elimină spații multiple
  s = s.replace(/\s+/g, " ").trim();

  // 5. uppercase pentru consistență
  s = s.toUpperCase();

  return s;
}


// -------------------- clean HTML --------------------
function cleanHtml() {
  // 1. elimină toate <o:p>
  document.querySelectorAll("o\\:p").forEach(e => e.remove());

  // 2. elimină span-uri goale
  document.querySelectorAll("span").forEach(e => {
    if (!e.textContent.trim()) e.remove();
  });

  // 3. wrap text nodes libere în span
  document.body.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
      const span = document.createElement("span");
      span.textContent = node.textContent.trim();
      node.replaceWith(span);
    }
  });
}

// -------------------- apply hyperlinks --------------------
function applyLinks(jsonUrl) {
  fetch("https://script.google.com/macros/s/AKfycbz2in9f3u0WC0kug46uNL3l3OqU65JBBR2y6oAH4fodVT9a3i_9JBX_XKlSoB1r9-vDRA/exec?ts=" + Date.now())
    .then(r => r.json())
    .then(map => {
      // normalizează cheile JSON
      const normalizedMap = {};
      for (const k in map) {
        normalizedMap[normalize(k)] = map[k];
      }

      // elemente care primesc hyperlink
      const elems = [...document.querySelectorAll("span"), ...document.querySelectorAll("h2")];

      elems.forEach(el => {
        if (el.querySelector("a")) return; // nu dublează linkuri
        const norm = normalize(el.textContent);

        if (normalizedMap[norm]) {
          const url = normalizedMap[norm];
          el.innerHTML = `<a href="${url}" target="_blank">${el.innerHTML}</a>`;
        }
      });

      console.log("Hyperlink-urile au fost aplicate cu succes.");
    })
    .catch(err => console.error("Eroare la încărcarea JSON:", err));
}

// -------------------- INIT --------------------
document.addEventListener("DOMContentLoaded", () => {
  cleanHtml();
  applyLinks("/system/data/titleLinks.json"); // sau URL Web App Apps Script
});
