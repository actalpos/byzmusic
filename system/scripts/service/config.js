// Extras din convert-service.js v1.3.2; comportament păstrat.
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const downloadsDir = path.join(
  os.homedir(),
  "Documents",
  "ByzMusic-Inbox",
  "RTF"
);



const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);



// scripts/service -> system
const systemDir = path.resolve(__dirname, "../..");

// system -> byzmusic
const projectDir = path.resolve(systemDir, "..");



const serviceTextsDir = path.join(

  projectDir,

  "Service_Texts"

);



const libreOffice =

  "/Applications/LibreOffice.app/Contents/MacOS/soffice";



// ============================================================

// SCRIPT PENTRU DIRECTOARELE GOOGLE DRIVE

// ============================================================



const feastScript = path.join(
  systemDir,
  "scripts",
  "create-google-drive-feast-folders.js"
);




export { downloadsDir, systemDir, projectDir, serviceTextsDir, libreOffice, feastScript };
