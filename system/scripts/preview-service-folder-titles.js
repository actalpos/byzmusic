
/**
 * ============================================================
 * preview-service-folder-titles.js
 *
 * Version: 1.1
 * Date: 2026-11-08
 *
 * PURPOSE
 * -------
 * Preview descriptive Service_Texts folder names from RTF files.
 *
 * RULES
 * -----
 * 1. RTF with year    -> variableDate/YYYY/MM/DD Title
 * 2. RTF without year -> fixDate/MM/DD Title
 * 3. VESP / LITART    -> date + 1 day
 * 4. ORTHROS / READ   -> date unchanged
 * 5. Group files by liturgical date and fixed/variable type.
 * 6. Prefer titles extracted from VESP or ORTHROS.
 * 7. Reuse one title for LITART and READ.
 * 8. Report conflicting titles; do not guess.
 * 9. Never create, rename, overwrite or delete anything.
 *
 * convert-service.js is NOT modified.
 * ============================================================
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

// ============================================================
// CONFIG
// ============================================================

const downloadsDir = path.join(os.homedir(), "Downloads");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

const serviceTextsDir = path.resolve(
  scriptDir,
  "../../Service_Texts"
);

const monthNumbers = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12
};

const monthNames = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

// ============================================================
// DATE FROM FILENAME
// ============================================================

function parseDateFromFilename(filename) {
  const match = filename.match(
    /^([A-Za-z]+)\s+(\d{1,2})(?:\s+(\d{4}))?\b/
  );

  if (!match) {
    throw new Error("Nu pot extrage data din nume");
  }

  const month = monthNumbers[match[1].toLowerCase()];
  const day = Number(match[2]);
  const hasYear = Boolean(match[3]);
  const year = hasYear ? Number(match[3]) : 2024;

  if (!month) {
    throw new Error("Lună necunoscută");
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Dată invalidă");
  }

  const nextDay = /\b(VESP|LITART)\b/i.test(filename);

  if (nextDay) {
    date.setUTCDate(date.getUTCDate() + 1);
  }

  return {
    year: date.getUTCFullYear(),
    month: String(date.getUTCMonth() + 1).padStart(2, "0"),
    day: String(date.getUTCDate()).padStart(2, "0"),
    hasYear
  };
}

// ============================================================
// SERVICE TYPE
// ============================================================

function getServiceType(filename) {
  if (/\bVESP\b/i.test(filename)) return "VESP";
  if (/\bORTHROS\b/i.test(filename)) return "ORTHROS";
  if (/\bLITART\b/i.test(filename)) return "LITART";
  if (/\bREAD\b/i.test(filename)) return "READ";
  return "OTHER";
}

// ============================================================
// READ RTF
// ============================================================

function readRtf(file) {
  return execFileSync(
    "/usr/bin/textutil",
    ["-convert", "txt", "-stdout", file],
    {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024
    }
  );
}

// ============================================================
// TEXT HELPERS
// ============================================================

function cleanLine(line) {
  return line
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeFolderTitle(title) {
  return cleanLine(title)
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/[. ]+$/g, "");
}

function normalizeForComparison(title) {
  return cleanLine(title)
    .toLowerCase()
    .replace(/[.,;:!?]/g, "")
    .replace(/\s+/g, " ");
}

// ============================================================
// EXTRACT TITLE FROM VESP / ORTHROS
// ============================================================

function extractTitle(text, date) {
  const lines = text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)
    .slice(0, 80);

  const monthName = monthNames[Number(date.month) - 1];
  const dayNumber = Number(date.day);

  const headingRegex = new RegExp(
    `\\b(?:Vespers\\s+of|Orthros\\s+on)\\b` +
    `[^\\n]*\\b${monthName}\\s+0?${dayNumber}\\b`,
    "i"
  );

  const headingIndex = lines.findIndex(line =>
    headingRegex.test(line)
  );

  if (headingIndex < 0) {
    throw new Error(
      "Nu am identificat antetul VESP/ORTHROS"
    );
  }

  const heading = lines[headingIndex];

  const isSunday = /\bSunday\b/i.test(heading);
  const toneMatch = heading.match(/\bTone\s+(\d+)\b/i);

  const subtitle = lines[headingIndex + 1];

  if (!subtitle || subtitle.length > 180) {
    throw new Error(
      "Subtitlul nu a fost identificat sigur"
    );
  }

  const prefix = isSunday
    ? `Sunday${toneMatch ? ` Tone ${toneMatch[1]}` : ""}, `
    : "";

  return safeFolderTitle(prefix + subtitle);
}

// ============================================================
// BUILD GROUP KEY
// ============================================================

function getGroupKey(date) {
  return [
    date.hasYear ? "variable" : "fixed",
    date.hasYear ? date.year : "",
    date.month,
    date.day
  ].join("|");
}

// ============================================================
// BUILD DESTINATION
// ============================================================

function buildDestination(date, title) {
  const dayFolder = `${date.day} ${title}`;

  if (date.hasYear) {
    return path.join(
      serviceTextsDir,
      "variableDate",
      String(date.year),
      date.month,
      dayFolder
    );
  }

  return path.join(
    serviceTextsDir,
    "fixDate",
    date.month,
    dayFolder
  );
}

// ============================================================
// MAIN — COLLECT FILES
// ============================================================

console.log("\n========================================");
console.log("PREVIEW SERVICE FOLDER TITLES — v1.1");
console.log("Nu se modifică niciun fișier sau director.");
console.log("========================================\n");

const rtfFiles = fs.readdirSync(downloadsDir)
  .filter(file => /\.rtf$/i.test(file))
  .sort();

if (rtfFiles.length === 0) {
  console.log("Nu există fișiere RTF în Downloads.");
  process.exit(0);
}

const groups = new Map();

// ============================================================
// PASS 1 — GROUP FILES AND EXTRACT TITLES
// ============================================================

for (const filename of rtfFiles) {
  try {
    const filePath = path.join(downloadsDir, filename);
    const date = parseDateFromFilename(filename);
    const serviceType = getServiceType(filename);
    const groupKey = getGroupKey(date);

    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        date,
        files: [],
        candidates: []
      });
    }

    const group = groups.get(groupKey);

    const entry = {
      filename,
      serviceType,
      title: null,
      error: null
    };

    if (
      serviceType === "VESP" ||
      serviceType === "ORTHROS"
    ) {
      try {
        entry.title = extractTitle(
          readRtf(filePath),
          date
        );

        group.candidates.push({
          title: entry.title,
          filename,
          serviceType
        });

      } catch (error) {
        entry.error = error.message;
      }
    }

    group.files.push(entry);

  } catch (error) {
    console.log(`[EROARE] ${filename}: ${error.message}`);
    process.exitCode = 1;
  }
}

// ============================================================
// PASS 2 — RESOLVE ONE TITLE PER DATE
// ============================================================

for (const group of groups.values()) {
  const { date, files, candidates } = group;

  const dateLabel = date.hasYear
    ? `${date.year}/${date.month}/${date.day}`
    : `${date.month}/${date.day} (fixedDate)`;

  console.log("----------------------------------------");
  console.log("DATA:", dateLabel);

  const uniqueTitles = new Map();

  for (const candidate of candidates) {
    const key = normalizeForComparison(candidate.title);

    if (!uniqueTitles.has(key)) {
      uniqueTitles.set(key, candidate.title);
    }
  }

  if (uniqueTitles.size === 0) {
    console.log(
      "NECESITĂ VERIFICARE: Nu există titlu sigur din VESP/ORTHROS."
    );

    for (const entry of files) {
      console.log(`  ${entry.serviceType}: ${entry.filename}`);

      if (entry.error) {
        console.log(`    Motiv: ${entry.error}`);
      }
    }

    console.log();
    continue;
  }

  if (uniqueTitles.size > 1) {
    console.log(
      "CONFLICT: Titluri diferite pentru aceeași dată."
    );

    for (const candidate of candidates) {
      console.log(
        `  ${candidate.serviceType}: ${candidate.title}`
      );
    }

    console.log(
      "Nu aleg automat un director."
    );

    process.exitCode = 1;
    console.log();
    continue;
  }

  const title = [...uniqueTitles.values()][0];
  const destination = buildDestination(date, title);

  console.log("TITLU:", title);
  console.log("DIRECTOR PROPUS:");
  console.log(destination);

  console.log("\nFIȘIERE GRUPATE:");

  for (const entry of files) {
    console.log(
      `  ${entry.serviceType}: ${entry.filename}`
    );

    if (entry.error) {
      console.log(`    Observație: ${entry.error}`);
    }
  }

  console.log();
}

console.log("========================================");
console.log("PREVIEW TERMINAT — nicio modificare.");
console.log("========================================");
