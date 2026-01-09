import fs from "fs";
import path from "path";

const ROOT = "Service_Texts";
const OUT = `${ROOT}/_system/feasts.json`;

const SERVICE_ORDER = [
  "Divine_Liturgy",
  "Vespers",
  "Orthros"
];

let entries = [];

/* ---------------- FIXED DATE ----------------
   fixed/MM/DD/*.html
--------------------------------------------*/
function scanFixed() {
  const fixedRoot = path.join(ROOT, "fixed");
  if (!fs.existsSync(fixedRoot)) return;

  const year = new Date().getFullYear();

  for (const month of fs.readdirSync(fixedRoot)) {
    const monthPath = path.join(fixedRoot, month);
    if (!fs.statSync(monthPath).isDirectory()) continue;

    for (const day of fs.readdirSync(monthPath)) {
      const dayPath = path.join(monthPath, day);
      if (!fs.statSync(dayPath).isDirectory()) continue;

      addFiles(dayPath, `${year}-${month}-${day}`);
    }
  }
}

/* ---------------- MOVABLE DATE ----------------
   movable/YYYY/MM/DD/*.html
----------------------------------------------*/
function scanMovable() {
  const movableRoot = path.join(ROOT, "movable");
  if (!fs.existsSync(movableRoot)) return;

  for (const year of fs.readdirSync(movableRoot)) {
    const yearPath = path.join(movableRoot, year);
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

    entries.push({
      date,
      title: file.replace(".html", "").replaceAll("_", " "),
      order: SERVICE_ORDER.findIndex(s => file.startsWith(s)),
      file: `${dir}/${file}`.replace(/\\/g, "/")
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
console.log(`✔ feasts.json generated (${entries.length} entries)`);
