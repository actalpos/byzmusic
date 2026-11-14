// Version: 1.4
// Updated: 2026-11-13
// CHANGELOG:
// - Octoechos: directoarele Common Orthros / Common Vespers produc
//   feastId = CommonOrthros / CommonVespers; descrierile raman identice.
// - Pastreaza extragerea zilelor si regulile Menaion existente.
// - FIX Octoechos: restaureaza periodId = "octoechos" si feastId = ziua
//   din directoarele Sunday/Monday/... (ex. Sunday Orthros).
// - Pastreaza regulile existente pentru Menaion, Triodion, Penticostarion.
// - Menaion: recunoaste intervalele DD-DD din directoarele sarbatorilor;
//   feastId = MM-DD-DD (luna calendaristica, zi inceput, zi sfarsit).
// - Pastreaza feastId = DD-MM pentru date fixe si valideaza ziua/luna.
// - Recunoaste Penticostarion si varianta Pentecostarion in path.
// - @@ in descrierea PDF-ului adauga titluri alternative pentru ACELASI URL;
//   aliasurile fara prefix mostenesc prefixul primului titlu.
// - | indica versiunea; || este rezervat pentru automelon.
// - Nu schimba regulile de selectie a hyperlinkurilor (Sunday etc.).
// ============================================================

// UPDATE 2026-11-11 — [APL] GLOBAL DE MOMENT
// Descriere Drive: [APL] RESURRECTIONAL THEOTOKION IN TONE EIGHT | St Anthony
// Generatorul pastreaza [APL] in cheie; scripturile de linkuri il
// interpreteaza ca moment global. Nu adaugam [O], [V] sau [LV].
// Normalizarea existenta produce cheia:
// [APL] APOLYTIKION RESURRECTIONAL THEOTOKION TONE EIGHT

// ============================================================
// UPDATE 2026-11-10 — TITLE ALIASES (@@)
// Descriere Drive: [O] TITLE A @@ TITLE B | Basil Crow
// Genereaza doua chei JSON pentru acelasi PDF.
// Separatorul || ramane rezervat pentru automelon.
// Separatorul | ramane rezervat pentru eticheta versiunii.
// Aliasurile fara prefix mostenesc prefixul [O], [V][LIHC] etc.
// ============================================================

// Generated: 2026-05-29 07:32 
// Updated: Added Folder Exclusion for Speed
// May 29 - 2 Same title in the same service/html. Separare prin adaugare momentul slujbei
// [LIHC] = Lord I Have Cried
// [AP] = Aposticha
// [PR] = Praises
// [LT] = Litia
// [EX] = Exaposteilarion
// [KA] = Kathisma
// [PS] = Praises Stichera
// [LV][LIHC] DOXASTIKON FOR PENTECOST IN TONE EIGHT
// [LV][AP] DOXASTIKON FOR PENTECOST IN TONE EIGHT
// [O][PR] DOXASTIKON FOR...
// June 3 2026 - add festal to the kewords to be ignored (for FESTAL TROPARIA AFTER PSALM 50)
// June 18 2026 remove (** ... **) from the title
// June 30 2026 remove Sticheras from the title
// June 30 2026 - fix for in one place FIFTH EOTHINON EXAPOSTEILARION IN TONE TWO in other FIFTH EOTHINON EXAPOSTEILARION TONE TWO
// July 17 2026 - fix for having the same title for the same service, same part. The differentiation would be in the automelon of the title
// Sept 11 2026 - add the ArabicByzantineMusic for scanning

