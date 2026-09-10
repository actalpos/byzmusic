// scripts/convert-service.js

import fs from "fs";
import path from "path";
import os from "os";
import { execFileSync } from "child_process";

const downloadsDir = path.join(os.homedir(), "Downloads");

const libreOffice =
  "/Applications/LibreOffice.app/Contents/MacOS/soffice";

// ============================================================
// Găsește toate fișierele RTF din Downloads
// ============================================================

const rtfFiles = fs
  .readdirSync(downloadsDir)
  .filter((file) => /\.rtf$/i.test(file))
  .sort();

if (rtfFiles.length === 0) {
  console.log("Nu există fișiere RTF în Downloads.");
  process.exit(0);
}

console.log();
console.log(`Găsite ${rtfFiles.length} fișiere RTF.`);
console.log();

// ============================================================
// Conversie
// ============================================================

for (const file of rtfFiles) {
  const rtfPath = path.join(downloadsDir, file);

  const baseName = path.basename(file, path.extname(file));

  const docxPath = path.join(
    downloadsDir,
    `${baseName}-AUTO.docx`
  );

  const htmlPath = path.join(
    downloadsDir,
    `${baseName}-AUTO.html`
  );

  console.log("========================================");
  console.log(`RTF: ${file}`);
  console.log("========================================");

  // ==========================================================
  // 1. RTF -> DOCX cu Microsoft Word
  // ==========================================================

  console.log("Word: RTF -> DOCX");

  const appleScript = `
tell application "Microsoft Word"
    activate

    open file name "${escapeAppleScript(rtfPath)}"
    delay 2

    set theDoc to active document

    save as theDoc file name "${escapeAppleScript(
      docxPath
    )}" file format format document

    close theDoc saving no
end tell
`;

  try {
    execFileSync("osascript", ["-e", appleScript], {
      stdio: "inherit",
    });
  } catch (error) {
    console.error(`EROARE Word: ${file}`);
    continue;
  }

  if (!fs.existsSync(docxPath)) {
    console.error(`DOCX nu a fost creat: ${docxPath}`);
    continue;
  }

  console.log(`Creat: ${path.basename(docxPath)}`);

  // ==========================================================
  // 2. DOCX -> HTML cu LibreOffice
  // ==========================================================

  console.log("LibreOffice: DOCX -> HTML");

  try {
    execFileSync(
      libreOffice,
      [
        "--headless",
        "--convert-to",
        "html",
        "--outdir",
        downloadsDir,
        docxPath,
      ],
      {
        stdio: "inherit",
      }
    );
  } catch (error) {
    console.error(`EROARE LibreOffice: ${file}`);
    continue;
  }

  if (!fs.existsSync(htmlPath)) {
    console.error(`HTML nu a fost creat: ${htmlPath}`);
    continue;
  }

  console.log(`Creat: ${path.basename(htmlPath)}`);

  // ==========================================================
  // 3. Adaugă componentele site-ului în <head>
  // ==========================================================

  let html = fs.readFileSync(htmlPath, "utf8");

  const viewport =
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">';

  const css =
    '<link rel="stylesheet" href="/byzmusic/system/styles/layout-fixes.css">';

  const script =
    '<script src="/byzmusic/system/scripts/layout-fixes-and-links.js" defer></script>';

  const siteIncludes = `
\t${viewport}
\t${css}
\t${script}`;

  // Le adăugăm numai dacă nu există deja
  if (!html.includes('name="viewport"')) {
    html = html.replace(
      /<head([^>]*)>/i,
      `<head$1>${siteIncludes}`
    );

    fs.writeFileSync(htmlPath, html, "utf8");

    console.log(
      "Adăugat: viewport + layout-fixes.css + layout-fixes-and-links.js"
    );
  } else {
    console.log("Componentele site-ului există deja.");
  }

  console.log();
}

// ============================================================
// 4. Închide Microsoft Word
// ============================================================

try {
  execFileSync("osascript", [
    "-e",
    'tell application "Microsoft Word" to quit saving no',
  ]);
} catch (error) {
  // Nu este critic dacă Word este deja închis
}

// ============================================================
// Terminare
// ============================================================

console.log("========================================");
console.log("CONVERSIE TERMINATĂ");
console.log("========================================");
console.log();

// ============================================================
// Escape pentru AppleScript
// ============================================================

function escapeAppleScript(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}