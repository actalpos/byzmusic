/*
====================================================================
convert-service.js
Data: 2026-09-10
Versiune: 1.0

SCOP
----
Scriptul procesează automat fișierele RTF din Downloads și le transformă
în HTML pregătit pentru site-ul byzmusic.

FLUXUL COMPLET
--------------
Pentru fiecare fișier .rtf găsit în ~/Downloads:

1. Citește numele fișierului.
2. Extrage luna și ziua din nume.
3. Verifică dacă anul este prezent în nume.
4. Decide dacă fișierul merge în:
   - Service_Texts/variableDate
   - Service_Texts/fixDate
5. Aplică regula de dată pentru tipul serviciului.
6. Deschide RTF-ul în Microsoft Word.
7. Salvează fișierul ca DOCX.
8. Convertește DOCX-ul în HTML cu LibreOffice.
9. Adaugă în <head>:
   - meta viewport
   - layout-fixes.css
   - layout-fixes-and-links.js
10. Creează automat folderele lipsă.
11. Dacă HTML-ul există deja în destinație, îl suprascrie.
12. Mută HTML-ul în folderul corect.
13. După mutarea cu succes:
   - șterge DOCX-ul din Downloads
   - șterge RTF-ul din Downloads
14. După procesarea tuturor fișierelor, închide Microsoft Word.

====================================================================
REGULI PENTRU DATA ȘI DESTINAȚIA FIȘIERULUI
====================================================================

REGULA 1 — FIȘIER CU AN ÎN NUME
--------------------------------
Dacă anul apare în numele fișierului, fișierul este considerat
VARIABLE DATE.

Exemplu:

    Sep 13 2026 Bilingual ORTHROS.rtf

Destinația de bază este:

    Service_Texts/variableDate/2026/09/13/

Structura este:

    variableDate/
        YYYY/
            MM/
                DD/

Anul este luat exact din numele fișierului.


REGULA 2 — FIȘIER FĂRĂ AN ÎN NUME
----------------------------------
Dacă anul NU apare în numele fișierului, fișierul este considerat
FIXED DATE.

Exemplu:

    Sept 13 Bilingual ORTHROS.rtf

Destinația este:

    Service_Texts/fixDate/09/13/

Structura este:

    fixDate/
        MM/
            DD/

Pentru fixDate nu se creează folder de an.


REGULA 3 — NUMELE LUNII
-----------------------
Luna din numele fișierului este transformată în număr cu două cifre.

Exemple:

    Jan / January       -> 01
    Feb / February      -> 02
    Mar / March         -> 03
    Apr / April         -> 04
    May                 -> 05
    Jun / June          -> 06
    Jul / July          -> 07
    Aug / August        -> 08
    Sep / Sept /
    September           -> 09
    Oct / October       -> 10
    Nov / November      -> 11
    Dec / December      -> 12


REGULA 4 — VESP
---------------
Dacă numele fișierului conține:

    VESP

data serviciului este ZIUA URMĂTOARE față de data din numele fișierului.

Exemplu fixed date:

    Sept 13 Bilingual VESP.rtf

Data din nume:

    09/13

VESP înseamnă +1 zi:

    09/14

Destinația:

    Service_Texts/fixDate/09/14/


Exemplu variable date:

    Sep 13 2026 Bilingual VESP.rtf

Data din nume:

    2026/09/13

VESP înseamnă +1 zi:

    2026/09/14

Destinația:

    Service_Texts/variableDate/2026/09/14/


REGULA 5 — LITART
-----------------
LITART folosește aceeași regulă ca VESP.

Dacă numele conține:

    LITART

se adaugă +1 zi la data din numele fișierului.


REGULA 6 — ORTHROS
------------------
ORTHROS NU primește +1 zi.

Folosește exact data din numele fișierului.

Exemplu:

    Sep 13 2026 Bilingual ORTHROS.rtf

Destinația:

    Service_Texts/variableDate/2026/09/13/


REGULA 7 — READ ȘI ALTE FIȘIERE
--------------------------------
READ și celelalte fișiere care nu sunt VESP sau LITART
folosesc exact data din numele fișierului.

Exemplu:

    Sept 13 Read.rtf

Destinația:

    Service_Texts/fixDate/09/13/


REGULA 8 — SCHIMBAREA LUNII SAU ANULUI
--------------------------------------
Pentru VESP și LITART, +1 zi este calculat ca dată reală.

Exemple:

    Sep 30 -> Oct 01
    Dec 31 2026 -> Jan 01 2027

Scriptul gestionează automat schimbarea lunii și a anului.


====================================================================
REGULI DE CONVERSIE
====================================================================

1. RTF -> DOCX
--------------
Conversia se face cu Microsoft Word pentru Mac.

Motiv:
Word păstrează cel mai bine structura documentului original,
inclusiv tabelele, stilurile și conținutul bilingv.


2. DOCX -> HTML
---------------
Conversia se face cu LibreOffice în modul headless.

Comanda este executată automat din Node.js.


3. NUMELE FIȘIERELOR
--------------------
Nu se mai folosește sufixul:

    -AUTO

Exemplu:

    Sept 13 Bilingual VESP.rtf

devine temporar:

    Sept 13 Bilingual VESP.docx
    Sept 13 Bilingual VESP.html


====================================================================
REGULI PENTRU HTML
====================================================================

După conversia LibreOffice, în <head> se verifică și se adaugă:

1.

    <meta name="viewport"
          content="width=device-width, initial-scale=1.0">

2.

    <link rel="stylesheet"
          href="/byzmusic/system/styles/layout-fixes.css">

3.

    <script
      src="/byzmusic/system/scripts/layout-fixes-and-links.js"
      defer></script>

Acestea sunt adăugate numai dacă nu există deja.


====================================================================
REGULA DE SUPRASCRIERE
====================================================================

Dacă HTML-ul există deja în destinația finală:

    NU se oprește scriptul.

Fișierul HTML existent este șters și este înlocuit cu HTML-ul nou.


====================================================================
REGULA DE CLEANUP
====================================================================

Cleanup-ul se face NUMAI după ce HTML-ul a fost mutat cu succes
în destinația finală.

După succes:

    DOCX -> șters din Downloads
    RTF  -> șters din Downloads

HTML-ul nu este șters deoarece a fost mutat în Service_Texts.


Dacă apare o eroare înainte de mutarea HTML-ului:

    RTF-ul rămâne în Downloads
    DOCX-ul rămâne în Downloads

pentru a putea fi verificată problema.


====================================================================
MAI MULTE FIȘIERE RTF
====================================================================

Dacă în Downloads sunt mai multe fișiere RTF, scriptul le procesează
pe rând.

Exemplu:

    Sept 13 Bilingual VESP.rtf
    Sept 14 Bilingual ORTHROS.rtf
    Sept 14 Read.rtf

Fluxul este:

    RTF 1
      -> DOCX
      -> HTML
      -> mutare
      -> cleanup

    RTF 2
      -> DOCX
      -> HTML
      -> mutare
      -> cleanup

    RTF 3
      -> DOCX
      -> HTML
      -> mutare
      -> cleanup

O eroare la un fișier nu trebuie să oprească procesarea celorlalte.


====================================================================
VERSIUNE
====================================================================

Versiune: 1.0
Data: 2026-09-10

Reguli principale:

- cu an    -> variableDate/YYYY/MM/DD
- fără an  -> fixDate/MM/DD
- VESP     -> +1 zi
- LITART   -> +1 zi
- ORTHROS  -> fără modificarea zilei
- READ     -> fără modificarea zilei
- fără -AUTO
- HTML existent -> suprascris
- cleanup RTF + DOCX numai după mutare reușită

====================================================================
*/