/**
 * ============================================================
 * titleLink.json GENERATOR
 * Updated: 2026-09-15
 *
 * AFTER-FEAST SUPPORT
 * ============================================================
 *
 * Purpose:
 * Distinguish hymns that have the same generic
 * "FOR THE AFTER-FEAST" title but belong to different feasts.
 *
 * RULES:
 *
 * 1. Feast metadata is processed ONLY when the description
 *    contains:
 *
 *       AFTER-FEAST
 *       AFTER FEAST
 *
 * 2. All other hymns keep the existing generator behavior.
 *
 * 3. The feast is determined from the Menaion folder structure:
 *
 *       01 September /
 *       14 Exaltation of the Cross
 *
 * 4. The first number in the month folder represents the order
 *    of months in the ecclesiastical year:
 *
 *       01 = September
 *       02 = October
 *       03 = November
 *       04 = December
 *       05 = January
 *       06 = February
 *       07 = March
 *       08 = April
 *       09 = May
 *       10 = June
 *       11 = July
 *       12 = August
 *
 * 5. feastId is converted to calendar-date format DD-MM so it
 *    uses the same ID as FEAST_CALENDAR in title-links.js.
 *
 *    Example:
 *
 *       01 September /
 *       14 Exaltation of the Cross
 *
 *       feast   = "Exaltation of the Cross"
 *       feastId = "14-09"
 *
 * 6. For type:"multi" entries, feast and feastId are preserved
 *    separately for each version.
 *
 * 7. No fuzzy matching is used for feast names.
 *    The Service Text and the PDF are connected through feastId.
 *
 * ============================================================

/*
 * ============================================================
 * MENAION FEAST METADATA
 * ============================================================
 *
 * Pentru fișierele aflate în:
 *
 *   Byzantine Music / EnglishByzantineMusic / Menaion /
 *
 * data sărbătorii NU este menținută manual într-un calendar.
 * Ea este dedusă automat din structura folderelor Google Drive.
 *
 * Structura așteptată:
 *
 *   Menaion /
 *     12 August /
 *       29 Beheading St John the Baptist /
 *
 * Folderul părinte:
 *   "12 August"
 *
 * folosește numărul liturgic al lunii:
 *
 *   01 = September
 *   02 = October
 *   03 = November
 *   04 = December
 *   05 = January
 *   06 = February
 *   07 = March
 *   08 = April
 *   09 = May
 *   10 = June
 *   11 = July
 *   12 = August
 *
 * Folderul sărbătorii începe cu ziua:
 *
 *   29 Beheading St John the Baptist
 *
 * Din această structură generăm:
 *
 *   feast:   "Beheading St John the Baptist"
 *   feastId: "29-08"
 *
 * feastId este copiat în titleLink.json pentru fiecare versiune
 * găsită într-un folder Menaion.
 *
 * Exemplu:
 *
 * {
 *   "label": "Beheading of St John - W",
 *   "feast": "Beheading St John the Baptist",
 *   "feastId": "29-08"
 * }
 *
 * IMPORTANT:
 *
 * - Nu adăugăm manual fiecare sfânt/sărbătoare într-un calendar.
 * - Structura Menaion din Google Drive este sursa datelor fixe.
 * - Triodion/Pentecostarion NU folosesc această logică deoarece
 *   sunt cicluri mobile și vor fi tratate separat.
 * ============================================================
 */

/******************************************************
* CONFIG
******************************************************/
// 1. Folderul partajat (Byzantine Music)
const ROOT_FOLDER_ID = "1TfBVD9ixWOJ7asLIO6bQdCYj17inMc1G";

// 2. Folderul tău privat (MyPrivateEnglishMusic)
const ENGLISH_FOLDER_ID = "1DPOxk0O4dowUKGiri9_NvpYXuHzQnip_";

const OUTPUT_FILE_NAME = "titleLink.json";

// 3. LISTA DE EXCLUDERE: Adaugă aici ID-urile folderelor pe care NU vrei să le scanezi
const EXCLUDED_FOLDER_IDS = [
  //"1K0SQu3idHqv9kGxsqxr4-Y4sg4sYS___", //ArabicByzantineMusic
  "1PSojp0GLH-oZSYW-MlJok7cabKY-Upod", //EnglishByzantineMusicParts
  "1QbHO-Fl5w9Xe4w1cAhuXlgXFhNscgqLO" //GreekByzantineMusic
];

/******************************************************
 * ENTRY POINT
 ******************************************************/
function doGet(e) {
  const action = e.parameter.action;

  if (action === "generate") {
    return generateAndReturnFile();
  }

  if (action === "delete" && e.parameter.fileId) {
    return deleteFileById(e.parameter.fileId);
  }

  return ContentService
    .createTextOutput("Invalid request")
    .setMimeType(ContentService.MimeType.TEXT);
}

/******************************************************
 * GENERATE JSON + RETURN fileId
 ******************************************************/
function generateAndReturnFile() {
  const result = {};
  const allEntries = [];

  // --- SCANARE FOLDER 1: Byzantine Music ---
  try {
    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    scanFolder(rootFolder, result, allEntries);
  } catch (e) {
    Logger.log("Eroare la scanarea folderului Byzantine: " + e.message);
  }

  // --- SCANARE FOLDER 2: MyEnglishMusic ---
  try {
    const englishFolder = DriveApp.getFolderById(ENGLISH_FOLDER_ID);
    scanFolder(englishFolder, result, allEntries);
  } catch (e) {
    Logger.log("Eroare la scanarea folderului English: " + e.message);
  }

  resolveCollisions(result, allEntries);

  // Sortare alfabetică după key
  const sorted = {};
  Object.keys(result)
    .sort()
    .forEach(k => sorted[k] = result[k]);

  const json = JSON.stringify(sorted, null, 2);

  // --- SALVARE ÎN FOLDERUL PRIVAT ---
  const destinationFolder = DriveApp.getFolderById(ENGLISH_FOLDER_ID);
  const existing = destinationFolder.getFilesByName(OUTPUT_FILE_NAME);
  let file;

  if (existing.hasNext()) {
    file = existing.next();
    file.setContent(json);
    Logger.log("Updated existing file in Private Folder.");
  } else {
    file = destinationFolder.createFile(OUTPUT_FILE_NAME, json, MimeType.PLAIN_TEXT);
    Logger.log("Created new file in Private Folder.");
  }

  Logger.log("JSON generated successfully.");
  return ContentService
    .createTextOutput(JSON.stringify({ fileId: file.getId(), content: json }))
    .setMimeType(ContentService.MimeType.JSON);
}

