// Extras din convert-service.js v1.3.2; comportament păstrat.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { downloadsDir, libreOffice } from "./config.js";
import { injectHtmlAssets } from "./html-assets.js";

function escapeAppleScript(value) {

  return value

    .replace(/\\/g, "\\\\")

    .replace(/"/g, '\\"');

}




export function processRtfPlan(plan) {
  let successCount = 0;

  let errorCount = 0;



  for (const { filename, destination } of plan) {



    const rtfPath = path.join(

      downloadsDir,

      filename

    );



    const baseName = path.basename(

      filename,

      path.extname(filename)

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



    console.log();

    console.log("========================================");

    console.log(`RTF: ${filename}`);

    console.log("========================================");



    // ========================================================

    // 9. RTF -> DOCX CU MICROSOFT WORD

    // ========================================================



    console.log("Word: RTF -> DOCX");



    // Dacă a rămas un DOCX vechi în Downloads,

    // îl ștergem înainte de conversie.

    // Nu ștergem fișiere intermediare existente.
    if (fs.existsSync(docxPath) || fs.existsSync(htmlPath)) {
      console.error(`BLOCAT: fișier intermediar deja existent pentru ${filename}.`);
      console.error(`Verifică manual: ${docxPath} și ${htmlPath}`);
      errorCount++;
      continue;
    }

    // AppleScript original din versiunea 1.0.

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

        `EROARE Word: ${filename}`

      );

      errorCount++;

      continue;

    }



    if (!fs.existsSync(docxPath)) {

      console.error(

        `EROARE: DOCX nu a fost creat: ${docxPath}`

      );

      errorCount++;

      continue;

    }



    console.log(

      `Creat DOCX: ${path.basename(docxPath)}`

    );



    // ========================================================

    // 10. DOCX -> HTML CU LIBREOFFICE

    // ========================================================



    console.log("LibreOffice: DOCX -> HTML");



    // HTML-ul intermediar nu exista la început; nu ștergem fișiere.

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

        `EROARE LibreOffice: ${filename}`

      );

      errorCount++;

      continue;

    }



    if (!fs.existsSync(htmlPath)) {

      console.error(

        `EROARE: HTML nu a fost creat: ${htmlPath}`

      );

      errorCount++;

      continue;

    }



    console.log(

      `Creat HTML: ${path.basename(htmlPath)}`

    );



    // ========================================================
    // 11. ADAUGĂ META VIEWPORT + CSS + JS
    //
    // Bilingual: layout-fixes.css + layout-fixes-and-links.js
    // Monolingual: common.css + bilingual.css + monolingual.css
    //              layout-fixes.js + title-links.js
    // Elimină eventualele include-uri vechi înainte de inserare.
    // ========================================================

    try {
      injectHtmlAssets(htmlPath, filename);
    } catch (error) {
      console.error(`EROARE la modificarea HTML: ${filename}`);
      console.error(error.message);
      errorCount++;
      continue;
    }

    // ========================================================

    // 12. STABILEȘTE DESTINAȚIA

    //

    // Destinația a fost calculată în PREVIEW.

    // Nu recalculăm titlul după conversie.

    // ========================================================



    console.log(

      `Destinație: ${destination}`

    );



    // ========================================================

    // 13. CREEAZĂ DIRECTORUL DACĂ NU EXISTĂ

    // ========================================================



    try {

      // Verifică din nou dacă au apărut conflicte

      // între PREVIEW și momentul conversiei.

      const day = path.basename(destination).slice(0, 2);

      const parent = path.dirname(destination);



      if (fs.existsSync(parent)) {

        const matches = fs

          .readdirSync(parent, { withFileTypes: true })

          .filter(

            (entry) =>

              entry.isDirectory() &&

              (

                entry.name === day ||

                entry.name.startsWith(`${day} `)

              )

          )

          .map((entry) => entry.name);



        if (

          matches.length > 1 ||

          (

            matches.length === 1 &&

            matches[0] !== path.basename(destination)

          )

        ) {

          throw new Error(

            "Conflict de directoare apărut după PREVIEW."

          );

        }

      }



      fs.mkdirSync(

        destination,

        {

          recursive: true,

        }

      );



    } catch (error) {

      console.error(

        "EROARE la crearea folderului:"

      );

      console.error(destination);

      console.error(error.message);

      errorCount++;

      continue;

    }



    // ========================================================

    // 14. SUPRASCRIE HTML-UL DACĂ EXISTĂ

    // ========================================================



    const destinationHtml = path.join(

      destination,

      path.basename(htmlPath)

    );



    try {

      // Nu suprascriem niciodată un HTML deja publicat.
      fs.copyFileSync(htmlPath, destinationHtml, fs.constants.COPYFILE_EXCL);
      fs.unlinkSync(htmlPath);

      console.log(

        `Mutat HTML: ${destinationHtml}`

      );



    } catch (error) {

      console.error(

        `EROARE la mutarea/suprascrierea HTML: ${filename}`

      );

      console.error(error.message);

      console.error(

        "RTF și DOCX rămân în Downloads."

      );

      errorCount++;

      continue;

    }



    // ========================================================

    // 15. CLEANUP DOWNLOADS

    //

    // NUMAI DUPĂ CE HTML-UL A AJUNS CU SUCCES ÎN DESTINAȚIE.

    // ========================================================



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



      successCount++;



    } catch (error) {

      console.error(

        `EROARE cleanup pentru: ${filename}`

      );

      console.error(error.message);

      errorCount++;

    }



    console.log();

  }



  // ==========================================================

  // 16. ÎNCHIDE WORD DUPĂ TOATE CONVERSIILE

  // ==========================================================



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



  return { successCount, errorCount };
}


