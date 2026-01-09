import fs from "fs";

const DATA = "Service_Texts/system/feasts.json";

if (!fs.existsSync(DATA)) {
  console.error("❌ feasts.json not found");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
let errors = 0;

data.forEach((f, i) => {
  if (!f.date || !f.title || !f.file) {
    console.error(`❌ Missing field at index ${i}`, f);
    errors++;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date)) {
    console.error(`❌ Invalid date format: ${f.date}`);
    errors++;
  }

  if (!fs.existsSync(f.file)) {
    console.error(`❌ Missing file: ${f.file}`);
    errors++;
  }
});

if (errors === 0) {
  console.log("✔ feasts.json is valid");
} else {
  console.error(`❌ ${errors} error(s) found`);
  process.exit(1);
}
