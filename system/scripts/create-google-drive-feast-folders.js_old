/**
 * create-google-drive-feast-folders.js
 * Version: 1.0
 * Date: 2026-10-25
 *
 * PURPOSE:
 * Creates feast/saint folders in TWO Google Drive locations,
 * based on the heading of an RTF service document.
 *
 * GOOGLE DRIVE DESTINATIONS:
 * 1. Byzantine Music/EnglishByzantineMusic/Menaion
 * 2. MyPrivateEnglishMusic/Menaion
 *
 * RULES:
 * - Uses the complete feast/saint title from the RTF heading.
 * - VESP and LITART: liturgical date = filename date + 1 day.
 * - ORTHROS and other services: use filename date.
 * - Creates folders for saints even when commemorated on Sunday.
 * - Reuses existing folders with exactly matching names.
 * - Never renames or deletes existing folders.
 * - Never modifies or deletes the source RTF.
 * - Does not guess feast names when headings cannot be parsed.
 * - Only Menaion is enabled in this version.
 * - Penticostarion requires separate mapping rules.
 * - Preview mode is the default.
 * - --apply is required to create folders.
 *
 * USAGE:
 *
 * Preview one RTF:
 * node scripts/create-google-drive-feast-folders.js "/path/file.rtf"
 *
 * Create folders:
 * node scripts/create-google-drive-feast-folders.js "/path/file.rtf" --apply
 *
 * Preview all RTF files in Downloads:
 * node scripts/create-google-drive-feast-folders.js --downloads
 *
 * Create folders for all RTF files in Downloads:
 * node scripts/create-google-drive-feast-folders.js --downloads --apply
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

// ============================================================
// GOOGLE DRIVE PATHS
// ============================================================

const DRIVE = path.join(
  os.homedir(),
  "Library",
  "CloudStorage",
  "GoogleDrive-actalpos@gmail.com",
  "My Drive"
);

const ROOTS = [
  path.join(DRIVE, "Byzantine Music", "EnglishByzantineMusic"),
  path.join(DRIVE, "MyPrivateEnglishMusic"),
];

// ============================================================
// LITURGICAL MONTHS
// ============================================================

const LITURGICAL_MONTHS = [
  "05 January",
  "06 February",
  "07 March",
  "08 April",
  "09 May",
  "10 June",
  "11 July",
  "12 August",
  "01 September",
  "02 October",
  "03 November",
  "04 December",
];

const MONTH_INDEX = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

const MONTH_NAME = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ============================================================
// EXTRACT LITURGICAL DATE FROM FILENAME
// ============================================================

function getFileDate(filename) {
  const m = path.basename(filename).match(
    /^([A-Za-z]+)[ ._-]+(\d{1,2})(?:[ ._-]+(\d{4}))?\b/i
  );

  if (!m) {
    throw new Error(
      "Numele RTF nu începe cu lună și zi: " + filename
    );
  }

  const month = MONTH_INDEX[m[1].toLowerCase()];
  const day = Number(m[2]);

  if (month === undefined || day < 1 || day > 31) {
    throw new Error("Dată invalidă: " + filename);
  }

  const service = path.basename(filename).toUpperCase();

  const shift = /\b(VESP|LITART)\b/.test(service) ? 1 : 0;

  // Leap-safe reference year for files without a year.
  const year = m[3] ? Number(m[3]) : 2024;

  const date = new Date(
    Date.UTC(year, month, day + shift)
  );

  if (date.getUTCMonth() !== month && !shift) {
    throw new Error("Zi invalidă: " + filename);
  }

  return {
    day: date.getUTCDate(),
    month: date.getUTCMonth(),
    year: m[3] ? date.getUTCFullYear() : null,
  };
}

// ============================================================
// READ RTF AS PLAIN TEXT
// ============================================================

function readRtfText(file) {
  return execFileSync(
    "/usr/bin/textutil",
    ["-convert", "txt", "-stdout", file],
    {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    }
  );
}

// ============================================================
// CLEAN TEXT
// ============================================================

function cleanLine(s) {
  return s
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// EXTRACT COMPLETE FEAST TITLE
// ============================================================

function extractFeast(text, date) {
  const lines = text
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)
    .slice(0, 45);

  const day = date.day;
  const month = MONTH_NAME[date.month];

  // Example:
  // Great Vespers of October 26
  // Great-Martyr Demetrios the Myrrh-Streaming

  const vesp = lines.findIndex((s) =>
    new RegExp(
      `\\b(?:Great\\s+)?Vespers\\s+of\\s+${month}\\s+0?${day}\\b`,
      "i"
    ).test(s)
  );

  if (vesp >= 0) {
    const candidate = lines
      .slice(vesp + 1)
      .find(
        (s) =>
          !/^\(?served on/i.test(s) &&
          !/^great vespers\b/i.test(s) &&
          !/^october\s+\d+\b/i.test(s)
      );

    if (candidate) {
      return candidate;
    }
  }

  // Example:
  // Orthros on Sunday, October 25, 2026; Tone 4
  // Martyrs Marcian and Martyrios the Notaries

  const orthros = lines.findIndex((s) =>
    new RegExp(
      `\\bOrthros\\s+on\\s+.*\\b${month}\\s+0?${day}\\b`,
      "i"
    ).test(s)
  );

  if (orthros >= 0) {
    const candidate = lines
      .slice(orthros + 1)
      .find(
        (s) =>
          !/^\d+$/.test(s) &&
          !/^tone\b/i.test(s)
      );

    if (candidate) {
      return candidate;
    }
  }

  throw new Error(
    "Nu pot identifica sigur subtitlul sărbătorii în primele 45 de linii."
  );
}

// ============================================================
// VALIDATE FOLDER NAME
// ============================================================

function safeFolderName(name) {
  const cleaned = cleanLine(name)
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/[. ]+$/g, "");

  if (
    !cleaned ||
    cleaned === "." ||
    cleaned === ".." ||
    cleaned.length > 180
  ) {
    throw new Error(
      "Nume de folder invalid sau prea lung: " + name
    );
  }

  return cleaned;
}

// ============================================================
// PROCESS ONE RTF
// ============================================================

function processFile(file, apply) {
  if (!fs.existsSync(file)) {
    throw new Error("Fișierul nu există: " + file);
  }

  const date = getFileDate(file);

  const text = readRtfText(file);

  const feast = safeFolderName(
    extractFeast(text, date)
  );

  const folderName =
    `${String(date.day).padStart(2, "0")} ${feast}`;

  const monthFolder = LITURGICAL_MONTHS[date.month];

  console.log(
    `\nRTF: ${path.basename(file)}`
  );

  console.log(
    `Destinație: Menaion / ${monthFolder} / ${folderName}`
  );

  for (const root of ROOTS) {
    if (
      !fs.existsSync(root) ||
      !fs.statSync(root).isDirectory()
    ) {
      console.warn(
        `  [EROARE] Google Drive indisponibil: ${root}`
      );
      continue;
    }

    const target = path.join(
      root,
      "Menaion",
      monthFolder,
      folderName
    );

    if (fs.existsSync(target)) {
      if (!fs.statSync(target).isDirectory()) {
        throw new Error(
          "Există un fișier în locul folderului: " + target
        );
      }

      console.log(
        "  [EXISTĂ] " + target
      );

    } else if (apply) {
      fs.mkdirSync(target, {
        recursive: true,
      });

      console.log(
        "  [CREAT] " + target
      );

    } else {
      console.log(
        "  [PREVIEW] Ar crea: " + target
      );
    }
  }
}

// ============================================================
// COMMAND LINE ARGUMENTS
// ============================================================

const args = process.argv.slice(2);

const apply = args.includes("--apply");

const downloads = args.includes("--downloads");

const files = args.filter(
  (a) => !a.startsWith("--")
);

if (downloads) {
  const dir = path.join(
    os.homedir(),
    "Downloads"
  );

  files.push(
    ...fs
      .readdirSync(dir)
      .filter((n) => /\.rtf$/i.test(n))
      .map((n) => path.join(dir, n))
  );
}

// ============================================================
// EXECUTION
// ============================================================

if (!files.length) {
  console.error(
    "Utilizare: node scripts/create-google-drive-feast-folders.js <fișier.rtf> [--apply] sau --downloads [--apply]"
  );

  process.exitCode = 1;

} else {
  console.log(
    apply
      ? "MOD CREARE (--apply)"
      : "MOD PREVIEW (nu se creează nimic)"
  );

  for (const file of [...new Set(files)]) {
    try {
      processFile(
        path.resolve(file),
        apply
      );

    } catch (error) {
      console.error(
        `[EROARE] ${path.basename(file)}: ${error.message}`
      );

      process.exitCode = 1;
    }
  }
}