/******************************************************
 * DELETE FILE BY ID (SAFE)
 ******************************************************/
function deleteFileById(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    file.setTrashed(true);
    Logger.log("File moved to Trash: " + fileId);
    return ContentService.createTextOutput("Deleted").setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    Logger.log("Delete error: " + err.message);
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}

/******************************************************
 * AFTER-FEAST METADATA
 ******************************************************/

/*
 * Returnează true dacă descrierea conține:
 * AFTER-FEAST
 * AFTER FEAST
 */
function isAfterFeastTitle(description) {
  return /\bAFTER[\s-]+FEAST\b/i.test(description || "");
}

const LITURGICAL_MONTHS = {
  "01": "09", // September
  "02": "10", // October
  "03": "11", // November
  "04": "12", // December
  "05": "01", // January
  "06": "02", // February
  "07": "03", // March
  "08": "04", // April
  "09": "05", // May
  "10": "06", // June
  "11": "07", // July
  "12": "08"  // August
};

function detectPeriodFromPath(path) {

  const value = String(path || "").toLowerCase();

  if (value.includes(" / octoechos / ")) {
    return "octoechos";
  }

  if (value.includes(" / menaion / ")) {
    return "menaion";
  }

  if (value.includes("triodion")) {
    return "triodion";
  }

  if (value.includes("pentecostarion") || value.includes("penticostarion")) {
    return "penticostarion";
  }

  return "";
}

/*
 * Extrage feast-ul din path.
 */