import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

// ============================================================
// CONFIG
// ============================================================

const downloadsDir = path.join(os.homedir(), "Downloads");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// scripts/convert-service.js -> system
const systemDir = path.resolve(__dirname, "..");

// system -> byzmusic
const projectDir = path.resolve(systemDir, "..");

const serviceTextsDir = path.join(
  projectDir,
  "Service_Texts"
);

const variableDateDir = path.join(
  serviceTextsDir,
  "variableDate"
);

const fixDateDir = path.join(
  serviceTextsDir,
  "fixDate"
);

const libreOffice =
  "/Applications/LibreOffice.app/Contents/MacOS/soffice";

// ============================================================
// LUNI
// ============================================================

const monthNumbers = {
  jan: "01",
  january: "01",

  feb: "02",
  february: "02",

  mar: "03",
  march: "03",

  apr: "04",
  april: "04",

  may: "05",

  jun: "06",
  june: "06",

  jul: "07",
  july: "07",

  aug: "08",
  august: "08",

  sep: "09",
  sept: "09",
  september: "09",

  oct: "10",
  october: "10",

  nov: "11",
  november: "11",

  dec: "12",
  december: "12",
};

// ============================================================
// GĂSEȘTE TOATE RTF-URILE DIN DOWNLOADS
// ============================================================

