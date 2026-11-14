// Coordonator modular; extras din convert-service.js v1.3.2.
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { downloadsDir, feastScript } from "./service/config.js";
import { parseDateFromFilename, buildLiturgicalDate, serviceType } from "./service/dates.js";
import { detectYearFromRtf } from "./service/year-detection.js";
import { extractTitle, comparable } from "./service/titles.js";
import { groupKey, resolveDestination } from "./service/destinations.js";
import { runFeastFolders } from "./service/google-drive.js";
import { processRtfPlan } from "./service/process-rtf.js";

async function main() {



  // ==========================================================

  // 1. GĂSEȘTE TOATE RTF-URILE DIN DOWNLOADS

  // ==========================================================



  const rtfFiles = fs

    .readdirSync(downloadsDir)

    .filter((file) => /\.rtf$/i.test(file))

    .sort();



  if (rtfFiles.length === 0) {

    console.log();

    console.log("Nu există fișiere RTF în Downloads.");

    return;

  }



  console.log();

  console.log(`Găsite ${rtfFiles.length} fișiere RTF:`);



  for (const file of rtfFiles) {

    console.log(`  - ${file}`);

  }



  // ==========================================================

  // 2. ANALIZEAZĂ DATELE ȘI GRUPEAZĂ FIȘIERELE

  //

  // Această etapă nu modifică niciun fișier.

  // ==========================================================



  // Confirmăm anul sursă înainte de grupare și de orice modificare.
  if (!input.isTTY) {
    console.error("Este necesar un Terminal interactiv pentru confirmarea anului.");
    process.exitCode = 1;
    return;
  }
  // Grupare provizorie după luna/ziua liturgică, fără a ghici anul.
  // Anul 2000 este folosit NUMAI pentru calculul lunii/zilei (an bisect).
  const yearGroups = new Map();
  const yearsByFile = new Map();
  for (const filename of rtfFiles) {
    const parsed = parseDateFromFilename(filename);
    if (!parsed) continue;
    const provisional = buildLiturgicalDate({ ...parsed, year: 2000 });
    if (!provisional) continue;
    const key = `${provisional.month}-${provisional.day}`;
    if (!yearGroups.has(key)) yearGroups.set(key, []);
    yearGroups.get(key).push({ filename, parsed });
  }
  const yearPrompt = readline.createInterface({ input, output });
  try {
    for (const [dayKey, members] of yearGroups) {
      const suggestions = members.map(({ filename, parsed }) => {
        if (parsed.filenameYear) return { filename, year: parsed.filenameYear, source: "numele fișierului" };
        const detected = detectYearFromRtf(path.join(downloadsDir, filename), parsed.month, parsed.day);
        return { filename, year: detected.ambiguous ? null : detected.year,
          source: detected.ambiguous ? "date ambigue în RTF" : detected.year ? "antetul RTF" : "an neidentificat" };
      });
      const candidates = [...new Set(suggestions.map(s => s.year).filter(Boolean))];
      const proposed = candidates.length === 1 ? candidates[0] : null;
      console.log(`\nGRUP (lună/zi liturgică): ${dayKey}`);
      for (const s of suggestions) console.log(`  ${s.filename}: ${s.year ?? "necunoscut"} (${s.source})`);
      if (candidates.length > 1) console.log("ATENȚIE: ani diferiți detectați; verifică înainte de confirmare.");
      const response = (await yearPrompt.question(
        `Anul calendaristic al documentelor din grup [${proposed ?? "YYYY"}] (sau N pentru anulare): `
      )).trim();
      if (/^n$/i.test(response)) { console.log("Anulat; niciun fișier modificat."); return; }
      const year = response ? Number(response) : proposed;
      if (!Number.isInteger(year) || year < 1900 || year > 2200 ||
          members.some(({parsed}) => !buildLiturgicalDate({...parsed,year}))) {
        console.error("An invalid pentru grup. Conversia a fost anulată.");
        process.exitCode = 1; return;
      }
      for (const { filename } of members) yearsByFile.set(filename, year);
    }
  } finally { yearPrompt.close(); }

  const groups = new Map();

  const problems = [];



  for (const filename of rtfFiles) {

    const parsed = parseDateFromFilename(filename);
    const date = parsed && buildLiturgicalDate({...parsed,year:yearsByFile.get(filename)});



    if (!date) {

      problems.push(`${filename}: dată invalidă`);

      continue;

    }



    const key = groupKey(date);



    if (!groups.has(key)) {

      groups.set(key, {

        date,

        files: [],

        candidates: [],

      });

    }



    const group = groups.get(key);



    group.files.push(filename);



    const type = serviceType(filename);



    // Titlul se extrage numai din VESP sau ORTHROS.

    if (type === "VESP" || type === "ORTHROS") {

      try {

        const title = extractTitle(

          path.join(downloadsDir, filename),

          date

        );



        group.candidates.push({

          filename,

          title,

        });

      } catch (error) {

        problems.push(

          `${filename}: ${error.message}`

        );

      }

    }

  }



  // ==========================================================

  // 3. PREVIEW SERVICE_TEXTS

  // ==========================================================



  console.log();

  console.log("========================================");

  console.log("PREVIEW SERVICE_TEXTS — v1.1");

  console.log("========================================");

  console.log("Nicio modificare înainte de confirmarea Y.");



  const plan = [];
  const plannedHtml = new Set();

  const feastFiles = [];



  for (const group of groups.values()) {

    // ============================================================

    // ALEGEREA TITLULUI SĂRBĂTORII

    //

    // PRIORITATE:

    // 1. VESP

    // 2. ORTHROS, numai dacă VESP lipsește

    //

    // Nu comparăm titlurile VESP și ORTHROS deoarece antetele

    // pot avea structuri diferite.

    //

    // Toate serviciile aceleiași date folosesc titlul ales.

    // ============================================================



    const vespCandidate = group.candidates.find(

      (candidate) =>

        serviceType(candidate.filename) === "VESP"

    );



    const orthrosCandidate = group.candidates.find(

      (candidate) =>

        serviceType(candidate.filename) === "ORTHROS"

    );



    const selectedCandidate =

      vespCandidate ?? orthrosCandidate;



    const titles = new Map();



    if (selectedCandidate) {

      titles.set(

        comparable(selectedCandidate.title),

        selectedCandidate.title

      );

    }



    const date = group.date;



    const label = `${date.year}/${date.month}/${date.day}`;



    console.log();

    console.log(`DATA: ${label}`);



    if (titles.size !== 1) {

      problems.push(

        `${label}: ${titles.size === 0

          ? "Nu există titlu VESP/ORTHROS."

          : "Titluri contradictorii: " +

          group.candidates

            .map((c) => c.title)

            .join(" | ")

        }`

      );



      continue;

    }



    const title = [...titles.values()][0];



    try {

      const { destination, note } =

        resolveDestination(date, title);



      console.log(`TITLU: ${title}`);

      console.log(`DIRECTOR (${note}): ${destination}`);



      for (const filename of group.files) {

        console.log(

          `  ${serviceType(filename)}: ${filename}`

        );



        const htmlName =

          path.basename(

            filename,

            path.extname(filename)

          ) + ".html";



        const targetHtml = path.join(destination, htmlName);
        if (plannedHtml.has(targetHtml)) {
          problems.push(`Două RTF-uri produc același HTML: ${targetHtml}`);
          continue;
        }
        plannedHtml.add(targetHtml);
        if (fs.existsSync(targetHtml)) {
          console.log(`    [SKIP] HTML existent: ${htmlName} (RTF păstrat)`);
          continue;
        }
        plan.push({ filename, destination });

      }



      // Un singur RTF pentru fiecare dată Google Drive.

      // Preferăm VESP; dacă lipsește, folosim ORTHROS.

      const selected =

        group.files.find(

          (name) => serviceType(name) === "VESP"

        ) ??

        group.files.find(

          (name) => serviceType(name) === "ORTHROS"

        );



      if (selected && group.files.some(name => plan.some(item => item.filename === name))) {

        feastFiles.push({
          file: path.join(downloadsDir, selected),
          title,
        });

      } else if (!selected) {

        problems.push(

          `${label}: lipsește VESP/ORTHROS pentru Google Drive.`

        );

      }



    } catch (error) {

      problems.push(`${label}: ${error.message}`);

    }

  }



  if (plan.length === 0 && problems.length === 0) {
    console.log("\nToate HTML-urile există deja. SKIP total; nu se modifică nimic.");
    return;
  }

  // ==========================================================

  // 4. VERIFICĂ PROBLEMELE ÎNAINTE DE CONVERSIE

  // ==========================================================



  if (problems.length > 0) {

    console.error();

    console.error("PREVIEW BLOCAT — PROBLEME:");



    for (const problem of problems) {

      console.error(" - " + problem);

    }



    console.error();

    console.error("Nu s-a modificat nimic.");



    process.exitCode = 1;

    return;

  }



  // ==========================================================

  // 5. PREVIEW GOOGLE DRIVE

  //

  // Scriptul extern este apelat fără --apply.

  // Nu creează directoare în această etapă.

  // ==========================================================



  if (!fs.existsSync(feastScript)) {

    console.error(

      `Scriptul Google Drive lipsește: ${feastScript}`

    );



    process.exitCode = 1;

    return;

  }



  console.log();

  console.log("========================================");

  console.log("PREVIEW GOOGLE DRIVE");

  console.log("========================================");



  try {

    runFeastFolders(feastFiles, false);

  } catch (error) {

    console.error(

      `PREVIEW GOOGLE DRIVE EȘUAT: ${error.message}`

    );



    if (error.stderr) {

      console.error(error.stderr.toString());

    }



    console.error("Nu s-a modificat nimic.");



    process.exitCode = 1;

    return;

  }



  // ==========================================================

  // 6. CONFIRMARE INTERACTIVĂ Y/N

  //

  // O singură confirmare pentru întregul lot.

  // ==========================================================



  console.log();

  console.log(`Total: ${plan.length} fișiere RTF.`);

  console.log();



  // În lipsa unui terminal interactiv, nu executăm conversia.

  if (!input.isTTY) {

    console.error(

      "Conversia necesită confirmare într-un Terminal interactiv."

    );

    process.exitCode = 1;

    return;

  }



  const rl = readline.createInterface({

    input,

    output,

  });



  let answer;



  try {

    answer = (

      await rl.question(

        "Continui crearea directoarelor și conversia? [Y/N]: "

      )

    ).trim().toUpperCase();

  } finally {

    rl.close();

  }



  if (answer !== "Y") {

    console.log();

    console.log("Anulat. Nu s-a modificat nimic.");

    return;

  }



  // ==========================================================

  // 7. CREARE DIRECTOARE GOOGLE DRIVE

  //

  // Rulează înainte de conversie și cleanup.

  // RTF-urile sunt încă disponibile.

  // ==========================================================



  console.log();

  console.log("========================================");

  console.log("CREARE DIRECTOARE GOOGLE DRIVE");

  console.log("========================================");



  try {

    runFeastFolders(feastFiles, true);

  } catch (error) {

    console.error(

      `CREAREA GOOGLE DRIVE A EȘUAT: ${error.message}`

    );



    if (error.stderr) {

      console.error(error.stderr.toString());

    }



    console.error(

      "Conversia nu a început. Verifică eventualele directoare create parțial."

    );



    process.exitCode = 1;

    return;

  }



  // ==========================================================

  // 8. PROCESEAZĂ FIECARE RTF

  // ==========================================================



  const { successCount, errorCount } = processRtfPlan(plan);

  // ==========================================================

  // 17. TERMINARE

  // ==========================================================



  console.log();

  console.log("========================================");

  console.log("CONVERSIE TERMINATĂ");

  console.log("========================================");

  console.log(`Conversii reușite: ${successCount}`);

  console.log(`Erori: ${errorCount}`);

  console.log();



  if (errorCount > 0) {

    process.exitCode = 1;

  }

}




await main();