function extractFeastFromPath(path) {
  if (!path) return { feast: "", feastId: "" };

  const folders = String(path).split(" / ").map(s => s.trim());

  for (let i = 1; i < folders.length; i++) {
    const monthFolder = folders[i - 1];
    const feastFolder = folders[i];
    const monthMatch = monthFolder.match(/^(\d{2})\s+[A-Za-z]+$/);
    if (!monthMatch) continue;

    const month = LITURGICAL_MONTHS[monthMatch[1]];
    if (!month) continue;

    // Interval de zile din aceeasi luna: 11-17 Sunday of the Holy Fathers
    // feastId: 10-11-17 (calendaristic MM-DD-DD).
    const rangeMatch = feastFolder.match(/^(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+(.+)$/);
    if (rangeMatch) {
      const from = Number(rangeMatch[1]);
      const to = Number(rangeMatch[2]);
      const maxDay = new Date(2024, Number(month), 0).getDate();
      if (from >= 1 && from <= to && to <= maxDay) {
        return {
          feast: rangeMatch[3].trim(),
          feastId: month + "-" + String(from).padStart(2, "0") + "-" + String(to).padStart(2, "0")
        };
      }
      continue;
    }

    // Data fixa: 14 Exaltation of the Cross -> 14-09.
    const feastMatch = feastFolder.match(/^(\d{1,2})\s+(.+)$/);
    if (!feastMatch) continue;
    const dayNumber = Number(feastMatch[1]);
    const maxDay = new Date(2024, Number(month), 0).getDate();
    if (dayNumber < 1 || dayNumber > maxDay) continue;

    return {
      feast: feastMatch[2].trim(),
      feastId: String(dayNumber).padStart(2, "0") + "-" + month
    };
  }
  return { feast: "", feastId: "" };
}

/******************************************************
 * RECURSIVE SCAN (WITH EXCLUSION)
 ******************************************************/
function scanFolder(folder, result, allEntries, currentPath) {
  const folderId = folder.getId();

  // VERIFICARE VITEZĂ: Dacă folderul curent este în lista neagră, oprim scanarea lui imediat
  if (EXCLUDED_FOLDER_IDS.indexOf(folderId) !== -1) {
    Logger.log(`⏭️ [SKIPPED] Folder exclus după ID: ${folder.getName()} (${folderId})`);
    return;
  }

  const newPath = currentPath ? currentPath + " / " + folder.getName() : folder.getName();
  const files = folder.getFiles();

  while (files.hasNext()) {
    const file = files.next();

    const description = file.getDescription();

    if (!description || description.trim() === "") {
      continue;
    }

    const automelon = extractAutomelon(description);

    // split TITLE | VERSION
    const idx = description.lastIndexOf("|");

    let titlePart = description;
    let version = null;

    if (idx !== -1) {
      titlePart = description.substring(0, idx);
      version = description.substring(idx + 1)
        .replace(/<[^>]*>/g, "")
        .trim();
    }

    // UPDATE 2026-11-10 — TITLE ALIASES (@@)
    // Fiecare titlu alternativ devine o cheie separata in JSON.
    // Eliminam duplicatele rezultate dupa normalizare.
    const titleParts = titlePart.split("@@").map(part => part.trim()).filter(Boolean);
    const primaryPrefix = (titleParts[0] || "").match(/^((?:\[[A-Za-z]+\]\s*)+)/);
    const titles = [...new Set(titleParts.map((part, index) => {
      if (index > 0 && primaryPrefix && !/^\[[A-Za-z]+\]/.test(part)) {
        part = primaryPrefix[1] + part;
      }
      return normalize(part);
    }).filter(Boolean))];

    const entry = { url: file.getUrl(), name: file.getName(), description, path: newPath, automelon };

    const periodId =
      detectPeriodFromPath(newPath);

    if (periodId) {
      entry.periodId = periodId;
    }

    /*
     * MENAION FEAST METADATA
     *
     * Dacă fișierul se află într-un folder Menaion,
     * încearcă să determine automat feast + feastId
     * din structura folderelor.
     *
     * Exemplu:
     *
     * Menaion / 12 August / 29 Beheading St John the Baptist
     *
     * feast   = "Beheading St John the Baptist"
     * feastId = "29-08"
     *
     * Această informație poate fi folosită atât pentru
     * AFTER-FEAST, cât și pentru selectarea versiunilor
     * specifice zilei din obiectele type:"multi".
     */

    if (newPath.includes(" / Menaion / ")) {

      const feastInfo =
        extractFeastFromPath(newPath);

      if (feastInfo.feastId) {

        entry.feast =
          feastInfo.feast;

        entry.feastId =
          feastInfo.feastId;
      }
    }

    // Octoechos: ziua este determinata din folderul de sub Octoechos.
    // Exemplu: Octoechos / Sunday Orthros -> feastId = "Sunday".
    if (periodId === "octoechos") {
      const folders = String(newPath).split(" / ").map(s => s.trim());
      const octoechosIndex = folders.findIndex(s => s.toLowerCase() === "octoechos");
      if (octoechosIndex >= 0) {
        const dayFolder = folders[octoechosIndex + 1] || "";
        const commonMatch = dayFolder.match(/^Common\s+(Orthros|Vespers)$/i);
        if (commonMatch) {
          entry.feastId = commonMatch[1].toLowerCase() === "orthros" ? "CommonOrthros" : "CommonVespers";
        }
        const dayMatch = dayFolder.match(/\b(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)\b/i);
        if (dayMatch) {
          const day = dayMatch[1].toLowerCase();
          entry.feastId = day.charAt(0).toUpperCase() + day.slice(1);
        }
      }
    }

    // UPDATE 2026-11-10 — TITLE ALIASES (@@)
    // Aplicam logica existenta (single/multi/coliziuni) fiecarui alias.
    titles.forEach(title => {
    allEntries.push({
      title,
      version,
      automelon,
      entry
    });

    // SINGLE VERSION (compatibility)
    if (!version) {
      if (result[title] && result[title].type === "multi") {
        Logger.log("Skipping single version because multi already exists: " + title);
        return;
      }
      result[title] = entry;
      return;
    }

    // MULTIPLE VERSION LOGIC
    if (!result[title]) result[title] = { type: "multi", versions: [] };

    if (!result[title].type) {
      const previous = result[title];

      result[title] = {
        type: "multi",
        versions: [{
          label: "Default",
          url: previous.url,
          name: previous.name,
          description: previous.description,
          automelon: previous.automelon,
          path: previous.path,
          periodId: previous.periodId || "",
          feast: previous.feast || "",
          feastId: previous.feastId || ""
        }]
      };
    }

    const exists = result[title].versions.find(v => v.label === version);
    if (exists) {
      Logger.log("Duplicate version skipped: " + title + " | " + version);
      return;
    }

    result[title].versions.push({
      label: version,
      url: file.getUrl(),
      name: file.getName(),
      description: description,
      automelon: automelon,
      path: newPath,
      periodId: entry.periodId || "",
      feast: entry.feast || "",
      feastId: entry.feastId || ""
    });
    }); // END UPDATE 2026-11-10 — TITLE ALIASES (@@)
  }

  const subFolders = folder.getFolders();
  while (subFolders.hasNext()) {
    scanFolder(subFolders.next(), result, allEntries, newPath);
  }
}

/******************************************************
 * NORMALIZE TITLE
 ******************************************************/
function normalize(text) {
  text = String(text || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/gi, "&")
    .replace(/[\n\r\t]+/g, " ")
    .replace(/\(\s*\*\*.*?\*\*\s*\)/g, "")   // (** ... **)
    .replace(/\*\*.*?\*\*/g, "")             // fallback
    .replace(/[*]/g, "")
    .replace(/["“”]/g, "")
    .replace(/[,:;]+/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\(\s*/g, "( ")
    .replace(/\s*\)/g, " )")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  // păstrează prefixele [LV][LIHC] etc și normalizează restul
  const prefixMatch = text.match(/^((\[[A-Z]+\])+)\s*(.*)$/);

  if (prefixMatch) {
    const prefixes = prefixMatch[1];
    let title = prefixMatch[3];

    title = title.replace(/^(THE|A|AN|FESTAL|STICHERAS|VERSES|O)\s+/, "");
    title = title.replace(/\bIN\s+TONE\b/gi, "TONE");
    title = title.replace(/\bCANONS\b/g, "CANON");

    title = title.replace(/^THEOTOKION (?:FROM|FOR) THE OCTOECHOS\b/, "APOLYTIKION RESURRECTIONAL THEOTOKION");

    title = title.replace(/^RESURRECTIONAL THEOTOKION\b/, "APOLYTIKION RESURRECTIONAL THEOTOKION");

    return `${prefixes} ${title}`.trim();
  }

  // fallback fără prefixe
  return text.replace(/^(THE|A|AN)\s+/, "");
}

function extractAutomelon(description) {

  if (!description) {
    return "";
  }

  // Elimină tagurile HTML înainte de extragerea automelonului
  const cleanDescription = String(description)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "");

  const m =
    cleanDescription.match(/\(\s*\*\*(.*?)\*\*\s*\)/s);

  if (!m) {
    return "";
  }

  return normalize(m[1]);
}


function resolveCollisions(result, allEntries) {

  const groups = {};

  // Grupează toate fișierele după titlul normalizat
  allEntries.forEach(function (e) {

    const key = e.title;

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(e);
  });

  Object.keys(groups).forEach(function (title) {

    const list = groups[title];

    // Nu există coliziune
    if (list.length < 2) {
      return;
    }

    // Nu modificăm obiectele MULTI: Karam, DCS etc.
    if (result[title] && result[title].type === "multi") {
      return;
    }

    // Extrage automeloanele distincte
    const automela = [];

    list.forEach(function (e) {

      if (
        e.automelon &&
        automela.indexOf(e.automelon) === -1
      ) {
        automela.push(e.automelon);
      }

    });

    // Coliziunea nu poate fi rezolvată
    if (automela.length < 2) {

      Logger.log(
        "Collision cannot be resolved: " +
        title +
        " | insufficient distinct automela"
      );

      return;
    }

    Logger.log(
      "Collision resolved using automelon: " +
      title
    );

    // Elimină cheia simplă
    delete result[title];

    // Numără aparițiile fiecărui automelon
    const automelonCount = {};

    list.forEach(function (e) {

      const automelon = e.automelon || "";

      automelonCount[automelon] =
        (automelonCount[automelon] || 0) + 1;

    });

    // Avertizare dacă același automelon apare de mai multe ori
    Object.keys(automelonCount).forEach(function (automelon) {

      if (automelonCount[automelon] > 1) {

        Logger.log(
          "Still duplicated after automelon (" +
          automelonCount[automelon] +
          "): " +
          title +
          " || " +
          automelon
        );

      }

    });

    // Creează cheile diferențiate
    list.forEach(function (e) {

      if (!e.automelon) {

        Logger.log(
          "Entry skipped because automelon is missing: " +
          title +
          " | " +
          e.entry.name
        );

        return;
      }

      const newKey =
        title + " || " + e.automelon;

      // Protecție împotriva suprascrierii
      if (result[newKey]) {

        Logger.log(
          "Duplicate version skipped: " +
          title +
          " | " +
          version +
          " | file: " +
          newPath +
          " / " +
          file.getName()
        );

        return;
      }

      result[newKey] = e.entry;

    });

  });

}