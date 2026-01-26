const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse").default || require("pdf-parse"); // Corect pentru Node

// Foldere
const driveFolder = "/Users/nic/Library/CloudStorage/GoogleDrive-actalpos@gmail.com/.shortcut-targets-by-id/1-BCIZbjF7NC00ymiPCBN1yPXa-0DboRH/EnglishByzantineMusic/Orthros";
const outputFolder = "/users/nic/Projects/byzmusic/system/data";
const outputFile = path.join(outputFolder, "titleLinks.json");

// Scan folder recursiv
function scanFolder(folderPath, fileList = []) {
  const items = fs.readdirSync(folderPath, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(folderPath, item.name);
    if (item.isDirectory()) {
      scanFolder(fullPath, fileList);
    } else if (item.isFile()) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

// Normalize description: remove <br>, spaces, uppercase
function normalizeDescription(desc) {
  if (!desc) return null;
  return desc.replace(/<br\s*\/?>/gi, "")  // remove <br>
             .replace(/\s+/g, "")         // remove all spaces
             .toUpperCase();              // uppercase
}

// Extract description din fișier
async function extractDescription(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      const lines = pdfData.text
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);
      return lines.length > 0 ? lines[0] : path.basename(filePath, ext); // fallback: file name
    } catch (e) {
      console.error("Nu pot citi PDF:", filePath, e);
      return path.basename(filePath, ext); // fallback
    }
  } else if (ext === ".txt" || ext === ".rtf") {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      const lines = content
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(Boolean);
      return lines.length > 0 ? lines[0] : path.basename(filePath, ext);
    } catch (e) {
      console.error("Nu pot citi fișier text:", filePath, e);
      return path.basename(filePath, ext);
    }
  } else {
    return null; // ignore alte extensii
  }
}

// Main async
async function generateJSON() {
  console.log("Scan folder:", driveFolder);
  const allFiles = scanFolder(driveFolder);
  const result = {};

  for (const file of allFiles) {
    const ext = path.extname(file).toLowerCase();
    if ([".pdf", ".txt", ".rtf"].includes(ext)) {
      const desc = await extractDescription(file);
      const normDesc = normalizeDescription(desc);
      if (normDesc) {
        result[normDesc] = "file://" + file;
      }
    }
  }

  if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), "utf8");
  console.log("JSON generat:", outputFile);
}

// Run
generateJSON();