const rtfFiles = fs
  .readdirSync(downloadsDir)
  .filter((file) => /\.rtf$/i.test(file))
  .sort();

if (rtfFiles.length === 0) {
  console.log();
  console.log("Nu există fișiere RTF în Downloads.");
  process.exit(0);
}

console.log();
console.log(`Găsite ${rtfFiles.length} fișiere RTF:`);

for (const file of rtfFiles) {
  console.log(`  - ${file}`);
}

console.log();

// ============================================================
// PROCESEAZĂ FIECARE RTF
// ============================================================

for (const file of rtfFiles) {
  const rtfPath = path.join(
    downloadsDir,
    file
  );

  const baseName = path.basename(
    file,
    path.extname(file)
  );

  // FĂRĂ -AUTO
  const docxPath = path.join(
    downloadsDir,
    `${baseName}.docx`
  );

  const htmlPath = path.join(
    downloadsDir,
    `${baseName}.html`
  );

  console.log("========================================");
  console.log(`RTF: ${file}`);
  console.log("========================================");

  // ==========================================================
  // 1. CITEȘTE DATA DIN NUMELE FIȘIERULUI
  //
  // Exemple:
  //
  // Sept 13 Bilingual VESP.rtf
  // Sep 13 2026 Bilingual ORTHROS.rtf
  //
  // Cu an    -> variableDate
  // Fără an  -> fixDate
  // ==========================================================

  const fileDate = parseDateFromFilename(file);

  if (!fileDate) {
    console.error(
      `EROARE: nu pot determina data din numele: ${file}`
    );
    console.log();
    continue;
  }

  let {
    year,
    month,
    day,
    hasYear
  } = fileDate;

  if (hasYear) {
    console.log(
      `Data din nume: ${year}/${month}/${String(day).padStart(2, "0")}`
    );
  } else {
    console.log(
      `Data din nume: ${month}/${String(day).padStart(2, "0")} (fără an)`
    );
  }

  // ==========================================================
  // 2. VESP / LITART -> +1 ZI
  //
  // ORTHROS / READ / ALTELE -> data exactă din nume
  // ==========================================================

  const isNextDayService =
    /\bVESP\b/i.test(baseName) ||
    /\bLITART\b/i.test(baseName);

  if (isNextDayService) {
    const adjustedDate = addOneDay(
      year,
      month,
      day
    );

    year = adjustedDate.year;
    month = adjustedDate.month;
    day = adjustedDate.day;

    if (hasYear) {
      console.log(
        `VESP/LITART +1 zi -> ${year}/${month}/${String(day).padStart(2, "0")}`
      );
    } else {
      console.log(
        `VESP/LITART +1 zi -> ${month}/${String(day).padStart(2, "0")}`
      );
    }
  }

  // ==========================================================
  // 3. RTF -> DOCX CU MICROSOFT WORD
  // ==========================================================

  console.log("Word: RTF -> DOCX");

  // Dacă a rămas un DOCX vechi în Downloads,
  // îl ștergem înainte de conversie.
  if (fs.existsSync(docxPath)) {
    try {
      fs.unlinkSync(docxPath);

      console.log(
        `Șters DOCX vechi: ${path.basename(docxPath)}`
      );
    } catch (error) {
      console.error(
        `EROARE: nu pot șterge DOCX-ul vechi: ${docxPath}`
      );
      console.error(error.message);
      console.log();
      continue;
    }
  }

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
    execFileSync(
      "osascript",
      ["-e", appleScript],
      {
        stdio: "inherit",
      }
    );
  } catch (error) {
    console.error(
      `EROARE Word: ${file}`
    );
    console.log();
    continue;
  }

  if (!fs.existsSync(docxPath)) {
    console.error(
      `EROARE: DOCX nu a fost creat: ${docxPath}`
    );
    console.log();
    continue;
  }

  console.log(
    `Creat DOCX: ${path.basename(docxPath)}`
  );

  // ==========================================================
  // 4. DOCX -> HTML CU LIBREOFFICE
  // ==========================================================

  console.log("LibreOffice: DOCX -> HTML");

  // Dacă există HTML vechi în Downloads,
  // îl ștergem înainte de conversie.
  if (fs.existsSync(htmlPath)) {
    try {
      fs.unlinkSync(htmlPath);

      console.log(
        `Șters HTML vechi din Downloads: ${path.basename(htmlPath)}`
      );
    } catch (error) {
      console.error(
        `EROARE: nu pot șterge HTML-ul vechi: ${htmlPath}`
      );
      console.error(error.message);
      console.log();
      continue;
    }
  }

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
    console.error(
      `EROARE LibreOffice: ${file}`
    );
    console.log();
    continue;
  }

  if (!fs.existsSync(htmlPath)) {
    console.error(
      `EROARE: HTML nu a fost creat: ${htmlPath}`
    );
    console.log();
    continue;
  }

  console.log(
    `Creat HTML: ${path.basename(htmlPath)}`
  );

  // ==========================================================
  // 5. ADAUGĂ META + CSS + JS
  // ==========================================================

  try {
    let html = fs.readFileSync(
      htmlPath,
      "utf8"
    );

    const viewport =
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">';

    const css =
      '<link rel="stylesheet" href="/byzmusic/system/styles/layout-fixes.css">';

    const script =
      '<script src="/byzmusic/system/scripts/layout-fixes-and-links.js" defer></script>';

    const includes = [];

    if (
      !html.includes('name="viewport"')
    ) {
      includes.push(viewport);
    }

    if (
      !html.includes(
        "/byzmusic/system/styles/layout-fixes.css"
      )
    ) {
      includes.push(css);
    }

    if (
      !html.includes(
        "/byzmusic/system/scripts/layout-fixes-and-links.js"
      )
    ) {
      includes.push(script);
    }

    if (includes.length > 0) {
      const siteIncludes =
        "\n\t" +
        includes.join("\n\t");

      html = html.replace(
        /<head([^>]*)>/i,
        `<head$1>${siteIncludes}`
      );

      fs.writeFileSync(
        htmlPath,
        html,
        "utf8"
      );

      console.log(
        "Adăugat: viewport + CSS + JS"
      );
    } else {
      console.log(
        "Viewport + CSS + JS există deja."
      );
    }
  } catch (error) {
    console.error(
      `EROARE la modificarea HTML: ${file}`
    );
    console.error(error.message);
    console.log();
    continue;
  }

  // ==========================================================
  // 6. STABILEȘTE DESTINAȚIA
  //
  // CU AN:
  // Service_Texts/variableDate/YYYY/MM/DD
  //
  // FĂRĂ AN:
  // Service_Texts/fixDate/MM/DD
  // ==========================================================

  const dayString =
    String(day).padStart(2, "0");

  let destinationDir;

  if (hasYear) {
    destinationDir = path.join(
      variableDateDir,
      String(year),
      month,
      dayString
    );

    console.log(
      "Tip: variableDate"
    );

    console.log(
      `Destinație: Service_Texts/variableDate/${year}/${month}/${dayString}`
    );
  } else {
    destinationDir = path.join(
      fixDateDir,
      month,
      dayString
    );

    console.log(
      "Tip: fixDate"
    );

    console.log(
      `Destinație: Service_Texts/fixDate/${month}/${dayString}`
    );
  }

  // ==========================================================
  // 7. CREEAZĂ FOLDERELE DACĂ NU EXISTĂ
  // ==========================================================

  try {
    fs.mkdirSync(
      destinationDir,
      {
        recursive: true,
      }
    );
  } catch (error) {
    console.error(
      "EROARE la crearea folderului:"
    );
    console.error(destinationDir);
    console.error(error.message);
    console.log();
    continue;
  }

  // ==========================================================
  // 8. SUPRASCRIE HTML-UL DACĂ EXISTĂ
  // ==========================================================

  const destinationHtml = path.join(
    destinationDir,
    path.basename(htmlPath)
  );

  try {
    if (fs.existsSync(destinationHtml)) {
      fs.unlinkSync(destinationHtml);

      console.log(
        `HTML existent șters pentru suprascriere: ${path.basename(destinationHtml)}`
      );
    }

    fs.renameSync(
      htmlPath,
      destinationHtml
    );

    console.log(
      `Mutat HTML: ${destinationHtml}`
    );
  } catch (error) {
    console.error(
      `EROARE la mutarea/suprascrierea HTML: ${file}`
    );
    console.error(error.message);
    console.error(
      "RTF și DOCX rămân în Downloads."
    );
    console.log();
    continue;
  }

  // ==========================================================
  // 9. CLEANUP DOWNLOADS
  //
  // NUMAI DUPĂ CE HTML-UL A AJUNS CU SUCCES ÎN DESTINAȚIE
  // ==========================================================

  try {
    if (fs.existsSync(docxPath)) {
      fs.unlinkSync(docxPath);

      console.log(
        `Șters DOCX: ${path.basename(docxPath)}`
      );
    }

    if (fs.existsSync(rtfPath)) {
      fs.unlinkSync(rtfPath);

      console.log(
        `Șters RTF: ${path.basename(rtfPath)}`
      );
    }
  } catch (error) {
    console.error(
      `EROARE cleanup pentru: ${file}`
    );
    console.error(error.message);
  }

  console.log();
}

