const fs = require("fs");
const path = require("path");

// Paths relative to the script
const jsonPath = path.join(__dirname, "../data/divine_liturgy.json");
const outputDir = path.join(__dirname, "../../template");
const outputHtml = path.join(outputDir, "Divine_Liturgy.html");

// Ensure output folder exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Load JSON
const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

/* ---------- RTL detection ---------- */
function isRTL(text) {
  // Arabic + Hebrew Unicode ranges
  const rtlRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
  return rtlRegex.test(text);
}

/* ---------- HTML escaping ---------- */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Start HTML
let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/png" href="${escapeHtml(data.icon)}">
<title>${escapeHtml(data.title)}</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<style>
.section-title {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 3rem 0 2rem;
  color: #333;
}
.section-title::before,
.section-title::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid #bbb;
}
.section-title::before { margin-right: 1rem; }
.section-title::after { margin-left: 1rem; }
</style>
</head>
<body class="bg-light">
<div class="container my-5">
<div class="row align-items-center mb-4">
  <div class="col-auto">
    <img src="${escapeHtml(data.icon)}" alt="Icon" style="height:40px; width:auto;">
  </div>
  <div class="col text-center">
    <h1 class="m-0">Liturgical Services</h1>
  </div>
  <div class="col-auto"></div>
</div>
<div class="row g-3 mb-4">
  <div class="col-12 col-md-6 mx-auto">`;

// Central tile with RTL support
const centralDir = isRTL(data.central_tile.text) ? "rtl" : "ltr";

html += `
<a href="${escapeHtml(data.central_tile.link)}"
   dir="${centralDir}"
   class="btn btn-light w-100 shadow border fs-5 py-4 text-center"
   target="_blank">
  ${escapeHtml(data.central_tile.text)}
</a>
</div>
</div>`;

/* ---------- Group by mode ---------- */
function groupByMode(items) {
  const grouped = {};
  items.forEach(item => {
    if (item.mode && item.mode.trim() !== "") {
      if (!grouped[item.mode]) {
        grouped[item.mode] = [];
      }
      grouped[item.mode].push(item);
    }
  });
  return grouped;
}

/* ---------- Render tiles ---------- */
function renderItems(items) {
  let result = "";
  let rowContent = "";

  items.forEach((item, index) => {
    const dir = isRTL(item.text) ? "rtl" : "ltr";

    rowContent += `
<div class="col-12 col-md-6 mb-3">
  <a href="${escapeHtml(item.link)}"
     target="_blank"
     dir="${dir}"
     class="btn btn-light w-100 shadow border fs-5 py-4">
     ${escapeHtml(item.text)}
  </a>
</div>
`;

    if ((index + 1) % 2 === 0 || index === items.length - 1) {
      result += `<div class="row g-3">${rowContent}</div>`;
      rowContent = "";
    }
  });

  return result;
}

/* ---------- Generate sections ---------- */
data.sections.forEach(section => {
  html += `\n<h3 class="section-title">${escapeHtml(section.title)}</h3>\n`;

  const groupedItems = groupByMode(section.items);

  // Render grouped by mode, titlurile rămân la stânga
  Object.keys(groupedItems).forEach(mode => {
    html += `<h5 class="mt-4 mb-3 text-secondary">${escapeHtml(mode)}</h5>`;
    html += renderItems(groupedItems[mode]);
  });

  // Render items without mode
  const ungroupedItems = section.items.filter(
    item => !item.mode || item.mode.trim() === ""
  );

  html += renderItems(ungroupedItems);
});

html += `
</div>
</body>
</html>`;

// Write HTML
fs.writeFileSync(outputHtml, html, "utf-8");
console.log(`HTML generated at ${outputHtml}`);
