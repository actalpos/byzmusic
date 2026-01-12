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

// Start HTML
let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" type="image/png" href="${data.icon}">
<title>${data.title}</title>
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
<img src="${data.icon}" alt="Icon" style="height:40px; width:auto;">
</div>
<div class="col text-center">
<h1 class="m-0">Liturgical Services</h1>
</div>
<div class="col-auto"></div>
</div>
<div class="row g-3 mb-4">
<div class="col-12 col-md-6 mx-auto">
<a href="${data.central_tile.link}" class="btn btn-light w-100 shadow border fs-5 py-4 text-center" target="_blank">
${data.central_tile.text}
</a>
</div>
</div>`;

// Generate sections
data.sections.forEach(section => {
  html += `\n<h3 class="section-title">${section.title}</h3>\n`;
  section.items.forEach(item => {
    html += `
<div class="row g-3 mb-3">
  <div class="col-12 col-md-6">
    <a href="${item.link}" target="_blank" class="btn btn-light w-100 shadow border fs-5 py-4">${item.en}</a>
  </div>
  <div class="col-12 col-md-6">
    <a href="${item.link}" target="_blank" class="btn btn-light w-100 shadow border fs-5 py-4" dir="rtl">${item.ar}</a>
  </div>
</div>
`;
  });
});

html += "\n</div>\n</body>\n</html>";

// Write HTML
fs.writeFileSync(outputHtml, html, "utf-8");
console.log(`HTML generated at ${outputHtml}`);
