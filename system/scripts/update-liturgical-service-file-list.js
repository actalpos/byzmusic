import fs from "fs";
import path from "path";

// unde sunt fișierele pe disc
const FS_ROOT = path.resolve("../../Service_Texts");

// cum vor fi accesate din browser
const WEB_ROOT = "Service_Texts";

const OUT = "../data/liturgical-service-file-list.json";

const SERVICE_ORDER = [
  "Divine_Liturgy",
  "Vespers",
  "Orthros"
];

let entries = [];

/* ---------------- FIXED DATE ---------------- */
function scanFixed() {
  const fixRoot = path.join(FS_ROOT, "fixDate");
  if (!fs.existsSync(fixRoot)) return;

  const year = new Date().getFullYear();

  for (const month of fs.readdirSync(fixRoot)) {
    const monthPath = path.join(fixRoot, month);
    if (!fs.statSync(monthPath).isDirectory()) continue;

    for (const day of fs.readdirSync(monthPath)) {
      const dayPath = path.join(monthPath, day);
      if (!fs.statSync(dayPath).isDirectory()) continue;

      addFiles(dayPath, `${year}-${month}-${day}`);
    }
  }
}

/* ---------------- MOVABLE DATE ---------------- */
function scanMovable() {
  const variableRoot = path.join(FS_ROOT, "variableDate");
  if (!fs.existsSync(variableRoot)) return;

  for (const year of fs.readdirSync(variableRoot)) {
    const yearPath = path.join(variableRoot, year);
    if (!fs.statSync(yearPath).isDirectory()) continue;

    for (const month of fs.readdirSync(yearPath)) {
      const monthPath = path.join(yearPath, month);
      if (!fs.statSync(monthPath).isDirectory()) continue;

      for (const day of fs.readdirSync(monthPath)) {
        const dayPath = path.join(monthPath, day);
        if (!fs.statSync(dayPath).isDirectory()) continue;

        addFiles(dayPath, `${year}-${month}-${day}`);
      }
    }
  }
}

/* ---------------- COMMON ---------------- */
function addFiles(dir, date) {
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".html")) continue;

    // cale relativă față de Service_Texts pe disc
    const relativePath = path.relative(FS_ROOT, path.join(dir, file))
                              .replace(/\\/g, "/");

    entries.push({
      date,
      title: file.replace(".html", "").replaceAll("_", " "),
      order: SERVICE_ORDER.findIndex(s => file.startsWith(s)),
      // cale corectă pentru web
      file: `${WEB_ROOT}/${relativePath}`
    });
  }
}

/* ---------------- RUN ---------------- */
scanFixed();
scanMovable();

entries.sort(
  (a, b) => a.date.localeCompare(b.date) || a.order - b.order
);

fs.writeFileSync(OUT, JSON.stringify(entries, null, 2));
console.log(`json file generated (${entries.length} entries)`);