// ============================================================
// 10. ÎNCHIDE WORD DUPĂ TOATE CONVERSIILE
// ============================================================

try {
  execFileSync(
    "osascript",
    [
      "-e",
      'tell application "Microsoft Word" to quit saving no',
    ]
  );
} catch {
  // Nu este critic dacă Word este deja închis.
}

// ============================================================
// TERMINARE
// ============================================================

console.log("========================================");
console.log("CONVERSIE TERMINATĂ");
console.log("========================================");
console.log();

// ============================================================
// FUNCTIONS
// ============================================================

function parseDateFromFilename(filename) {
  /*
    Acceptă:

    Sept 13 Bilingual VESP.rtf
    Sep 13 2026 Bilingual ORTHROS.rtf

    Luna + ziua sunt obligatorii.
    Anul este opțional.

    CU AN:
      -> variableDate

    FĂRĂ AN:
      -> fixDate
  */

  const match = filename.match(
    /^([A-Za-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?\b/
  );

  if (!match) {
    return null;
  }

  const monthName =
    match[1].toLowerCase();

  const month =
    monthNumbers[monthName];

  if (!month) {
    return null;
  }

  const day =
    Number(match[2]);

  const hasYear =
    Boolean(match[3]);

  /*
    Dacă există anul în nume îl folosim.

    Dacă nu există, folosim 2024 DOAR intern
    pentru validarea datei și calculul +1 zi.

    Pentru fixDate anul NU intră în cale.
  */

  const year = hasYear
    ? Number(match[3])
    : 2024;

  // Verifică dacă data este validă.
  const testDate = new Date(
    year,
    Number(month) - 1,
    day
  );

  if (
    testDate.getFullYear() !== year ||
    testDate.getMonth() !==
      Number(month) - 1 ||
    testDate.getDate() !== day
  ) {
    return null;
  }

  return {
    year,
    month,
    day,
    hasYear,
  };
}

// ============================================================
// +1 ZI PENTRU VESP / LITART
//
// Rezolvă automat:
// Sep 30 -> Oct 1
// Dec 31 -> Jan 1
// etc.
// ============================================================

function addOneDay(
  year,
  month,
  day
) {
  const date = new Date(
    year,
    Number(month) - 1,
    day
  );

  date.setDate(
    date.getDate() + 1
  );

  return {
    year: date.getFullYear(),

    month: String(
      date.getMonth() + 1
    ).padStart(2, "0"),

    day: date.getDate(),
  };
}

// ============================================================
// ESCAPE PENTRU APPLESCRIPT
// ============================================================

function escapeAppleScript(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}